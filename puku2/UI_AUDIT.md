Now I have a complete view. Let me carefully audit the UI against the spec             
  requirements:                                                                          
                                                                                         
  Required English status labels from problem statement: Missing, Expiry date needed,    
  Expired, Not provided, OK                                                              
                                                                                         
  Current English status labels in ui.js (lines 53-59):                                  
  - ok: 'Ready' — ❌ Should be OK                                                        
  - missing: 'Missing' — ✅           
  - 'expiry-needed': 'Expiry required' — ❌ Should be Expiry date needed
  - expired: 'Expired' — ✅
  - 'not-provided': 'Not provided' — ✅

  Let me cross-check other usability/bilingual points systematically:

  1. Status labels (English): only Ready and Expiry required are wrong per spec; the
  other three match.
  2. Bangla equivalents (lines 127-133): বাংলা labels look natural, but check if they
  semantically match the spec.
  3. Action callbacks: lines 745-756 cover all 10 callbacks.
  4. Keyboard focus: captureFocus/restoreFocus on lines 222-242. JSON/PDF inputs have
  tabindex:'-1' and aria-hidden:'true' (lines 351-352, 405-406) — they're hidden,
  dropzone button triggers them. Good.
  5. Accessible labels: file remove has aria-label; match select has aria-label; undo has
   aria-label; expiry has aria-label; language has aria-label; download link has no
  aria-label but has text.
  6. Busy-state controls: disabled attributes on dropzone, load button, match selects,
  undo, file remove, lang toggle, reset, csv, generate.
  7. Mobile text wrapping: overflow-wrap: anywhere on titles, status pill has
  white-space: nowrap — could overflow on narrow mobile. Status pill width not
  constrained.

  Let me check a few more critical issues:

  - Result download link (line 611-616): no target attribute (good — downloads); no
  busy-disable on the link (could be clicked during regeneration).
  - file-list ul has aria-labelledby="tp-files-h" — correct.
  - Table thead — has <th scope="col"> and <th scope="row"> — correct.
  - Caption: visually-hidden caption — good for a11y but screen reader-only.
  - onChange on PDF match select — when re-selecting same option, onChange doesn't fire.
  Should add explicit Undo/reset (there is an Undo button — good).
  - Match select onChange: when clearing to "" (none option), calls
  actions.onMatch(req.id, null) — good.
  - btn-danger reset — busy disables but no confirmation; spec just says "destructive
  action" — reset is destructive enough that a confirm could help but isn't required.
  - Index toggle has label "for" but the label wraps the input — the for attribute on a
  label that contains the input is harmless but redundant.
  - Busy on dropzone: dropzone disabled but the hidden file input is not disabled (line
  399-413) — dropzone click handler ignores clicks on disabled (browser blocks), so OK.
  But the input itself doesn't have disabled.
  - Status ok icon label "Ready" — but the contract still uses status ok internally; UI
  shows "Ready". This contradicts spec.
  - Status icon glyph for 'ok' (line 170): '✓'. Good.
  - Bangla step labels — translated.
  - tp-step step labels at narrow widths: .tp-step-label { min-width: 0; overflow-wrap:
  anywhere; } (line 345) — handles wrap.
  - Sidebar toggle/buttons disabled when busy correctly.
  - tp-stat-sub (line 517): a span inside a span — accessibility-wise OK.
  - Result download doesn't disable while busy.
  - for: 'tp-index-toggle' on the label — toggle label wraps the input but uses for.
  Redundant but harmless.
  - Keyboard focus on date input/select restored via captureFocus/restoreFocus — good.

  Let me also check specific small issues:

  - btn-block display: flex — fine, inline-flex base then flex when block.
  - Result row dl — no dl structure here for the result, just a dl. Wait, line 605 uses
  dl with dt/dd children. OK.
  - tp-status-ok uses green background — correct.
  - tp-status-not-provided uses grey — correct.
  - tp-blocker-reason uses flex: 0 0 auto — could overflow on mobile (no flex-wrap on
  .tp-blocker). Let me check… line 525-535: .tp-blocker { display: flex; ... gap: 8px;
  padding: 8px 10px; ... }. No flex-wrap. On narrow mobile, blocker-reason is
  right-aligned with auto flex. Could overflow. Minor issue.
  - for: 'tp-index-toggle' on toggle label uses for — since label contains the input, the
   for is redundant but not wrong.
  - tp-btn-block applies display: flex which overrides display: inline-flex from .tp-btn.
   OK on the layout but .tp-btn-block is only applied to sidebar/download buttons.
  - Busy-state: line 763-764: data-busy and aria-busy on container. Good.
  - tp-dropzone is a <button> for keyboard activation — good.
  - Drop label click: line 414: button disabled when busy, so the onClick won't fire.
  Good.
  - onDragover doesn't check busy — if (!view.busy) { ... } — good.
  - onDrop: if (!view.busy && fl && fl.length) actions.onUploadFiles(...) — good.
  - Match select: only fires when currentFile exists; the disabled state has view.busy ||
   !currentFile. Once a file is selected, expiry input is enabled. Undo button only
  enabled when currentFile exists. Good.
  - Re-selecting same file after reset: line 357 e.target.value = '' — clears input value
   so re-selection works. Good.
  - aria-label for capability toggles — for: 'tp-index-toggle' is redundant since the
  input is inside the label.
  - tp-status width — no max-width; status text could push wide on mobile. The tp-status
  uses inline-flex + white-space: nowrap. Could cause horizontal overflow on the
  requirements table on mobile (<900px the table is stacked, so each cell is full width,
  so no horizontal overflow per cell).
  - tp-dropzone-icon — display: grid — fine.
  - Result dl structure: lines 605-610 use <dl> but each child is a single <dt> or <dd> —
   should be wrapped in groups. Minor accessibility issue but valid HTML.

  Now let me write the audit report:

  Searched for 1 pattern, listed 1 directory (ctrl+o to expand)   
                                                           
