import type { CareerPathSeoEntry } from "./career-path-seo";
import {
  getCareerPathMainDuties,
  getCareerPathSoftSkills,
  getCareerPathTechnicalSkills,
  getCareerPathTools
} from "./career-path-seo";
import { getCareerPathVisualProfile, type CareerPathVisualProfile } from "./career-path-visuals";

type Tone = "blue" | "teal" | "yellow" | "persimmon";

export type CareerPathProductContent = Readonly<{
  title: string;
  intro: string;
  visualProfile: CareerPathVisualProfile;
  decisionCards: readonly Readonly<{ label: string; value: string; tone: Tone }>[];
  snapshotRows: readonly Readonly<{ label: string; value: string; tone: Tone }>[];
  fitBullets: readonly string[];
  frictionBullets: readonly string[];
  workdayCards: readonly Readonly<{ title: string; body: string; tone: Tone }>[];
  startSteps: readonly Readonly<{ title: string; body: string; tone: Tone }>[];
  experienceQuestions: readonly string[];
  faqItems: readonly Readonly<{ question: string; answer: string }>[];
}>;

function unique(values: readonly string[]) {
  const seen = new Set<string>();
  const items: string[] = [];

  for (const value of values) {
    const normalized = value.trim().replace(/\s+/gu, " ");
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    items.push(normalized);
  }

  return items;
}

function listPhrase(items: readonly string[], fallback: string, limit = 3) {
  const values = unique(items).slice(0, limit);
  if (!values.length) return fallback;
  return new Intl.ListFormat("fa-IR", { style: "long", type: "conjunction" }).format(values);
}

function firstOrFallback(items: readonly string[], fallback: string) {
  return unique(items)[0] ?? fallback;
}

function buildFitBullets(
  profile: CareerPathVisualProfile,
  duties: readonly string[],
  technicalSkills: readonly string[],
  softSkills: readonly string[]
) {
  return [
    `اگر از ${profile.focusLabel} انرژی می‌گیری.`,
    `اگر ${firstOrFallback(softSkills, "یادگیری‌پذیری و مسئولیت‌پذیری")} برایت فقط شعار نیست.`,
    `اگر می‌توانی با ${firstOrFallback(duties, firstOrFallback(technicalSkills, "تمرین عملی"))} آرام و مرحله‌ای جلو بروی.`
  ];
}

function buildFrictionBullets(
  profile: CareerPathVisualProfile,
  duties: readonly string[],
  tools: readonly string[]
) {
  return [
    `اگر ${profile.frictionLabel} خیلی زود فرسوده‌ات می‌کند.`,
    `اگر ترجیح می‌دهی کارها همیشه شفاف، ثابت و بدون بازخورد باشند.`,
    `اگر از درگیر شدن با ${firstOrFallback(tools, firstOrFallback(duties, "جزئیات کار"))} فاصله می‌گیری.`
  ];
}

function buildStartSteps(
  profile: CareerPathVisualProfile,
  duties: readonly string[],
  technicalSkills: readonly string[],
  tools: readonly string[]
) {
  const duty = firstOrFallback(duties, profile.focusLabel);
  const skillPhrase = listPhrase(technicalSkills, "مهارت‌های پایه همین مسیر شغلی", 2);
  const toolPhrase = listPhrase(tools, "ابزار ساده و در دسترس", 2);

  return [
    {
      title: "تست ۷ روزه",
      body: `هر روز یک نمونه واقعی از ${duty} را ببین و یادداشت کن کدام بخش برایت روشن یا مبهم بود.`,
      tone: "yellow" as const
    },
    {
      title: "تست ۳۰ روزه",
      body: `یک مسئله کوچک انتخاب کن و با ${skillPhrase} یک خروجی قابل توضیح بساز.`,
      tone: "teal" as const
    },
    {
      title: "اولین خروجی قابل ارائه",
      body: `یک نمونه جمع‌وجور با ${toolPhrase} آماده کن و بنویس چه مسئله‌ای را حل کرده‌ای.`,
      tone: "blue" as const
    }
  ];
}

