# TenderDesk — Tender Document Package Builder

Browser-only tender document preparation in English and Bangla. Built during AI DevFest 2026.

**Participant:** Abdullah Alif  
**Student ID:** 252-15-834  
**Email:** 252-15-834@diu.edu.bd  
**Official registration number:** Pending participant confirmation; student ID is not assumed to be the registration number.  
**Public live URL:** Pending verified Railway deployment.  
**Repository:** https://github.com/abdullahalyf/ai-dev-fest-abdullah-alif-25215834-diu-vibecode-final

## Run and build

Requires Node.js 22.12+ (Node24 used for development).

```text
npm install
npm run dev
npm test
npm run build
npm run preview
```

The app uses vanilla ES modules, Vite and pdf-lib. All tender JSON and document processing run in the browser. No document is uploaded to an application backend or stored remotely. Core features have no runtime external API dependency.

## Features and validation

Implementation and independent verification are in progress. Final completion and actual checks will be recorded before submission; see docs/STATUS.md and TASKS.md. Do not treat the current feature list as verified release evidence.

Required flow: load tender requirements, upload PDFs, inspect page counts, match documents one-to-one, check entered expiry dates against tender deadline, prevent identical contents being used twice, generate English cover plus ordered documents with readable page-number footers, and download the combined PDF. Full Bangla/English UI is required.

Organizer sample pitfalls: expired2025 trade license, valid2026 trade license, identical experience certificate copies, scanned declaration under scan_0042.pdf, optional documents absent, and PNG rejected as a PDF upload. Correct no-index sample output is16 pages.

## AI tools and useful actual prompt

Tools used for this submission: Codex app for orchestration/state/integration; Puku CLI sessions for domain validation and UI; Claude Code for PDF generation; Codex CLI for independent sample verification. Worker completion and checks remain subject to their reports and independent central verification.

Useful actual prompt sent to Claude Code:

> Start task P01 immediately. Read E:\vibecode_contest\vibecode_contest_final\claude\TASK.md and follow it completely. Read the shared docs/CONTRACT.md before coding. Implement PDF inspection and generation using pdf-lib: English cover, correct document/page order, and readable numbered footers in a separate margin that never covers original content. Edit only your assigned claude files. Do not use Git, install packages or deploy. Deliver working code and claude/REPORT.md within10 minutes. Do not stop at planning.

Full assignments and interfaces are preserved in each worker's TASK.md and CONTEXT.md. Source was created fresh during BUILD; organizer samples are fictional and unchanged. User's original requests and worker prompts are recorded in this conversation.

## Limits

- Up to30 uploaded PDFs and50 MB total.
- Expiry dates are entered by the user; the app does not certify authenticity or perform OCR date extraction.
- Official registration, repo naming compliance, live deployment, final verification, screenshots and sample output evidence remain pending.

## License

MIT. Third-party libraries retain their respective licenses. Organizer sample PDFs are provided solely as fictional contest fixtures.
