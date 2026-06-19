import type { ContentEntryStatus, ContentEntryType, Prisma, PrismaClient } from "@prisma/client";

import seedRows from "../../../tools/content/platform-content-seeds.json";

export type PlatformContentSeed = {
  namespace: string;
  key: string;
  locale: string;
  title: string;
  body: string;
  shortText: string | null;
  description: string | null;
  contentType: ContentEntryType;
  status: Exclude<ContentEntryStatus, "ARCHIVED">;
  isEditable: boolean;
  isSystem: boolean;
};

export type PlatformContentSeedResult = {
  attempted: number;
  created: number;
  existing: number;
  createdKeys: string[];
  existingKeys: string[];
};

type ContentSeedClient = Pick<PrismaClient, "contentEntry">;

export const platformContentSeeds = seedRows as readonly PlatformContentSeed[];

export async function seedPlatformContentEntries(db: ContentSeedClient): Promise<PlatformContentSeedResult> {
  const result: PlatformContentSeedResult = {
    attempted: platformContentSeeds.length,
    created: 0,
    existing: 0,
    createdKeys: [],
    existingKeys: []
  };

  for (const seed of platformContentSeeds) {
    const existing = await db.contentEntry.findUnique({
      where: {
        namespace_key_locale: {
          namespace: seed.namespace,
          key: seed.key,
          locale: seed.locale
        }
      },
      select: {
        id: true,
        namespace: true,
        key: true,
        locale: true
      }
    });
    const seedKey = platformContentSeedKey(seed);

    if (existing) {
      result.existing += 1;
      result.existingKeys.push(seedKey);
      continue;
    }

    await db.contentEntry.create({
      data: toContentEntryCreateInput(seed),
      select: {
        id: true
      }
    });

    result.created += 1;
    result.createdKeys.push(seedKey);
  }

  return result;
}

export function platformContentSeedKey(seed: Pick<PlatformContentSeed, "namespace" | "key" | "locale">) {
  return `${seed.namespace}.${seed.key}:${seed.locale}`;
}

function toContentEntryCreateInput(seed: PlatformContentSeed): Prisma.ContentEntryUncheckedCreateInput {
  return {
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
    archivedAt: null
  };
}
