// puku1/domain.test.js
// node:test based unit tests for puku1/domain.js
// Run with: node --test domain.test.js (from this folder).

import test from 'node:test';
import assert from 'node:assert/strict';
import { deepEqual as deepEqualLoose } from 'node:assert';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import {
  validateRequirements,
  statusFor,
  assignMatch,
  evaluatePackage,
  duplicateGroups,
  buildChecklistCsv,
  isValidIsoDate,
} from './domain.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Sample-pack fixtures (organizer data, not invented)
// ---------------------------------------------------------------------------

const samplePack = JSON.parse(
  readFileSync(resolve(__dirname, 'sample-pack/requirements.json'), 'utf8')
);

// Tiny helper to fabricate FileRecord-style metadata for unit assertions.
function fakeFile(id, name, pages, hash, size = 0) {
  return {
    id,
    name,
    pages,
    hash,
    size,
    // bytes intentionally omitted — domain logic must not need raw bytes.
  };
}

// Standard set of file metadata for the organizer pack.
const sampleFileMeta = [
  fakeFile('f-trade-2026', 'trade_license_2026.pdf', 1, 'hash-trade-2026'),
  fakeFile('f-trade-2025', 'trade_license_2025.pdf', 1, 'hash-trade-2025'),
  fakeFile('f-tin',        '03_tin_certificate.pdf',  1, 'hash-tin'),
  fakeFile('f-vat',        '04_vat_certificate.pdf',  1, 'hash-vat'),
  fakeFile('f-bank',       'bank_solvency.pdf',       1, 'hash-bank'),
  fakeFile('f-exp-a',      'experience_cert.pdf',     2, 'hash-experience'),
  fakeFile('f-exp-b',      'experience_cert (1).pdf', 2, 'hash-experience'),
  fakeFile('f-tech',       '02_technical_proposal.pdf', 6, 'hash-tech'),
  fakeFile('f-fin',        '01_financial_proposal.pdf', 2, 'hash-fin'),
  fakeFile('f-decl',       'scan_0042.pdf',           1, 'hash-decl'),
];

// ---------------------------------------------------------------------------
// isValidIsoDate
// ---------------------------------------------------------------------------

test('isValidIsoDate: accepts real YYYY-MM-DD', () => {
  assert.equal(isValidIsoDate('2026-10-20'), true);
  assert.equal(isValidIsoDate('2027-06-30'), true);
});

test('isValidIsoDate: rejects malformed and impossible calendar dates', () => {
  assert.equal(isValidIsoDate('2026-02-30'), false);
  assert.equal(isValidIsoDate('2026-13-01'), false);
  assert.equal(isValidIsoDate('2026/10/20'), false);
  assert.equal(isValidIsoDate(''), false);
  assert.equal(isValidIsoDate(20261020), false);
  assert.equal(isValidIsoDate(null), false);
  assert.equal(isValidIsoDate('2026-10-20T00:00:00'), false);
});

// ---------------------------------------------------------------------------
// validateRequirements
// ---------------------------------------------------------------------------

test('validateRequirements: passes the organizer sample unchanged', () => {
  const pack = validateRequirements(samplePack);
  assert.equal(pack.tender.tender_id, 'T-2026-0417');
  assert.equal(pack.tender.submission_deadline, '2026-10-20');
  assert.equal(pack.requirements.length, 10);
  for (let i = 0; i < pack.requirements.length - 1; i++) {
    assert.ok(
      pack.requirements[i].order < pack.requirements[i + 1].order,
      'requirements must be sorted by order'
    );
  }
});

test('validateRequirements: does not mutate the input', () => {
  const original = JSON.parse(JSON.stringify(samplePack));
  validateRequirements(samplePack);
  assert.deepEqual(samplePack, original);
});

test('validateRequirements: rejects duplicate ids', () => {
  const bad = JSON.parse(JSON.stringify(samplePack));
  bad.requirements[1].id = bad.requirements[0].id;
  assert.throws(
    () => validateRequirements(bad),
    (e) => e.code === 'invalid-requirements'
  );
});

