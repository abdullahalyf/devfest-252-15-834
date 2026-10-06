#!/usr/bin/env node
// No dependencies installed or server started. Run with Node against an existing server.
// node "codex cli/browser-regressions.mjs" [--url=http://127.0.0.1:5173/]
// Optional: PLAYWRIGHT_RUNTIME=<node_modules or playwright directory>, CHROME_PATH,
// SAMPLE_PACK=<organizer sample-pack directory>, HEADLESS=0, --only=<name substring>.
// Exit 0: all assertions pass; 1: failed assertions; 2: missing runtime/fixtures/server.
import { createRequire } from 'node:module';
import { readFile, access } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const base = new URL(args.find(x => x.startsWith('--url='))?.slice(6) || 'http://127.0.0.1:5173/');
const only = args.find(x => x.startsWith('--only='))?.slice(7) || '';
const sample = process.env.SAMPLE_PACK || join(root, 'problem_statement/problem-pack/sample-pack');
const defaultRuntime = 'C:/Users/Abdullah Alif/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const require = createRequire(import.meta.url);
const evidence = { target: base.href, startedAt: new Date().toISOString(), revision: null, fixtures: [], checks: [] };
const mappings = [
  ['R01', 'trade_license_2026.pdf'], ['R02', '03_tin_certificate.pdf'],
  ['R03', '04_vat_certificate.pdf'], ['R04', 'bank_solvency.pdf'],
  ['R05', 'experience_cert.pdf'], ['R08', '02_technical_proposal.pdf'],
  ['R09', '01_financial_proposal.pdf'], ['R10', 'scan_0042.pdf'],
];
let chromium, browser, pack, docs;
try {
  const candidates = process.env.PLAYWRIGHT_RUNTIME ? [process.env.PLAYWRIGHT_RUNTIME] : [defaultRuntime];
  let loaded;
  for (const p of candidates) {
    for (const candidate of [join(p, 'playwright'), p]) {
      try { loaded = require(candidate); if (loaded.chromium) break; } catch {}
    }
    if (loaded?.chromium) break;
  }
  if (!loaded?.chromium) throw new Error('Bundled Playwright missing; set PLAYWRIGHT_RUNTIME. No install attempted.');
  chromium = loaded.chromium;
  const json = await readFile(join(sample, 'requirements.json'));
  pack = JSON.parse(json);
  evidence.fixtures.push({ name: 'requirements.json', bytes: json.length, sha256: hash(json) });
  docs = await Promise.all(mappings.map(async ([id, name]) => {
    const buffer = await readFile(join(sample, 'documents', name));
    evidence.fixtures.push({ name, bytes: buffer.length, sha256: hash(buffer) });
    return { id, name, mimeType: 'application/pdf', buffer };
  }));
  let executablePath = process.env.CHROME_PATH;
  if (!executablePath && process.platform === 'win32') {
    for (const candidate of ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe']) {
      try { await access(candidate); executablePath = candidate; break; } catch {}
    }
  }
  browser = await chromium.launch({ executablePath, headless: process.env.HEADLESS !== '0', ignoreDefaultArgs: ['--disable-back-forward-cache'] });
} catch (error) {
  console.error('MISSING PREREQUISITE:', error.message);
  process.exitCode = 2;
}
if (!browser) process.exit(2);

