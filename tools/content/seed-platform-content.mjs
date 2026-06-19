import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const seedRows = JSON.parse(fs.readFileSync(path.join(rootDir, "tools/content/platform-content-seeds.json"), "utf8"));

for (const envFileName of [".env.local", ".env.local.txt"]) {
  loadEnvFile(path.join(rootDir, envFileName));
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is required for platform content seeding.");
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg(databaseUrl),
  errorFormat: "minimal",
});

try {
  const result = await seedPlatformContentEntries(prisma);
  console.log(
    [
      "Platform content seed complete.",
      `attempted=${result.attempted}`,
      `created=${result.created}`,
      `existing=${result.existing}`,
    ].join(" "),
  );
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

async function seedPlatformContentEntries(db) {
  const result = {
    attempted: seedRows.length,
    created: 0,
    existing: 0,
  };

  for (const seed of seedRows) {
    const existing = await db.contentEntry.findUnique({
      where: {
        namespace_key_locale: {
          namespace: seed.namespace,
          key: seed.key,
          locale: seed.locale,
        },
      },
      select: {
        id: true,
      },
    });

    if (existing) {
      result.existing += 1;
      continue;
    }

    await db.contentEntry.create({
      data: {
        key: seed.key,
        namespace: seed.namespace,
        locale: seed.locale,
        title: seed.title,
        body: seed.body,
        shortText: seed.shortText,
        description: seed.description,
        contentType: seed.contentType,
        status: seed.status,
        isEditable: seed.isEditable,
        isSystem: seed.isSystem,
        createdByAdminId: null,
        updatedByAdminId: null,
        archivedAt: null,
      },
      select: {
        id: true,
      },
    });

    result.created += 1;
  }

  return result;
}
