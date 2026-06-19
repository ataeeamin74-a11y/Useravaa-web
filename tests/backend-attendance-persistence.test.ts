import fs from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { getPrismaClient } from "@/lib/backend/db/prisma";
import { withUseravaaTransaction, type UseravaaTransactionClient } from "@/lib/backend/db/transaction";
import type { ConversationResponseDto } from "@/lib/backend/dto/conversation";
import { apiEndpointPersistenceClassification } from "@/lib/backend/endpoint-classification";
import { backendImplementationClassification } from "@/lib/backend/implementation-classification";
import { buildAttendanceVerificationMaterial } from "@/lib/backend/repositories/attendance";
import type { SafeConversationRecord } from "@/lib/backend/repositories/conversation";
import { conversationService, type ServiceResult } from "@/lib/backend/services";
import { attendanceSubmitCodeSchema } from "@/lib/backend/validation";

const projectRoot = process.cwd();
const now = new Date("2026-06-13T08:00:00.000Z");
const pastStart = new Date("2026-06-13T07:00:00.000Z");
const futureStart = new Date("2026-06-13T09:00:00.000Z");

function readProjectFile(relativePath: string) {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

type FakeAttendance = {
  id: string;
  conversationId: string;
  status: string;
  codeHash: string | null;
  codeSalt: string | null;
  requesterCodeCiphertext: string | null;
  codeGeneratedAt: Date | null;
  codeExpiresAt: Date | null;
  submittedAt: Date | null;
  submittedByProviderId: string | null;
  submittedCodeHash: string | null;
  attempts: number;
  verifiedAt: Date | null;
  failedAt: Date | null;
  needsReviewAt: Date | null;
};

type FakeAttendanceState = {
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
  selectedTime: {
    id: string;
    startsAt: Date;
    shamsiDateLabel: string;
    timeLabel: string;
    status: string;
    version: number;
  } | null;
  payment: {
    id: string;
    status: string;
    method: string;
    requirement: string;
    amountToman: number;
    walletDeductionToman: number;
    gatewayPayableToman: number;
    finalizedAt: Date | null;
    failedAt: Date | null;
    refundedAt: Date | null;
  } | null;
  attendance: FakeAttendance | null;
  walletTransactionCreate: ReturnType<typeof vi.fn>;
  cancellationCreate: ReturnType<typeof vi.fn>;
  paymentUpdate: ReturnType<typeof vi.fn>;
};

function buildSafeConversation(state: FakeAttendanceState): SafeConversationRecord {
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
    selectedTime: state.selectedTime,
    proposedTimes: state.selectedTime
      ? [
          {
            id: state.selectedTime.id,
            proposalSetId: "proposal-set-1",
            version: state.selectedTime.version,
            startsAt: state.selectedTime.startsAt,
            shamsiDateLabel: state.selectedTime.shamsiDateLabel,
            timeLabel: state.selectedTime.timeLabel,
            status: state.selectedTime.status
          }
        ]
      : [],
    payment: state.payment
      ? {
          id: state.payment.id,
          method: state.payment.method,
          requirement: state.payment.requirement,
          status: state.payment.status,
          amountToman: state.payment.amountToman,
          walletDeductionToman: state.payment.walletDeductionToman,
          gatewayPayableToman: state.payment.gatewayPayableToman,
          finalizedAt: state.payment.finalizedAt,
          failedAt: state.payment.failedAt,
          refundedAt: state.payment.refundedAt,
          manualReview: null
        }
      : null,
    attendanceVerification: state.attendance
      ? {
          id: state.attendance.id,
          status: state.attendance.status,
          codeGeneratedAt: state.attendance.codeGeneratedAt,
          codeExpiresAt: state.attendance.codeExpiresAt,
          submittedAt: state.attendance.submittedAt,
          attempts: state.attendance.attempts,
          verifiedAt: state.attendance.verifiedAt,
          failedAt: state.attendance.failedAt,
          needsReviewAt: state.attendance.needsReviewAt
        }
      : null,
    cancellations: []
  } as SafeConversationRecord;
}

