import rawCareerCards from "./data/career-cards-v2-with-duties.json";
import type { CareerDomain, GuideCategory, RawCareerCard } from "./career-types";
import { buildCareerHierarchy, normalizeCareerCards, selectVisibleCareerRepresentatives } from "./career-utils";

export type { CareerCard, CareerDomain, GuideCategory, RawCareerCard } from "./career-types";

export const careerCards = normalizeCareerCards(rawCareerCards as RawCareerCard[]);
export const careerHierarchy = buildCareerHierarchy(careerCards);
export const visibleCareerCards = selectVisibleCareerRepresentatives(careerCards);
export const visibleCareerHierarchy = buildCareerHierarchy(visibleCareerCards);

export const careerDomains: readonly CareerDomain[] = [
  { id: "all", label: "همه" },
  ...Array.from(new Set(visibleCareerCards.map((card) => card.domain)), (domain) => ({
    id: domain,
    label: domain
  }))
];

// Kept as an alias for the existing MVP shell and future compare selector wiring.
export const careerPaths = visibleCareerCards;

export const comparisonSections = ["مشترک بین هر دو", "فقط مسیر اول", "فقط مسیر دوم"] as const;

export const guideCategories: readonly GuideCategory[] = [
  {
    id: "career-choice",
    title: "انتخاب مسیر شغلی",
    description: "برای شناخت بهتر گزینه‌ها و تصمیم‌گیری آگاهانه"
  },
  {
    id: "resume",
    title: "راهنمای رزومه‌نویسی",
    description: "برای ساختن رزومه‌ای روشن، دقیق و متناسب با هدفت"
  },
  {
    id: "interview",
    title: "راهنمای آمادگی مصاحبه",
    description: "برای آماده‌شدن پیش از گفت‌وگوهای استخدامی"
  },
  {
    id: "specialized-learning",
    title: "راهنمای آموزش‌های تخصصی",
    description: "برای انتخاب مهارت‌ها و آموزش‌های مناسب هر مسیر"
  }
] as const;
