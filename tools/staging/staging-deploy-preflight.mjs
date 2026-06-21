const requiredBeforeDeploy = ["APP_ENV", "APP_BASE_URL", "API_BASE_URL", "LOG_LEVEL"];
const safeFlagExpectations = {
  APP_ENV: "staging",
  USERAVAA_SITE_INDEXING: "0",
  USERAVAA_ENABLE_HSTS: "0",
  USERAVAA_ENABLE_DEV_AUTH: "0",
  USERAVAA_ENABLE_ADMIN_DEMO_FALLBACK: "0",
  USERAVAA_DB_SMOKE_TEST: "0"
};
const laterOnlyEnv = [
  "PAYMENT_PROVIDER",
  "PAYMENT_CALLBACK_URL",
  "PAYMENT_WEBHOOK_SECRET",
  "NOTIFICATION_PROVIDER",
  "EMAIL_PROVIDER",
  "SMS_PROVIDER",
  "UPLOAD_STORAGE_PROVIDER",
  "UPLOAD_BUCKET",
  "SENTRY_DSN"
];
const stagingAccessEnv = [
  "STAGING_PRIMARY_ADMIN_EMAIL",
  "STAGING_SUPPORT_EMAIL",
  "USERAVAA_STAGING_ACCESS_HEADER",
  "USERAVAA_STAGING_ACCESS_IDENTITY_HEADER",
  "USERAVAA_STAGING_ACCESS_SECRET"
];
const allowedLogLevels = new Set(["info", "warn", "error"]);
const httpHeaderNamePattern = /^[A-Za-z0-9!#$%&'*+.^_`|~-]+$/u;

const errors = [];
const warnings = [];

function value(name) {
  return process.env[name]?.trim() ?? "";
}

function isPresent(name) {
  return value(name).length > 0;
}

function addMissing(name) {
  errors.push(`${name} is required for the internal staging dry run.`);
}

for (const name of requiredBeforeDeploy) {
  if (!isPresent(name)) {
    addMissing(name);
  }
}

if (!isPresent("DATABASE_URL") && !isPresent("PRISMA_ACCELERATE_URL")) {
  errors.push("DATABASE_URL or PRISMA_ACCELERATE_URL is required for staging database readiness.");
}

for (const [name, expected] of Object.entries(safeFlagExpectations)) {
  if (value(name) !== expected) {
    errors.push(`${name} must be ${expected} for first internal staging.`);
  }
}

if (isPresent("DATABASE_URL") && /localhost|127\.0\.0\.1|::1/iu.test(value("DATABASE_URL"))) {
  errors.push("DATABASE_URL must not point to a local database for deployed staging.");
}

if (isPresent("DATABASE_URL") && /prod|production/iu.test(value("DATABASE_URL"))) {
  errors.push("DATABASE_URL appears production-like; use a separate staging database.");
}

if (isPresent("PRISMA_ACCELERATE_URL") && /prod|production/iu.test(value("PRISMA_ACCELERATE_URL"))) {
  errors.push("PRISMA_ACCELERATE_URL appears production-like; use a separate staging target.");
}

if (isPresent("LOG_LEVEL") && !allowedLogLevels.has(value("LOG_LEVEL"))) {
  errors.push("LOG_LEVEL must be info, warn, or error for first internal staging.");
}

for (const name of laterOnlyEnv) {
  if (isPresent(name)) {
    errors.push(`${name} must remain empty until a later provider checkpoint approves it.`);
  }
}

if (value("USERAVAA_ENABLE_STAGING_ACCESS") === "1") {
  for (const name of stagingAccessEnv) {
    if (!isPresent(name)) {
      errors.push(`${name} is required when USERAVAA_ENABLE_STAGING_ACCESS=1.`);
    }
  }

  if (process.env.NODE_ENV === "production") {
    errors.push("NODE_ENV must not be production when using the current staging access bridge.");
  }

  const accessHeader = value("USERAVAA_STAGING_ACCESS_HEADER").toLowerCase();
  const identityHeader = value("USERAVAA_STAGING_ACCESS_IDENTITY_HEADER").toLowerCase();

  if (accessHeader && !httpHeaderNamePattern.test(accessHeader)) {
    errors.push("USERAVAA_STAGING_ACCESS_HEADER must be a valid HTTP header name.");
  }

  if (identityHeader && !httpHeaderNamePattern.test(identityHeader)) {
    errors.push("USERAVAA_STAGING_ACCESS_IDENTITY_HEADER must be a valid HTTP header name.");
  }

  if (accessHeader && identityHeader && accessHeader === identityHeader) {
    errors.push("Staging access and identity header names must be distinct.");
  }
} else {
  warnings.push("App-level ADMIN/SUPPORT staging access remains disabled until trusted headers are configured.");
}

if (errors.length > 0) {
  console.error("STAGING_DEPLOY_PREFLIGHT=FAIL");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  for (const warning of warnings) {
    console.error(`- ${warning}`);
  }
  process.exit(1);
}

console.log("STAGING_DEPLOY_PREFLIGHT=PASS");
console.log("mode=dry-run");
console.log("external_connections=not_performed");
console.log("deployment=not_performed");
console.log("migration_apply=not_performed");
console.log("secrets_printed=false");
console.log(`app_level_staging_access=${value("USERAVAA_ENABLE_STAGING_ACCESS") === "1" ? "enabled" : "disabled"}`);

for (const warning of warnings) {
  console.log(`warning=${warning}`);
}
