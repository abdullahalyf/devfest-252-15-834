#!/usr/bin/env node
// V01: independent organizer-fixture acceptance checks. No output files are written.
import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const fixture = new URL('problem_statement/problem-pack/sample-pack/', root);
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
let passed = 0;
async function check(label, fn) {
  try { await fn(); passed++; console.log(`PASS ${label}`); }
  catch (error) { throw new Error(`FAIL ${label}: ${error.message}`, { cause: error }); }
}
function rejectWithCode(fn) {
  assert.throws(fn, error => error instanceof Error && typeof error.code === 'string' && error.code.length > 0);
}

// Expected values come from requirements.json and organizer PDFs, never module output.
const expected = [
  ['R01', 'trade_license_2026.pdf', 1],
  ['R02', '03_tin_certificate.pdf', 1],
  ['R03', '04_vat_certificate.pdf', 1],
  ['R04', 'bank_solvency.pdf', 1],
  ['R05', 'experience_cert.pdf', 2],
  ['R08', '02_technical_proposal.pdf', 6],
  ['R09', '01_financial_proposal.pdf', 2],
  ['R10', 'scan_0042.pdf', 1],
];
const expectedPages = Object.fromEntries(expected.map(([, name, pages]) => [name, pages]));
expectedPages['trade_license_2025.pdf'] = 1;
expectedPages['experience_cert (1).pdf'] = 2;

