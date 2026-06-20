import {
  adminReadModelService,
  type AdminActionQueueItem as RepositoryActionQueueItem,
  type AdminAnalyticsDateRange,
  type AdminAnalyticsFilters,
  type AdminAnalyticsSummary as RepositoryAnalyticsSummary,
  type AdminAttendanceRow as RepositoryAttendanceRow,
  type AdminCancellationDetail as RepositoryCancellationDetail,
  type AdminCancellationRow as RepositoryCancellationRow,
  type AdminConversationDetail as RepositoryConversationDetail,
  type AdminConversationRow as RepositoryConversationRow,
  type AdminDashboardSummary as RepositoryDashboardSummary,
  type AdminExperienceProfileDetail as RepositoryExperienceProfileDetail,
  type AdminExperienceProfileRow as RepositoryExperienceProfileRow,
  type AdminInsightDetail as RepositoryInsightDetail,
  type AdminInsightRow as RepositoryInsightRow,
  type AdminUserDetail as RepositoryUserDetail,
  type AdminUserRow as RepositoryUserRow,
  type AdminWalletTransactionRow as RepositoryWalletTransactionRow
} from "@/lib/backend/admin-read-models";
import {
  buildAdminPaidSessionsKpiTree,
  buildUnavailableAdminPaidSessionsKpiTree
} from "@/lib/backend/admin-kpi-tree";
import {
  ContentEntryStatus,
  ContentEntryType,
  JobField,
  LeadFollowUpChannel,
  LeadFollowUpOutcome,
  LeadSource,
  LeadStage,
  LeadTemperature,
  LeadType,
  SupportRelatedEntityType,
  SupportTicketCategory,
  SupportTicketPriority,
  SupportTicketSource,
  SupportTicketStatus,
  type JobField as PrismaJobField
} from "@prisma/client";
import {
  adminCategoryService,
  adminContentService,
  adminLeadService,
  adminPaymentService,
  adminPricingService,
  adminSupportService
} from "@/lib/backend/services";
import type {
  AdminCategoryRecord,
  AdminContentEntryRecord,
  AdminLeadFilters,
  AdminLeadRecord,
  AdminSupportTicketRecord,
  PricingRuleCategoryOption,
  PricingRuleRecord
} from "@/lib/backend/repositories";
import { adminAnalyticsFilterSchema } from "@/lib/backend/validation";
import type { Viewer } from "@/lib/auth/types";
import { formatFaNumber } from "@/lib/fa-format";
import {
  buildAdminHomeData,
  getAttendanceQueueItems,
  getCancellationAdminItem,
  getCancellationAdminItems,
  getConversationAdminItem,
  getConversationAdminItems,
  getExperienceProfileAdminItem,
  getExperienceProfileAdminItems,
  getLocalPaymentQueueItems,
  getLocalPaymentQueueItem,
  getUserAdminItem,
  getUserAdminItems,
  getWalletLedgerAdminItems,
  type AdminActionItem,
  type AdminActionPriority,
  type AdminAnalyticsBreakdownRow,
  type AdminAnalyticsData,
  type AdminAttendanceItem,
  type AdminAuditLogItem,
  type AdminAuditLogData,
  type AdminCancellationItem,
  type AdminCategoriesData,
  type AdminCategoryDetailData,
  type AdminCategoryItem,
  type AdminCategoryOption,
  type AdminContentData,
  type AdminContentDetailData,
  type AdminContentEntryItem,
  type AdminContentFilterOption,
  type AdminUgcOverviewItem,
  type AdminLeadDetailData,
  type AdminLeadFilterOption,
  type AdminLeadInboxData,
  type AdminLeadItem,
  type AdminSupportDetailData,
  type AdminSupportFilterOption,
  type AdminSupportInboxData,
  type AdminSupportTicketItem,
  type AdminConversationListItem,
  type AdminDataSource,
  type AdminDetailField,
  type AdminExperienceProfileDetailItem,
  type AdminInsightDetailItem,
  type AdminInsightItem,
  type AdminMetric,
  type AdminPaymentQueueItem,
  type AdminPricingCategoryOption,
  type AdminPricingRuleDetailData,
  type AdminPricingRuleItem,
  type AdminPricingRulesData,
  type AdminReadDetail,
  type AdminUserItem,
  type AdminWalletLedgerItem,
  type AdminExperienceProfileItem
} from "./data";

type RepositoryPaymentReview = {
  id: string;
  status: string;
  referenceNumber: string | null;
  receiptFileName: string | null;
  submittedAt: Date | string | null;
  reviewedAt: Date | string | null;
  adminNote: string | null;
  rejectionReason: string | null;
  payment: {
    id: string;
    conversationId: string;
    method: string;
    status: string;
    amountToman: number | null;
    conversation: {
      id: string;
      requesterId: string;
      providerId: string;
      status: string;
      requestTopic: string | null;
      providerVisibleAt: Date | string | null;
      paymentFinalizedAt: Date | string | null;
      confirmedAt: Date | string | null;
      selectedTimeId: string | null;
      createdAt: Date | string;
      proposedTimes: { id: string }[];
      attendanceVerification: { id: string } | null;
      walletTransactions: { id: string }[];
    };
  };
};

export type AdminPaymentRouteData = {
  items: AdminPaymentQueueItem[];
  source: AdminDataSource;
  sourceNote: string;
};

export type AdminHomeRouteData = {
  metrics: AdminMetric[];
  actionItems: AdminActionItem[];
  sourceNote: string;
};

export type AdminAnalyticsSearchParams = Record<string, string | string[] | undefined>;
export type AdminContentSearchParams = Record<string, string | string[] | undefined>;
export type AdminLeadSearchParams = Record<string, string | string[] | undefined>;
export type AdminSupportSearchParams = Record<string, string | string[] | undefined>;

export type AdminListRouteData<T> = {
  items: T[];
  source: AdminDataSource;
  sourceNote: string;
};

export type AdminDetailRouteData<TFallback> = {
  detail: AdminReadDetail | null;
  fallback: TFallback | null;
  source: AdminDataSource;
  sourceNote: string;
};

export type AdminCancellationDetailRouteData = {
  detail: AdminReadDetail | null;
  fallback: ReturnType<typeof getCancellationAdminItem> | null;
  item: AdminCancellationItem | null;
  source: AdminDataSource;
  sourceNote: string;
};

export type AdminExperienceProfileDetailRouteData = {
  detail: AdminReadDetail | null;
  fallback: ReturnType<typeof getExperienceProfileAdminItem> | null;
  item: AdminExperienceProfileDetailItem | null;
  source: AdminDataSource;
  sourceNote: string;
};

export type AdminInsightDetailRouteData = {
  item: AdminInsightDetailItem | null;
  source: AdminDataSource;
  sourceNote: string;
};

const repositorySourceNote = "داده این صفحه از read model متصل به پایگاه داده خوانده شده است.";
const demoFallbackSourceNote = "پایگاه داده در دسترس نبود؛ نمایش فعلی با داده محلی / نمایشی برچسب‌گذاری شده است.";
const placeholderSourceNote = "این بخش هنوز منبع عملیاتی پایدار ندارد و داده ساختگی نمایش نمی‌دهد.";
const notRecorded = "ثبت نشده";

export function isAdminLocalDemoFallbackEnabled() {
  return process.env.NODE_ENV !== "production" || process.env.USERAVAA_ENABLE_ADMIN_DEMO_FALLBACK === "1";
}

function placeholderAdminList<T>(): AdminListRouteData<T> {
  return {
    items: [],
    source: "placeholder",
    sourceNote: placeholderSourceNote
  };
}

function placeholderAdminHome(): AdminHomeRouteData {
  return {
    metrics: [
      {
        id: "admin-data-unavailable",
        label: "داده عملیات",
        value: "ناموجود",
        helper: "پایگاه داده در دسترس نیست و داده نمایشی در محیط تولید نمایش داده نمی‌شود.",
        source: "placeholder"
      }
    ],
    actionItems: [],
    sourceNote: placeholderSourceNote
  };
}
const analyticsDateRangeLabels: Record<AdminAnalyticsDateRange, string> = {
  last_7_days: "۷ روز گذشته",
  last_30_days: "۳۰ روز گذشته",
  last_90_days: "۹۰ روز گذشته",
  all_time: "همه زمان‌ها"
};
const analyticsDateRanges = Object.keys(analyticsDateRangeLabels) as AdminAnalyticsDateRange[];
const unsupportedAnalyticsMetrics = [
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
  }
] as const;

const contentTypeLabels: Record<ContentEntryType, string> = {
  SYSTEM_COPY: "کپی سیستمی",
  PAGE_BLOCK: "بلوک صفحه",
  FAQ: "پرسش پرتکرار",
  HELP_TEXT: "متن راهنما",
  EMPTY_STATE: "حالت خالی",
  ERROR_MESSAGE: "پیام خطا",
  CTA: "دعوت به اقدام",
  ADMIN_COPY: "کپی ادمین",
  NOTIFICATION_TEMPLATE: "الگوی اعلان"
};

const contentStatusLabels: Record<ContentEntryStatus, string> = {
  DRAFT: "پیش‌نویس",
  PUBLISHED: "منتشرشده",
  HIDDEN: "مخفی",
  ARCHIVED: "آرشیوشده"
};

const leadTypeLabels: Record<LeadType, string> = {
  REQUESTER_LEAD: "سرنخ درخواست‌کننده",
  EXPERIENCE_CREATOR_LEAD: "سرنخ تجربه‌آفرین",
  PARTNER_LEAD: "سرنخ شریک",
  GENERAL_LEAD: "سرنخ عمومی"
};

const leadTemperatureLabels: Record<LeadTemperature, string> = {
  COLD: "سرد",
  WARM: "گرم",
  HOT: "داغ",
  QUALIFIED: "واجد شرایط",
  CONVERTED: "تبدیل‌شده",
  LOST: "از دست‌رفته"
};

const leadStageLabels: Record<LeadStage, string> = {
  NEW: "جدید",
  CONTACTED: "تماس گرفته‌شده",
  QUALIFIED: "واجد شرایط",
  FOLLOW_UP: "پیگیری بعدی",
  CONVERTED: "تبدیل‌شده",
  LOST: "از دست‌رفته",
  ARCHIVED: "آرشیوشده"
};

const leadSourceLabels: Record<LeadSource, string> = {
  ORGANIC: "ارگانیک",
  REFERRAL: "معرفی",
  LINKEDIN: "لینکدین",
  TELEGRAM: "تلگرام",
  INSTAGRAM: "اینستاگرام",
  EVENT: "رویداد",
  MANUAL_IMPORT: "ورود CSV",
  ADMIN_CREATED: "ساخته‌شده توسط ادمین",
  WAITLIST: "لیست انتظار",
  INSIGHT_INTERACTION: "تعامل با بینش",
  PROFILE_VIEW: "مشاهده پروفایل",
  CHECKOUT_ABANDONED: "رهاسازی پرداخت",
  CONVERSATION_REQUEST_STARTED: "شروع درخواست گفت‌وگو",
  OTHER: "سایر"
};

const leadFollowUpChannelLabels: Record<LeadFollowUpChannel, string> = {
  PHONE: "تلفن",
  WHATSAPP: "واتساپ",
  TELEGRAM: "تلگرام",
  EMAIL: "ایمیل",
  LINKEDIN: "لینکدین",
  IN_APP: "داخل محصول",
  MANUAL: "دستی"
};

const leadFollowUpOutcomeLabels: Record<LeadFollowUpOutcome, string> = {
  NO_RESPONSE: "بدون پاسخ",
  INTERESTED: "علاقه‌مند",
  NOT_NOW: "فعلاً نه",
  ASKED_FOR_MORE_INFO: "درخواست اطلاعات بیشتر",
  WANTS_SPECIFIC_EXPERIENCE: "نیاز به تجربه مشخص",
  PRICE_CONCERN: "نگرانی قیمت",
  NEEDS_TRUST: "نیاز به اعتماد بیشتر",
  BAD_FIT: "نامتناسب",
  CONVERTED: "تبدیل‌شده",
  LOST: "از دست‌رفته"
};

const supportStatusLabels: Record<SupportTicketStatus, string> = {
  NEW: "جدید",
  OPEN: "باز",
  IN_PROGRESS: "در حال پیگیری",
  WAITING_FOR_USER: "در انتظار کاربر",
  WAITING_FOR_PROVIDER: "در انتظار تجربه‌آفرین",
  ESCALATED: "ارجاع‌شده",
  RESOLVED: "حل‌شده",
  ARCHIVED: "آرشیوشده"
};

const supportPriorityLabels: Record<SupportTicketPriority, string> = {
  LOW: "کم",
  NORMAL: "معمولی",
  HIGH: "بالا",
  URGENT: "فوری"
};

const supportCategoryLabels: Record<SupportTicketCategory, string> = {
  CONVERSATION: "گفت‌وگو",
  PAYMENT: "پرداخت",
  CANCELLATION_REFUND_WALLET: "لغو / مبلغ برگشتی / کیف پول",
  PROFILE_EXPERIENCE_CREATOR: "پروفایل تجربه‌آفرین",
  INSIGHT_CONTENT: "بینش / محتوا",
  ACCOUNT_AUTH: "حساب و ورود",
  PRICING_CATEGORY: "قیمت‌گذاری / دسته‌بندی",
  TECHNICAL_ISSUE: "مسئله فنی",
  TRUST_SAFETY: "اعتماد و ایمنی",
  GENERAL_QUESTION: "پرسش عمومی"
};

const supportSourceLabels: Record<SupportTicketSource, string> = {
  ADMIN_CREATED: "ساخته‌شده توسط ادمین",
  USER_REPORTED: "گزارش کاربر",
  SYSTEM_FLAGGED: "پرچم سیستمی",
  PAYMENT_REVIEW: "بررسی پرداخت",
  CONVERSATION_FLOW: "مسیر گفت‌وگو",
  PROFILE_REVIEW: "بررسی پروفایل",
  INSIGHT_REPORT: "گزارش بینش",
  MANUAL: "دستی"
};

const supportRelatedEntityLabels: Record<SupportRelatedEntityType, string> = {
  USER: "کاربر",
  CONVERSATION: "گفت‌وگو",
  PAYMENT: "پرداخت",
  PROFILE: "پروفایل تجربه‌آفرین",
  INSIGHT: "بینش",
  WALLET_TRANSACTION: "تراکنش کیف پول",
  CONTENT_ENTRY: "محتوا",
  NONE: "بدون ارتباط"
};

const supportNoteTypeLabels = {
  INTERNAL: "یادداشت داخلی",
  PUBLIC_DRAFT: "پیش‌نویس عمومی"
} as const;

const contentDefaultNamespaces = [
  "public.insights",
  "public.auth",
  "public.discovery",
  "product.conversation",
  "product.checkout",
  "admin.empty_states"
] as const;

const supportQueueViews = [
  { value: "", label: "همه فعال‌ها" },
  { value: "new", label: "جدید" },
  { value: "unassigned", label: "بدون مسئول" },
  { value: "mine", label: "تیکت‌های من" },
  { value: "urgent", label: "فوری" },
  { value: "waiting_user", label: "در انتظار کاربر" },
  { value: "waiting_provider", label: "در انتظار تجربه‌آفرین" },
  { value: "escalated", label: "ارجاع‌شده" },
  { value: "payment", label: "پرداخت" },
  { value: "conversation", label: "گفت‌وگو" },
  { value: "profile", label: "پروفایل" },
  { value: "insight", label: "بینش / محتوا" },
  { value: "resolved", label: "حل‌شده" },
  { value: "archived", label: "آرشیوشده" }
] as const;

const leadQueueViews = [
  { value: "", label: "همه فعال‌ها" },
  { value: "new", label: "جدید" },
  { value: "mine", label: "سرنخ‌های من" },
  { value: "unassigned", label: "بدون مسئول" },
  { value: "hot", label: "داغ" },
  { value: "qualified", label: "واجد شرایط" },
  { value: "follow_up", label: "نیازمند پیگیری" },
  { value: "converted", label: "تبدیل‌شده" },
  { value: "lost", label: "از دست‌رفته" },
  { value: "archived", label: "آرشیوشده" }
] as const;

