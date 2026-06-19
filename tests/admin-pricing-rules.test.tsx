import fs from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AdminPricingRuleDetail, AdminPricingRules } from "@/features/v51/admin/AdminSurfaces";
import { adminPricingService } from "@/lib/backend/services";
import { getPrismaClient } from "@/lib/backend/db/prisma";
import type { UseravaaTransactionClient } from "@/lib/backend/db/transaction";
import {
  adminPricingRuleCreateSchema,
  adminPricingRuleDeactivateSchema,
  adminPricingRuleUpdateSchema
} from "@/lib/backend/validation";
import { useravaaRepository } from "@/lib/backend/repository";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn()
  })
}));

const projectRoot = process.cwd();
const now = new Date("2026-06-14T09:00:00.000Z");

function readProjectFile(relativePath: string) {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

function projectFileExists(relativePath: string) {
  return fs.existsSync(path.join(projectRoot, relativePath));
}

function sourceSegment(source: string, startMarker: string) {
  const startIndex = source.indexOf(startMarker);

  expect(startIndex).toBeGreaterThanOrEqual(0);

  return source.slice(startIndex);
}

function validCreatePayload(overrides: Record<string, unknown> = {}) {
  return {
    title: "قانون قیمت‌گذاری تجربه نرم‌افزار",
    jobFieldCode: "SOFTWARE_ENGINEERING",
    experienceLevel: "SENIOR_SPECIALIST",
    sessionDurationMinutes: 60,
    minPriceToman: 300000,
    suggestedPriceToman: 500000,
    maxPriceToman: 700000,
    commissionRateBps: 1500,
    freeSessionCommissionRateBps: 0,
    allowFreeSession: true,
    effectiveFrom: now.toISOString(),
    internalNote: "MVP pricing smoke",
    ...overrides
  };
}

function createFakePricingTransaction() {
  type FakeRecord = Record<string, unknown> & { id: string };
  const rules: FakeRecord[] = [];
  const audits: FakeRecord[] = [];
  let counter = 0;
  const selectActor = { id: "admin-1", displayName: "Admin", role: "ADMIN" };
  const tx = {
    pricingRule: {
      async create({ data }: { data: Record<string, unknown> }) {
        counter += 1;
        const row = {
          id: `pricing-rule-${counter}`,
          ...data,
          isActive: data.isActive ?? true,
          archivedAt: data.archivedAt ?? null,
          effectiveTo: data.effectiveTo ?? null,
          internalNote: data.internalNote ?? null,
          createdAt: now,
          updatedAt: now,
          createdByAdmin: selectActor,
          updatedByAdmin: selectActor
        };
        rules.push(row);
        return row;
      },
      async findUnique({ where }: { where: { id: string } }) {
        return rules.find((rule) => rule.id === where.id) ?? null;
      },
      async update({ where, data }: { where: { id: string }; data: Record<string, unknown> }) {
        const index = rules.findIndex((rule) => rule.id === where.id);

        if (index < 0) {
          throw new Error("Pricing rule not found in fake transaction.");
        }

        rules[index] = {
          ...rules[index],
          ...data,
          updatedAt: now,
          updatedByAdmin: selectActor
        };
        return rules[index];
      }
    },
    adminAuditEvent: {
      async create({ data }: { data: Record<string, unknown> }) {
        const row = {
          id: `audit-${audits.length + 1}`,
          ...data,
          actorAdminUser: selectActor,
          createdAt: data.createdAt ?? now
        };
        audits.push(row);
        return row;
      }
    }
  } as unknown as UseravaaTransactionClient;

  return {
    tx,
    rules,
    audits,
    runInTransaction: async <T,>(operation: (transaction: UseravaaTransactionClient) => Promise<T>) => operation(tx)
  };
}

describe("Checkpoint 3A-8 admin pricing rules", () => {
  it("adds a non-destructive PricingRule schema and migration", () => {
    const schema = readProjectFile("prisma/schema.prisma");
    const migration = readProjectFile("prisma/migrations/20260614120000_pricing_rules_admin/migration.sql");

    expect(schema).toContain("model PricingRule");
    expect(schema).toContain("commissionRateBps");
    expect(schema).toContain("freeSessionCommissionRateBps");
    expect(migration).toContain("CREATE TABLE \"PricingRule\"");
    expect(migration).not.toMatch(/DROP TABLE|TRUNCATE|DELETE FROM|ALTER TABLE \"Payment\"|ALTER TABLE \"ConversationRequest\"/i);
  });

  it("keeps /admin/pricing guarded, server-backed, and route-classified", () => {
    const listPage = readProjectFile("src/app/admin/pricing/page.tsx");
    const detailPage = readProjectFile("src/app/admin/pricing/[ruleId]/page.tsx");
    const createRoute = readProjectFile("src/app/api/admin/pricing/route.ts");
    const updateRoute = readProjectFile("src/app/api/admin/pricing/[ruleId]/route.ts");
    const deactivateRoute = readProjectFile("src/app/api/admin/pricing/[ruleId]/deactivate/route.ts");
    const endpointClassification = readProjectFile("src/lib/backend/endpoint-classification.ts");

    expect(listPage).toContain("requireAdminPageAccess");
    expect(listPage).toContain("getAdminPricingRouteData");
    expect(detailPage).toContain("getAdminPricingDetailRouteData");
    expect(createRoute).toContain("requireAdminViewer");
    expect(createRoute).toContain("adminPricingRuleCreateSchema");
    expect(updateRoute).toContain("adminPricingRuleUpdateSchema");
    expect(deactivateRoute).toContain("adminPricingRuleDeactivateSchema");
    expect(endpointClassification).toContain("POST /api/admin/pricing");
    expect(endpointClassification).toContain("PATCH /api/admin/pricing/[ruleId]");
    expect(endpointClassification).toContain("POST /api/admin/pricing/[ruleId]/deactivate");
    expect(projectFileExists("src/app/api/admin/pricing/[ruleId]/reactivate/route.ts")).toBe(false);
  });

  it("validates pricing payloads strictly and rejects unsafe fields", () => {
    expect(adminPricingRuleCreateSchema.safeParse(validCreatePayload()).success).toBe(true);
    expect(adminPricingRuleCreateSchema.safeParse(validCreatePayload({ maxPriceToman: 200000 })).success).toBe(false);
    expect(adminPricingRuleCreateSchema.safeParse(validCreatePayload({ suggestedPriceToman: 800000 })).success).toBe(false);
    expect(adminPricingRuleCreateSchema.safeParse(validCreatePayload({ commissionRateBps: 10001 })).success).toBe(false);
    expect(adminPricingRuleCreateSchema.safeParse(validCreatePayload({ freeSessionCommissionRateBps: 500 })).success).toBe(false);
    expect(adminPricingRuleCreateSchema.safeParse(validCreatePayload({ sessionDurationMinutes: 45 })).success).toBe(false);
    expect(adminPricingRuleCreateSchema.safeParse(validCreatePayload({ actorAdminUserId: "spoofed" })).success).toBe(false);
    expect(adminPricingRuleCreateSchema.safeParse(validCreatePayload({ paymentId: "pay-1" })).success).toBe(false);
    expect(adminPricingRuleCreateSchema.safeParse(validCreatePayload({ walletBalanceToman: 1 })).success).toBe(false);
    expect(adminPricingRuleCreateSchema.safeParse(validCreatePayload({ conversationId: "conv-1" })).success).toBe(false);
    expect(adminPricingRuleCreateSchema.safeParse(validCreatePayload({ settlementStatus: "COMPLETED" })).success).toBe(false);
    expect(adminPricingRuleUpdateSchema.safeParse({ minPriceToman: 100000 }).success).toBe(true);
    expect(adminPricingRuleUpdateSchema.safeParse({}).success).toBe(false);
    expect(adminPricingRuleDeactivateSchema.safeParse({ reason: "old rule" }).success).toBe(true);
    expect(adminPricingRuleDeactivateSchema.safeParse({ reason: "old rule", payoutId: "bad" }).success).toBe(false);
  });

  it("renders empty, repository-backed, and detail pricing UI without fake rows", () => {
    const emptyHtml = renderToStaticMarkup(
      <AdminPricingRules
        data={{
          items: [],
          categoryOptions: [{ label: "مهندسی نرم‌افزار", value: "SOFTWARE_ENGINEERING" }],
          source: "backend_repository",
          sourceNote: "repository-backed",
          viewerCanMutate: true
        }}
      />
    );

    expect(emptyHtml).toContain("هنوز قانون قیمت‌گذاری ثبت نشده است");
    expect(emptyHtml).toContain("ثبت قانون قیمت‌گذاری");
    expect(emptyHtml).not.toContain("fake");

    const item = {
      id: "pricing-rule-1",
      title: "قانون قیمت‌گذاری نرم‌افزار",
      jobCategoryLabel: "مهندسی نرم‌افزار",
      jobFieldCode: "SOFTWARE_ENGINEERING",
      experienceLevelLabel: "متخصص ارشد",
      experienceLevelCode: "SENIOR_SPECIALIST",
      durationLabel: "جلسه ۶۰ دقیقه‌ای",
      durationValue: "60",
      minPriceLabel: "۳۰۰٬۰۰۰ تومان",
      minPriceToman: 300000,
      suggestedPriceLabel: "۵۰۰٬۰۰۰ تومان",
      suggestedPriceToman: 500000,
      maxPriceLabel: "۷۰۰٬۰۰۰ تومان",
      maxPriceToman: 700000,
      commissionLabel: "۱۵%",
      commissionRateBps: 1500,
      freeSessionCommissionLabel: "۰%",
      freeSessionCommissionRateBps: 0,
      freeSessionLabel: "جلسه کمک‌محور / رایگان مجاز است",
      allowFreeSession: true,
      stateLabel: "فعال",
      isActive: true,
      isArchived: false,
      effectiveWindowLabel: "امروز تا بدون پایان",
      effectiveFromValue: "2026-06-14",
      effectiveToValue: "",
      internalNote: "",
      createdBySummary: "Admin",
      updatedBySummary: "Admin",
      updatedAt: "امروز",
      href: "/admin/pricing/pricing-rule-1",
      source: "backend_repository" as const,
      actionsAvailable: true,
      auditItems: [
        {
          id: "audit-1",
          actorSummary: "Admin · ADMIN",
          actionLabel: "ثبت قانون قیمت‌گذاری",
          entitySummary: "PRICING_RULE · pricing-rule-1",
          statusChange: "ثبت نشده → ACTIVE",
          reason: "ثبت نشده",
          note: "ثبت نشده",
          createdAt: "امروز",
          pricingHref: "/admin/pricing/pricing-rule-1",
          source: "backend_repository" as const
        }
      ]
    };
    const detailHtml = renderToStaticMarkup(
      <AdminPricingRuleDetail
        data={{
          item,
          categoryOptions: [{ label: "مهندسی نرم‌افزار", value: "SOFTWARE_ENGINEERING" }],
          source: "backend_repository",
          sourceNote: "repository-backed",
          viewerCanMutate: true
        }}
      />
    );

    expect(detailHtml).toContain("قانون قیمت‌گذاری نرم‌افزار");
    expect(detailHtml).toContain("کمیسیون پلتفرم");
    expect(detailHtml).toContain("غیرفعال‌سازی / آرشیو");
    expect(detailHtml).toContain("ثبت قانون قیمت‌گذاری");
  });

  it("creates, updates, deactivates, and audits pricing through the service only for ADMIN", async () => {
    const fake = createFakePricingTransaction();
    const admin = { id: "admin-1", role: "ADMIN" };
    const support = { id: "support-1", role: "SUPPORT" };
    const user = { id: "user-1", role: "USER" };
    const createResult = await adminPricingService.create(admin, validCreatePayload(), {
      now: () => now,
      runInTransaction: fake.runInTransaction
    });

    expect(createResult.ok).toBe(true);
    expect(fake.rules).toHaveLength(1);
    expect(fake.audits[0]).toMatchObject({
      actorAdminUserId: "admin-1",
      action: "PRICING_RULE_CREATED",
      entityType: "PRICING_RULE"
    });

    if (!createResult.ok) {
      throw new Error("create failed");
    }

    const updateResult = await adminPricingService.update(
      admin,
      createResult.data.id,
      {
        suggestedPriceToman: 550000,
        internalNote: "adjust suggested price"
      },
      {
        now: () => now,
        runInTransaction: fake.runInTransaction
      }
    );

    expect(updateResult).toMatchObject({ ok: true });
    expect(fake.rules[0].suggestedPriceToman).toBe(550000);
    expect(fake.audits[1]).toMatchObject({
      action: "PRICING_RULE_UPDATED",
      entityType: "PRICING_RULE"
    });

    const deactivateResult = await adminPricingService.deactivate(
      admin,
      createResult.data.id,
      {
        reason: "rule replaced",
        internalNote: "archive old rule"
      },
      {
        now: () => now,
        runInTransaction: fake.runInTransaction
      }
    );

    expect(deactivateResult).toMatchObject({ ok: true });
    expect(fake.rules[0]).toMatchObject({
      isActive: false,
      archivedAt: now
    });
    expect(fake.audits[2]).toMatchObject({
      action: "PRICING_RULE_DEACTIVATED",
      reason: "rule replaced"
    });
    await expect(adminPricingService.create(support, validCreatePayload(), { runInTransaction: fake.runInTransaction })).resolves.toMatchObject({
      ok: false,
      code: "unauthorized"
    });
    await expect(adminPricingService.create(user, validCreatePayload(), { runInTransaction: fake.runInTransaction })).resolves.toMatchObject({
      ok: false,
      code: "unauthorized"
    });
  });

  it("keeps pricing implementation scoped away from historical transaction mutation and fixtures", () => {
    const combined = [
      readProjectFile("src/lib/backend/repositories/pricing-rule.ts"),
      sourceSegment(readProjectFile("src/lib/backend/services.ts"), "type PricingRuleServiceOptions"),
      readProjectFile("src/features/v51/admin/server-data.ts"),
      readProjectFile("src/features/v51/admin/AdminSurfaces.tsx"),
      readProjectFile("src/features/v51/admin/AdminPricingRuleActions.tsx")
    ].join("\n");

    expect(combined).toContain("PRICING_RULE_CREATED");
    expect(combined).toContain("PRICING_RULE_UPDATED");
    expect(combined).toContain("PRICING_RULE_DEACTIVATED");
    expect(combined).not.toContain("getConversationOrFallback");
    expect(combined).not.toContain("receiptUrl");
    expect(combined).not.toContain("requesterCodeCiphertext");
    expect(combined).not.toMatch(/\.(payment|walletTransaction|conversationRequest|cancellation|attendanceVerification)\.(create|update|upsert|delete|deleteMany)\(/);
  });

  it("runs rollback-backed DB smoke coverage for pricing rules when enabled", async () => {
    if (process.env.USERAVAA_DB_SMOKE_TEST !== "1") {
      expect(process.env.USERAVAA_DB_SMOKE_TEST).not.toBe("1");
      return;
    }

    class SmokeRollback extends Error {
      constructor(readonly summary: Record<string, unknown>) {
        super("ADMIN_PRICING_RULE_SMOKE_ROLLBACK");
      }
    }

    const prisma = getPrismaClient();
    const unique = `pricing-smoke-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const adminId = `${unique}-admin`;
    const supportId = `${unique}-support`;
    const userId = `${unique}-user`;
    let summary: Record<string, unknown> | null = null;

    try {
      await prisma.$transaction(async (tx) => {
        await tx.user.createMany({
          data: [
            { id: adminId, role: "ADMIN", email: `${adminId}@smoke.useravaa.test`, displayName: "Pricing Smoke Admin", createdAt: now },
            { id: supportId, role: "SUPPORT", email: `${supportId}@smoke.useravaa.test`, displayName: "Pricing Smoke Support", createdAt: now },
            { id: userId, role: "USER", email: `${userId}@smoke.useravaa.test`, displayName: "Pricing Smoke User", createdAt: now }
          ]
        });
        const beforeCounts = {
          payments: await tx.payment.count(),
          walletTransactions: await tx.walletTransaction.count(),
          conversations: await tx.conversationRequest.count(),
          cancellations: await tx.cancellation.count(),
          attendance: await tx.attendanceVerification.count()
        };
        const runInTransaction = async <T,>(operation: (transaction: UseravaaTransactionClient) => Promise<T>) =>
          operation(tx as unknown as UseravaaTransactionClient);
        const admin = { id: adminId, role: "ADMIN" };
        const created = await adminPricingService.create(admin, validCreatePayload({ title: `${unique} create` }), {
          now: () => now,
          runInTransaction
        });

        if (!created.ok) {
          throw new Error("Pricing smoke create failed.");
        }

        const listed = await useravaaRepository.pricingRules.listPricingRules(tx as never);
        const updated = await adminPricingService.update(
          admin,
          created.data.id,
          {
            suggestedPriceToman: 520000,
            internalNote: "smoke update"
          },
          {
            now: () => now,
            runInTransaction
          }
        );
        const invalidRange = await adminPricingService.create(admin, validCreatePayload({ maxPriceToman: 100000 }), {
          now: () => now,
          runInTransaction
        });
        const invalidCommission = await adminPricingService.create(admin, validCreatePayload({ commissionRateBps: 10001 }), {
          now: () => now,
          runInTransaction
        });
        const supportCreate = await adminPricingService.create(
          { id: supportId, role: "SUPPORT" },
          validCreatePayload({ title: `${unique} support` }),
          {
            now: () => now,
            runInTransaction
          }
        );
        const userCreate = await adminPricingService.create(
          { id: userId, role: "USER" },
          validCreatePayload({ title: `${unique} user` }),
          {
            now: () => now,
            runInTransaction
          }
        );
        const deactivated = await adminPricingService.deactivate(
          admin,
          created.data.id,
          {
            reason: "smoke archive",
            internalNote: "smoke deactivate"
          },
          {
            now: () => now,
            runInTransaction
          }
        );
        const afterCounts = {
          payments: await tx.payment.count(),
          walletTransactions: await tx.walletTransaction.count(),
          conversations: await tx.conversationRequest.count(),
          cancellations: await tx.cancellation.count(),
          attendance: await tx.attendanceVerification.count()
        };
        const auditActions = await tx.adminAuditEvent.findMany({
          where: {
            entityType: "PRICING_RULE",
            entityId: created.data.id
          },
          select: { action: true },
          orderBy: { createdAt: "asc" }
        });

        throw new SmokeRollback({
          listed: listed.ok && listed.data.rules.some((rule) => rule.id === created.data.id),
          updated: updated.ok && updated.data.suggestedPriceToman === 520000,
          deactivated: deactivated.ok && !deactivated.data.isActive && Boolean(deactivated.data.archivedAt),
          invalidRangeRejected: !invalidRange.ok && invalidRange.code === "validation_error",
          invalidCommissionRejected: !invalidCommission.ok && invalidCommission.code === "validation_error",
          supportReadOnly: !supportCreate.ok && supportCreate.code === "unauthorized",
          normalUserDenied: !userCreate.ok && userCreate.code === "unauthorized",
          auditActions: auditActions.map((row) => row.action),
          operationalCountsUnchanged: JSON.stringify(beforeCounts) === JSON.stringify(afterCounts)
        });
      });
    } catch (error) {
      if (error instanceof SmokeRollback) {
        summary = error.summary;
      } else {
        throw error;
      }
    }

    expect(summary).toMatchObject({
      listed: true,
      updated: true,
      deactivated: true,
      invalidRangeRejected: true,
      invalidCommissionRejected: true,
      supportReadOnly: true,
      normalUserDenied: true,
      operationalCountsUnchanged: true
    });
    expect(summary?.auditActions).toEqual([
      "PRICING_RULE_CREATED",
      "PRICING_RULE_UPDATED",
      "PRICING_RULE_DEACTIVATED"
    ]);
    await expect(prisma.user.findUnique({ where: { id: adminId } })).resolves.toBeNull();
    await prisma.$disconnect();
  }, 35_000);
});