function createFakeAttendanceFlow(
  overrides: {
    conversation?: Partial<FakeAttendanceState["conversation"]>;
    selectedTime?: Partial<NonNullable<FakeAttendanceState["selectedTime"]>> | null;
    payment?: Partial<NonNullable<FakeAttendanceState["payment"]>> | null;
    attendance?: Partial<FakeAttendance> | null;
  } = {}
) {
  const material = buildAttendanceVerificationMaterial("conversation-1", now, "48291", "salt-1");
  const state: FakeAttendanceState = {
    conversation: {
      id: "conversation-1",
      requesterId: "requester-1",
      providerId: "provider-1",
      experienceProfileId: "experience-profile-1",
      duration: "MIN_30",
      priceToman: 500000,
      status: "CONFIRMED",
      paymentRequirement: "PAYMENT_REQUIRED",
      requestTopic: "career path",
      requestNote: "short note",
      providerVisibleAt: now,
      timesProposedAt: now,
      requesterSelectionDeadlineAt: null,
      selectedTimeId: "time-1",
      selectedAt: now,
      paymentFinalizedAt: now,
      freeFinalizedAt: null,
      confirmedAt: now,
      completedAt: null,
      rejectedAt: null,
      expiredAt: null,
      cancelledAt: null,
      createdAt: now,
      updatedAt: now,
      ...overrides.conversation
    },
    selectedTime:
      overrides.selectedTime === null
        ? null
        : {
            id: "time-1",
            startsAt: pastStart,
            shamsiDateLabel: "1405/03/23",
            timeLabel: "10:30",
            status: "SELECTED",
            version: 1,
            ...overrides.selectedTime
          },
    payment:
      overrides.payment === null
        ? null
        : {
            id: "payment-1",
            status: "PAID",
            method: "CARD_TO_CARD",
            requirement: "PAYMENT_REQUIRED",
            amountToman: 500000,
            walletDeductionToman: 0,
            gatewayPayableToman: 500000,
            finalizedAt: now,
            failedAt: null,
            refundedAt: null,
            ...overrides.payment
          },
    attendance:
      overrides.attendance === null
        ? null
        : {
            id: "attendance-1",
            conversationId: "conversation-1",
            status: "PENDING",
            codeHash: material.codeHash,
            codeSalt: material.codeSalt,
            requesterCodeCiphertext: material.requesterCodeCiphertext,
            codeGeneratedAt: material.codeGeneratedAt,
            codeExpiresAt: material.codeExpiresAt,
            submittedAt: null,
            submittedByProviderId: null,
            submittedCodeHash: null,
            attempts: 0,
            verifiedAt: null,
            failedAt: null,
            needsReviewAt: null,
            ...overrides.attendance
          },
    walletTransactionCreate: vi.fn(),
    cancellationCreate: vi.fn(),
    paymentUpdate: vi.fn()
  };

  const attendanceConversation = () => ({
    id: state.conversation.id,
    requesterId: state.conversation.requesterId,
    providerId: state.conversation.providerId,
    status: state.conversation.status,
    paymentRequirement: state.conversation.paymentRequirement,
    providerVisibleAt: state.conversation.providerVisibleAt,
    selectedTimeId: state.conversation.selectedTimeId,
    selectedAt: state.conversation.selectedAt,
    confirmedAt: state.conversation.confirmedAt,
    completedAt: state.conversation.completedAt,
    cancelledAt: state.conversation.cancelledAt,
    expiredAt: state.conversation.expiredAt,
    rejectedAt: state.conversation.rejectedAt,
    selectedTime: state.selectedTime,
    payment: state.payment
      ? {
          id: state.payment.id,
          status: state.payment.status,
          requirement: state.payment.requirement,
          finalizedAt: state.payment.finalizedAt
        }
      : null,
    attendanceVerification: state.attendance
  });

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

        return attendanceConversation();
      }),
      update: vi.fn(async ({ data }: { data: Partial<FakeAttendanceState["conversation"]> }) => {
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
    attendanceVerification: {
      findUnique: vi.fn(async ({ where }: { where: { conversationId: string } }) => {
        if (where.conversationId !== state.conversation.id) {
          return null;
        }

        return state.attendance;
      }),
      create: vi.fn(async ({ data }: { data: Partial<FakeAttendance> }) => {
        state.attendance = {
          id: "attendance-1",
          conversationId: state.conversation.id,
          status: data.status ?? "PENDING",
          codeHash: data.codeHash ?? null,
          codeSalt: data.codeSalt ?? null,
          requesterCodeCiphertext: data.requesterCodeCiphertext ?? null,
          codeGeneratedAt: data.codeGeneratedAt ?? null,
          codeExpiresAt: data.codeExpiresAt ?? null,
          submittedAt: null,
          submittedByProviderId: null,
          submittedCodeHash: null,
          attempts: data.attempts ?? 0,
          verifiedAt: null,
          failedAt: null,
          needsReviewAt: null
        };
        return state.attendance;
      }),
      update: vi.fn(async ({ data }: { data: Partial<FakeAttendance> }) => {
        if (!state.attendance) {
          throw new Error("Attendance not found");
        }

        Object.assign(state.attendance, data);
        return state.attendance;
      })
    },
    walletTransaction: {
      create: state.walletTransactionCreate
    },
    cancellation: {
      create: state.cancellationCreate
    },
    payment: {
      update: state.paymentUpdate
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

describe("Checkpoint 2B-5A attendance verification persistence", () => {
  it("keeps attendance submit route authenticated, validated, awaited, and fixture-free", () => {
    const source = readProjectFile("src/app/api/conversations/[conversationId]/attendance/submit-code/route.ts");

    expect(source).toContain("requireApiViewer");
    expect(source).toContain("parseJsonBody(request, attendanceSubmitCodeSchema)");
    expect(source).toContain("await conversationService.submitAttendanceCode");
    expect(source).not.toContain("@/features/v51/data");
    expect(source).not.toContain("getConversationOrFallback");
  });

  it("validates submitted code payload shape and rejects privileged fields", () => {
    expect(attendanceSubmitCodeSchema.safeParse({ code: " 48291 " }).success).toBe(true);
    expect(attendanceSubmitCodeSchema.safeParse({ code: " " }).success).toBe(false);
    expect(attendanceSubmitCodeSchema.safeParse({ code: "48291", verifiedAt: now.toISOString() }).success).toBe(false);
    expect(attendanceSubmitCodeSchema.safeParse({ code: "48291", walletTransactionId: "wallet-1" }).success).toBe(false);
    expect(attendanceSubmitCodeSchema.safeParse({ code: "48291", paymentStatus: "PAID" }).success).toBe(false);
    expect(attendanceSubmitCodeSchema.safeParse({ code: "48291", cancellationId: "cancel-1" }).success).toBe(false);
  });

  it("lets requester retrieve own attendance code without exposing it through provider DTOs", async () => {
    const { state, runInTransaction } = createFakeAttendanceFlow({ attendance: null });
    const result = await conversationService.getAttendanceCodeForRequester(
      { id: "requester-1" },
      "conversation-1",
      {
        runInTransaction,
        now: () => now,
        codeGenerator: () => "48291",
        saltGenerator: () => "salt-1"
      }
    );

    expect(result).toMatchObject({
      ok: true,
      data: {
        conversationId: "conversation-1",
        status: "PENDING",
        code: "48291"
      }
    });
    const providerDto = await expectOk(
      conversationService.submitAttendanceCode(
        { id: "provider-1" },
        "conversation-1",
        { code: "48291" },
        { runInTransaction, now: () => now }
      )
    );
    const serialized = JSON.stringify(providerDto);

    expect(serialized).not.toContain("48291");
    expect(serialized).not.toContain(state.attendance?.codeHash ?? "hash");
    expect(serialized).not.toContain(state.attendance?.codeSalt ?? "salt");
  });

  it("allows only provider submission for own eligible confirmed session", async () => {
    const { state, runInTransaction } = createFakeAttendanceFlow();
    const data = await expectOk(
      conversationService.submitAttendanceCode(
        { id: "provider-1" },
        "conversation-1",
        { code: "48291" },
        { runInTransaction, now: () => now }
      )
    );

    expect(data).toMatchObject({
      viewerRole: "PROVIDER",
      status: "COMPLETED",
      attendanceVerification: {
        status: "VERIFIED",
        attempts: 0,
        submittedAt: now,
        verifiedAt: now
      }
    });
    expect(state.attendance).toMatchObject({
      status: "VERIFIED",
      submittedByProviderId: "provider-1",
      verifiedAt: now
    });
    expect(state.walletTransactionCreate).not.toHaveBeenCalled();
    expect(state.cancellationCreate).not.toHaveBeenCalled();
    expect(state.paymentUpdate).not.toHaveBeenCalled();

    const requesterAttempt = createFakeAttendanceFlow();
    await expect(
      conversationService.submitAttendanceCode(
        { id: "requester-1" },
        "conversation-1",
        { code: "48291" },
        { runInTransaction: requesterAttempt.runInTransaction, now: () => now }
      )
    ).resolves.toMatchObject({
      ok: false,
      code: "conversation_not_found"
    });
  });

  it("rejects unrelated, unconfirmed, cancelled, and future-session submissions", async () => {
    const unrelated = createFakeAttendanceFlow();
    const unconfirmed = createFakeAttendanceFlow({
      conversation: {
        status: "TIMES_PROPOSED",
        confirmedAt: null
      }
    });
    const cancelled = createFakeAttendanceFlow({
      conversation: {
        cancelledAt: now
      }
    });
    const future = createFakeAttendanceFlow({
      selectedTime: {
        startsAt: futureStart
      }
    });

    await expect(
      conversationService.submitAttendanceCode(
        { id: "unrelated-1" },
        "conversation-1",
        { code: "48291" },
        { runInTransaction: unrelated.runInTransaction, now: () => now }
      )
    ).resolves.toMatchObject({ ok: false, code: "conversation_not_found" });
    await expect(
      conversationService.submitAttendanceCode(
        { id: "provider-1" },
        "conversation-1",
        { code: "48291" },
        { runInTransaction: unconfirmed.runInTransaction, now: () => now }
      )
    ).resolves.toMatchObject({ ok: false, code: "invalid_state" });
    await expect(
      conversationService.submitAttendanceCode(
        { id: "provider-1" },
        "conversation-1",
        { code: "48291" },
        { runInTransaction: cancelled.runInTransaction, now: () => now }
      )
    ).resolves.toMatchObject({ ok: false, code: "invalid_state" });
    await expect(
      conversationService.submitAttendanceCode(
        { id: "provider-1" },
        "conversation-1",
        { code: "48291" },
        { runInTransaction: future.runInTransaction, now: () => now }
      )
    ).resolves.toMatchObject({ ok: false, code: "invalid_state" });
  });

  it("records invalid attempts safely without wallet, payment, payout, or cancellation side effects", async () => {
    const { state, runInTransaction } = createFakeAttendanceFlow();
    await expect(
      conversationService.submitAttendanceCode(
        { id: "provider-1" },
        "conversation-1",
        { code: "00000" },
        { runInTransaction, now: () => now }
      )
    ).resolves.toMatchObject({
      ok: false,
      code: "attendance_code_invalid"
    });

    expect(state.attendance).toMatchObject({
      status: "FAILED",
      attempts: 1,
      failedAt: now,
      verifiedAt: null
    });
    expect(state.conversation.status).toBe("CONFIRMED");
    expect(state.payment?.status).toBe("PAID");
    expect(state.walletTransactionCreate).not.toHaveBeenCalled();
    expect(state.cancellationCreate).not.toHaveBeenCalled();
    expect(state.paymentUpdate).not.toHaveBeenCalled();
  });

  it("blocks already verified attendance from being submitted again", async () => {
    const verified = createFakeAttendanceFlow({
      conversation: {
        status: "COMPLETED",
        completedAt: now
      },
      attendance: {
        status: "VERIFIED",
        verifiedAt: now
      }
    });

    await expect(
      conversationService.submitAttendanceCode(
        { id: "provider-1" },
        "conversation-1",
        { code: "48291" },
        { runInTransaction: verified.runInTransaction, now: () => now }
      )
    ).resolves.toMatchObject({
      ok: false,
      code: "invalid_state"
    });
  });

  it("classifies attendance endpoint and domain honestly", () => {
    expect(apiEndpointPersistenceClassification["POST /api/conversations/[conversationId]/attendance/submit-code"]).toMatchObject({
      classification: "transaction_ready",
      usesRepository: true,
      writesImplemented: true
    });
    expect(backendImplementationClassification.attendanceVerification).toMatchObject({
      classification: "transaction_ready",
      writesImplemented: true,
      productionProviderConfigured: false
    });
  });

  it("runs rollback-backed DB smoke coverage for attendance verification when enabled", async () => {
    if (process.env.USERAVAA_DB_SMOKE_TEST !== "1") {
      expect(process.env.USERAVAA_DB_SMOKE_TEST).not.toBe("1");
      return;
    }

    class SmokeRollback extends Error {
      constructor(readonly summary: Record<string, unknown>) {
        super("ATTENDANCE_SMOKE_ROLLBACK");
      }
    }

    const prisma = getPrismaClient();
    const unique = `attendance-smoke-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const requesterId = `${unique}-requester`;
    const providerId = `${unique}-provider`;
    const unrelatedId = `${unique}-unrelated`;
    const providerProfileId = `${unique}-profile`;
    const experienceProfileId = `${unique}-experience`;
    let summary: Record<string, unknown> | null = null;

    async function createConfirmedConversation(tx: UseravaaTransactionClient, idSuffix: string) {
      const conversation = await tx.conversationRequest.create({
        data: {
          requesterId,
          providerId,
          experienceProfileId,
          duration: "MIN_30",
          priceToman: 500000,
          status: "CONFIRMED",
          paymentRequirement: "PAYMENT_REQUIRED",
          requestTopic: `attendance smoke ${idSuffix}`,
          requestNote: "Create confirmed request for attendance smoke.",
          providerVisibleAt: now,
          paymentFinalizedAt: now,
          selectedAt: now,
          confirmedAt: now
        },
        select: { id: true }
      });
      await tx.payment.create({
        data: {
          conversationId: conversation.id,
          payerId: requesterId,
          method: "CARD_TO_CARD",
          requirement: "PAYMENT_REQUIRED",
          status: "PAID",
          amountToman: 500000,
          walletDeductionToman: 0,
          gatewayPayableToman: 500000,
          finalizedAt: now
        }
      });
      const proposalSet = await tx.timeProposalSet.create({
        data: {
          conversationId: conversation.id,
          version: 1,
          status: "SELECTED",
          proposedById: providerId,
          proposedAt: now,
          selectedAt: now
        },
        select: { id: true }
      });
      const selectedTime = await tx.proposedTime.create({
        data: {
          conversationId: conversation.id,
          proposalSetId: proposalSet.id,
          version: 1,
          startsAt: pastStart,
          shamsiDateLabel: "1405/03/23",
          timeLabel: "10:30",
          status: "SELECTED",
          selectedAt: now
        },
        select: { id: true }
      });
      await tx.conversationRequest.update({
        where: { id: conversation.id },
        data: {
          selectedTimeId: selectedTime.id
        }
      });

      return conversation.id;
    }

    try {
      await prisma.$transaction(async (tx) => {
        await tx.user.createMany({
          data: [
            {
              id: requesterId,
              email: `${unique}-requester@smoke.useravaa.test`,
              displayName: "Smoke requester"
            },
            {
              id: providerId,
              email: `${unique}-provider@smoke.useravaa.test`,
              displayName: "Smoke provider"
            },
            {
              id: unrelatedId,
              email: `${unique}-unrelated@smoke.useravaa.test`,
              displayName: "Smoke unrelated"
            }
          ]
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

        const txRunner = (async <T>(operation: (transaction: UseravaaTransactionClient) => Promise<T>) =>
          operation(tx)) as typeof withUseravaaTransaction;
        const verifiedConversationId = await createConfirmedConversation(tx, "valid");
        const invalidConversationId = await createConfirmedConversation(tx, "invalid");
        const requesterView = await conversationService.getAttendanceCodeForRequester(
          { id: requesterId },
          verifiedConversationId,
          {
            runInTransaction: txRunner,
            now: () => now,
            codeGenerator: () => "48291",
            saltGenerator: () => "smoke-salt"
          }
        );

        if (!requesterView.ok) {
          throw new Error(requesterView.message);
        }

        const providerRawView = await conversationService.getConversation({ id: providerId }, verifiedConversationId);
        const unrelatedView = await conversationService.getAttendanceCodeForRequester(
          { id: unrelatedId },
          verifiedConversationId,
          {
            runInTransaction: txRunner,
            now: () => now
          }
        );
        const verified = await conversationService.submitAttendanceCode(
          { id: providerId },
          verifiedConversationId,
          { code: "48291" },
          {
            runInTransaction: txRunner,
            now: () => now
          }
        );

        if (!verified.ok) {
          throw new Error(verified.message);
        }

        await conversationService.getAttendanceCodeForRequester(
          { id: requesterId },
          invalidConversationId,
          {
            runInTransaction: txRunner,
            now: () => now,
            codeGenerator: () => "73910",
            saltGenerator: () => "smoke-salt-invalid"
          }
        );
        const invalid = await conversationService.submitAttendanceCode(
          { id: providerId },
          invalidConversationId,
          { code: "00000" },
          {
            runInTransaction: txRunner,
            now: () => now
          }
        );
        const verifiedConversation = await tx.conversationRequest.findUniqueOrThrow({
          where: { id: verifiedConversationId }
        });
        const invalidConversation = await tx.conversationRequest.findUniqueOrThrow({
          where: { id: invalidConversationId }
        });
        const verifiedAttendance = await tx.attendanceVerification.findUniqueOrThrow({
          where: { conversationId: verifiedConversationId }
        });
        const invalidAttendance = await tx.attendanceVerification.findUniqueOrThrow({
          where: { conversationId: invalidConversationId }
        });
        const walletCount = await tx.walletTransaction.count({
          where: { conversationId: verifiedConversationId }
        });
        const cancellationCount = await tx.cancellation.count({
          where: { conversationId: verifiedConversationId }
        });
        const verifiedPayment = await tx.payment.findUniqueOrThrow({
          where: { conversationId: verifiedConversationId }
        });
        const invalidPayment = await tx.payment.findUniqueOrThrow({
          where: { conversationId: invalidConversationId }
        });

        throw new SmokeRollback({
          requesterCanReadCode: requesterView.ok,
          providerDtoHasRawCode: JSON.stringify(providerRawView).includes("48291"),
          unrelatedCanRead: unrelatedView.ok,
          verifiedStatus: verifiedAttendance.status,
          verifiedConversationStatus: verifiedConversation.status,
          invalidOk: invalid.ok,
          invalidStatus: invalidAttendance.status,
          invalidConversationStatus: invalidConversation.status,
          walletCount,
          cancellationCount,
          verifiedPaymentStatus: verifiedPayment.status,
          invalidPaymentStatus: invalidPayment.status
        });
      }, {
        maxWait: 10_000,
        timeout: 20_000
      });
    } catch (error) {
      if (error instanceof SmokeRollback) {
        summary = error.summary;
      } else {
        throw error;
      }
    }

    expect(summary).toMatchObject({
      requesterCanReadCode: true,
      providerDtoHasRawCode: false,
      unrelatedCanRead: false,
      verifiedStatus: "VERIFIED",
      verifiedConversationStatus: "COMPLETED",
      invalidOk: false,
      invalidStatus: "FAILED",
      invalidConversationStatus: "CONFIRMED",
      walletCount: 0,
      cancellationCount: 0,
      verifiedPaymentStatus: "PAID",
      invalidPaymentStatus: "PAID"
    });

    await expect(prisma.user.findUnique({ where: { id: requesterId } })).resolves.toBeNull();
    await expect(prisma.user.findUnique({ where: { id: providerId } })).resolves.toBeNull();
    await prisma.$disconnect();
  }, 30_000);
});