test('validateRequirements: rejects duplicate order values', () => {
  const bad = JSON.parse(JSON.stringify(samplePack));
  bad.requirements[1].order = bad.requirements[0].order;
  assert.throws(
    () => validateRequirements(bad),
    (e) => e.code === 'invalid-requirements'
  );
});

test('validateRequirements: accepts duplicate title_en when ids and order differ', () => {
  // Display titles may repeat across requirements per the organizer schema.
  // Only ids and order values must be unique.
  const ok = JSON.parse(JSON.stringify(samplePack));
  ok.requirements[1].title_en = ok.requirements[0].title_en;
  ok.requirements[1].title_bn = ok.requirements[0].title_bn;
  const pack = validateRequirements(ok);
  assert.equal(pack.requirements[1].title_en, pack.requirements[0].title_en);
});

test('validateRequirements: rejects non-boolean mandatory flag', () => {
  const bad = JSON.parse(JSON.stringify(samplePack));
  bad.requirements[0].mandatory = 'yes';
  assert.throws(
    () => validateRequirements(bad),
    (e) => e.code === 'invalid-requirements'
  );
});

test('validateRequirements: rejects non-positive integer order', () => {
  const bad1 = JSON.parse(JSON.stringify(samplePack));
  bad1.requirements[0].order = 0;
  assert.throws(
    () => validateRequirements(bad1),
    (e) => e.code === 'invalid-requirements'
  );
  const bad2 = JSON.parse(JSON.stringify(samplePack));
  bad2.requirements[0].order = 1.5;
  assert.throws(
    () => validateRequirements(bad2),
    (e) => e.code === 'invalid-requirements'
  );
});

test('validateRequirements: rejects missing tender fields', () => {
  const bad = JSON.parse(JSON.stringify(samplePack));
  delete bad.tender.bidder;
  assert.throws(
    () => validateRequirements(bad),
    (e) => e.code === 'invalid-requirements'
  );
});

test('validateRequirements: rejects impossible deadline dates', () => {
  const bad = JSON.parse(JSON.stringify(samplePack));
  bad.tender.submission_deadline = '2026-02-30';
  assert.throws(
    () => validateRequirements(bad),
    (e) => e.code === 'invalid-requirements'
  );
});

test('validateRequirements: rejects empty requirements array', () => {
  const bad = JSON.parse(JSON.stringify(samplePack));
  bad.requirements = [];
  assert.throws(
    () => validateRequirements(bad),
    (e) => e.code === 'invalid-requirements'
  );
});

// ---------------------------------------------------------------------------
// statusFor
// ---------------------------------------------------------------------------

const deadline = '2026-10-20';

test('statusFor: mandatory missing file -> missing', () => {
  const req = { id: 'R01', order: 1, title_en: 'Trade License', mandatory: true, has_expiry: true };
  assert.equal(statusFor(req, null, null, deadline), 'missing');
});

test('statusFor: optional missing file -> not-provided', () => {
  const req = { id: 'R06', order: 6, title_en: 'Audited FS', mandatory: false, has_expiry: false };
  assert.equal(statusFor(req, null, null, deadline), 'not-provided');
});

test('statusFor: expiry-needed when expiring requirement has no expiry date', () => {
  const req = { id: 'R01', order: 1, title_en: 'Trade License', mandatory: true, has_expiry: true };
  const file = fakeFile('f', 'trade.pdf', 1, 'h');
  assert.equal(statusFor(req, file, null, deadline), 'expiry-needed');
  assert.equal(statusFor(req, file, '', deadline), 'expiry-needed');
  assert.equal(statusFor(req, file, 'not-a-date', deadline), 'expiry-needed');
});

test('statusFor: expired when expiry is strictly before deadline', () => {
  const req = { id: 'R01', order: 1, title_en: 'Trade License', mandatory: true, has_expiry: true };
  const file = fakeFile('f', 'trade.pdf', 1, 'h');
  assert.equal(statusFor(req, file, '2025-06-30', deadline), 'expired');
});

test('statusFor: ok when expiry equals deadline (boundary case)', () => {
  const req = { id: 'R01', order: 1, title_en: 'Trade License', mandatory: true, has_expiry: true };
  const file = fakeFile('f', 'trade.pdf', 1, 'h');
  assert.equal(statusFor(req, file, '2026-10-20', deadline), 'ok');
});

