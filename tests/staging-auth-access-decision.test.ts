import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { devFixtureAuthIsEnabled } from "@/lib/auth/dev-fixtures";
import {
  getStagingAccessDecision,
  getStagingHeaderAccessDecision,
  resolveStagingHeaderViewer,
  resolveStagingOperatorViewer,
  STAGING_PRIMARY_ADMIN_ID,
  STAGING_SUPPORT_ID
} from "@/lib/auth/staging-access";
import { adminContentService, adminPricingService } from "@/lib/backend/services";
import {
  adminContentEntryCreateSchema,
  adminPricingRuleCreateSchema,
  adminSupportTicketCreateSchema
} from "@/lib/backend/validation";
import type { Viewer } from "@/lib/auth/types";

function projectFile(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

function projectFilesUnder(relativePath: string): string[] {
  const root = path.join(process.cwd(), relativePath);
  const results: string[] = [];

  function visit(current: string) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);

      if (entry.isDirectory()) {
        visit(fullPath);
        continue;
      }

      results.push(path.relative(process.cwd(), fullPath).replace(/\\/g, "/"));
    }
  }

  visit(root);
  return results;
}

const stagingAccessEnv = {
  APP_ENV: "staging",
  NODE_ENV: "test",
  USERAVAA_ENABLE_STAGING_ACCESS: "1",
  STAGING_PRIMARY_ADMIN_EMAIL: "placeholder-primary-operator",
  STAGING_SUPPORT_EMAIL: "placeholder-support-operator"
};

const stagingHeaderEnv = {
  ...stagingAccessEnv,
  USERAVAA_STAGING_ACCESS_HEADER: "x-useravaa-staging-access",
  USERAVAA_STAGING_ACCESS_IDENTITY_HEADER: "x-useravaa-staging-operator",
  USERAVAA_STAGING_ACCESS_SECRET: "placeholder-shared-secret"
};