function buildFaqItems(
  title: string,
  profile: CareerPathVisualProfile,
  relatedTitles: readonly string[]
) {
  const relatedPhrase = listPhrase(relatedTitles, "مسیرهای شغلی نزدیک همین خانواده", 3);

  return [
    {
      question: "این مسیر برای چه آدم‌هایی مناسب‌تر است؟",
      answer: `برای کسی مناسب‌تر است که با ${profile.focusLabel} ارتباط می‌گیرد و از ${profile.workTypeLabel} فرار نمی‌کند.`
    },
    {
      question: "شروع این مسیر بدون سابقه ممکن است؟",
      answer: `شروع مسیر شغلی ${title} بدون سابقه برای بعضی افراد ${profile.startWithoutExperience} است؛ اما تصمیم بهتر وقتی شکل می‌گیرد که یک خروجی کوچک واقعی بسازی و بازخورد بگیری.`
    },
    {
      question: "سخت‌ترین بخش این مسیر چیست؟",
      answer: `در این مسیر شغلی، سختی اصلی معمولاً ${profile.frictionLabel} است، نه فقط یاد گرفتن ابزار.`
    },
    {
      question: "این مسیر با کدام مسیرها اشتباه گرفته می‌شود؟",
      answer: `معمولاً با ${relatedPhrase} اشتباه گرفته می‌شود؛ چون بخشی از ابزارها یا محیط کار مشترک است، اما فشار روزمره و خروجی مورد انتظار فرق دارد.`
    },
    {
      question: "قبل از انتخاب این مسیر چه چیزی را باید بپرسم؟",
      answer: `قبل از انتخاب، بپرس اولین خروجی واقعی چه شکلی است، فشار اصلی از کجا می‌آید، و چه تمرینی زودتر نشان می‌دهد مسیر شغلی ${title} به تو نزدیک است یا نه.`
    }
  ];
}

export function buildCareerPathProductContent(
  entry: CareerPathSeoEntry,
  relatedTitles: readonly string[]
): CareerPathProductContent {
  const title = entry.path.name;
  const profile = getCareerPathVisualProfile(entry.path);
  const duties = getCareerPathMainDuties(entry.path);
  const technicalSkills = getCareerPathTechnicalSkills(entry.path);
  const tools = getCareerPathTools(entry.path);
  const softSkills = getCareerPathSoftSkills(entry.path);
  const mainDuty = firstOrFallback(duties, profile.focusLabel);
  const skillPhrase = listPhrase(technicalSkills, profile.focusLabel, 2);

  return {
    title,
    visualProfile: profile,
    intro: `این صفحه کمک می‌کند مسیر شغلی ${title} را مثل یک تصمیم واقعی ببینی: کار اصلی، فشار روزمره، آدم‌های درگیر و یک شروع کم‌ریسک برای سنجیدن تناسب.`,
    decisionCards: [
      { label: "کار اصلی", value: mainDuty, tone: "teal" },
      { label: "مناسب‌تر برای", value: profile.fitLabel, tone: "yellow" },
      { label: "سختی اصلی", value: profile.frictionLabel, tone: "persimmon" }
    ],
    snapshotRows: [
      { label: "نوع کار", value: profile.workTypeLabel, tone: "teal" },
      { label: "میزان تعامل با آدم‌ها", value: profile.interactionLevel, tone: "yellow" },
      { label: "میزان کار با ابزار/داده", value: profile.toolDataLevel, tone: "blue" },
      { label: "میزان ابهام", value: profile.ambiguityLevel, tone: "persimmon" },
      { label: "نیاز به نمونه‌کار", value: profile.portfolioNeed, tone: "yellow" },
      { label: "شروع بدون سابقه", value: profile.startWithoutExperience, tone: "teal" }
    ],
    fitBullets: buildFitBullets(profile, duties, technicalSkills, softSkills),
    frictionBullets: buildFrictionBullets(profile, duties, tools),
    workdayCards: [
      {
        title: "بیشتر با چه کارهایی درگیری؟",
        body: listPhrase(duties, profile.focusLabel, 3),
        tone: "teal"
      },
      {
        title: "با چه آدم‌هایی کار می‌کنی؟",
        body: profile.collaborationLabel,
        tone: "yellow"
      },
      {
        title: "فشار اصلی از کجاست؟",
        body: profile.pressureLabel,
        tone: "persimmon"
      }
    ],
    startSteps: buildStartSteps(profile, duties, technicalSkills, tools),
    experienceQuestions: [
      "اولین ماه کارت واقعاً چه شکلی بود؟",
      "چه چیزی را قبل از ورود اشتباه فهمیده بودی؟",
      "چه آدم‌هایی در این مسیر زود خسته می‌شوند؟",
      "برای شروع، چه تمرینی واقعاً مفید بود؟",
      "اگر امروز از صفر شروع می‌کردی، چه کار می‌کردی؟"
    ],
    faqItems: buildFaqItems(title, { ...profile, focusLabel: skillPhrase }, relatedTitles)
  };
}
