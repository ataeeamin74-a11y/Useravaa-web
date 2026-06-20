import type { Prisma } from "@prisma/client";
import type { UseravaaTransactionClient } from "../db/transaction";
import { readOnlyRepositoryOperation } from "./types";

export type AdminAuditAction =
  | "PAYMENT_MANUAL_APPROVED"
  | "PAYMENT_MANUAL_REJECTED"
  | "CANCELLATION_SUPPORT_CREDIT_APPROVED"
  | "CANCELLATION_SUPPORT_CREDIT_REJECTED"
  | "EXPERIENCE_PROFILE_APPROVED"
  | "EXPERIENCE_PROFILE_CHANGES_REQUESTED"
  | "EXPERIENCE_PROFILE_HIDDEN"
  | "INSIGHT_HIDDEN"
  | "INSIGHT_RESTORED"
  | "INSIGHT_DELETED"
  | "INSIGHT_ANSWER_HIDDEN"
  | "PRICING_RULE_CREATED"
  | "PRICING_RULE_UPDATED"
  | "PRICING_RULE_DEACTIVATED"
  | "CATEGORY_CREATED"
  | "CATEGORY_UPDATED"
  | "CATEGORY_ARCHIVED"
  | "CATEGORY_RESTORED"
  | "CONTENT_ENTRY_CREATED"
  | "CONTENT_ENTRY_UPDATED"
  | "CONTENT_ENTRY_ARCHIVED"
  | "CONTENT_ENTRY_RESTORED"
  | "SUPPORT_TICKET_CREATED"
  | "SUPPORT_TICKET_UPDATED"
  | "SUPPORT_TICKET_ASSIGNED"
  | "SUPPORT_TICKET_STATUS_CHANGED"
  | "SUPPORT_TICKET_PRIORITY_CHANGED"
  | "SUPPORT_TICKET_CATEGORY_CHANGED"
  | "SUPPORT_TICKET_NOTE_ADDED"
  | "SUPPORT_TICKET_RESOLVED"
  | "SUPPORT_TICKET_REOPENED"
  | "SUPPORT_TICKET_ARCHIVED";

export type AdminPaymentAuditEventInput = {
  actorAdminUserId: string;
  actorRole: "ADMIN" | "SUPPORT";
  action: AdminAuditAction;
  paymentId: string;
  conversationId: string;
  beforeStatus: string;
  afterStatus: string;
  reason?: string;
  note?: string;
  metadata?: Prisma.InputJsonValue;
  now: Date;
};

export type AdminCancellationAuditEventInput = {
  actorAdminUserId: string;
  actorRole: "ADMIN" | "SUPPORT";
  action: Extract<
    AdminAuditAction,
    "CANCELLATION_SUPPORT_CREDIT_APPROVED" | "CANCELLATION_SUPPORT_CREDIT_REJECTED"
  >;
  cancellationId: string;
  conversationId: string;
  paymentId?: string | null;
  beforeStatus: string;
  afterStatus: string;
  reason?: string;
  note?: string;
  metadata?: Prisma.InputJsonValue;
  now: Date;
};

export type AdminExperienceProfileAuditEventInput = {
  actorAdminUserId: string;
  actorRole: "ADMIN" | "SUPPORT";
  action: Extract<
    AdminAuditAction,
    "EXPERIENCE_PROFILE_APPROVED" | "EXPERIENCE_PROFILE_CHANGES_REQUESTED" | "EXPERIENCE_PROFILE_HIDDEN"
  >;
  profileId: string;
  ownerUserId: string;
  beforeStatus: string;
  afterStatus: string;
  reason?: string;
  note?: string;
  metadata?: Prisma.InputJsonValue;
  now: Date;
};

export type AdminInsightAuditEventInput = {
  actorAdminUserId: string;
  actorRole: "ADMIN" | "SUPPORT";
  action: Extract<AdminAuditAction, "INSIGHT_HIDDEN" | "INSIGHT_RESTORED" | "INSIGHT_DELETED">;
  insightId: string;
  authorUserId?: string | null;
  beforeStatus: string;
  afterStatus: string;
  reason?: string;
  note?: string;
  metadata?: Prisma.InputJsonValue;
  now: Date;
};

