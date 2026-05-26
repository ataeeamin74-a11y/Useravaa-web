import { isValidJobField, type JobField } from "./job-fields";

export const orgLevelTaxonomy = ["کارآموز", "کارشناس", "کارشناس ارشد", "مدیر میانی", "مدیر ارشد", "معاونت", "مدیر کسب و کار"] as const;

export type OrgLevel = (typeof orgLevelTaxonomy)[number];

export type ExperienceTimelineItem = {
  id: string;
  jobTitle: string;
  jobField: JobField;
  orgLevel: OrgLevel;
  companyName: string;
  companyCountry: string;
  companyIndustry: string;
  startYear: number;
  startMonth: number;
  endYear: number | null;
  endMonth: number | null;
  isCurrent: boolean;
  description?: string;
};

export type TimelineItemErrors = Partial<
  Record<"jobTitle" | "jobField" | "orgLevel" | "companyName" | "companyCountry" | "companyIndustry" | "startDate" | "endDate" | "dateRange", string>
>;

export const persianMonthOptions = [
  { value: 1, label: "فروردین" },
  { value: 2, label: "اردیبهشت" },
  { value: 3, label: "خرداد" },
  { value: 4, label: "تیر" },
  { value: 5, label: "مرداد" },
  { value: 6, label: "شهریور" },
  { value: 7, label: "مهر" },
  { value: 8, label: "آبان" },
  { value: 9, label: "آذر" },
  { value: 10, label: "دی" },
  { value: 11, label: "بهمن" },
  { value: 12, label: "اسفند" }
] as const;

const currentJalaliYear = 1404;
const currentJalaliMonth = 3;

export const initialExperienceTimeline: ExperienceTimelineItem[] = [
  {
    id: "timeline-current-snapp",
    jobTitle: "مدیر محصول",
    jobField: "محصول و تجربه کاربر",
    orgLevel: "مدیر میانی",
    companyName: "اسنپ",
    companyCountry: "ایران",
    companyIndustry: "حمل‌ونقل آنلاین",
    startYear: 1401,
    startMonth: 2,
    endYear: null,
    endMonth: null,
    isCurrent: true,
    description: "هدایت کشف مسئله، اولویت‌بندی و هماهنگی تیم‌های محصول و داده."
  },
  {
    id: "timeline-previous-digikala",
    jobTitle: "تحلیلگر داده محصول",
    jobField: "علوم داده و هوش مصنوعی",
    orgLevel: "کارشناس ارشد",
    companyName: "دیجی‌کالا",
    companyCountry: "ایران",
    companyIndustry: "تجارت الکترونیک",
    startYear: 1398,
    startMonth: 7,
    endYear: 1401,
    endMonth: 1,
    isCurrent: false,
    description: "ساخت داشبوردهای تصمیم‌سازی و تحلیل رفتار کاربران."
  }
];

export function createEmptyTimelineItem(index: number): ExperienceTimelineItem {
  return {
    id: `timeline-draft-${index}`,
    jobTitle: "",
    jobField: "محصول و تجربه کاربر",
    orgLevel: "کارشناس",
    companyName: "",
    companyCountry: "ایران",
    companyIndustry: "",
    startYear: 1400,
    startMonth: 1,
    endYear: 1401,
    endMonth: 1,
    isCurrent: false,
    description: ""
  };
}

