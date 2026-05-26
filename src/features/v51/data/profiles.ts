import { initialExperienceTimeline, type ExperienceTimelineItem } from "./experience-timeline";
import { jobFieldTaxonomy, type JobField } from "./job-fields";

export type DurationPricing = {
  30: number | null;
  60: number | null;
};

export type ExperienceProfileFixture = {
  id: string;
  name: string;
  initials: string;
  avatarUrl?: string;
  status: "active" | "inactive";
  acceptsConversationRequests: boolean;
  roleFa: string;
  orgLevel: string;
  yearsOfExperience: number;
  csat: number | null;
  followers: number;
  conversations: number;
  lastActiveDays: number;
  previousCompaniesFa: string[];
  jobCategoriesFa: JobField[];
  experienceTimeline: ExperienceTimelineItem[];
  latestCompanyId: string;
  publicExperienceCompanyIds: string[];
  professionalSummary: string;
  languages: string[];
  pricing: DurationPricing;
  review: string;
  reviewAuthor: {
    name: string;
    role: string;
    company?: string;
  };
  isFollowing: boolean;
  isSaved: boolean;
};

type TimelineSeed = Omit<ExperienceTimelineItem, "id" | "startMonth" | "endMonth" | "description"> &
  Partial<Pick<ExperienceTimelineItem, "startMonth" | "endMonth" | "description">>;

function timelineItem(id: string, item: TimelineSeed): ExperienceTimelineItem {
  return {
    startMonth: 1,
    endMonth: item.isCurrent ? null : 12,
    description: "",
    ...item,
    id
  };
}

