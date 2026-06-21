import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { isAdminLocalDemoFallbackEnabled } from "@/features/v51/admin/server-data";
import { devFixtureAuthIsEnabled } from "@/lib/auth/dev-fixtures";
import { adminContentService } from "@/lib/backend/services";
import { adminContentEntryCreateSchema } from "@/lib/backend/validation";
import type { Viewer } from "@/lib/auth/types";

function projectFile(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

const privateRouteFiles = [
  "src/app/profile/page.tsx",
  "src/app/profile/build/page.tsx",
  "src/app/profile/network/page.tsx",
  "src/app/profile/feedback/page.tsx",
  "src/app/profile/settings/page.tsx",
  "src/app/profile/insights/page.tsx",
  "src/app/settings/page.tsx",
  "src/app/wallet/page.tsx",
  "src/app/notifications/page.tsx",
  "src/app/actions/page.tsx",
  "src/app/conversations/page.tsx",
  "src/app/requests/page.tsx",
  "src/app/sessions/page.tsx",
  "src/app/conversations/[conversationId]/page.tsx",
  "src/app/conversations/[conversationId]/propose-times/page.tsx",
  "src/app/conversations/[conversationId]/select-time/page.tsx",
  "src/app/checkout/page.tsx",
  "src/app/checkout/[conversationId]/page.tsx",
  "src/app/requests/new/page.tsx",
  "src/app/saved/page.tsx"
] as const;

const support: Viewer = {
  id: "support-operator",
  role: "SUPPORT",
  displayName: "پشتیبانی"
};

const validContentPayload = {
  key: "auth_hardening_banner",
  namespace: "admin.auth",
  locale: "fa",
  title: "Auth hardening",
  body: "Auth hardening body",
  contentType: "SYSTEM_COPY",
  status: "DRAFT",
  isEditable: true
};

describe("Checkpoint 3B-2 production auth and private route hardening", () => {
  it("marks private App Router pages as force-dynamic and server guarded", () => {
    privateRouteFiles.forEach((relativePath) => {
      const source = projectFile(relativePath);

      expect(source, relativePath).toContain('dynamic = "force-dynamic"');
      expect(source, relativePath).toContain("requireCurrentViewer");
      expect(source, relativePath).not.toContain("getConversationOrFallback");
    });
  });

  it("keeps public discovery, profile, and insight reading routes public", () => {
    [
      "src/app/discover/page.tsx",
      "src/app/profiles/[profileId]/page.tsx",
      "src/app/insights/page.tsx",
      "src/app/insights/[insightSlug]/page.tsx"
    ].forEach((relativePath) => {
      expect(projectFile(relativePath), relativePath).not.toContain("requireCurrentViewer");
    });
  });

  it("blocks dev fixture auth in production even when the dev flag is present", () => {
    expect(devFixtureAuthIsEnabled({ NODE_ENV: "production", USERAVAA_ENABLE_DEV_AUTH: "1" })).toBe(false);
    expect(devFixtureAuthIsEnabled({ NODE_ENV: "production", USERAVAA_ENABLE_DEV_AUTH: "true" })).toBe(false);
    expect(devFixtureAuthIsEnabled({ NODE_ENV: "development" })).toBe(true);
    expect(devFixtureAuthIsEnabled({ NODE_ENV: "test", USERAVAA_ENABLE_DEV_AUTH: "0" })).toBe(false);
  });

  it("blocks admin demo fallback in production even when the fallback flag is present", () => {
    expect(isAdminLocalDemoFallbackEnabled({ NODE_ENV: "production", USERAVAA_ENABLE_ADMIN_DEMO_FALLBACK: "1" })).toBe(false);
    expect(isAdminLocalDemoFallbackEnabled({ NODE_ENV: "development" })).toBe(true);
    expect(isAdminLocalDemoFallbackEnabled({ NODE_ENV: "test", USERAVAA_ENABLE_ADMIN_DEMO_FALLBACK: "0" })).toBe(false);
  });

  it("keeps dev QA pages unavailable in production-like mode", () => {
    const source = projectFile("src/app/dev/pages/page.tsx");

    expect(source).toContain('process.env.NODE_ENV === "production"');
    expect(source).toContain("notFound()");
  });

  it("keeps the auth boundary provider-neutral until a real provider is selected", () => {
    const authAdapterSource = projectFile("src/lib/adapters/auth.ts");
    const packageJson = JSON.parse(projectFile("package.json")) as { dependencies?: Record<string, string> };
    const dependencyNames = Object.keys(packageJson.dependencies ?? {});

    expect(authAdapterSource).toContain("getCurrentUser()");
    expect(authAdapterSource).toContain("return null");
    expect(dependencyNames).not.toEqual(expect.arrayContaining(["@clerk/nextjs", "next-auth", "@auth0/nextjs-auth0", "@descope/nextjs-sdk"]));
  });

  it("rejects client-controlled admin actor and role fields in strict admin payload schemas", () => {
    expect(adminContentEntryCreateSchema.safeParse({ ...validContentPayload, actorAdminUserId: "admin-override" }).success).toBe(false);
    expect(adminContentEntryCreateSchema.safeParse({ ...validContentPayload, role: "ADMIN" }).success).toBe(false);
    expect(adminContentEntryCreateSchema.safeParse({ ...validContentPayload, createdAt: new Date().toISOString() }).success).toBe(false);
  });

  it("keeps SUPPORT out of ADMIN-only content mutations before any database write", async () => {
    const result = await adminContentService.create(support, validContentPayload, {
      runInTransaction: async () => {
        throw new Error("support users must be rejected before transaction execution");
      }
    });

    expect(result).toMatchObject({
      ok: false,
      code: "unauthorized",
      area: "admin_content"
    });
  });

  it("documents dev auth and admin demo flags as local-only example variables", () => {
    const example = projectFile(".env.example");

    expect(example).toContain("USERAVAA_ENABLE_DEV_AUTH=0");
    expect(example).toContain("USERAVAA_ENABLE_ADMIN_DEMO_FALLBACK=0");
    expect(example).toContain("Ignored in production");
  });
});
