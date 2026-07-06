# Useravaa Phase 17 SEO / Share QA v1

## Scope

Phase 17 corrected SEO and social-sharing readiness for the Career PWA launched at `/`. The work was limited to root metadata, social preview metadata and assets, sitemap generation, robots/indexing safety, the legacy `/career` redirect, focused tests, and this QA record. Career UI, raw career data, PWA behavior, backend systems, authentication, marketplace internals, booking/payment internals, and the user-managed slide folder were outside scope.

## Pre-fix audit result: FAIL

The root title, approved description, canonical URL, language direction, and icon metadata were correct. The launch was not SEO/share ready because `metadataBase`, Open Graph metadata, Twitter/X metadata, a share image, and a sitemap were missing. Production robots could also allow every route, and `/career` used a temporary redirect.

## Metadata fixes applied

- Added `metadataBase: new URL("https://useravaa.com")` to the root layout.
- Preserved the approved root title and canonical URL.
- Preserved the exact approved public description.
- Added a default `noindex, nofollow` posture in the root layout for non-launch routes.
- Made root indexing conditional on the existing production indexing flag.
- Preserved Phase 16 manifest, viewport, theme color, and Apple mobile metadata.

## Open Graph fixes applied

The root page now emits Open Graph title, approved description, canonical URL, `Useravaa` site name, `website` type, `fa_IR` locale, and the approved 1200×630 share image with Persian alt text.

## Twitter/X fixes applied

The root page now emits a `summary_large_image` card with the approved title, description, image, and Persian alt text.

## Share image details

- PNG: `public/og/useravaa-career-share.png`
- Deterministic SVG source: `public/og/useravaa-career-share.svg`
- Dimensions: 1200×630
- Alt text: `تصویر اشتراک‌گذاری یوزاوا برای بررسی، ذخیره و مقایسه مسیرهای شغلی با تجربه‌های واقعی`
- Visual system: white/light neutral background, UA Navy headline, UA Blue path accent, UA Teal progress/highlight accent, and one controlled Insight Yellow cue.
- The image contains no stock imagery, guarantees, hype, job-board framing, education framing, coaching framing, or generic mentoring framing.

The asset uses a deterministic SVG-to-PNG workflow with existing bundled Sharp tooling. No image dependency or package file was added.

## Sitemap decision

`src/app/sitemap.ts` now publishes only `https://useravaa.com`. Legacy, private, transactional, admin, API, marketplace, mentoring, profile, request, conversation, checkout, and wallet routes are excluded.

## Robots/indexing decision

- Non-production and production-without-opt-in continue to disallow all crawling.
- Production indexing still requires the existing `USERAVAA_SITE_INDEXING=1` flag.
- When production indexing is enabled, the root is allowed while explicit legacy, private, transactional, operational, admin, and API route prefixes are disallowed.
- Non-root routes inherit a default `noindex, nofollow` posture.
- When indexing is enabled, robots advertises `https://useravaa.com/sitemap.xml`; the sitemap route now exists.

## Legacy redirect decision

`/career` now uses Next.js `permanentRedirect`, producing permanent redirect behavior. Existing `card` query values remain encoded and preserved as `/?card=...`.

## Query-state SEO decision

Phase 17 intentionally keeps root-only SEO and social metadata. `/?card=...` states continue to canonicalize and share as `/`. Individual career-path share metadata is deferred to a later SEO enhancement and no new routes were created.

## Files changed

- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/app/robots.ts`
- `src/app/sitemap.ts`
- `src/app/career/page.tsx`
- `src/lib/deployment/safety.ts`
- `public/og/useravaa-career-share.svg`
- `public/og/useravaa-career-share.png`
- `tests/seo-share-readiness.test.ts`
- `docs/launch/Useravaa_Phase_17_SEO_Share_QA_v1.md`

## Validation results

- `npm run lint`: PASS
- `npm run typecheck`: PASS
- `npm test -- --run tests/career-mvp-shell.test.tsx`: PASS, 49 tests
- `npm test -- --run tests/pwa-readiness.test.ts`: PASS, 3 tests
- `npm test -- --run tests/seo-share-readiness.test.ts`: PASS, 6 tests
- `npm test -- --run tests/deployment-safety-baseline.test.ts`: PASS, 10 tests
- `npm run build`: PASS; `/sitemap.xml` is present in the production route output
- PNG signature and 1200×630 dimensions: PASS
- Visual inspection of share asset: PASS
- `git diff --check`: PASS before report creation and repeated after finalization

## Remaining risks

- The in-app browser declined localhost automation during final rendered-tag verification, so production-like HTML inspection should be repeated manually or in deployment preview before public launch.
- Social crawler cache behavior and real LinkedIn/X/Telegram preview rendering require deployed-URL smoke tests.
- Individual career-path query states do not yet have unique share metadata by design.
- Production indexing remains intentionally dependent on correct deployment environment flags.

## Phase 17 recommendation: PASS

The scoped SEO/share blockers are fixed and covered by source, asset, safety-policy, and production-build validation. A deployed-preview social card smoke test remains recommended before enabling public indexing.
