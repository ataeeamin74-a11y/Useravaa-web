# phase-2b-v51-request-conversation-checkout-complete

Checkpoint for the approved Phase 2B V51 request, conversation, and checkout cluster.

## Included Scope

- `/requests/new` implemented with V51 request flow, selected profile summary, 30/60 minute duration options, optional note, pricing, and mock request creation.
- `/conversations` implemented with V51 sent/received tabs and grouped conversation states:
  - `درخواست‌های من`
  - `درخواست‌های دریافتی`
  - `نیازمند اقدام`
  - `در حال پیگیری`
  - `تمام‌شده`
- `/conversations/[conversationId]` implemented with state-driven conversation detail and valid actions only.
- `/conversations/[conversationId]/propose-times` implemented with provider-side Shamsi/Jalali date chips, time chips, duplicate prevention, minimum 3 and maximum 6 proposed times.
- `/conversations/[conversationId]/select-time` implemented with seeker-side single time selection and cancel behavior.
- `/checkout/[conversationId]` implemented with selected profile/person, selected time, duration, conversation price, wallet deduction, gateway payable amount, mock successful payment, and free-help finalization support.
- V51 conversation fixture data is included in `src/features/v51/data/conversations.ts`.
- Typed mock state transitions are included for request creation, time proposal, time selection, cancellation, checkout calculation, and mock payment.
- Reusable conversation/request/checkout components are included under `src/features/v51/conversations/components/`.
- CSS Modules structure is used for Phase 2B V51 surfaces.
- Prototype reference files are preserved unchanged:
  - `prototype/index.html`
  - `prototype/styles.css`
  - `prototype/script.js`
- `PHASE_2B_REPORT.md` is included.

## Verification

The following checks passed for the Phase 2B checkpoint:

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`

## Git Status

An actual Git commit could not be created in this environment because:

- No `.git/` directory exists in the workspace.
- `git` is not available on PATH.

This file is the named checkpoint artifact for `phase-2b-v51-request-conversation-checkout-complete`.
