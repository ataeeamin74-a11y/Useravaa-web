# PHASE Cross-Page Consistency Audit Report

## Comprehensive Header, Brand, Profile, Public Profile, Discover Card, and Session CTA Consistency Fix

### Package Used
- Source package: `C:\Users\Snapp\Downloads\useravaa-comprehensive-v51-consistency-fix-v7-codex.zip`
- Prompt followed: `CODEX_PROMPT_COMPREHENSIVE_V51_CONSISTENCY_FIX_V7.txt`
- Imported logo assets:
  - `public/brand/useravaa-logo-horizontal.png`
  - `public/brand/useravaa-logo-stacked.png`
- The package did not include a symbol-only logo asset, so no symbol-only file was added.

### Files Changed
- `public/brand/useravaa-logo-horizontal.png`
- `public/brand/useravaa-logo-stacked.png`
- `src/components/header/Header.tsx`
- `src/components/header/Header.module.css`
- `src/lib/routes.ts`
- `src/features/v51/data/insight-question-cycle.ts`
- `src/features/v51/data/experience-discovery.ts`
- `src/features/v51/data/experience-questions.ts`
- `src/features/v51/discover/DiscoverPage.tsx`
- `src/features/v51/discover/DiscoverPage.module.css`
- `src/features/v51/insights/InsightsPage.tsx`
- `src/features/v51/profile/ProfileDetailPage.tsx`
- `src/features/v51/profile/ProfileRequestPanel.tsx`
- `src/features/v51/my-profile/pages/ProfileDashboardClient.tsx`
- `src/features/v51/my-profile/pages/ProfileNetworkPage.tsx`
- `src/features/v51/my-profile/components/WeeklyQuestionCard.tsx`
- `src/features/v51/my-profile/components/MyProfile.module.css`
- `src/features/v51/my-profile/components/ProfileDashboardPanels.tsx`
- `src/features/v51/my-profile/components/NetworkProfileCard.tsx`
- `src/features/v51/my-profile/components/NetworkTabs.tsx`
- `src/features/v51/my-profile/components/NetworkToolbar.tsx`
- `src/features/v51/notifications/NotificationsPage.tsx`
- `src/features/v51/saved/SavedPage.tsx`
- `src/features/v51/saved/SavedPage.module.css`
- `src/features/v51/conversations/pages/RequestConversationPage.tsx`
- `src/features/v51/conversations/pages/CheckoutPage.tsx`
- `src/features/v51/conversations/pages/ConversationsPage.tsx`
- `src/features/v51/conversations/pages/SelectTimePage.tsx`
- `src/features/v51/conversations/pages/ProposeTimesPage.tsx`
- `src/features/v51/conversations/components/RequestSummary.tsx`
- `src/features/v51/conversations/components/CheckoutSummary.tsx`
- `src/features/v51/conversations/components/ConversationDetailPanel.tsx`
- `src/features/v51/data/conversations.ts`
- `src/features/v51/data/wallet.ts`
- `src/features/v51/guide/GuidePage.tsx`
- `src/features/v51/wallet/WalletPage.tsx`
- `tests/comprehensive-v51-consistency-fix-v7.test.tsx`
- `tests/experience-discovery-system.test.tsx`
- `tests/manual-ui-fix.test.tsx`
- `tests/phase-2b.test.tsx`
- `tests/phase-2c-1.test.tsx`
- `tests/phase-2c-2.test.tsx`
- `tests/profile-timeline-jobfield-eqe.test.tsx`
- `tests/route-map.test.ts`

### Header and Brand
- Replaced the fake circular `UA` brand mark with the official package logo.
- Header hierarchy now uses the required RTL order:
  - Primary nav: `کشف تجربه‌ها`, `بینش‌ها`, `جلسه‌ها`, `پروفایل من`
  - Utility nav: `اعلان‌ها`, `ذخیره‌شده‌ها`, `کیف پول`, `راهنما`
- Utility links were visually reduced so the main product navigation remains dominant.

### Insight Question Cycle Consistency Fix
- Shared source used: `src/features/v51/data/insight-question-cycle.ts`
- Current active question:
  - `در نقش شما، چه چیزی از بیرون ساده به نظر می‌رسد اما در عمل سخت‌ترین بخش کار است؟`
