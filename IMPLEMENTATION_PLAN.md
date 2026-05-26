# Implementation Plan

## Purpose

Rebuild the approved V51 Useravaa HTML prototype as production-ready Next.js code without redesigning the product. The production app must preserve the prototype's visible UI, Persian copy, RTL behavior, navigation hierarchy, profile builder behavior, wallet and settlement behavior, notification behavior, pricing labels, states, and interaction model.

## Source Of Truth

The handoff package is organized under `docs/handoff/`:

- `docs/handoff/00_README.md` through `docs/handoff/14_KNOWN_GAPS.md`
- `docs/handoff/05_STATE_MACHINES/`
- `docs/handoff/06_DATA_MODEL/`
- `docs/handoff/07_API_CONTRACTS/`
- `docs/handoff/08_FRONTEND_CONTRACTS/`
- `docs/handoff/09_BUSINESS_RULES/`
- `docs/handoff/10_ASSETS/`
- `docs/handoff/11_DESIGN_SYSTEM/`
- `docs/handoff/12_TEST_CASES/`
- `docs/handoff/13_ENV_DEPLOYMENT/`

Source-of-truth precedence:

1. Handoff files for production logic, data model, API, validation, permissions, state machines, business rules, tests, and deployment boundaries.
2. `prototype/index.html`, `prototype/styles.css`, and `prototype/script.js` for approved UI, layout, copy, page hierarchy, buttons, states, flows, RTL behavior, and product interactions.
3. Prototype behavior for any UI detail not contradicted by the handoff.

The prototype files are references only and should not be modified or copied as the production architecture.

## V51 Preservation Strategy

The implementation will first inventory the prototype by page, component, copy, state, and interaction, then rebuild the same surface as typed Next.js components. The goal is not to improve or simplify the prototype. It is to preserve it while replacing prototype-only globals, mock data, inline handlers, duplicated legacy overrides, and DOM string rendering with production component boundaries, typed data, validation, API calls, and state-machine guarded mutations.

Preservation rules:

- Keep the V51 header layout: brand on the right, centered main nav, utilities on the left.
- Keep main nav labels: `کشف تجربه‌ها`, `گفت‌وگوها`, `پروفایل`.
- Keep utility labels: `راهنما`, `اعلان‌ها`, `کیف پول`.
- Keep account settings accessible from profile area, not top-level navigation.
- Keep `/discover` as the first product surface; no homepage or landing page.
- Keep route/page names and CTA wording from the prototype and handoff.
- Keep Persian labels, Persian numerals, Toman display, Shamsi/Jalali display, RTL alignment, and LTR handling for email, phone, and IBAN.
- Keep the V51 visual tokens: navy, blue, teal, soft blue, soft teal, line colors, shadows, rounded panels, sticky header, drawer filter behavior, and compact card density.
- Keep the profile builder layout: main form column, sticky preview column, avatar upload/replace/remove, category chips, company tag input, language chips, professional summary counter, pricing cap note, free-help toggle, draft save, preview modal, submit for review.
- Keep conversation scheduling as request-first, then provider proposes 3 to 6 chip-selected Jalali date/time options, then seeker selects one, then checkout/finalization.
- Keep wallet cards, top-up panel behavior, transaction filtering, payout request behavior, and settlement-info modal behavior.
- Keep notification badge, unread/read visual states, and deep-link behavior.

Changes from the prototype are allowed only where required by the handoff:

- Persist state through Prisma/PostgreSQL instead of prototype globals.
- Enforce permissions, auth, validation, state transitions, and pricing caps server-side.
- Hide non-active profiles from discovery and public request flow.
- Block payout creation until settlement info is registered.
- Treat unknown provider selections, payment providers, upload storage, auth provider, payout timing, refund/cancellation rules, and KYC as known gaps rather than inventing behavior.

## Route Mapping

Production routes will follow `02_ROUTES_MAP.csv` and preserve the prototype section hierarchy.

