import { useravaaRepository } from "./repository";
import type { PrismaReader } from "./repositories";
import type {
  AdminActionQueueItem,
  AdminAnalyticsDateRange,
  AdminAnalyticsFilters,
  AdminAnalyticsSummary,
  AdminAttendanceRow,
  AdminCancellationDetail,
  AdminCancellationRow,
  AdminConversationDetail,
  AdminConversationRow,
  AdminDashboardSummary,
  AdminExperienceProfileDetail,
  AdminExperienceProfileRow,
  AdminInsightDetail,
  AdminInsightRow,
  AdminUserDetail,
  AdminUserRow,
  AdminWalletTransactionRow,
  RepositoryResult
} from "./repositories";

export type {
  AdminActionQueueItem,
  AdminAnalyticsDateRange,
  AdminAnalyticsFilters,
  AdminAnalyticsSummary,
  AdminAttendanceRow,
  AdminCancellationDetail,
  AdminCancellationRow,
  AdminConversationDetail,
  AdminConversationRow,
  AdminDashboardSummary,
  AdminExperienceProfileDetail,
  AdminExperienceProfileRow,
  AdminInsightDetail,
  AdminInsightRow,
  AdminUserDetail,
  AdminUserRow,
  AdminWalletTransactionRow
};

export type AdminAuditLogRow = {
  id: string;
  actorId: string | null;
  actorLabel: string;
  actorRole: string;
  action: string;
  targetType: string;
  targetId: string | null;
  relatedConversationId: string | null;
  relatedPaymentId: string | null;
  beforeStatus: string | null;
  afterStatus: string | null;
  reason: string | null;
  note: string | null;
  createdAt: Date;
};

export type AdminAuditLogReadModel = {
  implemented: boolean;
  rows: AdminAuditLogRow[];
  note: string;
};

export type AdminReadViewer = {
  id: string;
  role?: string | null;
};

export type AdminReadModelResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      code: "unauthorized" | "database_not_configured" | "database_unavailable" | "not_implemented";
      message: string;
      details?: unknown;
    };

function canReadAdminModels(viewer: AdminReadViewer) {
  return viewer.role === "ADMIN" || viewer.role === "SUPPORT";
}

function unauthorizedResult<T>(): AdminReadModelResult<T> {
  return {
    ok: false,
    code: "unauthorized",
    message: "The current viewer is not allowed to read admin models."
  };
}

function repositoryToAdminReadResult<T>(result: RepositoryResult<T>): AdminReadModelResult<T> {
  if (result.ok) {
    return {
      ok: true,
      data: result.data
    };
  }

  return {
    ok: false,
    code: result.reason,
    message: result.message,
    details: result.details
  };
}

function mapAuditRows(
  rows: {
    id: string;
    actorAdminUserId: string | null;
    actorRole: string;
    action: string;
    entityType: string;
    entityId: string;
    relatedConversationId: string | null;
    relatedPaymentId: string | null;
    beforeStatus: string | null;
    afterStatus: string | null;
    reason: string | null;
    note: string | null;
    createdAt: Date;
    actorAdminUser: { id: string; displayName: string; role: string } | null;
  }[]
): AdminAuditLogRow[] {
  return rows.map((row) => ({
    id: row.id,
    actorId: row.actorAdminUserId,
    actorLabel: row.actorAdminUser?.displayName ?? row.actorAdminUserId ?? "unknown",
    actorRole: row.actorRole,
    action: row.action,
    targetType: row.entityType,
    targetId: row.entityId,
    relatedConversationId: row.relatedConversationId,
    relatedPaymentId: row.relatedPaymentId,
    beforeStatus: row.beforeStatus,
    afterStatus: row.afterStatus,
    reason: row.reason,
    note: row.note,
    createdAt: row.createdAt
  }));
}

async function guardedRead<T>(viewer: AdminReadViewer, read: () => Promise<RepositoryResult<T>>) {
  if (!canReadAdminModels(viewer)) {
    return unauthorizedResult<T>();
  }

  return repositoryToAdminReadResult(await read());
}

