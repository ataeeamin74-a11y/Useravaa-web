import { getCurrentTimelineItem, type ExperienceTimelineItem } from "./experience-timeline";
import { currentInsightQuestionCycle } from "./insight-question-cycle";
import { jobFieldTaxonomy, type JobField } from "./job-fields";
import { profiles, type ExperienceProfileFixture } from "./profiles";

export const discoveryPackageFilesUsed = [
  "CODEX_PROMPT_START_EXPERIENCE_DISCOVERY_SYSTEM.txt",
  "experience-discovery-system.prd.md",
  "experience-discovery-system.ux-spec.md",
  "experience-discovery-system.ui-spec.md",
  "SHARED_TAXONOMY_AND_RULES.json",
  "ACCEPTANCE_TESTS.md",
  "COMPONENT_CONTRACTS.md"
] as const;

export const organizationalLevels = [
  "کارآموز",
  "کارشناس",
  "کارشناس ارشد",
  "مدیر میانی",
  "مدیر ارشد",
  "معاونت",
  "مدیر کسب و کار"
] as const;

export const conversationLanguageOptions = ["فارسی", "انگلیسی", "فارسی و انگلیسی"] as const;

export type ConversationLanguageOption = (typeof conversationLanguageOptions)[number];

export type DiscoverFilters = {
  jobCategories: JobField[];
  orgLevels: string[];
  previousCompanies: string[];
  languages: ConversationLanguageOption[];
};

export const emptyDiscoverFilters: DiscoverFilters = {
  jobCategories: [],
  orgLevels: [],
  previousCompanies: [],
  languages: []
};

export type InsightIntent = "شناخت مسیر شغلی" | "تغییر مسیر شغلی" | "رشد در مسیر فعلی" | "انتقال تجربه";
export type SeekerInsightIntent = Exclude<InsightIntent, "انتقال تجربه">;

export const insightIntents: Array<{
  title: InsightIntent;
  description: string;
}> = [
  {
    title: "شناخت مسیر شغلی",
    description: "برای وقتی که هنوز می‌خواهی بفهمی یک مسیر واقعاً چیست."
  },
  {
    title: "تغییر مسیر شغلی",
    description: "برای وقتی که می‌خواهی از یک مسیر وارد مسیر دیگری شوی."
  },
  {
    title: "رشد در مسیر فعلی",
    description: "برای وقتی که در مسیرت هستی و می‌خواهی سطح بعدی را بفهمی."
  },
  {
    title: "انتقال تجربه",
    description: "برای وقتی که می‌خواهی تجربه‌ات را با آدم‌های مرتبط به اشتراک بگذاری."
  }
];

export const askQuestionIntentOptions = ["شناخت مسیر", "تغییر مسیر", "رشد در مسیر فعلی"] as const;

export const suggestedQuestionsByIntent: Record<InsightIntent, readonly string[]> = {
  "شناخت مسیر شغلی": [
    "این مسیر واقعاً چه چیزی دارد که از بیرون دیده نمی‌شود؟",
    "بیرون از این عنوان شغلی معمولاً چه چیزی اشتباه فهمیده می‌شود؟",
    "از کجا بفهمم این مسیر برای من مناسب است یا نه؟"
  ],
  "تغییر مسیر شغلی": [
    "برای تغییر مسیر به این حوزه، بزرگ‌ترین اشتباه چیست؟",
    "اگر از مسیر دیگری وارد این حوزه شوم، از کجا باید شروع کنم؟",
    "چه چیزی در این مسیر مهم‌تر از چیزی است که معمولاً تصور می‌شود؟"
  ],
  "رشد در مسیر فعلی": [
    "برای رفتن به سطح بعدی، چه چیزی واقعاً تعیین‌کننده است؟",
    "فرق سطح کارشناس با کارشناس ارشد در این مسیر چیست؟",
    "چرا بعضی آدم‌ها با وجود تجربه زیاد رشد نمی‌کنند؟"
  ],
  "انتقال تجربه": [
    "بیرون از عنوان شغلی شما معمولاً چه چیزی اشتباه فهمیده می‌شود؟",
    "کسی که می‌خواهد وارد این مسیر شود، معمولاً کجا اشتباه می‌کند؟",
    "برای رشد به سطح بعدی، چه چیزی واقعاً تعیین‌کننده است؟"
  ]
};

