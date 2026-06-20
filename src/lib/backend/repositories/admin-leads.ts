import {
  Prisma,
  type LeadFollowUpChannel,
  type LeadFollowUpOutcome,
  type LeadNoteType,
  type LeadSource,
  type LeadStage,
  type LeadTemperature,
  type LeadType
} from "@prisma/client";
import type { UseravaaTransactionClient } from "../db/transaction";
import { readOnlyRepositoryOperation, type PrismaReader, type RepositoryResult } from "./types";

const leadActorSelect = {
  id: true,
  displayName: true,
  email: true,
  role: true
} as const;

const leadTagAssignmentSelect = Prisma.validator<Prisma.LeadTagAssignmentSelect>()({
  id: true,
  leadId: true,
  tagId: true,
  createdByAdminId: true,
  createdAt: true,
  tag: {
    select: {
      id: true,
      name: true,
      normalizedName: true
    }
  },
  createdByAdmin: {
    select: leadActorSelect
  }
});

const leadNoteSelect = Prisma.validator<Prisma.LeadNoteSelect>()({
  id: true,
  leadId: true,
  body: true,
  noteType: true,
  createdByAdminId: true,
  createdAt: true,
  updatedAt: true,
  createdByAdmin: {
    select: leadActorSelect
  }
});

const leadFollowUpSelect = Prisma.validator<Prisma.LeadFollowUpSelect>()({
  id: true,
  leadId: true,
  channel: true,
  scheduledAt: true,
  completedAt: true,
  outcome: true,
  summary: true,
  createdByAdminId: true,
  completedByAdminId: true,
  createdAt: true,
  updatedAt: true,
  createdByAdmin: {
    select: leadActorSelect
  },
  completedByAdmin: {
    select: leadActorSelect
  }
});

const adminLeadSelect = Prisma.validator<Prisma.LeadSelect>()({
  id: true,
  leadNumber: true,
  firstName: true,
  lastName: true,
  phone: true,
  normalizedPhone: true,
  email: true,
  normalizedEmail: true,
  lastCompany: true,
  jobTitle: true,
  jobCategory: true,
  jobCategoryId: true,
  yearsOfExperience: true,
  leadType: true,
  temperature: true,
  stage: true,
  source: true,
  notes: true,
  ownerAdminId: true,
  relatedUserId: true,
  relatedConversationId: true,
  relatedProfileId: true,
  relatedInsightId: true,
  intentSummary: true,
  blocker: true,
  score: true,
  lastContactedAt: true,
  nextFollowUpAt: true,
  followUpCount: true,
  lastFollowUpOutcome: true,
  convertedAt: true,
  lostAt: true,
  lostReason: true,
  archivedAt: true,
  createdAt: true,
  updatedAt: true,
  ownerAdmin: {
    select: leadActorSelect
  },
  relatedUser: {
    select: leadActorSelect
  },
  relatedConversation: {
    select: {
      id: true,
      requestTopic: true,
      status: true
    }
  },
  relatedProfile: {
    select: {
      id: true,
      displayName: true,
      roleTitle: true
    }
  },
  relatedInsight: {
    select: {
      id: true,
      slug: true,
      title: true
    }
  },
  jobCategoryRecord: {
    select: {
      id: true,
      labelFa: true,
      slug: true
    }
  },
  tagAssignments: {
    select: leadTagAssignmentSelect,
    orderBy: {
      createdAt: "asc"
    }
  },
  leadNotes: {
    select: leadNoteSelect,
    orderBy: {
      createdAt: "desc"
    }
  },
  followUps: {
    select: leadFollowUpSelect,
    orderBy: [{ completedAt: "asc" }, { scheduledAt: "asc" }]
  }
});

export type AdminLeadRecord = Prisma.LeadGetPayload<{ select: typeof adminLeadSelect }>;
export type AdminLeadNoteRecord = Prisma.LeadNoteGetPayload<{ select: typeof leadNoteSelect }>;
export type AdminLeadFollowUpRecord = Prisma.LeadFollowUpGetPayload<{ select: typeof leadFollowUpSelect }>;
export type AdminLeadTagAssignmentRecord = Prisma.LeadTagAssignmentGetPayload<{ select: typeof leadTagAssignmentSelect }>;

export type AdminLeadFilters = {
  stage?: LeadStage | null;
  temperature?: LeadTemperature | null;
  leadType?: LeadType | null;
  source?: LeadSource | null;
  ownerAdminId?: string | null;
  unassigned?: boolean | null;
  dueFollowUp?: boolean | null;
  includeArchived?: boolean | null;
  search?: string | null;
  skip?: number | null;
  take?: number | null;
};