function firstSearchParam(params: AdminAnalyticsSearchParams | undefined, key: string) {
  const value = params?.[key];

  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function isPrismaJobField(value: string | null | undefined): value is PrismaJobField {
  return Boolean(value && Object.values(JobField).includes(value as PrismaJobField));
}

function parseAdminAnalyticsFilters(params: AdminAnalyticsSearchParams | undefined): AdminAnalyticsFilters {
  const parsed = adminAnalyticsFilterSchema.safeParse({
    range: firstSearchParam(params, "range") ?? "last_30_days",
    category: firstSearchParam(params, "category")
  });

  if (!parsed.success) {
    return {
      dateRange: "last_30_days",
      category: null
    };
  }

  return {
    dateRange: parsed.data.range,
    category: isPrismaJobField(parsed.data.category) ? parsed.data.category : null
  };
}

function adminAnalyticsHref(dateRange: AdminAnalyticsDateRange, category: string | null) {
  const params = new URLSearchParams();
  params.set("range", dateRange);

  if (category) {
    params.set("category", category);
  }

  return `/admin/analytics?${params.toString()}`;
}

function isContentEntryType(value: string | null | undefined): value is ContentEntryType {
  return Boolean(value && Object.values(ContentEntryType).includes(value as ContentEntryType));
}

function isContentEntryStatus(value: string | null | undefined): value is ContentEntryStatus {
  return Boolean(value && Object.values(ContentEntryStatus).includes(value as ContentEntryStatus));
}

function isSupportTicketStatus(value: string | null | undefined): value is SupportTicketStatus {
  return Boolean(value && Object.values(SupportTicketStatus).includes(value as SupportTicketStatus));
}

function isSupportTicketPriority(value: string | null | undefined): value is SupportTicketPriority {
  return Boolean(value && Object.values(SupportTicketPriority).includes(value as SupportTicketPriority));
}

function isSupportTicketCategory(value: string | null | undefined): value is SupportTicketCategory {
  return Boolean(value && Object.values(SupportTicketCategory).includes(value as SupportTicketCategory));
}

function isSupportTicketSource(value: string | null | undefined): value is SupportTicketSource {
  return Boolean(value && Object.values(SupportTicketSource).includes(value as SupportTicketSource));
}

function isSupportRelatedEntityType(value: string | null | undefined): value is SupportRelatedEntityType {
  return Boolean(value && Object.values(SupportRelatedEntityType).includes(value as SupportRelatedEntityType));
}

function isLeadStage(value: string | null | undefined): value is LeadStage {
  return Boolean(value && Object.values(LeadStage).includes(value as LeadStage));
}

function isLeadTemperature(value: string | null | undefined): value is LeadTemperature {
  return Boolean(value && Object.values(LeadTemperature).includes(value as LeadTemperature));
}

function isLeadType(value: string | null | undefined): value is LeadType {
  return Boolean(value && Object.values(LeadType).includes(value as LeadType));
}

function isLeadSource(value: string | null | undefined): value is LeadSource {
  return Boolean(value && Object.values(LeadSource).includes(value as LeadSource));
}

function parseAdminContentFilters(params: AdminContentSearchParams | undefined) {
  const namespace = firstSearchParam(params, "namespace")?.trim() ?? "";
  const contentType = firstSearchParam(params, "contentType")?.trim() ?? "";
  const status = firstSearchParam(params, "status")?.trim() ?? "";
  const search = firstSearchParam(params, "search")?.trim() ?? "";

  return {
    namespace,
    contentType: isContentEntryType(contentType) ? contentType : "",
    status: isContentEntryStatus(status) ? status : "",
    search
  };
}

function parseAdminLeadFilters(params: AdminLeadSearchParams | undefined) {
  const view = firstSearchParam(params, "view")?.trim() ?? "";
  const stage = firstSearchParam(params, "stage")?.trim() ?? "";
  const temperature = firstSearchParam(params, "temperature")?.trim() ?? "";
  const leadType = firstSearchParam(params, "leadType")?.trim() ?? "";
  const source = firstSearchParam(params, "source")?.trim() ?? "";
  const owner = firstSearchParam(params, "owner")?.trim() ?? "";
  const search = firstSearchParam(params, "search")?.trim() ?? "";

  return {
    view: leadQueueViews.some((option) => option.value === view) ? view : "",
    stage: isLeadStage(stage) ? stage : "",
    temperature: isLeadTemperature(temperature) ? temperature : "",
    leadType: isLeadType(leadType) ? leadType : "",
    source: isLeadSource(source) ? source : "",
    owner: owner === "me" || owner === "unassigned" ? owner : "",
    search
  };
}

function parseAdminSupportFilters(params: AdminSupportSearchParams | undefined) {
  const view = firstSearchParam(params, "view")?.trim() ?? "";
  const status = firstSearchParam(params, "status")?.trim() ?? "";
  const priority = firstSearchParam(params, "priority")?.trim() ?? "";
  const category = firstSearchParam(params, "category")?.trim() ?? "";
  const source = firstSearchParam(params, "source")?.trim() ?? "";
  const relatedEntityType = firstSearchParam(params, "relatedEntityType")?.trim() ?? "";
  const assignee = firstSearchParam(params, "assignee")?.trim() ?? "";
  const search = firstSearchParam(params, "search")?.trim() ?? "";

  return {
    view: supportQueueViews.some((option) => option.value === view) ? view : "",
    status: isSupportTicketStatus(status) ? status : "",
    priority: isSupportTicketPriority(priority) ? priority : "",
    category: isSupportTicketCategory(category) ? category : "",
    source: isSupportTicketSource(source) ? source : "",
    relatedEntityType: isSupportRelatedEntityType(relatedEntityType) ? relatedEntityType : "",
    assignee: assignee === "me" || assignee === "unassigned" ? assignee : "",
    search
  };
}

function adminContentHref(filters: {
  namespace?: string;
  contentType?: string;
  status?: string;
  search?: string;
}) {
  const params = new URLSearchParams();

  if (filters.namespace) {
    params.set("namespace", filters.namespace);
  }

  if (filters.contentType) {
    params.set("contentType", filters.contentType);
  }

  if (filters.status) {
    params.set("status", filters.status);
  }

  if (filters.search) {
    params.set("search", filters.search);
  }

  const query = params.toString();
  return query ? `/admin/content?${query}` : "/admin/content";
}

function adminSupportHref(filters: {
  view?: string;
  status?: string;
  priority?: string;
  category?: string;
  source?: string;
  relatedEntityType?: string;
  assignee?: string;
  search?: string;
}) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  const query = params.toString();
  return query ? `/admin/support?${query}` : "/admin/support";
}

function adminLeadHref(filters: {
  view?: string;
  stage?: string;
  temperature?: string;
  leadType?: string;
  source?: string;
  owner?: string;
  search?: string;
}) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  const query = params.toString();
  return query ? `/admin/leads?${query}` : "/admin/leads";
}

function mapContentFilterOption(
  label: string,
  value: string,
  active: boolean,
  nextFilters: {
    namespace?: string;
    contentType?: string;
    status?: string;
    search?: string;
  }
): AdminContentFilterOption {
  return {
    label,
    value,
    active,
    href: adminContentHref(nextFilters)
  };
}

function mapSupportFilterOption(
  label: string,
  value: string,
  active: boolean,
  nextFilters: ReturnType<typeof parseAdminSupportFilters>
): AdminSupportFilterOption {
  return {
    label,
    value,
    active,
    href: adminSupportHref(nextFilters)
  };
}

function mapLeadFilterOption(
  label: string,
  value: string,
  active: boolean,
  nextFilters: ReturnType<typeof parseAdminLeadFilters>
): AdminLeadFilterOption {
  return {
    label,
    value,
    active,
    href: adminLeadHref(nextFilters)
  };
}

