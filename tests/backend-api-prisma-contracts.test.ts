import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  INSIGHT_ANSWER_MAX_LENGTH,
  INSIGHT_AUDIENCE_INTENT_CODES,
  PROFESSIONAL_SUMMARY_MAX_LENGTH,
  USER_MOTIVATION_CODES,
  USER_MOTIVATION_OTHER_TEXT_MAX_LENGTH
} from "@/lib/backend/constants";
import { backendImplementationClassification } from "@/lib/backend/implementation-classification";
import { notImplementedResult, providerNotConfiguredResult, serviceResultToResponse } from "@/lib/backend/services";
import { backendStatusContract } from "@/lib/backend/status-contracts";
import {
  adminPaymentApprovalSchema,
  adminPaymentRejectionSchema,
  attendanceSubmitCodeSchema,
  cancellationRequestSchema,
  insightAnswerSubmissionSchema,
  manualPaymentSubmissionSchema,
  notificationReadMutationSchema,
  profileUpdateSchema,
  proposedTimesSubmissionSchema,
  requestCreationSchema,
  timeSelectionSchema,
  walletWithdrawalRequestSchema
} from "@/lib/backend/validation";
import { insightAnswerMaxLength, insightAudienceOptions } from "@/features/v51/data/experience-questions";
import {
  professionalSummaryMaxLength,
  userMotivationOptions,
  userMotivationOtherTextMaxLength
} from "@/features/v51/data/my-profile";

const projectRoot = process.cwd();