- `/insights` reads the active question from the shared question-cycle source through `experience-discovery`.
- `/profile` reads the same question through `getActiveWeeklyQuestion`, which now returns the shared insight-cycle question instead of generating a role-specific provider question.
- Removed disconnected profile-completion copy from the widget:
  - `پرسش این هفته`
  - `پاسخ کوتاه شما به کامل‌تر شدن پروفایل تجربه‌تان کمک می‌کند.`
  - role-specific generated question text such as `در نقش مدیر محصول ...`
- `/profile` widget copy now connects the answer flow to `بینش‌ها` with:
  - Title: `سؤال این دوره در بینش‌ها`
  - Label: `سؤال فعال`
  - CTA: `پاسخ می‌دهم`
  - Disabled next-question control: `سؤال بعدی`
  - Skip action: `فعلاً نه`

### Follow Removal Result
- Public profile and MVP UI surfaces do not render Follow, Followers, Following, `فالو`, `دنبال`, or `دنبال‌کننده`.
- Internal fixture fields such as `isFollowing` remain only as non-rendered data compatibility fields.

### Save Destination Implementation
- `/saved` exists as the saved-items destination.
- Discover card save feedback now says:
  - `تجربه ذخیره شد. از بخش ذخیره‌شده‌ها می‌توانید دوباره آن را ببینید.`
- Insight card save feedback now says:
  - `بینش ذخیره شد. از بخش ذخیره‌شده‌ها می‌توانید دوباره آن را ببینید.`
- Saved card state remains visible as `ذخیره‌شده`.

### /saved Behavior
- `/saved` renders local/mock saved state only.
- Sections:
  - `افراد ذخیره‌شده`
  - `بینش‌های ذخیره‌شده`
- Whole-page empty state:
  - `هنوز چیزی ذخیره نکرده‌اید.`
- Section empty states:
  - `هنوز فردی ذخیره نکرده‌اید.`
  - `هنوز بینشی ذخیره نکرده‌اید.`
- Saved insights are filtered to published insight fixtures only.

### Insight Visibility Mapping
- Published insight answers appear in:
  - `/insights`
  - Author public profile section `بینش‌های این تجربه`
- Draft insights do not appear publicly.
- Retracted insights do not appear publicly.
- Public profile no longer renders the old `از تجربه من` section.
- Public profile does not render raw unanswered active questions.

### Naming Update to بینش‌ها
- Route remains `/insights`.
- User-facing page name, nav label, headings, tests, and download branding use `بینش‌ها`.
- `/insights` remains theme-first with equal cards, no featured person, and no hero provider.

### Discover Card Behavior
- `/discover` remains search-first and profile-driven.
- Discover cards now have one save control only: the top bookmark.
- Discover cards use `مشاهده تجربه` for profile entry.
- Discover cards show a non-social published insight count badge such as `✦ ۳ بینش`.
- The insight badge accessible label is `۳ بینش منتشرشده از این تجربه`.
- Request conversation/session CTA does not appear on `/discover` or `/insights` cards.

### Session CTA Copy
- Main conversion copy was changed from vague `درخواست گفت‌وگو` wording to session-oriented `جلسه مشاوره` wording where it acts as a conversion CTA.
- Public profile primary CTA is now `هماهنگی جلسه مشاوره`.
- The route remains `/conversations`; the user-facing page label is now `جلسه‌ها`.

### Tests Added/Updated
- Added `tests/comprehensive-v51-consistency-fix-v7.test.tsx`.
- Updated tests for:
  - Shared active question on `/insights`.
  - Exact same active question on `/profile`.
  - `/profile` widget title `سؤال این دوره در بینش‌ها`.
  - Removal of old disconnected profile-completion copy.
  - Published insight visibility on public profile.
  - Draft/retracted insight invisibility.
  - `/insights` page name `بینش‌ها`.
  - Public profile hiding raw unanswered active questions.
  - Header official logo and nav hierarchy.
  - Discover card save and published insight badge behavior.
  - `/saved` people and insights sections.

### Verification Results
- `npm run lint` could not run because `npm` is not installed in the shell path.
- Bundled equivalents used:
  - `C:\Users\Snapp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe node_modules\eslint\bin\eslint.js .`
  - Result: passed.
  - `C:\Users\Snapp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe node_modules\typescript\bin\tsc --noEmit`
  - Result: passed.
  - `C:\Users\Snapp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe node_modules\vitest\vitest.mjs run`
  - Result: passed, 11 files and 129 tests.
  - `C:\Users\Snapp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe node_modules\next\dist\bin\next build`
  - Result: passed.
