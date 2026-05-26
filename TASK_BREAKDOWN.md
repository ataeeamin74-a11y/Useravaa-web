# Task Breakdown

## Phase 0: Planning And Baseline Lock

- [x] Read handoff contracts and prototype source.
- [x] Confirm V51 prototype is the approved UI baseline.
- [x] Move numbered handoff files and folders into `docs/handoff`.
- [ ] Keep `prototype/index.html`, `prototype/styles.css`, and `prototype/script.js` unchanged as reference files.
- [ ] Create a page-by-page copy and UI inventory before implementation starts.
- [ ] Create a route-by-route visual QA checklist from the prototype.

## Phase 1: Next.js Scaffold

- [ ] Scaffold a Next.js App Router app with TypeScript.
- [ ] Configure RTL document root with `lang="fa"` and `dir="rtl"`.
- [ ] Configure global metadata and base layout.
- [ ] Add lint, typecheck, test, and build scripts.
- [ ] Add absolute import alias.
- [ ] Add global CSS variables from `docs/handoff/11_DESIGN_SYSTEM/design-tokens.json` and V51 CSS.
- [ ] Add Vazirmatn font strategy.

## Phase 2: Contract And Domain Foundation

- [ ] Add Prisma schema from `docs/handoff/06_DATA_MODEL/prisma.schema`.
- [ ] Add seed data from `docs/handoff/06_DATA_MODEL/seed-data.json`.
- [ ] Add typed constants for official labels, organization levels, pricing caps, languages, categories, and route labels.
- [ ] Add state-machine definitions from `docs/handoff/05_STATE_MACHINES`.
- [ ] Add transition guard helpers and invalid-transition error mapping.
- [ ] Add validation schemas from `docs/handoff/08_FRONTEND_CONTRACTS/form-validations.json`.
- [ ] Add permission helpers from `docs/handoff/04_USER_ROLES_PERMISSIONS.csv`.
- [ ] Add API error mapping from `docs/handoff/07_API_CONTRACTS/error-codes.json`.

## Phase 3: App Shell And Shared UI

- [ ] Rebuild the V51 sticky header.
- [ ] Preserve main nav: `کشف تجربه‌ها`, `گفت‌وگوها`, `پروفایل`.
- [ ] Preserve utilities: `راهنما`, `اعلان‌ها`, `کیف پول`.
- [ ] Preserve active states for main nav and utility buttons.
- [ ] Keep settings out of global top-level nav.
- [ ] Build shared button, chip, field, select, panel, modal, toast, card, skeleton, tab, and state-panel components.
- [ ] Preserve V51 visual tokens, shadows, radii, spacing, and compact density.
- [ ] Add RTL/LTR field primitives for Persian UI with LTR email, phone, and IBAN inputs.

## Phase 4: Discover

- [ ] Implement `/discover`.
- [ ] Render profile cards with avatar fallback, save, follow, role, org level, years, CSAT, categories, companies, and summary.
- [ ] Implement search by name, role, org level, summary, companies, and categories.
- [ ] Implement filters for role, job category, org level, company, years, and language.
- [ ] Implement sort options: relevant, experience descending, CSAT descending, recent activity.
- [ ] Preserve active filter chips and `پاک کردن همه`.
- [ ] Preserve mobile filter drawer and active count badge.
- [ ] Preserve loading skeleton, error state, retry, empty state, and no-results behavior.
- [ ] Enforce active-profile-only discovery results.

## Phase 5: Guide And Public Profile

- [ ] Implement `/guide` from the `how` section without adding operational journey content beyond the prototype.
- [ ] Preserve guide CTAs to discover and profile builder.
- [ ] Implement `/profiles/[profileId]`.
- [ ] Preserve public profile layout: hero profile, professional summary, professional info, feedback, request sidebar.
- [ ] Preserve request CTAs: `درخواست ۳۰ دقیقه`, `درخواست ۱ ساعت`.
- [ ] Preserve `گزارش پروفایل` action.
- [ ] Ensure public profile does not show an availability calendar.
- [ ] Block request flow for inactive profiles.

## Phase 6: Profile Builder

- [ ] Implement `/profile/build`.
- [ ] Preserve builder header, `پیش‌نویس` status badge, main form column, sticky preview column, and review state explainer.
- [ ] Implement avatar upload preview, remove action, PNG/JPG/WebP validation, and 2 MB limit.
- [ ] Implement display name, role, org level, years, category chips, company tag input, company suggestions, language chips, summary counter, price inputs, free-help toggle, draft save, preview modal, and submit for review.
- [ ] Enforce field validations from handoff.
- [ ] Enforce price caps by organization level.
- [ ] Allow lower prices.
- [ ] Make `کمک رایگان` set both prices to `0`, disable inputs, add preview badge, and display `رایگان`.
- [ ] Submit valid profile to `pending_review`.
- [ ] Preserve all Persian validation messages from prototype unless handoff explicitly overrides.

