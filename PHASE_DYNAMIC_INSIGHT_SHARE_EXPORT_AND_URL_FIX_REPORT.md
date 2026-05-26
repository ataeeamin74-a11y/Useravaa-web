# Dynamic Insight Share Export and URL Fix Report

## Scope

- Package used: `useravaa-v12-prd-v2-dynamic-insight-share-package.zip`
- Codex prompt followed: `CODEX_PROMPT_DYNAMIC_INSIGHT_SHARE_EXPORT_AND_URL_FIX.txt`
- Product reference used: `Useravaa_V12_Addon_Fixes_Comprehensive_PRD_v2.md`
- Scope kept to dynamic insight share/export, canonical insight URLs, direct insight routes, and related tests.
- No checkpoint was created.

## Files Changed

- `src/features/v51/data/experience-discovery.ts`
- `src/features/v51/data/profiles.ts`
- `src/features/v51/insights/insight-share-export.ts`
- `src/features/v51/insights/InsightsPage.tsx`
- `src/features/v51/insights/InsightsPage.module.css`
- `src/app/insights/[insightSlug]/page.tsx`
- `public/avatars/mohsen.svg`
- `tests/dynamic-insight-share-export.test.tsx`
- `tests/experience-discovery-system.test.tsx`
- `PHASE_DYNAMIC_INSIGHT_SHARE_EXPORT_AND_URL_FIX_REPORT.md`

## Canonical Insight URLs

- Every published insight now has a `slug` and a computed `canonicalUrl`.
- Canonical URL format is `https://useravaa.com/insights/[insightSlug]`.
- The route remains under `/insights`; a new detail route supports `/insights/[insightSlug]`.
- `getPublishedInsightBySlugOrId()` returns only published insights and supports both slug and id fallback.
- Draft and retracted insights are not resolved by the public slug/id lookup.

## Data-Driven Share Export

- Added `buildInsightShareExportData(insightSlugOrId)` as the production share data builder.
- The export data is derived from the selected insight and its provider profile:
  - `insight.id`
  - `insight.slug`
  - `insight.promptHeader`
  - `insight.answerText`
  - `insight.canonicalUrl`
  - `provider.name`
  - `provider.avatarUrl`
  - `provider.initials`
  - `provider.jobTitle`
  - `provider.orgLevel`
  - `provider.experienceCompanyText`
  - official Useravaa logo asset
- Amin no longer enters Mohsen's share data manually. Sharing Mohsen's insight reads Mohsen's provider fixture and Mohsen's selected insight automatically.
- Added Mohsen as an active provider fixture and added Mohsen's published insight to exercise cross-provider export behavior.

## Copy Link Behavior

- Card action label is now `اشتراک‌گذاری`.
- Modal title is `اشتراک‌گذاری بینش`.
- Modal action labels are:
  - `دانلود تصویر کارت`
  - `کپی لینک`
- `کپی لینک` calls `copyInsightCanonicalUrl(data)` and copies the selected insight's exact canonical URL.
- The old generic `https://useravaa.com/insight` copy behavior was removed.

## PNG Export Behavior

- `renderInsightShareImage(data)` renders a browser canvas from the same selected insight/provider data used by the modal preview.
- `downloadInsightShareImage(data)` downloads PNG output.
- Filename format is `useravaa-insight-[slug].png`.
- The old SVG string export and static SVG filename path were removed.
- Provider avatar is used when available; provider initials are used as fallback.
- The production share modal has no manual input fields for provider name, role, company, answer text, URL, or image.

## Visual Export Design Failure Fix

Previous visual failure summary:

- The previous PNG looked like a plain white text box.
- The Useravaa logo and `بینش‌ها` label collided.
- Provider identity was reduced to a small bottom-row avatar and cramped metadata.
- Answer text was too large and heavy.
- The URL was too bright and competed with the quote.
- The card had unbalanced empty space and no premium quote-card structure.

Files changed for this visual fix:

- `src/features/v51/insights/insight-share-export.ts`
- `src/features/v51/insights/InsightsPage.tsx`
- `src/features/v51/insights/InsightsPage.module.css`
- `tests/dynamic-insight-share-export.test.tsx`
- `PHASE_DYNAMIC_INSIGHT_SHARE_EXPORT_AND_URL_FIX_REPORT.md`

Final canvas/export dimensions:

- `1600 × 900` horizontal PNG.
- Export remains browser canvas based and still outputs `image/png`.

Right-side provider identity layout:

- Provider avatar/photo is drawn as a large `252px` circular identity block on the right.
- Avatar includes a white inner ring and pale blue outer ring.
- If `provider.avatarUrl` is missing or fails, initials render in the same large identity slot.
- Provider name, `jobTitle · orgLevel`, and `experienceCompanyText` are centered under the avatar with a subtle divider.

Typography changes:

- Answer text now uses a calmer `42px` Tahoma/Arial stack with `600` weight and a balanced line height.
- Answer text clamps to five lines with an ellipsis.
- Prompt/header is a small pill integrated into the quote panel instead of a large blue heading.
- Metadata is smaller and muted.

Logo collision fix:

- Official Useravaa logo asset is still used.
- The renderer crops the transparent padding from the logo asset before drawing it.
- The logo is placed in the top-right brand area, separated from the `بینش تجربه‌ای` context label.

URL styling fix:

- Canonical URL remains dynamic and selected-insight specific.
- Footer URL is now smaller, calmer, and placed below a subtle divider.
- The URL is rendered without competing with the answer text.

Quote-card layout implementation:

- Main content is now a dedicated quote panel on the left/center.
- Decorative quote marks and pale blue borders create a share-card composition.
- Background uses a soft blue gradient and dot accent pattern.
- The modal preview was updated to mirror the same right-side provider and quote-panel structure.

Dynamic data preservation:

- Share/export still uses `buildInsightShareExportData(insightSlugOrId)`.
- No manual inputs were added.
- No selected provider, answer, avatar, company, URL, or filename is hardcoded in the export renderer.
- Filename remains `useravaa-insight-[slug].png`.

Downloaded filename examples:

- `useravaa-insight-hidden-reality-data-to-product-mohsen.png`
- `useravaa-insight-active-question-product-ambiguity-ali.png`

## Insight Character Limit and PNG Text-Fit Follow-up

280-character input rule:

- New insight answers are capped at `280` characters through shared helpers in `src/features/v51/data/experience-questions.ts`.
- The shared limit is `insightAnswerMaxLength = 280`.
- Text input is normalized through `limitInsightAnswerInput()` before state is updated.
- Publish validation now rejects answers longer than 280 characters with:
  - `متن بینش نمی‌تواند بیشتر از ۲۸۰ کاراکتر باشد.`

Live counter implementation:

- `/profile` provider answer editor now shows `current / 280` beside the textarea.
- `/insights` active question now opens an in-page answer sheet instead of routing the provider to `/profile`.
- The `/insights` answer sheet shows the same `current / 280` counter and `حداکثر ۲۸۰ کاراکتر` helper copy.
- Counter source uses `getInsightAnswerCharacterCount()` and updates from the same controlled textarea state used for validation.

Validation and enforcement behavior:

- Textareas use `maxLength={280}`.
- Change handlers also call `limitInsightAnswerInput()` so pasted text is clipped to 280 characters.
- Publish is disabled while the answer is empty, over limit, or responsibility is not accepted.
- Draft save is disabled while the answer is empty or invalid.
- `publishExperienceAnswer()` enforces the limit at the data/helper layer, so tests cover the rule beyond the UI.

300-character export-safe rendering rule:

- The PNG renderer now safely preserves answer text up to `300` characters without ellipsis.
- `getInsightShareAnswerTextForRender()` returns text unchanged for `<= 300` characters.
- Text beyond 300 characters is clamped gracefully with an ellipsis for legacy resilience.

Adaptive typography logic:

- `getInsightShareAnswerTypography()` chooses answer typography by character count:
  - `0-120`: short answer tier, larger but still calm.
  - `121-200`: medium answer tier.
  - `201-300`: long answer tier with smaller type and comfortable line height.
  - `>300`: stress tier plus graceful clamp.
- Canvas rendering uses `getCanvasAnswerTextFit()` to measure wrapped lines and step down font size when needed so text remains inside the quote panel.
- Modal preview uses the same length-tier helper to select the preview answer class.

Test fixtures added:

- Short answer: about 80 characters.
- Medium answer: about 170 characters.
- Long valid answer: 280 characters.
- Export stress answer: 300 characters.
- Overflow answer: 301 characters to verify clamp only after the safe margin.

Files changed for this follow-up:

- `src/features/v51/data/experience-questions.ts`
- `src/features/v51/my-profile/components/AnswerEditor.tsx`
- `src/features/v51/my-profile/components/WeeklyQuestionCard.tsx`
- `src/features/v51/my-profile/components/MyProfile.module.css`
- `src/features/v51/insights/InsightsPage.tsx`
- `src/features/v51/insights/InsightsPage.module.css`
- `src/features/v51/insights/insight-share-export.ts`
- `tests/dynamic-insight-share-export.test.tsx`
- `tests/experience-discovery-system.test.tsx`
- `tests/profile-timeline-jobfield-eqe.test.tsx`
- `PHASE_DYNAMIC_INSIGHT_SHARE_EXPORT_AND_URL_FIX_REPORT.md`

## Insights and Profile Mapping

- `/insights` remains theme-first and reading/discovery oriented.
- `/insights/[insightSlug]` renders the selected published insight with its provider identity and canonical URL.
- Published insights remain available to `/insights` and provider public profile sections through the existing published visibility mapping.
- Draft and retracted insights remain excluded from public `/insights` cards and public profile insight sections.

## Tests Added or Updated

- Added `tests/dynamic-insight-share-export.test.tsx` for:
  - Mohsen share data uses Mohsen's provider and selected insight data.
  - Switching to another provider changes exported data.
  - Template insights use `templateStem`.
  - Question-bank insights use `questionText`.
  - Copy link writes the selected canonical URL.
  - PNG filename includes selected slug.
  - Production modal has no manual input fields.
  - Unique canonical URLs for all published insights.
  - Avatar fallback via provider initials.
  - PNG export path replaces the old SVG export helper.
  - Premium quote-card geometry, `1600 × 900` dimensions, prominent provider avatar, quote panel, and calm footer URL.
  - Renderer source remains free of hardcoded provider/insight fixture data.
  - Adaptive short/medium/long/stress answer typography.
  - No truncation for export text up to 300 characters.
  - Preview and PNG renderer use the same answer typography tier helper.
- Updated `tests/experience-discovery-system.test.tsx` for:
  - Card action label `اشتراک‌گذاری`.
  - Share modal title/actions.
  - Selected canonical URL in modal preview.
  - New share image/link helper calls.
  - `/insights` answer composer counter and 280-character textarea limit.
- Updated `tests/profile-timeline-jobfield-eqe.test.tsx` for:
  - `/profile` answer editor counter.
  - 280-character publish acceptance.
  - 281-character publish rejection and validation error.

## Verification Results

`npm` is unavailable on PATH:

```powershell
npm run lint
```

Result: failed because `npm` is not recognized.

Because the `npm` executable is unavailable on this machine, the requested `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` steps were executed through their bundled Node equivalents below.

Bundled Node equivalents used:

```powershell
& 'C:\Users\Snapp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' 'node_modules\eslint\bin\eslint.js' .
& 'C:\Users\Snapp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' 'node_modules\typescript\bin\tsc' --noEmit
& 'C:\Users\Snapp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' 'node_modules\vitest\vitest.mjs' run
& 'C:\Users\Snapp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' 'node_modules\next\dist\bin\next' build
```

Results:

