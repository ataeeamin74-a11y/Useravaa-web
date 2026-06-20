import { z } from "zod";
import {
  INSIGHT_ANSWER_MAX_LENGTH,
  INSIGHT_AUDIENCE_INTENT_CODES,
  MANUAL_PAYMENT_RECEIPT_MIME_TYPES,
  MAX_MANUAL_PAYMENT_RECEIPT_BYTES,
  PROFESSIONAL_SUMMARY_MAX_LENGTH,
  USER_MOTIVATION_CODES,
  USER_MOTIVATION_OTHER_TEXT_MAX_LENGTH
} from "./constants";

const trimmedString = (maxLength: number) => z.string().trim().min(1).max(maxLength);
const adminPricingJobFields = [
  "PRODUCT_UX",
  "GRAPHIC_BRAND_IDENTITY",
  "SOFTWARE_ENGINEERING",
  "DATA_AI",
  "MARKETING_BRAND",
  "BUSINESS_ANALYSIS_DEVELOPMENT",
  "OPERATIONS",
  "CUSTOMER_EXPERIENCE",
  "CUSTOMER_SUPPORT",
  "SALES_COMMERCE",
  "STRATEGY_BUSINESS_MODEL",
  "FINANCE_LEGAL_INVESTMENT",
  "HR_ORG_CULTURE",
  "MANAGEMENT_LEADERSHIP_ENTREPRENEURSHIP"
] as const;
const adminPricingExperienceLevels = [
  "INTERN",
  "SPECIALIST",
  "SENIOR_SPECIALIST",
  "MIDDLE_MANAGER",
  "SENIOR_MANAGER",
  "VP",
  "BUSINESS_MANAGER"
] as const;
const tomanPriceSchema = z.number().int().min(0).max(1_000_000_000);
const commissionBpsSchema = z.number().int().min(0).max(10_000);
const pricingEffectiveDateSchema = z.coerce.date();
const adminCategorySlugSchema = z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).min(2).max(80);
const adminCategorySortOrderSchema = z.number().int().min(0).max(10_000);
const adminContentEntryTypes = [
  "SYSTEM_COPY",
  "PAGE_BLOCK",
  "FAQ",
  "HELP_TEXT",
  "EMPTY_STATE",
  "ERROR_MESSAGE",
  "CTA",
  "ADMIN_COPY",
  "NOTIFICATION_TEMPLATE"
] as const;
const adminContentEditableStatuses = ["DRAFT", "PUBLISHED", "HIDDEN"] as const;
const adminContentNamespaceSchema = z.string().trim().regex(/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/).min(2).max(100);
const adminContentKeySchema = z.string().trim().regex(/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/).min(2).max(140);
const adminContentLocaleSchema = z.string().trim().regex(/^[a-z]{2}(?:-[A-Z]{2})?$/).default("fa");
const adminSupportTicketEditableStatuses = [
  "NEW",
  "OPEN",
  "IN_PROGRESS",
  "WAITING_FOR_USER",
  "WAITING_FOR_PROVIDER",
  "ESCALATED",
  "RESOLVED"
] as const;
const adminSupportTicketPriorities = ["LOW", "NORMAL", "HIGH", "URGENT"] as const;
const adminSupportTicketCategories = [
  "CONVERSATION",
  "PAYMENT",
  "CANCELLATION_REFUND_WALLET",
  "PROFILE_EXPERIENCE_CREATOR",
  "INSIGHT_CONTENT",
  "ACCOUNT_AUTH",
  "PRICING_CATEGORY",
  "TECHNICAL_ISSUE",
  "TRUST_SAFETY",
  "GENERAL_QUESTION"
] as const;
const adminSupportTicketSources = [
  "ADMIN_CREATED",
  "USER_REPORTED",
  "SYSTEM_FLAGGED",
  "PAYMENT_REVIEW",
  "CONVERSATION_FLOW",
  "PROFILE_REVIEW",
  "INSIGHT_REPORT",
  "MANUAL"
] as const;
const adminSupportRelatedEntityTypes = [
  "USER",
  "CONVERSATION",
  "PAYMENT",
  "PROFILE",
  "INSIGHT",
  "WALLET_TRANSACTION",
  "CONTENT_ENTRY",
  "NONE"
] as const;
const adminSupportNoteTypes = ["INTERNAL", "PUBLIC_DRAFT"] as const;
const supportOptionalIdSchema = z.string().trim().max(160).nullable().optional();

export const userMotivationCodeSchema = z.enum(USER_MOTIVATION_CODES);
export const insightAudienceIntentSchema = z.enum(INSIGHT_AUDIENCE_INTENT_CODES);