export type InsightType = "واقعیت پنهان" | "از بیرون / از درون" | "کاش می‌دانستم" | "یادگیری پرهزینه" | "دوراهی سخت";

export const insightTypes = ["واقعیت پنهان", "از بیرون / از درون", "کاش می‌دانستم", "یادگیری پرهزینه", "دوراهی سخت"] as const;

export const allJobCategoriesFilterLabel = "همه دسته‌بندی‌های شغلی";
export const allInsightTypesFilterLabel = "همه بینش‌ها";
export const INSIGHT_CANONICAL_BASE_URL = "https://useravaa.com";

export type PublishedInsight = {
  id: string;
  slug: string;
  canonicalUrl: string;
  type: InsightType;
  sourceType: "template" | "question_bank";
  templateStem?: string;
  questionText?: string;
  profileId: string;
  intent: SeekerInsightIntent;
  jobCategory: JobField;
  question: string;
  answer: string;
  answerText: string;
  status: "published" | "retracted" | "draft";
  publishedAt: string | null;
  relativeDateFa: string;
};

const publishedInsightSeeds = [
  {
    id: "insight-ali-path-1",
    slug: "active-question-product-ambiguity-ali",
    type: "واقعیت پنهان",
    sourceType: "question_bank",
    questionText: currentInsightQuestionCycle.questionText,
    profileId: "ali",
    intent: "شناخت مسیر شغلی",
    jobCategory: "محصول و تجربه کاربر",
    question: "این مسیر واقعاً چه چیزی دارد که از بیرون دیده نمی‌شود؟",
    answer:
      "در محصول، بخش پنهان کار تبدیل ابهام به تصمیم‌های کوچک و قابل اجراست. خیلی وقت‌ها مسئله کامل نیست و باید با داده ناقص، تیم‌های مختلف و محدودیت زمان جلو رفت. همین بخش است که کیفیت تصمیم را از یک فهرست ایده جدا می‌کند.",
    status: "published",
    publishedAt: "2026-05-21T09:00:00.000Z",
    relativeDateFa: "امروز"
  },
  {
    id: "insight-sara-switch-1",
    slug: "career-switch-product-design-sara",
    type: "کاش می‌دانستم",
    sourceType: "template",
    templateStem: "کاش می‌دانستم که...",
    profileId: "sara",
    intent: "تغییر مسیر شغلی",
    jobCategory: "محصول و تجربه کاربر",
    question: "برای تغییر مسیر به این حوزه، بزرگ‌ترین اشتباه چیست؟",
    answer:
      "بزرگ‌ترین اشتباه این است که فقط ابزار طراحی یا عنوان شغلی را یاد بگیری. تغییر مسیر وقتی جدی می‌شود که بتوانی مسئله کاربر، محدودیت کسب‌وکار و کیفیت اجرا را همزمان ببینی.",
    status: "published",
    publishedAt: "2026-05-19T09:00:00.000Z",
    relativeDateFa: "۲ روز پیش"
  },
  {
    id: "insight-nazanin-growth-1",
    slug: "data-growth-level-nazanin",
    type: "یادگیری پرهزینه",
    sourceType: "template",
    templateStem: "چیزی که از بیرون دیده نمی‌شود این است که...",
    profileId: "nazanin",
    intent: "رشد در مسیر فعلی",
    jobCategory: "علوم داده و هوش مصنوعی",
    question: "برای رفتن به سطح بعدی، چه چیزی واقعاً تعیین‌کننده است؟",
    answer:
      "در داده، سطح بعدی فقط نوشتن کوئری پیچیده‌تر نیست. باید بتوانی سؤال درست را از ذی‌نفع بگیری، محدودیت داده را شفاف بگویی و خروجی را به تصمیم قابل اقدام تبدیل کنی.",
    status: "published",
    publishedAt: "2026-05-18T09:00:00.000Z",
    relativeDateFa: "۳ روز پیش"
  },
  {
    id: "insight-reza-path-1",
    slug: "engineering-management-reality-reza",
    type: "از بیرون / از درون",
    sourceType: "template",
    templateStem: "چیزی که از بیرون دیده نمی‌شود این است که...",
    profileId: "reza",
    intent: "شناخت مسیر شغلی",
    jobCategory: "فنی و مهندسی نرم‌افزار",
    question: "بیرون از این عنوان شغلی معمولاً چه چیزی اشتباه فهمیده می‌شود؟",
    answer:
      "مدیریت مهندسی از بیرون شبیه تقسیم کار فنی دیده می‌شود، اما در عمل بیشتر درباره ساختن اعتماد، واضح کردن اولویت‌ها و کم کردن ابهام تیم است.",
    status: "published",
    publishedAt: "2026-05-15T09:00:00.000Z",
    relativeDateFa: "۶ روز پیش"
  },
  {
    id: "insight-mina-growth-1",
    slug: "growth-experiment-learning-mina",
    type: "دوراهی سخت",
    sourceType: "template",
    templateStem: "سخت‌ترین تصمیم من این بود که...",
    profileId: "mina",
    intent: "رشد در مسیر فعلی",
    jobCategory: "مارکتینگ و برند",
    question: "چرا بعضی آدم‌ها با وجود تجربه زیاد رشد نمی‌کنند؟",
    answer:
      "در رشد، تکرار کمپین‌ها به‌تنهایی تجربه عمیق نمی‌سازد. رشد واقعی وقتی اتفاق می‌افتد که هر آزمایش به یادگیری قابل انتقال برای محصول، محتوا و کانال بعدی تبدیل شود.",
    status: "published",
    publishedAt: "2026-05-14T09:00:00.000Z",
    relativeDateFa: "۷ روز پیش"
  },
  {
    id: "insight-ali-switch-2",
    slug: "product-team-alignment-ali",
    type: "کاش می‌دانستم",
    sourceType: "template",
    templateStem: "بزرگترین اشتباه من این بود که...",
    profileId: "ali",
    intent: "تغییر مسیر شغلی",
    jobCategory: "محصول و تجربه کاربر",
    question: "چه چیزی در این مسیر مهم‌تر از چیزی است که معمولاً تصور می‌شود؟",
    answer:
      "توانایی هماهنگی با تیم‌های متفاوت از دانستن یک چارچوب محصولی مهم‌تر است. اگر نتوانی عملیات، طراحی و داده را دور یک مسئله مشترک نگه داری، تصمیم محصولی روی کاغذ می‌ماند.",
    status: "published",
    publishedAt: "2026-05-12T09:00:00.000Z",
    relativeDateFa: "۹ روز پیش"
  },
  {
    id: "insight-ali-decision-3",
    slug: "product-focus-decision-ali",
    type: "دوراهی سخت",
    sourceType: "template",
    templateStem: "سخت‌ترین تصمیم من این بود که...",
    profileId: "ali",
    intent: "رشد در مسیر فعلی",
    jobCategory: "محصول و تجربه کاربر",
    question: "در رشد محصول، سخت‌ترین تصمیمی که معمولاً از بیرون ساده دیده می‌شود چیست؟",
    answer:
      "سخت‌ترین تصمیم من این بود که بین اضافه‌کردن قابلیت‌های جذاب و حل یک مسئله کوچک اما واقعی یکی را انتخاب کنم. از بیرون، قابلیت بیشتر یعنی پیشرفت؛ اما در عمل باید جرئت داشته باشی تمرکز تیم را روی همان مسئله‌ای نگه داری که اثر واقعی روی کاربر دارد.",
    status: "published",
    publishedAt: "2026-05-10T09:00:00.000Z",
    relativeDateFa: "۱۱ روز پیش"
  },
  {
    id: "insight-mohsen-data-1",
    slug: "hidden-reality-data-to-product-mohsen",
    type: "واقعیت پنهان",
    sourceType: "template",
    templateStem: "چیزی که از بیرون دیده نمی‌شود این است که...",
    profileId: "mohsen",
    intent: "شناخت مسیر شغلی",
    jobCategory: "علوم داده و هوش مصنوعی",
    question: "این مسیر واقعاً چه چیزی دارد که از بیرون دیده نمی‌شود؟",
    answer:
      "در تحلیل داده، بخش سخت کار ساختن نمودار نیست؛ سخت‌ترین بخش این است که از میان داده ناقص، سؤال درست را جدا کنی و نتیجه را طوری به تیم محصول توضیح بدهی که واقعاً به تصمیم تبدیل شود.",
    status: "published",
    publishedAt: "2026-05-09T09:00:00.000Z",
    relativeDateFa: "۱۲ روز پیش"
  },
  {
    id: "insight-ali-draft-hidden",
    slug: "draft-hidden-ali",
    type: "واقعیت پنهان",
    sourceType: "template",
    templateStem: "کاش می‌دانستم که...",
    profileId: "ali",
    intent: "شناخت مسیر شغلی",
    jobCategory: "محصول و تجربه کاربر",
    question: "پیش‌نویس داخلی که نباید عمومی شود.",
    answer: "این پاسخ هنوز پیش‌نویس است و نباید در /insights یا پروفایل عمومی دیده شود.",
    status: "draft",
    publishedAt: null,
    relativeDateFa: "پیش‌نویس"
  },
  {
    id: "insight-ali-retracted-hidden",
    slug: "retracted-hidden-ali",
    type: "کاش می‌دانستم",
    sourceType: "question_bank",
    questionText: currentInsightQuestionCycle.questionText,
    profileId: "ali",
    intent: "تغییر مسیر شغلی",
    jobCategory: "محصول و تجربه کاربر",
    question: "بینش پس‌گرفته‌شده که نباید عمومی شود.",
    answer: "این پاسخ پس گرفته شده است و نباید در /insights یا پروفایل عمومی دیده شود.",
    status: "retracted",
    publishedAt: null,
    relativeDateFa: "پس‌گرفته‌شده"
  }
] as const satisfies readonly Omit<PublishedInsight, "answerText" | "canonicalUrl">[];

