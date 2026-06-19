import type { UseravaaTransactionClient } from "../db/transaction";
import { safeConversationSelect } from "./conversation";
import { readOnlyRepositoryOperation, repositoryNotImplemented } from "./types";

export type ManualPaymentReceiptMetadata = {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
};

export type ManualPaymentSubmissionInput = {
  conversationId: string;
  paymentId: string;
  requesterId: string;
  referenceNumber?: string;
  receipt?: ManualPaymentReceiptMetadata;
  now: Date;
};

export type FreePaymentFinalizationInput = {
  conversationId: string;
  paymentId: string;
  requesterId: string;
  now: Date;
};

const paymentLifecycleSelect = {
  id: true,
  conversationId: true,
  payerId: true,
  method: true,
  requirement: true,
  status: true,
  amountToman: true,
  walletDeductionToman: true,
  gatewayPayableToman: true,
  providerVisibleAfterPaid: true,
  finalizedAt: true,
  failedAt: true,
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
      reviewedByAdminId: true,
      adminNote: true,
      rejectionReason: true
    }
  },
  conversation: {
    select: {
      id: true,
      requesterId: true,
      providerId: true,
      status: true,
      paymentRequirement: true,
      providerVisibleAt: true,
      selectedTimeId: true,
      selectedAt: true,
      paymentFinalizedAt: true,
      freeFinalizedAt: true,
      confirmedAt: true,
      cancelledAt: true,
      expiredAt: true,
      rejectedAt: true
    }
  }
} as const;

export const paymentRepository = {
  methods: {
    getForConversation: "read_only_persistent",
    findPaymentForRequesterManualSubmission: "read_only_persistent",
    submitManualPayment: "database_persistent",
    findFreePaymentForRequesterFinalization: "read_only_persistent",
    finalizeFreePayment: "database_persistent",
    createOnlinePayment: "contract_only"
  },
  getForConversation(conversationId: string) {
    return readOnlyRepositoryOperation("payment", "getForConversation", (db) =>
      db.payment.findUnique({
        where: { conversationId },
        select: {
          id: true,
          conversationId: true,
          payerId: true,
          method: true,
          requirement: true,
          status: true,
          amountToman: true,
          walletDeductionToman: true,
          gatewayPayableToman: true,
          finalizedAt: true,
          failedAt: true,
          refundedAt: true,
          manualReview: true
        }
      })
    );
  },
  async findPaymentForRequesterManualSubmission(
    conversationId: string,
    requesterId: string,
    tx: UseravaaTransactionClient
  ) {
    return tx.payment.findFirst({
      where: {
        conversationId,
        payerId: requesterId,
        conversation: {
          requesterId
        }
      },
      select: paymentLifecycleSelect
    });
  },
  async submitManualPayment(input: ManualPaymentSubmissionInput, tx: UseravaaTransactionClient) {
    await tx.payment.update({
      where: {
        id: input.paymentId
      },
      data: {
        status: "PENDING_REVIEW",
        failedAt: null
      }
    });

    await tx.manualPaymentReview.upsert({
      where: {
        paymentId: input.paymentId
      },
      create: {
        paymentId: input.paymentId,
        status: "SUBMITTED",
        referenceNumber: input.referenceNumber,
        receiptFileName: input.receipt?.fileName,
        receiptMimeType: input.receipt?.mimeType,
        receiptSizeBytes: input.receipt?.sizeBytes,
        submittedAt: input.now
      },
      update: {
        status: "SUBMITTED",
        referenceNumber: input.referenceNumber ?? null,
        receiptFileName: input.receipt?.fileName ?? null,
        receiptMimeType: input.receipt?.mimeType ?? null,
        receiptSizeBytes: input.receipt?.sizeBytes ?? null,
        receiptUrl: null,
        submittedAt: input.now,
        reviewedAt: null,
        reviewedByAdminId: null,
        adminNote: null,
        rejectionReason: null
      }
    });

    await tx.conversationRequest.update({
      where: {
        id: input.conversationId
      },
      data: {
        status: "PAYMENT_PROCESSING",
        providerVisibleAt: null,
        paymentFinalizedAt: null
      }
    });

    return tx.conversationRequest.findFirstOrThrow({
      where: {
        id: input.conversationId,
        requesterId: input.requesterId
      },
      select: safeConversationSelect
    });
  },
  async findFreePaymentForRequesterFinalization(
    conversationId: string,
    requesterId: string,
    tx: UseravaaTransactionClient
  ) {
    return tx.payment.findFirst({
      where: {
        conversationId,
        payerId: requesterId,
        conversation: {
          requesterId
        }
      },
      select: paymentLifecycleSelect
    });
  },
  async finalizeFreePayment(input: FreePaymentFinalizationInput, tx: UseravaaTransactionClient) {
    await tx.payment.update({
      where: {
        id: input.paymentId
      },
      data: {
        status: "NOT_REQUIRED",
        finalizedAt: input.now,
        failedAt: null
      }
    });

    await tx.conversationRequest.update({
      where: {
        id: input.conversationId
      },
      data: {
        status: "AWAITING_TIME_PROPOSAL",
        providerVisibleAt: input.now,
        paymentFinalizedAt: input.now,
        freeFinalizedAt: input.now
      }
    });

    return tx.conversationRequest.findFirstOrThrow({
      where: {
        id: input.conversationId,
        requesterId: input.requesterId
      },
      select: safeConversationSelect
    });
  },
  createOnlinePayment() {
    return repositoryNotImplemented("payment", "createOnlinePayment");
  }
} as const;
