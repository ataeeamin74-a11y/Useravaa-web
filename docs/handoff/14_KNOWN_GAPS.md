# Known Gaps

| gap | impact | who_should_decide | needed_before_phase |
|---|---|---|---|
| Commission rate/platform fee is not finalized. | Cannot calculate provider net earnings or platform revenue. | Product/Business | Payment production |
| Refund policy is not finalized. | Cannot implement refund transitions beyond generic refunded state. | Product/Legal/Finance | Payment production |
| Cancellation policy is not finalized. | Cannot define cancellation windows, penalties or automatic refunds. | Product/Legal/Finance | Conversation production |
| Payout timing/cycle is not finalized. | Cannot automate settlement schedule. | Finance/Product | Payout production |
| Payment provider is not selected. | Cannot implement real gateway callbacks/webhooks. | Engineering/Product | Payment integration |
| Upload/object storage provider is not selected. | Cannot implement production avatar storage. | Engineering | Profile production |
| Authentication provider/session architecture is not selected. | Cannot finalize auth implementation details. | Engineering | MVP implementation |
| Admin review UI details are not finalized. | Profile review state exists but admin dashboard design is not specified. | Product/Admin Ops | Admin implementation |
| Moderation/report workflow is not finalized. | Report endpoints can store reports but resolution workflow is unknown. | Product/Ops/Legal | Post-MVP or moderation MVP |
| Notification delivery channels are not finalized. | In-app notifications are defined; email/SMS/push rules are not. | Product/Engineering | Notification production |
| Exact mobile UI QA is not finalized. | Breakpoints are defined but visual QA cases require implementation. | Design/Frontend | Frontend QA |
| Official Useravaa logo source files are not included in the current chat handoff. | Production header asset may differ from prototype text/UA mark. | Brand/Design | UI implementation |
| KYC/identity requirements for payouts are not finalized. | Settlement info only includes owner name and IBAN. | Finance/Legal/Product | Payout production |
| Dispute/missed-call flow is not finalized. | Completed/feedback states exist; missed/no-show cases are not defined. | Product/Ops | Conversation production |
| Timezone policy is not finalized. | Shamsi display is required; backend UTC storage policy must be confirmed. | Engineering/Product | Scheduling implementation |
