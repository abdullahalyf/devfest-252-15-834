// PDF inspection and tender package generation. Runs fully in browser memory
// (also under Node for tests). Never sends document bytes anywhere.
import * as PDFLib from 'pdf-lib';

const { PDFDocument, StandardFonts, rgb, degrees } = PDFLib;

// Reserved footer band height (PDF points) added below every embedded source page.
export const FOOTER_BAND = 36;

const A4 = [595.28, 841.89];
const MARGIN = 56;
const INK = rgb(0.1, 0.12, 0.16);
const MUTED = rgb(0.38, 0.42, 0.48);
const TEAL = rgb(0.05, 0.45, 0.45);
const RULE = rgb(0.75, 0.78, 0.8);
const LOAD_OPTIONS = { ignoreEncryption: false, throwOnInvalidObject: true, updateMetadata: false };

function fail(code, message, cause) {
  const error = new Error(message);
  error.code = code;
  if (cause) error.cause = cause;
  return error;
}

function toBytes(input) {
  if (input instanceof Uint8Array) return input;
  if (input instanceof ArrayBuffer) return new Uint8Array(input);
  return null;
}

function hasPdfHeader(bytes) {
  const limit = Math.min(bytes.length - 5, 1024);
  for (let i = 0; i <= limit; i += 1) {
    if (bytes[i] === 0x25 && bytes[i + 1] === 0x50 && bytes[i + 2] === 0x44 && bytes[i + 3] === 0x46 && bytes[i + 4] === 0x2d) {
      return true;
    }
  }
  return false;
}

function isEncryptionError(error) {
  if (PDFLib.EncryptedPDFError && error instanceof PDFLib.EncryptedPDFError) return true;
  return /encrypt/i.test(String(error && error.message));
}

// Parses a copy of the bytes so callers' source data can never be mutated.
async function loadStrict(input, label = 'PDF') {
  const bytes = toBytes(input);
  if (!bytes || bytes.length === 0) throw fail('invalid-pdf', `${label} is empty or not binary data.`);
  if (!hasPdfHeader(bytes)) throw fail('invalid-pdf', `${label} is not a PDF file (missing %PDF header).`);
  let doc;
  try {
    doc = await PDFDocument.load(bytes.slice(), LOAD_OPTIONS);
  } catch (error) {
    if (isEncryptionError(error)) throw fail('encrypted-pdf', `${label} is password-protected or encrypted.`, error);
    throw fail('invalid-pdf', `${label} is damaged or cannot be parsed.`, error);
  }
  if (doc.isEncrypted) throw fail('encrypted-pdf', `${label} is password-protected or encrypted.`);
  let count;
  try {
    count = doc.getPageCount();
    if (!Number.isInteger(count) || count < 1) throw new Error('no pages');
    for (const page of doc.getPages()) {
      const box = visibleBox(page);
      if (!(box.width > 0 && box.height > 0)) throw new Error('page has no visible area');
    }
  } catch (error) {
    throw fail('invalid-pdf', `${label} has no readable pages.`, error);
  }
  return doc;
}

export async function inspectPdf(bytes) {
  const doc = await loadStrict(bytes);
  return { pages: doc.getPageCount() };
}

// Visible area = crop box intersected with media box (PDF spec default).
function visibleBox(page) {
  const media = page.getMediaBox();
  const crop = typeof page.getCropBox === 'function' ? page.getCropBox() : media;
  const left = Math.max(media.x, crop.x);
  const bottom = Math.max(media.y, crop.y);
  const right = Math.min(media.x + media.width, crop.x + crop.width);
  const top = Math.min(media.y + media.height, crop.y + crop.height);
  if (right > left && top > bottom) return { left, bottom, right, top, width: right - left, height: top - bottom };
  return { left: media.x, bottom: media.y, right: media.x + media.width, top: media.y + media.height, width: media.width, height: media.height };
}

function normalizedRotation(page) {
  const angle = Number(page.getRotation().angle) || 0;
  return ((Math.round(angle / 90) * 90) % 360 + 360) % 360;
}

// ---------- text safety ----------

const REPLACEMENTS = { '‘': "'", '’': "'", '“': '"', '”': '"', '–': '-', '—': '-', '…': '...', ' ': ' ' };

