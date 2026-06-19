export type AdminKpiStatus = "computed" | "proxy" | "not_implemented";

export type AdminKpiUnit = "count" | "rate";

export type AdminKpiCategoryFilterStatus = "applied" | "not_selected" | "not_supported";

export type AdminKpiNodeId =
  | "completed_paid_sessions"
  | "scheduled_paid_sessions"
  | "paid_sessions"
  | "accepted_requests"
  | "submitted_requests"
  | "activated_seekers"
  | "qualified_signups"
  | "qualified_visitors"
  | "signup_rate"
  | "activation_rate"
  | "request_conversion_rate"
  | "provider_acceptance_rate"
  | "payment_confirmation_rate"
  | "scheduling_rate"
  | "session_completion_rate";

export type AdminKpiTreeNode = {
  id: AdminKpiNodeId;
  label: string;
  value: string;
  numerator: string;
  denominator: string;
  rate: string;
  unit: AdminKpiUnit;
  status: AdminKpiStatus;
  statusLabel: string;
  formula: string;
  explanation: string;
  unsupportedReason?: string;
  dateRangeBehavior: string;
  categoryFilterStatus: AdminKpiCategoryFilterStatus;
  categoryFilterLabel: string;
  dataQualityNote?: string;
  children: AdminKpiTreeNode[];
};

export type AdminKpiTreeInputs = {
  dateRangeLabel: string;
  categoryLabel: string;
  categoryFilterSelected: boolean;
  completedPaidSessionCount: number;
  scheduledPaidSessionCount: number;
  paidSessionCount: number;
  acceptedRequestProxyCount: number;
  submittedRequestCount: number;
  activatedSeekerCount: number;
  qualifiedSignupProxyCount: number;
};

export const adminKpiStatusLabels: Record<AdminKpiStatus, string> = {
  computed: "محاسبه‌شده",
  proxy: "تقریبی",
  not_implemented: "پیاده‌سازی‌نشده"
};

const notAvailable = "ناموجود";

const countFormatter = new Intl.NumberFormat("fa-IR");
const percentFormatter = new Intl.NumberFormat("fa-IR", {
  maximumFractionDigits: 0
});

function countLabel(value: number | null) {
  return value === null ? notAvailable : countFormatter.format(value);
}

function rateValue(numerator: number | null, denominator: number | null) {
  if (numerator === null || denominator === null || denominator <= 0) {
    return null;
  }

  return numerator / denominator;
}

function rateLabel(value: number | null) {
  if (value === null) {
    return notAvailable;
  }

  return `${percentFormatter.format(value * 100)}٪`;
}

function dateRangeBehavior(label: string) {
  return `بر اساس بازه زمانی انتخاب‌شده: ${label}`;
}

function supportedCategoryBehavior(categoryLabel: string, selected: boolean) {
  return selected
    ? {
        status: "applied" as const,
        label: `فیلتر دسته اعمال شده است: ${categoryLabel}`
      }
    : {
        status: "not_selected" as const,
        label: "فیلتر دسته انتخاب نشده است."
      };
}

function unsupportedCategoryBehavior() {
  return {
    status: "not_supported" as const,
    label: "فیلتر دسته برای این KPI پشتیبانی نمی‌شود."
  };
}

type KpiDefinition = {
  id: AdminKpiNodeId;
  label: string;
  formula: string;
  unit: AdminKpiUnit;
  explanation: string;
  sourceRequirement: string;
};

