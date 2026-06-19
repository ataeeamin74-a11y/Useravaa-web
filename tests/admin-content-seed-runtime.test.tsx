import fs from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DiscoverPage } from "@/features/v51/discover/DiscoverPage";
import { InsightsPage } from "@/features/v51/insights/InsightsPage";
import { getPrismaClient } from "@/lib/backend/db/prisma";
import { getPublishedContentMap, getPublishedContentValue } from "@/lib/backend/content-runtime";
import {
  platformContentSeeds,
  platformContentSeedKey,
  seedPlatformContentEntries,
  type PlatformContentSeed
} from "@/lib/backend/content-seed";

const projectRoot = process.cwd();
const now = new Date("2026-06-20T00:00:00.000Z");

type FakeContentRow = {
  id: string;
  namespace: string;
  key: string;
  locale: string;
  title: string;
  body: string;
  shortText: string | null;
  description: string | null;
  contentType: PlatformContentSeed["contentType"];
  status: "DRAFT" | "PUBLISHED" | "HIDDEN" | "ARCHIVED";
  isEditable: boolean;
  isSystem: boolean;
  createdByAdminId: string | null;
  updatedByAdminId: string | null;
  archivedAt: Date | null;
};

function readProjectFile(relativePath: string) {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

function readClientSourceFiles(dir: string): string {
  return fs.readdirSync(dir, { withFileTypes: true }).reduce((content, entry) => {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      return content + readClientSourceFiles(fullPath);
    }

    if (!/\.(ts|tsx)$/.test(entry.name)) {
      return content;
    }

    const source = fs.readFileSync(fullPath, "utf8");

    return source.startsWith('"use client";') ? content + source : content;
  }, "");
}

function createFakeContentClient(initialRows: FakeContentRow[] = []) {
  const rows = [...initialRows];
  let nextId = rows.length + 1;
  const client = {
    contentEntry: {
      async findUnique(args: { where: { namespace_key_locale: { namespace: string; key: string; locale: string } } }) {
        const where = args.where.namespace_key_locale;
        return rows.find((row) => row.namespace === where.namespace && row.key === where.key && row.locale === where.locale) ?? null;
      },
      async findFirst(args: { where: { namespace: string; key: string; locale: string; status: string; archivedAt: null } }) {
        return (
          rows.find(
            (row) =>
              row.namespace === args.where.namespace &&
              row.key === args.where.key &&
              row.locale === args.where.locale &&
              row.status === args.where.status &&
              row.archivedAt === args.where.archivedAt
          ) ?? null
        );
      },
      async create(args: { data: Omit<FakeContentRow, "id"> }) {
        const row = {
          id: `fake-content-${nextId++}`,
          ...args.data
        };
        rows.push(row);
        return row;
      }
    }
  };

  return { client, rows };
}

