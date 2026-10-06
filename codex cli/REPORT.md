# V06 final public verification — complete

2026-10-06 18:36 Asia/Dhaka. Started 18:32; completed within ten minutes. Wrote only this report. Implementation and the regression script remained read-only. Used the previously read ECC browser-qa skill, bundled Playwright and installed native Chrome in fresh signed-out contexts. No Git, installations, deployment, server or agents.

**PASS within the exercised scope: public release matches the supplied full SHA `87d3ae6023c236e25168f0f7c87f795bd1b0c559`; all nine browser regression groups pass; actual downloaded mandatory PDF has 16 independently decoded pages. No confirmed release blocker found in these checks.** Submission receipt, eligibility and unrun checks below remain separate.

## Exact release and bytes

Target: https://tenderdesk-web-production.up.railway.app/

`/release.json` HTTP 200: commit `87d3ae6023c236e25168f0f7c87f795bd1b0c559`, builtAt `2026-10-06T12:31:29.574Z` (18:31:29 Asia/Dhaka). All nine regression contexts observed that SHA and those assets. Manifest remained identical through the extended flow; final SHA checked again at 18:35. The user's subsequently supplied expected SHA exactly matches the observed revision. Earlier V04/V05 public evidence for `3b0c057f960b321de9c956a00af7c98803e45cc5` is historical; this is a new independently exercised public release.

Each artifact fetched independently with HTTP 200 and hashed from its actual response bytes:

| Artifact | Bytes | Actual SHA-256, identical to manifest |
| --- | ---: | --- |
| `assets/index-CZjRIh4-.css` | 17142 | `7e08650c5ca2bdb0afef350572cd5f7019b5587b2928432afe9e0c43d622ab7c` |
| `assets/index-DnFJohs3.js` | 480755 | `95d22321df21780dfa3ce01712f1ec166a0d746aa81abd5679845427d39152bf` |
| `index.html` | 573 | `54662b9e1635c09ca5e3b8979b38beaebecaa4af27fede5e0c40afeac5055f3c` |

Actual browser download `T-2026-0417_Package.pdf`: **213266 bytes**, SHA-256 `b389e7ac767f337f08e386797ebd6a3eb12cdaec1ea656586e958c449ac37274`, independently decoded with installed pdf-lib to **16 pages**. This is the downloaded public output, not a local generator result or reported pageCount. Creation time makes this output hash specific to this run.

Organizer JSON and the eight mandatory PDFs are the unchanged bytes listed in V05 below. Only metadata changed for CSV/HTML/prototype cases. The 31-file limit check used identical copies of the provided trade-license bytes with distinct names; no synthetic PDF fixture was invented.

## PASS / FAIL / UNRUN matrix