export const adminPaidSessionsKpiTaxonomy: Record<AdminKpiNodeId, KpiDefinition> = {
  completed_paid_sessions: {
    id: "completed_paid_sessions",
    label: "Completed Paid Sessions",
    formula: "Paid conversations with completed state",
    unit: "count",
    explanation: "فقط جلسه‌های پرداخت‌شده‌ای شمارش می‌شوند که به وضعیت تکمیل‌شده رسیده‌اند.",
    sourceRequirement: "Payment.status = PAID + ConversationRequest.status/completedAt"
  },
  scheduled_paid_sessions: {
    id: "scheduled_paid_sessions",
    label: "Scheduled Paid Sessions",
    formula: "Paid sessions with selected or confirmed session time",
    unit: "count",
    explanation: "جلسه‌های پرداخت‌شده‌ای که زمان انتخاب‌شده یا وضعیت قطعی دارند.",
    sourceRequirement: "Payment.status = PAID + selectedTimeId/confirmedAt/status"
  },
  paid_sessions: {
    id: "paid_sessions",
    label: "Paid Sessions",
    formula: "Payment.status = PAID",
    unit: "count",
    explanation: "پرداخت‌های ناموفق، ردشده، پرداخت‌نشده و جلسه‌های رایگان در این عدد نیستند.",
    sourceRequirement: "Payment.status"
  },
  accepted_requests: {
    id: "accepted_requests",
    label: "Accepted Requests",
    formula: "Requests with provider visibility, provider response, proposed time, selected time, confirmed, or later lifecycle",
    unit: "count",
    explanation: "وضعیت پذیرش مستقل در مدل فعلی وجود ندارد؛ این عدد از نشانه‌های بعدی چرخه عمر برداشت می‌شود.",
    sourceRequirement: "ConversationRequest provider visibility/time/lifecycle fields"
  },
  submitted_requests: {
    id: "submitted_requests",
    label: "Submitted Requests",
    formula: "ConversationRequest.createdAt in selected range",
    unit: "count",
    explanation: "درخواست‌های گفت‌وگویی که در بازه انتخاب‌شده ثبت شده‌اند.",
    sourceRequirement: "ConversationRequest.createdAt"
  },
  activated_seekers: {
    id: "activated_seekers",
    label: "Activated Seekers",
    formula: "Distinct requesterId with at least one submitted request",
    unit: "count",
    explanation: "درخواست‌کننده‌های یکتایی که در بازه انتخاب‌شده حداقل یک درخواست ثبت کرده‌اند.",
    sourceRequirement: "ConversationRequest.requesterId"
  },
  qualified_signups: {
    id: "qualified_signups",
    label: "Qualified Signups",
    formula: "Registered users in selected range as a clearly labeled proxy",
    unit: "count",
    explanation: "مدل فعلی فیلد qualification ندارد؛ کاربران ثبت‌شده فقط به‌عنوان تقریب و با برچسب روشن استفاده می‌شوند.",
    sourceRequirement: "User.createdAt proxy"
  },
  qualified_visitors: {
    id: "qualified_visitors",
    label: "Qualified Visitors",
    formula: "Requires product analytics visitor tracking",
    unit: "count",
    explanation: "بازدیدکننده واجد شرایط بدون ردیابی رویدادهای محصول قابل محاسبه نیست.",
    sourceRequirement: "Product analytics events"
  },
  signup_rate: {
    id: "signup_rate",
    label: "Signup Rate",
    formula: "Qualified Signups / Qualified Visitors",
    unit: "rate",
    explanation: "تا زمانی که Qualified Visitors وجود ندارد، نرخ ثبت‌نام محاسبه نمی‌شود.",
    sourceRequirement: "Qualified Signups + Qualified Visitors"
  },
  activation_rate: {
    id: "activation_rate",
    label: "Activation Rate",
    formula: "Activated Seekers / Qualified Signups",
    unit: "rate",
    explanation: "چون Qualified Signups فعلاً تقریبی است، این نرخ هم تقریبی نمایش داده می‌شود.",
    sourceRequirement: "ConversationRequest requester + signup qualification"
  },
  request_conversion_rate: {
    id: "request_conversion_rate",
    label: "Request Conversion Rate",
    formula: "Submitted Requests / Activated Seekers",
    unit: "rate",
    explanation: "این نرخ از درخواست‌ها و درخواست‌کننده‌های فعال ساخته می‌شود.",
    sourceRequirement: "ConversationRequest.createdAt + distinct requesterId"
  },
  provider_acceptance_rate: {
    id: "provider_acceptance_rate",
    label: "Provider Acceptance Rate",
    formula: "Accepted Requests / Submitted Requests",
    unit: "rate",
    explanation: "چون Accepted Requests فعلاً از نشانه‌های چرخه عمر برداشت می‌شود، این نرخ تقریبی است.",
    sourceRequirement: "Submitted requests + accepted proxy"
  },
  payment_confirmation_rate: {
    id: "payment_confirmation_rate",
    label: "Payment Confirmation Rate",
    formula: "Paid Sessions / Accepted Requests",
    unit: "rate",
    explanation: "پرداخت‌های PAID نسبت به درخواست‌های پذیرفته‌شده تقریبی.",
    sourceRequirement: "Payment.status + accepted proxy"
  },
  scheduling_rate: {
    id: "scheduling_rate",
    label: "Scheduling Rate",
    formula: "Scheduled Paid Sessions / Paid Sessions",
    unit: "rate",
    explanation: "نسبت جلسه‌های پرداخت‌شده دارای زمان انتخاب‌شده یا قطعی به همه جلسه‌های پرداخت‌شده.",
    sourceRequirement: "Paid sessions + selected/confirmed time"
  },
  session_completion_rate: {
    id: "session_completion_rate",
    label: "Session Completion Rate",
    formula: "Completed Paid Sessions / Scheduled Paid Sessions",
    unit: "rate",
    explanation: "نسبت جلسه‌های پرداخت‌شده تکمیل‌شده به جلسه‌های پرداخت‌شده زمان‌بندی‌شده.",
    sourceRequirement: "Completed paid sessions + scheduled paid sessions"
  }
};