function readProjectFile(relativePath: string) {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

const apiRouteFiles = [
  "src/app/api/profile/me/route.ts",
  "src/app/api/profile/submit-for-review/route.ts",
  "src/app/api/conversations/route.ts",
  "src/app/api/conversations/[conversationId]/route.ts",
  "src/app/api/conversations/[conversationId]/payment/manual/route.ts",
  "src/app/api/conversations/[conversationId]/payment/online/route.ts",
  "src/app/api/conversations/[conversationId]/payment/finalize-free/route.ts",
  "src/app/api/conversations/[conversationId]/payment/confirm-dev/route.ts",
  "src/app/api/conversations/[conversationId]/proposed-times/route.ts",
  "src/app/api/conversations/[conversationId]/request-new-times/route.ts",
  "src/app/api/conversations/[conversationId]/select-time/route.ts",
  "src/app/api/conversations/[conversationId]/attendance/submit-code/route.ts",
  "src/app/api/conversations/[conversationId]/cancel/route.ts",
  "src/app/api/wallet/route.ts",
  "src/app/api/wallet/withdrawals/route.ts",
  "src/app/api/notifications/route.ts",
  "src/app/api/notifications/[notificationId]/read/route.ts",
  "src/app/api/insights/route.ts",
  "src/app/api/insights/[slug]/route.ts",
  "src/app/api/insights/answers/route.ts",
  "src/app/api/admin/payments/route.ts",
  "src/app/api/admin/payments/[paymentId]/approve/route.ts",
  "src/app/api/admin/payments/[paymentId]/reject/route.ts"
] as const;

const protectedApiRoutes = apiRouteFiles.filter(
  (route) => !route.includes("src/app/api/insights/route.ts") && !route.includes("src/app/api/insights/[slug]/route.ts")
);

const mutationApiRoutes = apiRouteFiles.filter(
  (route) =>
    route.endsWith("/route.ts") &&
    !route.endsWith("src/app/api/insights/route.ts") &&
    !route.endsWith("src/app/api/insights/[slug]/route.ts") &&
    !route.endsWith("src/app/api/wallet/route.ts") &&
    !route.endsWith("src/app/api/notifications/route.ts") &&
    !route.endsWith("src/app/api/admin/payments/route.ts") &&
    !route.endsWith("src/app/api/conversations/[conversationId]/route.ts") &&
    !route.endsWith("src/app/api/notifications/[notificationId]/read/route.ts") &&
    !route.endsWith("src/app/api/conversations/[conversationId]/payment/online/route.ts") &&
    !route.endsWith("src/app/api/conversations/[conversationId]/payment/finalize-free/route.ts") &&
    !route.endsWith("src/app/api/conversations/[conversationId]/payment/confirm-dev/route.ts") &&
    !route.endsWith("src/app/api/profile/submit-for-review/route.ts")
);

const validProposedTimesPayload = {
  version: 1,
  timeOptions: [
    {
      startsAt: "2026-07-01T08:00:00.000Z",
      shamsiDateLabel: "1405/04/10",
      timeLabel: "11:30"
    },
    {
      startsAt: "2026-07-02T08:00:00.000Z",
      shamsiDateLabel: "1405/04/11",
      timeLabel: "11:30"
    },
    {
      startsAt: "2026-07-03T08:00:00.000Z",
      shamsiDateLabel: "1405/04/12",
      timeLabel: "11:30"
    }
  ]
};

describe("Checkpoint 2A backend/API and Prisma contracts", () => {
  it("keeps backend constants aligned with existing V51 product limits", () => {
    expect(PROFESSIONAL_SUMMARY_MAX_LENGTH).toBe(professionalSummaryMaxLength);
    expect(USER_MOTIVATION_OTHER_TEXT_MAX_LENGTH).toBe(userMotivationOtherTextMaxLength);
    expect(USER_MOTIVATION_CODES).toEqual(userMotivationOptions.map((option) => option.value));
    expect(INSIGHT_ANSWER_MAX_LENGTH).toBe(insightAnswerMaxLength);
    expect(INSIGHT_AUDIENCE_INTENT_CODES).toEqual(insightAudienceOptions.map((option) => option.id));
  });

  it("models the required backend entities without splitting requester/provider profiles", () => {
    const schema = readProjectFile("prisma/schema.prisma");

    [
      "model Profile",
      "model ExperienceProfile",
      "model ConversationRequest",
      "model TimeProposalSet",
      "model ProposedTime",
      "model NewTimeRequest",
      "model Payment",
      "model ManualPaymentReview",
      "model AttendanceVerification",
      "model Cancellation",
      "model Wallet",
      "model WalletTransaction",
      "model WithdrawalRequest",
      "model Notification",
      "model Insight",
      "model InsightAnswer"
    ].forEach((modelName) => {
      expect(schema, modelName).toContain(modelName);
    });

    expect(schema).toContain("enum UserRole");
    expect(schema).toContain("SUPPORT");
    expect(schema).not.toContain("model SeekerProfile");
    expect(schema).not.toContain("model ProviderProfile");
  });

  it("supports versioned time proposals, superseded options, manual review, cancellation finance, and settlement fields", () => {
    const schema = readProjectFile("prisma/schema.prisma");

    expect(schema).toContain("@@unique([conversationId, version])");
    expect(schema).toContain("enum TimeProposalSetStatus");
    expect(schema).toContain("SUPERSEDED");
    expect(schema).toContain("referenceNumber");
    expect(schema).toContain("receiptFileName");
    expect(schema).toContain("codeHash");
    expect(schema).toContain("requesterCodeCiphertext");
    expect(schema).toContain("refundRateBps");
    expect(schema).toContain("providerGrossCompensationToman");
    expect(schema).toContain("useravaaFeeRateBps");
    expect(schema).toContain("providerNetCompensationToman");
    expect(schema).toContain("SETTLEMENT_PENDING");
    expect(schema).toContain("sourceEntityType");
  });

  it("maps existing frontend statuses to backend enum contracts explicitly", () => {
    expect(backendStatusContract.profileStatusMap.pending_review).toBe("PENDING_REVIEW");
    expect(backendStatusContract.experienceCapabilityStatusMap.none).toBe("NOT_STARTED");
    expect(backendStatusContract.conversationStatusMap.pending_provider_response).toBe("AWAITING_TIME_PROPOSAL");
    expect(backendStatusContract.conversationStatusMap.times_proposed).toBe("TIMES_PROPOSED");
    expect(backendStatusContract.conversationStatusMap.new_time_requested).toBe("NEW_TIME_REQUESTED");
    expect(backendStatusContract.paymentStatusMap.PENDING_REVIEW).toBe("PENDING_REVIEW");
    expect(backendStatusContract.manualPaymentStatusMap.APPROVED).toBe("APPROVED");
    expect(backendStatusContract.proposedTimeStatusMap.SUPERSEDED).toBe("SUPERSEDED");
    expect(backendStatusContract.attendanceVerificationStatusMap.NEEDS_REVIEW).toBe("NEEDS_REVIEW");
    expect(backendStatusContract.cancellationStatusMap.under_support_review).toBe("UNDER_SUPPORT_REVIEW");
    expect(backendStatusContract.notificationStatusMap.unread).toBe("UNREAD");
    expect(backendStatusContract.insightAnswerStatusMap.published).toBe("APPROVED");
  });

  it("validates profile, request, manual payment, time proposal, selection, attendance, cancellation, wallet, notification, and insight inputs", () => {
    expect(profileUpdateSchema.safeParse({ professionalSummary: "a".repeat(251) }).success).toBe(false);
    expect(profileUpdateSchema.safeParse({ userMotivations: ["OTHER"] }).success).toBe(false);
    expect(profileUpdateSchema.safeParse({ userMotivations: ["OTHER"], userMotivationOtherText: "custom" }).success).toBe(true);

    expect(
      requestCreationSchema.safeParse({
        experienceProfileId: "profile-1",
        durationMinutes: 30,
        requestTopic: "career path",
        requestNote: "short note",
        paymentRequirement: "PAYMENT_REQUIRED",
        paymentMethod: "CARD_TO_CARD",
        quotedPriceToman: 900000
      }).success
    ).toBe(true);
    expect(requestCreationSchema.safeParse({}).success).toBe(false);

    expect(manualPaymentSubmissionSchema.safeParse({ referenceNumber: "123456" }).success).toBe(true);
    expect(manualPaymentSubmissionSchema.safeParse({}).success).toBe(false);
    expect(manualPaymentSubmissionSchema.safeParse({ referenceNumber: "123456", paymentStatus: "PAID" }).success).toBe(false);
    expect(proposedTimesSubmissionSchema.safeParse(validProposedTimesPayload).success).toBe(true);
    expect(proposedTimesSubmissionSchema.safeParse({ ...validProposedTimesPayload, timeOptions: validProposedTimesPayload.timeOptions.slice(0, 2) }).success).toBe(false);
    expect(
      proposedTimesSubmissionSchema.safeParse({
        ...validProposedTimesPayload,
        timeOptions: [validProposedTimesPayload.timeOptions[0], validProposedTimesPayload.timeOptions[0], validProposedTimesPayload.timeOptions[2]]
      }).success
    ).toBe(false);

    expect(
      timeSelectionSchema.safeParse({
        proposedTimeId: "time-1",
        proposalSetId: "set-1"
      }).success
    ).toBe(true);
    expect(
      timeSelectionSchema.safeParse({
        proposedTimeId: "time-1",
        proposalSetId: "set-1",
        proposedTimeStatus: "ACTIVE"
      }).success
    ).toBe(false);

    expect(attendanceSubmitCodeSchema.safeParse({ code: "48291" }).success).toBe(true);
    expect(attendanceSubmitCodeSchema.safeParse({ code: " " }).success).toBe(false);
    expect(attendanceSubmitCodeSchema.safeParse({ code: "48291", verifiedAt: new Date().toISOString() }).success).toBe(false);
    expect(cancellationRequestSchema.safeParse({ reasonCode: "changed" }).success).toBe(true);
    expect(cancellationRequestSchema.safeParse({ reasonCode: "changed", cancelledByRole: "REQUESTER" }).success).toBe(false);
    expect(cancellationRequestSchema.safeParse({ reasonCode: "changed", stage: "NEAR_SESSION_START" }).success).toBe(false);
    expect(walletWithdrawalRequestSchema.safeParse({ amountToman: 100000, destinationAccountOwner: "A User", destinationIban: "IR123456789012345678901234" }).success).toBe(true);
    expect(notificationReadMutationSchema.safeParse({ notificationId: "notification-1" }).success).toBe(true);
    expect(
      insightAnswerSubmissionSchema.safeParse({
        renderedQuestion: "question",
        answerText: "answer",
        audienceIntents: ["career_path"],
        responsibilityAccepted: true
      }).success
    ).toBe(true);
    expect(adminPaymentApprovalSchema.safeParse({ adminNote: "ok" }).success).toBe(true);
    expect(adminPaymentRejectionSchema.safeParse({}).success).toBe(false);
  });

  it("creates all expected API route skeletons", () => {
    apiRouteFiles.forEach((relativePath) => {
      expect(fs.existsSync(path.join(projectRoot, relativePath)), relativePath).toBe(true);
    });
  });

  it("protects private API routes and keeps public insight reading routes unauthenticated", () => {
    protectedApiRoutes.forEach((relativePath) => {
      const source = readProjectFile(relativePath);
      const isAdminRoute = relativePath.includes("src/app/api/admin/");

      expect(source, relativePath).toContain(isAdminRoute ? "requireAdminViewer" : "requireApiViewer");
    });

    expect(readProjectFile("src/app/api/insights/route.ts")).not.toContain("requireApiViewer");
    expect(readProjectFile("src/app/api/insights/[slug]/route.ts")).not.toContain("requireApiViewer");
    expect(readProjectFile("src/app/api/insights/answers/route.ts")).toContain("requireApiViewer");
  });

  it("validates mutation API JSON bodies at route boundaries", () => {
    mutationApiRoutes.forEach((relativePath) => {
      const source = readProjectFile(relativePath);

      expect(source, relativePath).toContain("parseJsonBody");
    });
  });

  it("validates path-parameter-only mutation routes without requiring fixture data", () => {
    const source = readProjectFile("src/app/api/notifications/[notificationId]/read/route.ts");

    expect(source).toContain("notificationReadMutationSchema");
    expect(source).toContain("safeParse");
    expect(source).toContain("validation_error");
  });

  it("does not import fixture data or fallback conversation helpers in backend API routes", () => {
    apiRouteFiles.forEach((relativePath) => {
      const source = readProjectFile(relativePath);

      expect(source, relativePath).not.toContain("@/features/v51/data");
      expect(source, relativePath).not.toContain("getConversationOrFallback");
      expect(source, relativePath).not.toContain("conversations");
      expect(source, relativePath).not.toContain("initialWalletFixture");
    });
  });

  it("returns typed not_implemented and provider_not_configured responses instead of fake fixture success", async () => {
    const notImplementedResponse = serviceResultToResponse(notImplementedResult("conversation"));
    const providerResponse = serviceResultToResponse(providerNotConfiguredResult("payment"));

    expect(notImplementedResponse.status).toBe(501);
    await expect(notImplementedResponse.json()).resolves.toMatchObject({
      ok: false,
      error: {
        code: "not_implemented",
        details: {
          area: "conversation"
        }
      }
    });

    expect(providerResponse.status).toBe(503);
    await expect(providerResponse.json()).resolves.toMatchObject({
      ok: false,
      error: {
        code: "provider_not_configured",
        details: {
          area: "payment"
        }
      }
    });
  });

  it("keeps attendance API provider-facing and avoids raw requester code exposure in route/service code", () => {
    const attendanceRoute = readProjectFile("src/app/api/conversations/[conversationId]/attendance/submit-code/route.ts");
    const conversationRepository = readProjectFile("src/lib/backend/repositories/conversation.ts");

    expect(attendanceRoute).toContain("attendanceSubmitCodeSchema");
    expect(attendanceRoute).not.toContain("requesterCodeCiphertext");
    expect(attendanceRoute).not.toContain("attendanceVerificationCode");
    expect(conversationRepository).not.toContain("requesterCodeCiphertext: true");
    expect(conversationRepository).not.toContain("codeHash: true");
  });

  it("classifies current backend reality honestly for all major flows", () => {
    expect(backendImplementationClassification.authSessionBridge.classification).toBe("contract_only");
    expect(backendImplementationClassification.profile.classification).toBe("read_only_persistent");
    expect(backendImplementationClassification.experienceProfile.classification).toBe("repository_ready");
    expect(backendImplementationClassification.discoverProfileRead.classification).toBe("repository_ready");
    expect(backendImplementationClassification.requestConversation.classification).toBe("transaction_ready");
    expect(backendImplementationClassification.requestConversation.writesImplemented).toBe(true);
    expect(backendImplementationClassification.paymentManualPayment.classification).toBe("transaction_ready");
    expect(backendImplementationClassification.wallet.blocksProductionLaunch).toBe(true);
    expect(backendImplementationClassification.adminPaymentReview.apiRouteExists).toBe(true);
    expect(backendImplementationClassification.adminPaymentReview.writesImplemented).toBe(true);
  });

  it("keeps development payment confirmation unavailable in production", () => {
    const source = readProjectFile("src/app/api/conversations/[conversationId]/payment/confirm-dev/route.ts");

    expect(source).toContain('process.env.NODE_ENV === "production"');
    expect(source).toContain('"not_found"');
  });
});
