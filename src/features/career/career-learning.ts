import rawCourseIndex from "./data/career-learning-index.json";
import { getCareerPathSeoEntryByPathId } from "./career-path-seo";
import {
  getCareerSkillRequirementsBySlug,
  resolveCareerSkillRequirements,
  type SkillImportance
} from "./career-skill-requirements";
import {
  getSkillById,
  skillCatalog,
  type SkillCatalogItem,
  type SkillType
} from "./skill-catalog";

export const careerLearningProviderIds = [
  "maktabkhooneh",
  "faradars",
  "hamrah-academy",
  "inverse",
  "novin-academy",
  "quera-college",
  "roocket",
  "sabzlearn",
  "toplearn",
  "bozhan-school",
  "coursera",
  "pact",
  "bamboohr-learning",
  "atlassian-learning",
  "microsoft-learn",
  "screaming-frog-training",
  "zendesk-training",
  "linkedin-learning",
  "mostamar-academy",
  "hesabdaran-khebreh",
  "tehran-business-school",
  "icc-academy",
  "adobe-learn"
] as const;

export type CareerLearningProviderId = (typeof careerLearningProviderIds)[number];
export type CareerCoursePractice = "exercise" | "project" | "both" | "none" | "unknown";
export type CareerCourseCertificate = "available" | "unavailable" | "unknown";
export type CareerCoursePrice = Readonly<{
  kind: "free" | "paid" | "regional" | "unknown";
  amountToman?: number;
  originalAmountToman?: number;
  verifiedAt: string;
}>;

export type CareerLearningCourse = Readonly<{
  id: string;
  title: string;
  provider: CareerLearningProviderId;
  sourceUrl: string;
  skillIds: readonly string[];
  instructor?: string;
  language?: string;
  level?: string;
  durationMinutes?: number | null;
  durationLabel?: string;
  practice?: CareerCoursePractice;
  practiceLabel?: string;
  certificate?: CareerCourseCertificate;
  rating?: number;
  ratingCount?: number;
  commentCount?: number;
  price: CareerCoursePrice;
  selectionNote?: string;
}>;

export type CareerLearningCourseCatalog = Readonly<{
  schemaVersion: number;
  generatedAt: string;
  sourceCourseCount: number;
  failedPageCount: number;
  courses: readonly CareerLearningCourse[];
}>;

type CareerLearningCourseIndex = Readonly<{
  schemaVersion: number;
  generatedAt: string;
  totalCourseCount: number;
  providerCount: number;
  skills: Readonly<Record<string, Readonly<{
    courseCount: number;
    providerCount: number;
  }>>>;
}>;

export type CareerLearningProvider = Readonly<{
  id: CareerLearningProviderId;
  label: string;
  homeUrl: string;
  searchUrl?: (query: string) => string;
  strengths: readonly SkillType[];
}>;

export type PersonalizedLearningSkill = Readonly<{
  skill: SkillCatalogItem;
  pathTitles: readonly string[];
  importance: SkillImportance;
  score: number;
}>;

export type CareerCoursePricePresentation = Readonly<{
  label: string;
  isFresh: boolean;
  previousLabel?: string;
}>;

export const CAREER_COURSE_PRICE_FRESH_DAYS = 8;
export const CAREER_COURSE_FREE_STATUS_FRESH_DAYS = 30;
export const CAREER_COURSE_COMPARE_LIMIT = 3;

export type CareerLearningLanguageQuery = "fa" | "en";

export type CareerLearningQueryState = Readonly<{
  skillId?: string;
  language?: CareerLearningLanguageQuery;
  provider?: CareerLearningProviderId;
  comparedCourseIds: readonly string[];
}>;

