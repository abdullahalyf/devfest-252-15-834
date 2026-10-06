# Submission handoff

Abdullah Alif will submit the organizer form himself. This file does not claim a submission receipt. Aim for18:57 Asia/Dhaka on6 October2026; hard cutoff supplied by participant is19:00. Stop all changes immediately on submission if earlier.

| Field | Value |
| --- | --- |
| Project | TenderDesk — Tender Document Package Builder |
| Participant | Abdullah Alif |
| Registration / student ID | 252-15-834 |
| University | Daffodil International University |
| Email | 252-15-834@diu.edu.bd |
| Room / computer | 503 / 08 |
| Repository | https://github.com/abdullahalyf/devfest-252-15-834 |
| Live application | https://tenderdesk-web-production.up.railway.app |
| Actual deployed commit | Read https://tenderdesk-web-production.up.railway.app/release.json and use its full `commit` value after coordinator confirms it matches public main. |
| Example package | [T-2026-0417_Package.pdf](../output/T-2026-0417_Package.pdf) |
| Evidence | [Verification](VERIFICATION.md), [independent public V06 report](../codex%20cli/REPORT.md), [screenshots](../screenshots/) |

## Description to paste if requested

TenderDesk builds a tender submission PDF entirely in the browser. Load requirements JSON, upload PDFs, match documents, enter actual expiry dates and generate an ordered package with an English cover and numbered footers. Mandatory omissions, expired documents and duplicate content block generation. English/Bangla interface and checklist CSV, plus an optional document index, support review. Documents remain in browser memory; Railway serves static assets without an upload API or database.

## Before pressing Submit

1. Open the live URL in a fresh tab and confirm it loads.
2. Confirm the final full commit in the public release manifest matches the coordinator's final pushed commit. Do not copy a historical SHA from an older report.
3. Use the exact public repository and live URLs above, plus any evidence/files the actual organizer form requests. The form's fields are not assumed here.
4. Submit before the cutoff and preserve the actual confirmation/receipt. Tell the coordinator immediately so all changes stop.

Current functional evidence:65/65 unit tests,12 independent sample groups and9/9 public browser regression groups pass; sample output16 pages,17 with index, source content/scanned image preserved. Known limits are in README. Rulebook8.3 cadence risk is recorded honestly in [docs/STATUS.md](STATUS.md); no history rewrite or backdating was performed.
