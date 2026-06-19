import { JobField, Prisma, type JobField as PrismaJobField } from "@prisma/client";
import { readOnlyRepositoryOperation, type PrismaReader } from "./types";

const activeConversationStatuses = [
  "CREATED",
  "AWAITING_PAYMENT",
  "PAYMENT_PROCESSING",
  "PAYMENT_FAILED",
  "PAYMENT_FINALIZED",
  "AWAITING_TIME_PROPOSAL",
  "TIMES_PROPOSED",
  "NEW_TIME_REQUESTED",
  "CONFIRMED"
] as const;

const pendingAttendanceStatuses = ["PENDING", "SUBMITTED", "FAILED", "NEEDS_REVIEW"] as const;

export type AdminActionQueueItem = {
  id: string;
  kind:
    | "manual_payment_review"
    | "cancellation_support_review"
    | "attendance_review"
    | "provider_time_proposal_waiting"
    | "new_time_request_waiting"
    | "experience_profile_review";
  priority: "urgent" | "high" | "normal";
  href: string;
  relatedEntity: string;
  relatedUsers: string;
  status: string;
  createdAt: Date | null;
};

export type AdminAnalyticsDateRange = "last_7_days" | "last_30_days" | "last_90_days" | "all_time";

export type AdminAnalyticsFilters = {
  dateRange: AdminAnalyticsDateRange;
  category: PrismaJobField | null;
  now?: Date;
};

export type AdminAnalyticsAppliedFilters = {
  dateRange: AdminAnalyticsDateRange;
  category: PrismaJobField | null;
  startedAt: Date | null;
  endedAt: Date;
};

export type AdminAnalyticsCategoryOption = {
  value: PrismaJobField;
  label: string;
  activeProfileCount: number;
};

export type AdminAnalyticsReasonBreakdown = {
  reasonCode: string;
  count: number;
  percentage: number | null;
};

export type AdminAnalyticsStatusCounts = {
  total: number;
  draft?: number;
  pendingReview?: number;
  needsChanges?: number;
  active?: number;
  inactive?: number;
  published?: number;
  hidden?: number;
  archived?: number;
};

export type AdminAnalyticsCategoryBreakdownRow = {
  category: PrismaJobField;
  label: string;
  paidGmvToman: number;
  paidOrderCount: number;
  cancellationCount: number;
  insightCount: number;
  activeExperienceProfileCount: number;
};

export type AdminAnalyticsUnsupportedMetric = {
  id: string;
  label: string;
  reason: string;
};

export type AdminAnalyticsSummary = {
  filters: AdminAnalyticsAppliedFilters;
  categoryOptions: AdminAnalyticsCategoryOption[];
  paidGmvToman: number;
  paidOrderCount: number;
  scheduledPaidSessionCount: number;
  completedPaidSessionCount: number;
  allRequestCount: number;
  acceptedRequestProxyCount: number;
  activatedSeekerCount: number;
  qualifiedSignupProxyCount: number;
  completedConversationCount: number;
  totalRegisteredUsers: number;
  payingCustomers: number;
  customerActivationRate: number | null;
  observedAverageGmvPerPayingCustomerToman: number | null;
  cancellationCount: number;
  cancellationRate: number | null;
  cancellationWalletCreditToman: number;
  supportReviewCancellationCount: number;
  cancellationReasonBreakdown: AdminAnalyticsReasonBreakdown[];
  insightStatusCounts: AdminAnalyticsStatusCounts;
  insightHiddenRate: number | null;
  insightArchivedRate: number | null;
  insightAuthorCount: number;
  insightShareRate: number | null;
  experienceProfileStatusCounts: AdminAnalyticsStatusCounts;
  categoryBreakdown: AdminAnalyticsCategoryBreakdownRow[];
  unsupportedMetrics: AdminAnalyticsUnsupportedMetric[];
};

export type AdminDashboardSummary = {
  manualPaymentsAwaitingReview: number;
  supportReviewCancellations: number;
  pendingAttendance: number;
  completedSessions: number;
  activeConversations: number;
  profilesAwaitingReview: number;
  newTimeRequestsAwaitingProvider: number;
  conversationsAwaitingProviderTimes: number;
  cancellationWalletCreditToman: number;
  paidGmvToman: number;
};

const participantSelect = {
  id: true,
  displayName: true
} as const;

const adminConversationRowSelect = Prisma.validator<Prisma.ConversationRequestSelect>()({
  id: true,
  requesterId: true,
  providerId: true,
  experienceProfileId: true,
  duration: true,
  priceToman: true,
  status: true,
  paymentRequirement: true,
  requestTopic: true,
  providerVisibleAt: true,
  selectedAt: true,
  paymentFinalizedAt: true,
  confirmedAt: true,
  completedAt: true,
  cancelledAt: true,
  createdAt: true,
  updatedAt: true,
  requester: {
    select: participantSelect
  },
  provider: {
    select: participantSelect
  },
  experienceProfile: {
    select: {
      id: true,
      displayName: true,
      roleTitle: true,
      jobField: true,
      orgLevel: true,
      categories: {
        select: {
          category: {
            select: {
              labelFa: true,
              code: true
            }
          }
        }
      }
    }
  },
  selectedTime: {
    select: {
      id: true,
      startsAt: true,
      shamsiDateLabel: true,
      timeLabel: true,
      status: true
    }
  },
  payment: {
    select: {
      id: true,
      method: true,
      requirement: true,
      status: true,
      amountToman: true,
      walletDeductionToman: true,
      gatewayPayableToman: true,
      finalizedAt: true,
      failedAt: true,
      manualReview: {
        select: {
          id: true,
          status: true,
          submittedAt: true,
          reviewedAt: true
        }
      }
    }
  },
  attendanceVerification: {
    select: {
      id: true,
      status: true,
      codeGeneratedAt: true,
      codeExpiresAt: true,
      submittedAt: true,
      submittedByProviderId: true,
      attempts: true,
      verifiedAt: true,
      failedAt: true,
      needsReviewAt: true
    }
  },
  cancellations: {
    select: {
      id: true,
      status: true,
      stage: true,
      reasonCode: true,
      refundAmountToman: true,
      requesterRefundWalletTransactionId: true,
      providerCompensationWalletTransactionId: true,
      createdAt: true
    },
    orderBy: {
      createdAt: "desc"
    },
    take: 3
  },
  newTimeRequests: {
    select: {
      id: true,
      status: true,
      requestedAt: true,
      fulfilledAt: true,
      cancelledAt: true
    },
    orderBy: {
      requestedAt: "desc"
    },
    take: 3
  },
  _count: {
    select: {
      proposedTimes: true,
      timeProposalSets: true,
      walletTransactions: true,
      cancellations: true
    }
  }
});

