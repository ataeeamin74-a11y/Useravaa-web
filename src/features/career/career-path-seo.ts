import type { Metadata } from "next";
import { careerHierarchy } from "./career-data";
import {
  LEGACY_SOCIAL_MEDIA_CARD_IDS,
  LEGACY_SOCIAL_MEDIA_SLUG_REDIRECTS,
  SOCIAL_MEDIA_MARKETING_SLUG
} from "./career-path-migration";
import {
  getCareerResearchIndexByCardId,
  getCareerResearchIndexByResearchSlug
} from "./career-research-index";
import type { CareerCard, CareerSubfamilyNode } from "./career-types";
import { normalizeSearchText } from "./career-utils";

export const CAREER_PATH_SEO_BASE_URL = "https://useravaa.com";
export const CAREER_PATH_SHARE_IMAGE = "/og/useravaa-career-share.png";

export type CareerPathSeoEntry = Readonly<{
  slug: string;
  path: CareerSubfamilyNode;
  representativeCard: CareerCard;
  pageHref: string;
  canonicalUrl: string;
  pwaHref: string;
}>;

function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36).padStart(6, "0").slice(0, 6);
}

function latinSlugPart(value: string) {
  return value
    .normalize("NFKD")
    .replace(/\.net/giu, " dotnet ")
    .replace(/c#/giu, " c sharp ")
    .replace(/c\+\+/giu, " c plus plus ")
    .replace(/&/gu, " and ")
    .replace(/#/gu, " sharp ")
    .replace(/\+/gu, " plus ")
    .replace(/[^a-zA-Z0-9]+/gu, "-")
    .replace(/^-+|-+$/gu, "")
    .replace(/-{2,}/gu, "-")
    .toLowerCase();
}

function createCareerPathSlugBase(path: CareerSubfamilyNode) {
  const research = path.cards
    .map((card) => getCareerResearchIndexByCardId(card.id))
    .find((item) => item !== undefined);
  if (research) return research.appSlug;

  const candidates = [
    path.name,
    path.midCategory,
    path.generalCategory,
    path.domain
  ].map(latinSlugPart).filter((value) => /[a-z]/u.test(value));

  return candidates[0] ?? `career-path-${stableHash(path.id)}`;
}

function flattenCareerPaths() {
  return careerHierarchy.flatMap((domain) => (
    domain.generalCategories.flatMap((category) => category.subfamilies)
  ));
}

function buildCareerPathSeoEntries(): readonly CareerPathSeoEntry[] {
  const slugCounts = new Map<string, number>();

  return flattenCareerPaths().map((path) => {
    const baseSlug = createCareerPathSlugBase(path);
    const currentCount = slugCounts.get(baseSlug) ?? 0;
    slugCounts.set(baseSlug, currentCount + 1);
    const slug = currentCount === 0 ? baseSlug : `${baseSlug}-${stableHash(path.id)}`;

    return {
      slug,
      path,
      representativeCard: path.cards[0],
      pageHref: `/career/paths/${slug}`,
      canonicalUrl: `${CAREER_PATH_SEO_BASE_URL}/career/paths/${slug}`,
      pwaHref: `/career?path=${encodeURIComponent(slug)}`
    };
  });
}

export const careerPathSeoEntries = buildCareerPathSeoEntries();

const careerPathSeoEntryBySlug = new Map(careerPathSeoEntries.map((entry) => [entry.slug, entry]));
const careerPathSeoEntryByPathId = new Map(careerPathSeoEntries.map((entry) => [entry.path.id, entry]));
const careerPathSeoEntryByCardId = new Map(
  careerPathSeoEntries.flatMap((entry) => entry.path.cards.map((card) => [card.id, entry] as const))
);
const legacySocialMediaCardIds = new Set<string>(LEGACY_SOCIAL_MEDIA_CARD_IDS);
const legacyCareerPathSlugRedirects = new Map<string, string>(
  Object.entries(LEGACY_SOCIAL_MEDIA_SLUG_REDIRECTS)
);

export function getCareerPathSeoEntries() {
  return careerPathSeoEntries;
}

export function getCareerPathSlugs() {
  return careerPathSeoEntries.map((entry) => entry.slug);
}

export function getCareerPathSeoEntryBySlug(slug: string) {
  return careerPathSeoEntryBySlug.get(slug);
}

export function getCareerPathRedirectSlug(slug: string) {
  return legacyCareerPathSlugRedirects.get(slug);
}

export function getCareerPathSeoEntryBySlugOrLegacy(slug: string) {
  const canonicalSlug = getCareerPathRedirectSlug(slug) ?? slug;
  return getCareerPathSeoEntryBySlug(canonicalSlug);
}

export function getCareerPathSeoEntryByPathId(pathId: string) {
  return careerPathSeoEntryByPathId.get(pathId);
}

export function getCareerPathSeoEntryByCardId(cardId: string) {
  const directEntry = careerPathSeoEntryByCardId.get(cardId);
  if (directEntry) return directEntry;
  if (legacySocialMediaCardIds.has(cardId)) {
    return careerPathSeoEntryBySlug.get(SOCIAL_MEDIA_MARKETING_SLUG);
  }
  return undefined;
}

function uniqueOrdered(values: readonly string[]) {
  const seen = new Set<string>();
  const items: string[] = [];

  for (const value of values) {
    const normalizedValue = normalizeSearchText(value);
    if (!normalizedValue || seen.has(normalizedValue)) continue;
    seen.add(normalizedValue);
    items.push(value);
  }

  return items;
}

export function getCareerPathTechnicalSkills(path: CareerSubfamilyNode) {
  return uniqueOrdered(path.cards.flatMap((card) => card.keyTechnicalSkills));
}

export function getCareerPathTools(path: CareerSubfamilyNode) {
  return uniqueOrdered(path.cards.flatMap((card) => card.keyTools));
}

export function getCareerPathSoftSkills(path: CareerSubfamilyNode) {
  return uniqueOrdered(path.cards.flatMap((card) => card.keySoftSkills));
}

export function getCareerPathAudienceTexts(path: CareerSubfamilyNode) {
  return uniqueOrdered(path.cards.map((card) => card.audienceText).filter(Boolean));
}

export function getCareerPathMainDuties(path: CareerSubfamilyNode) {
  return uniqueOrdered(path.cards.flatMap((card) => card.mainDuties));
}

export function getRelatedCareerPathSeoEntries(path: CareerSubfamilyNode, limit = 6) {
  const relatedEntries: CareerPathSeoEntry[] = [];
  const seenPathIds = new Set([path.id]);
  const research = path.cards
    .map((card) => getCareerResearchIndexByCardId(card.id))
    .find((item) => item !== undefined);

  function appendMatchingEntries(matcher: (entry: CareerPathSeoEntry) => boolean) {
    for (const entry of careerPathSeoEntries) {
      if (relatedEntries.length >= limit) return;
      if (seenPathIds.has(entry.path.id) || !matcher(entry)) continue;
      relatedEntries.push(entry);
      seenPathIds.add(entry.path.id);
    }
  }

  for (const relatedResearchSlug of research?.relatedResearchSlugs ?? []) {
    if (relatedEntries.length >= limit) break;
    const relatedResearch = getCareerResearchIndexByResearchSlug(relatedResearchSlug);
    const entry = relatedResearch ? careerPathSeoEntryBySlug.get(relatedResearch.appSlug) : undefined;
    if (!entry || seenPathIds.has(entry.path.id)) continue;
    relatedEntries.push(entry);
    seenPathIds.add(entry.path.id);
  }

  appendMatchingEntries((entry) => entry.path.generalCategory === path.generalCategory);
  appendMatchingEntries((entry) => entry.path.domain === path.domain);
  appendMatchingEntries(() => true);

  return relatedEntries;
}

export function buildCareerPathTitle(path: CareerSubfamilyNode) {
  return path.cards
    .map((card) => getCareerResearchIndexByCardId(card.id))
    .find((item) => item !== undefined)?.titleFa
    ?? path.name;
}

export function buildCareerPathDescription(path: CareerSubfamilyNode) {
  const pathTitle = buildCareerPathTitle(path);
  return `با مسیر شغلی ${pathTitle} آشنا شو؛ سطح‌های شغلی، مهارت‌ها، ابزارها و نکته‌های تصمیم‌گیری را قبل از انتخاب مسیر بررسی کن.`;
}

export function buildCareerPathMetadata(entry: CareerPathSeoEntry): Metadata {
  const pathTitle = buildCareerPathTitle(entry.path);
  const title = entry.slug === SOCIAL_MEDIA_MARKETING_SLUG
    ? `${pathTitle} | واقعیت مسیر شغلی در Useravaa`
    : `${pathTitle} | مسیر شغلی در Useravaa`;
  const description = buildCareerPathDescription(entry.path);

  return {
    title,
    description,
    alternates: {
      canonical: entry.canonicalUrl
    },
    openGraph: {
      title,
      description,
      url: entry.canonicalUrl,
      siteName: "Useravaa",
      type: "website",
      locale: "fa_IR",
      images: [
        {
          url: CAREER_PATH_SHARE_IMAGE,
          width: 1200,
          height: 630,
          alt: `مسیر شغلی ${pathTitle} در Useravaa`
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [
        {
          url: CAREER_PATH_SHARE_IMAGE,
          alt: `مسیر شغلی ${pathTitle} در Useravaa`
        }
      ]
    }
  };
}
