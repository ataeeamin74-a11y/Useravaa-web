# Manual UI Fix Report

## 1. Manual Chrome Bugs Found

- `/profiles/[profileId]`: feedback/comment card rendered rating and comment text, but no reviewer identity.
- `/profiles/[profileId]`: 30-minute and 60-minute request option cards were visual only.
- Implemented RTL select/dropdown controls: chevron placement could crowd Persian text on the right side.
- Follow-up Chrome review: the first RTL dropdown fix was incomplete because the caret still rendered under/near filter text in `/discover`.
- `/discover`: save/bookmark button was positioned near the right-side avatar/profile identity area instead of the left side of the card.

## 2. Routes/Components Affected

- `/profiles/[profileId]`
  - `ProfileDetailPage`
  - `ProfileRequestPanel`
- `/discover`
  - `DiscoverPage`
  - discover card CSS and filter CSS
- `/profile/build`
  - organization-level selector in `ProfileBuilderPage`
  - shared profile builder CSS module

## 3. Files Changed

- `src/features/v51/data/profiles.ts`
- `src/features/v51/discover/DiscoverPage.tsx`
- `src/features/v51/discover/DiscoverPage.module.css`
- `src/features/v51/profile/ProfileDetailPage.tsx`
- `src/features/v51/profile/ProfileDetailPage.module.css`
- `src/features/v51/profile/ProfileRequestPanel.tsx`
- `src/features/v51/my-profile/pages/ProfileBuilderPage.tsx`
- `src/features/v51/my-profile/components/MyProfile.module.css`
- `tests/manual-ui-fix.test.tsx`
- `MANUAL_UI_FIX_REPORT.md`

Prototype reference files were not modified.

## 4. Feedback Identity Fix Summary

- Extended profile fixture data with `reviewAuthor` fields.
- Rendered reviewer name and role/company inside the existing V51-style feedback card.
- Preserved rating and comment visibility.
- Kept the section layout, card density, border radius, colors, and RTL alignment aligned with the existing V51 reconstruction.

## 5. Duration Selection Fix Summary

- Converted the 30-minute and 60-minute pricing cards on `/profiles/[profileId]` into selectable buttons.
- Added local/mock selected-duration state.
- Added active selected styling with `aria-pressed`.
- Default selection is 30 minutes, so the request CTA is always valid and visible.
- The request CTA now routes to `/requests/new?profileId={profileId}&duration={30|60}` based on the selected duration.
- No public availability calendar, backend, auth, payment, or external service was added.

## 6. RTL Dropdown/Icon Fix Summary

- Confirmed `/discover` select-like filter controls use custom left-side caret placement with RTL text aligned right.
- Confirmed `/discover` selects suppress native browser select arrows to avoid overlap.
- Added a scoped V51-style select wrapper and left-side caret for `/profile/build` organization-level selector.
- Preserved existing control height, width behavior, radius, colors, and density.
- Follow-up root cause: the previous CSS used logical `inset-inline-start`, which resolves to the right side in RTL and did not guarantee physical-left icon placement in Chrome.
- Follow-up fix: `/discover` filter and sort carets now use physical `left: 20px`, `top: 50%`, and `transform: translateY(-52%)`.
- Follow-up fix: `/discover` selects now reserve `44px` physical left padding for the chevron while keeping Persian text right-aligned.
- Follow-up fix: `/profile/build` organization-level select uses the same physical-left caret placement and left padding reserve.

## 7. Save/Bookmark Placement Fix Summary

- Moved the `/discover` card bookmark button to the visual left side in RTL layout.
- Preserved avatar and identity placement on the right side.
- Adjusted profile-card header padding so the left-side bookmark does not crowd content.
- Kept the button clickable and preserved the saved/unsaved visual toggle behavior.

## 8. Tests Added/Updated

Added `tests/manual-ui-fix.test.tsx` covering:

- feedback card renders reviewer identity, rating context, and comment text
- 30-minute option renders as a clickable selected button
- 60-minute option renders as a clickable selected button
- request CTA uses selected profile and duration in the route
- selected duration state is visually represented through selected class and `aria-pressed`
- RTL dropdown/select CSS keeps chevrons on the left and reserves text padding
- discover bookmark button remains a clickable button after moving left
- saved/unsaved mock state toggles deterministically

## 9. Verification Results

- `npm run lint`: passed
- `npm run typecheck`: passed
- `npm run test`: passed, 4 test files and 31 tests
- `npm run build`: passed
- Follow-up RTL dropdown verification: passed after the physical-left caret correction.

## 10. Remaining Visual Risks

- No broad visual changes were applied.
- The fixes should be manually reviewed in Chrome at 100% zoom on `/profiles/ali`, `/discover`, and `/profile/build`.
- Browser-native select rendering can vary by OS/browser, but native arrows are disabled for the implemented V51 custom select controls checked in this batch.

## Phase Constraint

Phase 2C-2 was not started.