function headerSource(values: Record<string, string>) {
  return new Headers(values);
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

const validContentPayload = {
  key: "staging_auth_access",
  namespace: "admin.staging",
  locale: "fa",
  title: "Staging auth access",
  body: "Staging auth access body",
  contentType: "SYSTEM_COPY",
  status: "DRAFT",
  isEditable: true
};

const validPricingPayload = {
  title: "Staging auth pricing",
  minPriceToman: 100_000,
  maxPriceToman: 500_000,
  suggestedPriceToman: 300_000,
  commissionRateBps: 1_500,
  freeSessionCommissionRateBps: 0,
  allowFreeSession: true
};

const supportViewer: Viewer = {
  id: "support-operator",
  role: "SUPPORT"
};

describe("Checkpoint 3B-7 staging auth access decision and trusted identity source", () => {
  it("keeps staging access disabled by default", () => {
    expect(getStagingAccessDecision({ APP_ENV: "staging", NODE_ENV: "test" })).toMatchObject({
      enabled: false,
      reason: "flag_disabled"
    });
    expect(getStagingHeaderAccessDecision({ APP_ENV: "staging", NODE_ENV: "test" })).toMatchObject({
      enabled: false,
      reason: "flag_disabled"
    });
    expect(resolveStagingOperatorViewer("placeholder-primary-operator", { APP_ENV: "staging", NODE_ENV: "test" })).toBeNull();
    expect(
      resolveStagingHeaderViewer(
        headerSource({
          "x-useravaa-staging-access": "placeholder-shared-secret",
          "x-useravaa-staging-operator": "placeholder-primary-operator"
        }),
        { APP_ENV: "staging", NODE_ENV: "test" }
      )
    ).toBeNull();
  });

  it("uses APP_ENV as the staging boundary and allows production-built staging previews", () => {
    expect(getStagingAccessDecision({ ...stagingAccessEnv, NODE_ENV: "production" })).toMatchObject({
      enabled: true,
      reason: "enabled"
    });
    expect(getStagingHeaderAccessDecision({ ...stagingHeaderEnv, NODE_ENV: "production" })).toMatchObject({
      enabled: true,
      reason: "enabled"
    });
    expect(resolveStagingOperatorViewer("placeholder-primary-operator", { ...stagingAccessEnv, NODE_ENV: "production" })).toMatchObject({
      id: STAGING_PRIMARY_ADMIN_ID,
      role: "ADMIN"
    });
    expect(getStagingAccessDecision({ ...stagingAccessEnv, APP_ENV: "production" })).toMatchObject({
      enabled: false,
      reason: "not_staging"
    });
    expect(getStagingAccessDecision({ ...stagingAccessEnv, APP_ENV: undefined })).toMatchObject({
      enabled: false,
      reason: "not_staging"
    });
    expect(
      resolveStagingHeaderViewer(
        headerSource({
          "x-useravaa-staging-access": "placeholder-shared-secret",
          "x-useravaa-staging-operator": "placeholder-primary-operator"
        }),
        { ...stagingHeaderEnv, APP_ENV: "production", NODE_ENV: "production" }
      )
    ).toBeNull();
    expect(getStagingHeaderAccessDecision({ ...stagingHeaderEnv, APP_ENV: "production", NODE_ENV: "production" })).toMatchObject({
      enabled: false,
      reason: "not_staging"
    });
    expect(getStagingHeaderAccessDecision({ ...stagingHeaderEnv, APP_ENV: "development" })).toMatchObject({
      enabled: false,
      reason: "not_staging"
    });
  });

  it("requires two distinct placeholder operator identifiers from env", () => {
    expect(getStagingAccessDecision({ ...stagingAccessEnv, STAGING_PRIMARY_ADMIN_EMAIL: "" })).toMatchObject({
      enabled: false,
      reason: "missing_primary_admin"
    });
    expect(getStagingAccessDecision({ ...stagingAccessEnv, STAGING_SUPPORT_EMAIL: "" })).toMatchObject({
      enabled: false,
      reason: "missing_support"
    });
    expect(getStagingAccessDecision({ ...stagingAccessEnv, STAGING_SUPPORT_EMAIL: "placeholder-primary-operator" })).toMatchObject({
      enabled: false,
      reason: "duplicate_operator_identifier"
    });
  });

  it("requires explicit staging header names and a secret before trusting request headers", () => {
    expect(getStagingHeaderAccessDecision(stagingAccessEnv)).toMatchObject({
      enabled: false,
      reason: "missing_access_header"
    });
    expect(getStagingHeaderAccessDecision({ ...stagingHeaderEnv, USERAVAA_STAGING_ACCESS_IDENTITY_HEADER: "" })).toMatchObject({
      enabled: false,
      reason: "missing_identity_header"
    });
    expect(getStagingHeaderAccessDecision({ ...stagingHeaderEnv, USERAVAA_STAGING_ACCESS_SECRET: "" })).toMatchObject({
      enabled: false,
      reason: "missing_access_secret"
    });
    expect(getStagingHeaderAccessDecision({ ...stagingHeaderEnv, USERAVAA_STAGING_ACCESS_HEADER: "bad header" })).toMatchObject({
      enabled: false,
      reason: "invalid_access_header"
    });
    expect(
      getStagingHeaderAccessDecision({
        ...stagingHeaderEnv,
        USERAVAA_STAGING_ACCESS_HEADER: "x-useravaa-staging-operator"
      })
    ).toMatchObject({
      enabled: false,
      reason: "duplicate_staging_header"
    });
  });

  it("maps only trusted placeholder identifiers to ADMIN and SUPPORT", () => {
    expect(resolveStagingOperatorViewer(" PLACEHOLDER-PRIMARY-OPERATOR ", stagingAccessEnv)).toMatchObject({
      id: STAGING_PRIMARY_ADMIN_ID,
      role: "ADMIN"
    });
    expect(resolveStagingOperatorViewer("placeholder-support-operator", stagingAccessEnv)).toMatchObject({
      id: STAGING_SUPPORT_ID,
      role: "SUPPORT"
    });
    expect(resolveStagingOperatorViewer("unlisted-operator", stagingAccessEnv)).toBeNull();
    expect(resolveStagingOperatorViewer(null, stagingAccessEnv)).toBeNull();
  });

  it("rejects raw client-supplied identity headers without the matching staging secret", () => {
    expect(
      resolveStagingHeaderViewer(
        headerSource({
          "x-useravaa-staging-operator": "placeholder-primary-operator"
        }),
        stagingHeaderEnv
      )
    ).toBeNull();
    expect(
      resolveStagingHeaderViewer(
        headerSource({
          "x-useravaa-staging-access": "wrong-placeholder-secret",
          "x-useravaa-staging-operator": "placeholder-primary-operator"
        }),
        stagingHeaderEnv
      )
    ).toBeNull();
  });

  it("maps ADMIN and SUPPORT only when the secret-backed staging headers are fully gated", () => {
    expect(
      resolveStagingHeaderViewer(
        headerSource({
          "x-useravaa-staging-access": "placeholder-shared-secret",
          "x-useravaa-staging-operator": " PLACEHOLDER-PRIMARY-OPERATOR "
        }),
        stagingHeaderEnv
      )
    ).toMatchObject({
      id: STAGING_PRIMARY_ADMIN_ID,
      role: "ADMIN"
    });
    expect(
      resolveStagingHeaderViewer(
        headerSource({
          "x-useravaa-staging-access": "placeholder-shared-secret",
          "x-useravaa-staging-operator": "placeholder-support-operator"
        }),
        stagingHeaderEnv
      )
    ).toMatchObject({
      id: STAGING_SUPPORT_ID,
      role: "SUPPORT"
    });
    expect(
      resolveStagingHeaderViewer(
        headerSource({
          "x-useravaa-staging-access": "placeholder-shared-secret",
          "x-useravaa-staging-operator": "unknown-operator"
        }),
        stagingHeaderEnv
      )
    ).toBeNull();
  });

  it("documents and examples staging access without real identifiers", () => {
    const emailLikePattern = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/iu;
    const tokenLikePattern = /\b(sk-|gh[pousr]_|xox[baprs]-|whsec_)[A-Za-z0-9_-]{8,}\b/iu;
    const sources = [
      projectFile("src/lib/auth/staging-access.ts"),
      projectFile("src/lib/auth/session.ts"),
      projectFile(".env.example"),
      projectFile("docs/handoff/13_ENV_DEPLOYMENT/env.example"),
      projectFile("docs/handoff/13_ENV_DEPLOYMENT/staging-access-runbook.md"),
      projectFile("tests/staging-auth-session-wiring.test.ts")
    ].join("\n");

    expect(sources).toContain("STAGING_PRIMARY_ADMIN_EMAIL");
    expect(sources).toContain("STAGING_SUPPORT_EMAIL");
    expect(sources).toContain("USERAVAA_ENABLE_STAGING_ACCESS=0");
    expect(sources).not.toMatch(emailLikePattern);
    expect(sources).not.toMatch(tokenLikePattern);
  });

  it("wires only the trusted staging header source into runtime sessions and adds no public bootstrap routes", () => {
    const sessionSource = projectFile("src/lib/auth/session.ts");
    const apiRoutePaths = projectFilesUnder("src/app/api").filter((filePath) => filePath.endsWith("/route.ts"));

    expect(sessionSource).toContain("getStagingHeaderAccessDecision");
    expect(sessionSource).toContain("resolveStagingHeaderViewer");
    expect(sessionSource).not.toContain("resolveStagingOperatorViewer");
    expect(apiRoutePaths).not.toEqual(expect.arrayContaining([expect.stringMatching(/bootstrap|staging-access|role|promote/iu)]));
  });

  it("rejects client-controlled role or actor fields in admin payload schemas", () => {
    expect(adminContentEntryCreateSchema.safeParse({ ...validContentPayload, role: "ADMIN" }).success).toBe(false);
    expect(adminContentEntryCreateSchema.safeParse({ ...validContentPayload, actorAdminUserId: "client-actor" }).success).toBe(false);
    expect(adminPricingRuleCreateSchema.safeParse({ ...validPricingPayload, role: "ADMIN" }).success).toBe(false);
    expect(
      adminSupportTicketCreateSchema.safeParse({
        subject: "Staging auth support",
        description: "Staging auth support body",
        role: "SUPPORT"
      }).success
    ).toBe(false);
  });

  it("keeps SUPPORT restricted from ADMIN-only actions", async () => {
    const forbiddenTransaction = async () => {
      throw new Error("support must be rejected before transaction execution");
    };

    await expect(adminContentService.create(supportViewer, validContentPayload, { runInTransaction: forbiddenTransaction })).resolves.toMatchObject({
      ok: false,
      code: "unauthorized",
      area: "admin_content"
    });
    await expect(adminPricingService.create(supportViewer, validPricingPayload, { runInTransaction: forbiddenTransaction })).resolves.toMatchObject({
      ok: false,
      code: "unauthorized",
      area: "admin_pricing"
    });
  });

  it("keeps private route hardening and production-disabled dev fixture auth", () => {
    for (const relativePath of privateRouteFiles) {
      const source = projectFile(relativePath);

      expect(source, relativePath).toContain('dynamic = "force-dynamic"');
      expect(source, relativePath).toContain("requireCurrentViewer");
    }

    expect(devFixtureAuthIsEnabled({ NODE_ENV: "production", USERAVAA_ENABLE_DEV_AUTH: "1" })).toBe(false);
  });

  it("does not add payment, email, SMS, storage, analytics, or auth provider integrations", () => {
    const packageJson = JSON.parse(projectFile("package.json")) as { dependencies?: Record<string, string> };
    const dependencyNames = Object.keys(packageJson.dependencies ?? {});
    const adapters = [
      projectFile("src/lib/adapters/auth.ts"),
      projectFile("src/lib/adapters/payments.ts"),
      projectFile("src/lib/adapters/notifications.ts"),
      projectFile("src/lib/adapters/uploads.ts")
    ].join("\n");

    expect(dependencyNames).not.toEqual(expect.arrayContaining(["@clerk/nextjs", "next-auth", "@auth0/nextjs-auth0", "@descope/nextjs-sdk"]));
    expect(dependencyNames).not.toEqual(expect.arrayContaining(["stripe", "@sentry/nextjs", "@aws-sdk/client-s3", "resend", "nodemailer"]));
    expect(adapters).toContain("return null");
    expect(adapters).toContain("adapter_not_configured");
  });
});
