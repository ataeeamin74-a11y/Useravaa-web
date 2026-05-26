# Phase 2B Report: V51 Request, Conversation, Checkout Cluster

## Routes implemented
- `/requests/new`
- `/conversations`
- `/conversations/[conversationId]`
- `/conversations/[conversationId]/propose-times`
- `/conversations/[conversationId]/select-time`
- `/checkout/[conversationId]`

## Files changed
- `src/app/requests/new/page.tsx`
- `src/app/conversations/page.tsx`
- `src/app/conversations/[conversationId]/page.tsx`
- `src/app/conversations/[conversationId]/propose-times/page.tsx`
- `src/app/conversations/[conversationId]/select-time/page.tsx`
- `src/app/checkout/[conversationId]/page.tsx`
- `src/features/v51/data/conversations.ts`
- `src/features/v51/conversations/components/ConversationCluster.module.css`
- `src/features/v51/conversations/components/ConversationTabs.tsx`
- `src/features/v51/conversations/components/ConversationStatusGroup.tsx`
- `src/features/v51/conversations/components/ConversationCard.tsx`
- `src/features/v51/conversations/components/ConversationDetailPanel.tsx`
- `src/features/v51/conversations/components/RequestSummary.tsx`
- `src/features/v51/conversations/components/DurationSelector.tsx`
- `src/features/v51/conversations/components/TimeProposalPicker.tsx`
- `src/features/v51/conversations/components/SelectedTimesList.tsx`
- `src/features/v51/conversations/components/CheckoutSummary.tsx`
- `src/features/v51/conversations/components/StateActionButton.tsx`
- `src/features/v51/conversations/pages/RequestConversationPage.tsx`
- `src/features/v51/conversations/pages/ConversationsPage.tsx`
- `src/features/v51/conversations/pages/ConversationDetailPage.tsx`
- `src/features/v51/conversations/pages/ProposeTimesPage.tsx`
- `src/features/v51/conversations/pages/SelectTimePage.tsx`
- `src/features/v51/conversations/pages/CheckoutPage.tsx`
- `tests/phase-2b.test.tsx`
- `vitest.config.ts`

## Fixture data added
- Added dedicated V51 conversation fixtures in `src/features/v51/data/conversations.ts`.
- Fixtures cover outgoing requests, incoming requests, provider time options, awaiting payment, scheduled conversations, feedback-pending conversations, and free-help checkout behavior.
- Pricing uses the existing V51 profile fixture pricing and the wallet fixture balance of `۱۰۰٬۰۰۰ تومان`.

## State transitions implemented
- `requested` -> `provider_time_options_sent` through provider time proposal.
- `provider_time_options_sent` -> `awaiting_payment` through seeker time selection plus mock checkout creation.
- `awaiting_payment` -> `scheduled` through mock successful payment or free-help finalization.
- `requested`, `provider_time_options_sent`, `time_selected`, and `awaiting_payment` -> `cancelled` through mock cancel behavior.
- Proposal validation enforces at least 3 and at most 6 Shamsi/Jalali date-time chip selections, with duplicate prevention.

## Tests added
- Request page renders selected profile and duration options.
- Conversations tabs render sent and received groups.
- Propose-times submit is disabled under 3 selections.
- Propose-times submit is enabled at 3 selections.
- Selecting more than 6 proposed times is blocked.
- Select-time keeps exactly one selected option.
- Checkout calculates wallet deduction and gateway payable amount.
- Successful mock payment moves the conversation to `scheduled`.

## Known gaps intentionally deferred
- No real database persistence.
- No real authentication, authorization, payment gateway, upload, notification, or external provider integration.
- Mock state changes are local to the rendered route/component and are ready to be replaced by API calls later.
- No wallet ledger, settlement, provider earnings, or post-call feedback implementation in this phase.
- No Phase 2C work was started.

## Verification results
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run test`: passed, 2 files and 11 tests.
- `npm run build`: passed.

## Recommended Phase 2C
Build the V51 profile builder/account cluster next, including `/profile`, `/profile/build`, `/profile/network`, `/profile/feedback`, and `/profile/settings` with fixture-only data first. Keep the same CSS Modules structure, preserve the V51 Persian copy and interactions, and continue deferring real auth, uploads, settlement, and notification providers behind adapter boundaries.
