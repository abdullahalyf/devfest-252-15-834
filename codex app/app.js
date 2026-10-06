import { validateRequirements, assignMatch, evaluatePackage, buildChecklistCsv } from '../puku1/domain.js';
import { renderApp } from '../puku2/ui.js';
import '../puku2/styles.css';
import { inspectPdf, generatePackage } from '../claude/pdf.js';

const MAX_FILES = 30;
const MAX_BYTES = 50 * 1024 * 1024;
const app = document.querySelector('#app');
let epoch = 0;
let state = initialState('en');

function initialState(lang) {
  return { lang, pack: null, files: [], matches: Object.create(null), expiryDates: Object.create(null), busy: false, notice: null, result: null, includeIndex: false };
}

function notice(kind, en, bn) { state.notice = { kind, en, bn }; }

const errorMessages = {
  'invalid-requirements': ['This requirements file is invalid. Check the tender details, document list and dates.', 'প্রয়োজনীয় নথির ফাইলটি সঠিক নয়। টেন্ডারের তথ্য, নথির তালিকা ও তারিখ যাচাই করুন।'],
  'invalid-pdf': ['This file is not a readable PDF, or it is damaged.', 'এই ফাইলটি পাঠযোগ্য PDF নয়, অথবা এটি ক্ষতিগ্রস্ত।'],
  'encrypted-pdf': ['Password-protected PDFs cannot be used. Upload an unlocked copy.', 'পাসওয়ার্ড দিয়ে সুরক্ষিত PDF ব্যবহার করা যাবে না। আনলক করা কপি আপলোড করুন।'],
  'duplicate-file': ['Identical file content is already matched to another document. Undo that match first.', 'একই বিষয়বস্তুর ফাইল অন্য নথির সঙ্গে যুক্ত আছে। আগে সেই সংযোগ সরান।'],
  'duplicate-content': ['Identical file content is already matched to another document. Undo that match first.', 'একই বিষয়বস্তুর ফাইল অন্য নথির সঙ্গে যুক্ত আছে। আগে সেই সংযোগ সরান।'],
  'file-already-matched': ['This file is already used by another document. Undo that match first.', 'এই ফাইলটি অন্য নথির সঙ্গে যুক্ত আছে। আগে সেই সংযোগ সরান।'],
  'unknown-file': ['This file is no longer available. Choose an uploaded file.', 'এই ফাইলটি আর নেই। আপলোড করা ফাইল নির্বাচন করুন।'],
  'unknown-requirement': ['This document is no longer in the current tender. Reload the requirements.', 'এই নথিটি বর্তমান টেন্ডারে নেই। প্রয়োজনীয় নথির তালিকা আবার লোড করুন।'],
};

function translatedError(error) {
  const code = error?.code ?? '';
  if (errorMessages[code]) return errorMessages[code];
  if (/duplicate/i.test(code)) return errorMessages['duplicate-content'];
  if (/already|assigned|matched/i.test(code)) return errorMessages['file-already-matched'];
  if (/requirement|schema|deadline|date|invalid-pack/i.test(code)) return errorMessages['invalid-requirements'];
  return ['The operation could not be completed. Check your input and try again.', 'কাজটি সম্পন্ন করা যায়নি। তথ্য যাচাই করে আবার চেষ্টা করুন।'];
}

function reportError(error, prefix = '') {
  console.error('TenderDesk operation failed:', error?.code ?? error?.name ?? 'error');
  const [en, bn] = translatedError(error);
  notice('error', `${prefix}${en}`, `${prefix}${bn}`);
}

function invalidateResult() {
  if (state.result) URL.revokeObjectURL(state.result.url);
  state.result = null;
}

function summary() {
  if (!state.pack) return null;
  const result = evaluatePackage(state.pack, state.files, state.matches, state.expiryDates);
  result.rows = result.rows.map(row => ({ ...row, expiryDate: Object.hasOwn(state.expiryDates, row.requirement.id) ? state.expiryDates[row.requirement.id] : '' }));
  result.included = result.rows.filter(row => row.file);
  return result;
}

function render() {
  document.documentElement.lang = state.lang === 'bn' ? 'bn' : 'en';
  document.title = state.lang === 'bn' ? 'টেন্ডারডেস্ক — টেন্ডার প্যাকেজ তৈরি' : 'TenderDesk — Tender Package Builder';
  try {
    renderApp(app, { lang: state.lang, pack: state.pack, files: state.files, summary: summary(), busy: state.busy, notice: state.notice, result: state.result, includeIndex: state.includeIndex }, actions);
  } catch (error) {
    console.error('TenderDesk render failed:', error);
    app.replaceChildren();
    const message = document.createElement('p');
    message.textContent = state.lang === 'bn' ? 'অ্যাপ লোড করা যায়নি। পৃষ্ঠাটি রিফ্রেশ করুন।' : 'The app could not load. Please refresh the page.';
    app.append(message);
  }
}