◆ Good, the file puku2/UI_AUDIT.md doesn't exist yet. Let me write the audit report.

◆ Writing ➜ UI_AUDIT.md            
  ╰─ Error: Hook PreToolUse:Write denied this tool
                                                                                         
  Read 1 file (ctrl+o to expand)                                                         
                                                                                         
◆ The Write hook denied creation. Per the task: "Write only puku2/UI_AUDIT.md if allowed;
   otherwise report in chat."                                                            
                                                                                         
  Reporting in chat instead:                                                             
                                                                                         
  ---                                                                                    
  puku2 — U05 usability & bilingual audit                                                
                                                                                         
  Scope: read current puku2/ui.js and puku2/styles.css. Browser interaction not run (no
  browser opened per task scope).

  Confirmed defects (static read)

  #: D1
  Severity: High
  Where: ui.js line54 (STRINGS.en.status.ok)
  Issue: ok: 'Ready' — spec requires "OK"
  ────────────────────────────────────────
  #: D2
  Severity: High
  Where: ui.js line 56 (STRINGS.en.status['expiry-needed'])
  Issue: 'Expiry required' — spec requires "Expiry date needed"
  ────────────────────────────────────────
  #: D3
  Severity: Low
  Where: ui.js line 130
  Issue: BN 'মেয়াদের তারিখ প্রয়োজন' is semantically fine; verify with coordinator whetherlitera

    wording required
  ────────────────────────────────────────
  #: D4
  Severity: Medium
  Where: ui.js lines 611–616 (buildResult)
  Issue: Download <a> not busy-aware — stale URL clickable during regeneration
  ────────────────────────────────────────
  #: D5
  Severity: Medium
  Where: ui.js lines 512–522 (match select)
  Issue: onChange only fires on change; after assignMatch rejection, UI should reflect
  via
    blocker list (verify coordinator surfaces hash-duplicate errors in summary.blockers)
  ────────────────────────────────────────
  #: D6
  Severity: Low
  Where: ui.js line 685
  Issue: Toggle label uses for="tp-index-toggle" while wrapping the input — redundant but

    harmless
  ────────────────────────────────────────
  #: D7
  Severity: Low
  Where: ui.js lines 729–733
  Issue: role="status"/role="alert" set on wrapper even when empty notice — some AT may
    announce empty region
  ────────────────────────────────────────
  #: D8
  Severity: Low
  Where: ui.js lines 605–610
  Issue: <dl> contains loose <dt>/<dd> — should be wrapped in <div> for AT grouping
  ────────────────────────────────────────
  #: D9
  Severity: Low
  Where: ui.js lines 399–413
  Issue: Hidden PDF file input has no disabled mirror of busy; not user-reachable due to
    tabindex="-1", theoretical only
  ────────────────────────────────────────
  #: D10
  Severity: Low
  Where: ui.js lines 714–720
  Issue: Reset button has no confirmation; spec only requires busy disable, which is
    present
  ────────────────────────────────────────
  #: D12
  Severity: Low
  Where: styles.css lines 525–536 (.tp-blocker)
  Issue: display: flex with justify-content: space-between and no flex-wrap — long Bangla

    strings can overflow horizontally on narrow mobile
  ────────────────────────────────────────
  #: D13
  Severity: Low
  Where: styles.css lines 444–454 (.tp-status)
  Issue: white-space: nowrap with no max-width — long Bangla status strings can push chip

    wider than expected


  Status label cross-check (spec ↔ code)

  ┌───────────────┬────────────────────┬───────────────────┬───────────┐
  │   Code key    │    Spec English    │      Code EN      │ EN match? │
  ├───────────────┼────────────────────┼───────────────────┼───────────┤
  │ ok            │ OK                 │ 'Ready'           │ No — D1   │
  ├───────────────┼────────────────────┼───────────────────┼───────────┤
  │ missing       │ Missing            │ 'Missing'         │ Yes       │
  ├───────────────┼────────────────────┼───────────────────┼───────────┤
  │ expiry-needed │ Expiry date needed │ 'Expiry required' │ No — D2   │
  ├───────────────┼────────────────────┼───────────────────┼───────────┤
  │ expired       │ Expired            │ 'Expired'         │ Yes       │
  ├───────────────┼────────────────────┼───────────────────┼───────────┤
  │ not-provided  │ Not provided       │ 'Not provided'    │ Yes       │
  └───────────────┴────────────────────┴───────────────────┴───────────┘

  Bangla equivalents (lines 127–133): 'প্রস্তুত', 'অনুপস্থিত', 'মেয়াদের তারিখ প্রয়োজন', 'মেয়াদোত্তীর্ণ', '
  হয়নি'. Natural and semantically correct; minor wording review only.

  Suggested minimal fixes (small, mechanical)

  // ui.js STRINGS.en.status — two-line change
  ok: 'OK',                       // line 54
  'expiry-needed': 'Expiry date needed', // line 56

  /* styles.css — three small additions */
  .tp-stat-label { min-width: 0; }
  .tp-blocker { flex-wrap: wrap; row-gap: 4px; }
  .tp-status { max-width: 100%; }

  // ui.js buildResult — busy-aware download link
  const a = el('a', {
    href: view.result.url,
    download: view.result.filename || 'package.pdf',
    class: PREFIX + 'btn ' + PREFIX + 'btn-primary ' + PREFIX + 'btn-block ' + PREFIX +
  'btn-lg'
         + (view.busy ? ' ' + PREFIX + 'btn-busy' : ''),
    'aria-disabled': view.busy ? 'true' : null,
  }, L.download);
  // + add .tp-btn-busy { opacity: 0.5; pointer-events: none; } in styles.css

  Other checks (passed by read)

  - Action callbacks: all 10 spec callbacks (onLoadRequirements, onUploadFiles,
  onRemoveFile, onMatch, onExpiry, onLanguage, onReset, onGenerate, onToggleIndex,
  onExportCsv) wired with safeActions noop fallback (lines 745–756). No global state, no
  PDF parsing, no domain mutation — matches contract.
  - Keyboard focus: captureFocus/restoreFocus (lines 222–242) preserves focused element
  id and selection range, scoped via CSS.escape, only restores when not disabled. Hidden
  file inputs use tabindex="-1" + aria-hidden. All visible interactive elements have
  :focus-visible outlines (styles.css 125, 297, 324, 437, 567).
  - Accessible labels: file remove (line 472), match select (line 515), undo (line 530),
  date input (lines 542–543), language button (line 317), generate (line 701), dropzone
  (line 419) all have descriptive aria-label or aria-describedby. Step rail uses
  aria-label + aria-current. Notice slot uses role="status"/role="alert" + aria-live.
  Meter has role="progressbar" with aria-valuemin/max/now.
  - Busy-state controls: every interactive control except download anchor checks
  view.busy (dropzone 418, select 516, undo 529, date 541, toggle 690, csv 712, reset
  719, remove 471, lang 319, load 366, generate 700). Drop handlers check view.busy
  (lines 421, 427). Container sets data-busy + aria-busy (lines 763–764). Only the result
   <a> (D4) lacks this.
  - Mobile wrapping: overflow-wrap: anywhere set on titles, kv values, step labels, file
  names, blocker titles, included names, result file. .tp-button not used — sorry,
  .tp-btn-block uses flex. Stacked table layout below 900px with data-label
  pseudo-elements. Possible overflow points listed in D12, D13, plus .tp-stat-label lacks
   min-width: 0.

  Unrun browser checks (recommend verifying visually)

  1. Tab traversal: header → step rail → load JSON → dropzone → first match select →
  first date input → first undo → first file remove → sidebar toggle → generate → CSV →
  reset → language.
  2. Screen reader announcements on status change, busy start/end, language switch,
  generation completion.
  3. Drag-over visual: tp-dropzone-over class toggles (CSS line 323, JS lines 421–425).
  4. Focus restoration across rerenders triggered by typing in date inputs / changing
  match selects.
  5. Re-selecting same JSON / same PDF set after error or reset (input value="" reset at
  lines 357, 411).
  6. Layout at 360 / 414 / 768 / 900 / 1080 / 1440 px.
  7. Bangla text rendering: confirm Noto Sans Bengali / Nirmala UI is present on target
  machines; otherwise fallback to system-ui (line 30 stack).
  8. Whether summary.blockers includes hash-duplicate rejections and integrity errors
  from puku1 contract (UI surfaces them via L.status[b.status] at line 637).

  ---
  I attempted to write puku2/UI_AUDIT.md but the Write hook denied the operation. The
  full report above is the deliverable; no puku2 files were modified.

Coordinator note: historical U05 static audit was recovered from the user's pasted report. Its Ready/Expiry required wording findings are fixed in current source. Full browser mobile checks and native date regressions now pass. Harmless markup redundancy and unrun screen-reader concerns do not imply confirmed defects. UI implementation has been handed back by Claude U06.
