import {
  conversations,
  getAttendanceVerificationStatus,
  getConversationById,
  getConversationPrice,
  getManualPaymentReviewItems,
  getManualPaymentStatusLabel,
  getPaymentStatus,
  getRequestStatus,
  type AttendanceVerificationStatus,
  type ConversationFixture,
  type ConversationRequestStatus,
  type ManualPaymentStatus,
  type PaymentStatus,
  type RequestStatus
} from "@/features/v51/data/conversations";
import { publishedInsights } from "@/features/v51/data/experience-discovery";
import { getProfileById, profiles, toman, type ExperienceProfileFixture } from "@/features/v51/data/profiles";
import { initialWalletFixture, signedToman, walletTypeLabels, type WalletTransaction } from "@/features/v51/data/wallet";
import type { AdminKpiTreeNode } from "@/lib/backend/admin-kpi-tree";
import { formatFaNumber } from "@/lib/fa-format";
import { adminHrefIsKnown } from "./navigation";

export type AdminDataSource = "backend_repository" | "local_demo" | "placeholder";

export type AdminMetric = {
  id: string;
  label: string;
  value: string;
  helper: string;
  href?: string;
  source: AdminDataSource;
};

export type AdminActionPriority = "فوری" | "بالا" | "معمولی";

export type AdminActionItem = {
  id: string;
  actionType: string;
  priority: AdminActionPriority;
  relatedEntity: string;
  relatedUsers: string;
  status: string;
  createdAt: string;
  href: string;
  ctaLabel: string;
  source: AdminDataSource;
};

export type AdminPaymentQueueItem = {
  id: string;
  paymentId: string;
  conversationId: string;
  requestTopic: string;
  requesterSummary: string;
  providerSummary: string;
  amountLabel: string;
  methodLabel: string;
  paymentStatusLabel: string;
  manualReviewStatusLabel: string;
  conversationStatusLabel: string;
  providerVisibilityLabel: string;
  submittedAt: string;
  referenceSummary: string;
  receiptSummary: string;
  source: AdminDataSource;
  actionsAvailable: boolean;
  auditItems?: readonly AdminAuditLogItem[];
};

export type AdminConversationListItem = {
  id: string;
  title: string;
  requesterSummary: string;
  providerSummary: string;
  requestStatusLabel: string;
  paymentStatusLabel: string;
  attendanceStatusLabel: string;
  cancellationStatusLabel: string;
  createdAt: string;
  href: string;
  source: AdminDataSource;
};

export type AdminCancellationItem = {
  id: string;
  conversationId: string;
  title: string;
  requesterSummary: string;
  providerSummary: string;
  reason: string;
  stage: string;
  supportStatus: string;
  supportReviewReason: string;
  creditAmountLabel: string;
  eligibleCreditAmountLabel: string;
  eligibleCreditAmountToman: number;
  paymentAmountLabel: string;
  paymentStatusLabel: string;
  conversationStatusLabel: string;
  selectedSession: string;
  actionsAvailable: boolean;
  auditItems?: readonly AdminAuditLogItem[];
  walletTransactionHref?: string;
  createdAt: string;
  href: string;
  source: AdminDataSource;
};

export type AdminUserItem = {
  id: string;
  displayName: string;
  roleLabel: string;
  profileCompletion: string;
  accountStatus: string;
  experienceProfileStatus: string;
  conversationsCount: string;
  href: string;
  source: AdminDataSource;
};

export type AdminExperienceProfileItem = {
  id: string;
  displayName: string;
  roleLabel: string;
  categories: string;
  pricing: string;
  visibilityStatus: string;
  reviewStatus: string;
  readinessScore: string;
  href: string;
  source: AdminDataSource;
};

export type AdminExperienceProfileDetailItem = AdminExperienceProfileItem & {
  ownerSummary: string;
  ownerHref: string;
  professionalSummary: string;
  jobFieldLabel: string;
  orgLevelLabel: string;
  yearsOfExperienceLabel: string;
  freeHelpLabel: string;
  price30Label: string;
  price60Label: string;
  reviewNote: string;
  relatedConversationsCount: string;
  experienceAnswersCount: string;
  officialInsightsCount: string;
  createdAt: string;
  updatedAt: string;
  actionsAvailable: {
    approve: boolean;
    requestChanges: boolean;
    hide: boolean;
  };
  auditItems?: readonly AdminAuditLogItem[];
};

export type AdminInsightItem = {
  id: string;
  slug: string;
  title: string;
  promptSummary: string;
  authorSummary: string;
  authorHref?: string;
  profileSummary: string;
  categorySummary: string;
  publicationStatus: string;
  moderationStatus: string;
  answerCount: string;
  createdAt: string;
  updatedAt: string;
  href: string;
  source: AdminDataSource;
};

