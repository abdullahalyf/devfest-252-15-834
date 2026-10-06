# D03 — independent domain edge-case verification (Puku1)

## Task ID
D03 — 10-minute independent domain edge-case verification (Puku1)

## Status
VERIFICATION COMPLETE — NO code changes applied. The coordinator subsequently
reassigned this task to Puku2; the run was halted before any `puku1/domain.js`
or `puku1/domain.test.js` edits.

## Files created during this D03 run (will be deleted by Puku1 before release)
- `puku1/probe.js` — read-only adversarial probe script; no domain changes.

## Files NOT changed
- `puku1/domain.js` — unchanged from D02.
- `puku1/domain.test.js` — unchanged from D02.
- `puku1/sample-pack/*` — unchanged (read-only input).

## Verification commands actually run
- `node --test --test-reporter=spec domain.test.js` → 49 pass, 0 fail, 80.9 ms.
- `node probe.js` → adversarial probes against the real sample-pack SHA-256 hashes.

## Adversarial probe — actual evidence (read-only)

### Duplicate detection on real organizer bytes
```
FILE COUNT: 10
duplicateGroups returned 1 groups
  group: [ 'experience_cert (1).pdf', 'experience_cert.pdf' ]
```
SHA-256 of both `experience_cert.pdf` and `experience_cert (1).pdf` are equal,
matching the contract ("one experience_cert.pdf duplicate copy has equal SHA-256").

### assignMatch — content / file / replacement / unmatch semantics
- Same-file reassignment: `expiry.R01 = 2027-06-30` retained (no-op) ✅.
- Unmatch: `matches.R01 = undefined`, `expiry.R01 = undefined` ✅.
- Replacement with different file: `expiry.R01 = undefined` (cleared) ✅.
- Same hash to two requirements: threw `file-already-used` ✅.

### evaluatePackage — status rules
- Happy path organizer sample: `canGenerate = true`, `included` lists all 8 mandatory documents in order, `integrityErrors = undefined` ✅.
- R01 → trade_license_2025.pdf with `2025-06-30`: `R01 = expired`, `canGenerate = false` ✅.
- R01 → trade_license_2025.pdf with no expiry date: `R01 = expiry-needed` ✅.
- Optional R07 matched with `2025-01-01`: `R07 = expired`, `canGenerate = false` (matched optional expired DOES block) ✅.
- Optional R07 matched with no expiry: `R07 = expiry-needed`, `canGenerate = false` (matched optional missing-expiry DOES block) ✅.
- Optional R06/R07 not provided: not in `blockers` ✅.
- All-optional loaded pack with no matches: `canGenerate = false`, `blockers = []` (consistent with Claude's generator gate) ✅.

### CSV injection hardening
- Title `=cmd|","\nattack` → rendered as `"'=cmd|"",""\nattack",…` (leading `=` neutralized; inner quotes doubled; embedded newline inside quoted string).
- Title `\tTAB-attack` → rendered as `'\tTAB-attack,…` (tab prefix neutralized).
- Both verified in JSON-encoded log output above.

### Malformed pack shapes — all rejected
12 distinct malformed shapes all threw `Error.code = 'invalid-requirements'`:
`string instead of object`, `null`, `no tender`, `no requirements`,
`invalid deadline 2026-02-30`, `id as number`, `mandatory as 1`, `order as 1.5`,
`duplicate id`, `empty title_en`, `tender bidder empty`, `tender missing`.

### Calendar validation
`isValidIsoDate` accepted only real calendar dates:
- 2026-02-30 → false (Feb has no 30th)
- 2026-04-31 → false (Apr has 30)
- 2025-02-29 → false (2025 is not a leap year)
- 2024-02-29 → true (2024 is a leap year)

### Defects discovered during this run
None. All seven checklist items from D03 pass.

### Observation (informational only — not a defect)
In the probe, `pageCount` came out as `9` because the probe used `pages: 1` for
every file when computing the SHA-256 in advance. The contract pageCount of 16
depends on `claude/pdf.js` `inspectPdf` returning the real page counts; the
domain module itself only sums whatever `file.pages` is supplied. This is the
expected app-layer responsibility and is not a domain defect.

## Ownership confirmation
Per the coordinator correction that arrived mid-run, the D03 domain audit
belongs to Puku1 but was misrouted to this session and is being handed back
without changes. Puku1 will delete `probe.js` before release (no value, only
read-only output was produced). D02 test count (49/49) remains the binding
deliverable.