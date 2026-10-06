# REPORT — P01 + P02 (Claude Code)

## Tasks
- P01: in-browser PDF inspection and tender package generation with pdf-lib 1.17.1. The package has an English cover, all source pages in the required order, and numbered footers in a reserved margin.
- P02: harden `generatePackage` so it checks the included rows against the loaded pack itself, instead of relying on the UI. Verify the output against the organizer samples.

## Files changed
- `claude/pdf.js`
- `claude/pdf.test.js`
- `claude/REPORT.md`

No other files were touched. No Git, installs or deploys.

## P02 changes (`pdf.js` `validateInput`; public arguments unchanged)
- `pack.requirements` is now the authoritative list.
  - It must be non-empty, and each requirement must be well formed.
  - Ids and orders must be unique, and `mandatory`/`has_expiry` must be booleans.
  - Otherwise generation fails with `invalid-input`.
- Each included row is checked against the loaded requirement with the same id:
  - an id not in the pack fails with `unknown-requirement`;
  - an id included twice fails with `duplicate-requirement`;
  - a different `order`, `title_en`, `mandatory` or `has_expiry` fails with `requirement-mismatch`. Changing these fields cannot get around the expiry, mandatory or ordering rules.
- The rest of generation uses the pack's requirement object, not the row's copy. That covers the expiry checks, sorting, cover and index.
- If any mandatory pack requirement has no included row, generation fails with `missing-mandatory`. The message lists the missing titles.
- No documents: an empty `included` fails with `no-documents`, the same rule as domain `evaluatePackage` (its `canGenerate` requires at least one included row).
  - An all-optional pack with one matched PDF generates normally (cover + PDF). No extra requirement is demanded.
- Unchanged from P01:
  - `invalid-pdf` / `encrypted-pdf` rejection;
  - `duplicate-content` checks (file id, hash and byte-identical contents);
  - `expiry-needed` / `expired` (strictly before the deadline fails; equal passes);
  - `page-count-mismatch`;
  - exact filename, ordering, English cover, optional index;
  - the 36pt footer band below embedded pages, and the `<tender_id> | Page X of Y` footer on every page.

## Checks actually run
- `node --test claude/pdf.test.js`: **14/14 pass**. That is the 9 earlier tests (two adapted to the authoritative-pack rule) plus 5 new ones:
  1. **Mandatory omission:** each of the 8 mandatory requirements is removed in turn. Every case fails with `missing-mandatory`.
  2. **Bad rows:**
     - an unknown id (`R99`) fails with `unknown-requirement`;
     - `R02` included twice fails with `duplicate-requirement`;
     - each changed field fails with `requirement-mismatch`: R01 `has_expiry:false` with its expiry date omitted, R10 `mandatory:false`, R09 `order` changed, R08 `title_en` changed;
     - an empty pack requirement list fails with `invalid-input`.
  3. **Domain coordination** (imports `puku1/domain.js` read-only):
     - the sample `evaluatePackage(...).included` generates 16 pages, equal to `summary.pageCount`;
     - all-optional in-memory pack with no documents: domain `canGenerate` is false, and generation fails with `no-documents`;
     - the same pack with one experience PDF: domain `canGenerate` is true, and the package has 3 pages, equal to the domain page count.
  4. **Index:** the index page lists starts/ranges 3, 4, 5, 6, 7-8, 9-14, 15-16, 17. Page 17 has the scan_0042 size + 36pt band.
  5. **Scanned declaration:** the SHA-256 of the scan_0042 image stream is found on output page 16, which carries the footer `T-2026-0417 | Page 16 of 16`.
  - Earlier tests still pass:
    - 16 pages without the index, with the exact filename `T-2026-0417_Package.pdf`;
    - pages in order, each with the 36pt band, content shifted above it, and a footer on every page;
    - 17 pages with the index, all footers `of 17`;
    - duplicate, expired and missing-expiry rejection;
    - source bytes unchanged;
    - rotation, long text and Bangla handled;
    - inspection page counts, and PNG/empty/truncated data rejected.
- Independent check `node "codex cli/verify-sample.mjs"` (run only, not edited): **12/12 assertion groups PASS**. These include 16 decoded pages, and pages 2–16 keeping the original content operators and image bytes in exact order.
- `node --test puku1/domain.test.js` (run only): 42/43. The failure is `assignMatch: no-op when re-selecting the same file`. That is Puku 1's domain code, not pdf.js.