export type AdminInsightAnswerItem = {
  id: string;
  questionSummary: string;
  answerSummary: string;
  authorSummary: string;
  profileSummary: string;
  statusLabel: string;
  submittedAt: string;
  actionsAvailable: {
    hide: boolean;
  };
};

export type AdminInsightDetailItem = AdminInsightItem & {
  bodySummary: string;
  publishedAt: string;
  hiddenAt: string;
  actionsAvailable: {
    hide: boolean;
    restore: boolean;
    delete: boolean;
  };
  answers: readonly AdminInsightAnswerItem[];
  auditItems?: readonly AdminAuditLogItem[];
};

export type AdminWalletLedgerItem = {
  id: string;
  typeLabel: string;
  title: string;
  amountLabel: string;
  statusLabel: string;
  sourceConversationHref?: string;
  paymentHref?: string;
  userHref: string;
  createdAt: string;
  source: AdminDataSource;
};

export type AdminDetailField = {
  label: string;
  value: string;
  href?: string;
};

export type AdminDetailSection = {
  title: string;
  items: readonly AdminDetailField[];
};

export type AdminDetailAction = {
  label: string;
  href: string;
};

export type AdminReadDetail = {
  title: string;
  description: string;
  sourceNote: string;
  source: AdminDataSource;
  idLabel: string;
  id: string;
  sections: readonly AdminDetailSection[];
  actions: readonly AdminDetailAction[];
};

export type AdminAttendanceItem = {
  id: string;
  conversationId: string;
  title: string;
  requesterSummary: string;
  providerSummary: string;
  selectedSession: string;
  attendanceStatusLabel: string;
  attemptsLabel: string;
  submittedAt: string;
  verifiedAt: string;
  requiresReview: boolean;
  href: string;
  source: AdminDataSource;
};

export type AdminAnalyticsItem = {
  id: string;
  label: string;
  value: string;
  helper: string;
  source: AdminDataSource;
};

export type AdminAnalyticsFilterOption = {
  label: string;
  value: string;
  href: string;
  active: boolean;
};

export type AdminAnalyticsBreakdownRow = {
  id: string;
  label: string;
  value: string;
  helper: string;
  source: AdminDataSource;
};

export type AdminAnalyticsBreakdownSection = {
  id: string;
  title: string;
  description: string;
  rows: readonly AdminAnalyticsBreakdownRow[];
};

export type AdminAnalyticsUnsupportedMetric = {
  id: string;
  label: string;
  reason: string;
};

export type AdminAnalyticsData = {
  activeDateRangeLabel: string;
  activeCategoryLabel: string;
  dateRangeOptions: readonly AdminAnalyticsFilterOption[];
  categoryOptions: readonly AdminAnalyticsFilterOption[];
  metrics: readonly AdminAnalyticsItem[];
  kpiTree: readonly AdminKpiTreeNode[];
  breakdownSections: readonly AdminAnalyticsBreakdownSection[];
  unsupportedMetrics: readonly AdminAnalyticsUnsupportedMetric[];
  dataQualityNotes: readonly string[];
  sourceNote: string;
  source: AdminDataSource;
};

export type AdminPricingCategoryOption = {
  label: string;
  value: string;
};

export type AdminCategoryOption = {
  label: string;
  value: string;
};

export type AdminCategoryItem = {
  id: string;
  slug: string;
  titleFa: string;
  titleEn: string;
  descriptionFa: string;
  parentLabel: string;
  parentId: string;
  sortOrder: number;
  jobFieldCode: string;
  jobFieldLabel: string;
  activeLabel: string;
  isActive: boolean;
  isArchived: boolean;
  showInDiscovery: boolean;
  showInInsights: boolean;
  showInPricing: boolean;
  visibilitySummary: string;
  profileCountLabel: string;
  profileCount: number;
  insightCountLabel: string;
  insightCount: number;
  pricingRuleCountLabel: string;
  pricingRuleCount: number;
  childCountLabel: string;
  childCount: number;
  createdBySummary: string;
  updatedBySummary: string;
  createdAt: string;
  updatedAt: string;
  archivedAt: string;
  href: string;
  source: AdminDataSource;
  actionsAvailable: boolean;
  auditItems?: readonly AdminAuditLogItem[];
};

export type AdminCategoriesData = {
  items: readonly AdminCategoryItem[];
  parentOptions: readonly AdminCategoryOption[];
  sourceNote: string;
  source: AdminDataSource;
  viewerCanMutate: boolean;
};

export type AdminCategoryDetailData = {
  item: AdminCategoryItem | null;
  parentOptions: readonly AdminCategoryOption[];
  sourceNote: string;
  source: AdminDataSource;
  viewerCanMutate: boolean;
};

