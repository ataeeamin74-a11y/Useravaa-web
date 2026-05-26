# Tech Stack Decision

## Decision

Use a greenfield Next.js App Router application with TypeScript, React, Prisma, PostgreSQL, and CSS modules/global CSS extracted from the V51 prototype.

The stack is chosen to productionize the handoff contracts while preserving the V51 prototype as closely as possible. The UI should not be rebuilt with a generic component theme that changes the approved visual direction.

## Selected Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js App Router | Matches the requested production-ready Next.js target and supports route-level loading/error states, server rendering, API route handlers, and deployment readiness. |
| Language | TypeScript | Required for typed contracts, state machines, API payloads, Prisma models, and safer conversion from prototype globals. |
| UI runtime | React | Native to Next.js and suitable for rebuilding prototype interactions as typed components. |
| Styling | Global CSS tokens plus CSS Modules | Best fit for preserving V51 CSS exactly. Tailwind/shadcn defaults would risk visual drift. |
| Directionality | Native RTL via `dir="rtl"` plus LTR input exceptions | Required by `docs/handoff/11_DESIGN_SYSTEM/rtl-rules.md` and prototype behavior. |
| Font | Vazirmatn | Prototype uses Vazirmatn. Production can use `next/font/google` initially, but a local font asset would be preferable if supplied. |
| Database ORM | Prisma | Handoff includes `docs/handoff/06_DATA_MODEL/prisma.schema`. |
| Database | PostgreSQL | Prisma datasource and deployment env expect PostgreSQL. |
| Validation | Zod | Practical way to mirror frontend/API validation from `form-validations.json` in both client and server code. |
| State machines | Typed local transition guards | Handoff state JSON is simple enough to implement directly without adding XState unless complexity grows. |
| Auth | Adapter boundary, provider not selected | Auth provider is a known gap. Use a replaceable session abstraction; do not hard-code provider assumptions. |
| Uploads | Adapter boundary, provider not selected | Avatar upload requires object storage, but provider is a known gap. |
| Payments | Adapter boundary, provider not selected | Payment provider is a known gap. Keep checkout/payment logic provider-neutral. |
| Notifications | In-app database notifications first | In-app notification center is in scope; email/SMS/push channels are not selected. |
| Testing | Vitest plus Playwright | Covers unit/state/API logic and V51 browser-flow fidelity. |

## Styling Rationale

The V51 prototype is the approved UI baseline. The safest styling approach is to preserve its visual primitives directly:

- CSS custom properties for colors, shadows, z-index, and shared sizing.
- Component CSS Modules for page and component classes.
- Minimal global CSS for body, typography, RTL, focus states, and shared reset.
- No shadcn visual primitives for the core product UI because they would introduce a different control style, spacing model, radii, and defaults.
- No redesign-oriented component library pass.

Reusable components will exist, but their variants must be derived from V51:

- `Button`
- `Panel`
- `Modal`
- `Toast`
- `Chip`
- `SelectField`
- `TextField`
- `Tabs`
- `Header`
- `ProfileCard`
- `StatePanel`
- `SkeletonCard`

## Next.js Architecture Decisions

- Use `src/app` route segments matching `02_ROUTES_MAP.csv`.
- Use Server Components for data-loading page shells.
- Use Client Components only for interactive islands.
- Push client boundaries down to filters, forms, tabs, chip pickers, modals, optimistic save/follow buttons, wallet panels, and notification actions.
- Use route handlers for API endpoints from `07_API_CONTRACTS`.
- Authenticate and authorize inside route handlers and server mutations, not only at navigation/proxy level.
- Initialize Prisma and third-party SDK clients lazily through getter functions so builds do not crash when runtime env vars are unavailable.

## Data Decisions

- Use `docs/handoff/06_DATA_MODEL/prisma.schema` as the starting schema.
- Preserve enum labels internally as Prisma enum values and map them to official Persian labels for UI.
- Store numeric prices as integer Toman values.
- Store UI-visible Shamsi/Jalali labels for proposed times as specified by the current handoff.
- Keep stored numeric values as integers and format visible values with Persian digits.
- Seed from `docs/handoff/06_DATA_MODEL/seed-data.json`.

## Validation Decisions

Client and server validation must match:

- Display name: required, 2..80 chars.
- Role title: required, 2..80 chars.
- Organization level: official enum only.
- Years of experience: integer 0..40.
- Categories: at least 1 official category.
- Previous companies: at least 1.
- Languages: at least 1 official language.
- Professional summary: 20..220 chars.
- Prices: non-negative integers, not above org-level cap, 60-minute price not below 30-minute price unless free help is enabled.
- Free help: both prices are 0 and inputs disabled.
- Proposed times: 3..6 unique date/time pairs.
- Account phone: `09` plus 9 digits.
- Settlement IBAN: `IR` plus 24 digits.
- Feedback rating: 1..5.

## State Management Decisions

Use the server as source of truth for persistent state. Use local component state only for draft interactions:

- Discover filters and active chips.
- Profile builder unsaved form edits.
- Avatar local preview before upload persistence.
- Scheduling chip selection before submit.
- Wallet panel open state.
- Notification read optimistic state.
- Modals and toasts.

Persistent changes must go through mutation handlers:

- Save/follow.
- Draft save.
- Submit profile for review.
- Create request.
- Propose times.
- Select time.
- Checkout/payment confirmation.
- Feedback submission.
- Settlement info save.
- Payout request.
- Account update.
- Notification read.

## Provider Decisions

The following providers are intentionally not selected because the handoff marks them as known gaps:

- Authentication/session provider.
- Object storage provider.
- Payment gateway/provider.
- Notification delivery provider for email/SMS/push.
- Monitoring/logging provider.
- KYC provider.

Implementation should define provider interfaces and development stubs where needed, but production behavior should not invent provider-specific flows.

## Alternatives Considered

| Alternative | Decision | Reason |
|---|---|---|
| Copy prototype HTML/CSS/JS directly | Rejected | Handoff explicitly says prototype is not production code and contains prototype-only state, mock data, inline behavior, and legacy fragments. |
| Redesign with shadcn/ui | Rejected | User explicitly forbids redesign and requires V51 preservation. |
| Tailwind-only implementation | Rejected for initial build | Faster for new UI, but more likely to drift from exact V51 CSS. |
| XState | Deferred | Current state machines are simple enough for typed guards; XState can be introduced later if transition complexity grows. |
| Pages Router | Rejected | App Router is the better fit for a new Next.js app. |

## Final Stack Summary

The production app should be:

- Next.js App Router.
- TypeScript.
- React.
- Prisma.
- PostgreSQL.
- Zod.
- CSS custom properties plus CSS Modules.
- Vazirmatn typography.
- Vitest and Playwright.
- Provider adapters for auth, uploads, payments, notifications, and monitoring.
