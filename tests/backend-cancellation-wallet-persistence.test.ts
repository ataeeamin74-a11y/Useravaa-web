import fs from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { CANCELLATION_NEAR_SESSION_THRESHOLD_HOURS } from "@/lib/backend/cancellation-policy";
import { getPrismaClient } from "@/lib/backend/db/prisma";
import type { UseravaaTransactionClient } from "@/lib/backend/db/transaction";
import { toConversationResponseDto } from "@/lib/backend/dto/conversation";
import { apiEndpointPersistenceClassification } from "@/lib/backend/endpoint-classification";
import { backendImplementationClassification } from "@/lib/backend/implementation-classification";
import type { SafeConversationRecord } from "@/lib/backend/repositories/conversation";
import { useravaaRepository } from "@/lib/backend/repository";
import { adminCancellationService, conversationService } from "@/lib/backend/services";
import {
  adminCancellationCreditApprovalSchema,
  adminCancellationCreditRejectionSchema,
  cancellationRequestSchema
} from "@/lib/backend/validation";

const projectRoot = process.cwd();
const now = new Date("2026-06-13T08:00:00.000Z");

function readProjectFile(relativePath: string) {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

function futureDate(hours: number) {
  return new Date(now.getTime() + hours * 60 * 60 * 1000);
}

function baseConversation(overrides: Partial<SafeConversationRecord> = {}): SafeConversationRecord {
  return {
    id: "conversation-1",
    requesterId: "requester-1",
    providerId: "provider-1",
    experienceProfileId: "experience-profile-1",
    duration: "MIN_30",
    priceToman: 100000,
    status: "AWAITING_TIME_PROPOSAL",
    paymentRequirement: "PAYMENT_REQUIRED",
    requestTopic: "career path",
    requestNote: "private note",
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
    requester: {
      id: "requester-1",
      displayName: "Requester",
      avatarUrl: null
    },
    provider: {
      id: "provider-1",
      displayName: "Provider",
      avatarUrl: null
    },
    selectedTime: null,
    proposedTimes: [],
    payment: {
      id: "payment-1",
      method: "CARD_TO_CARD",
      requirement: "PAYMENT_REQUIRED",
      status: "PAID",
      amountToman: 100000,
      walletDeductionToman: 0,
      gatewayPayableToman: 100000,
      finalizedAt: now,
      failedAt: null,
      refundedAt: null,
      manualReview: null
    },
    attendanceVerification: null,
    cancellations: [],
    ...overrides
  } as SafeConversationRecord;
}

function confirmedConversation(hoursUntilSession: number, overrides: Partial<SafeConversationRecord> = {}) {
  const startsAt = futureDate(hoursUntilSession);
  return baseConversation({
    status: "CONFIRMED",
    selectedTimeId: "time-1",
    selectedAt: now,
    confirmedAt: now,
    timesProposedAt: now,
    selectedTime: {
      id: "time-1",
      startsAt,
      shamsiDateLabel: "شنبه ۲۴ خرداد",
      timeLabel: "۱۰:۰۰",
      status: "SELECTED",
      version: 1
    },
    proposedTimes: [
      {
        id: "time-1",
        proposalSetId: "set-1",
        version: 1,
        startsAt,
        shamsiDateLabel: "شنبه ۲۴ خرداد",
        timeLabel: "۱۰:۰۰",
        status: "SELECTED"
      }
    ],
    ...overrides
  });
}

function createFakeCancellationFlow(initialConversation: SafeConversationRecord) {
  const state = {
    conversation: structuredClone(initialConversation) as SafeConversationRecord,
    wallet: null as { id: string; userId: string; balanceToman: number } | null,
    cancellations: [] as Array<Record<string, unknown>>,
    walletTransactions: [] as Array<Record<string, unknown>>,
    conversationUpdate: vi.fn(),
    cancellationCreate: vi.fn(),
    cancellationUpdate: vi.fn(),
    adminAuditCreate: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
      id: `admin-audit-${Date.now()}`,
      ...data
    })),
    walletTransactionCreate: vi.fn(),
    walletUpdate: vi.fn(),
    paymentUpdate: vi.fn(),
    attendanceUpdate: vi.fn(),
    withdrawalCreate: vi.fn()
  };

  const buildSafeConversation = () =>
    ({
      ...state.conversation,
      cancellations: state.cancellations.map((cancellation) => ({
        id: String(cancellation.id),
        cancelledByRole: String(cancellation.cancelledByRole),
        status: String(cancellation.status),
        stage: String(cancellation.stage),
        reasonCode: String(cancellation.reasonCode),
        refundRateBps: Number(cancellation.refundRateBps),
        refundAmountToman: Number(cancellation.refundAmountToman),
        refundDestination: String(cancellation.refundDestination),
        isLateRequesterCancellation: Boolean(cancellation.isLateRequesterCancellation),
        createdAt: cancellation.createdAt as Date,
        completedAt: (cancellation.completedAt as Date | null) ?? null
      }))
    }) as SafeConversationRecord;

  const buildAdminCancellationReview = (cancellation: Record<string, unknown>) => ({
    id: String(cancellation.id),
    conversationId: String(cancellation.conversationId),
    cancelledByUserId: (cancellation.cancelledByUserId as string | null | undefined) ?? null,
    cancelledByRole: String(cancellation.cancelledByRole),
    status: String(cancellation.status),
    stage: String(cancellation.stage),
    reasonCode: String(cancellation.reasonCode),
    otherReasonText: (cancellation.otherReasonText as string | null | undefined) ?? null,
    refundRateBps: Number(cancellation.refundRateBps ?? 0),
    refundAmountToman: Number(cancellation.refundAmountToman ?? 0),
    refundDestination: String(cancellation.refundDestination ?? "NONE"),
    providerGrossCompensationToman: Number(cancellation.providerGrossCompensationToman ?? 0),
    useravaaFeeRateBps: Number(cancellation.useravaaFeeRateBps ?? 0),
    useravaaFeeAmountToman: Number(cancellation.useravaaFeeAmountToman ?? 0),
    providerNetCompensationToman: Number(cancellation.providerNetCompensationToman ?? 0),
    hoursUntilSession: cancellation.hoursUntilSession ?? null,
    isLateRequesterCancellation: Boolean(cancellation.isLateRequesterCancellation),
    requesterRefundWalletTransactionId: (cancellation.requesterRefundWalletTransactionId as string | null | undefined) ?? null,
    providerCompensationWalletTransactionId:
      (cancellation.providerCompensationWalletTransactionId as string | null | undefined) ?? null,
    supportReviewReason: (cancellation.supportReviewReason as string | null | undefined) ?? null,
    reviewedByAdminId: (cancellation.reviewedByAdminId as string | null | undefined) ?? null,
    reviewedAt: (cancellation.reviewedAt as Date | null | undefined) ?? null,
    completedAt: (cancellation.completedAt as Date | null | undefined) ?? null,
    rejectedAt: (cancellation.rejectedAt as Date | null | undefined) ?? null,
    createdAt: (cancellation.createdAt as Date | undefined) ?? now,
    updatedAt: (cancellation.updatedAt as Date | undefined) ?? now,
    conversation: {
      id: state.conversation.id,
      requesterId: state.conversation.requesterId,
      providerId: state.conversation.providerId,
      status: state.conversation.status,
      requestTopic: state.conversation.requestTopic,
      priceToman: state.conversation.priceToman,
      confirmedAt: state.conversation.confirmedAt,
      selectedTimeId: state.conversation.selectedTimeId,
      payment: state.conversation.payment
        ? {
            id: state.conversation.payment.id,
            status: state.conversation.payment.status,
            requirement: state.conversation.payment.requirement,
            method: state.conversation.payment.method,
            amountToman: state.conversation.payment.amountToman,
            finalizedAt: state.conversation.payment.finalizedAt,
            refundedAt: state.conversation.payment.refundedAt
          }
        : null,
      selectedTime: state.conversation.selectedTime
        ? {
            id: state.conversation.selectedTime.id,
            startsAt: state.conversation.selectedTime.startsAt,
            shamsiDateLabel: state.conversation.selectedTime.shamsiDateLabel,
            timeLabel: state.conversation.selectedTime.timeLabel,
            status: state.conversation.selectedTime.status
          }
        : null,
      proposedTimes: state.conversation.proposedTimes.slice(0, 1).map((time) => ({ id: time.id })),
      attendanceVerification: state.conversation.attendanceVerification
        ? {
            id: state.conversation.attendanceVerification.id,
            status: state.conversation.attendanceVerification.status,
            verifiedAt: state.conversation.attendanceVerification.verifiedAt
          }
        : null,
      walletTransactions: state.walletTransactions.slice(0, 1).map((transaction) => ({ id: String(transaction.id) }))
    }
  });

  const tx = {
    conversationRequest: {
      findFirst: vi.fn(async ({ where }: { where: { id?: string; requesterId?: string } }) => {
        if (where.id && where.id !== state.conversation.id) {
          return null;
        }

        if (where.requesterId && where.requesterId !== state.conversation.requesterId) {
          return null;
        }

        return buildSafeConversation();
      }),
      findUnique: vi.fn(async ({ where }: { where: { id?: string } }) => {
        if (where.id !== state.conversation.id) {
          return null;
        }

        return buildSafeConversation();
      }),
      update: vi.fn(async ({ data }: { data: Partial<SafeConversationRecord> }) => {
        state.conversationUpdate(data);
        state.conversation = {
          ...state.conversation,
          ...data,
          updatedAt: now
        } as SafeConversationRecord;
        return buildSafeConversation();
      })
    },
    cancellation: {
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
        const cancellation = state.cancellations.find((item) => item.id === where.id);
        return cancellation ? buildAdminCancellationReview(cancellation) : null;
      }),
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        state.cancellationCreate(data);
        const cancellation = {
          id: `cancellation-${state.cancellations.length + 1}`,
          ...data
        };
        state.cancellations.unshift(cancellation);
        return {
          id: cancellation.id
        };
      }),
      update: vi.fn(async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        state.cancellationUpdate({ where, data });
        state.cancellations = state.cancellations.map((cancellation) =>
          cancellation.id === where.id
            ? {
                ...cancellation,
                ...data
              }
            : cancellation
        );
        const cancellation = state.cancellations.find((item) => item.id === where.id);
        return cancellation ? buildAdminCancellationReview(cancellation) : null;
      })
    },
    wallet: {
      upsert: vi.fn(async ({ where }: { where: { userId: string } }) => {
        if (!state.wallet) {
          state.wallet = {
            id: "wallet-1",
            userId: where.userId,
            balanceToman: 0
          };
        }

        return {
          id: state.wallet.id
        };
      }),
      update: vi.fn(async ({ data }: { data: { balanceToman?: { increment: number } } }) => {
        state.walletUpdate(data);
        if (!state.wallet) {
          throw new Error("wallet_missing");
        }

        state.wallet.balanceToman += data.balanceToman?.increment ?? 0;
        return state.wallet;
      })
    },
    walletTransaction: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        state.walletTransactionCreate(data);
        const transaction = {
          id: `wallet-transaction-${state.walletTransactions.length + 1}`,
          ...data
        };
        state.walletTransactions.push(transaction);
        return {
          id: transaction.id,
          walletId: data.walletId,
          amountToman: data.amountToman,
          type: data.type,
          status: data.status
        };
      })
    },
    payment: {
      update: state.paymentUpdate
    },
    attendanceVerification: {
      update: state.attendanceUpdate
    },
    withdrawalRequest: {
      create: state.withdrawalCreate
    },
    adminAuditEvent: {
      create: state.adminAuditCreate
    }
  };

  return {
    state,
    runInTransaction: async <T,>(operation: (tx: UseravaaTransactionClient) => Promise<T>) =>
      operation(tx as unknown as UseravaaTransactionClient)
  };
}