async function main() {
  const pending = [];
  for (const path of ['puku1/domain.js', 'claude/pdf.js', 'problem_statement/problem-pack/sample-pack/requirements.json']) {
    try { await access(new URL(path, root)); }
    catch (error) { if (error.code === 'ENOENT') pending.push(`missing ${path}`); else throw error; }
  }
  let lib;
  try { lib = await import('pdf-lib'); }
  catch (error) { if (error.code === 'ERR_MODULE_NOT_FOUND') pending.push(`pdf-lib unavailable: ${error.message}`); else throw error; }
  if (pending.length) {
    console.error(`ENVIRONMENT PENDING (${pending.length}):\n${pending.map(item => `- ${item}`).join('\n')}\nNo integration assertions passed. Rerun after coordinator supplies prerequisites.`);
    process.exitCode = 2;
    return;
  }
  let domain, pdf;
  try {
    domain = await import(new URL('puku1/domain.js', root));
    pdf = await import(new URL('claude/pdf.js', root));
  } catch (error) {
    if (error.code !== 'ERR_MODULE_NOT_FOUND') throw error;
    console.error(`ENVIRONMENT PENDING: implementation dependency missing: ${error.message}\nNo integration assertions passed.`);
    process.exitCode = 2;
    return;
  }
  const { PDFDocument, PDFName, PDFArray, PDFRawStream, decodePDFRawStream } = lib;
  const raw = JSON.parse(await readFile(new URL('requirements.json', fixture), 'utf8'));
  let pack;
  await check('organizer requirements: exact tender, deadline and ten ordered rows', () => {
    assert.equal(raw.tender.tender_id, 'T-2026-0417');
    assert.equal(raw.tender.submission_deadline, '2026-10-20');
    assert.equal(raw.requirements.length, 10);
    pack = domain.validateRequirements(raw);
    assert.deepEqual(pack.requirements.map(r => r.id), ['R01','R02','R03','R04','R05','R06','R07','R08','R09','R10']);
  });
  const files = [], sourceDocs = new Map();
  const names = (await readdir(new URL('documents/', fixture))).filter(name => /\.pdf$/i.test(name)).sort().reverse();
  await check('all ten actual PDFs: SHA-256 FileRecords and independent page counts', async () => {
    assert.equal(names.length, 10);
    for (const [i, name] of names.entries()) {
      assert.ok(Object.hasOwn(expectedPages, name), `unexpected organizer PDF ${name}`);
      const bytes = new Uint8Array(await readFile(new URL(`documents/${encodeURIComponent(name)}`, fixture)));
      const inspected = await pdf.inspectPdf(bytes);
      const parsed = await PDFDocument.load(bytes);
      assert.equal(inspected.pages, expectedPages[name], `${name}: inspectPdf count`);
      assert.equal(parsed.getPageCount(), expectedPages[name], `${name}: independently parsed count`);
      files.push({ id: `sample-${i}`, name, size: bytes.byteLength, pages: inspected.pages, hash: sha256(bytes), bytes });
      sourceDocs.set(name, parsed);
    }
  });
  const file = name => { const result = files.find(f => f.name === name); assert.ok(result, `missing ${name}`); return result; };
  const req = id => pack.requirements.find(r => r.id === id);
  const deadline = pack.tender.submission_deadline;
  await check('provided PNG rejected by PDF inspector with invalid-pdf code', async () => {
    const bytes = new Uint8Array(await readFile(new URL('documents/company_logo.png', fixture)));
    await assert.rejects(() => pdf.inspectPdf(bytes), error => error.code === 'invalid-pdf');
  });
  await check('renamed experience duplicate: equal actual SHA-256 and one duplicate group', () => {
    assert.equal(file('experience_cert.pdf').hash, file('experience_cert (1).pdf').hash);
    const groups = domain.duplicateGroups(files);
    assert.equal(groups.length, 1);
    assert.deepEqual(groups[0].map(f => f.name).sort(), ['experience_cert (1).pdf','experience_cert.pdf']);
  });
  await check('all five statuses and inclusive expiry boundary', () => {
    assert.equal(domain.statusFor(req('R01'), null, '', deadline), 'missing');
    assert.equal(domain.statusFor(req('R07'), null, '', deadline), 'not-provided');
    assert.equal(domain.statusFor(req('R01'), file('trade_license_2026.pdf'), '', deadline), 'expiry-needed');
    assert.equal(domain.statusFor(req('R01'), file('trade_license_2026.pdf'), '2026-02-30', deadline), 'expiry-needed');
    assert.equal(domain.statusFor(req('R01'), file('trade_license_2025.pdf'), '2025-06-30', deadline), 'expired');
    assert.equal(domain.statusFor(req('R01'), file('trade_license_2026.pdf'), '2026-10-19', deadline), 'expired');
    assert.equal(domain.statusFor(req('R01'), file('trade_license_2026.pdf'), deadline, deadline), 'ok');
    assert.equal(domain.statusFor(req('R01'), file('trade_license_2026.pdf'), '2027-06-30', deadline), 'ok');
    assert.equal(domain.statusFor(req('R02'), file('03_tin_certificate.pdf'), '', deadline), 'ok');
  });
  let state = { pack, files, matches: {}, expiryDates: {} };
  await check('assignMatch prevents reused ids and duplicate contents without mutation', () => {
    state = { ...state, ...domain.assignMatch(state, 'R05', file('experience_cert.pdf').id) };
    const before = JSON.stringify(state);
    rejectWithCode(() => domain.assignMatch(state, 'R06', file('experience_cert.pdf').id));
    rejectWithCode(() => domain.assignMatch(state, 'R06', file('experience_cert (1).pdf').id));
    rejectWithCode(() => domain.assignMatch(state, 'unknown', file('experience_cert.pdf').id));
    rejectWithCode(() => domain.assignMatch(state, 'R01', 'unknown-file'));
    assert.equal(JSON.stringify(state), before);
  });
  await check('replacement/unmatch clear expiry; same match retains expiry; input untouched', () => {
    const old = { ...state, matches: { ...state.matches, R01: file('trade_license_2025.pdf').id }, expiryDates: { R01: '2025-06-30' } };
    const before = JSON.stringify(old);
    assert.equal(domain.assignMatch(old, 'R01', old.matches.R01).expiryDates.R01, '2025-06-30');
    for (const nextId of [file('trade_license_2026.pdf').id, null]) {
      const next = domain.assignMatch(old, 'R01', nextId);
      assert.ok(!next.expiryDates.R01, 'stale expiry remains after changed match');
      if (nextId === null) assert.ok(!next.matches.R01, 'unmatched file remains selected');
      else assert.equal(next.matches.R01, nextId);
    }
    assert.equal(JSON.stringify(old), before);
  });
  for (const [id, name] of expected) state = { ...state, ...domain.assignMatch(state, id, file(name).id) };
  state.expiryDates = { R01: '2027-06-30', R04: '2026-12-31' };
  const evaluate = (matches = state.matches, expiryDates = state.expiryDates) => domain.evaluatePackage(pack, files, matches, expiryDates);
  let summary;
  await check('mandatory sample ready: ordered inclusion, optional omissions and exactly 16 pages', () => {
    summary = evaluate();
    assert.equal(summary.canGenerate, true);
    assert.equal(summary.blockers.length, 0);
    assert.equal(summary.pageCount, 16);
    assert.deepEqual(summary.included.map(row => [row.requirement.id, row.file.name, row.file.pages]), expected);
    assert.deepEqual(summary.rows.map(row => row.status), ['ok','ok','ok','ok','ok','not-provided','not-provided','ok','ok','ok']);
  });
  await check('evaluation blocks missing/expired/undated and inconsistent duplicate matches', () => {
    const missing = { ...state.matches }; delete missing.R10;
    assert.equal(evaluate(missing).canGenerate, false);
    assert.equal(evaluate(state.matches, { ...state.expiryDates, R01: '' }).canGenerate, false);
    const expired = evaluate({ ...state.matches, R01: file('trade_license_2025.pdf').id }, { ...state.expiryDates, R01: '2025-06-30' });
    assert.equal(expired.canGenerate, false);
    assert.ok(expired.blockers.some(row => row.requirement.id === 'R01' && row.status === 'expired'));
    assert.equal(evaluate({ ...state.matches, R06: file('experience_cert (1).pdf').id }).canGenerate, false);
    assert.equal(evaluate({ ...state.matches, R10: 'unknown-file' }).canGenerate, false);
    assert.equal(domain.evaluatePackage(null, [], {}, {}).canGenerate, false);
  });
  let output, decoded;
  await check('real package bytes decode to 16 pages and exact safe sample filename', async () => {
    output = await pdf.generatePackage({ pack, included: summary.included, expiryDates: state.expiryDates, includeIndex: false, generatedAt: new Date('2026-10-06T12:00:00Z') });
    assert.ok(output.bytes instanceof Uint8Array);
    assert.equal(output.filename, 'T-2026-0417_Package.pdf');
    assert.ok(!/[\\/<>:"|?*\x00-\x1f]/.test(output.filename));
    assert.equal(output.pageCount, 16);
    decoded = await PDFDocument.load(output.bytes);
    assert.equal(decoded.getPageCount(), 16);
  });

  // Traverse each page's content and nested Form/Image XObjects, including scanned pages.
  // Original decoded operators must occur on the expected output page. Image bytes
  // must also match: a scan's empty text alone is insufficient evidence of preservation.
  function contentStreams(doc, page) {
    const object = page.node.Contents();
    const items = object instanceof PDFArray ? object.asArray() : object ? [object] : [];
    return items.map(item => doc.context.lookup(item)).filter(item => item instanceof PDFRawStream);
  }
  const decode = stream => Buffer.from(decodePDFRawStream(stream).decode());
  const normalize = bytes => bytes.toString('latin1').replace(/\s+/g, ' ').trim();
  function reachable(doc, page) {
    const streams = [...contentStreams(doc, page)], images = [], seen = new Set();
    function visit(resources) {
      if (!resources) return;
      const xobjects = resources.lookup(PDFName.of('XObject'));
      if (!xobjects?.entries) return;
      for (const [, value] of xobjects.entries()) {
        const object = doc.context.lookup(value);
        if (!(object instanceof PDFRawStream) || seen.has(object)) continue;
        seen.add(object);
        const subtype = object.dict.get(PDFName.of('Subtype'))?.toString();
        if (subtype === '/Image') images.push(sha256(object.getContents()));
        if (subtype === '/Form') { streams.push(object); visit(object.dict.lookup(PDFName.of('Resources'))); }
      }
    }
    visit(page.node.Resources());
    return { streams: streams.map(decode).map(normalize), images };
  }
  await check('decoded output pages 2-16 preserve every source page in exact document/page order', () => {
    let outputIndex = 1;
    for (const [, name, count] of expected) {
      const source = sourceDocs.get(name);
      assert.equal(source.getPageCount(), count, `${name}: source page count`);
      for (let index = 0; index < count; index++, outputIndex++) {
        const sourcePage = source.getPage(index), outputPage = decoded.getPage(outputIndex);
        const original = contentStreams(source, sourcePage).map(decode).map(normalize).filter(Boolean);
        assert.ok(original.length, `${name} source page ${index + 1}: no content operators to verify`);
        const actual = reachable(decoded, outputPage);
        for (const operators of original) assert.ok(actual.streams.some(stream => stream.includes(operators)), `output page ${outputIndex + 1} lacks original content of ${name} page ${index + 1}`);
        for (const hash of reachable(source, sourcePage).images) assert.ok(actual.images.includes(hash), `output page ${outputIndex + 1}: missing original image bytes from ${name}`);
        const sourceSize = sourcePage.getSize(), outputSize = outputPage.getSize();
        assert.ok(Math.abs(sourceSize.width - outputSize.width) < 0.01, `output page ${outputIndex + 1}: changed source width`);
        assert.ok(outputSize.height > sourceSize.height, `output page ${outputIndex + 1}: no separate footer margin`);
      }
    }
    assert.equal(outputIndex, 16);
  });
  await check('generation itself rejects duplicate source contents', async () => {
    const duplicateRow = { requirement: req('R06'), file: file('experience_cert (1).pdf'), status: 'ok' };
    const included = [...summary.included, duplicateRow].sort((a, b) => a.requirement.order - b.requirement.order);
    await assert.rejects(() => pdf.generatePackage({ pack, included, expiryDates: state.expiryDates, includeIndex: false }));
  });
  console.log(`VERIFIED: ${passed} assertion groups; mandatory no-index package has 16 decoded pages. Output held in memory; no fixtures or application files changed.`);
  console.log('PENDING MANUAL: visual cover/footers/readability, browser lifecycle/accessibility/language/security, production build and signed-out public deployment. See acceptance.md.');
}
main().catch(error => {
  console.error(error.stack);
  console.error(`FAILED after ${passed} passed assertion groups. No acceptance claim for failed or unrun groups.`);
  process.exitCode = 1;
});
