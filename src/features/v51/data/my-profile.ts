import {
  derivePreviousCompaniesFromTimeline,
  experienceTimelineIsValid,
  getCurrentTimelineItem,
  getTimelineCoverageWarning,
  initialExperienceTimeline,
  orgLevelTaxonomy,
  validateExperienceTimeline,
  type ExperienceTimelineItem,
  type OrgLevel
} from "./experience-timeline";
import { type InsightAudienceIntent } from "./experience-questions";
import { isValidJobField, jobFieldTaxonomy, type JobField } from "./job-fields";
import { formatter, profiles, toFaDecimal, toman, type ExperienceProfileFixture } from "./profiles";

export type { ExperienceTimelineItem, OrgLevel };

export type ExperienceProfileStatus = "none" | "draft" | "pending_review" | "needs_changes" | "active" | "inactive";

export type ProfileBuilderDraft = {
  displayName: string;
  role: string;
  orgLevel: OrgLevel;
  years: number;
  categories: JobField[];
  companies: string[];
  languages: string[];
  audienceIntents: InsightAudienceIntent[];
  summary: string;
  timeline: ExperienceTimelineItem[];
  price30: number;
  price60: number;
  freeHelp: boolean;
  avatarUrl: string;
};

export type MyExperienceProfile = {
  name: string;
  initials: string;
  roleFa: string;
  orgLevel: OrgLevel;
  yearsOfExperience: number;
  jobCategoriesFa: JobField[];
  previousCompaniesFa: string[];
  experienceTimeline: ExperienceTimelineItem[];
  latestCompanyId: string;
  publicExperienceCompanyIds: string[];
  languages: string[];
  audienceIntents: InsightAudienceIntent[];
  professionalSummary: string;
  pricing: {
    30: number;
    60: number;
  };
  freeHelp: boolean;
  avatarUrl?: string;
};

export type MyProfileDashboardFixture = {
  status: ExperienceProfileStatus;
  profile: MyExperienceProfile;
  incomingRequests: number;
  network: {
    following: number;
    saved: number;
    followers: number;
  };
  stats: {
    successfulConversations: number;
    csat: number;
    profileViews: number;
    availableEarnings: number;
  };
  feedbackCount: number;
  account: {
    name: string;
    email: string;
  };
  settlement: {
    iban: string | null;
  };
};

export type ProfileValidationErrors = Partial<
  Record<"displayName" | "role" | "years" | "categories" | "languages" | "audienceIntents" | "summary" | "timeline" | "price30" | "price60", string>
>;

export type ProfileStatusAction = "submit_for_review" | "resubmit_for_review" | "deactivate_profile" | "reactivate_requires_review" | "submit_material_changes";

export const orgLevels: OrgLevel[] = [...orgLevelTaxonomy];

export const builderCategories = [...jobFieldTaxonomy];
export const profileBuilderDraftStorageKey = "useravaa-v51-profile-builder-draft";

export const builderLanguages = ["فارسی", "انگلیسی"];

export const companySuggestions = ["اسنپ", "دیجی‌کالا", "کافه‌بازار", "دیوار"];

export const pricingCapsByLevel: Record<OrgLevel, { 30: number; 60: number }> = {
  کارآموز: { 30: 100000, 60: 250000 },
  کارشناس: { 30: 300000, 60: 500000 },
  "کارشناس ارشد": { 30: 500000, 60: 900000 },
  "مدیر میانی": { 30: 1000000, 60: 1800000 },
  "مدیر ارشد": { 30: 1000000, 60: 1800000 },
  معاونت: { 30: 2500000, 60: 4000000 },
  "مدیر کسب و کار": { 30: 4000000, 60: 7000000 }
};

export const initialBuilderDraft: ProfileBuilderDraft = {
  displayName: "علی ر.",
  role: "مدیر محصول",
  orgLevel: "مدیر میانی",
  years: 8,
  categories: ["محصول و تجربه کاربر"],
  companies: ["اسنپ", "دیجی‌کالا"],
  languages: ["فارسی"],
  audienceIntents: ["career_path", "current_growth"],
  summary: "تجربه در تیم‌های محصول و تحلیل داده، با تمرکز بر تصمیم‌سازی محصولی.",
  timeline: initialExperienceTimeline,
  price30: 1000000,
  price60: 1800000,
  freeHelp: false,
  avatarUrl: ""
};

