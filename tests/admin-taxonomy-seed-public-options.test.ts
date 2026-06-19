import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { JobField } from "@prisma/client";

import { jobFieldTaxonomy } from "@/features/v51/data/job-fields";
import { getPublicJobFieldOptionsForUseCase } from "@/features/v51/data/public-category-options";
import { getPrismaClient } from "@/lib/backend/db/prisma";
import { useravaaRepository } from "@/lib/backend/repository";
import { mvpJobCategorySeeds, seedMvpJobCategories } from "@/lib/backend/taxonomy-seed";

const projectRoot = process.cwd();

function readProjectFile(relativePath: string) {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

type FakeCategoryRow = {
  slug: string;
  labelFa: string;
  titleEn?: string | null;
  sortOrder: number;
  isActive: boolean;
  showInDiscovery: boolean;
  showInInsights: boolean;
  showInPricing: boolean;
  archivedAt?: Date | null;
  code: JobField | null;
};

function createFakeSeedClient(initialRows: FakeCategoryRow[] = []) {
  const rows = [...initialRows];
  const client = {
    jobCategory: {
      async findUnique(args: { where: { slug: string } }) {
        return rows.find((row) => row.slug === args.where.slug) ?? null;
      },
      async findFirst(args: { where: { code: JobField } }) {
        return rows.find((row) => row.code === args.where.code) ?? null;
      },
      async upsert(args: {
        where: { slug: string };
        update: Partial<FakeCategoryRow>;
        create: FakeCategoryRow;
      }) {
        const existingIndex = rows.findIndex((row) => row.slug === args.where.slug);

        if (existingIndex >= 0) {
          rows[existingIndex] = { ...rows[existingIndex], ...args.update };
          return rows[existingIndex];
        }

        rows.push(args.create);
        return args.create;
      },
    },
  };

  return { client, rows };
}

describe("Checkpoint 3A-9.6 taxonomy seed and public category options", () => {
  it("defines the exact MVP JobCategory seed set without topics or destructive metadata", () => {
    expect(mvpJobCategorySeeds).toHaveLength(14);
    expect(new Set(mvpJobCategorySeeds.map((seed) => seed.slug)).size).toBe(14);
    expect(new Set(mvpJobCategorySeeds.map((seed) => seed.jobField)).size).toBe(14);
    expect(mvpJobCategorySeeds.map((seed) => seed.sortOrder)).toEqual(
      Array.from({ length: 14 }, (_, index) => (index + 1) * 10),
    );
    expect(mvpJobCategorySeeds.map((seed) => seed.jobField)).toEqual([
      "PRODUCT_UX",
      "GRAPHIC_BRAND_IDENTITY",
      "SOFTWARE_ENGINEERING",
      "DATA_AI",
      "MARKETING_BRAND",
      "BUSINESS_ANALYSIS_DEVELOPMENT",
      "OPERATIONS",
      "CUSTOMER_EXPERIENCE",
      "CUSTOMER_SUPPORT",
      "SALES_COMMERCE",
      "STRATEGY_BUSINESS_MODEL",
      "FINANCE_LEGAL_INVESTMENT",
      "HR_ORG_CULTURE",
      "MANAGEMENT_LEADERSHIP_ENTREPRENEURSHIP",
    ]);
    expect(
      mvpJobCategorySeeds.every(
        (seed) => seed.showInDiscovery && seed.showInInsights && seed.showInPricing,
      ),
    ).toBe(true);
  });

  it("seeds missing categories idempotently by slug and never overwrites existing admin-edited rows", async () => {
    const { client, rows } = createFakeSeedClient([
      {
        slug: "product-ux",
        labelFa: "Admin Edited Product Label",
        titleEn: "Admin Edited Product Title",
        sortOrder: 999,
        isActive: false,
        showInDiscovery: false,
        showInInsights: false,
        showInPricing: false,
        archivedAt: new Date("2026-01-01T00:00:00.000Z"),
        code: "PRODUCT_UX",
      },
    ]);

    const firstRun = await seedMvpJobCategories(client as never);
    const secondRun = await seedMvpJobCategories(client as never);
    const existingProduct = rows.find((row) => row.slug === "product-ux");

    expect(firstRun).toMatchObject({
      attempted: 14,
      created: 13,
      existing: 1,
      skippedCodeConflicts: 0,
    });
    expect(secondRun).toMatchObject({
      attempted: 14,
      created: 0,
      existing: 14,
      skippedCodeConflicts: 0,
    });
    expect(rows).toHaveLength(14);
    expect(existingProduct).toMatchObject({
      labelFa: "Admin Edited Product Label",
      titleEn: "Admin Edited Product Title",
      sortOrder: 999,
      isActive: false,
      showInDiscovery: false,
      showInInsights: false,
      showInPricing: false,
      code: "PRODUCT_UX",
    });
  });

  it("skips slug-missing seeds when their JobField code already belongs to another category", async () => {
    const { client, rows } = createFakeSeedClient([
      {
        slug: "admin-custom-product",
        labelFa: "Admin Product Category",
        sortOrder: 1,
        isActive: true,
        showInDiscovery: true,
        showInInsights: true,
        showInPricing: true,
        archivedAt: null,
        code: "PRODUCT_UX",
      },
    ]);

    const result = await seedMvpJobCategories(client as never);

    expect(result.skippedCodeConflicts).toBe(1);
    expect(result.skippedConflicts).toEqual([
      {
        slug: "product-ux",
        jobField: "PRODUCT_UX",
        existingSlug: "admin-custom-product",
      },
    ]);
    expect(rows.some((row) => row.slug === "product-ux")).toBe(false);
  });

  it("keeps seed and public option code scoped away from linked record deletion or lifecycle mutation", () => {
    const source = [
      readProjectFile("src/lib/backend/taxonomy-seed.ts"),
      readProjectFile("tools/taxonomy/seed-mvp-job-categories.mjs"),
      readProjectFile("src/features/v51/data/public-category-options.ts"),
    ].join("\n");

    expect(source).toContain("upsert");
    expect(source).toContain("update: {}");
    expect(source).not.toMatch(/\.(delete|deleteMany|archive|restore)\(/);
    expect(source).not.toMatch(/\.(profile|insight|pricingRule|conversationRequest|walletTransaction)\.(create|update|upsert|delete)/);
  });

  it("maps active DB category labels to existing JobField options and returns empty options when DB is unavailable", async () => {
    const requestedUseCases: string[] = [];
    const reader = {
      async listActiveCategoriesForUseCase(useCase: string) {
        requestedUseCases.push(useCase);
        return {
          ok: true,
          data: [
            { labelFa: jobFieldTaxonomy[0] },
            { labelFa: "Inactive or non-compatible category" },
            { labelFa: jobFieldTaxonomy[1] },
            { labelFa: jobFieldTaxonomy[0] },
          ],
        };
      },
    };

    const discovery = await getPublicJobFieldOptionsForUseCase("discovery", reader as never);
    const profile = await getPublicJobFieldOptionsForUseCase("profile", reader as never);
    const insights = await getPublicJobFieldOptionsForUseCase("insights", reader as never);
    const blocked = await getPublicJobFieldOptionsForUseCase("discovery", {
      async listActiveCategoriesForUseCase() {
        return { ok: false };
      },
    } as never);
    const thrown = await getPublicJobFieldOptionsForUseCase("discovery", {
      async listActiveCategoriesForUseCase() {
        throw new Error("database unavailable");
      },
    } as never);

    expect(discovery).toEqual({ source: "database", options: [jobFieldTaxonomy[0], jobFieldTaxonomy[1]] });
    expect(profile.options).toEqual([jobFieldTaxonomy[0], jobFieldTaxonomy[1]]);
    expect(insights.options).toEqual([jobFieldTaxonomy[0], jobFieldTaxonomy[1]]);
    expect(requestedUseCases).toEqual(["discovery", "discovery", "insights"]);
    expect(blocked).toEqual({ source: "unavailable", options: [] });
    expect(thrown).toEqual({ source: "unavailable", options: [] });
  });

  it("wires public discovery, profile builder, and insights routes through DB-backed category options", () => {
    const discoverRoute = readProjectFile("src/app/discover/page.tsx");
    const profileBuildRoute = readProjectFile("src/app/profile/build/page.tsx");
    const insightsRoute = readProjectFile("src/app/insights/page.tsx");
    const discoverPage = readProjectFile("src/features/v51/discover/DiscoverPage.tsx");
    const profileBuilderPage = readProjectFile("src/features/v51/my-profile/pages/ProfileBuilderPage.tsx");
    const insightsPage = readProjectFile("src/features/v51/insights/InsightsPage.tsx");

    expect(discoverRoute).toContain('getPublicJobFieldOptionsForUseCase("discovery")');
    expect(discoverRoute).toContain("jobCategoryOptions={jobCategoryOptions.options}");
    expect(profileBuildRoute).toContain('getPublicJobFieldOptionsForUseCase("profile")');
    expect(profileBuildRoute).toContain("jobFieldOptions={jobFieldOptions.options}");
    expect(insightsRoute).toContain('getPublicJobFieldOptionsForUseCase("insights")');
    expect(insightsRoute).toContain("jobCategoryOptions={jobCategoryOptions.options}");
    expect(discoverPage).toContain("jobCategoryOptions ?? getDiscoverJobCategoryOptions(profiles)");
    expect(profileBuilderPage).toContain("jobFieldOptions={jobFieldOptions}");
    expect(insightsPage).toContain("jobCategoryOptions ?? categoryOptions");
  });

  it("runs rollback-backed DB smoke coverage for MVP taxonomy seeding when enabled", async () => {
    if (process.env.USERAVAA_DB_SMOKE_TEST !== "1") {
      expect(process.env.USERAVAA_DB_SMOKE_TEST).not.toBe("1");
      return;
    }

    class SmokeRollback extends Error {
      constructor(readonly summary: Record<string, unknown>) {
        super("MVP_TAXONOMY_SEED_SMOKE_ROLLBACK");
      }
    }

    const prisma = getPrismaClient();
    const seedSlugs = mvpJobCategorySeeds.map((seed) => seed.slug);
    const unique = `taxonomy-seed-smoke-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    let missingBefore: string[] = [];
    let summary: Record<string, unknown> | null = null;

    try {
      await prisma.$transaction(async (tx) => {
        const existingBefore = await tx.jobCategory.findMany({
          where: { slug: { in: seedSlugs } },
          select: { slug: true },
        });
        const existingBeforeSlugs = new Set(existingBefore.map((row) => row.slug));
        missingBefore = seedSlugs.filter((slug) => !existingBeforeSlugs.has(slug));
        const linkedCountsBefore = {
          profiles: await tx.experienceProfile.count(),
          insights: await tx.insight.count(),
          pricingRules: await tx.pricingRule.count(),
        };

        const seedResult = await seedMvpJobCategories(tx as never);
        const seededRows = await tx.jobCategory.findMany({
          where: { slug: { in: seedSlugs } },
          select: {
            slug: true,
            labelFa: true,
            isActive: true,
            showInDiscovery: true,
            showInInsights: true,
            showInPricing: true,
            archivedAt: true,
            code: true,
          },
        });
        const hiddenLabel = `دسته پنهان ${unique}`;

        await tx.jobCategory.create({
          data: {
            slug: `${unique}-hidden`,
            labelFa: hiddenLabel,
            sortOrder: 1,
            isActive: false,
            showInDiscovery: true,
            showInInsights: true,
            showInPricing: true,
            archivedAt: new Date(),
            code: null,
          },
        });

        const activeDiscovery = await useravaaRepository.adminCategories.listActiveCategoriesForUseCase("discovery", tx as never);
        const publicOptions = await getPublicJobFieldOptionsForUseCase("discovery", {
          async listActiveCategoriesForUseCase(useCase) {
            return useravaaRepository.adminCategories.listActiveCategoriesForUseCase(useCase, tx as never);
          },
        });
        const linkedCountsAfter = {
          profiles: await tx.experienceProfile.count(),
          insights: await tx.insight.count(),
          pricingRules: await tx.pricingRule.count(),
        };

        throw new SmokeRollback({
          attemptedAllSeeds: seedResult.attempted === 14,
          createdMatchesUnblockedMissing: seedResult.created === missingBefore.length - seedResult.skippedCodeConflicts,
          accountedForEverySeed:
            seedResult.created + seedResult.existing + seedResult.skippedCodeConflicts === mvpJobCategorySeeds.length,
          seededRowsPresent: seededRows.length >= mvpJobCategorySeeds.length - seedResult.skippedCodeConflicts,
          seededRowsAreUsableWhenCreated: seededRows
            .filter((row) => missingBefore.includes(row.slug))
            .every(
              (row) =>
                row.isActive &&
                row.archivedAt === null &&
                row.showInDiscovery &&
                row.showInInsights &&
                row.showInPricing &&
                Boolean(row.code),
            ),
          hiddenCategoryExcluded:
            activeDiscovery.ok && !activeDiscovery.data.some((category) => category.labelFa === hiddenLabel),
          publicOptionsIncludeSeededCategory: publicOptions.options.some((option) => jobFieldTaxonomy.includes(option)),
          publicOptionsExcludeHidden: !publicOptions.options.includes(hiddenLabel as never),
          publicOptionsSource: publicOptions.source,
          linkedCountsUnchanged: JSON.stringify(linkedCountsBefore) === JSON.stringify(linkedCountsAfter),
        });
      }, { timeout: 30_000 });
    } catch (error) {
      if (error instanceof SmokeRollback) {
        summary = error.summary;
      } else {
        throw error;
      }
    }

    expect(summary).toMatchObject({
      attemptedAllSeeds: true,
      createdMatchesUnblockedMissing: true,
      accountedForEverySeed: true,
      seededRowsPresent: true,
      seededRowsAreUsableWhenCreated: true,
      hiddenCategoryExcluded: true,
      publicOptionsIncludeSeededCategory: true,
      publicOptionsExcludeHidden: true,
      publicOptionsSource: "database",
      linkedCountsUnchanged: true,
    });

    if (missingBefore.length > 0) {
      await expect(prisma.jobCategory.findUnique({ where: { slug: missingBefore[0] } })).resolves.toBeNull();
    }

    await expect(prisma.jobCategory.findUnique({ where: { slug: `${unique}-hidden` } })).resolves.toBeNull();
    await prisma.$disconnect();
  }, 35_000);
});
