export type ApiEndpointPersistenceClassification =
  | "database_persistent"
  | "transaction_ready"
  | "read_only_persistent"
  | "api_skeleton_ready"
  | "contract_ready"
  | "contract_only"
  | "provider_not_configured"
  | "not_implemented";

export type ApiEndpointClassification = {
  classification: ApiEndpointPersistenceClassification;
  requiresViewer: boolean;
  requiresAdmin: boolean;
  usesRepository: boolean;
  writesImplemented: boolean;
  notes: string;
};

export const apiEndpointPersistenceClassification = {
  "GET /api/profile/me": {
    classification: "read_only_persistent",
    requiresViewer: true,
    requiresAdmin: false,
    usesRepository: true,
    writesImplemented: false,
    notes: "Reads current viewer profile through profileRepository."
  },
  "PATCH /api/profile/me": {
    classification: "contract_only",
    requiresViewer: true,
    requiresAdmin: false,
    usesRepository: false,
    writesImplemented: false,
    notes: "Validation exists; profile write is deferred."
  },
  "POST /api/profile/submit-for-review": {
    classification: "contract_only",
    requiresViewer: true,
    requiresAdmin: false,
    usesRepository: false,
    writesImplemented: false,
    notes: "Review transition is deferred."
  },
  "GET /api/conversations": {
    classification: "read_only_persistent",
    requiresViewer: true,
    requiresAdmin: false,
    usesRepository: true,
    writesImplemented: false,
    notes: "Participant-scoped conversation list uses conversationRepository."
  },
  "POST /api/conversations": {
    classification: "transaction_ready",
    requiresViewer: true,
    requiresAdmin: false,
    usesRepository: true,
    writesImplemented: true,
    notes: "Creates a conversation request and initial payment/free record in one transaction. Runtime execution still requires a configured Prisma adapter or Accelerate URL."
  },
  "GET /api/conversations/[conversationId]": {
    classification: "read_only_persistent",
    requiresViewer: true,
    requiresAdmin: false,
    usesRepository: true,
    writesImplemented: false,
    notes: "Participant-scoped detail read excludes raw attendance code fields."
  },
  "POST /api/conversations/[conversationId]/payment/manual": {
    classification: "transaction_ready",
    requiresViewer: true,
    requiresAdmin: false,
    usesRepository: true,
    writesImplemented: true,
    notes: "Requester-only manual payment metadata submission persists PENDING_REVIEW/SUBMITTED state in a transaction without provider visibility."
  },
  "POST /api/conversations/[conversationId]/payment/online": {
    classification: "provider_not_configured",
    requiresViewer: true,
    requiresAdmin: false,
    usesRepository: false,
    writesImplemented: false,
    notes: "Payment provider is not configured."
  },
  "POST /api/conversations/[conversationId]/payment/finalize-free": {
    classification: "transaction_ready",
    requiresViewer: true,
    requiresAdmin: false,
    usesRepository: true,
    writesImplemented: true,
    notes: "Requester-only free finalization persists provider visibility and awaiting-time-proposal state without confirming the session."
  },
  "POST /api/conversations/[conversationId]/payment/confirm-dev": {
    classification: "contract_only",
    requiresViewer: true,
    requiresAdmin: false,
    usesRepository: false,
    writesImplemented: false,
    notes: "Development-only route remains unavailable in production and does not persist."
  },
  "POST /api/conversations/[conversationId]/proposed-times": {
    classification: "transaction_ready",
    requiresViewer: true,
    requiresAdmin: false,
    usesRepository: true,
    writesImplemented: true,
    notes: "Provider-only proposed-time submission creates a versioned ACTIVE set and supersedes previous active options in a transaction."
  },
  "POST /api/conversations/[conversationId]/request-new-times": {
    classification: "transaction_ready",
    requiresViewer: true,
    requiresAdmin: false,
    usesRepository: true,
    writesImplemented: true,
    notes: "Requester-only new-time request supersedes active options and creates a REQUESTED new-time record in a transaction."
  },
  "POST /api/conversations/[conversationId]/select-time": {
    classification: "transaction_ready",
    requiresViewer: true,
    requiresAdmin: false,
    usesRepository: true,
    writesImplemented: true,
    notes: "Requester-only active time selection persists selected time and confirms the conversation without creating payment, wallet, cancellation, or attendance records."
  },
  "POST /api/conversations/[conversationId]/attendance/submit-code": {
    classification: "transaction_ready",
    requiresViewer: true,
    requiresAdmin: false,
    usesRepository: true,
    writesImplemented: true,
    notes: "Provider-only attendance code submission verifies against stored attendance material in a transaction without wallet, payout, cancellation, or payment mutation."
  },
  "POST /api/conversations/[conversationId]/cancel": {
    classification: "transaction_ready",
    requiresViewer: true,
    requiresAdmin: false,
    usesRepository: true,
    writesImplemented: true,
    notes: "Requester-only cancellation persists cancellation status and eligible requester wallet credit in one transaction. Near-session cancellation is marked for support review without auto-credit."
  },
  "GET /api/wallet": {
    classification: "read_only_persistent",
    requiresViewer: true,
    requiresAdmin: false,
    usesRepository: true,
    writesImplemented: false,
    notes: "Reads wallet only for the authenticated viewer."
  },
  "POST /api/wallet/withdrawals": {
    classification: "contract_only",
    requiresViewer: true,
    requiresAdmin: false,
    usesRepository: false,
    writesImplemented: false,
    notes: "Withdrawal request write is deferred."
  },
  "GET /api/notifications": {
    classification: "read_only_persistent",
    requiresViewer: true,
    requiresAdmin: false,
    usesRepository: true,
    writesImplemented: false,
    notes: "Reads current viewer notifications only."
  },
  "POST /api/notifications/[notificationId]/read": {
    classification: "contract_only",
    requiresViewer: true,
    requiresAdmin: false,
    usesRepository: false,
    writesImplemented: false,
    notes: "Notification read mutation is deferred."
  },
  "GET /api/insights": {
    classification: "read_only_persistent",
    requiresViewer: false,
    requiresAdmin: false,
    usesRepository: true,
    writesImplemented: false,
    notes: "Public insight read remains unauthenticated."
  },
  "GET /api/insights/[slug]": {
    classification: "read_only_persistent",
    requiresViewer: false,
    requiresAdmin: false,
    usesRepository: true,
    writesImplemented: false,
    notes: "Public insight detail read remains unauthenticated."
  },
  "POST /api/insights/answers": {
    classification: "contract_only",
    requiresViewer: true,
    requiresAdmin: false,
    usesRepository: false,
    writesImplemented: false,
    notes: "Answer submission write is deferred."
  },
  "GET /api/admin/payments": {
    classification: "read_only_persistent",
    requiresViewer: true,
    requiresAdmin: true,
    usesRepository: true,
    writesImplemented: false,
    notes: "Admin manual payment review list is repository-backed."
  },
  "POST /api/admin/payments/[paymentId]/approve": {
    classification: "transaction_ready",
    requiresViewer: true,
    requiresAdmin: true,
    usesRepository: true,
    writesImplemented: true,
    notes: "ADMIN/SUPPORT-only manual payment approval persists PAID/APPROVED, exposes the conversation to the provider, and writes an audit event without creating time, attendance, or wallet records."
  },
  "POST /api/admin/payments/[paymentId]/reject": {
    classification: "transaction_ready",
    requiresViewer: true,
    requiresAdmin: true,
    usesRepository: true,
    writesImplemented: true,
    notes: "ADMIN/SUPPORT-only manual payment rejection persists FAILED/REJECTED, keeps the conversation hidden from the provider, and writes an audit event."
  },
  "POST /api/admin/cancellations/[cancellationId]/approve-credit": {
    classification: "transaction_ready",
    requiresViewer: true,
    requiresAdmin: true,
    usesRepository: true,
    writesImplemented: true,
    notes: "ADMIN/SUPPORT-only cancellation support-review approval creates wallet credit through the ledger helper, resolves the cancellation, and writes an audit event without payout, settlement, withdrawal, payment, or attendance mutation."
  },
  "POST /api/admin/cancellations/[cancellationId]/reject-credit": {
    classification: "transaction_ready",
    requiresViewer: true,
    requiresAdmin: true,
    usesRepository: true,
    writesImplemented: true,
    notes: "ADMIN/SUPPORT-only cancellation support-review rejection resolves the cancellation without wallet credit and writes an audit event without payout, settlement, withdrawal, payment, or attendance mutation."
  },
  "POST /api/admin/experience-profiles/[profileId]/approve": {
    classification: "transaction_ready",
    requiresViewer: true,
    requiresAdmin: true,
    usesRepository: true,
    writesImplemented: true,
    notes: "ADMIN/SUPPORT-only experience profile approval moves eligible pending profiles to ACTIVE and writes an audit event without payment, wallet, conversation, session, payout, or account mutation."
  },
  "POST /api/admin/experience-profiles/[profileId]/request-changes": {
    classification: "transaction_ready",
    requiresViewer: true,
    requiresAdmin: true,
    usesRepository: true,
    writesImplemented: true,
    notes: "ADMIN/SUPPORT-only experience profile change requests move reviewable profiles to NEEDS_CHANGES, persist a review note/reason, and write an audit event without financial or session mutation."
  },
  "POST /api/admin/experience-profiles/[profileId]/hide": {
    classification: "transaction_ready",
    requiresViewer: true,
    requiresAdmin: true,
    usesRepository: true,
    writesImplemented: true,
    notes: "ADMIN/SUPPORT-only experience profile hide unpublishes the profile from discover by setting INACTIVE and writes an audit event without deleting data or mutating the user account."
  },
  "POST /api/admin/insights/[insightId]/hide": {
    classification: "transaction_ready",
    requiresViewer: true,
    requiresAdmin: true,
    usesRepository: true,
    writesImplemented: true,
    notes: "ADMIN/SUPPORT-only insight hide moves published insight content to HIDDEN and writes an audit event without mutating author, profile, payment, wallet, conversation, or session data."
  },
  "POST /api/admin/insights/[insightId]/restore": {
    classification: "transaction_ready",
    requiresViewer: true,
    requiresAdmin: true,
    usesRepository: true,
    writesImplemented: true,
    notes: "ADMIN/SUPPORT-only insight restore moves HIDDEN insight content back to PUBLISHED, never restoring ARCHIVED content, and writes an audit event."
  },
  "POST /api/admin/insights/[insightId]/delete": {
    classification: "transaction_ready",
    requiresViewer: true,
    requiresAdmin: true,
    usesRepository: true,
    writesImplemented: true,
    notes: "ADMIN/SUPPORT-only insight soft-delete archives insight content with ARCHIVED status and writes an audit event without hard-deleting rows."
  },
  "POST /api/admin/insight-answers/[answerId]/hide": {
    classification: "transaction_ready",
    requiresViewer: true,
    requiresAdmin: true,
    usesRepository: true,
    writesImplemented: true,
    notes: "ADMIN/SUPPORT-only insight answer hide moves approved/submitted short answers to HIDDEN and writes an audit event without mutating the parent insight unless separately actioned."
  },
  "POST /api/admin/pricing": {
    classification: "transaction_ready",
    requiresViewer: true,
    requiresAdmin: true,
    usesRepository: true,
    writesImplemented: true,
    notes: "ADMIN-only pricing rule creation persists a PricingRule and audit event without mutating payments, wallet transactions, conversations, cancellations, attendance, payout, or settlement data."
  },
  "PATCH /api/admin/pricing/[ruleId]": {
    classification: "transaction_ready",
    requiresViewer: true,
    requiresAdmin: true,
    usesRepository: true,
    writesImplemented: true,
    notes: "ADMIN-only pricing rule update changes the PricingRule and writes audit without retroactive order, payment, wallet, conversation, cancellation, attendance, payout, or settlement mutation."
  },
  "POST /api/admin/pricing/[ruleId]/deactivate": {
    classification: "transaction_ready",
    requiresViewer: true,
    requiresAdmin: true,
    usesRepository: true,
    writesImplemented: true,
    notes: "ADMIN-only pricing rule deactivation archives the PricingRule and writes audit without changing historical transactions or session data."
  },
  "POST /api/admin/categories": {
    classification: "transaction_ready",
    requiresViewer: true,
    requiresAdmin: true,
    usesRepository: true,
    writesImplemented: true,
    notes: "ADMIN-only category creation persists JobCategory metadata and audit without mutating existing profiles, insights, pricing rules, conversations, payments, or wallet data."
  },
  "PATCH /api/admin/categories/[categoryId]": {
    classification: "transaction_ready",
    requiresViewer: true,
    requiresAdmin: true,
    usesRepository: true,
    writesImplemented: true,
    notes: "ADMIN-only category update changes taxonomy metadata and writes audit without rewriting linked profile, insight, pricing, or analytics history."
  },
  "POST /api/admin/categories/[categoryId]/archive": {
    classification: "transaction_ready",
    requiresViewer: true,
    requiresAdmin: true,
    usesRepository: true,
    writesImplemented: true,
    notes: "ADMIN-only category archive soft-archives the category, disables visibility flags, writes audit, and does not delete linked records."
  },
  "POST /api/admin/categories/[categoryId]/restore": {
    classification: "transaction_ready",
    requiresViewer: true,
    requiresAdmin: true,
    usesRepository: true,
    writesImplemented: true,
    notes: "ADMIN-only category restore clears archivedAt and writes audit; visibility flags remain explicit admin-controlled fields."
  },
  "POST /api/admin/content": {
    classification: "transaction_ready",
    requiresViewer: true,
    requiresAdmin: true,
    usesRepository: true,
    writesImplemented: true,
    notes: "ADMIN-only content entry creation persists platform/managed content and writes audit without mutating UGC, payments, wallet, conversations, pricing, or categories."
  },
  "PATCH /api/admin/content/[contentId]": {
    classification: "transaction_ready",
    requiresViewer: true,
    requiresAdmin: true,
    usesRepository: true,
    writesImplemented: true,
    notes: "ADMIN-only content entry update changes editable platform/managed content and writes audit. Non-editable entries are denied and UGC body text is not rewritten."
  },
  "POST /api/admin/content/[contentId]/archive": {
    classification: "transaction_ready",
    requiresViewer: true,
    requiresAdmin: true,
    usesRepository: true,
    writesImplemented: true,
    notes: "ADMIN-only content archive soft-archives ContentEntry rows and writes audit without hard-deleting content or touching UGC moderation rows."
  },
  "POST /api/admin/content/[contentId]/restore": {
    classification: "transaction_ready",
    requiresViewer: true,
    requiresAdmin: true,
    usesRepository: true,
    writesImplemented: true,
    notes: "ADMIN-only content restore returns archived ContentEntry rows to DRAFT and writes audit; publication remains an explicit update decision."
  }
} satisfies Record<string, ApiEndpointClassification>;
