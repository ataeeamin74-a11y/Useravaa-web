import fs from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AdminContentDetail, AdminContentManagement } from "@/features/v51/admin/AdminSurfaces";
import { getPrismaClient } from "@/lib/backend/db/prisma";
import type { UseravaaTransactionClient } from "@/lib/backend/db/transaction";
import { useravaaRepository } from "@/lib/backend/repository";
import { adminContentService } from "@/lib/backend/services";
import {
  adminContentEntryArchiveSchema,
  adminContentEntryCreateSchema,
  adminContentEntryRestoreSchema,
  adminContentEntryUpdateSchema
} from "@/lib/backend/validation";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn()
  })
}));

const projectRoot = process.cwd();
const now = new Date("2026-06-19T09:00:00.000Z");

function readProjectFile(relativePath: string) {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

function projectFileExists(relativePath: string) {
  return fs.existsSync(path.join(projectRoot, relativePath));
}

function validContentPayload(overrides: Record<string, unknown> = {}) {
  return {
    key: "answer_prompt_card",
    namespace: "public.insights",
    locale: "fa",
    title: "یک سؤال جدید برای پاسخ کوتاه",
    body: "پاسخ کوتاه شما می‌تواند به تصمیم شغلی دیگران کمک کند.",
    shortText: "نوشتن پاسخ کوتاه",
    description: "Safe public insights prompt copy.",
    contentType: "PAGE_BLOCK",
    status: "DRAFT",
    isEditable: true,
    ...overrides
  };
}

function contentItem(overrides: Record<string, unknown> = {}) {
  return {
    id: "content-1",
    key: "answer_prompt_card",
    namespace: "public.insights",
    locale: "fa",
    title: "یک سؤال جدید برای پاسخ کوتاه",
    bodySummary: "پاسخ کوتاه شما می‌تواند به تصمیم شغلی دیگران کمک کند.",
    bodyValue: "پاسخ کوتاه شما می‌تواند به تصمیم شغلی دیگران کمک کند.",
    shortText: "نوشتن پاسخ کوتاه",
    description: "Safe public insights prompt copy.",
    contentType: "PAGE_BLOCK",
    contentTypeLabel: "بلوک صفحه",
    status: "DRAFT",
    statusLabel: "پیش‌نویس",
    isEditable: true,
    isSystem: false,
    editableLabel: "قابل ویرایش",
    systemLabel: "مدیریت‌شده",
    createdBySummary: "Admin",
    updatedBySummary: "Admin",
    createdAt: "امروز",
    updatedAt: "امروز",
    archivedAt: "ثبت نشده",
    href: "/admin/content/content-1",
    source: "backend_repository" as const,
    actionsAvailable: true,
    auditItems: [
      {
        id: "audit-1",
        actorSummary: "Admin · ADMIN",
        actionLabel: "ثبت محتوای مدیریت‌شده",
        entitySummary: "CONTENT_ENTRY · content-1",
        statusChange: "ثبت نشده → DRAFT",
        reason: "ثبت نشده",
        note: "ثبت نشده",
        createdAt: "امروز",
        contentHref: "/admin/content/content-1",
        source: "backend_repository" as const
      }
    ],
    ...overrides
  };
}

function createFakeContentTransaction() {
  type FakeContent = Record<string, unknown> & {
    id: string;
    key: string;
    namespace: string;
    locale: string;
    status: string;
    isEditable: boolean;
    isSystem: boolean;
    archivedAt: Date | null;
  };

  const actor = { id: "admin-1", displayName: "Admin", role: "ADMIN" };
  const entries: FakeContent[] = [];
  const audits: Record<string, unknown>[] = [];
  let counter = 0;

  function hydrate(entry: FakeContent) {
    return {
      ...entry,
      shortText: entry.shortText ?? null,
      description: entry.description ?? null,
      createdByAdminId: entry.createdByAdminId ?? "admin-1",
      updatedByAdminId: entry.updatedByAdminId ?? "admin-1",
      createdAt: entry.createdAt ?? now,
      updatedAt: entry.updatedAt ?? now,
      createdByAdmin: actor,
      updatedByAdmin: actor
    };
  }

  const tx = {
    contentEntry: {
      async create({ data }: { data: Record<string, unknown> }) {
        if (
          entries.some(
            (entry) => entry.key === data.key && entry.namespace === data.namespace && entry.locale === data.locale
          )
        ) {
          throw new Error("duplicate fake content entry");
        }

        counter += 1;
        const row = {
          id: `content-${counter}`,
          ...data,
          isSystem: data.isSystem ?? false,
          archivedAt: (data.archivedAt as Date | null | undefined) ?? null,
          createdAt: now,
          updatedAt: now
        } as unknown as FakeContent;
        entries.push(row);
        return hydrate(row);
      },
      async findUnique({ where }: { where: { id: string } }) {
        const row = entries.find((entry) => entry.id === where.id);
        return row ? hydrate(row) : null;
      },
      async findFirst({ where }: { where: { namespace?: string; key?: string; locale?: string; status?: string; archivedAt?: null } }) {
        const row = entries.find(
          (entry) =>
            (!where.namespace || entry.namespace === where.namespace) &&
            (!where.key || entry.key === where.key) &&
            (!where.locale || entry.locale === where.locale) &&
            (!where.status || entry.status === where.status) &&
            (where.archivedAt !== null || entry.archivedAt === null)
        );
        return row ? hydrate(row) : null;
      },
      async update({ where, data }: { where: { id: string }; data: Record<string, unknown> }) {
        const index = entries.findIndex((entry) => entry.id === where.id);

        if (index < 0) {
          throw new Error("Content entry not found in fake transaction.");
        }

        entries[index] = {
          ...entries[index],
          ...data,
          updatedAt: now
        };

        return hydrate(entries[index]);
      },
      async findMany() {
        return entries.map(hydrate);
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
    entries,
    audits,
    runInTransaction: async <T,>(operation: (transaction: UseravaaTransactionClient) => Promise<T>) => operation(tx)
  };
}

describe("Checkpoint 3A-10 admin content management and UGC moderation foundation", () => {
  it("adds a non-destructive ContentEntry schema and migration", () => {
    const schema = readProjectFile("prisma/schema.prisma");
    const migration = readProjectFile("prisma/migrations/20260619120000_admin_content_management/migration.sql");

    expect(schema).toContain("model ContentEntry");
    expect(schema).toContain("enum ContentEntryType");
    expect(schema).toContain("enum ContentEntryStatus");
    expect(schema).toContain("@@unique([namespace, key, locale])");
    expect(migration).toContain("CREATE TABLE \"ContentEntry\"");
    expect(migration).toContain("CREATE UNIQUE INDEX \"ContentEntry_namespace_key_locale_key\"");
    expect(migration).not.toMatch(/DROP TABLE|TRUNCATE|DELETE FROM|ALTER TABLE \"(Payment|ConversationRequest|Wallet|Insight|InsightAnswer)\" DROP/i);
  });

  it("keeps /admin/content pages and APIs guarded and classified", () => {
    const listPage = readProjectFile("src/app/admin/content/page.tsx");
    const detailPage = readProjectFile("src/app/admin/content/[contentId]/page.tsx");
    const createRoute = readProjectFile("src/app/api/admin/content/route.ts");
    const updateRoute = readProjectFile("src/app/api/admin/content/[contentId]/route.ts");
    const archiveRoute = readProjectFile("src/app/api/admin/content/[contentId]/archive/route.ts");
    const restoreRoute = readProjectFile("src/app/api/admin/content/[contentId]/restore/route.ts");
    const endpointClassification = readProjectFile("src/lib/backend/endpoint-classification.ts");

    expect(listPage).toContain("requireAdminPageAccess");
    expect(listPage).toContain("getAdminContentRouteData");
    expect(detailPage).toContain("requireAdminPageAccess");
    expect(detailPage).toContain("getAdminContentDetailRouteData");
    expect(createRoute).toContain("requireAdminViewer");
    expect(updateRoute).toContain("requireAdminViewer");
    expect(archiveRoute).toContain("requireAdminViewer");
    expect(restoreRoute).toContain("requireAdminViewer");
    expect(endpointClassification).toContain("POST /api/admin/content");
    expect(endpointClassification).toContain("PATCH /api/admin/content/[contentId]");
    expect(endpointClassification).toContain("POST /api/admin/content/[contentId]/archive");
    expect(endpointClassification).toContain("POST /api/admin/content/[contentId]/restore");
    expect(projectFileExists("src/app/admin/content/[contentId]/page.tsx")).toBe(true);
  });

  it("validates content payloads strictly and rejects dangerous fields", () => {
    expect(adminContentEntryCreateSchema.safeParse(validContentPayload()).success).toBe(true);
    expect(adminContentEntryCreateSchema.safeParse(validContentPayload({ key: "Bad Key" })).success).toBe(false);
    expect(adminContentEntryCreateSchema.safeParse(validContentPayload({ namespace: "Public Insights" })).success).toBe(false);
    expect(adminContentEntryCreateSchema.safeParse(validContentPayload({ status: "ARCHIVED" })).success).toBe(false);
    expect(adminContentEntryCreateSchema.safeParse(validContentPayload({ createdByAdminId: "spoofed" })).success).toBe(false);
    expect(adminContentEntryCreateSchema.safeParse(validContentPayload({ actorAdminUserId: "spoofed" })).success).toBe(false);
    expect(adminContentEntryCreateSchema.safeParse(validContentPayload({ walletBalanceToman: 1 })).success).toBe(false);
    expect(adminContentEntryCreateSchema.safeParse(validContentPayload({ paymentId: "pay-1" })).success).toBe(false);
    expect(adminContentEntryCreateSchema.safeParse(validContentPayload({ requesterCodeHash: "secret" })).success).toBe(false);
    expect(adminContentEntryUpdateSchema.safeParse({ title: "Updated title" }).success).toBe(true);
    expect(adminContentEntryUpdateSchema.safeParse({}).success).toBe(false);
    expect(adminContentEntryUpdateSchema.safeParse({ key: "not-allowed" }).success).toBe(false);
    expect(adminContentEntryUpdateSchema.safeParse({ insightStatus: "PUBLISHED" }).success).toBe(false);
    expect(adminContentEntryArchiveSchema.safeParse({ reason: "obsolete copy" }).success).toBe(true);
    expect(adminContentEntryArchiveSchema.safeParse({ reason: "obsolete copy", payoutId: "bad" }).success).toBe(false);
    expect(adminContentEntryRestoreSchema.safeParse({ internalNote: "restore after review" }).success).toBe(true);
  });

  it("renders content admin surfaces without fake content rows and marks comments not implemented", () => {
    const item = contentItem();
    const listHtml = renderToStaticMarkup(
      <AdminContentManagement
        data={{
          items: [item],
          namespaceOptions: [{ label: "همه فضاها", value: "", href: "/admin/content", active: true }],
          contentTypeOptions: [{ label: "همه نوع‌ها", value: "", href: "/admin/content", active: true }],
          statusOptions: [{ label: "همه وضعیت‌ها", value: "", href: "/admin/content", active: true }],
          ugcOverview: [
            {
              id: "insights",
              title: "بینش‌ها",
              status: "۱ ردیف",
              description: "ویرایش متن کاربر از این بخش انجام نمی‌شود.",
              href: "/admin/insights",
              ctaLabel: "مدیریت بینش‌ها",
              source: "backend_repository"
            },
            {
              id: "comments-not-implemented",
              title: "دیدگاه‌ها",
              status: "پیاده‌سازی نشده",
              description: "مدل دیدگاه در اسکیما وجود ندارد؛ دیدگاه ساختگی یا صف نمایشی نشان داده نمی‌شود.",
              source: "placeholder"
            }
          ],
          activeFilters: { namespace: "", contentType: "", status: "", search: "" },
          source: "backend_repository",
          sourceNote: "repository-backed",
          viewerCanMutate: true
        }}
      />
    );

    expect(listHtml).toContain("مدیریت محتوا");
    expect(listHtml).toContain("یک سؤال جدید برای پاسخ کوتاه");
    expect(listHtml).toContain("دیدگاه‌ها");
    expect(listHtml).toContain("پیاده‌سازی نشده");
    expect(listHtml).not.toContain("fake");

    const emptyHtml = renderToStaticMarkup(
      <AdminContentManagement
        data={{
          items: [],
          namespaceOptions: [],
          contentTypeOptions: [],
          statusOptions: [],
          ugcOverview: [],
          activeFilters: { namespace: "", contentType: "", status: "", search: "" },
          source: "placeholder",
          sourceNote: "placeholder",
          viewerCanMutate: false
        }}
      />
    );

    expect(emptyHtml).toContain("محتوای مدیریت‌شده‌ای ثبت نشده است");
    expect(emptyHtml).toContain("ردیف نمایشی یا محتوای ساختگی نشان نمی‌دهد");

    const detailHtml = renderToStaticMarkup(
      <AdminContentDetail
        data={{
          item,
          source: "backend_repository",
          sourceNote: "repository-backed",
          viewerCanMutate: true
        }}
      />
    );

    expect(detailHtml).toContain("جزئیات محتوای مدیریت‌شده");
    expect(detailHtml).toContain("متن کامل");
    expect(detailHtml).toContain("ثبت محتوای مدیریت‌شده");
  });

  it("creates, updates, archives, restores, and audits content through ADMIN-only service actions", async () => {
    const fake = createFakeContentTransaction();
    const admin = { id: "admin-1", role: "ADMIN" };
    const support = { id: "support-1", role: "SUPPORT" };
    const user = { id: "user-1", role: "USER" };

    const created = await adminContentService.create(admin, validContentPayload(), {
      now: () => now,
      runInTransaction: fake.runInTransaction
    });

    expect(created.ok).toBe(true);
    expect(fake.entries).toHaveLength(1);
    expect(fake.audits[0]).toMatchObject({
      actorAdminUserId: "admin-1",
      action: "CONTENT_ENTRY_CREATED",
      entityType: "CONTENT_ENTRY"
    });

    if (!created.ok) {
      throw new Error("create failed");
    }

    const updated = await adminContentService.update(
      admin,
      created.data.id,
      {
        title: "یک سؤال تازه برای پاسخ کوتاه",
        body: "متن به‌روز شده برای محتوای مدیریت‌شده.",
        status: "PUBLISHED"
      },
      {
        now: () => now,
        runInTransaction: fake.runInTransaction
      }
    );

    expect(updated).toMatchObject({ ok: true });
    expect(fake.entries[0]).toMatchObject({
      title: "یک سؤال تازه برای پاسخ کوتاه",
      status: "PUBLISHED"
    });
    expect(fake.audits[1]).toMatchObject({ action: "CONTENT_ENTRY_UPDATED" });

    fake.entries[0].isEditable = false;
    const nonEditableUpdate = await adminContentService.update(
      admin,
      created.data.id,
      { title: "bad" },
      {
        now: () => now,
        runInTransaction: fake.runInTransaction
      }
    );
    expect(nonEditableUpdate).toMatchObject({ ok: false, code: "invalid_state" });
    fake.entries[0].isEditable = true;

    const archived = await adminContentService.archive(
      admin,
      created.data.id,
      {
        reason: "obsolete copy",
        internalNote: "keep audit trail"
      },
      {
        now: () => now,
        runInTransaction: fake.runInTransaction
      }
    );

    expect(archived).toMatchObject({ ok: true });
    expect(fake.entries[0]).toMatchObject({
      status: "ARCHIVED",
      archivedAt: now
    });
    expect(fake.audits[2]).toMatchObject({ action: "CONTENT_ENTRY_ARCHIVED", reason: "obsolete copy" });

    const restored = await adminContentService.restore(
      admin,
      created.data.id,
      { internalNote: "restore to draft" },
      {
        now: () => now,
        runInTransaction: fake.runInTransaction
      }
    );

    expect(restored).toMatchObject({ ok: true });
    expect(fake.entries[0]).toMatchObject({
      status: "DRAFT",
      archivedAt: null
    });
    expect(fake.audits[3]).toMatchObject({ action: "CONTENT_ENTRY_RESTORED" });

    await expect(adminContentService.create(support, validContentPayload(), { runInTransaction: fake.runInTransaction })).resolves.toMatchObject({
      ok: false,
      code: "unauthorized"
    });
    await expect(adminContentService.update(support, created.data.id, { title: "bad" }, { runInTransaction: fake.runInTransaction })).resolves.toMatchObject({
      ok: false,
      code: "unauthorized"
    });
    await expect(adminContentService.archive(user, created.data.id, { reason: "bad" }, { runInTransaction: fake.runInTransaction })).resolves.toMatchObject({
      ok: false,
      code: "unauthorized"
    });
  });

  it("keeps content management scoped away from UGC body edits, finance, lifecycle, and fixtures", () => {
    const servicesSource = readProjectFile("src/lib/backend/services.ts");
    const contentServiceSource = servicesSource.slice(
      servicesSource.indexOf("export const adminContentService"),
      servicesSource.indexOf("export const adminCategoryService")
    );
    const combined = [
      readProjectFile("src/lib/backend/repositories/admin-content.ts"),
      contentServiceSource,
      readProjectFile("src/features/v51/admin/server-data.ts"),
      readProjectFile("src/features/v51/admin/AdminSurfaces.tsx"),
      readProjectFile("src/features/v51/admin/AdminContentActions.tsx")
    ].join("\n");

    expect(combined).toContain("CONTENT_ENTRY_CREATED");
    expect(combined).toContain("CONTENT_ENTRY_UPDATED");
    expect(combined).toContain("CONTENT_ENTRY_ARCHIVED");
    expect(combined).toContain("CONTENT_ENTRY_RESTORED");
    expect(combined).toContain("comments-not-implemented");
    expect(combined).not.toContain("getConversationOrFallback");
    expect(combined).not.toContain("receiptUrl");
    expect(combined).not.toContain("requesterCodeCiphertext");
    expect(combined).not.toMatch(/\.(payment|walletTransaction|conversationRequest|cancellation|attendanceVerification|insight|insightAnswer)\.(create|update|upsert|delete|deleteMany)\(/);
  });

  it("runs rollback-backed DB smoke coverage for admin content when enabled", async () => {
    if (process.env.USERAVAA_DB_SMOKE_TEST !== "1") {
      expect(process.env.USERAVAA_DB_SMOKE_TEST).not.toBe("1");
      return;
    }

    class SmokeRollback extends Error {
      constructor(readonly summary: Record<string, unknown>) {
        super("ADMIN_CONTENT_SMOKE_ROLLBACK");
      }
    }

    const prisma = getPrismaClient();
    const unique = `content-smoke-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const adminId = `${unique}-admin`;
    const supportId = `${unique}-support`;
    let summary: Record<string, unknown> | null = null;

    try {
      await prisma.$transaction(async (tx) => {
        await tx.user.createMany({
          data: [
            { id: adminId, role: "ADMIN", email: `${adminId}@smoke.useravaa.test`, displayName: "Content Smoke Admin", createdAt: now },
            { id: supportId, role: "SUPPORT", email: `${supportId}@smoke.useravaa.test`, displayName: "Content Smoke Support", createdAt: now }
          ]
        });

        const runInTransaction = async <T,>(operation: (transaction: UseravaaTransactionClient) => Promise<T>) =>
          operation(tx as unknown as UseravaaTransactionClient);
        const admin = { id: adminId, role: "ADMIN" };
        const created = await adminContentService.create(
          admin,
          validContentPayload({
            key: unique,
            title: `Smoke content ${unique}`
          }),
          {
            now: () => now,
            runInTransaction
          }
        );

        if (!created.ok) {
          throw new Error("Content smoke create failed.");
        }

        const updated = await adminContentService.update(
          admin,
          created.data.id,
          {
            title: `Smoke content updated ${unique}`,
            status: "PUBLISHED"
          },
          {
            now: () => now,
            runInTransaction
          }
        );
        const published = await useravaaRepository.adminContent.getPublishedContentByKey(
          {
            namespace: "public.insights",
            key: unique,
            locale: "fa"
          },
          tx as never
        );
        const supportUpdate = await adminContentService.update(
          { id: supportId, role: "SUPPORT" },
          created.data.id,
          { title: "bad" },
          {
            now: () => now,
            runInTransaction
          }
        );
        const archived = await adminContentService.archive(
          admin,
          created.data.id,
          {
            reason: "smoke archive",
            internalNote: "archive without deleting content"
          },
          {
            now: () => now,
            runInTransaction
          }
        );
        const archivedRuntime = await useravaaRepository.adminContent.getPublishedContentByKey(
          {
            namespace: "public.insights",
            key: unique,
            locale: "fa"
          },
          tx as never
        );
        const auditActions = await tx.adminAuditEvent.findMany({
          where: {
            entityType: "CONTENT_ENTRY",
            entityId: created.data.id
          },
          select: { action: true },
          orderBy: { createdAt: "asc" }
        });

        throw new SmokeRollback({
          created: created.ok,
          updated: updated.ok,
          publishedReadable: published.ok && Boolean(published.data),
          archived: archived.ok && archived.data.status === "ARCHIVED",
          archivedNotRuntimePublished: archivedRuntime.ok && archivedRuntime.data === null,
          supportReadOnly: !supportUpdate.ok && supportUpdate.code === "unauthorized",
          auditActions: auditActions.map((row) => row.action)
        });
      }, { timeout: 30_000 });
    } catch (error) {
      if (error instanceof SmokeRollback) {
        summary = error.summary;
      } else {
        throw error;
      }
    }

    const duplicateUnique = `${unique}-duplicate`;
    let duplicateRejected = false;

    try {
      await prisma.$transaction(async (tx) => {
        await tx.user.create({
          data: {
            id: `${duplicateUnique}-admin`,
            role: "ADMIN",
            email: `${duplicateUnique}@smoke.useravaa.test`,
            displayName: "Content Duplicate Smoke Admin",
            createdAt: now
          }
        });
        const runInTransaction = async <T,>(operation: (transaction: UseravaaTransactionClient) => Promise<T>) =>
          operation(tx as unknown as UseravaaTransactionClient);
        const admin = { id: `${duplicateUnique}-admin`, role: "ADMIN" };
        const first = await adminContentService.create(
          admin,
          validContentPayload({
            key: duplicateUnique,
            title: `Smoke duplicate first ${duplicateUnique}`
          }),
          {
            now: () => now,
            runInTransaction
          }
        );

        if (!first.ok) {
          throw new Error("Content duplicate smoke first create failed.");
        }

        const duplicate = await adminContentService.create(
          admin,
          validContentPayload({
            key: duplicateUnique,
            title: `Smoke duplicate second ${duplicateUnique}`
          }),
          {
            now: () => now,
            runInTransaction
          }
        );

        if (duplicate.ok) {
          throw new Error("Content duplicate smoke did not reject a duplicate key.");
        }

        throw new SmokeRollback({ duplicateRejected: true });
      }, { timeout: 30_000 });
    } catch (error) {
      if (error instanceof SmokeRollback) {
        duplicateRejected = Boolean(error.summary.duplicateRejected);
      } else if (error instanceof Error && /unique|constraint|transaction is aborted|P2002/i.test(error.message)) {
        duplicateRejected = true;
      } else {
        throw error;
      }
    }

    expect(summary).toMatchObject({
      created: true,
      updated: true,
      publishedReadable: true,
      archived: true,
      archivedNotRuntimePublished: true,
      supportReadOnly: true,
      auditActions: expect.arrayContaining(["CONTENT_ENTRY_CREATED", "CONTENT_ENTRY_UPDATED", "CONTENT_ENTRY_ARCHIVED"])
    });
    expect(duplicateRejected).toBe(true);
  });
});
