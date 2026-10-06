// node --test claude/pdf.test.js  (requires coordinator-installed pdf-lib 1.17.1)
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { inflateSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { PDFDocument, PDFArray, PDFName, PDFRawStream, degrees } from 'pdf-lib';
import { inspectPdf, generatePackage, packageFilename, FOOTER_BAND } from './pdf.js';

const here = dirname(fileURLToPath(import.meta.url));
const SAMPLE = join(here, '..', 'problem_statement', 'problem-pack', 'sample-pack');
const pack = JSON.parse(readFileSync(join(SAMPLE, 'requirements.json'), 'utf8'));
const readDoc = (name) => new Uint8Array(readFileSync(join(SAMPLE, 'documents', name)));

const MATCH = {
  R01: 'trade_license_2026.pdf',
  R02: '03_tin_certificate.pdf',
  R03: '04_vat_certificate.pdf',
  R04: 'bank_solvency.pdf',
  R05: 'experience_cert.pdf',
  R08: '02_technical_proposal.pdf',
  R09: '01_financial_proposal.pdf',
  R10: 'scan_0042.pdf',
};
const EXPECTED_PAGES = { R01: 1, R02: 1, R03: 1, R04: 1, R05: 2, R08: 6, R09: 2, R10: 1 };
const EXPIRY = { R01: '2027-06-30', R04: '2026-12-31' };
const GENERATED_AT = new Date(2026, 9, 6, 18, 0);

async function fileRecord(id, name, bytes = readDoc(name)) {
  const { pages } = await inspectPdf(bytes);
  return { id, name, size: bytes.length, pages, hash: createHash('sha256').update(bytes).digest('hex'), bytes };
}

async function sampleIncluded() {
  const reqs = pack.requirements.slice().sort((a, b) => a.order - b.order);
  const rows = [];
  for (const requirement of reqs) {
    const name = MATCH[requirement.id];
    if (!name) continue;
    rows.push({ requirement, file: await fileRecord(`f-${requirement.id}`, name), status: 'ok' });
  }
  return rows;
}

function pageText(doc, page) {
  const contents = page.node.Contents();
  const refs = contents instanceof PDFArray ? contents.asArray() : [contents];
  let text = '';
  for (const ref of refs) {
    const stream = doc.context.lookup(ref);
    const filter = stream.dict.get(PDFName.of('Filter'));
    const raw = stream.getContents();
    text += filter && String(filter).includes('FlateDecode') ? inflateSync(Buffer.from(raw)).toString('latin1') : Buffer.from(raw).toString('latin1');
  }
  return text;
}
const hex = (s) => Buffer.from(s, 'latin1').toString('hex').toUpperCase();
const hasText = (content, s) => content.toUpperCase().includes(`<${hex(s)}>`) || content.includes(`(${s})`);

test('inspectPdf reads sample page counts', async () => {
  for (const [id, name] of Object.entries(MATCH)) {
    assert.equal((await inspectPdf(readDoc(name))).pages, EXPECTED_PAGES[id], name);
  }
  assert.equal((await inspectPdf(readDoc('experience_cert (1).pdf'))).pages, 2);
  assert.equal((await inspectPdf(readDoc('trade_license_2025.pdf'))).pages, 1);
});

test('inspectPdf rejects non-PDF, empty and damaged data with codes', async () => {
  await assert.rejects(inspectPdf(readDoc('company_logo.png')), { code: 'invalid-pdf' });
  await assert.rejects(inspectPdf(new Uint8Array(0)), { code: 'invalid-pdf' });
  await assert.rejects(inspectPdf('not bytes'), { code: 'invalid-pdf' });
  const truncated = readDoc('02_technical_proposal.pdf').slice(0, 400);
  await assert.rejects(inspectPdf(truncated), { code: 'invalid-pdf' });
});

test('duplicate experience files are byte-identical', () => {
  const a = createHash('sha256').update(readDoc('experience_cert.pdf')).digest('hex');
  const b = createHash('sha256').update(readDoc('experience_cert (1).pdf')).digest('hex');
  assert.equal(a, b);
});

test('sample package: 16 pages, exact filename, order, footer band, footers', async () => {
  const included = await sampleIncluded();
  const before = included.map((r) => r.file.bytes.slice());
  const result = await generatePackage({ pack, included, expiryDates: EXPIRY, generatedAt: GENERATED_AT });
  assert.equal(result.filename, 'T-2026-0417_Package.pdf');
  assert.equal(result.pageCount, 16);
  assert.ok(result.bytes instanceof Uint8Array);
  included.forEach((r, i) => assert.deepEqual(r.file.bytes, before[i], 'source bytes mutated'));

  const out = await PDFDocument.load(result.bytes);
  assert.equal(out.getPageCount(), 16);
  const pages = out.getPages();

  // Expected visible sizes in exact requirement/page order.
  const expected = [];
  for (const row of included) {
    const src = await PDFDocument.load(row.file.bytes);
    for (const p of src.getPages()) {
      const box = p.getCropBox();
      const sideways = [90, 270].includes(((p.getRotation().angle % 360) + 360) % 360);
      expected.push(sideways ? [box.height, box.width] : [box.width, box.height]);
    }
  }
  assert.equal(expected.length, 15);
  expected.forEach(([w, h], i) => {
    const size = pages[i + 1].getSize();
    assert.ok(Math.abs(size.width - w) < 0.01, `page ${i + 2} width`);
    assert.ok(Math.abs(size.height - (h + FOOTER_BAND)) < 0.01, `page ${i + 2} height has footer band`);
    assert.match(pageText(out, pages[i + 1]), new RegExp(`1 0 0 1 0 ${FOOTER_BAND} cm`), `page ${i + 2} content shifted above footer`);
  });

  pages.forEach((page, i) => {
    assert.ok(hasText(pageText(out, page), `T-2026-0417 | Page ${i + 1} of 16`), `footer on page ${i + 1}`);
  });

  const cover = pageText(out, pages[0]);
  for (const s of ['TENDER SUBMISSION PACKAGE', 'T-2026-0417', 'Supply of IT Equipment', 'Directorate of Sample Services', 'Meghna Tech Solutions Ltd.', '2026-10-20', 'Trade License', 'Signed Declaration']) {
    assert.ok(hasText(cover, s), `cover contains ${s}`);
  }
  assert.ok(!hasText(cover, 'Audited Financial Statement'), 'optional unprovided omitted');
  assert.ok(!hasText(cover, "Manufacturer's Authorization"), 'optional unprovided omitted');
});

test('index bonus: 17 pages and footers agree', async () => {
  const included = await sampleIncluded();
  const result = await generatePackage({ pack, included, expiryDates: EXPIRY, includeIndex: true, generatedAt: GENERATED_AT });
  assert.equal(result.pageCount, 17);
  const out = await PDFDocument.load(result.bytes);
  assert.equal(out.getPageCount(), 17);
  out.getPages().forEach((page, i) => assert.ok(hasText(pageText(out, page), `T-2026-0417 | Page ${i + 1} of 17`)));
  const index = pageText(out, out.getPages()[1]);
  assert.ok(hasText(index, 'DOCUMENT INDEX'));
  assert.ok(hasText(index, '3'), 'trade license starts on page 3');
  assert.ok(hasText(index, '17'), 'declaration on page 17');
});

test('rejects duplicate content, expired and missing expiry', async () => {
  const included = await sampleIncluded();
  const dup = included.map((r) => (r.requirement.id === 'R09' ? { ...r, file: { ...included.find((x) => x.requirement.id === 'R05').file, id: 'other' } } : r));
  await assert.rejects(generatePackage({ pack, included: dup, expiryDates: EXPIRY }), { code: 'duplicate-content' });

  const copy = await fileRecord('copy', 'experience_cert (1).pdf');
  const dupBytes = included.map((r) => (r.requirement.id === 'R09' ? { ...r, file: { ...copy, hash: 'x' } } : r));
  await assert.rejects(generatePackage({ pack, included: dupBytes, expiryDates: EXPIRY }), { code: 'duplicate-content' });

  await assert.rejects(generatePackage({ pack, included, expiryDates: { ...EXPIRY, R01: '2025-06-30' } }), { code: 'expired' });
  await assert.rejects(generatePackage({ pack, included, expiryDates: { R04: '2026-12-31' } }), { code: 'expiry-needed' });
  // Equal to deadline passes.
  const ok = await generatePackage({ pack, included, expiryDates: { R01: '2026-10-20', R04: '2026-10-20' } });
  assert.equal(ok.pageCount, 16);
});

test('long and non-Latin text does not crash the cover', async () => {
  const odd = {
    tender: { ...pack.tender, title: `${'ট্রেড লাইসেন্স — “quoted” café '.repeat(20)}Supercalifragilistic${'x'.repeat(200)}` },
    requirements: pack.requirements.map((r) => ({ ...r, title_en: `${r.title_bn} ${'Very long document title '.repeat(12)}` })),
  };
  const byId = new Map(odd.requirements.map((r) => [r.id, r]));
  const included = (await sampleIncluded()).map((r) => ({ ...r, requirement: byId.get(r.requirement.id) }));
  const result = await generatePackage({ pack: odd, included, expiryDates: EXPIRY, includeIndex: true });
  assert.equal(result.pageCount, 17);
});

test('rotated source page keeps orientation and footer band', async () => {
  const src = await PDFDocument.load(readDoc('03_tin_certificate.pdf'));
  src.getPage(0).setRotation(degrees(90));
  const bytes = await src.save();
  const { width, height } = src.getPage(0).getCropBox();
  const rotated = await fileRecord('rot', 'rotated.pdf', bytes);
  const included = (await sampleIncluded()).map((r) => (r.requirement.id === 'R02' ? { ...r, file: rotated } : r));
  const result = await generatePackage({ pack, included, expiryDates: EXPIRY });
  const out = await PDFDocument.load(result.bytes);
  const size = out.getPage(2).getSize();
  assert.ok(Math.abs(size.width - height) < 0.01);
  assert.ok(Math.abs(size.height - (width + FOOTER_BAND)) < 0.01);
  assert.equal(out.getPage(2).getRotation().angle, 0);
});

test('generation rejects any omitted mandatory requirement', async () => {
  const included = await sampleIncluded();
  for (const req of pack.requirements.filter((r) => r.mandatory)) {
    const without = included.filter((r) => r.requirement.id !== req.id);
    await assert.rejects(generatePackage({ pack, included: without, expiryDates: EXPIRY }), { code: 'missing-mandatory' }, req.id);
  }
});

test('generation rejects unknown, repeated and altered included-row requirements', async () => {
  const included = await sampleIncluded();
  const swap = (id, change) => included.map((r) => (r.requirement.id === id ? { ...r, requirement: { ...r.requirement, ...change } } : r));

  const unknown = [...included, { requirement: { ...pack.requirements[5], id: 'R99' }, file: await fileRecord('x', 'trade_license_2025.pdf') }];
  await assert.rejects(generatePackage({ pack, included: unknown, expiryDates: EXPIRY }), { code: 'unknown-requirement' });

  const repeated = [...included, { requirement: pack.requirements.find((r) => r.id === 'R02'), file: await fileRecord('y', 'trade_license_2025.pdf') }];
  await assert.rejects(generatePackage({ pack, included: repeated, expiryDates: EXPIRY }), { code: 'duplicate-requirement' });

  // Altered metadata cannot bypass expiry, mandatory or ordering rules.
  await assert.rejects(generatePackage({ pack, included: swap('R01', { has_expiry: false }), expiryDates: { R04: '2026-12-31' } }), { code: 'requirement-mismatch' });
  await assert.rejects(generatePackage({ pack, included: swap('R10', { mandatory: false }), expiryDates: EXPIRY }), { code: 'requirement-mismatch' });
  await assert.rejects(generatePackage({ pack, included: swap('R09', { order: 0.5 }), expiryDates: EXPIRY }), { code: 'requirement-mismatch' });
  await assert.rejects(generatePackage({ pack, included: swap('R08', { title_en: 'Something else' }), expiryDates: EXPIRY }), { code: 'requirement-mismatch' });
  await assert.rejects(generatePackage({ pack: { ...pack, requirements: [] }, included, expiryDates: EXPIRY }), { code: 'invalid-input' });
});

test('domain summary feeds generation; all-optional pack matches domain', async () => {
  const domain = await import('../puku1/domain.js');
  const included = await sampleIncluded();
  const files = included.map((r) => r.file);
  const matches = Object.fromEntries(included.map((r) => [r.requirement.id, r.file.id]));
  const summary = domain.evaluatePackage(pack, files, matches, EXPIRY);
  assert.equal(summary.canGenerate, true);
  const result = await generatePackage({ pack, included: summary.included, expiryDates: EXPIRY, generatedAt: GENERATED_AT });
  assert.equal(result.pageCount, summary.pageCount);
  assert.equal(result.pageCount, 16);

  // In-memory metadata variation: every organizer requirement optional.
  const optional = { ...pack, requirements: pack.requirements.map((r) => ({ ...r, mandatory: false })) };
  const exp = await fileRecord('exp', 'experience_cert.pdf');
  const none = domain.evaluatePackage(optional, [exp], {}, {});
  assert.equal(none.canGenerate, false);
  await assert.rejects(generatePackage({ pack: optional, included: none.included }), { code: 'no-documents' });
  const one = domain.evaluatePackage(optional, [exp], { R05: 'exp' }, {});
  assert.equal(one.canGenerate, true);
  const single = await generatePackage({ pack: optional, included: one.included });
  assert.equal(single.pageCount, one.pageCount);
  assert.equal(single.pageCount, 3);
});

test('index page starts account for the index page', async () => {
  const result = await generatePackage({ pack, included: await sampleIncluded(), expiryDates: EXPIRY, includeIndex: true, generatedAt: GENERATED_AT });
  const out = await PDFDocument.load(result.bytes);
  const index = pageText(out, out.getPage(1));
  for (const range of ['3', '4', '5', '6', '7-8', '9-14', '15-16', '17']) assert.ok(hasText(index, range), `index has ${range}`);
  // Last page of the 17-page package must be the declaration (same size as scan_0042).
  const scan = (await PDFDocument.load(readDoc('scan_0042.pdf'))).getPage(0).getSize();
  const last = out.getPage(16).getSize();
  assert.ok(Math.abs(last.width - scan.width) < 0.01 && Math.abs(last.height - scan.height - FOOTER_BAND) < 0.01);
});

function reachableImages(doc, page) {
  const images = [];
  const seen = new Set();
  const visit = (resources) => {
    const xobjects = resources && resources.lookup(PDFName.of('XObject'));
    if (!xobjects || !xobjects.entries) return;
    for (const [, value] of xobjects.entries()) {
      const object = doc.context.lookup(value);
      if (!(object instanceof PDFRawStream) || seen.has(object)) continue;
      seen.add(object);
      const subtype = String(object.dict.get(PDFName.of('Subtype')));
      if (subtype === '/Image') images.push(createHash('sha256').update(object.getContents()).digest('hex'));
      if (subtype === '/Form') visit(object.dict.lookup(PDFName.of('Resources')));
    }
  };
  visit(page.node.Resources());
  return images;
}

test('scanned declaration image bytes are preserved on page 16', async () => {
  const result = await generatePackage({ pack, included: await sampleIncluded(), expiryDates: EXPIRY, generatedAt: GENERATED_AT });
  const out = await PDFDocument.load(result.bytes);
  const scan = await PDFDocument.load(readDoc('scan_0042.pdf'));
  const sourceImages = reachableImages(scan, scan.getPage(0));
  assert.ok(sourceImages.length > 0, 'scan_0042 contains an image');
  const outputImages = reachableImages(out, out.getPage(15));
  for (const hash of sourceImages) assert.ok(outputImages.includes(hash), 'scan image bytes on page 16');
  assert.ok(hasText(pageText(out, out.getPage(15)), 'T-2026-0417 | Page 16 of 16'));
});

test('filename sanitizes path characters only', () => {
  assert.equal(packageFilename('T-2026-0417'), 'T-2026-0417_Package.pdf');
  assert.equal(packageFilename('A/B\\C:D'), 'A_B_C_D_Package.pdf');
});
