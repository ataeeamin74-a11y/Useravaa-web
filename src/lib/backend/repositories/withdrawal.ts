import { readOnlyRepositoryOperation, repositoryNotImplemented } from "./types";

export const withdrawalRepository = {
  methods: {
    listForViewer: "read_only_persistent",
    requestWithdrawal: "contract_only"
  },
  listForViewer(userId: string) {
    return readOnlyRepositoryOperation("withdrawal", "listForViewer", (db) =>
      db.withdrawalRequest.findMany({
        where: { userId },
        select: {
          id: true,
          walletId: true,
          userId: true,
          amountToman: true,
          destinationAccountOwner: true,
          destinationIbanMasked: true,
          status: true,
          requestedAt: true,
          processedAt: true,
          paidAt: true,
          failedAt: true,
          cancelledAt: true,
          adminNote: true,
          trackingNumber: true
        },
        orderBy: { requestedAt: "desc" }
      })
    );
  },
  requestWithdrawal() {
    return repositoryNotImplemented("withdrawal", "requestWithdrawal");
  }
} as const;