export type AdminLeadWriteInput = {
  leadNumber: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  normalizedPhone?: string | null;
  email?: string | null;
  normalizedEmail?: string | null;
  lastCompany?: string | null;
  jobTitle?: string | null;
  jobCategory?: string | null;
  jobCategoryId?: string | null;
  yearsOfExperience?: number | null;
  leadType: LeadType;
  temperature: LeadTemperature;
  stage: LeadStage;
  source: LeadSource;
  notes?: string | null;
  ownerAdminId?: string | null;
  relatedUserId?: string | null;
  relatedConversationId?: string | null;
  relatedProfileId?: string | null;
  relatedInsightId?: string | null;
  intentSummary?: string | null;
  blocker?: string | null;
  score?: number | null;
  nextFollowUpAt?: Date | null;
  now: Date;
};

export type AdminLeadUpdateInput = Partial<
  Omit<AdminLeadWriteInput, "leadNumber" | "normalizedPhone" | "normalizedEmail" | "now">
> & {
  normalizedPhone?: string | null;
  normalizedEmail?: string | null;
  lastContactedAt?: Date | null;
  nextFollowUpAt?: Date | null;
  followUpCount?: number;
  lastFollowUpOutcome?: LeadFollowUpOutcome | null;
  convertedAt?: Date | null;
  lostAt?: Date | null;
  lostReason?: string | null;
  archivedAt?: Date | null;
};

export type AdminLeadNoteWriteInput = {
  leadId: string;
  body: string;
  noteType: LeadNoteType;
  createdByAdminId: string;
  now: Date;
};

export type AdminLeadTagWriteInput = {
  leadId: string;
  name: string;
  normalizedName: string;
  createdByAdminId: string;
  now: Date;
};

export type AdminLeadFollowUpWriteInput = {
  leadId: string;
  channel: LeadFollowUpChannel;
  scheduledAt: Date;
  summary?: string | null;
  createdByAdminId: string;
  now: Date;
};

export type AdminLeadFollowUpCompleteInput = {
  outcome: LeadFollowUpOutcome;
  summary?: string | null;
  completedByAdminId: string;
  completedAt: Date;
};

type LeadReader = Pick<
  PrismaReader,
  "lead" | "leadTag" | "leadTagAssignment" | "leadNote" | "leadFollowUp"
>;

function adminLeadRepositoryOk<T>(method: string, data: T): RepositoryResult<T> {
  return {
    ok: true,
    area: "admin_leads",
    method,
    classification: "read_only_persistent",
    data
  };
}