const adminConversationDetailSelect = Prisma.validator<Prisma.ConversationRequestSelect>()({
  ...adminConversationRowSelect,
  proposedTimes: {
    select: {
      id: true,
      proposalSetId: true,
      version: true,
      startsAt: true,
      shamsiDateLabel: true,
      timeLabel: true,
      status: true,
      selectedAt: true,
      createdAt: true
    },
    orderBy: {
      startsAt: "asc"
    },
    take: 12
  },
  timeProposalSets: {
    select: {
      id: true,
      version: true,
      status: true,
      proposedById: true,
      proposedAt: true,
      supersededAt: true,
      selectedAt: true
    },
    orderBy: {
      proposedAt: "desc"
    },
    take: 5
  },
  walletTransactions: {
    select: {
      id: true,
      type: true,
      status: true,
      settlementStatus: true,
      amountToman: true,
      sourceEntityType: true,
      sourceEntityId: true,
      paymentId: true,
      withdrawalRequestId: true,
      createdAt: true
    },
    orderBy: {
      createdAt: "desc"
    },
    take: 10
  }
});

const adminCancellationSelect = Prisma.validator<Prisma.CancellationSelect>()({
  id: true,
  conversationId: true,
  cancelledByUserId: true,
  cancelledByRole: true,
  status: true,
  stage: true,
  reasonCode: true,
  otherReasonText: true,
  refundRateBps: true,
  refundAmountToman: true,
  refundDestination: true,
  providerGrossCompensationToman: true,
  useravaaFeeRateBps: true,
  useravaaFeeAmountToman: true,
  providerNetCompensationToman: true,
  hoursUntilSession: true,
  isLateRequesterCancellation: true,
  requesterRefundWalletTransactionId: true,
  providerCompensationWalletTransactionId: true,
  supportReviewReason: true,
  reviewedByAdminId: true,
  reviewedAt: true,
  completedAt: true,
  rejectedAt: true,
  createdAt: true,
  updatedAt: true,
  conversation: {
    select: {
      id: true,
      status: true,
      requestTopic: true,
      priceToman: true,
      paymentRequirement: true,
      requester: {
        select: participantSelect
      },
      provider: {
        select: participantSelect
      },
      selectedTime: {
        select: {
          id: true,
          startsAt: true,
          shamsiDateLabel: true,
          timeLabel: true,
          status: true
        }
      },
      payment: {
        select: {
          id: true,
          status: true,
          amountToman: true,
          method: true
        }
      }
    }
  }
});

const adminUserRowSelect = Prisma.validator<Prisma.UserSelect>()({
  id: true,
  role: true,
  displayName: true,
  email: true,
  createdAt: true,
  updatedAt: true,
  profile: {
    select: {
      id: true,
      status: true,
      canOfferExperience: true,
      professionalSummary: true,
      updatedAt: true
    }
  },
  experienceProfile: {
    select: {
      id: true,
      status: true,
      displayName: true,
      roleTitle: true,
      jobField: true,
      freeHelp: true,
      price30Toman: true,
      price60Toman: true,
      successfulConversationCount: true,
      updatedAt: true
    }
  },
  wallet: {
    select: {
      id: true,
      balanceToman: true,
      availablePayoutToman: true,
      pendingPayoutToman: true,
      updatedAt: true
    }
  },
  _count: {
    select: {
      sentConversations: true,
      receivedConversations: true,
      cancellations: true,
      insightAnswers: true
    }
  }
});

const adminUserDetailSelect = Prisma.validator<Prisma.UserSelect>()({
  ...adminUserRowSelect,
  sentConversations: {
    select: {
      id: true,
      status: true,
      priceToman: true,
      createdAt: true
    },
    orderBy: {
      createdAt: "desc"
    },
    take: 10
  },
  receivedConversations: {
    select: {
      id: true,
      status: true,
      priceToman: true,
      createdAt: true
    },
    orderBy: {
      createdAt: "desc"
    },
    take: 10
  },
  insightAnswers: {
    select: {
      id: true,
      status: true,
      submittedAt: true,
      createdAt: true
    },
    orderBy: {
      createdAt: "desc"
    },
    take: 10
  }
});

const adminExperienceProfileRowSelect = Prisma.validator<Prisma.ExperienceProfileSelect>()({
  id: true,
  ownerId: true,
  profileId: true,
  status: true,
  displayName: true,
  roleTitle: true,
  jobField: true,
  orgLevel: true,
  yearsOfExperience: true,
  publicProfessionalSummary: true,
  freeHelp: true,
  price30Toman: true,
  price60Toman: true,
  reviewNote: true,
  successfulConversationCount: true,
  csatAverage: true,
  createdAt: true,
  updatedAt: true,
  owner: {
    select: participantSelect
  },
  categories: {
    select: {
      category: {
        select: {
          labelFa: true,
          code: true
        }
      }
    }
  },
  languages: {
    select: {
      language: {
        select: {
          labelFa: true
        }
      }
    }
  },
  previousCompanies: {
    select: {
      company: {
        select: {
          nameFa: true
        }
      }
    }
  },
  _count: {
    select: {
      conversations: true,
      experienceAnswers: true,
      officialInsights: true
    }
  }
});

