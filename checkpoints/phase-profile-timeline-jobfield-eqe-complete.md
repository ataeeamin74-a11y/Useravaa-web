# phase-profile-timeline-jobfield-eqe-complete

Checkpoint for the approved Profile Timeline + Job Field Taxonomy + Experience Question Engine integration and manual Chrome review fixes.

## Included Scope

- `/profile` includes `WeeklyQuestionCard` at `/profile#weekly-question`.
- `/profile/build` includes structured `سوابق تجربه`.
- `/profiles/[profileId]` includes the public published answers section `از تجربه من`.
- `/discover` uses the fixed job-field taxonomy for job-field filters.
- `/notifications` includes the EQE reminder/deep link to `/profile#weekly-question`.
- Structured experience timeline is implemented with:
  - manual free-text `jobTitle`
  - fixed-taxonomy `jobField`
  - organization level
  - company name
  - company country/location
  - company industry
  - start year/month
  - end year/month or current-role flag
  - optional description
- `عنوان شغلی` is the visible UI label for job title.
- No `نقش اصلی` UI copy remains in the profile builder.
- `jobField` is a single-select dropdown, not a multi-select chip group.
- The fixed `حوزه شغلی` taxonomy is enforced.
- The separate previous-companies tag/input flow is removed from `/profile/build`.
- Experience Question Engine renders dynamically from the current timeline item `jobTitle`.
- Experience Question Engine field mapping derives current and previous role/seniority/company from structured timeline items.
- Raw unanswered weekly questions are not shown on public profile pages.
- Published answers are shown on public profile only when status is `published`, max 3, sorted by `publishedAt` descending.
- No Admin EQE review flow was added.
- EQE answer statuses are limited to:
  - `draft`
  - `published`
  - `retracted`
- Responsibility checkbox is required before publishing.
- Mock publish and retract behavior is implemented.
- `PHASE_PROFILE_TIMELINE_JOBFIELD_EQE_REPORT.md` is included.
- The report includes the `Manual Chrome Review Fixes` section.
- Tests were added/updated in `tests/profile-timeline-jobfield-eqe.test.tsx` and related existing phase tests.
- Prototype reference files are preserved unchanged:
  - `prototype/index.html`
  - `prototype/styles.css`
  - `prototype/script.js`

## Verification

`npm` is not available on the current PowerShell PATH, so the project scripts were verified through their equivalent local Node command targets:

- `npm run lint` equivalent:
  - `node node_modules/eslint/bin/eslint.js .`
- `npm run typecheck` equivalent:
  - `node node_modules/typescript/bin/tsc --noEmit`
- `npm run test` equivalent:
  - `node node_modules/vitest/vitest.mjs run`
  - 8 test files passed
  - 87 tests passed
- `npm run build` equivalent:
  - `node node_modules/next/dist/bin/next build`

All verification checks passed.

## Git Status

An actual Git commit could not be created in this environment because:

- No `.git/` directory exists in the workspace.
- `git` is not available on PATH.

This file is the named checkpoint artifact for `phase-profile-timeline-jobfield-eqe-complete`.

## Phase Constraint

Conversation Request Reliability was not started.

Notifications phase was not started.

No next phase was started.
