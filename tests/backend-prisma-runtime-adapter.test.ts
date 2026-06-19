import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  connectPrismaClient,
  getPrismaClient,
  getPrismaClientOptions,
  PrismaClientConfigurationError
} from "@/lib/backend/db/prisma";
import { withUseravaaTransaction, type UseravaaTransactionClient } from "@/lib/backend/db/transaction";
import type { ConversationResponseDto } from "@/lib/backend/dto/conversation";
import { conversationService, type ServiceResult } from "@/lib/backend/services";

const projectRoot = process.cwd();

function readProjectFile(relativePath: string) {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

function packageJson() {
  return JSON.parse(readProjectFile("package.json")) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    scripts?: Record<string, string>;
  };
}

describe("Checkpoint 2B-2.5 Prisma runtime adapter decision", () => {
  it("declares the PostgreSQL Prisma adapter packages explicitly", () => {
    const pkg = packageJson();

    expect(pkg.dependencies).toMatchObject({
      "@prisma/adapter-pg": expect.any(String),
      pg: expect.any(String)
    });
  });

  it("builds direct PostgreSQL Prisma client options through the driver adapter", () => {
    const options = getPrismaClientOptions({
      NODE_ENV: "test",
      DATABASE_URL: "postgresql://user:password@localhost:5432/useravaa"
    } as NodeJS.ProcessEnv);
    const adapter = (options as { adapter?: { provider?: string; adapterName?: string } }).adapter;

    expect(adapter).toBeDefined();
    expect(adapter?.provider).toBe("postgres");
    expect(options).toMatchObject({
      errorFormat: "minimal"
    });
  });

  it("keeps Prisma Accelerate supported and preferred when configured", () => {
    const options = getPrismaClientOptions({
      NODE_ENV: "test",
      DATABASE_URL: "postgresql://user:password@localhost:5432/useravaa",
      PRISMA_ACCELERATE_URL: "prisma://accelerate.prisma-data.net/?api_key=test"
    } as NodeJS.ProcessEnv);

    expect(options).toMatchObject({
      accelerateUrl: "prisma://accelerate.prisma-data.net/?api_key=test"
    });
    expect("adapter" in options).toBe(false);
  });

  it("reports typed configuration errors when neither adapter input nor Accelerate is configured", () => {
    expect(() => getPrismaClientOptions({ NODE_ENV: "test" } as NodeJS.ProcessEnv)).toThrow(
      PrismaClientConfigurationError
    );
    expect(() =>
      getPrismaClientOptions({
        NODE_ENV: "test",
        DATABASE_URL: "mysql://user:password@localhost:3306/useravaa"
      } as NodeJS.ProcessEnv)
    ).toThrow(PrismaClientConfigurationError);
  });

  it("keeps route handlers away from direct Prisma client instantiation", () => {
    const apiRouteFiles = [
      "src/app/api/profile/me/route.ts",
      "src/app/api/conversations/route.ts",
      "src/app/api/conversations/[conversationId]/route.ts",
      "src/app/api/wallet/route.ts",
      "src/app/api/notifications/route.ts",
      "src/app/api/admin/payments/route.ts"
    ];

    apiRouteFiles.forEach((relativePath) => {
      const source = readProjectFile(relativePath);

      expect(source, relativePath).not.toContain("@prisma/client");
      expect(source, relativePath).not.toContain("new PrismaClient");
      expect(source, relativePath).not.toContain("getPrismaClient");
    });
  });

  it("keeps request creation honest when DB runtime is unavailable", async () => {
    const result = await conversationService.createConversation(
      {
        id: "requester-1"
      },
      {
        experienceProfileId: "experience-profile-1",
        durationMinutes: 30,
        requestTopic: "career path",
        requestNote: "I want to discuss the next decision in my work path.",
        paymentRequirement: "PAYMENT_REQUIRED",
        paymentMethod: "CARD_TO_CARD",
        quotedPriceToman: 500000
      },
      {
        runInTransaction: (async () => {
          throw new PrismaClientConfigurationError("No safe DB runtime configured.", {
            missing: "DATABASE_URL_OR_PRISMA_ACCELERATE_URL"
          });
        }) as never
      }
    );

    expect(result).toMatchObject({
      ok: false,
      code: "provider_not_configured",
      status: 503
    });
  });

  it("does not use fixtures or fallback helpers to fake database runtime success", () => {
    const backendSourceFiles = [
      "src/app/api/conversations/route.ts",
      "src/lib/backend/services.ts",
      "src/lib/backend/repositories/conversation.ts",
      "src/lib/backend/db/prisma.ts"
    ];

    backendSourceFiles.forEach((relativePath) => {
      const source = readProjectFile(relativePath);

      expect(source, relativePath).not.toContain("@/features/v51/data");
      expect(source, relativePath).not.toContain("getConversationOrFallback");
      expect(source, relativePath).not.toMatch(/\.(push|splice|shift|unshift|pop)\(/);
    });
  });

  it("does not add destructive migration commands to package scripts", () => {
    const scripts = Object.values(packageJson().scripts ?? {}).join("\n");

    expect(scripts).not.toMatch(/migrate\s+reset/i);
    expect(scripts).not.toMatch(/db\s+push\s+--force-reset/i);
    expect(scripts).not.toMatch(/DROP\s+DATABASE/i);
  });

  it("runs a SELECT 1 smoke query only when explicitly pointed at a safe DB", async () => {
    if (process.env.USERAVAA_DB_SMOKE_TEST !== "1") {
      expect(process.env.USERAVAA_DB_SMOKE_TEST).not.toBe("1");
      return;
    }

    const prisma = await connectPrismaClient();

    try {
      await expect(prisma.$queryRaw`SELECT 1`).resolves.toBeDefined();
    } finally {
      await prisma.$disconnect();
    }
  });

  it("creates a request through the real DB transaction path and rolls it back when smoke testing is enabled", async () => {
    if (process.env.USERAVAA_DB_SMOKE_TEST !== "1") {
      expect(process.env.USERAVAA_DB_SMOKE_TEST).not.toBe("1");
      return;
    }

    class SmokeRollback extends Error {
      constructor(readonly result: ServiceResult<ConversationResponseDto>) {
        super("SMOKE_ROLLBACK");
      }
    }

    const prisma = getPrismaClient();
    const unique = `smoke-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const requesterId = `${unique}-requester`;
    const providerId = `${unique}-provider`;
    const providerProfileId = `${unique}-profile`;
    const experienceProfileId = `${unique}-experience`;
    let smokeResult: ServiceResult<ConversationResponseDto> | null = null;

    const runInRollbackTransaction = (async <T>(operation: (tx: UseravaaTransactionClient) => Promise<T>) =>
      prisma.$transaction(async (tx) => {
        await tx.user.create({
          data: {
            id: requesterId,
            email: `${unique}-requester@smoke.useravaa.test`,
            displayName: "Smoke requester"
          }
        });
        await tx.user.create({
          data: {
            id: providerId,
            email: `${unique}-provider@smoke.useravaa.test`,
            displayName: "Smoke provider"
          }
        });
        await tx.profile.create({
          data: {
            id: providerProfileId,
            userId: providerId,
            status: "ACTIVE",
            displayName: "Smoke provider",
            professionalSummary: "Temporary smoke-test profile.",
            userMotivations: [],
            canOfferExperience: true
          }
        });
        await tx.experienceProfile.create({
          data: {
            id: experienceProfileId,
            ownerId: providerId,
            profileId: providerProfileId,
            status: "ACTIVE",
            displayName: "Smoke provider",
            roleTitle: "Product specialist",
            orgLevel: "SPECIALIST",
            yearsOfExperience: 5,
            publicProfessionalSummary: "Temporary smoke-test experience profile.",
            freeHelp: false,
            price30Toman: 500000,
            price60Toman: 900000
          }
        });

        const result = await operation(tx);

        throw new SmokeRollback(result as ServiceResult<ConversationResponseDto>);
      })) as typeof withUseravaaTransaction;

    try {
      await conversationService.createConversation(
        {
          id: requesterId
        },
        {
          experienceProfileId,
          durationMinutes: 30,
          requestTopic: "controlled smoke test",
          requestNote: "Verify request creation through the database transaction path.",
          paymentRequirement: "PAYMENT_REQUIRED",
          paymentMethod: "CARD_TO_CARD",
          quotedPriceToman: 500000
        },
        {
          runInTransaction: runInRollbackTransaction,
          now: () => new Date("2026-06-13T00:00:00.000Z")
        }
      );
    } catch (error) {
      if (error instanceof SmokeRollback) {
        smokeResult = error.result;
      } else {
        throw error;
      }
    }

    expect(smokeResult).toMatchObject({
      ok: true,
      status: 201
    });

    if (!smokeResult?.ok) {
      throw new Error("Request creation smoke test did not return a successful service result.");
    }

    expect(smokeResult.data).toMatchObject({
      viewerRole: "REQUESTER",
      status: "AWAITING_PAYMENT",
      nextRequiredAction: "PAYMENT",
      selectedTimeId: null,
      confirmedAt: null,
      proposedTimes: []
    });
    expect(smokeResult.data.payment).toMatchObject({
      method: "CARD_TO_CARD",
      status: "CHECKOUT_CREATED",
      amountToman: 500000
    });

    await expect(prisma.user.findUnique({ where: { id: requesterId } })).resolves.toBeNull();
    await expect(prisma.user.findUnique({ where: { id: providerId } })).resolves.toBeNull();
    await prisma.$disconnect();
  });
});