export type AdminPricingRuleItem = {
  id: string;
  title: string;
  jobCategoryLabel: string;
  jobFieldCode: string;
  experienceLevelLabel: string;
  experienceLevelCode: string;
  durationLabel: string;
  durationValue: string;
  minPriceLabel: string;
  minPriceToman: number;
  suggestedPriceLabel: string;
  suggestedPriceToman: number;
  maxPriceLabel: string;
  maxPriceToman: number;
  commissionLabel: string;
  commissionRateBps: number;
  freeSessionCommissionLabel: string;
  freeSessionCommissionRateBps: number;
  freeSessionLabel: string;
  allowFreeSession: boolean;
  stateLabel: string;
  isActive: boolean;
  isArchived: boolean;
  effectiveWindowLabel: string;
  effectiveFromValue: string;
  effectiveToValue: string;
  internalNote: string;
  createdBySummary: string;
  updatedBySummary: string;
  updatedAt: string;
  href: string;
  source: AdminDataSource;
  actionsAvailable: boolean;
  auditItems?: readonly AdminAuditLogItem[];
};

export type AdminPricingRulesData = {
  items: readonly AdminPricingRuleItem[];
  categoryOptions: readonly AdminPricingCategoryOption[];
  sourceNote: string;
  source: AdminDataSource;
  viewerCanMutate: boolean;
};

export type AdminPricingRuleDetailData = {
  item: AdminPricingRuleItem | null;
  categoryOptions: readonly AdminPricingCategoryOption[];
  sourceNote: string;
  source: AdminDataSource;
  viewerCanMutate: boolean;
};

export type AdminContentFilterOption = {
  label: string;
  value: string;
  href: string;
  active: boolean;
};

export type AdminContentEntryItem = {
  id: string;
  key: string;
  namespace: string;
  locale: string;
  title: string;
  bodySummary: string;
  bodyValue: string;
  shortText: string;
  description: string;
  contentType: string;
  contentTypeLabel: string;
  status: string;
  statusLabel: string;
  isEditable: boolean;
  isSystem: boolean;
  editableLabel: string;
  systemLabel: string;
  createdBySummary: string;
  updatedBySummary: string;
  createdAt: string;
  updatedAt: string;
  archivedAt: string;
  href: string;
  source: AdminDataSource;
  actionsAvailable: boolean;
  auditItems?: readonly AdminAuditLogItem[];
};

export type AdminUgcOverviewItem = {
  id: string;
  title: string;
  status: string;
  description: string;
  href?: string;
  ctaLabel?: string;
  source: AdminDataSource;
};

export type AdminContentData = {
  items: readonly AdminContentEntryItem[];
  namespaceOptions: readonly AdminContentFilterOption[];
  contentTypeOptions: readonly AdminContentFilterOption[];
  statusOptions: readonly AdminContentFilterOption[];
  ugcOverview: readonly AdminUgcOverviewItem[];
  activeFilters: {
    namespace: string;
    contentType: string;
    status: string;
    search: string;
  };
  sourceNote: string;
  source: AdminDataSource;
  viewerCanMutate: boolean;
};

export type AdminContentDetailData = {
  item: AdminContentEntryItem | null;
  sourceNote: string;
  source: AdminDataSource;
  viewerCanMutate: boolean;
};

export type AdminAuditLogData = {
  implemented: boolean;
  rows: readonly AdminAuditLogItem[];
  sourceNote: string;
  source: AdminDataSource;
};

export type AdminAuditLogItem = {
  id: string;
  actorSummary: string;
  actionLabel: string;
  entitySummary: string;
  statusChange: string;
  reason: string;
  note: string;
  createdAt: string;
  paymentHref?: string;
  conversationHref?: string;
  cancellationHref?: string;
  profileHref?: string;
  insightHref?: string;
  pricingHref?: string;
  categoryHref?: string;
  contentHref?: string;
  source: AdminDataSource;
};

export type AdminPlaceholderData = {
  title: string;
  description: string;
  status: string;
  items: readonly { label: string; value: string }[];
};

const requestStatusLabels: Record<RequestStatus, string> = {
  AWAITING_PAYMENT: "در انتظار پرداخت",
  AWAITING_TIME_PROPOSAL: "در انتظار پیشنهاد زمان",
  AWAITING_TIME_REPROPOSAL: "در انتظار زمان‌های تازه",
  TIME_OPTIONS_SENT: "زمان‌های پیشنهادی ارسال شده",
  SCHEDULED: "جلسه قطعی شده",
  COMPLETED: "تکمیل شده",
  REJECTED: "رد شده",
  CANCELLED: "لغو شده",
  EXPIRED: "منقضی شده",
  REFUNDED: "برگشت داده شده"
};

