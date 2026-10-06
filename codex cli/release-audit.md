# V04 public release/security audit

Completed 2026-10-06 18:13 Asia/Dhaka; started 18:03:40, within ten minutes. Read-only implementation audit. Wrote only this file and REPORT.md. Used ECC browser-qa, production-audit and security-review skills. No Git, installs, deployment, server or agents.

## Revision and verdict

Public URL: https://tenderdesk-web-production.up.railway.app
Public repository: https://github.com/abdullahalyf/devfest-252-15-834
Deployed full SHA: **3b0c057f960b321de9c956a00af7c98803e45cc5**; manifest builtAt `2026-10-06T11:59:26.669Z`.

**Core public sample PASS; submission readiness FAIL; CSV/prototype metadata assertions FAIL.** No demonstrated script execution or document transmission. Findings below require coordinator/domain-owner resolution and a checked subsequent release before claiming them fixed. Current local UI polish is not this audited release: both local UI/CSS source hashes differ from the archived deployed source. No claim about that polish.

Browser-created isolated contexts `v04-independent-release` and `v04-repo-readonly`, no login/cookies/localStorage. Organizer bytes read locally, transferred through audit tooling, wrapped in browser File/DataTransfer and dispatched through real input change handlers. Metadata variations changed names/JSON fields only; all PDF bytes remained organizer bytes. Native chooser/save/open were not independently rerun; coordinator reports those checks separately.

| Manifest artifact | Independently fetched SHA-256, HTTP 200 |
| --- | --- |
| assets/index-C9UhjwwM.js, 476321 bytes | 691048b459a005443ad4a35ec04021cec741f8a56668e80da9c854ffeb42842d |
| assets/index-B2k1oI1K.css, 10798 bytes | ba1fe58fae6e32fd6da7ee23b8f2c4487b9ad5491ac5f333674bae8b8fb04a21 |
| index.html | 039967c072218d989fd69ee9d155687d3390f396929dfd190ea146906028bcbe |

All three match public /release.json and the local isolated release manifest. Public GitHub shows that full commit link as current main and marks the repository Public. This establishes the observed deployed revision; it does not establish final submission eligibility or future deployment state.

## Actionable findings

1. **Submission blocker — committed README.md:8–10 and feature section.** Signed-out GitHub at the deployed/main SHA still shows registration pending, live URL pending and old repository URL, with features described as in progress. Local README is improved but uncommitted to the observed public revision. Rulebook §§9.2–9.3 require name/registration, public HTTPS URL, run instructions, completed main/bonus features, known problems, AI tools and useful prompt. Coordinator must publish the reviewed README, confirm registration evidence and ensure the final eligible commit/deployment match. Do not submit the old README as completed evidence.
2. **FAIL, coordinator — codex app/app.js:52,183 (deployed archive).** Change the first three sample requirement IDs to `__proto__`, `constructor`, `toString`; upload unchanged trade/TIN/VAT bytes; match them; enter a trade expiry. Expected unrelated expiry cells empty. Matches all become Ready, but CSV expiry cells for constructor/toString contain `function Object() { [native code] }` and `function toString() { [native code] }`. Spreading expiryDates into an ordinary object followed by an inherited property lookup in summary causes this. Preserve own-key semantics when exposing row expiry values, and preserve safe map handling after date edits. Domain null-prototype match storage itself works; no Object.prototype mutation or executable pollution was demonstrated. This is a coordinator integration defect, not a duplicate Puku1 match-map finding.
3. **FAIL, Puku1 CSV owner — puku1/domain.js:415–428.** In-memory sample title and actual-PDF filename starting `\n=1+1` export as quoted cells containing newline then `=`, without the protective apostrophe; direct `=1+1` exports protected. Expected formula protection to cover control/whitespace prefixes consistently. Extend the guard and test decoded cell values. Actual spreadsheet formula execution is UNRUN; do not describe this as a demonstrated exploit. CSV quoting prevents extra columns; the failed assertion concerns neutralization.
4. **Minor UI — puku2/ui.js:579,600–601 (deployed revision).** Empty view says all mandatory requirements are satisfied although Generate is disabled; use bilingual load-requirements guidance. Existing V03 finding, not generation bypass.
5. **Minor hosting — /favicon.ico HTTP 404.** Main HTML/JS/CSS load correctly. Optional favicon repair belongs to coordinator; not a core blocker. Index response lacks CSP/X-Content-Type-Options/frame restrictions in browser-visible headers; defense-in-depth review is pending, not evidence of an exploit or backend requirement.

