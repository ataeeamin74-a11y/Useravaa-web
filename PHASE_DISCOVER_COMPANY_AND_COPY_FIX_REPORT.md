# Discover Company, CTA Copy, and Insights Layout Fix Report

## Scope

- Package: `useravaa-v12-previous-pending-plus-yekan-merged-codex-package.zip`
- Prompt followed first: `CODEX_PROMPT_DISCOVER_COMPANY_CTA_INSIGHTS_FILTER_LAYOUT_SHARE_VISUAL_ANSWER_FIX.txt`
- No checkpoint was created.
- Dynamic insight canonical URL/export scope was not redone; only share-entry UI and text-fit/font follow-up integration points were preserved.

## Files Changed

- `src/features/v51/data/experience-discovery.ts`
- `src/features/v51/discover/DiscoverPage.tsx`
- `src/features/v51/discover/DiscoverPage.module.css`
- `src/features/v51/insights/InsightsPage.tsx`
- `src/features/v51/insights/InsightsPage.module.css`
- `src/features/v51/profile/ProfileRequestPanel.tsx`
- `src/features/v51/profile/ProfileDetailPage.tsx`
- `src/app/insights/page.tsx`
- `tests/experience-discovery-system.test.tsx`
- `tests/comprehensive-v51-consistency-fix-v7.test.tsx`

## CTA Copy

- Main session CTA label changed from `هماهنگی جلسه مشاوره` to `هماهنگی جلسه`.
- Applied on Discover cards, Saved people cards, and the public profile request panel.
- Descriptive prose may still use `جلسه مشاوره` where it is not a button label.
- `مشاهده تجربه` remains unchanged as the profile-view CTA.

## Discover Company Filter

- Replaced the previous company select with a searchable combobox.
- Filter label is now `تجربه در شرکت`.
- Search placeholder is `نام شرکت را جستجو کنید...`.
- Search starts after two characters and limits results to eight.
- The result source is derived from normalized experience timeline company data, including current and previous timeline companies.
- Persian spacing variants are normalized through the company-search helper.
- English aliases are supported for known fixture companies such as Digikala, Snapp, Divar, Tapsi, Alibaba, and Cafe Bazaar.
- Empty search state renders `شرکتی با این نام پیدا نشد.`
- Selected company renders an active removable chip such as `تجربه در دیجی‌کالا`.
- The combobox does not create new companies.

## Insights Layout and Card Hierarchy Fix

- The side-card active question layout was removed.
- The active question now appears in a full-width context bar below the job-category filter.
- Job-category filter copy is now `همه دسته‌بندی‌های شغلی`.
- The filter is the only reader-facing filter and is presented as a visible module with accessible labels.
- Feed heading was simplified to one heading: `تازه‌ترین بینش‌های تجربه‌ای`.
- Count is supporting text only.
- Prompt headers render as editorial text, not chips.
- Main answer text is the visual focus with more comfortable line height.
- `مشاهده تجربه` is the primary full-width card CTA.
- `ذخیره` and `اشتراک‌گذاری` moved to lightweight icon controls.
- No stale save/remove toast renders on initial load.

## Insight Card Share Action Fix

- First-level `دانلود` was not exposed on insight cards.
- First-level card actions are `مشاهده تجربه`, `ذخیره`, and `اشتراک‌گذاری`.
- Share modal title is `اشتراک‌گذاری بینش`.
- Share modal actions are `دانلود تصویر کارت` and `کپی لینک`.
- Copy link uses the selected insight canonical URL.
- Download image uses the existing selected insight PNG export implementation.

## Insights In-Page Answer Flow Fix

- `پاسخ به این سؤال` opens an in-page modal/sheet on `/insights`.
- The default action no longer routes to `/profile`.
- Modal title is `پاسخ به سؤال فعال`.
- The active question text is rendered inside the modal.
- The modal includes answer textarea, related experience selector, draft save, publish action, and template/style options scoped to the answer flow only.
- No-profile fallback copy is `برای پاسخ دادن، اول پروفایل تجربه بسازید.` with CTA `ساخت پروفایل تجربه`.

## Tests Added/Updated

- Discover company combobox label, placeholder, search results, no-result state, and timeline-company filtering.
- CTA copy checks for `هماهنگی جلسه` and removal of `هماهنگی جلسه مشاوره` from action labels.
- Insights single-filter copy and forbidden reader-facing filters.
- Full-width active question bar and in-page answer composer.
- Share modal actions and no first-level card download.
- Saved tab behavior checks were updated in the shared V51 tests where applicable.

## Verification

- Current recovery run before final command sequence:
  - Typecheck: passed.
  - Tests: passed, 13 files and 155 tests.
- Final lint/typecheck/test/build results are recorded in the final response after the complete verification pass.

## Manual Chrome Review URLs

- `http://127.0.0.1:3000/discover`
- `http://127.0.0.1:3000/insights`
- `http://127.0.0.1:3000/saved`
- `http://127.0.0.1:3000/profiles/ali`