| Result | Trigger and actual evidence |
| --- | --- |
| PASS | Exact supplied public SHA and all three response-byte asset hashes above; revision stable across checks. |
| PASS | `node "codex cli/browser-regressions.mjs" --url=https://tenderdesk-web-production.up.railway.app/`, 18:32:52–18:33:15, exit 0: all nine regression groups PASS; no uncaught application errors. |
| PASS | IDs `__proto__`, `constructor`, `toString`; match real trade/TIN/VAT, edit trade expiry, download CSV. Decoded expiry cells exactly `["2027-06-30", "", ""]`; no inherited function, native-code or Object text; all three statuses `OK`. |
| PASS | Eight whitespace/control-prefixed `=,+,-,@` title/filename pairs, including newline, tab, NBSP and BOM. English and Bangla actual CSV downloads decode to 11 records × 6 columns; every tested unsafe cell has a leading apostrophe; embedded quotes, commas and newlines preserved exactly. |
| PASS | Real native date keys: `2027-06-30` → Home, Right, Right, 2,0,2,8 → `2028-06-30`. Intermediate values `0002`, `0020`, `0202` produce immediate `Expiry date needed`, `Expiry date needed`, `Expired`, then `OK`; Generate tracks status; first digit removes and revokes old PDF URL. Real month/day keys finish at `2028-07-29`. |
| PASS | Exact English labels `Missing`, `Not provided`, `Expiry date needed`, `Expired`, `OK`; all five exact Bangla labels verified; switch back works. Expiry `2026-10-19` fails and `2026-10-20` passes against actual organizer deadline. |
| PASS | Removal clears affected match/expiry; reset, valid replacement, refresh and Back navigation all remove stale download anchors and make remembered old Blob URLs unusable. Back used an actual BFCache restoration (`pageshow.persisted` history `[false,true]`). |
| PASS | Actual sample JSON → ten ordered rows; eight mandatory organizer files matched; optional R06/R07 absent; trade/bank dates entered; Generate enabled; real Chrome PDF download event and readable byte stream obtained. |
| PASS | Independent traversal of downloaded PDF content/Form/Image XObjects: every one of the 15 source pages appears on exact output pages 2–16 in document and within-document order. Scanned declaration image encoded bytes hash preserved; original page widths preserved; each source page receives an added footer margin. Cover/footers were not visually rendered in V06. |
| PASS | Enabling index invalidates the earlier download; newly generated indexed bytes independently decode to 17 pages. Detailed index text/page-range rendering was not rechecked. |
| PASS | Actual renamed experience duplicate has identical source SHA; attempting to map it to R06 rejects and restores the empty selector. Actual English error: `Identical file content is already matched to another document. Undo that match first.` |
| PASS | Actual `company_logo.png` rejected, accepted file count unchanged; error `0 PDF files added. company_logo.png: Only PDF documents are allowed.` |
| PASS | 31 unchanged organizer trade PDFs with distinct names: exactly 30 accepted; 31st rejected with `Maximum 30 PDF files.` Malformed replacement JSON preserves those 30 files and ten requirements. |
| PASS | Paused real organizer PDF arrayBuffer read: Reset, requirements chooser and Generate are disabled. Releasing the same actual bytes finishes upload normally; subsequent Reset clears files and requirements. |
| PASS | Loaded sample at viewport 375×812: document and body scrollWidth both 375 in English and Bangla. Focus + Enter activates language switch; focus + Space toggles index. This establishes functional controls/layout widths, not a full visual/accessibility audit. |
| PASS | Imported tender title, requirement title and real-PDF filename containing `<img src=x onerror="window.__v06Xss=1">` display literally. No inserted img/svg in app; script sentinel remains unset. |
| PASS | Observed page network during JSON/PDF upload, generation, duplicate handling and HTML metadata checks: four requests, all same-origin GET, no request bodies, no external requests, no document upload. No cookies/localStorage/sessionStorage entries and no page errors. Asset/manifest/README audit GETs via Playwright request client are separate audit traffic. CSV network traffic was not separately instrumented. Scope is observed traffic, not proof of all future behavior. |
| PASS | README fetched from raw GitHub at exact deployed SHA, HTTP 200, 6905 bytes, SHA-256 `236116be6119f62118c4e8451e9485b076aa2b026588035e5ae2356e8d3c24a6`. Contains participant registration, correct live URL, local run instructions, main/bonus features, limitations and useful AI prompt; old pending placeholders absent. Previous V04 README finding resolved in this revision. |
| UNRUN | Expected simultaneous reset/replacement recovery assertion during paused upload: ordinary Reset click timed out because the button is intentionally disabled while busy. Follow-up verified busy guards and clean completion; no race-recovery pass claimed. Programmatic bypass of disabled controls and generation-race injection not exercised. |
| UNRUN | Actual 50 MiB byte boundary: organizer PDFs cannot reach it within 30 files; no fabricated PDF bytes or spoofed file.size used. |
| UNRUN | Native OS chooser, native save-to-disk/open, visual PDF cover/footer/trade/declaration rendering, print readability, full keyboard traversal/screen-reader/color contrast, other browsers and exhaustive mobile widths. Chrome input-file APIs and real browser download streams used. Coordinator's earlier visual/native evidence remains separate. |
| UNRUN | Actual spreadsheet formula execution. Checked neutralized decoded cell bytes, not Excel/LibreOffice execution. |
| UNRUN | Encrypted/corrupt organizer PDF paths; supplied sample has no such fixture. Exhaustive security assessment and hosting hardening remain outside demonstrated evidence. |
| UNRUN | Final form receipt, registration authenticity, deadline eligibility, complete commit/push cadence and final submitted SHA. No Git or submission action performed. Existing coordinator ownership applies. |