export const myProfileDashboardFixture: MyProfileDashboardFixture = {
  status: "active",
  profile: {
    name: "علی ر.",
    initials: "ع",
    roleFa: "مدیر محصول",
    orgLevel: "مدیر میانی",
    yearsOfExperience: 8,
    jobCategoriesFa: ["محصول و تجربه کاربر"],
    previousCompaniesFa: ["اسنپ", "دیجی‌کالا"],
    experienceTimeline: initialExperienceTimeline,
    latestCompanyId: "timeline-current-snapp",
    publicExperienceCompanyIds: ["timeline-previous-digikala"],
    languages: ["فارسی"],
    audienceIntents: ["career_path", "current_growth"],
    professionalSummary: "تجربه در تیم‌های محصول و تحلیل داده، با تمرکز بر تصمیم‌سازی محصولی.",
    pricing: { 30: 1000000, 60: 1800000 },
    freeHelp: false
  },
  incomingRequests: 2,
  network: {
    following: 1,
    saved: 1,
    followers: 212
  },
  stats: {
    successfulConversations: 42,
    csat: 4.8,
    profileViews: 248,
    availableEarnings: 1800000
  },
  feedbackCount: 3,
  account: {
    name: "علی ر.",
    email: "user@example.com"
  },
  settlement: {
    iban: "IR••••••••••••••••۴۲۱"
  }
};

export function getDashboardFixture(status?: string | null): MyProfileDashboardFixture {
  const normalized = normalizeProfileStatus(status);
  return {
    ...myProfileDashboardFixture,
    status: normalized
  };
}

export function normalizeProfileStatus(status?: string | null): ExperienceProfileStatus {
  if (status === "none" || status === "draft" || status === "pending_review" || status === "needs_changes" || status === "active" || status === "inactive") {
    return status;
  }

  return "active";
}

export function statusCopy(status: ExperienceProfileStatus) {
  const copy: Record<ExperienceProfileStatus, { tone: string; badge: string; title: string; body: string }> = {
    none: {
      tone: "none",
      badge: "پروفایل ساخته نشده",
      title: "پروفایل تجربه‌ات را بساز",
      body: "پروفایل تجربه بساز تا دیگران بتوانند برای جلسه مشاوره به تو درخواست بدهند."
    },
    draft: {
      tone: "none",
      badge: "پیش‌نویس",
      title: "پروفایل تجربه‌ات را بساز",
      body: "اطلاعات را کامل کن و برای بررسی بفرست."
    },
    pending_review: {
      tone: "pending",
      badge: "در انتظار بررسی",
      title: "پروفایل تجربه تو در انتظار بررسی است",
      body: "بعد از تأیید، در کشف تجربه‌ها دیده می‌شوی."
    },
    needs_changes: {
      tone: "pending",
      badge: "نیازمند اصلاح",
      title: "پروفایل تجربه نیازمند اصلاح است",
      body: "اگر موردی نیاز به تغییر داشته باشد، اطلاعات را اصلاح کن و دوباره برای بررسی بفرست."
    },
    inactive: {
      tone: "inactive",
      badge: "غیرفعال",
      title: "پروفایل تجربه تو غیرفعال است",
      body: "فعلاً در کشف تجربه‌ها دیده نمی‌شوی."
    },
    active: {
      tone: "active",
      badge: "فعال در کشف تجربه‌ها",
      title: "پروفایل تجربه تو فعال است",
      body: "در کشف تجربه‌ها دیده می‌شوی، درخواست جلسه مشاوره دریافت می‌کنی و بینش‌های منتشرشده‌ات در پروفایل دیده می‌شوند."
    }
  };

  return copy[status];
}

export function transitionProfileStatus(status: ExperienceProfileStatus, action: ProfileStatusAction): ExperienceProfileStatus {
  if (status === "draft" && action === "submit_for_review") {
    return "pending_review";
  }

  if (status === "needs_changes" && action === "resubmit_for_review") {
    return "pending_review";
  }

  if (status === "active" && action === "deactivate_profile") {
    return "inactive";
  }

  if (status === "inactive" && action === "reactivate_requires_review") {
    return "pending_review";
  }

  if (status === "active" && action === "submit_material_changes") {
    return "pending_review";
  }

  return status;
}

