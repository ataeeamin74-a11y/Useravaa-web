# V51 Paid Session Contact Unlock Fix

## Scope

Implemented the scoped post-payment contact access fix from `CODEX_PROMPT_POST_PAYMENT_CONTACT_UNLOCK_FIX.txt`.

No checkpoint was created. No prototype files were modified.

## Files Changed

- `src/features/v51/data/conversations.ts`
- `src/features/v51/conversations/components/ConversationDetailPanel.tsx`
- `src/features/v51/conversations/components/ConversationCluster.module.css`
- `src/features/v51/conversations/pages/CheckoutPage.tsx`
- `src/app/checkout/page.tsx`
- `src/lib/routes.ts`
- `tests/post-payment-contact-unlock.test.tsx`
- `PHASE_POST_PAYMENT_CONTACT_UNLOCK_REPORT.md`

## Status And Access Rules

- Before payment, session contact details remain locked for unpaid conversation states.
- After successful payment, `payConversation` moves the request to `confirmed`, and contact access becomes available.
- Contact details are unlocked for `confirmed` and `completed` session states only.
- The shared access helper is `sessionContactDetailsAreUnlocked`.
- The shared contact resolver is `getSessionCoordinationContact`.

## Contact Details After Payment

- Seeker-side paid session detail pages show the Provider contact details.
- Provider-side paid session detail pages show the Requester contact details.
- The unlocked section title is:
  `اطلاعات تماس برای هماهنگی جلسه`
- The unlocked helper text is:
  `این اطلاعات پس از پرداخت فعال شده است تا بتوانید زمان و جزئیات جلسه مشاوره را هماهنگ کنید.`
- The visible fields are:
  `شماره تماس`
  `ایمیل`
- Missing-field fallbacks are:
  `شماره تماس ثبت نشده است.`
  `ایمیل ثبت نشده است.`

## Hidden Before Payment

- Unpaid conversation detail pages show the locked contact state instead of phone or email.
- The locked title is:
  `اطلاعات تماس پس از پرداخت فعال می‌شود`
- The locked helper text is:
  `برای حفظ حریم خصوصی، شماره تماس و ایمیل طرف مقابل فقط بعد از پرداخت و ثبت جلسه نمایش داده می‌شود.`
- The payment CTA is shown for `pending_payment` sessions:
  `پرداخت و ثبت جلسه`
- Phone and email are not rendered on `/discover`, `/insights`, `/saved`, or public profile pages.

## Checkout Copy

Checkout now explains contact sharing before payment with:

`پس از پرداخت، شماره تماس و ایمیل شما برای هماهنگی جلسه مشاوره با طرف مقابل به اشتراک گذاشته می‌شود.`

The manual review route `/checkout` now renders the `conv-awaiting-payment` checkout fixture.

## Fixture Data

- Added Provider contact fixtures keyed by profile id.
- Added Requester contact fixtures keyed by requester id.
- Added a paid incoming provider-side fixture, `conv-provider-confirmed`, to verify Provider access to Requester contact details after payment.
- Added `completed` as a terminal paid status for contact-access eligibility.

## Tests Added

Added `tests/post-payment-contact-unlock.test.tsx` covering:

- Unpaid sessions hide phone and email and show locked copy.
- Paid seeker-side session shows Provider phone and email.
- Paid provider-side session shows Requester phone and email.
- Mock payment unlocks contact details.
- Checkout renders the post-payment contact-sharing notice.
- `/discover`, `/insights`, `/saved`, and public profile pages do not expose fixture phone or email values.

## Verification Results

`npm run lint` could not run because `npm` is unavailable on PATH in this environment.

Bundled Node commands used:

- Lint: `C:\Users\Snapp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe node_modules\eslint\bin\eslint.js .` - passed
- Typecheck: `C:\Users\Snapp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe node_modules\typescript\bin\tsc --noEmit` - passed
- Test: `C:\Users\Snapp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe node_modules\vitest\vitest.mjs run` - passed, 12 files and 135 tests
- Build: `C:\Users\Snapp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe node_modules\next\dist\bin\next build` - passed

Local route checks:

- `http://127.0.0.1:3000/conversations` - 200
- `http://127.0.0.1:3000/checkout` - 200, checkout notice present
- `http://127.0.0.1:3000/profile` - 200
- `http://127.0.0.1:3000/profiles/ali` - 200, public insight section present and Provider contact hidden
- `http://127.0.0.1:3000/conversations/conv-awaiting-payment` - locked contact state present and Provider contact hidden
- `http://127.0.0.1:3000/conversations/conv-scheduled` - unlocked contact state present
- `http://127.0.0.1:3000/conversations/conv-provider-confirmed` - Requester contact visible after payment

## Manual Review URLs

- `http://127.0.0.1:3000/conversations`
- `http://127.0.0.1:3000/checkout`
- `http://127.0.0.1:3000/profile`
- `http://127.0.0.1:3000/profiles/ali`