- Local dev server check:
  - `/discover`, `/insights`, `/conversations`, `/profile`, `/profiles/ali`, `/saved`, `/wallet`, and `/notifications` all returned HTTP 200.
  - Content spot-checks confirmed `/profile` renders `سؤال این دوره در بینش‌ها` and the shared active question, `/profiles/ali` renders `هماهنگی جلسه مشاوره`, `/saved` renders `هنوز چیزی ذخیره نکرده‌اید.`, and `/insights` renders `بینش‌ها`.

### Manual Review URLs
- `http://127.0.0.1:3000/discover`
- `http://127.0.0.1:3000/insights`
- `http://127.0.0.1:3000/conversations`
- `http://127.0.0.1:3000/profile`
- `http://127.0.0.1:3000/profiles/ali`
- `http://127.0.0.1:3000/saved`
- `http://127.0.0.1:3000/wallet`
- `http://127.0.0.1:3000/notifications`

No checkpoint was created.

## Comprehensive Header, Brand, Profile, Public Profile, Discover Card, and Session CTA Consistency Fix

### Files Changed
- `src/lib/routes.ts`
- `src/features/v51/data/insight-question-cycle.ts`
- `src/features/v51/data/experience-questions.ts`
- `src/features/v51/data/experience-discovery.ts`
- `src/features/v51/data/profiles.ts`
- `src/features/v51/data/my-profile.ts`
- `src/features/v51/data/conversations.ts`
- `src/features/v51/discover/DiscoverPage.tsx`
- `src/features/v51/discover/DiscoverPage.module.css`
- `src/features/v51/insights/InsightsPage.tsx`
- `src/features/v51/insights/InsightsPage.module.css`
- `src/features/v51/saved/SavedPage.tsx`
- `src/features/v51/saved/SavedPage.module.css`
- `src/features/v51/profile/ProfileInsightsSection.tsx`
- `src/features/v51/conversations/pages/ConversationsPage.tsx`
- `src/features/v51/conversations/pages/ConversationDetailPage.tsx`
- `src/features/v51/conversations/pages/RequestConversationPage.tsx`
- `src/features/v51/conversations/components/ConversationTabs.tsx`
- `src/features/v51/conversations/components/ConversationDetailPanel.tsx`
- `src/features/v51/my-profile/pages/ProfileDashboardPage.tsx`
- `src/features/v51/my-profile/pages/ProfileDashboardClient.tsx`
- `src/features/v51/my-profile/pages/ProfileFeedbackPage.tsx`
- `src/features/v51/my-profile/pages/ProfileBuilderPage.tsx`
- `src/features/v51/my-profile/components/ProfileStatusCard.tsx`
- `src/features/v51/my-profile/components/SettlementInfoModal.tsx`
- `src/features/v51/my-profile/components/WeeklyQuestionCard.tsx`
- `src/features/v51/my-profile/components/MyProfile.module.css`
- `tests/comprehensive-v51-consistency-fix-v7.test.tsx`
- `tests/experience-discovery-system.test.tsx`
- `tests/profile-timeline-jobfield-eqe.test.tsx`
- `tests/phase-2c-1.test.tsx`
- `tests/route-map.test.ts`

### Header and Naming
- The official horizontal logo remains the header brand asset: `public/brand/useravaa-logo-horizontal.png`, with `alt="Useravaa"`.
- Primary nav order is now `کشف تجربه‌ها`, `بینش‌ها`, `جلسه‌ها`, `پروفایل من`.
- Utility nav remains lighter-weight: `اعلان‌ها`, `ذخیره‌شده‌ها`, `کیف پول`, `راهنما`.
- The route remains `/insights`; all user-facing page naming stays `بینش‌ها`.
- The `/conversations` route remains in place, but user-facing navigation and headings now use session language: `جلسه‌ها`.

### Follow Removal Result
- Public profiles and MVP user-facing UI do not render Follow, Followers, Following, `فالو`, `دنبال`, or `دنبال‌کننده`.
- Existing internal compatibility fields such as `isFollowing` and `showFollowerCount` were not surfaced in UI and were not redesigned.

### Save Destination Implementation
- `/saved` remains the saved-items destination.
- Discover card saved state is visible as `ذخیره‌شده` on the top bookmark control.
- Discover save feedback explains the destination: `ذخیره‌شده‌ها`.
- Insight card saved state remains visible as `ذخیره‌شده`.
- Insight save feedback explains the destination: `ذخیره‌شده‌ها`.