describe("Checkpoint 3A-10.5 content seed and selective runtime copy", () => {
  it("defines a small platform-owned content seed set without UGC or unsafe payloads", () => {
    expect(platformContentSeeds.map((seed) => platformContentSeedKey(seed))).toEqual([
      "public.insights.page_title:fa",
      "public.insights.page_description:fa",
      "public.discovery.page_title:fa",
      "public.discovery.page_description:fa",
      "public.auth.login_title:fa",
      "product.conversation.empty_state:fa",
      "product.checkout.summary_helper:fa",
      "admin.empty_states.content:fa"
    ]);
    expect(new Set(platformContentSeeds.map((seed) => platformContentSeedKey(seed))).size).toBe(platformContentSeeds.length);
    expect(platformContentSeeds.every((seed) => seed.locale === "fa" && seed.isSystem && seed.isEditable)).toBe(true);
    expect(platformContentSeeds.every((seed) => seed.status === "PUBLISHED")).toBe(true);

    const seedSource = readProjectFile("tools/content/platform-content-seeds.json");

    expect(seedSource).not.toContain("Insight.body");
    expect(seedSource).not.toContain("InsightAnswer.body");
    expect(seedSource).not.toContain("professionalSummary");
    expect(seedSource).not.toContain("requesterCode");
    expect(seedSource).not.toContain("walletBalance");
    expect(seedSource).not.toContain("DATABASE_URL");
  });

  it("seeds missing ContentEntry rows idempotently and preserves existing admin-edited rows", async () => {
    const adminEditedRow: FakeContentRow = {
      id: "admin-edited-login-title",
      namespace: "public.auth",
      key: "login_title",
      locale: "fa",
      title: "Admin edited title",
      body: "Admin edited body",
      shortText: "Admin edited short text",
      description: "Admin edited description",
      contentType: "SYSTEM_COPY",
      status: "HIDDEN",
      isEditable: false,
      isSystem: true,
      createdByAdminId: "admin-1",
      updatedByAdminId: "admin-1",
      archivedAt: new Date("2026-01-01T00:00:00.000Z")
    };
    const { client, rows } = createFakeContentClient([adminEditedRow]);

    const firstRun = await seedPlatformContentEntries(client as never);
    const secondRun = await seedPlatformContentEntries(client as never);
    const preservedLoginTitle = rows.find((row) => row.id === "admin-edited-login-title");

    expect(firstRun).toMatchObject({
      attempted: 8,
      created: 7,
      existing: 1
    });
    expect(secondRun).toMatchObject({
      attempted: 8,
      created: 0,
      existing: 8
    });
    expect(rows).toHaveLength(8);
    expect(preservedLoginTitle).toMatchObject({
      title: "Admin edited title",
      body: "Admin edited body",
      shortText: "Admin edited short text",
      status: "HIDDEN",
      isEditable: false,
      archivedAt: adminEditedRow.archivedAt
    });
  });

  it("keeps seed code non-destructive and separate from UGC lifecycle mutations", () => {
    const source = [
      readProjectFile("src/lib/backend/content-seed.ts"),
      readProjectFile("tools/content/seed-platform-content.mjs")
    ].join("\n");

    expect(source).toContain("findUnique");
    expect(source).toContain("contentEntry.create");
    expect(source).not.toMatch(/\.(delete|deleteMany|archive|restore|update|upsert)\(/);
    expect(source).not.toMatch(/\.(insight|insightAnswer|profile|conversationRequest|payment|walletTransaction)\.(create|update|delete|upsert)/);
  });

  it("returns only published runtime content and safely falls back for draft, hidden, archived, missing, or unavailable content", async () => {
    const { client } = createFakeContentClient([
      {
        id: "published",
        namespace: "public.insights",
        key: "page_title",
        locale: "fa",
        title: "Published title",
        body: "Published body",
        shortText: "Published runtime title",
        description: null,
        contentType: "SYSTEM_COPY",
        status: "PUBLISHED",
        isEditable: true,
        isSystem: true,
        createdByAdminId: null,
        updatedByAdminId: null,
        archivedAt: null
      },
      {
        id: "hidden",
        namespace: "public.insights",
        key: "hidden_title",
        locale: "fa",
        title: "Hidden title",
        body: "Hidden body",
        shortText: "Hidden runtime title",
        description: null,
        contentType: "SYSTEM_COPY",
        status: "HIDDEN",
        isEditable: true,
        isSystem: true,
        createdByAdminId: null,
        updatedByAdminId: null,
        archivedAt: null
      },
      {
        id: "draft",
        namespace: "public.insights",
        key: "draft_title",
        locale: "fa",
        title: "Draft title",
        body: "Draft body",
        shortText: "Draft runtime title",
        description: null,
        contentType: "SYSTEM_COPY",
        status: "DRAFT",
        isEditable: true,
        isSystem: true,
        createdByAdminId: null,
        updatedByAdminId: null,
        archivedAt: null
      },
      {
        id: "archived",
        namespace: "public.insights",
        key: "archived_title",
        locale: "fa",
        title: "Archived title",
        body: "Archived body",
        shortText: "Archived runtime title",
        description: null,
        contentType: "SYSTEM_COPY",
        status: "ARCHIVED",
        isEditable: true,
        isSystem: true,
        createdByAdminId: null,
        updatedByAdminId: null,
        archivedAt: new Date("2026-01-01T00:00:00.000Z")
      }
    ]);

    await expect(
      getPublishedContentValue(
        {
          namespace: "public.insights",
          key: "page_title",
          fallback: "Fallback title"
        },
        client as never
      )
    ).resolves.toBe("Published runtime title");
    await expect(
      getPublishedContentValue({ namespace: "public.insights", key: "hidden_title", fallback: "Fallback title" }, client as never)
    ).resolves.toBe("Fallback title");
    await expect(
      getPublishedContentValue({ namespace: "public.insights", key: "draft_title", fallback: "Fallback title" }, client as never)
    ).resolves.toBe("Fallback title");
    await expect(
      getPublishedContentValue({ namespace: "public.insights", key: "archived_title", fallback: "Fallback title" }, client as never)
    ).resolves.toBe("Fallback title");
    await expect(
      getPublishedContentMap([{ namespace: "public.insights", key: "missing_title", fallback: "Fallback title" }], client as never)
    ).resolves.toEqual({
      "public.insights.missing_title": "Fallback title"
    });
  });

  it("wires only selected low-risk public copy surfaces while preserving component fallbacks", () => {
    const insightsHtml = renderToStaticMarkup(
      <InsightsPage
        viewer={null}
        mastheadCopy={{
          title: "Runtime insights title",
          description: "Runtime insights description"
        }}
      />
    );
    const discoverHtml = renderToStaticMarkup(
      <DiscoverPage
        initialState="ready"
        heroCopy={{
          title: "Runtime discovery title",
          description: "Runtime discovery description"
        }}
      />
    );
    const fallbackInsightsHtml = renderToStaticMarkup(<InsightsPage viewer={null} />);
    const fallbackDiscoverHtml = renderToStaticMarkup(<DiscoverPage initialState="ready" />);

    expect(insightsHtml).toContain("Runtime insights title");
    expect(insightsHtml).toContain("Runtime insights description");
    expect(discoverHtml).toContain("Runtime discovery title");
    expect(discoverHtml).toContain("Runtime discovery description");
    expect(fallbackInsightsHtml).toContain("بینش‌ها");
    expect(fallbackInsightsHtml).toContain("تجربه‌های کوتاه و واقعی برای تصمیم‌های شغلی بهتر.");
    expect(fallbackDiscoverHtml).toContain("کشف تجربه‌ها");
    expect(fallbackDiscoverHtml).toContain("آدم‌های باتجربه را پیدا کنید، تجربه‌شان را بررسی کنید، و در صورت نیاز جلسه مشاوره هماهنگ کنید.");

    expect(readProjectFile("src/app/insights/page.tsx")).toContain("getPublishedContentMap");
    expect(readProjectFile("src/app/discover/page.tsx")).toContain("getPublishedContentMap");
    expect(readProjectFile("src/app/login/page.tsx")).toContain("getPublishedContentValue");
  });

  it("keeps runtime content reads server-side and avoids feature flags, support inbox, comments, and UI redesign scope", () => {
    const clientSources = readClientSourceFiles(path.join(projectRoot, "src/features/v51"));
    const schema = readProjectFile("prisma/schema.prisma");
    const changedSurfaceSources = [
      readProjectFile("src/features/v51/insights/InsightsPage.tsx"),
      readProjectFile("src/features/v51/discover/DiscoverPage.tsx")
    ].join("\n");

    expect(clientSources).not.toContain('from "@prisma/client"');
    expect(clientSources).not.toContain("getPrismaClient");
    expect(schema).not.toMatch(/model\s+Comment\b/);
    expect(readProjectFile("src/lib/backend/content-seed.ts")).not.toContain("featureFlag");
    expect(readProjectFile("src/lib/backend/content-runtime.ts")).not.toContain("supportInbox");
    expect(changedSurfaceSources).not.toContain("dangerouslySetInnerHTML");
    expect(changedSurfaceSources).not.toContain("richText");
  });

  it("runs rollback-backed DB smoke coverage for platform content seed and runtime reads when enabled", async () => {
    if (process.env.USERAVAA_DB_SMOKE_TEST !== "1") {
      expect(process.env.USERAVAA_DB_SMOKE_TEST).not.toBe("1");
      return;
    }

    class SmokeRollback extends Error {
      constructor(readonly summary: Record<string, unknown>) {
        super("PLATFORM_CONTENT_SEED_SMOKE_ROLLBACK");
      }
    }

    const prisma = getPrismaClient();
    const seedKeys = platformContentSeeds.map((seed) => ({
      namespace: seed.namespace,
      key: seed.key,
      locale: seed.locale
    }));
    const unique = `content-runtime-smoke-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    let summary: Record<string, unknown> | null = null;

    try {
      await prisma.$transaction(async (tx) => {
        const existingBefore = await tx.contentEntry.findMany({
          where: {
            OR: seedKeys
          },
          select: {
            namespace: true,
            key: true,
            locale: true
          }
        });
        const existingBeforeKeys = new Set(existingBefore.map((entry) => platformContentSeedKey(entry)));
        const missingBefore = platformContentSeeds.filter((seed) => !existingBeforeKeys.has(platformContentSeedKey(seed)));
        const adminEditedCandidate = platformContentSeeds.find((seed) => !existingBeforeKeys.has(platformContentSeedKey(seed)));

        if (adminEditedCandidate) {
          await tx.contentEntry.create({
            data: {
              key: adminEditedCandidate.key,
              namespace: adminEditedCandidate.namespace,
              locale: adminEditedCandidate.locale,
              title: "Smoke admin-edited seed title",
              body: "Smoke admin-edited seed body",
              shortText: "Smoke admin-edited seed short text",
              description: "Smoke admin-edited seed description",
              contentType: adminEditedCandidate.contentType,
              status: "HIDDEN",
              isEditable: false,
              isSystem: true,
              archivedAt: now
            }
          });
        }

        const seedResult = await seedPlatformContentEntries(tx as never);
        const seededRows = await tx.contentEntry.findMany({
          where: {
            OR: seedKeys
          },
          select: {
            namespace: true,
            key: true,
            locale: true,
            body: true,
            status: true,
            isSystem: true,
            archivedAt: true
          }
        });

        await tx.contentEntry.createMany({
          data: [
            {
              key: `${unique}-published`,
              namespace: "public.insights",
              locale: "fa",
              title: "Smoke runtime published",
              body: "Smoke runtime published body",
              shortText: "Smoke runtime published short text",
              description: null,
              contentType: "SYSTEM_COPY",
              status: "PUBLISHED",
              isEditable: true,
              isSystem: true
            },
            {
              key: `${unique}-draft`,
              namespace: "public.insights",
              locale: "fa",
              title: "Smoke runtime draft",
              body: "Smoke runtime draft body",
              shortText: "Smoke runtime draft short text",
              description: null,
              contentType: "SYSTEM_COPY",
              status: "DRAFT",
              isEditable: true,
              isSystem: true
            },
            {
              key: `${unique}-hidden`,
              namespace: "public.insights",
              locale: "fa",
              title: "Smoke runtime hidden",
              body: "Smoke runtime hidden body",
              shortText: "Smoke runtime hidden short text",
              description: null,
              contentType: "SYSTEM_COPY",
              status: "HIDDEN",
              isEditable: true,
              isSystem: true
            },
            {
              key: `${unique}-archived`,
              namespace: "public.insights",
              locale: "fa",
              title: "Smoke runtime archived",
              body: "Smoke runtime archived body",
              shortText: "Smoke runtime archived short text",
              description: null,
              contentType: "SYSTEM_COPY",
              status: "ARCHIVED",
              isEditable: true,
              isSystem: true,
              archivedAt: now
            }
          ]
        });

        const published = await getPublishedContentValue(
          { namespace: "public.insights", key: `${unique}-published`, fallback: "fallback" },
          tx as never
        );
        const draft = await getPublishedContentValue(
          { namespace: "public.insights", key: `${unique}-draft`, fallback: "fallback" },
          tx as never
        );
        const hidden = await getPublishedContentValue(
          { namespace: "public.insights", key: `${unique}-hidden`, fallback: "fallback" },
          tx as never
        );
        const archived = await getPublishedContentValue(
          { namespace: "public.insights", key: `${unique}-archived`, fallback: "fallback" },
          tx as never
        );
        const missing = await getPublishedContentValue(
          { namespace: "public.insights", key: `${unique}-missing`, fallback: "fallback" },
          tx as never
        );
        const preservedAdminEdited = adminEditedCandidate
          ? seededRows.some(
              (row) =>
                row.namespace === adminEditedCandidate.namespace &&
                row.key === adminEditedCandidate.key &&
                row.body === "Smoke admin-edited seed body" &&
                row.status === "HIDDEN" &&
                row.archivedAt?.getTime() === now.getTime()
            )
          : true;

        throw new SmokeRollback({
          attemptedAllSeeds: seedResult.attempted === platformContentSeeds.length,
          createdMatchesMissingWithoutAdminEdited: seedResult.created === Math.max(missingBefore.length - (adminEditedCandidate ? 1 : 0), 0),
          seededRowsPresent: seededRows.length === platformContentSeeds.length,
          seededRowsSystemOwned: seededRows.every((row) => row.isSystem),
          preservedAdminEdited,
          publishedReadable: published === "Smoke runtime published short text",
          draftFallback: draft === "fallback",
          hiddenFallback: hidden === "fallback",
          archivedFallback: archived === "fallback",
          missingFallback: missing === "fallback"
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
      createdMatchesMissingWithoutAdminEdited: true,
      seededRowsPresent: true,
      seededRowsSystemOwned: true,
      preservedAdminEdited: true,
      publishedReadable: true,
      draftFallback: true,
      hiddenFallback: true,
      archivedFallback: true,
      missingFallback: true
    });

    await expect(prisma.contentEntry.findUnique({ where: { namespace_key_locale: { namespace: "public.insights", key: `${unique}-published`, locale: "fa" } } })).resolves.toBeNull();
    await prisma.$disconnect();
  });
});