const paymentStatusLabels: Record<PaymentStatus, string> = {
  NOT_REQUIRED: "پرداخت لازم نیست",
  UNPAID: "پرداخت نشده",
  PENDING_REVIEW: "در انتظار بررسی پرداخت",
  PARTIALLY_COVERED_BY_WALLET: "بخشی از کیف پول",
  FULLY_COVERED_BY_WALLET: "کامل از کیف پول",
  PAID: "پرداخت شده",
  PROCESSING: "در حال پردازش",
  FAILED: "ناموفق",
  REFUND_PENDING: "در انتظار برگشت",
  REFUNDED: "برگشت داده شده"
};

const attendanceStatusLabels: Record<AttendanceVerificationStatus, string> = {
  NOT_REQUIRED: "نیاز ندارد",
  PENDING: "در انتظار تأیید برگزاری جلسه",
  VERIFIED: "تأیید شده",
  FAILED: "ناموفق",
  EXPIRED: "منقضی شده",
  NEEDS_REVIEW: "نیازمند بررسی پشتیبانی"
};

const conversationStatusLabels: Record<ConversationRequestStatus, string> = {
  pending_provider_response: "در انتظار پاسخ تجربه‌آفرین",
  times_proposed: "زمان‌های پیشنهادی ارسال شده",
  pending_payment: "در انتظار پرداخت",
  payment_not_required: "بدون نیاز به پرداخت",
  payment_processing: "پرداخت در حال بررسی",
  new_time_requested: "درخواست زمان تازه",
  confirmed: "جلسه قطعی شده",
  completed: "تکمیل شده",
  rejected: "رد شده",
  expired: "منقضی شده",
  cancelled: "لغو شده",
  refunded: "برگشت داده شده"
};

const manualReviewOpenStatuses = new Set<ManualPaymentStatus>(["SUBMITTED", "NEEDS_REVIEW"]);

function sourceHelper(source: AdminDataSource) {
  if (source === "backend_repository") {
    return "داده از مسیر repository-backed خوانده شده است.";
  }

  if (source === "local_demo") {
    return "نمای محلی/دمو از fixtureهای فعلی است و عدد تولیدی واقعی نیست.";
  }

  return "این بخش هنوز داده عملیاتی پایدار ندارد.";
}

function countLabel(value: number) {
  return formatFaNumber(value);
}

function safeText(value: string | null | undefined, fallback = "ثبت نشده") {
  return value?.trim() || fallback;
}

function formatAmount(value: number | null | undefined) {
  return toman(value ?? null);
}

function getPaymentMethodLabel(conversation: ConversationFixture) {
  if (conversation.paymentMethod === "CARD_TO_CARD") {
    return "پرداخت دستی";
  }

  if (conversation.paymentMethod === "FREE") {
    return "بدون پرداخت";
  }

  if (conversation.paymentMethod === "WALLET") {
    return "کیف پول";
  }

  return "پرداخت آنلاین";
}

function cancellationStageLabel(stage: string | null | undefined) {
  const labels: Record<string, string> = {
    BEFORE_TIME_PROPOSAL: "پیش از پیشنهاد زمان",
    AFTER_TIME_PROPOSAL_BEFORE_SELECTION: "پس از پیشنهاد زمان",
    AFTER_CONFIRMED_SESSION: "پس از قطعی شدن جلسه",
    NEAR_SESSION_START: "نزدیک شروع جلسه",
    PROVIDER_FAULT: "لغو از سمت تجربه‌آفرین",
    PLATFORM_FAULT: "نیازمند بررسی پلتفرم"
  };

  return stage ? labels[stage] ?? stage : "ثبت نشده";
}

function supportReviewLabel(conversation: ConversationFixture) {
  if (conversation.cancellationReviewStatus === "PENDING_SUPPORT_REVIEW") {
    return "در بررسی پشتیبانی";
  }

  if (conversation.cancellationReviewStatus === "APPROVED") {
    return "بررسی شده";
  }

  if (conversation.cancellationReviewStatus === "REJECTED") {
    return "رد شده";
  }

  return "نیاز ندارد";
}

