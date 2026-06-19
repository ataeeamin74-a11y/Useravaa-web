import type { SafeConversationRecord } from "../repositories/conversation";

export type ConversationViewerRole = "REQUESTER" | "PROVIDER";

export type ConversationPaymentDto = {
  id: string;
  method: string;
  requirement: string;
  status: string;
  amountToman: number;
  walletDeductionToman: number;
  gatewayPayableToman: number;
  finalizedAt: Date | null;
  failedAt: Date | null;
  refundedAt: Date | null;
  manualReview?: {
    id: string;
    status: string;
    referenceNumber: string | null;
    receiptFileName: string | null;
    receiptMimeType: string | null;
    receiptSizeBytes: number | null;
    submittedAt: Date | null;
    reviewedAt: Date | null;
    rejectionReason: string | null;
  } | null;
};

export type ConversationResponseDto = {
  id: string;
  viewerRole: ConversationViewerRole;
  requesterId: string;
  providerId: string;
  experienceProfileId: string;
  duration: "MIN_30" | "MIN_60";
  durationMinutes: 30 | 60;
  priceToman: number;
  status: string;
  paymentRequirement: string;
  requestTopic: string | null;
  requestNote: string | null;
  providerVisibleAt: Date | null;
  selectedTimeId: string | null;
  selectedAt: Date | null;
  confirmedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  requester: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
  provider: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
  payment: ConversationPaymentDto | null;
  proposedTimes: Array<{
    id: string;
    proposalSetId: string;
    version: number;
    startsAt: Date;
    shamsiDateLabel: string;
    timeLabel: string;
    status: string;
  }>;
  selectedTime: {
    id: string;
    startsAt: Date;
    shamsiDateLabel: string;
    timeLabel: string;
    status: string;
    version: number;
  } | null;
  attendanceVerification: {
    id: string;
    status: string;
    codeGeneratedAt: Date | null;
    codeExpiresAt: Date | null;
    submittedAt: Date | null;
    attempts: number;
    verifiedAt: Date | null;
    failedAt: Date | null;
    needsReviewAt: Date | null;
  } | null;
  cancellations: Array<{
    id: string;
    cancelledByRole: string;
    status: string;
    stage: string;
    reasonCode: string;
    refundRateBps: number;
    refundAmountToman: number;
    refundDestination: string;
    isLateRequesterCancellation: boolean;
    createdAt: Date;
    completedAt: Date | null;
  }>;
  nextRequiredAction: "PAYMENT" | "WAITING_FOR_PROVIDER_TIME_PROPOSAL" | "SELECT_TIME" | "NONE";
  providerReadyToAct: boolean;
};

export function getConversationViewerRole(viewerId: string, conversation: Pick<SafeConversationRecord, "requesterId" | "providerId">): ConversationViewerRole | null {
  if (conversation.requesterId === viewerId) {
    return "REQUESTER";
  }

  if (conversation.providerId === viewerId) {
    return "PROVIDER";
  }

  return null;
}

export function conversationIsVisibleToViewer(viewerId: string, conversation: Pick<SafeConversationRecord, "requesterId" | "providerId" | "providerVisibleAt">) {
  if (conversation.requesterId === viewerId) {
    return true;
  }

  if (conversation.providerId === viewerId) {
    return Boolean(conversation.providerVisibleAt);
  }

  return false;
}

function durationToMinutes(duration: SafeConversationRecord["duration"]): 30 | 60 {
  return duration === "MIN_60" ? 60 : 30;
}

function nextActionFor(conversation: SafeConversationRecord, viewerRole: ConversationViewerRole): ConversationResponseDto["nextRequiredAction"] {
  if ((conversation.status === "AWAITING_PAYMENT" || conversation.status === "PAYMENT_FAILED") && viewerRole === "REQUESTER") {
    return "PAYMENT";
  }

  if (conversation.status === "AWAITING_TIME_PROPOSAL" || conversation.status === "NEW_TIME_REQUESTED") {
    return "WAITING_FOR_PROVIDER_TIME_PROPOSAL";
  }

  if (conversation.status === "TIMES_PROPOSED" && viewerRole === "REQUESTER") {
    return "SELECT_TIME";
  }

  return "NONE";
}

function paymentDtoFor(conversation: SafeConversationRecord, viewerRole: ConversationViewerRole): ConversationPaymentDto | null {
  if (!conversation.payment) {
    return null;
  }

  const basePayment = {
    id: conversation.payment.id,
    method: conversation.payment.method,
    requirement: conversation.payment.requirement,
    status: conversation.payment.status,
    amountToman: conversation.payment.amountToman,
    walletDeductionToman: conversation.payment.walletDeductionToman,
    gatewayPayableToman: conversation.payment.gatewayPayableToman,
    finalizedAt: conversation.payment.finalizedAt,
    failedAt: conversation.payment.failedAt,
    refundedAt: conversation.payment.refundedAt
  };

  if (viewerRole !== "REQUESTER") {
    return basePayment;
  }

  return {
    ...basePayment,
    manualReview: conversation.payment.manualReview
  };
}

function cancellationsDtoFor(conversation: SafeConversationRecord, viewerRole: ConversationViewerRole) {
  return conversation.cancellations.map((cancellation) => {
    if (viewerRole === "REQUESTER") {
      return cancellation;
    }

    return {
      ...cancellation,
      refundRateBps: 0,
      refundAmountToman: 0,
      refundDestination: "NONE"
    };
  });
}

export function toConversationResponseDto(conversation: SafeConversationRecord, viewerId: string): ConversationResponseDto | null {
  const viewerRole = getConversationViewerRole(viewerId, conversation);

  if (!viewerRole || !conversationIsVisibleToViewer(viewerId, conversation)) {
    return null;
  }

  return {
    id: conversation.id,
    viewerRole,
    requesterId: conversation.requesterId,
    providerId: conversation.providerId,
    experienceProfileId: conversation.experienceProfileId,
    duration: conversation.duration,
    durationMinutes: durationToMinutes(conversation.duration),
    priceToman: conversation.priceToman,
    status: conversation.status,
    paymentRequirement: conversation.paymentRequirement,
    requestTopic: conversation.requestTopic,
    requestNote: conversation.requestNote,
    providerVisibleAt: conversation.providerVisibleAt,
    selectedTimeId: conversation.selectedTimeId,
    selectedAt: conversation.selectedAt,
    confirmedAt: conversation.confirmedAt,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
    requester: conversation.requester,
    provider: conversation.provider,
    payment: paymentDtoFor(conversation, viewerRole),
    proposedTimes: conversation.proposedTimes,
    selectedTime: conversation.selectedTime,
    attendanceVerification: conversation.attendanceVerification,
    cancellations: cancellationsDtoFor(conversation, viewerRole),
    nextRequiredAction: nextActionFor(conversation, viewerRole),
    providerReadyToAct:
      viewerRole === "PROVIDER" &&
      (conversation.status === "AWAITING_TIME_PROPOSAL" || conversation.status === "NEW_TIME_REQUESTED")
  };
}

export function toConversationResponseDtos(conversations: SafeConversationRecord[], viewerId: string) {
  return conversations
    .map((conversation) => toConversationResponseDto(conversation, viewerId))
    .filter((conversation): conversation is ConversationResponseDto => Boolean(conversation));
}
