import fs from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AdminLeadDetail, AdminLeadInbox } from "@/features/v51/admin/AdminSurfaces";
import { adminRoutePatterns } from "@/features/v51/admin/navigation";
import { buildLeadImportTemplateCsv, parseLeadImportCsv } from "@/lib/backend/lead-import";
import { getPrismaClient } from "@/lib/backend/db/prisma";
import type { UseravaaTransactionClient } from "@/lib/backend/db/transaction";
import { apiEndpointPersistenceClassification } from "@/lib/backend/endpoint-classification";
import { backendImplementationClassification } from "@/lib/backend/implementation-classification";
import { useravaaRepository } from "@/lib/backend/repository";
import { adminLeadService } from "@/lib/backend/services";
import {
  adminLeadArchiveSchema,
  adminLeadAssignSchema,
  adminLeadCreateSchema,
  adminLeadFollowUpCompleteSchema,
  adminLeadFollowUpScheduleSchema,
  adminLeadLostSchema,
  adminLeadNoteCreateSchema,
  adminLeadReopenSchema,
  adminLeadTagAddSchema,
  adminLeadUpdateSchema
} from "@/lib/backend/validation";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn()
  })
}));

const projectRoot = process.cwd();
const now = new Date("2026-06-20T10:00:00.000Z");

