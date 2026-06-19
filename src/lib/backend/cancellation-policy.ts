import type { SafeConversationRecord } from "./repositories/conversation";

export const CANCELLATION_CREDIT_RATE_BPS_BEFORE_CONFIRMED = 9000;
export const CANCELLATION_CREDIT_RATE_BPS_AFTER_CONFIRMED = 5000;
export const CANCELLATION_RETAINED_RATE_BPS_FULL = 10000;
export const CANCELLATION_NEAR_SESSION_THRESHOLD_HOURS = 24;

const BPS_DENOMINATOR = 10000;

export type RequesterCancellationStage =
  | "BEFORE_TIME_PROPOSAL"
  | "AFTER_TIME_PROPOSAL_BEFORE_SELECTION"
  | "AFTER_CONFIRMED_SESSION"
  | "NEAR_SESSION_START";

export type RequesterCancellationPolicy =
  | {
      allowed: true;
      status: "COMPLETED" | "UNDER_SUPPORT_REVIEW";
      stage: RequesterCancellationStage;
      eligiblePaidAmountToman: number;
      creditRateBps: number;
      retainedRateBps: number;
      walletCreditAmountToman: number;
      platformHandlingAmountToman: number;
      refundDestination: "WALLET" | "NONE";
      supportReviewRequired: boolean;
      hoursUntilSession: number | null;
      supportReviewReason: string | null;
      isLateRequesterCancellation: boolean;
    }
  | {
      allowed: false;
      reason:
        | "conversation_already_terminal"
        | "session_already_completed"
        | "attendance_already_verified"
        | "unsupported_state";
    };

type CancellationPolicyConversation = Pick<
  SafeConversationRecord,
  | "status"
  | "paymentRequirement"
  | "confirmedAt"
  | "completedAt"
  | "cancelledAt"
  | "expiredAt"
  | "rejectedAt"
  | "timesProposedAt"
  | "proposedTimes"
  | "selectedTime"
  | "payment"
  | "attendanceVerification"
>;

function calculateBpsAmount(amountToman: number, rateBps: number) {
  return Math.floor((amountToman * rateBps) / BPS_DENOMINATOR);
}

function calculateHoursUntilSession(conversation: CancellationPolicyConversation, now: Date) {
  if (!conversation.selectedTime?.startsAt) {
    return null;
  }

  const hours = (conversation.selectedTime.startsAt.getTime() - now.getTime()) / (60 * 60 * 1000);
  return Number(hours.toFixed(2));
}

function getEligiblePaidAmountToman(conversation: CancellationPolicyConversation) {
  if (conversation.paymentRequirement === "FREE_NOT_REQUIRED") {
    return 0;
  }

  if (!conversation.payment) {
    return 0;
  }

  if (conversation.payment.requirement !== "PAYMENT_REQUIRED") {
    return 0;
  }

  if (conversation.payment.status !== "PAID" || !conversation.payment.finalizedAt) {
    return 0;
  }

  return Math.max(0, conversation.payment.amountToman);
}

function hasTimeProposal(conversation: CancellationPolicyConversation) {
  return Boolean(conversation.timesProposedAt) || conversation.proposedTimes.length > 0;
}

export function calculateRequesterCancellationPolicy(
  conversation: CancellationPolicyConversation,
  now: Date
): RequesterCancellationPolicy {
  if (conversation.cancelledAt || conversation.expiredAt || conversation.rejectedAt || conversation.status === "CANCELLED" || conversation.status === "EXPIRED" || conversation.status === "REJECTED" || conversation.status === "REFUNDED") {
    return {
      allowed: false,
      reason: "conversation_already_terminal"
    };
  }

  if (conversation.completedAt || conversation.status === "COMPLETED") {
    return {
      allowed: false,
      reason: "session_already_completed"
    };
  }

  if (conversation.attendanceVerification?.status === "VERIFIED" || conversation.attendanceVerification?.verifiedAt) {
    return {
      allowed: false,
      reason: "attendance_already_verified"
    };
  }

  const eligiblePaidAmountToman = getEligiblePaidAmountToman(conversation);
  const hoursUntilSession = calculateHoursUntilSession(conversation, now);

  if (conversation.status === "CONFIRMED" || conversation.confirmedAt) {
    if (hoursUntilSession !== null && hoursUntilSession <= CANCELLATION_NEAR_SESSION_THRESHOLD_HOURS) {
      return {
        allowed: true,
        status: "UNDER_SUPPORT_REVIEW",
        stage: "NEAR_SESSION_START",
        eligiblePaidAmountToman,
        creditRateBps: 0,
        retainedRateBps: CANCELLATION_RETAINED_RATE_BPS_FULL,
        walletCreditAmountToman: 0,
        platformHandlingAmountToman: eligiblePaidAmountToman,
        refundDestination: "NONE",
        supportReviewRequired: true,
        hoursUntilSession,
        supportReviewReason: "near_session_start",
        isLateRequesterCancellation: true
      };
    }

    const walletCreditAmountToman = calculateBpsAmount(
      eligiblePaidAmountToman,
      CANCELLATION_CREDIT_RATE_BPS_AFTER_CONFIRMED
    );

    return {
      allowed: true,
      status: "COMPLETED",
      stage: "AFTER_CONFIRMED_SESSION",
      eligiblePaidAmountToman,
      creditRateBps: CANCELLATION_CREDIT_RATE_BPS_AFTER_CONFIRMED,
      retainedRateBps: BPS_DENOMINATOR - CANCELLATION_CREDIT_RATE_BPS_AFTER_CONFIRMED,
      walletCreditAmountToman,
      platformHandlingAmountToman: eligiblePaidAmountToman - walletCreditAmountToman,
      refundDestination: walletCreditAmountToman > 0 ? "WALLET" : "NONE",
      supportReviewRequired: false,
      hoursUntilSession,
      supportReviewReason: null,
      isLateRequesterCancellation: false
    };
  }

  const walletCreditAmountToman = calculateBpsAmount(
    eligiblePaidAmountToman,
    CANCELLATION_CREDIT_RATE_BPS_BEFORE_CONFIRMED
  );

  return {
    allowed: true,
    status: "COMPLETED",
    stage: hasTimeProposal(conversation) ? "AFTER_TIME_PROPOSAL_BEFORE_SELECTION" : "BEFORE_TIME_PROPOSAL",
    eligiblePaidAmountToman,
    creditRateBps: CANCELLATION_CREDIT_RATE_BPS_BEFORE_CONFIRMED,
    retainedRateBps: BPS_DENOMINATOR - CANCELLATION_CREDIT_RATE_BPS_BEFORE_CONFIRMED,
    walletCreditAmountToman,
    platformHandlingAmountToman: eligiblePaidAmountToman - walletCreditAmountToman,
    refundDestination: walletCreditAmountToman > 0 ? "WALLET" : "NONE",
    supportReviewRequired: false,
    hoursUntilSession,
    supportReviewReason: null,
    isLateRequesterCancellation: false
  };
}
