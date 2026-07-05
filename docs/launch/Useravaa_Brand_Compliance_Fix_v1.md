# Useravaa Brand Compliance Fix v1

## Task Scope

Apply the corrected Career PWA brand and copy direction without changing routes, raw career data, backend systems, Prisma, authentication, packages, marketplace internals, advisor profiles, compare logic, saved-path logic, or booking/payment internals. The implementation remains uncommitted for review.

## Issues Fixed

- Restored the approved two-line Career Discovery headline and its Yellow phrase highlight.
- Kept the committed mascot on the right at tablet/desktop sizes while allowing the mobile headline to use the full width.
- Restored the approved curiosity-led first domain-section title and supporting copy.
- Restored the colorful Career Discovery palette across root domain-card accents.
- Made Yellow and Persimmon visibly present in the root experience, rather than merely documenting them or limiting them to Level 4.
- Restored and hardened full-card domain selection with an explicit native-button interaction contract and pointer-layer safeguards.
- Kept both non-compliant slide sets hidden while preserving the complete carousel system.
- Preserved root routing, hierarchy, career details, related paths, save, compare, and the three-item bottom navigation.

## Color Changes

- UA Navy `#091B49` remains the headline and primary-text color.
- UA Blue `#245FFD` remains the main CTA, active-action, and primary interactive color.
- UA Teal `#01C3B9` remains a structural, selected, and non-CTA emphasis color.
- White `#FFFFFF` and Soft BG `#F8FAFC` remain the surface colors.
- Insight Yellow `#FFC801` is visible in the hero phrase highlight, rotating domain-card accents, and essential technical-skill chips, always with UA Navy text on Yellow.
- Persimmon `#F86E4B` is visible in rotating domain-card accents and essential soft-skill chips.
- Connection Blue `#0974C5` is preserved as the existing controlled tool/product token for essential and supporting tool labels; it is not used for a main CTA.
- Yellow and Persimmon remain excluded from CTA, navigation state, large surfaces, and promotional chrome.
- No new color or gradient was introduced.

The authoritative rules are documented in `docs/launch/Useravaa_Career_Palette_Lock_v1.md`.

## Slide Exposure Decision

`careerSlideManifest` remains intentionally empty until brand-approved artwork exists. The slide type, path validation, slug generation, 15-slide limit, carousel, fullscreen viewer, and empty fallback remain implemented.

Both paths that previously exposed slides receive an empty array. `CareerImageCarousel` returns `null`, so detail pages show no broken image, empty carousel shell, placeholder, or coming-soon message. All ten WebP files remain untouched for later brand review.

## Mascot Decision

The existing committed mascot is restored in the visible Paths hero. It sits on the physical right side of the headline block, is decorative (`alt=""` and `aria-hidden`), and has `pointer-events: none` so it cannot block interaction.

The mascot is 78px wide on mobile and 168px from the 620px breakpoint. It remains visible in a dedicated right-side grid column at every viewport, with a shrinking text column and contained image sizing to avoid search overlap and horizontal overflow.

## Domain Card Clickability

Each domain card remains a native `button` and the full card surface invokes the domain-selection callback. The card now has a stable `data-career-domain-card` marker, explicit pointer/touch behavior, visible pointer cursor, and a tested full-card handler. Decorative mascot and card-arrow layers cannot intercept input; the mascot has `pointer-events: none`, and the domain grid/card explicitly remain pointer-active.

The selection logic itself was not changed: selecting a domain still uses the existing hierarchy resolver and advances to the appropriate next meaningful level. Native button keyboard activation and existing focus-visible styling remain intact.

Host comparison found no hostname branch, origin check, service worker, redirect, or app overlay that changes Career card behavior. The in-app browser itself blocks automation against `127.0.0.1` under its host safety policy; this happens outside the application and does not apply to `useravaa.com`. Clickability remains a release blocker and both local hosts must be checked in launch QA whenever the test browser permits them.

## Count Label Display

Root domain and category cards show only the Persian-formatted number of `مسیر شغلی`. Category counts and the shortened standalone `مسیر` label were removed from card metadata. The exact approved domain-section supporting copy remains unchanged even though it describes choosing a domain to see its categories.

## Mascot and Accent Follow-up

The mascot remains visible at every breakpoint: 78px on mobile and 168px from 620px upward. It stays in a dedicated right-side grid column and has `pointer-events: none`.

Data & AI keeps UA Blue. `ارتباط با مشتری` now uses UA Teal instead of the rejected customer-operations blue. Persimmon domain accents use White foreground/icons; Yellow continues to use UA Navy.

## Messaging Changes

Hero headline:

`مسیر مناسب خودت را`

`قدم‌به‌قدم پیدا کن`

The phrase `مسیر مناسب خودت` uses the controlled Insight Yellow highlight with UA Navy text.

Hero supporting copy:

`ده‌ها هزار آگهی شغلی بررسی شده تا تو مسیرها را روشن‌تر ببینی و مسیر شغلی بهتری انتخاب کنی.`

The rejected supporting sentence was removed.

First domain-section title:

`حوزه‌ای که کنجکاوت می‌کند`

First domain-section supporting copy:

`یکی از ۱۰ حوزه واقعی را انتخاب کن تا دسته‌های داخلش را ببینی.`

Root metadata and the web manifest retain the calm experience-led direction established in the brand fix. No guarantee, hype, success promise, perfect-path claim, education framing, or generic mentoring CTA was introduced.

## Files Changed

- `public/site.webmanifest`
- `src/app/page.tsx`
- `src/features/career/CareerPages.module.css`
- `src/features/career/CareerShell.module.css`
- `src/features/career/PathsPage.tsx`
- `src/features/career/data/career-slide-manifest.ts`
- `tests/career-mvp-shell.test.tsx`
- `docs/launch/Useravaa_Career_Palette_Lock_v1.md`
- `docs/launch/Useravaa_Brand_Compliance_Fix_v1.md`

No raw career JSON, slide image, mascot image, backend, Prisma, auth, package, marketplace, advisor, booking, or payment file changed.

## Validation Results

- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm test -- --run tests/career-mvp-shell.test.tsx`: passed, 49 of 49 tests.
- `npm run build`: passed.
- `git diff --check`: passed.
- Focused tests confirm the exact two-line hero copy, exact domain copy, Yellow and Persimmon domain-accent markers, full-card domain selection callback, preserved slide infrastructure, and hidden carousel for the former UI/UX slide path.
- Static palette review confirms the root hero and domain cards visibly use controlled Yellow and Persimmon, while Level 4 retains the approved technical/tool/soft-skill treatments.
- The browser reached `localhost`, but its automation connection timed out before interaction capture. It explicitly blocked `127.0.0.1` under its host safety policy. No alternate browser or workaround was used.

## Remaining Brand Risks

- The old slide files remain under `public/` but are not referenced by the launch manifest. They must not be re-enabled without brand approval.
- The mascot remains in the hero from the 620px breakpoint upward; a fresh rendered review should confirm that it supports rather than dominates the headline.
- Fresh 390x844 QA should confirm the mascot is hidden, headline rhythm, search separation, absence of page-level horizontal overflow, and no console warnings/errors.

## Recommendation for Re-running Brand Compliance QA

Re-run Brand Compliance QA using `Useravaa_Career_Palette_Lock_v1.md` as the palette source of truth. Yellow and Persimmon must be evaluated as allowed controlled accents, not blanket violations.
