import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const seedRows = JSON.parse(fs.readFileSync(path.join(rootDir, "tools/taxonomy/mvp-job-category-seeds.json"), "utf8"));

for (const envFileName of [".env.local", ".env.local.txt"]) {
  loadEnvFile(path.join(rootDir, envFileName));
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is required for taxonomy seeding.");
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg(databaseUrl),
  errorFormat: "minimal",
});

try {
  const result = await seedMvpJobCategories(prisma);
  console.log(
    [
      "MVP taxonomy seed complete.",
      `attempted=${result.attempted}`,
      `created=${result.created}`,
      `existing=${result.existing}`,
      `skippedCodeConflicts=${result.skippedCodeConflicts}`,
    ].join(" "),
  );

  if (result.skippedCodeConflicts > 0) {
    console.log(
      `Skipped ${result.skippedCodeConflicts} category seed row(s) because the JobField code already belongs to another slug.`,
    );
  }
} finally {
  await prisma.$disconnect();
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/u);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const equalsIndex = trimmed.indexOf("=");

    if (equalsIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, equalsIndex).trim();
    let value = trimmed.slice(equalsIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

async function seedMvpJobCategories(db) {
  const result = {
    attempted: seedRows.length,
    created: 0,
    existing: 0,
    skippedCodeConflicts: 0,
    createdSlugs: [],
    existingSlugs: [],
    skippedConflicts: [],
  };

  for (const seed of seedRows) {
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

function toJobCategoryCreateInput(seed) {
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
