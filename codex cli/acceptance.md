# V01 acceptance checklist

All browser, visual, production and submission checks below are **UNRUN**. Tick only after actual observation; a Node verifier pass does not imply browser acceptance. Use only organizer fictional sample data. Run `node "codex cli/verify-sample.mjs"` from root, or `node verify-sample.mjs` from this directory. Exit 0 = automated checks passed; 1 = assertion/runtime failure; 2 = environment pending. The verifier writes no PDF evidence file.

Independent oracle: organizer `problem_statement/AIDevFest-ViveCoding ProblemStatement.pdf` sections 4–6, 8–9; `AI_DevFest_Vibe_Coding_Rulebook_pwIsanM.pdf` sections 5, 8–11; actual sample JSON/PDFs. Deadline 2026-10-20. Trade 2026 expires 2027-06-30; bank expires 2026-12-31; trade 2025 expires 2025-06-30. Expected filename `T-2026-0417_Package.pdf`.

| Output pages (no index) | Requirement / supplied source |
| --- | --- |
| 1 | English cover |
| 2 | R01 / trade_license_2026.pdf (1) |
| 3 | R02 / 03_tin_certificate.pdf (1) |
| 4 | R03 / 04_vat_certificate.pdf (1) |
| 5 | R04 / bank_solvency.pdf (1) |
| 6–7 | R05 / experience_cert.pdf (2) |
| 8–13 | R08 / 02_technical_proposal.pdf (6) |
| 14–15 | R09 / 01_financial_proposal.pdf (2) |
| 16 | R10 / scan_0042.pdf (1 scanned declaration) |

R06/R07 remain not-provided. Exclude renamed duplicate, expired trade 2025 and PNG. Mandatory output: **16 pages without index**.

- [ ] **UNRUN — Load/upload:** load actual requirements JSON; confirm tender fields and sorted ten rows. Upload PDFs in arbitrary order; show accurate names/page counts. Upload company_logo.png as a document: reject clearly, leave Generate state correct. Remove/reselect the same file, including after an error/reset.
- [ ] **UNRUN — Bad files:** inventory supplied data has no known corrupt/encrypted PDF. If organizer supplies one, reject with readable error and keep working state usable. Otherwise mark this browser check unavailable; do not manufacture unrelated fixtures. Node PNG parser rejection alone does not prove upload validation.
- [ ] **UNRUN — Duplicate:** upload both experience PDFs; flag both by equal content despite different names. Attempt to match them to R05/R06: prevent reuse. One experience remains usable, duplicate excluded from output.
- [ ] **UNRUN — Status/expiry:** mandatory unmatched = missing; optional unmatched = not-provided. Matched expiry missing/invalid = expiry-needed. Trade 2025 with 2025-06-30 = expired. Deadline minus one day = expired; exactly 2026-10-20 = OK; later = OK. Generate disabled with clear blockers, enabled only when all checks pass.
- [ ] **UNRUN — Matching:** replace trade 2025 with trade 2026: clear old expiry. Selecting same file retains expiry. Unmatch/remove clears matching/date and invalidates download. Prevent one file/hash across two requirements; verify all cards update immediately.
- [ ] **UNRUN — Dataset replacement/reset:** valid replacement of organizer JSON atomically clears files/matches/dates/download; invalid JSON preserves working state. Reset retains language, removes download, clears data. Reset/replacement during upload/generation must prevent stale async work restoring old results. Any date/match/file/index change invalidates download.
- [ ] **UNRUN — Optional:** leave R06/R07 absent and generate successfully. Temporarily use an unmatched organizer PDF for optional R07: require expiry and include it only when valid; restore mandatory sample before evidence. Verify optional missing never blocks.
- [ ] **UNRUN — Languages/focus/mobile:** all main labels/buttons/errors/instructions in Bangla and English, requirement titles switch correctly, cover English. Keyboard reaches controls with visible focus; expiry entry retains focus/caret across rerenders; notices announced. At 320/375px no horizontal overflow; long filenames readable.
- [ ] **UNRUN — Imported text safety:** inspect coordinator/UI rendering for textContent or equivalent safe DOM construction; no untrusted innerHTML/HTML interpolation. Rendered sample text stays literal. Any hostile-text runtime probe needs organizer-permitted data; do not create extra PDF fixtures. Use DevTools Network to verify documents never leave browser and runtime fonts/assets need no external requests.
- [ ] **UNRUN — Download/visual PDF:** download through browser, decode/open saved file in Chrome; count 16 pages, exact filename and source/page order above. Cover has ID, title, procuring entity, bidder, deadline, creation date and ordered included names. Inspect all 16 footers: `T-2026-0417 | Page X of 16`, readable at bottom with no content overlap. Check scan/signature intact and all originals readable. Structural Node stream/image comparison cannot establish visual placement.
- [ ] **UNRUN — Production:** coordinator runs production build/preview; no missing JS/CSS/assets or console errors. Confirm local processing and 30-PDF/50-MiB limits, with organizer-permitted inputs only. If index exists, separately inspect its start pages/total footers; disable it for mandatory evidence.
- [ ] **UNRUN — Railway public flow:** after authorized coordinator deployment, use signed-out/incognito Chrome on public HTTPS URL; no Railway/login gate, app loads, upload/match/date/generate/download completes with actual sample; assets remain available and deployed revision matches final eligible commit. No deployment is authorized for V01.

Submission gates remain **PENDING**, owned by coordinator/user:

- [ ] Official registration number confirmed; public repo named `devfest-<official-registration-number>` (never infer from student ID). Git authorization is pending/HOLD; V01 performs no Git operations.
- [ ] At least three meaningful commits, each describing change and including actual AI prompt or `Manual edit`, no contest commit gap over 30 minutes; final eligible commit pushed and matching HTTPS release before cutoff. User-reported cutoff 2026-10-06 19:00 Asia/Dhaka; stop earlier if submitted. Rulebook's exact schedule is organizer-announced, not inferred from cover schedule.
- [ ] README includes name/registration, public HTTPS URL, run/build commands, main/bonus features, known gaps, AI tools and useful prompt; MIT LICENSE present; third-party licenses respected.
- [ ] Coordinator saves browser-generated `outputs/T-2026-0417_Package.pdf`, status screenshot(s) in `screenshots/`, and verifies output; submit repo URL, eligible commit ID and public HTTPS URL. V01 verifier holds output in memory and does not create root artifacts.
