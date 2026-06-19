import fs from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { getPrismaClient } from "@/lib/backend/db/prisma";
import { withUseravaaTransaction, type UseravaaTransactionClient } from "@/lib/backend/db/transaction";
import { apiEndpointPersistenceClassification } from "@/lib/backend/endpoint-classification";
import { backendImplementationClassification } from "@/lib/backend/implementation-classification";
import { adminInsightModerationService } from "@/lib/backend/services";
import {
  adminInsightAnswerHideSchema,
  adminInsightDeleteSchema,
  adminInsightHideSchema,
  adminInsightRestoreSchema
} from "@/lib/backend/validation";

const projectRoot = process.cwd();
const now = new Date("2026-06-13T08:00:00.000Z");

function readProjectFile(relativePath: string) {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

function createFakeInsightModerationFlow(insightStatus = "PUBLISHED", answerStatus = "APPROVED") {
  const state = {
    insight: {
      id: "insight-1",
      slug: "insight-1",
      title: "Insight title",
      prompt: "Prompt",
      body: "Insight body",
      status: insightStatus,
      authorUserId: "author-1",
      experienceProfileId: null as string | null,
      publishedAt: now,
      hiddenAt: null as Date | null,
      createdAt: now,
      updatedAt: now,
      authorUser: {
        id: "author-1",
        displayName: "Author"
      },
      experienceProfile: null,
      answers: [],
      _count: {
        answers: 0
      }
    },
    answer: {
      id: "answer-1",
      authorUserId: "answer-author-1",
      experienceProfileId: null as string | null,
      experienceQuestionId: null as string | null,
      insightId: "insight-1",
      renderedQuestion: "Question",
      answerText: "Answer text",
      audienceIntents: [] as string[],
      status: answerStatus,
      submittedAt: now,
      approvedAt: answerStatus === "APPROVED" ? now : null,
      rejectedAt: null as Date | null,
      hiddenAt: null as Date | null,
      createdAt: now,
      updatedAt: now,
      authorUser: {
        id: "answer-author-1",
        displayName: "Answer author"
      },
      insight: {
        id: "insight-1",
        status: insightStatus,
        title: "Insight title",
        slug: "insight-1"
      }
    },
    adminAuditCreate: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
      id: "admin-audit-1",
      ...data
    })),
    paymentUpdate: vi.fn(),
    paymentCreate: vi.fn(),
    walletTransactionCreate: vi.fn(),
    conversationUpdate: vi.fn(),
    proposedTimeCreate: vi.fn(),
    attendanceCreate: vi.fn(),
    profileUpdate: vi.fn(),
    experienceProfileUpdate: vi.fn()
  };

  const tx = {
    insight: {
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) =>
        where.id === state.insight.id ? structuredClone(state.insight) : null
      ),
      update: vi.fn(async ({ data }: { data: { status?: string; publishedAt?: Date; hiddenAt?: Date | null; updatedAt?: Date } }) => {
        state.insight = {
          ...state.insight,
          ...data
        };

        return structuredClone(state.insight);
      })
    },
    insightAnswer: {
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) =>
        where.id === state.answer.id ? structuredClone(state.answer) : null
      ),
      update: vi.fn(async ({ data }: { data: { status?: string; hiddenAt?: Date | null; updatedAt?: Date } }) => {
        state.answer = {
          ...state.answer,
          ...data
        };

        return structuredClone(state.answer);
      })
    },
    adminAuditEvent: {
      create: state.adminAuditCreate
    },
    payment: {
      update: state.paymentUpdate,
      create: state.paymentCreate
    },
    walletTransaction: {
      create: state.walletTransactionCreate
    },
    conversationRequest: {
      update: state.conversationUpdate
    },
    proposedTime: {
      create: state.proposedTimeCreate
    },
    attendanceVerification: {
      create: state.attendanceCreate
    },
    profile: {
      update: state.profileUpdate
    },
    experienceProfile: {
      update: state.experienceProfileUpdate
    }
  };

  const runInTransaction = (async <T,>(operation: (transaction: UseravaaTransactionClient) => Promise<T>) =>
    operation(tx as unknown as UseravaaTransactionClient)) as typeof withUseravaaTransaction;

  return { state, tx, runInTransaction };
}

