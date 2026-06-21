import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function projectFile(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

function packageJson() {
  return JSON.parse(projectFile("package.json")) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    scripts?: Record<string, string>;
  };
}

const dryRunDocPath = "docs/handoff/13_ENV_DEPLOYMENT/internal-staging-dry-run.md";
const preflightScriptPath = "tools/staging/staging-deploy-preflight.mjs";
const emailLikePattern = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/iu;
const tokenLikePattern = /\b(sk-|gh[pousr]_|github_pat_|xox[baprs]-|whsec_|eyJ[A-Za-z0-9_-]{10,})[A-Za-z0-9_.-]*\b/iu;
const requiredEnvVars = [
  "APP_ENV",
  "APP_BASE_URL",
  "API_BASE_URL",
  "DATABASE_URL",
  "AUTH_SECRET",
  "JWT_SECRET",
  "USERAVAA_SITE_INDEXING",
  "USERAVAA_ENABLE_HSTS",
  "USERAVAA_ENABLE_DEV_AUTH",
  "USERAVAA_ENABLE_ADMIN_DEMO_FALLBACK",
  "USERAVAA_ENABLE_STAGING_ACCESS",
  "STAGING_PRIMARY_ADMIN_EMAIL",
  "STAGING_SUPPORT_EMAIL",
  "USERAVAA_STAGING_ACCESS_HEADER",
  "USERAVAA_STAGING_ACCESS_IDENTITY_HEADER",
  "USERAVAA_STAGING_ACCESS_SECRET",
  "USERAVAA_DB_SMOKE_TEST",
  "PAYMENT_PROVIDER",
  "PAYMENT_CALLBACK_URL",
  "PAYMENT_WEBHOOK_SECRET",
  "NOTIFICATION_PROVIDER",
  "EMAIL_PROVIDER",
  "SMS_PROVIDER",
  "UPLOAD_STORAGE_PROVIDER",
  "UPLOAD_BUCKET",
  "SENTRY_DSN",
  "LOG_LEVEL"
] as const;

const safePreflightEnv: NodeJS.ProcessEnv = {
  PATH: process.env.PATH,
  SystemRoot: process.env.SystemRoot,
  APP_ENV: "staging",
  NODE_ENV: "test",
  APP_BASE_URL: "https://staging-preview.invalid",
  API_BASE_URL: "https://staging-preview.invalid/api",
  DATABASE_URL: "postgresql://STAGING_USER:STAGING_PASSWORD@STAGING_HOST:5432/STAGING_DATABASE",
  LOG_LEVEL: "info",
  USERAVAA_SITE_INDEXING: "0",
  USERAVAA_ENABLE_HSTS: "0",
  USERAVAA_ENABLE_DEV_AUTH: "0",
  USERAVAA_ENABLE_ADMIN_DEMO_FALLBACK: "0",
  USERAVAA_DB_SMOKE_TEST: "0",
  USERAVAA_ENABLE_STAGING_ACCESS: "1",
  STAGING_PRIMARY_ADMIN_EMAIL: "placeholder-primary-operator",
  STAGING_SUPPORT_EMAIL: "placeholder-support-operator",
  USERAVAA_STAGING_ACCESS_HEADER: "x-useravaa-staging-access",
  USERAVAA_STAGING_ACCESS_IDENTITY_HEADER: "x-useravaa-staging-operator",
  USERAVAA_STAGING_ACCESS_SECRET: "placeholder-shared-secret"
};

