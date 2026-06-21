import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  getAppEnvironment,
  getRobotsPolicy,
  getSitemapUrl,
  isSiteIndexingEnabled,
  shouldEnableStrictTransportSecurity
} from "@/lib/deployment/safety";
import { readEnv } from "@/lib/env";

function projectFile(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

function dependencyNames() {
  const packageJson = JSON.parse(projectFile("package.json")) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };

  return [...Object.keys(packageJson.dependencies ?? {}), ...Object.keys(packageJson.devDependencies ?? {})];
}

function env(source: Record<string, string | undefined>): NodeJS.ProcessEnv {
  return source as NodeJS.ProcessEnv;
}

describe("Checkpoint 3B-3 deployment safety baseline", () => {
  it("adds safe baseline headers without enabling a brittle CSP/COEP policy yet", () => {
    const source = projectFile("next.config.ts");

    expect(source).toContain("X-Content-Type-Options");
    expect(source).toContain("nosniff");
    expect(source).toContain("X-Frame-Options");
    expect(source).toContain("DENY");
    expect(source).toContain("Referrer-Policy");
    expect(source).toContain("strict-origin-when-cross-origin");
    expect(source).toContain("Permissions-Policy");
    expect(source).toContain("camera=(), microphone=(), geolocation=()");
    expect(source).toContain("Cross-Origin-Opener-Policy");
    expect(source).toContain("same-origin");
    expect(source).toContain("shouldEnableStrictTransportSecurity");
    expect(source).toContain("headers()");
    expect(source).not.toContain("Content-Security-Policy");
    expect(source).not.toContain("Cross-Origin-Embedder-Policy");
  });

  it("keeps HSTS production-only and behind an explicit opt-in switch", () => {
    expect(shouldEnableStrictTransportSecurity(env({ APP_ENV: "staging", USERAVAA_ENABLE_HSTS: "1" }))).toBe(false);
    expect(shouldEnableStrictTransportSecurity(env({ APP_ENV: "production", USERAVAA_ENABLE_HSTS: "0" }))).toBe(false);
    expect(shouldEnableStrictTransportSecurity(env({ APP_ENV: "production", USERAVAA_ENABLE_HSTS: "1" }))).toBe(true);
  });

  it("keeps staging and default production noindex unless production explicitly opts in", () => {
    expect(isSiteIndexingEnabled(env({ APP_ENV: "staging", USERAVAA_SITE_INDEXING: "1" }))).toBe(false);
    expect(isSiteIndexingEnabled(env({ APP_ENV: "production", USERAVAA_SITE_INDEXING: "0" }))).toBe(false);
    expect(isSiteIndexingEnabled(env({ APP_ENV: "production", USERAVAA_SITE_INDEXING: "1" }))).toBe(true);

    expect(getRobotsPolicy(env({ APP_ENV: "staging", USERAVAA_SITE_INDEXING: "1" }))).toMatchObject({
      indexingEnabled: false,
      rules: {
        userAgent: "*",
        disallow: "/"
      }
    });
    expect(getRobotsPolicy(env({ APP_ENV: "production", USERAVAA_SITE_INDEXING: "1" }))).toMatchObject({
      indexingEnabled: true,
      rules: {
        userAgent: "*",
        allow: "/"
      }
    });
  });

  it("maps deployment environments conservatively when APP_ENV is absent", () => {
    expect(getAppEnvironment(env({ VERCEL_ENV: "production" }))).toBe("production");
    expect(getAppEnvironment(env({ VERCEL_ENV: "preview" }))).toBe("staging");
    expect(getAppEnvironment(env({ NODE_ENV: "production" }))).toBe("staging");
    expect(getAppEnvironment(env({ NODE_ENV: "test" }))).toBe("local");
    expect(getAppEnvironment(env({ APP_ENV: "unexpected", NODE_ENV: "development" }))).toBe("development");
  });

  it("generates sitemap URLs only from a valid base URL", () => {
    expect(getSitemapUrl(env({ APP_BASE_URL: "https://useravaa.example" }))).toBe("https://useravaa.example/sitemap.xml");
    expect(getSitemapUrl(env({ APP_BASE_URL: "not-a-url" }))).toBeUndefined();
    expect(getSitemapUrl(env({}))).toBeUndefined();
  });

  it("wires App Router robots metadata to the centralized safety helper", () => {
    const source = projectFile("src/app/robots.ts");

    expect(source).toContain("getRobotsPolicy");
    expect(source).toContain("getSitemapUrl");
    expect(source).toContain("MetadataRoute.Robots");
  });

  it("documents deployment safety environment flags with safe defaults", () => {
    const rootExample = projectFile(".env.example");
    const handoffExample = projectFile("docs/handoff/13_ENV_DEPLOYMENT/env.example");

    [rootExample, handoffExample].forEach((source) => {
      expect(source).toContain("APP_ENV=development");
      expect(source).toContain("USERAVAA_SITE_INDEXING=0");
      expect(source).toContain("USERAVAA_ENABLE_HSTS=0");
      expect(source).toContain("USERAVAA_ENABLE_DEV_AUTH=0");
      expect(source).toContain("USERAVAA_ENABLE_ADMIN_DEMO_FALLBACK=0");
      expect(source).toContain("USERAVAA_DB_SMOKE_TEST=0");
    });

    expect(readEnv(env({}))).toMatchObject({
      NODE_ENV: "development",
      USERAVAA_SITE_INDEXING: "0",
      USERAVAA_ENABLE_HSTS: "0"
    });
  });

  it("adds a CI quality gate without deploy commands, secrets, or DB smoke opt-in", () => {
    const source = projectFile(".github/workflows/ci.yml");

    expect(source).toContain("npm ci");
    expect(source).toContain("npm run lint");
    expect(source).toContain("npm run typecheck");
    expect(source).toContain("npm run test -- --pool=threads --maxWorkers=1");
    expect(source).toContain("npm run build");
    expect(source).toContain("npx prisma validate");
    expect(source).toContain("npx prisma generate");
    expect(source).toContain('USERAVAA_DB_SMOKE_TEST: "0"');
    expect(source).not.toContain("vercel deploy");
    expect(source).not.toContain("VERCEL_TOKEN");
    expect(source).not.toContain("secrets.");
    expect(source).not.toContain('USERAVAA_DB_SMOKE_TEST: "1"');
  });

  it("keeps deployment docs explicit about staging, production, rollback, and founder actions", () => {
    const checklist = projectFile("docs/handoff/13_ENV_DEPLOYMENT/deployment-checklist.md");

    expect(checklist).toContain("Before Internal Staging");
    expect(checklist).toContain("Before Public Staging");
    expect(checklist).toContain("Before Production Launch");
    expect(checklist).toContain("Required External Accounts");
    expect(checklist).toContain("Backup And Restore Checklist");
    expect(checklist).toContain("Rollback Checklist");
    expect(checklist).toContain("Smoke Test Checklist");
    expect(checklist).toContain("Founder Actions Outside Codex");
    expect(checklist).toContain("/robots.txt");
    expect(checklist).toContain("Never run `prisma migrate reset`");
  });

  it("does not add production provider SDKs or monitoring clients in this checkpoint", () => {
    expect(dependencyNames()).not.toEqual(
      expect.arrayContaining([
        "@clerk/nextjs",
        "next-auth",
        "@auth0/nextjs-auth0",
        "@sentry/nextjs",
        "posthog-js",
        "mixpanel-browser",
        "stripe",
        "resend",
        "@sendgrid/mail",
        "@vercel/blob"
      ])
    );
  });
});
