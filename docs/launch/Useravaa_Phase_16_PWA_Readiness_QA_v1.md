# Useravaa Phase 16 PWA Readiness QA v1

## Scope

Phase 16 reviewed and corrected only the public PWA manifest and root App Router metadata for the Career PWA launched at `/`. Career UI components, Phase 15 visual behavior, career data, slides, backend systems, authentication, marketplace internals, and booking/payment internals were outside scope.

## Pre-fix audit result: PASS WITH FIXES

The pre-fix implementation had valid icons, a root start URL, standalone display mode, approved colors, and no service worker risk. It still needed explicit manifest identity/scope/language fields, root safe-area viewport metadata, Apple mobile metadata, approved public copy, and removal of the internal scaffold description.

## Manifest fixes applied

- Preserved `start_url: "/"` and `display: "standalone"`.
- Added `id: "/"` and `scope: "/"`.
- Added `lang: "fa"` and `dir: "rtl"`.
- Preserved `theme_color: "#091B49"` and `background_color: "#FFFFFF"`.
- Preserved all three existing valid icon declarations and paths.
- Updated the description to approved, experience-led Career PWA positioning.

## Metadata fixes applied

- Preserved the root title `مسیرهای شغلی | Useravaa`.
- Preserved the canonical URL `https://useravaa.com`.
- Applied the approved public description:
  `مسیرهای شغلی را با تجربه‌های واقعی بررسی، ذخیره و مقایسه کن تا تصمیم شغلی روشن‌تری بگیری.`
- Replaced the internal `Production scaffold` fallback description in the root layout.
- Left rendered hero copy and all Career UI content unchanged.

## Viewport/safe-area readiness

The root layout now exports a supported Next.js `Viewport` configuration with device width, initial scale 1, `viewportFit: "cover"`, and UA Navy `themeColor`. At 390×844, the emitted viewport is `width=device-width, initial-scale=1, viewport-fit=cover`, no page-level horizontal overflow is present, and the final content card clears the fixed bottom navigation by approximately 106px.

## Apple/mobile metadata

The root layout enables Apple web-app metadata with the `Useravaa` title and default-safe status bar behavior. The existing 180×180 Apple touch icon remains configured and served from `/apple-touch-icon-180x180.png`. Runtime HTML emitted mobile-app capability, Apple title, Apple status bar style, and Apple touch icon metadata.

## Installability basics

- `/site.webmanifest` returns HTTP 200 as `application/manifest+json`.
- Root identity, start URL, scope, standalone display, Farsi/RTL settings, approved colors, and three icons are present.
- Declared icon files and paths were preserved.
- Root reload succeeds with the Career PWA title, approved metadata, and meaningful page content.

## Service worker/offline decision

No service worker, offline cache, or caching package was added. The product does not claim offline support. This avoids introducing cache-related launch risk while keeping future offline work as a separate, explicit phase.

## Files changed

- `public/site.webmanifest`
- `src/app/page.tsx`
- `src/app/layout.tsx`
- `tests/pwa-readiness.test.ts`
- `docs/launch/Useravaa_Phase_16_PWA_Readiness_QA_v1.md`

## Validation results

- `npm run lint`: PASS
- `npm run typecheck`: PASS
- `npm test -- --run tests/career-mvp-shell.test.tsx`: PASS, 49 tests
- `npm test -- --run tests/pwa-readiness.test.ts`: PASS, 3 tests
- `npm run build`: PASS, Next.js production build completed
- Browser QA at 390×844: PASS
- Root reload and meaningful-render check: PASS
- Runtime console warnings/errors: none
- Page-level horizontal overflow: none
- Manifest HTTP response and MIME type: PASS
- `git diff --check`: PASS

## Remaining risks

- Install prompts vary by browser and operating system and were not forced during QA.
- Offline operation is intentionally unsupported.
- Apple standalone behavior should receive a final physical-device smoke test before store-like distribution or a formal mobile launch.

## Phase 16 recommendation: PASS

The Career PWA now meets the scoped Phase 16 manifest, metadata, mobile viewport, safe-area, and installability-basics requirements without changing Phase 15 Career UI behavior.