export function addCompanyTag(companies: string[], name: string) {
  const clean = name.trim();
  return !clean || companies.includes(clean) ? companies : [...companies, clean];
}

export function removeCompanyTag(companies: string[], name: string) {
  return companies.filter((item) => item !== name);
}

export function toggleSelection<TItem extends string>(items: TItem[], item: TItem) {
  return items.includes(item) ? items.filter((current) => current !== item) : [...items, item];
}

export function validateAvatarCandidate(file: { type: string; size: number } | null | undefined) {
  if (!file) {
    return "";
  }

  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
    return "فرمت عکس باید PNG، JPG یا WebP باشد.";
  }

  if (file.size > 2 * 1024 * 1024) {
    return "حجم عکس نباید بیشتر از ۲ مگابایت باشد.";
  }

  return "";
}

export function getPricingCap(orgLevel: OrgLevel) {
  return pricingCapsByLevel[orgLevel] ?? pricingCapsByLevel["کارشناس"];
}

export function pricingCapText(orgLevel: OrgLevel) {
  const cap = getPricingCap(orgLevel);
  return `سقف قیمت ${orgLevel}: ۳۰ دقیقه تا ${toman(cap[30])}، ۱ ساعت تا ${toman(cap[60])}. می‌توانی عدد کمتر انتخاب کنی.`;
}

export function moneyOrFree(value: number) {
  return value === 0 ? "رایگان" : toman(value);
}

export function updateDraftOrgLevel(draft: ProfileBuilderDraft, orgLevel: OrgLevel): ProfileBuilderDraft {
  const cap = getPricingCap(orgLevel);
  return {
    ...draft,
    orgLevel,
    price30: draft.freeHelp ? 0 : cap[30],
    price60: draft.freeHelp ? 0 : cap[60]
  };
}

export function setFreeHelp(draft: ProfileBuilderDraft, enabled: boolean, previousPaidPrices?: { price30: number; price60: number }): ProfileBuilderDraft {
  if (enabled) {
    return {
      ...draft,
      freeHelp: true,
      price30: 0,
      price60: 0
    };
  }

  const cap = getPricingCap(draft.orgLevel);
  return {
    ...draft,
    freeHelp: false,
    price30: Math.min(previousPaidPrices?.price30 ?? cap[30], cap[30]),
    price60: Math.min(previousPaidPrices?.price60 ?? cap[60], cap[60])
  };
}

export function validateProfileDraft(draft: ProfileBuilderDraft): ProfileValidationErrors {
  const errors: ProfileValidationErrors = {};
  const cap = getPricingCap(draft.orgLevel);

  if (!draft.displayName.trim() || draft.displayName.trim().length < 2) {
    errors.displayName = "نام نمایشی را کامل کن.";
  }

  if (!draft.role.trim() || draft.role.trim().length < 2) {
    errors.role = "عنوان شغلی را وارد کن.";
  }

  if (draft.years < 0 || draft.years > 40 || Number.isNaN(draft.years)) {
    errors.years = "سال سابقه باید بین ۰ تا ۴۰ باشد.";
  }

  if (draft.categories.length !== 1 || draft.categories.some((category) => !isValidJobField(category))) {
    errors.categories = "حوزه شغلی را از لیست انتخاب کن.";
  }

  if (!draft.languages.length) {
    errors.languages = "حداقل یک زبان انتخاب کن.";
  }

  if (!draft.audienceIntents?.length) {
    errors.audienceIntents = "حداقل یک گروه مخاطب را انتخاب کن.";
  }

  if (!draft.summary.trim() || draft.summary.trim().length < 20) {
    errors.summary = "معرفی حرفه‌ای باید حداقل ۲۰ کاراکتر باشد.";
  }

  if (!experienceTimelineIsValid(draft.timeline)) {
    errors.timeline = "سوابق تجربه را کامل کن.";
  }

  if (!draft.freeHelp) {
    if (draft.price30 < 0) {
      errors.price30 = "قیمت ۳۰ دقیقه نمی‌تواند منفی باشد.";
    }

    if (draft.price60 < 0) {
      errors.price60 = "قیمت ۱ ساعت نمی‌تواند منفی باشد.";
    }

    if (draft.price30 > cap[30]) {
      errors.price30 = `حداکثر قیمت ۳۰ دقیقه برای این رده ${toman(cap[30])} است.`;
    }

    if (draft.price60 > cap[60]) {
      errors.price60 = `حداکثر قیمت ۱ ساعت برای این رده ${toman(cap[60])} است.`;
    }

    if (draft.price60 < draft.price30) {
      errors.price60 = "قیمت ۱ ساعت نباید کمتر از ۳۰ دقیقه باشد.";
    }
  }

  return errors;
}

