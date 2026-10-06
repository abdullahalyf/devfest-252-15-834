# Central verification

2026-10-06 17:59 Asia/Dhaka, before final UI polish and public deployment:

- Unit suite: 63/63 pass (49 domain, 14 PDF).
- Independent organizer verifier: all 12 groups pass; exact source ordering, image/content preservation, duplicate prevention and 16 decoded pages.
- Actual native browser file chooser uploads with unchanged organizer JSON, ten PDFs and PNG: PDF counts accepted, PNG rejected, duplicate flagged.
- Browser checks pass: eight mandatory matches, optional omission, expiry before/equal/after deadline, duplicate assignment rejection, date focus, invalid JSON replacement preserves state, replacement clears expiry and old download, reset clears data, Bangla UI/CSV, 360px layout without horizontal overflow.
- Browser downloaded `output/T-2026-0417_Package.pdf`: pypdf independently confirms 16 pages, all tender cover fields, all 16 exact numbered footers.
- No page errors or non-GET/HEAD network requests observed during tested local workflow.
- Production build passes. Public Railway deployment and final polished UI recheck remain pending.

Browser screenshots are in `screenshots/`; machine-readable browser results are in `output/browser-acceptance.json`. They show the UI at the time of the checks, not future changes. Encrypted PDF rejection has no organizer fixture and remains untested. PDF visible source content is retained; interactive annotations/forms are not preserved. Bangla is supported in the interface/CSV; PDF cover uses an English font with unsupported-character fallback.

The optional real-browser script requires Playwright supplied by the local runtime; Playwright is not an application dependency. Run `node scripts/browser-acceptance.mjs` with that runtime on NODE_PATH. `ACCEPTANCE_URL` may target the public release instead of localhost.

Railway release is built from an isolated Git archive of a pushed commit. A generated `/release.json` records its full commit SHA and SHA-256 of the static build assets. Worker changes made after that commit cannot enter its build.

## Polished release checks — 2026-10-06 18:32 Asia/Dhaka

- Coordinator reran all 65 unit tests (51 domain, 14 PDF) and all 12 independent organizer sample groups: PASS.
- Codex CLI browser-regressions.mjs independently rerun by coordinator: 9/9 PASS on localhost, source hashes unchanged during run. Covers inherited expiry-map values for prototype-like IDs; CSV formulas after whitespace/control characters with lossless quoting in both languages; real native date year/month/day keys and immediate validation; all five exact status labels; stale download removal after edits, reset, replacement, refresh and cached Back navigation.
- Full browser-acceptance.mjs rerun after Claude U06: PASS, actual chooser inputs and package/CSV downloads, expiry boundaries, duplicate rejection, replacement/reset, 30-file limit, Bangla mobile 360px and no observed document network uploads/browser errors.
- Earlier visual inspection: all 16 output pages rendered in screenshots/pdf-all-pages.png, with cover/trade/declaration individually examined. Footer occupies an added bottom band, source content remains readable. This visual inspection preceded U06, which changes UI rendering only.
- Claude U06 preserves the focused date input and its connected ancestors while updating validation on every key. Both Claude and Codex CLI exercised actual keystrokes; a fill-only test was insufficient to detect the original bug.
- The first public release still has the old CSV implementation. These checks describe the local corrected source; public correctness requires the next release and public regression rerun.

Use ACCEPTANCE_EVIDENCE_DIR to save public verification into an ignored release evidence directory without overwriting committed sample artifacts. Public asset/commit verification uses scripts/verify-release.mjs. Actual public manifest and verification outputs identify the deployed revision; this document intentionally does not embed its own commit hash.
