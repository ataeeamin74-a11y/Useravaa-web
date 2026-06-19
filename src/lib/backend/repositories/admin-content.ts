import { Prisma, type ContentEntryStatus, type ContentEntryType } from "@prisma/client";
import type { UseravaaTransactionClient } from "../db/transaction";
import { readOnlyRepositoryOperation, type PrismaReader, type RepositoryResult } from "./types";

const contentActorSelect = {
  id: true,
  displayName: true,
  role: true
} as const;

const contentEntrySelect = Prisma.validator<Prisma.ContentEntrySelect>()({
  id: true,
  key: true,
  namespace: true,
  locale: true,
  title: true,
  body: true,
  shortText: true,
  description: true,
  contentType: true,
  status: true,
  isEditable: true,
  isSystem: true,
  createdByAdminId: true,
  updatedByAdminId: true,
  archivedAt: true,
  createdAt: true,
  updatedAt: true,
  createdByAdmin: {
    select: contentActorSelect
  },
  updatedByAdmin: {
    select: contentActorSelect
  }
});

export type AdminContentEntryRecord = Prisma.ContentEntryGetPayload<{ select: typeof contentEntrySelect }>;

export type AdminContentEntryFilters = {
  namespace?: string | null;
  contentType?: ContentEntryType | null;
  status?: ContentEntryStatus | null;
  search?: string | null;
};

export type AdminContentEntryWriteInput = {
  key: string;
  namespace: string;
  locale: string;
  title: string;
  body: string;
  shortText?: string | null;
  description?: string | null;
  contentType: ContentEntryType;
  status: ContentEntryStatus;
  isEditable: boolean;
  adminId: string;
};

export type AdminContentEntryUpdateInput = Partial<Omit<AdminContentEntryWriteInput, "key" | "namespace" | "locale" | "adminId">> & {
  adminId: string;
};

type ContentEntryReader = Pick<PrismaReader, "contentEntry">;

function adminContentRepositoryOk<T>(method: string, data: T): RepositoryResult<T> {
  return {
    ok: true,
    area: "admin_content",
    method,
    classification: "read_only_persistent",
    data
  };
}

function contentListWhere(filters: AdminContentEntryFilters = {}): Prisma.ContentEntryWhereInput {
  return {
    ...(filters.namespace ? { namespace: filters.namespace } : {}),
    ...(filters.contentType ? { contentType: filters.contentType } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.search
      ? {
          OR: [
            { key: { contains: filters.search, mode: "insensitive" } },
            { namespace: { contains: filters.search, mode: "insensitive" } },
            { title: { contains: filters.search, mode: "insensitive" } },
            { body: { contains: filters.search, mode: "insensitive" } },
            { shortText: { contains: filters.search, mode: "insensitive" } }
          ]
        }
      : {})
  };
}

function contentCreateData(input: AdminContentEntryWriteInput): Prisma.ContentEntryUncheckedCreateInput {
  return {
    key: input.key,
    namespace: input.namespace,
    locale: input.locale,
    title: input.title,
    body: input.body,
    shortText: input.shortText ?? null,
    description: input.description ?? null,
    contentType: input.contentType,
    status: input.status,
    isEditable: input.isEditable,
    isSystem: false,
    createdByAdminId: input.adminId,
    updatedByAdminId: input.adminId,
    archivedAt: input.status === "ARCHIVED" ? new Date() : null
  };
}

function contentUpdateData(input: AdminContentEntryUpdateInput): Prisma.ContentEntryUncheckedUpdateInput {
  return {
    ...(input.title === undefined ? {} : { title: input.title }),
    ...(input.body === undefined ? {} : { body: input.body }),
    ...(input.shortText === undefined ? {} : { shortText: input.shortText ?? null }),
    ...(input.description === undefined ? {} : { description: input.description ?? null }),
    ...(input.contentType === undefined ? {} : { contentType: input.contentType }),
    ...(input.status === undefined ? {} : { status: input.status }),
    ...(input.isEditable === undefined ? {} : { isEditable: input.isEditable }),
    updatedByAdminId: input.adminId
  };
}

export const adminContentRepository = {
  methods: {
    listContentEntries: "read_only_persistent",
    getContentEntry: "read_only_persistent",
    getPublishedContentByKey: "read_only_persistent",
    createContentEntry: "database_persistent",
    updateContentEntry: "database_persistent",
    archiveContentEntry: "database_persistent",
    restoreContentEntry: "database_persistent"
  },
  async listContentEntries(filters: AdminContentEntryFilters = {}, reader?: ContentEntryReader) {
    const read = (db: ContentEntryReader) =>
      db.contentEntry.findMany({
        where: contentListWhere(filters),
        select: contentEntrySelect,
        orderBy: [{ archivedAt: "asc" }, { namespace: "asc" }, { key: "asc" }, { updatedAt: "desc" }]
      });

    if (reader) {
      return read(reader).then((data) => adminContentRepositoryOk("listContentEntries", data));
    }

    return readOnlyRepositoryOperation("admin_content", "listContentEntries", read);
  },
  async getContentEntry(contentEntryId: string, reader?: ContentEntryReader) {
    const read = (db: ContentEntryReader) =>
      db.contentEntry.findUnique({
        where: { id: contentEntryId },
        select: contentEntrySelect
      });

    if (reader) {
      return read(reader).then((data) => adminContentRepositoryOk("getContentEntry", data));
    }

    return readOnlyRepositoryOperation("admin_content", "getContentEntry", read);
  },
  async getPublishedContentByKey(
    input: { namespace: string; key: string; locale?: string },
    reader?: ContentEntryReader
  ) {
    const read = (db: ContentEntryReader) =>
      db.contentEntry.findFirst({
        where: {
          namespace: input.namespace,
          key: input.key,
          locale: input.locale ?? "fa",
          status: "PUBLISHED",
          archivedAt: null
        },
        select: contentEntrySelect
      });

    if (reader) {
      return read(reader).then((data) => adminContentRepositoryOk("getPublishedContentByKey", data));
    }

    return readOnlyRepositoryOperation("admin_content", "getPublishedContentByKey", read);
  },
  createContentEntry(input: AdminContentEntryWriteInput, tx: UseravaaTransactionClient) {
    return tx.contentEntry.create({
      data: contentCreateData(input),
      select: contentEntrySelect
    });
  },
  updateContentEntry(contentEntryId: string, input: AdminContentEntryUpdateInput, tx: UseravaaTransactionClient) {
    return tx.contentEntry.update({
      where: { id: contentEntryId },
      data: contentUpdateData(input),
      select: contentEntrySelect
    });
  },
  archiveContentEntry(
    contentEntryId: string,
    input: { adminId: string; archivedAt: Date },
    tx: UseravaaTransactionClient
  ) {
    return tx.contentEntry.update({
      where: { id: contentEntryId },
      data: {
        status: "ARCHIVED",
        archivedAt: input.archivedAt,
        updatedByAdminId: input.adminId
      },
      select: contentEntrySelect
    });
  },
  restoreContentEntry(contentEntryId: string, input: { adminId: string }, tx: UseravaaTransactionClient) {
    return tx.contentEntry.update({
      where: { id: contentEntryId },
      data: {
        status: "DRAFT",
        archivedAt: null,
        updatedByAdminId: input.adminId
      },
      select: contentEntrySelect
    });
  }
} as const;
