import fs from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AdminAnalyticsSummary, AdminHome } from "@/features/v51/admin/AdminSurfaces";
import { getAdminAuditLogRouteData } from "@/features/v51/admin/server-data";
import { buildUnavailableAdminPaidSessionsKpiTree } from "@/lib/backend/admin-kpi-tree";
import { adminReadModelService } from "@/lib/backend/admin-read-models";
import { adminReadModelRepository } from "@/lib/backend/repositories/admin-read-model";
import { backendImplementationClassification } from "@/lib/backend/implementation-classification";
import type { Viewer } from "@/lib/auth/types";

const admin: Viewer = {
  id: "admin-support",
  role: "ADMIN",
  displayName: "پشتیبانی"
};

const requester: Viewer = {
  id: "user-requester",
  role: "USER",
  displayName: "علی"
};

function projectFile(relativePath: string) {
  return path.join(process.cwd(), relativePath);
}

function readProjectFile(relativePath: string) {
  return fs.readFileSync(projectFile(relativePath), "utf8");
}

function adminRouteFile(route: string) {
  return readProjectFile(`src/app/admin/${route}/page.tsx`);
}

describe("Checkpoint 3A-2 admin repository-backed read models", () => {
  it("exposes read-only admin read-model functions and classifications", () => {
    expect(Object.keys(adminReadModelRepository.methods)).toEqual(
      expect.arrayContaining([
        "getDashboard",
        "listActionQueue",
        "listConversations",
        "getConversationDetail",
        "listCancellations",
        "getCancellationDetail",
        "listUsers",
        "getUserDetail",
        "listExperienceProfiles",
        "getExperienceProfileDetail",
        "listInsights",
        "getInsightDetail",
        "listWalletTransactions",
        "listAttendance",
        "getAnalyticsSummary"
      ])
    );

    Object.values(adminReadModelRepository.methods).forEach((classification) => {
      expect(classification).toBe("read_only_persistent");
    });

    expect(backendImplementationClassification.adminReadModels).toMatchObject({
      classification: "read_only_persistent",
      readsUseRepository: true,
      writesImplemented: false
    });
  });

  it("keeps admin read services behind ADMIN or SUPPORT roles", async () => {
    const result = await adminReadModelService.getDashboard(requester);

    expect(result).toMatchObject({
      ok: false,
      code: "unauthorized"
    });
  });

  it("renders a repository-backed admin home action queue without fixture data", () => {
    const html = renderToStaticMarkup(
      <AdminHome
        sourceNote="repository-backed"
        metrics={[
          {
            id: "payments-awaiting-review",
            label: "پرداخت‌های در انتظار بررسی",
            value: "۲",
            helper: "داده متصل به پایگاه داده",
            href: "/admin/payments",
            source: "backend_repository"
          }
        ]}
        actionItems={[
          {
            id: "manual-payment:1",
            actionType: "بررسی پرداخت دستی",
            priority: "فوری",
            relatedEntity: "گفت‌وگو",
            relatedUsers: "درخواست‌دهنده / تجربه‌آفرین",
            status: "SUBMITTED",
            createdAt: "2026-06-13",
            href: "/admin/payments/pay_1",
            ctaLabel: "بررسی پرداخت",
            source: "backend_repository"
          }
        ]}
      />
    );

    expect(html).toContain("Repository");
    expect(html).toContain("repository-backed");
    expect(html).toContain("/admin/payments/pay_1");
  });

  it("wires admin routes to admin read-model server data", () => {
    expect(readProjectFile("src/app/admin/page.tsx")).toContain("getAdminHomeRouteData");
    expect(adminRouteFile("conversations")).toContain("getAdminConversationRouteData");
    expect(readProjectFile("src/app/admin/conversations/[conversationId]/page.tsx")).toContain(
      "getAdminConversationDetailRouteData"
    );
    expect(adminRouteFile("cancellations")).toContain("getAdminCancellationRouteData");
    expect(readProjectFile("src/app/admin/cancellations/[cancellationId]/page.tsx")).toContain(
      "getAdminCancellationDetailRouteData"
    );
    expect(adminRouteFile("users")).toContain("getAdminUserRouteData");
    expect(readProjectFile("src/app/admin/users/[userId]/page.tsx")).toContain("getAdminUserDetailRouteData");
    expect(adminRouteFile("experience-profiles")).toContain("getAdminExperienceProfileRouteData");
    expect(readProjectFile("src/app/admin/experience-profiles/[profileId]/page.tsx")).toContain(
      "getAdminExperienceProfileDetailRouteData"
    );
    expect(adminRouteFile("insights")).toContain("getAdminInsightRouteData");
    expect(readProjectFile("src/app/admin/insights/[insightId]/page.tsx")).toContain(
      "getAdminInsightDetailRouteData"
    );
    expect(adminRouteFile("wallet-transactions")).toContain("getAdminWalletTransactionRouteData");
    expect(adminRouteFile("attendance")).toContain("getAdminAttendanceRouteData");
    expect(adminRouteFile("analytics")).toContain("getAdminAnalyticsRouteData");
    expect(adminRouteFile("audit-log")).toContain("getAdminAuditLogRouteData");
  });

  it("labels analytics placeholders and does not fake unsupported metrics", () => {
    const html = renderToStaticMarkup(
      <AdminAnalyticsSummary
        data={{
          source: "placeholder",
          sourceNote: "placeholder",
          activeDateRangeLabel: "۳۰ روز گذشته",
          activeCategoryLabel: "همه دسته‌ها",
          dateRangeOptions: [
            {
              label: "۳۰ روز گذشته",
              value: "last_30_days",
              href: "/admin/analytics?range=last_30_days",
              active: true
            }
          ],
          categoryOptions: [
            {
              label: "همه دسته‌ها",
              value: "",
              href: "/admin/analytics?range=last_30_days",
              active: true
            }
          ],
          metrics: [
            {
              id: "analytics-unavailable",
              label: "داده تحلیل",
              value: "ناموجود",
              helper: "در این نسخه هنوز محاسبه نمی‌شود",
              source: "placeholder"
            }
          ],
          kpiTree: buildUnavailableAdminPaidSessionsKpiTree("۳۰ روز گذشته", "همه دسته‌ها"),
          breakdownSections: [],
          unsupportedMetrics: [
            {
              id: "clv",
              label: "CLV",
              reason: "پیاده‌سازی نشده"
            },
            {
              id: "retention",
              label: "retention",
              reason: "Needs event tracking"
            }
          ],
          dataQualityNotes: ["no fake values"]
        }}
      />
    );

    expect(html).toContain("Placeholder");
    expect(html).toContain("CLV");
    expect(html).toContain("پیاده‌سازی نشده");
  });

  it("keeps audit log honest while using audit persistence when available", async () => {
    const auditLog = await getAdminAuditLogRouteData(admin);

    expect(["backend_repository", "placeholder"]).toContain(auditLog.source);

    if (auditLog.source === "backend_repository") {
      expect(auditLog.implemented).toBe(true);
      auditLog.rows.forEach((row) => {
        expect(row.actionLabel).not.toBe("");
        expect(row.actorSummary).not.toBe("");
        expect(row.statusChange).not.toBe("");
      });
    } else {
      expect(auditLog).toMatchObject({
        implemented: false,
        source: "placeholder",
        rows: []
      });
    }
  });

  it("does not import UI fixtures or mutation operations in backend admin read models", () => {
    const source = readProjectFile("src/lib/backend/repositories/admin-read-model.ts");

    expect(source).not.toContain("@/features/v51/data");
    expect(source).not.toContain("features/v51/data");
    expect(source).not.toMatch(/\.(create|update|upsert|delete|deleteMany)\(/);
    expect(source).not.toContain("receiptUrl");
  });

  it("does not expose raw attendance secrets or runtime secrets in admin read surfaces", () => {
    const files = [
      "src/lib/backend/repositories/admin-read-model.ts",
      "src/lib/backend/admin-read-models.ts",
      "src/features/v51/admin/server-data.ts",
      "src/features/v51/admin/AdminSurfaces.tsx"
    ];
    const forbidden = [
      "codeHash",
      "codeSalt",
      "requesterCodeCiphertext",
      "submittedCodeHash",
      "attendanceVerificationCode",
      "DATABASE_URL",
      "PRISMA_ACCELERATE",
      "API_KEY"
    ];

    files.forEach((file) => {
      const source = readProjectFile(file);
      forbidden.forEach((term) => {
        expect(source.includes(term), `${file} contains ${term}`).toBe(false);
      });
    });
  });
});
