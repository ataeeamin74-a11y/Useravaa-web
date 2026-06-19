import { readOnlyRepositoryOperation, repositoryNotImplemented } from "./types";
import { Prisma } from "@prisma/client";
import type { UseravaaTransactionClient } from "../db/transaction";

export const safeConversationSelect = Prisma.validator<Prisma.ConversationRequestSelect>()({
  id: true,
  requesterId: true,
  providerId: true,
  experienceProfileId: true,
  duration: true,
  priceToman: true,
  status: true,
  paymentRequirement: true,
  requestTopic: true,
  requestNote: true,
  providerVisibleAt: true,
  timesProposedAt: true,
  requesterSelectionDeadlineAt: true,
  selectedTimeId: true,
  selectedAt: true,
  paymentFinalizedAt: true,
  freeFinalizedAt: true,
  confirmedAt: true,
  completedAt: true,
  rejectedAt: true,
  expiredAt: true,
  cancelledAt: true,
  createdAt: true,
  updatedAt: true,
  requester: {
    select: {
      id: true,
      displayName: true,
      avatarUrl: true
    }
  },
  provider: {
    select: {
      id: true,
      displayName: true,
      avatarUrl: true
    }
  },
  selectedTime: {
    select: {
      id: true,
      startsAt: true,
      shamsiDateLabel: true,
      timeLabel: true,
      status: true,
      version: true
    }
  },
  proposedTimes: {
    select: {
      id: true,
      proposalSetId: true,
      version: true,
      startsAt: true,
      shamsiDateLabel: true,
      timeLabel: true,
      status: true
    },
    orderBy: [{ version: "desc" }, { startsAt: "asc" }]
  },
  payment: {
    select: {
      id: true,
      method: true,
      requirement: true,
      status: true,
      amountToman: true,
      walletDeductionToman: true,
      gatewayPayableToman: true,
      finalizedAt: true,
      failedAt: true,
      refundedAt: true,
      manualReview: {
        select: {
          id: true,
          status: true,
          referenceNumber: true,
          receiptFileName: true,
          receiptMimeType: true,
          receiptSizeBytes: true,
          submittedAt: true,
          reviewedAt: true,
          rejectionReason: true
        }
      }
    }
  },
  attendanceVerification: {
    select: {
      id: true,
      status: true,
      codeGeneratedAt: true,
      codeExpiresAt: true,
      submittedAt: true,
      attempts: true,
      verifiedAt: true,
      failedAt: true,
      needsReviewAt: true
    }
  },
  cancellations: {
    select: {
      id: true,
      cancelledByRole: true,
      status: true,
      stage: true,
      reasonCode: true,
      refundRateBps: true,
      refundAmountToman: true,
      refundDestination: true,
      isLateRequesterCancellation: true,
      createdAt: true,
      completedAt: true
    },
    orderBy: { createdAt: "desc" }
  }
});

export type SafeConversationRecord = Prisma.ConversationRequestGetPayload<{
  select: typeof safeConversationSelect;
}>;

export type RequestCreationPaymentMethod = "ONLINE" | "CARD_TO_CARD" | "FREE";

export type ConversationCreationInput = {
  requesterId: string;
  providerId: string;
  experienceProfileId: string;
  durationMinutes: 30 | 60;
  requestTopic: string;
  requestNote: string;
  paymentMethod: RequestCreationPaymentMethod;
  amountToman: number;
  now: Date;
};

export type RequestableExperienceProfile = {
  id: string;
  ownerId: string;
  status: "NOT_STARTED" | "DRAFT" | "PENDING_REVIEW" | "NEEDS_CHANGES" | "ACTIVE" | "INACTIVE";
  freeHelp: boolean;
  price30Toman: number | null;
  price60Toman: number | null;
  owner: {
    id: string;
    displayName: string;
  };
};

function participantWhere(viewerId: string, conversationId?: string) {
  return {
    ...(conversationId ? { id: conversationId } : {}),
    OR: [
      { requesterId: viewerId },
      {
        providerId: viewerId,
        providerVisibleAt: {
          not: null
        }
      }
    ]
  };
}

