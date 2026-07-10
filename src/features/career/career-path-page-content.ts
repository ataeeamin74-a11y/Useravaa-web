import type { CareerPathSeoEntry } from "./career-path-seo";
import {
  getCareerPathMainDuties,
  getCareerPathSoftSkills,
  getCareerPathTechnicalSkills,
  getCareerPathTools
} from "./career-path-seo";
import { getCareerPathVisualProfile, type CareerPathSceneType, type CareerPathVisualProfile } from "./career-path-visuals";

export type Tone = "blue" | "teal" | "yellow" | "persimmon";
export type QualitativeLevel = "کم" | "متوسط" | "زیاد";

export type CareerPathProductContent = Readonly<{
  title: string;
  intro: string;
  visualProfile: CareerPathVisualProfile;
  heroDescriptor: string;
  decisionCards: readonly Readonly<{ label: string; value: string; tone: Tone }>[];
  fitDimensions: readonly Readonly<{ label: string; value: QualitativeLevel; tone: Tone }>[];
  reality: Readonly<{
    workday: readonly string[];
    softSkills: readonly string[];
    technicalSkills: readonly string[];
    tools: readonly string[];
  }>;
  hardships: readonly Readonly<{ title: string; body: string; tone: Tone }>[];
  intelligence: Readonly<{
    easier: readonly string[];
    harder: readonly string[];
    judgment: string;
  }>;
  interviewQuestions: readonly Readonly<{ question: string; hint: string }>[];
  finalCtaText: string;
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

function pick(values: readonly string[], fallback: readonly string[], limit: number) {
  const items = unique(values).slice(0, limit);
  return items.length ? items : fallback.slice(0, limit);
}

function firstOrFallback(items: readonly string[], fallback: string) {
  return unique(items)[0] ?? fallback;
}

function getCreativityLevel(sceneType: CareerPathSceneType): QualitativeLevel {
  if (["creative", "content", "interface", "campaign", "decision"].includes(sceneType)) return "زیاد";
  if (["data", "finance", "server"].includes(sceneType)) return "متوسط";
  return "متوسط";
}

function getStatisticalAnalysisLevel(sceneType: CareerPathSceneType): QualitativeLevel {
  if (["data", "campaign", "search", "finance"].includes(sceneType)) return "زیاد";
  if (["decision", "server", "support"].includes(sceneType)) return "متوسط";
  return "کم";
}

function buildFitDimensions(profile: CareerPathVisualProfile) {
  return [
    { label: "نیاز به تعامل با آدم‌ها", value: profile.interactionLevel, tone: "teal" as const },
    { label: "نیاز به استفاده از ابزارها", value: profile.toolDataLevel, tone: "blue" as const },
    { label: "نیاز به خلاقیت", value: getCreativityLevel(profile.sceneType), tone: "yellow" as const },
    { label: "نیاز به تحلیل آماری", value: getStatisticalAnalysisLevel(profile.sceneType), tone: "persimmon" as const }
  ];
}

function buildHardships(profile: CareerPathVisualProfile, duties: readonly string[], tools: readonly string[]) {
  return [
    {
      title: "سختی‌های واقعی مسیر",
      body: profile.frictionLabel,
      tone: "persimmon" as const
    },
    {
      title: "از بیرون ساده‌تر دیده می‌شود",
      body: `بخش‌هایی مثل ${firstOrFallback(duties, profile.focusLabel)} معمولاً ساده‌تر از چیزی که در اجرا تجربه می‌شود به نظر می‌رسند.`,
      tone: "yellow" as const
    },
    {
      title: "ممکن است خسته‌ات کند",
      body: `تکرار، بازخورد و درگیری با ${firstOrFallback(tools, "جزئیات کار")} اگر با روحیه‌ات هماهنگ نباشد فرسایشی می‌شود.`,
      tone: "persimmon" as const
    }
  ];
}

function buildIntelligence(profile: CareerPathVisualProfile, duties: readonly string[], tools: readonly string[]) {
  const primaryDuty = firstOrFallback(duties, profile.focusLabel);
  const primaryTool = firstOrFallback(tools, "ابزارهای روزمره این مسیر شغلی");

  return {
    easier: [
      `جمع‌آوری ایده اولیه برای ${primaryDuty} سریع‌تر می‌شود.`,
      `مرتب کردن پیش‌نویس‌ها، چک‌لیست‌ها و خروجی‌های تکراری با ${primaryTool} آسان‌تر می‌شود.`
    ],
    harder: [
      "خروجی سطحی بیشتر می‌شود و تشخیص کیفیت مهم‌تر از قبل است.",
      "رقابت برای کسی که فقط ابزار بلد است سخت‌تر می‌شود."
    ],
    judgment: "قضاوت انسانی، فهم مسئله، توضیح تصمیم و مسئولیت‌پذیری هنوز بخش اصلی تصمیم حرفه‌ای است."
  };
}

function buildInterviewQuestions(
  title: string,
  technicalSkills: readonly string[],
  tools: readonly string[],
  duties: readonly string[]
) {
  const skill = firstOrFallback(technicalSkills, `مهارت‌های پایه مسیر شغلی ${title}`);
  const tool = firstOrFallback(tools, "ابزارهای اصلی این مسیر");
  const duty = firstOrFallback(duties, "یک مسئله واقعی و مبهم");

  return [
    {
      question: "چرا می‌خواهی وارد این مسیر شغلی شوی؟",
      hint: "به علاقه واقعی، تجربه کوچک و چیزی که از کار روزمره فهمیده‌ای اشاره کن."
    },
    {
      question: `چه تجربه یا تمرینی مرتبط با مسیر شغلی ${title} انجام داده‌ای؟`,
      hint: `یک نمونه کوچک از ${duty} بهتر از توضیح کلی است.`
    },
    {
      question: "وقتی با یک مسئله مبهم روبه‌رو می‌شوی، چطور شروع می‌کنی؟",
      hint: "از روشن کردن مسئله، پرسیدن سؤال و ساختن قدم بعدی حرف بزن."
    },
    {
      question: `با چه ابزارها یا مهارت‌هایی مثل ${tool} و ${skill} آشنا هستی؟`,
      hint: "سطح آشنایی را واقعی بگو و درباره تمرین یا خروجی خودت توضیح بده."
    },
    {
      question: "اگر بخواهی در این مسیر رشد کنی، فکر می‌کنی روی چه چیزی باید بیشتر کار کنی؟",
      hint: "یک نقطه رشد مشخص بگو؛ نه پاسخ کلی و بی‌خطر."
    }
  ];
}

export function buildCareerPathProductContent(entry: CareerPathSeoEntry): CareerPathProductContent {
  const title = entry.path.name;
  const profile = getCareerPathVisualProfile(entry.path);
  const duties = getCareerPathMainDuties(entry.path);
  const technicalSkills = getCareerPathTechnicalSkills(entry.path);
  const tools = getCareerPathTools(entry.path);
  const softSkills = getCareerPathSoftSkills(entry.path);
  const mainDuty = firstOrFallback(duties, profile.focusLabel);

  return {
    title,
    visualProfile: profile,
    heroDescriptor: profile.workTypeLabel,
    intro: `این صفحه کمک می‌کند مسیر شغلی ${title} را مثل یک تصمیم واقعی ببینی: تناسب با تو، واقعیت کار، سختی‌ها، اثر هوش مصنوعی و سؤال‌هایی که ممکن است در مصاحبه شغلی بشنوی.`,
    decisionCards: [
      { label: "کار اصلی", value: mainDuty, tone: "teal" },
      { label: "مناسب‌تر برای", value: profile.fitLabel, tone: "yellow" },
      { label: "سختی اصلی", value: profile.frictionLabel, tone: "persimmon" }
    ],
    fitDimensions: buildFitDimensions(profile),
    reality: {
      workday: pick(duties, [profile.focusLabel, profile.pressureLabel, profile.collaborationLabel], 3),
      softSkills: pick(softSkills, ["یادگیری‌پذیری", "ارتباط روشن", "مسئولیت‌پذیری"], 4),
      technicalSkills: pick(technicalSkills, [profile.focusLabel], 4),
      tools: pick(tools, ["ابزارهای اصلی همین مسیر شغلی"], 4)
    },
    hardships: buildHardships(profile, duties, tools),
    intelligence: buildIntelligence(profile, duties, tools),
    interviewQuestions: buildInterviewQuestions(title, technicalSkills, tools, duties),
    finalCtaText: "این مسیر را برای بررسی نگه دار"
  };
}
