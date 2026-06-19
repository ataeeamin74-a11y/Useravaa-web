import fs from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { PrismaClientConfigurationError } from "@/lib/backend/db/prisma";
import { withUseravaaTransaction, type UseravaaTransactionClient } from "@/lib/backend/db/transaction";
import {
  conversationIsVisibleToViewer,
  toConversationResponseDto
} from "@/lib/backend/dto/conversation";
import { apiEndpointPersistenceClassification } from "@/lib/backend/endpoint-classification";
import { backendImplementationClassification } from "@/lib/backend/implementation-classification";
import type { RequestableExperienceProfile, SafeConversationRecord } from "@/lib/backend/repositories/conversation";
import { conversationService } from "@/lib/backend/services";
import { requestCreationSchema } from "@/lib/backend/validation";

const projectRoot = process.cwd();
const fixedNow = new Date("2026-06-12T08:30:00.000Z");
type SafeConversationPayment = NonNullable<SafeConversationRecord["payment"]>;
type SafeConversationManualReview = NonNullable<SafeConversationPayment["manualReview"]>;

const validPaidPayload = {
  experienceProfileId: "experience-profile-1",
  durationMinutes: 30,
  requestTopic: "مسیر شغلی",
  requestNote: "می‌خواهم درباره تصمیم بعدی مسیر کاری‌ام گفت‌وگو کنم.",
  paymentRequirement: "PAYMENT_REQUIRED",
  paymentMethod: "CARD_TO_CARD",
  quotedPriceToman: 500000
} as const;

const validFreePayload = {
  experienceProfileId: "experience-profile-1",
  durationMinutes: 30,
  requestTopic: "مسیر شغلی",
  requestNote: "می‌خواهم درباره تصمیم بعدی مسیر کاری‌ام گفت‌وگو کنم.",
  paymentRequirement: "FREE_NOT_REQUIRED",
  paymentMethod: "FREE",
  quotedPriceToman: 0
} as const;

