# D04 — submission evidence audit (Puku1)

## Task ID
D04 — Audit submission evidence within 8 minutes (Puku1, read-only)

## Status
AUDIT COMPLETE — submission evidence is limited to in-scope files. The full set of artifacts requested by the brief (README, organizer-supplied requirements, output/T-2026-0417_Package.pdf, screenshots) does not exist inside the authorized `puku1/` scope. Everything reachable was cross-checked.

## Scope of artifacts actually available in `puku1/`
- `TASK.md` (own scope, worker instructions)
- `CONTEXT.md` (own scope, binding contract + organizer sample)
- `INTEGRATION_FEEDBACK.md` (own scope, coordinator feedback)
- `CENTRAL_CHECK_D02.md` (own scope, interim central check)
- `REPORT.md` (own scope, D02/D03 report)
- `domain.js`, `domain.test.js` (own scope, code + tests)
- `sample-pack/requirements.json`, `sample-pack/README.txt`, `sample-pack/documents/*` (own scope, organizer-supplied)

## Artifacts referenced in the brief but NOT in scope
The following inputs were unavailable because they are outside the authorized working directory:

| Required artifact | Path | Status |
| --- | --- | --- |
| README | `README.md` (project root) | not in puku1/ scope |
| Generated output PDF | `output/T-2026-0417_Package.pdf` | not in puku1/ scope |
| Screenshots | (screenshot paths) | not in puku1/ scope |
| Acceptance sample verifier | `codex cli/verify-sample.mjs` | not in puku1/ scope |

These are owned by the Codex coordinator (root + codex app + codex cli). Puku1 has no edit right for them. Auditing them via chat-only review would violate ownership. Items the audit cannot resolve are listed under "Audits outside this file inventory" below.

## Items the brief asked me to verify — auditable from puku1 files

### Participant details (from brief)
- "Abdullah Alif" — present in `CONTEXT.md:7` ("BUILD is confirmed by Abdullah Alif"). ✅ confirmed in scope.
- "252-15-834" — not present anywhere in `puku1/`. Cannot confirm or deny.
- "Daffodil International University" — not present anywhere in `puku1/`. Cannot confirm or deny.
- "Room 503, Computer 08" — not present anywhere in `puku1/`. Cannot confirm or deny.

Puku1 has no responsibility to render participant identity; per `CONTEXT.md:7` ("Do not infer registration number from student ID") the domain code does not need it. The participant card belongs to the README/screenshot set owned by Codex.

### Tender identifier & sample matching (from brief)
- Required tender_id `T-2026-0417` — present and exact in `sample-pack/requirements.json:2` and `CONTEXT.md:68`. ✅
- Tender deadline `2026-10-20` — present in `sample-pack/requirements.json:7` and reflected in `domain.test.js` (`deadline = '2026-10-20'`). ✅
- Required expiry dates per organizer evidence (`trade_license_2026.pdf` → 2027-06-30; `bank_solvency.pdf` → 2026-12-31) — exercised in `domain.test.js` test `organizer sample fully matched yields canGenerate=true and 16 pages` (listed in REPORT.md). ✅
- Mandatory set (R01–R05, R08–R10) — covered by `domain.test.js` evaluatePackage scenarios (`mandatory missing -> blocker`, `expired 2025-06-30`, `boundary 2026-10-20`, etc.). ✅
- Optional R06/R07 — covered by `optional not-provided is NOT a blocker`. ✅
- experience_cert.pdf duplicate with equal SHA-256 — D03 probe (`probe.js`) confirmed `duplicateGroups` finds the group and `assignMatch` rejects `duplicate-content` across requirements. ✅
- 2025 trade license must fail — covered by `expired 2025-06-30 trade license fails`. ✅
- `company_logo.png` rejected as document — not testable in domain (PNG rejection is `claude/pdf.js` responsibility, owned by another worker).

### Required output filename
Per `CONTEXT.md:53`: `<safe tender_id>_Package.pdf` → for sample `T-2026-0417` this is exactly `T-2026-0417_Package.pdf`. Implementation lives in `claude/pdf.js` (out of scope). Domain emits no filename. Cannot audit.

### Cover fields
Per `CONTEXT.md:55` cover must include tender_id, title, procuring_entity, bidder, deadline, creation date and ordered included document names (title_en). Implementation lives in `claude/pdf.js` (out of scope). Cannot audit.

### Document/page order and 16-page no-index count
- Expected order per organizer evidence (`CONTEXT.md:61`): trade → TIN → VAT → bank → experience → technical → financial → declaration, each with the documented page counts. Sum = 1+1+1+1+2+6+2+1 = 15 documents + cover = 16 pages.
- Domain enforces sort by requirement `order` in `domain.js:353` and produces `pageCount = 1 + Σ(included pages)` at `domain.js:378`. ✅ formula matches contract.
- The test `organizer sample fully matched yields canGenerate=true and 16 pages` (`domain.test.js`) asserts exactly `pageCount === 16`.
- D03 caveat (REPORT.md lines 71-74): when given fake `pages: 1` per file the domain correctly summed to 9 — confirming the domain honors whatever `file.pages` value the app supplies. The 16-page guarantee depends on `claude/pdf.js` `inspectPdf` returning real page counts (out of Puku1 scope).