describe("2B-5B cancellation and wallet credit persistence", () => {
  it("requires only requester reason fields and rejects privileged cancellation overrides", () => {
    expect(cancellationRequestSchema.safeParse({ reasonCode: "changed" }).success).toBe(true);
    expect(cancellationRequestSchema.safeParse({ reasonCode: "changed", otherReasonText: "short note" }).success).toBe(true);
    expect(cancellationRequestSchema.safeParse({}).success).toBe(false);
    expect(cancellationRequestSchema.safeParse({ reasonCode: "changed", otherReasonText: "a".repeat(501) }).success).toBe(false);

    [
      "cancelledByRole",
      "stage",
      "refundRateBps",
      "walletCreditAmountToman",
      "walletId",
      "supportReviewRequired",
      "paymentStatus",
      "attendanceStatus",
      "providerNetCompensationToman",
      "settlementStatus",
      "selectedTimeId",
      "completedAt"
    ].forEach((field) => {
      expect(cancellationRequestSchema.safeParse({ reasonCode: "changed", [field]: "override" }).success, field).toBe(false);
    });
  });

  it("strictly validates admin support-review credit decision payloads", () => {
    expect(adminCancellationCreditApprovalSchema.safeParse({ creditAmountToman: 50000 }).success).toBe(true);
    expect(adminCancellationCreditApprovalSchema.safeParse({ reviewNote: "approved by support" }).success).toBe(true);
    expect(adminCancellationCreditApprovalSchema.safeParse({ creditAmountToman: 0 }).success).toBe(false);
    expect(adminCancellationCreditRejectionSchema.safeParse({ rejectionReason: "not eligible" }).success).toBe(true);
    expect(adminCancellationCreditRejectionSchema.safeParse({ reviewNote: "missing reason" }).success).toBe(false);

    [
      "requesterId",
      "providerId",
      "walletId",
      "paymentStatus",
      "attendanceStatus",
      "payoutStatus",
      "settlementStatus",
      "withdrawalStatus",
      "stage",
      "status",
      "actorAdminUserId",
      "balanceToman"
    ].forEach((field) => {
      expect(
        adminCancellationCreditApprovalSchema.safeParse({ creditAmountToman: 50000, [field]: "override" }).success,
        field
      ).toBe(false);
      expect(
        adminCancellationCreditRejectionSchema.safeParse({ rejectionReason: "not eligible", [field]: "override" }).success,
        field
      ).toBe(false);
    });
  });

  it("keeps the cancellation API authenticated, service-boundary based, and fixture-free", () => {
    const routeSource = readProjectFile("src/app/api/conversations/[conversationId]/cancel/route.ts");
    const approveRouteSource = readProjectFile("src/app/api/admin/cancellations/[cancellationId]/approve-credit/route.ts");
    const rejectRouteSource = readProjectFile("src/app/api/admin/cancellations/[cancellationId]/reject-credit/route.ts");
    const serviceSource = readProjectFile("src/lib/backend/services.ts");
    const repositorySource = readProjectFile("src/lib/backend/repositories/cancellation.ts");

    expect(routeSource).toContain("requireApiViewer");
    expect(routeSource).toContain("cancellationRequestSchema");
    expect(routeSource).toContain("await conversationService.cancelConversation");
    expect(routeSource).not.toContain("@/features/v51/data");
    expect(routeSource).not.toContain("getConversationOrFallback");
    [approveRouteSource, rejectRouteSource].forEach((source) => {
      expect(source).toContain("requireAdminViewer");
      expect(source).toContain("adminCancellationService");
      expect(source).not.toContain("@/features/v51/data");
      expect(source).not.toContain("getConversationOrFallback");
    });
    expect(serviceSource).toContain("withUseravaaTransaction");
    expect(repositorySource).not.toContain("@/features/v51/data");
    expect(repositorySource).not.toContain("getConversationOrFallback");
  });

  it("allows only the requester to cancel and does not leak existence to provider or unrelated users", async () => {
    const flow = createFakeCancellationFlow(baseConversation());

    await expect(
      conversationService.cancelConversation(
        { id: "provider-1" },
        "conversation-1",
        { reasonCode: "changed" },
        { runInTransaction: flow.runInTransaction, now: () => now }
      )
    ).resolves.toMatchObject({
      ok: false,
      code: "conversation_not_found"
    });
    await expect(
      conversationService.cancelConversation(
        { id: "unrelated-1" },
        "conversation-1",
        { reasonCode: "changed" },
        { runInTransaction: flow.runInTransaction, now: () => now }
      )
    ).resolves.toMatchObject({
      ok: false,
      code: "conversation_not_found"
    });

    expect(flow.state.cancellationCreate).not.toHaveBeenCalled();
    expect(flow.state.walletTransactionCreate).not.toHaveBeenCalled();
    expect(flow.state.conversationUpdate).not.toHaveBeenCalled();
  });

  it("creates 90% wallet credit, ledger row, and cancelled conversation before confirmation", async () => {
    const flow = createFakeCancellationFlow(baseConversation());
    const result = await conversationService.cancelConversation(
      { id: "requester-1" },
      "conversation-1",
      { reasonCode: "changed" },
      { runInTransaction: flow.runInTransaction, now: () => now }
    );

    expect(result).toMatchObject({
      ok: true,
      data: {
        status: "CANCELLED",
        cancellations: [
          {
            status: "COMPLETED",
            stage: "BEFORE_TIME_PROPOSAL",
            refundRateBps: 9000,
            refundAmountToman: 90000,
            refundDestination: "WALLET"
          }
        ]
      }
    });
    expect(flow.state.wallet?.balanceToman).toBe(90000);
    expect(flow.state.walletTransactions).toHaveLength(1);
    expect(flow.state.walletTransactions[0]).toMatchObject({
      type: "CANCELLATION_REFUND_CREDIT",
      status: "COMPLETED",
      settlementStatus: "NOT_SETTLEABLE",
      amountToman: 90000,
      sourceEntityType: "CANCELLATION",
      conversationId: "conversation-1",
      paymentId: "payment-1"
    });
    expect(flow.state.conversationUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "CANCELLED",
        cancelledAt: now
      })
    );
    expect(flow.state.paymentUpdate).not.toHaveBeenCalled();
    expect(flow.state.attendanceUpdate).not.toHaveBeenCalled();
    expect(flow.state.withdrawalCreate).not.toHaveBeenCalled();
  });

  it("uses the existing post-time-proposal stage but still credits 90% before confirmation", async () => {
    const flow = createFakeCancellationFlow(
      baseConversation({
        status: "TIMES_PROPOSED",
        timesProposedAt: now,
        proposedTimes: [
          {
            id: "time-1",
            proposalSetId: "set-1",
            version: 1,
            startsAt: futureDate(72),
            shamsiDateLabel: "شنبه ۲۴ خرداد",
            timeLabel: "۱۰:۰۰",
            status: "ACTIVE"
          }
        ]
      })
    );

    const result = await conversationService.cancelConversation(
      { id: "requester-1" },
      "conversation-1",
      { reasonCode: "changed" },
      { runInTransaction: flow.runInTransaction, now: () => now }
    );

    expect(result).toMatchObject({
      ok: true,
      data: {
        cancellations: [
          {
            stage: "AFTER_TIME_PROPOSAL_BEFORE_SELECTION",
            refundRateBps: 9000,
            refundAmountToman: 90000
          }
        ]
      }
    });
  });

  it("creates 50% wallet credit for confirmed sessions outside the near-session threshold", async () => {
    const flow = createFakeCancellationFlow(confirmedConversation(CANCELLATION_NEAR_SESSION_THRESHOLD_HOURS + 6));
    const result = await conversationService.cancelConversation(
      { id: "requester-1" },
      "conversation-1",
      { reasonCode: "changed" },
      { runInTransaction: flow.runInTransaction, now: () => now }
    );

    expect(result).toMatchObject({
      ok: true,
      data: {
        status: "CANCELLED",
        cancellations: [
          {
            status: "COMPLETED",
            stage: "AFTER_CONFIRMED_SESSION",
            refundRateBps: 5000,
            refundAmountToman: 50000,
            refundDestination: "WALLET"
          }
        ]
      }
    });
    expect(flow.state.wallet?.balanceToman).toBe(50000);
    expect(flow.state.walletTransactions).toHaveLength(1);
  });

  it("moves near-session cancellation to support review without automatic wallet credit", async () => {
    const flow = createFakeCancellationFlow(confirmedConversation(2));
    const result = await conversationService.cancelConversation(
      { id: "requester-1" },
      "conversation-1",
      { reasonCode: "changed" },
      { runInTransaction: flow.runInTransaction, now: () => now }
    );

    expect(result).toMatchObject({
      ok: true,
      data: {
        status: "CANCELLED",
        cancellations: [
          {
            status: "UNDER_SUPPORT_REVIEW",
            stage: "NEAR_SESSION_START",
            refundRateBps: 0,
            refundAmountToman: 0,
            refundDestination: "NONE",
            isLateRequesterCancellation: true
          }
        ]
      }
    });
    expect(flow.state.wallet).toBeNull();
    expect(flow.state.walletTransactionCreate).not.toHaveBeenCalled();
    expect(flow.state.cancellationUpdate).not.toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          requesterRefundWalletTransactionId: expect.any(String)
        })
      })
    );
  });

  it("allows ADMIN/SUPPORT to approve support-review wallet credit with audit and no unrelated side effects", async () => {
    const flow = createFakeCancellationFlow(confirmedConversation(2));
    const cancelled = await conversationService.cancelConversation(
      { id: "requester-1" },
      "conversation-1",
      { reasonCode: "changed" },
      { runInTransaction: flow.runInTransaction, now: () => now }
    );

    expect(cancelled).toMatchObject({ ok: true });

    const cancellationId = String(flow.state.cancellations[0].id);
    await expect(
      adminCancellationService.approveCredit(
        { id: "requester-1", role: "USER" },
        cancellationId,
        { creditAmountToman: 50000, actorAdminUserId: "spoofed-admin" },
        { runInTransaction: flow.runInTransaction, now: () => now }
      )
    ).resolves.toMatchObject({
      ok: false,
      code: "unauthorized"
    });

    const approved = await adminCancellationService.approveCredit(
      { id: "admin-1", role: "ADMIN" },
      cancellationId,
      { creditAmountToman: 50000, reviewNote: "safe support review" },
      { runInTransaction: flow.runInTransaction, now: () => now }
    );

    expect(approved).toMatchObject({
      ok: true,
      data: {
        status: "COMPLETED",
        refundAmountToman: 50000,
        refundDestination: "WALLET",
        reviewedByAdminId: "admin-1",
        requesterRefundWalletTransactionId: "wallet-transaction-1",
        conversation: {
          payment: {
            status: "PAID"
          }
        }
      }
    });
    expect(flow.state.wallet?.balanceToman).toBe(50000);
    expect(flow.state.walletTransactions).toHaveLength(1);
    expect(flow.state.walletTransactions[0]).toMatchObject({
      type: "CANCELLATION_REFUND_CREDIT",
      status: "COMPLETED",
      settlementStatus: "NOT_SETTLEABLE",
      amountToman: 50000,
      sourceEntityType: "CANCELLATION",
      sourceEntityId: cancellationId,
      conversationId: "conversation-1",
      paymentId: "payment-1"
    });
    expect(flow.state.adminAuditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actorAdminUserId: "admin-1",
          actorRole: "ADMIN",
          action: "CANCELLATION_SUPPORT_CREDIT_APPROVED",
          entityType: "CANCELLATION",
          entityId: cancellationId,
          relatedConversationId: "conversation-1",
          relatedPaymentId: "payment-1",
          note: "safe support review",
          metadata: expect.objectContaining({
            approvedCreditAmountToman: 50000,
            walletTransactionId: "wallet-transaction-1"
          })
        })
      })
    );
    expect(flow.state.paymentUpdate).not.toHaveBeenCalled();
    expect(flow.state.attendanceUpdate).not.toHaveBeenCalled();
    expect(flow.state.withdrawalCreate).not.toHaveBeenCalled();
  });

  it("rejects support-review wallet credit without ledger movement and writes audit", async () => {
    const flow = createFakeCancellationFlow(confirmedConversation(2));
    await conversationService.cancelConversation(
      { id: "requester-1" },
      "conversation-1",
      { reasonCode: "changed" },
      { runInTransaction: flow.runInTransaction, now: () => now }
    );

    const cancellationId = String(flow.state.cancellations[0].id);
    const rejected = await adminCancellationService.rejectCredit(
      { id: "support-1", role: "SUPPORT" },
      cancellationId,
      { rejectionReason: "No credit for this support-review case.", reviewNote: "closed" },
      { runInTransaction: flow.runInTransaction, now: () => now }
    );

    expect(rejected).toMatchObject({
      ok: true,
      data: {
        status: "REJECTED",
        refundAmountToman: 0,
        refundDestination: "NONE",
        reviewedByAdminId: "support-1",
        requesterRefundWalletTransactionId: null
      }
    });
    expect(flow.state.wallet).toBeNull();
    expect(flow.state.walletTransactionCreate).not.toHaveBeenCalled();
    expect(flow.state.walletUpdate).not.toHaveBeenCalled();
    expect(flow.state.adminAuditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actorAdminUserId: "support-1",
          actorRole: "SUPPORT",
          action: "CANCELLATION_SUPPORT_CREDIT_REJECTED",
          entityType: "CANCELLATION",
          entityId: cancellationId,
          reason: "No credit for this support-review case.",
          note: "closed"
        })
      })
    );
    expect(flow.state.paymentUpdate).not.toHaveBeenCalled();
    expect(flow.state.attendanceUpdate).not.toHaveBeenCalled();
    expect(flow.state.withdrawalCreate).not.toHaveBeenCalled();
  });

  it("rejects support-review credit above the server-derived paid amount", async () => {
    const flow = createFakeCancellationFlow(confirmedConversation(2));
    await conversationService.cancelConversation(
      { id: "requester-1" },
      "conversation-1",
      { reasonCode: "changed" },
      { runInTransaction: flow.runInTransaction, now: () => now }
    );

    await expect(
      adminCancellationService.approveCredit(
        { id: "admin-1", role: "ADMIN" },
        String(flow.state.cancellations[0].id),
        { creditAmountToman: 100001 },
        { runInTransaction: flow.runInTransaction, now: () => now }
      )
    ).resolves.toMatchObject({
      ok: false,
      code: "validation_error"
    });
    expect(flow.state.walletTransactionCreate).not.toHaveBeenCalled();
    expect(flow.state.walletUpdate).not.toHaveBeenCalled();
    expect(flow.state.adminAuditCreate).not.toHaveBeenCalled();
  });

  it("rejects completed or attendance-verified sessions without cancellation, payment, wallet, or attendance mutation", async () => {
    const completed = createFakeCancellationFlow(
      confirmedConversation(72, {
        status: "COMPLETED",
        completedAt: now
      })
    );
    const verified = createFakeCancellationFlow(
      confirmedConversation(72, {
        attendanceVerification: {
          id: "attendance-1",
          status: "VERIFIED",
          codeGeneratedAt: now,
          codeExpiresAt: futureDate(72),
          submittedAt: now,
          attempts: 1,
          verifiedAt: now,
          failedAt: null,
          needsReviewAt: null
        }
      })
    );

    await expect(
      conversationService.cancelConversation(
        { id: "requester-1" },
        "conversation-1",
        { reasonCode: "changed" },
        { runInTransaction: completed.runInTransaction, now: () => now }
      )
    ).resolves.toMatchObject({
      ok: false,
      code: "cancellation_not_allowed"
    });
    await expect(
      conversationService.cancelConversation(
        { id: "requester-1" },
        "conversation-1",
        { reasonCode: "changed" },
        { runInTransaction: verified.runInTransaction, now: () => now }
      )
    ).resolves.toMatchObject({
      ok: false,
      code: "cancellation_not_allowed"
    });

    [completed.state, verified.state].forEach((state) => {
      expect(state.cancellationCreate).not.toHaveBeenCalled();
      expect(state.walletTransactionCreate).not.toHaveBeenCalled();
      expect(state.walletUpdate).not.toHaveBeenCalled();
      expect(state.conversationUpdate).not.toHaveBeenCalled();
      expect(state.paymentUpdate).not.toHaveBeenCalled();
      expect(state.attendanceUpdate).not.toHaveBeenCalled();
    });
  });

  it("cancels free, unpaid, or rejected-payment conversations without zero-value wallet transactions", async () => {
    const free = createFakeCancellationFlow(
      baseConversation({
        paymentRequirement: "FREE_NOT_REQUIRED",
        priceToman: 0,
        paymentFinalizedAt: now,
        freeFinalizedAt: now,
        payment: {
          id: "payment-1",
          method: "FREE",
          requirement: "FREE_NOT_REQUIRED",
          status: "NOT_REQUIRED",
          amountToman: 0,
          walletDeductionToman: 0,
          gatewayPayableToman: 0,
          finalizedAt: now,
          failedAt: null,
          refundedAt: null,
          manualReview: null
        }
      })
    );
    const rejected = createFakeCancellationFlow(
      baseConversation({
        status: "PAYMENT_FAILED",
        providerVisibleAt: null,
        paymentFinalizedAt: null,
        payment: {
          id: "payment-1",
          method: "CARD_TO_CARD",
          requirement: "PAYMENT_REQUIRED",
          status: "FAILED",
          amountToman: 100000,
          walletDeductionToman: 0,
          gatewayPayableToman: 100000,
          finalizedAt: null,
          failedAt: now,
          refundedAt: null,
          manualReview: null
        }
      })
    );

    for (const flow of [free, rejected]) {
      const result = await conversationService.cancelConversation(
        { id: "requester-1" },
        "conversation-1",
        { reasonCode: "changed" },
        { runInTransaction: flow.runInTransaction, now: () => now }
      );

      expect(result).toMatchObject({
        ok: true,
        data: {
          status: "CANCELLED",
          cancellations: [
            {
              refundAmountToman: 0,
              refundDestination: "NONE"
            }
          ]
        }
      });
      expect(flow.state.walletTransactionCreate).not.toHaveBeenCalled();
      expect(flow.state.walletUpdate).not.toHaveBeenCalled();
    }
  });

  it("hides requester wallet credit details from provider-facing DTOs", async () => {
    const flow = createFakeCancellationFlow(baseConversation());
    const result = await conversationService.cancelConversation(
      { id: "requester-1" },
      "conversation-1",
      { reasonCode: "changed" },
      { runInTransaction: flow.runInTransaction, now: () => now }
    );

    expect(result.ok).toBe(true);
    const providerDto = toConversationResponseDto(
      {
        ...flow.state.conversation,
        cancellations: flow.state.cancellations.map((cancellation) => ({
          id: String(cancellation.id),
          cancelledByRole: String(cancellation.cancelledByRole),
          status: String(cancellation.status),
          stage: String(cancellation.stage),
          reasonCode: String(cancellation.reasonCode),
          refundRateBps: Number(cancellation.refundRateBps),
          refundAmountToman: Number(cancellation.refundAmountToman),
          refundDestination: String(cancellation.refundDestination),
          isLateRequesterCancellation: Boolean(cancellation.isLateRequesterCancellation),
          createdAt: cancellation.createdAt as Date,
          completedAt: (cancellation.completedAt as Date | null) ?? null
        }))
      } as SafeConversationRecord,
      "provider-1"
    );

    expect(providerDto?.cancellations[0]).toMatchObject({
      status: "COMPLETED",
      stage: "BEFORE_TIME_PROPOSAL",
      refundRateBps: 0,
      refundAmountToman: 0,
      refundDestination: "NONE"
    });
  });

  it("classifies cancellation and wallet ledger as transaction-ready while keeping payout/withdrawal deferred", () => {
    expect(useravaaRepository.cancellation.methods.findConversationForRequesterCancellation).toBe("read_only_persistent");
    expect(useravaaRepository.cancellation.methods.createRequesterCancellation).toBe("database_persistent");
    expect(useravaaRepository.cancellation.methods.findSupportReviewForAdminAction).toBe("read_only_persistent");
    expect(useravaaRepository.cancellation.methods.approveSupportReviewCredit).toBe("database_persistent");
    expect(useravaaRepository.cancellation.methods.rejectSupportReviewCredit).toBe("database_persistent");
    expect(useravaaRepository.walletTransaction.methods.createLedgerEntry).toBe("database_persistent");
    expect(useravaaRepository.wallet.methods.createWithdrawal).toBe("contract_only");
    expect(apiEndpointPersistenceClassification["POST /api/conversations/[conversationId]/cancel"]).toMatchObject({
      classification: "transaction_ready",
      usesRepository: true,
      writesImplemented: true
    });
    expect(apiEndpointPersistenceClassification["POST /api/admin/cancellations/[cancellationId]/approve-credit"]).toMatchObject({
      classification: "transaction_ready",
      requiresAdmin: true,
      usesRepository: true,
      writesImplemented: true
    });
    expect(apiEndpointPersistenceClassification["POST /api/admin/cancellations/[cancellationId]/reject-credit"]).toMatchObject({
      classification: "transaction_ready",
      requiresAdmin: true,
      usesRepository: true,
      writesImplemented: true
    });
    expect(backendImplementationClassification.cancellation).toMatchObject({
      classification: "transaction_ready",
      writesImplemented: true
    });
    expect(backendImplementationClassification.walletTransaction).toMatchObject({
      classification: "transaction_ready",
      writesImplemented: true
    });
  });

  it("runs rollback-backed DB smoke coverage for cancellation and wallet credit when enabled", async () => {
    if (process.env.USERAVAA_DB_SMOKE_TEST !== "1") {
      expect(process.env.USERAVAA_DB_SMOKE_TEST).not.toBe("1");
      return;
    }

    class SmokeRollback extends Error {
      constructor(readonly summary: Record<string, unknown>) {
        super("CANCELLATION_WALLET_SMOKE_ROLLBACK");
      }
    }

    const prisma = getPrismaClient();
    const unique = `cancellation-smoke-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const requesterId = `${unique}-requester`;
    const providerId = `${unique}-provider`;
    const unrelatedId = `${unique}-unrelated`;
    const adminId = `${unique}-admin`;
    const requesterEmail = `${requesterId}@example.test`;
    const providerEmail = `${providerId}@example.test`;
    const unrelatedEmail = `${unrelatedId}@example.test`;
    const adminEmail = `${adminId}@example.test`;
    const profileId = `${unique}-profile`;
    const experienceProfileId = `${unique}-experience`;

    let summary: Record<string, unknown> | null = null;

    async function createPaidConversation(
      tx: UseravaaTransactionClient,
      id: string,
      options: {
        confirmedStartsAt?: Date;
        status?: "AWAITING_TIME_PROPOSAL" | "CONFIRMED" | "COMPLETED";
        amountToman?: number;
        paymentStatus?: "PAID" | "FAILED";
        free?: boolean;
        verifiedAttendance?: boolean;
      } = {}
    ) {
      const amountToman = options.free ? 0 : options.amountToman ?? 100000;
      const status = options.status ?? "AWAITING_TIME_PROPOSAL";
      const conversation = await tx.conversationRequest.create({
        data: {
          id,
          requesterId,
          providerId,
          experienceProfileId,
          duration: "MIN_30",
          priceToman: amountToman,
          status: status === "COMPLETED" ? "CONFIRMED" : status,
          paymentRequirement: options.free ? "FREE_NOT_REQUIRED" : "PAYMENT_REQUIRED",
          requestTopic: "career path",
          requestNote: "private smoke note",
          providerVisibleAt: now,
          paymentFinalizedAt: options.paymentStatus === "FAILED" ? null : now,
          freeFinalizedAt: options.free ? now : null,
          confirmedAt: status === "CONFIRMED" || status === "COMPLETED" ? now : null,
          selectedAt: status === "CONFIRMED" || status === "COMPLETED" ? now : null,
          timesProposedAt: status === "CONFIRMED" || status === "COMPLETED" ? now : null,
          completedAt: status === "COMPLETED" ? now : null
        },
        select: {
          id: true
        }
      });

      await tx.payment.create({
        data: {
          conversationId: conversation.id,
          payerId: requesterId,
          method: options.free ? "FREE" : "CARD_TO_CARD",
          requirement: options.free ? "FREE_NOT_REQUIRED" : "PAYMENT_REQUIRED",
          status: options.free ? "NOT_REQUIRED" : options.paymentStatus ?? "PAID",
          amountToman,
          walletDeductionToman: 0,
          gatewayPayableToman: amountToman,
          finalizedAt: options.free || options.paymentStatus !== "FAILED" ? now : null,
          failedAt: options.paymentStatus === "FAILED" ? now : null
        }
      });

      if (status === "CONFIRMED" || status === "COMPLETED") {
        const proposalSet = await tx.timeProposalSet.create({
          data: {
            conversationId: conversation.id,
            version: 1,
            status: "SELECTED",
            proposedById: providerId,
            proposedAt: now,
            selectedAt: now
          },
          select: {
            id: true
          }
        });
        const selectedTime = await tx.proposedTime.create({
          data: {
            conversationId: conversation.id,
            proposalSetId: proposalSet.id,
            version: 1,
            startsAt: options.confirmedStartsAt ?? futureDate(72),
            shamsiDateLabel: "شنبه ۲۴ خرداد",
            timeLabel: "۱۰:۰۰",
            status: "SELECTED",
            selectedAt: now
          },
          select: {
            id: true
          }
        });

        await tx.conversationRequest.update({
          where: {
            id: conversation.id
          },
          data: {
            selectedTimeId: selectedTime.id,
            status,
            completedAt: status === "COMPLETED" ? now : null
          }
        });
      }

      if (options.verifiedAttendance) {
        await tx.attendanceVerification.create({
          data: {
            conversationId: conversation.id,
            status: "VERIFIED",
            codeHash: "smoke-hash",
            codeSalt: "smoke-salt",
            requesterCodeCiphertext: "NDgyOTE=",
            codeGeneratedAt: now,
            codeExpiresAt: futureDate(72),
            submittedAt: now,
            submittedByProviderId: providerId,
            submittedCodeHash: "smoke-hash",
            attempts: 1,
            verifiedAt: now
          }
        });
      }

      return conversation.id;
    }

    try {
      await prisma.$transaction(async (tx) => {
        await tx.user.createMany({
          data: [
            {
              id: requesterId,
              displayName: "Smoke Requester",
              email: requesterEmail
            },
            {
              id: providerId,
              displayName: "Smoke Provider",
              email: providerEmail
            },
            {
              id: unrelatedId,
              displayName: "Smoke Unrelated",
              email: unrelatedEmail
            },
            {
              id: adminId,
              role: "ADMIN",
              displayName: "Smoke Admin",
              email: adminEmail
            }
          ]
        });
        await tx.profile.create({
          data: {
            id: profileId,
            userId: providerId,
            status: "ACTIVE",
            displayName: "Smoke Provider",
            userMotivations: [],
            canOfferExperience: true
          }
        });
        await tx.experienceProfile.create({
          data: {
            id: experienceProfileId,
            ownerId: providerId,
            profileId,
            status: "ACTIVE",
            displayName: "Smoke Provider",
            roleTitle: "Product Lead",
            orgLevel: "SENIOR_SPECIALIST",
            yearsOfExperience: 7,
            publicProfessionalSummary: "Smoke test profile",
            freeHelp: false,
            price30Toman: 100000,
            price60Toman: 200000
          }
        });

        const txRunner = async <T,>(operation: (transaction: UseravaaTransactionClient) => Promise<T>) =>
          operation(tx as UseravaaTransactionClient);

        const beforeId = await createPaidConversation(tx as UseravaaTransactionClient, `${unique}-before`);
        const confirmedId = await createPaidConversation(tx as UseravaaTransactionClient, `${unique}-confirmed`, {
          status: "CONFIRMED",
          confirmedStartsAt: futureDate(72)
        });
        const nearId = await createPaidConversation(tx as UseravaaTransactionClient, `${unique}-near`, {
          status: "CONFIRMED",
          confirmedStartsAt: futureDate(2)
        });
        const supportApproveId = await createPaidConversation(tx as UseravaaTransactionClient, `${unique}-support-approve`, {
          status: "CONFIRMED",
          confirmedStartsAt: futureDate(2)
        });
        const supportRejectId = await createPaidConversation(tx as UseravaaTransactionClient, `${unique}-support-reject`, {
          status: "CONFIRMED",
          confirmedStartsAt: futureDate(2)
        });
        const completedId = await createPaidConversation(tx as UseravaaTransactionClient, `${unique}-completed`, {
          status: "COMPLETED",
          confirmedStartsAt: futureDate(72),
          verifiedAttendance: true
        });
        const providerDeniedId = await createPaidConversation(tx as UseravaaTransactionClient, `${unique}-provider-denied`);
        const unrelatedDeniedId = await createPaidConversation(tx as UseravaaTransactionClient, `${unique}-unrelated-denied`);
        const freeId = await createPaidConversation(tx as UseravaaTransactionClient, `${unique}-free`, {
          free: true
        });

        const before = await conversationService.cancelConversation(
          { id: requesterId },
          beforeId,
          { reasonCode: "changed" },
          { runInTransaction: txRunner, now: () => now }
        );
        const confirmed = await conversationService.cancelConversation(
          { id: requesterId },
          confirmedId,
          { reasonCode: "changed" },
          { runInTransaction: txRunner, now: () => now }
        );
        const near = await conversationService.cancelConversation(
          { id: requesterId },
          nearId,
          { reasonCode: "changed" },
          { runInTransaction: txRunner, now: () => now }
        );
        const supportApproveCancellationRequest = await conversationService.cancelConversation(
          { id: requesterId },
          supportApproveId,
          { reasonCode: "changed" },
          { runInTransaction: txRunner, now: () => now }
        );
        const supportRejectCancellationRequest = await conversationService.cancelConversation(
          { id: requesterId },
          supportRejectId,
          { reasonCode: "changed" },
          { runInTransaction: txRunner, now: () => now }
        );
        const completed = await conversationService.cancelConversation(
          { id: requesterId },
          completedId,
          { reasonCode: "changed" },
          { runInTransaction: txRunner, now: () => now }
        );
        const providerDenied = await conversationService.cancelConversation(
          { id: providerId },
          providerDeniedId,
          { reasonCode: "changed" },
          { runInTransaction: txRunner, now: () => now }
        );
        const unrelatedDenied = await conversationService.cancelConversation(
          { id: unrelatedId },
          unrelatedDeniedId,
          { reasonCode: "changed" },
          { runInTransaction: txRunner, now: () => now }
        );
        const free = await conversationService.cancelConversation(
          { id: requesterId },
          freeId,
          { reasonCode: "changed" },
          { runInTransaction: txRunner, now: () => now }
        );

        const beforeCancellation = await tx.cancellation.findFirstOrThrow({
          where: {
            conversationId: beforeId
          }
        });
        const confirmedCancellation = await tx.cancellation.findFirstOrThrow({
          where: {
            conversationId: confirmedId
          }
        });
        const nearCancellation = await tx.cancellation.findFirstOrThrow({
          where: {
            conversationId: nearId
          }
        });
        const supportApproveCancellation = await tx.cancellation.findFirstOrThrow({
          where: {
            conversationId: supportApproveId
          }
        });
        const supportRejectCancellation = await tx.cancellation.findFirstOrThrow({
          where: {
            conversationId: supportRejectId
          }
        });
        const supportApproveDecision = await adminCancellationService.approveCredit(
          { id: adminId, role: "ADMIN" },
          supportApproveCancellation.id,
          { creditAmountToman: 40000, reviewNote: "approved in smoke" },
          { runInTransaction: txRunner, now: () => now }
        );
        const supportRejectDecision = await adminCancellationService.rejectCredit(
          { id: adminId, role: "ADMIN" },
          supportRejectCancellation.id,
          { rejectionReason: "closed in smoke" },
          { runInTransaction: txRunner, now: () => now }
        );
        const requesterDeniedSupport = await adminCancellationService.approveCredit(
          { id: requesterId, role: "USER" },
          supportRejectCancellation.id,
          { creditAmountToman: 40000 },
          { runInTransaction: txRunner, now: () => now }
        );
        const providerDeniedSupport = await adminCancellationService.rejectCredit(
          { id: providerId, role: "USER" },
          supportRejectCancellation.id,
          { rejectionReason: "not allowed" },
          { runInTransaction: txRunner, now: () => now }
        );
        const resolvedSupportApproveCancellation = await tx.cancellation.findUniqueOrThrow({
          where: {
            id: supportApproveCancellation.id
          }
        });
        const resolvedSupportRejectCancellation = await tx.cancellation.findUniqueOrThrow({
          where: {
            id: supportRejectCancellation.id
          }
        });
        const supportApproveWalletTransactions = await tx.walletTransaction.count({
          where: {
            sourceEntityId: supportApproveCancellation.id,
            type: "CANCELLATION_REFUND_CREDIT"
          }
        });
        const supportRejectWalletTransactions = await tx.walletTransaction.count({
          where: {
            sourceEntityId: supportRejectCancellation.id,
            type: "CANCELLATION_REFUND_CREDIT"
          }
        });
        const supportApproveAudit = await tx.adminAuditEvent.count({
          where: {
            action: "CANCELLATION_SUPPORT_CREDIT_APPROVED",
            entityId: supportApproveCancellation.id
          }
        });
        const supportRejectAudit = await tx.adminAuditEvent.count({
          where: {
            action: "CANCELLATION_SUPPORT_CREDIT_REJECTED",
            entityId: supportRejectCancellation.id
          }
        });
        const supportApprovePayment = await tx.payment.findUniqueOrThrow({
          where: {
            conversationId: supportApproveId
          }
        });
        const supportRejectPayment = await tx.payment.findUniqueOrThrow({
          where: {
            conversationId: supportRejectId
          }
        });
        const supportApproveProposedTimes = await tx.proposedTime.count({
          where: {
            conversationId: supportApproveId
          }
        });
        const supportRejectProposedTimes = await tx.proposedTime.count({
          where: {
            conversationId: supportRejectId
          }
        });
        const supportApproveAttendance = await tx.attendanceVerification.count({
          where: {
            conversationId: supportApproveId
          }
        });
        const supportRejectAttendance = await tx.attendanceVerification.count({
          where: {
            conversationId: supportRejectId
          }
        });
        const requesterWallet = await tx.wallet.findUnique({
          where: {
            userId: requesterId
          }
        });
        const freeWalletTransactions = await tx.walletTransaction.count({
          where: {
            conversationId: freeId
          }
        });
        const withdrawalCount = await tx.withdrawalRequest.count({
          where: {
            userId: requesterId
          }
        });
        const settlementInfoCount = await tx.settlementInfo.count({
          where: {
            userId: requesterId
          }
        });
        const beforePayment = await tx.payment.findUniqueOrThrow({
          where: {
            conversationId: beforeId
          }
        });
        const completedCancellationCount = await tx.cancellation.count({
          where: {
            conversationId: completedId
          }
        });

        throw new SmokeRollback({
          beforeOk: before.ok,
          beforeRefund: beforeCancellation.refundAmountToman,
          beforeStage: beforeCancellation.stage,
          confirmedOk: confirmed.ok,
          confirmedRefund: confirmedCancellation.refundAmountToman,
          confirmedStage: confirmedCancellation.stage,
          nearOk: near.ok,
          nearStatus: nearCancellation.status,
          nearRefund: nearCancellation.refundAmountToman,
          supportApproveRequestOk: supportApproveCancellationRequest.ok,
          supportRejectRequestOk: supportRejectCancellationRequest.ok,
          supportApproveDecisionOk: supportApproveDecision.ok,
          supportApproveStatus: resolvedSupportApproveCancellation.status,
          supportApproveRefund: resolvedSupportApproveCancellation.refundAmountToman,
          supportApproveWalletTransactions,
          supportApproveAudit,
          supportApprovePaymentStatus: supportApprovePayment.status,
          supportApproveProposedTimes,
          supportApproveAttendance,
          supportRejectDecisionOk: supportRejectDecision.ok,
          supportRejectStatus: resolvedSupportRejectCancellation.status,
          supportRejectRefund: resolvedSupportRejectCancellation.refundAmountToman,
          supportRejectWalletTransactions,
          supportRejectAudit,
          supportRejectPaymentStatus: supportRejectPayment.status,
          supportRejectProposedTimes,
          supportRejectAttendance,
          requesterDeniedSupportCode: requesterDeniedSupport.ok ? "ok" : requesterDeniedSupport.code,
          providerDeniedSupportCode: providerDeniedSupport.ok ? "ok" : providerDeniedSupport.code,
          completedOk: completed.ok,
          completedCancellationCount,
          providerDeniedCode: providerDenied.ok ? "ok" : providerDenied.code,
          unrelatedDeniedCode: unrelatedDenied.ok ? "ok" : unrelatedDenied.code,
          freeOk: free.ok,
          freeWalletTransactions,
          requesterWalletBalance: requesterWallet?.balanceToman,
          withdrawalCount,
          settlementInfoCount,
          beforePaymentStatus: beforePayment.status
        });
      }, {
        maxWait: 10_000,
        timeout: 45_000
      });
    } catch (error) {
      if (error instanceof SmokeRollback) {
        summary = error.summary;
      } else {
        throw error;
      }
    }

    expect(summary).toMatchObject({
      beforeOk: true,
      beforeRefund: 90000,
      beforeStage: "BEFORE_TIME_PROPOSAL",
      confirmedOk: true,
      confirmedRefund: 50000,
      confirmedStage: "AFTER_CONFIRMED_SESSION",
      nearOk: true,
      nearStatus: "UNDER_SUPPORT_REVIEW",
      nearRefund: 0,
      supportApproveRequestOk: true,
      supportRejectRequestOk: true,
      supportApproveDecisionOk: true,
      supportApproveStatus: "COMPLETED",
      supportApproveRefund: 40000,
      supportApproveWalletTransactions: 1,
      supportApproveAudit: 1,
      supportApprovePaymentStatus: "PAID",
      supportApproveProposedTimes: 1,
      supportApproveAttendance: 0,
      supportRejectDecisionOk: true,
      supportRejectStatus: "REJECTED",
      supportRejectRefund: 0,
      supportRejectWalletTransactions: 0,
      supportRejectAudit: 1,
      supportRejectPaymentStatus: "PAID",
      supportRejectProposedTimes: 1,
      supportRejectAttendance: 0,
      requesterDeniedSupportCode: "unauthorized",
      providerDeniedSupportCode: "unauthorized",
      completedOk: false,
      completedCancellationCount: 0,
      providerDeniedCode: "conversation_not_found",
      unrelatedDeniedCode: "conversation_not_found",
      freeOk: true,
      freeWalletTransactions: 0,
      requesterWalletBalance: 180000,
      withdrawalCount: 0,
      settlementInfoCount: 0,
      beforePaymentStatus: "PAID"
    });

    await expect(prisma.user.findUnique({ where: { id: requesterId } })).resolves.toBeNull();
    await expect(prisma.user.findUnique({ where: { id: providerId } })).resolves.toBeNull();
    await prisma.$disconnect();
  }, 50_000);
});
