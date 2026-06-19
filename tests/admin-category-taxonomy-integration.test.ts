import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildAdminPaidSessionsKpiTree } from "@/lib/backend/admin-kpi-tree";
import type { AdminKpiTreeNode } from "@/lib/backend/admin-kpi-tree";
import { useravaaRepository } from "@/lib/backend/repository";

const projectRoot = process.cwd();

function readProjectFile(relativePath: string) {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

function flattenKpiTree(nodes: readonly AdminKpiTreeNode[]): AdminKpiTreeNode[] {
  return nodes.flatMap((node) => [node, ...flattenKpiTree(node.children)]);
}

describe("Checkpoint 3A-9.5 category taxonomy integration audit", () => {
  it("keeps JobCategory as the canonical admin taxonomy with parent-based topics", () => {
    const schema = readProjectFile("prisma/schema.prisma");

    expect(schema).toContain("model JobCategory");
    expect(schema).toContain("slug             String            @unique");
    expect(schema).toContain("parentId         String?");
    expect(schema).toContain("@relation(\"JobCategoryHierarchy\"");
    expect(schema).toContain("profiles         ProfileCategory[]");
    expect(schema).toContain("model ProfileCategory");
    expect(schema).toContain("category   JobCategory");
    expect(schema).not.toContain("model CareerCategory");
    expect(schema).not.toContain("model CareerTopic");
  });

  it("uses active non-archived category helpers for discovery, insights, and pricing options", async () => {
    const capturedWhere: Record<string, unknown>[] = [];
    const reader = {
      jobCategory: {
        async findMany(args: { where: Record<string, unknown> }) {
          capturedWhere.push(args.where);
          return [];
        }
      }
    };

    await useravaaRepository.adminCategories.listActiveCategoriesForUseCase("discovery", reader as never);
    await useravaaRepository.adminCategories.listActiveCategoriesForUseCase("insights", reader as never);
    await useravaaRepository.adminCategories.listActiveCategoriesForUseCase("pricing", reader as never);

    expect(capturedWhere).toEqual([
      { isActive: true, archivedAt: null, showInDiscovery: true },
      { isActive: true, archivedAt: null, showInInsights: true },
      { isActive: true, archivedAt: null, showInPricing: true }
    ]);
  });

  it("keeps admin parent-category selection active and non-archived while preserving historical labels", () => {
    const adminServerData = readProjectFile("src/features/v51/admin/server-data.ts");
    const experienceProfileRepository = readProjectFile("src/lib/backend/repositories/experience-profile.ts");
    const adminReadModelRepository = readProjectFile("src/lib/backend/repositories/admin-read-model.ts");

    expect(adminServerData).toContain("category.id !== excludedId && category.isActive && !category.archivedAt");
    expect(experienceProfileRepository).toContain("categories: {");
    expect(experienceProfileRepository).toContain("labelFa: true");
    expect(experienceProfileRepository).not.toContain("categories: {\n        where: {");
    expect(adminReadModelRepository).toContain("profile.categories?.forEach");
    expect(adminReadModelRepository).toContain("categoryLabels.set(item.category.code, item.category.labelFa)");
  });

  it("keeps pricing category options limited to active showInPricing JobCategory rows", async () => {
    const capturedWhere: Record<string, unknown>[] = [];
    const reader = {
      pricingRule: {
        async findMany() {
          return [];
        }
      },
      jobCategory: {
        async findMany(args: { where: Record<string, unknown> }) {
          capturedWhere.push(args.where);
          return [
            {
              code: "SOFTWARE_ENGINEERING",
              labelFa: "مهندسی نرم‌افزار"
            }
          ];
        }
      }
    };

    const result = await useravaaRepository.pricingRules.listPricingRules(reader as never);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.categoryOptions).toEqual([{ code: "SOFTWARE_ENGINEERING", labelFa: "مهندسی نرم‌افزار" }]);
    }
    expect(capturedWhere).toEqual([
      {
        isActive: true,
        archivedAt: null,
        showInPricing: true,
        code: { not: null }
      }
    ]);
  });

  it("keeps analytics labels DB-preferred and KPI category handling explicit", () => {
    const adminReadModelRepository = readProjectFile("src/lib/backend/repositories/admin-read-model.ts");
    const kpiTree = buildAdminPaidSessionsKpiTree({
      dateRangeLabel: "۳۰ روز اخیر",
      categoryLabel: "مهندسی نرم‌افزار",
      categoryFilterSelected: true,
      completedPaidSessionCount: 3,
      scheduledPaidSessionCount: 4,
      paidSessionCount: 5,
      acceptedRequestProxyCount: 6,
      submittedRequestCount: 7,
      activatedSeekerCount: 7,
      qualifiedSignupProxyCount: 10
    });

    expect(adminReadModelRepository).toContain("db.jobCategory.findMany");
    expect(adminReadModelRepository).toContain("isActive: true");
    expect(adminReadModelRepository).toContain("archivedAt: null");
    expect(adminReadModelRepository).toContain("categoryLabels.set(row.code, row.labelFa)");
    const byId = new Map(flattenKpiTree(kpiTree).map((node) => [node.id, node]));

    expect(byId.get("completed_paid_sessions")?.categoryFilterStatus).toBe("applied");
    expect(byId.get("completed_paid_sessions")?.categoryFilterLabel).toContain("مهندسی نرم‌افزار");
    expect(byId.get("submitted_requests")?.categoryFilterStatus).toBe("applied");
    expect(byId.get("qualified_visitors")?.categoryFilterStatus).toBe("not_supported");
  });

  it("routes public category option surfaces through DB-backed active categories without fake production rows", () => {
    const discoverRoute = readProjectFile("src/app/discover/page.tsx");
    const profileBuildRoute = readProjectFile("src/app/profile/build/page.tsx");
    const insightsRoute = readProjectFile("src/app/insights/page.tsx");
    const discoveryData = readProjectFile("src/features/v51/data/experience-discovery.ts");
    const profileBuilderSelect = readProjectFile("src/features/v51/my-profile/components/JobFieldSelect.tsx");
    const insightsPage = readProjectFile("src/features/v51/insights/InsightsPage.tsx");
    const categoryAdminSources = [
      readProjectFile("src/lib/backend/repositories/admin-category.ts"),
      readProjectFile("src/features/v51/admin/server-data.ts"),
      readProjectFile("src/features/v51/admin/AdminSurfaces.tsx"),
      readProjectFile("src/app/admin/categories/page.tsx")
    ].join("\n");

    expect(discoverRoute).toContain('getPublicJobFieldOptionsForUseCase("discovery")');
    expect(profileBuildRoute).toContain('getPublicJobFieldOptionsForUseCase("profile")');
    expect(insightsRoute).toContain('getPublicJobFieldOptionsForUseCase("insights")');
    expect(discoveryData).toContain("getDiscoverJobCategoryOptions");
    expect(discoveryData).toContain("jobFieldTaxonomy.filter");
    expect(profileBuilderSelect).toContain("options ?? jobFieldTaxonomy");
    expect(profileBuilderSelect).not.toContain("jobFieldTaxonomy.map");
    expect(insightsPage).toContain("jobCategoryOptions ?? categoryOptions");
    expect(categoryAdminSources).not.toContain("getConversationOrFallback");
    expect(categoryAdminSources).not.toContain("fake category");
    expect(categoryAdminSources).not.toContain("demo category");
  });
});
