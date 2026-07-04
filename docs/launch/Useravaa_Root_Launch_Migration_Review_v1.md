# Useravaa Root Launch Migration Review v1

## 1. Task Scope

This was a review-only pass over the existing uncommitted root migration. No application behavior, feature, route, backend, Prisma, authentication, payment, booking, marketplace, advisor-profile, package, or raw-data change was made during this review.

## 2. Git Status Snapshot

- Current branch: `feature/career-ui-benchmark-audit`
- Working tree: not clean.
- Launch documents: committed in `ab22ded` and unchanged.
- Modified tracked files:
  - `next.config.ts`
  - `public/site.webmanifest`
  - `src/app/career/page.tsx`
  - `src/app/page.tsx`
  - `src/components/app-shell/AppShell.module.css`
  - `src/features/career/CareerBottomNav.tsx`
  - `src/features/career/CareerPages.module.css`
  - `src/features/career/CareerShell.module.css`
  - `src/features/career/CareerShell.tsx`
  - `src/features/career/ComparePage.tsx`
  - `src/features/career/GuidePage.tsx`
  - `src/features/career/PathsPage.tsx`
  - `src/features/career/career-data.ts`
  - `src/features/career/career-types.ts`
  - `src/features/career/career-utils.ts`
  - `tests/career-mvp-shell.test.tsx`
- Untracked paths:
  - `.playwright-cli/`
  - `public/brand/Mascot/`
  - `public/career-slides/`
  - `src/app/career/saved/`
  - `src/features/career/CareerImageCarousel.tsx`
  - `src/features/career/CareerSaveButton.tsx`
  - `src/features/career/CareerSoftIcons.tsx`
  - `src/features/career/ComparePage.module.css`
  - `src/features/career/SavedPathsPage.tsx`
  - `src/features/career/career-compare-state.ts`
  - `src/features/career/career-saved-paths.ts`
  - `src/features/career/data/career-cards-v2-with-duties.json`
  - `src/features/career/data/career-slide-manifest.ts`

Unexpected or risky items are present: generated `.playwright-cli/` files, an unreferenced mascot image, and slide assets whose commit scope needs separate review.

## 3. Root Migration File List

The following files or specific hunks are directly related to the root launch migration:

| File | Migration purpose |
| --- | --- |
| `src/app/page.tsx` | Replaces the marketplace redirect with the Career PWA root surface, supports card detail query parameters, and defines root launch metadata/canonical URL. |
| `src/app/career/page.tsx` | Redirects the former Career entry point to `/` and preserves `card` deep links. This file was already modified before migration, so only the redirect hunk is migration-specific. |
| `src/components/app-shell/AppShell.module.css` | Documents the existing `data-career-pwa` shell boundary that hides the legacy marketplace header on Career surfaces. |
| `public/site.webmanifest` | Replaces consultation-platform copy with Career PWA name and launch message. |
| `src/features/career/CareerShell.tsx` | Makes the Career header logo point to the canonical root. |
| `src/features/career/CareerBottomNav.tsx` | Makes Paths point to `/`; Compare and Saved remain under scoped Career routes. This file also contains pre-existing icon/tab changes. |
| `src/features/career/ComparePage.tsx` | Changes the empty-state return link to `/`. The rest of this large file is pre-existing Career PWA work. |
| `src/features/career/CareerSaveButton.tsx` | Uses bookmark iconography and save-for-review language. The file itself was already untracked Career PWA work. |
| `src/features/career/SavedPathsPage.tsx` | Uses bookmark iconography and canonical root/detail links. The rest of the file is pre-existing saved-path work. |
| `tests/career-mvp-shell.test.tsx` | Updates bookmark, root-detail-link, and bottom-navigation assertions. Most other test changes pre-date migration. |

## 4. Pre-existing Uncommitted File List

The baseline report shows these were already modified or untracked before the root migration:

- `next.config.ts`
- `src/app/career/page.tsx`
- `src/features/career/CareerBottomNav.tsx`
- `src/features/career/CareerPages.module.css`
- `src/features/career/CareerShell.module.css`
- `src/features/career/ComparePage.tsx`
- `src/features/career/GuidePage.tsx`
- `src/features/career/PathsPage.tsx`
- `src/features/career/career-data.ts`
- `src/features/career/career-types.ts`
- `src/features/career/career-utils.ts`
- `tests/career-mvp-shell.test.tsx`
- `src/app/career/saved/`
- `src/features/career/CareerImageCarousel.tsx`
- `src/features/career/CareerSaveButton.tsx`
- `src/features/career/CareerSoftIcons.tsx`
- `src/features/career/ComparePage.module.css`
- `src/features/career/SavedPathsPage.tsx`
- `src/features/career/career-compare-state.ts`
- `src/features/career/career-saved-paths.ts`
- `src/features/career/data/career-cards-v2-with-duties.json`
- `src/features/career/data/career-slide-manifest.ts`
- `public/career-slides/`
- `public/brand/Mascot/`
- `.playwright-cli/`

These files must not be described as a root-migration-only patch. Several contain both pre-existing feature work and small root-migration hunks.

## 5. Generated / Temporary / Risky Files

### `.playwright-cli/`

- Contains generated snapshots and a console log.
- Must not be included in an application commit.
- Remove it before staging, or add an intentional ignore rule in a separate tooling change if this workflow will recur.

### `public/brand/Mascot/`

- Contains one WebP asset.
- No source reference was found.
- Treat as unrelated/unverified. Remove it from this commit or place it in a separately reviewed asset commit after ownership and intended use are confirmed.