function paymentReviewItemFromConversation(conversation: ConversationFixture): AdminPaymentQueueItem {
  return {
    id: `payment-${conversation.id}`,
    paymentId: conversation.id,
    conversationId: conversation.id,
    requestTopic: safeText(conversation.requestTopic, "درخواست گفت‌وگو"),
    requesterSummary: `${conversation.requesterName} · درخواست‌دهنده`,
    providerSummary: `${conversation.profile.name} · تجربه‌آفرین`,
    amountLabel: formatAmount(getConversationPrice(conversation)),
    methodLabel: getPaymentMethodLabel(conversation),
    paymentStatusLabel: paymentStatusLabels[getPaymentStatus(conversation)],
    manualReviewStatusLabel: getManualPaymentStatusLabel(conversation),
    conversationStatusLabel: conversationStatusLabels[conversation.status],
    providerVisibilityLabel: conversation.manualPaymentStatus === "APPROVED" ? "نمایش داده شده" : "نمایش داده نشده",
    submittedAt: safeText(conversation.manualPaymentSubmittedAt, conversation.createdAt),
    referenceSummary: conversation.manualPaymentReferenceNumber ? "شماره مرجع ثبت شده" : "شماره مرجع ثبت نشده",
    receiptSummary: conversation.manualPaymentReceiptFileName ? "رسید پیوست شده" : "رسید پیوست نشده",
    source: "local_demo",
    actionsAvailable: manualReviewOpenStatuses.has(conversation.manualPaymentStatus ?? "DRAFT")
  };
}

export function getLocalPaymentQueueItems() {
  return getManualPaymentReviewItems(conversations).map(paymentReviewItemFromConversation);
}

export function getLocalOpenPaymentQueueItems() {
  return getLocalPaymentQueueItems().filter((item) => item.actionsAvailable);
}

export function getLocalPaymentQueueItem(paymentId: string) {
  return getLocalPaymentQueueItems().find((item) => item.paymentId === paymentId) ?? null;
}

export function getConversationAdminItems(): AdminConversationListItem[] {
  return conversations.map((conversation) => {
    const attendanceStatus = getAttendanceVerificationStatus(conversation);

    return {
      id: conversation.id,
      title: safeText(conversation.requestTopic, "گفت‌وگو"),
      requesterSummary: `${conversation.requesterName} · درخواست‌دهنده`,
      providerSummary: `${conversation.profile.name} · تجربه‌آفرین`,
      requestStatusLabel: requestStatusLabels[getRequestStatus(conversation)],
      paymentStatusLabel: paymentStatusLabels[getPaymentStatus(conversation)],
      attendanceStatusLabel: attendanceStatusLabels[attendanceStatus],
      cancellationStatusLabel: conversation.status === "cancelled" ? supportReviewLabel(conversation) : "فعال نیست",
      createdAt: conversation.createdAt,
      href: `/admin/conversations/${conversation.id}`,
      source: "local_demo"
    };
  });
}

export function getConversationAdminItem(conversationId: string) {
  return getConversationById(conversationId) ?? null;
}

export function getCancellationAdminItems(): AdminCancellationItem[] {
  return conversations
    .filter((conversation) => conversation.status === "cancelled" || Boolean(conversation.cancellationStage))
    .map((conversation) => ({
      id: conversation.id,
      conversationId: conversation.id,
      title: safeText(conversation.requestTopic, "لغو گفت‌وگو"),
      requesterSummary: `${conversation.requesterName} · درخواست‌دهنده`,
      providerSummary: `${conversation.profile.name} · تجربه‌آفرین`,
      reason: safeText(conversation.cancellationReasonText, conversation.cancellationReasonCode ?? "ثبت نشده"),
      stage: cancellationStageLabel(conversation.cancellationStage ?? conversation.providerCancellationStage),
      supportStatus: supportReviewLabel(conversation),
      supportReviewReason: conversation.cancellationReviewStatus === "PENDING_SUPPORT_REVIEW" ? "near_session_start" : "ثبت نشده",
      creditAmountLabel: formatAmount(conversation.refundAmount ?? conversation.providerNetCompensation ?? 0),
      eligibleCreditAmountLabel: formatAmount(getConversationPrice(conversation)),
      eligibleCreditAmountToman: getConversationPrice(conversation),
      paymentAmountLabel: formatAmount(getConversationPrice(conversation)),
      paymentStatusLabel: paymentStatusLabels[getPaymentStatus(conversation)],
      conversationStatusLabel: conversationStatusLabels[conversation.status],
      selectedSession: conversation.selectedTime
        ? `${conversation.selectedTime.dateLabel} · ${conversation.selectedTime.timeLabel}`
        : "ثبت نشده",
      actionsAvailable: conversation.cancellationReviewStatus === "PENDING_SUPPORT_REVIEW",
      walletTransactionHref: conversation.walletCreditId ? "/admin/wallet-transactions" : undefined,
      createdAt: safeText(conversation.cancelledAt ?? conversation.providerCancelledAt, conversation.createdAt),
      href: `/admin/cancellations/${conversation.id}`,
      source: "local_demo"
    }));
}

export function getCancellationAdminItem(cancellationId: string) {
  return getCancellationAdminItems().find((item) => item.id === cancellationId) ?? null;
}