function durationToPrisma(durationMinutes: 30 | 60) {
  return durationMinutes === 60 ? "MIN_60" : "MIN_30";
}

function getPaymentStatusForCreation(paymentMethod: RequestCreationPaymentMethod) {
  if (paymentMethod === "FREE") {
    return "NOT_REQUIRED";
  }

  if (paymentMethod === "ONLINE") {
    return "REQUIRES_GATEWAY_PAYMENT";
  }

  return "CHECKOUT_CREATED";
}

function getConversationStatusForCreation(paymentMethod: RequestCreationPaymentMethod) {
  return paymentMethod === "FREE" ? "AWAITING_TIME_PROPOSAL" : "AWAITING_PAYMENT";
}

export const conversationRepository = {
  methods: {
    findExperienceProfileForRequest: "read_only_persistent",
    listForViewer: "read_only_persistent",
    getForViewer: "read_only_persistent",
    createConversationWithInitialPayment: "database_persistent",
    create: "database_persistent"
  },
  async findExperienceProfileForRequest(profileId: string, tx: UseravaaTransactionClient) {
    return tx.experienceProfile.findUnique({
      where: { id: profileId },
      select: {
        id: true,
        ownerId: true,
        status: true,
        freeHelp: true,
        price30Toman: true,
        price60Toman: true,
        owner: {
          select: {
            id: true,
            displayName: true
          }
        }
      }
    }) as Promise<RequestableExperienceProfile | null>;
  },
  listForViewer(viewerId: string) {
    return readOnlyRepositoryOperation("conversation", "listForViewer", (db) =>
      db.conversationRequest.findMany({
        where: participantWhere(viewerId),
        select: safeConversationSelect,
        orderBy: { updatedAt: "desc" }
      })
    );
  },
  getForViewer(viewerId: string, conversationId: string) {
    return readOnlyRepositoryOperation("conversation", "getForViewer", (db) =>
      db.conversationRequest.findFirst({
        where: participantWhere(viewerId, conversationId),
        select: safeConversationSelect
      })
    );
  },
  async createConversationWithInitialPayment(input: ConversationCreationInput, tx: UseravaaTransactionClient) {
    const conversationStatus = getConversationStatusForCreation(input.paymentMethod);
    const isFreeRequest = input.paymentMethod === "FREE";

    const conversation = await tx.conversationRequest.create({
      data: {
        requesterId: input.requesterId,
        providerId: input.providerId,
        experienceProfileId: input.experienceProfileId,
        duration: durationToPrisma(input.durationMinutes),
        priceToman: input.amountToman,
        status: conversationStatus,
        paymentRequirement: isFreeRequest ? "FREE_NOT_REQUIRED" : "PAYMENT_REQUIRED",
        requestTopic: input.requestTopic,
        requestNote: input.requestNote,
        providerVisibleAt: isFreeRequest ? input.now : null,
        paymentFinalizedAt: isFreeRequest ? input.now : null,
        freeFinalizedAt: isFreeRequest ? input.now : null
      },
      select: {
        id: true
      }
    });

    const payment = await tx.payment.create({
      data: {
        conversationId: conversation.id,
        payerId: input.requesterId,
        method: input.paymentMethod,
        requirement: isFreeRequest ? "FREE_NOT_REQUIRED" : "PAYMENT_REQUIRED",
        status: getPaymentStatusForCreation(input.paymentMethod),
        amountToman: input.amountToman,
        walletDeductionToman: 0,
        gatewayPayableToman: isFreeRequest ? 0 : input.amountToman,
        providerVisibleAfterPaid: true,
        finalizedAt: isFreeRequest ? input.now : null
      },
      select: {
        id: true
      }
    });

    if (input.paymentMethod === "CARD_TO_CARD") {
      await tx.manualPaymentReview.create({
        data: {
          paymentId: payment.id,
          status: "DRAFT"
        }
      });
    }

    return tx.conversationRequest.findFirstOrThrow({
      where: {
        id: conversation.id,
        requesterId: input.requesterId
      },
      select: safeConversationSelect
    }) as Promise<SafeConversationRecord>;
  },
  create() {
    return repositoryNotImplemented("conversation", "create");
  }
} as const;
