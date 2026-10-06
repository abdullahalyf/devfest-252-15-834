Static review found no defect in the core rules: status computation, mandatory blocking, PDF ordering and footer placement all look correct. It did find two must-fix label/input problems and one low-severity data defect. I couldn't run tests or a browser, so nothing below was executed.

## Must-fix

**1. English status labels don't match the organizer PDF.** Severity: high, because judges check statuses and the wording is cheap to fix.
- `puku2/ui.js:54` shows `ok: 'Ready'`. Organizer text is `OK`.
- `puku2/ui.js:56` shows `'expiry-needed': 'Expiry required'`. Organizer text is `Expiry date needed`.
- `puku1/domain.js:434` (CSV) writes `'Expiry needed'`. Should be `Expiry date needed`.
- **Trigger:** any matched expiring document with no date, or any OK row, in the English UI or English CSV.
- **Effect:** the status table, blocker list and CSV all use wording that differs from Section 5 of the problem statement.
- **Fix:** change those three strings. `Missing`, `Expired` and `Not provided` already match.
- **Owners:** `ui.js` belongs to the UI-polish Claude session; `domain.js` belongs to Puku 1.

**2. Typing a date into an expiry field can scramble it.** Severity: high. This is strongly grounded but not confirmed in a browser.
- **Where:** `puku2/ui.js:545` uses `onInput` and calls `onExpiry`. `codex app/app.js:184` re-renders right away. `renderApp` then rebuilds the whole DOM (`ui.js:761`), and `restoreFocus` (`ui.js:234-242`) focuses a brand-new `<input type=date>`.
- **Trigger:** In Chrome, a date input fires `input` on every segment keystroke once the date is valid. Typing the first year digit `2` produces `0002-06-30`. The new element takes focus at its first segment, so the next digits go into the month and day.
- **Effect:** a hand-typed expiry date gets corrupted. The picker is unaffected because it commits the whole value at once.
- **Why tests miss it:** `scripts/browser-acceptance.mjs:52-95` uses Playwright `fill()`, which sets the whole value in one event.
- **Fix (pick one):**
  - In `renderApp`, if the focused element is a `tp-date` with the same id, put the old node back in place of the new one (`newNode.replaceWith(oldNode)`) and update only `disabled` and `aria-invalid`.
  - Or listen to `change` / `blur` instead of `input`.
- **Verify:** type a date key by key in Chrome.

## Confirmed, lower severity

**3. Prototype-like requirement ids leak function text into the CSV.** Severity: medium/low. The PDF and the statuses are not affected.
- **Where:** `codex app/app.js:182` builds expiry dates with `{ ...state.expiryDates, [id]: date }`, which creates an ordinary object with `Object.prototype`. `app.js:52` then reads `state.expiryDates[row.requirement.id] ?? ''` without an own-property check.
- **Trigger:** the pack has a requirement with id `constructor`, `toString` or `__proto__`. The last edit is an expiry date on any requirement, then the user exports the CSV. Any later match resets the map to null-prototype, so the window is "dates entered last", which is the normal flow.
- **Effect:**
  - `row.expiryDate` becomes `Object` (or `Object.prototype` for `__proto__`).
  - `domain.js:448` then writes `function Object() { [native code] }` or `[object Object]` into the Expiry column instead of blank or `(required)`.
  - A date input for that id also gets a garbage value, which the browser blanks.
  - The domain status itself stays correct because it uses `ownHas`.
- **Fix:**
  - `app.js:52`: `Object.hasOwn(state.expiryDates, row.requirement.id) ? state.expiryDates[row.requirement.id] : ''`.
  - `app.js:182`: `const next = Object.assign(Object.create(null), state.expiryDates); next[requirementId] = dateString; state.expiryDates = next;`.

## Optional observations (not blocking)

- `ui.js:540`: `min: deadline` greys out earlier dates in the picker. An expired document (for example the 2025 trade license) can then only be typed, not picked, which runs into defect 2. Consider removing `min`.
- `ui.js:319`: the language button is disabled while busy. The contract says "Keep language switch functional". `onLanguage` is already safe while busy.
- **All-optional pack with nothing matched:** Generate is disabled, but the sidebar shows both "Resolve 1 blocking issue" (`ui.js:672`) and "All mandatory requirements are satisfied" (`ui.js:643`).
- **Size cap:** `MAX_BYTES` is 50 MiB (52,428,800 bytes). The statement says "50 MB". Low risk.
- `domain.js:415-419`: CSV formula neutralisation checks only the first character, so a leading space before `=` is not caught. Low risk.

## Checked and found correct

- **Status rules:** expired only when strictly before the deadline; equal date passes; invalid or empty date gives `expiry-needed`. Optional + no file is `not-provided`, non-blocking. Optional + expiring + matched + no date blocks, which matches the spec.
- **Generation and ordering:** at least one document required; integrity and duplicate-hash guards; `pdf.js` checks bytes again for duplicates; mandatory documents checked again in `validateInput`.
- **PDF:** cover, then optional index, then documents, with start pages shifted to account for the index. The footer sits in a separate 36 pt band, with correct placement for 0/90/180/270 rotation.
- **Text safety:** imported text uses text nodes only.
- **Lifecycle:** epoch guards on load, upload and generate; invalid replacement keeps state; download URLs are revoked on every change and on `pagehide`; same-file re-select works because the input value is cleared.

## Limits of this review

- Static reading only: no tests, browser runs or PDF rendering, and the Chrome date-input behaviour in defect 2 is not observed.
- The rulebook PDF was not read, and `styles.css` was only skimmed for mobile overflow.