export const careerLearningProviders: readonly CareerLearningProvider[] = [
  {
    id: "maktabkhooneh",
    label: "مکتب‌خونه",
    homeUrl: "https://maktabkhooneh.org/",
    searchUrl: (query) => `https://maktabkhooneh.org/search/?q=${encodeURIComponent(query)}`,
    strengths: ["soft", "foundational", "specialized", "tool"]
  },
  {
    id: "faradars",
    label: "فرادرس",
    homeUrl: "https://faradars.org/",
    searchUrl: (query) => `https://faradars.org/search?q=${encodeURIComponent(query)}`,
    strengths: ["foundational", "specialized", "tool"]
  },
  {
    id: "hamrah-academy",
    label: "آکادمی همراه اول",
    homeUrl: "https://hamrah.academy/",
    strengths: ["soft", "foundational", "specialized"]
  },
  {
    id: "inverse",
    label: "اینورس",
    homeUrl: "https://inverseschool.com/",
    strengths: ["soft", "specialized", "tool"]
  },
  {
    id: "novin-academy",
    label: "آکادمی نوین",
    homeUrl: "https://www.novin.com/academy/",
    strengths: ["specialized", "tool"]
  },
  {
    id: "quera-college",
    label: "کوئرا کالج",
    homeUrl: "https://quera.org/college",
    strengths: ["specialized", "tool"]
  },
  {
    id: "roocket",
    label: "راکت",
    homeUrl: "https://roocket.ir/series/",
    strengths: ["specialized", "tool"]
  },
  {
    id: "sabzlearn",
    label: "سبزلرن",
    homeUrl: "https://sabzlearn.ir/",
    strengths: ["specialized", "tool"]
  },
  {
    id: "toplearn",
    label: "تاپ‌لرن",
    homeUrl: "https://toplearn.com/",
    strengths: ["specialized", "tool"]
  },
  {
    id: "bozhan-school",
    label: "مدرسه محصول بوژان",
    homeUrl: "https://t.me/bozhanschool",
    strengths: ["soft", "foundational", "specialized"]
  },
  {
    id: "coursera",
    label: "Coursera",
    homeUrl: "https://www.coursera.org/",
    searchUrl: (query) => `https://www.coursera.org/search?query=${encodeURIComponent(query)}`,
    strengths: ["soft", "foundational", "specialized", "tool"]
  },
  {
    id: "pact",
    label: "مرکز آموزش حسابداران خبره (PACT)",
    homeUrl: "https://pact.ir/",
    strengths: ["foundational", "specialized", "tool"]
  },
  {
    id: "bamboohr-learning",
    label: "BambooHR Learning",
    homeUrl: "https://www.bamboohr.com/",
    strengths: []
  },
  {
    id: "atlassian-learning",
    label: "Atlassian Learning",
    homeUrl: "https://community.atlassian.com/learning/",
    strengths: []
  },
  {
    id: "microsoft-learn",
    label: "Microsoft Learn",
    homeUrl: "https://learn.microsoft.com/training/",
    strengths: []
  },
  {
    id: "screaming-frog-training",
    label: "Screaming Frog Training",
    homeUrl: "https://www.screamingfrog.co.uk/seo-spider/training/",
    strengths: []
  },
  {
    id: "zendesk-training",
    label: "Zendesk Training",
    homeUrl: "https://academy.zendesk.com/",
    strengths: []
  },
  {
    id: "linkedin-learning",
    label: "LinkedIn Learning",
    homeUrl: "https://www.linkedin.com/learning/",
    searchUrl: (query) => `https://www.linkedin.com/learning/search?keywords=${encodeURIComponent(query)}`,
    strengths: ["soft", "foundational", "specialized", "tool"]
  },
  {
    id: "mostamar-academy",
    label: "آکادمی مستمر",
    homeUrl: "https://mostamaracademy.ir/",
    strengths: []
  },
  {
    id: "hesabdaran-khebreh",
    label: "مرکز حسابداران خبره",
    homeUrl: "https://www.hac.ir/",
    strengths: []
  },
  {
    id: "tehran-business-school",
    label: "دانشکدگان مدیریت دانشگاه تهران",
    homeUrl: "https://postmba.org/",
    strengths: []
  },
  {
    id: "icc-academy",
    label: "ICC Academy",
    homeUrl: "https://academy.iccwbo.org/",
    strengths: []
  },
  {
    id: "adobe-learn",
    label: "Adobe Learn",
    homeUrl: "https://www.adobe.com/learn/",
    strengths: []
  }
];

