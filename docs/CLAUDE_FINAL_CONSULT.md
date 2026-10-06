# Claude final independent read-only consult

Recorded by the coordinator before final evidence/favicon release. Source review only: no browser or tests executed by this nested consult. Separate public runtime evidence is in VERIFICATION.md and the manual Claude/Codex reports. Implementation issues found in earlier consults are superseded by documented fixes.

No confirmed contest-blocking implementation defect remains in the current source, and none of the docs I read are materially false. This is static reading only: I ran no tests, builds or browser. Every pass result below is copied from V06 and the docs, not something I observed.

## Puku2's stale-download claim: not supported

**During generation:** the old download is gone before the busy state is ever shown.
- `codex app/app.js:221` calls `invalidateResult()`, which revokes the URL and sets `state.result = null`.
- Only then does `app.js:222` render with busy on, and the await comes after that at `:224`.
- So the busy screen has no `result`, and `buildResult` (`puku2/ui.js:664`) draws no link.
- A stale generation can't bring an old result back either. `app.js:225` and `:232` check the epoch first, and a new URL is only made after that check passes.

**During upload or requirements load:** the old link stays visible, but it still matches the current data.
- Nothing changes `files`, `matches` or `expiryDates` until the async work finishes.
- When it does finish, `app.js:140` (files accepted) and `app.js:84` (valid replacement) remove the old link.
- If an upload is fully rejected, the link stays, which is correct because the data didn't change.
- While busy, every control that edits data is disabled (`ui.js:529-604`, `753`, `779-782`), so nothing can make that link stale mid-task.

## Landed fixes: look correct in source

- **Prototype-like ids:**
  - `app.js:52` now reads expiry dates with `Object.hasOwn`.
  - `app.js:182-184` builds the map with no prototype.
  - So ids like `constructor` can no longer pull inherited values into the CSV.
- **CSV formulas:**
  - `puku1/domain.js:415-419` now also catches a leading newline.
  - It also catches whitespace, NBSP or BOM before `=+-@`.
  - Quoting still happens after the apostrophe is added.
- **Date typing:**
  - `keepFocusedDate` (`ui.js:273-305`) keeps the focused date input and all its parent elements in the page.
  - It refreshes their attributes and event handlers in place.
  - It only writes `.value` when the value actually differs (`:303`).
  - If the fresh render disables the input (busy), it falls back to a full re-render (`:277`).
- **Status labels:** the English labels (`ui.js:54-58`, `domain.js:431-435`) now match the organizer PDF exactly.

## Optional, not blocking

1. **Bangla CSV labels differ from the Bangla UI.** `domain.js:441-442` uses `মেয়াদ প্রয়োজন` / `মেয়াদ উত্তীর্ণ`, while `ui.js:130-131` uses `মেয়াদের তারিখ প্রয়োজন` / `মেয়াদোত্তীর্ণ`. It's cosmetic; English matches the PDF.
2. **Unchanged small UI issues from my first review:**
   - The language button is disabled while busy (`ui.js:382`).
   - A pack where every requirement is optional and nothing is matched shows both "Resolve 1 blocking issue" (`ui.js:735`) and "All mandatory requirements are satisfied" (`ui.js:706`).
   - The date input's `min` (`ui.js:603`) greys out pre-deadline dates in the picker. Typing still works, and V06 recorded `Expired` after typed keys.
3. **Size cap is 50 MiB (52,428,800 bytes); the statement says "50 MB".** It is a little more permissive than the statement, but the docs say MiB, so they are accurate.
4. **`docs/VERIFICATION.md:26` reads as stale.** It says the public release "still has the old CSV implementation." It sits under the 18:32 heading and the 18:33 section below supersedes it, so it isn't false, but a reader might misread it.

## Documentation check

- **Unit counts add up:** 63 = 49 + 14 and 65 = 51 + 14.
- **Page counts agree:** 16 pages, or 17 with the index.
- **The public build hash `87d3ae6…` is the same** in STATUS, VERIFICATION and V06.
- **README claims match the code:**
  - Expiry equal to the deadline passes.
  - Unprovided optional documents don't block.
  - Edits remove the old download.
  - A package with no documents can't be generated.
  - Encrypted-PDF rejection is not exercised.
  - The cover uses a `?` fallback for Bangla.
- **The cover keeps the footer area clear:** its content stops at `FOOTER_BAND + 24` (`claude/pdf.js:261,311`), so "separate footer margin" holds for the cover too.
- **The 32-minute gap between commits** is disclosed in STATUS.md line 13. I am not proposing any change to the Git history.

## Limits of this review

- I read the six source files, the problem statement, and the requested docs and reports.
- I re-checked `claude/pdf.js` from my first pass, not again in this pass.
- I did not read `styles.css` again, the test files, or the rulebook.
- I made no edits.