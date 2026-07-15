import {
  careerSkillRequirements,
  resolveCareerSkillRequirements,
  type CareerSkillRequirementRecord,
  type ResolvedCareerSkillRequirement
} from "./career-skill-requirements";
import type { SkillSelectionState, UserSkillProfile } from "./career-skill-profile";
import type { SkillType } from "./skill-catalog";

export type CareerMatchLabel = "خیلی نزدیک" | "نزدیک" | "قابل بررسی";
export type CareerMatchCoverage = "strong" | "adequate" | "preliminary";
export type CareerMatchBasis = "current" | "interest" | "mixed" | "limited";
export type CareerGapPriority = "شروع از اینجا" | "قدم بعد" | "برای بعدتر";

export type CareerSkillMatch = Readonly<{
  careerSlug: string;
  titleFa: string;
  titleEn: string;
  score: number;
  label: CareerMatchLabel;
  coverage: CareerMatchCoverage;
  matchedCurrent: readonly ResolvedCareerSkillRequirement[];
  matchedInterests: readonly ResolvedCareerSkillRequirement[];
  missingCore: readonly ResolvedCareerSkillRequirement[];
  missingCoreByType: Readonly<Record<SkillType, readonly ResolvedCareerSkillRequirement[]>>;
  strongestReasons: readonly ResolvedCareerSkillRequirement[];
  basis: CareerMatchBasis;
  explanation: string;
  record: CareerSkillRequirementRecord;
}>;

export type CareerGapItem = ResolvedCareerSkillRequirement & Readonly<{
  priority: CareerGapPriority;
  selectedState?: SkillSelectionState;
}>;

export type CareerSkillGap = Readonly<{
  current: readonly ResolvedCareerSkillRequirement[];
  soft: readonly CareerGapItem[];
  foundational: readonly CareerGapItem[];
  specialized: readonly CareerGapItem[];
  tools: readonly CareerGapItem[];
}>;

function selectionMap(profile: UserSkillProfile) {
  return new Map(profile.selections.map((selection) => [selection.skillId, selection.state]));
}

function priorityRank(priority: CareerGapPriority) {
  return { "شروع از اینجا": 0, "قدم بعد": 1, "برای بعدتر": 2 }[priority];
}

function gapPriority(
  item: ResolvedCareerSkillRequirement,
  selected: ReadonlyMap<string, SkillSelectionState>
): CareerGapPriority {
  const missingPrerequisite = item.skill.prerequisiteSkillIds.some((skillId) => (
    selected.get(skillId) !== "have"
  ));
  if (missingPrerequisite) return "شروع از اینجا";
  if (
    item.requirement.importance === "core"
    && ["awareness", "basic"].includes(item.requirement.entryExpectation)
  ) return "شروع از اینجا";
  if (
    item.requirement.importance === "core"
    || item.requirement.importance === "important"
  ) return "قدم بعد";
  return "برای بعدتر";
}

function buildExplanation(
  matchedCurrent: readonly ResolvedCareerSkillRequirement[],
  matchedInterests: readonly ResolvedCareerSkillRequirement[],
  missingCore: readonly ResolvedCareerSkillRequirement[]
) {
  const currentTitles = matchedCurrent.slice(0, 2).map((item) => item.skill.titleFa);
  const interestTitles = matchedInterests.slice(0, currentTitles.length ? 1 : 2).map((item) => item.skill.titleFa);
  const matchedTitles = [...currentTitles, ...interestTitles];
  const gapTitles = missingCore
    .filter((item) => !matchedInterests.some((interest) => interest.skill.id === item.skill.id))
    .slice(0, 2)
    .map((item) => item.skill.titleFa);

  const evidence = matchedTitles.length
    ? `این مسیر به انتخاب‌های تو نزدیک است چون ${matchedTitles.join("، ")} در آن نقش مهمی دارند.`
    : "برای این مسیر هنوز شواهد مشترک کمی در انتخاب‌هایت دیده می‌شود.";
  const gap = gapTitles.length
    ? `برای شروع بهتر است ${gapTitles.join(" و ")} را هم بررسی کنی.`
    : "انتخاب‌هایت بخش خوبی از نیازهای اصلی شروع این مسیر را پوشش می‌دهند.";
  return `${evidence} ${gap}`;
}