export const profiles = [
  {
    id: "ali",
    name: "علی ر.",
    initials: "ع",
    status: "active",
    acceptsConversationRequests: true,
    roleFa: "مدیر محصول",
    orgLevel: "مدیر میانی",
    yearsOfExperience: 8,
    csat: 4.8,
    followers: 186,
    conversations: 42,
    lastActiveDays: 1,
    previousCompaniesFa: ["اسنپ", "دیجی‌کالا"],
    jobCategoriesFa: ["محصول و تجربه کاربر"],
    experienceTimeline: initialExperienceTimeline,
    latestCompanyId: "timeline-current-snapp",
    publicExperienceCompanyIds: ["timeline-previous-digikala"],
    professionalSummary: "تجربه در تیم‌های محصول و تحلیل داده، با تمرکز بر تصمیم‌سازی محصولی.",
    languages: ["فارسی"],
    pricing: { 30: 1000000, 60: 1800000 },
    review: "جلسه دقیق، کاربردی و متناسب با تجربه کاری‌اش بود.",
    reviewAuthor: { name: "مریم ک.", role: "مدیر محصول", company: "دیوار" },
    isFollowing: false,
    isSaved: false
  },
  {
    id: "sara",
    name: "سارا م.",
    initials: "س",
    status: "active",
    acceptsConversationRequests: true,
    roleFa: "طراح محصول",
    orgLevel: "کارشناس ارشد",
    yearsOfExperience: 6,
    csat: 4.7,
    followers: 143,
    conversations: 36,
    lastActiveDays: 3,
    previousCompaniesFa: ["کافه‌بازار", "دیوار"],
    jobCategoriesFa: ["محصول و تجربه کاربر"],
    experienceTimeline: [
      timelineItem("sara-current", {
        jobTitle: "طراح محصول",
        jobField: "محصول و تجربه کاربر",
        orgLevel: "کارشناس ارشد",
        companyName: "کافه‌بازار",
        companyCountry: "ایران",
        companyIndustry: "مارکت‌پلیس نرم‌افزار",
        startYear: 1400,
        startMonth: 1,
        endYear: null,
        endMonth: null,
        isCurrent: true
      }),
      timelineItem("sara-previous", {
        jobTitle: "طراح تجربه کاربر",
        jobField: "طراحی گرافیک و هویت بصری",
        orgLevel: "کارشناس",
        companyName: "دیوار",
        companyCountry: "ایران",
        companyIndustry: "نیازمندی آنلاین",
        startYear: 1397,
        startMonth: 4,
        endYear: 1400,
        endMonth: 1,
        isCurrent: false
      })
    ],
    latestCompanyId: "sara-current",
    publicExperienceCompanyIds: ["sara-previous"],
    professionalSummary: "تجربه طراحی محصول، طراحی تجربه کاربر، ساخت پورتفولیو و همکاری با تیم‌های محصول.",
    languages: ["فارسی", "انگلیسی"],
    pricing: { 30: 500000, 60: 900000 },
    review: "درک خوبی از فضای طراحی محصول و همکاری با تیم‌های محصول داشت.",
    reviewAuthor: { name: "نیما الف.", role: "طراح محصول", company: "اسنپ" },
    isFollowing: false,
    isSaved: false
  },
  {
    id: "nazanin",
    name: "نازنین ک.",
    initials: "ن",
    status: "active",
    acceptsConversationRequests: true,
    roleFa: "راهبر هوش تجاری",
    orgLevel: "مدیر ارشد",
    yearsOfExperience: 10,
    csat: 4.9,
    followers: 212,
    conversations: 58,
    lastActiveDays: 0,
    previousCompaniesFa: ["دیجی‌کالا", "علی‌بابا"],
    jobCategoriesFa: ["علوم داده و هوش مصنوعی"],
    experienceTimeline: [
      timelineItem("nazanin-current", {
        jobTitle: "راهبر هوش تجاری",
        jobField: "علوم داده و هوش مصنوعی",
        orgLevel: "مدیر ارشد",
        companyName: "دیجی‌کالا",
        companyCountry: "ایران",
        companyIndustry: "تجارت الکترونیک",
        startYear: 1399,
        endYear: null,
        endMonth: null,
        isCurrent: true
      }),
      timelineItem("nazanin-previous", {
        jobTitle: "تحلیلگر داده",
        jobField: "علوم داده و هوش مصنوعی",
        orgLevel: "کارشناس ارشد",
        companyName: "علی‌بابا",
        companyCountry: "ایران",
        companyIndustry: "سفر آنلاین",
        startYear: 1395,
        endYear: 1399,
        endMonth: 1,
        isCurrent: false
      })
    ],
    latestCompanyId: "nazanin-current",
    publicExperienceCompanyIds: ["nazanin-previous"],
    professionalSummary: "تجربه کار با داده، داشبوردهای تصمیم‌ساز و مدیریت فعالیت‌های BI.",
    languages: ["فارسی", "انگلیسی"],
    pricing: { 30: 1000000, 60: 1800000 },
    review: "تجربه‌اش در BI و تحلیل داده برای تصمیم‌گیری شغلی روشن‌کننده بود.",
    reviewAuthor: { name: "سارا ب.", role: "تحلیل‌گر داده", company: "کافه‌بازار" },
    isFollowing: false,
    isSaved: false
  },
  {
    id: "mina",
    name: "مینا پ.",
    initials: "م",
    status: "active",
    acceptsConversationRequests: true,
    roleFa: "کارشناس رشد",
    orgLevel: "کارشناس",
    yearsOfExperience: 4,
    csat: 4.6,
    followers: 98,
    conversations: 21,
    lastActiveDays: 6,
    previousCompaniesFa: ["اسنپ", "تپسی"],
    jobCategoriesFa: ["مارکتینگ و برند"],
    experienceTimeline: [
      timelineItem("mina-current", {
        jobTitle: "کارشناس رشد",
        jobField: "مارکتینگ و برند",
        orgLevel: "کارشناس",
        companyName: "اسنپ",
        companyCountry: "ایران",
        companyIndustry: "حمل‌ونقل آنلاین",
        startYear: 1401,
        endYear: null,
        endMonth: null,
        isCurrent: true
      }),
      timelineItem("mina-previous", {
        jobTitle: "کارشناس کمپین",
        jobField: "مارکتینگ و برند",
        orgLevel: "کارشناس",
        companyName: "تپسی",
        companyCountry: "ایران",
        companyIndustry: "حمل‌ونقل آنلاین",
        startYear: 1399,
        endYear: 1401,
        isCurrent: false
      })
    ],
    latestCompanyId: "mina-current",
    publicExperienceCompanyIds: [],
    professionalSummary: "تجربه در Growth Marketing، کمپین‌های رشد، تحلیل داده و قیف جذب کاربر.",
    languages: ["فارسی"],
    pricing: { 30: 300000, 60: 500000 },
    review: "شناخت خوبی از Growth، کمپین و کار با داده داشت.",
    reviewAuthor: { name: "آرش ن.", role: "کارشناس رشد", company: "تپسی" },
    isFollowing: false,
    isSaved: false
  },
  {
    id: "reza",
    name: "رضا الف.",
    initials: "ر",
    status: "active",
    acceptsConversationRequests: true,
    roleFa: "مدیر مهندسی",
    orgLevel: "مدیر ارشد",
    yearsOfExperience: 15,
    csat: 4.9,
    followers: 304,
    conversations: 74,
    lastActiveDays: 2,
    previousCompaniesFa: ["دیجی‌کالا", "اسنپ"],
    jobCategoriesFa: ["فنی و مهندسی نرم‌افزار"],
    experienceTimeline: [
      timelineItem("reza-current", {
        jobTitle: "مدیر مهندسی",
        jobField: "فنی و مهندسی نرم‌افزار",
        orgLevel: "مدیر ارشد",
        companyName: "دیجی‌کالا",
        companyCountry: "ایران",
        companyIndustry: "تجارت الکترونیک",
        startYear: 1399,
        endYear: null,
        endMonth: null,
        isCurrent: true
      }),
      timelineItem("reza-previous", {
        jobTitle: "راهبر تیم فنی",
        jobField: "مدیریت، رهبری و کارآفرینی",
        orgLevel: "مدیر میانی",
        companyName: "اسنپ",
        companyCountry: "ایران",
        companyIndustry: "حمل‌ونقل آنلاین",
        startYear: 1394,
        endYear: 1399,
        isCurrent: false
      })
    ],
    latestCompanyId: "reza-current",
    publicExperienceCompanyIds: ["reza-previous"],
    professionalSummary: "تجربه مدیریت تیم‌های فنی، همکاری با محصول و ساختاردهی تیم‌های رشدپذیر.",
    languages: ["فارسی", "انگلیسی"],
    pricing: { 30: 1000000, 60: 1800000 },
    review: "درک خوبی از رشد تیم فنی و تصمیم‌های مدیریتی داشت.",
    reviewAuthor: { name: "مهسا ک.", role: "مهندس نرم‌افزار", company: "دیجی‌کالا" },
    isFollowing: false,
    isSaved: false
  },
  {
    id: "mohsen",
    name: "محسن ن.",
    initials: "م",
    avatarUrl: "/avatars/mohsen.svg",
    status: "active",
    acceptsConversationRequests: true,
    roleFa: "مدیر تحلیل داده",
    orgLevel: "مدیر ارشد",
    yearsOfExperience: 11,
    csat: 4.8,
    followers: 0,
    conversations: 32,
    lastActiveDays: 2,
    previousCompaniesFa: ["دیجی‌کالا", "علی‌بابا"],
    jobCategoriesFa: ["علوم داده و هوش مصنوعی"],
    experienceTimeline: [
      timelineItem("mohsen-current", {
        jobTitle: "مدیر تحلیل داده",
        jobField: "علوم داده و هوش مصنوعی",
        orgLevel: "مدیر ارشد",
        companyName: "دیجی‌کالا",
        companyCountry: "ایران",
        companyIndustry: "تجارت الکترونیکی",
        startYear: 1399,
        endYear: null,
        endMonth: null,
        isCurrent: true
      }),
      timelineItem("mohsen-previous", {
        jobTitle: "تحلیل‌گر داده",
        jobField: "علوم داده و هوش مصنوعی",
        orgLevel: "کارشناس ارشد",
        companyName: "علی‌بابا",
        companyCountry: "ایران",
        companyIndustry: "سفر آنلاین",
        startYear: 1395,
        endYear: 1399,
        endMonth: 1,
        isCurrent: false
      })
    ],
    latestCompanyId: "mohsen-current",
    publicExperienceCompanyIds: ["mohsen-previous"],
    professionalSummary: "تجربه در ساخت تیم تحلیل داده، تبدیل داده خام به تصمیم محصولی و همکاری نزدیک با تیم‌های محصول و عملیات.",
    languages: ["فارسی", "انگلیسی"],
    pricing: { 30: 1000000, 60: 1800000 },
    review: "جلسه دقیق و داده‌محور بود و مسیر تصمیم‌گیری را روشن‌تر کرد.",
    reviewAuthor: { name: "امین ش.", role: "مدیر محصول", company: "اسنپ" },
    isFollowing: false,
    isSaved: false
  },
  {
    id: "niloofar",
    name: "نیلوفر ج.",
    initials: "ن",
    status: "active",
    acceptsConversationRequests: true,
    roleFa: "شریک منابع انسانی",
    orgLevel: "مدیر میانی",
    yearsOfExperience: 2,
    csat: null,
    followers: 76,
    conversations: 0,
    lastActiveDays: 8,
    previousCompaniesFa: ["تپسی", "دیوار"],
    jobCategoriesFa: ["منابع انسانی و فرهنگ سازمانی"],
    experienceTimeline: [
      timelineItem("niloofar-current", {
        jobTitle: "شریک منابع انسانی",
        jobField: "منابع انسانی و فرهنگ سازمانی",
        orgLevel: "مدیر میانی",
        companyName: "تپسی",
        companyCountry: "ایران",
        companyIndustry: "حمل‌ونقل آنلاین",
        startYear: 1402,
        endYear: null,
        endMonth: null,
        isCurrent: true
      }),
      timelineItem("niloofar-previous", {
        jobTitle: "کارشناس منابع انسانی",
        jobField: "منابع انسانی و فرهنگ سازمانی",
        orgLevel: "کارشناس",
        companyName: "دیوار",
        companyCountry: "ایران",
        companyIndustry: "نیازمندی آنلاین",
        startYear: 1400,
        endYear: 1402,
        isCurrent: false
      })
    ],
    latestCompanyId: "niloofar-current",
    publicExperienceCompanyIds: ["niloofar-previous"],
    professionalSummary: "تجربه در مسیرهای رشد شغلی، بازخوردهای عملکردی و همکاری با تیم‌های کسب‌وکار.",
    languages: ["فارسی"],
    pricing: { 30: 1000000, 60: 1800000 },
    review: "هنوز بازخوردی ثبت نشده است.",
    reviewAuthor: { name: "کاربر Useravaa", role: "درخواست‌دهنده جلسه" },
    isFollowing: false,
    isSaved: false
  },
  {
    id: "hamid",
    name: "حمید ص.",
    initials: "ح",
    status: "active",
    acceptsConversationRequests: false,
    roleFa: "تحلیل‌گر داده",
    orgLevel: "کارشناس",
    yearsOfExperience: 1,
    csat: null,
    followers: 18,
    conversations: 0,
    lastActiveDays: 12,
    previousCompaniesFa: [],
    jobCategoriesFa: ["علوم داده و هوش مصنوعی"],
    experienceTimeline: [
      timelineItem("hamid-current", {
        jobTitle: "تحلیلگر داده",
        jobField: "علوم داده و هوش مصنوعی",
        orgLevel: "کارشناس",
        companyName: "Useravaa",
        companyCountry: "ایران",
        companyIndustry: "پلتفرم تجربه شغلی",
        startYear: 1403,
        endYear: null,
        endMonth: null,
        isCurrent: true
      })
    ],
    latestCompanyId: "hamid-current",
    publicExperienceCompanyIds: [],
    professionalSummary: "تجربه شروع مسیر در تحلیل داده، گزارش‌سازی و ساخت داشبوردهای عملیاتی.",
    languages: ["فارسی"],
    pricing: { 30: 300000, 60: 500000 },
    review: "هنوز بازخوردی ثبت نشده است.",
    reviewAuthor: { name: "کاربر Useravaa", role: "درخواست‌دهنده جلسه" },
    isFollowing: false,
    isSaved: false
  }
] as const satisfies readonly ExperienceProfileFixture[];

