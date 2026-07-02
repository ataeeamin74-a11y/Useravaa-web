import rawCareerCards from "./data/career-cards.json";
import type { CareerDomain, GuideCategory, RawCareerCard } from "./career-types";
import { normalizeCareerCard } from "./career-utils";

export type { CareerCard, CareerDomain, GuideCategory, RawCareerCard } from "./career-types";

export const careerCards = (rawCareerCards as RawCareerCard[]).map(normalizeCareerCard);

export const careerDomains: readonly CareerDomain[] = [
  { id: "all", label: "همه" },
  ...Array.from(new Set(careerCards.map((card) => card.domain)), (domain) => ({
    id: domain,
    label: domain
  }))
];

// Kept as an alias for the existing MVP shell and future compare selector wiring.
export const careerPaths = careerCards;

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
