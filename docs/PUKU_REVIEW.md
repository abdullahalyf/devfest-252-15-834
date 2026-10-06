# Automated Puku read-only integration review

Historical static review recorded before the final public verification. This review ran Read/Grep/Glob only: wording such as checks pass is a source-inspection conclusion, not test execution. Public deployment and date/CSV issues mentioned as pending are superseded by VERIFICATION.md and Codex CLI V06. No new runtime blocker is established by this report.

Now I have enough context. Let me consolidate my findings into the final report.

**Integration Audit Report (read-only)**

**Files audited:** `docs/CONTRACT.md`, `codex app/app.js`, `puku1/domain.js`, `puku2/ui.js`, `claude/pdf.js`, `README.md`, `problem_statement/problem-pack/sample-pack/{requirements.json,documents,README.txt}`, `package.json`, `index.html`, `codex cli/verify-sample.mjs`.

**Result: No contract-blocking defects found.** All four modules wire together consistently and the README sample walkthrough matches the actual fixture and current code. Integration boundary checks pass:

- `renderApp(container, view, actions)` receives exactly the 10 callbacks listed; every action in the UI calls the real coordinator function (no stub paths).
- The coordinator passes a view containing all required fields (`lang`, `pack`, `files`, `summary`, `busy`, `notice`, `result`, `includeIndex`) and `renderApp` defensively coerces each.
- `summary()` re-maps `expiryDate` onto rows consistent with `evaluatePackage`, and `included` stays in requirement order.
- `evaluatePackage` defends against unknown match keys, unknown file ids, and same-hash duplicates; `canGenerate` stays false for an unloaded/inconsistent pack; empty pack returns `canGenerate:false`.
- `assignMatch` rejects unknown requirement/file, reused file id, and same-hash via different file id; clears expiry on change; preserves expiry on same-file reassignment; never mutates inputs.
- Status codes match contract (`missing`, `not-provided`, `expiry-needed`, `expired`, `ok`); expiry equal to deadline returns `ok`; expiry strictly before returns `expired`.
- `generatePackage` re-validates the pack as authoritative (not the supplied rows), enforces mandatory inclusion, rejects duplicate contents both by file id/hash and by byte-equality, and emits the footer label on every output page with correct `Page X of Y` totals (cover=1, +optional index, +source pages).
- Index page numbering math: with 1 index page, `next = 1 + 1 + 1 = 3` ⇒ cover=1, index=2, first source=3. Without index, `next = 1 + 0 + 1 = 2` ⇒ cover=1, first source=2. Total = 1 + sum of included pages = 16 (no index) or 17 (with index), matching the README.
- Stale-async guard: `epoch` is incremented on `onReset`, on successful requirements replacement, and at the start of upload/generation; stale callbacks early-return without writing `state`.
- Result invalidation: every code path that changes matches/dates/files/result invalidates the prior `URL.createObjectURL` before clearing `state.result`; `pagehide` also revokes.
- Sample walkthrough matches fixture: 8 mandatory matches, R06/R07 unmatched, duplicate experience and expired 2025 trade license unmatched, PNG rejected. Sample `verify-sample.mjs` exercises 16 pages, source-order preservation, image-byte preservation, and duplicate rejection.
- Bilingual errors are clear and exhaustive at the top-level error table in `app.js`; unmapped codes fall back to generic localized messages.
- Filename `T-2026-0417_Package.pdf` survives sanitization unchanged.

**Review limitations (not test execution or visual confirmation):**

- I did not run `node --test`, `npm run build`, `npm run dev`, the verifier, or any browser.
- I did not run the live app; visual layout, mobile overflow, focus restoration, and aria-live behavior were not exercised.
- The single unasserted failure noted in `claude/REPORT.md` (one `assignMatch` no-op test) was not re-executed here; its assertions look correct against current `domain.js` but the run history is the only available evidence.
- No independent browser checks, public deployment, or encrypted-PDF rejection paths exercised (no encrypted fixture exists).

**Minor non-blocking observations (cosmetic / documented limits, not contract mismatches):**

- `docs/VERIFICATION.md` (line 11) and `README.md` (line 73) note public Railway and visual recheck "pending"; consistent with `codex cli/REPORT.md` which marks production/signed-out deployment "unverified".
- `claude/pdf.js` Bangla on the cover falls back to `?` (documented in `README.md` "Known limitations" and consistent with contract safe-fallback rule).
- Encrypted-PDF rejection is not independently tested (no fixture); documented limitation.

**Conclusion:** Integration is correct per the contract for the organizer sample walkthrough. No actionable blockers identified within this five-minute, read-only scope. The few items above are review limitations and pre-documented limits, not contract mismatches.