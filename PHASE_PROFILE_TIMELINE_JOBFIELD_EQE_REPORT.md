# Profile Timeline + Job Field Taxonomy + EQE Report

## 1. Packages Used

- `useravaa-final-codex-package-profile-eqe-taxonomy-v1.zip`
- `CODEX_MASTER_PROMPT_FINAL.txt`
- `useravaa-execution-handoff-v1.zip`
- `useravaa-eqe-codex-final-upload.zip`
- `useravaa-profile-experience-timeline-codex-patch-v1.zip`
- `useravaa-job-field-taxonomy-codex-patch-v1.zip`

Source-of-truth priority followed the requested order, with the job-field taxonomy patch treated as the highest-priority source for job title/job field assumptions.

## 2. Files Changed

- `eslint.config.mjs`
- `prisma/schema.prisma`
- `src/app/notifications/page.tsx`
- `src/features/v51/data/job-fields.ts`
- `src/features/v51/data/experience-timeline.ts`
- `src/features/v51/data/experience-questions.ts`
- `src/features/v51/data/my-profile.ts`
- `src/features/v51/data/profiles.ts`
- `src/features/v51/discover/DiscoverPage.tsx`
- `src/features/v51/guide/GuidePage.tsx`
- `src/features/v51/notifications/NotificationsPage.tsx`
- `src/features/v51/notifications/NotificationsPage.module.css`
- `src/features/v51/my-profile/components/AnswerEditor.tsx`
- `src/features/v51/my-profile/components/ExperienceTimelineEditor.tsx`
- `src/features/v51/my-profile/components/ExperienceTimelineItemForm.tsx`
- `src/features/v51/my-profile/components/ExperienceTimelineSummary.tsx`
- `src/features/v51/my-profile/components/JobFieldSelect.tsx`
- `src/features/v51/my-profile/components/JobTitleInput.tsx`
- `src/features/v51/my-profile/components/MyProfile.module.css`
- `src/features/v51/my-profile/components/NetworkToolbar.tsx`
- `src/features/v51/my-profile/components/ResponsibilityCheckbox.tsx`
- `src/features/v51/my-profile/components/RetractAnswerButton.tsx`
- `src/features/v51/my-profile/components/WeeklyQuestionCard.tsx`
- `src/features/v51/my-profile/pages/ProfileBuilderPage.tsx`
- `src/features/v51/my-profile/pages/ProfileDashboardClient.tsx`
- `src/features/v51/profile/ExperienceAnswerItem.tsx`
- `src/features/v51/profile/ProfileExperienceAnswersSection.tsx`
- `src/features/v51/profile/ProfileDetailPage.tsx`
- `src/features/v51/profile/ProfileDetailPage.module.css`
- `tests/phase-2c-1.test.tsx`
- `tests/phase-2c-2.test.tsx`
- `tests/profile-timeline-jobfield-eqe.test.tsx`

Prototype reference files were not modified.

## 3. Profile Timeline Changes

- Added structured timeline model/types and validation in `experience-timeline.ts`.
- Added `/profile/build` section `سوابق تجربه`.
- Added controlled timeline editor with add/remove/edit behavior.
- Timeline item fields capture job title, fixed job field, organization level, company name, company country, company industry, start month/year, end month/year or current-role flag, and optional description.
- Added coverage warning when claimed experience is 5+ years but timeline coverage is under five years.

## 4. jobTitle Free-Text Implementation

- Added `JobTitleInput`.
- `jobTitle` remains a normal text input.
- Validation only checks required length and does not restrict job title to a dropdown/list.

## 5. jobField Fixed Taxonomy Implementation

- Added fixed taxonomy in `job-fields.ts`.
- Added `JobFieldSelect`.
- Builder profile fields, timeline items, fixtures, discovery filters, network filters, public profile display, and question mapping now use fixed taxonomy labels.
- Old standalone values such as `محصول`, `تحلیل داده`, `مهندسی`, `رشد`, `هوش تجاری`, and `طراحی محصول` are rejected by strict job-field validation.

## 6. Discovery Filter Changes

- Discovery category filter copy was updated to `حوزه شغلی`.
- Discovery filter options now come exactly from the fixed 14-item taxonomy.
- Fixture profile job-field values were mapped from older category labels into the fixed taxonomy.

## 7. Schema/Model Changes

- Added Prisma `JobField` enum.
- Added Prisma `ExperienceTimelineItem` model.
- Added Prisma `ExperienceQuestionStatus` and `ExperienceAnswerStatus`.
- Added Prisma `ExperienceQuestion` and `ExperienceAnswer` models.
- Added profile relations for timeline items, experience questions, and experience answers.
- EQE answer statuses are limited to `DRAFT`, `PUBLISHED`, and `RETRACTED`.

## 8. Public Profile Changes

- Added `ProfileExperienceAnswersSection`.
- Added `ExperienceAnswerItem`.
- `/profiles/[profileId]` now renders `از تجربه من` only when published answers exist.
- Public section shows max 3 answers, sorted by `publishedAt desc`.
- Raw unanswered weekly questions are not rendered on public profile pages.
- No social actions were added to answers.

## 9. Question Engine Placement Implementation

- Added `WeeklyQuestionCard` on `/profile`.
- Placement is after the profile status/hero area and before dashboard sections.
- Anchor id is `weekly-question`.
- Added minimal weekly question notification target `/profile#weekly-question` without exposing full question text.