### /saved Behavior
- `/saved` uses local/mock saved state through `useSavedItems`.
- Page title is `ذخیره‌شده‌ها`.
- Page subtitle now says saved people and insights are for later decisions, reviewing experiences, and coordinating consultation sessions.
- Sections/tabs are explicit:
  - `افراد ذخیره‌شده`
  - `بینش‌های ذخیره‌شده`
- Saved people cards show `مشاهده تجربه` and `هماهنگی جلسه مشاوره`.
- Saved insight cards show `مشاهده تجربه` only and do not show a consultation-session CTA.
- Whole-page empty state: `هنوز چیزی ذخیره نکرده‌اید.`
- People empty state: `هنوز فردی ذخیره نکرده‌اید.`
- Insights empty state: `هنوز بینشی ذخیره نکرده‌اید.`

### Insight Visibility Mapping
- Published insight answers appear in `/insights`.
- Published insight answers appear in the author public profile under `بینش‌های این تجربه`.
- Draft and retracted insight fixtures remain excluded by `getPublishedInsights` and `getProfileInsights`.
- Ali now has three published insights so the Discover badge renders `✦ ۳ بینش` without a plus sign.
- Public profile no longer shows the old `از تجربه من` section or raw unanswered question widget chrome.

### Profile Question Cycle
- Shared source: `src/features/v51/data/insight-question-cycle.ts`.
- Current active question:
  - `در نقش شما، چه چیزی از بیرون ساده به نظر می‌رسد اما در عمل سخت‌ترین بخش کار است؟`
- `/insights` reads the active question from the shared question-cycle source.
- `/profile` reads the same active question through `getActiveWeeklyQuestion`; role-specific question generation is not used for the widget.
- `/profile` widget title is `سؤال این دوره در بینش‌ها`.
- Disconnected profile-completion copy such as `پرسش این هفته` and `کامل‌تر شدن پروفایل` is removed.
- Provider-controlled next-question switching was removed; only the passive cadence text `سؤال بعدی تا ۳ روز دیگر` remains.

### Discover and Session CTA Copy
- `/discover` remains search-first and profile-driven.
- Discover hero subtitle:
  - `آدم‌های باتجربه را پیدا کنید، تجربه‌شان را بررسی کنید، و در صورت نیاز جلسه مشاوره هماهنگ کنید.`
- Low-emphasis guidance line:
  - `تجربه‌ها را ببینید، مشاوره بگیرید و مسیر شغلی خود را آگاهانه‌تر انتخاب کنید.`
- Discover cards keep the top bookmark as the only save control.
- Discover cards show `مشاهده تجربه` and `هماهنگی جلسه مشاوره`.
- Request-conversation wording was removed from Discover and Insights cards.

### Tests Added/Updated
- Updated header route/nav expectations to `جلسه‌ها`.
- Updated Discover card tests for visible saved state, `✦ ۳ بینش`, and session CTA copy.
- Updated Insights tests for the active question module, category-only filtering, equal-card prompt/answer rendering, no provider CTA block, and no insight-type filter copy.
- Updated public profile tests for three published Ali insights, draft/retracted hiding, and absence of unanswered-question widget chrome.
- Updated saved page tests for prompt-header insight cards and local saved fixture state.

### Verification Results
- `npm run lint`: failed because `npm` is not installed in the shell path.
- Bundled commands used:
  - `C:\Users\Snapp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe node_modules\eslint\bin\eslint.js .`
  - Result: passed.
  - `C:\Users\Snapp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe node_modules\typescript\bin\tsc --noEmit`
  - Result: passed.
  - `C:\Users\Snapp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe node_modules\vitest\vitest.mjs run`
  - Result: passed, 12 files and 135 tests.
  - `C:\Users\Snapp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe node_modules\next\dist\bin\next build`
  - Result: passed.
- Local dev server route checks returned HTTP 200 for:
  - `/discover`
  - `/insights`
  - `/conversations`
  - `/profile`
  - `/profiles/ali`
  - `/saved`
  - `/wallet`
  - `/notifications`
  - `/checkout`

### Manual Review URLs
- `http://127.0.0.1:3000/discover`
- `http://127.0.0.1:3000/insights`
- `http://127.0.0.1:3000/conversations`
- `http://127.0.0.1:3000/profile`
- `http://127.0.0.1:3000/profiles/ali`
- `http://127.0.0.1:3000/saved`
- `http://127.0.0.1:3000/wallet`
- `http://127.0.0.1:3000/notifications`
- `http://127.0.0.1:3000/checkout`

No checkpoint was created.