const providerById = new Map(careerLearningProviders.map((provider) => [provider.id, provider]));
const allowedProviderHosts = new Set(careerLearningProviders.map((provider) => new URL(provider.homeUrl).hostname));
const iranianProviderIds = new Set<CareerLearningProviderId>([
  "maktabkhooneh",
  "faradars",
  "hamrah-academy",
  "inverse",
  "novin-academy",
  "quera-college",
  "roocket",
  "sabzlearn",
  "toplearn",
  "bozhan-school",
  "pact",
  "mostamar-academy",
  "hesabdaran-khebreh",
  "tehran-business-school"
]);
export const careerLearningCourseIndex = rawCourseIndex as CareerLearningCourseIndex;

function isFinitePositive(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

export function isSafeCareerLearningProviderUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && [...allowedProviderHosts].some(
      (host) => url.hostname === host || url.hostname.endsWith(`.${host}`)
    );
  } catch {
    return false;
  }
}

export function auditCareerLearningCourse(course: CareerLearningCourse) {
  const problems: string[] = [];
  if (!/^[a-z0-9-]+$/u.test(course.id)) problems.push("invalid_id");
  if (!providerById.has(course.provider)) problems.push("unknown_provider");
  if (!isSafeCareerLearningProviderUrl(course.sourceUrl)) problems.push("unsafe_source_url");
  if (!course.title.trim()) problems.push("missing_identity");
  if (!course.skillIds.length || course.skillIds.some((skillId) => !getSkillById(skillId))) {
    problems.push("unknown_skill_id");
  }
  if (!Number.isFinite(Date.parse(course.price.verifiedAt))) problems.push("invalid_verified_at");
  if (course.price.kind === "paid" && !isFinitePositive(course.price.amountToman)) {
    problems.push("missing_paid_amount");
  }
  if (course.rating !== undefined && (course.rating < 0 || course.rating > 5)) {
    problems.push("invalid_rating");
  }
  return problems;
}

export function getCareerLearningProvider(providerId: CareerLearningProviderId) {
  return providerById.get(providerId);
}

export function getTrustedProviderLinks(skill: SkillCatalogItem) {
  const query = skill.titleEn && skill.titleEn !== skill.titleFa
    ? `${skill.titleFa} ${skill.titleEn}`
    : skill.titleFa;
  return careerLearningProviders
    .filter((provider) => provider.strengths.includes(skill.type))
    .map((provider) => ({
      id: provider.id,
      label: provider.label,
      href: provider.searchUrl?.(query) ?? provider.homeUrl,
      isDirectSearch: Boolean(provider.searchUrl)
    }));
}

function courseRankingScore(course: CareerLearningCourse, now: number) {
  const ageDays = Math.max(0, (now - Date.parse(course.price.verifiedAt)) / (24 * 60 * 60 * 1000));
  const freshness = Math.max(0, 14 - ageDays);
  const rating = course.rating ? course.rating * 8 : 0;
  const confidence = course.ratingCount ? Math.min(20, Math.log10(course.ratingCount + 1) * 6) : 0;
  const practice = course.practice === "project" || course.practice === "both" ? 14
    : course.practice === "exercise" ? 8
      : 0;
  const language = course.language === "فارسی" ? 30 : 0;
  const localProvider = iranianProviderIds.has(course.provider) ? 80 : 0;
  return freshness + rating + confidence + practice + language + localProvider;
}

