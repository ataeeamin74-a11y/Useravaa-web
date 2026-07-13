import type { CareerPathSeoEntry } from "./career-path-seo";
import { getCuratedCareerPageContent } from "./career-page-curated-content";
import { getCareerResearchByCardId } from "./career-research-content";
import { getCareerRequirementSkills } from "./career-skill-requirements";
import { getCareerPathVisualProfile, type CareerPathVisualProfile } from "./career-path-visuals";

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

export function buildCareerPathProductContent(entry: CareerPathSeoEntry): CareerPathProductContent {
  const visualProfile = getCareerPathVisualProfile(entry.path);
  const research = entry.path.cards
    .map((card) => getCareerResearchByCardId(card.id))
    .find((item) => item !== undefined);
  const curated = getCuratedCareerPageContent(entry.slug);

  if (!research || !curated) {
    throw new Error(`Missing curated production content for canonical career path: ${entry.slug}`);
  }

  const fitTones = ["teal", "blue", "yellow", "persimmon"] as const;
  const hardshipTones = ["persimmon", "yellow", "persimmon", "yellow", "persimmon", "yellow"] as const;
  const normalizedSoftSkills = getCareerRequirementSkills(entry.slug, "soft").slice(0, 8);
  const normalizedFoundationalSkills = getCareerRequirementSkills(entry.slug, "foundational");
  const normalizedSpecializedSkills = getCareerRequirementSkills(entry.slug, "specialized");
  const normalizedTools = getCareerRequirementSkills(entry.slug, "tool").slice(0, 8);

  return {
    title: curated.titleFa,
    visualProfile,
    heroDescriptor: curated.heroDescriptor,
    intro: curated.intro,
    decisionCards: [
      { label: "جذابیت اصلی", value: curated.decisionCards.attraction, tone: "teal" },
      { label: "مناسب‌تر برای", value: curated.decisionCards.fit, tone: "yellow" },
      { label: "سختی اصلی", value: curated.decisionCards.mainDifficulty, tone: "persimmon" }
    ],
    fitDimensions: research.fitDimensions.map((dimension, index) => ({
      label: dimension.label,
      value: dimension.level,
      tone: fitTones[index] ?? "teal"
    })),
    reality: {
      workday: curated.workday,
      softSkills: normalizedSoftSkills.map((skill) => skill.titleFa),
      technicalSkills: unique([
        ...normalizedFoundationalSkills.map((skill) => skill.titleFa),
        ...normalizedSpecializedSkills.map((skill) => skill.titleFa)
      ]),
      tools: normalizedTools.map((skill) => skill.titleFa)
    },
    hardships: curated.hardships.map((hardship, index) => ({
      title: hardship.title,
      body: hardship.body,
      tone: hardshipTones[index] ?? "persimmon"
    })),
    intelligence: curated.intelligence,
    interviewQuestions: curated.interviewQuestions,
    finalCtaText: "این مسیر را برای بررسی نگه دار"
  };
}