export const profileUpdateSchema = z
  .object({
    displayName: trimmedString(80).optional(),
    professionalSummary: z.string().trim().max(PROFESSIONAL_SUMMARY_MAX_LENGTH).optional(),
    userMotivations: z.array(userMotivationCodeSchema).max(3).optional(),
    userMotivationOtherText: z.string().trim().max(USER_MOTIVATION_OTHER_TEXT_MAX_LENGTH).optional(),
    canOfferExperience: z.boolean().optional()
  })
  .refine(
    (value) => !value.userMotivations?.includes("OTHER") || Boolean(value.userMotivationOtherText?.trim()),
    {
      path: ["userMotivationOtherText"],
      message: "Other motivation text is required when OTHER is selected."
    }
  );

export const requestCreationSchema = z
  .object({
    experienceProfileId: trimmedString(120),
    durationMinutes: z.union([z.literal(30), z.literal(60)]),
    requestTopic: trimmedString(120),
    requestNote: trimmedString(300),
    paymentRequirement: z.enum(["PAYMENT_REQUIRED", "FREE_NOT_REQUIRED"]),
    paymentMethod: z.enum(["ONLINE", "CARD_TO_CARD", "FREE"]),
    quotedPriceToman: z.number().int().min(0)
  })
  .strict()
  .superRefine((value, context) => {
    if (value.paymentRequirement === "FREE_NOT_REQUIRED") {
      if (value.paymentMethod !== "FREE") {
        context.addIssue({
          code: "custom",
          path: ["paymentMethod"],
          message: "Free requests must use the FREE payment method."
        });
      }

      if (value.quotedPriceToman !== 0) {
        context.addIssue({
          code: "custom",
          path: ["quotedPriceToman"],
          message: "Free requests must have a zero quoted amount."
        });
      }
    }

    if (value.paymentRequirement === "PAYMENT_REQUIRED") {
      if (value.paymentMethod === "FREE") {
        context.addIssue({
          code: "custom",
          path: ["paymentMethod"],
          message: "Paid requests cannot use the FREE payment method."
        });
      }

      if (value.quotedPriceToman <= 0) {
        context.addIssue({
          code: "custom",
          path: ["quotedPriceToman"],
          message: "Paid requests must have a positive quoted amount."
        });
      }
    }
  });

const manualReceiptSchema = z.object({
  fileName: trimmedString(180),
  mimeType: z.enum(MANUAL_PAYMENT_RECEIPT_MIME_TYPES),
  sizeBytes: z.number().int().positive().max(MAX_MANUAL_PAYMENT_RECEIPT_BYTES)
}).strict();

export const manualPaymentSubmissionSchema = z
  .object({
    referenceNumber: z.string().trim().regex(/^[0-9A-Za-z-]{4,64}$/).optional(),
    receipt: manualReceiptSchema.optional()
  })
  .strict()
  .refine((value) => Boolean(value.referenceNumber || value.receipt), {
    message: "A reference number or receipt is required.",
    path: ["referenceNumber"]
  });

export const freePaymentFinalizationSchema = z.object({}).strict();

const proposedTimeOptionSchema = z
  .object({
    startsAt: z.string().datetime({ offset: true }),
    shamsiDateLabel: trimmedString(80),
    timeLabel: trimmedString(40)
  })
  .strict();

export const proposedTimesSubmissionSchema = z
  .object({
    version: z.number().int().positive().optional(),
    timeOptions: z.array(proposedTimeOptionSchema).length(3)
  })
  .strict()
  .superRefine((value, context) => {
    const seen = new Set<string>();

    value.timeOptions.forEach((option, index) => {
      if (seen.has(option.startsAt)) {
        context.addIssue({
          code: "custom",
          path: ["timeOptions", index, "startsAt"],
          message: "Proposed times must be unique."
        });
      }

      seen.add(option.startsAt);
    });
  });

export const newTimeRequestSchema = z
  .object({
    note: z.string().trim().max(500).optional()
  })
  .strict();

export const timeSelectionSchema = z
  .object({
    proposedTimeId: trimmedString(120),
    proposalSetId: trimmedString(120).optional()
  })
  .strict();

export const attendanceSubmitCodeSchema = z
  .object({
    code: z.string().trim().min(1).max(20)
  })
  .strict();

export const cancellationRequestSchema = z
  .object({
    reasonCode: trimmedString(80),
    otherReasonText: z.string().trim().max(500).optional()
  })
  .strict();

