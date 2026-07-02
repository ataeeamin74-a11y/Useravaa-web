export type CareerDomain = Readonly<{
  id: string;
  label: string;
}>;

export type CareerPath = Readonly<{
  id: string;
  slug: string;
  title: string;
  domainId: CareerDomain["id"];
  summary: string;
  isBookmarked: boolean;
}>;

export type GuideCategory = Readonly<{
  id: "career-choice" | "resume" | "interview" | "specialized-learning";
  title: string;
  description: string;
}>;

export const careerDomains: readonly CareerDomain[] = [
  { id: "all", label: "همه" },
  { id: "technology", label: "فناوری" },
  { id: "product", label: "محصول" },
  { id: "design", label: "طراحی" },
  { id: "marketing", label: "بازاریابی" },
  { id: "business", label: "کسب‌وکار" },
  { id: "people", label: "منابع انسانی" }
] as const;

// Real career path records will be connected in a later phase.
export const careerPaths: readonly CareerPath[] = [];

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
