import fs from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { getPrismaClient } from "@/lib/backend/db/prisma";
import { withUseravaaTransaction, type UseravaaTransactionClient } from "@/lib/backend/db/transaction";
import { apiEndpointPersistenceClassification } from "@/lib/backend/endpoint-classification";
import { backendImplementationClassification } from "@/lib/backend/implementation-classification";
import { adminExperienceProfileService } from "@/lib/backend/services";
import {
  adminExperienceProfileApprovalSchema,
  adminExperienceProfileHideSchema,
  adminExperienceProfileRequestChangesSchema
} from "@/lib/backend/validation";

const projectRoot = process.cwd();
const now = new Date("2026-06-13T08:00:00.000Z");

function readProjectFile(relativePath: string) {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

function createFakeProfileReviewFlow(status = "PENDING_REVIEW") {
  const state = {
    profile: {
      id: "experience-profile-1",
      ownerId: "provider-1",
      profileId: "profile-1",
      status,
      displayName: "Provider",
      roleTitle: "Product Lead",
      orgLevel: "SENIOR_SPECIALIST",
      yearsOfExperience: 7,
      publicProfessionalSummary: "A ready professional summary.",
      freeHelp: false,
      price30Toman: 100000,
      price60Toman: 200000,
      reviewNote: null as string | null,
      updatedAt: now,
      profile: {
        id: "profile-1",
        userId: "provider-1",
        status: "ACTIVE",
        canOfferExperience: true
      },
      _count: {
        conversations: 0
      }
    },
    adminAuditCreate: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
      id: "admin-audit-1",
      ...data
    })),
    paymentUpdate: vi.fn(),
    walletTransactionCreate: vi.fn(),
    conversationUpdate: vi.fn(),
    proposedTimeCreate: vi.fn(),
    attendanceCreate: vi.fn()
  };

  const tx = {
    experienceProfile: {
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) =>
        where.id === state.profile.id ? structuredClone(state.profile) : null
      ),
      update: vi.fn(async ({ data }: { data: { status?: string; reviewNote?: string | null; updatedAt?: Date } }) => {
        state.profile = {
          ...state.profile,
          ...data
        };

        return structuredClone(state.profile);
      })
    },
    adminAuditEvent: {
      create: state.adminAuditCreate
    },
    payment: {
      update: state.paymentUpdate,
      create: vi.fn()
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
    }
  };

  const runInTransaction = (async <T,>(operation: (transaction: UseravaaTransactionClient) => Promise<T>) =>
    operation(tx as unknown as UseravaaTransactionClient)) as typeof withUseravaaTransaction;

  return { state, tx, runInTransaction };
}