test('statusFor: ok when expiry is after deadline', () => {
  const req = { id: 'R01', order: 1, title_en: 'Trade License', mandatory: true, has_expiry: true };
  const file = fakeFile('f', 'trade.pdf', 1, 'h');
  assert.equal(statusFor(req, file, '2027-06-30', deadline), 'ok');
});

test('statusFor: non-expiring requirement with file -> ok', () => {
  const req = { id: 'R02', order: 2, title_en: 'TIN', mandatory: true, has_expiry: false };
  const file = fakeFile('f', 'tin.pdf', 1, 'h');
  assert.equal(statusFor(req, file, null, deadline), 'ok');
  assert.equal(statusFor(req, file, '1990-01-01', deadline), 'ok');
});

// ---------------------------------------------------------------------------
// assignMatch — immutability and replacement / unmatch semantics
// ---------------------------------------------------------------------------

function stateWith(matches, expiryDates) {
  return {
    pack: validateRequirements(samplePack),
    files: sampleFileMeta,
    matches,
    expiryDates,
  };
}

test('assignMatch: assigns a file and does not mutate inputs', () => {
  const state = stateWith({}, { R01: '2027-06-30' });

  const beforeMatchesRef = state.matches;
  const beforeExpiryRef = state.expiryDates;
  const out = assignMatch(state, 'R01', 'f-trade-2026');

  // Old references intact.
  assert.equal(state.matches, beforeMatchesRef);
  assert.equal(state.expiryDates, beforeExpiryRef);
  assert.deepEqual(beforeMatchesRef, {});
  assert.deepEqual(beforeExpiryRef, { R01: '2027-06-30' });

  // New copies returned.
  assert.notEqual(out.matches, beforeMatchesRef);
  assert.notEqual(out.expiryDates, beforeExpiryRef);
  assert.equal(out.matches.R01, 'f-trade-2026');
  // Changing a match clears prior expiry for that requirement.
  assert.equal(out.expiryDates.R01, undefined);
});

test('assignMatch: no-op when re-selecting the same file', () => {
  const state = stateWith({ R01: 'f-trade-2026' }, { R01: '2027-06-30' });
  const out = assignMatch(state, 'R01', 'f-trade-2026');
  assert.equal(out.matches.R01, 'f-trade-2026');
  assert.equal(out.expiryDates.R01, '2027-06-30');
  // Returned maps must be structurally identical to inputs (pure no-op).
  // Use loose deepEqual because the returned maps have a null prototype while
  // the input state maps do not — strict equal would reject the prototype gap.
  deepEqualLoose(out.matches, state.matches);
  deepEqualLoose(out.expiryDates, state.expiryDates);
  // Original state must remain untouched.
  assert.deepEqual(state.matches, { R01: 'f-trade-2026' });
  assert.deepEqual(state.expiryDates, { R01: '2027-06-30' });
  // Sanity: the returned maps are null-prototype (safe from prototype keys).
  assert.equal(Object.getPrototypeOf(out.matches), null);
  assert.equal(Object.getPrototypeOf(out.expiryDates), null);
});

test('assignMatch: unmatching clears both match and expiry', () => {
  const state = stateWith({ R01: 'f-trade-2026' }, { R01: '2027-06-30' });
  const out = assignMatch(state, 'R01', null);
  assert.equal(out.matches.R01, undefined);
  assert.equal(out.expiryDates.R01, undefined);
});

test('assignMatch: rejects unknown requirement id', () => {
  const state = stateWith({}, {});
  assert.throws(
    () => assignMatch(state, 'R99', 'f-trade-2026'),
    (e) => e.code === 'unknown-requirement'
  );
});

test('assignMatch: rejects unknown file id', () => {
  const state = stateWith({}, {});
  assert.throws(
    () => assignMatch(state, 'R01', 'f-nope'),
    (e) => e.code === 'unknown-file'
  );
});

test('assignMatch: rejects assigning the same file to two requirements', () => {
  const state = stateWith({ R01: 'f-trade-2026' }, {});
  assert.throws(
    () => assignMatch(state, 'R02', 'f-trade-2026'),
    (e) => e.code === 'file-already-used'
  );
});