function formatDateLike(value: Date | string | null | undefined) {
  if (!value) {
    return notRecorded;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return value;
}

function countLabel(value: number) {
  return formatFaNumber(value);
}

function percentLabel(value: number | null) {
  if (value === null) {
    return notRecorded;
  }

  return `${formatFaNumber(Math.round(value * 100))}%`;
}

function amountLabel(value: number | null | undefined) {
  return value == null ? notRecorded : `${value.toLocaleString("fa-IR")} تومان`;
}

function signedAmountLabel(value: number | null | undefined) {
  if (value == null) {
    return notRecorded;
  }

  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value.toLocaleString("fa-IR")} تومان`;
}

function safeText(value: string | null | undefined, fallback = notRecorded) {
  return value?.trim() || fallback;
}

function participantSummary(user: { id: string; displayName: string }) {
  return `${user.displayName} · ${user.id}`;
}

function providerVisibilityLabel(value: Date | string | null | undefined) {
  return value ? `نمایش داده شده · ${formatDateLike(value)}` : "نمایش داده نشده";
}

function selectedSessionLabel(
  selectedTime: {
    shamsiDateLabel: string;
    timeLabel: string;
    startsAt: Date | string;
  } | null
) {
  if (!selectedTime) {
    return notRecorded;
  }

  return `${selectedTime.shamsiDateLabel} · ${selectedTime.timeLabel}`;
}

function categoriesLabel(categories: readonly { category: { labelFa: string; code: string | null } }[]) {
  return categories.map((item) => item.category.labelFa || item.category.code).filter(Boolean).join("، ") || notRecorded;
}

function repositoryPaymentStatusLabel(status: string) {
  if (status === "PENDING_REVIEW") {
    return "در انتظار بررسی پرداخت";
  }

  if (status === "PAID") {
    return "پرداخت شده";
  }

  if (status === "FAILED") {
    return "ناموفق";
  }

  return status;
}

function repositoryManualReviewStatusLabel(status: string) {
  if (status === "SUBMITTED" || status === "NEEDS_REVIEW") {
    return "در انتظار بررسی";
  }

  if (status === "APPROVED") {
    return "تأیید شده";
  }

  if (status === "REJECTED") {
    return "رد شده";
  }

  return status;
}

function methodLabel(method: string) {
  if (method === "CARD_TO_CARD") {
    return "پرداخت دستی";
  }

  if (method === "FREE") {
    return "بدون پرداخت";
  }

  if (method === "WALLET") {
    return "کیف پول";
  }

  return "پرداخت آنلاین";
}

function pricingExperienceLevelLabel(level: string | null) {
  if (!level) {
    return "همه سطح‌های تجربه";
  }

  const labels: Record<string, string> = {
    INTERN: "تازه‌کار",
    SPECIALIST: "متخصص",
    SENIOR_SPECIALIST: "متخصص ارشد",
    MIDDLE_MANAGER: "مدیر میانی",
    SENIOR_MANAGER: "مدیر ارشد",
    VP: "مدیر ارشد اجرایی",
    BUSINESS_MANAGER: "مدیر کسب‌وکار"
  };

  return labels[level] ?? level;
}

function pricingDurationLabel(duration: string | null) {
  if (duration === "MIN_30") {
    return "جلسه ۳۰ دقیقه‌ای";
  }

  if (duration === "MIN_60") {
    return "جلسه ۶۰ دقیقه‌ای";
  }

  return "همه مدت‌ها";
}

function pricingDurationValue(duration: string | null) {
  if (duration === "MIN_30") {
    return "30";
  }

  if (duration === "MIN_60") {
    return "60";
  }

  return "";
}

function pricingStateLabel(rule: { isActive: boolean; archivedAt: Date | string | null }) {
  if (rule.archivedAt) {
    return "آرشیوشده";
  }

  return rule.isActive ? "فعال" : "غیرفعال";
}

function pricingCommissionLabel(value: number) {
  return `${formatFaNumber(value / 100)}%`;
}

function pricingEffectiveWindowLabel(rule: { effectiveFrom: Date | string; effectiveTo: Date | string | null }) {
  return `${formatDateLike(rule.effectiveFrom)} تا ${rule.effectiveTo ? formatDateLike(rule.effectiveTo) : "بدون پایان"}`;
}

function isoDateInputValue(value: Date | string | null | undefined) {
  if (!value) {
    return "";
  }

  return new Date(value).toISOString().slice(0, 10);
}

function pricingCategoryLabel(
  jobField: string | null,
  categoryOptions: readonly PricingRuleCategoryOption[]
) {
  if (!jobField) {
    return "همه دسته‌های شغلی";
  }

  return categoryOptions.find((category) => category.code === jobField)?.labelFa ?? jobField;
}

function mapPricingCategoryOptions(categoryOptions: readonly PricingRuleCategoryOption[]): AdminPricingCategoryOption[] {
  return categoryOptions
    .filter((option): option is PricingRuleCategoryOption & { code: NonNullable<PricingRuleCategoryOption["code"]> } =>
      Boolean(option.code)
    )
    .map((option) => ({
      label: option.labelFa || option.code,
      value: option.code
    }));
}

function categoryStateLabel(category: Pick<AdminCategoryRecord, "isActive" | "archivedAt">) {
  if (category.archivedAt) {
    return "آرشیو شده";
  }

  return category.isActive ? "فعال" : "غیرفعال";
}

function categoryVisibilitySummary(category: Pick<AdminCategoryRecord, "showInDiscovery" | "showInInsights" | "showInPricing">) {
  const visible = [
    category.showInDiscovery ? "کشف تجربه" : null,
    category.showInInsights ? "بینش‌ها" : null,
    category.showInPricing ? "قیمت‌گذاری" : null
  ].filter(Boolean);

  return visible.length ? visible.join("، ") : "نمایش فعال ندارد";
}

function actorSummary(actor: { displayName: string; role: string } | null) {
  return actor ? `${actor.displayName} · ${actor.role}` : notRecorded;
}

function mapCategoryParentOptions(categories: readonly AdminCategoryRecord[], excludedId?: string): AdminCategoryOption[] {
  return categories
    .filter((category) => category.id !== excludedId && category.isActive && !category.archivedAt)
    .map((category) => ({
      label: category.labelFa,
      value: category.id
    }));
}

function mapAdminCategoryItem(category: AdminCategoryRecord, auditItems: readonly AdminAuditLogItem[] = []): AdminCategoryItem {
  return {
    id: category.id,
    slug: category.slug,
    titleFa: category.labelFa,
    titleEn: category.titleEn ?? "",
    descriptionFa: category.descriptionFa ?? "",
    parentLabel: category.parent?.labelFa ?? "بدون دسته بالادست",
    parentId: category.parentId ?? "",
    sortOrder: category.sortOrder,
    jobFieldCode: category.code ?? "",
    jobFieldLabel: category.code ?? "بدون اتصال به JobField",
    activeLabel: categoryStateLabel(category),
    isActive: category.isActive,
    isArchived: Boolean(category.archivedAt),
    showInDiscovery: category.showInDiscovery,
    showInInsights: category.showInInsights,
    showInPricing: category.showInPricing,
    visibilitySummary: categoryVisibilitySummary(category),
    profileCountLabel: countLabel(category._count.profiles),
    profileCount: category._count.profiles,
    insightCountLabel: countLabel(category.insightCount),
    insightCount: category.insightCount,
    pricingRuleCountLabel: countLabel(category.pricingRuleCount),
    pricingRuleCount: category.pricingRuleCount,
    childCountLabel: countLabel(category._count.children),
    childCount: category._count.children,
    createdBySummary: actorSummary(category.createdByAdmin),
    updatedBySummary: actorSummary(category.updatedByAdmin),
    createdAt: formatDateLike(category.createdAt),
    updatedAt: formatDateLike(category.updatedAt),
    archivedAt: category.archivedAt ? formatDateLike(category.archivedAt) : notRecorded,
    href: `/admin/categories/${category.id}`,
    source: "backend_repository",
    actionsAvailable: !category.archivedAt,
    auditItems
  };
}

function contentBodySummary(body: string) {
  const normalized = body.replace(/\s+/g, " ").trim();
  return normalized.length > 180 ? `${normalized.slice(0, 177)}...` : normalized;
}

function mapAdminContentEntryItem(
  entry: AdminContentEntryRecord,
  auditItems: readonly AdminAuditLogItem[] = []
): AdminContentEntryItem {
  return {
    id: entry.id,
    key: entry.key,
    namespace: entry.namespace,
    locale: entry.locale,
    title: entry.title,
    bodySummary: contentBodySummary(entry.body),
    bodyValue: entry.body,
    shortText: entry.shortText ?? "",
    description: entry.description ?? "",
    contentType: entry.contentType,
    contentTypeLabel: contentTypeLabels[entry.contentType],
    status: entry.status,
    statusLabel: contentStatusLabels[entry.status],
    isEditable: entry.isEditable,
    isSystem: entry.isSystem,
    editableLabel: entry.isEditable ? "قابل ویرایش" : "غیرقابل ویرایش",
    systemLabel: entry.isSystem ? "سیستمی" : "مدیریت‌شده",
    createdBySummary: entry.createdByAdmin?.displayName ?? entry.createdByAdminId ?? notRecorded,
    updatedBySummary: entry.updatedByAdmin?.displayName ?? entry.updatedByAdminId ?? notRecorded,
    createdAt: formatDateLike(entry.createdAt),
    updatedAt: formatDateLike(entry.updatedAt),
    archivedAt: formatDateLike(entry.archivedAt),
    href: `/admin/content/${entry.id}`,
    source: "backend_repository",
    actionsAvailable: entry.isEditable && !entry.archivedAt,
    auditItems
  };
}

function supportTicketPreview(description: string) {
  const normalized = description.replace(/\s+/g, " ").trim();
  return normalized.length > 160 ? `${normalized.slice(0, 157)}...` : normalized;
}

function supportParticipantSummary(user: { id: string; displayName: string | null; email?: string | null; role?: string | null } | null) {
  if (!user) {
    return notRecorded;
  }

  return `${safeText(user.displayName, user.email ?? user.id)} · ${user.id}`;
}

function supportRelatedHref(type: SupportRelatedEntityType | null, id: string | null) {
  if (!type || !id || type === "NONE") {
    return undefined;
  }

  if (type === "USER") {
    return `/admin/users/${id}`;
  }

  if (type === "CONVERSATION") {
    return `/admin/conversations/${id}`;
  }

  if (type === "PAYMENT") {
    return `/admin/payments/${id}`;
  }

  if (type === "PROFILE") {
    return `/admin/experience-profiles/${id}`;
  }

  if (type === "INSIGHT") {
    return `/admin/insights/${id}`;
  }

  if (type === "CONTENT_ENTRY") {
    return `/admin/content/${id}`;
  }

  return undefined;
}

function supportAgeLabel(createdAt: Date | string) {
  const created = createdAt instanceof Date ? createdAt : new Date(createdAt);
  const time = created.getTime();

  if (Number.isNaN(time)) {
    return notRecorded;
  }

  const days = Math.max(0, Math.floor((Date.now() - time) / 86_400_000));

  if (days === 0) {
    return "امروز";
  }

  return `${formatFaNumber(days)} روز`;
}

function leadRelatedSummary(lead: AdminLeadRecord) {
  const parts = [
    lead.relatedUser ? `کاربر: ${safeText(lead.relatedUser.displayName, lead.relatedUser.email ?? lead.relatedUser.id)}` : null,
    lead.relatedConversation ? `گفت‌وگو: ${safeText(lead.relatedConversation.requestTopic, lead.relatedConversation.id)}` : null,
    lead.relatedProfile ? `پروفایل: ${lead.relatedProfile.displayName}` : null,
    lead.relatedInsight ? `بینش: ${lead.relatedInsight.title}` : null
  ].filter(Boolean);

  return parts.length ? parts.join(" / ") : notRecorded;
}

function mapAdminLeadItem(lead: AdminLeadRecord, auditItems: readonly AdminAuditLogItem[] = []): AdminLeadItem {
  const fullName = `${lead.firstName} ${lead.lastName}`.trim();
  const contact = [lead.phone, lead.email].filter(Boolean).join(" / ");
  const jobCategory = lead.jobCategoryRecord?.labelFa ?? lead.jobCategory ?? notRecorded;

  return {
    id: lead.id,
    leadNumber: lead.leadNumber,
    fullName,
    phone: lead.phone ?? notRecorded,
    email: lead.email ?? notRecorded,
    contactSummary: contact || notRecorded,
    companySummary: lead.lastCompany ?? notRecorded,
    jobTitle: lead.jobTitle ?? notRecorded,
    jobCategory,
    yearsOfExperienceLabel: lead.yearsOfExperience === null ? notRecorded : `${formatFaNumber(lead.yearsOfExperience)} سال`,
    leadType: lead.leadType,
    leadTypeLabel: leadTypeLabels[lead.leadType],
    temperature: lead.temperature,
    temperatureLabel: leadTemperatureLabels[lead.temperature],
    stage: lead.stage,
    stageLabel: leadStageLabels[lead.stage],
    sourceCode: lead.source,
    sourceLabel: leadSourceLabels[lead.source],
    ownerSummary: supportParticipantSummary(lead.ownerAdmin),
    ownerAdminId: lead.ownerAdminId ?? "",
    relatedUserHref: lead.relatedUserId ? `/admin/users/${lead.relatedUserId}` : undefined,
    relatedConversationHref: lead.relatedConversationId ? `/admin/conversations/${lead.relatedConversationId}` : undefined,
    relatedProfileHref: lead.relatedProfileId ? `/admin/experience-profiles/${lead.relatedProfileId}` : undefined,
    relatedInsightHref: lead.relatedInsightId ? `/admin/insights/${lead.relatedInsightId}` : undefined,
    relatedSummary: leadRelatedSummary(lead),
    intentSummary: lead.intentSummary ?? notRecorded,
    blocker: lead.blocker ?? notRecorded,
    notes: lead.notes ?? notRecorded,
    scoreValue: lead.score,
    scoreLabel: lead.score === null ? notRecorded : formatFaNumber(lead.score),
    lastContactedAt: formatDateLike(lead.lastContactedAt),
    nextFollowUpAt: formatDateLike(lead.nextFollowUpAt),
    followUpCountLabel: formatFaNumber(lead.followUpCount),
    lastFollowUpOutcome: lead.lastFollowUpOutcome ? leadFollowUpOutcomeLabels[lead.lastFollowUpOutcome] : notRecorded,
    convertedAt: formatDateLike(lead.convertedAt),
    lostAt: formatDateLike(lead.lostAt),
    lostReason: lead.lostReason ?? notRecorded,
    archivedAt: formatDateLike(lead.archivedAt),
    createdAt: formatDateLike(lead.createdAt),
    updatedAt: formatDateLike(lead.updatedAt),
    href: `/admin/leads/${lead.id}`,
    source: "backend_repository",
    actionsAvailable: !lead.archivedAt && lead.stage !== "ARCHIVED",
    tags: lead.tagAssignments.map((assignment) => ({
      id: assignment.id,
      tagId: assignment.tagId,
      name: assignment.tag.name,
      normalizedName: assignment.tag.normalizedName
    })),
    leadNotes: lead.leadNotes.map((note) => ({
      id: note.id,
      body: note.body,
      noteType: note.noteType,
      createdBySummary: supportParticipantSummary(note.createdByAdmin),
      createdAt: formatDateLike(note.createdAt)
    })),
    followUps: lead.followUps.map((followUp) => ({
      id: followUp.id,
      channel: followUp.channel,
      channelLabel: leadFollowUpChannelLabels[followUp.channel],
      scheduledAt: formatDateLike(followUp.scheduledAt),
      completedAt: formatDateLike(followUp.completedAt),
      outcome: followUp.outcome ?? "",
      outcomeLabel: followUp.outcome ? leadFollowUpOutcomeLabels[followUp.outcome] : notRecorded,
      summary: followUp.summary ?? notRecorded,
      createdBySummary: supportParticipantSummary(followUp.createdByAdmin),
      completedBySummary: supportParticipantSummary(followUp.completedByAdmin)
    })),
    auditItems
  };
}

function leadRepositoryFilters(viewer: Viewer, filters: ReturnType<typeof parseAdminLeadFilters>): AdminLeadFilters {
  const repositoryFilters: AdminLeadFilters = {
    stage: (filters.stage || null) as LeadStage | null,
    temperature: (filters.temperature || null) as LeadTemperature | null,
    leadType: (filters.leadType || null) as LeadType | null,
    source: (filters.source || null) as LeadSource | null,
    ownerAdminId: filters.owner === "me" ? viewer.id : null,
    unassigned: filters.owner === "unassigned" ? true : null,
    includeArchived: filters.stage === "ARCHIVED" || filters.view === "archived" ? true : null,
    search: filters.search || null
  };

  if (filters.view === "new" && !repositoryFilters.stage) {
    repositoryFilters.stage = "NEW";
  }

  if (filters.view === "mine") {
    repositoryFilters.ownerAdminId = viewer.id;
  }

  if (filters.view === "unassigned") {
    repositoryFilters.unassigned = true;
  }

  if (filters.view === "hot" && !repositoryFilters.temperature) {
    repositoryFilters.temperature = "HOT";
  }

  if (filters.view === "qualified" && !repositoryFilters.stage) {
    repositoryFilters.stage = "QUALIFIED";
  }

  if (filters.view === "follow_up") {
    repositoryFilters.stage = "FOLLOW_UP";
  }

  if (filters.view === "converted") {
    repositoryFilters.stage = "CONVERTED";
  }

  if (filters.view === "lost") {
    repositoryFilters.stage = "LOST";
  }

  if (filters.view === "archived") {
    repositoryFilters.stage = "ARCHIVED";
    repositoryFilters.includeArchived = true;
  }

  return repositoryFilters;
}

function mapLeadQueueOptions(filters: ReturnType<typeof parseAdminLeadFilters>): AdminLeadFilterOption[] {
  return leadQueueViews.map((option) =>
    mapLeadFilterOption(option.label, option.value, filters.view === option.value, {
      ...filters,
      view: option.value
    })
  );
}

function mapLeadStageOptions(filters: ReturnType<typeof parseAdminLeadFilters>): AdminLeadFilterOption[] {
  return [
    mapLeadFilterOption("همه وضعیت‌ها", "", !filters.stage, { ...filters, stage: "" }),
    ...Object.values(LeadStage).map((stage) =>
      mapLeadFilterOption(leadStageLabels[stage], stage, filters.stage === stage, { ...filters, stage })
    )
  ];
}

function mapLeadTemperatureOptions(filters: ReturnType<typeof parseAdminLeadFilters>): AdminLeadFilterOption[] {
  return [
    mapLeadFilterOption("همه دماها", "", !filters.temperature, { ...filters, temperature: "" }),
    ...Object.values(LeadTemperature).map((temperature) =>
      mapLeadFilterOption(leadTemperatureLabels[temperature], temperature, filters.temperature === temperature, {
        ...filters,
        temperature
      })
    )
  ];
}

function mapLeadTypeOptions(filters: ReturnType<typeof parseAdminLeadFilters>): AdminLeadFilterOption[] {
  return [
    mapLeadFilterOption("همه نوع‌ها", "", !filters.leadType, { ...filters, leadType: "" }),
    ...Object.values(LeadType).map((leadType) =>
      mapLeadFilterOption(leadTypeLabels[leadType], leadType, filters.leadType === leadType, { ...filters, leadType })
    )
  ];
}

function mapLeadSourceOptions(filters: ReturnType<typeof parseAdminLeadFilters>): AdminLeadFilterOption[] {
  return [
    mapLeadFilterOption("همه منابع", "", !filters.source, { ...filters, source: "" }),
    ...Object.values(LeadSource).map((source) =>
      mapLeadFilterOption(leadSourceLabels[source], source, filters.source === source, { ...filters, source })
    )
  ];
}

function mapAdminSupportTicketItem(
  ticket: AdminSupportTicketRecord,
  auditItems: readonly AdminAuditLogItem[] = []
): AdminSupportTicketItem {
  const relatedEntityLabel = ticket.relatedEntityType ? supportRelatedEntityLabels[ticket.relatedEntityType] : "بدون ارتباط";

  return {
    id: ticket.id,
    ticketNumber: ticket.ticketNumber,
    subject: ticket.subject,
    description: ticket.description,
    preview: supportTicketPreview(ticket.description),
    status: ticket.status,
    statusLabel: supportStatusLabels[ticket.status],
    priority: ticket.priority,
    priorityLabel: supportPriorityLabels[ticket.priority],
    category: ticket.category,
    categoryLabel: supportCategoryLabels[ticket.category],
    subcategory: ticket.subcategory ?? notRecorded,
    sourceCode: ticket.source,
    sourceLabel: supportSourceLabels[ticket.source],
    requesterSummary: supportParticipantSummary(ticket.requesterUser),
    requesterHref: ticket.requesterUserId ? `/admin/users/${ticket.requesterUserId}` : undefined,
    assigneeSummary: supportParticipantSummary(ticket.assigneeAdmin),
    relatedEntityType: ticket.relatedEntityType ?? "NONE",
    relatedEntityLabel,
    relatedEntityId: ticket.relatedEntityId ?? notRecorded,
    relatedEntityHref: supportRelatedHref(ticket.relatedEntityType, ticket.relatedEntityId),
    resolutionSummary: ticket.resolutionSummary ?? notRecorded,
    resolutionReason: ticket.resolutionReason ?? notRecorded,
    createdAt: formatDateLike(ticket.createdAt),
    updatedAt: formatDateLike(ticket.updatedAt),
    resolvedAt: formatDateLike(ticket.resolvedAt),
    archivedAt: formatDateLike(ticket.archivedAt),
    ageLabel: supportAgeLabel(ticket.createdAt),
    href: `/admin/support/${ticket.id}`,
    source: "backend_repository",
    actionsAvailable: !ticket.archivedAt && ticket.status !== "ARCHIVED",
    notes: ticket.notes.map((note) => ({
      id: note.id,
      body: note.body,
      noteType: note.noteType,
      noteTypeLabel: supportNoteTypeLabels[note.noteType],
      createdBySummary: supportParticipantSummary(note.createdByAdmin),
      createdAt: formatDateLike(note.createdAt)
    })),
    auditItems
  };
}

function supportRepositoryFilters(viewer: Viewer, filters: ReturnType<typeof parseAdminSupportFilters>) {
  const repositoryFilters = {
    status: (filters.status || null) as SupportTicketStatus | null,
    priority: (filters.priority || null) as SupportTicketPriority | null,
    category: (filters.category || null) as SupportTicketCategory | null,
    source: (filters.source || null) as SupportTicketSource | null,
    relatedEntityType: (filters.relatedEntityType || null) as SupportRelatedEntityType | null,
    assigneeAdminId: filters.assignee === "me" ? viewer.id : null,
    unassigned: filters.assignee === "unassigned" ? true : null,
    includeArchived: filters.status === "ARCHIVED" || filters.view === "archived" ? true : null,
    search: filters.search || null
  };

  if (filters.view === "new" && !repositoryFilters.status) {
    repositoryFilters.status = "NEW";
  }

  if (filters.view === "unassigned") {
    repositoryFilters.unassigned = true;
  }

  if (filters.view === "mine") {
    repositoryFilters.assigneeAdminId = viewer.id;
  }

  if (filters.view === "urgent" && !repositoryFilters.priority) {
    repositoryFilters.priority = "URGENT";
  }

  if (filters.view === "waiting_user" && !repositoryFilters.status) {
    repositoryFilters.status = "WAITING_FOR_USER";
  }

  if (filters.view === "waiting_provider" && !repositoryFilters.status) {
    repositoryFilters.status = "WAITING_FOR_PROVIDER";
  }

  if (filters.view === "escalated" && !repositoryFilters.status) {
    repositoryFilters.status = "ESCALATED";
  }

  if (filters.view === "payment" && !repositoryFilters.category) {
    repositoryFilters.category = "PAYMENT";
  }

  if (filters.view === "conversation" && !repositoryFilters.category) {
    repositoryFilters.category = "CONVERSATION";
  }

  if (filters.view === "profile" && !repositoryFilters.category) {
    repositoryFilters.category = "PROFILE_EXPERIENCE_CREATOR";
  }

  if (filters.view === "insight" && !repositoryFilters.category) {
    repositoryFilters.category = "INSIGHT_CONTENT";
  }

  if (filters.view === "resolved" && !repositoryFilters.status) {
    repositoryFilters.status = "RESOLVED";
  }

  if (filters.view === "archived") {
    repositoryFilters.status = "ARCHIVED";
    repositoryFilters.includeArchived = true;
  }

  return repositoryFilters;
}

function mapSupportQueueOptions(filters: ReturnType<typeof parseAdminSupportFilters>): AdminSupportFilterOption[] {
  return supportQueueViews.map((option) =>
    mapSupportFilterOption(option.label, option.value, filters.view === option.value, {
      ...filters,
      view: option.value
    })
  );
}

function mapSupportStatusOptions(filters: ReturnType<typeof parseAdminSupportFilters>): AdminSupportFilterOption[] {
  return [
    mapSupportFilterOption("همه وضعیت‌ها", "", !filters.status, { ...filters, status: "" }),
    ...Object.values(SupportTicketStatus).map((status) =>
      mapSupportFilterOption(supportStatusLabels[status], status, filters.status === status, { ...filters, status })
    )
  ];
}

function mapSupportPriorityOptions(filters: ReturnType<typeof parseAdminSupportFilters>): AdminSupportFilterOption[] {
  return [
    mapSupportFilterOption("همه اولویت‌ها", "", !filters.priority, { ...filters, priority: "" }),
    ...Object.values(SupportTicketPriority).map((priority) =>
      mapSupportFilterOption(supportPriorityLabels[priority], priority, filters.priority === priority, { ...filters, priority })
    )
  ];
}

function mapSupportCategoryOptions(filters: ReturnType<typeof parseAdminSupportFilters>): AdminSupportFilterOption[] {
  return [
    mapSupportFilterOption("همه دسته‌ها", "", !filters.category, { ...filters, category: "" }),
    ...Object.values(SupportTicketCategory).map((category) =>
      mapSupportFilterOption(supportCategoryLabels[category], category, filters.category === category, { ...filters, category })
    )
  ];
}

function mapSupportSourceOptions(filters: ReturnType<typeof parseAdminSupportFilters>): AdminSupportFilterOption[] {
  return [
    mapSupportFilterOption("همه منابع", "", !filters.source, { ...filters, source: "" }),
    ...Object.values(SupportTicketSource).map((source) =>
      mapSupportFilterOption(supportSourceLabels[source], source, filters.source === source, { ...filters, source })
    )
  ];
}

function mapSupportRelatedEntityOptions(filters: ReturnType<typeof parseAdminSupportFilters>): AdminSupportFilterOption[] {
  return [
    mapSupportFilterOption("همه ارتباط‌ها", "", !filters.relatedEntityType, { ...filters, relatedEntityType: "" }),
    ...Object.values(SupportRelatedEntityType).map((type) =>
      mapSupportFilterOption(supportRelatedEntityLabels[type], type, filters.relatedEntityType === type, { ...filters, relatedEntityType: type })
    )
  ];
}

function supportTicketIsOpen(ticket: AdminSupportTicketRecord) {
  return !ticket.archivedAt && ticket.status !== "ARCHIVED" && ticket.status !== "RESOLVED";
}

function isSameDay(first: Date | string | null, second: Date) {
  if (!first) {
    return false;
  }

  const date = first instanceof Date ? first : new Date(first);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  return date.toISOString().slice(0, 10) === second.toISOString().slice(0, 10);
}

function buildSupportMetrics(tickets: readonly AdminSupportTicketRecord[]): AdminMetric[] {
  const now = new Date();
  const agingThreshold = now.getTime() - 72 * 60 * 60 * 1000;

  const metric = (id: string, label: string, value: number, helper: string, href?: string): AdminMetric => ({
    id,
    label,
    value: countLabel(value),
    helper,
    href,
    source: "backend_repository"
  });

  return [
    metric("support-open", "تیکت‌های باز", tickets.filter(supportTicketIsOpen).length, "بدون ردیف نمایشی", "/admin/support"),
    metric("support-urgent", "فوری", tickets.filter((ticket) => supportTicketIsOpen(ticket) && ticket.priority === "URGENT").length, "اولویت فوری", adminSupportHref({ view: "urgent" })),
    metric("support-unassigned", "بدون مسئول", tickets.filter((ticket) => supportTicketIsOpen(ticket) && !ticket.assigneeAdminId).length, "برای triage", adminSupportHref({ view: "unassigned" })),
    metric("support-waiting-user", "در انتظار کاربر", tickets.filter((ticket) => ticket.status === "WAITING_FOR_USER").length, "بدون ارسال پیام خودکار", adminSupportHref({ view: "waiting_user" })),
    metric("support-waiting-provider", "در انتظار تجربه‌آفرین", tickets.filter((ticket) => ticket.status === "WAITING_FOR_PROVIDER").length, "بدون اعلان خودکار", adminSupportHref({ view: "waiting_provider" })),
    metric("support-escalated", "ارجاع‌شده", tickets.filter((ticket) => ticket.status === "ESCALATED").length, "نیازمند تصمیم ادمین", adminSupportHref({ view: "escalated" })),
    metric("support-resolved-today", "حل‌شده امروز", tickets.filter((ticket) => isSameDay(ticket.resolvedAt, now)).length, "براساس resolvedAt", adminSupportHref({ view: "resolved" })),
    metric("support-aging", "بیش از ۷۲ ساعت", tickets.filter((ticket) => supportTicketIsOpen(ticket) && new Date(ticket.createdAt).getTime() < agingThreshold).length, "تیکت‌های باز قدیمی‌تر", "/admin/support")
  ];
}

function buildLeadMetrics(leads: readonly AdminLeadRecord[]): AdminMetric[] {
  const activeLeads = leads.filter((lead) => !lead.archivedAt && lead.stage !== "ARCHIVED");
  const metric = (id: string, label: string, value: number, helper: string, href?: string): AdminMetric => ({
    id,
    label,
    value: countLabel(value),
    helper,
    href,
    source: "backend_repository"
  });

  return [
    metric("active-leads", "سرنخ‌های فعال", activeLeads.length, "ردیف‌های Lead فعال از پایگاه داده.", "/admin/leads"),
    metric("hot-leads", "سرنخ‌های داغ", leads.filter((lead) => lead.temperature === "HOT").length, "دمای HOT برای پیگیری سریع.", adminLeadHref({ view: "hot" })),
    metric(
      "follow-up-leads",
      "نیازمند پیگیری",
      leads.filter((lead) => lead.stage === "FOLLOW_UP").length,
      "سرنخ‌هایی که پیگیری بعدی دارند.",
      adminLeadHref({ view: "follow_up" })
    ),
    metric(
      "unassigned-leads",
      "بدون مسئول",
      activeLeads.filter((lead) => !lead.ownerAdminId).length,
      "سرنخ‌های فعال بدون مسئول.",
      adminLeadHref({ view: "unassigned" })
    ),
    metric(
      "converted-leads",
      "تبدیل‌شده",
      leads.filter((lead) => lead.stage === "CONVERTED").length,
      "تبدیل‌ها فقط وضعیت Lead را نشان می‌دهند.",
      adminLeadHref({ view: "converted" })
    ),
    metric(
      "lost-leads",
      "از دست‌رفته",
      leads.filter((lead) => lead.stage === "LOST").length,
      "دلایل lost در جزئیات Lead ثبت می‌شود.",
      adminLeadHref({ view: "lost" })
    )
  ];
}

function mapContentNamespaceOptions(
  filters: ReturnType<typeof parseAdminContentFilters>,
  entries: readonly AdminContentEntryRecord[]
): AdminContentFilterOption[] {
  const namespaces = Array.from(new Set([...contentDefaultNamespaces, ...entries.map((entry) => entry.namespace)])).sort();

  return [
    mapContentFilterOption("همه فضاها", "", !filters.namespace, {
      contentType: filters.contentType,
      status: filters.status,
      search: filters.search
    }),
    ...namespaces.map((namespace) =>
      mapContentFilterOption(namespace, namespace, filters.namespace === namespace, {
        namespace,
        contentType: filters.contentType,
        status: filters.status,
        search: filters.search
      })
    )
  ];
}

function mapContentTypeOptions(filters: ReturnType<typeof parseAdminContentFilters>): AdminContentFilterOption[] {
  return [
    mapContentFilterOption("همه نوع‌ها", "", !filters.contentType, {
      namespace: filters.namespace,
      status: filters.status,
      search: filters.search
    }),
    ...Object.values(ContentEntryType).map((contentType) =>
      mapContentFilterOption(contentTypeLabels[contentType], contentType, filters.contentType === contentType, {
        namespace: filters.namespace,
        contentType,
        status: filters.status,
        search: filters.search
      })
    )
  ];
}

function mapContentStatusOptions(filters: ReturnType<typeof parseAdminContentFilters>): AdminContentFilterOption[] {
  return [
    mapContentFilterOption("همه وضعیت‌ها", "", !filters.status, {
      namespace: filters.namespace,
      contentType: filters.contentType,
      search: filters.search
    }),
    ...Object.values(ContentEntryStatus).map((status) =>
      mapContentFilterOption(contentStatusLabels[status], status, filters.status === status, {
        namespace: filters.namespace,
        contentType: filters.contentType,
        status,
        search: filters.search
      })
    )
  ];
}

function sourceHelper(source: AdminDataSource) {
  if (source === "backend_repository") {
    return "داده متصل به پایگاه داده";
  }

  if (source === "local_demo") {
    return "داده محلی / نمایشی";
  }

  return "پیاده‌سازی نشده";
}

function profileCompletionLabel(user: RepositoryUserRow | RepositoryUserDetail) {
  let score = 0;

  if (user.displayName) score += 25;
  if (user.email) score += 25;
  if (user.profile?.status && user.profile.status !== "NONE") score += 25;
  if (user.profile?.professionalSummary) score += 25;

  return `${formatFaNumber(score)}%`;
}

function experienceReadinessLabel(
  profile: {
    publicProfessionalSummary?: string | null;
    categories?: readonly unknown[];
    price30Toman?: number | null;
    price60Toman?: number | null;
    freeHelp?: boolean;
    status?: string;
  } | null
) {
  if (!profile) {
    return "0%";
  }

  let score = 20;
  if (profile.publicProfessionalSummary) score += 20;
  if ((profile.categories?.length ?? 0) > 0) score += 20;
  if (profile.price30Toman || profile.price60Toman || profile.freeHelp) score += 20;
  if (profile.status === "ACTIVE") score += 20;

  return `${formatFaNumber(score)}%`;
}

function reviewStatusLabel(status: string) {
  if (status === "PENDING_REVIEW") {
    return "در بررسی";
  }

  if (status === "ACTIVE") {
    return "تأیید شده";
  }

  if (status === "NEEDS_CHANGES") {
    return "نیازمند اصلاح";
  }

  if (status === "INACTIVE") {
    return "مخفی از نمایش";
  }

  return status;
}

function insightPublicationStatusLabel(status: string) {
  if (status === "PUBLISHED") {
    return "منتشر شده";
  }

  if (status === "HIDDEN") {
    return "مخفی شده";
  }

  if (status === "ARCHIVED") {
    return "حذف نرم";
  }

  if (status === "DRAFT") {
    return "پیش‌نویس";
  }

  return status;
}

function insightModerationStatusLabel(status: string) {
  if (status === "PUBLISHED") {
    return "بدون محدودیت";
  }

  if (status === "HIDDEN") {
    return "مخفی‌کردن";
  }

  if (status === "ARCHIVED") {
    return "حذف نرم";
  }

  return "نیازمند بررسی";
}

function insightAnswerStatusLabel(status: string) {
  if (status === "APPROVED") {
    return "منتشر شده";
  }

  if (status === "SUBMITTED") {
    return "در بررسی";
  }

  if (status === "HIDDEN") {
    return "مخفی شده";
  }

  if (status === "REJECTED") {
    return "رد شده";
  }

  if (status === "DRAFT") {
    return "پیش‌نویس";
  }

  return status;
}

function supportReviewLabel(status: string) {
  if (status === "UNDER_SUPPORT_REVIEW" || status === "REQUESTED") {
    return "در بررسی پشتیبانی";
  }

  if (status === "COMPLETED") {
    return "بررسی شده";
  }

  if (status === "REJECTED") {
    return "رد شده";
  }

  return status;
}

function mapRepositoryPaymentItem(review: RepositoryPaymentReview): AdminPaymentQueueItem {
  return {
    id: review.id,
    paymentId: review.payment.id,
    conversationId: review.payment.conversationId,
    requestTopic: safeText(review.payment.conversation.requestTopic, "درخواست گفت‌وگو"),
    requesterSummary: `${review.payment.conversation.requesterId} · درخواست‌دهنده`,
    providerSummary: `${review.payment.conversation.providerId} · تجربه‌آفرین`,
    amountLabel: amountLabel(review.payment.amountToman),
    methodLabel: methodLabel(review.payment.method),
    paymentStatusLabel: repositoryPaymentStatusLabel(review.payment.status),
    manualReviewStatusLabel: repositoryManualReviewStatusLabel(review.status),
    conversationStatusLabel: review.payment.conversation.status,
    providerVisibilityLabel: providerVisibilityLabel(review.payment.conversation.providerVisibleAt),
    submittedAt: formatDateLike(review.submittedAt),
    referenceSummary: review.referenceNumber ? "شماره مرجع ثبت شده" : "شماره مرجع ثبت نشده",
    receiptSummary: review.receiptFileName ? "رسید پیوست شده" : "رسید پیوست نشده",
    source: "backend_repository",
    actionsAvailable: review.status === "SUBMITTED" || review.status === "NEEDS_REVIEW"
  };
}

function auditActionLabel(action: string) {
  if (action === "PAYMENT_MANUAL_APPROVED") {
    return "تأیید پرداخت";
  }

  if (action === "PAYMENT_MANUAL_REJECTED") {
    return "رد پرداخت";
  }

  if (action === "CANCELLATION_SUPPORT_CREDIT_APPROVED") {
    return "تأیید اعتبار لغو";
  }

  if (action === "CANCELLATION_SUPPORT_CREDIT_REJECTED") {
    return "رد اعتبار لغو";
  }

  if (action === "EXPERIENCE_PROFILE_APPROVED") {
    return "تأیید پروفایل تجربه";
  }

  if (action === "EXPERIENCE_PROFILE_CHANGES_REQUESTED") {
    return "درخواست اصلاح پروفایل تجربه";
  }

  if (action === "EXPERIENCE_PROFILE_HIDDEN") {
    return "مخفی‌سازی پروفایل تجربه";
  }

  if (action === "INSIGHT_HIDDEN") {
    return "مخفی‌کردن بینش";
  }

  if (action === "INSIGHT_RESTORED") {
    return "بازگردانی بینش";
  }

  if (action === "INSIGHT_DELETED") {
    return "حذف نرم بینش";
  }

  if (action === "INSIGHT_ANSWER_HIDDEN") {
    return "مخفی‌کردن پاسخ کوتاه";
  }

  if (action === "PRICING_RULE_CREATED") {
    return "ثبت قانون قیمت‌گذاری";
  }

  if (action === "PRICING_RULE_UPDATED") {
    return "ویرایش قانون قیمت‌گذاری";
  }

  if (action === "PRICING_RULE_DEACTIVATED") {
    return "غیرفعال‌سازی قانون قیمت‌گذاری";
  }

  if (action === "CATEGORY_CREATED") {
    return "ثبت دسته شغلی";
  }

  if (action === "CATEGORY_UPDATED") {
    return "ویرایش دسته شغلی";
  }

  if (action === "CATEGORY_ARCHIVED") {
    return "آرشیو دسته شغلی";
  }

  if (action === "CATEGORY_RESTORED") {
    return "بازفعال‌سازی دسته شغلی";
  }

  if (action === "CONTENT_ENTRY_CREATED") {
    return "ثبت محتوای مدیریت‌شده";
  }

  if (action === "CONTENT_ENTRY_UPDATED") {
    return "ویرایش محتوای مدیریت‌شده";
  }

  if (action === "CONTENT_ENTRY_ARCHIVED") {
    return "آرشیو محتوای مدیریت‌شده";
  }

  if (action === "CONTENT_ENTRY_RESTORED") {
    return "بازگردانی محتوای مدیریت‌شده";
  }

  if (action === "SUPPORT_TICKET_CREATED") {
    return "ثبت تیکت پشتیبانی";
  }

  if (action === "SUPPORT_TICKET_UPDATED") {
    return "ویرایش تیکت پشتیبانی";
  }

  if (action === "SUPPORT_TICKET_ASSIGNED") {
    return "تخصیص تیکت پشتیبانی";
  }

  if (action === "SUPPORT_TICKET_STATUS_CHANGED") {
    return "تغییر وضعیت تیکت پشتیبانی";
  }

  if (action === "SUPPORT_TICKET_PRIORITY_CHANGED") {
    return "تغییر اولویت تیکت پشتیبانی";
  }

  if (action === "SUPPORT_TICKET_CATEGORY_CHANGED") {
    return "تغییر دسته تیکت پشتیبانی";
  }

  if (action === "SUPPORT_TICKET_NOTE_ADDED") {
    return "افزودن یادداشت پشتیبانی";
  }

  if (action === "SUPPORT_TICKET_RESOLVED") {
    return "حل تیکت پشتیبانی";
  }

  if (action === "SUPPORT_TICKET_REOPENED") {
    return "بازگشایی تیکت پشتیبانی";
  }

  if (action === "SUPPORT_TICKET_ARCHIVED") {
    return "آرشیو تیکت پشتیبانی";
  }

  if (action === "LEAD_CREATED") {
    return "ثبت سرنخ";
  }

  if (action === "LEAD_UPDATED") {
    return "ویرایش سرنخ";
  }

  if (action === "LEAD_ASSIGNED") {
    return "تخصیص سرنخ";
  }

  if (action === "LEAD_TAG_ADDED") {
    return "افزودن برچسب سرنخ";
  }

  if (action === "LEAD_TAG_REMOVED") {
    return "حذف برچسب سرنخ";
  }

  if (action === "LEAD_NOTE_ADDED") {
    return "افزودن یادداشت سرنخ";
  }

  if (action === "LEAD_FOLLOW_UP_SCHEDULED") {
    return "زمان‌بندی پیگیری سرنخ";
  }

  if (action === "LEAD_FOLLOW_UP_COMPLETED") {
    return "ثبت نتیجه پیگیری سرنخ";
  }

  if (action === "LEAD_CONVERTED") {
    return "تبدیل سرنخ";
  }

  if (action === "LEAD_MARKED_LOST") {
    return "ثبت سرنخ از دست‌رفته";
  }

  if (action === "LEAD_REOPENED") {
    return "بازگشایی سرنخ";
  }

  if (action === "LEAD_ARCHIVED") {
    return "آرشیو سرنخ";
  }

  if (action === "LEAD_IMPORT_COMPLETED") {
    return "ورود گروهی سرنخ";
  }

  return action;
}

function mapAuditItem(row: {
  id: string;
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
}): AdminAuditLogItem {
  return {
    id: row.id,
    actorSummary: `${row.actorLabel} · ${row.actorRole}`,
    actionLabel: auditActionLabel(row.action),
    entitySummary: `${row.targetType} · ${row.targetId ?? "ثبت نشده"}`,
    statusChange: `${row.beforeStatus ?? "ثبت نشده"} → ${row.afterStatus ?? "ثبت نشده"}`,
    reason: row.reason ?? "ثبت نشده",
    note: row.note ?? "ثبت نشده",
    createdAt: formatDateLike(row.createdAt),
    paymentHref: row.relatedPaymentId ? `/admin/payments/${row.relatedPaymentId}` : undefined,
    conversationHref: row.relatedConversationId ? `/admin/conversations/${row.relatedConversationId}` : undefined,
    cancellationHref: row.targetType === "CANCELLATION" && row.targetId ? `/admin/cancellations/${row.targetId}` : undefined,
    profileHref: row.targetType === "EXPERIENCE_PROFILE" && row.targetId ? `/admin/experience-profiles/${row.targetId}` : undefined,
    insightHref: row.targetType === "INSIGHT" && row.targetId ? `/admin/insights/${row.targetId}` : undefined,
    pricingHref: row.targetType === "PRICING_RULE" && row.targetId ? `/admin/pricing/${row.targetId}` : undefined,
    categoryHref: row.targetType === "JOB_CATEGORY" && row.targetId ? `/admin/categories/${row.targetId}` : undefined,
    contentHref: row.targetType === "CONTENT_ENTRY" && row.targetId ? `/admin/content/${row.targetId}` : undefined,
    leadHref: row.targetType === "LEAD" && row.targetId ? `/admin/leads/${row.targetId}` : undefined,
    supportHref: row.targetType === "SUPPORT_TICKET" && row.targetId ? `/admin/support/${row.targetId}` : undefined,
    source: "backend_repository"
  };
}

function mapConversationRow(row: RepositoryConversationRow): AdminConversationListItem {
  const cancellation = row.cancellations[0];

  return {
    id: row.id,
    title: safeText(row.requestTopic, "گفت‌وگو"),
    requesterSummary: participantSummary(row.requester),
    providerSummary: participantSummary(row.provider),
    requestStatusLabel: row.status,
    paymentStatusLabel: row.payment?.status ?? row.paymentRequirement,
    attendanceStatusLabel: row.attendanceVerification?.status ?? "NOT_REQUIRED",
    cancellationStatusLabel: cancellation ? supportReviewLabel(cancellation.status) : "فعال نیست",
    createdAt: formatDateLike(row.createdAt),
    href: `/admin/conversations/${row.id}`,
    source: "backend_repository"
  };
}

function mapCancellationRow(row: RepositoryCancellationRow): AdminCancellationItem {
  const eligibleCreditAmountToman = eligibleCancellationCreditAmount(row);

  return {
    id: row.id,
    conversationId: row.conversationId,
    title: safeText(row.conversation.requestTopic, "لغو گفت‌وگو"),
    requesterSummary: participantSummary(row.conversation.requester),
    providerSummary: participantSummary(row.conversation.provider),
    reason: safeText(row.otherReasonText, row.reasonCode),
    stage: row.stage,
    supportStatus: supportReviewLabel(row.status),
    supportReviewReason: safeText(row.supportReviewReason),
    creditAmountLabel: amountLabel(row.refundAmountToman),
    eligibleCreditAmountLabel: amountLabel(eligibleCreditAmountToman),
    eligibleCreditAmountToman,
    paymentAmountLabel: amountLabel(row.conversation.payment?.amountToman ?? row.conversation.priceToman),
    paymentStatusLabel: row.conversation.payment?.status ?? row.conversation.paymentRequirement,
    conversationStatusLabel: row.conversation.status,
    selectedSession: selectedSessionLabel(row.conversation.selectedTime),
    actionsAvailable: row.status === "UNDER_SUPPORT_REVIEW",
    walletTransactionHref: row.requesterRefundWalletTransactionId ? "/admin/wallet-transactions" : undefined,
    createdAt: formatDateLike(row.createdAt),
    href: `/admin/cancellations/${row.id}`,
    source: "backend_repository"
  };
}

function mapUserRow(row: RepositoryUserRow): AdminUserItem {
  const conversationCount = row._count.sentConversations + row._count.receivedConversations;

  return {
    id: row.id,
    displayName: row.displayName,
    roleLabel: row.role,
    profileCompletion: profileCompletionLabel(row),
    accountStatus: "فعال",
    experienceProfileStatus: row.experienceProfile?.status ?? "ثبت نشده",
    conversationsCount: countLabel(conversationCount),
    href: `/admin/users/${row.id}`,
    source: "backend_repository"
  };
}

function mapExperienceProfileRow(row: RepositoryExperienceProfileRow): AdminExperienceProfileItem {
  return {
    id: row.id,
    displayName: row.displayName,
    roleLabel: row.roleTitle,
    categories: categoriesLabel(row.categories),
    pricing: `${amountLabel(row.price30Toman)} / ${amountLabel(row.price60Toman)}`,
    visibilityStatus: row.status === "ACTIVE" ? "فعال در کشف تجربه‌ها" : row.status === "INACTIVE" ? "مخفی از نمایش" : "غیرفعال",
    reviewStatus: reviewStatusLabel(row.status),
    readinessScore: experienceReadinessLabel(row),
    href: `/admin/experience-profiles/${row.id}`,
    source: "backend_repository"
  };
}

function mapExperienceProfileDetailItem(
  row: RepositoryExperienceProfileDetail,
  auditItems: readonly AdminAuditLogItem[] = []
): AdminExperienceProfileDetailItem {
  const item = mapExperienceProfileRow(row);

  return {
    ...item,
    ownerSummary: participantSummary(row.owner),
    ownerHref: `/admin/users/${row.ownerId}`,
    professionalSummary: row.publicProfessionalSummary,
    jobFieldLabel: row.jobField ?? notRecorded,
    orgLevelLabel: row.orgLevel,
    yearsOfExperienceLabel: countLabel(row.yearsOfExperience),
    freeHelpLabel: row.freeHelp ? "فعال" : "غیرفعال",
    price30Label: amountLabel(row.price30Toman),
    price60Label: amountLabel(row.price60Toman),
    reviewNote: safeText(row.reviewNote),
    relatedConversationsCount: countLabel(row._count.conversations),
    experienceAnswersCount: countLabel(row._count.experienceAnswers),
    officialInsightsCount: countLabel(row._count.officialInsights),
    createdAt: formatDateLike(row.createdAt),
    updatedAt: formatDateLike(row.updatedAt),
    actionsAvailable: {
      approve: row.status === "PENDING_REVIEW" || row.status === "NEEDS_CHANGES",
      requestChanges: row.status === "PENDING_REVIEW" || row.status === "ACTIVE",
      hide: row.status === "ACTIVE" || row.status === "PENDING_REVIEW" || row.status === "NEEDS_CHANGES"
    },
    auditItems
  };
}

function experienceProfileReviewSortValue(item: AdminExperienceProfileItem) {
  if (item.reviewStatus === "در بررسی") {
    return 0;
  }

  if (item.reviewStatus === "نیازمند اصلاح") {
    return 1;
  }

  if (item.reviewStatus === "مخفی از نمایش") {
    return 2;
  }

  return 3;
}

function insightAuthorSummary(author: { id: string; displayName: string } | null, authorUserId: string | null) {
  if (author) {
    return participantSummary(author);
  }

  return authorUserId ?? notRecorded;
}

function insightProfileSummary(profile: RepositoryInsightRow["experienceProfile"]) {
  if (!profile) {
    return notRecorded;
  }

  return `${profile.displayName} · ${profile.roleTitle}`;
}

function mapInsightRow(row: RepositoryInsightRow): AdminInsightItem {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    promptSummary: safeText(row.prompt),
    authorSummary: insightAuthorSummary(row.authorUser, row.authorUserId),
    authorHref: row.authorUserId ? `/admin/users/${row.authorUserId}` : undefined,
    profileSummary: insightProfileSummary(row.experienceProfile),
    categorySummary: row.experienceProfile ? categoriesLabel(row.experienceProfile.categories) : notRecorded,
    publicationStatus: insightPublicationStatusLabel(row.status),
    moderationStatus: insightModerationStatusLabel(row.status),
    answerCount: countLabel(row._count.answers),
    createdAt: formatDateLike(row.createdAt),
    updatedAt: formatDateLike(row.updatedAt),
    href: `/admin/insights/${row.id}`,
    source: "backend_repository"
  };
}

function mapInsightAnswerRow(answer: RepositoryInsightDetail["answers"][number]): AdminInsightDetailItem["answers"][number] {
  return {
    id: answer.id,
    questionSummary: safeText(answer.renderedQuestion),
    answerSummary: safeText(answer.answerText),
    authorSummary: participantSummary(answer.authorUser),
    profileSummary: answer.experienceProfile ? `${answer.experienceProfile.displayName} · ${answer.experienceProfile.roleTitle}` : notRecorded,
    statusLabel: insightAnswerStatusLabel(answer.status),
    submittedAt: formatDateLike(answer.submittedAt ?? answer.approvedAt ?? answer.createdAt),
    actionsAvailable: {
      hide: answer.status === "APPROVED" || answer.status === "SUBMITTED"
    }
  };
}

function mapInsightDetailItem(row: RepositoryInsightDetail, auditItems: readonly AdminAuditLogItem[] = []): AdminInsightDetailItem {
  return {
    ...mapInsightRow(row),
    bodySummary: safeText(row.body),
    publishedAt: formatDateLike(row.publishedAt),
    hiddenAt: formatDateLike(row.hiddenAt),
    actionsAvailable: {
      hide: row.status === "PUBLISHED",
      restore: row.status === "HIDDEN",
      delete: row.status !== "ARCHIVED"
    },
    answers: row.answers.map(mapInsightAnswerRow),
    auditItems
  };
}

function insightModerationSortValue(item: AdminInsightItem) {
  if (item.moderationStatus === "نیازمند بررسی") {
    return 0;
  }

  if (item.publicationStatus === "منتشر شده") {
    return 1;
  }

  if (item.publicationStatus === "مخفی شده") {
    return 2;
  }

  return 3;
}

function mapWalletTransactionRow(row: RepositoryWalletTransactionRow): AdminWalletLedgerItem {
  return {
    id: row.id,
    typeLabel: row.type,
    title: row.title,
    amountLabel: signedAmountLabel(row.amountToman),
    statusLabel: row.status,
    sourceConversationHref: row.conversationId ? `/admin/conversations/${row.conversationId}` : undefined,
    paymentHref: row.paymentId ? `/admin/payments/${row.paymentId}` : undefined,
    userHref: `/admin/users/${row.wallet.userId}`,
    createdAt: formatDateLike(row.createdAt),
    source: "backend_repository"
  };
}

function mapPricingRuleItem(
  rule: PricingRuleRecord,
  categoryOptions: readonly PricingRuleCategoryOption[],
  auditItems: readonly AdminAuditLogItem[] = []
): AdminPricingRuleItem {
  return {
    id: rule.id,
    title: rule.title,
    jobCategoryLabel: pricingCategoryLabel(rule.jobField, categoryOptions),
    jobFieldCode: rule.jobField ?? "",
    experienceLevelLabel: pricingExperienceLevelLabel(rule.experienceLevel),
    experienceLevelCode: rule.experienceLevel ?? "",
    durationLabel: pricingDurationLabel(rule.sessionDurationMinutes),
    durationValue: pricingDurationValue(rule.sessionDurationMinutes),
    minPriceLabel: amountLabel(rule.minPriceToman),
    minPriceToman: rule.minPriceToman,
    suggestedPriceLabel: amountLabel(rule.suggestedPriceToman),
    suggestedPriceToman: rule.suggestedPriceToman,
    maxPriceLabel: amountLabel(rule.maxPriceToman),
    maxPriceToman: rule.maxPriceToman,
    commissionLabel: pricingCommissionLabel(rule.commissionRateBps),
    commissionRateBps: rule.commissionRateBps,
    freeSessionCommissionLabel: pricingCommissionLabel(rule.freeSessionCommissionRateBps),
    freeSessionCommissionRateBps: rule.freeSessionCommissionRateBps,
    freeSessionLabel: rule.allowFreeSession ? "جلسه کمک‌محور / رایگان مجاز است" : "جلسه رایگان مجاز نیست",
    allowFreeSession: rule.allowFreeSession,
    stateLabel: pricingStateLabel(rule),
    isActive: rule.isActive,
    isArchived: Boolean(rule.archivedAt),
    effectiveWindowLabel: pricingEffectiveWindowLabel(rule),
    effectiveFromValue: isoDateInputValue(rule.effectiveFrom),
    effectiveToValue: isoDateInputValue(rule.effectiveTo),
    internalNote: rule.internalNote ?? "",
    createdBySummary: rule.createdByAdmin?.displayName ?? rule.createdByAdminId ?? notRecorded,
    updatedBySummary: rule.updatedByAdmin?.displayName ?? rule.updatedByAdminId ?? notRecorded,
    updatedAt: formatDateLike(rule.updatedAt),
    href: `/admin/pricing/${rule.id}`,
    source: "backend_repository",
    actionsAvailable: !rule.archivedAt,
    auditItems
  };
}

function mapAttendanceRow(row: RepositoryAttendanceRow): AdminAttendanceItem {
  return {
    id: row.id,
    conversationId: row.conversationId,
    title: safeText(row.conversation.requestTopic, "جلسه"),
    requesterSummary: participantSummary(row.conversation.requester),
    providerSummary: participantSummary(row.conversation.provider),
    selectedSession: selectedSessionLabel(row.conversation.selectedTime),
    attendanceStatusLabel: row.status,
    attemptsLabel: countLabel(row.attempts),
    submittedAt: formatDateLike(row.submittedAt),
    verifiedAt: formatDateLike(row.verifiedAt),
    requiresReview: row.status === "NEEDS_REVIEW",
    href: `/admin/conversations/${row.conversationId}`,
    source: "backend_repository"
  };
}

function eligibleCancellationCreditAmount(row: RepositoryCancellationRow | RepositoryCancellationDetail) {
  const payment = row.conversation.payment;

  if (!payment || payment.status !== "PAID") {
    return 0;
  }

  return Math.max(0, payment.amountToman ?? row.conversation.priceToman);
}

function detailField(label: string, value: string | number | null | undefined, href?: string): AdminDetailField {
  return {
    label,
    value: value == null ? notRecorded : String(value),
    href
  };
}

function conversationDetail(row: RepositoryConversationDetail): AdminReadDetail {
  const latestCancellation = row.cancellations[0];

  return {
    title: safeText(row.requestTopic, "جزئیات گفت‌وگو"),
    description: "نمای خواندنی چرخه عمر گفت‌وگو، پرداخت، زمان پیشنهادی، حضور و لغو.",
    sourceNote: repositorySourceNote,
    source: "backend_repository",
    idLabel: "شناسه گفت‌وگو",
    id: row.id,
    sections: [
      {
        title: "کاربران",
        items: [
          detailField("درخواست‌دهنده", participantSummary(row.requester), `/admin/users/${row.requesterId}`),
          detailField("تجربه‌آفرین", participantSummary(row.provider), `/admin/users/${row.providerId}`),
          detailField("پروفایل تجربه‌آفرین", row.experienceProfile.displayName, `/admin/experience-profiles/${row.experienceProfileId}`)
        ]
      },
      {
        title: "چرخه عمر",
        items: [
          detailField("وضعیت", row.status),
          detailField("مدت", row.duration),
          detailField("مبلغ", amountLabel(row.priceToman)),
          detailField("نمایش به تجربه‌آفرین", formatDateLike(row.providerVisibleAt)),
          detailField("ثبت", formatDateLike(row.createdAt)),
          detailField("به‌روزرسانی", formatDateLike(row.updatedAt))
        ]
      },
      {
        title: "پرداخت",
        items: [
          detailField("وضعیت پرداخت", row.payment?.status ?? row.paymentRequirement),
          detailField("روش", row.payment ? methodLabel(row.payment.method) : notRecorded),
          detailField("مبلغ پرداخت", amountLabel(row.payment?.amountToman)),
          detailField("بررسی پرداخت دستی", row.payment?.manualReview?.status ?? notRecorded),
          detailField("شناسه پرداخت", row.payment?.id ?? notRecorded, row.payment?.id ? `/admin/payments/${row.payment.id}` : undefined)
        ]
      },
      {
        title: "جلسه و حضور",
        items: [
          detailField("زمان انتخاب‌شده", selectedSessionLabel(row.selectedTime)),
          detailField("گزینه‌های پیشنهادی", countLabel(row._count.proposedTimes)),
          detailField("وضعیت حضور", row.attendanceVerification?.status ?? "NOT_REQUIRED"),
          detailField("تلاش ثبت‌شده", row.attendanceVerification ? countLabel(row.attendanceVerification.attempts) : countLabel(0)),
          detailField("تأیید حضور", formatDateLike(row.attendanceVerification?.verifiedAt))
        ]
      },
      {
        title: "لغو و کیف پول",
        items: [
          detailField("لغو اخیر", latestCancellation?.status ?? "فعال نیست", latestCancellation ? `/admin/cancellations/${latestCancellation.id}` : undefined),
          detailField("تراکنش‌های کیف پول", countLabel(row._count.walletTransactions), "/admin/wallet-transactions")
        ]
      }
    ],
    actions: [
      ...(row.payment?.id ? [{ label: "مشاهده پرداخت", href: `/admin/payments/${row.payment.id}` }] : []),
      ...(latestCancellation ? [{ label: "مشاهده لغو", href: `/admin/cancellations/${latestCancellation.id}` }] : []),
      { label: "دفتر تراکنش کیف پول", href: "/admin/wallet-transactions" }
    ]
  };
}

function cancellationDetail(row: RepositoryCancellationDetail): AdminReadDetail {
  return {
    title: safeText(row.conversation.requestTopic, "جزئیات لغو"),
    description: "نمای خواندنی مرحله، وضعیت، مبلغ و پیوندهای مرتبط با لغو.",
    sourceNote: repositorySourceNote,
    source: "backend_repository",
    idLabel: "شناسه لغو",
    id: row.id,
    sections: [
      {
        title: "خلاصه لغو",
        items: [
          detailField("وضعیت", row.status),
          detailField("مرحله", row.stage),
          detailField("دلیل", safeText(row.otherReasonText, row.reasonCode)),
          detailField("نقش لغوکننده", row.cancelledByRole),
          detailField("بررسی پشتیبانی", supportReviewLabel(row.status))
        ]
      },
      {
        title: "مبلغ‌ها",
        items: [
          detailField("مبلغ پرداخت", amountLabel(row.conversation.payment?.amountToman ?? row.conversation.priceToman)),
          detailField("اعتبار کیف پول", amountLabel(row.refundAmountToman)),
          detailField("نرخ اعتبار", `${row.refundRateBps} bps`),
          detailField("سهم پلتفرم", amountLabel(row.useravaaFeeAmountToman)),
          detailField("خالص تجربه‌آفرین", amountLabel(row.providerNetCompensationToman))
        ]
      },
      {
        title: "پیوندها",
        items: [
          detailField("گفت‌وگو", row.conversationId, `/admin/conversations/${row.conversationId}`),
          detailField("پرداخت", row.conversation.payment?.id ?? notRecorded, row.conversation.payment?.id ? `/admin/payments/${row.conversation.payment.id}` : undefined),
          detailField("تراکنش کیف پول", row.requesterRefundWalletTransactionId ?? notRecorded, row.requesterRefundWalletTransactionId ? "/admin/wallet-transactions" : undefined)
        ]
      }
    ],
    actions: [
      { label: "مشاهده گفت‌وگو", href: `/admin/conversations/${row.conversationId}` },
      ...(row.requesterRefundWalletTransactionId ? [{ label: "دفتر تراکنش کیف پول", href: "/admin/wallet-transactions" }] : [])
    ]
  };
}

function userDetail(row: RepositoryUserDetail): AdminReadDetail {
  const conversationsCount = row._count.sentConversations + row._count.receivedConversations;

  return {
    title: row.displayName,
    description: "خلاصه خواندنی حساب، پروفایل، گفت‌وگوها، کیف پول و بینش‌ها.",
    sourceNote: repositorySourceNote,
    source: "backend_repository",
    idLabel: "شناسه کاربر",
    id: row.id,
    sections: [
      {
        title: "حساب",
        items: [
          detailField("ایمیل", row.email),
          detailField("نقش", row.role),
          detailField("تکمیل پروفایل", profileCompletionLabel(row)),
          detailField("ثبت", formatDateLike(row.createdAt)),
          detailField("به‌روزرسانی", formatDateLike(row.updatedAt))
        ]
      },
      {
        title: "پروفایل تجربه‌آفرین",
        items: [
          detailField("وضعیت", row.experienceProfile?.status ?? notRecorded),
          detailField("عنوان حرفه‌ای", row.experienceProfile?.roleTitle ?? notRecorded),
          detailField("آمادگی", experienceReadinessLabel(row.experienceProfile)),
          detailField("پیوند", row.experienceProfile?.id ?? notRecorded, row.experienceProfile?.id ? `/admin/experience-profiles/${row.experienceProfile.id}` : undefined)
        ]
      },
      {
        title: "عملیات",
        items: [
          detailField("گفت‌وگوها", countLabel(conversationsCount)),
          detailField("لغوها", countLabel(row._count.cancellations)),
          detailField("بینش‌ها", countLabel(row._count.insightAnswers)),
          detailField("موجودی کیف پول", amountLabel(row.wallet?.balanceToman)),
          detailField("آماده برداشت", amountLabel(row.wallet?.availablePayoutToman))
        ]
      },
      {
        title: "یادداشت داخلی",
        items: [detailField("وضعیت", "پیاده‌سازی نشده")]
      }
    ],
    actions: [
      ...(row.experienceProfile?.id ? [{ label: "مشاهده پروفایل", href: `/admin/experience-profiles/${row.experienceProfile.id}` }] : []),
      { label: "دفتر تراکنش کیف پول", href: "/admin/wallet-transactions" }
    ]
  };
}

function experienceProfileDetail(row: RepositoryExperienceProfileDetail): AdminReadDetail {
  return {
    title: row.displayName,
    description: "نمای خواندنی کیفیت، دسته شغلی، قیمت‌گذاری و ارتباط با کاربر.",
    sourceNote: repositorySourceNote,
    source: "backend_repository",
    idLabel: "شناسه پروفایل",
    id: row.id,
    sections: [
      {
        title: "خلاصه حرفه‌ای",
        items: [
          detailField("کاربر", participantSummary(row.owner), `/admin/users/${row.ownerId}`),
          detailField("عنوان", row.roleTitle),
          detailField("دسته شغلی", categoriesLabel(row.categories)),
          detailField("سطح سازمانی", row.orgLevel),
          detailField("سال تجربه", countLabel(row.yearsOfExperience)),
          detailField("معرفی", row.publicProfessionalSummary)
        ]
      },
      {
        title: "قیمت و نمایش",
        items: [
          detailField("وضعیت", row.status),
          detailField("۳۰ دقیقه", amountLabel(row.price30Toman)),
          detailField("۶۰ دقیقه", amountLabel(row.price60Toman)),
          detailField("کمک رایگان", row.freeHelp ? "فعال" : "غیرفعال"),
          detailField("آمادگی", experienceReadinessLabel(row))
        ]
      },
      {
        title: "ارتباط‌ها",
        items: [
          detailField("گفت‌وگوها", countLabel(row._count.conversations)),
          detailField("پاسخ‌های بینش", countLabel(row._count.experienceAnswers)),
          detailField("بینش رسمی", countLabel(row._count.officialInsights))
        ]
      }
    ],
    actions: [{ label: "مشاهده کاربر", href: `/admin/users/${row.ownerId}` }]
  };
}

function mapDashboardMetrics(dashboard: RepositoryDashboardSummary): AdminMetric[] {
  return [
    {
      id: "payments-awaiting-review",
      label: "پرداخت‌های در انتظار بررسی",
      value: countLabel(dashboard.manualPaymentsAwaitingReview),
      helper: sourceHelper("backend_repository"),
      href: "/admin/payments",
      source: "backend_repository"
    },
    {
      id: "cancellations-under-review",
      label: "لغوهای در بررسی پشتیبانی",
      value: countLabel(dashboard.supportReviewCancellations),
      helper: sourceHelper("backend_repository"),
      href: "/admin/cancellations",
      source: "backend_repository"
    },
    {
      id: "profiles-awaiting-review",
      label: "پروفایل‌های در بررسی",
      value: countLabel(dashboard.profilesAwaitingReview),
      helper: sourceHelper("backend_repository"),
      href: "/admin/experience-profiles",
      source: "backend_repository"
    },
    {
      id: "attendance-pending",
      label: "حضورهای در بررسی",
      value: countLabel(dashboard.pendingAttendance),
      helper: sourceHelper("backend_repository"),
      href: "/admin/attendance",
      source: "backend_repository"
    },
    {
      id: "completed-sessions",
      label: "جلسه‌های تکمیل‌شده",
      value: countLabel(dashboard.completedSessions),
      helper: sourceHelper("backend_repository"),
      href: "/admin/conversations",
      source: "backend_repository"
    },
    {
      id: "wallet-credit-total",
      label: "اعتبار کیف پول از لغو",
      value: amountLabel(dashboard.cancellationWalletCreditToman),
      helper: sourceHelper("backend_repository"),
      href: "/admin/wallet-transactions",
      source: "backend_repository"
    }
  ];
}

function actionTypeLabel(kind: RepositoryActionQueueItem["kind"]) {
  const labels: Record<RepositoryActionQueueItem["kind"], string> = {
    manual_payment_review: "بررسی پرداخت دستی",
    cancellation_support_review: "بررسی لغو",
    attendance_review: "بررسی وضعیت حضور",
    provider_time_proposal_waiting: "پیگیری زمان پیشنهادی",
    new_time_request_waiting: "پیگیری زمان تازه",
    experience_profile_review: "بررسی پروفایل"
  };

  return labels[kind];
}

function priorityLabel(priority: RepositoryActionQueueItem["priority"]): AdminActionPriority {
  if (priority === "urgent") {
    return "فوری";
  }

  if (priority === "high") {
    return "بالا";
  }

  return "معمولی";
}

function ctaLabel(kind: RepositoryActionQueueItem["kind"]) {
  if (kind === "manual_payment_review") {
    return "بررسی پرداخت";
  }

  if (kind === "cancellation_support_review") {
    return "مشاهده لغو";
  }

  if (kind === "experience_profile_review") {
    return "مشاهده پروفایل";
  }

  return "مشاهده گفت‌وگو";
}

function mapActionItem(item: RepositoryActionQueueItem): AdminActionItem {
  return {
    id: item.id,
    actionType: actionTypeLabel(item.kind),
    priority: priorityLabel(item.priority),
    relatedEntity: item.relatedEntity,
    relatedUsers: item.relatedUsers,
    status: item.status,
    createdAt: formatDateLike(item.createdAt),
    href: item.href,
    ctaLabel: ctaLabel(item.kind),
    source: "backend_repository"
  };
}

function analyticsBreakdownRow(
  id: string,
  label: string,
  value: string,
  helper: string,
  source: AdminDataSource = "backend_repository"
): AdminAnalyticsBreakdownRow {
  return {
    id,
    label,
    value,
    helper,
    source
  };
}

function notImplementedMetric(id: string, label: string, reason: string) {
  return {
    id,
    label,
    value: "پیاده‌سازی نشده",
    helper: reason,
    source: "placeholder" as AdminDataSource
  };
}

function mapAnalytics(summary: RepositoryAnalyticsSummary): AdminAnalyticsData {
  const selectedCategory = summary.filters.category;
  const activeCategoryLabel =
    summary.categoryOptions.find((option) => option.value === selectedCategory)?.label ?? "همه دسته‌ها";
  const dateRangeOptions = analyticsDateRanges.map((dateRange) => ({
    label: analyticsDateRangeLabels[dateRange],
    value: dateRange,
    href: adminAnalyticsHref(dateRange, selectedCategory),
    active: dateRange === summary.filters.dateRange
  }));
  const categoryOptions = [
    {
      label: "همه دسته‌ها",
      value: "",
      href: adminAnalyticsHref(summary.filters.dateRange, null),
      active: selectedCategory === null
    },
    ...summary.categoryOptions.map((option) => ({
      label: option.label,
      value: option.value,
      href: adminAnalyticsHref(summary.filters.dateRange, option.value),
      active: option.value === selectedCategory
    }))
  ];
  const gmvSourceHelper = `از ${countLabel(summary.paidOrderCount)} پرداخت PAID در بازه انتخابی.`;
  const observedAverageLabel = summary.observedAverageGmvPerPayingCustomerToman === null
    ? notRecorded
    : amountLabel(summary.observedAverageGmvPerPayingCustomerToman);
  const unsupported = summary.unsupportedMetrics.length ? summary.unsupportedMetrics : unsupportedAnalyticsMetrics;
  const nmvReason = unsupported.find((metric) => metric.id === "nmv")?.reason ?? "پیاده‌سازی نشده";
  const nmvGmvReason = unsupported.find((metric) => metric.id === "nmv-gmv")?.reason ?? "پیاده‌سازی نشده";
  const categoryRows = summary.categoryBreakdown.map((row) =>
    analyticsBreakdownRow(
      row.category,
      row.label,
      `${amountLabel(row.paidGmvToman)} · ${countLabel(row.paidOrderCount)} سفارش`,
      `لغو: ${countLabel(row.cancellationCount)} · بینش: ${countLabel(row.insightCount)} · پروفایل فعال: ${countLabel(row.activeExperienceProfileCount)}`
    )
  );
  const kpiTree = buildAdminPaidSessionsKpiTree({
    dateRangeLabel: analyticsDateRangeLabels[summary.filters.dateRange],
    categoryLabel: activeCategoryLabel,
    categoryFilterSelected: selectedCategory !== null,
    completedPaidSessionCount: summary.completedPaidSessionCount,
    scheduledPaidSessionCount: summary.scheduledPaidSessionCount,
    paidSessionCount: summary.paidOrderCount,
    acceptedRequestProxyCount: summary.acceptedRequestProxyCount,
    submittedRequestCount: summary.allRequestCount,
    activatedSeekerCount: summary.activatedSeekerCount,
    qualifiedSignupProxyCount: summary.qualifiedSignupProxyCount
  });

  return {
    source: "backend_repository",
    sourceNote: repositorySourceNote,
    activeDateRangeLabel: analyticsDateRangeLabels[summary.filters.dateRange],
    activeCategoryLabel,
    dateRangeOptions,
    categoryOptions,
    metrics: [
      { id: "gmv", label: "GMV", value: amountLabel(summary.paidGmvToman), helper: gmvSourceHelper, source: "backend_repository" },
      notImplementedMetric("nmv", "NMV", nmvReason),
      notImplementedMetric("nmv-gmv", "NMV / GMV", nmvGmvReason),
      { id: "paid-orders", label: "سفارش‌های پرداخت‌شده", value: countLabel(summary.paidOrderCount), helper: "فقط پرداخت‌های PAID.", source: "backend_repository" },
      { id: "paying-customers", label: "مشتریان پرداخت‌کننده", value: countLabel(summary.payingCustomers), helper: `نرخ فعال‌سازی پرداختی: ${percentLabel(summary.customerActivationRate)}`, source: "backend_repository" },
      { id: "observed-average-gmv", label: "میانگین GMV مشاهده‌شده", value: observedAverageLabel, helper: "این CLV نیست؛ فقط GMV پرداخت‌شده تقسیم بر مشتریان پرداخت‌کننده است.", source: "backend_repository" },
      { id: "cancellations", label: "لغوها", value: countLabel(summary.cancellationCount), helper: `نرخ نسبت به سفارش پرداخت‌شده: ${percentLabel(summary.cancellationRate)}`, source: "backend_repository" },
      { id: "insights", label: "بینش‌ها", value: countLabel(summary.insightStatusCounts.total), helper: `مخفی: ${percentLabel(summary.insightHiddenRate)} · حذف نرم: ${percentLabel(summary.insightArchivedRate)}`, source: "backend_repository" },
      { id: "active-profiles", label: "پروفایل‌های فعال", value: countLabel(summary.experienceProfileStatusCounts.active ?? 0), helper: `کل پروفایل‌ها: ${countLabel(summary.experienceProfileStatusCounts.total)}`, source: "backend_repository" }
    ],
    kpiTree,
    breakdownSections: [
      {
        id: "orders",
        title: "خلاصه سفارش و پرداخت",
        description: "پرداخت‌های موفق و درخواست‌های گفت‌وگو در بازه و دسته انتخابی.",
        rows: [
          analyticsBreakdownRow("paid-gmv", "GMV پرداخت‌شده", amountLabel(summary.paidGmvToman), gmvSourceHelper),
          analyticsBreakdownRow("paid-orders", "سفارش‌های پرداخت‌شده", countLabel(summary.paidOrderCount), "Payment.status = PAID"),
          analyticsBreakdownRow("all-requests", "همه درخواست‌ها", countLabel(summary.allRequestCount), "ConversationRequest.createdAt در همین بازه."),
          analyticsBreakdownRow("completed-conversations", "گفت‌وگوهای تکمیل‌شده", countLabel(summary.completedConversationCount), "ConversationRequest.status = COMPLETED"),
          analyticsBreakdownRow("registered-users", "کاربران ثبت‌شده", countLabel(summary.totalRegisteredUsers), "کاربران ساخته‌شده در بازه انتخابی."),
          analyticsBreakdownRow("activation-rate", "نرخ فعال‌سازی پرداختی", percentLabel(summary.customerActivationRate), "مشتری پرداخت‌کننده / کاربران ثبت‌شده.")
        ]
      },
      {
        id: "cancellations",
        title: "خلاصه لغو",
        description: "لغوها، دلایل ثبت‌شده، بررسی پشتیبانی و اعتبار کیف پول.",
        rows: [
          analyticsBreakdownRow("cancellation-count", "تعداد لغو", countLabel(summary.cancellationCount), "Cancellation.createdAt در بازه انتخابی."),
          analyticsBreakdownRow("cancellation-rate", "نرخ لغو", percentLabel(summary.cancellationRate), "لغو / سفارش پرداخت‌شده در همین بازه."),
          analyticsBreakdownRow("support-review", "لغوهای در بررسی پشتیبانی", countLabel(summary.supportReviewCancellationCount), "Cancellation.status = UNDER_SUPPORT_REVIEW"),
          analyticsBreakdownRow("wallet-credit", "اعتبار کیف پول لغو", amountLabel(summary.cancellationWalletCreditToman), "فقط WalletTransaction نوع CANCELLATION_REFUND_CREDIT و COMPLETED."),
          ...summary.cancellationReasonBreakdown.map((reason) =>
            analyticsBreakdownRow(
              `reason-${reason.reasonCode}`,
              `دلیل: ${reason.reasonCode}`,
              countLabel(reason.count),
              `سهم از لغوها: ${percentLabel(reason.percentage)}`
            )
          )
        ]
      },
      {
        id: "insights",
        title: "خلاصه بینش",
        description: "وضعیت انتشار و مشارکت نویسندگان بینش.",
        rows: [
          analyticsBreakdownRow("insight-total", "کل بینش‌ها", countLabel(summary.insightStatusCounts.total), "Insight.createdAt در بازه انتخابی."),
          analyticsBreakdownRow("insight-published", "منتشرشده", countLabel(summary.insightStatusCounts.published ?? 0), "Insight.status = PUBLISHED"),
          analyticsBreakdownRow("insight-hidden", "مخفی‌شده", countLabel(summary.insightStatusCounts.hidden ?? 0), `نرخ مخفی: ${percentLabel(summary.insightHiddenRate)}`),
          analyticsBreakdownRow("insight-archived", "حذف نرم / آرشیو", countLabel(summary.insightStatusCounts.archived ?? 0), `نرخ حذف نرم: ${percentLabel(summary.insightArchivedRate)}`),
          analyticsBreakdownRow("insight-authors", "کاربران دارای حداقل یک بینش", countLabel(summary.insightAuthorCount), `سهم از کاربران: ${percentLabel(summary.insightShareRate)}`)
        ]
      },
      {
        id: "experience-profiles",
        title: "خلاصه پروفایل تجربه",
        description: "وضعیت‌های بررسی و نمایش پروفایل‌های تجربه‌آفرین.",
        rows: [
          analyticsBreakdownRow("profile-total", "کل پروفایل‌ها", countLabel(summary.experienceProfileStatusCounts.total), "ExperienceProfile.createdAt در بازه انتخابی."),
          analyticsBreakdownRow("profile-pending", "در انتظار بررسی", countLabel(summary.experienceProfileStatusCounts.pendingReview ?? 0), "status = PENDING_REVIEW"),
          analyticsBreakdownRow("profile-active", "فعال / تأییدشده", countLabel(summary.experienceProfileStatusCounts.active ?? 0), "status = ACTIVE"),
          analyticsBreakdownRow("profile-needs-changes", "نیازمند اصلاح", countLabel(summary.experienceProfileStatusCounts.needsChanges ?? 0), "status = NEEDS_CHANGES"),
          analyticsBreakdownRow("profile-inactive", "غیرفعال / مخفی", countLabel(summary.experienceProfileStatusCounts.inactive ?? 0), "status = INACTIVE")
        ]
      },
      {
        id: "categories",
        title: "شکست دسته شغلی",
        description: "محاسبه از jobField و دسته‌های موجود روی پروفایل تجربه.",
        rows: categoryRows
      }
    ],
    unsupportedMetrics: unsupported,
    dataQualityNotes: [
      "DB-backed: داده‌ها از read model ادمین و پایگاه داده فعلی خوانده می‌شوند.",
      "GMV فقط از پرداخت‌های PAID و finalizedAt در بازه انتخابی محاسبه می‌شود.",
      "فیلتر دسته از jobField یا دسته‌های متصل به ExperienceProfile استفاده می‌کند.",
      "درخت KPI جلسه‌های پرداخت‌شده فقط از داده فعلی DB و taxonomy مرکزی ساخته می‌شود؛ KPIهای بدون داده لازم همچنان با وضعیت پیاده‌سازی‌نشده نمایش داده می‌شوند.",
      "معیارهای بدون مدل پایدار به‌صورت پیاده‌سازی نشده نمایش داده می‌شوند؛ مقدار ساختگی یا صفر جعلی ندارند."
    ]
  };
}

export async function getAdminPaymentRouteData(viewer: Viewer): Promise<AdminPaymentRouteData> {
  const result = await adminPaymentService.listReviews(viewer);

  if (result.ok) {
    return {
      items: (result.data as RepositoryPaymentReview[]).map(mapRepositoryPaymentItem),
      source: "backend_repository",
      sourceNote: repositorySourceNote
    };
  }

  if (!isAdminLocalDemoFallbackEnabled()) {
    return placeholderAdminList();
  }

  return {
    items: getLocalPaymentQueueItems(),
    source: "local_demo",
    sourceNote: demoFallbackSourceNote
  };
}

export async function getAdminPaymentDetailRouteData(viewer: Viewer, paymentId: string) {
  const result = await adminPaymentService.getReview(viewer, paymentId);

  if (result.ok) {
    const auditResult = await adminReadModelService.getPaymentAuditLog(viewer, paymentId);
    const auditItems = auditResult.ok ? auditResult.data.rows.map(mapAuditItem) : [];

    return {
      items: [],
      source: "backend_repository" as AdminDataSource,
      sourceNote: repositorySourceNote,
      item: {
        ...mapRepositoryPaymentItem(result.data as RepositoryPaymentReview),
        auditItems
      }
    };
  }

  if (!isAdminLocalDemoFallbackEnabled()) {
    return {
      items: [],
      source: "placeholder" as AdminDataSource,
      sourceNote: placeholderSourceNote,
      item: null
    };
  }

  const item = getLocalPaymentQueueItem(paymentId);

  return {
    items: item ? [item] : [],
    source: "local_demo" as AdminDataSource,
    sourceNote: demoFallbackSourceNote,
    item
  };
}

export async function getAdminHomeRouteData(viewer: Viewer): Promise<AdminHomeRouteData> {
  const [dashboardResult, actionQueueResult] = await Promise.all([
    adminReadModelService.getDashboard(viewer),
    adminReadModelService.listActionQueue(viewer)
  ]);

  if (dashboardResult.ok && actionQueueResult.ok) {
    return {
      metrics: mapDashboardMetrics(dashboardResult.data),
      actionItems: actionQueueResult.data.map(mapActionItem),
      sourceNote: repositorySourceNote
    };
  }

  if (!isAdminLocalDemoFallbackEnabled()) {
    return placeholderAdminHome();
  }

  const paymentData = await getAdminPaymentRouteData(viewer);
  return buildAdminHomeData(paymentData.items.filter((item) => item.actionsAvailable));
}

export async function getAdminConversationRouteData(viewer: Viewer): Promise<AdminListRouteData<AdminConversationListItem>> {
  const result = await adminReadModelService.listConversations(viewer);

  if (result.ok) {
    return {
      items: result.data.map(mapConversationRow),
      source: "backend_repository",
      sourceNote: repositorySourceNote
    };
  }

  if (!isAdminLocalDemoFallbackEnabled()) {
    return placeholderAdminList();
  }

  return {
    items: getConversationAdminItems(),
    source: "local_demo",
    sourceNote: demoFallbackSourceNote
  };
}

export async function getAdminConversationDetailRouteData(
  viewer: Viewer,
  conversationId: string
): Promise<AdminDetailRouteData<ReturnType<typeof getConversationAdminItem>>> {
  const result = await adminReadModelService.getConversationDetail(viewer, conversationId);

  if (result.ok) {
    return {
      detail: result.data ? conversationDetail(result.data) : null,
      fallback: null,
      source: "backend_repository",
      sourceNote: repositorySourceNote
    };
  }

  if (!isAdminLocalDemoFallbackEnabled()) {
    return {
      detail: null,
      fallback: null,
      source: "placeholder",
      sourceNote: placeholderSourceNote
    };
  }

  return {
    detail: null,
    fallback: getConversationAdminItem(conversationId),
    source: "local_demo",
    sourceNote: demoFallbackSourceNote
  };
}

export async function getAdminCancellationRouteData(viewer: Viewer): Promise<AdminListRouteData<AdminCancellationItem>> {
  const result = await adminReadModelService.listCancellations(viewer);

  if (result.ok) {
    return {
      items: result.data.map(mapCancellationRow),
      source: "backend_repository",
      sourceNote: repositorySourceNote
    };
  }

  if (!isAdminLocalDemoFallbackEnabled()) {
    return placeholderAdminList();
  }

  return {
    items: getCancellationAdminItems(),
    source: "local_demo",
    sourceNote: demoFallbackSourceNote
  };
}

export async function getAdminCancellationDetailRouteData(
  viewer: Viewer,
  cancellationId: string
): Promise<AdminCancellationDetailRouteData> {
  const result = await adminReadModelService.getCancellationDetail(viewer, cancellationId);

  if (result.ok) {
    const auditResult = await adminReadModelService.getCancellationAuditLog(viewer, cancellationId);
    const auditItems = auditResult.ok ? auditResult.data.rows.map(mapAuditItem) : [];
    const item = result.data
      ? {
          ...mapCancellationRow(result.data),
          auditItems
        }
      : null;

    return {
      detail: result.data ? cancellationDetail(result.data) : null,
      item,
      fallback: null,
      source: "backend_repository",
      sourceNote: repositorySourceNote
    };
  }

  if (!isAdminLocalDemoFallbackEnabled()) {
    return {
      detail: null,
      item: null,
      fallback: null,
      source: "placeholder",
      sourceNote: placeholderSourceNote
    };
  }

  return {
    detail: null,
    item: null,
    fallback: getCancellationAdminItem(cancellationId),
    source: "local_demo",
    sourceNote: demoFallbackSourceNote
  };
}

export async function getAdminUserRouteData(viewer: Viewer): Promise<AdminListRouteData<AdminUserItem>> {
  const result = await adminReadModelService.listUsers(viewer);

  if (result.ok) {
    return {
      items: result.data.map(mapUserRow),
      source: "backend_repository",
      sourceNote: repositorySourceNote
    };
  }

  if (!isAdminLocalDemoFallbackEnabled()) {
    return placeholderAdminList();
  }

  return {
    items: getUserAdminItems(),
    source: "local_demo",
    sourceNote: demoFallbackSourceNote
  };
}

export async function getAdminUserDetailRouteData(
  viewer: Viewer,
  userId: string
): Promise<AdminDetailRouteData<ReturnType<typeof getUserAdminItem>>> {
  const result = await adminReadModelService.getUserDetail(viewer, userId);

  if (result.ok) {
    return {
      detail: result.data ? userDetail(result.data) : null,
      fallback: null,
      source: "backend_repository",
      sourceNote: repositorySourceNote
    };
  }

  if (!isAdminLocalDemoFallbackEnabled()) {
    return {
      detail: null,
      fallback: null,
      source: "placeholder",
      sourceNote: placeholderSourceNote
    };
  }

  return {
    detail: null,
    fallback: getUserAdminItem(userId),
    source: "local_demo",
    sourceNote: demoFallbackSourceNote
  };
}

export async function getAdminExperienceProfileRouteData(viewer: Viewer): Promise<AdminListRouteData<AdminExperienceProfileItem>> {
  const result = await adminReadModelService.listExperienceProfiles(viewer);

  if (result.ok) {
    return {
      items: result.data.map(mapExperienceProfileRow).sort((a, b) => experienceProfileReviewSortValue(a) - experienceProfileReviewSortValue(b)),
      source: "backend_repository",
      sourceNote: repositorySourceNote
    };
  }

  if (!isAdminLocalDemoFallbackEnabled()) {
    return placeholderAdminList();
  }

  return {
    items: getExperienceProfileAdminItems(),
    source: "local_demo",
    sourceNote: demoFallbackSourceNote
  };
}

export async function getAdminExperienceProfileDetailRouteData(
  viewer: Viewer,
  profileId: string
): Promise<AdminExperienceProfileDetailRouteData> {
  const result = await adminReadModelService.getExperienceProfileDetail(viewer, profileId);

  if (result.ok) {
    const auditResult = await adminReadModelService.getExperienceProfileAuditLog(viewer, profileId);
    const auditItems = auditResult.ok ? auditResult.data.rows.map(mapAuditItem) : [];

    return {
      detail: result.data ? experienceProfileDetail(result.data) : null,
      item: result.data ? mapExperienceProfileDetailItem(result.data, auditItems) : null,
      fallback: null,
      source: "backend_repository",
      sourceNote: repositorySourceNote
    };
  }

  if (!isAdminLocalDemoFallbackEnabled()) {
    return {
      detail: null,
      item: null,
      fallback: null,
      source: "placeholder",
      sourceNote: placeholderSourceNote
    };
  }

  return {
    detail: null,
    item: null,
    fallback: getExperienceProfileAdminItem(profileId),
    source: "local_demo",
    sourceNote: demoFallbackSourceNote
  };
}

export async function getAdminInsightRouteData(viewer: Viewer): Promise<AdminListRouteData<AdminInsightItem>> {
  const result = await adminReadModelService.listInsights(viewer);

  if (result.ok) {
    return {
      items: result.data.map(mapInsightRow).sort((a, b) => insightModerationSortValue(a) - insightModerationSortValue(b)),
      source: "backend_repository",
      sourceNote: repositorySourceNote
    };
  }

  return {
    items: [],
    source: "placeholder",
    sourceNote: placeholderSourceNote
  };
}

export async function getAdminInsightDetailRouteData(
  viewer: Viewer,
  insightId: string
): Promise<AdminInsightDetailRouteData> {
  const result = await adminReadModelService.getInsightDetail(viewer, insightId);

  if (result.ok) {
    const auditResult = await adminReadModelService.getInsightAuditLog(viewer, insightId);
    const auditItems = auditResult.ok ? auditResult.data.rows.map(mapAuditItem) : [];

    return {
      item: result.data ? mapInsightDetailItem(result.data, auditItems) : null,
      source: "backend_repository",
      sourceNote: repositorySourceNote
    };
  }

  return {
    item: null,
    source: "placeholder",
    sourceNote: placeholderSourceNote
  };
}

export async function getAdminWalletTransactionRouteData(viewer: Viewer): Promise<AdminListRouteData<AdminWalletLedgerItem>> {
  const result = await adminReadModelService.listWalletTransactions(viewer);

  if (result.ok) {
    return {
      items: result.data.map(mapWalletTransactionRow),
      source: "backend_repository",
      sourceNote: repositorySourceNote
    };
  }

  if (!isAdminLocalDemoFallbackEnabled()) {
    return placeholderAdminList();
  }

  return {
    items: getWalletLedgerAdminItems(),
    source: "local_demo",
    sourceNote: demoFallbackSourceNote
  };
}

export async function getAdminCategoryRouteData(viewer: Viewer): Promise<AdminCategoriesData> {
  const result = await adminCategoryService.list(viewer);

  if (result.ok) {
    return {
      items: result.data.map((category) => mapAdminCategoryItem(category)),
      parentOptions: mapCategoryParentOptions(result.data),
      source: "backend_repository",
      sourceNote: repositorySourceNote,
      viewerCanMutate: viewer.role === "ADMIN"
    };
  }

  return {
    items: [],
    parentOptions: [],
    source: "placeholder",
    sourceNote: placeholderSourceNote,
    viewerCanMutate: false
  };
}

export async function getAdminCategoryDetailRouteData(
  viewer: Viewer,
  categoryId: string
): Promise<AdminCategoryDetailData> {
  const [listResult, detailResult, auditResult] = await Promise.all([
    adminCategoryService.list(viewer),
    adminCategoryService.getDetail(viewer, categoryId),
    adminReadModelService.getCategoryAuditLog(viewer, categoryId)
  ]);
  const categories = listResult.ok ? listResult.data : [];
  const auditItems = auditResult.ok ? auditResult.data.rows.map(mapAuditItem) : [];

  if (detailResult.ok) {
    return {
      item: mapAdminCategoryItem(detailResult.data, auditItems),
      parentOptions: mapCategoryParentOptions(categories, detailResult.data.id),
      source: "backend_repository",
      sourceNote: repositorySourceNote,
      viewerCanMutate: viewer.role === "ADMIN"
    };
  }

  return {
    item: null,
    parentOptions: mapCategoryParentOptions(categories, categoryId),
    source: listResult.ok ? "backend_repository" : "placeholder",
    sourceNote: listResult.ok
      ? "دسته شغلی پیدا نشد؛ داده ساختگی نمایش داده نمی‌شود."
      : placeholderSourceNote,
    viewerCanMutate: false
  };
}

function buildUgcOverview(
  insightsResult: Awaited<ReturnType<typeof adminReadModelService.listInsights>>
): AdminUgcOverviewItem[] {
  if (!insightsResult.ok) {
    return [
      {
        id: "insights-unavailable",
        title: "بینش‌ها و پاسخ‌های کوتاه",
        status: "منبع داده در دسترس نیست",
        description: "مرور محتوای کاربرساخته فقط از مسیرهای moderation موجود انجام می‌شود و ردیف نمایشی ساخته نمی‌شود.",
        href: "/admin/insights",
        ctaLabel: "مسیر moderation",
        source: "placeholder"
      },
      {
        id: "comments-not-implemented",
        title: "دیدگاه‌ها",
        status: "پیاده‌سازی نشده",
        description: "مدل دیدگاه در اسکیما وجود ندارد؛ دیدگاه ساختگی یا صف نمایشی نشان داده نمی‌شود.",
        source: "placeholder"
      }
    ];
  }

  const hiddenCount = insightsResult.data.filter((insight) => insight.status === "HIDDEN").length;
  const archivedCount = insightsResult.data.filter((insight) => insight.status === "ARCHIVED").length;
  const answerCount = insightsResult.data.reduce((sum, insight) => sum + insight._count.answers, 0);

  return [
    {
      id: "insights",
      title: "بینش‌ها",
      status: `${formatFaNumber(insightsResult.data.length)} ردیف`,
      description: `${formatFaNumber(hiddenCount)} مخفی و ${formatFaNumber(archivedCount)} آرشیوشده؛ ویرایش متن کاربر از این بخش انجام نمی‌شود.`,
      href: "/admin/insights",
      ctaLabel: "مدیریت بینش‌ها",
      source: "backend_repository"
    },
    {
      id: "insight-answers",
      title: "پاسخ‌های کوتاه",
      status: `${formatFaNumber(answerCount)} پاسخ`,
      description: "پنهان‌سازی پاسخ‌ها از صفحه جزئیات بینش انجام می‌شود و بازنویسی متن کاربر مجاز نیست.",
      href: "/admin/insights",
      ctaLabel: "مشاهده moderation",
      source: "backend_repository"
    },
    {
      id: "profile-text",
      title: "متن پروفایل تجربه‌آفرین",
      status: "مسیر review موجود",
      description: "بررسی متن پروفایل از مسیر بررسی پروفایل تجربه‌آفرین انجام می‌شود، نه از ویرایش محتوای وب‌سایت.",
      href: "/admin/experience-profiles",
      ctaLabel: "صف پروفایل‌ها",
      source: "backend_repository"
    },
    {
      id: "comments-not-implemented",
      title: "دیدگاه‌ها",
      status: "پیاده‌سازی نشده",
      description: "مدل دیدگاه در اسکیما وجود ندارد؛ دیدگاه ساختگی یا صف نمایشی نشان داده نمی‌شود.",
      source: "placeholder"
    }
  ];
}

export async function getAdminContentRouteData(
  viewer: Viewer,
  params?: AdminContentSearchParams
): Promise<AdminContentData> {
  const filters = parseAdminContentFilters(params);
  const [contentResult, insightsResult] = await Promise.all([
    adminContentService.list(viewer, {
      namespace: filters.namespace || null,
      contentType: filters.contentType ? (filters.contentType as ContentEntryType) : null,
      status: filters.status ? (filters.status as ContentEntryStatus) : null,
      search: filters.search || null
    }),
    adminReadModelService.listInsights(viewer)
  ]);

  if (contentResult.ok) {
    return {
      items: contentResult.data.map((entry) => mapAdminContentEntryItem(entry)),
      namespaceOptions: mapContentNamespaceOptions(filters, contentResult.data),
      contentTypeOptions: mapContentTypeOptions(filters),
      statusOptions: mapContentStatusOptions(filters),
      ugcOverview: buildUgcOverview(insightsResult),
      activeFilters: filters,
      source: "backend_repository",
      sourceNote: repositorySourceNote,
      viewerCanMutate: viewer.role === "ADMIN"
    };
  }

  return {
    items: [],
    namespaceOptions: mapContentNamespaceOptions(filters, []),
    contentTypeOptions: mapContentTypeOptions(filters),
    statusOptions: mapContentStatusOptions(filters),
    ugcOverview: buildUgcOverview(insightsResult),
    activeFilters: filters,
    source: "placeholder",
    sourceNote: placeholderSourceNote,
    viewerCanMutate: false
  };
}

export async function getAdminContentDetailRouteData(
  viewer: Viewer,
  contentEntryId: string
): Promise<AdminContentDetailData> {
  const [detailResult, auditResult] = await Promise.all([
    adminContentService.getDetail(viewer, contentEntryId),
    adminReadModelService.getContentEntryAuditLog(viewer, contentEntryId)
  ]);
  const auditItems = auditResult.ok ? auditResult.data.rows.map(mapAuditItem) : [];

  if (detailResult.ok) {
    return {
      item: mapAdminContentEntryItem(detailResult.data, auditItems),
      source: "backend_repository",
      sourceNote: repositorySourceNote,
      viewerCanMutate: viewer.role === "ADMIN"
    };
  }

  return {
    item: null,
    source: "placeholder",
    sourceNote: placeholderSourceNote,
    viewerCanMutate: false
  };
}

export async function getAdminLeadRouteData(viewer: Viewer, params?: AdminLeadSearchParams): Promise<AdminLeadInboxData> {
  const filters = parseAdminLeadFilters(params);
  const [leadsResult, summaryResult] = await Promise.all([
    adminLeadService.list(viewer, leadRepositoryFilters(viewer, filters)),
    adminLeadService.list(viewer, { includeArchived: true })
  ]);
  const summaryLeads = summaryResult.ok ? summaryResult.data : [];

  if (leadsResult.ok) {
    return {
      items: leadsResult.data.map((lead) => mapAdminLeadItem(lead)),
      metrics: buildLeadMetrics(summaryLeads.length ? summaryLeads : leadsResult.data),
      queueOptions: mapLeadQueueOptions(filters),
      stageOptions: mapLeadStageOptions(filters),
      temperatureOptions: mapLeadTemperatureOptions(filters),
      leadTypeOptions: mapLeadTypeOptions(filters),
      sourceOptions: mapLeadSourceOptions(filters),
      activeFilters: filters,
      source: "backend_repository",
      sourceNote: repositorySourceNote,
      viewerCanCreate: viewer.role === "ADMIN" || viewer.role === "SUPPORT",
      viewerCanMutate: viewer.role === "ADMIN" || viewer.role === "SUPPORT",
      viewerCanImport: viewer.role === "ADMIN",
      viewerCanArchive: viewer.role === "ADMIN",
      viewerId: viewer.id
    };
  }

  return {
    items: [],
    metrics: buildLeadMetrics([]),
    queueOptions: mapLeadQueueOptions(filters),
    stageOptions: mapLeadStageOptions(filters),
    temperatureOptions: mapLeadTemperatureOptions(filters),
    leadTypeOptions: mapLeadTypeOptions(filters),
    sourceOptions: mapLeadSourceOptions(filters),
    activeFilters: filters,
    source: "placeholder",
    sourceNote: "پایگاه داده یا مدل سرنخ در دسترس نیست؛ سرنخ ساختگی نمایش داده نمی‌شود.",
    viewerCanCreate: false,
    viewerCanMutate: false,
    viewerCanImport: false,
    viewerCanArchive: false,
    viewerId: viewer.id
  };
}

export async function getAdminLeadDetailRouteData(viewer: Viewer, leadId: string): Promise<AdminLeadDetailData> {
  const [detailResult, auditResult] = await Promise.all([
    adminLeadService.getDetail(viewer, leadId),
    adminReadModelService.getLeadAuditLog(viewer, leadId)
  ]);
  const auditItems = auditResult.ok ? auditResult.data.rows.map(mapAuditItem) : [];

  if (detailResult.ok) {
    return {
      item: mapAdminLeadItem(detailResult.data, auditItems),
      source: "backend_repository",
      sourceNote: repositorySourceNote,
      viewerCanCreate: viewer.role === "ADMIN" || viewer.role === "SUPPORT",
      viewerCanMutate: viewer.role === "ADMIN" || viewer.role === "SUPPORT",
      viewerCanImport: viewer.role === "ADMIN",
      viewerCanArchive: viewer.role === "ADMIN",
      viewerId: viewer.id
    };
  }

  return {
    item: null,
    source: "placeholder",
    sourceNote: "سرنخ پیدا نشد یا پایگاه داده در دسترس نیست؛ جزئیات ساختگی نمایش داده نمی‌شود.",
    viewerCanCreate: false,
    viewerCanMutate: false,
    viewerCanImport: false,
    viewerCanArchive: false,
    viewerId: viewer.id
  };
}

export async function getAdminSupportRouteData(
  viewer: Viewer,
  params?: AdminSupportSearchParams
): Promise<AdminSupportInboxData> {
  const filters = parseAdminSupportFilters(params);
  const [ticketsResult, summaryResult] = await Promise.all([
    adminSupportService.list(viewer, supportRepositoryFilters(viewer, filters)),
    adminSupportService.list(viewer, { includeArchived: true })
  ]);
  const summaryTickets = summaryResult.ok ? summaryResult.data : [];

  if (ticketsResult.ok) {
    return {
      items: ticketsResult.data.map((ticket) => mapAdminSupportTicketItem(ticket)),
      metrics: buildSupportMetrics(summaryTickets.length ? summaryTickets : ticketsResult.data),
      queueOptions: mapSupportQueueOptions(filters),
      statusOptions: mapSupportStatusOptions(filters),
      priorityOptions: mapSupportPriorityOptions(filters),
      categoryOptions: mapSupportCategoryOptions(filters),
      sourceOptions: mapSupportSourceOptions(filters),
      relatedEntityOptions: mapSupportRelatedEntityOptions(filters),
      activeFilters: filters,
      source: "backend_repository",
      sourceNote: repositorySourceNote,
      viewerCanCreate: viewer.role === "ADMIN" || viewer.role === "SUPPORT",
      viewerCanMutate: viewer.role === "ADMIN" || viewer.role === "SUPPORT",
      viewerCanArchive: viewer.role === "ADMIN",
      viewerId: viewer.id
    };
  }

  return {
    items: [],
    metrics: buildSupportMetrics([]),
    queueOptions: mapSupportQueueOptions(filters),
    statusOptions: mapSupportStatusOptions(filters),
    priorityOptions: mapSupportPriorityOptions(filters),
    categoryOptions: mapSupportCategoryOptions(filters),
    sourceOptions: mapSupportSourceOptions(filters),
    relatedEntityOptions: mapSupportRelatedEntityOptions(filters),
    activeFilters: filters,
    source: "placeholder",
    sourceNote: "پایگاه داده یا مدل پشتیبانی در دسترس نیست؛ تیکت ساختگی نمایش داده نمی‌شود.",
    viewerCanCreate: false,
    viewerCanMutate: false,
    viewerCanArchive: false,
    viewerId: viewer.id
  };
}

export async function getAdminSupportDetailRouteData(
  viewer: Viewer,
  ticketId: string
): Promise<AdminSupportDetailData> {
  const [detailResult, auditResult] = await Promise.all([
    adminSupportService.getDetail(viewer, ticketId),
    adminReadModelService.getSupportTicketAuditLog(viewer, ticketId)
  ]);
  const auditItems = auditResult.ok ? auditResult.data.rows.map(mapAuditItem) : [];

  if (detailResult.ok) {
    return {
      item: mapAdminSupportTicketItem(detailResult.data, auditItems),
      source: "backend_repository",
      sourceNote: repositorySourceNote,
      viewerCanCreate: viewer.role === "ADMIN" || viewer.role === "SUPPORT",
      viewerCanMutate: viewer.role === "ADMIN" || viewer.role === "SUPPORT",
      viewerCanArchive: viewer.role === "ADMIN",
      viewerId: viewer.id
    };
  }

  return {
    item: null,
    source: "placeholder",
    sourceNote: "تیکت پشتیبانی پیدا نشد یا پایگاه داده در دسترس نیست؛ جزئیات ساختگی نمایش داده نمی‌شود.",
    viewerCanCreate: false,
    viewerCanMutate: false,
    viewerCanArchive: false,
    viewerId: viewer.id
  };
}

export async function getAdminPricingRouteData(viewer: Viewer): Promise<AdminPricingRulesData> {
  const result = await adminPricingService.list(viewer);

  if (result.ok) {
    return {
      items: result.data.rules.map((rule) => mapPricingRuleItem(rule, result.data.categoryOptions)),
      categoryOptions: mapPricingCategoryOptions(result.data.categoryOptions),
      source: "backend_repository",
      sourceNote: repositorySourceNote,
      viewerCanMutate: viewer.role === "ADMIN"
    };
  }

  return {
    items: [],
    categoryOptions: [],
    source: "placeholder",
    sourceNote: "پایگاه داده یا مدل خواندن قیمت‌گذاری در دسترس نیست؛ قانون قیمت‌گذاری ساختگی نمایش داده نمی‌شود.",
    viewerCanMutate: false
  };
}

export async function getAdminPricingDetailRouteData(
  viewer: Viewer,
  ruleId: string
): Promise<AdminPricingRuleDetailData> {
  const [listResult, detailResult, auditResult] = await Promise.all([
    adminPricingService.list(viewer),
    adminPricingService.getDetail(viewer, ruleId),
    adminReadModelService.getPricingRuleAuditLog(viewer, ruleId)
  ]);
  const categoryOptions = listResult.ok ? listResult.data.categoryOptions : [];
  const auditItems = auditResult.ok ? auditResult.data.rows.map(mapAuditItem) : [];

  if (detailResult.ok) {
    return {
      item: mapPricingRuleItem(detailResult.data, categoryOptions, auditItems),
      categoryOptions: mapPricingCategoryOptions(categoryOptions),
      source: "backend_repository",
      sourceNote: repositorySourceNote,
      viewerCanMutate: viewer.role === "ADMIN"
    };
  }

  return {
    item: null,
    categoryOptions: mapPricingCategoryOptions(categoryOptions),
    source: listResult.ok ? "backend_repository" : "placeholder",
    sourceNote: listResult.ok
      ? "قانون قیمت‌گذاری پیدا نشد؛ داده ساختگی نمایش داده نمی‌شود."
      : "پایگاه داده یا مدل خواندن قیمت‌گذاری در دسترس نیست؛ قانون قیمت‌گذاری ساختگی نمایش داده نمی‌شود.",
    viewerCanMutate: false
  };
}

export async function getAdminAttendanceRouteData(viewer: Viewer): Promise<AdminListRouteData<AdminAttendanceItem>> {
  const result = await adminReadModelService.listAttendance(viewer);

  if (result.ok) {
    return {
      items: result.data.map(mapAttendanceRow),
      source: "backend_repository",
      sourceNote: repositorySourceNote
    };
  }

  if (!isAdminLocalDemoFallbackEnabled()) {
    return placeholderAdminList();
  }

  return {
    items: getAttendanceQueueItems().map((item) => ({
      id: item.id,
      conversationId: item.id.replace(/^attendance-/, ""),
      title: item.title,
      requesterSummary: item.users,
      providerSummary: item.users,
      selectedSession: notRecorded,
      attendanceStatusLabel: item.status,
      attemptsLabel: countLabel(0),
      submittedAt: notRecorded,
      verifiedAt: notRecorded,
      requiresReview: true,
      href: item.href,
      source: "local_demo"
    })),
    source: "local_demo",
    sourceNote: demoFallbackSourceNote
  };
}

export async function getAdminAnalyticsRouteData(
  viewer: Viewer,
  searchParams?: AdminAnalyticsSearchParams
): Promise<AdminAnalyticsData> {
  const filters = parseAdminAnalyticsFilters(searchParams);
  const result = await adminReadModelService.getAnalyticsSummary(viewer, filters);

  if (result.ok) {
    return mapAnalytics(result.data);
  }

  const activeDateRangeLabel = analyticsDateRangeLabels[filters.dateRange];
  const activeCategoryLabel = "همه دسته‌ها";

  return {
    source: "placeholder",
    sourceNote: placeholderSourceNote,
    activeDateRangeLabel,
    activeCategoryLabel,
    dateRangeOptions: analyticsDateRanges.map((dateRange) => ({
      label: analyticsDateRangeLabels[dateRange],
      value: dateRange,
      href: adminAnalyticsHref(dateRange, null),
      active: dateRange === filters.dateRange
    })),
    categoryOptions: [
      {
        label: "همه دسته‌ها",
        value: "",
        href: adminAnalyticsHref(filters.dateRange, null),
        active: true
      }
    ],
    metrics: [
      { id: "analytics-unavailable", label: "داده تحلیل", value: "ناموجود", helper: "در این نسخه هنوز محاسبه نمی‌شود", source: "placeholder" }
    ],
    kpiTree: buildUnavailableAdminPaidSessionsKpiTree(activeDateRangeLabel, activeCategoryLabel),
    breakdownSections: [],
    unsupportedMetrics: unsupportedAnalyticsMetrics,
    dataQualityNotes: [
      "پایگاه داده یا read model در دسترس نبود؛ این صفحه ردیف یا عدد نمایشی جعلی نشان نمی‌دهد.",
      "برای مشاهده معیارهای واقعی، اتصال DB امن و نقش ADMIN/SUPPORT لازم است."
    ]
  };
}

export async function getAdminAuditLogRouteData(viewer: Viewer): Promise<AdminAuditLogData> {
  const result = await adminReadModelService.getAuditLog(viewer);

  if (result.ok) {
    return {
      implemented: result.data.implemented,
      rows: result.data.rows.map(mapAuditItem),
      source: result.data.implemented ? "backend_repository" : "placeholder",
      sourceNote: result.data.implemented ? repositorySourceNote : placeholderSourceNote
    };
  }

  return {
    implemented: false,
    rows: [],
    source: "placeholder",
    sourceNote: placeholderSourceNote
  };
}