describe("Checkpoint 3A-5 admin experience profile review actions", () => {
  it("keeps experience profile review API routes admin guarded, service-bound, and fixture-free", () => {
    [
      "src/app/api/admin/experience-profiles/[profileId]/approve/route.ts",
      "src/app/api/admin/experience-profiles/[profileId]/request-changes/route.ts",
      "src/app/api/admin/experience-profiles/[profileId]/hide/route.ts"
    ].forEach((relativePath) => {
      const source = readProjectFile(relativePath);

      expect(source).toContain("requireAdminViewer");
      expect(source).toContain("parseJsonBody");
      expect(source).toContain("adminExperienceProfileService");
      expect(source).toContain("serviceResultToResponse(await");
      expect(source).not.toContain("@/features/v51/data");
      expect(source).not.toContain("getConversationOrFallback");
    });
  });

  it("binds profile detail actions to approve, request-changes, and hide APIs without optimistic success", () => {
    const actionSource = readProjectFile("src/features/v51/admin/AdminExperienceProfileReviewActions.tsx");
    const surfaceSource = readProjectFile("src/features/v51/admin/AdminSurfaces.tsx");
    const routeDataSource = readProjectFile("src/features/v51/admin/server-data.ts");

    expect(actionSource).toContain("\"use client\"");
    expect(actionSource).toContain("/api/admin/experience-profiles/");
    expect(actionSource).toContain("approve");
    expect(actionSource).toContain("request-changes");
    expect(actionSource).toContain("hide");
    expect(actionSource).toContain("if (!response.ok)");
    expect(actionSource).toContain("!trimmedReason");
    expect(actionSource).toContain("setState(\"success\")");
    expect(actionSource).toContain("router.refresh()");
    expect(surfaceSource).toContain("AdminExperienceProfileReviewActions");
    expect(surfaceSource).toContain("item.auditItems");
    expect(routeDataSource).toContain("getExperienceProfileAuditLog");
  });

  it("uses strict schemas that reject actor, owner, status, visibility, pricing, and financial overrides", () => {
    expect(adminExperienceProfileApprovalSchema.safeParse({ reviewNote: "ready" }).success).toBe(true);
    expect(adminExperienceProfileApprovalSchema.safeParse({ actorAdminUserId: "admin-override" }).success).toBe(false);
    expect(adminExperienceProfileRequestChangesSchema.safeParse({ reviewReason: "missing proof" }).success).toBe(true);
    expect(adminExperienceProfileRequestChangesSchema.safeParse({ reviewNote: "no reason" }).success).toBe(false);
    expect(adminExperienceProfileHideSchema.safeParse({ reviewReason: "public risk" }).success).toBe(true);

    for (const payload of [
      { reviewReason: "x", ownerId: "owner-override" },
      { reviewReason: "x", status: "ACTIVE" },
      { reviewReason: "x", discoverVisible: true },
      { reviewReason: "x", price30Toman: 1 },
      { reviewReason: "x", paymentId: "payment-override" },
      { reviewReason: "x", walletId: "wallet-override" },
      { reviewReason: "x", sessionId: "session-override" }
    ]) {
      expect(adminExperienceProfileHideSchema.safeParse(payload).success).toBe(false);
    }
  });

  it("approves, requests changes, and hides through the service while writing audit events only", async () => {
    const approval = createFakeProfileReviewFlow("PENDING_REVIEW");
    const approved = await adminExperienceProfileService.approve(
      { id: "admin-1", role: "ADMIN" },
      "experience-profile-1",
      { reviewNote: "ready for discover" },
      { runInTransaction: approval.runInTransaction, now: () => now }
    );

    expect(approved).toMatchObject({ ok: true });
    expect(approval.state.profile.status).toBe("ACTIVE");
    expect(approval.state.adminAuditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "EXPERIENCE_PROFILE_APPROVED",
          entityType: "EXPERIENCE_PROFILE",
          entityId: "experience-profile-1",
          actorAdminUserId: "admin-1",
          note: "ready for discover"
        })
      })
    );

    const changes = createFakeProfileReviewFlow("ACTIVE");
    const requestedChanges = await adminExperienceProfileService.requestChanges(
      { id: "support-1", role: "SUPPORT" },
      "experience-profile-1",
      { reviewReason: "summary needs evidence", reviewNote: "ask for clearer claim" },
      { runInTransaction: changes.runInTransaction, now: () => now }
    );

    expect(requestedChanges).toMatchObject({ ok: true });
    expect(changes.state.profile.status).toBe("NEEDS_CHANGES");
    expect(changes.state.adminAuditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "EXPERIENCE_PROFILE_CHANGES_REQUESTED",
          reason: "summary needs evidence",
          note: "ask for clearer claim"
        })
      })
    );

    const hide = createFakeProfileReviewFlow("ACTIVE");
    const hidden = await adminExperienceProfileService.hide(
      { id: "admin-1", role: "ADMIN" },
      "experience-profile-1",
      { reviewReason: "public visibility concern" },
      { runInTransaction: hide.runInTransaction, now: () => now }
    );

    expect(hidden).toMatchObject({ ok: true });
    expect(hide.state.profile.status).toBe("INACTIVE");
    expect(hide.state.adminAuditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "EXPERIENCE_PROFILE_HIDDEN",
          reason: "public visibility concern"
        })
      })
    );

    for (const flow of [approval, changes, hide]) {
      expect(flow.state.paymentUpdate).not.toHaveBeenCalled();
      expect(flow.state.walletTransactionCreate).not.toHaveBeenCalled();
      expect(flow.state.conversationUpdate).not.toHaveBeenCalled();
      expect(flow.state.proposedTimeCreate).not.toHaveBeenCalled();
      expect(flow.state.attendanceCreate).not.toHaveBeenCalled();
    }
  });

  it("blocks non-admin viewers, owner self-review, unsafe approval states, and discover bypass", async () => {
    const nonAdmin = createFakeProfileReviewFlow("PENDING_REVIEW");
    const nonAdminResult = await adminExperienceProfileService.approve(
      { id: "user-1", role: "USER" },
      "experience-profile-1",
      {},
      { runInTransaction: nonAdmin.runInTransaction, now: () => now }
    );

    expect(nonAdminResult).toMatchObject({ ok: false, code: "unauthorized" });
    expect(nonAdmin.tx.experienceProfile.update).not.toHaveBeenCalled();

    const ownerAdmin = createFakeProfileReviewFlow("PENDING_REVIEW");
    const ownerResult = await adminExperienceProfileService.approve(
      { id: "provider-1", role: "ADMIN" },
      "experience-profile-1",
      {},
      { runInTransaction: ownerAdmin.runInTransaction, now: () => now }
    );

    expect(ownerResult).toMatchObject({ ok: false, code: "unauthorized" });
    expect(ownerAdmin.tx.experienceProfile.update).not.toHaveBeenCalled();

    const inactive = createFakeProfileReviewFlow("INACTIVE");
    const inactiveResult = await adminExperienceProfileService.approve(
      { id: "admin-1", role: "ADMIN" },
      "experience-profile-1",
      {},
      { runInTransaction: inactive.runInTransaction, now: () => now }
    );

    expect(inactiveResult).toMatchObject({ ok: false, code: "invalid_state" });
    expect(inactive.tx.experienceProfile.update).not.toHaveBeenCalled();

    const repositorySource = readProjectFile("src/lib/backend/repositories/experience-profile.ts");
    expect(repositorySource).toContain("where: { status: \"ACTIVE\" }");
    expect(repositorySource).toContain("status: \"ACTIVE\"");
  });

  it("classifies profile review and audit as transaction-ready without expanding deferred domains", () => {
    expect(apiEndpointPersistenceClassification["POST /api/admin/experience-profiles/[profileId]/approve"]).toMatchObject({
      classification: "transaction_ready",
      requiresAdmin: true,
      usesRepository: true,
      writesImplemented: true
    });
    expect(apiEndpointPersistenceClassification["POST /api/admin/experience-profiles/[profileId]/request-changes"]).toMatchObject({
      classification: "transaction_ready",
      requiresAdmin: true,
      usesRepository: true,
      writesImplemented: true
    });
    expect(apiEndpointPersistenceClassification["POST /api/admin/experience-profiles/[profileId]/hide"]).toMatchObject({
      classification: "transaction_ready",
      requiresAdmin: true,
      usesRepository: true,
      writesImplemented: true
    });
    expect(backendImplementationClassification.adminExperienceProfileReview).toMatchObject({
      classification: "transaction_ready",
      writesImplemented: true
    });
    expect(backendImplementationClassification.withdrawal.writesImplemented).toBe(false);
  });

  it("runs rollback-backed DB smoke coverage for experience profile review when enabled", async () => {
    if (process.env.USERAVAA_DB_SMOKE_TEST !== "1") {
      expect(process.env.USERAVAA_DB_SMOKE_TEST).not.toBe("1");
      return;
    }

    class SmokeRollback extends Error {
      constructor(readonly summary: Record<string, unknown>) {
        super("EXPERIENCE_PROFILE_REVIEW_SMOKE_ROLLBACK");
      }
    }

    const prisma = getPrismaClient();
    const unique = `profile-review-smoke-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const adminId = `${unique}-admin`;
    const requesterId = `${unique}-requester`;
    const approveOwnerId = `${unique}-approve-owner`;
    const changesOwnerId = `${unique}-changes-owner`;
    const hideOwnerId = `${unique}-hide-owner`;
    const approveBaseProfileId = `${unique}-approve-base-profile`;
    const changesBaseProfileId = `${unique}-changes-base-profile`;
    const hideBaseProfileId = `${unique}-hide-base-profile`;
    const approveProfileId = `${unique}-approve-profile`;
    const changesProfileId = `${unique}-changes-profile`;
    const hideProfileId = `${unique}-hide-profile`;
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
              id: requesterId,
              role: "USER",
              email: `${requesterId}@smoke.useravaa.test`,
              displayName: "Smoke User"
            },
            {
              id: approveOwnerId,
              email: `${approveOwnerId}@smoke.useravaa.test`,
              displayName: "Smoke Approve Owner"
            },
            {
              id: changesOwnerId,
              email: `${changesOwnerId}@smoke.useravaa.test`,
              displayName: "Smoke Changes Owner"
            },
            {
              id: hideOwnerId,
              email: `${hideOwnerId}@smoke.useravaa.test`,
              displayName: "Smoke Hide Owner"
            }
          ]
        });

        await tx.profile.createMany({
          data: [
            {
              id: approveBaseProfileId,
              userId: approveOwnerId,
              status: "ACTIVE",
              displayName: "Smoke Approve Owner",
              userMotivations: [],
              canOfferExperience: true
            },
            {
              id: changesBaseProfileId,
              userId: changesOwnerId,
              status: "ACTIVE",
              displayName: "Smoke Changes Owner",
              userMotivations: [],
              canOfferExperience: true
            },
            {
              id: hideBaseProfileId,
              userId: hideOwnerId,
              status: "ACTIVE",
              displayName: "Smoke Hide Owner",
              userMotivations: [],
              canOfferExperience: true
            }
          ]
        });

        await tx.experienceProfile.createMany({
          data: [
            {
              id: approveProfileId,
              ownerId: approveOwnerId,
              profileId: approveBaseProfileId,
              status: "PENDING_REVIEW",
              displayName: "Smoke Approve Owner",
              roleTitle: "Product Lead",
              orgLevel: "SENIOR_SPECIALIST",
              yearsOfExperience: 7,
              publicProfessionalSummary: "Smoke profile ready for approval.",
              freeHelp: false,
              price30Toman: 100000,
              price60Toman: 200000
            },
            {
              id: changesProfileId,
              ownerId: changesOwnerId,
              profileId: changesBaseProfileId,
              status: "PENDING_REVIEW",
              displayName: "Smoke Changes Owner",
              roleTitle: "Design Lead",
              orgLevel: "SENIOR_SPECIALIST",
              yearsOfExperience: 8,
              publicProfessionalSummary: "Smoke profile ready for changes.",
              freeHelp: false,
              price30Toman: 120000,
              price60Toman: 220000
            },
            {
              id: hideProfileId,
              ownerId: hideOwnerId,
              profileId: hideBaseProfileId,
              status: "ACTIVE",
              displayName: "Smoke Hide Owner",
              roleTitle: "Engineering Lead",
              orgLevel: "SENIOR_SPECIALIST",
              yearsOfExperience: 9,
              publicProfessionalSummary: "Smoke profile ready for hide.",
              freeHelp: false,
              price30Toman: 130000,
              price60Toman: 230000
            }
          ]
        });

        const txRunner = (async <T,>(operation: (transaction: UseravaaTransactionClient) => Promise<T>) =>
          operation(tx as UseravaaTransactionClient)) as typeof withUseravaaTransaction;

        const approved = await adminExperienceProfileService.approve(
          { id: adminId, role: "ADMIN" },
          approveProfileId,
          { reviewNote: "approved in smoke" },
          { runInTransaction: txRunner, now: () => now }
        );
        const changes = await adminExperienceProfileService.requestChanges(
          { id: adminId, role: "ADMIN" },
          changesProfileId,
          { reviewReason: "needs clearer evidence", reviewNote: "changes in smoke" },
          { runInTransaction: txRunner, now: () => now }
        );
        const hidden = await adminExperienceProfileService.hide(
          { id: adminId, role: "ADMIN" },
          hideProfileId,
          { reviewReason: "hide in smoke" },
          { runInTransaction: txRunner, now: () => now }
        );
        const normalUserDenied = await adminExperienceProfileService.approve(
          { id: requesterId, role: "USER" },
          changesProfileId,
          {},
          { runInTransaction: txRunner, now: () => now }
        );

        const [approvedProfile, changesProfile, hiddenProfile] = await Promise.all([
          tx.experienceProfile.findUniqueOrThrow({ where: { id: approveProfileId } }),
          tx.experienceProfile.findUniqueOrThrow({ where: { id: changesProfileId } }),
          tx.experienceProfile.findUniqueOrThrow({ where: { id: hideProfileId } })
        ]);
        const approvedAudit = await tx.adminAuditEvent.count({
          where: {
            action: "EXPERIENCE_PROFILE_APPROVED",
            entityType: "EXPERIENCE_PROFILE",
            entityId: approveProfileId
          }
        });
        const changesAudit = await tx.adminAuditEvent.count({
          where: {
            action: "EXPERIENCE_PROFILE_CHANGES_REQUESTED",
            entityType: "EXPERIENCE_PROFILE",
            entityId: changesProfileId
          }
        });
        const hiddenAudit = await tx.adminAuditEvent.count({
          where: {
            action: "EXPERIENCE_PROFILE_HIDDEN",
            entityType: "EXPERIENCE_PROFILE",
            entityId: hideProfileId
          }
        });
        const hiddenDiscoverVisible = await tx.experienceProfile.count({
          where: {
            id: hideProfileId,
            status: "ACTIVE"
          }
        });
        const conversationCount = await tx.conversationRequest.count({
          where: {
            OR: [
              { requesterId: { in: [requesterId, approveOwnerId, changesOwnerId, hideOwnerId] } },
              { providerId: { in: [requesterId, approveOwnerId, changesOwnerId, hideOwnerId] } }
            ]
          }
        });
        const paymentCount = await tx.payment.count({
          where: {
            payerId: {
              in: [requesterId, approveOwnerId, changesOwnerId, hideOwnerId]
            }
          }
        });
        const walletTransactionCount = await tx.walletTransaction.count({
          where: {
            wallet: {
              userId: {
                in: [requesterId, approveOwnerId, changesOwnerId, hideOwnerId]
              }
            }
          }
        });
        const proposedTimeCount = await tx.proposedTime.count({
          where: {
            conversation: {
              OR: [
                { requesterId: { in: [requesterId, approveOwnerId, changesOwnerId, hideOwnerId] } },
                { providerId: { in: [requesterId, approveOwnerId, changesOwnerId, hideOwnerId] } }
              ]
            }
          }
        });
        const attendanceCount = await tx.attendanceVerification.count({
          where: {
            conversation: {
              OR: [
                { requesterId: { in: [requesterId, approveOwnerId, changesOwnerId, hideOwnerId] } },
                { providerId: { in: [requesterId, approveOwnerId, changesOwnerId, hideOwnerId] } }
              ]
            }
          }
        });

        throw new SmokeRollback({
          approvedOk: approved.ok,
          changesOk: changes.ok,
          hiddenOk: hidden.ok,
          normalUserDeniedCode: normalUserDenied.ok ? "ok" : normalUserDenied.code,
          approvedStatus: approvedProfile.status,
          changesStatus: changesProfile.status,
          changesReviewNote: changesProfile.reviewNote,
          hiddenStatus: hiddenProfile.status,
          hiddenDiscoverVisible,
          approvedAudit,
          changesAudit,
          hiddenAudit,
          conversationCount,
          paymentCount,
          walletTransactionCount,
          proposedTimeCount,
          attendanceCount
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
      approvedOk: true,
      changesOk: true,
      hiddenOk: true,
      normalUserDeniedCode: "unauthorized",
      approvedStatus: "ACTIVE",
      changesStatus: "NEEDS_CHANGES",
      changesReviewNote: "changes in smoke",
      hiddenStatus: "INACTIVE",
      hiddenDiscoverVisible: 0,
      approvedAudit: 1,
      changesAudit: 1,
      hiddenAudit: 1,
      conversationCount: 0,
      paymentCount: 0,
      walletTransactionCount: 0
    });
    expect(summary?.proposedTimeCount).toBe(0);
    expect(summary?.attendanceCount).toBe(0);

    await expect(prisma.user.findUnique({ where: { id: adminId } })).resolves.toBeNull();
    await expect(prisma.user.findUnique({ where: { id: approveOwnerId } })).resolves.toBeNull();
    await prisma.$disconnect();
  }, 30_000);
});