async function onLoadRequirements(file) {
  if (!file || state.busy) return;
  const taskEpoch = epoch;
  state.busy = true;
  state.notice = null;
  render();
  try {
    if (file.size > 2 * 1024 * 1024) throw Object.assign(new Error('Requirements file too large'), { code: 'invalid-requirements' });
    let raw;
    try { raw = JSON.parse(await file.text()); }
    catch { throw Object.assign(new Error('Invalid JSON'), { code: 'invalid-requirements' }); }
    const pack = validateRequirements(raw);
    if (epoch !== taskEpoch) return;
    invalidateResult();
    epoch += 1;
    state = { ...initialState(state.lang), pack };
    notice('success', `Loaded ${pack.requirements.length} document requirements. Upload the PDFs to get started.`, `${pack.requirements.length}টি নথির প্রয়োজনীয়তা লোড হয়েছে। শুরু করতে PDF আপলোড করুন।`);
  } catch (error) {
    if (epoch === taskEpoch) reportError(error);
  } finally {
    if (epoch === taskEpoch || (state.pack && !state.busy)) { state.busy = false; render(); }
  }
}

async function sha256(bytes) {
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

async function onUploadFiles(input) {
  if (state.busy || !state.pack) return;
  const uploads = Array.from(input ?? []);
  if (!uploads.length) return;
  const taskEpoch = epoch;
  state.busy = true;
  state.notice = null;
  render();
  const accepted = [];
  const failures = [];
  let totalBytes = state.files.reduce((sum, file) => sum + file.size, 0);
  for (const file of uploads) {
    if (taskEpoch !== epoch) return;
    if (state.files.length + accepted.length >= MAX_FILES) {
      failures.push({ name: file.name, en: 'Maximum 30 PDF files.', bn: 'সর্বোচ্চ ৩০টি PDF ফাইল।' });
      continue;
    }
    if (file.size + totalBytes > MAX_BYTES) {
      failures.push({ name: file.name, en: 'Total size must not exceed 50 MB.', bn: 'মোট আকার ৫০ MB-এর বেশি হতে পারবে না।' });
      continue;
    }
    if (!/\.pdf$/i.test(file.name) && file.type !== 'application/pdf') {
      failures.push({ name: file.name, en: 'Only PDF documents are allowed.', bn: 'শুধু PDF নথি গ্রহণ করা হয়।' });
      continue;
    }
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const { pages } = await inspectPdf(bytes);
      if (!Number.isInteger(pages) || pages < 1) throw Object.assign(new Error('PDF has no readable pages'), { code: 'invalid-pdf' });
      const hash = await sha256(bytes);
      if (taskEpoch !== epoch) return;
      accepted.push({ id: crypto.randomUUID(), name: file.name, size: file.size, pages, hash, bytes });
      totalBytes += file.size;
    } catch (error) {
      const [en, bn] = translatedError(error);
      failures.push({ name: file.name, en, bn });
    }
  }
  if (taskEpoch !== epoch) return;
  if (accepted.length) {
    invalidateResult();
    state.files = [...state.files, ...accepted];
  }
  if (failures.length) {
    const detailEn = failures.map(item => `${item.name}: ${item.en}`).join(' ');
    const detailBn = failures.map(item => `${item.name}: ${item.bn}`).join(' ');
    notice('error', `${accepted.length} PDF files added. ${detailEn}`, `${accepted.length}টি PDF যোগ হয়েছে। ${detailBn}`);
  } else {
    notice('success', `${accepted.length} PDF files added. Match each file to the correct document below.`, `${accepted.length}টি PDF যোগ হয়েছে। নিচে প্রতিটি ফাইল সঠিক নথির সঙ্গে যুক্ত করুন।`);
  }
  state.busy = false;
  render();
}

function onRemoveFile(fileId) {
  if (state.busy) return;
  invalidateResult();
  state.files = state.files.filter(file => file.id !== fileId);
  for (const [requirementId, matchedId] of Object.entries(state.matches)) {
    if (matchedId === fileId) { delete state.matches[requirementId]; delete state.expiryDates[requirementId]; }
  }
  state.notice = null;
  render();
}

function onMatch(requirementId, fileId) {
  if (state.busy || !state.pack) return;
  try {
    const next = assignMatch(state, requirementId, fileId || null);
    invalidateResult();
    state.matches = next.matches;
    state.expiryDates = next.expiryDates;
    state.notice = null;
  } catch (error) { reportError(error); }
  render();
}

function onExpiry(requirementId, dateString) {
  if (state.busy || !state.pack) return;
  const requirement = state.pack.requirements.find(item => item.id === requirementId);
  if (!requirement?.has_expiry || !Object.hasOwn(state.matches, requirementId)) return;
  invalidateResult();
  const expiryDates = Object.assign(Object.create(null), state.expiryDates);
  expiryDates[requirementId] = dateString;
  state.expiryDates = expiryDates;
  state.notice = null;
  render();
}

