import type { CareerPathSeoEntry } from "./career-path-seo";
import { getCareerPathMainDuties } from "./career-path-seo";
import { getCareerResearchByCardId } from "./career-research-content";
import { getCareerRequirementSkills } from "./career-skill-requirements";
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
  interviewQuestions: readonly string[];
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

function localizeArtificialIntelligence(value: string) {
  return value.replace(/\bAI\b/gu, "هوش مصنوعی");
}

function localizeList(values: readonly string[]) {
  return values.map(localizeArtificialIntelligence);
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
      title: "نیاز به صبر و تمرین تکراری",
      body: `بخش‌هایی مثل ${firstOrFallback(duties, profile.focusLabel)} با یک بار دیدن یا خواندن جا نمی‌افتند و به تمرین واقعی نیاز دارند.`,
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
    "چرا می‌خواهی وارد این مسیر شغلی شوی؟",
    `چه تجربه یا تمرینی مرتبط با مسیر شغلی ${title} انجام داده‌ای؟`,
    "وقتی با یک مسئله مبهم روبه‌رو می‌شوی، چطور شروع می‌کنی؟",
    `با چه ابزارها یا مهارت‌هایی مثل ${tool} و ${skill} آشنا هستی؟`,
    `اگر با کاری مثل ${duty} روبه‌رو شوی، فکر می‌کنی کدام بخش برای رشدت مهم‌تر است؟`
  ];
}

export function buildCareerPathProductContent(entry: CareerPathSeoEntry): CareerPathProductContent {
  const profile = getCareerPathVisualProfile(entry.path);
  const research = entry.path.cards
    .map((card) => getCareerResearchByCardId(card.id))
    .find((item) => item !== undefined);
  const normalizedSoftSkills = getCareerRequirementSkills(entry.slug, "soft").slice(0, 8);
  const normalizedFoundationalSkills = getCareerRequirementSkills(entry.slug, "foundational");
  const normalizedSpecializedSkills = getCareerRequirementSkills(entry.slug, "specialized");
  const normalizedTools = getCareerRequirementSkills(entry.slug, "tool").slice(0, 8);
  const normalizedTechnicalSkills = unique([
    ...normalizedFoundationalSkills.map((skill) => skill.titleFa),
    ...normalizedSpecializedSkills.map((skill) => skill.titleFa)
  ]);

  if (research) {
    const fitTones = ["teal", "blue", "yellow", "persimmon"] as const;
    const hardshipTones = ["persimmon", "yellow", "persimmon", "persimmon", "yellow"] as const;

    return {
      title: research.hero.titleFa,
      visualProfile: profile,
      heroDescriptor: localizeArtificialIntelligence(research.hero.workNatureLabel),
      intro: localizeArtificialIntelligence(research.hero.decisionDescription),
      decisionCards: [
        { label: "جذابیت اصلی", value: localizeArtificialIntelligence(research.hero.attraction), tone: "teal" },
        { label: "مناسب‌تر برای", value: localizeArtificialIntelligence(research.hero.fitIndicator), tone: "yellow" },
        { label: "سختی اصلی", value: localizeArtificialIntelligence(research.hero.mainDifficulty), tone: "persimmon" }
      ],
      fitDimensions: research.fitDimensions.map((dimension, index) => ({
        label: dimension.label,
        value: dimension.level,
        tone: fitTones[index] ?? "teal"
      })),
      reality: {
        workday: localizeList(research.reality.workday),
        softSkills: normalizedSoftSkills.map((skill) => skill.titleFa),
        technicalSkills: normalizedTechnicalSkills,
        tools: normalizedTools.map((skill) => skill.titleFa)
      },
      hardships: research.hardships.map((hardship, index) => ({
        title: hardship.title,
        body: localizeArtificialIntelligence(
          `${hardship.explanation} موقعیت رایج: ${hardship.context}`
        ),
        tone: hardshipTones[index] ?? "persimmon"
      })),
      intelligence: {
        easier: localizeList(research.intelligence.easier),
        harder: localizeList(research.intelligence.harder),
        judgment: "قضاوت، کنترل منبع و مسئولیت نتیجه همچنان بخش مهم کار حرفه‌ای است."
      },
      interviewQuestions: localizeList(research.interviewQuestions),
      finalCtaText: "این مسیر را برای بررسی نگه دار"
    };
  }

  const title = entry.path.name;
  const duties = getCareerPathMainDuties(entry.path);
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
      softSkills: normalizedSoftSkills.map((skill) => skill.titleFa),
      technicalSkills: normalizedTechnicalSkills,
      tools: normalizedTools.map((skill) => skill.titleFa)
    },
    hardships: buildHardships(profile, duties, normalizedTools.map((skill) => skill.titleFa)),
    intelligence: buildIntelligence(profile, duties, normalizedTools.map((skill) => skill.titleFa)),
    interviewQuestions: buildInterviewQuestions(title, normalizedTechnicalSkills, normalizedTools.map((skill) => skill.titleFa), duties),
    finalCtaText: "این مسیر را برای بررسی نگه دار"
  };
}