function readProjectFile(relativePath: string) {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

function buildExperienceProfile(overrides: Partial<RequestableExperienceProfile> = {}): RequestableExperienceProfile {
  return {
    id: "experience-profile-1",
    ownerId: "provider-1",
    status: "ACTIVE",
    freeHelp: false,
    price30Toman: 500000,
    price60Toman: 900000,
    owner: {
      id: "provider-1",
      displayName: "تجربه‌آفرین"
    },
    ...overrides
  };
}

function buildConversationRecord(overrides: Partial<SafeConversationRecord> = {}): SafeConversationRecord {
  const payment = overrides.payment ?? {
    id: "payment-1",
    method: "CARD_TO_CARD",
    requirement: "PAYMENT_REQUIRED",
    status: "CHECKOUT_CREATED",
    amountToman: 500000,
    walletDeductionToman: 0,
    gatewayPayableToman: 500000,
    finalizedAt: null,
    failedAt: null,
    refundedAt: null,
    manualReview: {
      id: "manual-review-1",
      status: "DRAFT",
      referenceNumber: null,
      receiptFileName: null,
      receiptMimeType: null,
      receiptSizeBytes: null,
      submittedAt: null,
      reviewedAt: null,
      rejectionReason: null
    }
  };

  return {
    id: "conversation-1",
    requesterId: "requester-1",
    providerId: "provider-1",
    experienceProfileId: "experience-profile-1",
    duration: "MIN_30",
    priceToman: 500000,
    status: "AWAITING_PAYMENT",
    paymentRequirement: "PAYMENT_REQUIRED",
    requestTopic: "مسیر شغلی",
    requestNote: "می‌خواهم درباره تصمیم بعدی مسیر کاری‌ام گفت‌وگو کنم.",
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
    createdAt: fixedNow,
    updatedAt: fixedNow,
    requester: {
      id: "requester-1",
      displayName: "درخواست‌کننده",
      avatarUrl: null
    },
    provider: {
      id: "provider-1",
      displayName: "تجربه‌آفرین",
      avatarUrl: null
    },
    selectedTime: null,
    proposedTimes: [],
    payment,
    attendanceVerification: null,
    cancellations: [],
    ...overrides
  } as SafeConversationRecord;
}

function createFakeTransaction(profile: RequestableExperienceProfile) {
  const state: {
    conversationCreateData?: Record<string, unknown>;
    paymentCreateData?: Record<string, unknown>;
    manualReviewCreateData?: Record<string, unknown>;
  } = {};

  const tx = {
    experienceProfile: {
      findUnique: vi.fn(async () => profile)
    },
    conversationRequest: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        state.conversationCreateData = data;

        return {
          id: "conversation-1"
        };
      }),
      findFirstOrThrow: vi.fn(async () =>
        buildConversationRecord({
          requesterId: state.conversationCreateData?.requesterId as string,
          providerId: state.conversationCreateData?.providerId as string,
          experienceProfileId: state.conversationCreateData?.experienceProfileId as string,
          duration: state.conversationCreateData?.duration as SafeConversationRecord["duration"],
          priceToman: state.conversationCreateData?.priceToman as number,
          status: state.conversationCreateData?.status as SafeConversationRecord["status"],
          paymentRequirement: state.conversationCreateData?.paymentRequirement as SafeConversationRecord["paymentRequirement"],
          requestTopic: state.conversationCreateData?.requestTopic as string,
          requestNote: state.conversationCreateData?.requestNote as string,
          providerVisibleAt: state.conversationCreateData?.providerVisibleAt as Date | null,
          paymentFinalizedAt: state.conversationCreateData?.paymentFinalizedAt as Date | null,
          freeFinalizedAt: state.conversationCreateData?.freeFinalizedAt as Date | null,
          payment: {
            id: "payment-1",
            method: state.paymentCreateData?.method as SafeConversationPayment["method"],
            requirement: state.paymentCreateData?.requirement as SafeConversationPayment["requirement"],
            status: state.paymentCreateData?.status as SafeConversationPayment["status"],
            amountToman: state.paymentCreateData?.amountToman as number,
            walletDeductionToman: state.paymentCreateData?.walletDeductionToman as number,
            gatewayPayableToman: state.paymentCreateData?.gatewayPayableToman as number,
            finalizedAt: state.paymentCreateData?.finalizedAt as Date | null,
            failedAt: null,
            refundedAt: null,
            manualReview: state.manualReviewCreateData
              ? {
                  id: "manual-review-1",
                  status: state.manualReviewCreateData.status as SafeConversationManualReview["status"],
                  referenceNumber: null,
                  receiptFileName: null,
                  receiptMimeType: null,
                  receiptSizeBytes: null,
                  submittedAt: null,
                  reviewedAt: null,
                  rejectionReason: null
                }
              : null
          }
        })
      )
    },
    payment: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        state.paymentCreateData = data;

        return {
          id: "payment-1"
        };
      })
    },
    manualPaymentReview: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        state.manualReviewCreateData = data;

        return {
          id: "manual-review-1"
        };
      })
    }
  } as unknown as UseravaaTransactionClient;

  const runInTransaction = (async <T>(operation: (transaction: UseravaaTransactionClient) => Promise<T>) =>
    operation(tx)) as typeof withUseravaaTransaction;

  return {
    state,
    runInTransaction
  };
}

