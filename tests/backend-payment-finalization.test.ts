import fs from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { getPrismaClient } from "@/lib/backend/db/prisma";
import { withUseravaaTransaction, type UseravaaTransactionClient } from "@/lib/backend/db/transaction";
import { toConversationResponseDto, type ConversationResponseDto } from "@/lib/backend/dto/conversation";
import { apiEndpointPersistenceClassification } from "@/lib/backend/endpoint-classification";
import { backendImplementationClassification } from "@/lib/backend/implementation-classification";
import { useravaaRepository } from "@/lib/backend/repository";
import type { SafeConversationRecord } from "@/lib/backend/repositories/conversation";
import { adminPaymentService, conversationService, type ServiceResult } from "@/lib/backend/services";
import {
  adminPaymentApprovalSchema,
  adminPaymentRejectionSchema,
  freePaymentFinalizationSchema,
  manualPaymentSubmissionSchema
} from "@/lib/backend/validation";

const projectRoot = process.cwd();
const now = new Date("2026-06-13T08:00:00.000Z");

function readProjectFile(relativePath: string) {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

type FakeManualReview = {
  id: string;
  status: string;
  referenceNumber: string | null;
  receiptUrl: string | null;
  receiptFileName: string | null;
  receiptMimeType: string | null;
  receiptSizeBytes: number | null;
  submittedAt: Date | null;
  reviewedAt: Date | null;
  reviewedByAdminId: string | null;
  adminNote: string | null;
  rejectionReason: string | null;
};

type FakePayment = {
  id: string;
  conversationId: string;
  payerId: string;
  method: string;
  requirement: string;
  status: string;
  amountToman: number;
  walletDeductionToman: number;
  gatewayPayableToman: number;
  providerVisibleAfterPaid: boolean;
  finalizedAt: Date | null;
  failedAt: Date | null;
  refundedAt: Date | null;
};

type FakeConversation = {
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

type FakePaymentState = {
  conversation: FakeConversation;
  payment: FakePayment;
  manualReview: FakeManualReview | null;
  paymentUpdates: Array<Record<string, unknown>>;
  conversationUpdates: Array<Record<string, unknown>>;
  adminAuditCreate: ReturnType<typeof vi.fn>;
  walletTransactionCreate: ReturnType<typeof vi.fn>;
  attendanceCreate: ReturnType<typeof vi.fn>;
  cancellationCreate: ReturnType<typeof vi.fn>;
  proposedTimeCreateMany: ReturnType<typeof vi.fn>;
};

function buildSafeConversation(state: FakePaymentState): SafeConversationRecord {
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
    selectedTime: null,
    proposedTimes: [],
    payment: {
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
      manualReview: state.manualReview
        ? {
            id: state.manualReview.id,
            status: state.manualReview.status,
            referenceNumber: state.manualReview.referenceNumber,
            receiptFileName: state.manualReview.receiptFileName,
            receiptMimeType: state.manualReview.receiptMimeType,
            receiptSizeBytes: state.manualReview.receiptSizeBytes,
            submittedAt: state.manualReview.submittedAt,
            reviewedAt: state.manualReview.reviewedAt,
            rejectionReason: state.manualReview.rejectionReason
          }
        : null
    },
    attendanceVerification: null,
    cancellations: []
  } as SafeConversationRecord;
}

function createFakePaymentFlow(
  overrides: {
    conversation?: Partial<FakeConversation>;
    payment?: Partial<FakePayment>;
    manualReview?: Partial<FakeManualReview> | null;
  } = {}
) {
  const state: FakePaymentState = {
    conversation: {
      id: "conversation-1",
      requesterId: "requester-1",
      providerId: "provider-1",
      experienceProfileId: "experience-profile-1",
      duration: "MIN_30",
      priceToman: 500000,
      status: "AWAITING_PAYMENT",
      paymentRequirement: "PAYMENT_REQUIRED",
      requestTopic: "career path",
      requestNote: "short note",
      providerVisibleAt: null,
      timesProposedAt: null,
      requesterSelectionDeadlineAt: null,
      selectedTimeId: null,
      selectedAt: null,
      paymentFinalizedAt: null,
      freeFinalizedAt: null,
      confirmedAt: null,
      completedAt: null,
      rejectedAt: null,
      expiredAt: null,
      cancelledAt: null,
      createdAt: now,
      updatedAt: now,
      ...overrides.conversation
    },
    payment: {
      id: "payment-1",
      conversationId: "conversation-1",
      payerId: "requester-1",
      method: "CARD_TO_CARD",
      requirement: "PAYMENT_REQUIRED",
      status: "CHECKOUT_CREATED",
      amountToman: 500000,
      walletDeductionToman: 0,
      gatewayPayableToman: 500000,
      providerVisibleAfterPaid: true,
      finalizedAt: null,
      failedAt: null,
      refundedAt: null,
      ...overrides.payment
    },
    manualReview:
      overrides.manualReview === null
        ? null
        : {
            id: "manual-review-1",
            status: "DRAFT",
            referenceNumber: null,
            receiptUrl: null,
            receiptFileName: null,
            receiptMimeType: null,
            receiptSizeBytes: null,
            submittedAt: null,
            reviewedAt: null,
            reviewedByAdminId: null,
            adminNote: null,
            rejectionReason: null,
            ...overrides.manualReview
          },
    paymentUpdates: [],
    conversationUpdates: [],
    adminAuditCreate: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
      id: "admin-audit-1",
      ...data
    })),
    walletTransactionCreate: vi.fn(),
    attendanceCreate: vi.fn(),
    cancellationCreate: vi.fn(),
    proposedTimeCreateMany: vi.fn()
  };

  const paymentForLifecycle = () => ({
    ...state.payment,
    manualReview: state.manualReview,
    conversation: state.conversation
  });

  const adminReviewForLifecycle = () =>
    state.manualReview
      ? {
          ...state.manualReview,
          payment: {
            ...state.payment,
            conversation: state.conversation
          }
        }
      : null;

  const tx = {
    payment: {
      findFirst: vi.fn(async ({ where }: { where: { conversationId?: string; payerId?: string } }) => {
        if (where.conversationId && where.conversationId !== state.payment.conversationId) {
          return null;
        }

        if (where.payerId && where.payerId !== state.payment.payerId) {
          return null;
        }

        return paymentForLifecycle();
      }),
      update: vi.fn(async ({ data }: { data: Partial<FakePayment> }) => {
        Object.assign(state.payment, data);
        state.paymentUpdates.push(data);
        return state.payment;
      })
    },
    manualPaymentReview: {
      findUnique: vi.fn(async ({ where }: { where: { paymentId: string } }) => {
        if (where.paymentId !== state.payment.id) {
          return null;
        }

        return adminReviewForLifecycle();
      }),
      findUniqueOrThrow: vi.fn(async ({ where }: { where: { paymentId: string } }) => {
        if (where.paymentId !== state.payment.id || !state.manualReview) {
          throw new Error("Manual review not found");
        }

        return adminReviewForLifecycle();
      }),
      upsert: vi.fn(async ({ create, update }: { create: Record<string, unknown>; update: Record<string, unknown> }) => {
        if (!state.manualReview) {
          state.manualReview = {
            id: "manual-review-1",
            status: create.status as string,
            referenceNumber: (create.referenceNumber as string | undefined) ?? null,
            receiptUrl: (create.receiptUrl as string | undefined) ?? null,
            receiptFileName: (create.receiptFileName as string | undefined) ?? null,
            receiptMimeType: (create.receiptMimeType as string | undefined) ?? null,
            receiptSizeBytes: (create.receiptSizeBytes as number | undefined) ?? null,
            submittedAt: (create.submittedAt as Date | undefined) ?? null,
            reviewedAt: null,
            reviewedByAdminId: null,
            adminNote: null,
            rejectionReason: null
          };
        } else {
          Object.assign(state.manualReview, update);
        }

        return state.manualReview;
      }),
      update: vi.fn(async ({ data }: { data: Partial<FakeManualReview> }) => {
        if (!state.manualReview) {
          throw new Error("Manual review not found");
        }

        Object.assign(state.manualReview, data);

        return {
          payment: {
            conversationId: state.conversation.id
          }
        };
      })
    },
    conversationRequest: {
      update: vi.fn(async ({ data }: { data: Partial<FakeConversation> }) => {
        Object.assign(state.conversation, data, {
          updatedAt: now
        });
        state.conversationUpdates.push(data);
        return buildSafeConversation(state);
      }),
      findFirstOrThrow: vi.fn(async ({ where }: { where: { id: string; requesterId?: string } }) => {
        if (where.id !== state.conversation.id || (where.requesterId && where.requesterId !== state.conversation.requesterId)) {
          throw new Error("Conversation not found");
        }

        return buildSafeConversation(state);
      })
    },
    walletTransaction: {
      create: state.walletTransactionCreate
    },
    attendanceVerification: {
      create: state.attendanceCreate
    },
    cancellation: {
      create: state.cancellationCreate
    },
    proposedTime: {
      createMany: state.proposedTimeCreateMany
    },
    adminAuditEvent: {
      create: state.adminAuditCreate
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

describe("Checkpoint 2B-4 payment finalization and manual review persistence", () => {
  it("keeps payment/admin API routes protected, awaited, service-bound, and fixture-free", () => {
    [
      "src/app/api/conversations/[conversationId]/payment/manual/route.ts",
      "src/app/api/conversations/[conversationId]/payment/finalize-free/route.ts",
      "src/app/api/admin/payments/route.ts",
      "src/app/api/admin/payments/[paymentId]/approve/route.ts",
      "src/app/api/admin/payments/[paymentId]/reject/route.ts"
    ].forEach((relativePath) => {
      const source = readProjectFile(relativePath);

      expect(source, relativePath).toContain(relativePath.includes("/admin/") ? "requireAdminViewer" : "requireApiViewer");
      expect(source, relativePath).toContain("serviceResultToResponse(await");
      expect(source, relativePath).not.toContain("@/features/v51/data");
      expect(source, relativePath).not.toContain("getConversationOrFallback");
      expect(source, relativePath).not.toMatch(/\.(push|splice|shift|unshift|pop)\(/);
    });
  });

  it("validates manual, free-finalization, and admin review payloads without privileged overrides", () => {
    expect(manualPaymentSubmissionSchema.safeParse({ referenceNumber: "ABC-1234" }).success).toBe(true);
    expect(
      manualPaymentSubmissionSchema.safeParse({
        referenceNumber: "ABC-1234",
        paymentStatus: "PAID"
      }).success
    ).toBe(false);
    expect(
      manualPaymentSubmissionSchema.safeParse({
        receipt: {
          fileName: "receipt.png",
          mimeType: "image/png",
          sizeBytes: 12000,
          providerVisibleAt: now.toISOString()
        }
      }).success
    ).toBe(false);
    expect(freePaymentFinalizationSchema.safeParse({}).success).toBe(true);
    expect(freePaymentFinalizationSchema.safeParse({ confirmedAt: now.toISOString() }).success).toBe(false);
    expect(adminPaymentApprovalSchema.safeParse({ adminNote: "ok" }).success).toBe(true);
    expect(adminPaymentApprovalSchema.safeParse({ status: "PAID" }).success).toBe(false);
    expect(adminPaymentRejectionSchema.safeParse({ rejectionReason: "reference mismatch" }).success).toBe(true);
    expect(adminPaymentRejectionSchema.safeParse({ rejectionReason: "reference mismatch", walletCredit: 1 }).success).toBe(false);
  });

  it("allows only the requester to submit manual payment metadata and keeps provider hidden", async () => {
    const { state, runInTransaction } = createFakePaymentFlow();
    const data = await expectOk(
      conversationService.submitManualPayment(
        { id: "requester-1" },
        "conversation-1",
        { referenceNumber: "ABC-1234" },
        { runInTransaction, now: () => now }
      )
    );

    expect(data).toMatchObject({
      viewerRole: "REQUESTER",
      status: "PAYMENT_PROCESSING",
      providerVisibleAt: null,
      confirmedAt: null,
      selectedTimeId: null,
      proposedTimes: []
    });
    expect(data.payment).toMatchObject({
      status: "PENDING_REVIEW",
      manualReview: {
        status: "SUBMITTED",
        referenceNumber: "ABC-1234"
      }
    });
    expect(toConversationResponseDto(buildSafeConversation(state), "provider-1")).toBeNull();
    expect(state.walletTransactionCreate).not.toHaveBeenCalled();
    expect(state.attendanceCreate).not.toHaveBeenCalled();
    expect(state.cancellationCreate).not.toHaveBeenCalled();
    expect(state.proposedTimeCreateMany).not.toHaveBeenCalled();

    const unauthorized = createFakePaymentFlow();
    await expect(
      conversationService.submitManualPayment(
        { id: "provider-1" },
        "conversation-1",
        { referenceNumber: "ABC-1234" },
        { runInTransaction: unauthorized.runInTransaction, now: () => now }
      )
    ).resolves.toMatchObject({
      ok: false,
      code: "conversation_not_found"
    });
    expect(unauthorized.state.paymentUpdates).toHaveLength(0);
  });

  it("rejects manual submission outside the card-to-card awaiting-payment branch", async () => {
    const onlinePayment = createFakePaymentFlow({
      payment: {
        method: "ONLINE",
        status: "REQUIRES_GATEWAY_PAYMENT"
      }
    });
    const alreadySubmitted = createFakePaymentFlow({
      conversation: {
        status: "PAYMENT_PROCESSING"
      },
      payment: {
        status: "PENDING_REVIEW"
      },
      manualReview: {
        status: "SUBMITTED"
      }
    });

    await expect(
      conversationService.submitManualPayment(
        { id: "requester-1" },
        "conversation-1",
        { referenceNumber: "ABC-1234" },
        { runInTransaction: onlinePayment.runInTransaction, now: () => now }
      )
    ).resolves.toMatchObject({
      ok: false,
      code: "invalid_state"
    });
    await expect(
      conversationService.submitManualPayment(
        { id: "requester-1" },
        "conversation-1",
        { referenceNumber: "ABC-1234" },
        { runInTransaction: alreadySubmitted.runInTransaction, now: () => now }
      )
    ).resolves.toMatchObject({
      ok: false,
      code: "invalid_state"
    });
  });

  it("allows ADMIN/SUPPORT to approve payment and expose provider visibility without session side effects", async () => {
    const { state, runInTransaction } = createFakePaymentFlow();

    await expectOk(
      conversationService.submitManualPayment(
        { id: "requester-1" },
        "conversation-1",
        { referenceNumber: "ABC-1234" },
        { runInTransaction, now: () => now }
      )
    );

    await expect(
      adminPaymentService.approve(
        { id: "requester-1", role: "USER" },
        "payment-1",
        { adminNote: "ok" },
        { runInTransaction, now: () => now }
      )
    ).resolves.toMatchObject({
      ok: false,
      code: "unauthorized"
    });

    const approved = await adminPaymentService.approve(
      { id: "admin-1", role: "ADMIN" },
      "payment-1",
      { adminNote: "ok" },
      { runInTransaction, now: () => now }
    );

    expect(approved.ok).toBe(true);

    if (!approved.ok) {
      throw new Error(approved.message);
    }

    expect(approved.data).toMatchObject({
      status: "APPROVED",
      reviewedByAdminId: "admin-1",
      payment: {
        status: "PAID",
        conversation: {
          status: "AWAITING_TIME_PROPOSAL",
          providerVisibleAt: now,
          confirmedAt: null,
          selectedTimeId: null
        }
      }
    });
    expect(state.conversation).toMatchObject({
      status: "AWAITING_TIME_PROPOSAL",
      providerVisibleAt: now,
      paymentFinalizedAt: now,
      confirmedAt: null,
      selectedTimeId: null
    });
    expect(toConversationResponseDto(buildSafeConversation(state), "provider-1")).toMatchObject({
      viewerRole: "PROVIDER",
      providerReadyToAct: true,
      payment: {
        status: "PAID"
      }
    });
    expect(toConversationResponseDto(buildSafeConversation(state), "provider-1")?.payment?.manualReview).toBeUndefined();
    expect(state.walletTransactionCreate).not.toHaveBeenCalled();
    expect(state.attendanceCreate).not.toHaveBeenCalled();
    expect(state.cancellationCreate).not.toHaveBeenCalled();
    expect(state.proposedTimeCreateMany).not.toHaveBeenCalled();
    expect(state.adminAuditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actorAdminUserId: "admin-1",
          actorRole: "ADMIN",
          action: "PAYMENT_MANUAL_APPROVED",
          entityType: "PAYMENT",
          entityId: "payment-1",
          relatedConversationId: "conversation-1",
          relatedPaymentId: "payment-1",
          note: "ok"
        })
      })
    );
  });

  it("allows SUPPORT to reject payment and keeps the provider hidden while requester can retry payment", async () => {
    const { state, runInTransaction } = createFakePaymentFlow();

    await expectOk(
      conversationService.submitManualPayment(
        { id: "requester-1" },
        "conversation-1",
        { referenceNumber: "ABC-1234" },
        { runInTransaction, now: () => now }
      )
    );

    const rejected = await adminPaymentService.reject(
      { id: "support-1", role: "SUPPORT" },
      "payment-1",
      { rejectionReason: "Reference number could not be matched." },
      { runInTransaction, now: () => now }
    );

    expect(rejected.ok).toBe(true);

    if (!rejected.ok) {
      throw new Error(rejected.message);
    }

    expect(rejected.data).toMatchObject({
      status: "REJECTED",
      reviewedByAdminId: "support-1",
      rejectionReason: "Reference number could not be matched.",
      payment: {
        status: "FAILED",
        conversation: {
          status: "PAYMENT_FAILED",
          providerVisibleAt: null
        }
      }
    });
    expect(toConversationResponseDto(buildSafeConversation(state), "provider-1")).toBeNull();
    expect(toConversationResponseDto(buildSafeConversation(state), "requester-1")).toMatchObject({
      status: "PAYMENT_FAILED",
      nextRequiredAction: "PAYMENT",
      payment: {
        status: "FAILED",
        manualReview: {
          status: "REJECTED",
          rejectionReason: "Reference number could not be matched."
        }
      }
    });
    expect(state.walletTransactionCreate).not.toHaveBeenCalled();
    expect(state.attendanceCreate).not.toHaveBeenCalled();
    expect(state.cancellationCreate).not.toHaveBeenCalled();
    expect(state.proposedTimeCreateMany).not.toHaveBeenCalled();
    expect(state.adminAuditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actorAdminUserId: "support-1",
          actorRole: "SUPPORT",
          action: "PAYMENT_MANUAL_REJECTED",
          entityType: "PAYMENT",
          entityId: "payment-1",
          relatedConversationId: "conversation-1",
          relatedPaymentId: "payment-1",
          reason: "Reference number could not be matched."
        })
      })
    );
  });

  it("finalizes only the requester-owned free branch without payment proof, confirmation, or ledger records", async () => {
    const free = createFakePaymentFlow({
      conversation: {
        status: "CREATED",
        paymentRequirement: "FREE_NOT_REQUIRED"
      },
      payment: {
        method: "FREE",
        requirement: "FREE_NOT_REQUIRED",
        status: "NOT_REQUIRED",
        amountToman: 0,
        gatewayPayableToman: 0
      },
      manualReview: null
    });

    const data = await expectOk(
      conversationService.finalizeFreePayment(
        { id: "requester-1" },
        "conversation-1",
        {},
        { runInTransaction: free.runInTransaction, now: () => now }
      )
    );

    expect(data).toMatchObject({
      status: "AWAITING_TIME_PROPOSAL",
      providerVisibleAt: now,
      confirmedAt: null,
      selectedTimeId: null,
      proposedTimes: [],
      payment: {
        method: "FREE",
        status: "NOT_REQUIRED",
        amountToman: 0,
        manualReview: null
      }
    });
    expect(free.state.walletTransactionCreate).not.toHaveBeenCalled();
    expect(free.state.attendanceCreate).not.toHaveBeenCalled();
    expect(free.state.cancellationCreate).not.toHaveBeenCalled();
    expect(free.state.proposedTimeCreateMany).not.toHaveBeenCalled();

    const paid = createFakePaymentFlow();
    await expect(
      conversationService.finalizeFreePayment(
        { id: "requester-1" },
        "conversation-1",
        {},
        { runInTransaction: paid.runInTransaction, now: () => now }
      )
    ).resolves.toMatchObject({
      ok: false,
      code: "invalid_state"
    });
  });

  it("keeps payment flows from mutating wallet balances outside the ledger helper", () => {
    expect(useravaaRepository.walletTransaction.methods.createLedgerEntry).toBe("database_persistent");
    expect(useravaaRepository.wallet.methods.createWithdrawal).toBe("contract_only");
    expect(readProjectFile("src/lib/backend/repositories/payment.ts")).not.toContain("balanceToman");
    expect(readProjectFile("src/lib/backend/repositories/admin-payment-review.ts")).not.toContain("balanceToman");
  });

  it("classifies 2B-4 endpoints and domains honestly", () => {
    expect(apiEndpointPersistenceClassification["POST /api/conversations/[conversationId]/payment/manual"]).toMatchObject({
      classification: "transaction_ready",
      writesImplemented: true,
      usesRepository: true
    });
    expect(apiEndpointPersistenceClassification["POST /api/conversations/[conversationId]/payment/finalize-free"]).toMatchObject({
      classification: "transaction_ready",
      writesImplemented: true,
      usesRepository: true
    });
    expect(apiEndpointPersistenceClassification["POST /api/admin/payments/[paymentId]/approve"]).toMatchObject({
      classification: "transaction_ready",
      requiresAdmin: true,
      writesImplemented: true
    });
    expect(apiEndpointPersistenceClassification["POST /api/admin/payments/[paymentId]/reject"]).toMatchObject({
      classification: "transaction_ready",
      requiresAdmin: true,
      writesImplemented: true
    });
    expect(backendImplementationClassification.paymentManualPayment).toMatchObject({
      classification: "transaction_ready",
      writesImplemented: true,
      productionProviderConfigured: false
    });
    expect(backendImplementationClassification.adminPaymentReview).toMatchObject({
      classification: "transaction_ready",
      writesImplemented: true
    });
    expect(backendImplementationClassification.adminAudit).toMatchObject({
      classification: "transaction_ready",
      writesImplemented: true,
      readsUseRepository: true
    });
    expect(backendImplementationClassification.walletTransaction.writesImplemented).toBe(true);
  });

  it("runs rollback-backed DB smoke coverage for manual approval, rejection, and free finalization when enabled", async () => {
    if (process.env.USERAVAA_DB_SMOKE_TEST !== "1") {
      expect(process.env.USERAVAA_DB_SMOKE_TEST).not.toBe("1");
      return;
    }

    class SmokeRollback extends Error {
      constructor(readonly summary: Record<string, unknown>) {
        super("PAYMENT_FINALIZATION_SMOKE_ROLLBACK");
      }
    }

    const prisma = getPrismaClient();
    const unique = `payment-smoke-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const requesterId = `${unique}-requester`;
    const paidProviderId = `${unique}-paid-provider`;
    const freeProviderId = `${unique}-free-provider`;
    const adminId = `${unique}-admin`;
    const paidProfileId = `${unique}-paid-profile`;
    const freeProfileId = `${unique}-free-profile`;
    const paidExperienceProfileId = `${unique}-paid-experience`;
    const freeExperienceProfileId = `${unique}-free-experience`;
    let summary: Record<string, unknown> | null = null;

    try {
      await prisma.$transaction(async (tx) => {
        await tx.user.create({
          data: {
            id: requesterId,
            email: `${unique}-requester@smoke.useravaa.test`,
            displayName: "Smoke requester"
          }
        });
        await tx.user.create({
          data: {
            id: paidProviderId,
            email: `${unique}-paid-provider@smoke.useravaa.test`,
            displayName: "Smoke paid provider"
          }
        });
        await tx.user.create({
          data: {
            id: freeProviderId,
            email: `${unique}-free-provider@smoke.useravaa.test`,
            displayName: "Smoke free provider"
          }
        });
        await tx.user.create({
          data: {
            id: adminId,
            role: "ADMIN",
            email: `${unique}-admin@smoke.useravaa.test`,
            displayName: "Smoke admin"
          }
        });
        await tx.profile.createMany({
          data: [
            {
              id: paidProfileId,
              userId: paidProviderId,
              status: "ACTIVE",
              displayName: "Smoke paid provider",
              professionalSummary: "Temporary smoke-test profile.",
              userMotivations: [],
              canOfferExperience: true
            },
            {
              id: freeProfileId,
              userId: freeProviderId,
              status: "ACTIVE",
              displayName: "Smoke free provider",
              professionalSummary: "Temporary smoke-test profile.",
              userMotivations: [],
              canOfferExperience: true
            }
          ]
        });
        await tx.experienceProfile.createMany({
          data: [
            {
              id: paidExperienceProfileId,
              ownerId: paidProviderId,
              profileId: paidProfileId,
              status: "ACTIVE",
              displayName: "Smoke paid provider",
              roleTitle: "Product specialist",
              orgLevel: "SPECIALIST",
              yearsOfExperience: 5,
              publicProfessionalSummary: "Temporary smoke-test experience profile.",
              freeHelp: false,
              price30Toman: 500000,
              price60Toman: 900000
            },
            {
              id: freeExperienceProfileId,
              ownerId: freeProviderId,
              profileId: freeProfileId,
              status: "ACTIVE",
              displayName: "Smoke free provider",
              roleTitle: "Support specialist",
              orgLevel: "SPECIALIST",
              yearsOfExperience: 6,
              publicProfessionalSummary: "Temporary smoke-test free experience profile.",
              freeHelp: true,
              price30Toman: 0,
              price60Toman: 0
            }
          ]
        });

        const txRunner = (async <T>(operation: (transaction: UseravaaTransactionClient) => Promise<T>) =>
          operation(tx)) as typeof withUseravaaTransaction;

        const approvedRequest = await conversationService.createConversation(
          { id: requesterId },
          {
            experienceProfileId: paidExperienceProfileId,
            durationMinutes: 30,
            requestTopic: "payment smoke approve",
            requestNote: "Create request for payment approval smoke.",
            paymentRequirement: "PAYMENT_REQUIRED",
            paymentMethod: "CARD_TO_CARD",
            quotedPriceToman: 500000
          },
          { runInTransaction: txRunner, now: () => now }
        );

        if (!approvedRequest.ok) {
          throw new Error(approvedRequest.message);
        }

        const submittedForApproval = await conversationService.submitManualPayment(
          { id: requesterId },
          approvedRequest.data.id,
          { referenceNumber: "APPROVE-1234" },
          { runInTransaction: txRunner, now: () => now }
        );

        if (!submittedForApproval.ok) {
          throw new Error(submittedForApproval.message);
        }

        const approved = await adminPaymentService.approve(
          { id: adminId, role: "ADMIN" },
          submittedForApproval.data.payment?.id ?? "",
          { adminNote: "approved in smoke" },
          { runInTransaction: txRunner, now: () => now }
        );

        if (!approved.ok) {
          throw new Error(approved.message);
        }

        const rejectedRequest = await conversationService.createConversation(
          { id: requesterId },
          {
            experienceProfileId: paidExperienceProfileId,
            durationMinutes: 30,
            requestTopic: "payment smoke reject",
            requestNote: "Create request for payment rejection smoke.",
            paymentRequirement: "PAYMENT_REQUIRED",
            paymentMethod: "CARD_TO_CARD",
            quotedPriceToman: 500000
          },
          { runInTransaction: txRunner, now: () => now }
        );

        if (!rejectedRequest.ok) {
          throw new Error(rejectedRequest.message);
        }

        const submittedForRejection = await conversationService.submitManualPayment(
          { id: requesterId },
          rejectedRequest.data.id,
          { referenceNumber: "REJECT-1234" },
          { runInTransaction: txRunner, now: () => now }
        );

        if (!submittedForRejection.ok) {
          throw new Error(submittedForRejection.message);
        }

        const rejected = await adminPaymentService.reject(
          { id: adminId, role: "ADMIN" },
          submittedForRejection.data.payment?.id ?? "",
          { rejectionReason: "Smoke rejection" },
          { runInTransaction: txRunner, now: () => now }
        );

        if (!rejected.ok) {
          throw new Error(rejected.message);
        }

        const freeRequest = await conversationService.createConversation(
          { id: requesterId },
          {
            experienceProfileId: freeExperienceProfileId,
            durationMinutes: 30,
            requestTopic: "payment smoke free",
            requestNote: "Create request for free finalization smoke.",
            paymentRequirement: "FREE_NOT_REQUIRED",
            paymentMethod: "FREE",
            quotedPriceToman: 0
          },
          { runInTransaction: txRunner, now: () => now }
        );

        if (!freeRequest.ok) {
          throw new Error(freeRequest.message);
        }

        const finalizedFree = await conversationService.finalizeFreePayment(
          { id: requesterId },
          freeRequest.data.id,
          {},
          { runInTransaction: txRunner, now: () => now }
        );

        if (!finalizedFree.ok) {
          throw new Error(finalizedFree.message);
        }

        const approvedConversation = await tx.conversationRequest.findUniqueOrThrow({
          where: { id: approvedRequest.data.id }
        });
        const rejectedConversation = await tx.conversationRequest.findUniqueOrThrow({
          where: { id: rejectedRequest.data.id }
        });
        const freeConversation = await tx.conversationRequest.findUniqueOrThrow({
          where: { id: freeRequest.data.id }
        });
        const providerEligibility = await useravaaRepository.timeProposal.findConversationForProviderTimeProposal(
          approvedRequest.data.id,
          paidProviderId,
          tx
        );
        const countSideEffects = async (conversationId: string) => ({
          proposedTime: await tx.proposedTime.count({ where: { conversationId } }),
          attendance: await tx.attendanceVerification.count({ where: { conversationId } }),
          cancellation: await tx.cancellation.count({ where: { conversationId } }),
          walletTransaction: await tx.walletTransaction.count({ where: { conversationId } })
        });
        const approvedCounts = await countSideEffects(approvedRequest.data.id);
        const rejectedCounts = await countSideEffects(rejectedRequest.data.id);
        const freeCounts = await countSideEffects(freeRequest.data.id);
        const approvedAudit = await tx.adminAuditEvent.count({
          where: {
            action: "PAYMENT_MANUAL_APPROVED",
            relatedPaymentId: submittedForApproval.data.payment?.id
          }
        });
        const rejectedAudit = await tx.adminAuditEvent.count({
          where: {
            action: "PAYMENT_MANUAL_REJECTED",
            relatedPaymentId: submittedForRejection.data.payment?.id
          }
        });

        throw new SmokeRollback({
          approvedStatus: approvedConversation.status,
          approvedProviderVisible: Boolean(approvedConversation.providerVisibleAt),
          approvedConfirmedAt: approvedConversation.confirmedAt,
          providerEligibleForTimes: Boolean(providerEligibility?.providerVisibleAt),
          rejectedStatus: rejectedConversation.status,
          rejectedProviderVisible: Boolean(rejectedConversation.providerVisibleAt),
          freeStatus: freeConversation.status,
          freeProviderVisible: Boolean(freeConversation.providerVisibleAt),
          freeConfirmedAt: freeConversation.confirmedAt,
          approvedCounts,
          rejectedCounts,
          freeCounts,
          approvedAudit,
          rejectedAudit
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
      approvedStatus: "AWAITING_TIME_PROPOSAL",
      approvedProviderVisible: true,
      approvedConfirmedAt: null,
      providerEligibleForTimes: true,
      rejectedStatus: "PAYMENT_FAILED",
      rejectedProviderVisible: false,
      freeStatus: "AWAITING_TIME_PROPOSAL",
      freeProviderVisible: true,
      freeConfirmedAt: null,
      approvedCounts: {
        proposedTime: 0,
        attendance: 0,
        cancellation: 0,
        walletTransaction: 0
      },
      rejectedCounts: {
        proposedTime: 0,
        attendance: 0,
        cancellation: 0,
        walletTransaction: 0
      },
      freeCounts: {
        proposedTime: 0,
        attendance: 0,
        cancellation: 0,
        walletTransaction: 0
      },
      approvedAudit: 1,
      rejectedAudit: 1
    });

    await expect(prisma.user.findUnique({ where: { id: requesterId } })).resolves.toBeNull();
    await expect(prisma.user.findUnique({ where: { id: paidProviderId } })).resolves.toBeNull();
    await expect(prisma.user.findUnique({ where: { id: freeProviderId } })).resolves.toBeNull();
    await prisma.$disconnect();
  }, 30_000);
});
