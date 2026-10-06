# Final review brief — 18:45–19:00 Asia/Dhaka, 6 October 2026

Participant: Abdullah Alif; university-issued contest user ID VC120; student ID252-15-834; Daffodil International University; Room503; Computer08. The contest user ID was confirmed from the participant's screenshot after older reviews.

Live app: https://tenderdesk-web-production.up.railway.app
Repository: https://github.com/abdullahalyf/devfest-VC120
Read public /release.json for the current full deployed SHA. Do not assume an older report describes the current release. Coordinator verifies exact asset hashes with scripts/verify-release.mjs.

## Prompt for Claude app

Review TenderDesk's current project files and the actual public release. Start with docs/CONTRACT.md, README.md, docs/VERIFICATION.md and the organizer rulebook/problem. All implementation workers have handed back. Focus on confirmed contest blockers, not new features or speculative refactoring. The app is browser-only: no document upload backend, secrets, paid upgrades, or practice-project changes.

Check correct JSON validation, one-to-one matching, byte-identical duplicate prevention, mandatory and optional statuses, inclusive expiry boundary, immediate validation during native date keyboard typing, stale download invalidation, reset/replacement and bilingual mobile flow. Check 16-page sample PDF cover, ordered original pages, scanned declaration and every footer. Bonus index gives17 pages. CSV must guard formulas after whitespace/control prefixes and must not leak inherited values for prototype-like requirement IDs.

Use actual organizer fixtures, existing runtime and relevant skills. Report exact file/line, reproduction and impact for each confirmed defect. Mark unrun checks honestly. Give minimal proposed fixes; coordinator controls implementation/Git/deployment to avoid two writers. No application edits without a clearly assigned ownership handover. No extra agents. No commits/deployment after official submission or19:00, whichever is earlier.

Schedule: review18:45–18:50; essential fixes only18:50–18:53; verify and release18:53–18:57; handoff for official submission before19:00. If no reproduced defect remains, keep the verified release stable.

## Existing verification

- 65/65 unit tests (51 domain,14 PDF), including same-file expiry retention, optional matched expiry and inherited-property IDs.
- 12 independent sample assertion groups;16 decoded pages, original content/image order preserved.
- 9/9 public browser regressions on the corrected release87d3ae6023c236e25168f0f7c87f795bd1b0c559, including both CSV regressions, real date keys and cached Back navigation.
- Full actual file-chooser/sample download, PNG rejection, duplicate assignment rejection, expiry boundary, reset/replacement,30-file limit, Bangla/mobile360px and observed no document network uploads pass publicly.
- Public release asset hashes match the committed static build; deployed source tests65/65 pass from the isolated Git archive.

Run commands if needed:

```sh
npm test
node "codex cli/verify-sample.mjs"
node "codex cli/browser-regressions.mjs" --url=https://tenderdesk-web-production.up.railway.app/
node scripts/verify-release.mjs https://tenderdesk-web-production.up.railway.app <full-current-SHA>
```

The browser acceptance script needs bundled Playwright on NODE_PATH. Public checks should set ACCEPTANCE_EVIDENCE_DIR to an ignored .release-static evidence directory rather than overwriting committed output/screenshots.

## Honest limitations

English PDF cover/index uses unsupported-character fallback; Bangla UI/CSV works. Source annotations/interactive forms are not retained. No encrypted organizer fixture or real screen-reader testing. Native date keys exercised in Chromium, not Safari/Firefox. Refresh loses in-memory work. No official submission is claimed; the participant still must submit the organizer form.