function makeSanitizer(font) {
  const cache = new Map();
  const encodable = (ch) => {
    if (!cache.has(ch)) {
      let ok = true;
      try { font.encodeText(ch); font.widthOfTextAtSize(ch, 10); } catch { ok = false; }
      cache.set(ch, ok);
    }
    return cache.get(ch);
  };
  // Standard 14 fonts only cover WinAnsi. Unsupported characters (e.g. Bangla)
  // fall back to their accent-stripped form, otherwise to '?', so the cover never crashes.
  return (value) => {
    const raw = String(value ?? '').replace(/[\u0000-\u001f\u007f-\u009f]+/g, ' ');
    let out = '';
    for (const ch of Array.from(raw)) {
      const mapped = REPLACEMENTS[ch] ?? ch;
      if (encodable(mapped)) { out += mapped; continue; }
      const base = mapped.normalize('NFKD').replace(/[̀-ͯ]/g, '');
      out += base && Array.from(base).every(encodable) ? base : '?';
    }
    return out.replace(/\s+/g, ' ').trim();
  };
}

function wrapText(text, font, size, maxWidth) {
  const words = text.split(' ').filter(Boolean);
  const lines = [];
  let line = '';
  const push = (word) => {
    // Break single words wider than the column.
    let chunk = '';
    for (const ch of Array.from(word)) {
      if (chunk && font.widthOfTextAtSize(chunk + ch, size) > maxWidth) { lines.push(chunk); chunk = ''; }
      chunk += ch;
    }
    return chunk;
  };
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) { line = candidate; continue; }
    if (line) lines.push(line);
    line = font.widthOfTextAtSize(word, size) <= maxWidth ? word : push(word);
  }
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}

function capLines(lines, max, font, size, maxWidth) {
  if (lines.length <= max) return lines;
  const kept = lines.slice(0, max);
  let last = kept[max - 1];
  while (last && font.widthOfTextAtSize(`${last}...`, size) > maxWidth) last = last.slice(0, -1);
  kept[max - 1] = `${last}...`;
  return kept;
}

// ---------- validation ----------

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
function isValidDate(value) {
  const m = typeof value === 'string' && DATE_RE.exec(value);
  if (!m) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
}

function sameBytes(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) if (a[i] !== b[i]) return false;
  return true;
}

function validateInput(pack, included, expiryDates, generatedAt) {
  const tender = pack && pack.tender;
  if (!tender || typeof tender !== 'object') throw fail('invalid-input', 'Tender details are missing.');
  for (const key of ['tender_id', 'title', 'procuring_entity', 'bidder', 'submission_deadline']) {
    if (typeof tender[key] !== 'string' || !tender[key].trim()) throw fail('invalid-input', `Tender field "${key}" is missing.`);
  }
  if (!isValidDate(tender.submission_deadline)) throw fail('invalid-input', 'Submission deadline is not a valid YYYY-MM-DD date.');
  if (!(generatedAt instanceof Date) || Number.isNaN(generatedAt.getTime())) throw fail('invalid-input', 'Generation date is invalid.');
  if (!expiryDates || typeof expiryDates !== 'object') throw fail('invalid-input', 'Expiry dates are invalid.');

  // The loaded pack is authoritative; included rows are only trusted for their file.
  if (!Array.isArray(pack.requirements) || pack.requirements.length === 0) throw fail('invalid-input', 'The requirement list is empty.');
  const authority = new Map();
  const packOrders = new Set();
  for (const req of pack.requirements) {
    if (!req || typeof req.id !== 'string' || !req.id || !Number.isInteger(req.order) || req.order < 1
      || typeof req.title_en !== 'string' || typeof req.mandatory !== 'boolean' || typeof req.has_expiry !== 'boolean') {
      throw fail('invalid-input', 'The requirement list contains an invalid requirement.');
    }
    if (authority.has(req.id) || packOrders.has(req.order)) throw fail('invalid-input', `Requirement ${req.id} is defined more than once.`);
    authority.set(req.id, req);
    packOrders.add(req.order);
  }
  // Matches domain evaluatePackage: a package with no documents is never generatable.
  if (!Array.isArray(included) || included.length === 0) throw fail('no-documents', 'No documents are included in the package.');

  const rows = [];
  const reqIds = new Set();
  const fileIds = new Set();
  const hashes = new Set();
  for (const row of included) {
    const given = row && row.requirement;
    const file = row && row.file;
    const req = given && authority.get(given.id);
    if (!req) throw fail('unknown-requirement', `Included requirement ${given && given.id} is not in the loaded requirement list.`);
    if (reqIds.has(req.id)) throw fail('duplicate-requirement', `Requirement ${req.id} is included more than once.`);
    reqIds.add(req.id);
    for (const key of ['order', 'title_en', 'mandatory', 'has_expiry']) {
      if (given[key] !== req[key]) throw fail('requirement-mismatch', `Included requirement ${req.id} does not match the loaded requirement (${key}).`);
    }
    rows.push({ requirement: req, file });
    if (!file || !(file.bytes instanceof Uint8Array) || file.bytes.length === 0) throw fail('invalid-input', `Requirement ${req.id} has no document bytes.`);
    if (fileIds.has(file.id)) throw fail('duplicate-content', `File ${file.name} is matched to more than one requirement.`);
    fileIds.add(file.id);
    if (typeof file.hash === 'string' && file.hash) {
      if (hashes.has(file.hash)) throw fail('duplicate-content', `File ${file.name} duplicates the contents of another included file.`);
      hashes.add(file.hash);
    }
    if (req.has_expiry === true) {
      const expiry = expiryDates[req.id];
      if (!isValidDate(expiry)) throw fail('expiry-needed', `${req.title_en} needs a valid expiry date.`);
      if (expiry < tender.submission_deadline) throw fail('expired', `${req.title_en} expires before the submission deadline.`);
    }
  }
  const missing = pack.requirements.filter((req) => req.mandatory && !reqIds.has(req.id));
  if (missing.length) {
    throw fail('missing-mandatory', `Mandatory documents are missing: ${missing.slice().sort((a, b) => a.order - b.order).map((r) => r.title_en).join(', ')}.`);
  }
  // Byte-level duplicate check independent of supplied hashes.
  for (let i = 0; i < rows.length; i += 1) {
    for (let j = i + 1; j < rows.length; j += 1) {
      if (sameBytes(rows[i].file.bytes, rows[j].file.bytes)) {
        throw fail('duplicate-content', `${rows[i].file.name} and ${rows[j].file.name} have identical contents.`);
      }
    }
  }
  rows.sort((a, b) => a.requirement.order - b.requirement.order);
  return rows;
}