export function sortCareerLearningCourses(courses: readonly CareerLearningCourse[], now = Date.now()) {
  return [...courses].sort((left, right) => (
    courseRankingScore(right, now) - courseRankingScore(left, now)
    || left.title.localeCompare(right.title, "fa")
  ));
}

export function getCareerLearningCourseCount(skillId: string) {
  return careerLearningCourseIndex.skills[skillId]?.courseCount ?? 0;
}

export function getCareerLearningCoverage() {
  const selectableSkills = skillCatalog.items.filter((skill) => skill.isSelectable);
  const curatedSkillCount = selectableSkills.filter(
    (skill) => getCareerLearningCourseCount(skill.id) > 0
  ).length;
  return {
    totalSkillCount: selectableSkills.length,
    curatedSkillCount,
    courseCount: careerLearningCourseIndex.totalCourseCount,
    providerCount: careerLearningCourseIndex.providerCount,
    generatedAt: careerLearningCourseIndex.generatedAt
  } as const;
}

function formatToman(amount: number) {
  return `${amount.toLocaleString("fa-IR")} تومان`;
}

export function getCoursePricePresentation(
  course: CareerLearningCourse,
  now = Date.now()
): CareerCoursePricePresentation {
  const verifiedAt = Date.parse(course.price.verifiedAt);
  const ageDays = (now - verifiedAt) / (24 * 60 * 60 * 1000);
  const isPaidFresh = ageDays >= 0 && ageDays <= CAREER_COURSE_PRICE_FRESH_DAYS;
  const isFreeFresh = ageDays >= 0 && ageDays <= CAREER_COURSE_FREE_STATUS_FRESH_DAYS;

  if (course.price.kind === "paid" && course.price.amountToman && isPaidFresh) {
    return {
      label: formatToman(course.price.amountToman),
      isFresh: true,
      ...(course.price.originalAmountToman
        ? { previousLabel: formatToman(course.price.originalAmountToman) }
        : {})
    };
  }
  if (course.price.kind === "free" && isFreeFresh) {
    return { label: "رایگان", isFresh: true };
  }
  if (course.price.kind === "regional") {
    return { label: "قیمت براساس کشور و اشتراک", isFresh: false };
  }
  return { label: "قیمت را در سایت ببین", isFresh: false };
}

export function formatCourseVerifiedAt(verifiedAt: string) {
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(new Date(verifiedAt));
}

const importanceRank: Readonly<Record<SkillImportance, number>> = {
  core: 3,
  important: 2,
  useful: 1
};

export function getPersonalizedLearningSkills(savedPathIds: ReadonlySet<string>) {
  const aggregated = new Map<string, {
    pathTitles: Set<string>;
    importance: SkillImportance;
    score: number;
  }>();

  for (const pathId of savedPathIds) {
    const seoEntry = getCareerPathSeoEntryByPathId(pathId);
    const requirements = seoEntry
      ? getCareerSkillRequirementsBySlug(seoEntry.slug)
      : undefined;
    if (!requirements) continue;

    for (const item of resolveCareerSkillRequirements(requirements)) {
      const current = aggregated.get(item.skill.id);
      const importance = !current
        || importanceRank[item.requirement.importance] > importanceRank[current.importance]
        ? item.requirement.importance
        : current.importance;
      aggregated.set(item.skill.id, {
        pathTitles: new Set([...(current?.pathTitles ?? []), requirements.titleFa]),
        importance,
        score: (current?.score ?? 0)
          + item.requirement.weight
          + importanceRank[item.requirement.importance] * 10
      });
    }
  }

  return [...aggregated.entries()].flatMap(([skillId, value]) => {
    const skill = getSkillById(skillId);
    return skill ? [{
      skill,
      pathTitles: [...value.pathTitles],
      importance: value.importance,
      score: value.score
    } satisfies PersonalizedLearningSkill] : [];
  }).sort((left, right) => right.score - left.score || left.skill.titleFa.localeCompare(right.skill.titleFa, "fa"));
}

