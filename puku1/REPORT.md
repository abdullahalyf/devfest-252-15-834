# D02 — domain contract defect fixes

## Task ID
D02 — fix three confirmed domain contract defects (Puku1)

## Status
COMPLETE — 49/49 tests passing, exit 0, ~109 ms.

## Coordinator feedback (from `INTEGRATION_FEEDBACK.md`)
1. `evaluatePackage(null, [], {}, {})` must return an empty summary, not throw.
2. Remove the duplicate English display-title restriction in `validateRequirements`.
3. Use null-prototype maps and own-property checks so requirement IDs like `__proto__`, `constructor`, `toString` behave like ordinary keys.
4. (Bonus) CSV: missing expiry for an optional requirement should render blank, not an em dash. Reconciled with the existing meaningful assertion.

## Changed files (only assigned paths)
- `E:\vibecode_contest\vibecode_contest_final\puku1\domain.js` — three contract fixes + null-proto helper + CSV blank expiry.
- `E:\vibecode_contest\vibecode_contest_final\puku1\domain.test.js` — corrected the outdated assertion (em dash → blank, no-op prototype gap, duplicate title expectation inverted) and added 6 targeted regression tests.
- `E:\vibecode_contest\vibecode_contest_final\puku1\REPORT.md` — this file.

No Git, no installs, no deployments, no cross-worker edits.

## Fix details

### Fix 1 — empty summary for an unloaded / invalid pack
`evaluatePackage` now returns a single shared `emptySummary()` object (`{ rows: [], included: [], blockers: [], canGenerate: false, pageCount: 0 }`) for any of:
- `pack == null` / `undefined`
- non-object pack
- missing or invalid tender / deadline
- empty requirements array
- non-array `files`
- empty requirements array after a malformed tender

This satisfies the public contract and the independent V01 verifier that calls `evaluatePackage(null, [], {}, {})`.

### Fix 2 — duplicate display titles allowed
`validateRequirements` no longer rejects packs whose `title_en` repeats across requirements. The uniqueness set was removed entirely; only `id` and `order` uniqueness is enforced. Confirmed by a regression test that reuses an identical English title on two requirements with different ids/order and expects success.

### Fix 3 — null-prototype match / expiry stores
A new `copyMatchMap` helper creates maps with `Object.create(null)` and copies via `Object.keys(src)`, so:
- IDs like `__proto__`, `constructor`, `toString` are stored as ordinary own keys.
- Inherited prototype keys can never appear as matches and can never cause accidental prototype mutation.
- All membership checks use `ownHas(map, key)` (`Object.prototype.hasOwnProperty.call(...)`) — no `in` operator, no `Object.entries` on truthy objects, no `obj[key]` truthiness leaks.
`evaluatePackage` likewise reads via `readMatchMap`, iterates `Object.keys(m)`, and uses `ownHas(m, req.id)` for per-row lookups. Integrity, duplicate-hash and blocker detection were ported to the safe iteration. Immutability and expiry-clearing semantics are preserved.

### Fix 4 (bonus) — CSV blank expiry for optional / no-expiry rows
`buildChecklistCsv` now emits a blank cell when the row has no expiry date and the requirement does not need one. Expiring requirements that still need a date still show `(required)` / `(প্রয়োজন)` so the operator sees the missing field. Reconciles the earlier em-dash assertion with the coordinator's preference.

## Regression tests added (all green)
- `evaluatePackage: returns an empty summary for null pack (does not throw)` — exact contract: `rows: []`, `included: []`, `blockers: []`, `canGenerate: false`, `pageCount: 0`.
- `evaluatePackage: returns empty summary for undefined / malformed pack` — seven malformed inputs (undefined, null, 0, '', 'pack', [], `{tender:null}`, `{tender:{},requirements:[]}`).
- `validateRequirements: accepts duplicate title_en when ids and order differ` — confirms the relaxed rule.
- `assignMatch: stores match for id "__proto__" as an ordinary own key` — round-trip read, null-proto check, no inherited key leak, `{}.toString` still equals `Object.prototype.toString`.
- `assignMatch: rejects the same file id reused by "constructor" after "__proto__"` — duplicate-file rejection still triggers across proto-collision ids.
- `assignMatch: unmatching "__proto__" clears match and leaves Object.prototype intact` — own-property cleared, replacement with a different file clears expiry, `Object.prototype` unchanged.
- `evaluatePackage: prototype-id match is treated as an ordinary own key` — full pipeline produces `canGenerate: true`, 3 included rows, `pageCount = 4`, no integrity errors, file ids are real and not prototype fallbacks.

## Corrected existing tests
- `assignMatch: no-op when re-selecting the same file` — switched to `deepEqual` (loose) so the null-proto returned maps compare equal to the plain `{}` inputs; added explicit `getPrototypeOf` checks.
- `validateRequirements: rejects duplicate title_en` — inverted to `accepts duplicate title_en when ids and order differ`.
- `buildChecklistCsv: emits header and one row per requirement, sorted by order` — R06 row now expects blank expiry cell.

## Exact checks / output summary
`node --test --test-reporter=spec domain.test.js`

```
ℹ tests 49
ℹ suites 0
ℹ pass 49
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 109.3328
```

Exit code: 0. Full output preserved in `puku1/test_out.txt`. D02 contract scenarios (null-pack, duplicate titles, prototype keys) all pass; the D01 spec scenarios (mandatory/optional missing, missing expiry, expired 2025-06-30, valid 2027-06-30, boundary 2026-10-20, duplicates, replacement/unmatch immutability, organizer 16-page happy path) also still pass.

## Known gaps / interface notes
- None for the assigned module. Independent V01 verifier in `codex cli/` was not invoked from this session because that path is outside the assigned scope, but the fix was made to satisfy its known `unloaded evaluatePackage` expectation.
- No external API rename; all six exports from D01 are preserved with the same signatures.
- CSV column order and Bangla label set are unchanged; only the no-expiry cell rendering was relaxed.