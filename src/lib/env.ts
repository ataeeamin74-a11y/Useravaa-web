import { z } from "zod";

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_ENV: z.enum(["local", "development", "staging", "production"]).optional(),
  APP_BASE_URL: z.string().url().optional(),
  API_BASE_URL: z.string().url().optional(),
  USERAVAA_SITE_INDEXING: z.enum(["0", "1"]).default("0"),
  USERAVAA_ENABLE_HSTS: z.enum(["0", "1"]).default("0"),
  DATABASE_URL: z.string().min(1).optional(),
  PRISMA_ACCELERATE_URL: z.string().min(1).optional(),
  USERAVAA_DB_SMOKE_TEST: z.enum(["0", "1"]).optional(),
  AUTH_SECRET: z.string().optional(),
  JWT_SECRET: z.string().optional(),
  USERAVAA_ENABLE_DEV_AUTH: z.enum(["0", "1"]).optional(),
  USERAVAA_ENABLE_ADMIN_DEMO_FALLBACK: z.enum(["0", "1"]).optional(),
  USERAVAA_ENABLE_STAGING_ACCESS: z.enum(["0", "1"]).optional(),
  STAGING_PRIMARY_ADMIN_EMAIL: z.string().optional(),
  STAGING_SUPPORT_EMAIL: z.string().optional(),
  USERAVAA_STAGING_BOOTSTRAP_DRY_RUN: z.enum(["0", "1"]).optional(),
  USERAVAA_ALLOW_STAGING_BOOTSTRAP: z.enum(["0", "1"]).optional(),
  UPLOAD_STORAGE_PROVIDER: z.string().optional(),
  UPLOAD_BUCKET: z.string().optional(),
  UPLOAD_MAX_AVATAR_BYTES: z.coerce.number().int().positive().default(2_097_152),
  PAYMENT_PROVIDER: z.string().optional(),
  PAYMENT_CALLBACK_URL: z.string().url().optional(),
  PAYMENT_WEBHOOK_SECRET: z.string().optional(),
  NOTIFICATION_PROVIDER: z.string().optional(),
  EMAIL_PROVIDER: z.string().optional(),
  SMS_PROVIDER: z.string().optional(),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  SENTRY_DSN: z.string().optional()
});

export type AppEnv = z.infer<typeof envSchema>;

export function readEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  return envSchema.parse(source);
}