## Known limits
- **Encryption:** rejection of encrypted/password-protected PDFs is untested. No such organizer sample exists, and the code relies on pdf-lib's `EncryptedPDFError` / `isEncrypted`.
- **Lost page features:** embedded pages keep the visible content only. Links, annotations and form fields are dropped.
- **Non-WinAnsi text:** characters Helvetica can't draw, such as Bangla, appear as `?` on the cover and index. P02 adds no font.
- **Visual check:** the layout was not reviewed in a PDF viewer. Checks are structural: sizes, operators, decoded text, image hashes.
- **Strict parsing:** a slightly malformed PDF that still displays may be rejected.
- **Row source:** rows must come from the same loaded pack. A pack replaced without recomputing the summary fails with `requirement-mismatch` or `unknown-requirement`, by design.

## Integration notes
- Call shape unchanged: `generatePackage({ pack: state.pack, included: summary.included, expiryDates, includeIndex, generatedAt })`.
- New error codes to map in the UI: `missing-mandatory`, `unknown-requirement`, `duplicate-requirement`, `requirement-mismatch`, `no-documents`.
- Existing codes: `invalid-input`, `duplicate-content`, `expiry-needed`, `expired`, `page-count-mismatch`, `invalid-pdf`, `encrypted-pdf`, `cover-overflow`.
- Add `claude/pdf.test.js` to the root test script if wanted. No contract changes requested.
- Writing has stopped.

## U03 — UI polish (ownership of `puku2/ui.js` and `puku2/styles.css` reassigned to Claude by the user)
- **Changed:** `puku2/ui.js` and `puku2/styles.css` only. The originals are backed up in the session scratchpad.
- **Preserved:**
  - `renderApp(container, view, actions)` and all 10 callbacks;
  - text-node-only rendering (the `html` attribute still throws);
  - bilingual strings;
  - focus and selection restoration;
  - the existing IDs: `tp-app-title`, `tp-tender-h`, `tp-step1-h`, `tp-json-input`, `tp-step2-h`, `tp-pdf-input`, `tp-upload-hint`, `tp-files-h`, `tp-file-list`, `tp-reqs-h`, `tp-req-table`, `tp-match-<id>`, `tp-expiry-<id>`, `tp-generate`, `tp-generate-help`, `tp-side-h`, `tp-result-h`.
- **Added IDs**, so focus survives a re-render: `tp-lang`, `tp-load-json`, `tp-upload-btn`, `tp-remove-<fileId>`, `tp-undo-<reqId>`, `tp-index-toggle`, `tp-csv`, `tp-reset`, `tp-download`, `tp-expiry-help-<reqId>`.
- **Visual changes:**
  - TenderDesk header: dark ink band, TD monogram, tender ID pill, language switch.
  - Four-step progress rail.
  - Step 1 now holds compact tender details as a `dl`.
  - Upload area is a `button`, with drag-and-drop calling the same `onUploadFiles`.
  - File rows show a PDF glyph and a duplicate badge.
  - Requirements ledger has an order number, a status edge colour, status icon plus text (not colour-only), and `min` = deadline on date inputs.
  - Sidebar: page-count stat, mandatory readiness meter (`role=progressbar`), blockers, numbered included list, prominent Generate button, and the download result shown inside the sidebar.
  - System fonts only; no new assets or dependencies.
- **Fixes:**
  - Before requirements are loaded, the UI shows "Load the requirements JSON (step 1) to begin" (localised). It no longer says "All mandatory requirements are satisfied".
  - Expiry help reads "Must be on or after the deadline (YYYY-MM-DD)" in English and Bangla.
  - The nested `<main>` was removed, since `index.html` already provides `main#app`.
  - The live region is always present.
  - CSV export is disabled until requirements are loaded.
- **Checks:**
  - `vite build` (output to the scratchpad, not the root `dist`) succeeds.
  - Headless Chromium (local Playwright build, driven over CDP against `vite preview`) ran the real sample flow: load JSON → upload 10 PDFs → match 8 → enter 2 expiry dates → Generate.
    - Generate became enabled, and the result shows `T-2026-0417_Package.pdf`, 16 pages.
    - The focused expiry input stayed focused after each re-render.
    - No horizontal overflow (`scrollWidth <= innerWidth`) at 1366px or 360px, in English or Bangla, empty or full.
  - Screenshots were inspected visually.
- **Limits:**
  - On mobile, requirement rows stack into tall cards, so the page is long.
  - Not checked with a real screen reader.
  - `puku2/REPORT.md` was not edited (Puku 2 owns it).

