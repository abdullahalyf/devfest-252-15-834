// puku1/domain.js
// Pure, immutable domain logic for the Tender Document Package Builder.
// Contract v1 — see CONTEXT.md / docs/CONTRACT.md for binding shapes.

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

// --- Date helpers ----------------------------------------------------------

// Days from epoch (UTC) for a YYYY-MM-DD string. Returns NaN if invalid.
function epochDays(s) {
  if (typeof s !== 'string' || !ISO_DATE.test(s)) return NaN;
  const [y, m, d] = s.split('-').map(Number);
  // Use UTC to avoid local-TZ drift; the calendar date is what matters.
  const t = Date.UTC(y, m - 1, d);
  if (Number.isNaN(t)) return NaN;
  // Round-trip: detect invalid dates such as 2026-02-30.
  const dt = new Date(t);
  if (
    dt.getUTCFullYear() !== y ||
    dt.getUTCMonth() !== m - 1 ||
    dt.getUTCDate() !== d
  ) {
    return NaN;
  }
  return Math.floor(t / 86400000);
}

// Strict YYYY-MM-DD validation including real-calendar check.
export function isValidIsoDate(s) {
  return typeof s === 'string' && ISO_DATE.test(s) && !Number.isNaN(epochDays(s));
}

// --- validateRequirements --------------------------------------------------

function asPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function bad(code, message, extra = {}) {
  const e = new Error(message);
  e.code = code;
  Object.assign(e, extra);
  return e;
}

export function validateRequirements(raw) {
  if (!asPlainObject(raw)) {
    throw bad('invalid-requirements', 'Pack must be a JSON object.');
  }
  const tender = raw.tender;
  if (!asPlainObject(tender)) {
    throw bad('invalid-requirements', 'Pack.tender must be an object.');
  }
  const tenderStrFields = ['tender_id', 'title', 'procuring_entity', 'bidder'];
  for (const k of tenderStrFields) {
    if (typeof tender[k] !== 'string' || tender[k].length === 0) {
      throw bad('invalid-requirements', `Pack.tender.${k} must be a non-empty string.`);
    }
  }
  if (!isValidIsoDate(tender.submission_deadline)) {
    throw bad('invalid-requirements', 'Pack.tender.submission_deadline must be a real YYYY-MM-DD date.');
  }

  if (!Array.isArray(raw.requirements)) {
    throw bad('invalid-requirements', 'Pack.requirements must be an array.');
  }
  if (raw.requirements.length === 0) {
    throw bad('invalid-requirements', 'Pack.requirements must not be empty.');
  }

  const seenIds = new Set();
  const seenOrders = new Set();
  const normReqs = [];
  for (let i = 0; i < raw.requirements.length; i++) {
    const r = raw.requirements[i];
    if (!asPlainObject(r)) {
      throw bad('invalid-requirements', `requirements[${i}] must be an object.`);
    }
    if (typeof r.id !== 'string' || r.id.length === 0) {
      throw bad('invalid-requirements', `requirements[${i}].id must be a non-empty string.`);
    }
    if (seenIds.has(r.id)) {
      throw bad('invalid-requirements', `Duplicate requirement id: ${r.id}.`);
    }
    seenIds.add(r.id);
    if (!Number.isInteger(r.order) || r.order <= 0) {
      throw bad('invalid-requirements', `requirements[${i}].order must be a positive integer.`);
    }
    if (seenOrders.has(r.order)) {
      throw bad('invalid-requirements', `Duplicate requirement order: ${r.order}.`);
    }
    seenOrders.add(r.order);
    if (typeof r.title_en !== 'string' || r.title_en.length === 0) {
      throw bad('invalid-requirements', `requirements[${i}].title_en must be a non-empty string.`);
    }
    // Note: duplicate display titles are allowed. IDs and order values
    // remain the only uniqueness constraints per organizer contract.
    if (typeof r.title_bn !== 'string' || r.title_bn.length === 0) {
      throw bad('invalid-requirements', `requirements[${i}].title_bn must be a non-empty string.`);
    }
    if (typeof r.mandatory !== 'boolean') {
      throw bad('invalid-requirements', `requirements[${i}].mandatory must be a boolean.`);
    }
    if (typeof r.has_expiry !== 'boolean') {
      throw bad('invalid-requirements', `requirements[${i}].has_expiry must be a boolean.`);
    }
    normReqs.push({
      id: r.id,
      order: r.order,
      title_en: r.title_en,
      title_bn: r.title_bn,
      mandatory: r.mandatory,
      has_expiry: r.has_expiry,
    });
  }

  // Sort by order without mutating the caller's array. Use a copy.
  normReqs.sort((a, b) => a.order - b.order);

  return {
    tender: {
      tender_id: tender.tender_id,
      title: tender.title,
      procuring_entity: tender.procuring_entity,
      bidder: tender.bidder,
      submission_deadline: tender.submission_deadline,
    },
    requirements: normReqs,
  };
}

