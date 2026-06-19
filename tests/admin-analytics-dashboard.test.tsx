import fs from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AdminAnalyticsSummary } from "@/features/v51/admin/AdminSurfaces";
import { getAdminAnalyticsRouteData } from "@/features/v51/admin/server-data";
import {
  adminPaidSessionsKpiTaxonomy,
  buildAdminPaidSessionsKpiTree
} from "@/lib/backend/admin-kpi-tree";
import { adminReadModelService } from "@/lib/backend/admin-read-models";
import { getPrismaClient } from "@/lib/backend/db/prisma";
import type { PrismaReader } from "@/lib/backend/repositories";
import { adminAnalyticsFilterSchema } from "@/lib/backend/validation";

const projectRoot = process.cwd();
const now = new Date("2026-06-14T08:00:00.000Z");

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

type KpiTreeNode = ReturnType<typeof buildAdminPaidSessionsKpiTree>[number];

function flattenKpiTree(nodes: readonly KpiTreeNode[]): KpiTreeNode[] {
  return nodes.flatMap((node) => [node, ...flattenKpiTree(node.children)]);
}

describe("Checkpoint 3A-7 admin analytics dashboard", () => {
  it("keeps /admin/analytics admin-guarded and server-query backed", () => {
    const pageSource = readProjectFile("src/app/admin/analytics/page.tsx");

    expect(pageSource).toContain("requireAdminPageAccess");
    expect(pageSource).toContain("await searchParams");
    expect(pageSource).toContain("getAdminAnalyticsRouteData(viewer, await searchParams)");
    expect(pageSource).not.toContain("\"use client\"");
    expect(projectFileExists("src/app/api/admin/analytics/route.ts")).toBe(false);
  });

  it("renders honest KPI cards, filters, breakdowns, unsupported reasons, and data quality notes", () => {
    const html = renderToStaticMarkup(
      <AdminAnalyticsSummary
        data={{
          source: "backend_repository",
          sourceNote: "repository-backed",
          activeDateRangeLabel: "۳۰ روز گذشته",
          activeCategoryLabel: "مهندسی نرم‌افزار",
          dateRangeOptions: [
            {
              label: "۷ روز گذشته",
              value: "last_7_days",
              href: "/admin/analytics?range=last_7_days&category=SOFTWARE_ENGINEERING",
              active: false
            },
            {
              label: "۳۰ روز گذشته",
              value: "last_30_days",
              href: "/admin/analytics?range=last_30_days&category=SOFTWARE_ENGINEERING",
              active: true
            }
          ],
          categoryOptions: [
            {
              label: "همه دسته‌ها",
              value: "",
              href: "/admin/analytics?range=last_30_days",
              active: false
            },
            {
              label: "مهندسی نرم‌افزار",
              value: "SOFTWARE_ENGINEERING",
              href: "/admin/analytics?range=last_30_days&category=SOFTWARE_ENGINEERING",
              active: true
            }
          ],
          metrics: [
            {
              id: "gmv",
              label: "GMV",
              value: "۵۰۰٬۰۰۰ تومان",
              helper: "از ۱ پرداخت PAID در بازه انتخابی.",
              source: "backend_repository"
            },
            {
              id: "nmv",
              label: "NMV",
              value: "پیاده‌سازی نشده",
              helper: "مدل کمیسیون/تسویه لازم است.",
              source: "placeholder"
            },
            {
              id: "observed-average-gmv",
              label: "میانگین GMV مشاهده‌شده",
              value: "۵۰۰٬۰۰۰ تومان",
              helper: "این CLV نیست.",
              source: "backend_repository"
            }
          ],
          kpiTree: buildAdminPaidSessionsKpiTree({
            dateRangeLabel: "۳۰ روز گذشته",
            categoryLabel: "مهندسی نرم‌افزار",
            categoryFilterSelected: true,
            completedPaidSessionCount: 1,
            scheduledPaidSessionCount: 1,
            paidSessionCount: 1,
            acceptedRequestProxyCount: 2,
            submittedRequestCount: 3,
            activatedSeekerCount: 2,
            qualifiedSignupProxyCount: 4
          }),
          breakdownSections: [
            {
              id: "orders",
              title: "خلاصه سفارش و پرداخت",
              description: "پرداخت‌های موفق.",
              rows: [
                {
                  id: "paid-orders",
                  label: "سفارش‌های پرداخت‌شده",
                  value: "۱",
                  helper: "Payment.status = PAID",
                  source: "backend_repository"
                }
              ]
            },
            {
              id: "categories",
              title: "شکست دسته شغلی",
              description: "jobField",
              rows: []
            }
          ],
          unsupportedMetrics: [
            {
              id: "clv",
              label: "CLV",
              reason: "پیاده‌سازی نشده — مدل نگهداشت/کوهورت لازم است."
            }
          ],
          dataQualityNotes: ["DB-backed", "هیچ مقدار ساختگی نمایش داده نمی‌شود."]
        }}
      />
    );

    expect(html).toContain("Repository");
    expect(html).toContain("href=\"/admin/analytics?range=last_7_days&amp;category=SOFTWARE_ENGINEERING\"");
    expect(html).toContain("GMV");
    expect(html).toContain("NMV");
    expect(html).toContain("درخت KPI جلسه‌های پرداخت‌شده");
    expect(html).toContain("Completed Paid Sessions");
    expect(html).toContain("Qualified Visitors");
    expect(html).toContain("محاسبه‌شده");
    expect(html).toContain("تقریبی");
    expect(html).toContain("پیاده‌سازی‌نشده");
    expect(html).toContain("این CLV نیست");
    expect(html).toContain("خلاصه سفارش و پرداخت");
    expect(html).toContain("داده‌ای برای این شکست وجود ندارد");
    expect(html).toContain("مدل نگهداشت");
    expect(html).not.toContain("fake");
  });

  it("defines the paid-session KPI tree taxonomy with explicit computed, proxy, and unsupported nodes", () => {
    const tree = buildAdminPaidSessionsKpiTree({
      dateRangeLabel: "۳۰ روز گذشته",
      categoryLabel: "مهندسی نرم‌افزار",
      categoryFilterSelected: true,
      completedPaidSessionCount: 1,
      scheduledPaidSessionCount: 2,
      paidSessionCount: 3,
      acceptedRequestProxyCount: 4,
      submittedRequestCount: 4,
      activatedSeekerCount: 4,
      qualifiedSignupProxyCount: 8
    });
    const root = tree[0];

    expect(root?.id).toBe("completed_paid_sessions");
    expect(root?.children[0]?.id).toBe("scheduled_paid_sessions");
    expect(root?.children[1]?.id).toBe("session_completion_rate");
    expect(root?.children[0]?.children[0]?.id).toBe("paid_sessions");
    expect(root?.children[0]?.children[1]?.id).toBe("scheduling_rate");
    expect(root?.children[0]?.children[0]?.children[0]?.id).toBe("accepted_requests");
    expect(root?.children[0]?.children[0]?.children[1]?.id).toBe("payment_confirmation_rate");
    expect(
      root?.children[0]?.children[0]?.children[0]?.children[0]?.children[0]?.children[0]?.children[0]?.id
    ).toBe("qualified_visitors");
    expect(
      root?.children[0]?.children[0]?.children[0]?.children[0]?.children[0]?.children[0]?.children[1]?.id
    ).toBe("signup_rate");

    const flat = flattenKpiTree(tree);
    const byId = new Map(flat.map((node) => [node.id, node]));

    expect(flat).toHaveLength(15);
    expect(new Set(flat.map((node) => node.status))).toEqual(new Set(["computed", "proxy", "not_implemented"]));
    expect(flat.every((node) => node.statusLabel && node.formula && node.explanation && node.dateRangeBehavior)).toBe(true);
    expect(byId.get("paid_sessions")).toMatchObject({
      status: "computed",
      formula: adminPaidSessionsKpiTaxonomy.paid_sessions.formula,
      numerator: "۳"
    });
    expect(byId.get("qualified_signups")).toMatchObject({
      status: "proxy",
      numerator: "۸",
      categoryFilterStatus: "not_supported"
    });
    expect(byId.get("qualified_visitors")).toMatchObject({
      status: "not_implemented",
      value: "ناموجود",
      categoryFilterStatus: "not_supported"
    });
    expect(byId.get("signup_rate")).toMatchObject({
      status: "not_implemented",
      denominator: "ناموجود"
    });
    expect(byId.get("request_conversion_rate")?.dataQualityNote).toContain("ساختاری");
    expect(byId.get("provider_acceptance_rate")).toMatchObject({
      status: "proxy",
      formula: "Accepted Requests / Submitted Requests"
    });
    expect(byId.get("payment_confirmation_rate")?.formula).toBe("Paid Sessions / Accepted Requests");
    expect(byId.get("scheduling_rate")?.formula).toBe("Scheduled Paid Sessions / Paid Sessions");
    expect(byId.get("session_completion_rate")?.formula).toBe("Completed Paid Sessions / Scheduled Paid Sessions");
    expect(byId.get("completed_paid_sessions")?.categoryFilterStatus).toBe("applied");
  });

  it("validates query params and falls back safely for malicious values", async () => {
    expect(adminAnalyticsFilterSchema.safeParse({ range: "last_7_days", category: "SOFTWARE_ENGINEERING" }).success).toBe(true);
    expect(adminAnalyticsFilterSchema.safeParse({ range: "<script>", category: "SOFTWARE_ENGINEERING" }).success).toBe(false);
    expect(adminAnalyticsFilterSchema.safeParse({ range: "last_30_days", category: "SOFTWARE_ENGINEERING;DROP" }).success).toBe(false);

    const routeData = await getAdminAnalyticsRouteData(
      { id: "normal-user", role: "USER" },
      {
        range: "<script>",
        category: "SOFTWARE_ENGINEERING;DROP"
      }
    );

    expect(routeData.source).toBe("placeholder");
    expect(routeData.kpiTree[0]).toMatchObject({
      id: "completed_paid_sessions",
      status: "not_implemented",
      value: "ناموجود"
    });
    expect(flattenKpiTree(routeData.kpiTree).every((node) => node.status === "not_implemented")).toBe(true);
    expect(routeData.activeDateRangeLabel).toBe("۳۰ روز گذشته");
    expect(routeData.activeCategoryLabel).toBe("همه دسته‌ها");
    expect(routeData.metrics[0]?.value).toBe("ناموجود");
  });

  it("keeps analytics read models fixture-free, read-only, and free of raw sensitive fields", () => {
    const serverDataSource = readProjectFile("src/features/v51/admin/server-data.ts");
    const adminSurfacesSource = readProjectFile("src/features/v51/admin/AdminSurfaces.tsx");
    const analyticsOnlySource = [
      readProjectFile("src/lib/backend/repositories/admin-read-model.ts"),
      readProjectFile("src/lib/backend/admin-read-models.ts"),
      readProjectFile("src/lib/backend/admin-kpi-tree.ts"),
      sourceSegment(serverDataSource, "const analyticsDateRangeLabels", "function formatDateLike"),
      sourceSegment(serverDataSource, "function analyticsBreakdownRow", "export async function getAdminPaymentRouteData"),
      sourceSegment(serverDataSource, "export async function getAdminAnalyticsRouteData", "export async function getAdminAuditLogRouteData"),
      sourceSegment(adminSurfacesSource, "export function AdminAnalyticsSummary", "export function AdminAuditLog"),
      readProjectFile("src/app/admin/analytics/page.tsx")
    ];
    const combined = analyticsOnlySource.join("\n");

    expect(combined).toContain("getAnalyticsSummary");
    expect(combined).toContain("buildAdminPaidSessionsKpiTree");
    expect(combined).toContain("adminAnalyticsFilterSchema");
    expect(combined).toContain("status: \"PAID\"");
    expect(combined).toContain("finalizedAt");
    expect(combined).toContain("پیاده‌سازی نشده");
    expect(combined).not.toContain("@/features/v51/data");
    expect(combined).not.toContain("getConversationOrFallback");
    expect(combined).not.toContain("receiptUrl");
    expect(combined).not.toContain("codeHash");
    expect(combined).not.toContain("codeSalt");
    expect(combined).not.toContain("requesterCodeCiphertext");
    expect(combined).not.toContain("submittedCodeHash");
    expect(combined).not.toContain("attendanceVerificationCode");
    expect(combined).not.toMatch(/posthog|mixpanel|amplitude|gtag|plausible|umami/i);
    expect(combined).not.toMatch(/\.(create|update|upsert|delete|deleteMany)\(/);
  });

  it("denies normal users at the analytics read-model service", async () => {
    const result = await adminReadModelService.getAnalyticsSummary({ id: "normal-user", role: "USER" });

    expect(result).toMatchObject({
      ok: false,
      code: "unauthorized"
    });
  });

  it("runs rollback-backed DB smoke coverage for admin analytics when enabled", async () => {
    if (process.env.USERAVAA_DB_SMOKE_TEST !== "1") {
      expect(process.env.USERAVAA_DB_SMOKE_TEST).not.toBe("1");
      return;
    }

    class SmokeRollback extends Error {
      constructor(readonly summary: Record<string, unknown>) {
        super("ADMIN_ANALYTICS_SMOKE_ROLLBACK");
      }
    }

    const prisma = getPrismaClient();
    const unique = `analytics-smoke-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const adminId = `${unique}-admin`;
    const requesterId = `${unique}-requester`;
    const secondRequesterId = `${unique}-second-requester`;
    const providerId = `${unique}-provider`;
    const otherProviderId = `${unique}-other-provider`;
    const pendingOwnerId = `${unique}-pending-owner`;
    const needsOwnerId = `${unique}-needs-owner`;
    const inactiveOwnerId = `${unique}-inactive-owner`;
    const paidConversationId = `${unique}-paid-conversation`;
    const failedConversationId = `${unique}-failed-conversation`;
    const unpaidConversationId = `${unique}-unpaid-conversation`;
    const otherConversationId = `${unique}-other-conversation`;
    const paidPaymentId = `${unique}-paid-payment`;
    const failedPaymentId = `${unique}-failed-payment`;
    const unpaidPaymentId = `${unique}-unpaid-payment`;
    const otherPaymentId = `${unique}-other-payment`;
    const softwareProfileId = `${unique}-software-profile`;
    const otherProfileId = `${unique}-other-profile`;
    const walletId = `${unique}-wallet`;
    let summary: Record<string, unknown> | null = null;

    function categoryDelta(
      before: Awaited<ReturnType<typeof adminReadModelService.getAnalyticsSummary>>,
      after: Awaited<ReturnType<typeof adminReadModelService.getAnalyticsSummary>>
    ) {
      if (!before.ok || !after.ok) {
        return null;
      }

      const beforeRow = before.data.categoryBreakdown.find((row) => row.category === "SOFTWARE_ENGINEERING");
      const afterRow = after.data.categoryBreakdown.find((row) => row.category === "SOFTWARE_ENGINEERING");

      return {
        paidGmvToman: (afterRow?.paidGmvToman ?? 0) - (beforeRow?.paidGmvToman ?? 0),
        paidOrderCount: (afterRow?.paidOrderCount ?? 0) - (beforeRow?.paidOrderCount ?? 0),
        cancellationCount: (afterRow?.cancellationCount ?? 0) - (beforeRow?.cancellationCount ?? 0),
        insightCount: (afterRow?.insightCount ?? 0) - (beforeRow?.insightCount ?? 0),
        activeExperienceProfileCount:
          (afterRow?.activeExperienceProfileCount ?? 0) - (beforeRow?.activeExperienceProfileCount ?? 0)
      };
    }

    try {
      await prisma.$transaction(async (tx) => {
        const reader = tx as unknown as PrismaReader;
        const viewer = { id: adminId, role: "ADMIN" };
        const filters = {
          dateRange: "last_30_days" as const,
          category: "SOFTWARE_ENGINEERING" as const,
          now
        };
        const baseline = await adminReadModelService.getAnalyticsSummary(viewer, filters, reader);

        await tx.user.createMany({
          data: [
            { id: adminId, role: "ADMIN", email: `${adminId}@smoke.useravaa.test`, displayName: "Smoke Admin", createdAt: now },
            { id: requesterId, role: "USER", email: `${requesterId}@smoke.useravaa.test`, displayName: "Smoke Requester", createdAt: now },
            { id: secondRequesterId, role: "USER", email: `${secondRequesterId}@smoke.useravaa.test`, displayName: "Smoke Requester 2", createdAt: now },
            { id: providerId, role: "USER", email: `${providerId}@smoke.useravaa.test`, displayName: "Smoke Provider", createdAt: now },
            { id: otherProviderId, role: "USER", email: `${otherProviderId}@smoke.useravaa.test`, displayName: "Smoke Other Provider", createdAt: now },
            { id: pendingOwnerId, role: "USER", email: `${pendingOwnerId}@smoke.useravaa.test`, displayName: "Smoke Pending", createdAt: now },
            { id: needsOwnerId, role: "USER", email: `${needsOwnerId}@smoke.useravaa.test`, displayName: "Smoke Needs", createdAt: now },
            { id: inactiveOwnerId, role: "USER", email: `${inactiveOwnerId}@smoke.useravaa.test`, displayName: "Smoke Inactive", createdAt: now }
          ]
        });

        await tx.profile.createMany({
          data: [
            { id: `${providerId}-profile`, userId: providerId, status: "ACTIVE", displayName: "Smoke Provider", userMotivations: [], canOfferExperience: true, createdAt: now },
            { id: `${otherProviderId}-profile`, userId: otherProviderId, status: "ACTIVE", displayName: "Smoke Other Provider", userMotivations: [], canOfferExperience: true, createdAt: now },
            { id: `${pendingOwnerId}-profile`, userId: pendingOwnerId, status: "ACTIVE", displayName: "Smoke Pending", userMotivations: [], canOfferExperience: true, createdAt: now },
            { id: `${needsOwnerId}-profile`, userId: needsOwnerId, status: "ACTIVE", displayName: "Smoke Needs", userMotivations: [], canOfferExperience: true, createdAt: now },
            { id: `${inactiveOwnerId}-profile`, userId: inactiveOwnerId, status: "ACTIVE", displayName: "Smoke Inactive", userMotivations: [], canOfferExperience: true, createdAt: now }
          ]
        });

        await tx.experienceProfile.createMany({
          data: [
            {
              id: softwareProfileId,
              ownerId: providerId,
              profileId: `${providerId}-profile`,
              status: "ACTIVE",
              displayName: "Smoke Software Provider",
              roleTitle: "Engineer",
              jobField: "SOFTWARE_ENGINEERING",
              orgLevel: "SENIOR_SPECIALIST",
              yearsOfExperience: 8,
              publicProfessionalSummary: "Smoke analytics software profile.",
              freeHelp: false,
              price30Toman: 100000,
              price60Toman: 200000,
              createdAt: now
            },
            {
              id: otherProfileId,
              ownerId: otherProviderId,
              profileId: `${otherProviderId}-profile`,
              status: "ACTIVE",
              displayName: "Smoke Data Provider",
              roleTitle: "Data Lead",
              jobField: "DATA_AI",
              orgLevel: "SENIOR_SPECIALIST",
              yearsOfExperience: 9,
              publicProfessionalSummary: "Smoke analytics data profile.",
              freeHelp: false,
              price30Toman: 110000,
              price60Toman: 210000,
              createdAt: now
            },
            {
              id: `${unique}-pending-profile`,
              ownerId: pendingOwnerId,
              profileId: `${pendingOwnerId}-profile`,
              status: "PENDING_REVIEW",
              displayName: "Smoke Pending Profile",
              roleTitle: "Designer",
              jobField: "SOFTWARE_ENGINEERING",
              orgLevel: "SPECIALIST",
              yearsOfExperience: 4,
              publicProfessionalSummary: "Smoke pending profile.",
              freeHelp: false,
              price30Toman: 90000,
              price60Toman: 180000,
              createdAt: now
            },
            {
              id: `${unique}-needs-profile`,
              ownerId: needsOwnerId,
              profileId: `${needsOwnerId}-profile`,
              status: "NEEDS_CHANGES",
              displayName: "Smoke Needs Profile",
              roleTitle: "Manager",
              jobField: "SOFTWARE_ENGINEERING",
              orgLevel: "MIDDLE_MANAGER",
              yearsOfExperience: 10,
              publicProfessionalSummary: "Smoke needs profile.",
              freeHelp: false,
              price30Toman: 95000,
              price60Toman: 190000,
              createdAt: now
            },
            {
              id: `${unique}-inactive-profile`,
              ownerId: inactiveOwnerId,
              profileId: `${inactiveOwnerId}-profile`,
              status: "INACTIVE",
              displayName: "Smoke Inactive Profile",
              roleTitle: "Lead",
              jobField: "SOFTWARE_ENGINEERING",
              orgLevel: "SENIOR_MANAGER",
              yearsOfExperience: 12,
              publicProfessionalSummary: "Smoke inactive profile.",
              freeHelp: false,
              price30Toman: 99000,
              price60Toman: 199000,
              createdAt: now
            }
          ]
        });

        await tx.conversationRequest.createMany({
          data: [
            {
              id: paidConversationId,
              requesterId,
              providerId,
              experienceProfileId: softwareProfileId,
              duration: "MIN_60",
              priceToman: 500000,
              status: "PAYMENT_FINALIZED",
              paymentRequirement: "PAYMENT_REQUIRED",
              requestTopic: "Smoke paid analytics",
              providerVisibleAt: now,
              paymentFinalizedAt: now,
              createdAt: now
            },
            {
              id: failedConversationId,
              requesterId: secondRequesterId,
              providerId,
              experienceProfileId: softwareProfileId,
              duration: "MIN_60",
              priceToman: 700000,
              status: "PAYMENT_FAILED",
              paymentRequirement: "PAYMENT_REQUIRED",
              requestTopic: "Smoke failed analytics",
              createdAt: now
            },
            {
              id: unpaidConversationId,
              requesterId: secondRequesterId,
              providerId,
              experienceProfileId: softwareProfileId,
              duration: "MIN_30",
              priceToman: 900000,
              status: "AWAITING_PAYMENT",
              paymentRequirement: "PAYMENT_REQUIRED",
              requestTopic: "Smoke unpaid analytics",
              createdAt: now
            },
            {
              id: otherConversationId,
              requesterId: secondRequesterId,
              providerId: otherProviderId,
              experienceProfileId: otherProfileId,
              duration: "MIN_30",
              priceToman: 300000,
              status: "PAYMENT_FINALIZED",
              paymentRequirement: "PAYMENT_REQUIRED",
              requestTopic: "Smoke other category analytics",
              providerVisibleAt: now,
              paymentFinalizedAt: now,
              createdAt: now
            }
          ]
        });

        await tx.payment.createMany({
          data: [
            {
              id: paidPaymentId,
              conversationId: paidConversationId,
              payerId: requesterId,
              method: "CARD_TO_CARD",
              requirement: "PAYMENT_REQUIRED",
              status: "PAID",
              amountToman: 500000,
              finalizedAt: now,
              createdAt: now
            },
            {
              id: failedPaymentId,
              conversationId: failedConversationId,
              payerId: secondRequesterId,
              method: "CARD_TO_CARD",
              requirement: "PAYMENT_REQUIRED",
              status: "FAILED",
              amountToman: 700000,
              failedAt: now,
              createdAt: now
            },
            {
              id: unpaidPaymentId,
              conversationId: unpaidConversationId,
              payerId: secondRequesterId,
              method: "CARD_TO_CARD",
              requirement: "PAYMENT_REQUIRED",
              status: "UNPAID",
              amountToman: 900000,
              createdAt: now
            },
            {
              id: otherPaymentId,
              conversationId: otherConversationId,
              payerId: secondRequesterId,
              method: "CARD_TO_CARD",
              requirement: "PAYMENT_REQUIRED",
              status: "PAID",
              amountToman: 300000,
              finalizedAt: now,
              createdAt: now
            }
          ]
        });

        await tx.wallet.create({
          data: {
            id: walletId,
            userId: requesterId
          }
        });
        await tx.walletTransaction.create({
          data: {
            id: `${unique}-wallet-credit`,
            walletId,
            type: "CANCELLATION_REFUND_CREDIT",
            status: "COMPLETED",
            title: "Smoke cancellation credit",
            amountToman: 50000,
            conversationId: paidConversationId,
            paymentId: paidPaymentId,
            createdAt: now
          }
        });

        await tx.cancellation.createMany({
          data: [
            {
              id: `${unique}-completed-cancellation`,
              conversationId: paidConversationId,
              cancelledByUserId: requesterId,
              cancelledByRole: "REQUESTER",
              status: "COMPLETED",
              stage: "AFTER_CONFIRMED_SESSION",
              reasonCode: `${unique}-reason-completed`,
              refundAmountToman: 50000,
              refundDestination: "WALLET",
              completedAt: now,
              createdAt: now
            },
            {
              id: `${unique}-support-cancellation`,
              conversationId: paidConversationId,
              cancelledByUserId: requesterId,
              cancelledByRole: "REQUESTER",
              status: "UNDER_SUPPORT_REVIEW",
              stage: "NEAR_SESSION_START",
              reasonCode: `${unique}-reason-support`,
              supportReviewReason: "smoke support review",
              createdAt: now
            }
          ]
        });

        await tx.insight.createMany({
          data: [
            {
              id: `${unique}-published-insight`,
              slug: `${unique}-published-insight`,
              title: "Smoke Published Insight",
              prompt: "Smoke prompt",
              body: "Smoke body",
              status: "PUBLISHED",
              authorUserId: requesterId,
              experienceProfileId: softwareProfileId,
              publishedAt: now,
              createdAt: now
            },
            {
              id: `${unique}-hidden-insight`,
              slug: `${unique}-hidden-insight`,
              title: "Smoke Hidden Insight",
              prompt: "Smoke prompt",
              body: "Smoke body",
              status: "HIDDEN",
              authorUserId: requesterId,
              experienceProfileId: softwareProfileId,
              hiddenAt: now,
              createdAt: now
            },
            {
              id: `${unique}-archived-insight`,
              slug: `${unique}-archived-insight`,
              title: "Smoke Archived Insight",
              prompt: "Smoke prompt",
              body: "Smoke body",
              status: "ARCHIVED",
              authorUserId: requesterId,
              experienceProfileId: softwareProfileId,
              hiddenAt: now,
              createdAt: now
            },
            {
              id: `${unique}-other-insight`,
              slug: `${unique}-other-insight`,
              title: "Smoke Other Insight",
              prompt: "Smoke prompt",
              body: "Smoke body",
              status: "PUBLISHED",
              authorUserId: secondRequesterId,
              experienceProfileId: otherProfileId,
              publishedAt: now,
              createdAt: now
            }
          ]
        });

        const beforeReadCounts = {
          payments: await tx.payment.count({ where: { id: { startsWith: unique } } }),
          conversations: await tx.conversationRequest.count({ where: { id: { startsWith: unique } } }),
          cancellations: await tx.cancellation.count({ where: { id: { startsWith: unique } } }),
          insights: await tx.insight.count({ where: { id: { startsWith: unique } } }),
          profiles: await tx.experienceProfile.count({ where: { id: { startsWith: unique } } }),
          walletTransactions: await tx.walletTransaction.count({ where: { id: { startsWith: unique } } })
        };
        const analytics = await adminReadModelService.getAnalyticsSummary(viewer, filters, reader);
        const afterReadCounts = {
          payments: await tx.payment.count({ where: { id: { startsWith: unique } } }),
          conversations: await tx.conversationRequest.count({ where: { id: { startsWith: unique } } }),
          cancellations: await tx.cancellation.count({ where: { id: { startsWith: unique } } }),
          insights: await tx.insight.count({ where: { id: { startsWith: unique } } }),
          profiles: await tx.experienceProfile.count({ where: { id: { startsWith: unique } } }),
          walletTransactions: await tx.walletTransaction.count({ where: { id: { startsWith: unique } } })
        };

        if (!baseline.ok || !analytics.ok) {
          throw new Error("Admin analytics smoke read failed.");
        }

        const reasonCompleted = analytics.data.cancellationReasonBreakdown.find((row) => row.reasonCode === `${unique}-reason-completed`);
        const reasonSupport = analytics.data.cancellationReasonBreakdown.find((row) => row.reasonCode === `${unique}-reason-support`);
        const baselineReasonCompleted = baseline.data.cancellationReasonBreakdown.find((row) => row.reasonCode === `${unique}-reason-completed`);
        const baselineReasonSupport = baseline.data.cancellationReasonBreakdown.find((row) => row.reasonCode === `${unique}-reason-support`);
        const categoryBreakdownDelta = categoryDelta(baseline, analytics);

        throw new SmokeRollback({
          gmvDelta: analytics.data.paidGmvToman - baseline.data.paidGmvToman,
          paidOrderDelta: analytics.data.paidOrderCount - baseline.data.paidOrderCount,
          scheduledPaidSessionDelta: analytics.data.scheduledPaidSessionCount - baseline.data.scheduledPaidSessionCount,
          completedPaidSessionDelta: analytics.data.completedPaidSessionCount - baseline.data.completedPaidSessionCount,
          acceptedRequestProxyDelta: analytics.data.acceptedRequestProxyCount - baseline.data.acceptedRequestProxyCount,
          submittedRequestDelta: analytics.data.allRequestCount - baseline.data.allRequestCount,
          activatedSeekerDelta: analytics.data.activatedSeekerCount - baseline.data.activatedSeekerCount,
          qualifiedSignupProxyDelta: analytics.data.qualifiedSignupProxyCount - baseline.data.qualifiedSignupProxyCount,
          payingCustomerDelta: analytics.data.payingCustomers - baseline.data.payingCustomers,
          cancellationDelta: analytics.data.cancellationCount - baseline.data.cancellationCount,
          supportReviewDelta: analytics.data.supportReviewCancellationCount - baseline.data.supportReviewCancellationCount,
          walletCreditDelta: analytics.data.cancellationWalletCreditToman - baseline.data.cancellationWalletCreditToman,
          completedReasonDelta: (reasonCompleted?.count ?? 0) - (baselineReasonCompleted?.count ?? 0),
          supportReasonDelta: (reasonSupport?.count ?? 0) - (baselineReasonSupport?.count ?? 0),
          insightTotalDelta: analytics.data.insightStatusCounts.total - baseline.data.insightStatusCounts.total,
          insightPublishedDelta: (analytics.data.insightStatusCounts.published ?? 0) - (baseline.data.insightStatusCounts.published ?? 0),
          insightHiddenDelta: (analytics.data.insightStatusCounts.hidden ?? 0) - (baseline.data.insightStatusCounts.hidden ?? 0),
          insightArchivedDelta: (analytics.data.insightStatusCounts.archived ?? 0) - (baseline.data.insightStatusCounts.archived ?? 0),
          profileTotalDelta: analytics.data.experienceProfileStatusCounts.total - baseline.data.experienceProfileStatusCounts.total,
          profileActiveDelta: (analytics.data.experienceProfileStatusCounts.active ?? 0) - (baseline.data.experienceProfileStatusCounts.active ?? 0),
          profilePendingDelta: (analytics.data.experienceProfileStatusCounts.pendingReview ?? 0) - (baseline.data.experienceProfileStatusCounts.pendingReview ?? 0),
          profileNeedsDelta: (analytics.data.experienceProfileStatusCounts.needsChanges ?? 0) - (baseline.data.experienceProfileStatusCounts.needsChanges ?? 0),
          profileInactiveDelta: (analytics.data.experienceProfileStatusCounts.inactive ?? 0) - (baseline.data.experienceProfileStatusCounts.inactive ?? 0),
          categoryBreakdownDelta,
          unsupportedMetricIds: analytics.data.unsupportedMetrics.map((metric) => metric.id),
          readCountsUnchanged: JSON.stringify(beforeReadCounts) === JSON.stringify(afterReadCounts)
        });
      }, {
        maxWait: 10_000,
        timeout: 25_000
      });
    } catch (error) {
      if (error instanceof SmokeRollback) {
        summary = error.summary;
      } else {
        throw error;
      }
    }

    expect(summary).toMatchObject({
      gmvDelta: 500000,
      paidOrderDelta: 1,
      scheduledPaidSessionDelta: 0,
      completedPaidSessionDelta: 0,
      acceptedRequestProxyDelta: 1,
      submittedRequestDelta: 3,
      activatedSeekerDelta: 2,
      qualifiedSignupProxyDelta: 8,
      payingCustomerDelta: 1,
      cancellationDelta: 2,
      supportReviewDelta: 1,
      walletCreditDelta: 50000,
      completedReasonDelta: 1,
      supportReasonDelta: 1,
      insightTotalDelta: 3,
      insightPublishedDelta: 1,
      insightHiddenDelta: 1,
      insightArchivedDelta: 1,
      profileTotalDelta: 4,
      profileActiveDelta: 1,
      profilePendingDelta: 1,
      profileNeedsDelta: 1,
      profileInactiveDelta: 1,
      categoryBreakdownDelta: {
        paidGmvToman: 500000,
        paidOrderCount: 1,
        cancellationCount: 2,
        insightCount: 3,
        activeExperienceProfileCount: 1
      },
      readCountsUnchanged: true
    });
    expect(summary?.unsupportedMetricIds).toEqual(expect.arrayContaining(["nmv", "nmv-gmv", "clv"]));

    await expect(prisma.user.findUnique({ where: { id: adminId } })).resolves.toBeNull();
    await expect(prisma.payment.findUnique({ where: { id: paidPaymentId } })).resolves.toBeNull();
    await prisma.$disconnect();
  }, 35_000);
});