| Production route | Prototype source | Notes |
|---|---|---|
| `/discover` | `section#discover` | Search, filters, sort, loading, error, empty, active chips, mobile filter drawer, profile cards. |
| `/guide` | `section#how` | Persian guide page with V51 explanatory content and CTAs. |
| `/profiles/[profileId]` | `section#profile` plus `renderProfile()` | Public experience profile, request CTAs, save/follow/report behavior. No public availability calendar. |
| `/requests/new` | `section#request` | Duration choice, optional note, request summary, submit. |
| `/conversations` | `section#conversations` | Sent/received tabs and grouped states. |
| `/conversations/[conversationId]` | `section#conversationDetail` | State-specific details and actions. |
| `/conversations/[conversationId]/propose-times` | `section#timeProposal` | Jalali date chips, time slot chips, 3..6 selection rule. |
| `/conversations/[conversationId]/select-time` | `section#conversationProposals` | Seeker chooses one proposed time or cancels. |
| `/checkout/[conversationId]` | `section#checkout` plus final checkout override | Wallet deduction and gateway payable amount. |
| `/profile` | `section#myExperience` | Profile dashboard, status card, profile panel, network, performance, feedback, account settings summary. |
| `/profile/build` | `section#buildExperience` | Profile builder and preview modal. |
| `/profile/network` | `section#myNetwork` | Following, saved, followers tabs with search/filter/sort. |
| `/profile/feedback` | `section#receivedFeedback` | Feedback summary and list. |
| `/profile/settings` | `section#accountSettings` and modals | Account, notification, privacy, settlement settings. |
| `/wallet` | `section#wallet` | Wallet summary, top-up, payout, transactions. |
| `/notifications` | `section#notifications` | Notification list, unread state, deep links. |

## Application Architecture

The app will be a greenfield Next.js App Router application because no production app scaffold exists in the workspace. The prototype and contracts will be preserved as reference artifacts.

Planned structure:

- `src/app/` for route segments, layouts, loading/error states, and route handlers.
- `src/components/` for reusable UI primitives and feature components.
- `src/features/discover/`, `src/features/profile/`, `src/features/conversations/`, `src/features/wallet/`, `src/features/notifications/`, `src/features/network/`, and `src/features/settings/` for domain-specific UI and logic.
- `src/lib/contracts/` for typed constants generated or copied from handoff contracts: org levels, pricing caps, state machines, validation rules, route labels, error codes.
- `src/lib/state-machines/` for transition guards and tests derived from `docs/handoff/05_STATE_MACHINES`.
- `src/lib/validation/` for shared Zod schemas derived from `docs/handoff/08_FRONTEND_CONTRACTS/form-validations.json` and API schemas.
- `src/lib/db/` for lazy Prisma client initialization.
- `prisma/schema.prisma` based on `docs/handoff/06_DATA_MODEL/prisma.schema`.
- `src/app/api/**/route.ts` for route handlers matching `docs/handoff/07_API_CONTRACTS/api-endpoints.csv`.
- `tests/` for unit, state-machine, API, and Playwright E2E coverage from `docs/handoff/12_TEST_CASES`.

Rendering strategy:

- Server Components will fetch initial route data and enforce auth visibility.
- Client Components will be used only for interactive regions: filters, tabs, profile builder, avatar upload, chips, modals, wallet panels, notification read/open actions, scheduling picker, and optimistic save/follow.
- Server Actions or route handlers will perform mutations with authorization and state-machine checks.
- Route handlers will remain available for the API contract and future external integrations.

## Data And State Plan

Production persistence will use the Prisma model from the handoff:

- Users, experience profiles, categories, companies, languages.
- Saved profiles and follows.
- Conversation requests and proposed times.
- Payments, wallets, wallet transactions.
- Settlement info and payouts.
- Feedback and notifications.

State-machine enforcement:

- Experience profile states: `draft`, `pending_review`, `needs_changes`, `active`, `inactive`.
- Conversation states: `draft`, `requested`, `provider_time_options_sent`, `time_selected`, `awaiting_payment`, `scheduled`, `completed`, `feedback_pending`, `feedback_submitted`, `cancelled`, `expired`.
- Payment states: `checkout_created`, `wallet_sufficient`, `requires_gateway_payment`, `payment_processing`, `paid`, `failed`, `cancelled`, `refunded`.
- Payout states: `not_requested`, `blocked_missing_settlement_info`, `requested`, `processing`, `paid`, `failed`.
- Notifications: `unread`, `read`.
- Network: saved/not saved and following/not following.