function scoreCareer(
  record: CareerSkillRequirementRecord,
  selected: ReadonlyMap<string, SkillSelectionState>
): CareerSkillMatch {
  const requirements = resolveCareerSkillRequirements(record);
  const matchedCurrent = requirements.filter((item) => selected.get(item.skill.id) === "have");
  const matchedInterests = requirements.filter((item) => selected.get(item.skill.id) === "interested");
  const missingCore = requirements.filter((item) => (
    item.requirement.importance === "core" && selected.get(item.skill.id) !== "have"
  ));
  const missingCoreByType = {
    soft: missingCore.filter((item) => item.type === "soft"),
    foundational: missingCore.filter((item) => item.type === "foundational"),
    specialized: missingCore.filter((item) => item.type === "specialized"),
    tool: missingCore.filter((item) => item.type === "tool")
  } satisfies Record<SkillType, readonly ResolvedCareerSkillRequirement[]>;
  const currentFit = matchedCurrent.reduce((sum, item) => (
    sum + item.requirement.weight * careerSkillRequirements.scoringDefaults.haveMultiplier
  ), 0);
  const interestFit = matchedInterests.reduce((sum, item) => (
    sum + item.requirement.weight * careerSkillRequirements.scoringDefaults.interestedMultiplier
  ), 0);
  const gapPenalty = missingCore.reduce((sum, item) => {
    const interestMultiplier = selected.get(item.skill.id) === "interested"
      ? careerSkillRequirements.scoringDefaults.interestedCorePenaltyMultiplier
      : 1;
    return sum
      + item.requirement.weight
      * careerSkillRequirements.scoringDefaults.missingCorePenalty
      * interestMultiplier;
  }, 0);
  const totalWeight = requirements.reduce((sum, item) => sum + item.requirement.weight, 0) || 1;
  const score = Number(((currentFit + interestFit - gapPenalty) / totalWeight).toFixed(6));
  const matchCount = matchedCurrent.length + matchedInterests.length;
  const selectedCount = selected.size;
  const label: CareerMatchLabel = matchCount >= Math.min(4, selectedCount) && matchedCurrent.length >= 2
    ? "خیلی نزدیک"
    : matchCount >= Math.min(2, selectedCount)
      ? "نزدیک"
      : "قابل بررسی";
  const coverage: CareerMatchCoverage = matchCount >= 3
    ? "strong"
    : matchCount >= 1
      ? "adequate"
      : "preliminary";
  const basis: CareerMatchBasis = !matchCount
    ? "limited"
    : currentFit > interestFit * 1.25
      ? "current"
      : interestFit > currentFit * 1.25
        ? "interest"
        : "mixed";
  const strongestReasons = [...matchedCurrent, ...matchedInterests]
    .sort((first, second) => second.requirement.weight - first.requirement.weight)
    .slice(0, 3);

  return {
    careerSlug: record.careerSlug,
    titleFa: record.titleFa,
    titleEn: record.titleEn,
    score,
    label,
    coverage,
    matchedCurrent,
    matchedInterests,
    missingCore,
    missingCoreByType,
    strongestReasons,
    basis,
    explanation: buildExplanation(matchedCurrent, matchedInterests, missingCore),
    record
  };
}

export function rankCareerSkillMatches(
  profile: UserSkillProfile,
  limit = 10
): readonly CareerSkillMatch[] {
  const selected = selectionMap(profile);
  if (!selected.size) return [];

  return careerSkillRequirements.records
    .map((record) => scoreCareer(record, selected))
    .filter((match) => match.matchedCurrent.length + match.matchedInterests.length > 0)
    .sort((first, second) => (
      second.score - first.score
      || second.matchedCurrent.length - first.matchedCurrent.length
      || second.matchedInterests.length - first.matchedInterests.length
      || first.careerSlug.localeCompare(second.careerSlug, "en")
    ))
    .slice(0, Math.max(0, limit));
}

function requirementGapItems(
  requirements: readonly ResolvedCareerSkillRequirement[],
  selected: ReadonlyMap<string, SkillSelectionState>,
  type: ResolvedCareerSkillRequirement["type"]
) {
  return requirements
    .filter((item) => (
      item.type === type
      && selected.get(item.skill.id) !== "have"
      && item.requirement.importance !== "useful"
    ))
    .map((item) => ({
      ...item,
      priority: gapPriority(item, selected),
      selectedState: selected.get(item.skill.id)
    }))
    .sort((first, second) => (
      priorityRank(first.priority) - priorityRank(second.priority)
      || second.requirement.weight - first.requirement.weight
    ));
}

export function buildCareerSkillGap(
  match: CareerSkillMatch,
  profile: UserSkillProfile
): CareerSkillGap {
  const selected = selectionMap(profile);
  const requirements = resolveCareerSkillRequirements(match.record);

  return {
    current: requirements.filter((item) => selected.get(item.skill.id) === "have"),
    soft: requirementGapItems(requirements, selected, "soft"),
    foundational: requirementGapItems(requirements, selected, "foundational"),
    specialized: requirementGapItems(requirements, selected, "specialized"),
    tools: requirementGapItems(requirements, selected, "tool")
  };
}

export function getCareerSkillMatchBySlug(
  profile: UserSkillProfile,
  careerSlug: string
) {
  return rankCareerSkillMatches(profile, careerSkillRequirements.records.length)
    .find((match) => match.careerSlug === careerSlug);
}
