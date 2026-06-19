import { Prisma } from "@prisma/client";
import type { UseravaaTransactionClient } from "../db/transaction";
import { safeConversationSelect, type SafeConversationRecord } from "./conversation";
import { readOnlyRepositoryOperation } from "./types";

type ProposedTimeInput = {
  startsAt: Date;
  shamsiDateLabel: string;
  timeLabel: string;
};

export type ProposeTimesInput = {
  conversationId: string;
  providerId: string;
  timeOptions: ProposedTimeInput[];
  now: Date;
};

export type RequestNewTimesInput = {
  conversationId: string;
  requesterId: string;
  note?: string;
  now: Date;
};

export type SelectTimeInput = {
  conversationId: string;
  requesterId: string;
  proposedTimeId: string;
  proposalSetId?: string;
  now: Date;
};

export type TimeFlowConversationRecord = Prisma.ConversationRequestGetPayload<{
  select: typeof timeFlowConversationSelect;
}>;

export type TimeOptionRecord = Prisma.ProposedTimeGetPayload<{
  select: typeof selectableTimeOptionSelect;
}>;

const timeFlowConversationSelect = Prisma.validator<Prisma.ConversationRequestSelect>()({
  id: true,
  requesterId: true,
  providerId: true,
  status: true,
  providerVisibleAt: true,
  selectedTimeId: true,
  selectedAt: true,
  confirmedAt: true,
  cancelledAt: true,
  expiredAt: true,
  rejectedAt: true,
  payment: {
    select: {
      id: true
    }
  },
  attendanceVerification: {
    select: {
      id: true
    }
  },
  cancellations: {
    select: {
      id: true
    }
  },
  walletTransactions: {
    select: {
      id: true
    }
  }
});

const selectableTimeOptionSelect = Prisma.validator<Prisma.ProposedTimeSelect>()({
  id: true,
  conversationId: true,
  proposalSetId: true,
  version: true,
  startsAt: true,
  status: true,
  proposalSet: {
    select: {
      id: true,
      status: true,
      conversationId: true
    }
  }
});

function safeConversationById(conversationId: string, tx: UseravaaTransactionClient) {
  return tx.conversationRequest.findUnique({
    where: { id: conversationId },
    select: safeConversationSelect
  }) as Promise<SafeConversationRecord | null>;
}

async function nextProposalVersion(conversationId: string, tx: UseravaaTransactionClient) {
  const result = await tx.timeProposalSet.aggregate({
    where: { conversationId },
    _max: {
      version: true
    }
  });

  return (result._max.version ?? 0) + 1;
}