export const walletWithdrawalRequestSchema = z.object({
  amountToman: z.number().int().positive(),
  destinationAccountOwner: trimmedString(120),
  destinationIban: z.string().trim().regex(/^IR[0-9]{24}$/)
});

export const notificationReadMutationSchema = z.object({
  notificationId: trimmedString(120)
});

export const insightAnswerSubmissionSchema = z.object({
  insightId: trimmedString(120).optional(),
  experienceQuestionId: trimmedString(120).optional(),
  renderedQuestion: trimmedString(240),
  answerText: z.string().trim().min(1).max(INSIGHT_ANSWER_MAX_LENGTH),
  audienceIntents: z.array(insightAudienceIntentSchema).min(1).max(4),
  responsibilityAccepted: z.literal(true)
});

export const adminPaymentApprovalSchema = z
  .object({
    adminNote: z.string().trim().max(500).optional()
  })
  .strict();

export const adminPaymentRejectionSchema = z
  .object({
    rejectionReason: trimmedString(500),
    adminNote: z.string().trim().max(500).optional()
  })
  .strict();

export const adminCancellationCreditApprovalSchema = z
  .object({
    creditAmountToman: z.number().int().positive().optional(),
    reviewNote: z.string().trim().max(500).optional()
  })
  .strict();

export const adminCancellationCreditRejectionSchema = z
  .object({
    rejectionReason: trimmedString(500),
    reviewNote: z.string().trim().max(500).optional()
  })
  .strict();

export const adminExperienceProfileApprovalSchema = z
  .object({
    reviewNote: z.string().trim().max(500).optional()
  })
  .strict();

export const adminExperienceProfileRequestChangesSchema = z
  .object({
    reviewReason: trimmedString(500),
    reviewNote: z.string().trim().max(500).optional()
  })
  .strict();

export const adminExperienceProfileHideSchema = z
  .object({
    reviewReason: trimmedString(500),
    reviewNote: z.string().trim().max(500).optional()
  })
  .strict();

export const adminInsightHideSchema = z
  .object({
    reasonCode: trimmedString(120),
    reviewNote: z.string().trim().max(500).optional()
  })
  .strict();

export const adminInsightRestoreSchema = z
  .object({
    reviewNote: z.string().trim().max(500).optional()
  })
  .strict();

export const adminInsightDeleteSchema = z
  .object({
    reasonCode: trimmedString(120),
    reviewNote: z.string().trim().max(500).optional()
  })
  .strict();

export const adminInsightAnswerHideSchema = z
  .object({
    reasonCode: trimmedString(120),
    reviewNote: z.string().trim().max(500).optional()
  })
  .strict();

export const adminAnalyticsFilterSchema = z
  .object({
    range: z.enum(["last_7_days", "last_30_days", "last_90_days", "all_time"]).default("last_30_days"),
    category: z
      .string()
      .trim()
      .regex(/^[A-Z_]{2,80}$/)
      .optional()
  })
  .strict();

function pricingRangeIsValid(value: {
  minPriceToman?: number;
  maxPriceToman?: number;
  suggestedPriceToman?: number;
}) {
  if (
    value.minPriceToman === undefined ||
    value.maxPriceToman === undefined ||
    value.suggestedPriceToman === undefined
  ) {
    return true;
  }

  return (
    value.maxPriceToman >= value.minPriceToman &&
    value.suggestedPriceToman >= value.minPriceToman &&
    value.suggestedPriceToman <= value.maxPriceToman
  );
}

function pricingEffectiveDatesAreValid(value: { effectiveFrom?: Date; effectiveTo?: Date | null }) {
  if (!value.effectiveFrom || !value.effectiveTo) {
    return true;
  }

  return value.effectiveTo.getTime() > value.effectiveFrom.getTime();
}

export const adminPricingRuleCreateSchema = z
  .object({
    title: trimmedString(120),
    jobFieldCode: z.enum(adminPricingJobFields).nullable().optional(),
    experienceLevel: z.enum(adminPricingExperienceLevels).nullable().optional(),
    sessionDurationMinutes: z.union([z.literal(30), z.literal(60)]).nullable().optional(),
    minPriceToman: tomanPriceSchema,
    maxPriceToman: tomanPriceSchema,
    suggestedPriceToman: tomanPriceSchema,
    commissionRateBps: commissionBpsSchema.default(1500),
    freeSessionCommissionRateBps: z.literal(0).default(0),
    allowFreeSession: z.boolean().default(true),
    effectiveFrom: pricingEffectiveDateSchema.optional(),
    effectiveTo: pricingEffectiveDateSchema.nullable().optional(),
    internalNote: z.string().trim().max(800).optional()
  })
  .strict()
  .refine(pricingRangeIsValid, {
    path: ["suggestedPriceToman"],
    message: "Suggested price must be between min and max price."
  })
  .refine(pricingEffectiveDatesAreValid, {
    path: ["effectiveTo"],
    message: "Effective end date must be after effective start date."
  });