test('assignMatch: rejects same content (hash) via two different file ids', () => {
  const state = stateWith({ R05: 'f-exp-a' }, {});
  assert.throws(
    () => assignMatch(state, 'R06', 'f-exp-b'),
    (e) => e.code === 'duplicate-content'
  );
});

// ---------------------------------------------------------------------------
// evaluatePackage — covers every required scenario
// ---------------------------------------------------------------------------

test('evaluatePackage: mandatory missing -> blocker, canGenerate=false', () => {
  const pack = validateRequirements(samplePack);
  const out = evaluatePackage(pack, sampleFileMeta, {}, {});
  assert.equal(out.canGenerate, false);
  assert.ok(out.blockers.some((b) => b.requirement.id === 'R01' && b.status === 'missing'));
});

test('evaluatePackage: optional not-provided is NOT a blocker', () => {
  const pack = validateRequirements(samplePack);
  // Match every mandatory requirement except R10; leave R06/R07 untouched.
  const matches = {
    R01: 'f-trade-2026',
    R02: 'f-tin',
    R03: 'f-vat',
    R04: 'f-bank',
    R05: 'f-exp-a',
    R08: 'f-tech',
    R09: 'f-fin',
  };
  const expiry = { R01: '2027-06-30', R04: '2026-12-31' };
  const out = evaluatePackage(pack, sampleFileMeta, matches, expiry);
  for (const b of out.blockers) {
    assert.notEqual(b.requirement.id, 'R06');
    assert.notEqual(b.requirement.id, 'R07');
  }
});

test('evaluatePackage: expired 2025-06-30 trade license fails', () => {
  const pack = validateRequirements(samplePack);
  const out = evaluatePackage(
    pack,
    sampleFileMeta,
    { R01: 'f-trade-2025' },
    { R01: '2025-06-30' }
  );
  const row = out.rows.find((r) => r.requirement.id === 'R01');
  assert.equal(row.status, 'expired');
  assert.ok(out.blockers.some((b) => b.requirement.id === 'R01'));
  assert.equal(out.canGenerate, false);
});

test('evaluatePackage: missing expiry on expiring requirement -> expiry-needed blocker', () => {
  const pack = validateRequirements(samplePack);
  const out = evaluatePackage(pack, sampleFileMeta, { R01: 'f-trade-2026' }, {});
  const row = out.rows.find((r) => r.requirement.id === 'R01');
  assert.equal(row.status, 'expiry-needed');
  assert.equal(out.canGenerate, false);
});

test('evaluatePackage: valid 2027-06-30 trade license passes', () => {
  const pack = validateRequirements(samplePack);
  const out = evaluatePackage(
    pack,
    sampleFileMeta,
    { R01: 'f-trade-2026' },
    { R01: '2027-06-30' }
  );
  const row = out.rows.find((r) => r.requirement.id === 'R01');
  assert.equal(row.status, 'ok');
});

test('evaluatePackage: boundary 2026-10-20 expiry equals deadline -> ok', () => {
  const pack = validateRequirements(samplePack);
  const out = evaluatePackage(
    pack,
    sampleFileMeta,
    { R01: 'f-trade-2026' },
    { R01: '2026-10-20' }
  );
  const row = out.rows.find((r) => r.requirement.id === 'R01');
  assert.equal(row.status, 'ok');
  assert.equal(row.file.id, 'f-trade-2026');
});

test('evaluatePackage: rejects duplicate hash assignment via integrityErrors', () => {
  const pack = validateRequirements(samplePack);
  const out = evaluatePackage(
    pack,
    sampleFileMeta,
    { R05: 'f-exp-a', R06: 'f-exp-b' },
    {}
  );
  assert.ok(Array.isArray(out.integrityErrors));
  assert.ok(out.integrityErrors.length > 0);
  assert.equal(out.canGenerate, false);
});

test('evaluatePackage: rejects stale match for unknown file', () => {
  const pack = validateRequirements(samplePack);
  const out = evaluatePackage(pack, sampleFileMeta, { R01: 'f-deleted' }, {});
  assert.ok(out.integrityErrors && out.integrityErrors.length > 0);
  assert.equal(out.canGenerate, false);
});

