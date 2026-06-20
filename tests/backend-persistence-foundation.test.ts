import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  getPrismaClientOptions,
  PrismaClientConfigurationError
} from "@/lib/backend/db/prisma";
import {
  useravaaTransactionUseCases
} from "@/lib/backend/db/transaction";
import { apiEndpointPersistenceClassification } from "@/lib/backend/endpoint-classification";
import { backendImplementationClassification } from "@/lib/backend/implementation-classification";
import { useravaaRepository } from "@/lib/backend/repository";

const projectRoot = process.cwd();

function readProjectFile(relativePath: string) {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

function projectFileExists(relativePath: string) {
  return fs.existsSync(path.join(projectRoot, relativePath));
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
  "src/app/api/admin/payments/[paymentId]/reject/route.ts",
  "src/app/api/admin/leads/route.ts",
  "src/app/api/admin/leads/[leadId]/route.ts",
  "src/app/api/admin/leads/[leadId]/assign/route.ts",
  "src/app/api/admin/leads/[leadId]/notes/route.ts",
  "src/app/api/admin/leads/[leadId]/tags/route.ts",
  "src/app/api/admin/leads/[leadId]/tags/[tagId]/route.ts",
  "src/app/api/admin/leads/[leadId]/follow-ups/route.ts",
  "src/app/api/admin/leads/[leadId]/follow-ups/[followUpId]/complete/route.ts",
  "src/app/api/admin/leads/[leadId]/convert/route.ts",
  "src/app/api/admin/leads/[leadId]/lost/route.ts",
  "src/app/api/admin/leads/[leadId]/reopen/route.ts",
  "src/app/api/admin/leads/[leadId]/archive/route.ts",
  "src/app/api/admin/leads/import/route.ts"
] as const;

const repositoryFiles = [
  "src/lib/backend/repositories/profile.ts",
  "src/lib/backend/repositories/experience-profile.ts",
  "src/lib/backend/repositories/conversation.ts",
  "src/lib/backend/repositories/payment.ts",
  "src/lib/backend/repositories/time-proposal.ts",
  "src/lib/backend/repositories/attendance.ts",
  "src/lib/backend/repositories/cancellation.ts",
  "src/lib/backend/repositories/wallet.ts",
  "src/lib/backend/repositories/wallet-transaction.ts",
  "src/lib/backend/repositories/withdrawal.ts",
  "src/lib/backend/repositories/notification.ts",
  "src/lib/backend/repositories/insights.ts",
  "src/lib/backend/repositories/admin-payment-review.ts",
  "src/lib/backend/repositories/admin-leads.ts"
] as const;

describe("Checkpoint 2B-1 database persistence foundation", () => {
  it("uses a single Prisma client boundary and no route-level PrismaClient construction", () => {
    expect(projectFileExists("src/lib/backend/db/prisma.ts")).toBe(true);
    expect(projectFileExists("src/lib/db/prisma.ts")).toBe(true);

    expect(readProjectFile("src/lib/backend/db/prisma.ts")).toContain("new PrismaClient");
    expect(readProjectFile("src/lib/db/prisma.ts")).not.toContain("new PrismaClient");

    apiRouteFiles.forEach((relativePath) => {
      const source = readProjectFile(relativePath);

      expect(source, relativePath).not.toContain("@prisma/client");
      expect(source, relativePath).not.toContain("new PrismaClient");
      expect(source, relativePath).not.toContain("getPrismaClient");
    });
  });

  it("reports explicit database configuration errors before DB access", () => {
    expect(() => getPrismaClientOptions({} as NodeJS.ProcessEnv)).toThrow(PrismaClientConfigurationError);
    expect(
      getPrismaClientOptions({
        NODE_ENV: "test",
        DATABASE_URL: "postgresql://user:password@localhost:5432/useravaa"
      } as NodeJS.ProcessEnv)
    ).toMatchObject({
      errorFormat: "minimal"
    });
    expect(
      "adapter" in
        getPrismaClientOptions({
          NODE_ENV: "test",
          DATABASE_URL: "postgresql://user:password@localhost:5432/useravaa"
        } as NodeJS.ProcessEnv)
    ).toBe(true);
    expect(
      getPrismaClientOptions({
        NODE_ENV: "test",
        PRISMA_ACCELERATE_URL: "prisma://accelerate.prisma-data.net/?api_key=test"
      } as NodeJS.ProcessEnv)
    ).toMatchObject({
      accelerateUrl: "prisma://accelerate.prisma-data.net/?api_key=test"
    });
  });

  it("adds repository modules for all core 2B-1 domains without fixture imports", () => {
    repositoryFiles.forEach((relativePath) => {
      const source = readProjectFile(relativePath);

      expect(source, relativePath).not.toContain("@/features/v51/data");
      expect(source, relativePath).not.toContain("getConversationOrFallback");
      expect(source, relativePath).not.toContain("initialWalletFixture");
    });

    expect(useravaaRepository.profile.methods.getCurrentProfile).toBe("read_only_persistent");
    expect(useravaaRepository.experienceProfile.methods.listPublicProfiles).toBe("read_only_persistent");
    expect(useravaaRepository.conversations.methods.getForViewer).toBe("read_only_persistent");
    expect(useravaaRepository.payment.methods.submitManualPayment).toBe("database_persistent");
    expect(useravaaRepository.timeProposal.methods.proposeTimes).toBe("database_persistent");
    expect(useravaaRepository.timeProposal.methods.requestNewTimes).toBe("database_persistent");
    expect(useravaaRepository.timeProposal.methods.selectTime).toBe("database_persistent");
    expect(useravaaRepository.attendance.methods.submitCode).toBe("database_persistent");
    expect(useravaaRepository.cancellation.methods.createRequesterCancellation).toBe("database_persistent");
    expect(useravaaRepository.walletTransaction.methods.createLedgerEntry).toBe("database_persistent");
    expect(useravaaRepository.adminPayments.methods.approve).toBe("database_persistent");
    expect(useravaaRepository.adminLeads.methods.createLead).toBe("database_persistent");
    expect(useravaaRepository.adminLeads.methods.listLeads).toBe("read_only_persistent");
  });

  it("keeps production-shaped API routes fixture-free and service-boundary based", () => {
    apiRouteFiles.forEach((relativePath) => {
      const source = readProjectFile(relativePath);

      expect(source, relativePath).not.toContain("@/features/v51/data");
      expect(source, relativePath).not.toContain("getConversationOrFallback");
      expect(source, relativePath).not.toMatch(/\.(push|splice|shift|unshift|pop)\(/);
      expect(source, relativePath).toContain("serviceResultToResponse");
    });
  });

  it("keeps private reads private, admin reads admin-only, and public Insights reads public", () => {
    expect(readProjectFile("src/app/api/profile/me/route.ts")).toContain("requireApiViewer");
    expect(readProjectFile("src/app/api/conversations/route.ts")).toContain("requireApiViewer");
    expect(readProjectFile("src/app/api/conversations/[conversationId]/route.ts")).toContain("requireApiViewer");
    expect(readProjectFile("src/app/api/wallet/route.ts")).toContain("requireApiViewer");
    expect(readProjectFile("src/app/api/notifications/route.ts")).toContain("requireApiViewer");
    expect(readProjectFile("src/app/api/admin/payments/route.ts")).toContain("requireAdminViewer");

    expect(readProjectFile("src/app/api/insights/route.ts")).not.toContain("requireApiViewer");
    expect(readProjectFile("src/app/api/insights/[slug]/route.ts")).not.toContain("requireApiViewer");
    expect(readProjectFile("src/app/api/insights/answers/route.ts")).toContain("requireApiViewer");
  });

  it("wires only safe read endpoints to repository-backed services", () => {
    expect(readProjectFile("src/app/api/profile/me/route.ts")).toContain("await profileService.getCurrentProfile");
    expect(readProjectFile("src/app/api/conversations/route.ts")).toContain("await conversationService.listForViewer");
    expect(readProjectFile("src/app/api/conversations/[conversationId]/route.ts")).toContain("await conversationService.getConversation");
    expect(readProjectFile("src/app/api/wallet/route.ts")).toContain("await walletService.getWallet");
    expect(readProjectFile("src/app/api/notifications/route.ts")).toContain("await notificationService.listForViewer");
    expect(readProjectFile("src/app/api/insights/route.ts")).toContain("await insightService.listPublicInsights");
    expect(readProjectFile("src/app/api/insights/[slug]/route.ts")).toContain("await insightService.getPublicInsight");
    expect(readProjectFile("src/app/api/admin/payments/route.ts")).toContain("await adminPaymentService.listPending");
  });

  it("does not expose raw attendance code fields in provider-facing read contracts", () => {
    const conversationRepository = readProjectFile("src/lib/backend/repositories/conversation.ts");
    const attendanceRepository = readProjectFile("src/lib/backend/repositories/attendance.ts");

    expect(conversationRepository).toContain("attendanceVerification");
    expect(conversationRepository).not.toContain("requesterCodeCiphertext: true");
    expect(conversationRepository).not.toContain("codeHash: true");
    expect(conversationRepository).not.toContain("codeSalt: true");
    expect(conversationRepository).not.toContain("submittedCodeHash: true");

    expect(attendanceRepository).toContain("findConversationForRequesterAttendanceCode");
    expect(attendanceRepository).toContain("findConversationForProviderAttendanceSubmission");
    expect(readProjectFile("src/app/api/conversations/[conversationId]/attendance/submit-code/route.ts")).not.toContain("requesterCodeCiphertext");
  });

  it("keeps wallet reads scoped to the authenticated viewer", () => {
    const walletRoute = readProjectFile("src/app/api/wallet/route.ts");
    const walletRepository = readProjectFile("src/lib/backend/repositories/wallet.ts");

    expect(walletRoute).toContain("walletService.getWallet(auth.viewer)");
    expect(walletRepository).toContain("where: { userId }");
    expect(walletRepository).not.toContain("findMany");
  });

  it("adds a reusable transaction helper for future lifecycle mutations without implementing those mutations", () => {
    const transactionSource = readProjectFile("src/lib/backend/db/transaction.ts");

    expect(transactionSource).toContain("withUseravaaTransaction");
    expect(transactionSource).toContain("$transaction");
    expect(useravaaTransactionUseCases).toContain("create_request_with_payment_record");
    expect(useravaaTransactionUseCases).toContain("cancel_conversation_and_create_wallet_credit");
  });

  it("classifies endpoints honestly and does not claim full database persistence", () => {
    expect(apiEndpointPersistenceClassification["GET /api/profile/me"].classification).toBe("read_only_persistent");
    expect(apiEndpointPersistenceClassification["GET /api/wallet"].usesRepository).toBe(true);
    expect(apiEndpointPersistenceClassification["GET /api/admin/payments"].requiresAdmin).toBe(true);
    expect(apiEndpointPersistenceClassification["POST /api/conversations"].classification).toBe("transaction_ready");
    expect(apiEndpointPersistenceClassification["POST /api/conversations"].writesImplemented).toBe(true);
    expect(apiEndpointPersistenceClassification["POST /api/conversations/[conversationId]/payment/online"].classification).toBe("provider_not_configured");

    expect(
      Object.entries(apiEndpointPersistenceClassification)
        .filter(([, entry]) => (entry.classification as string) === "database_persistent")
        .map(([endpoint]) => endpoint)
    ).toEqual([]);
    expect(
      Object.entries(apiEndpointPersistenceClassification)
        .filter(([, entry]) => entry.classification === "transaction_ready")
        .map(([endpoint]) => endpoint)
    ).toEqual([
      "POST /api/conversations",
      "POST /api/conversations/[conversationId]/payment/manual",
      "POST /api/conversations/[conversationId]/payment/finalize-free",
      "POST /api/conversations/[conversationId]/proposed-times",
      "POST /api/conversations/[conversationId]/request-new-times",
      "POST /api/conversations/[conversationId]/select-time",
      "POST /api/conversations/[conversationId]/attendance/submit-code",
      "POST /api/conversations/[conversationId]/cancel",
      "POST /api/admin/payments/[paymentId]/approve",
      "POST /api/admin/payments/[paymentId]/reject",
      "POST /api/admin/cancellations/[cancellationId]/approve-credit",
      "POST /api/admin/cancellations/[cancellationId]/reject-credit",
      "POST /api/admin/experience-profiles/[profileId]/approve",
      "POST /api/admin/experience-profiles/[profileId]/request-changes",
      "POST /api/admin/experience-profiles/[profileId]/hide",
      "POST /api/admin/insights/[insightId]/hide",
      "POST /api/admin/insights/[insightId]/restore",
      "POST /api/admin/insights/[insightId]/delete",
      "POST /api/admin/insight-answers/[answerId]/hide",
      "POST /api/admin/pricing",
      "PATCH /api/admin/pricing/[ruleId]",
      "POST /api/admin/pricing/[ruleId]/deactivate",
      "POST /api/admin/categories",
      "PATCH /api/admin/categories/[categoryId]",
      "POST /api/admin/categories/[categoryId]/archive",
      "POST /api/admin/categories/[categoryId]/restore",
      "POST /api/admin/content",
      "PATCH /api/admin/content/[contentId]",
      "POST /api/admin/content/[contentId]/archive",
      "POST /api/admin/content/[contentId]/restore",
      "POST /api/admin/leads",
      "PATCH /api/admin/leads/[leadId]",
      "POST /api/admin/leads/[leadId]/assign",
      "POST /api/admin/leads/[leadId]/notes",
      "POST /api/admin/leads/[leadId]/tags",
      "DELETE /api/admin/leads/[leadId]/tags/[tagId]",
      "POST /api/admin/leads/[leadId]/follow-ups",
      "POST /api/admin/leads/[leadId]/follow-ups/[followUpId]/complete",
      "POST /api/admin/leads/[leadId]/convert",
      "POST /api/admin/leads/[leadId]/lost",
      "POST /api/admin/leads/[leadId]/reopen",
      "POST /api/admin/leads/[leadId]/archive",
      "POST /api/admin/leads/import",
      "POST /api/admin/support",
      "PATCH /api/admin/support/[ticketId]",
      "POST /api/admin/support/[ticketId]/assign",
      "POST /api/admin/support/[ticketId]/notes",
      "POST /api/admin/support/[ticketId]/resolve",
      "POST /api/admin/support/[ticketId]/reopen",
      "POST /api/admin/support/[ticketId]/archive"
    ]);
  });

  it("classifies domains with honest write persistence after the request creation checkpoint", () => {
    expect(backendImplementationClassification.profile.classification).toBe("read_only_persistent");
    expect(backendImplementationClassification.requestConversation.classification).toBe("transaction_ready");
    expect(backendImplementationClassification.walletTransaction.classification).toBe("transaction_ready");
    expect(backendImplementationClassification.insightAnswers.classification).toBe("contract_only");
    expect(backendImplementationClassification.paymentManualPayment.classification).toBe("transaction_ready");

    expect(
      Object.entries(backendImplementationClassification)
        .filter(([, entry]) => entry.writesImplemented)
        .map(([area]) => area)
        .sort()
    ).toEqual(
      [
        "adminAudit",
        "adminCategories",
        "adminContent",
        "adminExperienceProfileReview",
        "adminInsightModeration",
        "adminLeads",
        "adminPaymentReview",
        "adminPricingRules",
        "adminSupport",
        "attendanceVerification",
        "cancellation",
        "confirmedSession",
        "freeRequestBranch",
        "initialPaymentRecordCreation",
        "newTimeRequest",
        "paidRequestBranch",
        "participantVisibility",
        "paymentManualPayment",
        "proposedTimes",
        "requestConversation",
        "timeSelection",
        "walletTransaction"
      ].sort()
    );
  });
});
