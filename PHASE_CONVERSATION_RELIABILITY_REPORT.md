# Phase Conversation Reliability Report

## 1. PRD file used

- `.conversation-reliability-package/useravaa-conversation-reliability-codex-package-v1/CODEX_PROMPT_START_CONVERSATION_RELIABILITY.txt`
- `.conversation-reliability-package/useravaa-conversation-reliability-codex-package-v1/conversation-request-reliability-system.prd.md`

## 2. Routes, components, and services changed

- `/conversations`
- `/conversations/[conversationId]`
- `/conversations/[conversationId]/propose-times`
- `/conversations/[conversationId]/select-time`
- `/checkout/[conversationId]`
- `/notifications`
- `src/features/v51/data/conversations.ts`
- `src/features/v51/conversations/components/ConversationCard.tsx`
- `src/features/v51/conversations/components/ConversationDetailPanel.tsx`
- `src/features/v51/conversations/components/ConversationCluster.module.css`
- `src/features/v51/conversations/pages/ProposeTimesPage.tsx`
- `src/features/v51/conversations/pages/SelectTimePage.tsx`
- `src/features/v51/conversations/pages/CheckoutPage.tsx`
- `src/features/v51/notifications/NotificationsPage.tsx`
- `src/features/v51/notifications/NotificationsPage.module.css`
- `prisma/schema.prisma`

## 3. Request status model implemented

Implemented the PRD status model in typed fixtures and Prisma contract:

- `pending_provider_response`
- `times_proposed`
- `pending_payment`
- `confirmed`
- `rejected`
- `expired`
- `cancelled`

The existing Phase 2B fixture IDs were preserved where relevant, while their state values were migrated to the PRD model.

## 4. Deadline/SLA behavior

- New mock requests start as `pending_provider_response`.
- `providerResponseDeadlineAt` is created as `createdAt + 24h`.
- Provider request cards show the new request badge and countdown copy.
- Provider near-expiration warning is shown when a pending request is within the MVP warning window.
- `times_proposed` requests carry `requesterSelectionDeadlineAt = timesProposedAt + 48h`.
- Deterministic expiration helpers expire overdue provider responses and overdue requester selection windows.
- Mock job metadata documents the intended 15-minute expiration/reminder and 1-hour warning cadences without connecting real cron infrastructure.

## 5. Notification behavior

- Added in-app notification fixtures/contracts for:
  - new request to Provider
  - proposed times to Requester
  - near expiration to Provider
  - confirmed conversation
  - one-hour conversation reminder
- `/notifications` now renders the existing EQE notification plus conversation reliability notifications.
- Badge helper functions cover Provider pending requests, Requester action states, and unread notifications.

## 6. Email template/log behavior

- Added SMTP sender contract: `notifications@useravaa.com`.
- Added mock email template contracts for:
  - new request
  - proposed times
  - confirmed conversation
  - one-hour reminder
- Added mock email logs with `queued | sent | failed` status support.
- Near-expiration warning is intentionally in-app only, per PRD.
- No real SMTP sending was added.

## 7. Expiration behavior

- `applyExpiration` expires:
  - `pending_provider_response` after `providerResponseDeadlineAt`
  - `times_proposed` after `requesterSelectionDeadlineAt`
- `expirePendingProviderRequests` and `expireProposedTimes` model batch expiration behavior.
- Expired requests preserve a clear requester message and no longer remain in a pending action state.

## 8. Similar experiences behavior

- Expired requests render `تجربه‌های مشابه برای ادامه مسیر`.
- The similar-experiences helper returns 3 to 5 profiles.
- Ranking logic is not exposed in the UI.
- The UI does not show `match`, `score`, or `درصد نزدیکی`.

## 9. Payment gating behavior

- Checkout payment is disabled unless status is `pending_payment` and a proposed time is selected.
- Checkout shows the PRD error copy when payment is unavailable.
- Selecting one proposed time moves the request to `pending_payment`.
- Mock successful payment moves the request to `confirmed`.
- Free-help requests still require a selected time before finalization.

## 10. Tests added/updated

- Added `tests/conversation-reliability.test.tsx`.
- Updated `tests/phase-2b.test.tsx` for the PRD status names and exactly-one time selection behavior.
- Test coverage includes:
  - new request status and 24h deadline
  - provider countdown/badge
  - minimum 3 proposed times
  - duplicate proposed time rejection
  - 48h requester selection window
  - proposed-times notification/email log
  - time selection to `pending_payment`
  - payment disabled before selection
  - payment to `confirmed`
  - 24h and 48h expiration
  - similar experiences after expiration
  - in-app-only near-expiration warning
  - one-hour reminder notification/email
  - no indefinitely pending overdue fixtures

## 11. Verification results

`npm` is not available on the shell PATH in this environment, so verification used the exact project script equivalents through the bundled Node runtime:

- Lint: `C:\Users\Snapp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe node_modules\eslint\bin\eslint.js .` - passed
- Typecheck: `C:\Users\Snapp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe node_modules\typescript\bin\tsc --noEmit` - passed
- Test: `C:\Users\Snapp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe node_modules\vitest\vitest.mjs run` - passed, 9 files, 103 tests
- Build: `C:\Users\Snapp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe node_modules\next\dist\bin\next build` - passed

## 12. Known gaps intentionally deferred

- Real API routes are not connected; typed mock service functions document the contracts for later integration.
- Real SMTP sending is deferred.
- Real cron infrastructure is deferred.
- SMS, WhatsApp, push notifications, free chat, public availability calendars, and complex matching are out of scope.
- Payment expiry after `pending_payment` remains undefined in the PRD and is not implemented.
