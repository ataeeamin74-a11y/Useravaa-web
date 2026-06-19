import { Prisma, type DurationMinutes, type JobField, type OrgLevel } from "@prisma/client";
import type { UseravaaTransactionClient } from "../db/transaction";
import { readOnlyRepositoryOperation, type PrismaReader, type RepositoryResult } from "./types";

const pricingRuleSelect = Prisma.validator<Prisma.PricingRuleSelect>()({
  id: true,
  title: true,
  jobField: true,
  experienceLevel: true,
  sessionDurationMinutes: true,
  minPriceToman: true,
  maxPriceToman: true,
  suggestedPriceToman: true,
  commissionRateBps: true,
  freeSessionCommissionRateBps: true,
  allowFreeSession: true,
  isActive: true,
  effectiveFrom: true,
  effectiveTo: true,
  createdByAdminId: true,
  updatedByAdminId: true,
  archivedAt: true,
  internalNote: true,
  createdAt: true,
  updatedAt: true,
  createdByAdmin: {
    select: {
      id: true,
      displayName: true,
      role: true
    }
  },
  updatedByAdmin: {
    select: {
      id: true,
      displayName: true,
      role: true
    }
  }
});

const pricingCategorySelect = Prisma.validator<Prisma.JobCategorySelect>()({
  code: true,
  labelFa: true
});

export type PricingRuleRecord = Prisma.PricingRuleGetPayload<{ select: typeof pricingRuleSelect }>;
export type PricingRuleCategoryOption = Prisma.JobCategoryGetPayload<{ select: typeof pricingCategorySelect }>;

export type PricingRuleListReadModel = {
  rules: PricingRuleRecord[];
  categoryOptions: PricingRuleCategoryOption[];
};

export type PricingRuleWriteInput = {
  title: string;
  jobField: JobField | null;
  experienceLevel: OrgLevel | null;
  sessionDurationMinutes: DurationMinutes | null;
  minPriceToman: number;
  maxPriceToman: number;
  suggestedPriceToman: number;
  commissionRateBps: number;
  freeSessionCommissionRateBps: number;
  allowFreeSession: boolean;
  effectiveFrom: Date;
  effectiveTo?: Date | null;
  internalNote?: string | null;
  adminId: string;
};

export type PricingRuleUpdateInput = Partial<Omit<PricingRuleWriteInput, "adminId">> & {
  adminId: string;
};

type PricingRuleReader = Pick<PrismaReader, "pricingRule" | "jobCategory">;

function pricingRuleRepositoryOk<T>(method: string, data: T): RepositoryResult<T> {
  return {
    ok: true,
    area: "admin_pricing",
    method,
    classification: "read_only_persistent",
    data
  };
}

async function readPricingRuleList(db: PricingRuleReader): Promise<PricingRuleListReadModel> {
  const [rules, categoryOptions] = await Promise.all([
    db.pricingRule.findMany({
      select: pricingRuleSelect,
      orderBy: [
        { archivedAt: "asc" },
        { isActive: "desc" },
        { updatedAt: "desc" }
      ]
    }),
    db.jobCategory.findMany({
      where: {
        isActive: true,
        archivedAt: null,
        showInPricing: true,
        code: {
          not: null
        }
      },
      select: pricingCategorySelect,
      orderBy: {
        labelFa: "asc"
      }
    })
  ]);

  return {
    rules,
    categoryOptions
  };
}

function pricingRuleCreateData(input: PricingRuleWriteInput): Prisma.PricingRuleUncheckedCreateInput {
  return {
    title: input.title,
    jobField: input.jobField,
    experienceLevel: input.experienceLevel,
    sessionDurationMinutes: input.sessionDurationMinutes,
    minPriceToman: input.minPriceToman,
    maxPriceToman: input.maxPriceToman,
    suggestedPriceToman: input.suggestedPriceToman,
    commissionRateBps: input.commissionRateBps,
    freeSessionCommissionRateBps: input.freeSessionCommissionRateBps,
    allowFreeSession: input.allowFreeSession,
    effectiveFrom: input.effectiveFrom,
    effectiveTo: input.effectiveTo ?? null,
    internalNote: input.internalNote ?? null,
    createdByAdminId: input.adminId,
    updatedByAdminId: input.adminId
  };
}