describe("Checkpoint 3A-6 admin insight moderation actions", () => {
  it("keeps insight moderation API routes admin guarded, service-bound, and fixture-free", () => {
    [
      "src/app/api/admin/insights/[insightId]/hide/route.ts",
      "src/app/api/admin/insights/[insightId]/restore/route.ts",
      "src/app/api/admin/insights/[insightId]/delete/route.ts",
      "src/app/api/admin/insight-answers/[answerId]/hide/route.ts"
    ].forEach((relativePath) => {
      const source = readProjectFile(relativePath);

      expect(source).toContain("requireAdminViewer");
      expect(source).toContain("parseJsonBody");
      expect(source).toContain("adminInsightModerationService");
      expect(source).toContain("serviceResultToResponse(await");
      expect(source).not.toContain("@/features/v51/data");
      expect(source).not.toContain("getConversationOrFallback");
    });
  });

  it("binds insight detail actions to moderation APIs without optimistic success", () => {
    const insightActionSource = readProjectFile("src/features/v51/admin/AdminInsightModerationActions.tsx");
    const answerActionSource = readProjectFile("src/features/v51/admin/AdminInsightAnswerModerationActions.tsx");
    const surfaceSource = readProjectFile("src/features/v51/admin/AdminSurfaces.tsx");
    const routeDataSource = readProjectFile("src/features/v51/admin/server-data.ts");

    expect(insightActionSource).toContain("\"use client\"");
    expect(insightActionSource).toContain("/api/admin/insights/");
    expect(insightActionSource).toContain("hide");
    expect(insightActionSource).toContain("restore");
    expect(insightActionSource).toContain("delete");
    expect(insightActionSource).toContain("if (!response.ok)");
    expect(insightActionSource).toContain("action !== \"restore\" && !trimmedReason");
    expect(insightActionSource).toContain("setState(\"success\")");
    expect(insightActionSource).toContain("router.refresh()");
    expect(answerActionSource).toContain("/api/admin/insight-answers/");
    expect(answerActionSource).toContain("if (!response.ok)");
    expect(answerActionSource).toContain("!trimmedReason");
    expect(answerActionSource).toContain("router.refresh()");
    expect(surfaceSource).toContain("AdminInsightModerationActions");
    expect(surfaceSource).toContain("AdminInsightAnswerModerationActions");
    expect(surfaceSource).toContain("item.auditItems");
    expect(routeDataSource).toContain("getInsightAuditLog");
  });

  it("uses strict schemas that reject actor, author, status, visibility, profile, payment, and metadata overrides", () => {
    expect(adminInsightHideSchema.safeParse({ reasonCode: "unsafe public content" }).success).toBe(true);
    expect(adminInsightRestoreSchema.safeParse({ reviewNote: "safe to restore" }).success).toBe(true);
    expect(adminInsightDeleteSchema.safeParse({ reasonCode: "remove from public library" }).success).toBe(true);
    expect(adminInsightAnswerHideSchema.safeParse({ reasonCode: "answer unsafe" }).success).toBe(true);

    for (const payload of [
      { reasonCode: "x", actorAdminUserId: "admin-override" },
      { reasonCode: "x", authorUserId: "author-override" },
      { reasonCode: "x", status: "PUBLISHED" },
      { reasonCode: "x", publishedAt: now.toISOString() },
      { reasonCode: "x", hiddenAt: now.toISOString() },
      { reasonCode: "x", experienceProfileId: "profile-override" },
      { reasonCode: "x", paymentId: "payment-override" },
      { reasonCode: "x", walletId: "wallet-override" },
      { reasonCode: "x", sessionId: "session-override" },
      { reasonCode: "x", metadata: { arbitrary: true } }
    ]) {
      expect(adminInsightHideSchema.safeParse(payload).success).toBe(false);
      expect(adminInsightDeleteSchema.safeParse(payload).success).toBe(false);
      expect(adminInsightAnswerHideSchema.safeParse(payload).success).toBe(false);
    }

    expect(adminInsightRestoreSchema.safeParse({ status: "PUBLISHED" }).success).toBe(false);
  });

  it("hides, restores, soft-deletes, and hides answers through the service while writing audit events only", async () => {
    const hide = createFakeInsightModerationFlow("PUBLISHED");
    const hidden = await adminInsightModerationService.hideInsight(
      { id: "admin-1", role: "ADMIN" },
      "insight-1",
      { reasonCode: "public safety", reviewNote: "hide note" },
      { runInTransaction: hide.runInTransaction, now: () => now }
    );

    expect(hidden).toMatchObject({ ok: true });
    expect(hide.state.insight.status).toBe("HIDDEN");
    expect(hide.state.insight.hiddenAt).toEqual(now);
    expect(hide.state.adminAuditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "INSIGHT_HIDDEN",
          entityType: "INSIGHT",
          entityId: "insight-1",
          actorAdminUserId: "admin-1",
          reason: "public safety",
          note: "hide note",
          beforeStatus: "insight:PUBLISHED;visibility:public_visible",
          afterStatus: "insight:HIDDEN;visibility:public_hidden"
        })
      })
    );

    const restore = createFakeInsightModerationFlow("HIDDEN");
    const restored = await adminInsightModerationService.restoreInsight(
      { id: "support-1", role: "SUPPORT" },
      "insight-1",
      { reviewNote: "restored safely" },
      { runInTransaction: restore.runInTransaction, now: () => now }
    );

    expect(restored).toMatchObject({ ok: true });
    expect(restore.state.insight.status).toBe("PUBLISHED");
    expect(restore.state.insight.hiddenAt).toBeNull();
    expect(restore.state.adminAuditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
          data: expect.objectContaining({
            action: "INSIGHT_RESTORED",
          beforeStatus: "insight:HIDDEN;visibility:public_hidden",
          afterStatus: "insight:PUBLISHED;visibility:public_visible",
          note: "restored safely"
        })
      })
    );

    const archive = createFakeInsightModerationFlow("PUBLISHED");
    const archived = await adminInsightModerationService.deleteInsight(
      { id: "admin-1", role: "ADMIN" },
      "insight-1",
      { reasonCode: "archive requested" },
      { runInTransaction: archive.runInTransaction, now: () => now }
    );

    expect(archived).toMatchObject({ ok: true });
    expect(archive.state.insight.status).toBe("ARCHIVED");
    expect(archive.state.adminAuditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "INSIGHT_DELETED",
          beforeStatus: "insight:PUBLISHED;visibility:public_visible",
          afterStatus: "insight:ARCHIVED;visibility:public_hidden",
          reason: "archive requested"
        })
      })
    );

    const answer = createFakeInsightModerationFlow("PUBLISHED", "APPROVED");
    const hiddenAnswer = await adminInsightModerationService.hideInsightAnswer(
      { id: "admin-1", role: "ADMIN" },
      "answer-1",
      { reasonCode: "answer unsafe" },
      { runInTransaction: answer.runInTransaction, now: () => now }
    );

    expect(hiddenAnswer).toMatchObject({ ok: true });
    expect(answer.state.answer.status).toBe("HIDDEN");
    expect(answer.state.adminAuditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "INSIGHT_ANSWER_HIDDEN",
          entityType: "INSIGHT_ANSWER",
          entityId: "answer-1",
          reason: "answer unsafe"
        })
      })
    );

    for (const flow of [hide, restore, archive, answer]) {
      expect(flow.state.paymentUpdate).not.toHaveBeenCalled();
      expect(flow.state.paymentCreate).not.toHaveBeenCalled();
      expect(flow.state.walletTransactionCreate).not.toHaveBeenCalled();
      expect(flow.state.conversationUpdate).not.toHaveBeenCalled();
      expect(flow.state.proposedTimeCreate).not.toHaveBeenCalled();
      expect(flow.state.attendanceCreate).not.toHaveBeenCalled();
      expect(flow.state.profileUpdate).not.toHaveBeenCalled();
      expect(flow.state.experienceProfileUpdate).not.toHaveBeenCalled();
    }
  });

  it("blocks non-admin viewers, author self-moderation, unsafe states, and restore from non-hidden content", async () => {
    const nonAdmin = createFakeInsightModerationFlow("PUBLISHED");
    const nonAdminResult = await adminInsightModerationService.hideInsight(
      { id: "user-1", role: "USER" },
      "insight-1",
      { reasonCode: "x" },
      { runInTransaction: nonAdmin.runInTransaction, now: () => now }
    );

    expect(nonAdminResult).toMatchObject({ ok: false, code: "unauthorized" });
    expect(nonAdmin.tx.insight.update).not.toHaveBeenCalled();

    const authorAdmin = createFakeInsightModerationFlow("PUBLISHED");
    const authorResult = await adminInsightModerationService.hideInsight(
      { id: "author-1", role: "ADMIN" },
      "insight-1",
      { reasonCode: "x" },
      { runInTransaction: authorAdmin.runInTransaction, now: () => now }
    );

    expect(authorResult).toMatchObject({ ok: false, code: "unauthorized" });
    expect(authorAdmin.tx.insight.update).not.toHaveBeenCalled();

    const draft = createFakeInsightModerationFlow("DRAFT");
    const draftResult = await adminInsightModerationService.hideInsight(
      { id: "admin-1", role: "ADMIN" },
      "insight-1",
      { reasonCode: "x" },
      { runInTransaction: draft.runInTransaction, now: () => now }
    );

    expect(draftResult).toMatchObject({ ok: false, code: "invalid_state" });
    expect(draft.tx.insight.update).not.toHaveBeenCalled();

    const publishedRestore = createFakeInsightModerationFlow("PUBLISHED");
    const restoreResult = await adminInsightModerationService.restoreInsight(
      { id: "admin-1", role: "ADMIN" },
      "insight-1",
      {},
      { runInTransaction: publishedRestore.runInTransaction, now: () => now }
    );

    expect(restoreResult).toMatchObject({ ok: false, code: "invalid_state" });
    expect(publishedRestore.tx.insight.update).not.toHaveBeenCalled();

    const rejectedAnswer = createFakeInsightModerationFlow("PUBLISHED", "REJECTED");
    const answerResult = await adminInsightModerationService.hideInsightAnswer(
      { id: "admin-1", role: "ADMIN" },
      "answer-1",
      { reasonCode: "x" },
      { runInTransaction: rejectedAnswer.runInTransaction, now: () => now }
    );

    expect(answerResult).toMatchObject({ ok: false, code: "invalid_state" });
    expect(rejectedAnswer.tx.insightAnswer.update).not.toHaveBeenCalled();
  });

  it("classifies insight moderation as transaction-ready and keeps public reads hidden-status safe", () => {
    for (const endpoint of [
      "POST /api/admin/insights/[insightId]/hide",
      "POST /api/admin/insights/[insightId]/restore",
      "POST /api/admin/insights/[insightId]/delete",
      "POST /api/admin/insight-answers/[answerId]/hide"
    ] as const) {
      expect(apiEndpointPersistenceClassification[endpoint]).toMatchObject({
        classification: "transaction_ready",
        requiresAdmin: true,
        usesRepository: true,
        writesImplemented: true
      });
    }

    expect(backendImplementationClassification.adminInsightModeration).toMatchObject({
      classification: "transaction_ready",
      writesImplemented: true
    });
    expect(backendImplementationClassification.notifications.writesImplemented).toBe(false);
    expect(backendImplementationClassification.withdrawal.writesImplemented).toBe(false);

    const repositorySource = readProjectFile("src/lib/backend/repositories/insights.ts");
    expect(repositorySource).toContain("where: { status: \"PUBLISHED\" }");
    expect(repositorySource).toContain("where: {");
    expect(repositorySource).toContain("slug,");
    expect(repositorySource).toContain("status: \"PUBLISHED\"");
    expect(repositorySource).toContain("where: { status: \"APPROVED\" as const }");

    const serviceSource = readProjectFile("src/lib/backend/services.ts");
    const insightServiceSource = serviceSource.slice(
      serviceSource.indexOf("export const adminInsightModerationService"),
      serviceSource.indexOf("export const adminExperienceProfileService")
    );
    const combined = [
      "src/lib/backend/repositories/admin-audit.ts",
      "src/features/v51/admin/AdminInsightModerationActions.tsx",
      "src/features/v51/admin/AdminInsightAnswerModerationActions.tsx",
      "src/features/v51/admin/AdminSurfaces.tsx",
      "src/features/v51/admin/server-data.ts"
    ].map(readProjectFile).join("\n") + insightServiceSource;

    for (const forbidden of [
      "receiptUrl",
      "codeHash",
      "codeSalt",
      "requesterCodeCiphertext",
      "submittedCodeHash",
      "attendanceVerificationCode",
      "DATABASE_URL",
      "PRISMA_ACCELERATE",
      "INSIGHT_ANSWER_DELETED"
    ]) {
      expect(combined.includes(forbidden), `insight moderation source contains ${forbidden}`).toBe(false);
    }
  });

  it("runs rollback-backed DB smoke coverage for insight moderation when enabled", async () => {
    if (process.env.USERAVAA_DB_SMOKE_TEST !== "1") {
      expect(process.env.USERAVAA_DB_SMOKE_TEST).not.toBe("1");
      return;
    }

    class SmokeRollback extends Error {
      constructor(readonly summary: Record<string, unknown>) {
        super("INSIGHT_MODERATION_SMOKE_ROLLBACK");
      }
    }

    const prisma = getPrismaClient();
    const unique = `insight-smoke-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const adminId = `${unique}-admin`;
    const supportId = `${unique}-support`;
    const requesterId = `${unique}-requester`;
    const authorId = `${unique}-author`;
    const answerAuthorId = `${unique}-answer-author`;
    const insightId = `${unique}-insight`;
    const answerInsightId = `${unique}-answer-insight`;
    const normalDeniedInsightId = `${unique}-normal-denied`;
    const answerId = `${unique}-answer`;
    const actorIds = [requesterId, authorId, answerAuthorId];
    let summary: Record<string, unknown> | null = null;

    try {
      await prisma.$transaction(async (tx) => {
        await tx.user.createMany({
          data: [
            {
              id: adminId,
              role: "ADMIN",
              email: `${adminId}@smoke.useravaa.test`,
              displayName: "Smoke Admin"
            },
            {
              id: supportId,
              role: "SUPPORT",
              email: `${supportId}@smoke.useravaa.test`,
              displayName: "Smoke Support"
            },
            {
              id: requesterId,
              role: "USER",
              email: `${requesterId}@smoke.useravaa.test`,
              displayName: "Smoke User"
            },
            {
              id: authorId,
              role: "USER",
              email: `${authorId}@smoke.useravaa.test`,
              displayName: "Smoke Author"
            },
            {
              id: answerAuthorId,
              role: "USER",
              email: `${answerAuthorId}@smoke.useravaa.test`,
              displayName: "Smoke Answer Author"
            }
          ]
        });

        await tx.insight.createMany({
          data: [
            {
              id: insightId,
              slug: `${unique}-slug`,
              title: "Smoke public insight",
              prompt: "Smoke prompt",
              body: "Smoke public body",
              status: "PUBLISHED",
              authorUserId: authorId,
              publishedAt: now
            },
            {
              id: answerInsightId,
              slug: `${unique}-answer-slug`,
              title: "Smoke answer insight",
              prompt: "Smoke answer prompt",
              body: "Smoke answer body",
              status: "PUBLISHED",
              authorUserId: authorId,
              publishedAt: now
            },
            {
              id: normalDeniedInsightId,
              slug: `${unique}-normal-denied-slug`,
              title: "Smoke normal denied insight",
              prompt: "Smoke normal denied prompt",
              body: "Smoke normal denied body",
              status: "PUBLISHED",
              authorUserId: authorId,
              publishedAt: now
            }
          ]
        });

        await tx.insightAnswer.create({
          data: {
            id: answerId,
            authorUserId: answerAuthorId,
            insightId: answerInsightId,
            renderedQuestion: "Smoke answer question",
            answerText: "Smoke answer text",
            audienceIntents: ["moderation-smoke"],
            status: "APPROVED",
            responsibilityAccepted: true,
            submittedAt: now,
            approvedAt: now
          }
        });

        const txRunner = (async <T,>(operation: (transaction: UseravaaTransactionClient) => Promise<T>) =>
          operation(tx as UseravaaTransactionClient)) as typeof withUseravaaTransaction;

        const auditTableQueryable = await tx.adminAuditEvent.count({
          where: {
            entityId: {
              startsWith: unique
            }
          }
        });
        const hidden = await adminInsightModerationService.hideInsight(
          { id: adminId, role: "ADMIN" },
          insightId,
          { reasonCode: "smoke hide", reviewNote: "hide note" },
          { runInTransaction: txRunner, now: () => now }
        );
        const publicAfterHide = await tx.insight.count({
          where: {
            id: insightId,
            status: "PUBLISHED"
          }
        });
        const hiddenAudit = await tx.adminAuditEvent.count({
          where: {
            action: "INSIGHT_HIDDEN",
            entityType: "INSIGHT",
            entityId: insightId
          }
        });

        const restored = await adminInsightModerationService.restoreInsight(
          { id: supportId, role: "SUPPORT" },
          insightId,
          { reviewNote: "restore note" },
          { runInTransaction: txRunner, now: () => now }
        );
        const publicAfterRestore = await tx.insight.count({
          where: {
            id: insightId,
            status: "PUBLISHED",
            hiddenAt: null
          }
        });
        const restoredAudit = await tx.adminAuditEvent.count({
          where: {
            action: "INSIGHT_RESTORED",
            entityType: "INSIGHT",
            entityId: insightId
          }
        });

        const archived = await adminInsightModerationService.deleteInsight(
          { id: adminId, role: "ADMIN" },
          insightId,
          { reasonCode: "smoke archive" },
          { runInTransaction: txRunner, now: () => now }
        );
        const publicAfterArchive = await tx.insight.count({
          where: {
            id: insightId,
            status: "PUBLISHED"
          }
        });
        const archivedAudit = await tx.adminAuditEvent.count({
          where: {
            action: "INSIGHT_DELETED",
            entityType: "INSIGHT",
            entityId: insightId
          }
        });

        const hiddenAnswer = await adminInsightModerationService.hideInsightAnswer(
          { id: adminId, role: "ADMIN" },
          answerId,
          { reasonCode: "smoke answer hide" },
          { runInTransaction: txRunner, now: () => now }
        );
        const approvedPublicAnswerCount = await tx.insightAnswer.count({
          where: {
            id: answerId,
            status: "APPROVED",
            insight: {
              status: "PUBLISHED"
            }
          }
        });
        const answerRow = await tx.insightAnswer.findUniqueOrThrow({ where: { id: answerId } });
        const hiddenAnswerAudit = await tx.adminAuditEvent.count({
          where: {
            action: "INSIGHT_ANSWER_HIDDEN",
            entityType: "INSIGHT_ANSWER",
            entityId: answerId
          }
        });

        const normalUserDenied = await adminInsightModerationService.hideInsight(
          { id: requesterId, role: "USER" },
          normalDeniedInsightId,
          { reasonCode: "should be denied" },
          { runInTransaction: txRunner, now: () => now }
        );
        const normalDeniedStillPublished = await tx.insight.count({
          where: {
            id: normalDeniedInsightId,
            status: "PUBLISHED"
          }
        });
        const deniedAudit = await tx.adminAuditEvent.count({
          where: {
            entityId: normalDeniedInsightId
          }
        });

        const conversationCount = await tx.conversationRequest.count({
          where: {
            OR: [
              { requesterId: { in: actorIds } },
              { providerId: { in: actorIds } }
            ]
          }
        });
        const paymentCount = await tx.payment.count({
          where: {
            payerId: {
              in: actorIds
            }
          }
        });
        const walletTransactionCount = await tx.walletTransaction.count({
          where: {
            wallet: {
              userId: {
                in: actorIds
              }
            }
          }
        });
        const proposedTimeCount = await tx.proposedTime.count({
          where: {
            conversation: {
              OR: [
                { requesterId: { in: actorIds } },
                { providerId: { in: actorIds } }
              ]
            }
          }
        });
        const attendanceCount = await tx.attendanceVerification.count({
          where: {
            conversation: {
              OR: [
                { requesterId: { in: actorIds } },
                { providerId: { in: actorIds } }
              ]
            }
          }
        });
        const profileCount = await tx.profile.count({
          where: {
            userId: {
              in: actorIds
            }
          }
        });
        const experienceProfileCount = await tx.experienceProfile.count({
          where: {
            ownerId: {
              in: actorIds
            }
          }
        });

        throw new SmokeRollback({
          auditTableQueryable,
          hiddenOk: hidden.ok,
          restoredOk: restored.ok,
          archivedOk: archived.ok,
          hiddenAnswerOk: hiddenAnswer.ok,
          normalUserDeniedCode: normalUserDenied.ok ? "ok" : normalUserDenied.code,
          publicAfterHide,
          publicAfterRestore,
          publicAfterArchive,
          normalDeniedStillPublished,
          approvedPublicAnswerCount,
          answerStatus: answerRow.status,
          hiddenAudit,
          restoredAudit,
          archivedAudit,
          hiddenAnswerAudit,
          deniedAudit,
          conversationCount,
          paymentCount,
          walletTransactionCount,
          proposedTimeCount,
          attendanceCount,
          profileCount,
          experienceProfileCount
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
      auditTableQueryable: 0,
      hiddenOk: true,
      restoredOk: true,
      archivedOk: true,
      hiddenAnswerOk: true,
      normalUserDeniedCode: "unauthorized",
      publicAfterHide: 0,
      publicAfterRestore: 1,
      publicAfterArchive: 0,
      normalDeniedStillPublished: 1,
      approvedPublicAnswerCount: 0,
      answerStatus: "HIDDEN",
      hiddenAudit: 1,
      restoredAudit: 1,
      archivedAudit: 1,
      hiddenAnswerAudit: 1,
      deniedAudit: 0,
      conversationCount: 0,
      paymentCount: 0,
      walletTransactionCount: 0,
      proposedTimeCount: 0,
      attendanceCount: 0,
      profileCount: 0,
      experienceProfileCount: 0
    });

    await expect(prisma.user.findUnique({ where: { id: adminId } })).resolves.toBeNull();
    await expect(prisma.insight.findUnique({ where: { id: insightId } })).resolves.toBeNull();
    await prisma.$disconnect();
  }, 30_000);
});