// --- statusFor -------------------------------------------------------------

// statusFor returns a string status code for a single requirement row.
// Codes: 'missing' | 'not-provided' | 'expiry-needed' | 'expired' | 'ok'
export function statusFor(requirement, fileOrNull, expiryDate, deadline) {
  if (!asPlainObject(requirement)) {
    throw bad('bad-requirement', 'statusFor: requirement must be an object.');
  }
  if (!isValidIsoDate(deadline)) {
    throw bad('bad-deadline', 'statusFor: deadline must be a real YYYY-MM-DD date.');
  }
  const mandatory = requirement.mandatory === true;
  const hasExpiry = requirement.has_expiry === true;

  if (fileOrNull == null) {
    return mandatory ? 'missing' : 'not-provided';
  }

  if (hasExpiry) {
    if (expiryDate == null || expiryDate === '' || !isValidIsoDate(expiryDate)) {
      return 'expiry-needed';
    }
    if (epochDays(expiryDate) < epochDays(deadline)) {
      return 'expired';
    }
  }
  return 'ok';
}

// --- assignMatch -----------------------------------------------------------

// Build a plain copy of a match/expiry map on a null prototype so that
// assignment never mutates Object.prototype and so inherited keys like
// `toString` or `constructor` cannot be confused with own properties.
function copyMatchMap(src) {
  const out = Object.create(null);
  if (src == null) return out;
  for (const k of Object.keys(src)) {
    out[k] = src[k];
  }
  return out;
}

function readMatchMap(src) {
  // Return a null-prototype snapshot that callers can pass back safely.
  return copyMatchMap(src);
}

function ownHas(map, key) {
  return Object.prototype.hasOwnProperty.call(map, key);
}

// assignMatch returns new { matches, expiryDates } copies.
// Rejects:
//   * unknown requirement id
//   * unknown file id (when assigning a non-null fileId)
//   * the same file already used by a different requirement
//   * the same content (hash) already matched through a different file id
// No-op when assigning the current file for a requirement (expiry retained).
// Changing/unmatching a requirement clears its prior expiry.
// Stores use null-prototype objects so that ids like "__proto__",
// "constructor" or "toString" behave like ordinary keys.
export function assignMatch(state, requirementId, fileIdOrNull) {
  if (!asPlainObject(state)) {
    throw bad('bad-state', 'assignMatch: state must be an object.');
  }
  const { pack, files, matches, expiryDates } = state;
  if (pack == null) {
    throw bad('bad-state', 'assignMatch: state.pack is required.');
  }
  if (!Array.isArray(files)) {
    throw bad('bad-state', 'assignMatch: state.files must be an array.');
  }
  const matchesIn = readMatchMap(matches);
  const expiryIn = readMatchMap(expiryDates);

  const req = pack.requirements.find((r) => r.id === requirementId);
  if (!req) {
    throw bad('unknown-requirement', `assignMatch: unknown requirement id "${requirementId}".`, {
      requirementId,
    });
  }

  // Snapshot every entry from the null-prototype map. We deliberately
  // iterate via Object.keys to avoid enumerating inherited prototype keys.
  const newMatches = Object.create(null);
  for (const k of Object.keys(matchesIn)) newMatches[k] = matchesIn[k];
  const newExpiry = Object.create(null);
  for (const k of Object.keys(expiryIn)) newExpiry[k] = expiryIn[k];

  if (fileIdOrNull == null) {
    // Unmatch: clear this requirement's match and its expiry.
    if (ownHas(newMatches, requirementId)) {
      delete newMatches[requirementId];
      delete newExpiry[requirementId];
    }
    return { matches: newMatches, expiryDates: newExpiry };
  }

  const file = files.find((f) => f.id === fileIdOrNull);
  if (!file) {
    throw bad('unknown-file', `assignMatch: unknown file id "${fileIdOrNull}".`, {
      fileId: fileIdOrNull,
    });
  }

  // Reject if any other requirement is using the same file id.
  for (const rid of Object.keys(newMatches)) {
    if (rid !== requirementId && newMatches[rid] === fileIdOrNull) {
      throw bad(
        'file-already-used',
        `File ${fileIdOrNull} is already matched to requirement ${rid}.`,
        { requirementId: rid, fileId: fileIdOrNull }
      );
    }
  }

  // Reject if the same content (hash) is already matched via a different file id.
  if (typeof file.hash === 'string' && file.hash.length > 0) {
    for (const rid of Object.keys(newMatches)) {
      if (rid === requirementId) continue;
      const other = files.find((f) => f.id === newMatches[rid]);
      if (other && other.hash === file.hash) {
        throw bad(
          'duplicate-content',
          `File content (hash ${file.hash}) is already matched to requirement ${rid} via file ${newMatches[rid]}.`,
          { requirementId: rid, fileId: newMatches[rid], hash: file.hash }
        );
      }
    }
  }

  // No-op when assigning the same file again.
  if (ownHas(newMatches, requirementId) && newMatches[requirementId] === fileIdOrNull) {
    return { matches: newMatches, expiryDates: newExpiry };
  }

  newMatches[requirementId] = fileIdOrNull;
  // Changing the matched file clears the prior expiry for this requirement.
  if (ownHas(newExpiry, requirementId)) {
    delete newExpiry[requirementId];
  }
  return { matches: newMatches, expiryDates: newExpiry };
}