function pricingRuleUpdateData(input: PricingRuleUpdateInput): Prisma.PricingRuleUncheckedUpdateInput {
  return {
    ...(input.title === undefined ? {} : { title: input.title }),
    ...(input.jobField === undefined ? {} : { jobField: input.jobField }),
    ...(input.experienceLevel === undefined ? {} : { experienceLevel: input.experienceLevel }),
    ...(input.sessionDurationMinutes === undefined ? {} : { sessionDurationMinutes: input.sessionDurationMinutes }),
    ...(input.minPriceToman === undefined ? {} : { minPriceToman: input.minPriceToman }),
    ...(input.maxPriceToman === undefined ? {} : { maxPriceToman: input.maxPriceToman }),
    ...(input.suggestedPriceToman === undefined ? {} : { suggestedPriceToman: input.suggestedPriceToman }),
    ...(input.commissionRateBps === undefined ? {} : { commissionRateBps: input.commissionRateBps }),
    ...(input.freeSessionCommissionRateBps === undefined ? {} : { freeSessionCommissionRateBps: input.freeSessionCommissionRateBps }),
    ...(input.allowFreeSession === undefined ? {} : { allowFreeSession: input.allowFreeSession }),
    ...(input.effectiveFrom === undefined ? {} : { effectiveFrom: input.effectiveFrom }),
    ...(input.effectiveTo === undefined ? {} : { effectiveTo: input.effectiveTo }),
    ...(input.internalNote === undefined ? {} : { internalNote: input.internalNote ?? null }),
    updatedByAdminId: input.adminId
  };
}

export const pricingRuleRepository = {
  methods: {
    listPricingRules: "read_only_persistent",
    getPricingRule: "read_only_persistent",
    createPricingRule: "database_persistent",
    updatePricingRule: "database_persistent",
    deactivatePricingRule: "database_persistent"
  },
  listPricingRules(reader?: PricingRuleReader) {
    if (reader) {
      return readPricingRuleList(reader).then((data) => pricingRuleRepositoryOk("listPricingRules", data));
    }

    return readOnlyRepositoryOperation("admin_pricing", "listPricingRules", readPricingRuleList);
  },
  getPricingRule(ruleId: string, reader?: PricingRuleReader) {
    const read = (db: PricingRuleReader) =>
      db.pricingRule.findUnique({
        where: { id: ruleId },
        select: pricingRuleSelect
      });

    if (reader) {
      return read(reader).then((data) => pricingRuleRepositoryOk("getPricingRule", data));
    }

    return readOnlyRepositoryOperation("admin_pricing", "getPricingRule", read);
  },
  createPricingRule(input: PricingRuleWriteInput, tx: UseravaaTransactionClient) {
    return tx.pricingRule.create({
      data: pricingRuleCreateData(input),
      select: pricingRuleSelect
    });
  },
  updatePricingRule(ruleId: string, input: PricingRuleUpdateInput, tx: UseravaaTransactionClient) {
    return tx.pricingRule.update({
      where: { id: ruleId },
      data: pricingRuleUpdateData(input),
      select: pricingRuleSelect
    });
  },
  deactivatePricingRule(
    ruleId: string,
    input: { adminId: string; archivedAt: Date; internalNote?: string | null },
    tx: UseravaaTransactionClient
  ) {
    return tx.pricingRule.update({
      where: { id: ruleId },
      data: {
        isActive: false,
        archivedAt: input.archivedAt,
        updatedByAdminId: input.adminId,
        ...(input.internalNote === undefined ? {} : { internalNote: input.internalNote ?? null })
      },
      select: pricingRuleSelect
    });
  }
} as const;