function readProjectFile(relativePath: string) {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

function projectFileExists(relativePath: string) {
  return fs.existsSync(path.join(projectRoot, relativePath));
}

function validLeadPayload(overrides: Record<string, unknown> = {}) {
  return {
    firstName: "علی",
    lastName: "رضایی",
    phone: "+989121111111",
    email: "ALI@example.com",
    lastCompany: "یوزراوا",
    jobTitle: "مدیر محصول",
    jobCategory: "محصول",
    yearsOfExperience: 8,
    leadType: "REQUESTER_LEAD",
    temperature: "HOT",
    stage: "NEW",
    source: "ADMIN_CREATED",
    tags: ["پرداخت", "درخواست‌کننده"],
    notes: "سرنخ داخلی برای پیگیری رشد.",
    intentSummary: "نیاز به گفت‌وگو با تجربه‌آفرین دارد.",
    blocker: "نیاز به اعتماد بیشتر",
    score: 80,
    ...overrides
  };
}

function leadItem(overrides: Record<string, unknown> = {}) {
  return {
    id: "lead-1",
    leadNumber: "LEAD-1",
    fullName: "علی رضایی",
    phone: "+989121111111",
    email: "ali@example.com",
    contactSummary: "+989121111111 / ali@example.com",
    companySummary: "یوزراوا",
    jobTitle: "مدیر محصول",
    jobCategory: "محصول",
    yearsOfExperienceLabel: "۸ سال",
    leadType: "REQUESTER_LEAD",
    leadTypeLabel: "سرنخ درخواست‌کننده",
    temperature: "HOT",
    temperatureLabel: "داغ",
    stage: "FOLLOW_UP",
    stageLabel: "پیگیری بعدی",
    sourceCode: "ADMIN_CREATED",
    sourceLabel: "ساخته‌شده توسط ادمین",
    ownerSummary: "Admin · admin-1",
    ownerAdminId: "admin-1",
    relatedUserHref: "/admin/users/user-1",
    relatedConversationHref: "/admin/conversations/conversation-1",
    relatedProfileHref: "/admin/experience-profiles/profile-1",
    relatedInsightHref: "/admin/insights/insight-1",
    relatedSummary: "کاربر: علی / گفت‌وگو: ورود به محصول",
    intentSummary: "نیاز به گفت‌وگو با تجربه‌آفرین دارد.",
    blocker: "نیاز به اعتماد بیشتر",
    notes: "یادداشت پایه",
    scoreValue: 80,
    scoreLabel: "80",
    lastContactedAt: now.toISOString(),
    nextFollowUpAt: now.toISOString(),
    followUpCountLabel: "۱",
    lastFollowUpOutcome: "علاقه‌مند",
    convertedAt: "ثبت نشده",
    lostAt: "ثبت نشده",
    lostReason: "ثبت نشده",
    archivedAt: "ثبت نشده",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    href: "/admin/leads/lead-1",
    source: "backend_repository" as const,
    actionsAvailable: true,
    tags: [{ id: "assignment-1", tagId: "tag-1", name: "پرداخت", normalizedName: "پرداخت" }],
    leadNotes: [{ id: "note-1", body: "یادداشت داخلی", noteType: "INTERNAL", createdBySummary: "Admin · admin-1", createdAt: now.toISOString() }],
    followUps: [
      {
        id: "follow-1",
        channel: "PHONE",
        channelLabel: "تلفن",
        scheduledAt: now.toISOString(),
        completedAt: "ثبت نشده",
        outcome: "",
        outcomeLabel: "ثبت نشده",
        summary: "تماس اول",
        createdBySummary: "Admin · admin-1",
        completedBySummary: "ثبت نشده"
      }
    ],
    auditItems: [
      {
        id: "audit-1",
        actorSummary: "Admin · ADMIN",
        actionLabel: "ثبت سرنخ",
        entitySummary: "LEAD · lead-1",
        statusChange: "ثبت نشده → FOLLOW_UP",
        reason: "ثبت نشده",
        note: "ثبت نشده",
        createdAt: now.toISOString(),
        leadHref: "/admin/leads/lead-1",
        source: "backend_repository" as const
      }
    ],
    ...overrides
  };
}

function createFakeLeadTransaction() {
  type FakeLead = Record<string, unknown> & {
    id: string;
    leadNumber: string;
    firstName: string;
    lastName: string;
    normalizedEmail: string | null;
    normalizedPhone: string | null;
    stage: string;
    temperature: string;
    source: string;
    ownerAdminId: string | null;
    archivedAt: Date | null;
    followUpCount: number;
    createdAt: Date;
    updatedAt: Date;
  };
  type FakeTag = { id: string; name: string; normalizedName: string; createdAt: Date; updatedAt: Date };
  type FakeAssignment = { id: string; leadId: string; tagId: string; createdByAdminId: string | null; createdAt: Date };
  type FakeNote = { id: string; leadId: string; body: string; noteType: string; createdByAdminId: string | null; createdAt: Date; updatedAt: Date };
  type FakeFollowUp = {
    id: string;
    leadId: string;
    channel: string;
    scheduledAt: Date;
    completedAt: Date | null;
    outcome: string | null;
    summary: string | null;
    createdByAdminId: string | null;
    completedByAdminId: string | null;
    createdAt: Date;
    updatedAt: Date;
  };

  const actors = {
    "admin-1": { id: "admin-1", displayName: "Admin", email: "admin@example.test", role: "ADMIN" },
    "support-1": { id: "support-1", displayName: "Support", email: "support@example.test", role: "SUPPORT" },
    "support-2": { id: "support-2", displayName: "Support Two", email: "support2@example.test", role: "SUPPORT" },
    "user-1": { id: "user-1", displayName: "User", email: "user@example.test", role: "USER" }
  } as Record<string, { id: string; displayName: string; email: string; role: string }>;
  const leads: FakeLead[] = [];
  const tags: FakeTag[] = [];
  const assignments: FakeAssignment[] = [];
  const notes: FakeNote[] = [];
  const followUps: FakeFollowUp[] = [];
  const audits: Record<string, unknown>[] = [];
  let leadCounter = 0;
  let tagCounter = 0;
  let assignmentCounter = 0;
  let noteCounter = 0;
  let followUpCounter = 0;

  function hydrateLead(lead: FakeLead) {
    return {
      ...lead,
      phone: lead.phone ?? null,
      email: lead.email ?? null,
      lastCompany: lead.lastCompany ?? null,
      jobTitle: lead.jobTitle ?? null,
      jobCategory: lead.jobCategory ?? null,
      jobCategoryId: lead.jobCategoryId ?? null,
      yearsOfExperience: lead.yearsOfExperience ?? null,
      leadType: lead.leadType ?? "GENERAL_LEAD",
      notes: lead.notes ?? null,
      relatedUserId: lead.relatedUserId ?? null,
      relatedConversationId: lead.relatedConversationId ?? null,
      relatedProfileId: lead.relatedProfileId ?? null,
      relatedInsightId: lead.relatedInsightId ?? null,
      intentSummary: lead.intentSummary ?? null,
      blocker: lead.blocker ?? null,
      score: lead.score ?? null,
      lastContactedAt: lead.lastContactedAt ?? null,
      nextFollowUpAt: lead.nextFollowUpAt ?? null,
      lastFollowUpOutcome: lead.lastFollowUpOutcome ?? null,
      convertedAt: lead.convertedAt ?? null,
      lostAt: lead.lostAt ?? null,
      lostReason: lead.lostReason ?? null,
      ownerAdmin: lead.ownerAdminId ? actors[lead.ownerAdminId] ?? null : null,
      relatedUser: lead.relatedUserId ? actors[lead.relatedUserId as string] ?? null : null,
      relatedConversation: lead.relatedConversationId
        ? { id: lead.relatedConversationId, requestTopic: "ورود به محصول", status: "CREATED" }
        : null,
      relatedProfile: lead.relatedProfileId ? { id: lead.relatedProfileId, displayName: "تجربه‌آفرین", roleTitle: "مدیر محصول" } : null,
      relatedInsight: lead.relatedInsightId ? { id: lead.relatedInsightId, slug: "insight", title: "بینش" } : null,
      jobCategoryRecord: null,
      tagAssignments: assignments
        .filter((assignment) => assignment.leadId === lead.id)
        .map((assignment) => ({
          ...assignment,
          tag: tags.find((tag) => tag.id === assignment.tagId),
          createdByAdmin: assignment.createdByAdminId ? actors[assignment.createdByAdminId] ?? null : null
        })),
      leadNotes: notes
        .filter((note) => note.leadId === lead.id)
        .map((note) => ({
          ...note,
          createdByAdmin: note.createdByAdminId ? actors[note.createdByAdminId] ?? null : null
        })),
      followUps: followUps
        .filter((followUp) => followUp.leadId === lead.id)
        .map((followUp) => ({
          ...followUp,
          createdByAdmin: followUp.createdByAdminId ? actors[followUp.createdByAdminId] ?? null : null,
          completedByAdmin: followUp.completedByAdminId ? actors[followUp.completedByAdminId] ?? null : null
        }))
    };
  }

  const tx = {
    lead: {
      async create({ data }: { data: Record<string, unknown> }) {
        leadCounter += 1;
        const row = {
          id: `lead-${leadCounter}`,
          ...data,
          ownerAdminId: (data.ownerAdminId as string | null | undefined) ?? null,
          normalizedEmail: (data.normalizedEmail as string | null | undefined) ?? null,
          normalizedPhone: (data.normalizedPhone as string | null | undefined) ?? null,
          archivedAt: (data.archivedAt as Date | null | undefined) ?? null,
          followUpCount: (data.followUpCount as number | undefined) ?? 0,
          createdAt: (data.createdAt as Date | undefined) ?? now,
          updatedAt: now
        } as FakeLead;
        leads.push(row);
        return hydrateLead(row);
      },
      async findUnique({ where }: { where: { id: string } }) {
        const row = leads.find((lead) => lead.id === where.id);
        return row ? hydrateLead(row) : null;
      },
      async findFirst({ where }: { where: { OR?: Record<string, string>[] } }) {
        const row = leads.find((lead) =>
          (where.OR ?? []).some((condition) =>
            ("normalizedEmail" in condition && lead.normalizedEmail === condition.normalizedEmail) ||
            ("normalizedPhone" in condition && lead.normalizedPhone === condition.normalizedPhone)
          )
        );
        return row ? hydrateLead(row) : null;
      },
      async findMany() {
        return leads.map(hydrateLead);
      },
      async update({ where, data }: { where: { id: string }; data: Record<string, unknown> }) {
        const index = leads.findIndex((lead) => lead.id === where.id);

        if (index < 0) {
          throw new Error("Lead not found in fake transaction.");
        }

        leads[index] = { ...leads[index], ...data, updatedAt: now } as FakeLead;
        return hydrateLead(leads[index]);
      }
    },
    leadTag: {
      async upsert({ where, create, update }: { where: { normalizedName: string }; create: Record<string, unknown>; update: Record<string, unknown> }) {
        const existing = tags.find((tag) => tag.normalizedName === where.normalizedName);

        if (existing) {
          Object.assign(existing, update, { updatedAt: now });
          return existing;
        }

        tagCounter += 1;
        const row = {
          id: `tag-${tagCounter}`,
          name: create.name as string,
          normalizedName: create.normalizedName as string,
          createdAt: now,
          updatedAt: now
        };
        tags.push(row);
        return row;
      }
    },
    leadTagAssignment: {
      async upsert({ where, create }: { where: { leadId_tagId: { leadId: string; tagId: string } }; create: Record<string, unknown> }) {
        const existing = assignments.find(
          (assignment) => assignment.leadId === where.leadId_tagId.leadId && assignment.tagId === where.leadId_tagId.tagId
        );

        if (existing) {
          return {
            ...existing,
            tag: tags.find((tag) => tag.id === existing.tagId),
            createdByAdmin: existing.createdByAdminId ? actors[existing.createdByAdminId] ?? null : null
          };
        }

        assignmentCounter += 1;
        const row = {
          id: `assignment-${assignmentCounter}`,
          leadId: create.leadId as string,
          tagId: create.tagId as string,
          createdByAdminId: (create.createdByAdminId as string | null | undefined) ?? null,
          createdAt: now
        };
        assignments.push(row);
        return {
          ...row,
          tag: tags.find((tag) => tag.id === row.tagId),
          createdByAdmin: row.createdByAdminId ? actors[row.createdByAdminId] ?? null : null
        };
      },
      async deleteMany({ where }: { where: { leadId: string; tagId: string } }) {
        const before = assignments.length;
        for (let index = assignments.length - 1; index >= 0; index -= 1) {
          if (assignments[index].leadId === where.leadId && assignments[index].tagId === where.tagId) {
            assignments.splice(index, 1);
          }
        }
        return { count: before - assignments.length };
      }
    },
    leadNote: {
      async create({ data }: { data: Record<string, unknown> }) {
        noteCounter += 1;
        const row = {
          id: `note-${noteCounter}`,
          leadId: data.leadId as string,
          body: data.body as string,
          noteType: data.noteType as string,
          createdByAdminId: (data.createdByAdminId as string | null | undefined) ?? null,
          createdAt: now,
          updatedAt: now
        };
        notes.push(row);
        return { ...row, createdByAdmin: row.createdByAdminId ? actors[row.createdByAdminId] ?? null : null };
      }
    },
    leadFollowUp: {
      async create({ data }: { data: Record<string, unknown> }) {
        followUpCounter += 1;
        const row = {
          id: `follow-${followUpCounter}`,
          leadId: data.leadId as string,
          channel: data.channel as string,
          scheduledAt: data.scheduledAt as Date,
          completedAt: null,
          outcome: null,
          summary: (data.summary as string | null | undefined) ?? null,
          createdByAdminId: (data.createdByAdminId as string | null | undefined) ?? null,
          completedByAdminId: null,
          createdAt: now,
          updatedAt: now
        };
        followUps.push(row);
        return { ...row, createdByAdmin: row.createdByAdminId ? actors[row.createdByAdminId] ?? null : null, completedByAdmin: null };
      },
      async update({ where, data }: { where: { id: string }; data: Record<string, unknown> }) {
        const index = followUps.findIndex((followUp) => followUp.id === where.id);

        if (index < 0) {
          throw new Error("Follow-up not found in fake transaction.");
        }

        followUps[index] = { ...followUps[index], ...data, updatedAt: now } as FakeFollowUp;
        const row = followUps[index];
        return {
          ...row,
          createdByAdmin: row.createdByAdminId ? actors[row.createdByAdminId] ?? null : null,
          completedByAdmin: row.completedByAdminId ? actors[row.completedByAdminId] ?? null : null
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
    leads,
    audits,
    followUps,
    runInTransaction: async <T,>(operation: (transaction: UseravaaTransactionClient) => Promise<T>) => operation(tx)
  };
}

describe("Checkpoint 3A-12 admin lead inbox foundation", () => {
  it("adds additive lead schema, migration, repository, pages, and guarded API routes", () => {
    const schema = readProjectFile("prisma/schema.prisma");
    const migration = readProjectFile("prisma/migrations/20260620100000_admin_lead_inbox/migration.sql");

    ["LeadType", "LeadTemperature", "LeadStage", "LeadSource", "LeadFollowUpChannel", "LeadFollowUpOutcome"].forEach((token) => {
      expect(schema).toContain(`enum ${token}`);
      expect(migration).toContain(`CREATE TYPE "${token}"`);
    });

    ["model Lead", "model LeadTag", "model LeadTagAssignment", "model LeadNote", "model LeadFollowUp"].forEach((token) => {
      expect(schema).toContain(token);
    });

    expect(migration).not.toMatch(/\b(DROP|TRUNCATE|DELETE FROM)\b/i);
    expect(projectFileExists("src/lib/backend/repositories/admin-leads.ts")).toBe(true);
    expect(projectFileExists("src/app/admin/leads/page.tsx")).toBe(true);
    expect(projectFileExists("src/app/admin/leads/[leadId]/page.tsx")).toBe(true);

    expect(adminRoutePatterns).toContain("/admin/leads");
    expect(adminRoutePatterns).toContain("/admin/leads/[leadId]");

    [
      "src/app/admin/leads/page.tsx",
      "src/app/admin/leads/[leadId]/page.tsx"
    ].forEach((relativePath) => {
      expect(readProjectFile(relativePath)).toContain("requireAdminPageAccess");
    });

    [
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
      "src/app/api/admin/leads/import/route.ts",
      "src/app/api/admin/leads/import/template/route.ts"
    ].forEach((relativePath) => {
      expect(readProjectFile(relativePath), relativePath).toContain("requireAdminViewer");
    });
  });

  it("validates lead payloads strictly and protects privileged fields", () => {
    expect(adminLeadCreateSchema.safeParse(validLeadPayload()).success).toBe(true);
    expect(adminLeadCreateSchema.safeParse(validLeadPayload({ phone: null, email: null })).success).toBe(false);
    expect(adminLeadCreateSchema.safeParse(validLeadPayload({ actorAdminUserId: "admin-2" })).success).toBe(false);
    expect(adminLeadCreateSchema.safeParse(validLeadPayload({ createdAt: now.toISOString() })).success).toBe(false);
    expect(adminLeadUpdateSchema.safeParse({ temperature: "WARM", walletStatus: "PAID" }).success).toBe(false);
    expect(adminLeadAssignSchema.safeParse({ ownerAdminId: "support-1" }).success).toBe(true);
    expect(adminLeadNoteCreateSchema.safeParse({ body: "یادداشت داخلی" }).success).toBe(true);
    expect(adminLeadTagAddSchema.safeParse({ tag: "پرداخت" }).success).toBe(true);
    expect(adminLeadFollowUpScheduleSchema.safeParse({ channel: "PHONE", scheduledAt: now.toISOString() }).success).toBe(true);
    expect(adminLeadFollowUpCompleteSchema.safeParse({ outcome: "INTERESTED" }).success).toBe(true);
    expect(adminLeadLostSchema.safeParse({ lostReason: "نیاز ندارد" }).success).toBe(true);
    expect(adminLeadReopenSchema.safeParse({ reason: "پیگیری دوباره" }).success).toBe(true);
    expect(adminLeadArchiveSchema.safeParse({ reason: "تکراری" }).success).toBe(true);
  });

  it("renders DB-backed lead inbox and detail without fake fallback or support-ticket merging", () => {
    const item = leadItem();
    const inboxMarkup = renderToStaticMarkup(
      <AdminLeadInbox
        data={{
          items: [item],
          metrics: [{ id: "active-leads", label: "سرنخ‌های فعال", value: "۱", helper: "DB", href: "/admin/leads", source: "backend_repository" }],
          queueOptions: [],
          stageOptions: [],
          temperatureOptions: [],
          leadTypeOptions: [],
          sourceOptions: [],
          activeFilters: { view: "", stage: "", temperature: "", leadType: "", source: "", owner: "", search: "" },
          sourceNote: "repository",
          source: "backend_repository",
          viewerCanCreate: true,
          viewerCanMutate: true,
          viewerCanImport: true,
          viewerCanArchive: true,
          viewerId: "admin-1"
        }}
      />
    );
    const detailMarkup = renderToStaticMarkup(
      <AdminLeadDetail
        data={{
          item,
          sourceNote: "repository",
          source: "backend_repository",
          viewerCanCreate: true,
          viewerCanMutate: true,
          viewerCanImport: true,
          viewerCanArchive: true,
          viewerId: "admin-1"
        }}
      />
    );

    expect(inboxMarkup).toContain("صندوق سرنخ‌ها");
    expect(inboxMarkup).toContain("LEAD-1");
    expect(inboxMarkup).toContain("داده نمایشی جایگزین نمی‌شود");
    expect(detailMarkup).toContain("جزئیات سرنخ");
    expect(detailMarkup).toContain("یادداشت‌ها و پیگیری‌ها فقط داخلی هستند");
    expect(detailMarkup).toContain("/admin/conversations/conversation-1");
    expect(detailMarkup).toContain("سرنخ");
  });

  it("creates and updates leads with server-derived actor and audit events", async () => {
    const fake = createFakeLeadTransaction();
    const adminViewer = { id: "admin-1", role: "ADMIN" };

    const created = await adminLeadService.create(adminViewer, validLeadPayload(), {
      runInTransaction: fake.runInTransaction,
      now: () => now,
      leadNumberGenerator: () => "LEAD-TEST"
    });

    expect(created.ok).toBe(true);
    expect(fake.leads).toHaveLength(1);
    expect(fake.audits.map((event) => event.action)).toContain("LEAD_CREATED");
    expect(fake.audits[0]).toMatchObject({
      actorAdminUserId: "admin-1",
      entityType: "LEAD"
    });

    const duplicate = await adminLeadService.create(adminViewer, validLeadPayload({ firstName: "تکراری" }), {
      runInTransaction: fake.runInTransaction,
      now: () => now,
      leadNumberGenerator: () => "LEAD-DUP"
    });

    expect(duplicate.ok).toBe(false);
    expect(duplicate.ok ? "" : duplicate.code).toBe("validation_error");

    if (!created.ok) {
      throw new Error("Lead create unexpectedly failed.");
    }

    const updated = await adminLeadService.update(adminViewer, created.data.id, { temperature: "WARM", stage: "CONTACTED" }, {
      runInTransaction: fake.runInTransaction,
      now: () => now
    });

    expect(updated.ok).toBe(true);
    expect(fake.audits.map((event) => event.action)).toContain("LEAD_UPDATED");
  });

  it("enforces SUPPORT lead permissions and ADMIN-only close/archive actions", async () => {
    const fake = createFakeLeadTransaction();
    const adminViewer = { id: "admin-1", role: "ADMIN" };
    const supportViewer = { id: "support-1", role: "SUPPORT" };
    const created = await adminLeadService.create(adminViewer, validLeadPayload({ email: "permission@example.test", phone: "+989122222222" }), {
      runInTransaction: fake.runInTransaction,
      now: () => now,
      leadNumberGenerator: () => "LEAD-PERM"
    });

    if (!created.ok) {
      throw new Error("Lead create unexpectedly failed.");
    }

    await expect(
      adminLeadService.assign(supportViewer, created.data.id, { ownerAdminId: "support-2" }, { runInTransaction: fake.runInTransaction, now: () => now })
    ).resolves.toMatchObject({ ok: false, code: "unauthorized" });

    await expect(
      adminLeadService.assign(supportViewer, created.data.id, { ownerAdminId: "support-1" }, { runInTransaction: fake.runInTransaction, now: () => now })
    ).resolves.toMatchObject({ ok: true });

    await expect(
      adminLeadService.convert(supportViewer, created.data.id, {}, { runInTransaction: fake.runInTransaction, now: () => now })
    ).resolves.toMatchObject({ ok: false, code: "unauthorized" });

    await expect(
      adminLeadService.convert(adminViewer, created.data.id, { internalNote: "تبدیل شد" }, { runInTransaction: fake.runInTransaction, now: () => now })
    ).resolves.toMatchObject({ ok: true });

    expect(fake.audits.map((event) => event.action)).toContain("LEAD_ASSIGNED");
    expect(fake.audits.map((event) => event.action)).toContain("LEAD_CONVERTED");
  });

  it("supports lead notes, tags, follow-ups, lost, reopen, archive, and audit events without lifecycle mutation", async () => {
    const fake = createFakeLeadTransaction();
    const adminViewer = { id: "admin-1", role: "ADMIN" };
    const created = await adminLeadService.create(adminViewer, validLeadPayload({ email: "actions@example.test", phone: "+989123333333" }), {
      runInTransaction: fake.runInTransaction,
      now: () => now,
      leadNumberGenerator: () => "LEAD-ACTIONS"
    });

    if (!created.ok) {
      throw new Error("Lead create unexpectedly failed.");
    }

    await adminLeadService.addNote(adminViewer, created.data.id, { body: "یادداشت داخلی", noteType: "INTERNAL" }, { runInTransaction: fake.runInTransaction, now: () => now });
    await adminLeadService.addTag(adminViewer, created.data.id, { tag: "اعتماد" }, { runInTransaction: fake.runInTransaction, now: () => now });
    const scheduled = await adminLeadService.scheduleFollowUp(
      adminViewer,
      created.data.id,
      { channel: "PHONE", scheduledAt: now.toISOString(), summary: "تماس" },
      { runInTransaction: fake.runInTransaction, now: () => now }
    );

    expect(scheduled.ok).toBe(true);
    expect(fake.followUps).toHaveLength(1);

    await adminLeadService.completeFollowUp(
      adminViewer,
      created.data.id,
      fake.followUps[0].id,
      { outcome: "INTERESTED", summary: "علاقه‌مند" },
      { runInTransaction: fake.runInTransaction, now: () => now }
    );
    await adminLeadService.markLost(adminViewer, created.data.id, { lostReason: "فعلاً نیاز ندارد" }, { runInTransaction: fake.runInTransaction, now: () => now });
    await adminLeadService.reopen(adminViewer, created.data.id, { reason: "پیگیری دوباره" }, { runInTransaction: fake.runInTransaction, now: () => now });
    await adminLeadService.archive(adminViewer, created.data.id, { reason: "تکراری" }, { runInTransaction: fake.runInTransaction, now: () => now });

    expect(fake.audits.map((event) => event.action)).toEqual(
      expect.arrayContaining([
        "LEAD_NOTE_ADDED",
        "LEAD_TAG_ADDED",
        "LEAD_FOLLOW_UP_SCHEDULED",
        "LEAD_FOLLOW_UP_COMPLETED",
        "LEAD_MARKED_LOST",
        "LEAD_REOPENED",
        "LEAD_ARCHIVED"
      ])
    );

    const leadRepositorySource = readProjectFile("src/lib/backend/repositories/admin-leads.ts");
    expect(leadRepositorySource).not.toContain("payment.");
    expect(leadRepositorySource).not.toContain("wallet");
    expect(leadRepositorySource).not.toContain("supportTicket");
    expect(leadRepositorySource).not.toContain("conversationRequest.update");
  });

  it("provides exact CSV template, parses CSV safely, skips duplicates, and writes one import audit", async () => {
    expect(buildLeadImportTemplateCsv().trim()).toBe(
      "firstName,lastName,phone,email,lastCompany,jobTitle,jobCategory,yearsOfExperience,leadType,temperature,source,tags,notes,nextFollowUpAt,owner"
    );

    const parsed = parseLeadImportCsv(`${buildLeadImportTemplateCsv()}مریم,کاظمی,+989124444444,maryam@example.com,شرکت,طراح,طراحی,5,REQUESTER_LEAD,WARM,MANUAL_IMPORT,اعتماد;پرداخت,یادداشت,,admin-1\n`);

    expect(parsed.totalRows).toBe(1);
    expect(parsed.invalidRows).toBe(0);
    expect(parsed.rows[0].normalizedEmail).toBe("maryam@example.com");

    const fake = createFakeLeadTransaction();
    const adminViewer = { id: "admin-1", role: "ADMIN" };
    const csv = `${buildLeadImportTemplateCsv()}مریم,کاظمی,+989124444444,maryam@example.com,شرکت,طراح,طراحی,5,REQUESTER_LEAD,WARM,MANUAL_IMPORT,اعتماد;پرداخت,یادداشت,,admin-1\nمریم,کاظمی,+989124444444,maryam@example.com,شرکت,طراح,طراحی,5,REQUESTER_LEAD,WARM,MANUAL_IMPORT,اعتماد,یادداشت,,admin-1\n`;
    const result = await adminLeadService.importCsv(adminViewer, csv, { dryRun: false }, {
      runInTransaction: fake.runInTransaction,
      now: () => now,
      importIdGenerator: () => "lead-import-test"
    });

    expect(result.ok).toBe(true);
    expect(result.ok ? result.data : null).toMatchObject({
      totalRows: 2,
      imported: 1,
      skippedDuplicates: 1,
      invalidRows: 0
    });
    expect(fake.audits.filter((event) => event.action === "LEAD_IMPORT_COMPLETED")).toHaveLength(1);

    await expect(adminLeadService.importCsv({ id: "support-1", role: "SUPPORT" }, csv, { dryRun: false }, {
      runInTransaction: fake.runInTransaction,
      now: () => now
    })).resolves.toMatchObject({ ok: false, code: "unauthorized" });
  });

  it("classifies lead endpoints and implementation honestly", () => {
    expect(apiEndpointPersistenceClassification["GET /api/admin/leads"]).toMatchObject({
      classification: "read_only_persistent",
      requiresAdmin: true,
      usesRepository: true,
      writesImplemented: false
    });
    expect(apiEndpointPersistenceClassification["POST /api/admin/leads"]).toMatchObject({
      classification: "transaction_ready",
      writesImplemented: true
    });
    expect(apiEndpointPersistenceClassification["POST /api/admin/leads/import"]).toMatchObject({
      classification: "transaction_ready",
      writesImplemented: true
    });
    expect(backendImplementationClassification.adminLeads).toMatchObject({
      classification: "transaction_ready",
      prismaSchemaExists: true,
      repositoryBoundaryExists: true,
      apiRouteExists: true,
      writesImplemented: true
    });
    expect(useravaaRepository.adminLeads.methods.createLead).toBe("database_persistent");
  });

  it("runs rollback-backed DB smoke coverage for lead inbox when enabled", async () => {
    if (process.env.USERAVAA_DB_SMOKE_TEST !== "1") {
      expect(process.env.USERAVAA_DB_SMOKE_TEST).not.toBe("1");
      return;
    }

    class SmokeRollback extends Error {
      constructor(readonly summary: Record<string, unknown>) {
        super("ADMIN_LEAD_SMOKE_ROLLBACK");
      }
    }

    const prisma = getPrismaClient();
    const unique = `lead-smoke-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const adminId = `${unique}-admin`;
    const supportId = `${unique}-support`;
    const manualEmail = `${unique}-manual@example.test`;
    const importEmail = `${unique}-import@example.test`;
    const phone = `+98${Date.now().toString().slice(-10)}`;
    let leadId = "";
    let summary: Record<string, unknown> | null = null;
    type SmokeLeadData = {
      id: string;
      email: string | null;
      ownerAdminId: string | null;
      temperature: string;
      stage: string;
      followUpCount: number;
      convertedAt: Date | null;
      lostAt: Date | null;
      leadNotes: { id: string }[];
      tagAssignments: { tagId: string; tag: { normalizedName: string } }[];
      followUps: { id: string; completedAt: Date | null }[];
    };

    try {
      await prisma.$transaction(
        async (tx) => {
          await tx.user.createMany({
            data: [
              { id: adminId, role: "ADMIN", email: `${adminId}@smoke.useravaa.test`, displayName: "Lead Smoke Admin", createdAt: now },
              { id: supportId, role: "SUPPORT", email: `${supportId}@smoke.useravaa.test`, displayName: "Lead Smoke Support", createdAt: now }
            ]
          });
          const beforeCounts = {
            supportTickets: await tx.supportTicket.count(),
            payments: await tx.payment.count(),
            walletTransactions: await tx.walletTransaction.count(),
            conversations: await tx.conversationRequest.count(),
            cancellations: await tx.cancellation.count()
          };
          const runInTransaction = async <T,>(operation: (transaction: UseravaaTransactionClient) => Promise<T>) =>
            operation(tx as unknown as UseravaaTransactionClient);
          const admin = { id: adminId, role: "ADMIN" };
          const support = { id: supportId, role: "SUPPORT" };
          const created = await adminLeadService.create(
            admin,
            validLeadPayload({
              firstName: "Smoke",
              lastName: "Lead",
              phone,
              email: manualEmail,
              ownerAdminId: adminId,
              tags: ["trust", "pricing"]
            }),
            {
              now: () => now,
              leadNumberGenerator: () => `LEAD-${unique}`,
              runInTransaction
            }
          );

        if (!created.ok) {
          throw new Error("Lead smoke create failed.");
        }

        const createdLead = created.data as SmokeLeadData;
        leadId = createdLead.id;
        const updated = await adminLeadService.update(
          admin,
          createdLead.id,
          { temperature: "HOT", stage: "CONTACTED", notes: "edited smoke note" },
          { now: () => now, runInTransaction }
        );
        const assigned = await adminLeadService.assign(admin, createdLead.id, { ownerAdminId: supportId }, { now: () => now, runInTransaction });
        const noted = await adminLeadService.addNote(support, createdLead.id, { body: "internal smoke note" }, { now: () => now, runInTransaction });
        const tagged = await adminLeadService.addTag(admin, createdLead.id, { tag: "smoke-tag" }, { now: () => now, runInTransaction });
        const taggedLead = tagged.ok ? (tagged.data as SmokeLeadData) : null;
        const tagId = taggedLead?.tagAssignments.find((assignment) => assignment.tag.normalizedName === "smoke-tag")?.tagId ?? null;
        const removedTag = tagId
          ? await adminLeadService.removeTag(admin, createdLead.id, tagId, { now: () => now, runInTransaction })
          : { ok: false };
        const scheduled = await adminLeadService.scheduleFollowUp(
          support,
          createdLead.id,
          { channel: "MANUAL", scheduledAt: now.toISOString(), summary: "manual smoke follow-up" },
          { now: () => now, runInTransaction }
        );
        const scheduledLead = scheduled.ok ? (scheduled.data as SmokeLeadData) : null;
        const followUpId = scheduledLead?.followUps.find((item) => item.completedAt === null)?.id ?? null;
        const completed = followUpId
          ? await adminLeadService.completeFollowUp(
              support,
              createdLead.id,
              followUpId,
              { outcome: "INTERESTED", summary: "interested smoke result" },
              { now: () => now, runInTransaction }
            )
          : { ok: false };
        const converted = await adminLeadService.convert(admin, createdLead.id, { internalNote: "converted smoke" }, { now: () => now, runInTransaction });
        const reopened = await adminLeadService.reopen(admin, createdLead.id, { reason: "continue smoke" }, { now: () => now, runInTransaction });
        const lost = await adminLeadService.markLost(admin, createdLead.id, { lostReason: "not now" }, { now: () => now, runInTransaction });
        const csv = `${buildLeadImportTemplateCsv()}Import,One,,${importEmail},Company,Designer,Product,4,REQUESTER_LEAD,WARM,MANUAL_IMPORT,trust;pricing,note,,${adminId}\nDuplicate,Manual,,${manualEmail},Company,Designer,Product,4,REQUESTER_LEAD,WARM,MANUAL_IMPORT,trust,note,,${adminId}\nImport,Duplicate,,${importEmail},Company,Designer,Product,4,REQUESTER_LEAD,WARM,MANUAL_IMPORT,trust,note,,${adminId}\n`;
        const imported = await adminLeadService.importCsv(admin, csv, { dryRun: false }, { now: () => now, importIdGenerator: () => `${unique}-import`, runInTransaction });
        const existingManualLead = await tx.lead.findUnique({ where: { id: createdLead.id }, select: { firstName: true, email: true } });
        const importedLead = await tx.lead.findFirst({
          where: { normalizedEmail: importEmail },
          select: { id: true, tagAssignments: { select: { tag: { select: { normalizedName: true } } } } }
        });
        const archived = await adminLeadService.archive(admin, createdLead.id, { reason: "smoke archive" }, { now: () => now, runInTransaction });
        const afterCounts = {
          supportTickets: await tx.supportTicket.count(),
          payments: await tx.payment.count(),
          walletTransactions: await tx.walletTransaction.count(),
          conversations: await tx.conversationRequest.count(),
          cancellations: await tx.cancellation.count()
        };
        const leadAuditActions = await tx.adminAuditEvent.findMany({
          where: {
            OR: [
              { entityType: "LEAD", entityId: created.data.id },
              { entityType: "LEAD_IMPORT", entityId: `${unique}-import` }
            ]
          },
          select: { action: true, metadata: true },
          orderBy: { createdAt: "asc" }
        });
        const completedLead = completed.ok && "data" in completed ? (completed.data as SmokeLeadData) : null;

          throw new SmokeRollback({
          created: created.ok,
          updated: updated.ok && (updated.data as SmokeLeadData).temperature === "HOT",
          assigned: assigned.ok && (assigned.data as SmokeLeadData).ownerAdminId === supportId,
          noted: noted.ok && (noted.data as SmokeLeadData).leadNotes.length >= 1,
          tagged: tagged.ok,
          removedTag: removedTag.ok,
          scheduled: scheduled.ok,
          completed: completedLead?.followUpCount === 1,
          converted: converted.ok && Boolean((converted.data as SmokeLeadData).convertedAt),
          reopened: reopened.ok && (reopened.data as SmokeLeadData).convertedAt === null,
          lost: lost.ok && Boolean((lost.data as SmokeLeadData).lostAt),
          archived: archived.ok && (archived.data as SmokeLeadData).stage === "ARCHIVED",
          imported: imported.ok ? imported.data.imported : 0,
          skippedDuplicates: imported.ok ? imported.data.skippedDuplicates : 0,
          existingLeadNotOverwritten: existingManualLead?.firstName === "Smoke" && existingManualLead.email === manualEmail,
          importedLeadHasTag: Boolean(importedLead?.tagAssignments.some((assignment) => assignment.tag.normalizedName === "trust")),
          importAuditCount: leadAuditActions.filter((row) => row.action === "LEAD_IMPORT_COMPLETED").length,
          importAuditCompact: leadAuditActions
            .filter((row) => row.action === "LEAD_IMPORT_COMPLETED")
            .every((row) => {
              const metadata = row.metadata as { totalRows?: number; imported?: number; skippedDuplicates?: number; rawCsv?: unknown };
              return metadata.totalRows === 3 && metadata.imported === 1 && metadata.skippedDuplicates === 2 && metadata.rawCsv === undefined;
            }),
          auditActions: leadAuditActions.map((row) => row.action),
          operationalCountsUnchanged: JSON.stringify(beforeCounts) === JSON.stringify(afterCounts)
          });
        },
        { timeout: 60_000 }
      );
    } catch (error) {
      if (error instanceof SmokeRollback) {
        summary = error.summary;
      } else {
        throw error;
      }
    }

    expect(summary).toMatchObject({
      created: true,
      updated: true,
      assigned: true,
      noted: true,
      tagged: true,
      removedTag: true,
      scheduled: true,
      completed: true,
      converted: true,
      reopened: true,
      lost: true,
      archived: true,
      imported: 1,
      skippedDuplicates: 2,
      existingLeadNotOverwritten: true,
      importedLeadHasTag: true,
      importAuditCount: 1,
      importAuditCompact: true,
      operationalCountsUnchanged: true
    });
    expect(summary?.auditActions).toEqual(
      expect.arrayContaining([
        "LEAD_CREATED",
        "LEAD_UPDATED",
        "LEAD_ASSIGNED",
        "LEAD_NOTE_ADDED",
        "LEAD_TAG_ADDED",
        "LEAD_TAG_REMOVED",
        "LEAD_FOLLOW_UP_SCHEDULED",
        "LEAD_FOLLOW_UP_COMPLETED",
        "LEAD_CONVERTED",
        "LEAD_REOPENED",
        "LEAD_MARKED_LOST",
        "LEAD_ARCHIVED",
        "LEAD_IMPORT_COMPLETED"
      ])
    );
    await expect(prisma.lead.findUnique({ where: { id: leadId } })).resolves.toBeNull();
    await expect(prisma.user.findUnique({ where: { id: adminId } })).resolves.toBeNull();
    await prisma.$disconnect();
  }, 75_000);
});
