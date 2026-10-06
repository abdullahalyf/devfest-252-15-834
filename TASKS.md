# Tasks and exclusive ownership

Deadline:19:00 Asia/Dhaka. Freeze optional features by18:40, freeze implementation by18:45, verify/release/evidence by18:55, submission handoff before19:00. Cutoffs adapt if organizer announces an earlier deadline.

| Task | Worker | Files | State | Target |
|---|---|---|---|---|
| D01 domain/status/matching/tests | Puku1 | puku1/domain.js,domain.test.js,REPORT.md | Manual session active; local context supplied after scope block | executable report ASAP |
| U01 bilingual responsive UI | Puku2 | puku2/ui.js,styles.css,REPORT.md | Manual session blocked; explicit file authorization prompt supplied | executable report ASAP |
| P01 PDF parsing/merge/footer | Claude | claude/pdf.js,pdf.test.js,REPORT.md | Manual session active | executable report ASAP |
| V01 independent sample verification | Codex CLI | codex cli/acceptance.md,verify-sample.mjs,REPORT.md | Verifier/checklist implemented; modules pending | central run when modules arrive |
| A01 state/upload/reset/integration | Codex app | codex app/app.js and coordinator root/docs assets | Lifecycle implementation complete; integration pending | integrate immediately as modules arrive |

No worker Git/push/deploy; root dependencies owned by coordinator. One writer per file. Next tasks only after reports; never duplicate dispatch an active manual assignment.
