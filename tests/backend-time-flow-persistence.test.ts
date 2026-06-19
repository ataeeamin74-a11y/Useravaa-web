import fs from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { getPrismaClient } from "@/lib/backend/db/prisma";
import { withUseravaaTransaction, type UseravaaTransactionClient } from "@/lib/backend/db/transaction";
import type { ConversationResponseDto } from "@/lib/backend/dto/conversation";
import { apiEndpointPersistenceClassification } from "@/lib/backend/endpoint-classification";
import { backendImplementationClassification } from "@/lib/backend/implementation-classification";
import type { SafeConversationRecord } from "@/lib/backend/repositories/conversation";
import { conversationService, type ServiceResult } from "@/lib/backend/services";
import { newTimeRequestSchema, proposedTimesSubmissionSchema, timeSelectionSchema } from "@/lib/backend/validation";

const projectRoot = process.cwd();
const now = new Date("2026-06-13T08:00:00.000Z");

function readProjectFile(relativePath: string) {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

function futureIso(dayOffset: number) {
  return new Date(now.getTime() + dayOffset * 24 * 60 * 60 * 1000).toISOString();
}

function validTimes(prefix = "time") {
  return [
    {
      startsAt: futureIso(3),
      shamsiDateLabel: `${prefix}-1`,
      timeLabel: "10:00"
    },
    {
      startsAt: futureIso(4),
      shamsiDateLabel: `${prefix}-2`,
      timeLabel: "11:00"
    },
    {
      startsAt: futureIso(5),
      shamsiDateLabel: `${prefix}-3`,
      timeLabel: "12:00"
    }
  ];
}

type FakeProposalSet = {
  id: string;
  conversationId: string;
  version: number;
  status: "ACTIVE" | "SUPERSEDED" | "SELECTED" | "EXPIRED";
  proposedById: string;
  proposedAt: Date;
  supersededAt: Date | null;
  selectedAt: Date | null;
};

type FakeProposedTime = {
  id: string;
  conversationId: string;
  proposalSetId: string;
  version: number;
  startsAt: Date;
  shamsiDateLabel: string;
  timeLabel: string;
  status: "ACTIVE" | "SUPERSEDED" | "SELECTED" | "EXPIRED";
  selectedAt: Date | null;
};

type FakeState = {
  conversation: {
    id: string;
    requesterId: string;
    providerId: string;
    experienceProfileId: string;
    duration: "MIN_30" | "MIN_60";
    priceToman: number;
    status: string;
    paymentRequirement: string;
    requestTopic: string | null;
    requestNote: string | null;
    providerVisibleAt: Date | null;
    timesProposedAt: Date | null;
    requesterSelectionDeadlineAt: Date | null;
    selectedTimeId: string | null;
    selectedAt: Date | null;
    paymentFinalizedAt: Date | null;
    freeFinalizedAt: Date | null;
    confirmedAt: Date | null;
    completedAt: Date | null;
    rejectedAt: Date | null;
    expiredAt: Date | null;
    cancelledAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  };
  proposalSets: FakeProposalSet[];
  proposedTimes: FakeProposedTime[];
  newTimeRequests: Array<{
    id: string;
    conversationId: string;
    requestedById: string;
    note: string | null;
    status: "REQUESTED" | "FULFILLED" | "CANCELLED" | "EXPIRED";
    requestedAt: Date;
    fulfilledAt: Date | null;
  }>;
  paymentCreate: ReturnType<typeof vi.fn>;
  walletTransactionCreate: ReturnType<typeof vi.fn>;
  cancellationCreate: ReturnType<typeof vi.fn>;
  attendanceCreate: ReturnType<typeof vi.fn>;
};

function buildSafeConversation(state: FakeState): SafeConversationRecord {
  const selectedTime = state.proposedTimes.find((time) => time.id === state.conversation.selectedTimeId) ?? null;

  return {
    ...state.conversation,
    requester: {
      id: state.conversation.requesterId,
      displayName: "Requester",
      avatarUrl: null
    },
    provider: {
      id: state.conversation.providerId,
      displayName: "Provider",
      avatarUrl: null
    },
    selectedTime: selectedTime
      ? {
          id: selectedTime.id,
          startsAt: selectedTime.startsAt,
          shamsiDateLabel: selectedTime.shamsiDateLabel,
          timeLabel: selectedTime.timeLabel,
          status: selectedTime.status,
          version: selectedTime.version
        }
      : null,
    proposedTimes: state.proposedTimes.map((time) => ({
      id: time.id,
      proposalSetId: time.proposalSetId,
      version: time.version,
      startsAt: time.startsAt,
      shamsiDateLabel: time.shamsiDateLabel,
      timeLabel: time.timeLabel,
      status: time.status
    })),
    payment: {
      id: "payment-1",
      method: "CARD_TO_CARD",
      requirement: "PAYMENT_REQUIRED",
      status: "PAID",
      amountToman: 500000,
      walletDeductionToman: 0,
      gatewayPayableToman: 500000,
      finalizedAt: now,
      failedAt: null,
      refundedAt: null,
      manualReview: null
    },
    attendanceVerification: null,
    cancellations: []
  } as SafeConversationRecord;
}

function createFakeTimeFlow(overrides: Partial<FakeState["conversation"]> = {}) {
  const state: FakeState = {
    conversation: {
      id: "conversation-1",
      requesterId: "requester-1",
      providerId: "provider-1",
      experienceProfileId: "experience-profile-1",
      duration: "MIN_30",
      priceToman: 500000,
      status: "AWAITING_TIME_PROPOSAL",
      paymentRequirement: "PAYMENT_REQUIRED",
      requestTopic: "career path",
      requestNote: "short note",
      providerVisibleAt: now,
      timesProposedAt: null,
      requesterSelectionDeadlineAt: null,
      selectedTimeId: null,
      selectedAt: null,
      paymentFinalizedAt: now,
      freeFinalizedAt: null,
      confirmedAt: null,
      completedAt: null,
      rejectedAt: null,
      expiredAt: null,
      cancelledAt: null,
      createdAt: now,
      updatedAt: now,
      ...overrides
    },
    proposalSets: [],
    proposedTimes: [],
    newTimeRequests: [],
    paymentCreate: vi.fn(),
    walletTransactionCreate: vi.fn(),
    cancellationCreate: vi.fn(),
    attendanceCreate: vi.fn()
  };

  const tx = {
    conversationRequest: {
      findFirst: vi.fn(async ({ where }: { where: { id?: string; requesterId?: string; providerId?: string } }) => {
        if (where.id && where.id !== state.conversation.id) {
          return null;
        }

        if (where.requesterId && where.requesterId !== state.conversation.requesterId) {
          return null;
        }

        if (where.providerId && where.providerId !== state.conversation.providerId) {
          return null;
        }

        return {
          id: state.conversation.id,
          requesterId: state.conversation.requesterId,
          providerId: state.conversation.providerId,
          status: state.conversation.status,
          providerVisibleAt: state.conversation.providerVisibleAt,
          selectedTimeId: state.conversation.selectedTimeId,
          selectedAt: state.conversation.selectedAt,
          confirmedAt: state.conversation.confirmedAt,
          cancelledAt: state.conversation.cancelledAt,
          expiredAt: state.conversation.expiredAt,
          rejectedAt: state.conversation.rejectedAt,
          payment: { id: "payment-1" },
          attendanceVerification: null,
          cancellations: [],
          walletTransactions: []
        };
      }),
      update: vi.fn(async ({ data }: { data: Partial<FakeState["conversation"]> }) => {
        Object.assign(state.conversation, data, {
          updatedAt: now
        });

        return buildSafeConversation(state);
      }),
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
        if (where.id !== state.conversation.id) {
          return null;
        }

        return buildSafeConversation(state);
      })
    },
    timeProposalSet: {
      aggregate: vi.fn(async () => ({
        _max: {
          version: state.proposalSets.reduce((max, set) => Math.max(max, set.version), 0) || null
        }
      })),
      updateMany: vi.fn(async ({ where, data }: { where: { conversationId: string; status?: string; id?: { not: string } }; data: Partial<FakeProposalSet> }) => {
        let count = 0;
        state.proposalSets.forEach((set) => {
          if (set.conversationId !== where.conversationId || (where.status && set.status !== where.status) || where.id?.not === set.id) {
            return;
          }

          Object.assign(set, data);
          count += 1;
        });

        return { count };
      }),
      create: vi.fn(async ({ data }: { data: Omit<FakeProposalSet, "id" | "supersededAt" | "selectedAt"> }) => {
        const set = {
          ...data,
          id: `set-${state.proposalSets.length + 1}`,
          supersededAt: null,
          selectedAt: null
        };
        state.proposalSets.push(set);
        return { id: set.id };
      }),
      update: vi.fn(async ({ where, data }: { where: { id: string }; data: Partial<FakeProposalSet> }) => {
        const set = state.proposalSets.find((candidate) => candidate.id === where.id);

        if (!set) {
          throw new Error("Proposal set not found");
        }

        Object.assign(set, data);
        return set;
      })
    },
    proposedTime: {
      count: vi.fn(async ({ where }: { where: { conversationId: string; status?: string } }) =>
        state.proposedTimes.filter((time) => time.conversationId === where.conversationId && (!where.status || time.status === where.status)).length
      ),
      updateMany: vi.fn(async ({ where, data }: { where: { conversationId: string; status?: string; id?: { not: string } }; data: Partial<FakeProposedTime> }) => {
        let count = 0;
        state.proposedTimes.forEach((time) => {
          if (time.conversationId !== where.conversationId || (where.status && time.status !== where.status) || where.id?.not === time.id) {
            return;
          }

          Object.assign(time, data);
          count += 1;
        });

        return { count };
      }),
      createMany: vi.fn(async ({ data }: { data: Array<Omit<FakeProposedTime, "id" | "selectedAt">> }) => {
        data.forEach((item) => {
          state.proposedTimes.push({
            ...item,
            id: `time-${state.proposedTimes.length + 1}`,
            selectedAt: null
          });
        });

        return { count: data.length };
      }),
      findFirst: vi.fn(async ({ where }: { where: { id: string; conversationId: string; proposalSetId?: string } }) => {
        const time = state.proposedTimes.find(
          (candidate) =>
            candidate.id === where.id &&
            candidate.conversationId === where.conversationId &&
            (!where.proposalSetId || candidate.proposalSetId === where.proposalSetId)
        );

        if (!time) {
          return null;
        }

        const proposalSet = state.proposalSets.find((set) => set.id === time.proposalSetId);

        return {
          ...time,
          proposalSet
        };
      }),
      update: vi.fn(async ({ where, data }: { where: { id: string }; data: Partial<FakeProposedTime> }) => {
        const time = state.proposedTimes.find((candidate) => candidate.id === where.id);

        if (!time) {
          throw new Error("Proposed time not found");
        }

        Object.assign(time, data);
        const proposalSet = state.proposalSets.find((set) => set.id === time.proposalSetId);

        return {
          ...time,
          proposalSet
        };
      })
    },
    newTimeRequest: {
      count: vi.fn(async ({ where }: { where: { conversationId: string; status?: string } }) =>
        state.newTimeRequests.filter((request) => request.conversationId === where.conversationId && (!where.status || request.status === where.status)).length
      ),
      updateMany: vi.fn(async ({ where, data }: { where: { conversationId: string; status?: string }; data: Partial<FakeState["newTimeRequests"][number]> }) => {
        let count = 0;
        state.newTimeRequests.forEach((request) => {
          if (request.conversationId !== where.conversationId || (where.status && request.status !== where.status)) {
            return;
          }

          Object.assign(request, data);
          count += 1;
        });

        return { count };
      }),
      create: vi.fn(async ({ data }: { data: Omit<FakeState["newTimeRequests"][number], "id" | "fulfilledAt"> }) => {
        const request = {
          ...data,
          id: `new-time-${state.newTimeRequests.length + 1}`,
          fulfilledAt: null
        };
        state.newTimeRequests.push(request);
        return request;
      })
    },
    payment: {
      create: state.paymentCreate
    },
    walletTransaction: {
      create: state.walletTransactionCreate
    },
    cancellation: {
      create: state.cancellationCreate
    },
    attendanceVerification: {
      create: state.attendanceCreate
    }
  } as unknown as UseravaaTransactionClient;

  const runInTransaction = (async <T>(operation: (transaction: UseravaaTransactionClient) => Promise<T>) =>
    operation(tx)) as typeof withUseravaaTransaction;

  return {
    state,
    runInTransaction
  };
}