## Limits and handover

Extended PDF/assets/duplicates/mobile/HTML/network/README script: exit 0, run entirely from transient stdin without writing files. Upload-limit/malformed-replacement script passed its first two checks, then exited 1 on the disabled Reset click timeout; this was a harness attempt blocked by an observed UI guard, not a reproduced application defect. Focused busy-guard/recovery follow-up: exit 0. All browser processes from these checks closed in finally blocks.

Local source hashes remained stable during the nine-group run and match V05. Those hashes are local evidence only; public acceptance above comes from served bytes and exercised deployed behavior. No implementation, fixtures, regression script, deployment or root configuration changed. No newly reproduced implementation finding to assign. Handover complete; writing stopped.

---

# V05 report — complete / browser regressions handed back

2026-10-06 18:21 Asia/Dhaka. Started 18:15; completed within ten minutes. Wrote only `codex cli/browser-regressions.mjs` and this report. Implementation remained read-only. Used the previously read ECC browser-qa skill; no Git, installations, deployment, server or agents.

**Final localhost run: 9/9 regression groups PASS, exit 0**, 18:20:11–18:20:19, existing http://127.0.0.1:5173/. Installed bundled Playwright launched native Chrome headless in fresh en-US contexts. Initial sandbox Chrome spawn was blocked by EPERM; the authorized elevated browser run succeeded. All JSON/PDF bytes are the actual organizer files; metadata/title/filename variations exist only in memory. No synthetic PDFs or fixture edits. File-input uploads use Playwright `setInputFiles` with buffers; CSV bytes come from actual browser download streams. Generated PDFs are fetched as actual Blob bytes before testing remembered URL invalidation. This is not an independent disk-save/external-viewer or native chooser check.

Run from project root:

```powershell
node 'codex cli/browser-regressions.mjs'
node 'codex cli/browser-regressions.mjs' --url=https://tenderdesk-web-production.up.railway.app/
```

Runtime lookup is configurable with `PLAYWRIGHT_RUNTIME` (node_modules or playwright directory); optional `CHROME_PATH`, `SAMPLE_PACK`, `HEADLESS=0`, and `--only=<name substring>`. Default runtime is the supplied Codex bundled Node node_modules directory; no dependency added. The runner prints per-group evidence, fixture byte counts/SHA-256, revision manifest/module URLs and local source hashes to stdout. Exit 1 means failed assertions; exit 2 means missing prerequisites or blocked/uncompleted checks. Deliberately filtered groups remain UNRUN. Browser contexts and browser close on completion.

| Check | Local result / actual evidence |
| --- | --- |
| Prototype IDs | PASS. First three organizer IDs become `__proto__`, `constructor`, `toString`; unchanged trade/TIN/VAT PDFs matched. After trade expiry edit, decoded CSV expiry cells exactly `2027-06-30`, empty, empty; no inherited function/native/Object text. |
| Spreadsheet formula protection | PASS. Eight title/filename pairs cover newline and whitespace before all four `=,+,-,@` prefixes, including tabs, NBSP and BOM. Both English/Bangla exports pass. Independent CSV parser finds exactly 11 records × 6 columns, protective apostrophe and lossless embedded commas, doubled quotes and newlines. This verifies export bytes; native spreadsheet formula execution is UNRUN. |
| Native date keyboard | PASS. Real `Home, ArrowRight, ArrowRight, 2,0,2,8` sequence from 2027-06-30 produces 0002,0020,0202,2028 year values and ends exactly 2028-06-30. Immediate labels are `Expiry date needed`, `Expiry date needed`, `Expired`, `OK`; Generate disables/re-enables appropriately. Old download disappears and remembered Blob fetch fails after first typed digit and every subsequent edit. Real month/day key entry then ends 2028-07-29. Only initial fixture setup uses fill; the regression edit uses real keys. |
| Exact bilingual statuses | PASS. Exact English `Missing`, `Not provided`, `Expiry date needed`, `Expired`, `OK`; all five exact Bangla UI translations and html lang switch. Before-deadline expiry fails; equal deadline passes. |
| Removal | PASS. Trade removal sets Missing, clears its expiry and invalidates remembered PDF URL. |
| Reset | PASS. Requirements disappear; remembered PDF URL is unusable. |
| Replacement | PASS. Valid organizer JSON replacement clears files and invalidates remembered PDF URL. |
| Refresh | PASS. Fresh page has no download and remembered PDF URL fetch fails. |
| Back navigation | PASS. Real navigate-away/back restores BFCache: pageshow events `[false,true]`. Download absent and remembered URL fetch fails. Uses commit/UI waits because cached restoration emits no new load event. |