const adminExperienceProfileDetailSelect = Prisma.validator<Prisma.ExperienceProfileSelect>()({
  ...adminExperienceProfileRowSelect,
  timelineItems: {
    select: {
      id: true,
      jobTitle: true,
      jobField: true,
      orgLevel: true,
      companyName: true,
      startYear: true,
      startMonth: true,
      endYear: true,
      endMonth: true,
      isCurrent: true,
      sortOrder: true
    },
    orderBy: [
      {
        sortOrder: "asc"
      },
      {
        startYear: "desc"
      }
    ],
    take: 12
  }
});

const adminInsightAnswerSelect = Prisma.validator<Prisma.InsightAnswerSelect>()({
  id: true,
  authorUserId: true,
  renderedQuestion: true,
  answerText: true,
  status: true,
  submittedAt: true,
  approvedAt: true,
  hiddenAt: true,
  createdAt: true,
  updatedAt: true,
  authorUser: {
    select: participantSelect
  },
  experienceProfile: {
    select: {
      id: true,
      displayName: true,
      roleTitle: true
    }
  }
});

const adminInsightRowSelect = Prisma.validator<Prisma.InsightSelect>()({
  id: true,
  slug: true,
  title: true,
  prompt: true,
  body: true,
  status: true,
  authorUserId: true,
  experienceProfileId: true,
  publishedAt: true,
  hiddenAt: true,
  createdAt: true,
  updatedAt: true,
  authorUser: {
    select: participantSelect
  },
  experienceProfile: {
    select: {
      id: true,
      displayName: true,
      roleTitle: true,
      jobField: true,
      categories: {
        select: {
          category: {
            select: {
              labelFa: true,
              code: true
            }
          }
        }
      }
    }
  },
  _count: {
    select: {
      answers: true
    }
  }
});

const adminInsightDetailSelect = Prisma.validator<Prisma.InsightSelect>()({
  ...adminInsightRowSelect,
  answers: {
    select: adminInsightAnswerSelect,
    orderBy: { updatedAt: "desc" },
    take: 30
  }
});

const adminWalletTransactionSelect = Prisma.validator<Prisma.WalletTransactionSelect>()({
  id: true,
  walletId: true,
  type: true,
  status: true,
  settlementStatus: true,
  title: true,
  amountToman: true,
  sourceEntityType: true,
  sourceEntityId: true,
  conversationId: true,
  paymentId: true,
  withdrawalRequestId: true,
  cancelledByRole: true,
  refundRateBps: true,
  refundAmountToman: true,
  createdAt: true,
  updatedAt: true,
  wallet: {
    select: {
      id: true,
      userId: true,
      user: {
        select: participantSelect
      }
    }
  }
});

const adminAttendanceSelect = Prisma.validator<Prisma.AttendanceVerificationSelect>()({
  id: true,
  conversationId: true,
  status: true,
  codeGeneratedAt: true,
  codeExpiresAt: true,
  submittedAt: true,
  submittedByProviderId: true,
  attempts: true,
  verifiedAt: true,
  failedAt: true,
  needsReviewAt: true,
  createdAt: true,
  updatedAt: true,
  conversation: {
    select: {
      id: true,
      status: true,
      requestTopic: true,
      requester: {
        select: participantSelect
      },
      provider: {
        select: participantSelect
      },
      selectedTime: {
        select: {
          id: true,
          startsAt: true,
          shamsiDateLabel: true,
          timeLabel: true,
          status: true
        }
      },
      payment: {
        select: {
          id: true,
          status: true,
          amountToman: true
        }
      }
    }
  }
});

export type AdminConversationRow = Prisma.ConversationRequestGetPayload<{
  select: typeof adminConversationRowSelect;
}>;

export type AdminConversationDetail = Prisma.ConversationRequestGetPayload<{
  select: typeof adminConversationDetailSelect;
}>;

export type AdminCancellationRow = Prisma.CancellationGetPayload<{
  select: typeof adminCancellationSelect;
}>;

export type AdminCancellationDetail = AdminCancellationRow;

export type AdminUserRow = Prisma.UserGetPayload<{
  select: typeof adminUserRowSelect;
}>;

export type AdminUserDetail = Prisma.UserGetPayload<{
  select: typeof adminUserDetailSelect;
}>;

export type AdminExperienceProfileRow = Prisma.ExperienceProfileGetPayload<{
  select: typeof adminExperienceProfileRowSelect;
}>;

export type AdminExperienceProfileDetail = Prisma.ExperienceProfileGetPayload<{
  select: typeof adminExperienceProfileDetailSelect;
}>;

export type AdminInsightRow = Prisma.InsightGetPayload<{
  select: typeof adminInsightRowSelect;
}>;

export type AdminInsightDetail = Prisma.InsightGetPayload<{
  select: typeof adminInsightDetailSelect;
}>;

export type AdminWalletTransactionRow = Prisma.WalletTransactionGetPayload<{
  select: typeof adminWalletTransactionSelect;
}>;

export type AdminAttendanceRow = Prisma.AttendanceVerificationGetPayload<{
  select: typeof adminAttendanceSelect;
}>;

function userSummary(user: { id: string; displayName: string }) {
  return `${user.displayName} (${user.id})`;
}

function topicOrId(topic: string | null, id: string) {
  return topic?.trim() || id;
}

function amountOrZero(value: number | null | undefined) {
  return value ?? 0;
}

function rateOrNull(part: number, whole: number) {
  if (whole <= 0) {
    return null;
  }

  return part / whole;
}

function averageOrNull(total: number, count: number) {
  if (count <= 0) {
    return null;
  }

  return Math.round(total / count);
}

function isPrismaJobField(value: string | null | undefined): value is PrismaJobField {
  return Boolean(value && Object.values(JobField).includes(value as PrismaJobField));
}