const sourcePaths = ['codex app/app.js', 'puku1/domain.js', 'puku2/ui.js', 'puku2/styles.css', 'claude/pdf.js'];
async function sourceHashes() {
  return Object.fromEntries(await Promise.all(sourcePaths.map(async path => [path, hash(await readFile(join(root, path)))])));
}
async function revision(page) {
  const manifest = await page.evaluate(async () => {
    try { const r = await fetch('/release.json', { cache: 'no-store' }); return r.ok ? await r.json() : null; } catch { return null; }
  });
  const modules = await page.evaluate(() => performance.getEntriesByType('resource').map(x => x.name).filter(x => /app\.js|ui\.js|domain\.js|\/assets\//.test(x)));
  return { manifest, modules, localSourceHashes: await sourceHashes(), label: base.hostname === '127.0.0.1' || base.hostname === 'localhost' ? 'local working tree; no commit attribution' : 'public manifest revision only; local source hashes are not deployed evidence' };
}
async function idle(page) { await page.waitForFunction(() => document.querySelector('#app')?.getAttribute('data-busy') === 'false'); }
async function load(page, variant = pack, files = docs) {
  await page.locator('#tp-json-input').setInputFiles({ name: 'requirements.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(variant)) });
  await idle(page);
  await page.waitForFunction(() => document.querySelectorAll('.tp-req-row').length === 10);
  if (files.length) { await page.locator('#tp-pdf-input').setInputFiles(files.map(({ name, mimeType, buffer }) => ({ name, mimeType, buffer }))); await idle(page); }
  assert.equal(await page.locator('#tp-file-list > li').count(), files.length, 'accepted organizer documents');
}
async function match(page, id, name) {
  const select = page.locator(`[id=${JSON.stringify('tp-match-' + id)}]`);
  const value = await select.locator('option').evaluateAll((options, name) => options.find(x => x.textContent.startsWith(name + ' '))?.value, name);
  assert.ok(value, `uploaded option ${JSON.stringify(name)} exists`);
  await select.selectOption(value);
}
const dateInput = (page, id = 'R01') => page.locator(`[id=${JSON.stringify('tp-expiry-' + id)}]`);
async function ready(page) {
  await load(page);
  for (const [id, name] of mappings) await match(page, id, name);
  await dateInput(page).fill('2027-06-30');
  await dateInput(page, 'R04').fill('2026-12-31');
  assert.equal(await page.locator('#tp-generate').isEnabled(), true);
}
async function label(page, id) {
  return page.locator(`[data-req-id=${JSON.stringify(id)}] .tp-status`).evaluate(el => [...el.childNodes].filter(n => n.nodeType === Node.TEXT_NODE).map(n => n.textContent).join('').trim());
}
async function csv(page) {
  const lang = await page.locator('html').getAttribute('lang');
  const button = page.getByRole('button', { name: lang === 'bn' ? 'চেকলিস্ট রপ্তানি (CSV)' : 'Export checklist (CSV)', exact: true });
  // Attach both rejection handlers immediately: a click timeout must not leave
  // an unhandled download timeout that aborts the remaining regression groups.
  const [download] = await Promise.all([
    page.waitForEvent('download'), button.click(),
  ]);
  const stream = await download.createReadStream();
  assert.ok(stream, 'CSV download readable');
  const chunks = []; for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8').replace(/^\uFEFF/, '');
}
// Independent CSV state machine: handles embedded CR/LF, escaped quotes and commas.
function parseCsv(text) {
  const rows = []; let row = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') { if (quoted && text[i + 1] === '"') { cell += '"'; i++; } else quoted = !quoted; }
    else if (!quoted && c === ',') { row.push(cell); cell = ''; }
    else if (!quoted && (c === '\r' || c === '\n')) { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += c;
  }
  assert.equal(quoted, false, 'CSV has balanced quotes');
  assert.equal(cell.length + row.length, 0, 'CSV ends with row terminator');
  assert.ok(rows.every(r => r.length === 6), 'all CSV rows have exactly six decoded columns');
  return rows;
}
async function generate(page) {
  await page.locator('#tp-generate').click();
  await page.locator('#tp-download').waitFor();
  const url = await page.locator('#tp-download').getAttribute('href');
  const bytes = await page.evaluate(async url => (await (await fetch(url)).arrayBuffer()).byteLength, url);
  assert.ok(bytes > 1000, 'new PDF URL contains actual bytes');
  return url;
}
async function revoked(page, url) {
  assert.equal(await page.locator('#tp-download').count(), 0, 'stale download link removed');
  const usable = await page.evaluate(async url => { try { return (await fetch(url)).ok; } catch { return false; } }, url);
  assert.equal(usable, false, 'old Blob URL is unusable, even if remembered');
}
async function check(name, run) {
  if (only && !name.includes(only)) { evidence.checks.push({ name, result: 'UNRUN', reason: '--only filter' }); return; }
  const context = await browser.newContext({ locale: 'en-US', acceptDownloads: true });
  const page = await context.newPage(); page.setDefaultTimeout(8000);
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await context.addInitScript(() => { window.__v05Pageshows = []; addEventListener('pageshow', e => window.__v05Pageshows.push(e.persisted)); });
  const entry = { name, result: 'UNRUN', evidence: [] };
  evidence.checks.push(entry);
  try {
    await page.goto(base.href); await page.locator('#tp-json-input').waitFor();
    entry.revision = await revision(page);
    evidence.revision ||= entry.revision;
    await run(page, entry.evidence);
    assert.deepEqual(errors, [], 'no uncaught application errors');
    entry.result = 'PASS'; console.log('PASS', name, JSON.stringify(entry.evidence));
  } catch (error) {
    entry.result = error.code === 'ERR_ASSERTION' ? 'FAIL' : 'UNRUN';
    entry.error = error.message;
    entry.reason = entry.result === 'UNRUN' ? 'Execution blocked before assertions completed' : 'Assertion failed';
    console.error(entry.result, name, error.message, JSON.stringify(entry.evidence));
  } finally { await context.close(); }
}

try {
  await check('prototype IDs after expiry edit: no inherited CSV values', async (page, facts) => {
    const variant = structuredClone(pack);
    ['__proto__', 'constructor', 'toString'].forEach((id, i) => { variant.requirements[i].id = id; });
    await load(page, variant, docs.slice(0, 3));
    for (let i = 0; i < 3; i++) await match(page, variant.requirements[i].id, docs[i].name);
    await dateInput(page, '__proto__').fill('2027-06-30');
    const text = await csv(page), rows = parseCsv(text);
    facts.push({ expiryCells: rows.slice(1, 4).map(r => r[4]) });
    assert.doesNotMatch(text, /function\s+(?:Object|toString)|\[native code\]|\[object Object\]/);
    assert.deepEqual(rows.slice(1, 4).map(r => r[4]), ['2027-06-30', '', '']);
    for (const id of ['__proto__', 'constructor', 'toString']) assert.equal(await label(page, id), 'OK');
  });
  await check('CSV whitespace formulas and lossless quoting in both languages', async (page, facts) => {
    const variant = structuredClone(pack);
    const prefixes = ['\n=', '  =', '\n+', ' \t+', '\n-', '\u00a0-', '\n@', '\uFEFF @'];
    const files = docs.map((doc, i) => ({ ...doc, name: prefixes[i] + '1,"quoted"\nline.pdf' }));
    mappings.forEach(([id], i) => {
      const r = variant.requirements.find(r => r.id === id);
      r.title_en = prefixes[i] + '1,"quoted"\nEnglish';
      r.title_bn = prefixes[i] + '1,"quoted"\nবাংলা';
    });
    await load(page, variant, files);
    for (let i = 0; i < files.length; i++) await match(page, mappings[i][0], files[i].name);
    for (const lang of ['en', 'bn']) {
      if (lang === 'bn') await page.locator('#tp-lang').click();
      const rows = parseCsv(await csv(page));
      assert.equal(rows.length, 11);
      for (let i = 0; i < files.length; i++) {
        const req = variant.requirements.find(r => r.id === mappings[i][0]);
        const row = rows[req.order];
        assert.equal(row[1], "'" + req['title_' + lang], `neutralized ${lang} title ${i}; exact quotes/newlines`);
        assert.equal(row[2], "'" + files[i].name, `neutralized filename ${i}; exact quotes/newlines`);
      }
      facts.push({ lang, formulaTitleAndFilenamePairs: files.length, columns: 6, records: rows.length });
    }
  });
  await check('native date year/month/day keys, immediate status and stale URL', async (page, facts) => {
    await ready(page); let old = await generate(page);
    await dateInput(page).focus();
    const keys = ['Home', 'ArrowRight', 'ArrowRight', '2', '0', '2', '8'];
    const values = ['2027-06-30', '2027-06-30', '2027-06-30', '0002-06-30', '0020-06-30', '0202-06-30', '2028-06-30'];
    const statuses = ['OK', 'OK', 'OK', 'Expiry date needed', 'Expiry date needed', 'Expired', 'OK'];
    for (const [i, key] of keys.entries()) {
      await page.keyboard.press(key);
      facts.push({ key, value: await dateInput(page).inputValue(), status: await label(page, 'R01'), generateEnabled: await page.locator('#tp-generate').isEnabled(), downloadPresent: await page.locator('#tp-download').count() });
      assert.equal(await dateInput(page).inputValue(), values[i], 'native year value immediately after ' + key);
      assert.equal(await label(page, 'R01'), statuses[i], 'native year status immediately after ' + key);
      assert.equal(await page.locator('#tp-generate').isEnabled(), statuses[i] === 'OK');
      if (i >= 3) await revoked(page, old);
    }
    assert.equal(await dateInput(page).inputValue(), '2028-06-30', 'reported Home Right Right 2 0 2 8 year sequence');
    assert.equal(await label(page, 'R01'), 'OK');
    assert.equal(await page.locator('#tp-generate').isEnabled(), true);
    old = await generate(page);
    // en-US native segment order: month, day, year. Real key presses only.
    await dateInput(page).focus(); await page.keyboard.press('Home');
    await page.keyboard.press('0'); await page.keyboard.press('7');
    assert.equal(await dateInput(page).inputValue(), '2028-07-30', 'month typed using native keys');
    await revoked(page, old);
    // Chrome auto-advances from month to day. Home does not reliably return to
    // the first segment of an already-focused date. Select month explicitly
    // with a real click, then navigate right to day and type with real keys.
    const bounds = await dateInput(page).boundingBox();
    assert.ok(bounds, 'native input has a box');
    await dateInput(page).click({ position: { x: 15, y: bounds.height / 2 } });
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('2'); await page.keyboard.press('9');
    assert.equal(await dateInput(page).inputValue(), '2028-07-29', 'day typed using native keys');
    assert.equal(await label(page, 'R01'), 'OK'); facts.push({ finalNativeDate: await dateInput(page).inputValue() });
  });
  await check('exact English statuses, expiry boundary and Bangla switch', async (page, facts) => {
    await load(page); assert.equal(await label(page, 'R01'), 'Missing');
    assert.equal(await label(page, 'R06'), 'Not provided');
    await match(page, 'R01', docs[0].name); assert.equal(await label(page, 'R01'), 'Expiry date needed');
    await dateInput(page).fill('2026-10-19'); assert.equal(await label(page, 'R01'), 'Expired');
    await dateInput(page).fill('2026-10-20'); assert.equal(await label(page, 'R01'), 'OK');
    await dateInput(page).fill('2026-10-19'); await page.locator('#tp-lang').click();
    assert.equal(await page.locator('html').getAttribute('lang'), 'bn');
    assert.equal(await label(page, 'R01'), 'মেয়াদোত্তীর্ণ');
    assert.equal(await label(page, 'R02'), 'অনুপস্থিত');
    assert.equal(await label(page, 'R06'), 'প্রদান করা হয়নি');
    await match(page, 'R04', docs[3].name); assert.equal(await label(page, 'R04'), 'মেয়াদের তারিখ প্রয়োজন');
    await dateInput(page).fill('2027-06-30'); assert.equal(await label(page, 'R01'), 'ঠিক আছে');
    await page.locator('#tp-lang').click(); assert.equal(await label(page, 'R01'), 'OK');
    facts.push('All five exact English status strings; all five Bangla UI status strings; before/equal expiry boundary.');
  });
  for (const action of ['removal', 'reset', 'replacement', 'refresh', 'back navigation']) {
    await check('stale download invalidation: ' + action, async (page, facts) => {
      await ready(page); const old = await generate(page);
      if (action === 'removal') { await page.getByRole('button', { name: 'Remove: trade_license_2026.pdf', exact: true }).click(); assert.equal(await label(page, 'R01'), 'Missing'); assert.equal(await dateInput(page).inputValue(), ''); }
      if (action === 'reset') { await page.locator('#tp-reset').click(); assert.equal(await page.locator('.tp-req-row').count(), 0); }
      if (action === 'replacement') { await load(page, pack, []); assert.equal(await page.locator('#tp-file-list > li').count(), 0); }
      if (action === 'refresh') { await page.reload(); await page.locator('#tp-json-input').waitFor(); }
      if (action === 'back navigation') {
        await page.goto(new URL('?v05-away=1', base).href); await page.locator('#tp-json-input').waitFor();
        // BFCache restores do not emit a new load event; wait for commit/URL
        // and the restored UI instead of waiting for a new document load.
        await page.goBack({ waitUntil: 'commit' });
        await page.waitForURL(base.href, { waitUntil: 'commit' });
        await page.locator('#tp-json-input').waitFor();
        facts.push({ pageshowPersisted: await page.evaluate(() => window.__v05Pageshows), navigationType: await page.evaluate(() => performance.getEntriesByType('navigation').at(-1)?.type) });
      }
      await revoked(page, old); facts.push('Remembered old Blob URL fetch fails and download anchor absent.');
    });
  }
} finally {
  evidence.finishedAt = new Date().toISOString();
  evidence.finalLocalSourceHashes = await sourceHashes();
  evidence.sourcesChangedDuringRun = JSON.stringify(evidence.revision?.localSourceHashes) !== JSON.stringify(evidence.finalLocalSourceHashes);
  await browser.close();
  console.log(JSON.stringify(evidence, null, 2));
  process.exitCode = evidence.checks.some(c => c.result === 'FAIL') ? 1
    : evidence.checks.some(c => c.result === 'UNRUN' && c.reason !== '--only filter') || !evidence.checks.some(c => c.result === 'PASS') ? 2 : 0;
}