## PASS / FAIL / UNRUN matrix

| Result | Check and concrete evidence |
| --- | --- |
| PASS | Fresh signed-out public HTTPS flow; title/controls rendered; HTML/JS/CSS 200 and exact manifest hashes above. |
| PASS | Actual sample JSON produces ten ordered requirements; ten original PDFs accepted with page counts; provided PNG rejected. Experience copies flagged duplicate. |
| PASS | Eight mandatory mappings per CONTRACT; R06/R07 absent; Generate enabled after trade/bank expiry entered. |
| PASS | Trade date 2026-10-19 disables Generate and shows Expired; 2026-10-20 enables Generate; 2027-06-30/bank2026-12-31 ready. |
| PASS | Duplicate experience copy assigned to R06 rejects, selector restores empty; localized English/Bangla messages observed. |
| PASS | Public generated Blob filename T-2026-0417_Package.pdf, 213256 bytes; independently decoded with installed pdf-lib in Node: 16 actual pages. No reliance on reported pageCount. |
| PASS | Independently traversed public PDF streams/Form/Image XObjects: all 15 organizer source pages/operators preserved on exact expected output pages, scanned image encoded SHA preserved, original widths retained, heights increased for footer band. Source docs use actual organizer files. |
| PASS | Loaded ten-file/eight-match sample at true mobile375px: English and Bangla scrollWidth=innerWidth=375; Bangla heading/lang/error controls observed. Emulation reload first cleared memory; fixtures were reloaded before measuring loaded layout. |
| PASS | Imported tender `<img src=x onerror="window.auditXss=1">`, SVG-like requirement/file names display literally; no injected img/svg and auditXss remains0. Source creates text nodes; only innerHTML assignment is clearing an empty container. |
| PASS / FAIL | Prototype-like IDs match and date editing works; subsequent CSV expiry extraction leaks inherited function text as detailed above. |
| PASS / FAIL | Direct leading `=` title/filename receives apostrophe. Leading newline+formula is not neutralized. CSV downloaded via real export callback and Blob text inspected; native spreadsheet execution unrun. |
| PASS | 31 File objects with unchanged organizer trade bytes and differing metadata names accept exactly30; 31st reports localized maximum30. Parser/hash run through actual browser handlers. |
| PASS, bounded | Privacy: Network before/after upload/matching/generation/CSV contains only same-origin static GET/304, data SVG and Blob GET. No POST, document upload, external application request. Cookies/localStorage/sessionStorage empty. Source contains no document fetch/XHR/beacon/storage path or hardcoded application credentials. GitHub browsing was a separate audit context. |
| PASS | Reset clears public files; valid metadata/organizer JSON replacement clears earlier dataset. No mutation of provided fixtures. |
| FAIL | Public committed README lacks required live/registration/completed-feature evidence. Local README cannot establish public submission compliance. |
| UNRUN | Fresh public stale-link revocation/back navigation/removal/asynchronous cancellation: V03 local evidence exists; no V04 public pass inferred. |
| UNRUN | Actual 50-MiB browser boundary/oversized documents; deployed accounting source sums accepted file.size and existing state and checks before parsing. V02 modeled limits passed, not an actual large upload. |
| UNRUN | Independent native chooser, disk save/external PDF/CSV open, full public PDF visual review. Coordinator's reported passes are separate evidence. No baseline comparison, full keyboard-only flow, screen reader/axe, all mobile breakpoints or web-vitals claim. |
| UNRUN | Encrypted/malformed organizer PDFs unavailable; no invented fixtures. Dependency CVE scan, Git-history secrets audit, full client-bundle secret scan not run. |

Console during tested public operations only showed deliberate duplicate-content error; favicon404 is recorded above. A Windows HTTP GitHub API attempt failed TLS transport; its null output is not a pass. Browser signed-out repository access succeeded instead.

## Submission evidence still needed

Read actual rulebook PDF §§8–11 and local README. Public repository shows three commits and MIT license; visible latest/integration commit descriptions contain actual user-prompt notes. Full history timestamps, setup-before-code, each30-minute cadence, every commit prompt and pushed-before-cutoff eligibility are **UNRUN**, not proven by count alone. Registration-number provenance and final official-form submission receipt remain missing audit evidence. Source/output/screenshots folders are visible publicly; exact final output/evidence file bytes and final polished UI are not covered by the earlier manifest. Keep public availability through judging/results; verify final commit and hashes again after any authorized coordinator release and stop all edits after submission/cutoff. No video requirement was found in reviewed submission clauses.

Handed back to coordinator. No implementation changes by V04.