export const adminPricingRuleUpdateSchema = z
  .object({
    title: trimmedString(120).optional(),
    jobFieldCode: z.enum(adminPricingJobFields).nullable().optional(),
    experienceLevel: z.enum(adminPricingExperienceLevels).nullable().optional(),
    sessionDurationMinutes: z.union([z.literal(30), z.literal(60)]).nullable().optional(),
    minPriceToman: tomanPriceSchema.optional(),
    maxPriceToman: tomanPriceSchema.optional(),
    suggestedPriceToman: tomanPriceSchema.optional(),
    commissionRateBps: commissionBpsSchema.optional(),
    freeSessionCommissionRateBps: z.literal(0).optional(),
    allowFreeSession: z.boolean().optional(),
    effectiveFrom: pricingEffectiveDateSchema.optional(),
    effectiveTo: pricingEffectiveDateSchema.nullable().optional(),
    internalNote: z.string().trim().max(800).optional()
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one pricing field must be provided."
  })
  .refine(pricingRangeIsValid, {
    path: ["suggestedPriceToman"],
    message: "Suggested price must be between min and max price when all price fields are provided."
  })
  .refine(pricingEffectiveDatesAreValid, {
    path: ["effectiveTo"],
    message: "Effective end date must be after effective start date."
  });

export const adminPricingRuleDeactivateSchema = z
  .object({
    reason: trimmedString(500),
    internalNote: z.string().trim().max(800).optional()
  })
  .strict();

export const adminCategoryCreateSchema = z
  .object({
    slug: adminCategorySlugSchema,
    titleFa: trimmedString(120),
    titleEn: z.string().trim().max(120).optional(),
    descriptionFa: z.string().trim().max(800).optional(),
    parentId: z.string().trim().max(120).nullable().optional(),
    sortOrder: adminCategorySortOrderSchema.default(0),
    isActive: z.boolean().default(true),
    showInDiscovery: z.boolean().default(true),
    showInInsights: z.boolean().default(true),
    showInPricing: z.boolean().default(true),
    jobFieldCode: z.enum(adminPricingJobFields).nullable().optional()
  })
  .strict();

export const adminCategoryUpdateSchema = z
  .object({
    slug: adminCategorySlugSchema.optional(),
    titleFa: trimmedString(120).optional(),
    titleEn: z.string().trim().max(120).nullable().optional(),
    descriptionFa: z.string().trim().max(800).nullable().optional(),
    parentId: z.string().trim().max(120).nullable().optional(),
    sortOrder: adminCategorySortOrderSchema.optional(),
    isActive: z.boolean().optional(),
    showInDiscovery: z.boolean().optional(),
    showInInsights: z.boolean().optional(),
    showInPricing: z.boolean().optional(),
    jobFieldCode: z.enum(adminPricingJobFields).nullable().optional()
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one category field must be provided."
  });

export const adminCategoryArchiveSchema = z
  .object({
    reason: trimmedString(500),
    internalNote: z.string().trim().max(800).optional()
  })
  .strict();

export const adminCategoryRestoreSchema = z
  .object({
    internalNote: z.string().trim().max(800).optional()
  })
  .strict();

export const adminContentEntryCreateSchema = z
  .object({
    key: adminContentKeySchema,
    namespace: adminContentNamespaceSchema,
    locale: adminContentLocaleSchema,
    title: trimmedString(180),
    body: trimmedString(10_000),
    shortText: z.string().trim().max(500).optional(),
    description: z.string().trim().max(1_000).optional(),
    contentType: z.enum(adminContentEntryTypes),
    status: z.enum(adminContentEditableStatuses).default("DRAFT"),
    isEditable: z.boolean().default(true)
  })
  .strict();

export const adminContentEntryUpdateSchema = z
  .object({
    title: trimmedString(180).optional(),
    body: trimmedString(10_000).optional(),
    shortText: z.string().trim().max(500).nullable().optional(),
    description: z.string().trim().max(1_000).nullable().optional(),
    contentType: z.enum(adminContentEntryTypes).optional(),
    status: z.enum(adminContentEditableStatuses).optional(),
    isEditable: z.boolean().optional()
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one content field must be provided."
  });

