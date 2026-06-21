import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { devFixtureAuthIsEnabled } from "@/lib/auth/dev-fixtures";
import { adminContentService, adminPricingService } from "@/lib/backend/services";
import {
  adminCategoryCreateSchema,
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

const emailLikePattern = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/iu;
const supportViewer: Viewer = { id: "support-operator", role: "SUPPORT" };

const validContentPayload = {
  key: "staging_access_plan",
  namespace: "admin.staging",
  locale: "fa",
  title: "Staging access plan",
  body: "Staging access body",
  contentType: "SYSTEM_COPY",
  status: "DRAFT",
  isEditable: true
};

const validPricingPayload = {
  title: "Staging pricing rule",
  minPriceToman: 100_000,
  maxPriceToman: 500_000,
  suggestedPriceToman: 300_000,
  commissionRateBps: 1_500,
  freeSessionCommissionRateBps: 0,
  allowFreeSession: true
};

describe("Checkpoint 3B-5 staging access runbook", () => {
  it("adds a provider-neutral staging access plan with the two placeholder operators", () => {
    const runbook = projectFile("docs/handoff/13_ENV_DEPLOYMENT/staging-access-runbook.md");

    expect(runbook).toContain("STAGING_PRIMARY_ADMIN_EMAIL");
    expect(runbook).toContain("STAGING_SUPPORT_EMAIL");
    expect(runbook).toContain("ADMIN");
    expect(runbook).toContain("SUPPORT");
    expect(runbook).toContain("No public admin bootstrap route exists");
    expect(runbook).toContain("No unauthenticated role assignment API exists");
    expect(runbook).not.toMatch(emailLikePattern);
  });

  it("documents fake-only seed data and non-destructive staging migrations", () => {
    const runbook = projectFile("docs/handoff/13_ENV_DEPLOYMENT/staging-access-runbook.md");

    expect(runbook).toContain("Use only fake or explicitly consented data");
    expect(runbook).toContain("Real user data");
    expect(runbook).toContain("prisma migrate status");
    expect(runbook).toContain("prisma migrate deploy");
    expect(runbook).toContain("prisma migrate reset");
    expect(runbook).toContain("prisma db push");
    expect(runbook).toContain("production `DATABASE_URL`");
  });

  it("includes the required post-deploy smoke checklist boundaries", () => {
    const runbook = projectFile("docs/handoff/13_ENV_DEPLOYMENT/staging-access-runbook.md");

    [
      "/admin` is blocked for no user",
      "ADMIN` can access the admin shell",
      "SUPPORT` cannot perform ADMIN-only",
      "/robots.txt` blocks indexing",
      "/dev` routes are blocked",
      "/discover` renders",
      "/insights` renders",
      "Private pages require auth",
      "No email or SMS is sent",
      "No real uploads are required"
    ].forEach((required) => expect(runbook).toContain(required));
  });

  it("keeps staging access env examples placeholder-only", () => {
    const envExamples = [projectFile(".env.example"), projectFile("docs/handoff/13_ENV_DEPLOYMENT/env.example")];

    for (const example of envExamples) {
      expect(example).toContain("STAGING_PRIMARY_ADMIN_EMAIL=");
      expect(example).toContain("STAGING_SUPPORT_EMAIL=");
      expect(example).toContain("USERAVAA_ENABLE_STAGING_ACCESS=0");
      expect(example).toContain("USERAVAA_STAGING_BOOTSTRAP_DRY_RUN=1");
      expect(example).toContain("USERAVAA_ALLOW_STAGING_BOOTSTRAP=0");
      expect(example).not.toMatch(emailLikePattern);
    }
  });

  it("adds a dry-run-only preflight helper that prints no operator identifiers", () => {
    const output = execFileSync(process.execPath, ["tools/staging/bootstrap-access-preflight.mjs"], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        APP_ENV: "staging",
        USERAVAA_SITE_INDEXING: "0",
        USERAVAA_ENABLE_HSTS: "0",
        USERAVAA_ENABLE_DEV_AUTH: "0",
        USERAVAA_ENABLE_ADMIN_DEMO_FALLBACK: "0",
        USERAVAA_STAGING_BOOTSTRAP_DRY_RUN: "1",
        STAGING_PRIMARY_ADMIN_EMAIL: "placeholder-primary-operator",
        STAGING_SUPPORT_EMAIL: "placeholder-support-operator"
      },
      encoding: "utf8"
    });

    expect(output).toContain("STAGING_BOOTSTRAP_PREFLIGHT=PASS");
    expect(output).toContain("write_action=not_performed");
    expect(output).not.toContain("placeholder-primary-operator");
    expect(output).not.toContain("placeholder-support-operator");
  });

  it("does not add public bootstrap or role-assignment API routes", () => {
    const apiRoutePaths = projectFilesUnder("src/app/api").filter((filePath) => filePath.endsWith("/route.ts"));

    expect(apiRoutePaths).not.toEqual(expect.arrayContaining([expect.stringMatching(/bootstrap|role-assignment|role|promote/iu)]));
  });

  it("rejects client-controlled role or actor fields in admin payload schemas", () => {
    expect(adminContentEntryCreateSchema.safeParse({ ...validContentPayload, role: "ADMIN" }).success).toBe(false);
    expect(adminContentEntryCreateSchema.safeParse({ ...validContentPayload, actorAdminUserId: "client-actor" }).success).toBe(false);
    expect(adminPricingRuleCreateSchema.safeParse({ ...validPricingPayload, role: "ADMIN" }).success).toBe(false);
    expect(adminCategoryCreateSchema.safeParse({ slug: "staging-plan", titleFa: "Staging plan", role: "ADMIN" }).success).toBe(false);
    expect(
      adminSupportTicketCreateSchema.safeParse({
        subject: "Staging support ticket",
        description: "Staging support ticket body",
        role: "ADMIN"
      }).success
    ).toBe(false);
  });

  it("keeps SUPPORT restricted from ADMIN-only content and pricing writes before transactions", async () => {
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

  it("keeps production mode from enabling dev fixture auth", () => {
    expect(devFixtureAuthIsEnabled({ NODE_ENV: "production", USERAVAA_ENABLE_DEV_AUTH: "1" })).toBe(false);
    expect(devFixtureAuthIsEnabled({ NODE_ENV: "production", USERAVAA_ENABLE_DEV_AUTH: "true" })).toBe(false);
  });

  it("does not add payment, email, SMS, storage, or auth provider integrations", () => {
    const packageJson = JSON.parse(projectFile("package.json")) as { dependencies?: Record<string, string>; scripts?: Record<string, string> };
    const dependencyNames = Object.keys(packageJson.dependencies ?? {});
    const adapters = [
      projectFile("src/lib/adapters/auth.ts"),
      projectFile("src/lib/adapters/payments.ts"),
      projectFile("src/lib/adapters/notifications.ts"),
      projectFile("src/lib/adapters/uploads.ts")
    ].join("\n");

    expect(packageJson.scripts?.["staging:bootstrap:preflight"]).toBe("node tools/staging/bootstrap-access-preflight.mjs");
    expect(dependencyNames).not.toEqual(expect.arrayContaining(["@clerk/nextjs", "next-auth", "@auth0/nextjs-auth0", "@descope/nextjs-sdk"]));
    expect(dependencyNames).not.toEqual(expect.arrayContaining(["stripe", "@sentry/nextjs", "@aws-sdk/client-s3", "resend", "nodemailer"]));
    expect(adapters).toContain("return null");
    expect(adapters).toContain("adapter_not_configured");
  });
});
