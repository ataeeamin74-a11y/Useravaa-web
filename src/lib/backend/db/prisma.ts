import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

export type PrismaConnectionMode = "accelerate" | "postgres_driver_adapter";

export class PrismaClientConfigurationError extends Error {
  readonly code = "PRISMA_CLIENT_CONFIGURATION_ERROR";

  constructor(message: string, readonly details: Record<string, unknown> = {}) {
    super(message);
    this.name = "PrismaClientConfigurationError";
  }
}

type GlobalWithPrisma = typeof globalThis & {
  useravaaPrismaClient?: PrismaClient;
};

const globalForPrisma = globalThis as GlobalWithPrisma;

function resolveAccelerateUrl(env: NodeJS.ProcessEnv) {
  if (env.PRISMA_ACCELERATE_URL) {
    return env.PRISMA_ACCELERATE_URL;
  }

  if (env.DATABASE_URL?.startsWith("prisma://")) {
    return env.DATABASE_URL;
  }

  return null;
}

function isPostgresConnectionUrl(databaseUrl: string) {
  return databaseUrl.startsWith("postgresql://") || databaseUrl.startsWith("postgres://");
}

function prismaClientBaseOptions(env: NodeJS.ProcessEnv) {
  return {
    errorFormat: "minimal",
    log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"]
  } satisfies Pick<Prisma.PrismaClientOptions, "errorFormat" | "log">;
}

export function getPrismaClientOptions(env: NodeJS.ProcessEnv = process.env): Prisma.PrismaClientOptions {
  const accelerateUrl = resolveAccelerateUrl(env);

  if (accelerateUrl) {
    return {
      accelerateUrl,
      ...prismaClientBaseOptions(env)
    };
  }

  if (!env.DATABASE_URL) {
    throw new PrismaClientConfigurationError(
      "DATABASE_URL or PRISMA_ACCELERATE_URL is required before database-backed repositories can be used.",
      {
        missing: "DATABASE_URL_OR_PRISMA_ACCELERATE_URL"
      }
    );
  }

  if (!isPostgresConnectionUrl(env.DATABASE_URL)) {
    throw new PrismaClientConfigurationError(
      "DATABASE_URL must be a PostgreSQL connection URL, or PRISMA_ACCELERATE_URL must be set.",
      {
        hasDatabaseUrl: true,
        missing: "POSTGRESQL_DATABASE_URL_OR_PRISMA_ACCELERATE_URL"
      }
    );
  }

  return {
    adapter: new PrismaPg(env.DATABASE_URL),
    ...prismaClientBaseOptions(env)
  };
}

export function isPrismaClientConfigurationError(error: unknown): error is PrismaClientConfigurationError {
  return error instanceof PrismaClientConfigurationError;
}

export function getPrismaClient() {
  const options = getPrismaClientOptions();

  if (process.env.NODE_ENV === "production") {
    return new PrismaClient(options);
  }

  if (!globalForPrisma.useravaaPrismaClient) {
    globalForPrisma.useravaaPrismaClient = new PrismaClient(options);
  }

  return globalForPrisma.useravaaPrismaClient;
}

export async function connectPrismaClient() {
  const prisma = getPrismaClient();
  await prisma.$connect();
  return prisma;
}
