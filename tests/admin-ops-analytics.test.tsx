import fs from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AdminOpsAnalyticsDashboard } from "@/features/v51/admin/AdminSurfaces";
import { getAdminOpsAnalyticsRouteData } from "@/features/v51/admin/server-data";
import { adminReadModelService } from "@/lib/backend/admin-read-models";
import { getPrismaClient } from "@/lib/backend/db/prisma";
import type { PrismaReader } from "@/lib/backend/repositories";
import { adminOpsAnalyticsFilterSchema } from "@/lib/backend/validation";

const projectRoot = process.cwd();
const now = new Date("2026-06-20T09:00:00.000Z");

function readProjectFile(relativePath: string) {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

function projectFileExists(relativePath: string) {
  return fs.existsSync(path.join(projectRoot, relativePath));
}

function sourceSegment(source: string, startMarker: string, endMarker: string) {
  const startIndex = source.indexOf(startMarker);
  const endIndex = source.indexOf(endMarker, startIndex + startMarker.length);

  expect(startIndex).toBeGreaterThanOrEqual(0);
  expect(endIndex).toBeGreaterThan(startIndex);

  return source.slice(startIndex, endIndex);
}

describe("Checkpoint 3A-13 admin ops analytics", () => {
  it("adds a guarded server-rendered /admin/ops-analytics route without adding an API mutation surface", () => {
    const pageSource = readProjectFile("src/app/admin/ops-analytics/page.tsx");
    const navSource = readProjectFile("src/features/v51/admin/navigation.ts");

    expect(pageSource).toContain("requireAdminPageAccess");
    expect(pageSource).toContain("getAdminOpsAnalyticsRouteData(viewer, await searchParams)");
    expect(pageSource).not.toContain("\"use client\"");
    expect(navSource).toContain("/admin/ops-analytics");
    expect(projectFileExists("src/app/api/admin/ops-analytics/route.ts")).toBe(false);
  });

  it("keeps normal users out through the admin read-model service before reading DB state", async () => {
    const result = await adminReadModelService.getOpsAnalyticsSummary(
      { id: "normal-user", role: "USER" },
      { dateRange: "last_7_days", now }
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("unauthorized");
    }
  });

  it("validates date range filters and safely falls back from invalid input at route-data level", async () => {
    expect(adminOpsAnalyticsFilterSchema.parse({ range: "today" }).range).toBe("today");
    expect(adminOpsAnalyticsFilterSchema.safeParse({ range: "<script>" }).success).toBe(false);

    const data = await getAdminOpsAnalyticsRouteData(
      { id: "normal-user", role: "USER", displayName: "Normal User" },
      { range: "<script>" }
    );

    expect(data.activeDateRangeLabel).toBe("۷ روز گذشته");
    expect(data.source).toBe("placeholder");
    expect(data.executiveMetrics).toHaveLength(1);
    expect(data.needsAttention).toHaveLength(0);
    expect(data.recentActions).toHaveLength(0);
  });

  it("renders operational metrics, needs-attention rows, audit feed, and privacy notes without PII", () => {
    const html = renderToStaticMarkup(
      <AdminOpsAnalyticsDashboard
        data={{
          source: "backend_repository",
          sourceNote: "repository-backed ops analytics",
          activeDateRangeLabel: "۷ روز گذشته",
          dateRangeOptions: [
            { label: "امروز", value: "today", href: "/admin/ops-analytics?range=today", active: false },
            { label: "۷ روز گذشته", value: "last_7_days", href: "/admin/ops-analytics?range=last_7_days", active: true }
          ],
          executiveMetrics: [
            {
              id: "open-support",
              label: "تیکت‌های باز",
              value: "۳",
              helper: "موارد پشتیبانی حل‌نشده.",
              href: "/admin/support",
              source: "backend_repository"
            }
          ],
          leadMetrics: [
            {
              id: "hot-leads",
              label: "سرنخ داغ",
              value: "۲",
              helper: "بدون نمایش اطلاعات تماس.",
              href: "/admin/leads?temperature=HOT",
              source: "backend_repository"
            }
          ],
          supportMetrics: [
            {
              id: "urgent-support",
              label: "تیکت فوری",
              value: "۱",
              helper: "Priority = URGENT.",
              href: "/admin/support?priority=URGENT",
              source: "backend_repository"
            }
          ],
          contentMetrics: [
            {
              id: "content-draft",
              label: "پیش‌نویس",
              value: "۴",
              helper: "ContentEntry.status = DRAFT.",
              href: "/admin/content?status=DRAFT",
              source: "backend_repository"
            }
          ],
          conversationFinanceMetrics: [
            {
              id: "wallet-cancellation-credit",
              label: "اعتبار برگشتی لغو",
              value: "۱۵۰٬۰۰۰ تومان",
              helper: "فقط تراکنش‌های تکمیل‌شده.",
              href: "/admin/wallet-transactions",
              source: "backend_repository"
            }
          ],
          breakdownSections: [
            {
              id: "lead-breakdown",
              title: "جزئیات سرنخ‌ها",
              description: "منبع و مرحله بدون نمایش اطلاعات تماس.",
              rows: [
                {
                  id: "HOT",
                  label: "داغ",
                  value: "۲",
                  helper: "Lead.temperature",
                  href: "/admin/leads?temperature=HOT",
                  source: "backend_repository"
                }
              ]
            }
          ],
          needsAttention: [
            {
              id: "urgent-support:safe-ticket",
              areaLabel: "پشتیبانی",
              priorityLabel: "فوری",
              title: "تیکت فوری باز",
              summary: "SUP-100 · ACCOUNT_AUTH · NEW",
              href: "/admin/support/safe-ticket",
              createdAt: now.toISOString()
            }
          ],
          recentActions: [
            {
              id: "audit-safe",
              actionLabel: "ثبت سرنخ",
              actorSummary: "Operator · ADMIN",
              targetSummary: "LEAD · lead-safe",
              href: "/admin/leads/lead-safe",
              createdAt: now.toISOString()
            }
          ],
          dataQualityNotes: [
            "اطلاعات تماس سرنخ‌ها، فایل‌های رسید پرداخت، کد حضور و payload کامل ممیزی در این سطح تجمیعی نمایش داده نمی‌شود."
          ]
        }}
      />
    );

    expect(html).toContain("هوش عملیاتی");
    expect(html).toContain("تیکت‌های باز");
    expect(html).toContain("سرنخ داغ");
    expect(html).toContain("موارد نیازمند توجه");
    expect(html).toContain("/admin/support/safe-ticket");
    expect(html).toContain("/admin/leads/lead-safe");
    expect(html).not.toContain("0912");
    expect(html).not.toContain("person@example.com");
    expect(html).not.toContain("receipt-file");
    expect(html).not.toContain("12345");
    expect(html).not.toContain("codeHash");
    expect(html).not.toContain("DATABASE_URL");
  });

  it("keeps the repository aggregation read-only and excludes sensitive fields/external analytics", () => {
    const repositorySource = readProjectFile("src/lib/backend/repositories/admin-read-model.ts");
    const segment = sourceSegment(repositorySource, "async getOpsAnalyticsSummary", "async getAnalyticsSummary");

    for (const forbiddenMutation of [".create(", ".update(", ".upsert(", ".delete(", ".deleteMany(", ".createMany("]) {
      expect(segment).not.toContain(forbiddenMutation);
    }

    for (const forbiddenSensitiveField of [
      "phone",
      "email",
      "receiptUrl",
      "receiptFileName",
      "requesterCodeCiphertext",
      "codeHash",
      "codeSalt",
      "metadata"
    ]) {
      expect(segment).not.toContain(forbiddenSensitiveField);
    }

    for (const forbiddenIntegration of ["gtag", "mixpanel", "posthog", "analytics.track", "sendEmail", "notificationDelivery"]) {
      expect(segment).not.toContain(forbiddenIntegration);
    }

    expect(segment).toContain("readOnlyRepositoryOperation");
    expect(segment).toContain("db.adminAuditEvent");
  });

  it("documents the ops analytics implementation as read-only persistent and no-fake on DB fallback", () => {
    const classificationSource = readProjectFile("src/lib/backend/implementation-classification.ts");
    const serverDataSource = readProjectFile("src/features/v51/admin/server-data.ts");
    const indexSource = readProjectFile("src/lib/backend/repositories/index.ts");

    expect(classificationSource).toContain("adminOpsAnalytics");
    expect(classificationSource).toContain("read_only_persistent");
    expect(indexSource).toContain("AdminOpsAnalyticsSummary");
    expect(serverDataSource).toContain("getAdminOpsAnalyticsRouteData");
    expect(serverDataSource).toContain("ردیف نمایشی ساخته نمی‌شود");
  });

  it("runs rollback-backed DB smoke coverage for ops analytics when enabled", async () => {
    if (process.env.USERAVAA_DB_SMOKE_TEST !== "1") {
      expect(process.env.USERAVAA_DB_SMOKE_TEST).not.toBe("1");
      return;
    }

    class SmokeRollback extends Error {
      constructor(readonly summary: Record<string, unknown>) {
        super("ADMIN_OPS_ANALYTICS_SMOKE_ROLLBACK");
      }
    }

    const prisma = getPrismaClient();
    const unique = `ops-analytics-smoke-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const adminId = `${unique}-admin`;
    const leadId = `${unique}-lead`;
    const ticketId = `${unique}-ticket`;
    const contentId = `${unique}-content`;
    const auditId = `${unique}-audit`;
    const viewer = { id: adminId, role: "ADMIN" };
    let summary: Record<string, unknown> | null = null;

    try {
      await prisma.$transaction(
        async (tx) => {
          const reader = tx as unknown as PrismaReader;
          const baseline = await adminReadModelService.getOpsAnalyticsSummary(viewer, { dateRange: "last_30_days", now }, reader);

          await tx.user.create({
            data: {
              id: adminId,
              role: "ADMIN",
              email: `${adminId}@smoke.useravaa.test`,
              displayName: "Ops Analytics Smoke Admin",
              createdAt: now
            }
          });
          await tx.lead.create({
            data: {
              id: leadId,
              leadNumber: `LEAD-${unique}`,
              firstName: "Smoke",
              lastName: "Lead",
              leadType: "REQUESTER_LEAD",
              temperature: "HOT",
              stage: "FOLLOW_UP",
              source: "ADMIN_CREATED",
              nextFollowUpAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
              followUpCount: 2,
              lastFollowUpOutcome: "NO_RESPONSE",
              blocker: "needs operator attention",
              createdAt: now
            }
          });
          await tx.supportTicket.create({
            data: {
              id: ticketId,
              ticketNumber: `SUP-${unique}`,
              subject: "Ops analytics smoke ticket",
              description: "Smoke ticket for read-only ops analytics",
              status: "NEW",
              priority: "URGENT",
              category: "ACCOUNT_AUTH",
              source: "ADMIN_CREATED",
              createdAt: now
            }
          });
          await tx.contentEntry.create({
            data: {
              id: contentId,
              namespace: "admin.ops.smoke",
              key: unique,
              locale: "fa",
              title: "Ops analytics smoke content",
              body: "Smoke body",
              contentType: "HELP_TEXT",
              status: "DRAFT",
              createdByAdminId: adminId,
              updatedByAdminId: adminId,
              createdAt: now
            }
          });
          await tx.adminAuditEvent.create({
            data: {
              id: auditId,
              actorAdminUserId: adminId,
              actorRole: "ADMIN",
              action: "LEAD_CREATED",
              entityType: "LEAD",
              entityId: leadId,
              createdAt: now
            }
          });

          const beforeReadCounts = {
            payments: await tx.payment.count(),
            walletTransactions: await tx.walletTransaction.count(),
            conversations: await tx.conversationRequest.count(),
            cancellations: await tx.cancellation.count()
          };
          const analytics = await adminReadModelService.getOpsAnalyticsSummary(viewer, { dateRange: "last_30_days", now }, reader);
          const afterReadCounts = {
            payments: await tx.payment.count(),
            walletTransactions: await tx.walletTransaction.count(),
            conversations: await tx.conversationRequest.count(),
            cancellations: await tx.cancellation.count()
          };

          if (!baseline.ok || !analytics.ok) {
            throw new Error("Admin ops analytics smoke read failed.");
          }

          throw new SmokeRollback({
            leadTotalDelta: analytics.data.leads.total - baseline.data.leads.total,
            hotLeadDelta: analytics.data.leads.hot - baseline.data.leads.hot,
            overdueFollowUpDelta: analytics.data.leads.overdueFollowUps - baseline.data.leads.overdueFollowUps,
            noResponseDelta: analytics.data.leads.noResponse - baseline.data.leads.noResponse,
            supportTotalDelta: analytics.data.support.total - baseline.data.support.total,
            urgentSupportDelta: analytics.data.support.urgent - baseline.data.support.urgent,
            unassignedSupportDelta: analytics.data.support.unassigned - baseline.data.support.unassigned,
            contentTotalDelta: analytics.data.content.total - baseline.data.content.total,
            contentDraftDelta: analytics.data.content.draft - baseline.data.content.draft,
            auditTotalDelta: analytics.data.audit.totalInRange - baseline.data.audit.totalInRange,
            attentionHrefs: analytics.data.needsAttention.map((item) => item.href),
            recentActionTargets: analytics.data.audit.recentActions.map((item) => item.targetId),
            readCountsUnchanged: JSON.stringify(beforeReadCounts) === JSON.stringify(afterReadCounts)
          });
        },
        {
          maxWait: 10_000,
          timeout: 25_000
        }
      );
    } catch (error) {
      if (error instanceof SmokeRollback) {
        summary = error.summary;
      } else {
        throw error;
      }
    }

    expect(summary).toMatchObject({
      leadTotalDelta: 1,
      hotLeadDelta: 1,
      overdueFollowUpDelta: 1,
      noResponseDelta: 1,
      supportTotalDelta: 1,
      urgentSupportDelta: 1,
      unassignedSupportDelta: 1,
      contentTotalDelta: 1,
      contentDraftDelta: 1,
      auditTotalDelta: 1,
      readCountsUnchanged: true
    });
    expect(summary?.attentionHrefs).toEqual(expect.arrayContaining([`/admin/leads/${leadId}`, `/admin/support/${ticketId}`]));
    expect(summary?.recentActionTargets).toContain(leadId);

    expect(await prisma.lead.findUnique({ where: { id: leadId } })).toBeNull();
    expect(await prisma.supportTicket.findUnique({ where: { id: ticketId } })).toBeNull();
    expect(await prisma.contentEntry.findUnique({ where: { id: contentId } })).toBeNull();
    expect(await prisma.adminAuditEvent.findUnique({ where: { id: auditId } })).toBeNull();
  });
});
