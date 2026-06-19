import fs from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AdminCategories, AdminCategoryDetail } from "@/features/v51/admin/AdminSurfaces";
import { adminCategoryService } from "@/lib/backend/services";
import { getPrismaClient } from "@/lib/backend/db/prisma";
import type { UseravaaTransactionClient } from "@/lib/backend/db/transaction";
import {
  adminCategoryArchiveSchema,
  adminCategoryCreateSchema,
  adminCategoryRestoreSchema,
  adminCategoryUpdateSchema
} from "@/lib/backend/validation";
import { useravaaRepository } from "@/lib/backend/repository";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn()
  })
}));

const projectRoot = process.cwd();
const now = new Date("2026-06-15T09:00:00.000Z");

function readProjectFile(relativePath: string) {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

function projectFileExists(relativePath: string) {
  return fs.existsSync(path.join(projectRoot, relativePath));
}

function validCategoryPayload(overrides: Record<string, unknown> = {}) {
  return {
    slug: "software-engineering",
    titleFa: "مهندسی نرم‌افزار",
    titleEn: "Software Engineering",
    descriptionFa: "مسیرهای تجربه در مهندسی نرم‌افزار",
    sortOrder: 10,
    isActive: true,
    showInDiscovery: true,
    showInInsights: true,
    showInPricing: true,
    jobFieldCode: "SOFTWARE_ENGINEERING",
    ...overrides
  };
}

function createFakeCategoryTransaction() {
  type FakeCategory = Record<string, unknown> & {
    id: string;
    slug: string;
    labelFa: string;
    parentId: string | null;
    isActive: boolean;
    showInDiscovery: boolean;
    showInInsights: boolean;
    showInPricing: boolean;
    archivedAt: Date | null;
    code: string | null;
  };

  const actor = { id: "admin-1", displayName: "Admin", role: "ADMIN" };
  const categories: FakeCategory[] = [];
  const audits: Record<string, unknown>[] = [];
  let counter = 0;

  function hydrate(category: FakeCategory) {
    return {
      ...category,
      titleEn: category.titleEn ?? null,
      descriptionFa: category.descriptionFa ?? null,
      sortOrder: category.sortOrder ?? 0,
      createdByAdminId: category.createdByAdminId ?? "admin-1",
      updatedByAdminId: category.updatedByAdminId ?? "admin-1",
      createdAt: category.createdAt ?? now,
      updatedAt: now,
      parent: category.parentId ? categories.find((item) => item.id === category.parentId) ?? null : null,
      children: categories.filter((item) => item.parentId === category.id),
      createdByAdmin: actor,
      updatedByAdmin: actor,
      _count: {
        profiles: 0,
        children: categories.filter((item) => item.parentId === category.id).length
      }
    };
  }

  const tx = {
    jobCategory: {
      async create({ data }: { data: Record<string, unknown> }) {
        if (categories.some((category) => category.slug === data.slug || (data.code && category.code === data.code))) {
          throw new Error("duplicate fake category");
        }

        counter += 1;
        const row = {
          id: `category-${counter}`,
          ...data,
          archivedAt: null,
          parentId: (data.parentId as string | null | undefined) ?? null,
          code: (data.code as string | null | undefined) ?? null,
          createdAt: now,
          updatedAt: now
        } as unknown as FakeCategory;
        categories.push(row);
        return hydrate(row);
      },
      async findUnique({ where }: { where: { id: string } }) {
        const row = categories.find((category) => category.id === where.id);
        return row ? hydrate(row) : null;
      },
      async update({ where, data }: { where: { id: string }; data: Record<string, unknown> }) {
        const index = categories.findIndex((category) => category.id === where.id);

        if (index < 0) {
          throw new Error("Category not found in fake transaction.");
        }

        categories[index] = {
          ...categories[index],
          ...data,
          updatedAt: now
        };

        return hydrate(categories[index]);
      },
      async findMany() {
        return categories.map(hydrate);
      }
    },
    pricingRule: {
      async count({ where }: { where?: { jobField?: string | null } } = {}) {
        return where?.jobField === "SOFTWARE_ENGINEERING" ? 1 : 0;
      }
    },
    insight: {
      async count() {
        return 0;
      }
    },
    adminAuditEvent: {
      async create({ data }: { data: Record<string, unknown> }) {
        const row = {
          id: `audit-${audits.length + 1}`,
          ...data,
          actorAdminUser: actor,
          createdAt: data.createdAt ?? now
        };
        audits.push(row);
        return row;
      }
    }
  } as unknown as UseravaaTransactionClient;

  return {
    tx,
    categories,
    audits,
    runInTransaction: async <T,>(operation: (transaction: UseravaaTransactionClient) => Promise<T>) => operation(tx)
  };
}

describe("Checkpoint 3A-9 admin categories and topics", () => {
  it("extends the existing JobCategory schema non-destructively", () => {
    const schema = readProjectFile("prisma/schema.prisma");
    const migration = readProjectFile("prisma/migrations/20260615110000_admin_categories_taxonomy/migration.sql");

    expect(schema).toContain("model JobCategory");
    expect(schema).toContain("slug             String            @unique");
    expect(schema).toContain("showInDiscovery");
    expect(schema).toContain("showInInsights");
    expect(schema).toContain("showInPricing");
    expect(schema).toContain("archivedAt");
    expect(schema).toContain("ProfileCategory");
    expect(migration).toContain("ALTER TABLE \"JobCategory\" ADD COLUMN \"slug\"");
    expect(migration).toContain("CREATE UNIQUE INDEX \"JobCategory_slug_key\"");
    expect(migration).not.toMatch(/DROP TABLE|TRUNCATE|DELETE FROM|ALTER TABLE "ProfileCategory" DROP|ALTER TABLE "PricingRule" DROP/i);
  });

  it("keeps admin category pages and APIs guarded and classified", () => {
    const listPage = readProjectFile("src/app/admin/categories/page.tsx");
    const detailPage = readProjectFile("src/app/admin/categories/[categoryId]/page.tsx");
    const createRoute = readProjectFile("src/app/api/admin/categories/route.ts");
    const updateRoute = readProjectFile("src/app/api/admin/categories/[categoryId]/route.ts");
    const archiveRoute = readProjectFile("src/app/api/admin/categories/[categoryId]/archive/route.ts");
    const restoreRoute = readProjectFile("src/app/api/admin/categories/[categoryId]/restore/route.ts");
    const endpointClassification = readProjectFile("src/lib/backend/endpoint-classification.ts");

    expect(listPage).toContain("requireAdminPageAccess");
    expect(listPage).toContain("getAdminCategoryRouteData");
    expect(detailPage).toContain("requireAdminPageAccess");
    expect(detailPage).toContain("getAdminCategoryDetailRouteData");
    expect(createRoute).toContain("requireAdminViewer");
    expect(updateRoute).toContain("requireAdminViewer");
    expect(archiveRoute).toContain("requireAdminViewer");
    expect(restoreRoute).toContain("requireAdminViewer");
    expect(endpointClassification).toContain("POST /api/admin/categories");
    expect(endpointClassification).toContain("PATCH /api/admin/categories/[categoryId]");
    expect(endpointClassification).toContain("POST /api/admin/categories/[categoryId]/archive");
    expect(endpointClassification).toContain("POST /api/admin/categories/[categoryId]/restore");
    expect(projectFileExists("src/app/admin/categories/[categoryId]/page.tsx")).toBe(true);
  });

  it("validates category payloads strictly and rejects unsafe fields", () => {
    expect(adminCategoryCreateSchema.safeParse(validCategoryPayload()).success).toBe(true);
    expect(adminCategoryCreateSchema.safeParse(validCategoryPayload({ slug: "Bad Slug" })).success).toBe(false);
    expect(adminCategoryCreateSchema.safeParse(validCategoryPayload({ titleFa: "" })).success).toBe(false);
    expect(adminCategoryCreateSchema.safeParse(validCategoryPayload({ createdByAdminId: "spoofed" })).success).toBe(false);
    expect(adminCategoryCreateSchema.safeParse(validCategoryPayload({ walletBalanceToman: 100 })).success).toBe(false);
    expect(adminCategoryCreateSchema.safeParse(validCategoryPayload({ paymentId: "pay-1" })).success).toBe(false);
    expect(adminCategoryCreateSchema.safeParse(validCategoryPayload({ profileStatus: "ACTIVE" })).success).toBe(false);
    expect(adminCategoryUpdateSchema.safeParse({ titleFa: "داده و هوش مصنوعی" }).success).toBe(true);
    expect(adminCategoryUpdateSchema.safeParse({}).success).toBe(false);
    expect(adminCategoryArchiveSchema.safeParse({ reason: "merge duplicate category" }).success).toBe(true);
    expect(adminCategoryArchiveSchema.safeParse({ reason: "merge duplicate category", actorAdminUserId: "bad" }).success).toBe(false);
    expect(adminCategoryRestoreSchema.safeParse({ internalNote: "restore after review" }).success).toBe(true);
  });

  it("renders category list and detail UI without fake operational rows", () => {
    const item = {
      id: "category-1",
      slug: "software-engineering",
      titleFa: "مهندسی نرم‌افزار",
      titleEn: "Software Engineering",
      descriptionFa: "مسیرهای تجربه در مهندسی نرم‌افزار",
      parentLabel: "بدون دسته بالادست",
      parentId: "",
      sortOrder: 10,
      jobFieldCode: "SOFTWARE_ENGINEERING",
      jobFieldLabel: "SOFTWARE_ENGINEERING",
      activeLabel: "فعال",
      isActive: true,
      isArchived: false,
      showInDiscovery: true,
      showInInsights: true,
      showInPricing: true,
      visibilitySummary: "کشف تجربه، بینش‌ها، قیمت‌گذاری",
      profileCountLabel: "۲",
      profileCount: 2,
      insightCountLabel: "۱",
      insightCount: 1,
      pricingRuleCountLabel: "۱",
      pricingRuleCount: 1,
      childCountLabel: "۰",
      childCount: 0,
      createdBySummary: "Admin",
      updatedBySummary: "Admin",
      createdAt: "امروز",
      updatedAt: "امروز",
      archivedAt: "ثبت نشده",
      href: "/admin/categories/category-1",
      source: "backend_repository" as const,
      actionsAvailable: true,
      auditItems: [
        {
          id: "audit-1",
          actorSummary: "Admin · ADMIN",
          actionLabel: "ثبت دسته شغلی",
          entitySummary: "JOB_CATEGORY · category-1",
          statusChange: "ثبت نشده → ACTIVE",
          reason: "ثبت نشده",
          note: "ثبت نشده",
          createdAt: "امروز",
          categoryHref: "/admin/categories/category-1",
          source: "backend_repository" as const
        }
      ]
    };

    const listHtml = renderToStaticMarkup(
      <AdminCategories
        data={{
          items: [item],
          parentOptions: [],
          source: "backend_repository",
          sourceNote: "repository-backed",
          viewerCanMutate: true
        }}
      />
    );

    expect(listHtml).toContain("دسته‌های شغلی و موضوعات تجربه");
    expect(listHtml).toContain("مهندسی نرم‌افزار");
    expect(listHtml).toContain("ثبت دسته شغلی");
    expect(listHtml).not.toContain("fake");

    const detailHtml = renderToStaticMarkup(
      <AdminCategoryDetail
        data={{
          item,
          parentOptions: [],
          source: "backend_repository",
          sourceNote: "repository-backed",
          viewerCanMutate: true
        }}
      />
    );

    expect(detailHtml).toContain("جزئیات دسته شغلی");
    expect(detailHtml).toContain("آرشیو دسته شغلی");
    expect(detailHtml).toContain("گزارش ممیزی");
  });

  it("creates, updates, archives, restores, and audits categories through ADMIN-only service actions", async () => {
    const fake = createFakeCategoryTransaction();
    const admin = { id: "admin-1", role: "ADMIN" };
    const support = { id: "support-1", role: "SUPPORT" };
    const user = { id: "user-1", role: "USER" };

    const created = await adminCategoryService.create(admin, validCategoryPayload(), {
      now: () => now,
      runInTransaction: fake.runInTransaction
    });

    expect(created.ok).toBe(true);
    expect(fake.categories).toHaveLength(1);
    expect(fake.audits[0]).toMatchObject({
      actorAdminUserId: "admin-1",
      action: "CATEGORY_CREATED",
      entityType: "JOB_CATEGORY"
    });

    if (!created.ok) {
      throw new Error("create failed");
    }

    const updated = await adminCategoryService.update(
      admin,
      created.data.id,
      {
        titleFa: "مهندسی نرم‌افزار و زیرساخت",
        showInInsights: false
      },
      {
        now: () => now,
        runInTransaction: fake.runInTransaction
      }
    );

    expect(updated).toMatchObject({ ok: true });
    expect(fake.categories[0]).toMatchObject({
      labelFa: "مهندسی نرم‌افزار و زیرساخت",
      showInInsights: false
    });
    expect(fake.audits[1]).toMatchObject({ action: "CATEGORY_UPDATED" });

    const archived = await adminCategoryService.archive(
      admin,
      created.data.id,
      {
        reason: "merge duplicate category",
        internalNote: "keep linked records"
      },
      {
        now: () => now,
        runInTransaction: fake.runInTransaction
      }
    );

    expect(archived).toMatchObject({ ok: true });
    expect(fake.categories[0]).toMatchObject({
      isActive: false,
      showInDiscovery: false,
      showInInsights: false,
      showInPricing: false,
      archivedAt: now
    });
    expect(fake.audits[2]).toMatchObject({ action: "CATEGORY_ARCHIVED", reason: "merge duplicate category" });

    const restored = await adminCategoryService.restore(
      admin,
      created.data.id,
      { internalNote: "restore after taxonomy review" },
      {
        now: () => now,
        runInTransaction: fake.runInTransaction
      }
    );

    expect(restored).toMatchObject({ ok: true });
    expect(fake.categories[0]).toMatchObject({
      isActive: true,
      archivedAt: null,
      showInDiscovery: false,
      showInInsights: false,
      showInPricing: false
    });
    expect(fake.audits[3]).toMatchObject({ action: "CATEGORY_RESTORED" });

    await expect(adminCategoryService.create(support, validCategoryPayload(), { runInTransaction: fake.runInTransaction })).resolves.toMatchObject({
      ok: false,
      code: "unauthorized"
    });
    await expect(adminCategoryService.update(support, created.data.id, { titleFa: "bad" }, { runInTransaction: fake.runInTransaction })).resolves.toMatchObject({
      ok: false,
      code: "unauthorized"
    });
    await expect(adminCategoryService.archive(user, created.data.id, { reason: "bad" }, { runInTransaction: fake.runInTransaction })).resolves.toMatchObject({
      ok: false,
      code: "unauthorized"
    });
  });

  it("keeps category implementation scoped away from lifecycle, finance, and fixture mutations", () => {
    const servicesSource = readProjectFile("src/lib/backend/services.ts");
    const categoryServiceSource = servicesSource.slice(
      servicesSource.indexOf("export const adminCategoryService"),
      servicesSource.indexOf("export const adminPricingService")
    );
    const combined = [
      readProjectFile("src/lib/backend/repositories/admin-category.ts"),
      categoryServiceSource,
      readProjectFile("src/features/v51/admin/server-data.ts"),
      readProjectFile("src/features/v51/admin/AdminSurfaces.tsx"),
      readProjectFile("src/features/v51/admin/AdminCategoryActions.tsx")
    ].join("\n");

    expect(combined).toContain("CATEGORY_CREATED");
    expect(combined).toContain("CATEGORY_UPDATED");
    expect(combined).toContain("CATEGORY_ARCHIVED");
    expect(combined).toContain("CATEGORY_RESTORED");
    expect(combined).not.toContain("getConversationOrFallback");
    expect(combined).not.toContain("receiptUrl");
    expect(combined).not.toContain("requesterCodeCiphertext");
    expect(combined).not.toMatch(/\.(payment|walletTransaction|conversationRequest|cancellation|attendanceVerification)\.(create|update|upsert|delete|deleteMany)\(/);
  });

  it("runs rollback-backed DB smoke coverage for admin categories when enabled", async () => {
    if (process.env.USERAVAA_DB_SMOKE_TEST !== "1") {
      expect(process.env.USERAVAA_DB_SMOKE_TEST).not.toBe("1");
      return;
    }

    class SmokeRollback extends Error {
      constructor(readonly summary: Record<string, unknown>) {
        super("ADMIN_CATEGORY_SMOKE_ROLLBACK");
      }
    }

    const prisma = getPrismaClient();
    const unique = `category-smoke-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const adminId = `${unique}-admin`;
    const supportId = `${unique}-support`;
    let summary: Record<string, unknown> | null = null;

    try {
      await prisma.$transaction(async (tx) => {
        await tx.user.createMany({
          data: [
            { id: adminId, role: "ADMIN", email: `${adminId}@smoke.useravaa.test`, displayName: "Category Smoke Admin", createdAt: now },
            { id: supportId, role: "SUPPORT", email: `${supportId}@smoke.useravaa.test`, displayName: "Category Smoke Support", createdAt: now }
          ]
        });
        const beforeCounts = {
          profiles: await tx.experienceProfile.count(),
          insights: await tx.insight.count(),
          pricingRules: await tx.pricingRule.count(),
          conversations: await tx.conversationRequest.count(),
          wallets: await tx.wallet.count()
        };
        const runInTransaction = async <T,>(operation: (transaction: UseravaaTransactionClient) => Promise<T>) =>
          operation(tx as unknown as UseravaaTransactionClient);
        const admin = { id: adminId, role: "ADMIN" };
        const created = await adminCategoryService.create(
          admin,
          validCategoryPayload({
            slug: unique,
            titleFa: `دسته تست ${unique}`,
            jobFieldCode: null
          }),
          {
            now: () => now,
            runInTransaction
          }
        );

        if (!created.ok) {
          throw new Error("Category smoke create failed.");
        }

        const listed = await useravaaRepository.adminCategories.listCategories(tx as never);
        const activeBeforeArchive = await useravaaRepository.adminCategories.listActiveCategoriesForUseCase("discovery", tx as never);
        const updated = await adminCategoryService.update(
          admin,
          created.data.id,
          {
            titleFa: `دسته تست ویرایش ${unique}`,
            showInPricing: false
          },
          {
            now: () => now,
            runInTransaction
          }
        );
        const supportUpdate = await adminCategoryService.update(
          { id: supportId, role: "SUPPORT" },
          created.data.id,
          { titleFa: "bad" },
          {
            now: () => now,
            runInTransaction
          }
        );
        const archived = await adminCategoryService.archive(
          admin,
          created.data.id,
          {
            reason: "smoke archive",
            internalNote: "archive without deleting linked data"
          },
          {
            now: () => now,
            runInTransaction
          }
        );
        const activeAfterArchive = await useravaaRepository.adminCategories.listActiveCategoriesForUseCase("discovery", tx as never);
        const auditActions = await tx.adminAuditEvent.findMany({
          where: {
            entityType: "JOB_CATEGORY",
            entityId: created.data.id
          },
          select: { action: true },
          orderBy: { createdAt: "asc" }
        });
        const afterCounts = {
          profiles: await tx.experienceProfile.count(),
          insights: await tx.insight.count(),
          pricingRules: await tx.pricingRule.count(),
          conversations: await tx.conversationRequest.count(),
          wallets: await tx.wallet.count()
        };

        throw new SmokeRollback({
          listed: listed.ok && listed.data.some((category) => category.id === created.data.id),
          activeBeforeArchive: activeBeforeArchive.ok && activeBeforeArchive.data.some((category) => category.id === created.data.id),
          activeAfterArchive: activeAfterArchive.ok && !activeAfterArchive.data.some((category) => category.id === created.data.id),
          updated: updated.ok && updated.data.labelFa.includes("ویرایش"),
          archived: archived.ok && !archived.data.isActive && Boolean(archived.data.archivedAt),
          supportReadOnly: !supportUpdate.ok && supportUpdate.code === "unauthorized",
          auditActions: auditActions.map((row) => row.action),
          linkedCountsUnchanged: JSON.stringify(beforeCounts) === JSON.stringify(afterCounts)
        });
      }, { timeout: 30_000 });
    } catch (error) {
      if (error instanceof SmokeRollback) {
        summary = error.summary;
      } else {
        throw error;
      }
    }

    const duplicateUnique = `smoke-duplicate-category-${Date.now()}`;
    try {
      await prisma.$transaction(async (tx) => {
        await tx.user.create({
          data: {
            id: `${duplicateUnique}-admin`,
            role: "ADMIN",
            email: `${duplicateUnique}@smoke.useravaa.test`,
            displayName: "Category Duplicate Smoke Admin",
            createdAt: now
          }
        });
        const runInTransaction = async <T,>(operation: (transaction: UseravaaTransactionClient) => Promise<T>) =>
          operation(tx as unknown as UseravaaTransactionClient);
        const admin = { id: `${duplicateUnique}-admin`, role: "ADMIN" };
        const first = await adminCategoryService.create(
          admin,
          validCategoryPayload({
            slug: duplicateUnique,
            titleFa: `دسته تست ${duplicateUnique}`,
            jobFieldCode: null
          }),
          {
            now: () => now,
            runInTransaction
          }
        );

        if (!first.ok) {
          throw new Error("Category smoke duplicate setup failed.");
        }

        const duplicate = await adminCategoryService.create(
          admin,
          validCategoryPayload({
            slug: duplicateUnique,
            titleFa: `دسته تکراری ${duplicateUnique}`,
            jobFieldCode: null
          }),
          {
            now: () => now,
            runInTransaction
          }
        );

        throw new SmokeRollback({
          duplicateRejected: !duplicate.ok && duplicate.code === "validation_error"
        });
      }, { timeout: 30_000 });
    } catch (error) {
      if (error instanceof SmokeRollback) {
        summary = { ...summary, ...error.summary };
      } else {
        throw error;
      }
    }

    expect(summary).toMatchObject({
      listed: true,
      activeBeforeArchive: true,
      activeAfterArchive: true,
      updated: true,
      archived: true,
      duplicateRejected: true,
      supportReadOnly: true,
      linkedCountsUnchanged: true
    });
    expect(summary?.auditActions).toEqual(["CATEGORY_CREATED", "CATEGORY_UPDATED", "CATEGORY_ARCHIVED"]);
    await expect(prisma.user.findUnique({ where: { id: adminId } })).resolves.toBeNull();
    await prisma.$disconnect();
  }, 35_000);
});