export function validateTimelineItem(item: ExperienceTimelineItem): TimelineItemErrors {
  const errors: TimelineItemErrors = {};

  if (item.jobTitle.trim().length < 2 || item.jobTitle.trim().length > 100) {
    errors.jobTitle = "عنوان شغلی را کامل وارد کنید.";
  }

  if (!isValidJobField(item.jobField)) {
    errors.jobField = "حوزه شغلی را از لیست انتخاب کنید.";
  }

  if (!orgLevelTaxonomy.includes(item.orgLevel)) {
    errors.orgLevel = "رده سازمانی را انتخاب کن.";
  }

  if (item.companyName.trim().length < 2) {
    errors.companyName = "نام شرکت را کامل وارد کن.";
  }

  if (!item.companyCountry.trim()) {
    errors.companyCountry = "کشور یا محل شرکت را وارد کن.";
  }

  if (!item.companyIndustry.trim()) {
    errors.companyIndustry = "زمینه فعالیت شرکت را وارد کن.";
  }

  if (!item.startYear || item.startYear < 1300 || item.startMonth < 1 || item.startMonth > 12) {
    errors.startDate = "تاریخ شروع را کامل وارد کن.";
  }

  if (!item.isCurrent && (!item.endYear || !item.endMonth || item.endMonth < 1 || item.endMonth > 12)) {
    errors.endDate = "برای سابقه قبلی، تاریخ پایان را وارد کن.";
  }

  if (!item.isCurrent && item.endYear && item.endMonth && toMonthIndex(item.endYear, item.endMonth) <= toMonthIndex(item.startYear, item.startMonth)) {
    errors.dateRange = "تاریخ پایان باید بعد از تاریخ شروع باشد.";
  }

  return errors;
}

export function validateExperienceTimeline(items: readonly ExperienceTimelineItem[]) {
  return items.map(validateTimelineItem);
}

export function experienceTimelineIsValid(items: readonly ExperienceTimelineItem[]) {
  return items.length > 0 && validateExperienceTimeline(items).every((errors) => Object.keys(errors).length === 0);
}

export function timelineCoverageYears(items: readonly ExperienceTimelineItem[]) {
  const months = items.reduce((total, item) => {
    const start = toMonthIndex(item.startYear, item.startMonth);
    const end = item.isCurrent ? toMonthIndex(currentJalaliYear, currentJalaliMonth) : toMonthIndex(item.endYear ?? item.startYear, item.endMonth ?? item.startMonth);
    return total + Math.max(0, end - start);
  }, 0);

  return months / 12;
}

export function getTimelineCoverageWarning(items: readonly ExperienceTimelineItem[], claimedYears: number) {
  if (claimedYears < 5 || timelineCoverageYears(items) >= 5) {
    return "";
  }

  return "سوابق واردشده کمتر از پنج سال گذشته را پوشش می‌دهد. اگر تجربه کاری شما بیشتر از پنج سال است، لطفاً سوابق بیشتری اضافه کنید تا پرسش‌ها دقیق‌تر شوند.";
}

export function getCurrentTimelineItem(items: readonly ExperienceTimelineItem[]) {
  const currentItems = items.filter((item) => item.isCurrent);
  return [...currentItems].sort((a, b) => toMonthIndex(b.startYear, b.startMonth) - toMonthIndex(a.startYear, a.startMonth))[0] ?? null;
}

export function getPreviousTimelineItem(items: readonly ExperienceTimelineItem[]) {
  return [...items]
    .filter((item) => !item.isCurrent)
    .sort((a, b) => toMonthIndex(b.endYear ?? 0, b.endMonth ?? 1) - toMonthIndex(a.endYear ?? 0, a.endMonth ?? 1))[0] ?? null;
}

export function derivePreviousCompaniesFromTimeline(items: readonly ExperienceTimelineItem[]) {
  return [...new Set(items.filter((item) => !item.isCurrent && item.companyName.trim()).map((item) => item.companyName.trim()))];
}

export function summarizeTimelineItem(item: ExperienceTimelineItem) {
  const start = `${item.startYear}/${String(item.startMonth).padStart(2, "0")}`;
  const end = item.isCurrent ? "اکنون" : `${item.endYear}/${String(item.endMonth ?? 1).padStart(2, "0")}`;
  return `${item.jobTitle} · ${item.companyName} · ${start} تا ${end}`;
}

function toMonthIndex(year: number, month: number) {
  return year * 12 + month;
}