Local revision is the **working tree, not an attributed commit**; /release.json is absent/invalid on the Vite development server. Source hashes were unchanged throughout the final run:

| Source | SHA-256 |
| --- | --- |
| codex app/app.js | 2dec814368418bf5c7ae6092f994f171a593583e9876b73ffba218f74f83f79f |
| puku1/domain.js | 76e99503dfc39e1ea7436932f27bd1e94128abc4c9f93b5813de98eb097fad09 |
| puku2/ui.js | 468a67cd1333abb78828482b2dafb8c7d8c89b1c23bbe54b2d11d093dffcb190 |
| puku2/styles.css | 2b1b7a844d8fa86953fbffc4616a2cab5e07a601488ea93e3fc31e6f518bcda2 |
| claude/pdf.js | 770dd127f973b300189b35808a379cd7c0b143681bda9430950ec33c786d1320 |

**Public negative controls: 2 confirmed failed assertions, exit 1**, 18:19:56–18:20:01:

```powershell
node 'codex cli/browser-regressions.mjs' --url=https://tenderdesk-web-production.up.railway.app/ --only=CSV
```

Public manifest still identifies **3b0c057f960b321de9c956a00af7c98803e45cc5**, builtAt `2026-10-06T11:59:26.669Z`, with index-C9UhjwwM.js/index-B2k1oI1K.css. No claim that local fixes are deployed. Actual downloaded CSV repeats `function Object() { [native code] }` / `function toString() { [native code] }` in expiry cells, and decoded English title `\n=1,"quoted"\nEnglish` lacks protective apostrophe. These are the already-owned V04 defects (archived app.js:52,182; domain.js:415–428), independently caught by the new regression assertions and reported immediately. Seven non-CSV public groups were filtered/UNRUN; Bangla/formula cases after the first failing public title assertion were also UNRUN. Coordinator must rerun the full script after publishing fixes and record the new manifest SHA. Local evidence does not close public findings.

Initial harness attempts had a date day-segment selection error and BFCache load-event wait timeout; corrected native segment selection/commit waits before the final passing run. An old-public CSV button lacked the new local ID; changed CSV targeting to exact accessible bilingual names. Download timeout handling now attaches both promise rejection handlers immediately. Those initial harness failures were not treated as implementation defects. No new local application defect was confirmed.

UNRUN in V05: public full suite/new deployment, visual baseline/mobile/full accessibility, independent PDF page preservation rerun, disk-save/external spreadsheet/PDF viewing and native chooser. Existing V03/V04 PDF preservation evidence remains separate. Handed back script/report; stop writing. Implementation/deployment ownership remains with coordinator/Claude.

---

# V04 report — complete / read-only public audit handed back

2026-10-06 18:13 Asia/Dhaka, within ten minutes. Changed only `codex cli/release-audit.md` and this report. No implementation, Git, installs, deployment, server or agents.

Public revision **3b0c057f960b321de9c956a00af7c98803e45cc5**: independently verified public HTML/JS/CSS hashes against /release.json; isolated signed-out public browser core sample PASS. Actual output bytes decode to16 pages; all15 source pages/operators and scanned image bytes preserved in order with footer margin. Eight matches, expiry boundary, duplicates, English/Bangla, loaded375px mobile,31-to30 upload count and bounded Network/privacy checks PASS. Imported HTML-like strings render literally.