test('evaluatePackage: empty pack is never generatable', () => {
  const pack = validateRequirements(samplePack);
  const out = evaluatePackage(pack, [], {}, {});
  assert.equal(out.canGenerate, false);
  assert.equal(out.included.length, 0);
});

test('evaluatePackage: organizer sample fully matched yields canGenerate=true and 16 pages', () => {
  const pack = validateRequirements(samplePack);
  const matches = {
    R01: 'f-trade-2026',
    R02: 'f-tin',
    R03: 'f-vat',
    R04: 'f-bank',
    R05: 'f-exp-a',
    R08: 'f-tech',
    R09: 'f-fin',
    R10: 'f-decl',
  };
  const expiry = { R01: '2027-06-30', R04: '2026-12-31' };
  const out = evaluatePackage(pack, sampleFileMeta, matches, expiry);
  assert.equal(out.canGenerate, true);
  // 1 cover + trade1 + tin1 + vat1 + bank1 + experience2 + tech6 + fin2 + decl1 = 16
  assert.equal(out.pageCount, 16);
  for (let i = 0; i < out.included.length - 1; i++) {
    assert.ok(out.included[i].requirement.order < out.included[i + 1].requirement.order);
  }
});

// --- D02 regression: empty pack contract ----------------------------------

test('evaluatePackage: returns an empty summary for null pack (does not throw)', () => {
  const out = evaluatePackage(null, [], {}, {});
  assert.deepEqual(out.rows, []);
  assert.deepEqual(out.included, []);
  assert.deepEqual(out.blockers, []);
  assert.equal(out.canGenerate, false);
  assert.equal(out.pageCount, 0);
  // No integrityErrors for an unloaded pack — the contract is just "empty + non-generatable".
  assert.equal(out.integrityErrors === undefined || out.integrityErrors.length === 0, true);
});

test('evaluatePackage: returns empty summary for undefined / malformed pack', () => {
  for (const bad of [undefined, null, 0, '', 'pack', [], { tender: null }, { tender: {}, requirements: [] }]) {
    const out = evaluatePackage(bad, [], {}, {});
    assert.equal(out.canGenerate, false, `canGenerate should be false for ${JSON.stringify(bad)}`);
    assert.equal(out.pageCount, 0);
    assert.deepEqual(out.rows, []);
    assert.deepEqual(out.included, []);
    assert.deepEqual(out.blockers, []);
  }
});

// --- D02 regression: prototype-pollution safe match stores ----------------

function packWithProtoIds() {
  // A minimal but valid Pack whose ids collide with Object.prototype keys.
  return validateRequirements({
    tender: {
      tender_id: 'T-proto',
      title: 'Prototype ID Test',
      procuring_entity: 'Test Entity',
      bidder: 'Test Bidder',
      submission_deadline: '2026-10-20',
    },
    requirements: [
      { id: '__proto__', order: 1, title_en: 'Proto One', title_bn: 'প্রোটো এক', mandatory: true, has_expiry: false },
      { id: 'constructor', order: 2, title_en: 'Con Two', title_bn: 'কনস্ট্রাক্টর দুই', mandatory: true, has_expiry: false },
      { id: 'toString', order: 3, title_en: 'ToStr Three', title_bn: 'টুস্ট্রিং তিন', mandatory: true, has_expiry: false },
    ],
  });
}

