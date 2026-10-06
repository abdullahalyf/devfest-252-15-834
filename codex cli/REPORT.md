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