export function sanitizeComparedCourseIds(
  courseIds: readonly string[],
  availableCourses: readonly CareerLearningCourse[]
) {
  const availableIds = new Set(availableCourses.map((course) => course.id));
  return [...new Set(courseIds)]
    .filter((courseId) => availableIds.has(courseId))
    .slice(0, CAREER_COURSE_COMPARE_LIMIT);
}

export function toggleComparedCourseId(
  courseIds: readonly string[],
  courseId: string,
  availableCourses: readonly CareerLearningCourse[]
) {
  return courseIds.includes(courseId)
    ? courseIds.filter((id) => id !== courseId)
    : sanitizeComparedCourseIds([...courseIds, courseId], availableCourses);
}

export function getCareerLearningLanguageLabel(language?: CareerLearningLanguageQuery) {
  if (language === "fa") return "فارسی";
  if (language === "en") return "انگلیسی";
  return undefined;
}

export function normalizeCareerLearningQuery(
  searchParams: URLSearchParams,
  availableCourses: readonly CareerLearningCourse[] = [],
  validateAgainstCourses = false
) {
  const normalized = new URLSearchParams();
  const skillId = searchParams.get("skill") ?? "";
  const skill = getSkillById(skillId);
  if (!skill?.isSelectable) return normalized;

  normalized.set("skill", skill.id);

  const languageValue = searchParams.get("language");
  const language = languageValue === "fa" || languageValue === "en"
    ? languageValue
    : undefined;
  const languageLabel = getCareerLearningLanguageLabel(language);
  if (language && (!validateAgainstCourses || availableCourses.some(
    (course) => course.language === languageLabel
  ))) {
    normalized.set("language", language);
  }

  const providerValue = searchParams.get("provider");
  const provider = careerLearningProviderIds.find((id) => id === providerValue);
  if (provider && (!validateAgainstCourses || availableCourses.some(
    (course) => course.provider === provider
  ))) {
    normalized.set("provider", provider);
  }

  const requestedCourseIds = [...new Set((searchParams.get("compare") ?? "")
    .split(",")
    .filter((courseId) => /^[a-z0-9-]+$/u.test(courseId)))]
    .slice(0, CAREER_COURSE_COMPARE_LIMIT);
  const comparedCourseIds = validateAgainstCourses
    ? sanitizeComparedCourseIds(requestedCourseIds, availableCourses)
    : requestedCourseIds;
  if (comparedCourseIds.length) normalized.set("compare", comparedCourseIds.join(","));

  return normalized;
}

export function readCareerLearningQuery(searchParams: URLSearchParams): CareerLearningQueryState {
  const skillId = searchParams.get("skill") ?? undefined;
  const languageValue = searchParams.get("language");
  const providerValue = searchParams.get("provider");
  return {
    ...(skillId ? { skillId } : {}),
    ...(languageValue === "fa" || languageValue === "en" ? { language: languageValue } : {}),
    ...(careerLearningProviderIds.some((id) => id === providerValue)
      ? { provider: providerValue as CareerLearningProviderId }
      : {}),
    comparedCourseIds: [...new Set((searchParams.get("compare") ?? "")
      .split(",")
      .filter(Boolean))]
      .slice(0, CAREER_COURSE_COMPARE_LIMIT)
  };
}

export function buildCareerLearningUrl(state: CareerLearningQueryState) {
  const query = new URLSearchParams();
  if (state.skillId) query.set("skill", state.skillId);
  if (state.skillId && state.language) query.set("language", state.language);
  if (state.skillId && state.provider) query.set("provider", state.provider);
  if (state.skillId && state.comparedCourseIds.length) {
    query.set("compare", state.comparedCourseIds.slice(0, CAREER_COURSE_COMPARE_LIMIT).join(","));
  }
  const queryString = query.toString();
  return queryString ? `/career/learn?${queryString}` : "/career/learn";
}