## U06 — Native expiry-date keyboard editing
- **Changed:** `puku2/ui.js` (`renderApp`, `el()`, new `keepFocusedDate`/`syncAttributes`) and `claude/REPORT.md`. Not changed: `styles.css`, app.js, domain, PDF.
- **Root cause:**
  - Every `input` event calls `onExpiry`, and the coordinator re-renders at once.
  - `renderApp` used `replaceChildren()`, so a new `<input type="date">` replaced the focused one.
  - Focus came back to the new input, but Chrome's segment state (which segment is active, partial digits) was lost.
  - Typing year `2` gave `0002-06-30`, and the next keys went into a fresh control, which ended blank.
- **Fix:**
  - When a date input inside the container has focus and the fresh render has an enabled date input with the same id, the focused input and its ancestors are kept connected and never moved.
  - Each kept node takes the fresh node's attributes and its `el()`-registered handlers.
  - Every other node is replaced by the fresh render. Status, `aria-invalid`, help, sidebar, blockers, Generate and the download result still update on every keystroke.
  - `.value` is written only when it differs from the fresh value (for example a coordinator-side clear). Writing it resets segment editing.
  - In every other case (no focused date input, input disabled or busy, structure changed) the old full replace and focus restore run unchanged.
  - IDs, actions, bilingual strings, `textContent`-only rendering and `onInput` immediate validation are unchanged. `onExpiry` is not debounced and does not wait for blur.
- **Before/after evidence:**
  - **Setup:** headless Chromium 1243 (local Playwright build, raw CDP), en-US locale. Real keys via `Input.dispatchKeyEvent`, with a real mouse click into the field. No `fill()`.
  - **Sequence (coordinator's):** actual JSON and `trade_license_2026.pdf` loaded, R01 matched, `2027-06-30` set. Then Home, ArrowRight, ArrowRight, 2, 0, 2, 8.
  - **Before:** `2=>0002-06-30 [new-node] | 0=>(blank) [new-node] | 2=>(blank) | 8=>(blank)`. Final `""`, status `expiry-needed`. Harness: 24 FAIL.
  - **After:** `2=>0002-06-30 | 0=>0020-06-30 | 2=>0202-06-30 | 8=>2028-06-30`, on the same connected node with focus kept, status `ok`. Harness: ALL PASS on the dev server and on the production build (`vite build` + `vite preview`).
- **Real-key checks (all pass after the fix):**
  - month `1 2` gives 2028-12-30; day `0 1` gives 2028-12-01; ArrowUp on the year gives 2029.
  - `10 19 2026` is expired: `aria-invalid=true`, status text "Expired" immediately, Generate disabled.
  - Day changed to `20` (the deadline, 2026-10-20) is OK, and `aria-invalid` is removed.
  - Backspace clears a segment: value is blank and status is `expiry-needed`. Retyping restores the date.
  - Typing into a blank field, `12 31 2026`, gives 2026-12-31 and enables Generate.
  - A whole-value commit, as the picker does, is applied.
  - Generate gives `T-2026-0417_Package.pdf`, 16 pages. A later ArrowUp edit removes the download link, and regenerating restores it.
  - Bangla keeps both values and shows the localized "on or after" help. Year editing works in Bangla.
  - 360px mobile: day key edit works, and there is no horizontal overflow in Bangla or English.
  - Replacing R01 with `trade_license_2025.pdf` clears its expiry. Typing `06 30 2025` is expired and blocks Generate.
  - Reset removes rows. After reloading, full key entry works.
  - Tab leaves the date input after 2 presses: year segment, then Chrome's own picker button, then `tp-undo-R01`. The same happens before the fix.
  - No page exceptions.
- **Regression:** the earlier U03 flow (value plus input event, like `fill()`) passes on the build: focus is kept, there is no overflow at 1366 or 360 in either language, and the package is generated (16 pages). `node --test claude/pdf.test.js` 14/14, `verify-sample.mjs` VERIFIED, `vite build` OK (output to the scratchpad).
- **Not run:** `scripts/browser-acceptance.mjs` fails with `Cannot find module 'playwright'` (the package is not installed, and installing was not allowed). Its steps are covered by the harness above.
- **Limits:**
  - The native picker popup itself was not opened (headless); the picker commit was simulated as a whole-value set plus an `input` event.
  - Only Chromium was tested; no Firefox or Safari.
  - Locale tested: en-US (segment order MM/DD/YYYY).
  - No real screen reader.
  - If the coordinator re-renders while busy, the date input becomes disabled and focus is lost, which is the old behaviour.
- Writing has stopped.