test('assignMatch: stores match for id "__proto__" as an ordinary own key', () => {
  const pack = packWithProtoIds();
  const files = [
    fakeFile('fa', 'a.pdf', 1, 'ha'),
    fakeFile('fb', 'b.pdf', 1, 'hb'),
    fakeFile('fc', 'c.pdf', 1, 'hc'),
  ];
  const state = { pack, files, matches: {}, expiryDates: {} };
  const out = assignMatch(state, '__proto__', 'fa');

  // The returned map is a null-prototype object — no inherited toString/hasOwnProperty leak.
  assert.equal(Object.getPrototypeOf(out.matches), null);

  // The key must round-trip as an own property, exactly as written.
  assert.equal(Object.prototype.hasOwnProperty.call(out.matches, '__proto__'), true);
  assert.equal(out.matches['__proto__'], 'fa');
  assert.equal(out.matches.__proto__, 'fa');

  // Inherited prototype keys must NOT appear as own entries.
  assert.equal(Object.prototype.hasOwnProperty.call(out.matches, 'toString'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(out.matches, 'constructor'), false);

  // And the prototype chain must not have been mutated.
  assert.equal({}.toString, Object.prototype.toString);
  assert.equal({}.constructor, Object.prototype.constructor);
});

test('assignMatch: rejects the same file id reused by "constructor" after "__proto__"', () => {
  const pack = packWithProtoIds();
  const files = [fakeFile('fa', 'a.pdf', 1, 'ha')];
  // Build matches on a null-prototype object so '__proto__' is an own key.
  const matches = Object.create(null);
  matches['__proto__'] = 'fa';
  const state = { pack, files, matches, expiryDates: Object.create(null) };
  assert.throws(
    () => assignMatch(state, 'constructor', 'fa'),
    (e) => e.code === 'file-already-used'
  );
});

test('assignMatch: unmatching "__proto__" clears match and leaves Object.prototype intact', () => {
  const pack = packWithProtoIds();
  const files = [fakeFile('fa', 'a.pdf', 1, 'ha')];
  const matches = Object.create(null);
  matches['__proto__'] = 'fa';
  const expiry = Object.create(null);
  expiry['__proto__'] = '2027-06-30';
  const state = { pack, files, matches, expiryDates: expiry };

  const out = assignMatch(state, '__proto__', null);
  assert.equal(Object.prototype.hasOwnProperty.call(out.matches, '__proto__'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(out.expiryDates, '__proto__'), false);

  // Replacement with a DIFFERENT file must clear the prior expiry for
  // the same requirement id (spec: changing a requirement clears its prior
  // expiry). Same-file reassignment is a no-op that retains expiry.
  const files2 = [fakeFile('fa', 'a.pdf', 1, 'ha'), fakeFile('fb', 'b.pdf', 1, 'hb')];
  const matches2 = Object.create(null);
  matches2['__proto__'] = 'fa';
  const expiry2 = Object.create(null);
  expiry2['__proto__'] = '2027-06-30';
  const state2 = { pack, files: files2, matches: matches2, expiryDates: expiry2 };
  const out2 = assignMatch(state2, '__proto__', 'fb');
  assert.equal(out2.matches['__proto__'], 'fb');
  assert.equal(Object.prototype.hasOwnProperty.call(out2.expiryDates, '__proto__'), false);

  // Global Object.prototype untouched.
  assert.equal({}.toString, Object.prototype.toString);
});

test('evaluatePackage: prototype-id match is treated as an ordinary own key', () => {
  const pack = packWithProtoIds();
  const files = [
    fakeFile('fa', 'a.pdf', 1, 'ha'),
    fakeFile('fb', 'b.pdf', 1, 'hb'),
    fakeFile('fc', 'c.pdf', 1, 'hc'),
  ];
  // Null-prototype map so '__proto__', 'constructor' and 'toString' are own keys.
  const matches = Object.create(null);
  matches['__proto__'] = 'fa';
  matches['constructor'] = 'fb';
  matches['toString'] = 'fc';
  const out = evaluatePackage(pack, files, matches, {});
  assert.equal(out.canGenerate, true);
  assert.equal(out.included.length, 3);
  // Each row carries its real file id (not a prototype fallback).
  const byReq = new Map(out.included.map((r) => [r.requirement.id, r.file.id]));
  assert.equal(byReq.get('__proto__'), 'fa');
  assert.equal(byReq.get('constructor'), 'fb');
  assert.equal(byReq.get('toString'), 'fc');
  assert.equal(out.pageCount, 1 + 3); // cover + three 1-page files
});

// ---------------------------------------------------------------------------
// duplicateGroups
// ---------------------------------------------------------------------------

test('duplicateGroups: returns hashes that appear at least twice', () => {
  const groups = duplicateGroups(sampleFileMeta);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].length, 2);
  assert.equal(groups[0][0].hash, 'hash-experience');
});