## Phase 7: Profile Dashboard, Network, Feedback, Settings

- [ ] Implement `/profile`.
- [ ] Preserve status card states: none, pending, active, inactive, needs changes.
- [ ] Preserve profile panel, network summary, performance metrics, earnings metrics, feedback summary, and account settings summary.
- [ ] Keep incoming requests as a small notification/link, not full request cards.
- [ ] Implement `/profile/network` with tabs: `دنبال می‌کنم`, `ذخیره‌شده‌ها`, `دنبال‌کننده‌های من`.
- [ ] Implement network search, category filter, and sort by recent, org level, and name.
- [ ] Implement `/profile/feedback` with summary and feedback list.
- [ ] Implement `/profile/settings` with account edit, notification toggles, privacy toggles, and settlement access.
- [ ] Preserve account edit modal with name, email, phone and validation.

## Phase 8: Conversations And Scheduling

- [ ] Implement `/requests/new`.
- [ ] Preserve duration choices: `۳۰ دقیقه`, `۱ ساعت`.
- [ ] Preserve optional note field and summary panel.
- [ ] Create conversation request with status `requested`.
- [ ] Implement `/conversations` with tabs `درخواست‌های من` and `درخواست‌های دریافتی`.
- [ ] Preserve groups: `نیازمند اقدام`, `در حال پیگیری`, `تمام‌شده`.
- [ ] Implement state-specific primary actions and secondary cancel/reject actions.
- [ ] Implement `/conversations/[conversationId]`.
- [ ] Implement `/conversations/[conversationId]/propose-times`.
- [ ] Preserve the chip-based Jalali date and time picker.
- [ ] Enforce 3 to 6 unique proposed times.
- [ ] Implement `/conversations/[conversationId]/select-time`.
- [ ] Let seeker select exactly one proposed time or cancel.
- [ ] Create checkout after time selection.
- [ ] Implement feedback flow after completed conversation.

## Phase 9: Checkout, Wallet, Settlement

- [ ] Implement `/checkout/[conversationId]`.
- [ ] Preserve summary rows: person, selected time, duration, conversation cost, wallet payment, gateway payable amount.
- [ ] Preserve insufficient-wallet note.
- [ ] Finalize scheduled conversation only after payment or free-help finalization.
- [ ] Implement `/wallet`.
- [ ] Preserve wallet cards: usable balance, available payout, in-settlement amount.
- [ ] Preserve top-up panel with amount buttons.
- [ ] Preserve payout panel behavior.
- [ ] Preserve transaction filter and empty state.
- [ ] Implement settlement-info modal with account owner and Shaba/IBAN.
- [ ] Validate IBAN as `IR` plus 24 digits.
- [ ] Block payout creation until settlement info exists.

## Phase 10: Notifications

- [ ] Implement `/notifications`.
- [ ] Preserve badge count in header.
- [ ] Preserve unread/read card styling.
- [ ] Preserve `باز کردن` action.
- [ ] Mark notification as read on open.
- [ ] Deep-link to the related route or profile-dashboard received requests view.

## Phase 11: API And Integrations

- [ ] Implement API route handlers from `docs/handoff/07_API_CONTRACTS/api-endpoints.csv`.
- [ ] Implement profile list/detail APIs.
- [ ] Implement profile draft/submit APIs.
- [ ] Implement save/follow APIs.
- [ ] Implement network API.
- [ ] Implement conversation, proposed-time, select-time, cancel, checkout, payment-confirm APIs.
- [ ] Implement wallet, top-up, payout, settlement-info APIs.
- [ ] Implement notifications read/list APIs.
- [ ] Implement feedback APIs.
- [ ] Implement account update API.
- [ ] Implement report profile API as storage-only unless moderation scope is decided.
- [ ] Keep external provider adapters isolated behind interfaces.

## Phase 12: Testing And QA

- [ ] Add unit tests for pricing caps and free-help rules.
- [ ] Add unit tests for all state-machine transitions.
- [ ] Add validation tests for profile builder, proposed times, settlement info, account edit, feedback, and conversation request.
- [ ] Add API tests for permissions and error codes.
- [ ] Add E2E tests from `docs/handoff/12_TEST_CASES/e2e-scenarios.csv`.
- [ ] Add visual QA screenshots against V51 prototype at mobile, tablet, desktop, and wide breakpoints.
- [ ] Verify Persian numerals, Toman formatting, Jalali labels, and RTL layout.
- [ ] Run lint, typecheck, unit tests, E2E tests, and production build.

## Phase 13: Deployment Readiness

- [ ] Validate environment variables from `docs/handoff/13_ENV_DEPLOYMENT/env.example`.
- [ ] Generate Prisma client.
- [ ] Run migrations.
- [ ] Seed development or staging data.
- [ ] Deploy preview.
- [ ] Run deployment checklist smoke tests.
- [ ] Confirm provider choices before production payment, upload, auth, notification delivery, monitoring, and KYC flows.
- [ ] Document rollback strategy before production database migration.
