import fs from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AdminSupportDetail, AdminSupportInbox } from "@/features/v51/admin/AdminSurfaces";
import { getPlaceholderData } from "@/features/v51/admin/data";
import { getPrismaClient } from "@/lib/backend/db/prisma";
import type { UseravaaTransactionClient } from "@/lib/backend/db/transaction";
import { useravaaRepository } from "@/lib/backend/repository";
import { adminSupportService } from "@/lib/backend/services";
import {
  adminSupportTicketArchiveSchema,
  adminSupportTicketAssignSchema,
  adminSupportTicketCreateSchema,
  adminSupportTicketNoteCreateSchema,
  adminSupportTicketReopenSchema,
  adminSupportTicketResolveSchema,
  adminSupportTicketUpdateSchema
} from "@/lib/backend/validation";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn()
  })
}));

const projectRoot = process.cwd();
const now = new Date("2026-06-20T09:00:00.000Z");

function readProjectFile(relativePath: string) {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

function projectFileExists(relativePath: string) {
  return fs.existsSync(path.join(projectRoot, relativePath));
}

function validTicketPayload(overrides: Record<string, unknown> = {}) {
  return {
    subject: "پیگیری پرداخت دستی",
    description: "کاربر درباره وضعیت پرداخت دستی سؤال دارد.",
    priority: "HIGH",
    category: "PAYMENT",
    source: "MANUAL",
    requesterUserId: "user-1",
    relatedEntityType: "PAYMENT",
    relatedEntityId: "payment-1",
    ...overrides
  };
}

function ticketItem(overrides: Record<string, unknown> = {}) {
  return {
    id: "ticket-1",
    ticketNumber: "SUP-1",
    subject: "پیگیری پرداخت دستی",
    description: "کاربر درباره وضعیت پرداخت دستی سؤال دارد.",
    preview: "کاربر درباره وضعیت پرداخت دستی سؤال دارد.",
    status: "OPEN",
    statusLabel: "باز",
    priority: "HIGH",
    priorityLabel: "بالا",
    category: "PAYMENT",
    categoryLabel: "پرداخت",
    subcategory: "ثبت نشده",
    sourceCode: "MANUAL",
    sourceLabel: "دستی",
    requesterSummary: "User · user-1",
    requesterHref: "/admin/users/user-1",
    assigneeSummary: "Admin · admin-1",
    relatedEntityType: "PAYMENT",
    relatedEntityLabel: "پرداخت",
    relatedEntityId: "payment-1",
    relatedEntityHref: "/admin/payments/payment-1",
    resolutionSummary: "ثبت نشده",
    resolutionReason: "ثبت نشده",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    resolvedAt: "ثبت نشده",
    archivedAt: "ثبت نشده",
    ageLabel: "امروز",
    href: "/admin/support/ticket-1",
    source: "backend_repository" as const,
    actionsAvailable: true,
    notes: [
      {
        id: "note-1",
        body: "یادداشت داخلی برای پیگیری",
        noteType: "INTERNAL",
        noteTypeLabel: "یادداشت داخلی",
        createdBySummary: "Admin · admin-1",
        createdAt: now.toISOString()
      }
    ],
    auditItems: [
      {
        id: "audit-1",
        actorSummary: "Admin · ADMIN",
        actionLabel: "ثبت تیکت پشتیبانی",
        entitySummary: "SUPPORT_TICKET · ticket-1",
        statusChange: "ثبت نشده → OPEN",
        reason: "ثبت نشده",
        note: "ثبت نشده",
        createdAt: now.toISOString(),
        supportHref: "/admin/support/ticket-1",
        source: "backend_repository" as const
      }
    ],
    ...overrides
  };
}

function createFakeSupportTransaction() {
  type FakeTicket = Record<string, unknown> & {
    id: string;
    ticketNumber: string;
    status: string;
    priority: string;
    category: string;
    source: string;
    requesterUserId: string | null;
    assigneeAdminId: string | null;
    archivedAt: Date | null;
    resolvedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  };

  type FakeNote = Record<string, unknown> & {
    id: string;
    ticketId: string;
    noteType: string;
    createdByAdminId: string | null;
    createdAt: Date;
    updatedAt: Date;
  };

  const actors = {
    "admin-1": { id: "admin-1", displayName: "Admin", email: "admin@example.test", role: "ADMIN" },
    "support-1": { id: "support-1", displayName: "Support", email: "support@example.test", role: "SUPPORT" },
    "user-1": { id: "user-1", displayName: "User", email: "user@example.test", role: "USER" }
  } as Record<string, { id: string; displayName: string; email: string; role: string }>;
  const tickets: FakeTicket[] = [];
  const notes: FakeNote[] = [];
  const audits: Record<string, unknown>[] = [];
  let ticketCounter = 0;
  let noteCounter = 0;

  function hydrateTicket(ticket: FakeTicket) {
    return {
      ...ticket,
      subcategory: ticket.subcategory ?? null,
      resolutionSummary: ticket.resolutionSummary ?? null,
      resolutionReason: ticket.resolutionReason ?? null,
      relatedEntityType: ticket.relatedEntityType ?? null,
      relatedEntityId: ticket.relatedEntityId ?? null,
      requesterUser: ticket.requesterUserId ? actors[ticket.requesterUserId] ?? null : null,
      assigneeAdmin: ticket.assigneeAdminId ? actors[ticket.assigneeAdminId] ?? null : null,
      notes: notes
        .filter((note) => note.ticketId === ticket.id)
        .map((note) => ({
          ...note,
          createdByAdmin: note.createdByAdminId ? actors[note.createdByAdminId] ?? null : null
        }))
    };
  }

  function matchesWhere(ticket: FakeTicket, where: Record<string, unknown>) {
    if (where.archivedAt === null && ticket.archivedAt !== null) {
      return false;
    }

    if (typeof where.status === "string" && ticket.status !== where.status) {
      return false;
    }

    if (typeof where.status === "object" && where.status && "not" in where.status && ticket.status === (where.status as { not: string }).not) {
      return false;
    }

    if (where.assigneeAdminId === null && ticket.assigneeAdminId !== null) {
      return false;
    }

    return true;
  }

  const tx = {
    supportTicket: {
      async create({ data }: { data: Record<string, unknown> }) {
        ticketCounter += 1;
        const row = {
          id: `ticket-${ticketCounter}`,
          ...data,
          requesterUserId: (data.requesterUserId as string | null | undefined) ?? null,
          assigneeAdminId: (data.assigneeAdminId as string | null | undefined) ?? null,
          archivedAt: (data.archivedAt as Date | null | undefined) ?? null,
          resolvedAt: (data.resolvedAt as Date | null | undefined) ?? null,
          createdAt: (data.createdAt as Date | undefined) ?? now,
          updatedAt: now
        } as FakeTicket;
        tickets.push(row);
        return hydrateTicket(row);
      },
      async findUnique({ where }: { where: { id: string } }) {
        const row = tickets.find((ticket) => ticket.id === where.id);
        return row ? hydrateTicket(row) : null;
      },
      async update({ where, data }: { where: { id: string }; data: Record<string, unknown> }) {
        const index = tickets.findIndex((ticket) => ticket.id === where.id);

        if (index < 0) {
          throw new Error("Support ticket not found in fake transaction.");
        }

        tickets[index] = {
          ...tickets[index],
          ...data,
          updatedAt: now
        } as FakeTicket;

        return hydrateTicket(tickets[index]);
      },
      async findMany({ where = {} }: { where?: Record<string, unknown> } = {}) {
        return tickets.filter((ticket) => matchesWhere(ticket, where)).map(hydrateTicket);
      }
    },
    supportTicketNote: {
      async create({ data }: { data: Record<string, unknown> }) {
        noteCounter += 1;
        const row = {
          id: `note-${noteCounter}`,
          ...data,
          createdByAdminId: (data.createdByAdminId as string | null | undefined) ?? null,
          createdAt: (data.createdAt as Date | undefined) ?? now,
          updatedAt: now
        } as FakeNote;
        notes.push(row);
        return {
          ...row,
          createdByAdmin: row.createdByAdminId ? actors[row.createdByAdminId] ?? null : null
        };
      }
    },
    adminAuditEvent: {
      async create({ data }: { data: Record<string, unknown> }) {
        const row = {
          id: `audit-${audits.length + 1}`,
          ...data,
          actorAdminUser: data.actorAdminUserId ? actors[data.actorAdminUserId as string] ?? null : null,
          createdAt: data.createdAt ?? now
        };
        audits.push(row);
        return row;
      }
    }
  } as unknown as UseravaaTransactionClient;

  return {
    tx,
    tickets,
    notes,
    audits,
    runInTransaction: async <T,>(operation: (transaction: UseravaaTransactionClient) => Promise<T>) => operation(tx)
  };
}

describe("Checkpoint 3A-11 admin support inbox foundation", () => {
  it("adds additive SupportTicket schema and migration", () => {
    const schema = readProjectFile("prisma/schema.prisma");
    const migration = readProjectFile("prisma/migrations/20260620090000_admin_support_inbox/migration.sql");

    expect(schema).toContain("model SupportTicket");
    expect(schema).toContain("model SupportTicketNote");
    expect(schema).toContain("enum SupportTicketStatus");
    expect(schema).toContain("enum SupportRelatedEntityType");
    expect(migration).toContain("CREATE TABLE \"SupportTicket\"");
    expect(migration).toContain("CREATE TABLE \"SupportTicketNote\"");
    expect(migration).not.toMatch(/DROP TABLE|TRUNCATE|DELETE FROM|ALTER TABLE \"(Payment|ConversationRequest|Wallet|Cancellation|AdminAuditEvent)\" DROP/i);
  });

  it("guards support admin pages and APIs and classifies endpoints", () => {
    const listPage = readProjectFile("src/app/admin/support/page.tsx");
    const detailPage = readProjectFile("src/app/admin/support/[ticketId]/page.tsx");
    const listRoute = readProjectFile("src/app/api/admin/support/route.ts");
    const detailRoute = readProjectFile("src/app/api/admin/support/[ticketId]/route.ts");
    const assignRoute = readProjectFile("src/app/api/admin/support/[ticketId]/assign/route.ts");
    const notesRoute = readProjectFile("src/app/api/admin/support/[ticketId]/notes/route.ts");
    const resolveRoute = readProjectFile("src/app/api/admin/support/[ticketId]/resolve/route.ts");
    const reopenRoute = readProjectFile("src/app/api/admin/support/[ticketId]/reopen/route.ts");
    const archiveRoute = readProjectFile("src/app/api/admin/support/[ticketId]/archive/route.ts");
    const endpointClassification = readProjectFile("src/lib/backend/endpoint-classification.ts");

    expect(listPage).toContain("requireAdminPageAccess");
    expect(listPage).toContain("getAdminSupportRouteData");
    expect(detailPage).toContain("requireAdminPageAccess");
    expect(detailPage).toContain("getAdminSupportDetailRouteData");
    [listRoute, detailRoute, assignRoute, notesRoute, resolveRoute, reopenRoute, archiveRoute].forEach((source) => {
      expect(source).toContain("requireAdminViewer");
    });
    expect(endpointClassification).toContain("POST /api/admin/support");
    expect(endpointClassification).toContain("PATCH /api/admin/support/[ticketId]");
    expect(endpointClassification).toContain("POST /api/admin/support/[ticketId]/resolve");
    expect(projectFileExists("src/app/admin/support/[ticketId]/page.tsx")).toBe(true);
  });

  it("validates support payloads strictly and rejects dangerous privileged fields", () => {
    expect(adminSupportTicketCreateSchema.safeParse(validTicketPayload()).success).toBe(true);
    expect(adminSupportTicketCreateSchema.safeParse(validTicketPayload({ actorAdminUserId: "spoofed" })).success).toBe(false);
    expect(adminSupportTicketCreateSchema.safeParse(validTicketPayload({ ticketNumber: "SUP-SPOOF" })).success).toBe(false);
    expect(adminSupportTicketCreateSchema.safeParse(validTicketPayload({ createdAt: now.toISOString() })).success).toBe(false);
    expect(adminSupportTicketCreateSchema.safeParse(validTicketPayload({ paymentStatus: "PAID" })).success).toBe(false);
    expect(adminSupportTicketCreateSchema.safeParse(validTicketPayload({ walletBalanceToman: 1 })).success).toBe(false);
    expect(adminSupportTicketCreateSchema.safeParse(validTicketPayload({ conversationStatus: "SCHEDULED" })).success).toBe(false);
    expect(adminSupportTicketUpdateSchema.safeParse({ status: "IN_PROGRESS" }).success).toBe(true);
    expect(adminSupportTicketUpdateSchema.safeParse({}).success).toBe(false);
    expect(adminSupportTicketUpdateSchema.safeParse({ archivedAt: now.toISOString() }).success).toBe(false);
    expect(adminSupportTicketAssignSchema.safeParse({ assigneeAdminId: "support-1" }).success).toBe(true);
    expect(adminSupportTicketNoteCreateSchema.safeParse({ body: "internal note", noteType: "INTERNAL" }).success).toBe(true);
    expect(adminSupportTicketResolveSchema.safeParse({ resolutionSummary: "حل شد", resolutionReason: "پرداخت بررسی شد" }).success).toBe(true);
    expect(adminSupportTicketReopenSchema.safeParse({ reason: "پیگیری دوباره لازم است" }).success).toBe(true);
    expect(adminSupportTicketArchiveSchema.safeParse({ reason: "بسته شد", auditOverride: true }).success).toBe(false);
  });

  it("renders support inbox/detail without fake rows and links to official admin pages", () => {
    const item = ticketItem();
    const html = renderToStaticMarkup(
      <AdminSupportInbox
        data={{
          items: [item],
          metrics: [{ id: "support-open", label: "تیکت‌های باز", value: "۱", helper: "بدون ردیف نمایشی", href: "/admin/support", source: "backend_repository" }],
          queueOptions: [{ label: "همه فعال‌ها", value: "", href: "/admin/support", active: true }],
          statusOptions: [{ label: "همه وضعیت‌ها", value: "", href: "/admin/support", active: true }],
          priorityOptions: [{ label: "همه اولویت‌ها", value: "", href: "/admin/support", active: true }],
          categoryOptions: [{ label: "همه دسته‌ها", value: "", href: "/admin/support", active: true }],
          sourceOptions: [{ label: "همه منابع", value: "", href: "/admin/support", active: true }],
          relatedEntityOptions: [{ label: "همه ارتباط‌ها", value: "", href: "/admin/support", active: true }],
          activeFilters: { view: "", status: "", priority: "", category: "", source: "", relatedEntityType: "", assignee: "", search: "" },
          source: "backend_repository",
          sourceNote: "repository-backed",
          viewerCanCreate: true,
          viewerCanMutate: true,
          viewerCanArchive: true,
          viewerId: "admin-1"
        }}
      />
    );

    expect(html).toContain("صندوق پشتیبانی");
    expect(html).toContain("پیگیری پرداخت دستی");
    expect(html).toContain("/admin/payments/payment-1");
    expect(html).toContain("تیکت تازه");

    const emptyHtml = renderToStaticMarkup(
      <AdminSupportInbox
        data={{
          items: [],
          metrics: [],
          queueOptions: [],
          statusOptions: [],
          priorityOptions: [],
          categoryOptions: [],
          sourceOptions: [],
          relatedEntityOptions: [],
          activeFilters: { view: "", status: "", priority: "", category: "", source: "", relatedEntityType: "", assignee: "", search: "" },
          source: "placeholder",
          sourceNote: "placeholder",
          viewerCanCreate: false,
          viewerCanMutate: false,
          viewerCanArchive: false,
          viewerId: "support-1"
        }}
      />
    );
    expect(emptyHtml).toContain("تیکتی برای نمایش نیست");
    expect(emptyHtml).toContain("ردیف نمایشی نشان نمی‌دهد");
    expect(getPlaceholderData("support").items).toEqual([]);

    const detailHtml = renderToStaticMarkup(
      <AdminSupportDetail
        data={{
          item,
          source: "backend_repository",
          sourceNote: "repository-backed",
          viewerCanCreate: true,
          viewerCanMutate: true,
          viewerCanArchive: true,
          viewerId: "admin-1"
        }}
      />
    );

    expect(detailHtml).toContain("جزئیات تیکت پشتیبانی");
    expect(detailHtml).toContain("یادداشت داخلی برای پیگیری");
    expect(detailHtml).toContain("ثبت تیکت پشتیبانی");
    expect(detailHtml).toContain("برای پرداخت، لغو، کیف پول یا گفت‌وگو از لینک موجودیت مرتبط استفاده کنید");
  });

  it("creates, updates, assigns, notes, resolves, reopens, archives, and audits support tickets", async () => {
    const fake = createFakeSupportTransaction();
    const admin = { id: "admin-1", role: "ADMIN" };
    const support = { id: "support-1", role: "SUPPORT" };
    const user = { id: "user-1", role: "USER" };

    const supportCreated = await adminSupportService.create(support, validTicketPayload({ subject: "تیکت پشتیبانی" }), {
      now: () => now,
      ticketNumberGenerator: () => "SUP-SUPPORT",
      runInTransaction: fake.runInTransaction
    });
    expect(supportCreated).toMatchObject({ ok: true });
    expect(fake.audits[0]).toMatchObject({
      actorAdminUserId: "support-1",
      actorRole: "SUPPORT",
      action: "SUPPORT_TICKET_CREATED",
      entityType: "SUPPORT_TICKET"
    });

    await expect(adminSupportService.create(user, validTicketPayload(), { runInTransaction: fake.runInTransaction })).resolves.toMatchObject({
      ok: false,
      code: "unauthorized"
    });

    const created = await adminSupportService.create(admin, validTicketPayload(), {
      now: () => now,
      ticketNumberGenerator: () => "SUP-ADMIN",
      runInTransaction: fake.runInTransaction
    });

    if (!created.ok) {
      throw new Error("support create failed");
    }

    const updated = await adminSupportService.update(
      admin,
      created.data.id,
      { status: "IN_PROGRESS", priority: "URGENT", category: "PAYMENT" },
      { now: () => now, runInTransaction: fake.runInTransaction }
    );
    expect(updated).toMatchObject({ ok: true });
    expect(fake.audits.at(-1)).toMatchObject({ action: "SUPPORT_TICKET_STATUS_CHANGED" });

    const supportAssignOther = await adminSupportService.assign(
      support,
      created.data.id,
      { assigneeAdminId: "admin-1" },
      { now: () => now, runInTransaction: fake.runInTransaction }
    );
    expect(supportAssignOther).toMatchObject({ ok: false, code: "unauthorized" });

    const supportAssignSelf = await adminSupportService.assign(
      support,
      created.data.id,
      { assigneeAdminId: "support-1" },
      { now: () => now, runInTransaction: fake.runInTransaction }
    );
    expect(supportAssignSelf).toMatchObject({ ok: true });
    expect(fake.audits.at(-1)).toMatchObject({ action: "SUPPORT_TICKET_ASSIGNED" });

    const noted = await adminSupportService.addNote(
      support,
      created.data.id,
      { body: "یادداشت داخلی", noteType: "INTERNAL" },
      { now: () => now, runInTransaction: fake.runInTransaction }
    );
    expect(noted).toMatchObject({ ok: true });
    expect(fake.notes).toHaveLength(1);
    expect(fake.audits.at(-1)).toMatchObject({ action: "SUPPORT_TICKET_NOTE_ADDED" });

    await expect(
      adminSupportService.archive(support, created.data.id, { reason: "bad" }, { now: () => now, runInTransaction: fake.runInTransaction })
    ).resolves.toMatchObject({ ok: false, code: "unauthorized" });

    const resolved = await adminSupportService.resolve(
      admin,
      created.data.id,
      { resolutionSummary: "پرداخت بررسی شد", resolutionReason: "رسید بررسی شد", internalNote: "close" },
      { now: () => now, runInTransaction: fake.runInTransaction }
    );
    expect(resolved).toMatchObject({ ok: true });
    expect(fake.tickets.find((ticket) => ticket.id === created.data.id)).toMatchObject({
      status: "RESOLVED",
      resolvedAt: now
    });
    expect(fake.audits.at(-1)).toMatchObject({ action: "SUPPORT_TICKET_RESOLVED" });

    const reopened = await adminSupportService.reopen(
      admin,
      created.data.id,
      { reason: "نیازمند پیگیری دوباره", internalNote: "reopen" },
      { now: () => now, runInTransaction: fake.runInTransaction }
    );
    expect(reopened).toMatchObject({ ok: true });
    expect(fake.tickets.find((ticket) => ticket.id === created.data.id)).toMatchObject({
      status: "OPEN",
      resolvedAt: null,
      resolutionSummary: null,
      resolutionReason: null
    });
    expect(fake.audits.at(-1)).toMatchObject({ action: "SUPPORT_TICKET_REOPENED" });

    const archived = await adminSupportService.archive(
      admin,
      created.data.id,
      { reason: "بسته شد", internalNote: "archive" },
      { now: () => now, runInTransaction: fake.runInTransaction }
    );
    expect(archived).toMatchObject({ ok: true });
    expect(fake.tickets.find((ticket) => ticket.id === created.data.id)).toMatchObject({
      status: "ARCHIVED",
      archivedAt: now
    });
    expect(fake.audits.at(-1)).toMatchObject({ action: "SUPPORT_TICKET_ARCHIVED" });

    const openList = await useravaaRepository.adminSupport.listSupportTickets({}, fake.tx as never);
    expect(openList.ok && openList.data.some((ticket) => ticket.id === created.data.id)).toBe(false);
    const archivedList = await useravaaRepository.adminSupport.listSupportTickets({ status: "ARCHIVED" }, fake.tx as never);
    expect(archivedList.ok && archivedList.data.some((ticket) => ticket.id === created.data.id)).toBe(true);
  });

  it("keeps support inbox scoped away from lifecycle mutation, lead mutation, and notification/email sending", () => {
    const servicesSource = readProjectFile("src/lib/backend/services.ts");
    const supportServiceSource = servicesSource.slice(
      servicesSource.indexOf("export const adminSupportService"),
      servicesSource.indexOf("export const adminContentService")
    );
    const combined = [
      readProjectFile("src/lib/backend/repositories/admin-support.ts"),
      supportServiceSource,
      readProjectFile("src/features/v51/admin/server-data.ts"),
      readProjectFile("src/features/v51/admin/AdminSurfaces.tsx"),
      readProjectFile("src/features/v51/admin/AdminSupportActions.tsx")
    ].join("\n");

    expect(combined).toContain("SUPPORT_TICKET_CREATED");
    expect(combined).toContain("SUPPORT_TICKET_RESOLVED");
    expect(combined).toContain("PUBLIC_DRAFT فقط پیش‌نویس است");
    expect(combined).not.toContain("getConversationOrFallback");
    expect(combined).not.toMatch(/\.(payment|walletTransaction|conversationRequest|cancellation|attendanceVerification)\.(create|update|upsert|delete|deleteMany)\(/);
    expect(combined).not.toMatch(/\.(notification|email|mail|lead)\.(create|update|send|upsert|delete)/i);
    expect(readProjectFile("prisma/schema.prisma")).toContain("model Lead");
    expect(projectFileExists("src/app/admin/leads/page.tsx")).toBe(true);
    expect(projectFileExists("src/app/api/admin/support/public/route.ts")).toBe(false);
  });

  it("runs rollback-backed DB smoke coverage for support tickets when enabled", async () => {
    if (process.env.USERAVAA_DB_SMOKE_TEST !== "1") {
      expect(process.env.USERAVAA_DB_SMOKE_TEST).not.toBe("1");
      return;
    }

    class SmokeRollback extends Error {
      constructor(readonly summary: Record<string, unknown>) {
        super("ADMIN_SUPPORT_SMOKE_ROLLBACK");
      }
    }

    const prisma = getPrismaClient();
    const unique = `support-smoke-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const adminId = `${unique}-admin`;
    const supportId = `${unique}-support`;
    const requesterId = `${unique}-requester`;
    let ticketId = "";
    let summary: Record<string, unknown> | null = null;

    try {
      await prisma.$transaction(async (tx) => {
        await tx.user.createMany({
          data: [
            { id: adminId, role: "ADMIN", email: `${adminId}@smoke.useravaa.test`, displayName: "Support Smoke Admin", createdAt: now },
            { id: supportId, role: "SUPPORT", email: `${supportId}@smoke.useravaa.test`, displayName: "Support Smoke Operator", createdAt: now },
            { id: requesterId, role: "USER", email: `${requesterId}@smoke.useravaa.test`, displayName: "Support Smoke User", createdAt: now }
          ]
        });
        const beforeCounts = {
          payments: await tx.payment.count(),
          walletTransactions: await tx.walletTransaction.count(),
          conversations: await tx.conversationRequest.count(),
          cancellations: await tx.cancellation.count()
        };
        const runInTransaction = async <T,>(operation: (transaction: UseravaaTransactionClient) => Promise<T>) =>
          operation(tx as unknown as UseravaaTransactionClient);
        const admin = { id: adminId, role: "ADMIN" };
        const created = await adminSupportService.create(
          admin,
          validTicketPayload({
            subject: `${unique} support ticket`,
            requesterUserId: requesterId,
            relatedEntityType: "USER",
            relatedEntityId: requesterId
          }),
          {
            now: () => now,
            ticketNumberGenerator: () => `SUP-${unique}`,
            runInTransaction
          }
        );

        if (!created.ok) {
          throw new Error("Support smoke create failed.");
        }

        ticketId = created.data.id;
        const updated = await adminSupportService.update(
          admin,
          created.data.id,
          { status: "IN_PROGRESS", priority: "URGENT", category: "ACCOUNT_AUTH" },
          { now: () => now, runInTransaction }
        );
        const assigned = await adminSupportService.assign(
          admin,
          created.data.id,
          { assigneeAdminId: supportId },
          { now: () => now, runInTransaction }
        );
        const noted = await adminSupportService.addNote(
          { id: supportId, role: "SUPPORT" },
          created.data.id,
          { body: "smoke note", noteType: "INTERNAL" },
          { now: () => now, runInTransaction }
        );
        const supportArchive = await adminSupportService.archive(
          { id: supportId, role: "SUPPORT" },
          created.data.id,
          { reason: "not allowed" },
          { now: () => now, runInTransaction }
        );
        const resolved = await adminSupportService.resolve(
          admin,
          created.data.id,
          { resolutionSummary: "resolved", resolutionReason: "smoke resolution" },
          { now: () => now, runInTransaction }
        );
        const reopened = await adminSupportService.reopen(
          admin,
          created.data.id,
          { reason: "smoke reopen" },
          { now: () => now, runInTransaction }
        );
        const archived = await adminSupportService.archive(
          admin,
          created.data.id,
          { reason: "smoke archive" },
          { now: () => now, runInTransaction }
        );
        const requesterStillExists = await tx.user.findUnique({ where: { id: requesterId }, select: { id: true } });
        const afterCounts = {
          payments: await tx.payment.count(),
          walletTransactions: await tx.walletTransaction.count(),
          conversations: await tx.conversationRequest.count(),
          cancellations: await tx.cancellation.count()
        };
        const auditActions = await tx.adminAuditEvent.findMany({
          where: {
            entityType: "SUPPORT_TICKET",
            entityId: created.data.id
          },
          select: { action: true },
          orderBy: { createdAt: "asc" }
        });

        throw new SmokeRollback({
          updated: updated.ok && updated.data.priority === "URGENT",
          assigned: assigned.ok && assigned.data.assigneeAdminId === supportId,
          noted: noted.ok && noted.data.notes.length === 1,
          supportArchiveDenied: !supportArchive.ok && supportArchive.code === "unauthorized",
          resolved: resolved.ok && Boolean(resolved.data.resolvedAt),
          reopened: reopened.ok && reopened.data.resolvedAt === null,
          archived: archived.ok && archived.data.status === "ARCHIVED",
          requesterStillExists: Boolean(requesterStillExists),
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
      updated: true,
      assigned: true,
      noted: true,
      supportArchiveDenied: true,
      resolved: true,
      reopened: true,
      archived: true,
      requesterStillExists: true,
      operationalCountsUnchanged: true
    });
    expect(summary?.auditActions).toEqual([
      "SUPPORT_TICKET_CREATED",
      "SUPPORT_TICKET_STATUS_CHANGED",
      "SUPPORT_TICKET_ASSIGNED",
      "SUPPORT_TICKET_NOTE_ADDED",
      "SUPPORT_TICKET_RESOLVED",
      "SUPPORT_TICKET_REOPENED",
      "SUPPORT_TICKET_ARCHIVED"
    ]);
    await expect(prisma.supportTicket.findUnique({ where: { id: ticketId } })).resolves.toBeNull();
    await expect(prisma.user.findUnique({ where: { id: adminId } })).resolves.toBeNull();
    await prisma.$disconnect();
  }, 35_000);
});
