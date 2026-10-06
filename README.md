# TenderDesk — Tender Document Package Builder

A browser-only workspace for preparing a tender submission: load requirements, validate documents, and download one ordered PDF package. English and Bangla interfaces are included.

**Live app:** https://tenderdesk-web-production.up.railway.app  
**Repository:** https://github.com/abdullahalyf/devfest-252-15-834

## Participant

| Detail | Value |
| --- | --- |
| Name | Abdullah Alif |
| Registration number / student ID, provided by participant | 252-15-834 |
| University | Daffodil International University |
| Email | 252-15-834@diu.edu.bd |
| Contest room | 503 |
| Computer number | 08 |
| Contest | AI DevFest Vibe Coding, 6 October 2026 |

## Run locally

Requires Node.js 22.12+; Node.js 24 was used for development.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. To verify or build:

```sh
npm test
node "codex cli/verify-sample.mjs"
npm run build
npm run preview
```

## Main features

- Load and validate tender requirements JSON, showing tender details and ordered bilingual requirements.
- Upload up to 30 PDFs / 50 MiB total; inspect page counts, reject non-PDF/damaged input, remove files, and flag identical contents using SHA-256.
- Match documents one-to-one; prevent a file or duplicate contents from satisfying multiple requirements.
- Enter expiry dates. Mandatory missing files, missing expiry dates and expiry before the tender deadline block generation; an expiry equal to the deadline passes. Unprovided optional requirements do not block.
- Show validation statuses and generation blockers in English or Bangla.
- Generate an English cover and all included source pages in requirement order, preserving their within-document order. Every output page includes the tender ID and page numbering in a separate footer margin.
- Download `<tender_id>_Package.pdf`; editing matching, dates or documents invalidates the previous download. Reset starts a new package.
- Requirements replacement is atomic: invalid JSON preserves the current work; a valid replacement clears the old dataset.

## Bonus features

- Optional document index with accurate package page ranges.
- UTF-8 checklist CSV export with bilingual headings, expiry dates, status, and spreadsheet-formula protection.
- Duplicate detection uses exact content hashes rather than filenames. The renamed duplicate in the organizer samples is detected.

## Sample walkthrough and evidence

Load `problem_statement/problem-pack/sample-pack/requirements.json` and PDFs from its `documents` folder. Match:

| Requirement | File | Expiry |
| --- | --- | --- |
| R01 Trade License | trade_license_2026.pdf | 2027-06-30 |
| R02 TIN | 03_tin_certificate.pdf | — |
| R03 VAT | 04_vat_certificate.pdf | — |
| R04 Bank Solvency | bank_solvency.pdf | 2026-12-31 |
| R05 Experience | experience_cert.pdf | — |
| R06 / R07 optional documents | Leave unmatched | — |
| R08 Technical Proposal | 02_technical_proposal.pdf | — |
| R09 Financial Proposal | 01_financial_proposal.pdf | — |
| R10 Signed Declaration | scan_0042.pdf | — |

Leave the duplicate experience copy and expired 2025 trade license unmatched. `company_logo.png` is not a PDF and is rejected.

Expected output is **16 pages without an index**, or **17 pages with an index**. The browser-generated example is in `output/T-2026-0417_Package.pdf`; screenshots and PDF page renders are in `screenshots/`. Actual checks and their scope are recorded in `docs/VERIFICATION.md` and worker reports. At the first working release, 63 unit tests and all 12 independent sample assertion groups passed; a fresh browser context exercised the public HTTPS workflow without login.

## Architecture and privacy

Vanilla JavaScript ES modules, Vite and pdf-lib. JSON/PDF parsing, hashing, matching, expiry validation, PDF generation and CSV export all run in browser memory. Documents are never sent to an application backend. Railway serves the static build through Nginx; there is no application server, database, online document storage, API key, or runtime AI dependency.

The release script builds an isolated archive of a pushed Git commit. Public `/release.json` records that full commit SHA and hashes of the deployed static assets, allowing the live deployment to be checked against the submitted commit.

## Known limitations

- Expiry is entered by the user; authenticity and dates are not inferred from filenames or OCR.
- Refreshing/closing the page clears the in-memory project. Session save/load is not implemented.
- PDF cover/index text uses an English font; unsupported characters, including Bangla in imported cover fields, use a safe `?` fallback. The UI and CSV support Bangla.
- Visible PDF content is preserved, but interactive annotations, links and form fields are not retained when pages are embedded.
- Password-protected PDFs are rejected by the parser; no encrypted organizer fixture was supplied, so that rejection path was not independently exercised.
- Strict PDF parsing may reject malformed documents that another viewer tolerates. Extremely long cover fields may be shortened to fit.
- A package with no included documents cannot be generated, even when its requirements are all optional.

## AI tools and useful prompt

Codex app coordinated contracts, app lifecycle, integration, Git, browser acceptance and Railway release. Puku CLI implemented and checked domain logic and the initial UI. Claude Code implemented/hardened PDF generation and owns interface polish. Codex CLI independently reviewed sample output and integration behavior. Relevant design, accessibility and testing skills inform review and polish.

Useful actual prompt sent to Claude Code:

> Start task P01 immediately. Read E:\vibecode_contest\vibecode_contest_final\claude\TASK.md and follow it completely. Read the shared docs/CONTRACT.md before coding. Implement PDF inspection and generation using pdf-lib: English cover, correct document/page order, and readable numbered footers in a separate margin that never covers original content. Edit only your assigned claude files. Do not use Git, install packages or deploy. Deliver working code and claude/REPORT.md within 10 minutes. Do not stop at planning.

Assignments and contracts are preserved in `TASKS.md`, `docs/CONTRACT.md` and worker task briefs. All application source was created during the contest build phase; organizer fictional samples were kept unchanged.

## License

MIT — see `LICENSE`. Third-party libraries retain their licenses. Organizer samples are fictional contest fixtures.

Polished source verification: 65 unit tests, 12 independent sample groups and 9 real-browser regression groups pass, including native date typing and both CSV defects found in the first release. See docs/VERIFICATION.md for evidence scope. The public manifest must be checked after deployment; older worker reports are historical snapshots.