### `public/career-slides/`

- Contains 69 files: 10 WebP images, 58 `.gitkeep` files, and one README.
- Five UI/UX images are referenced by the current slide manifest.
- Five content-marketing images are present but not configured in the manifest.
- These are intentional product assets, not cache files, but should be reviewed and committed separately from root routing.
- Confirm whether the unconfigured content-marketing images are ready before including them.

### Other generated folders

- No additional unignored build/cache directory appears in `git status`.
- Normal Next.js build output is ignored and should remain uncommitted.

## 6. Route Behavior Review

- `/` renders the Career Path Discovery PWA.
- `/career` redirects to `/`.
- `/career?card=CARD_045` redirects to `/?card=CARD_045`, preserving the detail deep link.
- Root detail query parameters are passed into `PathsPage`.
- Compare remains at `/career/compare`.
- Saved Paths remains at `/career/saved`.
- No broken route behavior was found in source review, focused tests, production build, or the previously completed implementation QA.

## 7. Public Launch Surface Review

The root Career shell visibly exposes only:

- Paths
- Compare
- Saved Paths

The existing `data-career-pwa` boundary hides the legacy global application header on the root Career surface. Therefore the root navigation does not visibly expose:

- Marketplace
- Mentoring / consultation
- Provider profiles
- Booking
- Payment
- Chat / messages
- B2B
- Subscriptions
- Provider dashboard

The legacy routes remain in the codebase and can still be reached directly. They are not linked from the launch root surface, which preserves future business layers without deleting their internals.

## 8. Metadata and Manifest Review

- Root canonical URL is `https://useravaa.com`.
- Root title identifies the Career Paths product.
- Root description uses the approved Career PWA launch message.
- The web manifest name and description describe Career Paths rather than consultation or marketplace behavior.
- Manifest `start_url` remains `/`, now correctly pointing to the Career PWA.
- No outdated marketplace/mentoring copy remains in the effective root page metadata or manifest.
- The global layout still has generic prototype metadata for routes that do not override it; the root page correctly overrides that metadata.

## 9. Save Iconography Review

- `CareerSaveButton` uses a bookmark icon.
- The Saved Paths empty state also uses a bookmark icon.
- User-facing labels consistently frame the action as saving for further review.
- No heart/favorite framing remains in the public Career surface.
- Saved paths remain localStorage-backed and the focused tests pass.
- One non-user-facing test title still says “heart controls,” although its assertion explicitly requires the bookmark icon. This is a naming cleanup item, not a behavior defect.

## 10. Validation Results

| Command | Result | Notes |
| --- | --- | --- |
| `npm.cmd run lint` | pass | ESLint completed without reported errors or warnings. |
| `npm.cmd run typecheck` | pass | TypeScript completed with `tsc --noEmit`. |
| `npm.cmd test -- --run tests/career-mvp-shell.test.tsx` | pass | One test file passed; 43 tests passed. |
| `npm.cmd run build` | pass | Production build completed and generated the root and Career routes successfully. |

## 11. Mobile QA Result

- Previously completed implementation QA at 390×844: passed.
- Root horizontal overflow: none detected.
- Compare horizontal overflow: none detected at page level.
- Browser console warnings/errors: none detected.
- Legacy detail redirect: verified.
- A fresh browser repeat was attempted during this review, but the browser's current localhost security policy rejected navigation to the local target. No alternate browser or workaround was used. The prior successful rendered QA remains the latest completed browser result.

## 12. Commit Recommendation

Do not commit the entire working tree as one change.

Recommended grouping:

1. **Career PWA feature commit**
   - Existing hierarchy, compare, saved paths, carousel/lightbox, data normalization, styles, localStorage helpers, and focused tests.
   - Use careful hunk staging because several files also contain root-migration edits.
2. **Root launch migration commit**
   - Root page and canonical metadata.
   - `/career` redirect and deep-link preservation.
   - Career shell/root navigation link changes.
   - App-shell public-surface boundary comment.
   - Manifest launch copy.
   - Bookmark/root-link assertions that are not already included with the feature commit.
3. **Slide/assets commit**
   - Slide README, approved folder structure, configured images, and manifest.
   - Review unconfigured content-marketing images before staging.
4. **Generated/tooling cleanup**
   - Remove `.playwright-cli/` from the working tree before any application commit.
   - Exclude or separately review the unreferenced mascot asset.

## 13. Go/No-Go

### Is the root migration acceptable?

Yes. The route, public surface, metadata, manifest, redirect, deep-link, and bookmark changes are consistent with the locked launch decision. All required code validations pass.

### Is it safe to commit now?

No, not as the current combined working tree. The code is healthy, but commit scope is unsafe because root-migration hunks are mixed with substantial pre-existing Career PWA work and untracked generated/unrelated files.

### What must be removed, ignored, or separated first?

- Remove `.playwright-cli/` generated files.
- Exclude or separately review `public/brand/Mascot/`.
- Review and separate `public/career-slides/`, especially the unconfigured content-marketing images.
- Separate pre-existing Career PWA feature work from root-migration hunks.
- Optionally rename the stale “heart controls” test title before final staging, without changing its bookmark assertion.

### Exact recommended next action

Clean generated QA artifacts, confirm asset scope, then use deliberate hunk staging to prepare a Career PWA feature commit and a separate root launch migration commit. Review each staged diff before committing. Do not stage the entire working tree at once.