function resolveAnalyticsFilters(filters: Partial<AdminAnalyticsFilters> = {}): AdminAnalyticsAppliedFilters {
  const endedAt = filters.now ?? new Date();
  const dateRange = filters.dateRange ?? "last_30_days";
  const ranges: Record<Exclude<AdminAnalyticsDateRange, "all_time">, number> = {
    last_7_days: 7,
    last_30_days: 30,
    last_90_days: 90
  };
  const days = dateRange === "all_time" ? null : ranges[dateRange];
  const startedAt = days
    ? new Date(endedAt.getTime() - days * 24 * 60 * 60 * 1000)
    : null;
  const category = isPrismaJobField(filters.category) ? filters.category : null;

  return {
    dateRange,
    category,
    startedAt,
    endedAt
  };
}

function createdAtRangeWhere(startedAt: Date | null, endedAt: Date) {
  return startedAt
    ? {
        gte: startedAt,
        lte: endedAt
      }
    : {
        lte: endedAt
      };
}

function finalizedAtRangeWhere(startedAt: Date | null, endedAt: Date) {
  return startedAt
    ? {
        gte: startedAt,
        lte: endedAt
      }
    : {
        lte: endedAt
      };
}

function analyticsExperienceProfileWhere(category: PrismaJobField | null): Prisma.ExperienceProfileWhereInput | undefined {
  if (!category) {
    return undefined;
  }

  return {
    OR: [
      { jobField: category },
      {
        categories: {
          some: {
            category: {
              code: category
            }
          }
        }
      }
    ]
  };
}

function analyticsConversationWhere(category: PrismaJobField | null): Prisma.ConversationRequestWhereInput | undefined {
  const experienceProfile = analyticsExperienceProfileWhere(category);

  return experienceProfile ? { experienceProfile } : undefined;
}

function analyticsPaymentWhere(filters: AdminAnalyticsAppliedFilters): Prisma.PaymentWhereInput {
  return {
    status: "PAID",
    finalizedAt: finalizedAtRangeWhere(filters.startedAt, filters.endedAt),
    ...(filters.category ? { conversation: analyticsConversationWhere(filters.category) } : {})
  };
}

function analyticsCancellationWhere(filters: AdminAnalyticsAppliedFilters): Prisma.CancellationWhereInput {
  return {
    createdAt: createdAtRangeWhere(filters.startedAt, filters.endedAt),
    ...(filters.category ? { conversation: analyticsConversationWhere(filters.category) } : {})
  };
}

function analyticsInsightWhere(filters: AdminAnalyticsAppliedFilters): Prisma.InsightWhereInput {
  return {
    createdAt: createdAtRangeWhere(filters.startedAt, filters.endedAt),
    ...(filters.category ? { experienceProfile: analyticsExperienceProfileWhere(filters.category) } : {})
  };
}

function analyticsExperienceProfileCreatedWhere(filters: AdminAnalyticsAppliedFilters): Prisma.ExperienceProfileWhereInput {
  return {
    createdAt: createdAtRangeWhere(filters.startedAt, filters.endedAt),
    ...(filters.category ? analyticsExperienceProfileWhere(filters.category) : {})
  };
}

function countByKey<T extends string>(items: readonly T[]) {
  return items.reduce<Record<T, number>>((counts, item) => {
    counts[item] = (counts[item] ?? 0) + 1;
    return counts;
  }, {} as Record<T, number>);
}

type AnalyticsProfileCategoryShape = {
  jobField: PrismaJobField | null;
  categories?: readonly {
    category: {
      code: PrismaJobField | null;
      labelFa?: string;
    };
  }[];
};

function categoryCodeFromProfile(profile: AnalyticsProfileCategoryShape | null | undefined) {
  return profile?.jobField ?? profile?.categories?.find((item) => item.category.code)?.category.code ?? null;
}

function categoryLabel(code: PrismaJobField, labels: ReadonlyMap<PrismaJobField, string>) {
  return labels.get(code) ?? code;
}

function createCategoryBreakdownRow(
  category: PrismaJobField,
  labels: ReadonlyMap<PrismaJobField, string>
): AdminAnalyticsCategoryBreakdownRow {
  return {
    category,
    label: categoryLabel(category, labels),
    paidGmvToman: 0,
    paidOrderCount: 0,
    cancellationCount: 0,
    insightCount: 0,
    activeExperienceProfileCount: 0
  };
}

function categoryBreakdownRow(
  rows: Map<PrismaJobField, AdminAnalyticsCategoryBreakdownRow>,
  category: PrismaJobField,
  labels: ReadonlyMap<PrismaJobField, string>
) {
  const existing = rows.get(category);

  if (existing) {
    return existing;
  }

  const row = createCategoryBreakdownRow(category, labels);
  rows.set(category, row);
  return row;
}

