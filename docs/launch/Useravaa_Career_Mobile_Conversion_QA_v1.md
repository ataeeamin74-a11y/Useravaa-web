# Useravaa Career Mobile Conversion QA v1

## Scope

This pass improved mobile clarity and conversion quality inside the existing Career PWA journey: path discovery, path detail actions, compare selection, My Paths, and the lead capture sheet. It did not change the product model, save/compare/lead logic, APIs, SEO pages, raw career data, assets, packages, auth, Prisma, or deployment config.

## UX Audit Summary

- Career entry already explains the step-by-step path flow and exposes search quickly.
- Path discovery cards are tappable and scannable, but the path detail action cluster needed a clearer decision hierarchy.
- The lead sheet already validates full name and Iranian mobile correctly, but mobile spacing and submit reachability could be stronger.
- Compare selection already preserves the correct selected-count behavior, but the one-selected state needed clearer next-step guidance.
- My Paths already separates saved paths and saved comparisons, but count badges needed better accessible labels and empty states could guide the next action more directly.

## Mobile Friction Found

- Save, compare, and SEO-page actions were visually close enough that the primary save action did not stand out strongly at the decision moment.
- The compare tray showed selected count, but the next step was repeated generically and did not clearly adapt when exactly one path was selected.
- Lead form fields were valid and labeled, but the action area could scroll away on short mobile screens.
- My Paths counts were visible but not descriptive for assistive technology.
- Empty states were calm, but not as directly oriented toward the next existing action as they could be.

## Fixes Implemented

- Added a compact decision cue above the path-detail save action.
- Kept save as the primary action and grouped compare/share-page links as secondary actions.
- Made the SEO path link visually quieter than save and compare.
- Clarified compare tray next-step language for zero, one, and enough selected paths.
- Expanded the one-selected compare helper copy.
- Made the lead sheet form action area sticky within the sheet and slightly increased field/tap spacing.
- Clarified the lead phone label as Iranian mobile.
- Replaced native required blocking on lead name/phone fields with `aria-required` so the existing Persian validation messages and funnel failure event run consistently.
- Added accessible count labels to My Paths saved-path and saved-comparison sections.
- Refined My Paths empty-state copy to point back to existing exploration and comparison actions.
- Increased Career shell bottom content padding to reduce bottom-nav overlap risk.

## Files Changed

- `src/features/career/PathsPage.tsx`
- `src/features/career/CareerPages.module.css`
- `src/features/career/ComparePage.tsx`
- `src/features/career/ComparePage.module.css`
- `src/features/career/MyPathsPage.tsx`
- `src/features/career/CareerLeadCaptureSheet.tsx`
- `src/features/career/CareerLeadCaptureSheet.module.css`
- `src/features/career/CareerShell.module.css`
- `tests/path-seeker-engagement.test.tsx`
- `tests/career-lead-capture.test.tsx`
- `docs/launch/Useravaa_Career_Mobile_Conversion_QA_v1.md`

## Copy Changes

- Added: `قدم تصمیم‌گیری`
- Added: `اگر این مسیر به تصمیمت نزدیک است، آن را برای ادامه بررسی نگه دار.`
- Added: `این مسیر برای ادامه بررسی در مسیرهای شغلی من آماده است.`
- Changed compare helper to: `این مسیر شغلی برای مقایسه انتخاب شده است. مسیر دوم را از فهرست زیر انتخاب کن.`
- Added compare tray guidance for zero, one, and ready states.
- Changed phone label to: `شماره موبایل ایران`
- Lead name and phone inputs now use `aria-required="true"` instead of native `required`.
- Changed My Paths empty-state helper copy for saved paths and saved comparisons.

## Accessibility Changes

- My Paths count badges now include descriptive `aria-label` values.
- Compare selected-count guidance is announced through `aria-live`.
- Existing lead field label/input associations remain intact and are covered by tests.
- Required lead fields remain semantically marked with `aria-required`.
- Existing bottom navigation accessible label remains covered by tests.

## Behavior Intentionally Left Unchanged

- Save, remove, compare, comparison-save, lead-trigger timing, lead validation, and event tracking logic.
- Lead API and event API behavior.
- Saved paths and saved comparisons storage keys and shapes.
- Lead capture dismissal/submission memory behavior.
- SEO path pages, sitemap, robots, canonical URLs, and share preview metadata.
- Raw career JSON, slide assets, logo assets, package files, auth, database, and Prisma.

## Manual QA Result

Passed with a local Playwright smoke at `390 x 844` against the production build served by `next start`.

- Opened root Career PWA.
- Navigated path discovery and opened a path detail.
- Saved a path and confirmed the lead sheet opened.
- Submitted an invalid lead and confirmed name/phone validation errors were visible.
- Submitted a valid lead using test data.
- Opened My Paths, confirmed the saved path, and removed it.
- Started compare from a path, selected a second path, saved the comparison, and confirmed it appeared in My Paths.
- Checked root, path detail, My Paths, and compare for horizontal overflow and bottom-nav blocked tap centers.
- Confirmed no browser console errors.

Lead and event POSTs were mocked during browser QA to avoid writing JSONL files. API behavior is covered by existing automated tests and was not changed.

## Validation Results

- `npm run lint`: PASS
- `npm run typecheck`: PASS
- `npm test`: PASS, 71 files / 722 tests
- `npm run build`: PASS, Next.js 16.2.6, generated 83/83 static pages

## Remaining Risks

- Real device keyboard behavior and social browser viewport quirks still need a device-level pass.
- CSS improvements are covered by semantic tests rather than pixel assertions, so visual review remains useful before launch.

## Recommended Next Step

Run a 390 x 844 mobile browser smoke pass on the built app and check path detail, lead sheet, compare tray, My Paths, bottom-nav spacing, horizontal scroll, and console output.
