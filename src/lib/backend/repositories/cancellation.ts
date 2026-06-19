import { Prisma } from "@prisma/client";
import type { RequesterCancellationPolicy } from "../cancellation-policy";
import type { UseravaaTransactionClient } from "../db/transaction";
import { safeConversationSelect, type SafeConversationRecord } from "./conversation";
import { readOnlyRepositoryOperation } from "./types";
import { walletTransactionRepository } from "./wallet-transaction";

export type RequesterCancellationInput = {
  conversationId: string;
  requesterId: string;
  paymentId?: string | null;
  reasonCode: string;
  otherReasonText?: string;
  policy: Extract<RequesterCancellationPolicy, { allowed: true }>;
  now: Date;
};

export type AdminCancellationSupportCreditApprovalInput = {
  cancellationId: string;
  adminId: string;
  requesterId: string;
  conversationId: string;
  paymentId: string | null;
  creditAmountToman: number;
  eligibleCreditAmountToman: number;
  reviewNote?: string;
  now: Date;
};

export type AdminCancellationSupportCreditRejectionInput = {
  cancellationId: string;
  adminId: string;
  rejectionReason: string;
  reviewNote?: string;
  now: Date;
};

function decimalOrNull(value: number | null) {
  return value === null ? null : new Prisma.Decimal(value.toFixed(2));
}

function rateBps(amountToman: number, eligibleAmountToman: number) {
  if (eligibleAmountToman <= 0) {
    return 0;
  }

  return Math.floor((amountToman * 10000) / eligibleAmountToman);
}

async function getSafeConversationById(conversationId: string, tx: UseravaaTransactionClient) {
  return tx.conversationRequest.findUnique({
    where: {
      id: conversationId
    },
    select: safeConversationSelect
  }) as Promise<SafeConversationRecord | null>;
}

const adminCancellationSupportReviewSelect = Prisma.validator<Prisma.CancellationSelect>()({
  id: true,
  conversationId: true,
  cancelledByUserId: true,
  cancelledByRole: true,
  status: true,
  stage: true,
  reasonCode: true,
  otherReasonText: true,
  refundRateBps: true,
  refundAmountToman: true,
  refundDestination: true,
  providerGrossCompensationToman: true,
  useravaaFeeRateBps: true,
  useravaaFeeAmountToman: true,
  providerNetCompensationToman: true,
  hoursUntilSession: true,
  isLateRequesterCancellation: true,
  requesterRefundWalletTransactionId: true,
  providerCompensationWalletTransactionId: true,
  supportReviewReason: true,
  reviewedByAdminId: true,
  reviewedAt: true,
  completedAt: true,
  rejectedAt: true,
  createdAt: true,
  updatedAt: true,
  conversation: {
    select: {
      id: true,
      requesterId: true,
      providerId: true,
      status: true,
      requestTopic: true,
      priceToman: true,
      confirmedAt: true,
      selectedTimeId: true,
      payment: {
        select: {
          id: true,
          status: true,
          requirement: true,
          method: true,
          amountToman: true,
          finalizedAt: true,
          refundedAt: true
        }
      },
      selectedTime: {
        select: {
          id: true,
          startsAt: true,
          shamsiDateLabel: true,
          timeLabel: true,
          status: true
        }
      },
      proposedTimes: {
        select: {
          id: true
        },
        take: 1
      },
      attendanceVerification: {
        select: {
          id: true,
          status: true,
          verifiedAt: true
        }
      },
      walletTransactions: {
        select: {
          id: true
        },
        take: 1
      }
    }
  }
});

