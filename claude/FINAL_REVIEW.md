# FINAL-C1 — Public release review (Claude Code)

- **Target:** https://tenderdesk-web-production.up.railway.app
- **Deployed SHA:** `/release.json` reported `87d3ae6023c236e25168f0f7c87f795bd1b0c559` (builtAt 2026-10-06T12:31:29.574Z), checked before and during testing.
  - Artifacts: `assets/index-DnFJohs3.js`, `assets/index-CZjRIh4-.css`. These are the same filenames as the local U06 build.
- **Method:**
  - Local Playwright Chromium 1243 (headless) driven over raw CDP, with a fresh, empty profile for each run.
  - Inputs were the actual organizer `requirements.json` and the `documents/*` files, uploaded with `DOM.setFileInputFiles`.
  - Date editing used real keys (`Input.dispatchKeyEvent`) after a real mouse click into the field, with the en-US locale.
  - The downloaded PDFs were checked with pdf-lib, read-only.
- **No app edits, Git, installs or deployment.**

## Confirmed defects
None that block release.

Minor observation, not a functional defect:
- `GET /favicon.ico` returns 404, which logs one console error (`Failed to load resource: ... 404 ... /favicon.ico`).
  - **Repro:** open the URL in a fresh profile and read the console.
  - **Impact:** cosmetic only.

## PASS (public SHA 87d3ae6)
- **Fresh load:** Generate is disabled, and the page says "Load the requirements JSON (step 1) to begin". It does not say "all satisfied".
- **Upload:**
  - The JSON loads 10 requirement rows.
  - Of 11 files, the 10 PDFs are kept and `company_logo.png` is rejected (file count 10).
  - Both `experience_cert` copies are flagged "Duplicate content".
- **Mandatory matching:**
  - With 7 of 8 matched (R10 missing), the R10 row shows `missing` and Generate stays disabled.
  - All 8 mandatory matched plus the R01 and R04 expiry dates enables Generate.
- **Duplicate rejection:** matching `experience_cert (1).pdf` to R06 is refused. The select goes back to empty, and the notice reads "Identical file content is already matched to another document. Undo that match first."
- **Expiry rules:**
  - R01 `2026-10-19` is expired and blocks Generate.
  - `2026-10-20`, equal to the deadline, passes.
  - The same holds when the dates are typed with real keys: status text changes to "Expired" at once, and `aria-invalid` is set, then cleared.
- **Real keystroke date editing:** 30/30 harness checks pass.
  - **Coordinator's repro** (Home, Right, Right, 2 0 2 8): the field shows `0002 → 0020 → 0202 → 2028-06-30` on the same connected input, with focus kept and status `ok`.
  - **Segments:** month `12`, day `01` and ArrowUp on the year all work. Backspace clears a segment, and retyping restores it.
  - **Full entry into a blank field:** `12 31 2026` works.
  - **Picker-style commit** (whole value set at once) works.
  - **Language and layout:** year editing works in Bangla, and day editing works at 360px.
  - **Replacement:** matching `trade_license_2025.pdf` clears R01's expiry. Typed `06 30 2025` is expired and blocks Generate.
  - **Reset:** clears all rows. After reloading, key entry works again.
  - **Tab:** leaves the date input after two presses (year segment, then Chrome's own picker button).
- **Generate and download (no index):**
  - The result shows `T-2026-0417_Package.pdf`, Pages 16. The link has `download="T-2026-0417_Package.pdf"` and points to a `blob:` URL.
  - Editing a date after generating removes the download link, and regenerating brings it back.
- **Index:** turning the index toggle on removes the old download. Regenerating gives Pages 17.
- **Downloaded 16-page PDF** (SHA-256 prefix `ae43137ae45e1694`):
  - 16 pages. The cover is A4 (595x842). Source pages are 595x878, which is the source page plus the 36pt footer band; content is shifted with `1 0 0 1 0 36 cm`.
  - Every page has the footer `T-2026-0417 | Page X of 16` (16 of 16).
  - The cover is in English and lists:
    - tender ID, title, procuring entity, bidder and deadline 2026-10-20;
    - "Package Created 2026-10-06 18:34 (UTC+06:00)";
    - all 8 documents in submission order: Trade License p2 (Expiry 2027-06-30), TIN p3, VAT p4, Bank Solvency p5 (Expiry 2026-12-31), Experience p6-7, Technical p8-13, Financial p14-15, Signed Declaration p16.
  - The scanned declaration's image stream (`scan_0042.pdf`) appears byte-identical in the package (1 of 1).
- **Downloaded 17-page PDF** (SHA-256 prefix `0fd7f2e59aca7911`):
  - 17 pages, with footers `Page X of 17` on all 17.
  - Page 2 is the "DOCUMENT INDEX", listing starts 3, 4, 5, 6, 7-8, 9-14, 15-16, 17.
  - The cover ranges are shifted to match (p3 … p17).
  - The scan image is preserved.
- **Bangla:**
  - Switching sets `html lang=bn`, the title to "টেন্ডারডেস্ক — টেন্ডার প্যাকেজ তৈরি", and the button to "প্যাকেজ তৈরি করুন".
  - The download link and both date values are kept.
  - The help text says the date must be on or after the deadline ("দিন বা তার পরে").
- **360px:**
  - In Bangla and English, `scrollWidth` equals `innerWidth` (360), and no element extends past the viewport.
  - The date input, status and controls render correctly (screenshot inspected).
- **Network:** no cross-origin requests, and no POST or PUT. The PDF stays a `blob:` URL; no document was sent anywhere.
- **Exceptions:** no uncaught page exceptions.
- **Console:** besides the favicon 404 above, the only console error is the app's intentional `TenderDesk operation failed: duplicate-content`, logged when it rejects the duplicate. That is expected.

## FAIL
- None functional. The two harness "FAIL" lines were explained:
  - **PNG check:** the check also required that the filename be absent from the page text, but `company_logo` still appears there. Most likely the rejection notice names the file; that wording was not checked. The file count (10) confirms the PNG was not accepted.
  - **Console check:** it counted the favicon 404 and the intentional duplicate-content log above.

## UNRUN / limits
- **PDF visual check:** the PDF was not viewed visually. Headless Chrome produced no screenshot of the PDF viewer. Cover, footer and source readability were checked structurally only (decoded text, the 36pt footer band below the shifted content, page sizes, image hashes). Earlier local renders were not repeated on the public build.
- **Native picker popup:** not opened, because the browser was headless. A picker commit was simulated as a whole-value set plus an `input` event.
- **Coverage:**
  - Only Chromium was tested; no Firefox, Safari or real mobile device.
  - Only the en-US date segment order was tested.
  - No screen reader was used.
- **Acceptance script:** `scripts/browser-acceptance.mjs` was not run: `Cannot find module 'playwright'`, and installing is not allowed. Its steps are covered above.
- **Encrypted PDF:** rejection is untested, because no organizer sample exists.

Writing has stopped.
