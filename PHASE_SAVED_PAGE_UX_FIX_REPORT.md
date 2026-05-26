# Phase Saved Page UX Fix Report

## Saved Page Structure
- Page title: `ذخیره‌شده‌ها`.
- Subtitle: `افراد و بینش‌هایی که برای تصمیم‌های بعدی ذخیره کرده‌اید؛ برای بررسی تجربه‌ها یا هماهنگی جلسه مشاوره به آن‌ها برگردید.`
- `/saved` renders mock/local saved state through `useSavedItems`.
- The destination is split into clear sections/tabs:
  - `افراد ذخیره‌شده`
  - `بینش‌های ذخیره‌شده`

## Saved Card Behavior
- Saved people cards show:
  - `مشاهده تجربه`
  - `هماهنگی جلسه مشاوره`
  - remove-from-saved action
- Saved insight cards show:
  - prompt header from the insight source
  - published answer text
  - `مشاهده تجربه`
  - remove-from-saved action
- Saved insight cards do not show `هماهنگی جلسه مشاوره`.

## Empty States
- Whole page: `هنوز چیزی ذخیره نکرده‌اید.`
- People section: `هنوز فردی ذخیره نکرده‌اید.`
- Insights section: `هنوز بینشی ذخیره نکرده‌اید.`

## Files Changed
- `src/features/v51/saved/SavedPage.tsx`
- `src/features/v51/saved/SavedPage.module.css`
- `src/features/v51/discover/DiscoverPage.tsx`
- `src/features/v51/insights/InsightsPage.tsx`
- `tests/experience-discovery-system.test.tsx`
- `tests/comprehensive-v51-consistency-fix-v7.test.tsx`

## Verification Results
- `npm run lint`: unavailable because `npm` is not installed in the shell path.
- Bundled lint: passed.
- Bundled typecheck: passed.
- Bundled test: passed, 12 files and 135 tests.
- Bundled build: passed.
- HTTP route check: `/saved` returned 200 and rendered `ذخیره‌شده‌ها` plus the required empty state.

## Manual Review URL
- `http://127.0.0.1:3000/saved`
