# Risk And Gap Review

## High Priority Gaps From Handoff

| Gap | Impact | Implementation handling |
|---|---|---|
| Authentication provider/session architecture is not selected. | Auth-required routes and permissions cannot be finalized provider-specifically. | Build a provider-neutral auth/session abstraction and enforce permissions server-side. |
| Payment provider is not selected. | Real checkout, gateway callbacks, top-up, and payment confirmation cannot go production-live. | Implement payment state machine and adapter interface; use local/dev stub only for MVP flow testing. |
| Upload/object storage provider is not selected. | Avatar upload cannot persist to production storage. | Implement avatar validation and storage adapter boundary; use local/dev stub until provider is selected. |
| Commission rate/platform fee is not finalized. | Provider net earnings and platform revenue cannot be calculated. | Do not implement commission math. Keep wallet gross amounts aligned with current handoff. |
| Refund policy is not finalized. | Refunded state exists but transition conditions and amounts are undefined. | Keep generic refunded state and block detailed refund automation until product/legal decision. |
| Cancellation policy is not finalized. | Cannot define cancellation windows, penalties, or automatic refunds. | Implement only allowed cancel transitions from state machines without inventing penalties. |
| Payout timing/cycle is not finalized. | Automated settlement schedule cannot be implemented. | Allow payout request state, but do not automate payout cycle. |
| KYC/identity requirements are not finalized. | Settlement may need more than owner name and IBAN later. | Implement only owner name and IBAN because that is current scope. |
| Timezone policy is not finalized. | Backend UTC storage and display conversion need confirmation. | Store and render current Jalali labels for MVP; isolate date conversion code for later UTC policy. |
| Admin review UI details are not finalized. | Profile review states exist but admin dashboard is not designed. | Implement state support and API hooks; defer admin UI beyond minimal operational need. |
| Notification delivery channels are not finalized. | In-app notifications are defined, but email/SMS/push are unknown. | Implement in-app notification center only. |
| Official Useravaa logo source files are not included. | Production logo may differ from prototype text/UA mark. | Preserve prototype `UA` mark and `Useravaa` text until brand assets are supplied. |

## Workspace Organization

The numbered handoff files and folders have been moved under `docs/handoff/`. The prototype remains at `prototype/` and must stay unchanged as the V51 UI baseline.

## Prototype Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Prototype has global mutable state and repeated overridden functions from earlier versions. | Direct copy would be fragile and hard to test. | Use prototype as behavior/UI reference only; rebuild as typed components and domain modules. |
| Prototype contains inline event handlers and DOM string templates. | Hard to secure, test, and maintain. | Convert to React components and typed handlers. |
| Prototype mock data differs from handoff seed data in count and some fields. | UI may drift if seed data is too small. | Use handoff seed for domain truth and augment development fixtures only when needed for visual parity without changing production rules. |
| Prototype includes UI-only simulated payments, wallet top-up, notifications, and payout success. | Production behavior needs server validation and provider adapters. | Keep the visible interaction model, but route mutations through API/state guards. |
| Prototype includes some legacy fragment naming such as V38/V44/V46/V49/V50 in classes/functions. | Could leak implementation history into production code. | Preserve visual classes only when useful for fidelity; use clean production component names internally. |
| CSS is large and page-wide. | Risk of cascade regressions during conversion. | Extract tokens first, then port page/component styles incrementally with screenshot checks. |

## Product Scope Risks

| Risk | Impact | Mitigation |
|---|---|---|
| User can be both seeker and provider. | Hard-coded account role separation would violate scope. | Model capabilities by permission and resource ownership, not by separate account types. |
| Settings must not appear in top-level nav. | Easy to accidentally add settings to global header. | Header component should hard-code only V51 main nav and utilities; settings links live inside profile. |
| No public availability calendar. | Scheduling UX could drift toward direct booking. | Public profile only shows request CTAs. Scheduling starts after request creation. |
| Payout blocked until settlement info. | Wallet UX can accidentally allow payout before IBAN. | Server-side payout endpoint returns `SETTLEMENT_INFO_REQUIRED`; UI opens settlement modal. |
| Profile visibility depends on active status. | Draft/pending profiles could leak into discover. | Discovery API filters to active profiles only. |
| Pricing caps are maximums, not fixed prices. | UI might lock prices to caps. | Allow lower values and free help; server rejects only above caps and invalid price relationship. |

## Technical Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Next.js version/provider constraints may change by implementation time. | Security and framework behavior can drift. | Use current patched Next.js/React when scaffolding; verify before dependency install. |
| Font loading may require network during build if using Google-hosted font. | CI/deploy build can fail or cause visual drift. | Prefer local Vazirmatn asset if supplied; otherwise use `next/font/google` and document dependency. |
| Persian/Jalali date handling can be inconsistent across environments. | Scheduling and tests can fail by locale/runtime. | Centralize Jalali formatting and test expected labels. |
| Persian digit normalization is needed for phone/IBAN. | Users may enter Persian digits into LTR validated fields. | Normalize Persian and Arabic digits before validation, as the prototype does. |
| API contract OpenAPI file is incomplete in places and references `Error` schemas for many success responses. | Generated clients may be inaccurate. | Use `api-endpoints.csv`, Prisma schema, and frontend contracts as primary implementation references; treat OpenAPI as partial. |
| Network access is restricted in the current environment. | Dependency install/scaffold may require approval. | Request approval when build work starts and network dependency installation is needed. |

## Testing Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Visual fidelity can regress while productionizing components. | App may pass tests but fail the approved V51 baseline. | Add screenshot-based QA for each major route and state. |
| State transitions can be implemented inconsistently across UI and API. | Invalid actions may appear or succeed. | Unit-test transition guards and API mutations against state machine JSON. |
| Permission matrix can be bypassed in client-only checks. | Security issue. | Enforce permissions in server actions/route handlers and test forbidden cases. |
| Wallet/payment flows can appear complete while provider is stubbed. | Product may overestimate production readiness. | Label provider adapters as unresolved until real provider is selected. |

## Build Readiness Assessment

Ready to begin implementation:

- UI baseline is clear: V51 prototype.
- Production contracts are clear for MVP routes, data model, validation, state machines, permissions, business rules, and core E2E tests.
- Known gaps are explicit and can be isolated behind adapters or deferred decisions.

Not ready for production launch until resolved:

- Auth provider.
- Payment provider and webhook behavior.
- Upload storage provider.
- Commission/platform fee.
- Cancellation/refund policy.
- Payout timing.
- KYC requirements.
- Timezone/UTC storage policy.
- Monitoring/logging provider.
- Official logo assets.

Recommendation: start implementation with local/dev provider stubs and strict adapter boundaries, while tracking the unresolved production decisions separately.
