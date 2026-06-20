import {
  Prisma,
  type SupportRelatedEntityType,
  type SupportTicketCategory,
  type SupportTicketNoteType,
  type SupportTicketPriority,
  type SupportTicketSource,
  type SupportTicketStatus
} from "@prisma/client";
import type { UseravaaTransactionClient } from "../db/transaction";
import { readOnlyRepositoryOperation, type PrismaReader, type RepositoryResult } from "./types";

const supportActorSelect = {
  id: true,
  displayName: true,
  email: true,
  role: true
} as const;

const supportTicketNoteSelect = Prisma.validator<Prisma.SupportTicketNoteSelect>()({
  id: true,
  ticketId: true,
  body: true,
  noteType: true,
  createdByAdminId: true,
  createdAt: true,
  updatedAt: true,
  createdByAdmin: {
    select: supportActorSelect
  }
});

const supportTicketSelect = Prisma.validator<Prisma.SupportTicketSelect>()({
  id: true,
  ticketNumber: true,
  subject: true,
  description: true,
  status: true,
  priority: true,
  category: true,
  subcategory: true,
  source: true,
  requesterUserId: true,
  assigneeAdminId: true,
  relatedEntityType: true,
  relatedEntityId: true,
  resolutionSummary: true,
  resolutionReason: true,
  archivedAt: true,
  resolvedAt: true,
  createdAt: true,
  updatedAt: true,
  requesterUser: {
    select: supportActorSelect
  },
  assigneeAdmin: {
    select: supportActorSelect
  },
  notes: {
    select: supportTicketNoteSelect,
    orderBy: { createdAt: "desc" }
  }
});

export type AdminSupportTicketRecord = Prisma.SupportTicketGetPayload<{ select: typeof supportTicketSelect }>;
export type AdminSupportTicketNoteRecord = Prisma.SupportTicketNoteGetPayload<{ select: typeof supportTicketNoteSelect }>;

export type AdminSupportTicketFilters = {
  status?: SupportTicketStatus | null;
  priority?: SupportTicketPriority | null;
  category?: SupportTicketCategory | null;
  assigneeAdminId?: string | null;
  source?: SupportTicketSource | null;
  relatedEntityType?: SupportRelatedEntityType | null;
  unassigned?: boolean | null;
  search?: string | null;
  includeArchived?: boolean | null;
};

export type AdminSupportTicketWriteInput = {
  ticketNumber: string;
  subject: string;
  description: string;
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  category: SupportTicketCategory;
  subcategory?: string | null;
  source: SupportTicketSource;
  requesterUserId?: string | null;
  assigneeAdminId?: string | null;
  relatedEntityType?: SupportRelatedEntityType | null;
  relatedEntityId?: string | null;
  now: Date;
};

export type AdminSupportTicketUpdateInput = {
  subject?: string;
  description?: string;
  status?: SupportTicketStatus;
  priority?: SupportTicketPriority;
  category?: SupportTicketCategory;
  subcategory?: string | null;
  source?: SupportTicketSource;
  requesterUserId?: string | null;
  assigneeAdminId?: string | null;
  relatedEntityType?: SupportRelatedEntityType | null;
  relatedEntityId?: string | null;
  resolutionSummary?: string | null;
  resolutionReason?: string | null;
  resolvedAt?: Date | null;
  archivedAt?: Date | null;
};

export type AdminSupportTicketNoteWriteInput = {
  ticketId: string;
  body: string;
  noteType: SupportTicketNoteType;
  createdByAdminId: string;
  now: Date;
};

type SupportTicketReader = Pick<PrismaReader, "supportTicket" | "supportTicketNote">;

function adminSupportRepositoryOk<T>(method: string, data: T): RepositoryResult<T> {
  return {
    ok: true,
    area: "admin_support",
    method,
    classification: "read_only_persistent",
    data
  };
}

function supportTicketWhere(filters: AdminSupportTicketFilters = {}): Prisma.SupportTicketWhereInput {
  const includeArchived = Boolean(filters.includeArchived || filters.status === "ARCHIVED");

  return {
    ...(includeArchived ? {} : { archivedAt: null, status: { not: "ARCHIVED" } }),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.priority ? { priority: filters.priority } : {}),
    ...(filters.category ? { category: filters.category } : {}),
    ...(filters.source ? { source: filters.source } : {}),
    ...(filters.relatedEntityType ? { relatedEntityType: filters.relatedEntityType } : {}),
    ...(filters.assigneeAdminId ? { assigneeAdminId: filters.assigneeAdminId } : {}),
    ...(filters.unassigned ? { assigneeAdminId: null } : {}),
    ...(filters.search
      ? {
          OR: [
            { ticketNumber: { contains: filters.search, mode: "insensitive" } },
            { subject: { contains: filters.search, mode: "insensitive" } },
            { description: { contains: filters.search, mode: "insensitive" } },
            { relatedEntityId: { contains: filters.search, mode: "insensitive" } }
          ]
        }
      : {})
  };
}

