import type { JobField, PrismaClient } from "@prisma/client";

import seedRows from "../../../tools/taxonomy/mvp-job-category-seeds.json";

export type MvpJobCategorySeed = {
  slug: string;
  titleFa: string;
  titleEn?: string;
  jobField: JobField;
  sortOrder: number;
  showInDiscovery: boolean;
  showInInsights: boolean;
  showInPricing: boolean;
};

export type TaxonomySeedConflict = {
  slug: string;
  jobField: JobField;
  existingSlug: string;
};

export type TaxonomySeedResult = {
  attempted: number;
  created: number;
  existing: number;
  skippedCodeConflicts: number;
  createdSlugs: string[];
  existingSlugs: string[];
  skippedConflicts: TaxonomySeedConflict[];
};

type TaxonomySeedClient = Pick<PrismaClient, "jobCategory">;

export const mvpJobCategorySeeds = seedRows as readonly MvpJobCategorySeed[];

export async function seedMvpJobCategories(db: TaxonomySeedClient): Promise<TaxonomySeedResult> {
  const result: TaxonomySeedResult = {
    attempted: mvpJobCategorySeeds.length,
    created: 0,
    existing: 0,
    skippedCodeConflicts: 0,
    createdSlugs: [],
    existingSlugs: [],
    skippedConflicts: [],
  };

  for (const seed of mvpJobCategorySeeds) {
    const existingBySlug = await db.jobCategory.findUnique({
      where: { slug: seed.slug },
      select: { slug: true },
    });

    if (existingBySlug) {
      await db.jobCategory.upsert({
        where: { slug: seed.slug },
        update: {},
        create: toJobCategoryCreateInput(seed),
      });

      result.existing += 1;
      result.existingSlugs.push(seed.slug);
      continue;
    }

    const existingByCode = await db.jobCategory.findFirst({
      where: { code: seed.jobField },
      select: { slug: true },
    });

    if (existingByCode) {
      result.skippedCodeConflicts += 1;
      result.skippedConflicts.push({
        slug: seed.slug,
        jobField: seed.jobField,
        existingSlug: existingByCode.slug,
      });
      continue;
    }

    await db.jobCategory.upsert({
      where: { slug: seed.slug },
      update: {},
      create: toJobCategoryCreateInput(seed),
    });

    result.created += 1;
    result.createdSlugs.push(seed.slug);
  }

  return result;
}

function toJobCategoryCreateInput(seed: MvpJobCategorySeed) {
  return {
    slug: seed.slug,
    labelFa: seed.titleFa,
    titleEn: seed.titleEn,
    parentId: null,
    sortOrder: seed.sortOrder,
    isActive: true,
    showInDiscovery: seed.showInDiscovery,
    showInInsights: seed.showInInsights,
    showInPricing: seed.showInPricing,
    code: seed.jobField,
  };
}
