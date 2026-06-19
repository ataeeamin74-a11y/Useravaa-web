import type { PrismaClient } from "@prisma/client";

import { useravaaRepository } from "./repository";

type PublishedContentReader = Pick<PrismaClient, "contentEntry">;

export type RuntimeContentReference = {
  namespace: string;
  key: string;
  locale?: string;
  fallback: string;
};

export type RuntimeContentMap = Record<string, string>;

export async function getPublishedContentValue(
  reference: RuntimeContentReference,
  reader?: PublishedContentReader
): Promise<string> {
  const result = await useravaaRepository.adminContent.getPublishedContentByKey(
    {
      namespace: reference.namespace,
      key: reference.key,
      locale: reference.locale ?? "fa"
    },
    reader
  );

  if (!result.ok || !result.data) {
    return reference.fallback;
  }

  return contentEntryText(result.data) || reference.fallback;
}

export async function getPublishedContentMap(
  references: readonly RuntimeContentReference[],
  reader?: PublishedContentReader
): Promise<RuntimeContentMap> {
  const pairs = await Promise.all(
    references.map(async (reference) => [
      `${reference.namespace}.${reference.key}`,
      await getPublishedContentValue(reference, reader)
    ] as const)
  );

  return Object.fromEntries(pairs);
}

function contentEntryText(entry: { shortText: string | null; body: string }) {
  return (entry.shortText?.trim() || entry.body.trim()).replace(/[<>]/g, "");
}