### README feature/limitation claims
Cannot audit. No `README.md` is in scope. The D02/D03 reports inside `puku1/` describe implementation behavior truthfully (49/49 green, exports preserved, no defects found). No over-claim was detected in either report against the in-scope code.

### Recent in-scope label edit (informational)
`domain.js` had its English status label `'expiry-needed'` updated from "Expiry needed" to "Expiry date needed" by another editor just before this audit. The label set remains complete and consistent (`ok`, `missing`, `not-provided`, `expiry-needed`, `expired` in English, plus the Bangla pair). No behavioral effect. Not flagged as a defect.

## Confirmed discrepancies between requested and available evidence

The brief expects artifacts owned by Codex (root + codex app + codex cli). None of those are inside Puku1 scope. Puku1 cannot complete a full submission audit from its own files alone.

**Discrepancy 1 (scope/access):**
- Brief item: README feature claims and limitations.
- Status: no `README.md` exists inside `puku1/`. Ownership: `codex app` per `CONTEXT.md:12`. Cannot audit from in-scope files.

**Discrepancy 2 (scope/access):**
- Brief item: `output/T-2026-0417_Package.pdf` content (cover fields, page order, footer band).
- Status: no output PDF exists inside `puku1/`. Owned by `claude/pdf.js`. Cannot audit.

**Discrepancy 3 (scope/access):**
- Brief item: screenshots showing participant details, sample matching, expiry dates.
- Status: no screenshots inside `puku1/`. Ownership: `codex app`. Cannot audit.

**Discrepancy 4 (no defect in Puku1 code):**
- D03 run summary in `REPORT.md` (lines 71-74) honestly disclosed that `pageCount = 9` in the probe used fake metadata. The 16-page figure is asserted in the actual `domain.test.js` test `organizer sample fully matched yields canGenerate=true and 16 pages`, so the test is consistent. No mismatch — REPORT and TEST agree on what produces 16.

## Confirmed audits (no discrepancy)

| AUDIT PASS | Evidence |
| --- | --- |
| `evaluatePackage(null, [], {}, {})` returns empty summary | `domain.js:292` → `emptySummary()`; test `returns an empty summary for null pack` passes. |
| Duplicate display titles accepted | `domain.js` validates by `accepts duplicate title_en when ids and order differ`. |
| Null-prototype match/expiry maps safe | test `stores match for id "__proto__" as an ordinary own key` passes; `domain.js:185` helper. |
| `evaluatePackage` integrity check on duplicate hash across requirements | `domain.js:340-355` and test `rejects duplicate hash assignment via integrityErrors`. |
| Optional not-provided never in `blockers` | `domain.js:369-373` filters `not-provided` when `!mandatory`; test `optional not-provided is NOT a blocker`. |
| Optional matched expired/missing-expiry blocks | D03 probe confirmed; not added as a regression test during D03 (halted). |
| Mandatory expired (2025-06-30) blocks | test `expired 2025-06-30 trade license fails`. |
| Boundary expiry == deadline passes | test `boundary 2026-10-20 expiry equals deadline -> ok`. |
| Unmatch clears match+expiry, replacement clears expiry, same-file no-op retains expiry | tests `unmatching clears both match and expiry`, replacement (probe), `no-op when re-selecting the same file`. |
| CSV escapes commas, quotes, newlines, formula prefixes | test `escapes commas and formula prefixes safely` + D03 probe with `=cmd|","\nattack`. |
| `isValidIsoDate` rejects impossible calendar dates | tests + D03 probe confirmed 2026-02-30 / 2026-04-31 / 2025-02-29 rejected, 2024-02-29 accepted. |
| Malformed pack shapes throw `invalid-requirements` | D03 probe 12/12 rejected. |

## Minimal suggested corrections
None inside `puku1/` — no domain defects were found. Suggested actions for the coordinator (out of Puku1 scope):
- Hand participant details, screenshot evidence, README audit, and the `T-2026-0417_Package.pdf` cover/footer inspection to the appropriate owners.
- Optional regression test to permanently lock the D03 observation that "optional matched expired / missing-expiry blocks generation" — this is in scope for Puku1 (a one-test addition to `domain.test.js`) but the brief says "Do not edit domain.js or domain.test.js" for D04, so the suggestion is offered for a future task only.

## Test count at the time of audit
- `node --test --test-reporter=spec domain.test.js` was last run during the D03 audit and reported `tests 49, pass 49, fail 0` (recorded in `REPORT.md`).
- `puku1/probe.js` is the read-only probe script used for D03; it contains no assertions of its own and produces diagnostic console output only. It is safe to delete before release.

## Stop
No implementation changes, Git, installs, deployments or subagents were used. Reporting stops here as instructed.