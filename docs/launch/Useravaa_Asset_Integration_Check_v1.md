# Useravaa Asset Integration Check v1

## 1. Task Scope

This check covers the verified career slide folders under `public/career-slides/` and the mascot asset under `public/brand/Mascot/`. It does not change raw career JSON, backend code, Prisma, authentication, payments, booking, marketplace logic, package files, or unrelated product flows.

## 2. Career Slide Asset Inventory

Two career folders contain complete, coherent WebP slide sets:

| Career folder | Verified files | Status |
| --- | --- | --- |
| `بازاریابی-محتوا` | `01.webp` through `05.webp` | Integrated in this task |
| `طراحی-محصول-و-تجربه-کاربری-ui-ux` | `01.webp` through `05.webp` | Existing manifest integration retained and re-verified |

All ten referenced files exist on disk and follow the numeric ordering convention. Of the 58 total career folders, the remaining 56 contain only `.gitkeep`; they are intentionally not added to the manifest.

## 3. Slide Manifest Review

`src/features/career/data/career-slide-manifest.ts` now contains five ordered `{ src, alt }` entries for each verified folder. The new content-marketing entries use the exact existing folder name and meaningful Persian alt text.

The manifest remains the only source that enables a carousel. A career path without a verified manifest entry receives an empty slide array.

## 4. Slide Integration Changes

- Added the five verified content-marketing slides to the manifest.
- Retained the five previously configured UI/UX slides.
- Preserved the 15-slide component cap, horizontal snapping, counter, pagination controls, fullscreen viewer, and accessibility behavior.
- Preserved eager loading for the first slide and lazy loading for every later slide.
- Added a short code comment explaining that missing slides are a supported launch state.
- Confirmed that an unlisted career path renders no carousel, empty shell, placeholder, or coming-soon message.

## 5. Mascot Asset Inventory

The available mascot asset is:

`public/brand/Mascot/useravaa-mascot-magnifier-eye.webp`

It is a transparent, brand-blue discovery mascot holding a magnifier. Its subject, palette, and silhouette are suitable for the career discovery entry point.

## 6. Mascot Integration Decision

The mascot is integrated as a restrained decorative accent in the initial Paths hero only. It uses Next.js `Image`, an empty alt value, and `aria-hidden="true"`, so it does not add duplicate spoken content. Responsive sizing keeps it secondary to the headline and search experience.

## 7. Files Changed

Files changed specifically for this asset integration:

- `src/features/career/data/career-slide-manifest.ts`
- `src/features/career/CareerImageCarousel.tsx`
- `src/features/career/PathsPage.tsx`
- `src/features/career/CareerPages.module.css`
- `tests/career-mvp-shell.test.tsx`
- `docs/launch/Useravaa_Asset_Integration_Check_v1.md`

The user-supplied image files were inspected but not moved, renamed, rewritten, or replaced.

## 8. Validation Results

- Typecheck: passed.
- Lint: passed.
- Focused career tests: passed, 43 of 43.
- Production build: passed.
- `git diff --check`: passed; existing line-ending notices are informational only.
- Manifest file check: all 10 configured slide paths exist.
- Mobile browser QA at 390 x 844: passed with no page-level horizontal overflow.
- Content-marketing carousel: five slides, `1 / 5` counter, first image eager and remaining images lazy.
- UI/UX carousel: five slides and `1 / 5` counter.
- Unlisted-path fallback: no carousel and no placeholder content.
- Browser console: no errors observed in the inspected flows.
- Legacy `/career` entry: resolves to the root career experience at `/`.

## 9. Remaining Unstaged Assets

- The 56 empty career folders remain unmanifested until verified images are supplied. All 58 folders retain their `.gitkeep` files.
- No complete slide folder was omitted: both folders that currently contain WebP images are configured.
- Existing unrelated dirty-worktree files and generated `.playwright-cli/` artifacts are outside this asset task and should not be swept into an asset-only commit.

## 10. Commit Recommendation

Do not commit yet. Review the rendered mascot placement and both slide sets first. When approved, stage the asset integration files deliberately rather than using `git add .`, because the working tree contains broader, pre-existing launch work.
