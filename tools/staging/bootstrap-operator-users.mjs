import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { pathToFileURL } from "node:url";

export const STAGING_OPERATOR_CONFIRMATION_PHRASE = "BOOTSTRAP_STAGING_OPERATORS";

export const STAGING_OPERATOR_ROWS = [
  {
    id: "staging-primary-admin",
    role: "ADMIN",
    displayName: "Staging ADMIN",
    emailEnv: "STAGING_PRIMARY_ADMIN_EMAIL"
  },
  {
    id: "staging-support",
    role: "SUPPORT",
    displayName: "Staging SUPPORT",
    emailEnv: "STAGING_SUPPORT_EMAIL"
  }
];

function value(env, name) {
  return env[name]?.trim() ?? "";
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function parseCliValue(args, name) {
  const prefix = `--${name}=`;
  const inline = args.find((arg) => arg.startsWith(prefix));

  if (inline) {
    return inline.slice(prefix.length);
  }

  const index = args.indexOf(`--${name}`);

  if (index >= 0) {
    return args[index + 1] ?? "";
  }

  return "";
}

function resolveMode(env, args) {
  const cliMode = parseCliValue(args, "mode");
  const envMode = value(env, "USERAVAA_STAGING_BOOTSTRAP_MODE");
  const mode = (cliMode || envMode || "dry-run").toLowerCase();

  if (mode === "apply" || args.includes("--apply")) {
    return "apply";
  }

  return "dry-run";
}

function resolveConfirmation(env, args) {
  return parseCliValue(args, "confirm") || value(env, "USERAVAA_STAGING_BOOTSTRAP_CONFIRM");
}

function isPostgresUrl(databaseUrl) {
  return databaseUrl.startsWith("postgresql://") || databaseUrl.startsWith("postgres://");
}

function isLocalDatabaseUrl(databaseUrl) {
  try {
    const parsed = new URL(databaseUrl);
    return ["localhost", "127.0.0.1", "::1"].includes(parsed.hostname);
  } catch {
    return false;
  }
}

function isProductionLikeDatabaseUrl(databaseUrl) {
  return /prod|production/iu.test(databaseUrl);
}

function sanitizeOperationalError(error) {
  if (!(error instanceof Error)) {
    return "Database operation failed with an unknown error.";
  }

  if (error.message.startsWith("Existing user row already uses")) {
    return error.message;
  }

  return "Database operation failed. Inspect secure operator logs without printing DATABASE_URL or secrets.";
}

export function buildStagingOperatorBootstrapPlan(env = process.env, args = process.argv.slice(2)) {
  const mode = resolveMode(env, args);
  const errors = [];
  const databaseUrl = value(env, "DATABASE_URL");
  const primaryAdminEmail = normalizeEmail(value(env, "STAGING_PRIMARY_ADMIN_EMAIL"));
  const supportEmail = normalizeEmail(value(env, "STAGING_SUPPORT_EMAIL"));

  if (value(env, "APP_ENV") === "production") {
    errors.push("APP_ENV=production is refused for staging operator bootstrap.");
  }

  if (value(env, "APP_ENV") !== "staging") {
    errors.push("APP_ENV must be staging.");
  }

  if (value(env, "USERAVAA_ENABLE_STAGING_ACCESS") !== "1") {
    errors.push("USERAVAA_ENABLE_STAGING_ACCESS must be 1.");
  }

  if (!primaryAdminEmail) {
    errors.push("STAGING_PRIMARY_ADMIN_EMAIL is required.");
  }

  if (!supportEmail) {
    errors.push("STAGING_SUPPORT_EMAIL is required.");
  }

  if (primaryAdminEmail && supportEmail && primaryAdminEmail === supportEmail) {
    errors.push("STAGING_PRIMARY_ADMIN_EMAIL and STAGING_SUPPORT_EMAIL must be distinct.");
  }

  if (!databaseUrl) {
    errors.push("DATABASE_URL is required.");
  } else if (!isPostgresUrl(databaseUrl)) {
    errors.push("DATABASE_URL must be a PostgreSQL connection URL.");
  } else {
    if (isLocalDatabaseUrl(databaseUrl)) {
      errors.push("DATABASE_URL must not point to localhost for staging operator bootstrap.");
    }

    if (isProductionLikeDatabaseUrl(databaseUrl)) {
      errors.push("DATABASE_URL appears production-like and is refused.");
    }
  }

  if (mode === "apply" && resolveConfirmation(env, args) !== STAGING_OPERATOR_CONFIRMATION_PHRASE) {
    errors.push("Apply mode requires USERAVAA_STAGING_BOOTSTRAP_CONFIRM=BOOTSTRAP_STAGING_OPERATORS or --confirm=BOOTSTRAP_STAGING_OPERATORS.");
  }

  const rows = STAGING_OPERATOR_ROWS.map((row) => ({
    id: row.id,
    role: row.role,
    displayName: row.displayName,
    email: row.emailEnv === "STAGING_PRIMARY_ADMIN_EMAIL" ? primaryAdminEmail : supportEmail,
    emailEnv: row.emailEnv
  }));

  return {
    ok: errors.length === 0,
    mode,
    errors,
    rows
  };
}

export function formatStagingOperatorBootstrapFailure(errors) {
  return ["STAGING_OPERATOR_BOOTSTRAP=FAIL", ...errors.map((error) => `- ${error}`)];
}

export function formatStagingOperatorBootstrapRows(mode, rows, actionById = new Map()) {
  return [
    "STAGING_OPERATOR_BOOTSTRAP=PASS",
    `mode=${mode}`,
    `write_action=${mode === "apply" ? "performed" : "not_performed"}`,
    ...rows.map((row) => {
      const action = actionById.get(row.id) ?? (mode === "apply" ? "upserted" : "would_upsert");
      return `operator id=${row.id} role=${row.role} email=redacted action=${action}`;
    })
  ];
}

function createPrismaClient(databaseUrl) {
  return new PrismaClient({
    adapter: new PrismaPg(databaseUrl),
    errorFormat: "minimal",
    log: ["error"]
  });
}

async function assertNoEmailConflicts(prisma, row) {
  const existingByEmail = await prisma.user.findUnique({
    where: { email: row.email },
    select: { id: true }
  });

  if (existingByEmail && existingByEmail.id !== row.id) {
    throw new Error(`Existing user row already uses the ${row.id} operator email with a different id.`);
  }
}

export async function executeStagingOperatorBootstrapPlan(plan, dependencies = {}) {
  if (!plan.ok) {
    return {
      ok: false,
      lines: formatStagingOperatorBootstrapFailure(plan.errors)
    };
  }

  if (plan.mode !== "apply") {
    return {
      ok: true,
      lines: formatStagingOperatorBootstrapRows(plan.mode, plan.rows)
    };
  }

  const databaseUrl = value(dependencies.env ?? process.env, "DATABASE_URL");
  const prisma = dependencies.prisma ?? createPrismaClient(databaseUrl);
  const ownsPrisma = !dependencies.prisma;
  const actionById = new Map();

  try {
    for (const row of plan.rows) {
      await assertNoEmailConflicts(prisma, row);

      const existingById = await prisma.user.findUnique({
        where: { id: row.id },
        select: { id: true }
      });

      await prisma.user.upsert({
        where: { id: row.id },
        create: {
          id: row.id,
          email: row.email,
          role: row.role,
          displayName: row.displayName
        },
        update: {
          email: row.email,
          role: row.role,
          displayName: row.displayName
        },
        select: {
          id: true
        }
      });

      actionById.set(row.id, existingById ? "updated" : "created");
    }

    return {
      ok: true,
      lines: formatStagingOperatorBootstrapRows(plan.mode, plan.rows, actionById)
    };
  } finally {
    if (ownsPrisma) {
      await prisma.$disconnect();
    }
  }
}

export async function main(env = process.env, args = process.argv.slice(2)) {
  const plan = buildStagingOperatorBootstrapPlan(env, args);

  try {
    const result = await executeStagingOperatorBootstrapPlan(plan, { env });
    for (const line of result.lines) {
      const stream = result.ok ? console.log : console.error;
      stream(line);
    }

    process.exitCode = result.ok ? 0 : 1;
  } catch (error) {
    console.error("STAGING_OPERATOR_BOOTSTRAP=FAIL");
    console.error(`- ${sanitizeOperationalError(error)}`);
    process.exitCode = 1;
  }
}

const entryUrl = process.argv[1] ? pathToFileURL(process.argv[1]).href : "";

if (import.meta.url === entryUrl) {
  await main();
}