// --- evaluatePackage -------------------------------------------------------

// Empty summary used when the package is unloaded or invalid. Centralized so
// the public contract is stable: callers (and the independent oracle) can
// rely on rows:[], included:[], blockers:[], canGenerate:false, pageCount:0.
function emptySummary() {
  return {
    rows: [],
    included: [],
    blockers: [],
    canGenerate: false,
    pageCount: 0,
  };
}

export function evaluatePackage(pack, files, matches, expiryDates) {
  // Contract: evaluatePackage on an unloaded / invalid pack MUST return an
  // empty non-generatable summary rather than throwing. The independent
  // verifier depends on this.
  if (
    pack == null ||
    !asPlainObject(pack) ||
    pack.tender == null ||
    !Array.isArray(pack.requirements) ||
    pack.requirements.length === 0 ||
    !isValidIsoDate(pack.tender && pack.tender.submission_deadline)
  ) {
    return emptySummary();
  }
  if (!Array.isArray(files)) {
    return emptySummary();
  }
  const m = readMatchMap(matches);
  const x = readMatchMap(expiryDates);
  const deadline = pack.tender.submission_deadline;

  // Sort requirements by order without mutating.
  const reqs = [...pack.requirements].sort((a, b) => a.order - b.order);

  // Build a fast file lookup.
  const fileById = new Map();
  for (const f of files) {
    if (f && typeof f.id === 'string') fileById.set(f.id, f);
  }

  // Integrity checks: stale or unknown matches must prevent generation.
  // Use Object.hasOwn + Object.keys so inherited prototype keys cannot leak.
  const integrityErrors = [];
  for (const rid of Object.keys(m)) {
    if (!ownHas(m, rid)) continue;
    const fid = m[rid];
    if (!reqs.find((r) => r.id === rid)) {
      integrityErrors.push(`Match references unknown requirement "${rid}".`);
      continue;
    }
    if (typeof fid !== 'string' || !fileById.has(fid)) {
      integrityErrors.push(`Match for requirement "${rid}" points to unknown file id "${fid}".`);
    }
  }

  // Duplicate-content guard: same hash assigned to more than one requirement.
  const hashToReqs = new Map();
  for (const rid of Object.keys(m)) {
    if (!ownHas(m, rid)) continue;
    const fid = m[rid];
    const f = fileById.get(fid);
    if (!f || typeof f.hash !== 'string' || f.hash.length === 0) continue;
    const list = hashToReqs.get(f.hash) || [];
    list.push(rid);
    hashToReqs.set(f.hash, list);
  }
  for (const [h, list] of hashToReqs) {
    if (list.length > 1) {
      integrityErrors.push(
        `Same content (hash ${h}) is matched to multiple requirements: ${list.join(', ')}.`
      );
    }
  }

  const rows = [];
  for (const req of reqs) {
    // Use ownHas so prototype-inherited keys can never spoof a match.
    const fid = ownHas(m, req.id) ? m[req.id] : null;
    const file = fid ? fileById.get(fid) || null : null;
    const expiry = ownHas(x, req.id) ? x[req.id] : null;
    const status = statusFor(req, file, expiry, deadline);
    rows.push({ requirement: req, file, status, expiryDate: expiry });
  }

  const included = rows
    .filter((r) => r.file != null)
    .slice()
    .sort((a, b) => a.requirement.order - b.requirement.order);

  const blockers = rows.filter((r) => {
    if (r.status === 'ok') return false;
    // A non-mandatory "not-provided" requirement is not a blocker.
    if (!r.requirement.mandatory && r.status === 'not-provided') return false;
    return true;
  });

  const pageCount = 1 + included.reduce((sum, r) => sum + (r.file && r.file.pages ? r.file.pages : 0), 0);

  const canGenerate =
    integrityErrors.length === 0 &&
    blockers.length === 0 &&
    included.length > 0;

  const out = { rows, canGenerate, blockers, included, pageCount };
  if (integrityErrors.length > 0) out.integrityErrors = integrityErrors;
  return out;
}