export function profileDraftIsValid(draft: ProfileBuilderDraft) {
  return Object.keys(validateProfileDraft(draft)).length === 0;
}

export function submitProfileForReview(draft: ProfileBuilderDraft) {
  if (!profileDraftIsValid(draft)) {
    return {
      status: "draft" as ExperienceProfileStatus,
      profile: null
    };
  }

  return {
    status: "pending_review" as ExperienceProfileStatus,
    profile: profileFromBuilderDraft(draft)
  };
}

export function profileFromBuilderDraft(draft: ProfileBuilderDraft): MyExperienceProfile {
  const current = getCurrentTimelineItem(draft.timeline);
  const jobField = current?.jobField && isValidJobField(current.jobField) ? current.jobField : draft.categories[0];

  return {
    name: draft.displayName,
    initials: draft.displayName.trim()[0] ?? "؟",
    roleFa: current?.jobTitle || draft.role,
    orgLevel: current?.orgLevel || draft.orgLevel,
    yearsOfExperience: draft.years,
    jobCategoriesFa: jobField ? [jobField] : [],
    previousCompaniesFa: derivePreviousCompaniesFromTimeline(draft.timeline),
    experienceTimeline: draft.timeline,
    latestCompanyId: current?.id ?? draft.timeline[0]?.id ?? "",
    publicExperienceCompanyIds: [],
    languages: draft.languages,
    audienceIntents: draft.audienceIntents?.length ? draft.audienceIntents : ["current_growth"],
    professionalSummary: draft.summary,
    pricing: {
      30: draft.price30,
      60: draft.price60
    },
    freeHelp: draft.freeHelp,
    avatarUrl: draft.avatarUrl || undefined
  };
}

export function profileTimelineWarning(draft: ProfileBuilderDraft) {
  return getTimelineCoverageWarning(draft.timeline, draft.years);
}

export function getProfileTimelineErrors(draft: ProfileBuilderDraft) {
  return validateExperienceTimeline(draft.timeline);
}

export function faSummaryCount(summary: string) {
  return `${formatter.format(summary.length)} / ۲۲۰`;
}

export function formatCsat(csat: number) {
  return toFaDecimal(csat);
}

export type NetworkTab = "saved";
export type NetworkSort = "recent" | "level" | "name";

export type NetworkProfile = ExperienceProfileFixture & {
  followerSince?: string;
  reason?: string;
};

export type NetworkFilters = {
  query: string;
  category: string;
  sort: NetworkSort;
};

export type ReceivedFeedback = {
  id: string;
  name: string;
  role: string;
  rating: 1 | 2 | 3 | 4 | 5;
  text: string;
};

export const networkTabs: Array<{ id: NetworkTab; label: string; intro: string }> = [
  { id: "saved", label: "ذخیره‌شده‌ها", intro: "پروفایل‌هایی که ذخیره کرده‌ای." }
];

export const networkCategoryFilters = [...jobFieldTaxonomy];

export const initialFollowingProfileIds = ["sara", "reza"];
export const initialSavedProfileIds = ["nazanin", "mina"];
export const followerProfileIds = ["sara", "nazanin", "mina", "reza"];

export const receivedFeedbackItems: ReceivedFeedback[] = [
  { id: "fb-1", name: "سارا م.", role: "طراح محصول", rating: 5, text: "جلسه روشن، کاربردی و دقیق بود." },
  { id: "fb-2", name: "علی ر.", role: "BI Analyst", rating: 4, text: "کمک کرد تصمیمم درباره مسیر Product و BI واضح‌تر شود." },
  { id: "fb-3", name: "مینا پ.", role: "کارشناس رشد", rating: 5, text: "خیلی سریع به نقطه اصلی مسئله رسیدیم." }
];