**Submission readiness FAIL:** public committed README still says live URL/registration/features pending while local README is improved. Coordinator must publish reviewed submission evidence and verify the matching final deployment. **Two metadata/CSV defects:** coordinator row-expiry lookup leaks inherited constructor/toString functions after a prototype-ID expiry edit; CSV guard leaves newline-prefixed formulas unneutralized. Actual spreadsheet execution not tested. File/line, triggers and exact evidence are in [release-audit.md](release-audit.md).

UNRUN: independent native chooser/save/open/full public visual-PDF check (coordinator reports them),50-MiB actual boundary, full keyboard/accessibility/vitals, fresh public back/stale-link/async race checks, final local UI polish, full Git history/push eligibility and official submission receipt. Minor deployed empty-state guidance/favicon404 recorded. Stop writing; all ownership remains with coordinator/worker owners.

---

# V03 report — complete / app.js handed back

2026-10-06 18:01 Asia/Dhaka, first actionable report within 10 minutes. Recovered UI is available. **Final results: npm test 63/63 PASS; independent sample verifier 12 groups PASS; npm run build PASS.** All commands exit 0 on their final runs. Domain/PDF owner fixes landed during review; earlier failures are retained as history below, not current blockers.

Real Chrome on the existing 5173 server exercised actual organizer File inputs, all eight mandatory matches, expiry boundary/expired trade, duplicate/reused-file rejection, English/Bangla, focused date editing, PDF and CSV download actions, source removal/reupload, replacement/reset, stale URL revocation and cached Back navigation. Loaded sample has no overflow at 375px English/Bangla or 320px Bangla. Browser output bytes decode to 16 pages; independent verifier establishes exact source page/content/image preservation. Network inspection found no unintended document uploads.

Native upload tool denied its workspace path; actual fixtures were served locally and assigned as browser File/DataTransfer inputs. Native chooser, disk-save/open, full visual PDF review, full keyboard-only walkthrough and public signed-out Railway/production serving remain unverified. Do not infer those passes from the browser integration checks.

No reproduced coordinator defect required an app.js change. **app.js ownership is released; no further V03 writing.** Changed only CLI report/review/acceptance documentation; verifier unchanged. Minor UI guidance finding for owner: initial/no-pack screen says all mandatory requirements are satisfied (`puku2/ui.js:579,600–601`) despite disabled Generate. See `review-integration.md` for precise actual evidence and remaining checks. No worker implementation edits, root configuration changes, Git, installations, deployment, agents or duplicate server.

---

# V02 report (V01 evidence retained below)

V02 first report: 2026-10-06 17:52 Asia/Dhaka, within 8 minutes. Wrote only `codex cli/review-integration.md` and this report; verifier unchanged because no defect was found. Read coordinator/domain/PDF source and shared contract. UI JS/CSS missing at first review.

Actual result: official verifier **FAIL**, exit 1 after 8 passed groups, on the already-assigned Puku1 unloaded-pack behavior. Existing duplicate-display-title and prototype-key findings also reproduced and remain owned by Puku1. Separate explicitly skipped, in-memory diagnostic reached and passed actual PDF-byte/source-content/image-order checks: mandatory no-index output **16 pages**. Independent decoded-text checks passed all 16 footer labels and cover fields/order; optional index bytes decode to 17 pages. These diagnostics do not convert the official verifier failure into a pass.

Coordinator callback harness passed upload accounting, non-PDF rejection, invalid replacement preservation, removal cleanup, reset/replacement epochs, stale generation discard and localized CSV Blob creation with mocked DOM/deferred operations. Earlier pagehide stale-link issue reproduced; current coordinator persisted-pageshow fix passes callback recheck, pending actual browser verification. Worker suites passed 52/52 using `--test-isolation=none`; default runner was blocked by sandbox spawn EPERM before tests ran.

See `review-integration.md` for file/line, triggers, evidence, limitations and integration actions. Pending: Puku1 fixes plus official rerun, UI integration, real browser/visual/CSV checks, production and signed-out Railway flow. No implementation edits, installations, Git, deployment or agents. No unrelated fixtures or root output written.

Final callback recheck also passed result invalidation on same match, expiry/index edits, successful upload, valid replacement and reset; expiry retained on same match, files cleared on replacement, language retained on reset. Last source inspection at 17:52: existing Puku1 findings still present; UI JS/CSS still absent. Later worker changes require a fresh rerun.

