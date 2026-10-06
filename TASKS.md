# Tasks and exclusive ownership

Deadline:19:00 Asia/Dhaka. Freeze optional features by18:40, freeze implementation by18:45, verify/release/evidence by18:55, submission handoff before19:00. Cutoffs adapt if organizer announces an earlier deadline.

| Task | Worker | Files | State | Target |
|---|---|---|---|---|
| D01/D02 domain and contract fixes | Puku1 | puku1/domain.js,domain.test.js,REPORT.md | Completed; 49 domain tests pass centrally. D03 edge-case checks next | report by release handover |
| U01/U04 bilingual UI and audit | Puku2 | puku2/UI_AUDIT.md only during U04 | Original UI recovered by coordinator; current task review-only | actionable accessibility/bilingual findings |
| P01/P02 PDF hardening; U03 UI polish | Claude | claude/pdf.js,pdf.test.js,REPORT.md; exclusive UI ownership puku2/ui.js/styles.css for U03 | PDF complete; 14 PDF tests pass. UI polish in progress | first polish within 12 minutes |
| V01/V02/V03 independent integration review | Codex CLI | codex cli verification/report files; app.js for reproduced V03 defects | Independent 12 groups pass. Browser/lifecycle review in progress | complete report and app.js handover |
| A01/R01 coordinator release | Codex app | root/docs/scripts/evidence/Git/Railway | Native browser acceptance passes; first committed-source release live | final polished release and evidence |

No worker Git/push/deploy; root dependencies owned by coordinator. One writer per file. Next tasks only after reports; never duplicate dispatch an active manual assignment.

V03: coordinator temporarily delegates `codex app/app.js` implementation fixes exclusively to Codex CLI until its completion report. U03: coordinator temporarily delegates `puku2/ui.js` and `puku2/styles.css` exclusively to Claude after P02. Puku2 audits only and does not write implementation files. All workers hand over and stop writing before the final release.

## Final implementation handover — 18:32

U06 complete: Claude handed back puku2/ui.js; native date segment typing fixed and tested with real keys. V05 complete: Codex CLI handed back its browser-regressions.mjs with 9/9 localhost passes. Coordinator reran 65 unit tests, 12 sample assertion groups and complete browser acceptance. Implementation ownership is now coordinator-only for release and reproduced essential fixes. Puku1/Puku2 are documentation/review-only; no further implementation work is queued.