const orgLevelRank: Record<string, number> = {
  کارآموز: 1,
  کارشناس: 2,
  "کارشناس ارشد": 3,
  "مدیر میانی": 4,
  "مدیر ارشد": 5,
  معاونت: 6,
  "مدیر کسب و کار": 7
};

function profileById(profileId: string): ExperienceProfileFixture | undefined {
  return profiles.find((profile) => profile.id === profileId) as ExperienceProfileFixture | undefined;
}

export function normalizeNetworkTab(tab?: string | null): NetworkTab {
  void tab;
  return "saved";
}

export function toggleNetworkProfileId(profileIds: readonly string[], profileId: string) {
  return profileIds.includes(profileId) ? profileIds.filter((id) => id !== profileId) : [...profileIds, profileId];
}

export function getNetworkItems(_tab: NetworkTab, followingIds: readonly string[], savedIds: readonly string[]): NetworkProfile[] {
  const ids = savedIds;

  return ids
    .map((id) => profileById(id))
    .filter((profile): profile is ExperienceProfileFixture => Boolean(profile))
    .map((profile) => ({
      ...profile,
      isFollowing: followingIds.includes(profile.id),
      isSaved: savedIds.includes(profile.id),
      reason: "ذخیره‌شده است."
    }));
}

export function filterNetworkItems(items: readonly NetworkProfile[], filters: NetworkFilters) {
  const query = filters.query.trim().toLowerCase();
  let next = [...items];

  if (query) {
    next = next.filter((profile) =>
      [profile.name, profile.roleFa, profile.orgLevel, ...profile.jobCategoriesFa].join(" ").toLowerCase().includes(query)
    );
  }

  if (filters.category) {
    if (!isValidJobField(filters.category)) {
      next = [];
    } else {
      const category = filters.category;
      next = next.filter((profile) => profile.jobCategoriesFa.includes(category));
    }
  }

  if (filters.sort === "name") {
    next.sort((a, b) => a.name.localeCompare(b.name, "fa"));
  }

  if (filters.sort === "level") {
    next.sort((a, b) => (orgLevelRank[b.orgLevel] ?? 0) - (orgLevelRank[a.orgLevel] ?? 0));
  }

  if (filters.sort === "recent") {
    next.sort((a, b) => a.lastActiveDays - b.lastActiveDays);
  }

  return next;
}

export function getFeedbackSummary(feedbacks: readonly ReceivedFeedback[] = receivedFeedbackItems) {
  const average = feedbacks.length ? feedbacks.reduce((total, item) => total + item.rating, 0) / feedbacks.length : 0;

  return {
    count: feedbacks.length,
    average,
    successfulConversations: myProfileDashboardFixture.stats.successfulConversations
  };
}

export function renderStars(rating: number) {
  return `${"★".repeat(rating)}${"☆".repeat(Math.max(0, 5 - rating))}`;
}

export type AccountSettings = {
  name: string;
  email: string;
  phone: string;
};

export type NotificationSettings = {
  newRequests: boolean;
  proposedTimes: boolean;
  paymentSettlement: boolean;
};

export type PrivacySettings = {
  showProfileAfterApproval: boolean;
  showFollowerCount: boolean;
};

export type SettlementSettings = {
  accountOwner: string;
  iban: string;
  verified: boolean;
};

export type CompanyDisplaySettings = {
  experienceTimeline: ExperienceTimelineItem[];
  latestCompanyId: string;
  publicExperienceCompanyIds: string[];
};

export type ProfileSettingsFixture = {
  account: AccountSettings;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  settlement: SettlementSettings;
  companyDisplay: CompanyDisplaySettings;
};

export type AccountSettingsErrors = Partial<Record<keyof AccountSettings, string>>;
export type SettlementSettingsErrors = Partial<Record<"accountOwner" | "iban", string>>;

