# Useravaa Root Launch Baseline QA v1

## Task Scope

This report records the project baseline before the root launch migration. The task was inspection and validation only. No application behavior, source code, route, backend, Prisma, authentication, payment, booking, marketplace, advisor-profile, or package configuration changes were made.

## Git State

- Current branch: `feature/career-ui-benchmark-audit`
- Working tree: not clean.
- `docs/launch/Useravaa_Launch_Decision_v1.md`: present and uncommitted inside the untracked `docs/launch/` directory.
- Existing modified tracked files include `next.config.ts`, multiple Career PWA components and styles, `src/app/career/page.tsx`, and `tests/career-mvp-shell.test.tsx`.
- Existing untracked files include Career PWA components, `/career/saved`, career slide assets and manifest data, a mascot asset, and `.playwright-cli/` QA artifacts.
- The working tree contains substantially more than the launch-decision document. Those changes pre-date this baseline report and were not modified or cleaned up in this task.

## Current Route Baseline

- `/`: `src/app/page.tsx` immediately redirects to `/discover`.
- `/discover`: renders the existing experience-provider discovery/consultation marketplace surface.
- `/career`: renders `PathsPage` inside `CareerShell` and is the current Career Path Discovery PWA entry point.
- `/career/compare`: exists and renders `ComparePage`.
- `/career/guide`: exists and renders `GuidePage`, although it is not part of the current Career PWA bottom navigation.
- `/career/saved`: exists and renders `SavedPathsPage`.
- Current Career PWA bottom navigation contains Paths, Compare, and Saved Paths.
- The root route currently shows another product surface rather than the launch-approved Career Path Discovery PWA.
- No root canonical URL implementation was found.
- The in-app browser was discoverable, but navigation timed out during this baseline run. Rendered-route conclusions therefore rely on route source, component source, and the successful production route build.

## Public Exposure Baseline

No public footer component or application sitemap file was found. `robots.ts` can advertise an environment-provided sitemap URL, but no local sitemap route is present.

| Surface | Baseline exposure |
| --- | --- |
| Mentoring / consultation | Exposed. Root redirects to the experience/consultation discovery product. |
| Advisor / experience-provider profiles | Exposed. Discovery cards link to public provider profile routes. |
| Booking | Exposed. Discovery cards link to the request/session creation flow. |
| Payment | Not linked directly from the root header, but checkout/payment routes exist downstream of the booking flow. |
| Chat / messages | Conditionally exposed. Authenticated global navigation and notifications link to conversations/session flows. |
| Marketplace | Exposed. The root destination is currently the experience-provider marketplace. |
| B2B | No public root, header, or discovery link found. Administrative/business routes still exist in the codebase. |
| Subscriptions | No public root, header, or discovery link found. |
| Provider dashboard | Conditionally exposed through authenticated profile/account navigation and provider profile dashboard routes. |

Additional exposure findings:

- Guest global navigation exposes experience discovery and insights.
- Authenticated global navigation additionally exposes sessions/conversations.
- The authenticated account menu exposes profile, saved items, wallet, settings, and support.
- Root metadata still describes the older prototype, and the web manifest describes an experience-based consultation platform.

## Career PWA Baseline

| Capability | Status | Evidence |
| --- | --- | --- |
| Paths | present | `/career` renders the hierarchical paths explorer. |
| Compare | present | `/career/compare` and the compare selection/table implementation exist. |
| Guide or saved tab | present | Saved Paths is the third bottom tab; the guide route also exists separately. |
| Saved paths | present | `/career/saved` and localStorage-backed saved-path state exist. |
| Search | present | Global hierarchy search is implemented in `PathsPage`. |
| Path details | present | Detail view includes duties, skills, tools, and soft skills. |
| Related paths | present | Related-path selection and UI are implemented. |
| Slides | present | Manifest-driven carousel exists and returns no UI when a path has no slides. |
| PWA behavior | unclear | A global manifest with standalone display and root start URL exists, but no service worker, install prompt handling, or Career-specific install verification was found. The manifest copy also describes the previous consultation product. |

## Code Readability Requirement for Later Phases

All future implementation code must be beginner-readable, intentionally commented where logic is not obvious, and structured with descriptive names and small readable helpers.

Comments must explain routing decisions, public-surface hiding, localStorage behavior, compare limits, RTL/LTR handling, slide fallback behavior, and analytics behavior when those are implemented.

Comments should explain why non-obvious logic exists, not merely restate what a line does. Avoid clever or compressed code and unexplained abstractions. Do not over-comment trivial JSX, trivial CSS, or obvious assignments. Implementation comments must be written in English.

## Validation Results

| Command | Result | Notes |
| --- | --- | --- |
| `npm.cmd run lint` | pass | ESLint completed with no reported errors or warnings. |
| `npm.cmd run typecheck` | pass | TypeScript completed with `tsc --noEmit`. No route type regeneration was needed. |
| `npm.cmd test -- --run tests/career-mvp-shell.test.tsx` | pass | One focused test file passed; 43 tests passed. |
| `npm.cmd run build` | pass | Next.js production build completed and generated all routes, including `/`, `/career`, `/career/compare`, `/career/guide`, and `/career/saved`. |

All required validation commands passed.

## Known Issues Before Root Migration

1. `/` redirects to the wrong launch product at `/discover`.
2. The current public root exposes experience-provider discovery, provider profiles, and booking-oriented actions.
3. Authenticated global navigation exposes conversations, profile/dashboard, wallet, and related future-business surfaces.
4. Root metadata and manifest copy describe the previous consultation product.
5. No canonical root URL implementation was found.
6. The global manifest starts at `/`, but `/` currently redirects to the marketplace product.
7. Save UI still uses heart iconography in `CareerSaveButton` and the Saved Paths empty state, which conflicts with the locked bookmark/save decision.
8. The working tree is broadly dirty and includes uncommitted source, tests, assets, launch documentation, and QA artifacts. Scope ownership must be reviewed before migration changes are isolated.
9. `/career/guide` still exists while the current bottom navigation uses Saved Paths instead of Guide.
10. Complete PWA installability is unverified; no service worker or install-flow implementation was found.
11. The in-app browser did not complete route navigation during this baseline run, so interactive root rendering and console state still need confirmation before launch.

## Root Migration Readiness

### Is the project ready for the next phase?

Yes, with constraints. Static validation is healthy and the Career PWA feature set is present, but the root surface is not launch-ready until routing and public exposure are changed.

### What must be fixed before moving the Career PWA to `/`?

- Review and preserve the current uncommitted working tree so migration work does not overwrite unrelated changes.
- Decide whether `/career` becomes a redirect or a maintained alias.
- Define the root shell behavior so future marketplace and account surfaces are not exposed from the public launch product.
- Replace heart-based save presentation with bookmark/save presentation.
- Plan root canonical metadata and Career PWA metadata/manifest updates.
- Add route and public-surface regression coverage for the launch decision.

### What can be handled during the root migration phase?

- Render the Career PWA at `/`.
- Redirect or alias `/career`.
- Update Career PWA internal links and bottom-navigation paths for the canonical root structure.
- Hide the global marketplace/account navigation from the public launch surface without deleting future business layers.
- Update metadata, canonical URL, manifest copy, and manifest start URL behavior.
- Preserve the safe no-slides fallback.
- Add beginner-readable comments around routing, hidden public surfaces, localStorage, compare limits, RTL/LTR behavior, and slide fallback logic.
- Run rendered mobile, console, hydration, navigation, save, and compare QA after implementation.

## Recommended Next Phase

Move Career PWA from `/career` to `/` and hide public exposure of future mentoring/marketplace layers.
