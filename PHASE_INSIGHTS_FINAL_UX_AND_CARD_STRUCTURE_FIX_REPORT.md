# Phase Insights Final UX and Card Structure Fix Report

## Insight Question Cycle
- Shared source used: `src/features/v51/data/insight-question-cycle.ts`.
- Active question:
  - `در نقش شما، چه چیزی از بیرون ساده به نظر می‌رسد اما در عمل سخت‌ترین بخش کار است؟`
- `/insights` renders this question in the active question module.
- `/profile` renders the exact same question through `getActiveWeeklyQuestion`.
- Provider-controlled question switching was removed from `/profile`; only passive cadence text remains.

## /insights Page Mapping
- Route remains `/insights`.
- Page name remains `بینش‌ها`.
- Hero title: `بینش‌ها`.
- Hero subtitle:
  - `پاسخ‌های کوتاه و تجربه‌محور آدم‌های باتجربه؛ برای شناخت بهتر نقش‌ها، مسیرها و تصمیم‌های شغلی.`
- Positioning line:
  - `بینش‌ها را بخوانید، صاحب تجربه را بهتر بشناسید، و اگر لازم بود جلسه مشاوره هماهنگ کنید.`
- Feed heading:
  - `تازه‌ترین بینش‌های تجربه‌ای`
- Reader filter is category-only: `دسته‌بندی شغلی`.
- Removed user-facing insight-type/template/topic filter copy such as `نوع بینش`, `همه واقعیت‌ها`, `همه قالب‌ها`, `نوع قالب`, and `موضوع`.

## Insight Card Structure
- `PublishedInsight` now supports:
  - `sourceType: "template" | "question_bank"`
  - `templateStem`
  - `questionText`
  - `answerText`
- Insight cards render the prompt header first:
  - template insights use `templateStem`
  - question-bank insights use the active `questionText`
- Cards render `answerText` as the main body.
- Decorative top chips such as `واقعیت پنهان`, `کاش می‌دانستم`, and `دوراهی سخت` are no longer rendered as card badges.
- Insight cards show `مشاهده تجربه`, `دانلود`, and `ذخیره`.
- Insight cards do not show `هماهنگی جلسه مشاوره`.

## Public Profile Visibility
- Public profile section label remains `بینش‌های این تجربه`.
- Published insight answers appear in the author profile.
- Draft and retracted insights do not appear publicly.
- Public profile does not show raw unanswered question widget UI such as `سؤال فعال` or `پاسخ می‌دهم`.

## Files Changed
- `src/features/v51/data/insight-question-cycle.ts`
- `src/features/v51/data/experience-questions.ts`
- `src/features/v51/data/experience-discovery.ts`
- `src/features/v51/insights/InsightsPage.tsx`
- `src/features/v51/insights/InsightsPage.module.css`
- `src/features/v51/profile/ProfileInsightsSection.tsx`
- `src/features/v51/my-profile/components/WeeklyQuestionCard.tsx`
- `src/features/v51/my-profile/components/MyProfile.module.css`
- `tests/experience-discovery-system.test.tsx`
- `tests/profile-timeline-jobfield-eqe.test.tsx`
- `tests/comprehensive-v51-consistency-fix-v7.test.tsx`

## Verification Results
- `npm run lint`: unavailable because `npm` is not installed in the shell path.
- Bundled lint: passed.
- Bundled typecheck: passed.
- Bundled test: passed, 12 files and 135 tests.
- Bundled build: passed.
- HTTP route checks:
  - `/insights`: 200, renders `سؤال فعال Useravaa`, the shared active question, `پاسخ به این سؤال`, and `تازه‌ترین بینش‌های تجربه‌ای`.
  - `/profile`: 200, renders `سؤال این دوره در بینش‌ها` and the shared active question.
  - `/profiles/ali`: 200, renders `بینش‌های این تجربه` and published insight answers.

## Manual Review URLs
- `http://127.0.0.1:3000/insights`
- `http://127.0.0.1:3000/profile`
- `http://127.0.0.1:3000/profiles/ali`