- Lint: passed.
- Typecheck: passed.
- Tests: passed, 13 files and 151 tests.
- Build: passed.

Visual automation note:

- Browser plugin is not available in this session.
- Playwright is not installed in this repo, so the downloaded PNG visual must be confirmed in manual Chrome review.

Running local route checks:

- `http://127.0.0.1:3000/insights`: 200, contains `اشتراک‌گذاری`.
- `http://127.0.0.1:3000/insights/hidden-reality-data-to-product-mohsen`: 200, contains Mohsen data and canonical URL.
- `http://127.0.0.1:3000/insights/active-question-product-ambiguity-ali`: 200, contains Ali data and canonical URL.
- `http://127.0.0.1:3000/insights/career-switch-product-design-sara`: 200.
- `http://127.0.0.1:3000/discover`: 200.

## Manual Review URLs

- `http://127.0.0.1:3000/insights`
- `http://127.0.0.1:3000/insights/hidden-reality-data-to-product-mohsen`
- `http://127.0.0.1:3000/insights/active-question-product-ambiguity-ali`
- `http://127.0.0.1:3000/insights/career-switch-product-design-sara`

## Yekan Bakh Font, Character Limit, and PNG Text-Fit Follow-up

Font integration:

- Added Yekan Bakh font files under `public/fonts/yekan-bakh/`.
- Added `@font-face` declarations in `src/app/globals.css`.
- Defined reusable token:
  - `--font-yekan-bakh: "Yekan Bakh", "YekanBakh", Tahoma, Arial, sans-serif`
- Applied the font stack globally for the Persian V51 UI surfaces.
- Export renderer uses `insightShareFontFamily` so downloaded PNG typography is drawn with Yekan Bakh when available, falling back to Tahoma/Arial.

Font weight mapping:

- Body/UI text: Regular/Medium.
- Cards and answer text: Medium.
- Buttons and labels: Bold.
- Page titles: Bold/Heavy.
- Long PNG answer text avoids Heavy/Fat weights.

280-character input rule:

- `insightAnswerMaxLength` remains `280`.
- `/insights` in-page answer composer uses `maxLength={280}`.
- Pasted input is clipped through `limitInsightAnswerInput()`.
- Counter format is `current / 280`.
- Empty publish is disabled.
- Draft and publish validation use the shared answer limit helpers.

300-character export-safe rendering:

- `insightShareVisualSpec.answerSafeCharacterCount` remains `300`.
- `getInsightShareAnswerTextForRender()` does not truncate content at or below 300 characters.
- Content above 300 characters clamps gracefully with ellipsis.
- Preview and canvas renderer use the same `getInsightShareAnswerTypography()` tiering.

Adaptive typography:

- 0-120 characters: short tier.
- 121-200 characters: medium tier.
- 201-300 characters: long tier.
- Beyond 300 characters: stress/clamped tier.
- Canvas renderer still measures wrapped lines through `getCanvasAnswerTextFit()` and steps type down to keep the quote panel safe.

Files changed for this follow-up:

- `src/app/globals.css`
- `public/fonts/yekan-bakh/yekan-bakh-regular.ttf`
- `public/fonts/yekan-bakh/yekan-bakh-medium.ttf`
- `public/fonts/yekan-bakh/yekan-bakh-bold.ttf`
- `public/fonts/yekan-bakh/yekan-bakh-heavy.ttf`
- `src/features/v51/insights/insight-share-export.ts`
- `src/features/v51/insights/InsightsPage.tsx`
- `src/features/v51/insights/InsightsPage.module.css`
- `tests/dynamic-insight-share-export.test.tsx`

Manual review cases:

- `/insights` Yekan Bakh typography.
- `پاسخ به این سؤال` opens the in-page composer.
- Counter starts at `0 / 280` and updates while typing.
- Input beyond 280 characters is prevented.
- Short, long 260-280 character, and 290-300 character export cases keep text within the PNG quote panel.
- Downloaded PNG remains dynamic per selected insight/provider.
