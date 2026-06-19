import { readOnlyRepositoryOperation, repositoryNotImplemented } from "./types";

export const walletRepository = {
  methods: {
    getForViewer: "read_only_persistent",
    createWithdrawal: "contract_only"
  },
  getForViewer(userId: string) {
    return readOnlyRepositoryOperation("wallet", "getForViewer", (db) =>
      db.wallet.findUnique({
        where: { userId },
        select: {
          id: true,
          userId: true,
          balanceToman: true,
          availablePayoutToman: true,
          pendingPayoutToman: true,
          updatedAt: true,
          transactions: {
            select: {
              id: true,
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
              refundRateBps: true,
              refundAmountToman: true,
              createdAt: true
            },
            orderBy: { createdAt: "desc" },
            take: 50
          },
          withdrawals: {
            select: {
              id: true,
              amountToman: true,
              destinationAccountOwner: true,
              destinationIbanMasked: true,
              status: true,
              requestedAt: true,
              processedAt: true,
              paidAt: true,
              failedAt: true,
              cancelledAt: true
            },
            orderBy: { requestedAt: "desc" },
            take: 20
          }
        }
      })
    );
  },
  createWithdrawal() {
    return repositoryNotImplemented("withdrawal", "createWithdrawal");
  }
} as const;

