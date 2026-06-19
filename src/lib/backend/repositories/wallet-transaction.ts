import { Prisma } from "@prisma/client";
import type { UseravaaTransactionClient } from "../db/transaction";
import { readOnlyRepositoryOperation } from "./types";

export type WalletLedgerEntryInput = {
  ownerUserId: string;
  amountToman: number;
  type: "CANCELLATION_REFUND_CREDIT";
  title: string;
  sourceEntityType?: "CANCELLATION" | "CONVERSATION" | "PAYMENT" | "WALLET_TRANSACTION";
  sourceEntityId?: string;
  conversationId?: string;
  paymentId?: string | null;
  cancelledByRole?: "REQUESTER" | "PROVIDER" | "EXPERIENCE_CREATOR" | "ADMIN_SUPPORT" | "PLATFORM";
  refundRateBps?: number;
  refundAmountToman?: number;
  hoursUntilSession?: number | null;
  metadata?: Prisma.InputJsonValue;
  now: Date;
};

function decimalOrNull(value: number | null | undefined) {
  return value === null || value === undefined ? null : new Prisma.Decimal(value.toFixed(2));
}

export const walletTransactionRepository = {
  methods: {
    listForWallet: "read_only_persistent",
    createLedgerEntry: "database_persistent"
  },
  listForWallet(walletId: string) {
    return readOnlyRepositoryOperation("wallet_transaction", "listForWallet", (db) =>
      db.walletTransaction.findMany({
        where: { walletId },
        select: {
          id: true,
          walletId: true,
          type: true,
          status: true,
          settlementStatus: true,
          title: true,
          amountToman: true,
          sourceEntityType: true,
          sourceEntityId: true,
          conversationId: true,
          paymentId: true,
          withdrawalRequestId: true,
          metadata: true,
          createdAt: true
        },
        orderBy: { createdAt: "desc" }
      })
    );
  },
  async createLedgerEntry(input: WalletLedgerEntryInput, tx: UseravaaTransactionClient) {
    if (input.amountToman <= 0) {
      throw new Error("Wallet ledger credit amount must be positive.");
    }

    const wallet = await tx.wallet.upsert({
      where: {
        userId: input.ownerUserId
      },
      create: {
        userId: input.ownerUserId,
        balanceToman: 0,
        availablePayoutToman: 0,
        pendingPayoutToman: 0
      },
      update: {},
      select: {
        id: true
      }
    });

    const transaction = await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: input.type,
        status: "COMPLETED",
        settlementStatus: "NOT_SETTLEABLE",
        title: input.title,
        amountToman: input.amountToman,
        sourceEntityType: input.sourceEntityType,
        sourceEntityId: input.sourceEntityId,
        conversationId: input.conversationId,
        paymentId: input.paymentId ?? undefined,
        cancelledByRole: input.cancelledByRole,
        refundRateBps: input.refundRateBps,
        refundAmountToman: input.refundAmountToman,
        hoursUntilSession: decimalOrNull(input.hoursUntilSession),
        ...(input.metadata === undefined ? {} : { metadata: input.metadata }),
        createdAt: input.now
      },
      select: {
        id: true,
        walletId: true,
        amountToman: true,
        type: true,
        status: true
      }
    });

    await tx.wallet.update({
      where: {
        id: wallet.id
      },
      data: {
        balanceToman: {
          increment: input.amountToman
        }
      }
    });

    return transaction;
  }
} as const;