// --- duplicateGroups -------------------------------------------------------

export function duplicateGroups(files) {
  if (!Array.isArray(files)) {
    throw bad('bad-files', 'duplicateGroups: files must be an array.');
  }
  const byHash = new Map();
  for (const f of files) {
    if (!f || typeof f.hash !== 'string' || f.hash.length === 0) continue;
    const list = byHash.get(f.hash) || [];
    list.push(f);
    byHash.set(f.hash, list);
  }
  const out = [];
  for (const list of byHash.values()) {
    if (list.length >= 2) {
      list.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
      out.push(list);
    }
  }
  return out;
}

// --- buildChecklistCsv -----------------------------------------------------

const FORMULA_PREFIXES = ['=', '+', '-', '@', '\t', '\r', '\n'];

function csvEscape(value) {
  let s = value == null ? '' : String(value);
  if (s.length > 0 && (FORMULA_PREFIXES.includes(s[0]) || /^[\s\uFEFF]*[=+\-@]/u.test(s))) {
    // Neutralize spreadsheet formula injection with a leading single quote.
    s = "'" + s;
  }
  if (/[",\r\n]/.test(s)) {
    s = '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function statusLabel(code, lang) {
  const en = {
    ok: 'OK',
    missing: 'Missing',
    'not-provided': 'Not provided',
    'expiry-needed': 'Expiry date needed',
    expired: 'Expired',
  };
  const bn = {
    ok: 'ঠিক আছে',
    missing: 'অনুপস্থিত',
    'not-provided': 'প্রদান করা হয়নি',
    'expiry-needed': 'মেয়াদ প্রয়োজন',
    expired: 'মেয়াদ উত্তীর্ণ',
  };
  return (lang === 'bn' ? bn : en)[code] || String(code);
}

function expiryLabel(row, lang) {
  if (row.expiryDate) return row.expiryDate;
  if (row.file && row.requirement && row.requirement.has_expiry) {
    // Expiring requirement that still needs a date — keep a hint so the
    // generated checklist makes the missing field obvious to the operator.
    return lang === 'bn' ? '(প্রয়োজন)' : '(required)';
  }
  // No expiry is needed for this requirement; leave the cell blank.
  return '';
}

export function buildChecklistCsv(rows, lang = 'en') {
  if (!Array.isArray(rows)) {
    throw bad('bad-rows', 'buildChecklistCsv: rows must be an array.');
  }
  const labels = {
    en: { header: ['#', 'Document', 'Filename', 'Pages', 'Expiry', 'Status'] },
    bn: { header: ['#', 'নথি', 'ফাইলের নাম', 'পৃষ্ঠা', 'মেয়াদ', 'অবস্থা'] },
  };
  const bag = labels[lang === 'bn' ? 'bn' : 'en'];
  const lines = [bag.header.map(csvEscape).join(',')];
  const sorted = [...rows].sort((a, b) => a.requirement.order - b.requirement.order);
  sorted.forEach((row, i) => {
    const title = lang === 'bn' ? row.requirement.title_bn : row.requirement.title_en;
    const filename = row.file ? row.file.name : '';
    const pages = row.file ? row.file.pages : '';
    const expiry = expiryLabel(row, lang);
    const status = statusLabel(row.status, lang);
    lines.push(
      [i + 1, title, filename, pages, expiry, status].map(csvEscape).join(',')
    );
  });
  // CRLF line endings keep Excel happy on every platform.
  return lines.join('\r\n') + '\r\n';
}

// Default export for ES module consumers that prefer `import domain from ...`.
export default {
  validateRequirements,
  statusFor,
  assignMatch,
  evaluatePackage,
  duplicateGroups,
  buildChecklistCsv,
  isValidIsoDate,
};
