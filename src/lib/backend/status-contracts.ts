export const profileStatusMap = {
  none: "NONE",
  draft: "DRAFT",
  pending_review: "PENDING_REVIEW",
  needs_changes: "NEEDS_CHANGES",
  active: "ACTIVE",
  inactive: "INACTIVE"
} as const;

export const experienceCapabilityStatusMap = {
  none: "NOT_STARTED",
  draft: "DRAFT",
  pending_review: "PENDING_REVIEW",
  needs_changes: "NEEDS_CHANGES",
  active: "ACTIVE",
  inactive: "INACTIVE"
} as const;

export const conversationStatusMap = {
  pending_provider_response: "AWAITING_TIME_PROPOSAL",
  times_proposed: "TIMES_PROPOSED",
  pending_payment: "AWAITING_PAYMENT",
  payment_not_required: "PAYMENT_FINALIZED",
  payment_processing: "PAYMENT_PROCESSING",
  new_time_requested: "NEW_TIME_REQUESTED",
  confirmed: "CONFIRMED",
  completed: "COMPLETED",
  rejected: "REJECTED",
  expired: "EXPIRED",
  cancelled: "CANCELLED",
  refunded: "REFUNDED"
} as const;

export const paymentStatusMap = {
  NOT_REQUIRED: "NOT_REQUIRED",
  UNPAID: "UNPAID",
  PENDING_REVIEW: "PENDING_REVIEW",
  PARTIALLY_COVERED_BY_WALLET: "PROCESSING",
  FULLY_COVERED_BY_WALLET: "PAID",
  PAID: "PAID",
  PROCESSING: "PROCESSING",
  FAILED: "FAILED",
  REFUND_PENDING: "REFUND_PENDING",
  REFUNDED: "REFUNDED"
} as const;

export const manualPaymentStatusMap = {
  NOT_REQUIRED: "NOT_REQUIRED",
  DRAFT: "DRAFT",
  SUBMITTED: "SUBMITTED",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  NEEDS_REVIEW: "NEEDS_REVIEW"
} as const;

export const proposedTimeStatusMap = {
  ACTIVE: "ACTIVE",
  SUPERSEDED: "SUPERSEDED",
  SELECTED: "SELECTED"
} as const;

export const newTimeRequestStatusMap = {
  requested: "REQUESTED",
  fulfilled: "FULFILLED",
  cancelled: "CANCELLED",
  expired: "EXPIRED"
} as const;

export const attendanceVerificationStatusMap = {
  NOT_REQUIRED: "NOT_REQUIRED",
  PENDING: "PENDING",
  VERIFIED: "VERIFIED",
  FAILED: "FAILED",
  EXPIRED: "EXPIRED",
  NEEDS_REVIEW: "NEEDS_REVIEW"
} as const;

export const cancellationStageMap = {
  before_time_proposal: "BEFORE_TIME_PROPOSAL",
  after_time_proposal_before_selection: "AFTER_TIME_PROPOSAL_BEFORE_SELECTION",
  after_confirmed_session: "AFTER_CONFIRMED_SESSION",
  near_session_start: "NEAR_SESSION_START",
  provider_fault: "PROVIDER_FAULT",
  platform_fault: "PLATFORM_FAULT"
} as const;

export const cancellationStatusMap = {
  requested: "REQUESTED",
  completed: "COMPLETED",
  under_support_review: "UNDER_SUPPORT_REVIEW",
  rejected: "REJECTED"
} as const;

export const walletTransactionStatusMap = {
  pending: "PENDING",
  completed: "COMPLETED",
  failed: "FAILED",
  cancelled: "CANCELLED"
} as const;

export const withdrawalStatusMap = {
  requested: "REQUESTED",
  processing: "PROCESSING",
  paid: "PAID",
  failed: "FAILED",
  cancelled: "CANCELLED"
} as const;

export const notificationStatusMap = {
  unread: "UNREAD",
  read: "READ"
} as const;

export const insightStatusMap = {
  draft: "DRAFT",
  published: "PUBLISHED",
  retracted: "HIDDEN"
} as const;

export const insightAnswerStatusMap = {
  draft: "DRAFT",
  submitted: "SUBMITTED",
  published: "APPROVED",
  rejected: "REJECTED",
  retracted: "HIDDEN"
} as const;

export const backendStatusContract = {
  profileStatusMap,
  experienceCapabilityStatusMap,
  conversationStatusMap,
  paymentStatusMap,
  manualPaymentStatusMap,
  proposedTimeStatusMap,
  newTimeRequestStatusMap,
  attendanceVerificationStatusMap,
  cancellationStageMap,
  cancellationStatusMap,
  walletTransactionStatusMap,
  withdrawalStatusMap,
  notificationStatusMap,
  insightStatusMap,
  insightAnswerStatusMap
} as const;