export const adminReadModelRepository = {
  methods: {
    getDashboard: "read_only_persistent",
    listActionQueue: "read_only_persistent",
    listConversations: "read_only_persistent",
    getConversationDetail: "read_only_persistent",
    listCancellations: "read_only_persistent",
    getCancellationDetail: "read_only_persistent",
    listUsers: "read_only_persistent",
    getUserDetail: "read_only_persistent",
    listExperienceProfiles: "read_only_persistent",
    getExperienceProfileDetail: "read_only_persistent",
    listInsights: "read_only_persistent",
    getInsightDetail: "read_only_persistent",
    listWalletTransactions: "read_only_persistent",
    listAttendance: "read_only_persistent",
    getAnalyticsSummary: "read_only_persistent"
  },
  getDashboard() {
    return readOnlyRepositoryOperation("admin_read_model", "getDashboard", async (db) => {
      const [
        manualPaymentsAwaitingReview,
        supportReviewCancellations,
        pendingAttendance,
        completedSessions,
        activeConversations,
        profilesAwaitingReview,
        newTimeRequestsAwaitingProvider,
        conversationsAwaitingProviderTimes,
        cancellationCreditAggregate,
        paidGmvAggregate
      ] = await Promise.all([
        db.manualPaymentReview.count({ where: { status: { in: ["SUBMITTED", "NEEDS_REVIEW"] } } }),
        db.cancellation.count({ where: { status: "UNDER_SUPPORT_REVIEW" } }),
        db.attendanceVerification.count({ where: { status: { in: [...pendingAttendanceStatuses] } } }),
        db.conversationRequest.count({ where: { status: "COMPLETED" } }),
        db.conversationRequest.count({ where: { status: { in: [...activeConversationStatuses] } } }),
        db.experienceProfile.count({ where: { status: "PENDING_REVIEW" } }),
        db.newTimeRequest.count({ where: { status: "REQUESTED" } }),
        db.conversationRequest.count({ where: { status: "AWAITING_TIME_PROPOSAL" } }),
        db.walletTransaction.aggregate({
          _sum: { amountToman: true },
          where: { type: "CANCELLATION_REFUND_CREDIT", status: "COMPLETED" }
        }),
        db.payment.aggregate({
          _sum: { amountToman: true },
          where: { status: "PAID" }
        })
      ]);

      return {
        manualPaymentsAwaitingReview,
        supportReviewCancellations,
        pendingAttendance,
        completedSessions,
        activeConversations,
        profilesAwaitingReview,
        newTimeRequestsAwaitingProvider,
        conversationsAwaitingProviderTimes,
        cancellationWalletCreditToman: amountOrZero(cancellationCreditAggregate._sum.amountToman),
        paidGmvToman: amountOrZero(paidGmvAggregate._sum.amountToman)
      } satisfies AdminDashboardSummary;
    });
  },
  listActionQueue() {
    return readOnlyRepositoryOperation("admin_read_model", "listActionQueue", async (db) => {
      const [manualPayments, cancellations, attendanceRows, waitingConversations, newTimeRequests, profiles] =
        await Promise.all([
          db.manualPaymentReview.findMany({
            where: { status: { in: ["SUBMITTED", "NEEDS_REVIEW"] } },
            select: {
              id: true,
              status: true,
              submittedAt: true,
              createdAt: true,
              payment: {
                select: {
                  id: true,
                  conversationId: true,
                  conversation: {
                    select: {
                      id: true,
                      requestTopic: true,
                      requester: { select: participantSelect },
                      provider: { select: participantSelect }
                    }
                  }
                }
              }
            },
            orderBy: { submittedAt: "asc" },
            take: 20
          }),
          db.cancellation.findMany({
            where: { status: "UNDER_SUPPORT_REVIEW" },
            select: {
              id: true,
              status: true,
              createdAt: true,
              conversation: {
                select: {
                  id: true,
                  requestTopic: true,
                  requester: { select: participantSelect },
                  provider: { select: participantSelect }
                }
              }
            },
            orderBy: { createdAt: "asc" },
            take: 20
          }),
          db.attendanceVerification.findMany({
            where: { status: { in: [...pendingAttendanceStatuses] } },
            select: {
              id: true,
              status: true,
              submittedAt: true,
              needsReviewAt: true,
              createdAt: true,
              conversation: {
                select: {
                  id: true,
                  requestTopic: true,
                  requester: { select: participantSelect },
                  provider: { select: participantSelect }
                }
              }
            },
            orderBy: { updatedAt: "asc" },
            take: 20
          }),
          db.conversationRequest.findMany({
            where: { status: "AWAITING_TIME_PROPOSAL" },
            select: {
              id: true,
              status: true,
              requestTopic: true,
              providerVisibleAt: true,
              createdAt: true,
              requester: { select: participantSelect },
              provider: { select: participantSelect }
            },
            orderBy: { providerVisibleAt: "asc" },
            take: 20
          }),
          db.newTimeRequest.findMany({
            where: { status: "REQUESTED" },
            select: {
              id: true,
              status: true,
              requestedAt: true,
              conversation: {
                select: {
                  id: true,
                  requestTopic: true,
                  requester: { select: participantSelect },
                  provider: { select: participantSelect }
                }
              }
            },
            orderBy: { requestedAt: "asc" },
            take: 20
          }),
          db.experienceProfile.findMany({
            where: { status: "PENDING_REVIEW" },
            select: {
              id: true,
              status: true,
              displayName: true,
              roleTitle: true,
              updatedAt: true,
              owner: { select: participantSelect }
            },
            orderBy: { updatedAt: "asc" },
            take: 20
          })
        ]);

      return [
        ...manualPayments.map((review): AdminActionQueueItem => ({
          id: `manual-payment:${review.id}`,
          kind: "manual_payment_review",
          priority: "urgent",
          href: `/admin/payments/${review.payment.id}`,
          relatedEntity: topicOrId(review.payment.conversation.requestTopic, review.payment.conversation.id),
          relatedUsers: `${userSummary(review.payment.conversation.requester)} / ${userSummary(review.payment.conversation.provider)}`,
          status: review.status,
          createdAt: review.submittedAt ?? review.createdAt
        })),
        ...cancellations.map((cancellation): AdminActionQueueItem => ({
          id: `cancellation:${cancellation.id}`,
          kind: "cancellation_support_review",
          priority: "high",
          href: `/admin/cancellations/${cancellation.id}`,
          relatedEntity: topicOrId(cancellation.conversation.requestTopic, cancellation.conversation.id),
          relatedUsers: `${userSummary(cancellation.conversation.requester)} / ${userSummary(cancellation.conversation.provider)}`,
          status: cancellation.status,
          createdAt: cancellation.createdAt
        })),
        ...attendanceRows.map((attendance): AdminActionQueueItem => ({
          id: `attendance:${attendance.id}`,
          kind: "attendance_review",
          priority: attendance.status === "NEEDS_REVIEW" ? "high" : "normal",
          href: `/admin/conversations/${attendance.conversation.id}`,
          relatedEntity: topicOrId(attendance.conversation.requestTopic, attendance.conversation.id),
          relatedUsers: `${userSummary(attendance.conversation.requester)} / ${userSummary(attendance.conversation.provider)}`,
          status: attendance.status,
          createdAt: attendance.needsReviewAt ?? attendance.submittedAt ?? attendance.createdAt
        })),
        ...waitingConversations.map((conversation): AdminActionQueueItem => ({
          id: `provider-times:${conversation.id}`,
          kind: "provider_time_proposal_waiting",
          priority: "normal",
          href: `/admin/conversations/${conversation.id}`,
          relatedEntity: topicOrId(conversation.requestTopic, conversation.id),
          relatedUsers: `${userSummary(conversation.requester)} / ${userSummary(conversation.provider)}`,
          status: conversation.status,
          createdAt: conversation.providerVisibleAt ?? conversation.createdAt
        })),
        ...newTimeRequests.map((request): AdminActionQueueItem => ({
          id: `new-time:${request.id}`,
          kind: "new_time_request_waiting",
          priority: "normal",
          href: `/admin/conversations/${request.conversation.id}`,
          relatedEntity: topicOrId(request.conversation.requestTopic, request.conversation.id),
          relatedUsers: `${userSummary(request.conversation.requester)} / ${userSummary(request.conversation.provider)}`,
          status: request.status,
          createdAt: request.requestedAt
        })),
        ...profiles.map((profile): AdminActionQueueItem => ({
          id: `experience-profile:${profile.id}`,
          kind: "experience_profile_review",
          priority: "normal",
          href: `/admin/experience-profiles/${profile.id}`,
          relatedEntity: `${profile.displayName} - ${profile.roleTitle}`,
          relatedUsers: userSummary(profile.owner),
          status: profile.status,
          createdAt: profile.updatedAt
        }))
      ].sort((a, b) => (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0));
    });
  },
  listConversations() {
    return readOnlyRepositoryOperation("admin_read_model", "listConversations", (db) =>
      db.conversationRequest.findMany({
        select: adminConversationRowSelect,
        orderBy: { updatedAt: "desc" },
        take: 100
      })
    );
  },
  getConversationDetail(conversationId: string) {
    return readOnlyRepositoryOperation("admin_read_model", "getConversationDetail", (db) =>
      db.conversationRequest.findUnique({
        where: { id: conversationId },
        select: adminConversationDetailSelect
      })
    );
  },
  listCancellations() {
    return readOnlyRepositoryOperation("admin_read_model", "listCancellations", (db) =>
      db.cancellation.findMany({
        select: adminCancellationSelect,
        orderBy: { createdAt: "desc" },
        take: 100
      })
    );
  },
  getCancellationDetail(cancellationId: string) {
    return readOnlyRepositoryOperation("admin_read_model", "getCancellationDetail", (db) =>
      db.cancellation.findUnique({
        where: { id: cancellationId },
        select: adminCancellationSelect
      })
    );
  },
  listUsers() {
    return readOnlyRepositoryOperation("admin_read_model", "listUsers", (db) =>
      db.user.findMany({
        select: adminUserRowSelect,
        orderBy: { updatedAt: "desc" },
        take: 100
      })
    );
  },
  getUserDetail(userId: string) {
    return readOnlyRepositoryOperation("admin_read_model", "getUserDetail", (db) =>
      db.user.findUnique({
        where: { id: userId },
        select: adminUserDetailSelect
      })
    );
  },
  listExperienceProfiles() {
    return readOnlyRepositoryOperation("admin_read_model", "listExperienceProfiles", (db) =>
      db.experienceProfile.findMany({
        select: adminExperienceProfileRowSelect,
        orderBy: { updatedAt: "desc" },
        take: 100
      })
    );
  },
  getExperienceProfileDetail(profileId: string) {
    return readOnlyRepositoryOperation("admin_read_model", "getExperienceProfileDetail", (db) =>
      db.experienceProfile.findUnique({
        where: { id: profileId },
        select: adminExperienceProfileDetailSelect
      })
    );
  },
  listInsights() {
    return readOnlyRepositoryOperation("admin_read_model", "listInsights", (db) =>
      db.insight.findMany({
        select: adminInsightRowSelect,
        orderBy: { updatedAt: "desc" },
        take: 100
      })
    );
  },
  getInsightDetail(insightId: string) {
    return readOnlyRepositoryOperation("admin_read_model", "getInsightDetail", (db) =>
      db.insight.findUnique({
        where: { id: insightId },
        select: adminInsightDetailSelect
      })
    );
  },
  listWalletTransactions() {
    return readOnlyRepositoryOperation("admin_read_model", "listWalletTransactions", (db) =>
      db.walletTransaction.findMany({
        select: adminWalletTransactionSelect,
        orderBy: { createdAt: "desc" },
        take: 100
      })
    );
  },
  listAttendance() {
    return readOnlyRepositoryOperation("admin_read_model", "listAttendance", (db) =>
      db.attendanceVerification.findMany({
        select: adminAttendanceSelect,
        orderBy: { updatedAt: "desc" },
        take: 100
      })
    );
  },
  async getAnalyticsSummary(filters: Partial<AdminAnalyticsFilters> = {}, reader?: PrismaReader) {
    const readAnalytics = async (db: PrismaReader) => {
      const appliedFilters = resolveAnalyticsFilters(filters);
      const paymentWhere = analyticsPaymentWhere(appliedFilters);
      const requestWhere: Prisma.ConversationRequestWhereInput = {
        createdAt: createdAtRangeWhere(appliedFilters.startedAt, appliedFilters.endedAt),
        ...(appliedFilters.category ? analyticsConversationWhere(appliedFilters.category) : {})
      };
      const acceptedRequestProxyWhere: Prisma.ConversationRequestWhereInput = {
        ...requestWhere,
        OR: [
          { providerVisibleAt: { not: null } },
          { providerRespondedAt: { not: null } },
          { timesProposedAt: { not: null } },
          { selectedTimeId: { not: null } },
          { confirmedAt: { not: null } },
          { completedAt: { not: null } },
          {
            status: {
              in: ["TIMES_PROPOSED", "NEW_TIME_REQUESTED", "CONFIRMED", "COMPLETED"]
            }
          }
        ]
      };
      const completedConversationWhere: Prisma.ConversationRequestWhereInput = {
        status: "COMPLETED",
        completedAt: createdAtRangeWhere(appliedFilters.startedAt, appliedFilters.endedAt),
        ...(appliedFilters.category ? analyticsConversationWhere(appliedFilters.category) : {})
      };
      const paidConversationWhere: Prisma.ConversationRequestWhereInput = {
        payment: {
          is: {
            status: "PAID"
          }
        },
        ...(appliedFilters.category ? analyticsConversationWhere(appliedFilters.category) : {})
      };
      const scheduledPaidSessionWhere: Prisma.ConversationRequestWhereInput = {
        ...paidConversationWhere,
        OR: [
          { selectedAt: createdAtRangeWhere(appliedFilters.startedAt, appliedFilters.endedAt) },
          { confirmedAt: createdAtRangeWhere(appliedFilters.startedAt, appliedFilters.endedAt) }
        ]
      };
      const completedPaidSessionWhere: Prisma.ConversationRequestWhereInput = {
        ...paidConversationWhere,
        status: "COMPLETED",
        completedAt: createdAtRangeWhere(appliedFilters.startedAt, appliedFilters.endedAt)
      };
      const cancellationWhere = analyticsCancellationWhere(appliedFilters);
      const insightWhere = analyticsInsightWhere(appliedFilters);
      const experienceProfileWhere = analyticsExperienceProfileCreatedWhere(appliedFilters);
      const walletCreditWhere: Prisma.WalletTransactionWhereInput = {
        type: "CANCELLATION_REFUND_CREDIT",
        status: "COMPLETED",
        createdAt: createdAtRangeWhere(appliedFilters.startedAt, appliedFilters.endedAt),
        ...(appliedFilters.category ? { conversation: analyticsConversationWhere(appliedFilters.category) } : {})
      };
      const [
        paidPaymentRows,
        cancellationCreditAggregate,
        totalRegisteredUsers,
        allRequestCount,
        acceptedRequestProxyCount,
        activatedSeekerRows,
        scheduledPaidSessionCount,
        completedPaidSessionCount,
        completedConversationCount,
        cancellationRows,
        supportReviewCancellationCount,
        insightRows,
        experienceProfileRows,
        categoryOptionProfiles,
        categoryLabelRows
      ] = await Promise.all([
        db.payment.findMany({
          where: paymentWhere,
          select: {
            payerId: true,
            amountToman: true,
            conversation: {
              select: {
                status: true,
                selectedTimeId: true,
                confirmedAt: true,
                completedAt: true,
                experienceProfile: {
                  select: {
                    jobField: true,
                    categories: {
                      select: {
                        category: {
                          select: {
                            code: true,
                            labelFa: true
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }),
        db.walletTransaction.aggregate({
          _sum: { amountToman: true },
          where: walletCreditWhere
        }),
        db.user.count({
          where: {
            createdAt: createdAtRangeWhere(appliedFilters.startedAt, appliedFilters.endedAt)
          }
        }),
        db.conversationRequest.count({ where: requestWhere }),
        db.conversationRequest.count({ where: acceptedRequestProxyWhere }),
        db.conversationRequest.findMany({
          where: requestWhere,
          distinct: ["requesterId"],
          select: {
            requesterId: true
          }
        }),
        db.conversationRequest.count({ where: scheduledPaidSessionWhere }),
        db.conversationRequest.count({ where: completedPaidSessionWhere }),
        db.conversationRequest.count({ where: completedConversationWhere }),
        db.cancellation.findMany({
          where: cancellationWhere,
          select: {
            reasonCode: true,
            conversation: {
              select: {
                experienceProfile: {
                  select: {
                    jobField: true,
                    categories: {
                      select: {
                        category: {
                          select: {
                            code: true,
                            labelFa: true
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }),
        db.cancellation.count({
          where: {
            ...cancellationWhere,
            status: "UNDER_SUPPORT_REVIEW"
          }
        }),
        db.insight.findMany({
          where: insightWhere,
          select: {
            status: true,
            authorUserId: true,
            experienceProfile: {
              select: {
                jobField: true,
                categories: {
                  select: {
                    category: {
                      select: {
                        code: true,
                        labelFa: true
                      }
                    }
                  }
                }
              }
            }
          }
        }),
        db.experienceProfile.findMany({
          where: experienceProfileWhere,
          select: {
            status: true,
            jobField: true,
            categories: {
              select: {
                category: {
                  select: {
                    code: true,
                    labelFa: true
                  }
                }
              }
            }
          }
        }),
        db.experienceProfile.findMany({
          select: {
            status: true,
            jobField: true,
            categories: {
              select: {
                category: {
                  select: {
                    code: true,
                    labelFa: true
                  }
                }
              }
            }
          }
        }),
        db.jobCategory.findMany({
          where: {
            isActive: true,
            archivedAt: null,
            code: {
              not: null
            }
          },
          select: {
            code: true,
            labelFa: true
          }
        })
      ]);

      const categoryLabels = new Map<PrismaJobField, string>();
      categoryLabelRows.forEach((row) => {
        if (row.code) {
          categoryLabels.set(row.code, row.labelFa);
        }
      });

      const categoryOptionCounts = new Map<PrismaJobField, number>();
      categoryOptionProfiles.forEach((profile) => {
        const code = categoryCodeFromProfile(profile);

        if (code) {
          categoryOptionCounts.set(code, (categoryOptionCounts.get(code) ?? 0) + (profile.status === "ACTIVE" ? 1 : 0));
          profile.categories?.forEach((item) => {
            if (item.category.code) {
              categoryLabels.set(item.category.code, item.category.labelFa);
            }
          });
        }
      });

      const categoryBreakdown = new Map<PrismaJobField, AdminAnalyticsCategoryBreakdownRow>();
      const paidGmvToman = paidPaymentRows.reduce((sum, payment) => sum + payment.amountToman, 0);
      const payerIds = new Set(paidPaymentRows.map((payment) => payment.payerId));
      paidPaymentRows.forEach((payment) => {
        const code = categoryCodeFromProfile(payment.conversation.experienceProfile);

        if (!code) {
          return;
        }

        const row = categoryBreakdownRow(categoryBreakdown, code, categoryLabels);
        row.paidOrderCount += 1;
        row.paidGmvToman += payment.amountToman;
      });

      cancellationRows.forEach((cancellation) => {
        const code = categoryCodeFromProfile(cancellation.conversation.experienceProfile);

        if (!code) {
          return;
        }

        categoryBreakdownRow(categoryBreakdown, code, categoryLabels).cancellationCount += 1;
      });

      insightRows.forEach((insight) => {
        const code = categoryCodeFromProfile(insight.experienceProfile);

        if (!code) {
          return;
        }

        categoryBreakdownRow(categoryBreakdown, code, categoryLabels).insightCount += 1;
      });

      experienceProfileRows.forEach((profile) => {
        const code = categoryCodeFromProfile(profile);

        if (!code || profile.status !== "ACTIVE") {
          return;
        }

        categoryBreakdownRow(categoryBreakdown, code, categoryLabels).activeExperienceProfileCount += 1;
      });

      const cancellationReasonCounts = cancellationRows.reduce<Map<string, number>>((counts, cancellation) => {
        counts.set(cancellation.reasonCode, (counts.get(cancellation.reasonCode) ?? 0) + 1);
        return counts;
      }, new Map());
      const insightStatuses = countByKey(insightRows.map((insight) => insight.status));
      const profileStatuses = countByKey(experienceProfileRows.map((profile) => profile.status));
      const insightAuthorIds = new Set(insightRows.map((insight) => insight.authorUserId).filter((id): id is string => Boolean(id)));
      const cancellationCount = cancellationRows.length;
      const totalInsightCount = insightRows.length;
      const totalProfileCount = experienceProfileRows.length;

      return {
        filters: appliedFilters,
        categoryOptions: Array.from(categoryOptionCounts, ([value, activeProfileCount]) => ({
          value,
          label: categoryLabel(value, categoryLabels),
          activeProfileCount
        })).sort((a, b) => a.label.localeCompare(b.label, "fa")),
        paidGmvToman,
        paidOrderCount: paidPaymentRows.length,
        scheduledPaidSessionCount,
        completedPaidSessionCount,
        allRequestCount,
        acceptedRequestProxyCount,
        activatedSeekerCount: activatedSeekerRows.length,
        qualifiedSignupProxyCount: totalRegisteredUsers,
        completedConversationCount,
        totalRegisteredUsers,
        payingCustomers: payerIds.size,
        customerActivationRate: rateOrNull(payerIds.size, totalRegisteredUsers),
        observedAverageGmvPerPayingCustomerToman: averageOrNull(paidGmvToman, payerIds.size),
        cancellationCount,
        cancellationRate: rateOrNull(cancellationCount, paidPaymentRows.length),
        cancellationWalletCreditToman: amountOrZero(cancellationCreditAggregate._sum.amountToman),
        supportReviewCancellationCount,
        cancellationReasonBreakdown: Array.from(cancellationReasonCounts, ([reasonCode, count]) => ({
          reasonCode,
          count,
          percentage: rateOrNull(count, cancellationCount)
        })).sort((a, b) => b.count - a.count),
        insightStatusCounts: {
          total: totalInsightCount,
          draft: insightStatuses.DRAFT ?? 0,
          published: insightStatuses.PUBLISHED ?? 0,
          hidden: insightStatuses.HIDDEN ?? 0,
          archived: insightStatuses.ARCHIVED ?? 0
        },
        insightHiddenRate: rateOrNull(insightStatuses.HIDDEN ?? 0, totalInsightCount),
        insightArchivedRate: rateOrNull(insightStatuses.ARCHIVED ?? 0, totalInsightCount),
        insightAuthorCount: insightAuthorIds.size,
        insightShareRate: rateOrNull(insightAuthorIds.size, totalRegisteredUsers),
        experienceProfileStatusCounts: {
          total: totalProfileCount,
          draft: profileStatuses.DRAFT ?? 0,
          pendingReview: profileStatuses.PENDING_REVIEW ?? 0,
          needsChanges: profileStatuses.NEEDS_CHANGES ?? 0,
          active: profileStatuses.ACTIVE ?? 0,
          inactive: profileStatuses.INACTIVE ?? 0
        },
        categoryBreakdown: Array.from(categoryBreakdown.values()).sort((a, b) => b.paidGmvToman - a.paidGmvToman || a.label.localeCompare(b.label, "fa")),
        unsupportedMetrics: [
          {
            id: "nmv",
            label: "NMV",
            reason: "پیاده‌سازی نشده — مدل کمیسیون/تسویه برای محاسبه خالص بازار وجود ندارد."
          },
          {
            id: "nmv-gmv",
            label: "NMV / GMV",
            reason: "پیاده‌سازی نشده — NMV قابل محاسبه نیست."
          },
          {
            id: "clv",
            label: "CLV",
            reason: "پیاده‌سازی نشده — مدل نگهداشت/کوهورت و تاریخچه درآمد کافی لازم است."
          },
          {
            id: "insight-edits",
            label: "بینش‌های ویرایش‌شده",
            reason: "پیاده‌سازی نشده — متادیتای ویرایش بینش در مدل فعلی ذخیره نمی‌شود."
          },
          {
            id: "completed-profile-readiness",
            label: "پروفایل کامل‌شده",
            reason: "پیاده‌سازی نشده — امتیاز آمادگی/تکمیل پایدار در schema وجود ندارد."
          }
        ]
      } satisfies AdminAnalyticsSummary;
    };

    if (reader) {
      return {
        ok: true,
        area: "admin_read_model",
        method: "getAnalyticsSummary",
        classification: "read_only_persistent",
        data: await readAnalytics(reader)
      } as const;
    }

    return readOnlyRepositoryOperation("admin_read_model", "getAnalyticsSummary", readAnalytics);
  }
} as const;