export function getInsightCanonicalPath(insight: Pick<PublishedInsight, "id" | "slug">) {
  return `/insights/${insight.slug || insight.id}`;
}

export function getInsightCanonicalUrl(insight: Pick<PublishedInsight, "id" | "slug">) {
  return `${INSIGHT_CANONICAL_BASE_URL}${getInsightCanonicalPath(insight)}`;
}

export const publishedInsights: PublishedInsight[] = publishedInsightSeeds.map((insight) => ({
  ...insight,
  canonicalUrl: getInsightCanonicalUrl(insight),
  answerText: insight.answer
}));

export function getPublishedInsightBySlugOrId(slugOrId: string) {
  return (
    publishedInsights.find(
      (insight) => insight.status === "published" && (insight.slug === slugOrId || insight.id === slugOrId)
    ) ?? null
  );
}

export const discoveryAnalyticsEvents = [
  "discover_search_submitted",
  "discover_filter_applied",
  "discover_filter_removed",
  "discover_filters_reset",
  "discover_result_card_viewed",
  "discover_profile_opened",
  "discover_experience_saved",
  "discover_empty_state_shown"
] as const;

export const INSIGHT_ANALYTICS_EVENTS = {
  PAGE_OPENED: "insight_page_opened",
  FILTER_OPENED: "insight_filter_opened",
  FILTER_APPLIED: "insight_filter_applied",
  CARD_VIEWED: "insight_card_viewed",
  PROFILE_OPENED: "insight_profile_opened",
  SAVED: "insight_saved",
  DOWNLOAD_CLICKED: "insight_download_clicked",
  DOWNLOAD_PREVIEW_OPENED: "insight_download_preview_opened",
  IMAGE_SAVED: "insight_image_saved",
  LINK_COPIED: "insight_link_copied",
  LOAD_MORE_CLICKED: "insight_load_more_clicked",
  PROVIDER_ANSWER_CTA_CLICKED: "provider_answer_cta_clicked"
} as const;