export type AdminInsightAnswerAuditEventInput = {
  actorAdminUserId: string;
  actorRole: "ADMIN" | "SUPPORT";
  action: Extract<AdminAuditAction, "INSIGHT_ANSWER_HIDDEN">;
  answerId: string;
  insightId?: string | null;
  authorUserId: string;
  beforeStatus: string;
  afterStatus: string;
  reason?: string;
  note?: string;
  metadata?: Prisma.InputJsonValue;
  now: Date;
};

export type AdminPricingRuleAuditEventInput = {
  actorAdminUserId: string;
  actorRole: "ADMIN";
  action: Extract<AdminAuditAction, "PRICING_RULE_CREATED" | "PRICING_RULE_UPDATED" | "PRICING_RULE_DEACTIVATED">;
  pricingRuleId: string;
  beforeStatus?: string | null;
  afterStatus: string;
  reason?: string;
  note?: string;
  metadata?: Prisma.InputJsonValue;
  now: Date;
};

export type AdminCategoryAuditEventInput = {
  actorAdminUserId: string;
  actorRole: "ADMIN";
  action: Extract<AdminAuditAction, "CATEGORY_CREATED" | "CATEGORY_UPDATED" | "CATEGORY_ARCHIVED" | "CATEGORY_RESTORED">;
  categoryId: string;
  beforeStatus?: string | null;
  afterStatus: string;
  reason?: string;
  note?: string;
  metadata?: Prisma.InputJsonValue;
  now: Date;
};

export type AdminContentEntryAuditEventInput = {
  actorAdminUserId: string;
  actorRole: "ADMIN";
  action: Extract<
    AdminAuditAction,
    "CONTENT_ENTRY_CREATED" | "CONTENT_ENTRY_UPDATED" | "CONTENT_ENTRY_ARCHIVED" | "CONTENT_ENTRY_RESTORED"
  >;
  contentEntryId: string;
  beforeStatus?: string | null;
  afterStatus: string;
  reason?: string;
  note?: string;
  metadata?: Prisma.InputJsonValue;
  now: Date;
};

export type AdminSupportTicketAuditEventInput = {
  actorAdminUserId: string;
  actorRole: "ADMIN" | "SUPPORT";
  action: Extract<
    AdminAuditAction,
    | "SUPPORT_TICKET_CREATED"
    | "SUPPORT_TICKET_UPDATED"
    | "SUPPORT_TICKET_ASSIGNED"
    | "SUPPORT_TICKET_STATUS_CHANGED"
    | "SUPPORT_TICKET_PRIORITY_CHANGED"
    | "SUPPORT_TICKET_CATEGORY_CHANGED"
    | "SUPPORT_TICKET_NOTE_ADDED"
    | "SUPPORT_TICKET_RESOLVED"
    | "SUPPORT_TICKET_REOPENED"
    | "SUPPORT_TICKET_ARCHIVED"
  >;
  ticketId: string;
  beforeStatus?: string | null;
  afterStatus: string;
  relatedConversationId?: string | null;
  relatedPaymentId?: string | null;
  reason?: string;
  note?: string;
  metadata?: Prisma.InputJsonValue;
  now: Date;
};

const adminAuditEventSelect = {
  id: true,
  actorAdminUserId: true,
  actorRole: true,
  action: true,
  entityType: true,
  entityId: true,
  relatedConversationId: true,
  relatedPaymentId: true,
  beforeStatus: true,
  afterStatus: true,
  reason: true,
  note: true,
  metadata: true,
  createdAt: true,
  actorAdminUser: {
    select: {
      id: true,
      displayName: true,
      role: true
    }
  }
} as const;