export const timeProposalRepository = {
  methods: {
    findConversationForProviderTimeProposal: "read_only_persistent",
    findConversationForRequesterNewTimeRequest: "read_only_persistent",
    findConversationForRequesterTimeSelection: "read_only_persistent",
    findSelectableTimeOption: "read_only_persistent",
    listActiveForConversation: "read_only_persistent",
    countActiveOptionsForConversation: "read_only_persistent",
    countRequestedNewTimeRequests: "read_only_persistent",
    createProposedTimeSet: "database_persistent",
    createNewTimeRequest: "database_persistent",
    selectTime: "database_persistent",
    proposeTimes: "database_persistent",
    requestNewTimes: "database_persistent"
  },
  async findConversationForProviderTimeProposal(conversationId: string, providerId: string, tx: UseravaaTransactionClient) {
    return tx.conversationRequest.findFirst({
      where: {
        id: conversationId,
        providerId
      },
      select: timeFlowConversationSelect
    }) as Promise<TimeFlowConversationRecord | null>;
  },
  async findConversationForRequesterNewTimeRequest(conversationId: string, requesterId: string, tx: UseravaaTransactionClient) {
    return tx.conversationRequest.findFirst({
      where: {
        id: conversationId,
        requesterId
      },
      select: timeFlowConversationSelect
    }) as Promise<TimeFlowConversationRecord | null>;
  },
  async findConversationForRequesterTimeSelection(conversationId: string, requesterId: string, tx: UseravaaTransactionClient) {
    return tx.conversationRequest.findFirst({
      where: {
        id: conversationId,
        requesterId
      },
      select: timeFlowConversationSelect
    }) as Promise<TimeFlowConversationRecord | null>;
  },
  async findSelectableTimeOption(input: Pick<SelectTimeInput, "conversationId" | "proposedTimeId" | "proposalSetId">, tx: UseravaaTransactionClient) {
    return tx.proposedTime.findFirst({
      where: {
        id: input.proposedTimeId,
        conversationId: input.conversationId,
        ...(input.proposalSetId ? { proposalSetId: input.proposalSetId } : {})
      },
      select: selectableTimeOptionSelect
    }) as Promise<TimeOptionRecord | null>;
  },
  listActiveForConversation(conversationId: string) {
    return readOnlyRepositoryOperation("time_proposal", "listActiveForConversation", (db) =>
      db.timeProposalSet.findMany({
        where: {
          conversationId,
          status: "ACTIVE"
        },
        select: {
          id: true,
          version: true,
          status: true,
          proposedById: true,
          proposedAt: true,
          options: {
            select: {
              id: true,
              version: true,
              startsAt: true,
              shamsiDateLabel: true,
              timeLabel: true,
              status: true
            },
            orderBy: { startsAt: "asc" }
          }
        },
        orderBy: { version: "desc" }
      })
    );
  },
  async countActiveOptionsForConversation(conversationId: string, tx: UseravaaTransactionClient) {
    return tx.proposedTime.count({
      where: {
        conversationId,
        status: "ACTIVE"
      }
    });
  },
  async countRequestedNewTimeRequests(conversationId: string, tx: UseravaaTransactionClient) {
    return tx.newTimeRequest.count({
      where: {
        conversationId,
        status: "REQUESTED"
      }
    });
  },
  async createProposedTimeSet(input: ProposeTimesInput, tx: UseravaaTransactionClient) {
    const version = await nextProposalVersion(input.conversationId, tx);

    await tx.timeProposalSet.updateMany({
      where: {
        conversationId: input.conversationId,
        status: "ACTIVE"
      },
      data: {
        status: "SUPERSEDED",
        supersededAt: input.now
      }
    });

    await tx.proposedTime.updateMany({
      where: {
        conversationId: input.conversationId,
        status: "ACTIVE"
      },
      data: {
        status: "SUPERSEDED"
      }
    });

    const proposalSet = await tx.timeProposalSet.create({
      data: {
        conversationId: input.conversationId,
        version,
        status: "ACTIVE",
        proposedById: input.providerId,
        proposedAt: input.now
      },
      select: {
        id: true
      }
    });

    await tx.proposedTime.createMany({
      data: input.timeOptions.map((option) => ({
        conversationId: input.conversationId,
        proposalSetId: proposalSet.id,
        version,
        startsAt: option.startsAt,
        shamsiDateLabel: option.shamsiDateLabel,
        timeLabel: option.timeLabel,
        status: "ACTIVE" as const
      }))
    });

    await tx.newTimeRequest.updateMany({
      where: {
        conversationId: input.conversationId,
        status: "REQUESTED"
      },
      data: {
        status: "FULFILLED",
        fulfilledAt: input.now
      }
    });

    return tx.conversationRequest.update({
      where: {
        id: input.conversationId
      },
      data: {
        status: "TIMES_PROPOSED",
        timesProposedAt: input.now,
        selectedTimeId: null,
        selectedAt: null,
        confirmedAt: null
      },
      select: safeConversationSelect
    }) as Promise<SafeConversationRecord>;
  },
  async createNewTimeRequest(input: RequestNewTimesInput, tx: UseravaaTransactionClient) {
    await tx.proposedTime.updateMany({
      where: {
        conversationId: input.conversationId,
        status: "ACTIVE"
      },
      data: {
        status: "SUPERSEDED"
      }
    });

    await tx.timeProposalSet.updateMany({
      where: {
        conversationId: input.conversationId,
        status: "ACTIVE"
      },
      data: {
        status: "SUPERSEDED",
        supersededAt: input.now
      }
    });

    await tx.newTimeRequest.create({
      data: {
        conversationId: input.conversationId,
        requestedById: input.requesterId,
        note: input.note?.trim() || null,
        status: "REQUESTED",
        requestedAt: input.now
      }
    });

    return tx.conversationRequest.update({
      where: {
        id: input.conversationId
      },
      data: {
        status: "NEW_TIME_REQUESTED",
        selectedTimeId: null,
        selectedAt: null,
        confirmedAt: null
      },
      select: safeConversationSelect
    }) as Promise<SafeConversationRecord>;
  },
  async selectTime(input: SelectTimeInput, tx: UseravaaTransactionClient) {
    const selectedAt = input.now;
    const selected = await tx.proposedTime.update({
      where: {
        id: input.proposedTimeId
      },
      data: {
        status: "SELECTED",
        selectedAt
      },
      select: selectableTimeOptionSelect
    });

    await tx.proposedTime.updateMany({
      where: {
        conversationId: input.conversationId,
        status: "ACTIVE",
        id: {
          not: selected.id
        }
      },
      data: {
        status: "SUPERSEDED"
      }
    });

    await tx.timeProposalSet.update({
      where: {
        id: selected.proposalSetId
      },
      data: {
        status: "SELECTED",
        selectedAt
      }
    });

    await tx.timeProposalSet.updateMany({
      where: {
        conversationId: input.conversationId,
        status: "ACTIVE",
        id: {
          not: selected.proposalSetId
        }
      },
      data: {
        status: "SUPERSEDED",
        supersededAt: selectedAt
      }
    });

    await tx.newTimeRequest.updateMany({
      where: {
        conversationId: input.conversationId,
        status: "REQUESTED"
      },
      data: {
        status: "FULFILLED",
        fulfilledAt: selectedAt
      }
    });

    await tx.conversationRequest.update({
      where: {
        id: input.conversationId
      },
      data: {
        status: "CONFIRMED",
        selectedTimeId: selected.id,
        selectedAt,
        confirmedAt: selectedAt
      }
    });

    return safeConversationById(input.conversationId, tx);
  }
} as const;
