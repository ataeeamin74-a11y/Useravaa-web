# Useravaa Clickability Audit Fix v1

## Task Scope

Audit the reported `localhost` versus `127.0.0.1` interaction difference, preserve the approved Career Discovery visuals, correct card count labels and accent contrast, and avoid backend, route, package, raw-data, compare-business-logic, or saved-storage changes.

## Approved Visuals Preserved

The two-line hero, exact supporting copy, Yellow hero highlight, White cards, Soft BG, colorful domain accents, three-item bottom navigation, and existing committed mascot asset are preserved.

## Host-Specific QA Result

- `http://localhost:3000/`: the user reports working card interaction. The in-app browser reached this origin, but its automation connection timed out before the complete interaction matrix could be captured.
- `http://127.0.0.1:3000/`: the in-app browser explicitly rejected page interaction under its host safety policy. The application was not allowed to receive the test clicks.

## localhost vs 127.0.0.1 Behavior

No application source branches on hostname, host, origin, `localhost`, or `127.0.0.1`. No Career PWA service worker is registered. Saved and recently viewed state is origin-scoped through `localStorage`, but that state is not read by root domain selection and cannot disable those buttons.

## Interaction Surfaces Reviewed

Paths hierarchy cards, search, hero/mascot layering, breadcrumbs, back/reset, detail save and related paths, saved cards, compare selection/table controls, Career shell, bottom navigation, root AppShell integration, manifest, and slide fallback were reviewed.

## Actual Clickability Issues Found

No host-dependent application interaction defect was found. Domain, category, and path cards are native `button` elements with their selection callbacks on the complete card. Their icon, title, white-space, and arrow regions are descendants of the same button. Decorative stepper arrows and the mascot do not accept pointer events.

## Root Cause

The reproducible `127.0.0.1` failure is caused by the in-app browser host safety policy blocking automation for that origin before the page receives pointer or keyboard events. This is external to the Career PWA. Adding hostname redirects, duplicated event handlers, or service-worker workarounds would not fix that policy and would introduce unnecessary production risk.

## Fixes Applied

- Preserved native full-card buttons and added stable attributes for browser QA.
- Kept category and path cards as complete native buttons.
- Kept search as a native search input.
- Kept the mascot decorative with `pointer-events: none`.
- Added focused regression coverage for full-card structure and selection callbacks.

## Count Label Display Fix

Root domain and category cards now show only a Persian-formatted count followed by `مسیر شغلی`. They no longer show category counts or the shortened standalone `مسیر` label. Compare count summaries also use `مسیر شغلی`.

## Palette / Accent Corrections

Data & AI remains UA Blue. The customer domain (`ارتباط با مشتری`) is explicitly UA Teal instead of the rejected customer-operations blue. Persimmon icon blocks use White foreground/icons; Yellow uses UA Navy.

## CSS Layering / pointer-events Review

No invisible slide layer is rendered because the approved slide manifest is empty. The domain grid and cards remain pointer-active. Hero search has an interactive layer above decorative content. The mascot is visible but cannot intercept clicks. Bottom-nav spacing remains reserved by the shell.

## Automated Tests Added/Updated

Focused tests cover native domain/category/path buttons, full-card child regions, callbacks, exact hero/domain copy, search markup, mascot visibility/pointer behavior, Yellow/Persimmon accents, Persimmon contrast, Data & AI/customer accent assignments, count labels, bottom-nav destinations, save toggling, and hidden carousel behavior.

## Browser QA Result or Reason Unavailable

The browser reached `localhost`, but the automation connection reset while collecting the full interaction state. The browser explicitly prohibited `127.0.0.1` interaction under its host safety policy. No alternate browser or policy bypass was used.

## Production Impact Assessment

The blocker is specific to the in-app browser's local-host safety policy, not Useravaa routing, hydration, storage, or event handling. It does not apply to `https://useravaa.com`. Production behavior is unchanged by the host audit.

## Validation Results

- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm test -- --run tests/career-mvp-shell.test.tsx`: passed, 49 of 49 tests.
- `npm run build`: passed.
- `git diff --check`: passed.

## Remaining Risks

The complete two-host pointer/keyboard matrix still requires manual browser QA outside the blocked in-app automation context. The newly observed untracked slide folder was not modified.

## Recommendation for Commit / Re-QA

Do not commit until manual QA confirms the full interaction matrix on `localhost` and, in a browser without the local host restriction, `127.0.0.1`. Re-run mobile and desktop visual QA after confirming the mascot scale.