export const adminAuditRepository = {
  methods: {
    createPaymentReviewEvent: "database_persistent",
    createCancellationSupportReviewEvent: "database_persistent",
    createExperienceProfileReviewEvent: "database_persistent",
    createInsightModerationEvent: "database_persistent",
    createInsightAnswerModerationEvent: "database_persistent",
    createPricingRuleEvent: "database_persistent",
    createCategoryEvent: "database_persistent",
    createContentEntryEvent: "database_persistent",
    createSupportTicketEvent: "database_persistent",
    listForPayment: "read_only_persistent",
    listForCancellation: "read_only_persistent",
    listForExperienceProfile: "read_only_persistent",
    listForInsight: "read_only_persistent",
    listForInsightAnswer: "read_only_persistent",
    listForPricingRule: "read_only_persistent",
    listForCategory: "read_only_persistent",
    listForContentEntry: "read_only_persistent",
    listForSupportTicket: "read_only_persistent",
    listRecent: "read_only_persistent"
  },
  async createPaymentReviewEvent(input: AdminPaymentAuditEventInput, tx: UseravaaTransactionClient) {
    return tx.adminAuditEvent.create({
      data: {
        actorAdminUserId: input.actorAdminUserId,
        actorRole: input.actorRole,
        action: input.action,
        entityType: "PAYMENT",
        entityId: input.paymentId,
        relatedConversationId: input.conversationId,
        relatedPaymentId: input.paymentId,
        beforeStatus: input.beforeStatus,
        afterStatus: input.afterStatus,
        reason: input.reason ?? null,
        note: input.note ?? null,
        metadata: input.metadata,
        createdAt: input.now
      },
      select: adminAuditEventSelect
    });
  },
  async createCancellationSupportReviewEvent(input: AdminCancellationAuditEventInput, tx: UseravaaTransactionClient) {
    return tx.adminAuditEvent.create({
      data: {
        actorAdminUserId: input.actorAdminUserId,
        actorRole: input.actorRole,
        action: input.action,
        entityType: "CANCELLATION",
        entityId: input.cancellationId,
        relatedConversationId: input.conversationId,
        relatedPaymentId: input.paymentId ?? null,
        beforeStatus: input.beforeStatus,
        afterStatus: input.afterStatus,
        reason: input.reason ?? null,
        note: input.note ?? null,
        metadata: input.metadata,
        createdAt: input.now
      },
      select: adminAuditEventSelect
    });
  },
  async createExperienceProfileReviewEvent(input: AdminExperienceProfileAuditEventInput, tx: UseravaaTransactionClient) {
    return tx.adminAuditEvent.create({
      data: {
        actorAdminUserId: input.actorAdminUserId,
        actorRole: input.actorRole,
        action: input.action,
        entityType: "EXPERIENCE_PROFILE",
        entityId: input.profileId,
        relatedConversationId: null,
        relatedPaymentId: null,
        beforeStatus: input.beforeStatus,
        afterStatus: input.afterStatus,
        reason: input.reason ?? null,
        note: input.note ?? null,
        metadata: {
          ownerUserId: input.ownerUserId,
          ...(typeof input.metadata === "object" && input.metadata !== null && !Array.isArray(input.metadata) ? input.metadata : {})
        },
        createdAt: input.now
      },
      select: adminAuditEventSelect
    });
  },
  async createInsightModerationEvent(input: AdminInsightAuditEventInput, tx: UseravaaTransactionClient) {
    return tx.adminAuditEvent.create({
      data: {
        actorAdminUserId: input.actorAdminUserId,
        actorRole: input.actorRole,
        action: input.action,
        entityType: "INSIGHT",
        entityId: input.insightId,
        relatedConversationId: null,
        relatedPaymentId: null,
        beforeStatus: input.beforeStatus,
        afterStatus: input.afterStatus,
        reason: input.reason ?? null,
        note: input.note ?? null,
        metadata: {
          authorUserId: input.authorUserId ?? null,
          ...(typeof input.metadata === "object" && input.metadata !== null && !Array.isArray(input.metadata) ? input.metadata : {})
        },
        createdAt: input.now
      },
      select: adminAuditEventSelect
    });
  },
  async createInsightAnswerModerationEvent(input: AdminInsightAnswerAuditEventInput, tx: UseravaaTransactionClient) {
    return tx.adminAuditEvent.create({
      data: {
        actorAdminUserId: input.actorAdminUserId,
        actorRole: input.actorRole,
        action: input.action,
        entityType: "INSIGHT_ANSWER",
        entityId: input.answerId,
        relatedConversationId: null,
        relatedPaymentId: null,
        beforeStatus: input.beforeStatus,
        afterStatus: input.afterStatus,
        reason: input.reason ?? null,
        note: input.note ?? null,
        metadata: {
          insightId: input.insightId ?? null,
          authorUserId: input.authorUserId,
          ...(typeof input.metadata === "object" && input.metadata !== null && !Array.isArray(input.metadata) ? input.metadata : {})
        },
        createdAt: input.now
      },
      select: adminAuditEventSelect
    });
  },
  async createPricingRuleEvent(input: AdminPricingRuleAuditEventInput, tx: UseravaaTransactionClient) {
    return tx.adminAuditEvent.create({
      data: {
        actorAdminUserId: input.actorAdminUserId,
        actorRole: input.actorRole,
        action: input.action,
        entityType: "PRICING_RULE",
        entityId: input.pricingRuleId,
        relatedConversationId: null,
        relatedPaymentId: null,
        beforeStatus: input.beforeStatus ?? null,
        afterStatus: input.afterStatus,
        reason: input.reason ?? null,
        note: input.note ?? null,
        metadata: input.metadata,
        createdAt: input.now
      },
      select: adminAuditEventSelect
    });
  },
  async createCategoryEvent(input: AdminCategoryAuditEventInput, tx: UseravaaTransactionClient) {
    return tx.adminAuditEvent.create({
      data: {
        actorAdminUserId: input.actorAdminUserId,
        actorRole: input.actorRole,
        action: input.action,
        entityType: "JOB_CATEGORY",
        entityId: input.categoryId,
        relatedConversationId: null,
        relatedPaymentId: null,
        beforeStatus: input.beforeStatus ?? null,
        afterStatus: input.afterStatus,
        reason: input.reason ?? null,
        note: input.note ?? null,
        metadata: input.metadata,
        createdAt: input.now
      },
      select: adminAuditEventSelect
    });
  },
  async createContentEntryEvent(input: AdminContentEntryAuditEventInput, tx: UseravaaTransactionClient) {
    return tx.adminAuditEvent.create({
      data: {
        actorAdminUserId: input.actorAdminUserId,
        actorRole: input.actorRole,
        action: input.action,
        entityType: "CONTENT_ENTRY",
        entityId: input.contentEntryId,
        relatedConversationId: null,
        relatedPaymentId: null,
        beforeStatus: input.beforeStatus ?? null,
        afterStatus: input.afterStatus,
        reason: input.reason ?? null,
        note: input.note ?? null,
        metadata: input.metadata,
        createdAt: input.now
      },
      select: adminAuditEventSelect
    });
  },
  async createSupportTicketEvent(input: AdminSupportTicketAuditEventInput, tx: UseravaaTransactionClient) {
    return tx.adminAuditEvent.create({
      data: {
        actorAdminUserId: input.actorAdminUserId,
        actorRole: input.actorRole,
        action: input.action,
        entityType: "SUPPORT_TICKET",
        entityId: input.ticketId,
        relatedConversationId: input.relatedConversationId ?? null,
        relatedPaymentId: input.relatedPaymentId ?? null,
        beforeStatus: input.beforeStatus ?? null,
        afterStatus: input.afterStatus,
        reason: input.reason ?? null,
        note: input.note ?? null,
        metadata: input.metadata,
        createdAt: input.now
      },
      select: adminAuditEventSelect
    });
  },
  listForPayment(paymentId: string) {
    return readOnlyRepositoryOperation("admin_audit", "listForPayment", (db) =>
      db.adminAuditEvent.findMany({
        where: { relatedPaymentId: paymentId },
        select: adminAuditEventSelect,
        orderBy: { createdAt: "desc" },
        take: 20
      })
    );
  },
  listForCancellation(cancellationId: string) {
    return readOnlyRepositoryOperation("admin_audit", "listForCancellation", (db) =>
      db.adminAuditEvent.findMany({
        where: {
          entityType: "CANCELLATION",
          entityId: cancellationId
        },
        select: adminAuditEventSelect,
        orderBy: { createdAt: "desc" },
        take: 20
      })
    );
  },
  listForExperienceProfile(profileId: string) {
    return readOnlyRepositoryOperation("admin_audit", "listForExperienceProfile", (db) =>
      db.adminAuditEvent.findMany({
        where: {
          entityType: "EXPERIENCE_PROFILE",
          entityId: profileId
        },
        select: adminAuditEventSelect,
        orderBy: { createdAt: "desc" },
        take: 20
      })
    );
  },
  listForInsight(insightId: string) {
    return readOnlyRepositoryOperation("admin_audit", "listForInsight", (db) =>
      db.adminAuditEvent.findMany({
        where: {
          OR: [
            {
              entityType: "INSIGHT",
              entityId: insightId
            },
            {
              entityType: "INSIGHT_ANSWER",
              metadata: {
                path: ["insightId"],
                equals: insightId
              }
            }
          ]
        },
        select: adminAuditEventSelect,
        orderBy: { createdAt: "desc" },
        take: 30
      })
    );
  },
  listForInsightAnswer(answerId: string) {
    return readOnlyRepositoryOperation("admin_audit", "listForInsightAnswer", (db) =>
      db.adminAuditEvent.findMany({
        where: {
          entityType: "INSIGHT_ANSWER",
          entityId: answerId
        },
        select: adminAuditEventSelect,
        orderBy: { createdAt: "desc" },
        take: 20
      })
    );
  },
  listForPricingRule(ruleId: string) {
    return readOnlyRepositoryOperation("admin_audit", "listForPricingRule", (db) =>
      db.adminAuditEvent.findMany({
        where: {
          entityType: "PRICING_RULE",
          entityId: ruleId
        },
        select: adminAuditEventSelect,
        orderBy: { createdAt: "desc" },
        take: 30
      })
    );
  },
  listForCategory(categoryId: string) {
    return readOnlyRepositoryOperation("admin_audit", "listForCategory", (db) =>
      db.adminAuditEvent.findMany({
        where: {
          entityType: "JOB_CATEGORY",
          entityId: categoryId
        },
        select: adminAuditEventSelect,
        orderBy: { createdAt: "desc" },
        take: 30
      })
    );
  },
  listForContentEntry(contentEntryId: string) {
    return readOnlyRepositoryOperation("admin_audit", "listForContentEntry", (db) =>
      db.adminAuditEvent.findMany({
        where: {
          entityType: "CONTENT_ENTRY",
          entityId: contentEntryId
        },
        select: adminAuditEventSelect,
        orderBy: { createdAt: "desc" },
        take: 30
      })
    );
  },
  listForSupportTicket(ticketId: string) {
    return readOnlyRepositoryOperation("admin_audit", "listForSupportTicket", (db) =>
      db.adminAuditEvent.findMany({
        where: {
          entityType: "SUPPORT_TICKET",
          entityId: ticketId
        },
        select: adminAuditEventSelect,
        orderBy: { createdAt: "desc" },
        take: 40
      })
    );
  },
  listRecent(limit = 100) {
    return readOnlyRepositoryOperation("admin_audit", "listRecent", (db) =>
      db.adminAuditEvent.findMany({
        select: adminAuditEventSelect,
        orderBy: { createdAt: "desc" },
        take: limit
      })
    );
  }
} as const;

export type AdminAuditEventRecord = Awaited<ReturnType<typeof adminAuditRepository.createPaymentReviewEvent>>;