export const adminContentEntryArchiveSchema = z
  .object({
    reason: trimmedString(500),
    internalNote: z.string().trim().max(800).optional()
  })
  .strict();

export const adminContentEntryRestoreSchema = z
  .object({
    internalNote: z.string().trim().max(800).optional()
  })
  .strict();

export const adminSupportTicketCreateSchema = z
  .object({
    subject: trimmedString(180),
    description: trimmedString(4_000),
    priority: z.enum(adminSupportTicketPriorities).default("NORMAL"),
    category: z.enum(adminSupportTicketCategories).default("GENERAL_QUESTION"),
    subcategory: z.string().trim().max(120).nullable().optional(),
    source: z.enum(adminSupportTicketSources).default("ADMIN_CREATED"),
    requesterUserId: supportOptionalIdSchema,
    assigneeAdminId: supportOptionalIdSchema,
    relatedEntityType: z.enum(adminSupportRelatedEntityTypes).nullable().optional(),
    relatedEntityId: supportOptionalIdSchema
  })
  .strict();

export const adminSupportTicketUpdateSchema = z
  .object({
    subject: trimmedString(180).optional(),
    description: trimmedString(4_000).optional(),
    status: z.enum(adminSupportTicketEditableStatuses).optional(),
    priority: z.enum(adminSupportTicketPriorities).optional(),
    category: z.enum(adminSupportTicketCategories).optional(),
    subcategory: z.string().trim().max(120).nullable().optional(),
    source: z.enum(adminSupportTicketSources).optional(),
    requesterUserId: supportOptionalIdSchema,
    assigneeAdminId: supportOptionalIdSchema,
    relatedEntityType: z.enum(adminSupportRelatedEntityTypes).nullable().optional(),
    relatedEntityId: supportOptionalIdSchema
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one support ticket field must be provided."
  });

export const adminSupportTicketAssignSchema = z
  .object({
    assigneeAdminId: z.string().trim().max(160).nullable()
  })
  .strict();

export const adminSupportTicketNoteCreateSchema = z
  .object({
    body: trimmedString(2_000),
    noteType: z.enum(adminSupportNoteTypes).default("INTERNAL")
  })
  .strict();

export const adminSupportTicketResolveSchema = z
  .object({
    resolutionSummary: trimmedString(1_000),
    resolutionReason: trimmedString(300),
    internalNote: z.string().trim().max(800).optional()
  })
  .strict();

export const adminSupportTicketReopenSchema = z
  .object({
    reason: trimmedString(500),
    internalNote: z.string().trim().max(800).optional()
  })
  .strict();

export const adminSupportTicketArchiveSchema = z
  .object({
    reason: trimmedString(500),
    internalNote: z.string().trim().max(800).optional()
  })
  .strict();

export const backendValidationSchemas = {
  profileUpdateSchema,
  requestCreationSchema,
  manualPaymentSubmissionSchema,
  freePaymentFinalizationSchema,
  proposedTimesSubmissionSchema,
  newTimeRequestSchema,
  timeSelectionSchema,
  attendanceSubmitCodeSchema,
  cancellationRequestSchema,
  walletWithdrawalRequestSchema,
  notificationReadMutationSchema,
  insightAnswerSubmissionSchema,
  adminPaymentApprovalSchema,
  adminPaymentRejectionSchema,
  adminCancellationCreditApprovalSchema,
  adminCancellationCreditRejectionSchema,
  adminExperienceProfileApprovalSchema,
  adminExperienceProfileRequestChangesSchema,
  adminExperienceProfileHideSchema,
  adminInsightHideSchema,
  adminInsightRestoreSchema,
  adminInsightDeleteSchema,
  adminInsightAnswerHideSchema,
  adminAnalyticsFilterSchema,
  adminPricingRuleCreateSchema,
  adminPricingRuleUpdateSchema,
  adminPricingRuleDeactivateSchema,
  adminCategoryCreateSchema,
  adminCategoryUpdateSchema,
  adminCategoryArchiveSchema,
  adminCategoryRestoreSchema,
  adminContentEntryCreateSchema,
  adminContentEntryUpdateSchema,
  adminContentEntryArchiveSchema,
  adminContentEntryRestoreSchema,
  adminSupportTicketCreateSchema,
  adminSupportTicketUpdateSchema,
  adminSupportTicketAssignSchema,
  adminSupportTicketNoteCreateSchema,
  adminSupportTicketResolveSchema,
  adminSupportTicketReopenSchema,
  adminSupportTicketArchiveSchema
} as const;