function kpiNode({
  id,
  status,
  numerator,
  denominator,
  categoryFilter,
  dateRangeLabel,
  unsupportedReason,
  dataQualityNote,
  children = []
}: {
  id: AdminKpiNodeId;
  status: AdminKpiStatus;
  numerator: number | null;
  denominator: number | null;
  categoryFilter: ReturnType<typeof supportedCategoryBehavior> | ReturnType<typeof unsupportedCategoryBehavior>;
  dateRangeLabel: string;
  unsupportedReason?: string;
  dataQualityNote?: string;
  children?: AdminKpiTreeNode[];
}): AdminKpiTreeNode {
  const definition = adminPaidSessionsKpiTaxonomy[id];
  const rate = definition.unit === "rate" ? rateValue(numerator, denominator) : null;
  const value = definition.unit === "rate" ? rateLabel(rate) : countLabel(numerator);

  return {
    id,
    label: definition.label,
    value,
    numerator: countLabel(numerator),
    denominator: denominator === null ? notAvailable : countLabel(denominator),
    rate: rateLabel(rate),
    unit: definition.unit,
    status,
    statusLabel: adminKpiStatusLabels[status],
    formula: definition.formula,
    explanation: definition.explanation,
    unsupportedReason,
    dateRangeBehavior: dateRangeBehavior(dateRangeLabel),
    categoryFilterStatus: categoryFilter.status,
    categoryFilterLabel: categoryFilter.label,
    dataQualityNote,
    children
  };
}

