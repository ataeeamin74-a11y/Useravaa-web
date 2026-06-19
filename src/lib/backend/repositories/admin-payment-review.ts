import type { UseravaaTransactionClient } from "../db/transaction";
import { readOnlyRepositoryOperation } from "./types";

export type AdminPaymentReviewActionInput = {
  paymentId: string;
  adminId: string;
  adminNote?: string;
  rejectionReason?: string;
  now: Date;
};

const adminPaymentReviewSelect = {
  id: true,
  status: true,
  referenceNumber: true,
  receiptUrl: true,
  receiptFileName: true,
  receiptMimeType: true,
  receiptSizeBytes: true,
  submittedAt: true,
  reviewedAt: true,
  reviewedByAdminId: true,
  adminNote: true,
  rejectionReason: true,
  payment: {
    select: {
      id: true,
      conversationId: true,
      payerId: true,
      method: true,
      requirement: true,
      status: true,
      amountToman: true,
      finalizedAt: true,
      failedAt: true,
      providerVisibleAfterPaid: true,
      conversation: {
        select: {
          id: true,
          requesterId: true,
          providerId: true,
          status: true,
          requestTopic: true,
          providerVisibleAt: true,
          paymentFinalizedAt: true,
          confirmedAt: true,
          selectedTimeId: true,
          proposedTimes: {
            select: {
              id: true
            },
            take: 1
          },
          attendanceVerification: {
            select: {
              id: true
            }
          },
          walletTransactions: {
            select: {
              id: true
            },
            take: 1
          },
          createdAt: true
        }
      }
    }
  }
} as const;

export const adminPaymentReviewRepository = {
  methods: {
    listPending: "read_only_persistent",
    listRecent: "read_only_persistent",
    getByPaymentId: "read_only_persistent",
    findReviewForAdminAction: "read_only_persistent",
    approve: "database_persistent",
    reject: "database_persistent"
  },
  listPending() {
    return readOnlyRepositoryOperation("admin_payment", "listPending", (db) =>
      db.manualPaymentReview.findMany({
        where: {
          status: {
            in: ["SUBMITTED", "NEEDS_REVIEW"]
          }
        },
        select: adminPaymentReviewSelect,
        orderBy: { submittedAt: "asc" }
      })
    );
  },
  listRecent() {
    return readOnlyRepositoryOperation("admin_payment", "listRecent", (db) =>
      db.manualPaymentReview.findMany({
        select: adminPaymentReviewSelect,
        orderBy: { updatedAt: "desc" },
        take: 100
      })
    );
  },
  getByPaymentId(paymentId: string) {
    return readOnlyRepositoryOperation("admin_payment", "getByPaymentId", (db) =>
      db.manualPaymentReview.findUnique({
        where: {
          paymentId
        },
        select: adminPaymentReviewSelect
      })
    );
  },
  async findReviewForAdminAction(paymentId: string, tx: UseravaaTransactionClient) {
    return tx.manualPaymentReview.findUnique({
      where: {
        paymentId
      },
      select: adminPaymentReviewSelect
    });
  },
  async approve(input: AdminPaymentReviewActionInput, tx: UseravaaTransactionClient) {
    const review = await tx.manualPaymentReview.update({
      where: {
        paymentId: input.paymentId
      },
      data: {
        status: "APPROVED",
        reviewedAt: input.now,
        reviewedByAdminId: input.adminId,
        adminNote: input.adminNote ?? null,
        rejectionReason: null
      },
      select: {
        payment: {
          select: {
            conversationId: true
          }
        }
      }
    });

    await tx.payment.update({
      where: {
        id: input.paymentId
      },
      data: {
        status: "PAID",
        finalizedAt: input.now,
        failedAt: null
      }
    });

    await tx.conversationRequest.update({
      where: {
        id: review.payment.conversationId
      },
      data: {
        status: "AWAITING_TIME_PROPOSAL",
        providerVisibleAt: input.now,
        paymentFinalizedAt: input.now
      }
    });

    return tx.manualPaymentReview.findUniqueOrThrow({
      where: {
        paymentId: input.paymentId
      },
      select: adminPaymentReviewSelect
    });
  },
  async reject(input: AdminPaymentReviewActionInput, tx: UseravaaTransactionClient) {
    const review = await tx.manualPaymentReview.update({
      where: {
        paymentId: input.paymentId
      },
      data: {
        status: "REJECTED",
        reviewedAt: input.now,
        reviewedByAdminId: input.adminId,
        adminNote: input.adminNote ?? null,
        rejectionReason: input.rejectionReason ?? null
      },
      select: {
        payment: {
          select: {
            conversationId: true
          }
        }
      }
    });

    await tx.payment.update({
      where: {
        id: input.paymentId
      },
      data: {
        status: "FAILED",
        finalizedAt: null,
        failedAt: input.now
      }
    });

    await tx.conversationRequest.update({
      where: {
        id: review.payment.conversationId
      },
      data: {
        status: "PAYMENT_FAILED",
        providerVisibleAt: null,
        paymentFinalizedAt: null
      }
    });

    return tx.manualPaymentReview.findUniqueOrThrow({
      where: {
        paymentId: input.paymentId
      },
      select: adminPaymentReviewSelect
    });
  }
} as const;
