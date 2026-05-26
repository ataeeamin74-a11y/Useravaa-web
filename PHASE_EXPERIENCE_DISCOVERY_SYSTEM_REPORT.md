# PHASE_EXPERIENCE_DISCOVERY_SYSTEM_REPORT

## 1. Package Files Used

- `useravaa-experience-discovery-system-codex-package-v1.zip`
- `CODEX_PROMPT_START_EXPERIENCE_DISCOVERY_SYSTEM.txt`
- `experience-discovery-system.prd.md`
- `experience-discovery-system.ux-spec.md`
- `experience-discovery-system.ui-spec.md`
- `SHARED_TAXONOMY_AND_RULES.json`
- `ACCEPTANCE_TESTS.md`
- `COMPONENT_CONTRACTS.md`

## 2. Routes Changed

- `/discover`
- `/insights`
- `/profiles/[profileId]`

## 3. Discover Search/Filter Behavior

- Added search-first Discover structure with the required placeholder: `نقش، شرکت، دسته‌بندی شغلی یا نام فرد را جستجو کن`.
- Search uses separate `searchDraft` and `submittedSearchQuery` state, so typing does not update results until submit.
- Search covers provider name, current job title, job category, current company, previous companies derived from timeline, and all timeline company names.
- Persian normalization handles `ي` to `ی`, `ك` to `ک`, trimming, extra spaces, and lowercase English text.
- Discover filters are limited to:
  - `دسته‌بندی شغلی`
  - `رده سازمانی`
  - `شرکت‌های قبلی`
  - `زبان گفت‌وگو`
- Search and filter groups use AND behavior; selected values inside each filter group use OR behavior.
- Active search/filter chips are removable, and `پاک‌کردن همه` resets search and filters.
- Previous-company filter options are derived from structured timeline data.
- Only active profiles are shown. Profiles with `acceptsConversationRequests=false` remain visible.

## 4. Insights Page Behavior

- Added `/insights` as an intent-first page.
- First interaction is `الان دنبال چه چیزی هستی؟`.
- Intent cards include:
  - `شناخت مسیر شغلی`
  - `تغییر مسیر شغلی`
  - `رشد در مسیر فعلی`
  - `انتقال تجربه`
- After seeker intent selection, only `در چه دسته‌بندی شغلی؟` is shown as the category selector.
- Suggested questions render as `۳ سؤال مهم برای {intent} در {jobCategory}` with three question cards.
- Insight answer cards show question, answer, provider identity, job title, `رده سازمانی`, previous companies text, `ذخیره`, and `دیدن تجربه`.
- Insight cards do not include request conversation, price, booking, like, comment, follow, view count, popular, rating, match, or score wording.

## 5. Ask Question Flow

- Added the below-answers prompt:
  - `جواب دقیق سؤالت را پیدا نکردی؟`
  - `از آدم‌های باتجربه بپرس.`
- Added mock modal form with:
  - `سؤال تو چیست؟`
  - `دسته‌بندی شغلی`
  - `این سؤال بیشتر درباره چیست؟`
- Added required placeholder and helper copy.
- Mock submit shows: `سؤال تو ثبت شد. وقتی فرد مرتبطی پاسخ بدهد، به تو اطلاع می‌دهیم.`

## 6. Transfer Experience Flow

- `انتقال تجربه` mode shows the required title, subtitle, three suggested questions, value copy, and CTA.
- `ثبت اولین بینش` routes to `/profile#weekly-question`.
- No disconnected transfer form was added.

## 7. Profile Support Changes

- Added `ProfileInsightsSection` on public profile pages.
- Section title: `بینش‌های این تجربه`.
- Shows up to 3 published provider insights.
- Hides completely when no published insights exist.
- Request conversation remains available only inside the profile request panel.

## 8. Shared Taxonomy Implementation

- The fixed job taxonomy remains sourced from `src/features/v51/data/job-fields.ts`.
- Discover and Insights category controls use the fixed taxonomy only.
- The Discovery System UI uses `دسته‌بندی شغلی` for category labels.
- No arbitrary job category values were introduced.

## 9. UI Implementation Notes

- Discover keeps the V51 visual direction while changing behavior to search-first and filter-light.
- Discover cards remain white, bordered, RTL, and compact with V51-style CTAs.
- Insights uses a narrower single-column layout for guided reading.
- Dropdown chevrons remain left-positioned for RTL controls.
- Palette remains aligned with teal, blue, deep navy, and white surfaces.

## 10. Forbidden Card Elements Confirmation

- Discover cards do not render Follow, Followers, Following, price, availability, request conversation, booking, match, score, `درصد نزدیکی`, topic chips, or company logos.
- Insight cards do not render request conversation, price, booking, like, comment, follow, view count, popular, rating, match, score, or company logos.

## 11. Tests Added/Updated

- Added `tests/experience-discovery-system.test.tsx`.
- Updated `tests/route-map.test.ts`.
- Updated `tests/manual-ui-fix.test.tsx` for the new save CTA label and current card spacing.

Coverage added for:

