import seedFeed from "./data/career-internships.json";
import { getCareerPathSeoEntries } from "./career-path-seo";
import { getCareerResearchIndexByCardId } from "./career-research-index";

export const CAREER_INTERNSHIP_MAX_AGE_DAYS = 45;
export const CAREER_INTERNSHIP_REFRESH_HOURS = 72;
const DAY_MS = 24 * 60 * 60 * 1000;

export type CareerInternshipSource = "jobinja" | "jobvision";

export type CareerInternship = Readonly<{
  id: string;
  source: CareerInternshipSource;
  sourceUrl: string;
  title: string;
  company: string;
  location: string;
  province?: string;
  city?: string;
  isRemote?: boolean;
  publishedAt: string;
  expiresAt?: string;
  salary?: string;
  workType?: string;
  pathSlugs: readonly string[];
}>;

export type CareerInternshipFeed = Readonly<{
  schemaVersion: 1;
  updatedAt: string;
  refreshEveryHours: 72;
  maxAgeDays: 45;
  canonicalPathCount: 58;
  sourceCounts: Readonly<Record<CareerInternshipSource, number>>;
  items: readonly CareerInternship[];
}>;

export type CareerInternshipPathOption = Readonly<{
  pathId: string;
  slug: string;
  titleFa: string;
  titleEn: string;
}>;

const canonicalEntries = getCareerPathSeoEntries();
const canonicalSlugs = new Set(canonicalEntries.map((entry) => entry.slug));

export const careerInternshipPathOptions: readonly CareerInternshipPathOption[] = canonicalEntries
  .map((entry) => {
    const research = getCareerResearchIndexByCardId(entry.representativeCard.id);
    return {
      pathId: entry.path.id,
      slug: entry.slug,
      titleFa: research?.titleFa ?? entry.path.cards[0]?.title ?? entry.path.name,
      titleEn: research?.titleEn ?? ""
    };
  })
  .sort((left, right) => left.titleFa.localeCompare(right.titleFa, "fa"));

const slugByPathId = new Map(careerInternshipPathOptions.map((item) => [item.pathId, item.slug]));

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function safeText(value: unknown, maximumLength = 220) {
  if (typeof value !== "string") return undefined;
  const text = value.replace(/[\u0000-\u001f\u007f]/gu, " ").replace(/\s+/gu, " ").trim();
  return text && text.length <= maximumLength ? text : undefined;
}

function safeIso(value: unknown) {
  const text = safeText(value, 40);
  const timestamp = text ? Date.parse(text) : Number.NaN;
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : undefined;
}

function safeSourceUrl(value: unknown, source: CareerInternshipSource) {
  const text = safeText(value, 1_000);
  if (!text) return undefined;
  try {
    const url = new URL(text);
    const expectedHost = source === "jobinja" ? "jobinja.ir" : "jobvision.ir";
    return url.protocol === "https:"
      && (url.hostname === expectedHost || url.hostname.endsWith(`.${expectedHost}`))
      ? url.toString()
      : undefined;
  } catch {
    return undefined;
  }
}

function normalizeLocation(value: string) {
  return value
    .normalize("NFKC")
    .replace(/[يى]/gu, "ی")
    .replace(/ك/gu, "ک")
    .replace(/\s+/gu, " ")
    .trim();
}

function getLocationParts(location: string): Readonly<{
  province?: string;
  city?: string;
  isRemote: boolean;
}> {
  if (normalizeLocation(location) === "دورکاری") {
    return { isRemote: true };
  }

  const [province, ...cityParts] = location
    .split(/[،,]/u)
    .map((part) => safeText(part, 120))
    .filter((part): part is string => Boolean(part));
  const city = cityParts.join("، ");
  return {
    ...(province && province !== "ایران" ? { province } : {}),
    ...(city ? { city } : {}),
    isRemote: false
  };
}

