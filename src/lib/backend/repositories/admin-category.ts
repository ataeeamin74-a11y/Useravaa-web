import { Prisma, type JobField } from "@prisma/client";
import type { UseravaaTransactionClient } from "../db/transaction";
import { readOnlyRepositoryOperation, type PrismaReader, type RepositoryResult } from "./types";

const categoryActorSelect = {
  id: true,
  displayName: true,
  role: true
} as const;

const categoryRelatedSelect = {
  id: true,
  slug: true,
  labelFa: true,
  isActive: true,
  archivedAt: true
} as const;

const jobCategorySelect = Prisma.validator<Prisma.JobCategorySelect>()({
  id: true,
  slug: true,
  labelFa: true,
  titleEn: true,
  descriptionFa: true,
  parentId: true,
  sortOrder: true,
  isActive: true,
  showInDiscovery: true,
  showInInsights: true,
  showInPricing: true,
  archivedAt: true,
  createdByAdminId: true,
  updatedByAdminId: true,
  createdAt: true,
  updatedAt: true,
  code: true,
  parent: {
    select: categoryRelatedSelect
  },
  children: {
    select: categoryRelatedSelect,
    orderBy: [{ sortOrder: "asc" }, { labelFa: "asc" }]
  },
  createdByAdmin: {
    select: categoryActorSelect
  },
  updatedByAdmin: {
    select: categoryActorSelect
  },
  _count: {
    select: {
      profiles: true,
      children: true
    }
  }
});

type JobCategoryBaseRecord = Prisma.JobCategoryGetPayload<{ select: typeof jobCategorySelect }>;

export type AdminCategoryUseCase = "discovery" | "insights" | "pricing";

export type AdminCategoryRecord = JobCategoryBaseRecord & {
  pricingRuleCount: number;
  insightCount: number;
};

export type AdminCategoryWriteInput = {
  slug: string;
  labelFa: string;
  titleEn?: string | null;
  descriptionFa?: string | null;
  parentId?: string | null;
  sortOrder: number;
  isActive: boolean;
  showInDiscovery: boolean;
  showInInsights: boolean;
  showInPricing: boolean;
  code?: JobField | null;
  adminId: string;
};

export type AdminCategoryUpdateInput = Partial<Omit<AdminCategoryWriteInput, "adminId">> & {
  adminId: string;
};

type CategoryReader = Pick<PrismaReader, "jobCategory" | "pricingRule" | "insight">;

function adminCategoryRepositoryOk<T>(method: string, data: T): RepositoryResult<T> {
  return {
    ok: true,
    area: "admin_categories",
    method,
    classification: "read_only_persistent",
    data
  };
}

async function attachUsageCounts(
  db: CategoryReader,
  categories: readonly JobCategoryBaseRecord[]
): Promise<AdminCategoryRecord[]> {
  return Promise.all(
    categories.map(async (category) => {
      const [pricingRuleCount, insightCount] = await Promise.all([
        category.code
          ? db.pricingRule.count({
              where: {
                jobField: category.code
              }
            })
          : Promise.resolve(0),
        db.insight.count({
          where: {
            experienceProfile: {
              categories: {
                some: {
                  categoryId: category.id
                }
              }
            }
          }
        })
      ]);

      return {
        ...category,
        pricingRuleCount,
        insightCount
      };
    })
  );
}

function categoryCreateData(input: AdminCategoryWriteInput): Prisma.JobCategoryUncheckedCreateInput {
  return {
    slug: input.slug,
    labelFa: input.labelFa,
    titleEn: input.titleEn ?? null,
    descriptionFa: input.descriptionFa ?? null,
    parentId: input.parentId ?? null,
    sortOrder: input.sortOrder,
    isActive: input.isActive,
    showInDiscovery: input.showInDiscovery,
    showInInsights: input.showInInsights,
    showInPricing: input.showInPricing,
    code: input.code ?? null,
    createdByAdminId: input.adminId,
    updatedByAdminId: input.adminId
  };
}

function categoryUpdateData(input: AdminCategoryUpdateInput): Prisma.JobCategoryUncheckedUpdateInput {
  return {
    ...(input.slug === undefined ? {} : { slug: input.slug }),
    ...(input.labelFa === undefined ? {} : { labelFa: input.labelFa }),
    ...(input.titleEn === undefined ? {} : { titleEn: input.titleEn ?? null }),
    ...(input.descriptionFa === undefined ? {} : { descriptionFa: input.descriptionFa ?? null }),
    ...(input.parentId === undefined ? {} : { parentId: input.parentId ?? null }),
    ...(input.sortOrder === undefined ? {} : { sortOrder: input.sortOrder }),
    ...(input.isActive === undefined ? {} : { isActive: input.isActive }),
    ...(input.showInDiscovery === undefined ? {} : { showInDiscovery: input.showInDiscovery }),
    ...(input.showInInsights === undefined ? {} : { showInInsights: input.showInInsights }),
    ...(input.showInPricing === undefined ? {} : { showInPricing: input.showInPricing }),
    ...(input.code === undefined ? {} : { code: input.code ?? null }),
    updatedByAdminId: input.adminId
  };
}