export function packageFilename(tenderId) {
  const safe = String(tenderId ?? '').replace(/[\\/:*?"<>|\u0000-\u001f\u007f]/g, '_').trim().replace(/^\.+/, '');
  return `${safe || 'tender'}_Package.pdf`;
}

function formatGeneratedAt(date) {
  const pad = (n) => String(n).padStart(2, '0');
  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const abs = Math.abs(offset);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())} (UTC${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)})`;
}

// ---------- cover ----------

function layoutCover(ctx, scale, maxItemLines) {
  const { fonts, clean, tender, docs, generatedText } = ctx;
  const [W, H] = A4;
  const width = W - MARGIN * 2;
  const bottomLimit = FOOTER_BAND + 24;
  const ops = [];
  let y = H - MARGIN;
  const text = (str, x, size, font, color) => ops.push({ str, x, y, size, font, color });

  const s = (n) => n * scale;
  y -= s(20);
  text('TENDER SUBMISSION PACKAGE', MARGIN, s(20), fonts.bold, TEAL);
  y -= s(10);
  ops.push({ line: true, y, x1: MARGIN, x2: W - MARGIN, color: TEAL, thickness: 1.2 });
  y -= s(22);

  const labelWidth = 130;
  const fields = [
    ['Tender ID', tender.tender_id],
    ['Tender Title', tender.title],
    ['Procuring Entity', tender.procuring_entity],
    ['Bidder', tender.bidder],
    ['Submission Deadline', tender.submission_deadline],
    ['Package Created', generatedText],
  ];
  const fieldSize = s(11);
  for (const [label, value] of fields) {
    const lines = capLines(wrapText(clean(value), fonts.regular, fieldSize, width - labelWidth), 4, fonts.regular, fieldSize, width - labelWidth);
    text(label, MARGIN, s(10), fonts.bold, MUTED);
    for (const line of lines) {
      text(line, MARGIN + labelWidth, fieldSize, fonts.regular, INK);
      y -= fieldSize * 1.4;
    }
    y -= s(4);
  }

  y -= s(14);
  text(`Included Documents (${docs.length}, in submission order)`, MARGIN, s(13), fonts.bold, INK);
  y -= s(8);
  ops.push({ line: true, y, x1: MARGIN, x2: W - MARGIN, color: RULE, thickness: 0.6 });
  y -= s(16);

  const itemSize = s(11);
  const detailSize = s(8.5);
  const indent = 24;
  for (const doc of docs) {
    const titleLines = capLines(wrapText(clean(doc.title), fonts.bold, itemSize, width - indent), maxItemLines, fonts.bold, itemSize, width - indent);
    const detail = `File: ${clean(doc.fileName)} | ${doc.pages} page${doc.pages === 1 ? '' : 's'} | Package pages ${doc.start}-${doc.end}${doc.expiry ? ` | Expiry ${doc.expiry}` : ''}`;
    const detailLines = capLines(wrapText(detail, fonts.regular, detailSize, width - indent), maxItemLines, fonts.regular, detailSize, width - indent);
    text(`${doc.number}.`, MARGIN, itemSize, fonts.bold, TEAL);
    for (const line of titleLines) { text(line, MARGIN + indent, itemSize, fonts.bold, INK); y -= itemSize * 1.3; }
    for (const line of detailLines) { text(line, MARGIN + indent, detailSize, fonts.regular, MUTED); y -= detailSize * 1.35; }
    y -= s(6);
  }
  return { ops, fits: y >= bottomLimit };
}

function drawOps(page, ops) {
  for (const op of ops) {
    if (op.line) page.drawLine({ start: { x: op.x1, y: op.y }, end: { x: op.x2, y: op.y }, thickness: op.thickness, color: op.color });
    else page.drawText(op.str, { x: op.x, y: op.y, size: op.size, font: op.font, color: op.color });
  }
}

function drawCover(out, ctx) {
  let chosen = null;
  for (const maxItemLines of [3, 2, 1]) {
    for (const scale of [1, 0.9, 0.8, 0.7, 0.6, 0.5]) {
      const layout = layoutCover(ctx, scale, maxItemLines);
      if (layout.fits) { chosen = layout; break; }
    }
    if (chosen) break;
  }
  if (!chosen) throw fail('cover-overflow', 'Too many documents to list on the cover page.');
  const page = out.addPage(A4);
  drawOps(page, chosen.ops);
  return page;
}

// ---------- optional index ----------

function layoutIndex(ctx) {
  const { fonts, clean, docs } = ctx;
  const [W, H] = A4;
  const size = 11;
  const numberCol = 90;
  const titleWidth = W - MARGIN * 2 - 24 - numberCol;
  const bottomLimit = FOOTER_BAND + 24;
  const pages = [];
  let ops = [];
  let y = 0;
  const startPage = (first) => {
    ops = [];
    pages.push(ops);
    y = H - MARGIN - 20;
    ops.push({ str: first ? 'DOCUMENT INDEX' : 'DOCUMENT INDEX (continued)', x: MARGIN, y, size: 18, font: fonts.bold, color: TEAL });
    y -= 10;
    ops.push({ line: true, y, x1: MARGIN, x2: W - MARGIN, color: TEAL, thickness: 1.2 });
    y -= 22;
    ops.push({ str: 'Document', x: MARGIN + 24, y, size: 9, font: fonts.bold, color: MUTED });
    ops.push({ str: 'Pages', x: W - MARGIN - numberCol, y, size: 9, font: fonts.bold, color: MUTED });
    y -= 18;
  };
  startPage(true);
  for (const doc of docs) {
    const lines = capLines(wrapText(clean(doc.title), fonts.regular, size, titleWidth), 3, fonts.regular, size, titleWidth);
    const needed = lines.length * size * 1.4 + 6;
    if (y - needed < bottomLimit) startPage(false);
    ops.push({ str: `${doc.number}.`, x: MARGIN, y, size, font: fonts.bold, color: TEAL });
    ops.push({ pageRef: doc, x: W - MARGIN - numberCol, y, size, font: fonts.regular, color: INK });
    for (const line of lines) { ops.push({ str: line, x: MARGIN + 24, y, size, font: fonts.regular, color: INK }); y -= size * 1.4; }
    y -= 6;
  }
  return pages;
}

// ---------- main ----------

export async function generatePackage({ pack, included, expiryDates = {}, includeIndex = false, generatedAt = new Date(), logoBytes } = {}) {
  const rows = validateInput(pack, included, expiryDates, generatedAt);
  const tender = pack.tender;

  // Parse every source first so any bad document fails before output is built.
  const sources = [];
  for (const row of rows) {
    const doc = await loadStrict(row.file.bytes, `"${row.file.name}"`);
    const pages = doc.getPageCount();
    if (Number.isInteger(row.file.pages) && row.file.pages !== pages) {
      throw fail('page-count-mismatch', `"${row.file.name}" has ${pages} pages, expected ${row.file.pages}.`);
    }
    sources.push({ row, doc, pages });
  }

  const out = await PDFDocument.create();
  const fonts = { regular: await out.embedFont(StandardFonts.Helvetica), bold: await out.embedFont(StandardFonts.HelveticaBold) };
  const clean = makeSanitizer(fonts.regular);
  const docs = sources.map((src, i) => ({
    number: i + 1,
    title: src.row.requirement.title_en,
    fileName: src.row.file.name,
    pages: src.pages,
    expiry: src.row.requirement.has_expiry === true ? expiryDates[src.row.requirement.id] : '',
  }));
  const ctx = { fonts, clean, tender, docs, generatedText: formatGeneratedAt(generatedAt) };

  const indexPages = includeIndex ? layoutIndex(ctx) : [];
  let next = 1 + indexPages.length + 1;
  for (const doc of docs) { doc.start = next; doc.end = next + doc.pages - 1; next = doc.end + 1; }
  const total = next - 1;

  drawCover(out, ctx);
  if (logoBytes) {
    const logo = await out.embedPng(logoBytes);
    const size = logo.scale(40 / Math.max(logo.width, logo.height));
    out.getPage(0).drawImage(logo, { x: A4[0] - MARGIN - size.width, y: A4[1] - MARGIN + 4, ...size });
  }
  for (const ops of indexPages) {
    const page = out.addPage(A4);
    drawOps(page, ops.map((op) => (op.pageRef ? { ...op, str: op.pageRef.start === op.pageRef.end ? `${op.pageRef.start}` : `${op.pageRef.start}-${op.pageRef.end}` } : op)));
  }

  for (const { doc } of sources) {
    for (const srcPage of doc.getPages()) {
      const box = visibleBox(srcPage);
      const rotation = normalizedRotation(srcPage);
      const embedded = await out.embedPage(srcPage, { left: box.left, bottom: box.bottom, right: box.right, top: box.top });
      const w = box.width;
      const h = box.height;
      const sideways = rotation === 90 || rotation === 270;
      const pageW = sideways ? h : w;
      const pageH = (sideways ? w : h) + FOOTER_BAND;
      const page = out.addPage([pageW, pageH]);
      // /Rotate is clockwise; drawPage rotates counter-clockwise around (x, y).
      const placement = {
        0: { x: 0, y: FOOTER_BAND },
        90: { x: 0, y: FOOTER_BAND + w },
        180: { x: w, y: FOOTER_BAND + h },
        270: { x: h, y: FOOTER_BAND },
      }[rotation];
      page.drawPage(embedded, { x: placement.x, y: placement.y, width: w, height: h, rotate: degrees(-rotation) });
    }
  }

  const pages = out.getPages();
  if (pages.length !== total) throw fail('page-count-mismatch', `Package has ${pages.length} pages, expected ${total}.`);
  const footerId = clean(tender.tender_id) || 'Tender';
  pages.forEach((page, i) => {
    const { width } = page.getSize();
    const label = `${footerId} | Page ${i + 1} of ${total}`;
    let size = 9;
    while (size > 5 && fonts.regular.widthOfTextAtSize(label, size) > width - 24) size -= 0.5;
    page.drawLine({ start: { x: 12, y: FOOTER_BAND - 8 }, end: { x: width - 12, y: FOOTER_BAND - 8 }, thickness: 0.5, color: RULE });
    const textWidth = fonts.regular.widthOfTextAtSize(label, size);
    page.drawText(label, { x: (width - textWidth) / 2, y: 13, size, font: fonts.regular, color: MUTED });
  });

  out.setTitle(`${tender.tender_id} Tender Submission Package`);
  out.setSubject(tender.title);
  out.setAuthor(tender.bidder);
  out.setCreator('Tender Document Package Builder');
  out.setProducer('pdf-lib');
  out.setCreationDate(generatedAt);
  out.setModificationDate(generatedAt);

  const bytes = await out.save();
  return { bytes, filename: packageFilename(tender.tender_id), pageCount: total };
}