function parseInternship(value: unknown, now: number): CareerInternship | undefined {
  if (!isRecord(value)) return undefined;
  const source = value.source === "jobinja" || value.source === "jobvision" ? value.source : undefined;
  const publishedAt = safeIso(value.publishedAt);
  if (!source || !publishedAt) return undefined;

  const publishedTimestamp = Date.parse(publishedAt);
  if (
    publishedTimestamp > now + DAY_MS
    || now - publishedTimestamp > CAREER_INTERNSHIP_MAX_AGE_DAYS * DAY_MS
  ) return undefined;

  const id = safeText(value.id, 160);
  const sourceUrl = safeSourceUrl(value.sourceUrl, source);
  const title = safeText(value.title);
  const company = safeText(value.company);
  const location = safeText(value.location, 160);
  const pathSlugs = Array.isArray(value.pathSlugs)
    ? [...new Set(value.pathSlugs.filter(
      (slug): slug is string => typeof slug === "string" && canonicalSlugs.has(slug)
    ))].slice(0, 3)
    : [];
  if (!id || !sourceUrl || !title || !company || !location || !pathSlugs.length) return undefined;

  const derivedLocation = getLocationParts(location);
  const province = safeText(value.province, 120) ?? derivedLocation.province;
  const city = safeText(value.city, 120) ?? derivedLocation.city;
  const isRemote = value.isRemote === true || derivedLocation.isRemote;

  return {
    id,
    source,
    sourceUrl,
    title,
    company,
    location,
    ...(province ? { province } : {}),
    ...(city ? { city } : {}),
    ...(isRemote ? { isRemote: true } : {}),
    publishedAt,
    ...(safeIso(value.expiresAt) ? { expiresAt: safeIso(value.expiresAt) } : {}),
    ...(safeText(value.salary, 160) ? { salary: safeText(value.salary, 160) } : {}),
    ...(safeText(value.workType, 120) ? { workType: safeText(value.workType, 120) } : {}),
    pathSlugs
  };
}

export function parseCareerInternshipFeed(
  value: unknown,
  now = Date.now()
): CareerInternshipFeed | undefined {
  if (!isRecord(value) || !Array.isArray(value.items)) return undefined;
  const updatedAt = safeIso(value.updatedAt);
  if (!updatedAt) return undefined;

  const deduped = new Map<string, CareerInternship>();
  for (const item of value.items) {
    const parsed = parseInternship(item, now);
    if (parsed) deduped.set(parsed.id, parsed);
  }
  const items = [...deduped.values()]
    .sort((left, right) => Date.parse(right.publishedAt) - Date.parse(left.publishedAt));

  return {
    schemaVersion: 1,
    updatedAt,
    refreshEveryHours: CAREER_INTERNSHIP_REFRESH_HOURS,
    maxAgeDays: CAREER_INTERNSHIP_MAX_AGE_DAYS,
    canonicalPathCount: 58,
    sourceCounts: {
      jobinja: items.filter((item) => item.source === "jobinja").length,
      jobvision: items.filter((item) => item.source === "jobvision").length
    },
    items
  };
}

export function getCareerInternshipSeedFeed(now = Date.now()) {
  return parseCareerInternshipFeed(seedFeed, now);
}

export function getCareerPathSlugsForSavedIds(savedPathIds: ReadonlySet<string>) {
  return new Set([...savedPathIds].flatMap((pathId) => {
    const slug = slugByPathId.get(pathId);
    return slug ? [slug] : [];
  }));
}

export function filterCareerInternships(
  items: readonly CareerInternship[],
  options: Readonly<{
    mode: "personalized" | "all";
    savedPathSlugs: ReadonlySet<string>;
    selectedPathSlug?: string;
    source?: CareerInternshipSource;
    province?: string;
    city?: string;
    query?: string;
  }>
) {
  const normalizedQuery = options.query?.trim().toLocaleLowerCase("fa") ?? "";
  const normalizedProvince = options.province ? normalizeLocation(options.province) : "";
  const normalizedCity = options.city ? normalizeLocation(options.city) : "";
  return items.filter((item) => {
    if (options.mode === "personalized"
      && !item.pathSlugs.some((slug) => options.savedPathSlugs.has(slug))) return false;
    if (options.selectedPathSlug && !item.pathSlugs.includes(options.selectedPathSlug)) return false;
    if (options.source && item.source !== options.source) return false;
    if (normalizedProvince && normalizeLocation(item.province ?? "") !== normalizedProvince) return false;
    if (normalizedCity && normalizeLocation(item.city ?? "") !== normalizedCity) return false;
    if (normalizedQuery) {
      const haystack = `${item.title} ${item.company} ${item.location}`.toLocaleLowerCase("fa");
      if (!haystack.includes(normalizedQuery)) return false;
    }
    return true;
  });
}

export function getCareerInternshipProvinceOptions(items: readonly CareerInternship[]) {
  return [...new Set(items.flatMap((item) => item.province ? [item.province] : []))]
    .sort((left, right) => left.localeCompare(right, "fa"));
}

export function getCareerInternshipCityOptions(
  items: readonly CareerInternship[],
  province?: string
) {
  const normalizedProvince = province ? normalizeLocation(province) : "";
  return [...new Set(items.flatMap((item) => {
    if (!item.city) return [];
    if (normalizedProvince && normalizeLocation(item.province ?? "") !== normalizedProvince) return [];
    return [item.city];
  }))].sort((left, right) => left.localeCompare(right, "fa"));
}

export function isCareerInternshipFeedStale(feed: CareerInternshipFeed, now = Date.now()) {
  return now - Date.parse(feed.updatedAt) >= CAREER_INTERNSHIP_REFRESH_HOURS * 60 * 60 * 1000;
}