export function buildAdminPaidSessionsKpiTree(input: AdminKpiTreeInputs): AdminKpiTreeNode[] {
  const categoryFilter = supportedCategoryBehavior(input.categoryLabel, input.categoryFilterSelected);
  const unsupportedCategoryFilter = unsupportedCategoryBehavior();
  const requestConversionRate = rateValue(input.submittedRequestCount, input.activatedSeekerCount);
  const requestConversionQualityNote =
    requestConversionRate !== null && requestConversionRate >= 1
      ? "Activated Seekers در مدل فعلی یعنی کاربری که حداقل یک درخواست ثبت کرده است؛ بنابراین این نرخ ممکن است به‌صورت ساختاری نزدیک به ۱۰۰٪ یا بیشتر باشد."
      : "Activated Seekers از درخواست‌کننده‌های یکتا با حداقل یک درخواست ساخته می‌شود.";

  const qualifiedVisitors = kpiNode({
    id: "qualified_visitors",
    status: "not_implemented",
    numerator: null,
    denominator: null,
    categoryFilter: unsupportedCategoryFilter,
    dateRangeLabel: input.dateRangeLabel,
    unsupportedReason: "نیازمند visitor tracking یا product analytics event tracking است."
  });
  const signupRate = kpiNode({
    id: "signup_rate",
    status: "not_implemented",
    numerator: input.qualifiedSignupProxyCount,
    denominator: null,
    categoryFilter: unsupportedCategoryFilter,
    dateRangeLabel: input.dateRangeLabel,
    unsupportedReason: "Qualified Visitors در مدل فعلی وجود ندارد."
  });
  const qualifiedSignups = kpiNode({
    id: "qualified_signups",
    status: "proxy",
    numerator: input.qualifiedSignupProxyCount,
    denominator: null,
    categoryFilter: unsupportedCategoryFilter,
    dateRangeLabel: input.dateRangeLabel,
    dataQualityNote: "این عدد همه کاربران ثبت‌شده در بازه است و qualification واقعی را اثبات نمی‌کند.",
    children: [qualifiedVisitors, signupRate]
  });
  const activationRate = kpiNode({
    id: "activation_rate",
    status: "proxy",
    numerator: input.activatedSeekerCount,
    denominator: input.qualifiedSignupProxyCount,
    categoryFilter: unsupportedCategoryFilter,
    dateRangeLabel: input.dateRangeLabel,
    dataQualityNote: "مخرج این نرخ Qualified Signups تقریبی است."
  });
  const activatedSeekers = kpiNode({
    id: "activated_seekers",
    status: "computed",
    numerator: input.activatedSeekerCount,
    denominator: null,
    categoryFilter,
    dateRangeLabel: input.dateRangeLabel,
    children: [qualifiedSignups, activationRate]
  });
  const requestConversion = kpiNode({
    id: "request_conversion_rate",
    status: "computed",
    numerator: input.submittedRequestCount,
    denominator: input.activatedSeekerCount,
    categoryFilter,
    dateRangeLabel: input.dateRangeLabel,
    dataQualityNote: requestConversionQualityNote
  });
  const submittedRequests = kpiNode({
    id: "submitted_requests",
    status: "computed",
    numerator: input.submittedRequestCount,
    denominator: null,
    categoryFilter,
    dateRangeLabel: input.dateRangeLabel,
    children: [activatedSeekers, requestConversion]
  });
  const providerAcceptanceRate = kpiNode({
    id: "provider_acceptance_rate",
    status: "proxy",
    numerator: input.acceptedRequestProxyCount,
    denominator: input.submittedRequestCount,
    categoryFilter,
    dateRangeLabel: input.dateRangeLabel
  });
  const acceptedRequests = kpiNode({
    id: "accepted_requests",
    status: "proxy",
    numerator: input.acceptedRequestProxyCount,
    denominator: null,
    categoryFilter,
    dateRangeLabel: input.dateRangeLabel,
    dataQualityNote: "پذیرش مستقیم در schema فعلی ذخیره نمی‌شود؛ از نمایش به تجربه‌آفرین، زمان پیشنهادی، پاسخ تجربه‌آفرین یا وضعیت‌های بعدی استفاده شده است.",
    children: [submittedRequests, providerAcceptanceRate]
  });
  const paymentConfirmationRate = kpiNode({
    id: "payment_confirmation_rate",
    status: "proxy",
    numerator: input.paidSessionCount,
    denominator: input.acceptedRequestProxyCount,
    categoryFilter,
    dateRangeLabel: input.dateRangeLabel,
    dataQualityNote: "به دلیل تقریبی بودن Accepted Requests، این نرخ هم تقریبی است."
  });
  const paidSessions = kpiNode({
    id: "paid_sessions",
    status: "computed",
    numerator: input.paidSessionCount,
    denominator: null,
    categoryFilter,
    dateRangeLabel: input.dateRangeLabel,
    children: [acceptedRequests, paymentConfirmationRate]
  });
  const schedulingRate = kpiNode({
    id: "scheduling_rate",
    status: "computed",
    numerator: input.scheduledPaidSessionCount,
    denominator: input.paidSessionCount,
    categoryFilter,
    dateRangeLabel: input.dateRangeLabel
  });
  const scheduledPaidSessions = kpiNode({
    id: "scheduled_paid_sessions",
    status: "computed",
    numerator: input.scheduledPaidSessionCount,
    denominator: null,
    categoryFilter,
    dateRangeLabel: input.dateRangeLabel,
    children: [paidSessions, schedulingRate]
  });
  const sessionCompletionRate = kpiNode({
    id: "session_completion_rate",
    status: "computed",
    numerator: input.completedPaidSessionCount,
    denominator: input.scheduledPaidSessionCount,
    categoryFilter,
    dateRangeLabel: input.dateRangeLabel
  });

  return [
    kpiNode({
      id: "completed_paid_sessions",
      status: "computed",
      numerator: input.completedPaidSessionCount,
      denominator: null,
      categoryFilter,
      dateRangeLabel: input.dateRangeLabel,
      children: [scheduledPaidSessions, sessionCompletionRate]
    })
  ];
}

export function buildUnavailableAdminPaidSessionsKpiTree(dateRangeLabel: string, categoryLabel: string): AdminKpiTreeNode[] {
  const emptyInput: AdminKpiTreeInputs = {
    dateRangeLabel,
    categoryLabel,
    categoryFilterSelected: categoryLabel !== "همه دسته‌ها",
    completedPaidSessionCount: 0,
    scheduledPaidSessionCount: 0,
    paidSessionCount: 0,
    acceptedRequestProxyCount: 0,
    submittedRequestCount: 0,
    activatedSeekerCount: 0,
    qualifiedSignupProxyCount: 0
  };

  function markUnavailable(nodes: AdminKpiTreeNode[]): AdminKpiTreeNode[] {
    return nodes.map((node) => ({
      ...node,
      value: notAvailable,
      numerator: notAvailable,
      denominator: notAvailable,
      rate: notAvailable,
      status: "not_implemented",
      statusLabel: adminKpiStatusLabels.not_implemented,
      unsupportedReason: "پایگاه داده یا read model تحلیل در دسترس نیست؛ مقدار نمایشی ساخته نمی‌شود.",
      children: markUnavailable(node.children)
    }));
  }

  return markUnavailable(buildAdminPaidSessionsKpiTree(emptyInput));
}