export const insightsAnalyticsEvents = Object.values(INSIGHT_ANALYTICS_EVENTS);

export function normalizeDiscoveryText(value: string) {
  return value
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("fa-IR");
}

export function normalizeCompanySearchText(value: string) {
  return normalizeDiscoveryText(value).replace(/[\s\u200c_-]+/g, "");
}

export function uniqueStrings(values: readonly string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

export function getProfileJobTitle(profile: ExperienceProfileFixture) {
  return getCurrentTimelineItem(profile.experienceTimeline)?.jobTitle ?? profile.roleFa;
}

export function getCurrentCompany(profile: ExperienceProfileFixture) {
  return getCurrentTimelineItem(profile.experienceTimeline)?.companyName ?? "";
}

export function getLatestCompanyItem(profile: ExperienceProfileFixture) {
  const selectedLatest = profile.experienceTimeline.find((item) => item.id === profile.latestCompanyId && item.companyName.trim());

  return selectedLatest ?? getCurrentTimelineItem(profile.experienceTimeline) ?? profile.experienceTimeline.find((item) => item.companyName.trim()) ?? null;
}

export function latestCompanySelectionIsValid(profile: Pick<ExperienceProfileFixture, "latestCompanyId" | "experienceTimeline">) {
  return Boolean(profile.latestCompanyId && profile.experienceTimeline.some((item) => item.id === profile.latestCompanyId && item.companyName.trim()));
}

export function getPublicExperienceCompanyItems(profile: ExperienceProfileFixture) {
  const latestCompany = getLatestCompanyItem(profile);
  const selectedItems = profile.publicExperienceCompanyIds
    .map((companyId) => profile.experienceTimeline.find((item) => item.id === companyId && item.companyName.trim()))
    .filter((item): item is ExperienceTimelineItem => Boolean(item));
  const seenCompanies = new Set<string>();

  return [latestCompany, ...selectedItems].filter((item): item is ExperienceTimelineItem => {
    if (!item?.companyName.trim()) {
      return false;
    }

    const normalizedCompany = normalizeCompanySearchText(item.companyName);

    if (seenCompanies.has(normalizedCompany)) {
      return false;
    }

    seenCompanies.add(normalizedCompany);
    return true;
  });
}

export function formatPersianList(values: readonly string[], maxVisible = 3) {
  const visibleValues = values.filter(Boolean).slice(0, maxVisible);

  if (visibleValues.length <= 1) {
    return visibleValues[0] ?? "";
  }

  if (visibleValues.length === 2) {
    return `${visibleValues[0]} و ${visibleValues[1]}`;
  }

  return `${visibleValues.slice(0, -1).join("، ")} و ${visibleValues[visibleValues.length - 1]}`;
}

export function getPublicCompanyNames(profile: ExperienceProfileFixture) {
  const publicItems = getPublicExperienceCompanyItems(profile);

  if (publicItems.length) {
    return publicItems.map((item) => item.companyName);
  }

  const fallbackCompany = getCurrentCompany(profile) || profile.previousCompaniesFa[0] || "";
  return fallbackCompany ? [fallbackCompany] : [];
}

export function getPublicCompanySummary(profile: ExperienceProfileFixture) {
  const companyList = formatPersianList(getPublicCompanyNames(profile));
  return companyList ? `تجربه کاری در ${companyList}` : "";
}

export function getProviderExportSubtitle(profile: ExperienceProfileFixture) {
  const latestCompany = getLatestCompanyItem(profile)?.companyName || getCurrentCompany(profile);
  return latestCompany ? `${getProfileJobTitle(profile)}، ${latestCompany}` : getProfileJobTitle(profile);
}

export function getTimelineCompanies(timeline: readonly ExperienceTimelineItem[]) {
  return uniqueStrings(timeline.map((item) => item.companyName));
}

export function getPreviousCompaniesFromTimeline(profile: ExperienceProfileFixture) {
  return uniqueStrings(profile.experienceTimeline.filter((item) => !item.isCurrent).map((item) => item.companyName));
}

export function getDiscoverPreviousCompanyOptions(items: readonly ExperienceProfileFixture[] = profiles) {
  return getDiscoverExperienceCompanyOptions(items);
}

export function getDiscoverExperienceCompanyOptions(items: readonly ExperienceProfileFixture[] = profiles) {
  return uniqueStrings(items.filter(isActiveExperienceProfile).flatMap((profile) => getTimelineCompanies(profile.experienceTimeline))).sort((a, b) =>
    a.localeCompare(b, "fa")
  );
}

export function getDiscoverJobCategoryOptions(items: readonly ExperienceProfileFixture[] = profiles) {
  const activeCategories = new Set(items.filter(isActiveExperienceProfile).flatMap((profile) => profile.jobCategoriesFa));
  return jobFieldTaxonomy.filter((category) => activeCategories.has(category));
}

const companyAliasSearchIndex: Record<string, readonly string[]> = {
  "دیجی‌کالا": ["digikala", "digi kala", "digikala"],
  "کافه‌بازار": ["cafebazaar", "cafe bazaar", "cafebazar"],
  "علی‌بابا": ["alibaba", "ali baba"],
  "اسنپ": ["snapp"],
  "دیوار": ["divar"],
  "تپسی": ["tapsi"]
};

export function companyMatchesSearch(companyName: string, query: string) {
  const normalizedQuery = normalizeCompanySearchText(query);

  if (!normalizedQuery) {
    return true;
  }

  const normalizedCompany = normalizeCompanySearchText(companyName);
  const aliases = companyAliasSearchIndex[companyName] ?? [];

  return normalizedCompany.includes(normalizedQuery) || aliases.some((alias) => normalizeCompanySearchText(alias).includes(normalizedQuery));
}

export function searchDiscoverExperienceCompanies(query: string, limit = 8, items: readonly ExperienceProfileFixture[] = profiles) {
  return getDiscoverExperienceCompanyOptions(items)
    .filter((company) => companyMatchesSearch(company, query))
    .slice(0, limit);
}

export function searchDiscoverJobCategories(query: string, limit = 14, items: readonly ExperienceProfileFixture[] = profiles) {
  const normalizedQuery = normalizeDiscoveryText(query);

  return getDiscoverJobCategoryOptions(items)
    .filter((category) => !normalizedQuery || normalizeDiscoveryText(category).includes(normalizedQuery))
    .slice(0, limit);
}

export function isActiveExperienceProfile(profile: ExperienceProfileFixture) {
  return profile.status === "active";
}

export function profileAcceptsConversationRequests(profile: ExperienceProfileFixture) {
  return profile.acceptsConversationRequests;
}

export function languageMatches(profileLanguages: readonly string[], selectedLanguage: ConversationLanguageOption) {
  const hasPersian = profileLanguages.includes("فارسی");
  const hasEnglish = profileLanguages.includes("انگلیسی");

  if (selectedLanguage === "فارسی و انگلیسی") {
    return hasPersian && hasEnglish;
  }

  if (selectedLanguage === "فارسی") {
    return hasPersian;
  }

  return hasEnglish;
}

export function toggleFilterValue<TValue extends string>(values: readonly TValue[], value: TValue) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function groupMatches<TValue extends string>(selectedValues: readonly TValue[], predicate: (value: TValue) => boolean) {
  return !selectedValues.length || selectedValues.some(predicate);
}

export function profileMatchesDiscovery(profile: ExperienceProfileFixture, submittedSearchQuery: string, filters: DiscoverFilters) {
  if (!isActiveExperienceProfile(profile)) {
    return false;
  }

  const normalizedQuery = normalizeDiscoveryText(submittedSearchQuery);
  const currentCompany = getCurrentCompany(profile);
  const timelineCompanies = getTimelineCompanies(profile.experienceTimeline);
  const previousCompanies = getPreviousCompaniesFromTimeline(profile);
  const searchableText = normalizeDiscoveryText(
    [
      profile.name,
      getProfileJobTitle(profile),
      profile.roleFa,
      ...profile.jobCategoriesFa,
      currentCompany,
      ...previousCompanies,
      ...timelineCompanies
    ].join(" ")
  );

  return (
    (!normalizedQuery || searchableText.includes(normalizedQuery)) &&
    groupMatches(filters.jobCategories, (category) => profile.jobCategoriesFa.includes(category)) &&
    groupMatches(filters.orgLevels, (level) => profile.orgLevel === level) &&
    groupMatches(filters.previousCompanies, (company) =>
      timelineCompanies.some((timelineCompany) => normalizeCompanySearchText(timelineCompany) === normalizeCompanySearchText(company))
    ) &&
    groupMatches(filters.languages, (language) => languageMatches(profile.languages, language))
  );
}

export function filterDiscoverProfiles(
  items: readonly ExperienceProfileFixture[],
  submittedSearchQuery: string,
  filters: DiscoverFilters
) {
  return items.filter((profile) => profileMatchesDiscovery(profile, submittedSearchQuery, filters));
}

export function getResultCountCopy(count: number, submittedSearchQuery: string, hasFilters: boolean) {
  const formattedCount = new Intl.NumberFormat("fa-IR").format(count);
  const query = submittedSearchQuery.trim();

  if (query) {
    return `${formattedCount} تجربه برای «${query}» پیدا شد`;
  }

  if (hasFilters) {
    return `${formattedCount} تجربه با این فیلترها پیدا شد`;
  }

  return `${formattedCount} تجربه مرتبط پیدا شد`;
}

export function getQuestionsForIntent(intent: InsightIntent) {
  return suggestedQuestionsByIntent[intent].slice(0, 3);
}

export function getPublishedInsightsForSelection(intent: SeekerInsightIntent, jobCategory: JobField) {
  return publishedInsights.filter(
    (insight) => insight.status === "published" && insight.intent === intent && insight.jobCategory === jobCategory
  );
}

export function getFallbackPublishedInsights(jobCategory: JobField) {
  return publishedInsights.filter((insight) => insight.status === "published" && insight.jobCategory === jobCategory).slice(0, 3);
}

export function getFilteredInsightCards(jobCategory: JobField | "", insightType: InsightType | "") {
  return publishedInsights
    .filter((insight) => insight.status === "published")
    .filter((insight) => !jobCategory || insight.jobCategory === jobCategory)
    .filter((insight) => !insightType || insight.type === insightType)
    .sort((a, b) => String(b.publishedAt).localeCompare(String(a.publishedAt)));
}

export function getInsightPromptHeader(insight: PublishedInsight) {
  return insight.sourceType === "template" ? (insight.templateStem ?? insight.question) : (insight.questionText ?? insight.question);
}

export function getInsightExperienceLine(profile: ExperienceProfileFixture) {
  return getPublicCompanySummary(profile);
}

export function getProfileInsights(profileId: string) {
  return publishedInsights
    .filter((insight) => insight.profileId === profileId && insight.status === "published")
    .sort((a, b) => String(b.publishedAt).localeCompare(String(a.publishedAt)))
    .slice(0, 3);
}

export function getPublishedInsightCountForProfile(profileId: string, insights: readonly PublishedInsight[] = publishedInsights) {
  return insights.filter((insight) => insight.profileId === profileId && insight.status === "published").length;
}

export function getProfileByInsight(insight: PublishedInsight) {
  return profiles.find((profile) => profile.id === insight.profileId) ?? null;
}

export function getInsightAuthor(insight: PublishedInsight) {
  const profile = getProfileByInsight(insight);

  if (!profile) {
    return null;
  }

  return {
    id: profile.id,
    displayName: profile.name,
    jobTitle: getProfileJobTitle(profile),
    orgLevel: profile.orgLevel,
    companyName: getLatestCompanyItem(profile)?.companyName ?? getCurrentCompany(profile),
    experienceLine: getInsightExperienceLine(profile),
    profileUrl: `/profiles/${profile.id}`,
    initials: profile.initials,
    avatarUrl: "avatarUrl" in profile ? profile.avatarUrl : undefined
  };
}

export { currentInsightQuestionCycle };
export { jobFieldTaxonomy };
