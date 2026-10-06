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

## Public polished release verified — 2026-10-06 18:33 Asia/Dhaka

Railway deployment526d7a53-f35d-47ba-befd-02f4254c3edd is SUCCESS. Public HTTPS manifest reports87d3ae6023c236e25168f0f7c87f795bd1b0c559; every static asset SHA-256 matches its isolated committed build. All65 unit tests also pass from that Git archive. Coordinator reran V05 publicly:9/9 PASS, including both previously failing CSV regressions, actual native date keyboard events and cached Back navigation. Full browser acceptance passes on public HTTPS with actual organizer chooser inputs/downloads, Bangla/mobile, lifecycle and upload-limit checks. Public artifacts were saved in ignored .release-static/public-evidence-87d3ae6 to preserve the committed local evidence. An eventual evidence/favicon release may have a newer SHA; check its manifest and asset hashes rather than assuming this historical test revision is latest.

## Independent final reviews — 18:36–18:39 Asia/Dhaka

Codex CLI V06 independently verifies exact public commit and every asset hash,9/9 public regression groups, actual downloaded16-page PDF with exact source content/image order,17-page index option,31-to30 upload limit, paused-upload busy guards and recovery, literal untrusted text rendering and bounded no-upload network observation. No confirmed blocker was found; complete evidence and UNRUN checks are in codex cli/REPORT.md.

Claude FINAL-C1 independently checks the same public revision with actual file inputs and real date keystrokes:30/30 native-date checks pass;16/17 pages and all footers decode correctly; index page ranges and byte-identical scanned image are confirmed structurally. Mobile360px in both languages has no horizontal overflow. No functional blocker was found; cosmetic implicit favicon404 is corrected with an explicit local data-URL icon. Claude did not visually render the PDFs or test screen readers/native picker popup; earlier coordinator PDF renders remain separate evidence.

Puku1 confirms public repository contents and participant fields, without runtime checks. Puku2's browser was unavailable, so its labels/guide audit is static. Its alleged stale link during regeneration is contradicted by the coordinator's actual synchronous invalidate-result/render sequence; no reproduced fix is warranted. The saved bilingual guide corrects index position and date-entry advice. No worker's static conclusion is substituted for a runtime PASS.

## U08 motion polish —18:43 Asia/Dhaka

User requested more dynamic interaction. Claude changed only puku2/styles.css: button hover/pressed feedback, dropzone feedback, meter transition and a restrained busy stripe animation. Entrances do not replay on every data-input rerender. Reduced-motion disables animation, transitions and motion transforms. No JavaScript/PDF/domain changes; coordinator separately added an explicit data-URL favicon to remove the cosmetic implicit favicon404.

After U08, coordinator reran all9 existing browser regression groups locally:PASS, source hashes unchanged during run. Separate fresh-Chrome checks exercised a paused actual organizer-file upload: busy animation resolves to tp-busy-sweep; reduced-motion resolves to animation none and transition0s. English/Bangla at1440,768,414,360px have no document/body horizontal overflow. No page errors or implicit favicon.ico requests. This section records local results; final public release must be checked against its exact manifest after publication.

## Final identity/language refinement —18:48 Asia/Dhaka

Participant supplied a university-issued contest user ID screenshot: VC120. Student ID remains252-15-834. Public repository was renamed devfest-VC120; current README/SUBMISSION.md distinguish the two IDs. Claude app independently reviewed the earlier87d3ae6 release and found no functional blocker, including visually rendered PDF margins. Its sample-path concern was checked: problem_statement/problem-pack/sample-pack exists both in Git and public GitHub. Its earlier no-new-commit suggestion preceded user-authorized motion and identity changes; final release uses the new pushed commit, not that historical SHA.

U10 changes only stylesheet language-switch prominence/feedback. Both language callbacks and all JavaScript remain unchanged. Coordinator repeated paused-upload busy/reduced-motion checks and English/Bangla1440/768/414/360px widths locally:PASS, no page errors or implicit favicon request. U08 public motion/reduced-motion/eight-width checks also PASS on66f3dba. A subsequent public nine-group run encountered8-second timeouts, DNS ERR_NAME_NOT_RESOLVED and ERR_NETWORK_CHANGED; those checks are UNRUN, not application failures or passes. A longer25-second navigation allowance is used in an ignored copy of the same assertion script for final reruns; assertions are unchanged. Final exact release verification is recorded by manifest/asset output and the coordinator handoff.

## Optional cover logo —19:04, participant-reported extension

User requested company logo support, delegated placement choice, then reported deadline extension to19:30 with changes until19:25. PNG source is valid and remains unchanged. A separate local PNG chooser accepts up to1 MiB; PNG signature and browser decoding are checked. Cover image fits a40pt box wholly above the cover heading. Document PDF upload still rejects PNG; this cover option is independent from the optional selected-page seal/signature bonus, which is not implemented.

65/65 unit tests, production build,12 independent organizer groups and9 local browser regressions pass. Actual browser sample with company_logo.png gives16 pages and embeds its400×400 image on the cover. All16 footer texts remain exact; a rendered cover was inspected and logo/text do not overlap. Invalid renamed PDF bytes are rejected as a PNG while preserving prior logo/result. Removal invalidates the old download but keeps matches/dates; re-upload and Bangla360px layout pass. Full public verification follows exact committed deployment; this section records local evidence rather than claiming the future SHA.