## 10. Question Engine Timeline Field Mapping

- `{current_role}` derives from current timeline item `jobTitle`.
- `{current_seniority}` derives from current timeline item `orgLevel`.
- `{current_company}` derives from current timeline item `companyName`.
- `{current_company_country}` derives from current timeline item `companyCountry`.
- `{previous_role}` derives from most recent non-current timeline item `jobTitle`.
- `{previous_seniority}` derives from most recent non-current timeline item `orgLevel`.
- `{previous_company}` derives from most recent non-current timeline item `companyName`.
- `{job_category}` derives from fixed taxonomy `jobField`.
- Free-text `previousCompanies` is not used for question eligibility.

## 11. No-Admin Confirmation

- No Admin review route was added.
- No Admin queue was added.
- No approve/reject/hide flow was added.
- EQE statuses are only `draft`, `published`, and `retracted`.
- Provider publishing requires responsibility confirmation.
- Provider can retract their own published answer.

## 12. Components Added/Updated

- `WeeklyQuestionCard`
- `AnswerEditor`
- `ResponsibilityCheckbox`
- `ProfileExperienceAnswersSection`
- `ExperienceAnswerItem`
- `RetractAnswerButton`
- `ExperienceTimelineEditor`
- `ExperienceTimelineItemForm`
- `ExperienceTimelineSummary`
- `JobFieldSelect`
- `JobTitleInput`
- Updated profile dashboard, profile builder, public profile, discovery, network toolbar, and notifications surfaces.

## 13. Tests Added

Added `tests/profile-timeline-jobfield-eqe.test.tsx` covering:

- WeeklyQuestionCard provider placement.
- Public profile raw-question hiding.
- Published answer display and max 3 behavior.
- Hidden public answer section when empty.
- Notification target and no full-question body.
- Publish blocked without responsibility checkbox.
- Draft to published transition.
- Provider retraction.
- Retracted answer removed from public output.
- No-admin EQE rule.
- Timeline required fields.
- Free-text job title.
- Fixed taxonomy job field.
- Legacy job-field rejection.
- Current and previous timeline derivation.
- Template eligibility based on timeline fields.
- Free-text previousCompanies excluded from EQE eligibility.
- Discovery filters exactly matching the fixed taxonomy.

Updated existing Phase 2C tests for the new `حوزه شغلی` language and taxonomy.

## 14. Verification Results

- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm run test` passed.
- Test result: 8 test files passed, 87 tests passed.
- `npm run build` passed.
- Local route checks returned 200 for `/profile`, `/profile/build`, `/profiles/ali`, `/discover`, and `/notifications`.

## 15. Known Gaps Intentionally Deferred

- Real auth and provider/requester permission enforcement remain deferred.
- Real database persistence for timeline items, questions, answers, notifications, and publish/retract actions remains deferred.
- Real API routes listed in the EQE package remain deferred; this phase uses typed mock data and adapter-ready helpers only.
- Weekly question scheduling/replacement randomness remains deterministic fixture behavior.
- No checkpoint was created because manual Chrome review is required first.

## Manual Chrome Review Fixes

1. Dynamic question rendering from `jobTitle`
   - The weekly question now derives `{current_role}` from the current timeline item where `isCurrent=true`.
   - `/profile` reads the mock profile-builder draft from local storage and recomputes the weekly question from the structured timeline, so an edited current `jobTitle` updates the rendered question.
   - If no current timeline item exists, `WeeklyQuestionCard` shows a validation/empty state instead of rendering a fake role question.

2. “نقش اصلی” replaced with “عنوان شغلی”
   - Replaced the remaining builder label and validation copy.
   - Added a test that the profile builder UI contains `عنوان شغلی` and does not contain `نقش اصلی`.

3. `jobField` changed to single-select dropdown
   - Replaced the profile/build multi-select chip UI with `JobFieldSelect`.
   - Validation now requires exactly one fixed-taxonomy job field.
   - Profile fixtures and Prisma profile model were adjusted from multi-field assumptions toward a single `jobField` profile context.

4. Previous-companies tag input removed
   - Removed the visible `شرکت‌های قبلی` tag input and Enter-to-add flow from `/profile/build`.
   - Previous companies are now derived from non-current structured timeline items for profile preview/submission.
   - EQE eligibility continues to ignore free-text `previousCompanies`.

5. Tests added/updated
   - Added tests for dynamic question rendering after changing `jobTitle` from `مدیر محصول` to `تحلیلگر داده`.
   - Added tests for stale role override by current timeline `jobTitle`.
   - Added tests for missing-current-role validation state.
   - Added tests for single selected `jobField`, rejection of two job fields, invalid free-text rejection, and exact taxonomy dropdown options.
   - Added tests confirming the previous-companies tag input no longer renders and public/profile summary does not require duplicate company entry.
   - Updated existing builder section and validation expectations.

6. Verification results
   - `npm` is not available on the current shell PATH, so the same project scripts were verified through the local Node binaries.
   - Lint passed: `node node_modules/eslint/bin/eslint.js .`
   - Typecheck passed: `node node_modules/typescript/bin/tsc --noEmit`
   - Test passed: `node node_modules/vitest/vitest.mjs run` with 8 test files and 87 tests passed.
   - Build passed: `node node_modules/next/dist/bin/next build`
   - Local route checks returned 200 for `/profile`, `/profile/build`, `/profiles/ali`, `/discover`, and `/notifications`.
