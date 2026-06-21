const REQUIRED_OPERATOR_ENV = ["STAGING_PRIMARY_ADMIN_EMAIL", "STAGING_SUPPORT_EMAIL"];

const SAFE_FLAG_EXPECTATIONS = {
  APP_ENV: "staging",
  USERAVAA_SITE_INDEXING: "0",
  USERAVAA_ENABLE_HSTS: "0",
  USERAVAA_ENABLE_DEV_AUTH: "0",
  USERAVAA_ENABLE_ADMIN_DEMO_FALLBACK: "0"
};

const dryRun = process.env.USERAVAA_STAGING_BOOTSTRAP_DRY_RUN !== "0";
const errors = [];

for (const name of REQUIRED_OPERATOR_ENV) {
  if (!process.env[name]?.trim()) {
    errors.push(`${name} is required but missing.`);
  }
}

for (const [name, expected] of Object.entries(SAFE_FLAG_EXPECTATIONS)) {
  if (process.env[name] !== expected) {
    errors.push(`${name} must be ${expected} for staging bootstrap preflight.`);
  }
}

if (process.env.APP_ENV === "production" && process.env.USERAVAA_ALLOW_STAGING_BOOTSTRAP !== "1") {
  errors.push("Staging bootstrap preflight refuses production unless USERAVAA_ALLOW_STAGING_BOOTSTRAP=1.");
}

if (!dryRun) {
  errors.push("Database-writing staging bootstrap is not implemented in this checkpoint. Keep USERAVAA_STAGING_BOOTSTRAP_DRY_RUN=1.");
}

if (errors.length > 0) {
  console.error("STAGING_BOOTSTRAP_PREFLIGHT=FAIL");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log("STAGING_BOOTSTRAP_PREFLIGHT=PASS");
console.log("mode=dry-run");
console.log("operator_env=present");
console.log("safe_flags=present");
console.log("write_action=not_performed");
