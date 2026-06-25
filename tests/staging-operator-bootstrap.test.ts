import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";

type BootstrapPlan = {
  ok: boolean;
  mode: "dry-run" | "apply";
  errors: string[];
  rows: Array<{
    id: string;
    role: string;
    displayName: string;
    email: string;
    emailEnv: string;
  }>;
};

type BootstrapModule = {
  STAGING_OPERATOR_CONFIRMATION_PHRASE: string;
  buildStagingOperatorBootstrapPlan: (env: NodeJS.ProcessEnv, args?: string[]) => BootstrapPlan;
  executeStagingOperatorBootstrapPlan: (
    plan: BootstrapPlan,
    dependencies?: {
      env?: NodeJS.ProcessEnv;
      prisma?: {
        user: {
          findUnique: (input: unknown) => Promise<{ id: string } | null>;
          upsert: (input: unknown) => Promise<{ id: string }>;
        };
      };
    }
  ) => Promise<{ ok: boolean; lines: string[] }>;
};

async function loadBootstrapModule() {
  const moduleUrl = pathToFileURL(path.join(process.cwd(), "tools/staging/bootstrap-operator-users.mjs")).href;
  return (await import(moduleUrl)) as BootstrapModule;
}

const baseEnv: NodeJS.ProcessEnv = {
  NODE_ENV: "test",
  APP_ENV: "staging",
  USERAVAA_ENABLE_STAGING_ACCESS: "1",
  STAGING_PRIMARY_ADMIN_EMAIL: "Founder.Admin@Example.Test",
  STAGING_SUPPORT_EMAIL: "Support.Operator@Example.Test",
  DATABASE_URL: "postgresql://ci_user:ci_placeholder_password@db.stage.example:5432/useravaa_stage?sslmode=require"
};

describe("Checkpoint 3B-23B staging operator DB bootstrap", () => {
  it("plans the fixed staging operator IDs and roles from env-backed emails", async () => {
    const bootstrap = await loadBootstrapModule();
    const plan = bootstrap.buildStagingOperatorBootstrapPlan(baseEnv, ["--mode=dry-run"]);

    expect(plan).toMatchObject({ ok: true, mode: "dry-run" });
    expect(plan.rows).toEqual([
      {
        id: "staging-primary-admin",
        role: "ADMIN",
        displayName: "Staging ADMIN",
        email: "founder.admin@example.test",
        emailEnv: "STAGING_PRIMARY_ADMIN_EMAIL"
      },
      {
        id: "staging-support",
        role: "SUPPORT",
        displayName: "Staging SUPPORT",
        email: "support.operator@example.test",
        emailEnv: "STAGING_SUPPORT_EMAIL"
      }
    ]);
  });

  it("refuses production and unsafe or incomplete configuration", async () => {
    const bootstrap = await loadBootstrapModule();

    expect(bootstrap.buildStagingOperatorBootstrapPlan({ ...baseEnv, APP_ENV: "production" }).errors).toContain(
      "APP_ENV=production is refused for staging operator bootstrap."
    );
    expect(bootstrap.buildStagingOperatorBootstrapPlan({ ...baseEnv, DATABASE_URL: "" }).errors).toContain("DATABASE_URL is required.");
    expect(bootstrap.buildStagingOperatorBootstrapPlan({ ...baseEnv, STAGING_PRIMARY_ADMIN_EMAIL: "" }).errors).toContain(
      "STAGING_PRIMARY_ADMIN_EMAIL is required."
    );
    expect(bootstrap.buildStagingOperatorBootstrapPlan({ ...baseEnv, STAGING_SUPPORT_EMAIL: "" }).errors).toContain(
      "STAGING_SUPPORT_EMAIL is required."
    );
    expect(
      bootstrap.buildStagingOperatorBootstrapPlan({
        ...baseEnv,
        STAGING_PRIMARY_ADMIN_EMAIL: "same@example.test",
        STAGING_SUPPORT_EMAIL: "SAME@example.test"
      }).errors
    ).toContain("STAGING_PRIMARY_ADMIN_EMAIL and STAGING_SUPPORT_EMAIL must be distinct.");
  });

  it("keeps dry-run mode from touching Prisma", async () => {
    const bootstrap = await loadBootstrapModule();
    const plan = bootstrap.buildStagingOperatorBootstrapPlan(baseEnv, ["--mode=dry-run"]);
    const prisma = {
      user: {
        async findUnique() {
          throw new Error("dry-run must not query Prisma");
        },
        async upsert() {
          throw new Error("dry-run must not write Prisma");
        }
      }
    };

    const result = await bootstrap.executeStagingOperatorBootstrapPlan(plan, { env: baseEnv, prisma });

    expect(result.ok).toBe(true);
    expect(result.lines).toContain("mode=dry-run");
    expect(result.lines).toContain("write_action=not_performed");
    expect(result.lines.join("\n")).toContain("action=would_upsert");
  });

  it("requires the exact confirmation phrase for apply mode", async () => {
    const bootstrap = await loadBootstrapModule();

    expect(bootstrap.buildStagingOperatorBootstrapPlan(baseEnv, ["--mode=apply"]).errors).toContain(
      "Apply mode requires USERAVAA_STAGING_BOOTSTRAP_CONFIRM=BOOTSTRAP_STAGING_OPERATORS or --confirm=BOOTSTRAP_STAGING_OPERATORS."
    );
    expect(
      bootstrap.buildStagingOperatorBootstrapPlan(baseEnv, ["--mode=apply", "--confirm=BOOTSTRAP_STAGING_OPERATORS"]).ok
    ).toBe(true);
  });

  it("upserts only the two fixed operator rows in confirmed apply mode", async () => {
    const bootstrap = await loadBootstrapModule();
    const plan = bootstrap.buildStagingOperatorBootstrapPlan(baseEnv, [
      "--mode=apply",
      `--confirm=${bootstrap.STAGING_OPERATOR_CONFIRMATION_PHRASE}`
    ]);
    const upserts: unknown[] = [];
    const prisma = {
      user: {
        async findUnique() {
          return null;
        },
        async upsert(input: unknown) {
          upserts.push(input);
          return { id: "ok" };
        }
      }
    };

    const result = await bootstrap.executeStagingOperatorBootstrapPlan(plan, { env: baseEnv, prisma });

    expect(result.ok).toBe(true);
    expect(upserts).toHaveLength(2);
    expect(upserts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          where: { id: "staging-primary-admin" },
          create: expect.objectContaining({ id: "staging-primary-admin", role: "ADMIN" })
        }),
        expect.objectContaining({
          where: { id: "staging-support" },
          create: expect.objectContaining({ id: "staging-support", role: "SUPPORT" })
        })
      ])
    );
  });

  it("prints only safe output without database URLs, passwords, or full emails", async () => {
    const bootstrap = await loadBootstrapModule();
    const plan = bootstrap.buildStagingOperatorBootstrapPlan(baseEnv, ["--mode=dry-run"]);
    const result = await bootstrap.executeStagingOperatorBootstrapPlan(plan, { env: baseEnv });
    const output = result.lines.join("\n");

    expect(output).toContain("email=redacted");
    expect(output).not.toContain("Founder.Admin@Example.Test");
    expect(output).not.toContain("founder.admin@example.test");
    expect(output).not.toContain("Support.Operator@Example.Test");
    expect(output).not.toContain("support.operator@example.test");
    expect(output).not.toContain("ci_placeholder_password");
    expect(output).not.toContain("db.stage.example");
    expect(output).not.toContain("useravaa_stage");
  });
});
