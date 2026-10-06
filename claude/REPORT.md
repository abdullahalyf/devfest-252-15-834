# REPORT — P01 + P02 (Claude Code)

## Tasks
- P01: in-browser PDF inspection and tender package generation with pdf-lib 1.17.1. The package has an English cover, all source pages in the required order, and numbered footers in a reserved margin.
- P02: harden `generatePackage` so it checks the included rows against the loaded pack itself, instead of relying on the UI. Verify the output against the organizer samples.

## Files changed
- `claude/pdf.js`
- `claude/pdf.test.js`
- `claude/REPORT.md`

No other files were touched. No Git, installs or deploys.

## P02 changes (`pdf.js` `validateInput`; public arguments unchanged)
- `pack.requirements` is now the authoritative list.
  - It must be non-empty, and each requirement must be well formed.
  - Ids and orders must be unique, and `mandatory`/`has_expiry` must be booleans.
  - Otherwise generation fails with `invalid-input`.
- Each included row is checked against the loaded requirement with the same id:
  - an id not in the pack fails with `unknown-requirement`;
  - an id included twice fails with `duplicate-requirement`;
  - a different `order`, `title_en`, `mandatory` or `has_expiry` fails with `requirement-mismatch`. Changing these fields cannot get around the expiry, mandatory or ordering rules.
- The rest of generation uses the pack's requirement object, not the row's copy. That covers the expiry checks, sorting, cover and index.
- If any mandatory pack requirement has no included row, generation fails with `missing-mandatory`. The message lists the missing titles.
- No documents: an empty `included` fails with `no-documents`, the same rule as domain `evaluatePackage` (its `canGenerate` requires at least one included row).
  - An all-optional pack with one matched PDF generates normally (cover + PDF). No extra requirement is demanded.
- Unchanged from P01:
  - `invalid-pdf` / `encrypted-pdf` rejection;
  - `duplicate-content` checks (file id, hash and byte-identical contents);
  - `expiry-needed` / `expired` (strictly before the deadline fails; equal passes);
  - `page-count-mismatch`;
  - exact filename, ordering, English cover, optional index;
  - the 36pt footer band below embedded pages, and the `<tender_id> | Page X of Y` footer on every page.

## Checks actually run
- `node --test claude/pdf.test.js`: **14/14 pass**. That is the 9 earlier tests (two adapted to the authoritative-pack rule) plus 5 new ones:
  1. **Mandatory omission:** each of the 8 mandatory requirements is removed in turn. Every case fails with `missing-mandatory`.
  2. **Bad rows:**
     - an unknown id (`R99`) fails with `unknown-requirement`;
     - `R02` included twice fails with `duplicate-requirement`;
     - each changed field fails with `requirement-mismatch`: R01 `has_expiry:false` with its expiry date omitted, R10 `mandatory:false`, R09 `order` changed, R08 `title_en` changed;
     - an empty pack requirement list fails with `invalid-input`.
  3. **Domain coordination** (imports `puku1/domain.js` read-only):
     - the sample `evaluatePackage(...).included` generates 16 pages, equal to `summary.pageCount`;
     - all-optional in-memory pack with no documents: domain `canGenerate` is false, and generation fails with `no-documents`;
     - the same pack with one experience PDF: domain `canGenerate` is true, and the package has 3 pages, equal to the domain page count.
  4. **Index:** the index page lists starts/ranges 3, 4, 5, 6, 7-8, 9-14, 15-16, 17. Page 17 has the scan_0042 size + 36pt band.
  5. **Scanned declaration:** the SHA-256 of the scan_0042 image stream is found on output page 16, which carries the footer `T-2026-0417 | Page 16 of 16`.
  - Earlier tests still pass:
    - 16 pages without the index, with the exact filename `T-2026-0417_Package.pdf`;
    - pages in order, each with the 36pt band, content shifted above it, and a footer on every page;
    - 17 pages with the index, all footers `of 17`;
    - duplicate, expired and missing-expiry rejection;
    - source bytes unchanged;
    - rotation, long text and Bangla handled;
    - inspection page counts, and PNG/empty/truncated data rejected.
- Independent check `node "codex cli/verify-sample.mjs"` (run only, not edited): **12/12 assertion groups PASS**. These include 16 decoded pages, and pages 2–16 keeping the original content operators and image bytes in exact order.
- `node --test puku1/domain.test.js` (run only): 42/43. The failure is `assignMatch: no-op when re-selecting the same file`. That is Puku 1's domain code, not pdf.js.

## Known limits
- **Encryption:** rejection of encrypted/password-protected PDFs is untested. No such organizer sample exists, and the code relies on pdf-lib's `EncryptedPDFError` / `isEncrypted`.
- **Lost page features:** embedded pages keep the visible content only. Links, annotations and form fields are dropped.
- **Non-WinAnsi text:** characters Helvetica can't draw, such as Bangla, appear as `?` on the cover and index. P02 adds no font.
- **Visual check:** the layout was not reviewed in a PDF viewer. Checks are structural: sizes, operators, decoded text, image hashes.
- **Strict parsing:** a slightly malformed PDF that still displays may be rejected.
- **Row source:** rows must come from the same loaded pack. A pack replaced without recomputing the summary fails with `requirement-mismatch` or `unknown-requirement`, by design.

## Integration notes
- Call shape unchanged: `generatePackage({ pack: state.pack, included: summary.included, expiryDates, includeIndex, generatedAt })`.
- New error codes to map in the UI: `missing-mandatory`, `unknown-requirement`, `duplicate-requirement`, `requirement-mismatch`, `no-documents`.
- Existing codes: `invalid-input`, `duplicate-content`, `expiry-needed`, `expired`, `page-count-mismatch`, `invalid-pdf`, `encrypted-pdf`, `cover-overflow`.
- Add `claude/pdf.test.js` to the root test script if wanted. No contract changes requested.
- Writing has stopped.