export function getExperienceProfileAdminItems(): AdminExperienceProfileItem[] {
  return profiles.map((profile) => ({
    id: profile.id,
    displayName: profile.name,
    roleLabel: profile.roleFa,
    categories: profile.jobCategoriesFa.join("، ") || "ثبت نشده",
    pricing: `${formatAmount(profile.pricing[30])} / ${formatAmount(profile.pricing[60])}`,
    visibilityStatus: profile.status === "active" && profile.acceptsConversationRequests ? "فعال در کشف تجربه‌ها" : "غیرفعال",
    reviewStatus: profile.status === "active" ? "بررسی شده" : "نیازمند بررسی",
    readinessScore: profile.status === "active" && profile.acceptsConversationRequests ? "۱۰۰٪" : "۷۰٪",
    href: `/admin/experience-profiles/${profile.id}`,
    source: "local_demo"
  }));
}

export function getExperienceProfileAdminItem(profileId: string) {
  const item = getExperienceProfileAdminItems().find((profile) => profile.id === profileId) ?? null;
  const profile = getProfileById(profileId) ?? null;

  return item && profile ? { item, profile } : null;
}

export function getUserAdminItems(): AdminUserItem[] {
  const users = new Map<string, AdminUserItem>();
  const conversationCounts = new Map<string, number>();

  conversations.forEach((conversation) => {
    conversationCounts.set(conversation.requesterId, (conversationCounts.get(conversation.requesterId) ?? 0) + 1);
    conversationCounts.set(conversation.providerId, (conversationCounts.get(conversation.providerId) ?? 0) + 1);
  });

  conversations.forEach((conversation) => {
    const requester = users.get(conversation.requesterId);
    users.set(conversation.requesterId, {
      id: conversation.requesterId,
      displayName: requester?.displayName ?? conversation.requesterName,
      roleLabel: "درخواست‌دهنده",
      profileCompletion: requester?.profileCompletion ?? "پایه",
      accountStatus: "فعال",
      experienceProfileStatus: requester?.experienceProfileStatus ?? "نامشخص",
      conversationsCount: countLabel(conversationCounts.get(conversation.requesterId) ?? 1),
      href: `/admin/users/${conversation.requesterId}`,
      source: "local_demo"
    });

    const provider = users.get(conversation.providerId);
    users.set(conversation.providerId, {
      id: conversation.providerId,
      displayName: provider?.displayName ?? conversation.profile.name,
      roleLabel: "تجربه‌آفرین",
      profileCompletion: "کامل",
      accountStatus: conversation.profile.status === "active" ? "فعال" : "غیرفعال",
      experienceProfileStatus: conversation.profile.status === "active" ? "فعال" : "نیازمند بررسی",
      conversationsCount: countLabel(conversationCounts.get(conversation.providerId) ?? 1),
      href: `/admin/users/${conversation.providerId}`,
      source: "local_demo"
    });
  });

  return Array.from(users.values()).sort((a, b) => a.displayName.localeCompare(b.displayName, "fa"));
}

export function getUserAdminItem(userId: string) {
  return getUserAdminItems().find((user) => user.id === userId) ?? null;
}

export function getWalletLedgerAdminItems(): AdminWalletLedgerItem[] {
  return initialWalletFixture.transactions.map((transaction: WalletTransaction) => ({
    id: transaction.id,
    typeLabel: walletTypeLabels[transaction.type],
    title: transaction.title,
    amountLabel: signedToman(transaction.amount),
    statusLabel: transaction.status === "pending" ? "در انتظار" : transaction.status === "failed" ? "ناموفق" : "تکمیل شده",
    sourceConversationHref: transaction.sourceConversationId ? `/admin/conversations/${transaction.sourceConversationId}` : undefined,
    paymentHref: transaction.sourceConversationId ? `/admin/payments/${transaction.sourceConversationId}` : undefined,
    userHref: `/admin/users/${initialWalletFixture.ownerUserId}`,
    createdAt: transaction.createdAt ?? transaction.date,
    source: "local_demo"
  }));
}

export function getAttendanceQueueItems() {
  return conversations
    .filter((conversation) => {
      const status = getAttendanceVerificationStatus(conversation);
      return conversation.status === "confirmed" && status !== "VERIFIED" && status !== "NOT_REQUIRED";
    })
    .map((conversation) => ({
      id: `attendance-${conversation.id}`,
      title: safeText(conversation.requestTopic, "جلسه"),
      status: attendanceStatusLabels[getAttendanceVerificationStatus(conversation)],
      users: `${conversation.requesterName} / ${conversation.profile.name}`,
      href: `/admin/conversations/${conversation.id}`,
      source: "local_demo" as AdminDataSource
    }));
}