export const cancellationRepository = {
  methods: {
    listForConversation: "read_only_persistent",
    findConversationForRequesterCancellation: "read_only_persistent",
    createRequesterCancellation: "database_persistent",
    findSupportReviewForAdminAction: "read_only_persistent",
    approveSupportReviewCredit: "database_persistent",
    rejectSupportReviewCredit: "database_persistent"
  },
  listForConversation(conversationId: string) {
    return readOnlyRepositoryOperation("cancellation", "listForConversation", (db) =>
      db.cancellation.findMany({
        where: { conversationId },
        select: {
          id: true,
          conversationId: true,
          cancelledByUserId: true,
          cancelledByRole: true,
          status: true,
          stage: true,
          reasonCode: true,
          otherReasonText: true,
          refundRateBps: true,
          refundAmountToman: true,
          refundDestination: true,
          supportReviewReason: true,
          reviewedAt: true,
          completedAt: true,
          rejectedAt: true,
          createdAt: true
        },
        orderBy: { createdAt: "desc" }
      })
    );
  },
  async findConversationForRequesterCancellation(
    conversationId: string,
    requesterId: string,
    tx: UseravaaTransactionClient
  ) {
    return tx.conversationRequest.findFirst({
      where: {
        id: conversationId,
        requesterId
      },
      select: safeConversationSelect
    }) as Promise<SafeConversationRecord | null>;
  },
  async findSupportReviewForAdminAction(cancellationId: string, tx: UseravaaTransactionClient) {
    return tx.cancellation.findUnique({
      where: {
        id: cancellationId
      },
      select: adminCancellationSupportReviewSelect
    });
  },
  async createRequesterCancellation(input: RequesterCancellationInput, tx: UseravaaTransactionClient) {
    const cancellation = await tx.cancellation.create({
      data: {
        conversationId: input.conversationId,
        cancelledByUserId: input.requesterId,
        cancelledByRole: "REQUESTER",
        status: input.policy.status,
        stage: input.policy.stage,
        reasonCode: input.reasonCode,
        otherReasonText: input.otherReasonText ?? null,
        refundRateBps: input.policy.creditRateBps,
        refundAmountToman: input.policy.walletCreditAmountToman,
        refundDestination: input.policy.refundDestination,
        providerGrossCompensationToman: 0,
        useravaaFeeRateBps: 0,
        useravaaFeeAmountToman: 0,
        providerNetCompensationToman: 0,
        hoursUntilSession: decimalOrNull(input.policy.hoursUntilSession),
        isLateRequesterCancellation: input.policy.isLateRequesterCancellation,
        supportReviewReason: input.policy.supportReviewReason,
        completedAt: input.policy.status === "COMPLETED" ? input.now : null,
        createdAt: input.now
      },
      select: {
        id: true
      }
    });

    let requesterRefundWalletTransactionId: string | null = null;

    if (!input.policy.supportReviewRequired && input.policy.walletCreditAmountToman > 0) {
      const walletTransaction = await walletTransactionRepository.createLedgerEntry(
        {
          ownerUserId: input.requesterId,
          amountToman: input.policy.walletCreditAmountToman,
          type: "CANCELLATION_REFUND_CREDIT",
          title: "بازگشت اعتبار از لغو درخواست",
          sourceEntityType: "CANCELLATION",
          sourceEntityId: cancellation.id,
          conversationId: input.conversationId,
          paymentId: input.paymentId,
          cancelledByRole: "REQUESTER",
          refundRateBps: input.policy.creditRateBps,
          refundAmountToman: input.policy.walletCreditAmountToman,
          hoursUntilSession: input.policy.hoursUntilSession,
          metadata: {
            sourceConversationId: input.conversationId,
            sourcePaymentId: input.paymentId ?? null,
            sourceCancellationId: cancellation.id,
            cancelledByRole: "REQUESTER",
            creditRateBps: input.policy.creditRateBps,
            retainedRateBps: input.policy.retainedRateBps,
            platformHandlingAmountToman: input.policy.platformHandlingAmountToman,
            hoursUntilSession: input.policy.hoursUntilSession,
            createdAt: input.now.toISOString()
          },
          now: input.now
        },
        tx
      );

      requesterRefundWalletTransactionId = walletTransaction.id;

      await tx.cancellation.update({
        where: {
          id: cancellation.id
        },
        data: {
          requesterRefundWalletTransactionId
        }
      });
    }

    await tx.conversationRequest.update({
      where: {
        id: input.conversationId
      },
      data: {
        status: "CANCELLED",
        cancelledAt: input.now
      }
    });

    return getSafeConversationById(input.conversationId, tx);
  },
  async approveSupportReviewCredit(input: AdminCancellationSupportCreditApprovalInput, tx: UseravaaTransactionClient) {
    const refundRateBps = rateBps(input.creditAmountToman, input.eligibleCreditAmountToman);
    const retainedAmountToman = Math.max(0, input.eligibleCreditAmountToman - input.creditAmountToman);
    const walletTransaction = await walletTransactionRepository.createLedgerEntry(
      {
        ownerUserId: input.requesterId,
        amountToman: input.creditAmountToman,
        type: "CANCELLATION_REFUND_CREDIT",
        title: "بازگشت اعتبار از بررسی لغو",
        sourceEntityType: "CANCELLATION",
        sourceEntityId: input.cancellationId,
        conversationId: input.conversationId,
        paymentId: input.paymentId,
        cancelledByRole: "REQUESTER",
        refundRateBps,
        refundAmountToman: input.creditAmountToman,
        metadata: {
          sourceConversationId: input.conversationId,
          sourcePaymentId: input.paymentId,
          sourceCancellationId: input.cancellationId,
          supportReviewDecision: "approvedCredit",
          approvedCreditAmountToman: input.creditAmountToman,
          eligibleCreditAmountToman: input.eligibleCreditAmountToman,
          retainedAmountToman,
          reviewedByAdminId: input.adminId,
          createdAt: input.now.toISOString()
        },
        now: input.now
      },
      tx
    );

    return tx.cancellation.update({
      where: {
        id: input.cancellationId
      },
      data: {
        status: "COMPLETED",
        refundRateBps,
        refundAmountToman: input.creditAmountToman,
        refundDestination: "WALLET",
        useravaaFeeAmountToman: retainedAmountToman,
        reviewedByAdminId: input.adminId,
        reviewedAt: input.now,
        completedAt: input.now,
        rejectedAt: null,
        requesterRefundWalletTransactionId: walletTransaction.id
      },
      select: adminCancellationSupportReviewSelect
    });
  },
  async rejectSupportReviewCredit(input: AdminCancellationSupportCreditRejectionInput, tx: UseravaaTransactionClient) {
    return tx.cancellation.update({
      where: {
        id: input.cancellationId
      },
      data: {
        status: "REJECTED",
        refundRateBps: 0,
        refundAmountToman: 0,
        refundDestination: "NONE",
        reviewedByAdminId: input.adminId,
        reviewedAt: input.now,
        completedAt: null,
        rejectedAt: input.now
      },
      select: adminCancellationSupportReviewSelect
    });
  }
} as const;

export type AdminCancellationSupportReviewRecord = NonNullable<
  Awaited<ReturnType<typeof cancellationRepository.findSupportReviewForAdminAction>>
>;