export type DiscoveryState = "ready" | "loading" | "error";
export type ExperienceRange = "" | "0-2" | "3-5" | "6-9" | "10-14" | "15+";
export type SortOption = "relevant" | "experience_desc" | "csat_desc" | "recent_activity";

export const formatter = new Intl.NumberFormat("fa-IR");

export function toman(value: number | null) {
  return value == null ? "نیاز به تعیین" : `${formatter.format(value)} تومان`;
}

export function toFaDecimal(value: number) {
  return String(value).replace(".", "٫");
}

export function uniqueValues(values: readonly string[]) {
  return Array.from(new Set(values));
}

export const roleOptions = uniqueValues(profiles.map((profile) => profile.roleFa));
export const categoryOptions = [...jobFieldTaxonomy];
export const companyOptions = uniqueValues(
  profiles.flatMap((profile) => profile.experienceTimeline.filter((item) => !item.isCurrent).map((item) => item.companyName))
);

export function yearsInRange(years: number, range: ExperienceRange) {
  if (!range) {
    return true;
  }

  if (range === "0-2") {
    return years >= 0 && years <= 2;
  }

  if (range === "3-5") {
    return years >= 3 && years <= 5;
  }

  if (range === "6-9") {
    return years >= 6 && years <= 9;
  }

  if (range === "10-14") {
    return years >= 10 && years <= 14;
  }

  return years >= 15;
}

export function getProfileById(profileId: string) {
  return profiles.find((profile) => profile.id === profileId);
}

export function getRequestHref(profileId: string, duration: 30 | 60) {
  return `/requests/new?profileId=${profileId}&duration=${duration}`;
}

export function toggleProfileIdSelection(selectedIds: ReadonlySet<string>, profileId: string) {
  const next = new Set(selectedIds);
  if (next.has(profileId)) {
    next.delete(profileId);
  } else {
    next.add(profileId);
  }
  return next;
}