describe("Checkpoint 2B-2 request creation persistence", () => {
  it("keeps POST /api/conversations authenticated, validated, service-bound, and fixture-free", () => {
    const source = readProjectFile("src/app/api/conversations/route.ts");

    expect(source).toContain("requireApiViewer");
    expect(source).toContain("parseJsonBody(request, requestCreationSchema)");
    expect(source).toContain("await conversationService.createConversation");
    expect(source).not.toContain("@/features/v51/data");
    expect(source).not.toContain("getConversationOrFallback");
    expect(source).not.toMatch(/\.(push|splice|shift|unshift|pop)\(/);
  });

  it("rejects client attempts to set privileged request, payment, session, wallet, or admin fields", () => {
    [
      "requesterId",
      "providerId",
      "providerVisibleAt",
      "paymentApprovedAt",
      "paymentStatus",
      "confirmedAt",
      "status",
      "selectedTimeId",
      "proposedTimes",
      "attendanceCode",
      "walletTransactionId",
      "adminReviewStatus"
    ].forEach((fieldName) => {
      expect(
        requestCreationSchema.safeParse({
          ...validPaidPayload,
          [fieldName]: "client-controlled"
        }).success,
        fieldName
      ).toBe(false);
    });
  });

  it("creates paid requests through a transaction using the server viewer id and awaiting-payment state", async () => {
    const { state, runInTransaction } = createFakeTransaction(buildExperienceProfile());
    const result = await conversationService.createConversation(
      {
        id: "requester-1"
      },
      validPaidPayload,
      {
        runInTransaction,
        now: () => fixedNow
      }
    );

    expect(result.ok).toBe(true);

    if (!result.ok) {
      throw new Error(result.message);
    }

    expect(result.status).toBe(201);
    expect(result.data).toMatchObject({
      viewerRole: "REQUESTER",
      status: "AWAITING_PAYMENT",
      nextRequiredAction: "PAYMENT",
      providerReadyToAct: false,
      confirmedAt: null,
      selectedTimeId: null,
      proposedTimes: []
    });
    expect(result.data.payment).toMatchObject({
      method: "CARD_TO_CARD",
      requirement: "PAYMENT_REQUIRED",
      status: "CHECKOUT_CREATED",
      amountToman: 500000,
      gatewayPayableToman: 500000
    });
    expect(state.conversationCreateData).toMatchObject({
      requesterId: "requester-1",
      providerId: "provider-1",
      experienceProfileId: "experience-profile-1",
      duration: "MIN_30",
      priceToman: 500000,
      status: "AWAITING_PAYMENT",
      providerVisibleAt: null
    });
    expect(state.conversationCreateData).not.toHaveProperty("confirmedAt");
    expect(state.conversationCreateData).not.toHaveProperty("selectedTimeId");
    expect(state.conversationCreateData).not.toHaveProperty("proposedTimes");
    expect(state.conversationCreateData).not.toHaveProperty("attendanceVerification");
    expect(state.conversationCreateData).not.toHaveProperty("walletTransaction");
    expect(state.paymentCreateData).toMatchObject({
      conversationId: "conversation-1",
      payerId: "requester-1",
      method: "CARD_TO_CARD",
      status: "CHECKOUT_CREATED",
      finalizedAt: null
    });
    expect(state.manualReviewCreateData).toMatchObject({
      paymentId: "payment-1",
      status: "DRAFT"
    });

    const createdData = JSON.stringify({
      conversation: state.conversationCreateData,
      payment: state.paymentCreateData,
      manual: state.manualReviewCreateData
    });

    expect(createdData).not.toContain("CONFIRMED");
    expect(createdData).not.toContain("COMPLETED");
    expect(createdData).not.toContain("attendance");
    expect(createdData).not.toContain("walletTransaction");
  });

  it("creates free requests with not-required payment without confirming a session", async () => {
    const { state, runInTransaction } = createFakeTransaction(
      buildExperienceProfile({
        freeHelp: true,
        price30Toman: 0,
        price60Toman: 0
      })
    );
    const result = await conversationService.createConversation(
      {
        id: "requester-1"
      },
      validFreePayload,
      {
        runInTransaction,
        now: () => fixedNow
      }
    );

    expect(result.ok).toBe(true);

    if (!result.ok) {
      throw new Error(result.message);
    }

    expect(result.data).toMatchObject({
      status: "AWAITING_TIME_PROPOSAL",
      nextRequiredAction: "WAITING_FOR_PROVIDER_TIME_PROPOSAL",
      providerReadyToAct: false,
      confirmedAt: null,
      selectedTimeId: null,
      proposedTimes: []
    });
    expect(state.conversationCreateData).toMatchObject({
      status: "AWAITING_TIME_PROPOSAL",
      paymentRequirement: "FREE_NOT_REQUIRED",
      providerVisibleAt: fixedNow,
      paymentFinalizedAt: fixedNow,
      freeFinalizedAt: fixedNow
    });
    expect(state.paymentCreateData).toMatchObject({
      method: "FREE",
      requirement: "FREE_NOT_REQUIRED",
      status: "NOT_REQUIRED",
      amountToman: 0,
      gatewayPayableToman: 0,
      finalizedAt: fixedNow
    });
    expect(state.manualReviewCreateData).toBeUndefined();
  });

  it("blocks unavailable targets, self-requests, and client price mismatches", async () => {
    const unavailable = createFakeTransaction(
      buildExperienceProfile({
        status: "PENDING_REVIEW"
      })
    );
    const selfRequest = createFakeTransaction(
      buildExperienceProfile({
        ownerId: "requester-1"
      })
    );
    const mismatch = createFakeTransaction(buildExperienceProfile());

    await expect(
      conversationService.createConversation({ id: "requester-1" }, validPaidPayload, {
        runInTransaction: unavailable.runInTransaction,
        now: () => fixedNow
      })
    ).resolves.toMatchObject({
      ok: false,
      code: "target_not_available"
    });

    await expect(
      conversationService.createConversation({ id: "requester-1" }, validPaidPayload, {
        runInTransaction: selfRequest.runInTransaction,
        now: () => fixedNow
      })
    ).resolves.toMatchObject({
      ok: false,
      code: "target_not_available"
    });

    await expect(
      conversationService.createConversation(
        { id: "requester-1" },
        {
          ...validPaidPayload,
          quotedPriceToman: 1
        },
        {
          runInTransaction: mismatch.runInTransaction,
          now: () => fixedNow
        }
      )
    ).resolves.toMatchObject({
      ok: false,
      code: "validation_error"
    });
  });

  it("keeps provider visibility locked until paid requests are finalized", () => {
    const unfinalizedPaidRequest = buildConversationRecord({
      providerVisibleAt: null
    });
    const finalizedProviderVisibleRequest = buildConversationRecord({
      providerVisibleAt: fixedNow
    });

    expect(conversationIsVisibleToViewer("requester-1", unfinalizedPaidRequest)).toBe(true);
    expect(conversationIsVisibleToViewer("provider-1", unfinalizedPaidRequest)).toBe(false);
    expect(toConversationResponseDto(unfinalizedPaidRequest, "provider-1")).toBeNull();
    expect(toConversationResponseDto(finalizedProviderVisibleRequest, "provider-1")).toMatchObject({
      viewerRole: "PROVIDER",
      providerReadyToAct: false
    });
  });

  it("does not expose raw attendance code fields or requester manual review details to provider DTOs", () => {
    const providerDto = toConversationResponseDto(
      buildConversationRecord({
        providerVisibleAt: fixedNow,
        attendanceVerification: {
          id: "attendance-1",
          status: "PENDING",
          codeGeneratedAt: fixedNow,
          codeExpiresAt: fixedNow,
          submittedAt: null,
          attempts: 0,
          verifiedAt: null,
          failedAt: null,
          needsReviewAt: null
        }
      }),
      "provider-1"
    );
    const serialized = JSON.stringify(providerDto);

    expect(providerDto?.payment?.manualReview).toBeUndefined();
    expect(serialized).not.toContain("requesterCodeCiphertext");
    expect(serialized).not.toContain("codeHash");
    expect(serialized).not.toContain("codeSalt");
    expect(serialized).not.toContain("submittedCodeHash");
    expect(serialized).not.toContain("receiptFileName");
    expect(serialized).not.toContain("referenceNumber");
  });

  it("returns a typed provider/configuration error when Prisma runtime cannot execute", async () => {
    const runInTransaction = (async () => {
      throw new PrismaClientConfigurationError("Adapter missing", {
        missing: "PRISMA_DRIVER_ADAPTER_OR_ACCELERATE_URL"
      });
    }) as typeof withUseravaaTransaction;
    const result = await conversationService.createConversation({ id: "requester-1" }, validPaidPayload, {
      runInTransaction,
      now: () => fixedNow
    });

    expect(result).toMatchObject({
      ok: false,
      code: "provider_not_configured",
      status: 503
    });
  });

  it("classifies request creation and initial payment record creation without claiming production launch readiness", () => {
    expect(apiEndpointPersistenceClassification["POST /api/conversations"]).toMatchObject({
      classification: "transaction_ready",
      requiresViewer: true,
      usesRepository: true,
      writesImplemented: true
    });
    expect(backendImplementationClassification.requestConversation).toMatchObject({
      classification: "transaction_ready",
      writesImplemented: true,
      productionProviderConfigured: false,
      blocksProductionLaunch: true
    });
    expect(backendImplementationClassification.initialPaymentRecordCreation).toMatchObject({
      classification: "transaction_ready",
      writesImplemented: true,
      productionProviderConfigured: false,
      blocksProductionLaunch: true
    });
  });
});