test('duplicateGroups: empty array -> empty result', () => {
  assert.deepEqual(duplicateGroups([]), []);
});

test('duplicateGroups: ignores files without a hash', () => {
  const files = [fakeFile('a', 'a.pdf', 1, ''), fakeFile('b', 'b.pdf', 1, '')];
  assert.deepEqual(duplicateGroups(files), []);
});

// ---------------------------------------------------------------------------
// buildChecklistCsv
// ---------------------------------------------------------------------------

test('buildChecklistCsv: emits header and one row per requirement, sorted by order', () => {
  const pack = validateRequirements(samplePack);
  const matches = {
    R01: 'f-trade-2026',
    R02: 'f-tin',
    R03: 'f-vat',
    R04: 'f-bank',
    R05: 'f-exp-a',
    R08: 'f-tech',
    R09: 'f-fin',
  };
  const expiry = { R01: '2027-06-30', R04: '2026-12-31' };
  const out = evaluatePackage(pack, sampleFileMeta, matches, expiry);
  const csv = buildChecklistCsv(out.rows, 'en');
  const lines = csv.split('\r\n');
  assert.equal(lines[0], '#,Document,Filename,Pages,Expiry,Status');
  // header + 10 rows + trailing empty -> 12 entries (last is empty after final CRLF).
  assert.equal(lines.length, 12);
  assert.match(lines[1], /^1,Trade License,trade_license_2026\.pdf,1,2027-06-30,OK/);
  // R06 is optional and has no expiry -> expiry cell is blank, not an em-dash.
  assert.match(lines[6], /^6,Audited Financial Statement,,,,Not provided/);
});

test('buildChecklistCsv: Bangla labels render UTF-8 correctly', () => {
  const pack = validateRequirements(samplePack);
  const out = evaluatePackage(pack, sampleFileMeta, { R01: 'f-trade-2026' }, { R01: '2027-06-30' });
  const csv = buildChecklistCsv(out.rows, 'bn');
  assert.match(csv, /ট্রেড লাইসেন্স/);
  assert.match(csv, /ঠিক আছে/);
});

test('buildChecklistCsv: escapes commas and formula prefixes safely', () => {
  const trickyPack = JSON.parse(JSON.stringify(samplePack));
  trickyPack.requirements[0].title_en = '=cmd|"weird",name';
  const pack = validateRequirements(trickyPack);
  const out = evaluatePackage(pack, sampleFileMeta, { R01: 'f-trade-2026' }, { R01: '2027-06-30' });
  const csv = buildChecklistCsv(out.rows, 'en');
  // The title must be quoted and the leading = neutralized.
  assert.match(csv, /,"'=cmd\|""weird"",name",/);
});

test('buildChecklistCsv: rejects non-array rows', () => {
  assert.throws(
    () => buildChecklistCsv(null, 'en'),
    (e) => e.code === 'bad-rows'
  );
});

test('buildChecklistCsv: neutralizes formulas after whitespace and control prefixes', () => {
  for (const prefix of ['=', '+', '-', '@', '\t', '\r', '\n=', ' =', '\uFEFF=']) {
    const pack = validateRequirements(samplePack);
    const row = {
      requirement: { ...pack.requirements[0], title_en: prefix + '1+1' },
      file: { ...sampleFileMeta[0], name: prefix + '1+1.pdf' },
      status: 'ok', expiryDate: '2027-06-30',
    };
    const csv = buildChecklistCsv([row]);
    const escapedTitle = "'" + row.requirement.title_en;
    const expectedCell = /[",\r\n]/.test(escapedTitle)
      ? '"' + escapedTitle.replace(/"/g, '""') + '"' : escapedTitle;
    assert.ok(csv.includes(expectedCell), JSON.stringify(prefix));
  }
});

test('buildChecklistCsv: unmatched optional expiry row does not request a date', () => {
  const pack = validateRequirements(samplePack);
  const row = evaluatePackage(pack, sampleFileMeta, {}, {}).rows.find(r => r.requirement.id === 'R07');
  const csv = buildChecklistCsv([row]);
  assert.ok(!csv.includes('(required)'));
  assert.ok(csv.includes('Not provided'));
});