- Discover route structure and required placeholder.
- Search submit-state separation.
- Searchable fields and Persian normalization.
- AND/OR filter behavior.
- Conversation language filter behavior.
- Forbidden card element checks.
- Active-only profile visibility and non-requesting provider visibility.
- Insights first interaction and intent cards.
- Insights category selector, question cards, answer cards, ask-question, and transfer flow.
- Profile insights section display/hide behavior.
- Shared taxonomy and analytics event contracts.

## 12. Verification Results

`npm` is unavailable on the shell PATH in this environment, so the exact script-equivalent commands were run with the bundled Node runtime:

- Lint: `C:\Users\Snapp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe node_modules\eslint\bin\eslint.js .` — passed
- Typecheck: `C:\Users\Snapp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe node_modules\typescript\bin\tsc --noEmit` — passed
- Test: `C:\Users\Snapp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe node_modules\vitest\vitest.mjs run` — passed, 10 files / 121 tests
- Build: `C:\Users\Snapp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe node_modules\next\dist\bin\next build` — passed

## 13. Known Gaps Intentionally Deferred

- Real API integration for Discover, Insights, saved insights, and ask-question submission is deferred.
- Real analytics dispatch is deferred; event contracts are present as typed fixtures.
- Mobile filter bottom-sheet behavior is implemented as local UI state only.
- No admin review, feed, social graph, ranking, direct booking, or request-from-card behavior was added.

## Manual Chrome Review Fixes - Insight Page Refinement

### 1. Source Package Used

- `useravaa-insight-page-refinement-codex-package-v1.zip`
- `insight-page-refinement.prd.md`
- `insight-page-ux-spec.md`
- `insight-page-ui-spec.md`
- `insight-page-component-contracts.md`
- `insight-page-acceptance-tests.md`
- `shared-taxonomy-and-rules.json`
- `CURRENT_STATUS_CONTEXT.md`

### 2. Files Changed

- `src/features/v51/insights/InsightsPage.tsx`
- `src/features/v51/insights/InsightsPage.module.css`
- `src/features/v51/data/experience-discovery.ts`
- `src/lib/routes.ts`
- `tests/experience-discovery-system.test.tsx`
- `tests/route-map.test.ts`
- `PHASE_EXPERIENCE_DISCOVERY_SYSTEM_REPORT.md`

### 3. Removed From Previous `/insights`

- Removed top intent-card onboarding.
- Removed heavy category selector before content.
- Removed suggested question grid as the primary page structure.
- Removed ask-question modal from the main `/insights` page.
- Removed transfer-experience branch from the top page flow.
- Removed `دیدن تجربه` wording on insight cards in favor of `مشاهده تجربه`.

### 4. Final `/insights` Structure

1. Existing app navigation with active `بینش‌ها`.
2. Two-column masthead on desktop:
   - `مجله کوتاه تجربه‌های واقعی`
   - `بینش‌ها`
   - refined description copy
   - inline text filters
   - compact `سؤال این دوره` context box
3. Editorial note and result count.
4. Equal-weight two-column card grid on desktop and one-column grid on mobile.
5. Provider contribution CTA after the initial card group.
6. More equal-weight cards.
7. Controlled `نمایش بینش‌های بیشتر` button.
8. Simple footer.

### 5. Data/Model Changes

- Added `InsightType` with the approved values:
  - `واقعیت پنهان`
  - `از بیرون / از درون`
  - `کاش می‌دانستم`
  - `یادگیری پرهزینه`
  - `دوراهی سخت`
- Added `currentInsightQuestionCycle` for the current question context.
- Extended published insight fixtures with `type` and `relativeDateFa`.
- Added filter helpers for selected job category and selected insight type.
- Added author/source helper derived from existing Experience Profile fixtures.

### 6. Component Changes

- Rebuilt `InsightsPage` around masthead, inline filters, equal cards, provider CTA, load more, and download preview modal.
- Kept components local to the route to avoid expanding public API surface during this fix batch.
- Preserved profile and discover integrations.

### 7. Download-Card Preview Behavior

- `دانلود` now opens `پیش‌نمایش کارت قابل انتشار` first.
- Preview is a 16:9 card with Useravaa branding, page name `بینش‌ها`, insight type, quote, author, job title, org level, experience line, and `useravaa.com/insight`.
- Modal actions:
  - `ذخیره تصویر برای لینکدین`
  - `کپی لینک کارت`
- Image save is implemented as a local SVG download mock suitable for the current fixture-only phase.

### 8. Analytics Events Added/Updated

Added `INSIGHT_ANALYTICS_EVENTS`:

- `insight_page_opened`
- `insight_filter_opened`
- `insight_filter_applied`
- `insight_card_viewed`
- `insight_profile_opened`
- `insight_saved`
- `insight_download_clicked`
- `insight_download_preview_opened`
- `insight_image_saved`
- `insight_link_copied`
- `insight_load_more_clicked`
- `provider_answer_cta_clicked`

### 9. Tests Added/Updated

