export type BackendImplementationClassification =
  | "db_smoke_tested"
  | "migration_ready"
  | "schema_ready"
  | "prisma_client_ready"
  | "repository_ready"
  | "read_only_persistent"
  | "transaction_ready"
  | "contract_ready"
  | "write_persistent"
  | "api_skeleton_ready"
  | "contract_only"
  | "provider_not_configured"
  | "not_implemented";

export type BackendAreaClassification = {
  classification: BackendImplementationClassification;
  prismaSchemaExists: boolean;
  prismaClientBoundaryExists: boolean;
  repositoryBoundaryExists: boolean;
  apiRouteExists: boolean;
  readsUseRepository: boolean;
  writesImplemented: boolean;
  productionProviderConfigured: boolean;
  blocksProductionLaunch: boolean;
  notes: string;
};

export const backendImplementationClassification = {
  authSessionBridge: {
    classification: "contract_only",
    prismaSchemaExists: true,
    prismaClientBoundaryExists: false,
    repositoryBoundaryExists: false,
    apiRouteExists: false,
    readsUseRepository: false,
    writesImplemented: false,
    productionProviderConfigured: false,
    blocksProductionLaunch: true,
    notes: "Provider-neutral session boundary exists, but production auth provider selection remains out of scope."
  },
  profile: {
    classification: "read_only_persistent",
    prismaSchemaExists: true,
    prismaClientBoundaryExists: true,
    repositoryBoundaryExists: true,
    apiRouteExists: true,
    readsUseRepository: true,
    writesImplemented: false,
    productionProviderConfigured: false,
    blocksProductionLaunch: true,
    notes: "GET /api/profile/me is repository-backed; profile writes remain contract-only."
  },
  experienceProfile: {
    classification: "repository_ready",
    prismaSchemaExists: true,
    prismaClientBoundaryExists: true,
    repositoryBoundaryExists: true,
    apiRouteExists: false,
    readsUseRepository: true,
    writesImplemented: false,
    productionProviderConfigured: false,
    blocksProductionLaunch: true,
    notes: "Public experience profile repository reads are ready; no production write workflow was added."
  },
  discoverProfileRead: {
    classification: "repository_ready",
    prismaSchemaExists: true,
    prismaClientBoundaryExists: true,
    repositoryBoundaryExists: true,
    apiRouteExists: false,
    readsUseRepository: true,
    writesImplemented: false,
    productionProviderConfigured: false,
    blocksProductionLaunch: true,
    notes: "Discover/profile read repository exists; public API route wiring is deferred."
  },
  requestConversation: {
    classification: "transaction_ready",
    prismaSchemaExists: true,
    prismaClientBoundaryExists: true,
    repositoryBoundaryExists: true,
    apiRouteExists: true,
    readsUseRepository: true,
    writesImplemented: true,
    productionProviderConfigured: false,
    blocksProductionLaunch: true,
    notes: "POST /api/conversations now validates, derives requester/provider/amount server-side, and creates the request plus initial payment/free record in a transaction. Runtime execution still needs a supported Prisma adapter or Accelerate URL."
  },
  initialPaymentRecordCreation: {
    classification: "transaction_ready",
    prismaSchemaExists: true,
    prismaClientBoundaryExists: true,
    repositoryBoundaryExists: true,
    apiRouteExists: true,
    readsUseRepository: false,
    writesImplemented: true,
    productionProviderConfigured: false,
    blocksProductionLaunch: true,
    notes: "Initial Payment records are created only inside the request creation transaction; gateway/manual proof submission remains deferred."
  },
  freeRequestBranch: {
    classification: "transaction_ready",
    prismaSchemaExists: true,
    prismaClientBoundaryExists: true,
    repositoryBoundaryExists: true,
    apiRouteExists: true,
    readsUseRepository: true,
    writesImplemented: true,
    productionProviderConfigured: false,
    blocksProductionLaunch: true,
    notes: "Free requests create NOT_REQUIRED payment records, and the requester-only free-finalization service can persist provider visibility without creating a confirmed session."
  },
  paidRequestBranch: {
    classification: "transaction_ready",
    prismaSchemaExists: true,
    prismaClientBoundaryExists: true,
    repositoryBoundaryExists: true,
    apiRouteExists: true,
    readsUseRepository: true,
    writesImplemented: true,
    productionProviderConfigured: false,
    blocksProductionLaunch: true,
    notes: "Paid requests create awaiting-payment conversations and initial payment records without fake success, time selection, attendance code, wallet transaction, or provider-ready state."
  },
  participantVisibility: {
    classification: "transaction_ready",
    prismaSchemaExists: true,
    prismaClientBoundaryExists: true,
    repositoryBoundaryExists: true,
    apiRouteExists: true,
    readsUseRepository: true,
    writesImplemented: true,
    productionProviderConfigured: false,
    blocksProductionLaunch: true,
    notes: "Requester reads are immediate; provider reads require providerVisibleAt. Manual approval and free finalization set providerVisibleAt transactionally."
  },
  paymentManualPayment: {
    classification: "transaction_ready",
    prismaSchemaExists: true,
    prismaClientBoundaryExists: true,
    repositoryBoundaryExists: true,
    apiRouteExists: true,
    readsUseRepository: true,
    writesImplemented: true,
    productionProviderConfigured: false,
    blocksProductionLaunch: true,
    notes: "Manual card-to-card submission, approval, and rejection are transaction-ready. Online gateway provider remains not configured."
  },
  proposedTimes: {
    classification: "transaction_ready",
    prismaSchemaExists: true,
    prismaClientBoundaryExists: true,
    repositoryBoundaryExists: true,
    apiRouteExists: true,
    readsUseRepository: true,
    writesImplemented: true,
    productionProviderConfigured: false,
    blocksProductionLaunch: true,
    notes: "Provider-only proposed-time submission is transaction-ready and supersedes previous active options without confirming the session."
  },
  newTimeRequest: {
    classification: "transaction_ready",
    prismaSchemaExists: true,
    prismaClientBoundaryExists: true,
    repositoryBoundaryExists: true,
    apiRouteExists: true,
    readsUseRepository: true,
    writesImplemented: true,
    productionProviderConfigured: false,
    blocksProductionLaunch: true,
    notes: "Requester-only new-time request is transaction-ready and supersedes active options without creating payment, cancellation, or wallet records."
  },
  timeSelection: {
    classification: "transaction_ready",
    prismaSchemaExists: true,
    prismaClientBoundaryExists: true,
    repositoryBoundaryExists: true,
    apiRouteExists: true,
    readsUseRepository: true,
    writesImplemented: true,
    productionProviderConfigured: false,
    blocksProductionLaunch: true,
    notes: "Requester-only active time selection is transaction-ready and persists the confirmed-session transition."
  },
  confirmedSession: {
    classification: "transaction_ready",
    prismaSchemaExists: true,
    prismaClientBoundaryExists: true,
    repositoryBoundaryExists: true,
    apiRouteExists: true,
    readsUseRepository: true,
    writesImplemented: true,
    productionProviderConfigured: false,
    blocksProductionLaunch: true,
    notes: "Confirmed session state is persisted only after requester selects an ACTIVE proposed time."
  },
  attendanceVerification: {
    classification: "transaction_ready",
    prismaSchemaExists: true,
    prismaClientBoundaryExists: true,
    repositoryBoundaryExists: true,
    apiRouteExists: true,
    readsUseRepository: true,
    writesImplemented: true,
    productionProviderConfigured: false,
    blocksProductionLaunch: true,
    notes: "Requester attendance-code service and provider submit-code route are transaction-ready. Provider-facing DTOs exclude raw code/hash fields and no payout/wallet/cancellation flow is triggered."
  },
  cancellation: {
    classification: "transaction_ready",
    prismaSchemaExists: true,
    prismaClientBoundaryExists: true,
    repositoryBoundaryExists: true,
    apiRouteExists: true,
    readsUseRepository: true,
    writesImplemented: true,
    productionProviderConfigured: false,
    blocksProductionLaunch: true,
    notes: "Requester cancellation and admin support-review credit decisions are transaction-ready. Support review can approve wallet credit through the ledger helper or reject without credit, with audit events. Provider cancellation, cash refunds, payout, settlement, and notification delivery remain deferred."
  },
  wallet: {
    classification: "read_only_persistent",
    prismaSchemaExists: true,
    prismaClientBoundaryExists: true,
    repositoryBoundaryExists: true,
    apiRouteExists: true,
    readsUseRepository: true,
    writesImplemented: false,
    productionProviderConfigured: false,
    blocksProductionLaunch: true,
    notes: "GET /api/wallet is repository-backed for the current viewer only."
  },
  walletTransaction: {
    classification: "transaction_ready",
    prismaSchemaExists: true,
    prismaClientBoundaryExists: true,
    repositoryBoundaryExists: true,
    apiRouteExists: false,
    readsUseRepository: true,
    writesImplemented: true,
    productionProviderConfigured: false,
    blocksProductionLaunch: true,
    notes: "Cancellation wallet-credit ledger writes are transaction-ready and update wallet balance only after creating a WalletTransaction. Withdrawal, payout, settlement, payment debit, and provider earning ledger entries remain deferred."
  },
  withdrawal: {
    classification: "repository_ready",
    prismaSchemaExists: true,
    prismaClientBoundaryExists: true,
    repositoryBoundaryExists: true,
    apiRouteExists: true,
    readsUseRepository: true,
    writesImplemented: false,
    productionProviderConfigured: false,
    blocksProductionLaunch: true,
    notes: "Withdrawal repository exists; POST /api/wallet/withdrawals remains contract-only."
  },
  notifications: {
    classification: "read_only_persistent",
    prismaSchemaExists: true,
    prismaClientBoundaryExists: true,
    repositoryBoundaryExists: true,
    apiRouteExists: true,
    readsUseRepository: true,
    writesImplemented: false,
    productionProviderConfigured: false,
    blocksProductionLaunch: true,
    notes: "GET /api/notifications is repository-backed for the current viewer; delivery provider is not configured."
  },
  insights: {
    classification: "read_only_persistent",
    prismaSchemaExists: true,
    prismaClientBoundaryExists: true,
    repositoryBoundaryExists: true,
    apiRouteExists: true,
    readsUseRepository: true,
    writesImplemented: false,
    productionProviderConfigured: false,
    blocksProductionLaunch: true,
    notes: "Public insight reads are repository-backed and remain unauthenticated."
  },
  insightAnswers: {
    classification: "contract_only",
    prismaSchemaExists: true,
    prismaClientBoundaryExists: true,
    repositoryBoundaryExists: true,
    apiRouteExists: true,
    readsUseRepository: false,
    writesImplemented: false,
    productionProviderConfigured: false,
    blocksProductionLaunch: true,
    notes: "Insight answer submission validates/authenticates but does not write yet."
  },
  adminPaymentReview: {
    classification: "transaction_ready",
    prismaSchemaExists: true,
    prismaClientBoundaryExists: true,
    repositoryBoundaryExists: true,
    apiRouteExists: true,
    readsUseRepository: true,
    writesImplemented: true,
    productionProviderConfigured: false,
    blocksProductionLaunch: true,
    notes: "GET/approve/reject manual payment review routes are repository-backed behind ADMIN/SUPPORT, and approve/reject now write minimal audit events in the same transaction."
  },
  adminExperienceProfileReview: {
    classification: "transaction_ready",
    prismaSchemaExists: true,
    prismaClientBoundaryExists: true,
    repositoryBoundaryExists: true,
    apiRouteExists: true,
    readsUseRepository: true,
    writesImplemented: true,
    productionProviderConfigured: false,
    blocksProductionLaunch: true,
    notes: "ADMIN/SUPPORT profile review routes approve, request changes, or hide experience profiles through repository-backed transactions with AdminAuditEvent persistence and no payment, wallet, conversation, session, payout, or account mutation."
  },
  adminInsightModeration: {
    classification: "transaction_ready",
    prismaSchemaExists: true,
    prismaClientBoundaryExists: true,
    repositoryBoundaryExists: true,
    apiRouteExists: true,
    readsUseRepository: true,
    writesImplemented: true,
    productionProviderConfigured: false,
    blocksProductionLaunch: true,
    notes: "ADMIN/SUPPORT insight moderation routes hide, restore, archive, or hide short answers through repository-backed transactions with AdminAuditEvent persistence and no author, profile, payment, wallet, conversation, session, payout, CMS, or analytics mutation."
  },
  adminPricingRules: {
    classification: "transaction_ready",
    prismaSchemaExists: true,
    prismaClientBoundaryExists: true,
    repositoryBoundaryExists: true,
    apiRouteExists: true,
    readsUseRepository: true,
    writesImplemented: true,
    productionProviderConfigured: false,
    blocksProductionLaunch: true,
    notes: "ADMIN-only pricing rule create, update, and deactivate/archive actions persist PricingRule changes with AdminAuditEvent records and do not retroactively mutate payments, wallet transactions, conversations, cancellations, attendance, payout, or settlement data."
  },
  adminCategories: {
    classification: "transaction_ready",
    prismaSchemaExists: true,
    prismaClientBoundaryExists: true,
    repositoryBoundaryExists: true,
    apiRouteExists: true,
    readsUseRepository: true,
    writesImplemented: true,
    productionProviderConfigured: false,
    blocksProductionLaunch: true,
    notes: "ADMIN-only category create, update, archive, and restore actions persist JobCategory taxonomy changes with AdminAuditEvent records. SUPPORT is read-only. Existing profiles, insights, pricing rules, conversations, payments, wallet transactions, payout, and settlement data are not destructively changed."
  },
  adminContent: {
    classification: "transaction_ready",
    prismaSchemaExists: true,
    prismaClientBoundaryExists: true,
    repositoryBoundaryExists: true,
    apiRouteExists: true,
    readsUseRepository: true,
    writesImplemented: true,
    productionProviderConfigured: false,
    blocksProductionLaunch: true,
    notes: "ADMIN-only content entry create, update, archive, and restore actions persist ContentEntry rows with AdminAuditEvent records. SUPPORT is read-only. UGC moderation remains in insight/profile moderation surfaces and user-authored text is not silently rewritten."
  },
  adminAudit: {
    classification: "transaction_ready",
    prismaSchemaExists: true,
    prismaClientBoundaryExists: true,
    repositoryBoundaryExists: true,
    apiRouteExists: false,
    readsUseRepository: true,
    writesImplemented: true,
    productionProviderConfigured: false,
    blocksProductionLaunch: true,
    notes: "AdminAuditEvent persistence exists for payment review, cancellation support-review, experience profile review, and insight moderation actions and powers the admin audit-log read surface. Broader audit coverage remains deferred."
  },
  adminReadModels: {
    classification: "read_only_persistent",
    prismaSchemaExists: true,
    prismaClientBoundaryExists: true,
    repositoryBoundaryExists: true,
    apiRouteExists: false,
    readsUseRepository: true,
    writesImplemented: false,
    productionProviderConfigured: false,
    blocksProductionLaunch: true,
    notes: "Admin/Ops page read models use server-side read-only repository methods behind ADMIN/SUPPORT guards. Payment, cancellation support-review, experience profile review, and insight moderation mutations are handled by separate transaction-ready services."
  }
} satisfies Record<string, BackendAreaClassification>;