export const adminReadModelService = {
  getDashboard(viewer: AdminReadViewer) {
    return guardedRead(viewer, () => useravaaRepository.adminReadModels.getDashboard());
  },
  listActionQueue(viewer: AdminReadViewer) {
    return guardedRead(viewer, () => useravaaRepository.adminReadModels.listActionQueue());
  },
  listConversations(viewer: AdminReadViewer) {
    return guardedRead(viewer, () => useravaaRepository.adminReadModels.listConversations());
  },
  getConversationDetail(viewer: AdminReadViewer, conversationId: string) {
    return guardedRead(viewer, () => useravaaRepository.adminReadModels.getConversationDetail(conversationId));
  },
  listCancellations(viewer: AdminReadViewer) {
    return guardedRead(viewer, () => useravaaRepository.adminReadModels.listCancellations());
  },
  getCancellationDetail(viewer: AdminReadViewer, cancellationId: string) {
    return guardedRead(viewer, () => useravaaRepository.adminReadModels.getCancellationDetail(cancellationId));
  },
  listUsers(viewer: AdminReadViewer) {
    return guardedRead(viewer, () => useravaaRepository.adminReadModels.listUsers());
  },
  getUserDetail(viewer: AdminReadViewer, userId: string) {
    return guardedRead(viewer, () => useravaaRepository.adminReadModels.getUserDetail(userId));
  },
  listExperienceProfiles(viewer: AdminReadViewer) {
    return guardedRead(viewer, () => useravaaRepository.adminReadModels.listExperienceProfiles());
  },
  getExperienceProfileDetail(viewer: AdminReadViewer, profileId: string) {
    return guardedRead(viewer, () => useravaaRepository.adminReadModels.getExperienceProfileDetail(profileId));
  },
  listInsights(viewer: AdminReadViewer) {
    return guardedRead(viewer, () => useravaaRepository.adminReadModels.listInsights());
  },
  getInsightDetail(viewer: AdminReadViewer, insightId: string) {
    return guardedRead(viewer, () => useravaaRepository.adminReadModels.getInsightDetail(insightId));
  },
  listWalletTransactions(viewer: AdminReadViewer) {
    return guardedRead(viewer, () => useravaaRepository.adminReadModels.listWalletTransactions());
  },
  listAttendance(viewer: AdminReadViewer) {
    return guardedRead(viewer, () => useravaaRepository.adminReadModels.listAttendance());
  },
  getAnalyticsSummary(viewer: AdminReadViewer, filters: Partial<AdminAnalyticsFilters> = {}, reader?: PrismaReader) {
    return guardedRead(viewer, () => useravaaRepository.adminReadModels.getAnalyticsSummary(filters, reader));
  },
  async getAuditLog(viewer: AdminReadViewer): Promise<AdminReadModelResult<AdminAuditLogReadModel>> {
    if (!canReadAdminModels(viewer)) {
      return unauthorizedResult<AdminAuditLogReadModel>();
    }

    const result = await useravaaRepository.adminAudit.listRecent();

    if (!result.ok) {
      return repositoryToAdminReadResult(result);
    }

    return {
      ok: true,
      data: {
        implemented: true,
        rows: mapAuditRows(result.data),
        note: "Audit events are read from admin audit persistence."
      }
    };
  },
  async getPaymentAuditLog(viewer: AdminReadViewer, paymentId: string): Promise<AdminReadModelResult<AdminAuditLogReadModel>> {
    if (!canReadAdminModels(viewer)) {
      return unauthorizedResult<AdminAuditLogReadModel>();
    }

    const result = await useravaaRepository.adminAudit.listForPayment(paymentId);

    if (!result.ok) {
      return repositoryToAdminReadResult(result);
    }

    return {
      ok: true,
      data: {
        implemented: true,
        rows: mapAuditRows(result.data),
        note: "Payment review audit events are read from admin audit persistence."
      }
    };
  },
  async getCancellationAuditLog(viewer: AdminReadViewer, cancellationId: string): Promise<AdminReadModelResult<AdminAuditLogReadModel>> {
    if (!canReadAdminModels(viewer)) {
      return unauthorizedResult<AdminAuditLogReadModel>();
    }

    const result = await useravaaRepository.adminAudit.listForCancellation(cancellationId);

    if (!result.ok) {
      return repositoryToAdminReadResult(result);
    }

    return {
      ok: true,
      data: {
        implemented: true,
        rows: mapAuditRows(result.data),
        note: "Cancellation support-review audit events are read from admin audit persistence."
      }
    };
  },
  async getExperienceProfileAuditLog(
    viewer: AdminReadViewer,
    profileId: string
  ): Promise<AdminReadModelResult<AdminAuditLogReadModel>> {
    if (!canReadAdminModels(viewer)) {
      return unauthorizedResult<AdminAuditLogReadModel>();
    }

    const result = await useravaaRepository.adminAudit.listForExperienceProfile(profileId);

    if (!result.ok) {
      return repositoryToAdminReadResult(result);
    }

    return {
      ok: true,
      data: {
        implemented: true,
        rows: mapAuditRows(result.data),
        note: "Experience profile review audit events are read from admin audit persistence."
      }
    };
  },
  async getInsightAuditLog(viewer: AdminReadViewer, insightId: string): Promise<AdminReadModelResult<AdminAuditLogReadModel>> {
    if (!canReadAdminModels(viewer)) {
      return unauthorizedResult<AdminAuditLogReadModel>();
    }

    const result = await useravaaRepository.adminAudit.listForInsight(insightId);

    if (!result.ok) {
      return repositoryToAdminReadResult(result);
    }

    return {
      ok: true,
      data: {
        implemented: true,
        rows: mapAuditRows(result.data),
        note: "Insight moderation audit events are read from admin audit persistence."
      }
    };
  },
  async getPricingRuleAuditLog(viewer: AdminReadViewer, ruleId: string): Promise<AdminReadModelResult<AdminAuditLogReadModel>> {
    if (!canReadAdminModels(viewer)) {
      return unauthorizedResult<AdminAuditLogReadModel>();
    }

    const result = await useravaaRepository.adminAudit.listForPricingRule(ruleId);

    if (!result.ok) {
      return repositoryToAdminReadResult(result);
    }

    return {
      ok: true,
      data: {
        implemented: true,
        rows: mapAuditRows(result.data),
        note: "Pricing rule audit events are read from admin audit persistence."
      }
    };
  },
  async getCategoryAuditLog(viewer: AdminReadViewer, categoryId: string): Promise<AdminReadModelResult<AdminAuditLogReadModel>> {
    if (!canReadAdminModels(viewer)) {
      return unauthorizedResult<AdminAuditLogReadModel>();
    }

    const result = await useravaaRepository.adminAudit.listForCategory(categoryId);

    if (!result.ok) {
      return repositoryToAdminReadResult(result);
    }

    return {
      ok: true,
      data: {
        implemented: true,
        rows: mapAuditRows(result.data),
        note: "Category management audit events are read from admin audit persistence."
      }
    };
  },
  async getContentEntryAuditLog(viewer: AdminReadViewer, contentEntryId: string): Promise<AdminReadModelResult<AdminAuditLogReadModel>> {
    if (!canReadAdminModels(viewer)) {
      return unauthorizedResult<AdminAuditLogReadModel>();
    }

    const result = await useravaaRepository.adminAudit.listForContentEntry(contentEntryId);

    if (!result.ok) {
      return repositoryToAdminReadResult(result);
    }

    return {
      ok: true,
      data: {
        implemented: true,
        rows: mapAuditRows(result.data),
        note: "Content entry audit events are read from admin audit persistence."
      }
    };
  }
} as const;