- Updated `/insights` tests to assert the refined page name, masthead, inline filters, current question context, equal-weight card fields, forbidden UI removals, download preview modal, provider CTA placement, and controlled load-more behavior.
- Updated route-map tests for the `بینش‌ها` route title.
- Preserved Discover regression checks for search-first behavior and card restrictions.

### 10. Verification Results

`npm` is unavailable on the shell PATH in this environment, so the exact bundled Node script-equivalent commands were run:

- Lint: `C:\Users\Snapp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe node_modules\eslint\bin\eslint.js .` — passed
- Typecheck: `C:\Users\Snapp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe node_modules\typescript\bin\tsc --noEmit` — passed
- Test: `C:\Users\Snapp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe node_modules\vitest\vitest.mjs run` — passed, 10 files / 121 tests
- Build: `C:\Users\Snapp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe node_modules\next\dist\bin\next build` — passed

### 11. Known Gaps Intentionally Deferred

- Real image rendering/export service for PNG/JPG share assets is deferred; the current implementation uses local SVG download.
- Real analytics dispatch is deferred; contracts are present.
- Real saved insight persistence is deferred; save state remains local mock state.
- No public social actions, feed, ranking, or request conversation CTA were added.

## Manual Chrome Review Refinement: Insights Page

### 1. Files Changed

- `src/features/v51/insights/InsightsPage.tsx`
- `src/features/v51/insights/InsightsPage.module.css`
- `src/features/v51/data/experience-discovery.ts`
- `src/lib/routes.ts`
- `tests/experience-discovery-system.test.tsx`
- `tests/route-map.test.ts`
- `PHASE_EXPERIENCE_DISCOVERY_SYSTEM_REPORT.md`

### 2. Old `/insights` UX Removed

- Removed the first-screen `الان دنبال چه چیزی هستی؟` intent-card flow.
- Removed intent grid as the main page architecture.
- Removed heavy category selector before content.
- Removed suggested-question blocks as the first-screen structure.
- Removed ask-question modal from `/insights`.
- Removed transfer-experience top-page branch.
- Kept request-conversation CTA out of insight cards.

### 3. Final `/insights` Architecture Implemented

- Route remains `/insights`.
- Page name is exactly `بینش‌ها`.
- Masthead introduces the editorial page and current question/theme.
- Current question appears as a compact `سؤال این دوره` context box.
- Equal-weight insight cards render in a two-column desktop grid and one-column mobile grid.
- Author identity appears inside each card only as source/credibility.
- Provider contribution CTA appears after the initial card group.
- Controlled `نمایش بینش‌های بیشتر` button is used instead of infinite scroll.
- Simple footer remains at the bottom.

### 4. Inline Filter Behavior

- Intro sentence uses the required inline filter structure:
  `در حال خواندن بینش‌های [همه دسته‌بندی‌ها ▾] درباره [همه واقعیت‌ها ▾]`
- Job category token opens the fixed Useravaa taxonomy.
- Insight type token opens:
  - `واقعیت پنهان`
  - `از بیرون / از درون`
  - `کاش می‌دانستم`
  - `یادگیری پرهزینه`
  - `دوراهی سخت`
- Filter selection updates the visible fixture-backed cards immediately.

### 5. Card/Download Behavior

- Cards show insight type, relative date, insight text, author display name, job title, org level, experience line, `مشاهده تجربه`, `دانلود`, and `ذخیره`.
- Cards do not show request conversation, booking, price, follow, like, comment, match, score, or popularity metrics.
- `دانلود` opens a preview modal first.
- Preview modal uses a 16:9 LinkedIn-ready card with Useravaa branding and `useravaa.com/insight`.
- Image saving remains a local SVG download mock for this frontend fixture phase.

### 6. Tests Added/Updated

- `/insights` renders `بینش‌ها`.
- Old intent-first copy and architecture are absent.
- Inline filter sentence and popover options render.
- Current question context block renders.
- Equal-weight insight cards render required content.
- Forbidden social/marketplace/request elements are absent from cards.
- Download opens preview modal before image save.
- `نمایش بینش‌های بیشتر` exists and is controlled by button state.
- Provider CTA appears after the first card group.
- `/discover` regression tests continue to cover search-first behavior.
- Public profile insight section tests continue to pass.

### 7. Verification Results

`npm` is unavailable on the shell PATH in this environment, so the exact bundled Node script-equivalent commands were run:

- Lint: `C:\Users\Snapp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe node_modules\eslint\bin\eslint.js .` — passed
- Typecheck: `C:\Users\Snapp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe node_modules\typescript\bin\tsc --noEmit` — passed
- Test: `C:\Users\Snapp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe node_modules\vitest\vitest.mjs run` — passed, 10 files / 121 tests
- Build: `C:\Users\Snapp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe node_modules\next\dist\bin\next build` — passed

### 8. Known Gaps Intentionally Deferred

- Real persisted saved insight state is deferred.
- Real analytics dispatch is deferred; event contracts are present.
- Real PNG/JPG rendering service for downloadable cards is deferred.
- No checkpoint was created.
