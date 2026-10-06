# TenderDesk user guide — English / বাংলা

The coordinator saved and corrected this guide after Puku2's U07 write hook refused its delivery. Documents and requirements stay in browser memory. Refreshing or closing the tab loses the working session. Download and review the package before leaving.

## English

1. Load `problem_statement/problem-pack/sample-pack/requirements.json` using **Load requirements JSON**.
2. Upload the organizer PDFs. Only PDFs are accepted; the limit is 30 files and 50 MiB total. Identical contents receive a duplicate badge, even when filenames differ.
3. Match each requirement to the actual appropriate document. Enter the expiry date shown by that document where required. A date equal to the tender deadline passes; a date before it fails. Do not change a date merely to bypass an expired document.
4. When there are no blockers, generate and download the package. Order: English cover, optional index, then matched documents in requirement order. Every page has the tender ID and page number in a separate footer band.

| Status | Meaning |
| --- | --- |
| Missing | A mandatory requirement has no match. |
| Expiry date needed | A matched document requires a valid expiry date. |
| Expired | Its entered expiry is before the tender deadline. |
| Not provided | An optional requirement has no match; it does not block generation. |
| OK | This row is valid; other rows may still block generation. |

### Organizer sample

The tender deadline is 2026-10-20. Use these matches and the sample dates shown below; leave both optional requirements unmatched.

| Requirement | File | Expiry |
| --- | --- | --- |
| R01 | trade_license_2026.pdf | 2027-06-30 |
| R02 | 03_tin_certificate.pdf | — |
| R03 | 04_vat_certificate.pdf | — |
| R04 | bank_solvency.pdf | 2026-12-31 |
| R05 | experience_cert.pdf | — |
| R06 / R07 | Leave unmatched | — |
| R08 | 02_technical_proposal.pdf | — |
| R09 | 01_financial_proposal.pdf | — |
| R10 | scan_0042.pdf | — |

Expected file: `T-2026-0417_Package.pdf`, 16 pages, or 17 with the index. The index is page2, before the first source document. Do not match the identical second experience certificate to another row. The PNG is rejected; the 2025 trade license with expiry 2025-06-30 is expired.

CSV export uses the currently selected language and includes every requirement. Match/date/file/index changes invalidate the old PDF download; generate again. Replacing a match clears its prior expiry, so enter the new document's actual date. Reset clears everything except language. An invalid replacement JSON leaves the existing work intact.

Native date entry order depends on browser locale; use the displayed day/month/year segments or calendar. Read the sidebar blockers if Generate stays disabled. Optional matched documents with missing/expired expiry also block generation; unprovided optional rows do not.

## বাংলা

1. **প্রয়োজনীয়তা JSON লোড করুন** দিয়ে নমুনার requirements.json বেছে নিন।
2. PDF যোগ করুন—সর্বোচ্চ ৩০টি, মোট ৫০ MiB। একই বিষয়বস্তুর ফাইলে ডুপ্লিকেট ব্যাজ দেখা যাবে; নাম আলাদা হলেও একই PDF দুটো প্রয়োজনীয়তায় ব্যবহার করা যাবে না।
3. উপরের তালিকা অনুযায়ী সঠিক নথি মিলান। নথিতে থাকা প্রকৃত মেয়াদ লিখুন। টেন্ডারের শেষ তারিখের দিন পর্যন্ত মেয়াদ থাকলে গ্রহণযোগ্য; তার আগে হলে মেয়াদোত্তীর্ণ। পাস করানোর জন্য ভুল মেয়াদ লিখবেন না।
4. বাধা না থাকলে প্যাকেজ তৈরি করে ডাউনলোড ও যাচাই করুন। ক্রম: ইংরেজি প্রচ্ছদ, ঐচ্ছিক সূচিপত্র, তারপর প্রয়োজনীয়তার ক্রমে নথি। সূচিপত্র শেষে নয়—প্রচ্ছদের পরের পৃষ্ঠা।

| অবস্থা | অর্থ |
| --- | --- |
| অনুপস্থিত | বাধ্যতামূলক নথি মেলানো হয়নি। |
| মেয়াদের তারিখ প্রয়োজন | মেলানো নথির বৈধ মেয়াদ দেওয়া দরকার। |
| মেয়াদোত্তীর্ণ | মেয়াদ টেন্ডারের শেষ তারিখের আগে। |
| প্রদান করা হয়নি | ঐচ্ছিক নথি দেওয়া হয়নি; প্যাকেজ আটকাবে না। |
| ঠিক আছে | এই সারি বৈধ; অন্য সারিতে বাধা থাকতে পারে। |

নমুনায় R01-এর মেয়াদ 2027-06-30 এবং R04-এর 2026-12-31। R06/R07 ফাঁকা রাখুন। ফল হবে ১৬ পৃষ্ঠা, সূচিপত্রসহ ১৭ পৃষ্ঠা। 2025 সালের লাইসেন্সের মেয়াদ 2025-06-30—এটি গ্রহণযোগ্য নয়।

ভাষা পরিবর্তন করলে CSV-ও সেই ভাষায় পাওয়া যাবে; PDF-এর প্রচ্ছদ ইংরেজি। নথি/মিল/মেয়াদ/সূচিপত্র বদলালে আগের ডাউনলোড বাতিল হয়—আবার প্যাকেজ তৈরি করুন। নতুন নথি মেলালে পুরোনো মেয়াদ মুছে যায়। Reset সব কাজ মুছে দেয়, ভাষা থাকে। Refresh করলে কাজ হারাবে; সেশন সংরক্ষণ নেই।

তারিখের ঘরে দিন/মাস/বছরের ক্রম ব্রাউজারের ভাষা অনুযায়ী হতে পারে। ক্যালেন্ডার বা দেখানো অংশ ব্যবহার করুন। Generate নিষ্ক্রিয় থাকলে সাইডবারের বাধাগুলি দেখুন। ঐচ্ছিক নথি মেলানোর পর তার মেয়াদ অনুপস্থিত বা শেষ হয়ে গেলেও প্যাকেজ আটকাবে।

## Optional company logo / ঐচ্ছিক কোম্পানির লোগো

After loading requirements, choose your PNG in the separate **Optional cover logo** chooser (up to1 MiB). It appears in the empty top-right cover margin, without changing the PDF document list/page count. Use **Remove logo** to remove it; replacing/removing it requires regenerating the PDF. An invalid logo preserves the previous valid logo and result. Logo data stays in browser memory; reset or loading a new requirements pack clears it.

প্রয়োজনীয়তা লোড করার পর আলাদা **ঐচ্ছিক প্রচ্ছদ লোগো** ঘরে PNG বেছে নিন (সর্বোচ্চ১ MiB)। লোগোটি প্রচ্ছদের খালি উপরের ডানদিকে বসবে; PDF নথি বা পৃষ্ঠা বাড়বে না। **লোগো সরান** দিয়ে মুছতে পারবেন। লোগো বদলালে/সরালে প্যাকেজ আবার তৈরি করুন। ভুল PNG দিলে আগের বৈধ লোগো ও প্যাকেজ থাকে। Reset বা নতুন requirements লোড করলে লোগো মুছে যায়।