export function buildAdminHomeData(paymentItems: readonly AdminPaymentQueueItem[] = getLocalOpenPaymentQueueItems()) {
  const cancellationItems = getCancellationAdminItems().filter((item) => item.supportStatus === "در بررسی پشتیبانی");
  const attendanceItems = getAttendanceQueueItems();
  const profileItems = getExperienceProfileAdminItems().filter((item) => item.reviewStatus === "نیازمند بررسی");

  const metrics: AdminMetric[] = [
    {
      id: "payments-awaiting-review",
      label: "پرداخت‌های در انتظار بررسی",
      value: countLabel(paymentItems.length),
      helper: sourceHelper(paymentItems.some((item) => item.source === "backend_repository") ? "backend_repository" : "local_demo"),
      href: "/admin/payments",
      source: paymentItems.some((item) => item.source === "backend_repository") ? "backend_repository" : "local_demo"
    },
    {
      id: "cancellations-under-review",
      label: "لغوهای در بررسی پشتیبانی",
      value: countLabel(cancellationItems.length),
      helper: sourceHelper("local_demo"),
      href: "/admin/cancellations",
      source: "local_demo"
    },
    {
      id: "profiles-awaiting-review",
      label: "پروفایل‌های تجربه‌آفرین در بررسی",
      value: countLabel(profileItems.length),
      helper: "صف بررسی پروفایل هنوز repository-backed نیست.",
      href: "/admin/experience-profiles",
      source: "placeholder"
    },
    {
      id: "attendance-pending",
      label: "جلسه‌های بدون تأیید حضور",
      value: countLabel(attendanceItems.length),
      helper: sourceHelper("local_demo"),
      href: "/admin/attendance",
      source: "local_demo"
    },
    {
      id: "reported-insights",
      label: "بینش‌های گزارش‌شده",
      value: "۰",
      helper: "گزارش بینش در این چک‌پوینت پیاده‌سازی نشده است.",
      href: "/admin/insights",
      source: "placeholder"
    },
    {
      id: "open-support",
      label: "موارد باز پشتیبانی",
      value: countLabel(cancellationItems.length),
      helper: sourceHelper("local_demo"),
      href: "/admin/support",
      source: "local_demo"
    }
  ];

  const paymentActions: AdminActionItem[] = paymentItems.map((item) => ({
    id: `review-manual-payment-${item.paymentId}`,
    actionType: "بررسی پرداخت دستی",
    priority: "فوری",
    relatedEntity: item.requestTopic,
    relatedUsers: `${item.requesterSummary} / ${item.providerSummary}`,
    status: item.manualReviewStatusLabel,
    createdAt: item.submittedAt,
    href: `/admin/payments/${item.paymentId}`,
    ctaLabel: "بررسی پرداخت",
    source: item.source
  }));

  const cancellationActions: AdminActionItem[] = cancellationItems.map((item) => ({
    id: `review-cancellation-${item.id}`,
    actionType: "بررسی لغو",
    priority: "بالا",
    relatedEntity: item.title,
    relatedUsers: `${item.requesterSummary} / ${item.providerSummary}`,
    status: item.supportStatus,
    createdAt: item.createdAt,
    href: item.href,
    ctaLabel: "مشاهده لغو",
    source: item.source
  }));

  const attendanceActions: AdminActionItem[] = attendanceItems.map((item) => ({
    id: item.id,
    actionType: "بررسی وضعیت حضور",
    priority: "معمولی",
    relatedEntity: item.title,
    relatedUsers: item.users,
    status: item.status,
    createdAt: "نمای محلی",
    href: item.href,
    ctaLabel: "مشاهده گفت‌وگو",
    source: item.source
  }));

  const insightAction: AdminActionItem[] = publishedInsights.length
    ? [
        {
          id: "review-insight-placeholder",
          actionType: "بررسی بینش",
          priority: "معمولی",
          relatedEntity: "گزارش فعالی ثبت نشده",
          relatedUsers: "نامرتبط",
          status: "بدون مورد باز",
          createdAt: "placeholder",
          href: "/admin/insights",
          ctaLabel: "مشاهده بینش‌ها",
          source: "placeholder"
        }
      ]
    : [];

  return {
    metrics,
    actionItems: [...paymentActions, ...cancellationActions, ...attendanceActions, ...insightAction],
    sourceNote: "اعداد بخش‌هایی که repository-backed نیستند، فقط از داده محلی فعلی ساخته شده‌اند و عدد تولیدی واقعی نیستند."
  };
}