async function expectOk(result: Promise<ServiceResult<ConversationResponseDto>>) {
  const resolved = await result;

  expect(resolved.ok).toBe(true);

  if (!resolved.ok) {
    throw new Error(resolved.message);
  }

  return resolved.data;
}

describe("Checkpoint 2B-3 time proposal and selection persistence", () => {
  it("keeps time-flow API routes authenticated, validated, awaited, and fixture-free", () => {
    [
      "src/app/api/conversations/[conversationId]/proposed-times/route.ts",
      "src/app/api/conversations/[conversationId]/request-new-times/route.ts",
      "src/app/api/conversations/[conversationId]/select-time/route.ts"
    ].forEach((relativePath) => {
      const source = readProjectFile(relativePath);

      expect(source, relativePath).toContain("requireApiViewer");
      expect(source, relativePath).toContain("parseJsonBody");
      expect(source, relativePath).toContain("await conversationService.");
      expect(source, relativePath).not.toContain("@/features/v51/data");
      expect(source, relativePath).not.toContain("getConversationOrFallback");
    });
  });

  it("validates exactly three proposed times, rejects duplicates, and rejects privileged fields", () => {
    expect(proposedTimesSubmissionSchema.safeParse({ timeOptions: validTimes() }).success).toBe(true);
    expect(proposedTimesSubmissionSchema.safeParse({ timeOptions: validTimes().slice(0, 2) }).success).toBe(false);
    expect(
      proposedTimesSubmissionSchema.safeParse({
        timeOptions: [validTimes()[0], validTimes()[0], validTimes()[2]]
      }).success
    ).toBe(false);
    expect(
      proposedTimesSubmissionSchema.safeParse({
        timeOptions: validTimes(),
        confirmedAt: now.toISOString()
      }).success
    ).toBe(false);
    expect(newTimeRequestSchema.safeParse({ note: "new options please", cancellationId: "bad" }).success).toBe(false);
    expect(timeSelectionSchema.safeParse({ proposedTimeId: "time-1" }).success).toBe(true);
    expect(timeSelectionSchema.safeParse({ proposedTimeId: "time-1", proposedTimeStatus: "ACTIVE" }).success).toBe(false);
  });

  it("allows only the provider to propose exactly three active times without confirming the session", async () => {
    const { state, runInTransaction } = createFakeTimeFlow();
    const data = await expectOk(
      conversationService.proposeTimes(
        { id: "provider-1" },
        "conversation-1",
        { timeOptions: validTimes() },
        { runInTransaction, now: () => now }
      )
    );

    expect(data).toMatchObject({
      viewerRole: "PROVIDER",
      status: "TIMES_PROPOSED",
      confirmedAt: null,
      selectedTimeId: null
    });
    expect(state.proposalSets).toMatchObject([{ version: 1, status: "ACTIVE" }]);
    expect(state.proposedTimes).toHaveLength(3);
    expect(state.proposedTimes.every((time) => time.status === "ACTIVE")).toBe(true);

    await expect(
      conversationService.proposeTimes(
        { id: "requester-1" },
        "conversation-1",
        { timeOptions: validTimes("requester") },
        { runInTransaction, now: () => now }
      )
    ).resolves.toMatchObject({
      ok: false,
      code: "conversation_not_found"
    });
  });

  it("lets the requester request new times before confirmation without payment, wallet, cancellation, or attendance writes", async () => {
    const { state, runInTransaction } = createFakeTimeFlow();

    await expectOk(
      conversationService.proposeTimes(
        { id: "provider-1" },
        "conversation-1",
        { timeOptions: validTimes() },
        { runInTransaction, now: () => now }
      )
    );
    const oldTimeIds = state.proposedTimes.map((time) => time.id);
    const data = await expectOk(
      conversationService.requestNewTimes(
        { id: "requester-1" },
        "conversation-1",
        { note: "Need different options" },
        { runInTransaction, now: () => now }
      )
    );

    expect(data).toMatchObject({
      viewerRole: "REQUESTER",
      status: "NEW_TIME_REQUESTED",
      nextRequiredAction: "WAITING_FOR_PROVIDER_TIME_PROPOSAL"
    });
    expect(state.proposedTimes.filter((time) => oldTimeIds.includes(time.id)).every((time) => time.status === "SUPERSEDED")).toBe(true);
    expect(state.newTimeRequests).toMatchObject([{ status: "REQUESTED", note: "Need different options" }]);
    expect(state.paymentCreate).not.toHaveBeenCalled();
    expect(state.walletTransactionCreate).not.toHaveBeenCalled();
    expect(state.cancellationCreate).not.toHaveBeenCalled();
    expect(state.attendanceCreate).not.toHaveBeenCalled();

    await expect(
      conversationService.requestNewTimes(
        { id: "provider-1" },
        "conversation-1",
        {},
        { runInTransaction, now: () => now }
      )
    ).resolves.toMatchObject({
      ok: false,
      code: "conversation_not_found"
    });
  });

  it("lets the provider submit replacement times and supersedes previous active options", async () => {
    const { state, runInTransaction } = createFakeTimeFlow();

    await expectOk(
      conversationService.proposeTimes(
        { id: "provider-1" },
        "conversation-1",
        { timeOptions: validTimes("first") },
        { runInTransaction, now: () => now }
      )
    );
    const firstSetId = state.proposalSets[0].id;
    await expectOk(
      conversationService.requestNewTimes(
        { id: "requester-1" },
        "conversation-1",
        {},
        { runInTransaction, now: () => now }
      )
    );
    const data = await expectOk(
      conversationService.proposeTimes(
        { id: "provider-1" },
        "conversation-1",
        { timeOptions: validTimes("second") },
        { runInTransaction, now: () => now }
      )
    );

    expect(data).toMatchObject({
      status: "TIMES_PROPOSED",
      providerReadyToAct: false
    });
    expect(state.proposalSets.find((set) => set.id === firstSetId)?.status).toBe("SUPERSEDED");
    expect(state.proposalSets.at(-1)).toMatchObject({ version: 2, status: "ACTIVE" });
    expect(state.proposedTimes.filter((time) => time.version === 2 && time.status === "ACTIVE")).toHaveLength(3);
    expect(state.newTimeRequests[0]).toMatchObject({ status: "FULFILLED" });
  });

  it("allows only requester selection of an active option and confirms the session without side-effect records", async () => {
    const { state, runInTransaction } = createFakeTimeFlow();

    await expectOk(
      conversationService.proposeTimes(
        { id: "provider-1" },
        "conversation-1",
        { timeOptions: validTimes() },
        { runInTransaction, now: () => now }
      )
    );
    const activeTime = state.proposedTimes[0];
    const data = await expectOk(
      conversationService.selectTime(
        { id: "requester-1" },
        "conversation-1",
        { proposedTimeId: activeTime.id },
        { runInTransaction, now: () => now }
      )
    );

    expect(data).toMatchObject({
      viewerRole: "REQUESTER",
      status: "CONFIRMED",
      selectedTimeId: activeTime.id,
      confirmedAt: now
    });
    expect(state.proposedTimes.find((time) => time.id === activeTime.id)?.status).toBe("SELECTED");
    expect(state.proposedTimes.filter((time) => time.id !== activeTime.id).every((time) => time.status === "SUPERSEDED")).toBe(true);
    expect(state.paymentCreate).not.toHaveBeenCalled();
    expect(state.walletTransactionCreate).not.toHaveBeenCalled();
    expect(state.cancellationCreate).not.toHaveBeenCalled();
    expect(state.attendanceCreate).not.toHaveBeenCalled();

    await expect(
      conversationService.selectTime(
        { id: "provider-1" },
        "conversation-1",
        { proposedTimeId: activeTime.id },
        { runInTransaction, now: () => now }
      )
    ).resolves.toMatchObject({
      ok: false,
      code: "conversation_not_found"
    });
  });

  it("rejects superseded, unrelated, and post-confirmation time selections", async () => {
    const superseded = createFakeTimeFlow();
    await expectOk(
      conversationService.proposeTimes(
        { id: "provider-1" },
        "conversation-1",
        { timeOptions: validTimes("old") },
        { runInTransaction: superseded.runInTransaction, now: () => now }
      )
    );
    const oldTime = superseded.state.proposedTimes[0];
    await expectOk(
      conversationService.requestNewTimes(
        { id: "requester-1" },
        "conversation-1",
        {},
        { runInTransaction: superseded.runInTransaction, now: () => now }
      )
    );

    await expect(
      conversationService.selectTime(
        { id: "requester-1" },
        "conversation-1",
        { proposedTimeId: oldTime.id },
        { runInTransaction: superseded.runInTransaction, now: () => now }
      )
    ).resolves.toMatchObject({
      ok: false,
      code: "invalid_state"
    });

    const unrelated = createFakeTimeFlow({ status: "TIMES_PROPOSED" });
    await expect(
      conversationService.selectTime(
        { id: "requester-1" },
        "conversation-1",
        { proposedTimeId: "not-in-conversation" },
        { runInTransaction: unrelated.runInTransaction, now: () => now }
      )
    ).resolves.toMatchObject({
      ok: false,
      code: "time_option_not_found"
    });

    const confirmed = createFakeTimeFlow({ status: "CONFIRMED", confirmedAt: now, selectedTimeId: "time-1" });
    await expect(
      conversationService.requestNewTimes(
        { id: "requester-1" },
        "conversation-1",
        {},
        { runInTransaction: confirmed.runInTransaction, now: () => now }
      )
    ).resolves.toMatchObject({
      ok: false,
      code: "invalid_state"
    });
  });

  it("keeps provider DTOs free of raw attendance code and requester manual payment proof details", async () => {
    const { runInTransaction } = createFakeTimeFlow();
    const data = await expectOk(
      conversationService.proposeTimes(
        { id: "provider-1" },
        "conversation-1",
        { timeOptions: validTimes() },
        { runInTransaction, now: () => now }
      )
    );
    const serialized = JSON.stringify(data);

    expect(serialized).not.toContain("requesterCodeCiphertext");
    expect(serialized).not.toContain("codeHash");
    expect(serialized).not.toContain("submittedCodeHash");
    expect(serialized).not.toContain("receiptFileName");
    expect(serialized).not.toContain("referenceNumber");
  });

  it("updates time-flow implementation classifications honestly", () => {
    expect(apiEndpointPersistenceClassification["POST /api/conversations/[conversationId]/proposed-times"]).toMatchObject({
      classification: "transaction_ready",
      writesImplemented: true
    });
    expect(apiEndpointPersistenceClassification["POST /api/conversations/[conversationId]/request-new-times"]).toMatchObject({
      classification: "transaction_ready",
      writesImplemented: true
    });
    expect(apiEndpointPersistenceClassification["POST /api/conversations/[conversationId]/select-time"]).toMatchObject({
      classification: "transaction_ready",
      writesImplemented: true
    });
    expect(backendImplementationClassification.proposedTimes.writesImplemented).toBe(true);
    expect(backendImplementationClassification.newTimeRequest.writesImplemented).toBe(true);
    expect(backendImplementationClassification.timeSelection.writesImplemented).toBe(true);
    expect(backendImplementationClassification.confirmedSession.writesImplemented).toBe(true);
  });

  it("runs rollback-backed DB smoke coverage for proposal, replacement, and selection when enabled", async () => {
    if (process.env.USERAVAA_DB_SMOKE_TEST !== "1") {
      expect(process.env.USERAVAA_DB_SMOKE_TEST).not.toBe("1");
      return;
    }

    class SmokeRollback extends Error {
      constructor(readonly summary: Record<string, unknown>) {
        super("TIME_FLOW_SMOKE_ROLLBACK");
      }
    }

    const prisma = getPrismaClient();
    const unique = `time-smoke-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const requesterId = `${unique}-requester`;
    const providerId = `${unique}-provider`;
    const providerProfileId = `${unique}-profile`;
    const experienceProfileId = `${unique}-experience`;
    let summary: Record<string, unknown> | null = null;

    const runInRollbackTransaction = (async <T>(operation: (tx: UseravaaTransactionClient) => Promise<T>) =>
      prisma.$transaction(async (tx) => {
        void operation;
        await tx.user.create({
          data: {
            id: requesterId,
            email: `${unique}-requester@smoke.useravaa.test`,
            displayName: "Smoke requester"
          }
        });
        await tx.user.create({
          data: {
            id: providerId,
            email: `${unique}-provider@smoke.useravaa.test`,
            displayName: "Smoke provider"
          }
        });
        await tx.profile.create({
          data: {
            id: providerProfileId,
            userId: providerId,
            status: "ACTIVE",
            displayName: "Smoke provider",
            professionalSummary: "Temporary smoke-test profile.",
            userMotivations: [],
            canOfferExperience: true
          }
        });
        await tx.experienceProfile.create({
          data: {
            id: experienceProfileId,
            ownerId: providerId,
            profileId: providerProfileId,
            status: "ACTIVE",
            displayName: "Smoke provider",
            roleTitle: "Product specialist",
            orgLevel: "SPECIALIST",
            yearsOfExperience: 5,
            publicProfessionalSummary: "Temporary smoke-test experience profile.",
            freeHelp: false,
            price30Toman: 500000,
            price60Toman: 900000
          }
        });

        const created = await conversationService.createConversation(
          { id: requesterId },
          {
            experienceProfileId,
            durationMinutes: 30,
            requestTopic: "time smoke",
            requestNote: "Create request for time-flow smoke test.",
            paymentRequirement: "PAYMENT_REQUIRED",
            paymentMethod: "CARD_TO_CARD",
            quotedPriceToman: 500000
          },
          {
            runInTransaction: (async (innerOperation) => innerOperation(tx)) as typeof withUseravaaTransaction,
            now: () => now
          }
        );

        if (!created.ok) {
          throw new Error(created.message);
        }

        await tx.payment.update({
          where: {
            conversationId: created.data.id
          },
          data: {
            status: "PAID",
            finalizedAt: now
          }
        });
        await tx.conversationRequest.update({
          where: {
            id: created.data.id
          },
          data: {
            status: "AWAITING_TIME_PROPOSAL",
            providerVisibleAt: now,
            paymentFinalizedAt: now
          }
        });

        const txRunner = (async (innerOperation) => innerOperation(tx)) as typeof withUseravaaTransaction;
        const firstProposal = await conversationService.proposeTimes(
          { id: providerId },
          created.data.id,
          { timeOptions: validTimes("db-first") },
          { runInTransaction: txRunner, now: () => now }
        );

        if (!firstProposal.ok) {
          throw new Error(firstProposal.message);
        }

        const firstTimeId = firstProposal.data.proposedTimes.find((time) => time.status === "ACTIVE")?.id;
        const newTime = await conversationService.requestNewTimes(
          { id: requesterId },
          created.data.id,
          { note: "Need replacement" },
          { runInTransaction: txRunner, now: () => now }
        );

        if (!newTime.ok) {
          throw new Error(newTime.message);
        }

        const staleSelection = await conversationService.selectTime(
          { id: requesterId },
          created.data.id,
          { proposedTimeId: firstTimeId },
          { runInTransaction: txRunner, now: () => now }
        );
        const replacement = await conversationService.proposeTimes(
          { id: providerId },
          created.data.id,
          { timeOptions: validTimes("db-second") },
          { runInTransaction: txRunner, now: () => now }
        );

        if (!replacement.ok) {
          throw new Error(replacement.message);
        }

        const activeReplacement = replacement.data.proposedTimes.find((time) => time.status === "ACTIVE" && time.version === 2);

        if (!activeReplacement) {
          throw new Error("No active replacement option found.");
        }

        const selected = await conversationService.selectTime(
          { id: requesterId },
          created.data.id,
          { proposedTimeId: activeReplacement.id },
          { runInTransaction: txRunner, now: () => now }
        );

        if (!selected.ok) {
          throw new Error(selected.message);
        }

        const paymentCount = await tx.payment.count({ where: { conversationId: created.data.id } });
        const walletCount = await tx.walletTransaction.count({ where: { conversationId: created.data.id } });
        const cancellationCount = await tx.cancellation.count({ where: { conversationId: created.data.id } });
        const attendanceCount = await tx.attendanceVerification.count({ where: { conversationId: created.data.id } });

        throw new SmokeRollback({
          firstProposalStatus: firstProposal.data.status,
          newTimeStatus: newTime.data.status,
          staleSelectionOk: staleSelection.ok,
          replacementActiveCount: replacement.data.proposedTimes.filter((time) => time.version === 2 && time.status === "ACTIVE").length,
          selectedStatus: selected.data.status,
          paymentCount,
          walletCount,
          cancellationCount,
          attendanceCount
        });
      }, {
        maxWait: 10_000,
        timeout: 20_000
      })) as typeof withUseravaaTransaction;

    try {
      await runInRollbackTransaction(async () => undefined);
    } catch (error) {
      if (error instanceof SmokeRollback) {
        summary = error.summary;
      } else {
        throw error;
      }
    }

    expect(summary).toMatchObject({
      firstProposalStatus: "TIMES_PROPOSED",
      newTimeStatus: "NEW_TIME_REQUESTED",
      staleSelectionOk: false,
      replacementActiveCount: 3,
      selectedStatus: "CONFIRMED",
      paymentCount: 1,
      walletCount: 0,
      cancellationCount: 0,
      attendanceCount: 0
    });

    await expect(prisma.user.findUnique({ where: { id: requesterId } })).resolves.toBeNull();
    await expect(prisma.user.findUnique({ where: { id: providerId } })).resolves.toBeNull();
    await prisma.$disconnect();
  }, 30_000);
});