function leadWhere(filters: AdminLeadFilters = {}): Prisma.LeadWhereInput {
  const includeArchived = Boolean(filters.includeArchived || filters.stage === "ARCHIVED");
  const search = filters.search?.trim();

  return {
    ...(includeArchived ? {} : { archivedAt: null, stage: { not: "ARCHIVED" } }),
    ...(filters.stage ? { stage: filters.stage } : {}),
    ...(filters.temperature ? { temperature: filters.temperature } : {}),
    ...(filters.leadType ? { leadType: filters.leadType } : {}),
    ...(filters.source ? { source: filters.source } : {}),
    ...(filters.ownerAdminId ? { ownerAdminId: filters.ownerAdminId } : {}),
    ...(filters.unassigned ? { ownerAdminId: null } : {}),
    ...(filters.dueFollowUp ? { nextFollowUpAt: { lte: new Date() } } : {}),
    ...(search
      ? {
          OR: [
            { leadNumber: { contains: search, mode: "insensitive" } },
            { firstName: { contains: search, mode: "insensitive" } },
            { lastName: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { lastCompany: { contains: search, mode: "insensitive" } },
            { jobTitle: { contains: search, mode: "insensitive" } },
            { jobCategory: { contains: search, mode: "insensitive" } },
            { intentSummary: { contains: search, mode: "insensitive" } }
          ]
        }
      : {})
  };
}

function createLeadData(input: AdminLeadWriteInput): Prisma.LeadUncheckedCreateInput {
  return {
    leadNumber: input.leadNumber,
    firstName: input.firstName,
    lastName: input.lastName,
    phone: input.phone ?? null,
    normalizedPhone: input.normalizedPhone ?? null,
    email: input.email ?? null,
    normalizedEmail: input.normalizedEmail ?? null,
    lastCompany: input.lastCompany ?? null,
    jobTitle: input.jobTitle ?? null,
    jobCategory: input.jobCategory ?? null,
    jobCategoryId: input.jobCategoryId ?? null,
    yearsOfExperience: input.yearsOfExperience ?? null,
    leadType: input.leadType,
    temperature: input.temperature,
    stage: input.stage,
    source: input.source,
    notes: input.notes ?? null,
    ownerAdminId: input.ownerAdminId ?? null,
    relatedUserId: input.relatedUserId ?? null,
    relatedConversationId: input.relatedConversationId ?? null,
    relatedProfileId: input.relatedProfileId ?? null,
    relatedInsightId: input.relatedInsightId ?? null,
    intentSummary: input.intentSummary ?? null,
    blocker: input.blocker ?? null,
    score: input.score ?? null,
    nextFollowUpAt: input.nextFollowUpAt ?? null,
    createdAt: input.now
  };
}

function updateLeadData(input: AdminLeadUpdateInput): Prisma.LeadUncheckedUpdateInput {
  return {
    ...(input.firstName === undefined ? {} : { firstName: input.firstName }),
    ...(input.lastName === undefined ? {} : { lastName: input.lastName }),
    ...(input.phone === undefined ? {} : { phone: input.phone }),
    ...(input.normalizedPhone === undefined ? {} : { normalizedPhone: input.normalizedPhone }),
    ...(input.email === undefined ? {} : { email: input.email }),
    ...(input.normalizedEmail === undefined ? {} : { normalizedEmail: input.normalizedEmail }),
    ...(input.lastCompany === undefined ? {} : { lastCompany: input.lastCompany }),
    ...(input.jobTitle === undefined ? {} : { jobTitle: input.jobTitle }),
    ...(input.jobCategory === undefined ? {} : { jobCategory: input.jobCategory }),
    ...(input.jobCategoryId === undefined ? {} : { jobCategoryId: input.jobCategoryId }),
    ...(input.yearsOfExperience === undefined ? {} : { yearsOfExperience: input.yearsOfExperience }),
    ...(input.leadType === undefined ? {} : { leadType: input.leadType }),
    ...(input.temperature === undefined ? {} : { temperature: input.temperature }),
    ...(input.stage === undefined ? {} : { stage: input.stage }),
    ...(input.source === undefined ? {} : { source: input.source }),
    ...(input.notes === undefined ? {} : { notes: input.notes }),
    ...(input.ownerAdminId === undefined ? {} : { ownerAdminId: input.ownerAdminId }),
    ...(input.relatedUserId === undefined ? {} : { relatedUserId: input.relatedUserId }),
    ...(input.relatedConversationId === undefined ? {} : { relatedConversationId: input.relatedConversationId }),
    ...(input.relatedProfileId === undefined ? {} : { relatedProfileId: input.relatedProfileId }),
    ...(input.relatedInsightId === undefined ? {} : { relatedInsightId: input.relatedInsightId }),
    ...(input.intentSummary === undefined ? {} : { intentSummary: input.intentSummary }),
    ...(input.blocker === undefined ? {} : { blocker: input.blocker }),
    ...(input.score === undefined ? {} : { score: input.score }),
    ...(input.lastContactedAt === undefined ? {} : { lastContactedAt: input.lastContactedAt }),
    ...(input.nextFollowUpAt === undefined ? {} : { nextFollowUpAt: input.nextFollowUpAt }),
    ...(input.followUpCount === undefined ? {} : { followUpCount: input.followUpCount }),
    ...(input.lastFollowUpOutcome === undefined ? {} : { lastFollowUpOutcome: input.lastFollowUpOutcome }),
    ...(input.convertedAt === undefined ? {} : { convertedAt: input.convertedAt }),
    ...(input.lostAt === undefined ? {} : { lostAt: input.lostAt }),
    ...(input.lostReason === undefined ? {} : { lostReason: input.lostReason }),
    ...(input.archivedAt === undefined ? {} : { archivedAt: input.archivedAt })
  };
}

export const adminLeadRepository = {
  methods: {
    listLeads: "read_only_persistent",
    getLead: "read_only_persistent",
    findDuplicateLead: "read_only_persistent",
    listExistingContactKeys: "read_only_persistent",
    createLead: "database_persistent",
    updateLead: "database_persistent",
    addLeadNote: "database_persistent",
    upsertLeadTag: "database_persistent",
    addLeadTagAssignmentByTagId: "database_persistent",
    removeLeadTagAssignment: "database_persistent",
    createLeadFollowUp: "database_persistent",
    updateLeadFollowUp: "database_persistent"
  },
  async listLeads(filters: AdminLeadFilters = {}, reader?: LeadReader) {
    const read = (db: LeadReader) =>
      db.lead.findMany({
        where: leadWhere(filters),
        select: adminLeadSelect,
        orderBy: [{ nextFollowUpAt: "asc" }, { updatedAt: "desc" }],
        skip: filters.skip ?? 0,
        take: Math.min(Math.max(filters.take ?? 100, 1), 200)
      });

    if (reader) {
      return read(reader).then((data) => adminLeadRepositoryOk("listLeads", data));
    }

    return readOnlyRepositoryOperation("admin_leads", "listLeads", read);
  },
  async getLead(leadId: string, reader?: LeadReader) {
    const read = (db: LeadReader) =>
      db.lead.findUnique({
        where: { id: leadId },
        select: adminLeadSelect
      });

    if (reader) {
      return read(reader).then((data) => adminLeadRepositoryOk("getLead", data));
    }

    return readOnlyRepositoryOperation("admin_leads", "getLead", read);
  },
  async findDuplicateLead(input: { normalizedEmail?: string | null; normalizedPhone?: string | null }, reader?: LeadReader) {
    const OR = [
      input.normalizedEmail ? { normalizedEmail: input.normalizedEmail } : null,
      input.normalizedPhone ? { normalizedPhone: input.normalizedPhone } : null
    ].filter(Boolean) as Prisma.LeadWhereInput[];
    const read = (db: LeadReader) =>
      OR.length
        ? db.lead.findFirst({
            where: { OR },
            select: adminLeadSelect
          })
        : Promise.resolve(null);

    if (reader) {
      return read(reader).then((data) => adminLeadRepositoryOk("findDuplicateLead", data));
    }

    return readOnlyRepositoryOperation("admin_leads", "findDuplicateLead", read);
  },
  async listExistingContactKeys(input: { normalizedEmails: string[]; normalizedPhones: string[] }, reader?: LeadReader) {
    const OR = [
      ...(input.normalizedEmails.length ? [{ normalizedEmail: { in: input.normalizedEmails } }] : []),
      ...(input.normalizedPhones.length ? [{ normalizedPhone: { in: input.normalizedPhones } }] : [])
    ];
    const read = (db: LeadReader) =>
      OR.length
        ? db.lead.findMany({
            where: { OR },
            select: {
              id: true,
              normalizedEmail: true,
              normalizedPhone: true
            }
          })
        : Promise.resolve([]);

    if (reader) {
      return read(reader).then((data) => adminLeadRepositoryOk("listExistingContactKeys", data));
    }

    return readOnlyRepositoryOperation("admin_leads", "listExistingContactKeys", read);
  },
  createLead(input: AdminLeadWriteInput, tx: UseravaaTransactionClient) {
    return tx.lead.create({
      data: createLeadData(input),
      select: adminLeadSelect
    });
  },
  updateLead(leadId: string, input: AdminLeadUpdateInput, tx: UseravaaTransactionClient) {
    return tx.lead.update({
      where: { id: leadId },
      data: updateLeadData(input),
      select: adminLeadSelect
    });
  },
  addLeadNote(input: AdminLeadNoteWriteInput, tx: UseravaaTransactionClient) {
    return tx.leadNote.create({
      data: {
        leadId: input.leadId,
        body: input.body,
        noteType: input.noteType,
        createdByAdminId: input.createdByAdminId,
        createdAt: input.now
      },
      select: leadNoteSelect
    });
  },
  upsertLeadTag(input: Pick<AdminLeadTagWriteInput, "name" | "normalizedName" | "now">, tx: UseravaaTransactionClient) {
    return tx.leadTag.upsert({
      where: {
        normalizedName: input.normalizedName
      },
      create: {
        name: input.name,
        normalizedName: input.normalizedName,
        createdAt: input.now
      },
      update: {
        name: input.name
      },
      select: {
        id: true,
        name: true,
        normalizedName: true
      }
    });
  },
  addLeadTagAssignmentByTagId(input: { leadId: string; tagId: string; createdByAdminId: string; now: Date }, tx: UseravaaTransactionClient) {
    return tx.leadTagAssignment.upsert({
      where: {
        leadId_tagId: {
          leadId: input.leadId,
          tagId: input.tagId
        }
      },
      create: {
        leadId: input.leadId,
        tagId: input.tagId,
        createdByAdminId: input.createdByAdminId,
        createdAt: input.now
      },
      update: {},
      select: leadTagAssignmentSelect
    });
  },
  removeLeadTagAssignment(leadId: string, tagId: string, tx: UseravaaTransactionClient) {
    return tx.leadTagAssignment.deleteMany({
      where: {
        leadId,
        tagId
      }
    });
  },
  createLeadFollowUp(input: AdminLeadFollowUpWriteInput, tx: UseravaaTransactionClient) {
    return tx.leadFollowUp.create({
      data: {
        leadId: input.leadId,
        channel: input.channel,
        scheduledAt: input.scheduledAt,
        summary: input.summary ?? null,
        createdByAdminId: input.createdByAdminId,
        createdAt: input.now
      },
      select: leadFollowUpSelect
    });
  },
  updateLeadFollowUp(followUpId: string, input: AdminLeadFollowUpCompleteInput, tx: UseravaaTransactionClient) {
    return tx.leadFollowUp.update({
      where: { id: followUpId },
      data: {
        outcome: input.outcome,
        summary: input.summary ?? null,
        completedByAdminId: input.completedByAdminId,
        completedAt: input.completedAt
      },
      select: leadFollowUpSelect
    });
  }
} as const;