function categoryUseCaseWhere(useCase: AdminCategoryUseCase) {
  if (useCase === "pricing") {
    return { showInPricing: true };
  }

  if (useCase === "insights") {
    return { showInInsights: true };
  }

  return { showInDiscovery: true };
}

export const adminCategoryRepository = {
  methods: {
    listCategories: "read_only_persistent",
    getCategoryDetail: "read_only_persistent",
    createCategory: "database_persistent",
    updateCategory: "database_persistent",
    archiveCategory: "database_persistent",
    restoreCategory: "database_persistent",
    listActiveCategoriesForUseCase: "read_only_persistent"
  },
  async listCategories(reader?: CategoryReader) {
    const read = async (db: CategoryReader) => {
      const categories = await db.jobCategory.findMany({
        select: jobCategorySelect,
        orderBy: [{ archivedAt: "asc" }, { sortOrder: "asc" }, { labelFa: "asc" }]
      });

      return attachUsageCounts(db, categories);
    };

    if (reader) {
      return read(reader).then((data) => adminCategoryRepositoryOk("listCategories", data));
    }

    return readOnlyRepositoryOperation("admin_categories", "listCategories", read);
  },
  async getCategoryDetail(categoryId: string, reader?: CategoryReader) {
    const read = async (db: CategoryReader) => {
      const category = await db.jobCategory.findUnique({
        where: { id: categoryId },
        select: jobCategorySelect
      });

      return category ? (await attachUsageCounts(db, [category]))[0] : null;
    };

    if (reader) {
      return read(reader).then((data) => adminCategoryRepositoryOk("getCategoryDetail", data));
    }

    return readOnlyRepositoryOperation("admin_categories", "getCategoryDetail", read);
  },
  async createCategory(input: AdminCategoryWriteInput, tx: UseravaaTransactionClient) {
    const created = await tx.jobCategory.create({
      data: categoryCreateData(input),
      select: jobCategorySelect
    });

    return (await attachUsageCounts(tx, [created]))[0];
  },
  async updateCategory(categoryId: string, input: AdminCategoryUpdateInput, tx: UseravaaTransactionClient) {
    const updated = await tx.jobCategory.update({
      where: { id: categoryId },
      data: categoryUpdateData(input),
      select: jobCategorySelect
    });

    return (await attachUsageCounts(tx, [updated]))[0];
  },
  async archiveCategory(
    categoryId: string,
    input: { adminId: string; archivedAt: Date; reason: string; internalNote?: string | null },
    tx: UseravaaTransactionClient
  ) {
    const updated = await tx.jobCategory.update({
      where: { id: categoryId },
      data: {
        isActive: false,
        showInDiscovery: false,
        showInInsights: false,
        showInPricing: false,
        archivedAt: input.archivedAt,
        updatedByAdminId: input.adminId
      },
      select: jobCategorySelect
    });

    return (await attachUsageCounts(tx, [updated]))[0];
  },
  async restoreCategory(categoryId: string, input: { adminId: string }, tx: UseravaaTransactionClient) {
    const updated = await tx.jobCategory.update({
      where: { id: categoryId },
      data: {
        isActive: true,
        archivedAt: null,
        updatedByAdminId: input.adminId
      },
      select: jobCategorySelect
    });

    return (await attachUsageCounts(tx, [updated]))[0];
  },
  async listActiveCategoriesForUseCase(useCase: AdminCategoryUseCase, reader?: CategoryReader) {
    const read = async (db: CategoryReader) =>
      db.jobCategory.findMany({
        where: {
          isActive: true,
          archivedAt: null,
          ...categoryUseCaseWhere(useCase)
        },
        select: {
          id: true,
          slug: true,
          labelFa: true,
          code: true,
          parentId: true,
          sortOrder: true
        },
        orderBy: [{ sortOrder: "asc" }, { labelFa: "asc" }]
      });

    if (reader) {
      return read(reader).then((data) => adminCategoryRepositoryOk("listActiveCategoriesForUseCase", data));
    }

    return readOnlyRepositoryOperation("admin_categories", "listActiveCategoriesForUseCase", read);
  }
} as const;
