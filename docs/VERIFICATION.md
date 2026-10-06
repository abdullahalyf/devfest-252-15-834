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
