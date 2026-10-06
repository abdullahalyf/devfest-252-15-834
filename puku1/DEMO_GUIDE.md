 D05 — Judge demo & explanation guide (Puku1)                                           
                                                                                         
  Task ID                                                                                
                                      
  D05 — Judge demo and explanation guide for the TenderDesk package builder (Puku1,
  write-only puku1/DEMO_GUIDE.md).

  Status

  COMPLETE in chat. The puku1/DEMO_GUIDE.md write was denied at the hook (the
  user-anchored authorized paths in this session do not include DEMO_GUIDE.md; they only
  list TASK.md, the three review-pack/* files, and the working directory). Per the task's
   "If writing is denied, return the complete guide in chat" fallback, the full guide is
  below. No implementation, tests, fixtures or another worker's report were edited. The
  PDF cover/footer inspection was not re-exercised during D05; all PDF-page facts are
  quoted from the project VERIFICATION.md (central check 2026-10-06 17:59 Asia/Dhaka).
  The participant identity table is quoted from the project README.md. Nothing in this
  guide was invented and no test was implied to have passed during D05 itself.

  Identity used throughout this guide (from project README)

  - Participant: Abdullah Alif
  - Registration / student ID: 252-15-834
  - University: Daffodil International University
  - Email: 252-15-834@diu.edu.bd
  - Contest room: 503
  - Computer number: 08
  - Contest: AI DevFest Vibe Coding, 6 October 2026
  - Live app: https://tenderdesk-web-production.up.railway.app
  - Repository: https://github.com/abdullahalyf/devfest-252-15-834
  - Local dev: npm ci && npm run dev (Node.js 22.12+; built with Node.js 24)

  1. Three-minute judge walkthrough (uses the actual organizer sample)

  Walk through these state facts in order. The PDF facts come from VERIFICATION.md (pypdf
   independently confirmed 16 pages, all tender cover fields, 16 numbered footers). The
  mapping is the same one shown in the project README.

  00:00 — Open the live URL. Public Railway deployment,
  https://tenderdesk-web-production.up.railway.app. Fresh page, no project loaded
  (canGenerate = false).

  00:15 — Load the organizer JSON. Use puku1/sample-pack/requirements.json (tender
  T-2026-0417 "Supply of IT Equipment", bidder "Meghna Tech Solutions Ltd.", deadline
  2026-10-20). The UI shows the tender card and the 10 bilingual requirement rows.
  Validation is performed by puku1/domain.js → validateRequirements (sorts by order,
  requires real YYYY-MM-DD, rejects duplicate ids, duplicate orders, empty titles, wrong
  types — 49/49 unit tests green on the domain module).

  00:30 — Upload the 11 source files. Drop everything in puku1/sample-pack/documents/ (10
   PDFs + 1 PNG). The uploader inspects each file with the project's PDF inspector;
  non-PDF bytes are blocked at parse time. company_logo.png is rejected with a clear
  message. PNG rejection is owned by claude/pdf.js (out of Puku1); this is asserted as
  observed evidence from the central check, not re-exercised during D05.

  00:45 — Show duplicate-content detection. The file list shows experience_cert.pdf and
  experience_cert (1).pdf flagged with an identical-content warning. The detector
  computes SHA-256 of each file's bytes; the renamed duplicate has the same hash.
  Detection is by puku1/domain.js → duplicateGroups(files) returning a FileRecord[][]
  (tested green: same SHA-256 across different ids is grouped, sorted by filename within
  group).

  01:00 — Match the eight mandatory documents. Use the table in section 2 below. Matching
   goes through puku1/domain.js → assignMatch(state, requirementId, fileIdOrNull). Four
  rejection paths are demonstrated to the judge:
  - Assigning an unknown requirement id → unknown-requirement (test passes).
  - Assigning an unknown file id → unknown-file (test passes).
  - Assigning the same file id to a second requirement → file-already-used (test passes).
  - Assigning a file whose SHA-256 already matches another requirement via a different
  file id → duplicate-content (test passes, observed during D03 probe on the real
  organizer bytes).
  Match / expiry maps are null-prototype objects so that ids like __proto__, constructor
  or toString behave like ordinary keys (prototype-pollution regression test passes).

  01:30 — Expiry semantics on R01 and R04.
  - R01 (Trade License) 2025-06-30 (the 2025 trade license) → status expired, blocks
  generation. (Demonstrated with the trade_license_2025.pdf file left unmatched in the
  table, then briefly assigned to R01 with date 2025-06-30 to show the status flip.)
  - R01 with trade_license_2026.pdf and 2027-06-30 → status ok (after 2026-10-20).
  - R04 (Bank Solvency) 2026-12-31 → status ok (after deadline).
  - Boundary: R01 with expiry 2026-10-20 (equal to deadline) → status ok. The rule is
  expiry < deadline → expired; equality passes. (statusFor test boundary 2026-10-20
  expiry equals deadline -> ok passes.)
  - Selecting the same file again is a no-op and retains the existing expiry. Replacing
  the matched file clears the prior expiry. Unmatching clears both. (All three behaviours
   covered by tests.)

  02:00 — Optional omissions R06 / R07. Leave R06 (Audited Financial Statement) and R07
  (Manufacturer's Authorization) unmatched. Their status is not-provided and they are not
   in blockers — the README claim "Unprovided optional requirements do not block" is
  satisfied. (D02 fix: evaluatePackage skips not-provided rows from blockers when
  !mandatory.) D03 probe also showed that matched optional rows with expired or
  missing-expiry dates do block (information for the judge, not part of the happy-path
  demo).

  02:15 — Generate and download. Click Generate download. The output is
  T-2026-0417_Package.pdf (per CONTEXT.md filename rule: <safe tender_id>_Package.pdf).
  Per VERIFICATION.md the central check downloaded the file and pypdf independently
  confirmed 16 pages, all tender cover fields, and 16 numbered footers in a separate
  footer margin that does not cover original content. (The PDF cover uses an English
  font; Bangla on the cover falls back to ?.)

  02:45 — Switch language. Toggle English ↔ Bangla. Status labels (Missing / অনুপস্থিত,
  Expired / মেয়াদ উত্তীর্ণ, etc.), requirement titles (title_bn), and CSV column headings all
  switch. The PDF cover and footer remain English. (Bangla support is per
  VERIFICATION.md.)

  03:00 — Done. All eight mandatory rows show OK, optional rows show not-provided,
  canGenerate = true, no blockers.

  2. Filename → requirement / expiry cheat sheet

  Source files in puku1/sample-pack/documents/. Pages column is the value claude/pdf.js →
   inspectPdf would have returned on real organizer bytes; it is asserted by
  VERIFICATION.md ("exact source ordering, image/content preservation, duplicate
  prevention and 16 decoded pages") and not re-measured here. The D03 probe used pages: 1
   for everything, so the domain's pageCount came out 9 there — that probe-level
  observation was disclosed in REPORT.md and is not the final generator output.

  ┌───────────┬──────────────┬──────────┬────────────────────────┬──────────┬──────┐
  │ Requireme │  Title (en)  │  Title   │      Matched file      │  Expiry  │ Page │
  │    nt     │              │   (bn)   │                        │          │  s   │
  ├───────────┼──────────────┼──────────┼────────────────────────┼──────────┼──────┤
  │ R01       │ Trade        │ ট্রেড লাইসেন্স │ trade_license_2026.pdf │ 2027-06- │ 1    │
  │           │ License      │          │                        │ 30       │      │
  ├───────────┼──────────────┼──────────┼────────────────────────┼──────────┼──────┤
  │ R02       │ TIN          │ টিআইএন    │ 03_tin_certificate.pdf │ —        │ 1    │
  │           │ Certificate  │ সনদ      │                        │          │      │
  ├───────────┼──────────────┼──────────┼────────────────────────┼──────────┼──────┤
  │           │ VAT          │ ভ্যাট নিবন্ধন  │                        │          │      │
  │ R03       │ Registration │ সনদ      │ 04_vat_certificate.pdf │ —        │ 1    │
  │           │  Certificate │          │                        │          │      │
  ├───────────┼──────────────┼──────────┼────────────────────────┼──────────┼──────┤
  │           │ Bank         │ ব্যাংক সচ্ছলতা  │                        │ 2026-12- │      │
  │ R04       │ Solvency     │ সনদ      │ bank_solvency.pdf      │ 31       │ 1    │
  │           │ Certificate  │          │                        │          │      │
  ├───────────┼──────────────┼──────────┼────────────────────────┼──────────┼──────┤
  │ R05       │ Experience   │ অভিজ্ঞতার   │ experience_cert.pdf    │ —        │ 2    │
  │           │ Certificate  │ সনদ      │                        │          │      │
  ├───────────┼──────────────┼──────────┼────────────────────────┼──────────┼──────┤
  │ R06 (opti │ Audited      │ নিরীক্ষিত আর্থিক │                        │          │     │
  │ onal)     │ Financial    │  বিবরণী    │ leave unmatched        │ —        │ —    │
  │           │ Statement    │          │                        │          │      │
  ├───────────┼──────────────┼──────────┼────────────────────────┼──────────┼──────┤
  │ R07 (opti │ Manufacturer │ প্রস্তুতকারকের  │                        │          │      │
  │ onal)     │ 's Authoriza │ অনুমোদনপত্র │ leave unmatched        │ —        │ —    │
  │           │ tion         │          │                        │          │      │
  ├───────────┼──────────────┼──────────┼────────────────────────┼──────────┼──────┤
  │ R08       │ Technical    │ কারিগরি প্রস্তাব │ 02_technical_proposal. │ —        │ 6   │
  │           │ Proposal     │          │ pdf                    │          │      │
  ├───────────┼──────────────┼──────────┼────────────────────────┼──────────┼──────┤
  │ R09       │ Financial    │ আর্থিক প্রস্তাব │ 01_financial_proposal. │ —        │ 2    │
  │           │ Proposal     │          │ pdf                    │          │      │
  ├───────────┼──────────────┼──────────┼────────────────────────┼──────────┼──────┤
  │ R10       │ Signed       │ স্বাক্ষরিত   │ scan_0042.pdf          │ —        │ 1    │
  │           │ Declaration  │ ঘোষণাপত্র   │                        │          │      │
  └───────────┴──────────────┴──────────┴────────────────────────┴──────────┴──────┘

  Left unmatched and on purpose. experience_cert (1).pdf (same SHA-256 as
  experience_cert.pdf — used to demonstrate duplicate-content rejection);
  trade_license_2025.pdf (expired 2025-06-30 — demonstrates "expired blocks generation");
   company_logo.png (rejected by the PDF parser before reaching the domain).

  Page-count formula (from domain.js:378). pageCount = 1 + Σ(included file.pages) — 1
  cover page plus one unit of PDF page count per included document, no index. With the
  matches above the sum is 1 + (1+1+1+1+2+6+2+1) = 16 pages. The optional document index
  (bonus) raises the total to 17 pages; the demo path uses the no-index mode and produces
   16 pages.

  3. Ten likely judge questions and short answers

  1. "Where do the uploaded PDFs actually go?"
  Nowhere outside the browser tab. Per the project README architecture section: JSON/PDF
  parsing, hashing, matching, expiry validation, PDF generation and CSV export all run in
   browser memory. Railway only serves the static build through Nginx; there is no
  application server, database, online document storage, API key or runtime AI
  dependency.
  2. "How are duplicates detected — name or content?"
  Content. puku1/domain.js → duplicateGroups(files) groups by SHA-256 of the file bytes.
  assignMatch also rejects the second requirement trying to use the same content through
  a different file id (duplicate-content error). The renamed duplicate in the organizer
  sample (experience_cert (1).pdf vs experience_cert.pdf) is detected because the bytes
  are identical.
  3. "What if the expiry is exactly the deadline?"
  It passes. The rule is expiry < deadline → expired; everything else with a valid
  real-calendar date and a present file is ok. This is locked by the boundary 2026-10-20
  expiry equals deadline -> ok test and by epochDays returning UTC day counts with a
  real-calendar round-trip (isValidIsoDate rejects 2026-02-30, 2026-04-31, 2025-02-29;
  accepts 2024-02-29).
  4. "Does matching mutate state?"
  No. assignMatch returns a fresh { matches, expiryDates } pair built on null-prototype
  objects (Object.create(null)); the caller's state is never mutated. Tests cover the
  no-op case (same file again → same expiry retained), replacement (different file →
  prior expiry cleared), and unmatch (→ both cleared). Prototype-safety tests confirm
  keys like __proto__ are stored as ordinary own keys.
  5. "What protects me if the JSON replacement is invalid?"
  validateRequirements throws an invalid-requirements error (12 distinct malformed shapes
   verified by D03 probe — string instead of object, null, missing tender, missing
  requirements, bad deadline, numeric id, mandatory=1, float order, duplicate id, empty
  title, empty bidder, missing tender). The app keeps the previous one and surfaces the
  error; only a valid JSON replacement swaps the dataset atomically. This is the README
  claim "Requirements replacement is atomic: invalid JSON preserves the current work; a
  valid replacement clears the old dataset."
  6. "What about the footer covering original content?"
  It is drawn in a separate footer margin and the central check confirmed all 16 numbered
   footers and that original content is preserved. This is the generator's responsibility
   (claude/pdf.js); the domain only sums file.pages. The 16-page guarantee therefore
  depends on the inspector returning real page counts on real bytes.
  7. "How do you know the package is really 16 pages?"
  Per VERIFICATION.md: "pypdf independently confirms 16 pages, all tender cover fields,
  all 16 exact numbered footers." The generator was downloaded from the browser workflow
  and parsed by an independent library (pypdf). The domain test organizer sample fully
  matched yields canGenerate=true and 16 pages pins the formula 1 + Σ file.pages.
  8. "Did AI write the code?"
  The README acknowledges multi-tooling — Codex app coordinated contracts, app lifecycle,
   integration, Git, browser acceptance and Railway release; Puku CLI implemented and
  checked domain logic and the initial UI; Claude Code implemented/hardened PDF
  generation and owns interface polish; Codex CLI independently reviewed sample output
  and integration behavior. There is no runtime AI dependency in the deployed app — only
  the build pipeline used AI-assisted tools during the contest.
  9. "What doesn't it do?"
  Per the README "Known limitations": expiry is user-entered (no OCR / no filename
  inference); refresh / tab close clears in-memory state (no save/load); PDF cover/index
  use an English font (Bangla in cover fields falls back to ?, but the UI and CSV support
   Bangla); visible PDF content is preserved but annotations / links / form fields are
  not; encrypted PDFs are rejected by the parser (no organizer fixture was supplied so
  that rejection path is untested); strict parsing may reject files another viewer would
  open; very long cover fields may be shortened; a package with no included documents
  cannot be generated even if every requirement is optional.
  10. "Where is the live app hosted, and how is the build reproducible?"
  Railway static hosting: https://tenderdesk-web-production.up.railway.app. Per the
  README architecture section: the release script builds an isolated archive of a pushed
  Git commit, and the public /release.json records that full commit SHA and the SHA-256
  of the deployed static assets, so the live deployment can be checked against the
  submitted commit.

  4. Module overview — how it fits together (student-friendly)

  The app is split into three layers, each owned by a different worker during the
  contest:

  - Domain (puku1/domain.js, Puku1). Pure functions with no I/O: validateRequirements
  (sorts/normalizes the pack and rejects malformed input), statusFor (one requirement →
  one of five codes), assignMatch (one assignment → two new maps), evaluatePackage (whole
   package → { rows, included, blockers, canGenerate, pageCount, integrityErrors }),
  duplicateGroups (bytes → groups), buildChecklistCsv (rows → bilingual CSV). It can run
  in Node, in the browser, or anywhere JavaScript runs, because it never touches window,
  fetch, File, crypto.subtle or any DOM API. All seven exports are pure and return new
  data; no in-place edits.
  - PDF inspection & generation (claude/pdf.js, Claude). Reads each uploaded PDF byte
  stream, decides if it is a real PDF (rejects PNG / damage / encryption), counts its
  pages, and produces the final ordered package: an English cover page using tender
  fields, then each included document in requirement.order ascending, each original page
  preserved, with numbered footers in a separate margin.
  - App shell (codex app, Codex). The HTML/CSS UI, the language toggle, the JSON-loader,
  the file dropzone, the matching UI, the expiry inputs, the Bangla translation table,
  the reset / replace JSON buttons, the wiring between the domain and the PDF layer, and
  the Railway / Nginx static-hosting configuration.

  The three layers talk through clean data shapes only: the app turns uploaded files into
   { id, name, hash, pages } records, passes the pack + files + maps into the domain to
  ask "can we generate?" and "what's the row status?", and only asks the PDF layer to
  render after canGenerate === true. The domain is the single place that decides blocking
   rules — the UI just renders what the domain returns.

  5. Final submission checklist (matches current README)

  - README identity block present and correct: name "Abdullah Alif", student ID
  252-15-834, university "Daffodil International University", email
  252-15-834@diu.edu.bd, contest room 503, computer 08, contest "AI DevFest Vibe Coding,
  6 October 2026" — per project README.md.
  - Repository link present: https://github.com/abdullahalyf/devfest-252-15-834.
  - Live app URL present: https://tenderdesk-web-production.up.railway.app.
  - Organizer sample verified end-to-end (VERIFICATION.md): 10 PDFs + 1 PNG uploaded
  natively, 8 mandatory matched, optional omitted, expiry before/equal/after deadline all
   exercised, duplicate assignment rejected, date focus OK, invalid JSON replacement
  preserves state, replacement clears expiry and old download, reset clears data, Bangla
  UI/CSV, 360px layout, pypdf independently confirms 16 pages with all tender cover
  fields and 16 numbered footers.
  - Unit tests recorded: 49 domain + 14 PDF = 63/63 (VERIFICATION.md).
  - Independent organizer verifier recorded: all 12 groups pass (VERIFICATION.md).
  - Browser-only privacy recorded in README: "Documents are never sent to an application
  backend. Railway serves the static build through Nginx; there is no application server,
   database, online document storage, API key, or runtime AI dependency."
  - Reproducible release recorded: release script archives a pushed commit; /release.json
   records full commit SHA + SHA-256 of static assets.
  - Known limitations disclosed in README (expiry is user-entered; refresh clears state;
  PDF cover uses English font so Bangla on cover → ?; annotations/links/form fields not
  preserved; encrypted PDFs untested; strict parsing may reject malformed files; long
  fields may be shortened; empty included set cannot generate).
  - Optional index disclosed as bonus (16 without / 17 with).
  - MIT licence present.

  What was NOT re-exercised during D05 (kept honest)

  - The PDF cover fields, page order, and 16 numbered footers were not re-inspected
  during D05; they are quoted from the project VERIFICATION.md (central check 2026-10-06
  17:59 Asia/Dhaka, pypdf independent confirmation).
  - The native browser upload of company_logo.png and rejection were not re-exercised
  during D05; they are quoted from VERIFICATION.md (PNG rejected at parse time by
  claude/pdf.js).
  - No domain tests were re-run during D05; last run on the domain module reported tests
  49, pass 49, fail 0 (recorded in REPORT.md).
  - The participant-identity fields (student ID 252-15-834, university, room, computer
  number) are quoted from the project README.md and were not re-verified by Puku1 (per
  the D04 audit, those fields are owned by the README / screenshot set, not by puku1/).
  - The Railway live URL is quoted from the project README.md; it was not fetched during
  D05.

  Stop

  No code, test, fixture or another worker's report was edited. No Git, install,
  deployment or subagent was used. Reporting stops here as instructed.

  ---
  D05 complete. The full guide is delivered in chat because the Write hook refused the
  DEMO_GUIDE.md path (the session's user-anchored authorized file list does not include
  it). If you want the file on disk, ask the coordinator to add puku1/DEMO_GUIDE.md to
  the authorized paths for the next run, or paste any of the section content back and
  I'll write it under a permitted name.

⠿ Dreamed for 2m 24s                   