function onAutoMatch() {
  if (state.busy || !state.pack) return;
  const ignored = new Set(['pdf', 'cert', 'certificate', 'scan', 'of', 'the', 'and']);
  const tokens = value => new Set((String(value).toLowerCase().match(/[a-z]+/g) || []).filter(token => !ignored.has(token)));
  const used = new Set(state.files.filter(file => Object.values(state.matches).includes(file.id)).map(file => file.hash));
  const groups = new Map();
  for (const file of state.files) {
    if (used.has(file.hash)) continue;
    if (!groups.has(file.hash)) groups.set(file.hash, []);
    groups.get(file.hash).push(file);
  }
  const choices = [];
  for (const requirement of state.pack.requirements) {
    if (Object.hasOwn(state.matches, requirement.id) && state.matches[requirement.id]) continue;
    const title = tokens(requirement.title_en);
    let best = 0, candidates = [];
    for (const [hash, files] of groups) {
      const score = Math.max(...files.map(file => [...tokens(file.name)].filter(token => title.has(token)).length));
      if (score > best) { best = score; candidates = [{ hash, file: files.reduce((first, file) => file.name.length < first.name.length ? file : first, files[0]) }]; }
      else if (score > 0 && score === best) candidates.push({ hash, file: files.reduce((first, file) => file.name.length < first.name.length ? file : first, files[0]) });
    }
    if (best > 0 && candidates.length === 1) choices.push({ requirement, score: best, ...candidates[0] });
  }
  choices.sort((a, b) => b.score - a.score || a.requirement.order - b.requirement.order);
  let matched = 0;
  for (const choice of choices) {
    if (used.has(choice.hash)) continue;
    const next = assignMatch(state, choice.requirement.id, choice.file.id);
    state.matches = next.matches;
    state.expiryDates = next.expiryDates;
    used.add(choice.hash);
    matched += 1;
  }
  if (matched) invalidateResult();
  notice('success', `${matched} matched automatically; please review and enter expiry dates.`, `${matched}টি স্বয়ংক্রিয়ভাবে মিলেছে; অনুগ্রহ করে যাচাই করুন এবং মেয়াদের তারিখ দিন।`);
  render();
}

function onLanguage(lang) {
  if (lang !== 'en' && lang !== 'bn') return;
  state.lang = lang;
  render();
}

function onReset() {
  epoch += 1;
  invalidateResult();
  state = initialState(state.lang);
  render();
}

function onToggleIndex(enabled) {
  if (state.busy) return;
  invalidateResult();
  state.includeIndex = Boolean(enabled);
  state.notice = null;
  render();
}

async function onGenerate() {
  if (state.busy || !state.pack) return;
  const currentSummary = summary();
  if (!currentSummary?.canGenerate) {
    notice('error', 'Resolve all missing documents and expiry issues before generating.', 'প্যাকেজ তৈরির আগে সব অনুপস্থিত নথি ও মেয়াদের সমস্যা সমাধান করুন।');
    render();
    return;
  }
  const taskEpoch = epoch;
  state.busy = true;
  state.notice = null;
  invalidateResult();
  render();
  try {
    const generated = await generatePackage({ pack: state.pack, included: currentSummary.included, expiryDates: state.expiryDates, includeIndex: state.includeIndex, generatedAt: new Date() });
    if (taskEpoch !== epoch) return;
    const url = URL.createObjectURL(new Blob([generated.bytes], { type: 'application/pdf' }));
    state.result = { url, filename: generated.filename, pageCount: generated.pageCount };
    notice('success', `Your ${generated.pageCount}-page package is ready. Download and review it before submission.`, `${generated.pageCount} পৃষ্ঠার প্যাকেজ তৈরি হয়েছে। জমা দেওয়ার আগে ডাউনলোড করে যাচাই করুন।`);
  } catch (error) {
    if (taskEpoch === epoch) reportError(error);
  } finally {
    if (taskEpoch === epoch) { state.busy = false; render(); }
  }
}

function onExportCsv() {
  if (state.busy || !state.pack) return;
  try {
    const csv = buildChecklistCsv(summary().rows, state.lang);
    const url = URL.createObjectURL(new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${state.pack.tender.tender_id.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')}_Checklist.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    notice('success', 'Checklist CSV downloaded.', 'চেকলিস্ট CSV ডাউনলোড হয়েছে।');
  } catch (error) { reportError(error); }
  render();
}

const actions = { onLoadRequirements, onUploadFiles, onRemoveFile, onMatch, onExpiry, onLanguage, onReset, onGenerate, onToggleIndex, onExportCsv, onAutoMatch };
window.addEventListener('pagehide', invalidateResult);
window.addEventListener('pageshow', event => { if (event.persisted) render(); });
render();