Every mutation that changes one of these states must pass through a transition guard. Invalid transitions return the handoff error codes and HTTP statuses.

## UI Implementation Plan

1. Convert prototype visual tokens into global CSS variables and component-level CSS modules while keeping the V51 colors, shadows, radii, spacing, density, and typography.
2. Use Vazirmatn as the UI font. The handoff notes no production font file is included, so the initial build will use `next/font/google` or a CSS fallback until a local font asset is supplied.
3. Build the app shell and V51 header exactly: sticky topbar, RTL grid behavior on tablet/mobile, main nav active state, utility active states, notification badge, wallet button.
4. Rebuild each prototype page as a route, preserving page order, section hierarchy, headings, CTAs, labels, empty states, loading states, error states, modals, and drawer behavior.
5. Replace inline prototype behavior with typed event handlers and feature modules.
6. Keep visible Persian copy centralized only after fidelity is verified. Copy key names must not become a reason to rename visible UI.
7. Preserve mobile behavior from the prototype: filter drawer, topbar wrapping, horizontal nav scroll, single-column cards/forms, sticky panels becoming static, and modal fit.
8. Run visual QA against the prototype at desktop, tablet, and mobile widths before calling a page complete.

## Backend And API Plan

1. Implement API routes from `07_API_CONTRACTS/api-endpoints.csv`.
2. Validate request bodies and query params with shared schemas.
3. Enforce permissions from `04_USER_ROLES_PERMISSIONS.csv`.
4. Enforce pricing and scheduling rules from `09_BUSINESS_RULES`.
5. Use seed data from `docs/handoff/06_DATA_MODEL/seed-data.json` for development and UI parity with the prototype.
6. Keep external integrations behind adapters because providers are not selected:
   - Auth/session provider.
   - Upload/object storage provider.
   - Payment provider.
   - Notification delivery provider.
   - Monitoring provider.
7. Implement development-safe provider stubs only where needed for local MVP flows, clearly isolated behind interfaces so production providers can be attached later.

## Testing And Verification Plan

Required test coverage:

- State-machine unit tests for profile, conversation, payment, payout, notification, save, and follow transitions.
- Validation tests for profile builder, pricing caps, free help, proposed times, account edit, settlement info, and feedback.
- API tests for route handlers and expected error codes.
- E2E tests from `12_TEST_CASES/e2e-scenarios.csv`.
- Visual regression screenshots against the V51 prototype for the major routes and states.
- RTL checks for header order, text alignment, Persian numerals, Toman prices, Jalali dates, LTR fields, and mirrored directional controls.

Acceptance gates before build completion:

- `/discover`, `/guide`, `/profile`, `/profile/build`, `/conversations`, `/wallet`, `/notifications`, `/profile/network`, `/profile/feedback`, and `/profile/settings` render with V51 visual fidelity.
- Save/follow state works and appears in network.
- Profile builder validates exactly as specified and submits to `pending_review`.
- Free help sets prices to `0`, disables inputs, and displays `رایگان`.
- Time proposal picker blocks fewer than 3, blocks more than 6, blocks duplicates, and uses Jalali chips.
- Checkout shows wallet deduction and gateway payable amount.
- Payout is blocked until valid `IR` plus 24 digits and account owner are saved.
- Notifications mark read and deep-link to the related page.

## Implementation Phases

1. Project scaffold and contract import.
2. Database schema, seed data, state-machine guards, and validation schemas.
3. App shell, V51 header, typography, RTL globals, and visual tokens.
4. Discover and public profile routes.
5. Profile builder and profile dashboard.
6. Conversations, scheduling, checkout, and feedback.
7. Wallet, settlement info, account settings, notifications, and network.
8. API hardening, permissions, error mapping, and tests.
9. Visual fidelity pass against the prototype.
10. Deployment readiness pass using `docs/handoff/13_ENV_DEPLOYMENT/deployment-checklist.md`.

## Readiness

We are ready to start building the production app once you approve these planning files. The main blockers are not implementation blockers for an MVP scaffold, but they must remain explicit: provider choices for auth, payment, upload storage, notification delivery, monitoring, plus product decisions for commission, refunds, cancellation, payout timing, KYC, and timezone policy.
