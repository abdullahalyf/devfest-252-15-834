# Puku2 U07 review handover

Recovered by coordinator from Puku2's final chat delivery at18:38 Asia/Dhaka. Puku2's write hooks denied USER_GUIDE/U07_REPORT. Coordinator saved the corrected bilingual guide as puku2/USER_GUIDE.md. Original report reviewed snapshots statically; no browser or screen reader was exercised by Puku2.

Confirmed historical status-label defects are fixed: OK and Expiry date needed. The native-date rerender defect is fixed by Claude U06 and independently passes public real-key tests. Label/input nesting, dt/dd markup, empty live regions, same-select no-op and absence of reset confirmation are not confirmed defects. Mobile/font/screen-reader observations in this static report remain unrun rather than failures.

Puku2 marked stale download during regeneration as confirmed, then noted that onGenerate invalidates the result before rendering busy state and rejects duplicate busy calls. Coordinator inspected that actual sequence in codex app/app.js:211–239: busy guard, invalidateResult(), render(), then await generatePackage. The old result cannot remain in the rendered busy state through that path. No implementation fix is justified by this contradictory static finding; independent public lifecycle tests remain passing.

Guide corrections: the index belongs immediately after the cover, not after documents; OK refers to one row rather than overall package readiness; date entry order depends on browser locale; users must enter actual document expiry rather than invent a passing date; sample path includes problem_statement/problem-pack. Source annotations/forms are not retained, as documented in README.

Puku2's subsequent review of the saved guide confirms index order, row-level OK and actual-expiry instructions are correct. It explicitly withdraws D4 as NOT CONFIRMED after reviewing invalidateResult before busy rendering. Minor spacing/wording corrections were applied by the coordinator. No active Puku2 implementation defect remains.
