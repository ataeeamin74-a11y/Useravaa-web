type PrismaModule = {
  PrismaClient: new () => unknown;
};

let prismaClient: unknown;

export async function getPrismaClient() {
  if (!prismaClient) {
    const prismaModule = (await import("@prisma/client")) as unknown as PrismaModule;
    prismaClient = new prismaModule.PrismaClient();
  }

  return prismaClient;
}