export function getPlaceholderData(routeId: string): AdminPlaceholderData {
  const placeholders: Record<string, AdminPlaceholderData> = {
    attendance: {
      title: "حضور جلسه",
      description: "نمای پایه برای پیگیری وضعیت تأیید برگزاری جلسه. کد خام در این بخش نمایش داده نمی‌شود.",
      status: "اسکلت خواندنی",
      items: getAttendanceQueueItems().map((item) => ({ label: item.title, value: item.status }))
    },
    insights: {
      title: "بینش‌ها",
      description: "نمای پایه برای بینش‌ها و گزارش‌های آینده. جریان گزارش در این چک‌پوینت فعال نیست.",
      status: "placeholder",
      items: [{ label: "بینش‌های منتشرشده محلی", value: countLabel(publishedInsights.length) }]
    },
    analytics: {
      title: "داشبورد تحلیل",
      description: "انبار تحلیل و گزارش‌های مدیریتی هنوز پیاده‌سازی نشده است.",
      status: "در آینده",
      items: [{ label: "منبع داده", value: "پیاده‌سازی نشده" }]
    },
    pricing: {
      title: "قواعد قیمت‌گذاری",
      description: "این بخش فقط جایگاه امن برای قواعد قیمت‌گذاری آینده است.",
      status: "در آینده",
      items: [{ label: "کنش فعال", value: "ندارد" }]
    },
    content: {
      title: "مدیریت محتوا",
      description: "جریان کامل مدیریت محتوا در این چک‌پوینت پیاده‌سازی نشده است.",
      status: "در آینده",
      items: [{ label: "کنش فعال", value: "ندارد" }]
    },
    categories: {
      title: "دسته‌بندی‌ها و موضوعات",
      description: "مدیریت دسته شغلی و موضوعات فعلاً فقط اسکلت امن دارد.",
      status: "در آینده",
      items: [{ label: "کنش فعال", value: "ندارد" }]
    },
    support: {
      title: "پشتیبانی",
      description: "نمای پایه از موارد نیازمند بررسی پشتیبانی.",
      status: "اسکلت خواندنی",
      items: getCancellationAdminItems()
        .filter((item) => item.supportStatus === "در بررسی پشتیبانی")
        .map((item) => ({ label: item.title, value: item.supportStatus }))
    },
    settings: {
      title: "تنظیمات پنل عملیات",
      description: "تنظیمات قابل تغییر برای پنل عملیات در این چک‌پوینت فعال نیست.",
      status: "در آینده",
      items: [{ label: "کنش فعال", value: "ندارد" }]
    }
  };

  return placeholders[routeId] ?? {
    title: "بخش در آینده",
    description: "این مسیر برای چک‌پوینت‌های بعدی رزرو شده است.",
    status: "placeholder",
    items: []
  };
}

export function getAdminCtaHrefs() {
  const home = buildAdminHomeData();
  const hrefs = [
    ...home.metrics.flatMap((metric) => (metric.href ? [metric.href] : [])),
    ...home.actionItems.map((item) => item.href),
    ...getConversationAdminItems().map((item) => item.href),
    ...getCancellationAdminItems().map((item) => item.href),
    ...getUserAdminItems().map((item) => item.href),
    ...getExperienceProfileAdminItems().map((item) => item.href),
    ...getWalletLedgerAdminItems().flatMap((item) => [item.sourceConversationHref, item.paymentHref, item.userHref].filter(Boolean) as string[])
  ];

  return Array.from(new Set(hrefs));
}

export function getBrokenAdminCtaHrefs() {
  return getAdminCtaHrefs().filter((href) => !adminHrefIsKnown(href));
}

export function getConversationTimeline(conversation: ConversationFixture) {
  return [
    { label: "ایجاد گفت‌وگو", value: conversation.createdAt },
    { label: "وضعیت درخواست", value: conversationStatusLabels[conversation.status] },
    { label: "وضعیت پرداخت", value: paymentStatusLabels[getPaymentStatus(conversation)] },
    { label: "وضعیت زمان پیشنهادی", value: conversation.proposedTimes.length ? `${countLabel(conversation.proposedTimes.length)} گزینه` : "ثبت نشده" },
    { label: "زمان انتخاب‌شده", value: conversation.selectedTime ? `${conversation.selectedTime.displayDateFa}، ${conversation.selectedTime.displayTimeFa}` : "انتخاب نشده" },
    { label: "وضعیت حضور", value: attendanceStatusLabels[getAttendanceVerificationStatus(conversation)] },
    { label: "وضعیت لغو", value: conversation.status === "cancelled" ? supportReviewLabel(conversation) : "فعال نیست" }
  ];
}

export function getQualityChecklist(profile: ExperienceProfileFixture) {
  return [
    { label: "معرفی حرفه‌ای", value: profile.professionalSummary ? "تکمیل" : "نیازمند تکمیل" },
    { label: "دسته شغلی", value: profile.jobCategoriesFa.length ? "تکمیل" : "نیازمند تکمیل" },
    { label: "گزینه‌های قیمت", value: profile.pricing[30] || profile.pricing[60] ? "تکمیل" : "نیازمند تکمیل" },
    { label: "قابلیت نمایش", value: profile.acceptsConversationRequests ? "فعال" : "غیرفعال" }
  ];
}