---

# V01 report

First report: 2026-10-06 17:46 Asia/Dhaka, within 8 minutes of assignment. Status: verifier/checklist implemented; application integration **ENVIRONMENT PENDING**, not passed.

Changed only assigned files:

- `codex cli/verify-sample.mjs`: executable Node ES module using organizer fixtures, real SHA-256 FileRecords, inspectPdf and independent pdf-lib parsing. Tests five statuses, expiry boundary/invalid date, duplicate groups and prevention, matching immutability/replacement/unmatch, package blockers and optional omissions. Generates mandatory no-index package in memory and asserts exactly 16 decoded pages, exact safe filename, ordered original content streams and image bytes on each output page, source dimensions/footer margin, and generation duplicate rejection. Exit 2 means missing environment prerequisites; exit 1 means failure; exit 0 means automated acceptance passed.
- `codex cli/acceptance.md`: explicit unrun manual checks and independent page-by-page oracle; browser lifecycle, accessibility, language, file safety, optional documents, cover/footers, production/public Railway flow and submission gates.
- `codex cli/REPORT.md`: actual evidence and pending integration steps.

Read `AGENTS.md`, local `TASK.md`, shared `docs/CONTRACT.md`, actual organizer sample README/JSON and PDF content streams, problem statement and rulebook. Expected values are based on organizer data and requirements, not implementation results. Rulebook text extracted with Python standard library; irrelevant embedded-font bytes are not treated as requirements.

Actual checks:

- `node --check "codex cli/verify-sample.mjs"`: **PASS**, exit 0.
- Independent read-only Node/pdf-lib parsing of all ten organizer PDFs: **PASS**, exit 0. Counts: financial 2, technical 6, TIN 1, VAT 1, bank 1, experience 2 each, scan 1, each trade license 1. Excluding duplicate experience and expired trade 2025 yields 15 source pages plus cover = **16**. This confirms the fixture oracle, not generated application output.
- Actual SHA-256 duplicate independently confirmed with Node and PowerShell: both experience PDFs equal `91cb4ab661a5418ff13a9b2361d14f71d6b63ad47a33f4468aa90a37d066f8cd`.
- pdf-lib decoded source content streams successfully; scanned page has an Image XObject, making image-byte preservation checks necessary. Visual identification/readability of the scan remains unrun.
- `node "codex cli/verify-sample.mjs"`: **ENVIRONMENT PENDING**, Node exit 2, zero integration assertion groups executed. At check time `puku1/domain.js` and `claude/pdf.js` did not exist. Coordinator-provided pdf-lib became available; no packages installed by V01. Missing prerequisites are not passing assertions.
- Repeat invocation from `codex cli/` using `node verify-sample.mjs`: **ENVIRONMENT PENDING**, Node exit 2 with the same missing modules; confirms prerequisite resolution works from either working directory. Final syntax recheck after edits: **PASS**, exit 0.

Pending checks and integration instructions:

1. Coordinator supplies domain/PDF modules, then runs `node "codex cli/verify-sample.mjs"` from repository root. Paths resolve relative to the verifier and also work from its own directory. Capture actual output and resolve failing assertions in the owning worker's implementation; V01 does not edit implementation.
2. Generated-package decoding, exact content/image order, filename, duplicate rejection and domain acceptance remain unrun until modules exist. The verifier uses pdf-lib's exposed low-level stream decoder; available decoder and source stream APIs were checked against installed dependency. It intentionally checks actual bytes rather than trusting reported pageCount. Visual cover/footer placement remains manual.
3. All checklist browser/production/deployment checks are unrun. No corrupt or encrypted PDF is supplied; those fixture-dependent browser checks are pending organizer data, not silently passed. No browser-generated download, screenshots or root output evidence created by V01.
4. Official registration number and Git authorization remain pending/HOLD. Coordinator owns repo naming, commit/prompt cadence, README/MIT/screenshots/output evidence, public HTTPS Railway validation, eligible commit and submission. No Git, package installation, deployment, agent spawning or other workers' report edits performed.

No application acceptance or deployment success is claimed.
