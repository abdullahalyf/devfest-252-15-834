// puku2/ui.js
// Puku 2 — bilingual responsive browser UI for the Tender Document Package Builder.
// Exports renderApp(container, view, actions). No domain mutations, no PDF imports,
// no global state ownership. All side effects are coordinator callbacks.
//
// Contract summary (see docs/CONTRACT.md / CONTEXT.md):
//   view = { lang, pack, files, summary, busy, notice, result, includeIndex }
//   actions = { onLoadRequirements, onUploadFiles, onRemoveFile, onMatch,
//               onExpiry, onLanguage, onReset, onGenerate, onToggleIndex,
//               onExportCsv }
// Translation source-of-truth: view.pack.requirements[*].title_en / title_bn
// Notice localisation: { kind, en, bn }
// File: never dump bytes. Render only id/name/size/pages/hash.

const PREFIX = 'tp-';

// ---------- i18n strings (UI chrome only; document titles come from pack) -----

const STRINGS = {
  en: {
    appTitle: 'Tender Document Package Builder',
    appSubtitle: 'Compose, validate and export your tender submission package.',
    step1: '1. Load requirements',
    step2: '2. Upload documents',
    step3: '3. Match & validate',
    step4: '4. Generate package',
    loadRequirements: 'Load requirements JSON',
    loadTender: '(tender details appear after load)',
    noPack: 'No requirements loaded yet.',
    uploadPdfs: 'Upload PDF documents',
    uploadHint: 'Choose PDF files using the button. Up to 30 PDFs, 50 MiB total.',
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
    expiryHelp: 'Expiry must be on or after the tender deadline.',
    status: {
      ok: 'Ready',
      missing: 'Missing',
      'expiry-needed': 'Expiry required',
      expired: 'Expired',
      'not-provided': 'Not provided',
    },
    blockersTitle: 'Blocking issues',
    noBlockers: 'All mandatory requirements are satisfied.',
    includedTitle: 'Included documents',
    pageCount: (n, p) => `${n} document${n === 1 ? '' : 's'}, ${p} page${p === 1 ? '' : 's'}`,
    includeIndex: 'Include document index page',
    generate: 'Generate package',
    generating: 'Working…',
    download: 'Download package',
    exportCsv: 'Export checklist (CSV)',
    reset: 'Reset / new project',
    language: 'বাংলা',
    tender: 'Tender',
    procuringEntity: 'Procuring entity',
    bidder: 'Bidder',
    deadline: 'Submission deadline',
    tenderId: 'Tender ID',
    cancel: 'Cancel',
    requirementsTitle: 'Requirements',
    matchColumn: 'Matched document',
    statusColumn: 'Status',
    expiryColumn: 'Expiry',
    actionsColumn: 'Actions',
    noFileChosen: 'No file chosen',
    chooseJson: 'Choose requirements JSON',
    choosePdfs: 'Choose PDF files',
    resultReady: 'Package ready',
    resultFilename: 'Filename',
    resultPages: 'Pages',
    fileHash: 'SHA-256',
  },
  bn: {
    appTitle: 'টেন্ডার ডকুমেন্ট প্যাকেজ বিল্ডার',
    appSubtitle: 'আপনার টেন্ডার জমা প্যাকেজ তৈরি, যাচাই ও রপ্তানি করুন।',
    step1: '১. প্রয়োজনীয়তা লোড করুন',
    step2: '২. ডকুমেন্ট আপলোড করুন',
    step3: '৩. মিলান ও যাচাই করুন',
    step4: '৪. প্যাকেজ তৈরি করুন',
    loadRequirements: 'প্রয়োজনীয়তা JSON লোড করুন',
    loadTender: '(লোডের পরে টেন্ডারের বিবরণ দেখা যাবে)',
    noPack: 'এখনও কোনো প্রয়োজনীয়তা লোড করা হয়নি।',
    uploadPdfs: 'PDF ডকুমেন্ট আপলোড করুন',
    uploadHint: 'বোতাম ব্যবহার করে PDF বেছে নিন। সর্বোচ্চ ৩০টি PDF, মোট ৫০ MiB।',
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
    expiryHelp: 'মেয়াদ অবশ্যই টেন্ডারের জমা শেষ তারিখের সমান বা পরের হতে হবে।',
    status: {
      ok: 'প্রস্তুত',
      missing: 'অনুপস্থিত',
      'expiry-needed': 'মেয়াদের তারিখ প্রয়োজন',
      expired: 'মেয়াদোত্তীর্ণ',
      'not-provided': 'প্রদান করা হয়নি',
    },
    blockersTitle: 'বাধাগুলি',
    noBlockers: 'সমস্ত বাধ্যতামূলক প্রয়োজনীয়তা পূরণ হয়েছে।',
    includedTitle: 'অন্তর্ভুক্ত ডকুমেন্ট',
    pageCount: (n, p) => `${n}টি ডকুমেন্ট, ${p}টি পৃষ্ঠা`,
    includeIndex: 'ডকুমেন্ট সূচিপত্র অন্তর্ভুক্ত করুন',
    generate: 'প্যাকেজ তৈরি করুন',
    generating: 'কাজ চলছে…',
    download: 'প্যাকেজ ডাউনলোড করুন',
    exportCsv: 'চেকলিস্ট রপ্তানি (CSV)',
    reset: 'রিসেট / নতুন প্রকল্প',
    language: 'English',
    tender: 'টেন্ডার',
    procuringEntity: 'ক্রয়কারী সংস্থা',
    bidder: 'দরপ্রস্তুতদাতা',
    deadline: 'জমা শেষ তারিখ',
    tenderId: 'টেন্ডার আইডি',
    cancel: 'বাতিল',
    requirementsTitle: 'প্রয়োজনীয়তা',
    matchColumn: 'মিলানো ডকুমেন্ট',
    statusColumn: 'অবস্থা',
    expiryColumn: 'মেয়াদ',
    actionsColumn: 'কার্যক্রম',
    noFileChosen: 'কোনো ফাইল নির্বাচিত হয়নি',
    chooseJson: 'প্রয়োজনীয়তা JSON নির্বাচন করুন',
    choosePdfs: 'PDF ফাইল নির্বাচন করুন',
    resultReady: 'প্যাকেজ প্রস্তুত',
    resultFilename: 'ফাইলের নাম',
    resultPages: 'পৃষ্ঠা সংখ্যা',
    fileHash: 'SHA-256',
  },
};

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
        node.addEventListener(k.slice(2).toLowerCase(), v);
      } else if (k === 'html') {
        // Explicitly disallowed: we never use this for imported strings.
        // Kept here only to make accidental misuse obvious.
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
  if (!tgt) return;
  tgt.focus({ preventScroll: true });
  if (cap.extra && typeof tgt.setSelectionRange === 'function') {
    try { tgt.setSelectionRange(cap.extra.start, cap.extra.end); } catch (_) { /* ignore */ }
  }
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

function statusForReq(view, req) {
  // view.summary.rows contains authoritative status from coordinator; fall back
  // to a safe default if not yet computed.
  if (view.summary && Array.isArray(view.summary.rows)) {
    for (const r of view.summary.rows) {
      if (r.requirement && r.requirement.id === req.id) return r.status;
    }
  }
  return 'missing';
}

function fileForReq(view, req) {
  if (view.summary && Array.isArray(view.summary.rows)) {
    for (const r of view.summary.rows) {
      if (r.requirement && r.requirement.id === req.id) return r.file || null;
    }
  }
  return null;
}

function expiryForReq(view, req) {
  if (view.summary && Array.isArray(view.summary.rows)) {
    for (const r of view.summary.rows) {
      if (r.requirement && r.requirement.id === req.id) return r.expiryDate || '';
    }
  }
  return '';
}

function fileById(view, id) {
  for (const f of view.files) if (f.id === id) return f;
  return null;
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

// ---------- sections ----------

function buildHeader(view, actions) {
  const L = t(view.lang);
  const langBtn = el('button', {
    class: PREFIX + 'lang-btn',
    type: 'button',
    'aria-label': view.lang === 'en' ? 'Switch language to Bangla' : 'Switch language to English',
    onClick: () => actions.onLanguage(view.lang === 'en' ? 'bn' : 'en'),
    disabled: view.busy,
  }, L.language);
  return el('header', { class: PREFIX + 'header' }, [
    el('div', { class: PREFIX + 'header-text' }, [
      el('h1', { class: PREFIX + 'app-title', id: 'tp-app-title' }, L.appTitle),
      el('p', { class: PREFIX + 'app-subtitle' }, L.appSubtitle),
    ]),
    langBtn,
  ]);
}

function buildTenderCard(view) {
  const L = t(view.lang);
  if (!view.pack || !view.pack.tender) {
    return el('section', { class: PREFIX + 'card ' + PREFIX + 'card-tender', 'aria-labelledby': 'tp-tender-h' }, [
      el('h2', { class: PREFIX + 'card-title', id: 'tp-tender-h' }, L.tender),
      el('p', { class: PREFIX + 'muted' }, L.loadTender),
    ]);
  }
  const t0 = view.pack.tender;
  const row = (k, v) => el('div', { class: PREFIX + 'kv' }, [
    el('span', { class: PREFIX + 'kv-k' }, k),
    el('span', { class: PREFIX + 'kv-v' }, v == null || v === '' ? '—' : String(v)),
  ]);
  return el('section', { class: PREFIX + 'card ' + PREFIX + 'card-tender', 'aria-labelledby': 'tp-tender-h' }, [
    el('h2', { class: PREFIX + 'card-title', id: 'tp-tender-h' }, L.tender),
    el('div', { class: PREFIX + 'kv-grid' }, [
      row(L.tenderId + ':', t0.tender_id || ''),
      row(L.tender + ':', t0.title || ''),
      row(L.procuringEntity + ':', t0.procuring_entity || ''),
      row(L.bidder + ':', t0.bidder || ''),
      row(L.deadline + ':', t0.submission_deadline || ''),
    ]),
  ]);
}

function buildLoadSection(view, actions) {
  const L = t(view.lang);
  const jsonInput = el('input', {
    type: 'file',
    accept: 'application/json,.json',
    id: 'tp-json-input',
    class: PREFIX + 'visually-hidden',
    onChange: (e) => {
      const f = e.target.files && e.target.files[0];
      if (f) actions.onLoadRequirements(f);
      // Allow re-selecting the same file after error/reset.
      e.target.value = '';
    },
  });
  const loadBtn = el('button', {
    type: 'button',
    class: PREFIX + 'btn ' + PREFIX + 'btn-primary',
    onClick: () => jsonInput.click(),
    disabled: view.busy,
  }, L.loadRequirements);
  return el('section', { class: PREFIX + 'card ' + PREFIX + 'card-step ' + PREFIX + 'card-step-1', 'aria-labelledby': 'tp-step1-h' }, [
    el('h2', { class: PREFIX + 'card-title', id: 'tp-step1-h' }, L.step1),
    el('p', { class: PREFIX + 'muted' }, view.pack ? '' : L.noPack),
    el('div', { class: PREFIX + 'row-gap' }, [loadBtn, jsonInput]),
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
    onChange: (e) => {
      const fl = e.target.files;
      if (fl && fl.length) actions.onUploadFiles(fl);
      // Allow re-selecting the same files after error/reset.
      e.target.value = '';
    },
  });
  const uploadBtn = el('button', {
    type: 'button',
    class: PREFIX + 'btn ' + PREFIX + 'btn-primary',
    onClick: () => pdfInput.click(),
    disabled: view.busy,
    'aria-describedby': 'tp-upload-hint',
  }, L.uploadPdfs);
  const dropZone = el('div', {
    class: PREFIX + 'dropzone',
    tabindex: '0',
    role: 'button',
    'aria-label': L.uploadPdfs,
    onClick: () => pdfInput.click(),
    onKeydown: (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        pdfInput.click();
      }
    },
  }, [
    el('div', { class: PREFIX + 'dropzone-icon', 'aria-hidden': 'true' }, '⬆'),
    el('div', { class: PREFIX + 'dropzone-text' }, L.uploadPdfs),
    el('div', { class: PREFIX + 'dropzone-hint', id: 'tp-upload-hint' }, L.uploadHint),
  ]);
  return el('section', { class: PREFIX + 'card ' + PREFIX + 'card-step ' + PREFIX + 'card-step-2', 'aria-labelledby': 'tp-step2-h' }, [
    el('h2', { class: PREFIX + 'card-title', id: 'tp-step2-h' }, L.step2),
    el('div', { class: PREFIX + 'row-gap' }, [uploadBtn, pdfInput]),
    el('div', { class: PREFIX + 'spacer-12' }),
    dropZone,
  ]);
}

function buildFilesList(view, actions) {
  const L = t(view.lang);
  if (!view.files.length) {
    return el('section', { class: PREFIX + 'card ' + PREFIX + 'card-filelist', 'aria-labelledby': 'tp-files-h' }, [
      el('h2', { class: PREFIX + 'card-title', id: 'tp-files-h' }, L.uploadedFiles),
      el('p', { class: PREFIX + 'muted' }, L.noFiles),
    ]);
  }
  const dupes = computeDuplicateHashes(view.files);
  const items = view.files.map((f) => {
    const isDupe = f.hash && dupes.has(f.hash);
    const badge = isDupe
      ? el('span', { class: PREFIX + 'badge ' + PREFIX + 'badge-warn', title: L.duplicate }, L.duplicate)
      : null;
    return el('li', { class: PREFIX + 'file-item' + (isDupe ? ' ' + PREFIX + 'file-item-dup' : '') }, [
      el('div', { class: PREFIX + 'file-main' }, [
        el('div', { class: PREFIX + 'file-name' }, f.name || '(unnamed)'),
        el('div', { class: PREFIX + 'file-meta' }, [
          el('span', { class: PREFIX + 'chip' }, L.filePages(f.pages || 0)),
          el('span', { class: PREFIX + 'chip' }, L.fileSize(f.size || 0)),
          badge,
        ].filter(Boolean)),
      ]),
      el('div', { class: PREFIX + 'file-actions' }, [
        el('button', {
          type: 'button',
          class: PREFIX + 'btn ' + PREFIX + 'btn-ghost ' + PREFIX + 'btn-danger',
          onClick: () => actions.onRemoveFile(f.id),
          disabled: view.busy,
          'aria-label': (view.lang === 'en' ? 'Remove ' : 'মুছুন ') + (f.name || ''),
        }, L.remove),
      ]),
    ]);
  });
  return el('section', { class: PREFIX + 'card ' + PREFIX + 'card-filelist', 'aria-labelledby': 'tp-files-h' }, [
    el('h2', { class: PREFIX + 'card-title', id: 'tp-files-h' }, L.uploadedFiles),
    el('ul', { class: PREFIX + 'file-list', id: 'tp-file-list' }, items),
  ]);
}

function buildRequirementsTable(view, actions) {
  const L = t(view.lang);
  if (!view.pack || !Array.isArray(view.pack.requirements) || !view.pack.requirements.length) {
    return el('section', { class: PREFIX + 'card ' + PREFIX + 'card-reqs', 'aria-labelledby': 'tp-reqs-h' }, [
      el('h2', { class: PREFIX + 'card-title', id: 'tp-reqs-h' }, L.requirementsTitle),
      el('p', { class: PREFIX + 'muted' }, L.noPack),
    ]);
  }
  const reqs = view.pack.requirements.slice().sort((a, b) => (a.order || 0) - (b.order || 0));

  // Build the dropdown options once.
  const matchOptions = [
    el('option', { value: '' }, L.noneOption),
  ];
  for (const f of view.files) {
    matchOptions.push(el('option', { value: f.id }, (f.name || '(unnamed)') + ' — ' + L.filePages(f.pages || 0)));
  }

  // For each row, build a <tr>. Date input is a real <input type="date"> so the
  // browser preserves focus, value and selection across re-render.
  const rows = reqs.map((req) => {
    const status = statusForReq(view, req);
    const currentFile = fileForReq(view, req);
    const currentExpiry = expiryForReq(view, req);
    const statusLabel = (L.status && L.status[status]) || status;
    const statusClass = PREFIX + 'status ' + PREFIX + 'status-' + status;

    const selId = 'tp-match-' + req.id;
    const expId = 'tp-expiry-' + req.id;

    // Select element. value="" means "not provided". When user picks "" we
    // call onMatch(req.id, null). When they pick a file id we pass it through.
    const matchSel = el('select', {
      id: selId,
      class: PREFIX + 'select',
      'aria-label': L.matchLabel + ': ' + reqTitle(req, view.lang),
      disabled: view.busy,
      onChange: (e) => {
        const v = e.target.value;
        actions.onMatch(req.id, v ? v : null);
      },
    }, matchOptions.map((o) => {
      // Re-clone the option to set selected without mutating the template.
      const copy = o.cloneNode(true);
      const wantVal = currentFile ? currentFile.id : '';
      if (copy.value === wantVal) copy.selected = true;
      return copy;
    }));

    const undoBtn = el('button', {
      type: 'button',
      class: PREFIX + 'btn ' + PREFIX + 'btn-ghost',
      onClick: () => actions.onMatch(req.id, null),
      disabled: view.busy || !currentFile,
      'aria-label': L.undo + ': ' + reqTitle(req, view.lang),
    }, L.undo);

    const expInput = el('input', {
      type: 'date',
      id: expId,
      class: PREFIX + 'date',
      value: currentExpiry || '',
      disabled: view.busy || !currentFile || !req.has_expiry,
      'aria-label': L.expiryLabel + ': ' + reqTitle(req, view.lang),
      onInput: (e) => actions.onExpiry(req.id, e.target.value || ''),
    });

    // Mobile-friendly card view uses the same data; CSS switches layout.
    return el('tr', { class: PREFIX + 'req-row ' + PREFIX + 'req-row-' + status, dataset: { reqId: req.id } }, [
      el('th', { scope: 'row', class: PREFIX + 'req-name' }, [
        el('div', { class: PREFIX + 'req-title' }, reqTitle(req, view.lang)),
        el('div', { class: PREFIX + 'req-sub' }, [
          el('span', { class: PREFIX + 'chip ' + PREFIX + 'chip-id' }, req.id),
          req.mandatory
            ? el('span', { class: PREFIX + 'chip ' + PREFIX + 'chip-mandatory' }, view.lang === 'en' ? 'Mandatory' : 'বাধ্যতামূলক')
            : el('span', { class: PREFIX + 'chip ' + PREFIX + 'chip-optional' }, view.lang === 'en' ? 'Optional' : 'ঐচ্ছিক'),
          req.has_expiry
            ? el('span', { class: PREFIX + 'chip ' + PREFIX + 'chip-expiry' }, view.lang === 'en' ? 'Has expiry' : 'মেয়াদ আছে')
            : null,
        ].filter(Boolean)),
      ]),
      el('td', { class: PREFIX + 'td-match', 'data-label': L.matchColumn }, [matchSel]),
      el('td', { class: PREFIX + 'td-expiry', 'data-label': L.expiryColumn }, [
        expInput,
        req.has_expiry ? el('div', { class: PREFIX + 'expiry-help' }, L.expiryHelp) : null,
      ].filter(Boolean)),
      el('td', { class: PREFIX + 'td-status', 'data-label': L.statusColumn }, [
        el('span', { class: statusClass }, statusLabel),
      ]),
      el('td', { class: PREFIX + 'td-actions', 'data-label': L.actionsColumn }, [undoBtn]),
    ]);
  });

  const table = el('table', { class: PREFIX + 'req-table', id: 'tp-req-table' }, [
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
    el('h2', { class: PREFIX + 'card-title', id: 'tp-reqs-h' }, L.step3),
    el('p', { class: PREFIX + 'muted' }, L.requirementsTitle + ' (' + reqs.length + ')'),
    el('div', { class: PREFIX + 'table-wrap' }, [table]),
  ]);
}

function buildSidebar(view, actions) {
  const L = t(view.lang);
  const canGen = !!(view.summary && view.summary.canGenerate);
  const blockers = (view.summary && view.summary.blockers) || [];
  const included = (view.summary && view.summary.included) || [];
  const pageCount = (view.summary && typeof view.summary.pageCount === 'number') ? view.summary.pageCount : 0;

  const blockerItems = blockers.length
    ? blockers.map((b) => {
        const req = b.requirement || {};
        const reason = (L.status && L.status[b.status]) || b.status || '';
        return el('li', { class: PREFIX + 'blocker' }, [
          el('span', { class: PREFIX + 'blocker-id' }, req.id || ''),
          el('span', { class: PREFIX + 'blocker-title' }, reqTitle(req, view.lang)),
          el('span', { class: PREFIX + 'blocker-reason' }, reason),
        ]);
      })
    : [el('li', { class: PREFIX + 'blocker-ok' }, L.noBlockers)];

  const includedItems = included.length
    ? included.map((row) => {
        const f = row.file;
        return el('li', { class: PREFIX + 'included' }, [
          el('span', { class: PREFIX + 'included-name' }, f && f.name ? f.name : '(unnamed)'),
          el('span', { class: PREFIX + 'chip' }, L.filePages(f && f.pages ? f.pages : 0)),
        ]);
      })
    : [el('li', { class: PREFIX + 'muted' }, '—')];

  const generateBtn = el('button', {
    type: 'button',
    id: 'tp-generate',
    class: PREFIX + 'btn ' + PREFIX + 'btn-primary ' + PREFIX + 'btn-block',
    onClick: () => actions.onGenerate(),
    disabled: view.busy || !canGen,
    'aria-describedby': 'tp-generate-help',
  }, view.busy ? L.generating : L.generate);

  const help = el('p', { id: 'tp-generate-help', class: PREFIX + 'muted ' + PREFIX + 'small' },
    canGen ? L.noBlockers : (blockers.length ? '' : L.noBlockers));

  const indexToggle = el('label', { class: PREFIX + 'toggle' }, [
    el('input', {
      type: 'checkbox',
      checked: view.includeIndex,
      disabled: view.busy,
      onChange: (e) => actions.onToggleIndex(!!e.target.checked),
    }),
    el('span', null, L.includeIndex),
  ]);

  const csvBtn = el('button', {
    type: 'button',
    class: PREFIX + 'btn ' + PREFIX + 'btn-ghost ' + PREFIX + 'btn-block',
    onClick: () => actions.onExportCsv(),
    disabled: view.busy,
  }, L.exportCsv);

  const resetBtn = el('button', {
    type: 'button',
    class: PREFIX + 'btn ' + PREFIX + 'btn-ghost ' + PREFIX + 'btn-block ' + PREFIX + 'btn-danger',
    onClick: () => {
      if (view.busy) return;
      // The coordinator owns confirmation policy; we just call through.
      actions.onReset();
    },
    disabled: view.busy,
  }, L.reset);

  return el('aside', { class: PREFIX + 'sidebar ' + PREFIX + 'card-step ' + PREFIX + 'card-step-4', 'aria-labelledby': 'tp-side-h' }, [
    el('h2', { class: PREFIX + 'card-title', id: 'tp-side-h' }, L.step4),
    el('div', { class: PREFIX + 'stat' }, [
      el('div', { class: PREFIX + 'stat-num' }, String(pageCount)),
      el('div', { class: PREFIX + 'stat-label' }, view.lang === 'en' ? 'Total pages' : 'মোট পৃষ্ঠা'),
    ]),
    el('div', { class: PREFIX + 'spacer-12' }),
    el('h3', { class: PREFIX + 'subhead' }, L.blockersTitle),
    el('ul', { class: PREFIX + 'blocker-list' }, blockerItems),
    el('div', { class: PREFIX + 'spacer-12' }),
    el('h3', { class: PREFIX + 'subhead' }, L.includedTitle),
    el('ul', { class: PREFIX + 'included-list' }, includedItems),
    el('p', { class: PREFIX + 'muted ' + PREFIX + 'small' }, L.pageCount(included.length, pageCount)),
    el('div', { class: PREFIX + 'spacer-12' }),
    indexToggle,
    el('div', { class: PREFIX + 'spacer-12' }),
    generateBtn,
    help,
    el('div', { class: PREFIX + 'spacer-8' }),
    csvBtn,
    el('div', { class: PREFIX + 'spacer-8' }),
    resetBtn,
  ]);
}

function buildNotice(view) {
  if (!view.notice) return null;
  const text = view.lang === 'bn' && view.notice.bn ? view.notice.bn : view.notice.en;
  if (!text) return null;
  const kind = view.notice.kind || 'info';
  return el('div', {
    class: PREFIX + 'notice ' + PREFIX + 'notice-' + kind,
    role: kind === 'error' ? 'alert' : 'status',
    'aria-live': kind === 'error' ? 'assertive' : 'polite',
  }, text);
}

function buildResult(view) {
  if (!view.result) return null;
  const L = t(view.lang);
  return el('section', { class: PREFIX + 'card ' + PREFIX + 'card-result', 'aria-labelledby': 'tp-result-h' }, [
    el('h2', { class: PREFIX + 'card-title', id: 'tp-result-h' }, L.resultReady),
    el('p', null, [
      el('strong', null, L.resultFilename + ': '),
      txt(view.result.filename || ''),
    ]),
    el('p', null, [
      el('strong', null, L.resultPages + ': '),
      txt(String(view.result.pageCount || 0)),
    ]),
    el('p', null, [
      el('a', {
        href: view.result.url,
        download: view.result.filename || 'package.pdf',
        class: PREFIX + 'btn ' + PREFIX + 'btn-primary',
        'aria-label': L.download,
      }, L.download),
    ]),
  ]);
}

// ---------- main render ----------

export function renderApp(container, view, actions) {
  if (!container) return;
  const v = safeView(view);
  const a = actions || {};
  const fallback = (name) => () => { /* no-op when action missing */ };

  // Normalize actions so a missing callback never throws.
  const safeActions = {
    onLoadRequirements: a.onLoadRequirements || fallback('onLoadRequirements'),
    onUploadFiles: a.onUploadFiles || fallback('onUploadFiles'),
    onRemoveFile: a.onRemoveFile || fallback('onRemoveFile'),
    onMatch: a.onMatch || fallback('onMatch'),
    onExpiry: a.onExpiry || fallback('onExpiry'),
    onLanguage: a.onLanguage || fallback('onLanguage'),
    onReset: a.onReset || fallback('onReset'),
    onGenerate: a.onGenerate || fallback('onGenerate'),
    onToggleIndex: a.onToggleIndex || fallback('onToggleIndex'),
    onExportCsv: a.onExportCsv || fallback('onExportCsv'),
  };

  // Preserve focus before replacing DOM.
  const focusCap = captureFocus(container);

  container.innerHTML = '';
  container.className = PREFIX + 'root ' + PREFIX + 'lang-' + v.lang;
  container.setAttribute('data-busy', v.busy ? 'true' : 'false');

  const root = el('div', { class: PREFIX + 'shell' }, [
    buildHeader(v, safeActions),
    el('div', { class: PREFIX + 'layout' }, [
      el('main', { class: PREFIX + 'main' }, [
        buildNotice(v),
        buildTenderCard(v),
        buildLoadSection(v, safeActions),
        buildUploadSection(v, safeActions),
        buildFilesList(v, safeActions),
        buildRequirementsTable(v, safeActions),
        buildResult(v),
      ]),
      el('div', { class: PREFIX + 'side-wrap' }, [
        buildSidebar(v, safeActions),
      ]),
    ]),
    el('footer', { class: PREFIX + 'footer' }, [
      el('span', null, '© ' + new Date().getFullYear() + ' — Tender Document Package Builder'),
    ]),
  ]);

  container.appendChild(root);

  // Restore focus (date input or match selector) after re-render.
  restoreFocus(container, focusCap);
}

export default renderApp;