describe("Checkpoint 3B-8 internal staging deployment dry run", () => {
  it("adds a dry-run plan with hosting recommendation and checklists", () => {
    const doc = projectFile(dryRunDocPath);

    expect(doc).toContain("Vercel Preview or a protected Vercel deployment");
    expect(doc).toContain("separate managed PostgreSQL staging database");
    expect(doc).toContain("Pre-Deploy Dry Run Checklist");
    expect(doc).toContain("Post-Deploy Smoke Checklist");
    expect(doc).toContain("Checkpoint 3B-9");
    expect(doc).toContain("Do not deploy");
  });

  it("documents every required staging env variable without real values", () => {
    const sources = [projectFile(dryRunDocPath), projectFile(".env.example"), projectFile("docs/handoff/13_ENV_DEPLOYMENT/env.example")].join("\n");

    for (const envName of requiredEnvVars) {
      expect(sources, envName).toContain(envName);
    }

    expect(sources).not.toMatch(emailLikePattern);
    expect(sources).not.toMatch(tokenLikePattern);
  });

  it("documents protected access limits and the trusted header requirements", () => {
    const doc = projectFile(dryRunDocPath);

    expect(doc).toContain("Platform protection can block outsiders");
    expect(doc).toContain("App-level `ADMIN` and `SUPPORT` access needs a trusted identity signal");
    expect(doc).toContain("Vercel protection alone does not give this app a committed `ADMIN` versus `SUPPORT` identity header");
    expect(doc).toContain("strip any incoming client copies");
    expect(doc).toContain("inject trusted headers");
    expect(doc).toContain("USERAVAA_STAGING_ACCESS_SECRET");
    expect(doc).toContain("Vercel Preview may run with `NODE_ENV=production`");
    expect(doc).toContain("do not use `NODE_ENV` alone as the staging boundary");
  });

  it("documents non-destructive migration rules and keeps migration apply out of package scripts", () => {
    const doc = projectFile(dryRunDocPath);
    const scripts = Object.values(packageJson().scripts ?? {}).join("\n");

    expect(doc).toContain("npx.cmd prisma migrate status");
    expect(doc).toContain("Run `npx.cmd prisma migrate deploy` only in a later approved deployment checkpoint");
    expect(doc).toContain("Do not run `prisma migrate reset`");
    expect(doc).toContain("Do not run `prisma db push`");
    expect(scripts).not.toMatch(/prisma\s+migrate\s+deploy|prisma\s+migrate\s+reset|prisma\s+db\s+push/iu);
    expect(scripts).not.toMatch(/\bvercel\b/iu);
  });

  it("adds a dry-run preflight script that does not connect, deploy, migrate, or print secret values", () => {
    const source = projectFile(preflightScriptPath);
    const output = execFileSync(process.execPath, [preflightScriptPath], {
      cwd: process.cwd(),
      env: safePreflightEnv,
      encoding: "utf8"
    });

    expect(packageJson().scripts?.["staging:deploy:preflight"]).toBe("node tools/staging/staging-deploy-preflight.mjs");
    expect(source).not.toMatch(/child_process|fetch\(|https?:\/\/|\bvercel\b|prisma\s+migrate\s+deploy|prisma\s+migrate\s+reset|prisma\s+db\s+push/iu);
    expect(output).toContain("STAGING_DEPLOY_PREFLIGHT=PASS");
    expect(output).toContain("external_connections=not_performed");
    expect(output).toContain("deployment=not_performed");
    expect(output).toContain("migration_apply=not_performed");
    expect(output).toContain("secrets_printed=false");
    expect(output).not.toContain("placeholder-shared-secret");
    expect(output).not.toContain("placeholder-primary-operator");
    expect(output).not.toContain("placeholder-support-operator");
  });

  it("preflight allows Vercel-style production NODE_ENV when APP_ENV is staging", () => {
    const result = spawnSync(process.execPath, [preflightScriptPath], {
      cwd: process.cwd(),
      env: {
        ...safePreflightEnv,
        NODE_ENV: "production"
      },
      encoding: "utf8"
    });
    const combinedOutput = `${result.stdout}\n${result.stderr}`;

    expect(result.status).toBe(0);
    expect(combinedOutput).toContain("STAGING_DEPLOY_PREFLIGHT=PASS");
    expect(combinedOutput).toContain("NODE_ENV=production is acceptable for deployed staging only when APP_ENV=staging");
    expect(combinedOutput).not.toContain("placeholder-shared-secret");
  });

  it("does not add payment, email, SMS, storage, analytics, monitoring, or auth provider integrations", () => {
    const dependencies = Object.keys(packageJson().dependencies ?? {});

    expect(dependencies).not.toEqual(expect.arrayContaining(["@clerk/nextjs", "next-auth", "@auth0/nextjs-auth0", "@descope/nextjs-sdk"]));
    expect(dependencies).not.toEqual(expect.arrayContaining(["stripe", "resend", "nodemailer", "@aws-sdk/client-s3", "@sentry/nextjs"]));
  });
});
