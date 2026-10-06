// puku2/ui.js
// TenderDesk — bilingual responsive browser UI for the Tender Document Package Builder.
// Exports renderApp(container, view, actions). No domain mutations, no PDF imports,
// no global state ownership. All side effects are coordinator callbacks.
//
// Contract summary (see docs/CONTRACT.md):
//   view = { lang, pack, files, summary, busy, notice, result, includeIndex }
//   actions = { onLoadRequirements, onUploadFiles, onRemoveFile, onMatch,
//               onExpiry, onLanguage, onReset, onGenerate, onToggleIndex,
//               onExportCsv }
// Translation source-of-truth: view.pack.requirements[*].title_en / title_bn
// Notice localisation: { kind, en, bn }
// All imported text is rendered with text nodes; never as HTML.

const PREFIX = 'tp-';

// ---------- i18n strings (UI chrome only; document titles come from pack) -----

const STRINGS = {
  en: {
    brand: 'TenderDesk',
    appTitle: 'Tender Document Package Builder',
    appSubtitle: 'Check, order and package tender documents privately in your browser.',
    stepsLabel: 'Progress',
    stepShort: ['Requirements', 'Documents', 'Match & check', 'Generate'],
    step1: '1. Load requirements',
    step2: '2. Upload documents',
    step3: '3. Match & validate',
    step4: '4. Generate package',
    loadRequirements: 'Load requirements JSON',
    replaceRequirements: 'Replace requirements JSON',
    noPack: 'No requirements loaded yet. Choose the tender requirements JSON file to begin.',
    loadFirst: 'Load the requirements JSON (step 1) to begin. Nothing can be checked yet.',
    uploadPdfs: 'Choose PDF documents',
    dropTitle: 'Drop PDF files here or press to browse',
    uploadHint: 'PDF only. Up to 30 files, 50 MiB total. Files never leave this browser.',
    uploadedFiles: 'Uploaded documents',
    noFiles: 'No documents uploaded yet.',
    filePages: (n) => `${n} page${n === 1 ? '' : 's'}`,
    fileSize: (b) => {
      if (b < 1024) return `${b} B`;
      if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
      return `${(b / (1024 * 1024)).toFixed(1)} MB`;
    },
    remove: 'Remove',
    duplicate: 'Duplicate content',
    matchLabel: 'Match document',
    noneOption: '— Not provided —',
    undo: 'Undo match',
    expiryLabel: 'Expiry date (YYYY-MM-DD)',
    expiryHelp: (d) => (d ? `Must be on or after the deadline (${d}).` : 'Must be on or after the tender deadline.'),
    noExpiry: 'No expiry',
    status: {
      ok: 'OK',
      missing: 'Missing',
      'expiry-needed': 'Expiry date needed',
      expired: 'Expired',
      'not-provided': 'Not provided',
    },
    mandatory: 'Mandatory',
    optional: 'Optional',
    hasExpiry: 'Has expiry',
    readiness: (ok, total) => `${ok} of ${total} mandatory ready`,
    blockersTitle: 'Blocking issues',
    noBlockers: 'All mandatory requirements are satisfied.',
    fixBlockers: (n) => `Resolve ${n} blocking issue${n === 1 ? '' : 's'} to enable generation.`,
    includedTitle: 'Included documents',
    pageCount: (n, p) => `${n} document${n === 1 ? '' : 's'}, ${p} page${p === 1 ? '' : 's'} with cover`,
    totalPages: 'Total pages',
    includeIndex: 'Include document index page',
    generate: 'Generate package',
    generating: 'Working…',
    download: 'Download package',
    exportCsv: 'Export checklist (CSV)',
    reset: 'Reset / new project',
    language: 'বাংলা',
    languageAria: 'Switch language to Bangla',
    tender: 'Tender',
    tenderTitle: 'Title',
    procuringEntity: 'Procuring entity',
    bidder: 'Bidder',
    deadline: 'Submission deadline',
    tenderId: 'Tender ID',
    requirementsTitle: 'Requirements',
    matchColumn: 'Matched document',
    statusColumn: 'Status',
    expiryColumn: 'Expiry',
    actionsColumn: 'Actions',
    resultReady: 'Package ready',
    resultFilename: 'Filename',
    resultPages: 'Pages',
    footer: 'TenderDesk · All processing happens locally in this browser.',
  },
  bn: {
    brand: 'টেন্ডারডেস্ক',
    appTitle: 'টেন্ডার ডকুমেন্ট প্যাকেজ বিল্ডার',
    appSubtitle: 'ব্রাউজারেই গোপনে টেন্ডারের ডকুমেন্ট যাচাই, সাজানো ও প্যাকেজ করুন।',
    stepsLabel: 'অগ্রগতি',
    stepShort: ['প্রয়োজনীয়তা', 'ডকুমেন্ট', 'মিলান ও যাচাই', 'তৈরি'],
    step1: '১. প্রয়োজনীয়তা লোড করুন',
    step2: '২. ডকুমেন্ট আপলোড করুন',
    step3: '৩. মিলান ও যাচাই করুন',
    step4: '৪. প্যাকেজ তৈরি করুন',
    loadRequirements: 'প্রয়োজনীয়তা JSON লোড করুন',
    replaceRequirements: 'প্রয়োজনীয়তা JSON বদলান',
    noPack: 'এখনও কোনো প্রয়োজনীয়তা লোড করা হয়নি। শুরু করতে টেন্ডারের প্রয়োজনীয়তা JSON ফাইল বেছে নিন।',
    loadFirst: 'শুরু করতে প্রয়োজনীয়তা JSON (ধাপ ১) লোড করুন। এখনও কিছু যাচাই করা যাচ্ছে না।',
    uploadPdfs: 'PDF ডকুমেন্ট বেছে নিন',
    dropTitle: 'PDF ফাইল এখানে ছেড়ে দিন অথবা চাপ দিয়ে বেছে নিন',
    uploadHint: 'শুধু PDF। সর্বোচ্চ ৩০টি ফাইল, মোট ৫০ MiB। ফাইল এই ব্রাউজারের বাইরে যায় না।',
    uploadedFiles: 'আপলোড করা ডকুমেন্ট',
    noFiles: 'এখনও কোনো ডকুমেন্ট আপলোড করা হয়নি।',
    filePages: (n) => `${n}টি পৃষ্ঠা`,
    fileSize: (b) => {
      if (b < 1024) return `${b} বাইট`;
      if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} কিবি`;
      return `${(b / (1024 * 1024)).toFixed(1)} মেবি`;
    },
    remove: 'মুছুন',
    duplicate: 'একই বিষয়বস্তু',
    matchLabel: 'ডকুমেন্ট মিলান',
    noneOption: '— প্রদান করা হয়নি —',
    undo: 'মিল বাতিল',
    expiryLabel: 'মেয়াদ শেষের তারিখ (YYYY-MM-DD)',
    expiryHelp: (d) => (d ? `জমা শেষ তারিখ (${d}) এর দিন বা তার পরে হতে হবে।` : 'টেন্ডারের জমা শেষ তারিখের দিন বা তার পরে হতে হবে।'),
    noExpiry: 'মেয়াদ নেই',
    status: {
      ok: 'ঠিক আছে',
      missing: 'অনুপস্থিত',
      'expiry-needed': 'মেয়াদের তারিখ প্রয়োজন',
      expired: 'মেয়াদোত্তীর্ণ',
      'not-provided': 'প্রদান করা হয়নি',
    },
    mandatory: 'বাধ্যতামূলক',
    optional: 'ঐচ্ছিক',
    hasExpiry: 'মেয়াদ আছে',
    readiness: (ok, total) => `${total}টির মধ্যে ${ok}টি বাধ্যতামূলক প্রস্তুত`,
    blockersTitle: 'বাধাগুলি',
    noBlockers: 'সমস্ত বাধ্যতামূলক প্রয়োজনীয়তা পূরণ হয়েছে।',
    fixBlockers: (n) => `প্যাকেজ তৈরি করতে ${n}টি বাধা সমাধান করুন।`,
    includedTitle: 'অন্তর্ভুক্ত ডকুমেন্ট',
    pageCount: (n, p) => `${n}টি ডকুমেন্ট, প্রচ্ছদসহ ${p}টি পৃষ্ঠা`,
    totalPages: 'মোট পৃষ্ঠা',
    includeIndex: 'ডকুমেন্ট সূচিপত্র অন্তর্ভুক্ত করুন',
    generate: 'প্যাকেজ তৈরি করুন',
    generating: 'কাজ চলছে…',
    download: 'প্যাকেজ ডাউনলোড করুন',
    exportCsv: 'চেকলিস্ট রপ্তানি (CSV)',
    reset: 'রিসেট / নতুন প্রকল্প',
    language: 'English',
    languageAria: 'Switch language to English / ভাষা ইংরেজিতে বদলান',
    tender: 'টেন্ডার',
    tenderTitle: 'শিরোনাম',
    procuringEntity: 'ক্রয়কারী সংস্থা',
    bidder: 'দরপ্রস্তুতদাতা',
    deadline: 'জমা শেষ তারিখ',
    tenderId: 'টেন্ডার আইডি',
    requirementsTitle: 'প্রয়োজনীয়তা',
    matchColumn: 'মিলানো ডকুমেন্ট',
    statusColumn: 'অবস্থা',
    expiryColumn: 'মেয়াদ',
    actionsColumn: 'কার্যক্রম',
    resultReady: 'প্যাকেজ প্রস্তুত',
    resultFilename: 'ফাইলের নাম',
    resultPages: 'পৃষ্ঠা সংখ্যা',
    footer: 'টেন্ডারডেস্ক · সব প্রক্রিয়া এই ব্রাউজারেই হয়।',
  },
};

const STATUS_ICON = { ok: '✓', missing: '✕', 'expiry-needed': '!', expired: '✕', 'not-provided': '–' };

function t(lang) {
  return STRINGS[lang] || STRINGS.en;
}

// ---------- small DOM helpers ----------

function el(tag, attrs, children) {
  const node = document.createElement(tag);
  if (attrs) {
    for (const k in attrs) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'class') node.className = v;
      else if (k === 'dataset') {
        for (const dk in v) node.dataset[dk] = v[dk];
      } else if (k === 'style' && typeof v === 'object') {
        for (const sk in v) node.style[sk] = v[sk];
      } else if (k.startsWith('on') && typeof v === 'function') {
        const type = k.slice(2).toLowerCase();
        node.addEventListener(type, v);
        // Remembered so a kept node can swap to the fresh render's handlers.
        (node._tpOn || (node._tpOn = {}))[type] = v;
      } else if (k === 'html') {
        // Explicitly disallowed: we never use this for imported strings.
        throw new Error('html insertion is not permitted');
      } else if (k === 'value' || k === 'checked' || k === 'selected' || k === 'disabled' || k === 'readOnly') {
        node[k] = v;
      } else if (v === true) {
        node.setAttribute(k, '');
      } else {
        node.setAttribute(k, String(v));
      }
    }
  }
  if (children != null) {
    const arr = Array.isArray(children) ? children : [children];
    for (const c of arr) {
      if (c == null || c === false) continue;
      if (typeof c === 'string' || typeof c === 'number') {
        node.appendChild(document.createTextNode(String(c)));
      } else {
        node.appendChild(c);
      }
    }
  }
  return node;
}

function txt(s) {
  return document.createTextNode(s == null ? '' : String(s));
}

// Preserve focus + selection across re-render.
function captureFocus(container) {
  const ae = document.activeElement;
  if (!ae || !container.contains(ae)) return null;
  const id = ae.id;
  if (!id) return null;
  let extra = null;
  if (ae.tagName === 'INPUT' && (ae.type === 'date' || ae.type === 'text')) {
    try { extra = { start: ae.selectionStart, end: ae.selectionEnd }; } catch (_) { extra = null; }
  }
  return { id, extra };
}

function restoreFocus(container, cap) {
  if (!cap) return;
  const tgt = container.querySelector('#' + CSS.escape(cap.id));
  if (!tgt || tgt.disabled) return;
  tgt.focus({ preventScroll: true });
  if (cap.extra && typeof tgt.setSelectionRange === 'function') {
    try { tgt.setSelectionRange(cap.extra.start, cap.extra.end); } catch (_) { /* ignore */ }
  }
}

// ---------- keep a focused native date input alive across re-render ----------
//
// Native date inputs keep their segment state (which of month/day/year is
// being typed, partial digits) inside the element. Replacing the element, or
// even detaching and re-attaching it, resets that state, so typing "2028"
// into the year segment produced 0002 and then blank. When a date input has
// focus we therefore keep it and its ancestor chain connected and in place,
// copy attributes/handlers from the fresh render onto those kept nodes, and
// swap every other node for its fresh counterpart. Status, help, sidebar and
// buttons still update on every input event.

function syncAttributes(oldNode, freshNode) {
  for (const name of Array.from(oldNode.getAttributeNames())) {
    if (!freshNode.hasAttribute(name)) oldNode.removeAttribute(name);
  }
  for (const name of freshNode.getAttributeNames()) {
    const v = freshNode.getAttribute(name);
    if (oldNode.getAttribute(name) !== v) oldNode.setAttribute(name, v);
  }
  const oldOn = oldNode._tpOn || {};
  const freshOn = freshNode._tpOn || {};
  for (const type in oldOn) oldNode.removeEventListener(type, oldOn[type]);
  for (const type in freshOn) oldNode.addEventListener(type, freshOn[type]);
  oldNode._tpOn = freshOn;
}

function keepFocusedDate(container, freshRoot) {
  const ae = document.activeElement;
  if (!ae || !ae.id || ae.tagName !== 'INPUT' || ae.type !== 'date' || !container.contains(ae)) return false;
  const fresh = freshRoot.querySelector('#' + CSS.escape(ae.id));
  if (!fresh || fresh.tagName !== 'INPUT' || fresh.type !== 'date' || fresh.disabled) return false;
  const oldChain = [];
  for (let n = ae; n && n !== container; n = n.parentNode) oldChain.push(n);
  const freshChain = [];
  for (let n = fresh; n; n = n.parentNode) { freshChain.push(n); if (n === freshRoot) break; }
  if (oldChain.length !== freshChain.length || freshChain[freshChain.length - 1] !== freshRoot) return false;
  if (container.childNodes.length !== 1 || container.firstChild !== oldChain[oldChain.length - 1]) return false;
  for (let i = 0; i < oldChain.length; i++) {
    if (oldChain[i].tagName !== freshChain[i].tagName) return false;
  }
  // Ancestors from the top: take fresh attributes and fresh children, except
  // the kept child on the focus path, which is never moved.
  for (let i = oldChain.length - 1; i >= 1; i--) {
    const kept = oldChain[i];
    const keptChild = oldChain[i - 1];
    const freshNode = freshChain[i];
    const kids = Array.from(freshNode.childNodes);
    const at = kids.indexOf(freshChain[i - 1]);
    syncAttributes(kept, freshNode);
    for (const c of Array.from(kept.childNodes)) if (c !== keptChild) kept.removeChild(c);
    for (let j = 0; j < at; j++) kept.insertBefore(kids[j], keptChild);
    for (let j = at + 1; j < kids.length; j++) kept.appendChild(kids[j]);
  }
  syncAttributes(ae, fresh);
  // Writing .value resets segment editing, so only write a real change
  // (for example a coordinator-side clear); echoes of typed input are skipped.
  if (ae.value !== fresh.value) ae.value = fresh.value;
  return true;
}

// ---------- view accessors (safe defaults) ----------

function safeView(view) {
  return {
    lang: view && (view.lang === 'bn' ? 'bn' : 'en'),
    pack: (view && view.pack) || null,
    files: (view && Array.isArray(view.files)) ? view.files : [],
    summary: (view && view.summary) || null,
    busy: !!(view && view.busy),
    notice: (view && view.notice) || null,
    result: (view && view.result) || null,
    includeIndex: !!(view && view.includeIndex),
  };
}

function reqTitle(req, lang) {
  if (!req) return '';
  if (lang === 'bn' && req.title_bn) return req.title_bn;
  return req.title_en || req.title_bn || req.id || '';
}

function rowForReq(view, req) {
  if (view.summary && Array.isArray(view.summary.rows)) {
    for (const r of view.summary.rows) {
      if (r.requirement && r.requirement.id === req.id) return r;
    }
  }
  return null;
}

function hasPack(view) {
  return !!(view.pack && Array.isArray(view.pack.requirements) && view.pack.requirements.length);
}

// ---------- duplicate detection (display only) ----------

function computeDuplicateHashes(files) {
  const counts = Object.create(null);
  for (const f of files) {
    if (f && f.hash) counts[f.hash] = (counts[f.hash] || 0) + 1;
  }
  const dupes = new Set();
  for (const h in counts) if (counts[h] > 1) dupes.add(h);
  return dupes;
}

function readiness(view) {
  const rows = (view.summary && Array.isArray(view.summary.rows)) ? view.summary.rows : [];
  const mandatory = rows.filter((r) => r.requirement && r.requirement.mandatory);
  return { ok: mandatory.filter((r) => r.status === 'ok').length, total: mandatory.length };
}

// ---------- sections ----------

function buildHeader(view, actions) {
  const L = t(view.lang);
  const tender = view.pack && view.pack.tender;
  return el('header', { class: PREFIX + 'header' }, [
    el('div', { class: PREFIX + 'brand' }, [
      el('span', { class: PREFIX + 'brand-mark', 'aria-hidden': 'true' }, 'TD'),
      el('div', { class: PREFIX + 'header-text' }, [
        el('p', { class: PREFIX + 'brand-name' }, L.brand),
        el('h1', { class: PREFIX + 'app-title', id: 'tp-app-title' }, L.appTitle),
        el('p', { class: PREFIX + 'app-subtitle' }, L.appSubtitle),
      ]),
    ]),
    el('div', { class: PREFIX + 'header-actions' }, [
      tender && tender.tender_id ? el('span', { class: PREFIX + 'header-id' }, tender.tender_id) : null,
      el('button', {
        id: 'tp-lang',
        class: PREFIX + 'lang-btn',
        type: 'button',
        lang: view.lang === 'en' ? 'bn' : 'en',
        'aria-label': L.languageAria,
        onClick: () => actions.onLanguage(view.lang === 'en' ? 'bn' : 'en'),
        disabled: view.busy,
      }, L.language),
    ]),
  ]);
}

function buildStepRail(view) {
  const L = t(view.lang);
  const canGen = !!(view.summary && view.summary.canGenerate);
  const done = [hasPack(view), view.files.length > 0, canGen, !!view.result];
  const current = done.indexOf(false);
  return el('nav', { class: PREFIX + 'steps', 'aria-label': L.stepsLabel }, [
    el('ol', { class: PREFIX + 'steps-list' }, L.stepShort.map((label, i) => {
      const state = done[i] ? 'done' : (i === current ? 'current' : 'todo');
      return el('li', {
        class: PREFIX + 'step ' + PREFIX + 'step-' + state,
        'aria-current': state === 'current' ? 'step' : null,
      }, [
        el('span', { class: PREFIX + 'step-num', 'aria-hidden': 'true' }, done[i] ? '✓' : String(i + 1)),
        el('span', { class: PREFIX + 'step-label' }, label),
      ]);
    })),
  ]);
}

function buildLoadSection(view, actions) {
  const L = t(view.lang);
  const jsonInput = el('input', {
    type: 'file',
    accept: 'application/json,.json',
    id: 'tp-json-input',
    class: PREFIX + 'visually-hidden',
    tabindex: '-1',
    'aria-hidden': 'true',
    onChange: (e) => {
      const f = e.target.files && e.target.files[0];
      if (f) actions.onLoadRequirements(f);
      // Allow re-selecting the same file after error/reset.
      e.target.value = '';
    },
  });
  const loaded = !!(view.pack && view.pack.tender);
  const loadBtn = el('button', {
    type: 'button',
    id: 'tp-load-json',
    class: PREFIX + 'btn ' + (loaded ? PREFIX + 'btn-ghost' : PREFIX + 'btn-primary'),
    onClick: () => jsonInput.click(),
    disabled: view.busy,
  }, loaded ? L.replaceRequirements : L.loadRequirements);

  let body;
  if (!loaded) {
    body = el('p', { class: PREFIX + 'empty' }, L.noPack);
  } else {
    const t0 = view.pack.tender;
    const item = (k, v, wide) => el('div', { class: PREFIX + 'kv' + (wide ? ' ' + PREFIX + 'kv-wide' : '') }, [
      el('dt', { class: PREFIX + 'kv-k' }, k),
      el('dd', { class: PREFIX + 'kv-v' }, v == null || v === '' ? '—' : String(v)),
    ]);
    body = el('dl', { class: PREFIX + 'kv-grid', 'aria-labelledby': 'tp-tender-h' }, [
      item(L.tenderTitle, t0.title, true),
      item(L.tenderId, t0.tender_id),
      item(L.deadline, t0.submission_deadline),
      item(L.procuringEntity, t0.procuring_entity),
      item(L.bidder, t0.bidder),
    ]);
  }

  return el('section', { class: PREFIX + 'card ' + PREFIX + 'card-step ' + PREFIX + 'card-step-1', 'aria-labelledby': 'tp-step1-h' }, [
    el('div', { class: PREFIX + 'card-head' }, [
      el('h2', { class: PREFIX + 'card-title', id: 'tp-step1-h' }, L.step1),
      el('div', { class: PREFIX + 'row-gap' }, [loadBtn, jsonInput]),
    ]),
    el('h3', { class: PREFIX + 'visually-hidden', id: 'tp-tender-h' }, L.tender),
    body,
  ]);
}

function buildUploadSection(view, actions) {
  const L = t(view.lang);
  const pdfInput = el('input', {
    type: 'file',
    accept: 'application/pdf,.pdf',
    multiple: true,
    id: 'tp-pdf-input',
    class: PREFIX + 'visually-hidden',
    tabindex: '-1',
    'aria-hidden': 'true',
    onChange: (e) => {
      const fl = e.target.files;
      if (fl && fl.length) actions.onUploadFiles(fl);
      // Allow re-selecting the same files after error/reset.
      e.target.value = '';
    },
  });
  const dropZone = el('button', {
    type: 'button',
    id: 'tp-upload-btn',
    class: PREFIX + 'dropzone',
    disabled: view.busy,
    'aria-describedby': 'tp-upload-hint',
    onClick: () => pdfInput.click(),
    onDragover: (e) => { if (!view.busy) { e.preventDefault(); e.currentTarget.classList.add(PREFIX + 'dropzone-over'); } },
    onDragleave: (e) => e.currentTarget.classList.remove(PREFIX + 'dropzone-over'),
    onDrop: (e) => {
      e.preventDefault();
      e.currentTarget.classList.remove(PREFIX + 'dropzone-over');
      const fl = e.dataTransfer && e.dataTransfer.files;
      if (!view.busy && fl && fl.length) actions.onUploadFiles(fl);
    },
  }, [
    el('span', { class: PREFIX + 'dropzone-icon', 'aria-hidden': 'true' }, 'PDF'),
    el('span', { class: PREFIX + 'dropzone-text' }, L.uploadPdfs),
    el('span', { class: PREFIX + 'dropzone-sub' }, L.dropTitle),
  ]);

  return el('section', { class: PREFIX + 'card ' + PREFIX + 'card-step ' + PREFIX + 'card-step-2', 'aria-labelledby': 'tp-step2-h' }, [
    el('div', { class: PREFIX + 'card-head' }, [
      el('h2', { class: PREFIX + 'card-title', id: 'tp-step2-h' }, L.step2),
      view.files.length ? el('span', { class: PREFIX + 'count' }, String(view.files.length)) : null,
    ]),
    dropZone,
    pdfInput,
    el('p', { class: PREFIX + 'hint', id: 'tp-upload-hint' }, L.uploadHint),
    buildFilesList(view, actions),
  ]);
}

function buildFilesList(view, actions) {
  const L = t(view.lang);
  const heading = el('h3', { class: PREFIX + 'subhead', id: 'tp-files-h' }, L.uploadedFiles);
  if (!view.files.length) {
    return el('div', { class: PREFIX + 'files' }, [heading, el('p', { class: PREFIX + 'muted' }, L.noFiles)]);
  }
  const dupes = computeDuplicateHashes(view.files);
  const items = view.files.map((f) => {
    const isDupe = f.hash && dupes.has(f.hash);
    return el('li', { class: PREFIX + 'file-item' + (isDupe ? ' ' + PREFIX + 'file-item-dup' : '') }, [
      el('span', { class: PREFIX + 'file-icon', 'aria-hidden': 'true' }, 'PDF'),
      el('div', { class: PREFIX + 'file-main' }, [
        el('div', { class: PREFIX + 'file-name' }, f.name || '(unnamed)'),
        el('div', { class: PREFIX + 'file-meta' }, [
          el('span', { class: PREFIX + 'chip' }, L.filePages(f.pages || 0)),
          el('span', { class: PREFIX + 'chip' }, L.fileSize(f.size || 0)),
          isDupe ? el('span', { class: PREFIX + 'badge ' + PREFIX + 'badge-warn' }, '⚠ ' + L.duplicate) : null,
        ]),
      ]),
      el('button', {
        type: 'button',
        id: 'tp-remove-' + f.id,
        class: PREFIX + 'btn ' + PREFIX + 'btn-ghost ' + PREFIX + 'btn-danger ' + PREFIX + 'btn-sm',
        onClick: () => actions.onRemoveFile(f.id),
        disabled: view.busy,
        'aria-label': L.remove + ': ' + (f.name || ''),
      }, L.remove),
    ]);
  });
  return el('div', { class: PREFIX + 'files' }, [
    heading,
    el('ul', { class: PREFIX + 'file-list', id: 'tp-file-list', 'aria-labelledby': 'tp-files-h' }, items),
  ]);
}

function buildRequirementsTable(view, actions) {
  const L = t(view.lang);
  if (!hasPack(view)) {
    return el('section', { class: PREFIX + 'card ' + PREFIX + 'card-reqs ' + PREFIX + 'card-step ' + PREFIX + 'card-step-3', 'aria-labelledby': 'tp-reqs-h' }, [
      el('h2', { class: PREFIX + 'card-title', id: 'tp-reqs-h' }, L.step3),
      el('p', { class: PREFIX + 'empty' }, L.loadFirst),
    ]);
  }
  const reqs = view.pack.requirements.slice().sort((a, b) => (a.order || 0) - (b.order || 0));
  const deadline = view.pack.tender ? view.pack.tender.submission_deadline : '';

  const rows = reqs.map((req) => {
    const row = rowForReq(view, req);
    const status = (row && row.status) || 'missing';
    const currentFile = (row && row.file) || null;
    const currentExpiry = (row && row.expiryDate) || '';
    const statusLabel = (L.status && L.status[status]) || status;
    const title = reqTitle(req, view.lang);

    const selId = 'tp-match-' + req.id;
    const expId = 'tp-expiry-' + req.id;
    const helpId = 'tp-expiry-help-' + req.id;
    const wantVal = currentFile ? currentFile.id : '';

    const options = [el('option', { value: '' }, L.noneOption)];
    for (const f of view.files) {
      const opt = el('option', { value: f.id }, (f.name || '(unnamed)') + ' — ' + L.filePages(f.pages || 0));
      if (f.id === wantVal) opt.selected = true;
      options.push(opt);
    }
    const matchSel = el('select', {
      id: selId,
      class: PREFIX + 'select',
      'aria-label': L.matchLabel + ': ' + title,
      disabled: view.busy,
      onChange: (e) => {
        const v = e.target.value;
        actions.onMatch(req.id, v ? v : null);
      },
    }, options);
    matchSel.value = wantVal;

    const undoBtn = el('button', {
      type: 'button',
      id: 'tp-undo-' + req.id,
      class: PREFIX + 'btn ' + PREFIX + 'btn-ghost ' + PREFIX + 'btn-sm',
      onClick: () => actions.onMatch(req.id, null),
      disabled: view.busy || !currentFile,
      'aria-label': L.undo + ': ' + title,
    }, L.undo);

    const expiryCell = req.has_expiry
      ? [
          el('input', {
            type: 'date',
            id: expId,
            class: PREFIX + 'date',
            value: currentExpiry || '',
            min: deadline || null,
            disabled: view.busy || !currentFile,
            'aria-label': L.expiryLabel + ': ' + title,
            'aria-describedby': helpId,
            'aria-invalid': status === 'expired' || status === 'expiry-needed' ? 'true' : null,
            onInput: (e) => actions.onExpiry(req.id, e.target.value || ''),
          }),
          el('div', { class: PREFIX + 'expiry-help', id: helpId }, L.expiryHelp(deadline)),
        ]
      : [el('span', { class: PREFIX + 'muted ' + PREFIX + 'small' }, L.noExpiry)];

    return el('tr', { class: PREFIX + 'req-row ' + PREFIX + 'req-row-' + status, dataset: { reqId: req.id } }, [
      el('th', { scope: 'row', class: PREFIX + 'req-name' }, [
        el('div', { class: PREFIX + 'req-head' }, [
          el('span', { class: PREFIX + 'req-order', 'aria-hidden': 'true' }, String(req.order)),
          el('span', { class: PREFIX + 'req-title' }, title),
        ]),
        el('div', { class: PREFIX + 'req-sub' }, [
          el('span', { class: PREFIX + 'chip ' + PREFIX + 'chip-id' }, req.id),
          req.mandatory
            ? el('span', { class: PREFIX + 'chip ' + PREFIX + 'chip-mandatory' }, L.mandatory)
            : el('span', { class: PREFIX + 'chip ' + PREFIX + 'chip-optional' }, L.optional),
          req.has_expiry ? el('span', { class: PREFIX + 'chip ' + PREFIX + 'chip-expiry' }, L.hasExpiry) : null,
        ]),
      ]),
      el('td', { class: PREFIX + 'td-match', 'data-label': L.matchColumn }, [matchSel]),
      el('td', { class: PREFIX + 'td-expiry', 'data-label': L.expiryColumn }, expiryCell),
      el('td', { class: PREFIX + 'td-status', 'data-label': L.statusColumn }, [
        el('span', { class: PREFIX + 'status ' + PREFIX + 'status-' + status }, [
          el('span', { class: PREFIX + 'status-icon', 'aria-hidden': 'true' }, STATUS_ICON[status] || '•'),
          txt(statusLabel),
        ]),
      ]),
      el('td', { class: PREFIX + 'td-actions', 'data-label': L.actionsColumn }, [undoBtn]),
    ]);
  });

  const table = el('table', { class: PREFIX + 'req-table', id: 'tp-req-table' }, [
    el('caption', { class: PREFIX + 'visually-hidden' }, L.requirementsTitle),
    el('thead', null, [
      el('tr', null, [
        el('th', { scope: 'col' }, L.requirementsTitle),
        el('th', { scope: 'col' }, L.matchColumn),
        el('th', { scope: 'col' }, L.expiryColumn),
        el('th', { scope: 'col' }, L.statusColumn),
        el('th', { scope: 'col' }, L.actionsColumn),
      ]),
    ]),
    el('tbody', null, rows),
  ]);

  return el('section', { class: PREFIX + 'card ' + PREFIX + 'card-reqs ' + PREFIX + 'card-step ' + PREFIX + 'card-step-3', 'aria-labelledby': 'tp-reqs-h' }, [
    el('div', { class: PREFIX + 'card-head' }, [
      el('h2', { class: PREFIX + 'card-title', id: 'tp-reqs-h' }, L.step3),
      el('span', { class: PREFIX + 'count' }, String(reqs.length)),
    ]),
    el('div', { class: PREFIX + 'table-wrap' }, [table]),
  ]);
}

function buildResult(view) {
  if (!view.result) return null;
  const L = t(view.lang);
  return el('div', { class: PREFIX + 'result', role: 'group', 'aria-labelledby': 'tp-result-h' }, [
    el('h3', { class: PREFIX + 'result-title', id: 'tp-result-h' }, '✓ ' + L.resultReady),
    el('dl', { class: PREFIX + 'result-meta' }, [
      el('dt', null, L.resultFilename),
      el('dd', { class: PREFIX + 'result-file' }, view.result.filename || ''),
      el('dt', null, L.resultPages),
      el('dd', null, String(view.result.pageCount || 0)),
    ]),
    el('a', {
      id: 'tp-download',
      href: view.result.url,
      download: view.result.filename || 'package.pdf',
      class: PREFIX + 'btn ' + PREFIX + 'btn-primary ' + PREFIX + 'btn-block ' + PREFIX + 'btn-lg',
    }, L.download),
  ]);
}

function buildSidebar(view, actions) {
  const L = t(view.lang);
  const loaded = hasPack(view);
  const canGen = !!(view.summary && view.summary.canGenerate);
  const blockers = (view.summary && view.summary.blockers) || [];
  const included = (view.summary && view.summary.included) || [];
  const pageCount = (view.summary && typeof view.summary.pageCount === 'number') ? view.summary.pageCount : 0;
  const ready = readiness(view);
  const pct = ready.total ? Math.round((ready.ok / ready.total) * 100) : 0;

  let statusBlock;
  if (!loaded) {
    statusBlock = el('p', { class: PREFIX + 'empty' }, L.loadFirst);
  } else {
    const blockerItems = blockers.length
      ? blockers.map((b) => {
          const req = b.requirement || {};
          const reason = (L.status && L.status[b.status]) || b.status || '';
          return el('li', { class: PREFIX + 'blocker' }, [
            el('span', { class: PREFIX + 'blocker-title' }, reqTitle(req, view.lang)),
            el('span', { class: PREFIX + 'blocker-reason' }, reason),
          ]);
        })
      : [el('li', { class: PREFIX + 'blocker-ok' }, '✓ ' + L.noBlockers)];
    statusBlock = el('div', null, [
      el('div', { class: PREFIX + 'meter-label' }, [
        el('span', null, L.readiness(ready.ok, ready.total)),
        el('span', { class: PREFIX + 'meter-pct' }, pct + '%'),
      ]),
      el('div', {
        class: PREFIX + 'meter',
        role: 'progressbar',
        'aria-label': L.readiness(ready.ok, ready.total),
        'aria-valuemin': '0',
        'aria-valuemax': String(ready.total),
        'aria-valuenow': String(ready.ok),
      }, [el('span', { class: PREFIX + 'meter-fill', style: { width: pct + '%' } })]),
      el('h3', { class: PREFIX + 'subhead' }, L.blockersTitle),
      el('ul', { class: PREFIX + 'blocker-list' }, blockerItems),
      el('h3', { class: PREFIX + 'subhead' }, L.includedTitle),
      included.length
        ? el('ol', { class: PREFIX + 'included-list' }, included.map((row) => {
            const f = row.file;
            return el('li', { class: PREFIX + 'included' }, [
              el('span', { class: PREFIX + 'included-name' }, reqTitle(row.requirement, view.lang)),
              el('span', { class: PREFIX + 'chip' }, L.filePages(f && f.pages ? f.pages : 0)),
            ]);
          }))
        : el('p', { class: PREFIX + 'muted ' + PREFIX + 'small' }, '—'),
    ]);
  }

  const helpText = !loaded ? L.loadFirst : (canGen ? L.noBlockers : L.fixBlockers(blockers.length || 1));

  return el('aside', { class: PREFIX + 'sidebar ' + PREFIX + 'card-step ' + PREFIX + 'card-step-4', 'aria-labelledby': 'tp-side-h' }, [
    el('h2', { class: PREFIX + 'card-title', id: 'tp-side-h' }, L.step4),
    el('div', { class: PREFIX + 'stat' }, [
      el('span', { class: PREFIX + 'stat-num' }, String(pageCount)),
      el('span', { class: PREFIX + 'stat-label' }, [
        txt(L.totalPages),
        el('span', { class: PREFIX + 'stat-sub' }, L.pageCount(included.length, pageCount)),
      ]),
    ]),
    statusBlock,
    el('div', { class: PREFIX + 'gen' }, [
      el('label', { class: PREFIX + 'toggle', for: 'tp-index-toggle' }, [
        el('input', {
          type: 'checkbox',
          id: 'tp-index-toggle',
          checked: view.includeIndex,
          disabled: view.busy,
          onChange: (e) => actions.onToggleIndex(!!e.target.checked),
        }),
        el('span', null, L.includeIndex),
      ]),
      el('button', {
        type: 'button',
        id: 'tp-generate',
        class: PREFIX + 'btn ' + PREFIX + 'btn-primary ' + PREFIX + 'btn-block ' + PREFIX + 'btn-lg',
        onClick: () => actions.onGenerate(),
        disabled: view.busy || !canGen,
        'aria-describedby': 'tp-generate-help',
      }, view.busy ? L.generating : L.generate),
      el('p', { id: 'tp-generate-help', class: PREFIX + 'small ' + (canGen ? PREFIX + 'ok-text' : PREFIX + 'muted') }, helpText),
      buildResult(view),
    ]),
    el('div', { class: PREFIX + 'side-actions' }, [
      el('button', {
        type: 'button',
        id: 'tp-csv',
        class: PREFIX + 'btn ' + PREFIX + 'btn-ghost ' + PREFIX + 'btn-block',
        onClick: () => actions.onExportCsv(),
        disabled: view.busy || !loaded,
      }, L.exportCsv),
      el('button', {
        type: 'button',
        id: 'tp-reset',
        class: PREFIX + 'btn ' + PREFIX + 'btn-ghost ' + PREFIX + 'btn-block ' + PREFIX + 'btn-danger',
        onClick: () => { if (!view.busy) actions.onReset(); },
        disabled: view.busy,
      }, L.reset),
    ]),
  ]);
}

function buildNotice(view) {
  const kind = (view.notice && view.notice.kind) || 'info';
  const text = view.notice ? (view.lang === 'bn' && view.notice.bn ? view.notice.bn : view.notice.en) : '';
  // Live region always exists so screen readers announce later messages.
  return el('div', {
    class: PREFIX + 'notice-slot',
    role: kind === 'error' ? 'alert' : 'status',
    'aria-live': kind === 'error' ? 'assertive' : 'polite',
  }, text ? el('div', { class: PREFIX + 'notice ' + PREFIX + 'notice-' + kind }, text) : null);
}

// ---------- main render ----------

export function renderApp(container, view, actions) {
  if (!container) return;
  const v = safeView(view);
  const a = actions || {};
  const noop = () => {};

  // Normalize actions so a missing callback never throws.
  const safeActions = {
    onLoadRequirements: a.onLoadRequirements || noop,
    onUploadFiles: a.onUploadFiles || noop,
    onRemoveFile: a.onRemoveFile || noop,
    onMatch: a.onMatch || noop,
    onExpiry: a.onExpiry || noop,
    onLanguage: a.onLanguage || noop,
    onReset: a.onReset || noop,
    onGenerate: a.onGenerate || noop,
    onToggleIndex: a.onToggleIndex || noop,
    onExportCsv: a.onExportCsv || noop,
  };

  // Preserve focus before replacing DOM.
  const focusCap = captureFocus(container);

  container.className = PREFIX + 'root ' + PREFIX + 'lang-' + v.lang;
  container.setAttribute('data-busy', v.busy ? 'true' : 'false');
  container.setAttribute('aria-busy', v.busy ? 'true' : 'false');

  const L = t(v.lang);
  const root = el('div', { class: PREFIX + 'shell' }, [
    buildHeader(v, safeActions),
    buildStepRail(v),
    el('div', { class: PREFIX + 'layout' }, [
      el('div', { class: PREFIX + 'main' }, [
        buildNotice(v),
        buildLoadSection(v, safeActions),
        buildUploadSection(v, safeActions),
        buildRequirementsTable(v, safeActions),
      ]),
      el('div', { class: PREFIX + 'side-wrap' }, [buildSidebar(v, safeActions)]),
    ]),
    el('footer', { class: PREFIX + 'footer' }, L.footer),
  ]);

  // A focused date input stays connected; everything else is replaced.
  if (keepFocusedDate(container, root)) return;

  container.replaceChildren(root);

  // Restore focus (match selector, buttons) after re-render.
  restoreFocus(container, focusCap);
}

export default renderApp;
