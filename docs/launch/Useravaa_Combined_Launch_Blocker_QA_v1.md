# Useravaa Combined Launch Blocker QA v1

## Scope

This audit reviewed launch-blocking risks for the Career PWA at `/` before Preview Deploy. It was an audit-only pass covering the committed Phase 15, Phase 16, and Phase 17 state. No redesign, feature work, analytics implementation, or legal-document writing was included.

## Combined Phases Covered

- Phase 18: Minimal Privacy / Trust
- Phase 20: Accessibility blockers
- Phase 21: Technical hardening criticals
- Phase 22: Compact QA matrix

## Overall Recommendation

**PASS**

No launch blocker was found. Preview Deploy can start immediately.

## Privacy / Trust Findings

- No sensitive or personal user data is collected by the public Career PWA flow.
- Search is the only visible user input and does not collect personal data.
- Saved and recently viewed paths store career identifiers locally in the browser only.
- No hiring, success, life-transformation, perfect-certainty, or fast-success guarantee was found.
- Public messaging remains experience-led, decision-oriented, clear, and non-exaggerated.
- Useravaa is not presented as a job board, education platform, coaching service, or generic mentoring platform.
- Hidden, private, legacy, transactional, administrative, and API routes are not exposed as root launch navigation surfaces and remain excluded from public indexing behavior.

## Accessibility Findings

- Core root flows use native links, buttons, and a search input.
- Audited clickable controls have accessible names.
- Main and bottom navigation expose clear accessible labels.
- Domain, category, path, save, related-path, and compare controls remain usable native controls.
- No duplicate IDs, focus trap, hidden focusable control, invisible overlay, or pointer-event blocker was found.
- Focus-visible styling is present for core controls.
- A skip link targets the main content.
- Physical pointer interaction passed on desktop and mobile.
- Browser automation could not reliably simulate sequential Tab traversal; semantic structure and focus styling were inspected directly and no blocker was found.
- No obvious blocking contrast issue was found against the approved Career PWA palette.

## Technical Hardening Findings

- Production build passed.
- Root `/` loads and reloads successfully.
- `/?card=CARD_003` reloads into the expected detail state.
- `/career?card=CARD_003` returns a permanent `308` redirect and preserves the query as `/?card=CARD_003`.
- Domain, category, path, detail, save, Saved Paths, related-path, and compare flows passed live browser checks.
- Compare add/remove behavior and the RTL comparison table passed.
- Empty-state behavior remains covered by focused tests without runtime crashes.
- No hydration error or browser console error was observed.
- No service worker or cache behavior was added, so no unsupported offline behavior is claimed.
- PWA manifest, robots, and sitemap endpoints return successfully.
- Local non-production robots behavior remains closed to indexing; production behavior remains covered by deployment-safety tests.
- No accidental server/private module import into Career client components was found.
- No environment-variable issue blocked the production build.

## Compact QA Findings

The following viewports were reviewed:

- Desktop around 1440px: PASS
- Laptop around 1024px: PASS
- Mobile 390×844: PASS

The following flows and surfaces passed:

- Root load and reload
- Domain card click
- Category card click
- Path and detail opening
- Save path and Saved Paths page
- Compare add/remove and comparison table
- Related-path navigation
- Back and navigation behavior
- Query-state reload
- Permanent legacy `/career` redirect with query preservation
- Share metadata emission
- PWA manifest delivery
- Sitemap delivery
- Safe robots behavior

No page-level horizontal overflow was found at the audited viewports. On mobile, comparison-table horizontal scrolling remains contained within the table viewport, and final page controls remain clear of the floating bottom navigation.

## Regression Findings

- Phase 15 visual, copy, palette, mascot, card clickability, and hidden-slide behavior remain unchanged.
- Phase 16 PWA readiness remains intact.
- Phase 17 SEO, social sharing, canonical, redirect, robots, and sitemap behavior remain intact.
- The root launch still exposes only Paths, Compare, and Saved Paths navigation.
- No raw career JSON was edited.
- No backend, Prisma, auth, marketplace, booking, payment, or other forbidden system was changed.
- The user-managed slide folder remains untouched and untracked.

## Validation Results

- `npm run lint`: PASS
- `npm run typecheck`: PASS
- `npm test -- --run tests/career-mvp-shell.test.tsx`: PASS — 49 tests
- `npm test -- --run tests/pwa-readiness.test.ts`: PASS — 3 tests
- `npm test -- --run tests/seo-share-readiness.test.ts`: PASS — 6 tests
- Deployment-safety focused tests: PASS — 10 tests
- `npm run build`: PASS
- `git diff --check`: PASS during the audit
- Browser console errors: none observed
- Page-level horizontal overflow: none observed

## Optional Later Cleanup

Next.js emits a non-blocking development warning because the document uses smooth scrolling without `data-scroll-behavior="smooth"` on the `<html>` element. This can be cleaned up later in `src/app/layout.tsx`; it is not a launch blocker and was not changed during this audit.

## Required Fixes Before Preview Deploy

None.

## Preview Deploy Decision

Preview Deploy can start immediately.

## Change Confirmation

- No application files were changed for this report.
- No UI, CSS, metadata, or test file was changed.
- No raw JSON or forbidden system was changed.
- The user-managed folder `public/career-slides/تحقیقات-بازار-و-بینش-بازار/` remains untouched and untracked.