export const initialProfileSettingsFixture: ProfileSettingsFixture = {
  account: {
    name: "علی ر.",
    email: "user@example.com",
    phone: "۰۹۱۲۱۲۳۴۵۶۷"
  },
  notifications: {
    newRequests: true,
    proposedTimes: true,
    paymentSettlement: true
  },
  privacy: {
    showProfileAfterApproval: true,
    showFollowerCount: false
  },
  settlement: {
    accountOwner: "",
    iban: "",
    verified: false
  },
  companyDisplay: {
    experienceTimeline: initialExperienceTimeline,
    latestCompanyId: "timeline-current-snapp",
    publicExperienceCompanyIds: ["timeline-previous-digikala"]
  }
};

export function getLatestCompanyDisplayItem(settings: CompanyDisplaySettings) {
  return settings.experienceTimeline.find((item) => item.id === settings.latestCompanyId && item.companyName.trim()) ?? null;
}

export function getSelectablePublicCompanyItems(settings: CompanyDisplaySettings) {
  return settings.experienceTimeline.filter((item) => item.id !== settings.latestCompanyId && item.companyName.trim());
}

export function normalizePublicCompanyDisplayIds(settings: CompanyDisplaySettings) {
  const validIds = new Set(settings.experienceTimeline.map((item) => item.id));

  return Array.from(new Set(settings.publicExperienceCompanyIds.filter((companyId) => validIds.has(companyId) && companyId !== settings.latestCompanyId)));
}

export function validateCompanyDisplaySettings(settings: CompanyDisplaySettings) {
  return {
    latestCompanyId: getLatestCompanyDisplayItem(settings) ? "" : "آخرین شرکت محل فعالیت الزامی است."
  };
}

export function normalizePersianDigits(value: string) {
  return String(value || "")
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
}

export function validateAccountSettings(account: AccountSettings): AccountSettingsErrors {
  const errors: AccountSettingsErrors = {};
  const phone = normalizePersianDigits(account.phone.trim());

  if (account.name.trim().length < 2) {
    errors.name = "نام را کامل وارد کن.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(account.email.trim())) {
    errors.email = "ایمیل معتبر وارد کن.";
  }

  if (!/^09\d{9}$/.test(phone)) {
    errors.phone = "شماره موبایل باید با 09 شروع شود و ۱۱ رقم باشد.";
  }

  return errors;
}

export function normalizeIban(value: string) {
  return normalizePersianDigits(value).replace(/\s+/g, "").toUpperCase();
}

export function formatIban(value: string) {
  return normalizeIban(value).replace(/(.{4})/g, "$1 ").trim();
}

export function validateIranIban(iban: string) {
  return /^IR\d{24}$/.test(normalizeIban(iban));
}

export function validateSettlementSettings(settlement: SettlementSettings): SettlementSettingsErrors {
  const errors: SettlementSettingsErrors = {};

  if (settlement.accountOwner.trim().length < 3) {
    errors.accountOwner = "نام صاحب حساب را کامل وارد کن.";
  }

  if (!validateIranIban(settlement.iban)) {
    errors.iban = "شماره شبا باید با IR شروع شود و ۲۴ رقم بعد از آن داشته باشد.";
  }

  return errors;
}

export function applyAccountSettings(current: AccountSettings, draft: AccountSettings) {
  const errors = validateAccountSettings(draft);

  return {
    account: Object.keys(errors).length ? current : { ...draft, phone: normalizePersianDigits(draft.phone) },
    errors,
    saved: Object.keys(errors).length === 0
  };
}

export function updateNotificationSetting(settings: NotificationSettings, key: keyof NotificationSettings, checked: boolean): NotificationSettings {
  return {
    ...settings,
    [key]: checked
  };
}

export function updatePrivacySetting(settings: PrivacySettings, key: keyof PrivacySettings, checked: boolean): PrivacySettings {
  return {
    ...settings,
    [key]: checked
  };
}

export function applySettlementSettings(current: SettlementSettings, draft: SettlementSettings) {
  const normalizedDraft = {
    ...draft,
    iban: normalizeIban(draft.iban)
  };
  const errors = validateSettlementSettings(normalizedDraft);

  return {
    settlement: Object.keys(errors).length ? current : { ...normalizedDraft, verified: true },
    errors,
    saved: Object.keys(errors).length === 0
  };
}