function createData(input: AdminSupportTicketWriteInput): Prisma.SupportTicketUncheckedCreateInput {
  return {
    ticketNumber: input.ticketNumber,
    subject: input.subject,
    description: input.description,
    status: input.status,
    priority: input.priority,
    category: input.category,
    subcategory: input.subcategory ?? null,
    source: input.source,
    requesterUserId: input.requesterUserId ?? null,
    assigneeAdminId: input.assigneeAdminId ?? null,
    relatedEntityType: input.relatedEntityType ?? null,
    relatedEntityId: input.relatedEntityId ?? null,
    resolvedAt: input.status === "RESOLVED" ? input.now : null,
    archivedAt: input.status === "ARCHIVED" ? input.now : null,
    createdAt: input.now
  };
}

function updateData(input: AdminSupportTicketUpdateInput): Prisma.SupportTicketUncheckedUpdateInput {
  return {
    ...(input.subject === undefined ? {} : { subject: input.subject }),
    ...(input.description === undefined ? {} : { description: input.description }),
    ...(input.status === undefined ? {} : { status: input.status }),
    ...(input.priority === undefined ? {} : { priority: input.priority }),
    ...(input.category === undefined ? {} : { category: input.category }),
    ...(input.subcategory === undefined ? {} : { subcategory: input.subcategory }),
    ...(input.source === undefined ? {} : { source: input.source }),
    ...(input.requesterUserId === undefined ? {} : { requesterUserId: input.requesterUserId }),
    ...(input.assigneeAdminId === undefined ? {} : { assigneeAdminId: input.assigneeAdminId }),
    ...(input.relatedEntityType === undefined ? {} : { relatedEntityType: input.relatedEntityType }),
    ...(input.relatedEntityId === undefined ? {} : { relatedEntityId: input.relatedEntityId }),
    ...(input.resolutionSummary === undefined ? {} : { resolutionSummary: input.resolutionSummary }),
    ...(input.resolutionReason === undefined ? {} : { resolutionReason: input.resolutionReason }),
    ...(input.resolvedAt === undefined ? {} : { resolvedAt: input.resolvedAt }),
    ...(input.archivedAt === undefined ? {} : { archivedAt: input.archivedAt })
  };
}

export const adminSupportRepository = {
  methods: {
    listSupportTickets: "read_only_persistent",
    getSupportTicket: "read_only_persistent",
    createSupportTicket: "database_persistent",
    updateSupportTicket: "database_persistent",
    addSupportTicketNote: "database_persistent"
  },
  async listSupportTickets(filters: AdminSupportTicketFilters = {}, reader?: SupportTicketReader) {
    const read = (db: SupportTicketReader) =>
      db.supportTicket.findMany({
        where: supportTicketWhere(filters),
        select: supportTicketSelect,
        orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
        take: 100
      });

    if (reader) {
      return read(reader).then((data) => adminSupportRepositoryOk("listSupportTickets", data));
    }

    return readOnlyRepositoryOperation("admin_support", "listSupportTickets", read);
  },
  async getSupportTicket(ticketId: string, reader?: SupportTicketReader) {
    const read = (db: SupportTicketReader) =>
      db.supportTicket.findUnique({
        where: { id: ticketId },
        select: supportTicketSelect
      });

    if (reader) {
      return read(reader).then((data) => adminSupportRepositoryOk("getSupportTicket", data));
    }

    return readOnlyRepositoryOperation("admin_support", "getSupportTicket", read);
  },
  createSupportTicket(input: AdminSupportTicketWriteInput, tx: UseravaaTransactionClient) {
    return tx.supportTicket.create({
      data: createData(input),
      select: supportTicketSelect
    });
  },
  updateSupportTicket(ticketId: string, input: AdminSupportTicketUpdateInput, tx: UseravaaTransactionClient) {
    return tx.supportTicket.update({
      where: { id: ticketId },
      data: updateData(input),
      select: supportTicketSelect
    });
  },
  addSupportTicketNote(input: AdminSupportTicketNoteWriteInput, tx: UseravaaTransactionClient) {
    return tx.supportTicketNote.create({
      data: {
        ticketId: input.ticketId,
        body: input.body,
        noteType: input.noteType,
        createdByAdminId: input.createdByAdminId,
        createdAt: input.now
      },
      select: supportTicketNoteSelect
    });
  }
} as const;
