import { z } from "zod";

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_BASE_URL: z.string().url().optional(),
  API_BASE_URL: z.string().url().optional(),
  DATABASE_URL: z.string().min(1).optional(),
  AUTH_SECRET: z.string().optional(),
  JWT_SECRET: z.string().optional(),
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
