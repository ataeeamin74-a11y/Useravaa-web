import rawCareerSkillRequirements from "./data/career-skill-requirements.json";
import { getSkillById, type SkillCatalogItem, type SkillType } from "./skill-catalog";

export const skillImportanceValues = ["core", "important", "useful"] as const;
export type SkillImportance = (typeof skillImportanceValues)[number];

export const skillEntryExpectationValues = ["awareness", "basic", "working", "advanced"] as const;
export type SkillEntryExpectation = (typeof skillEntryExpectationValues)[number];

export type CareerSkillRequirement = Readonly<{
  skillId: string;
  importance: SkillImportance;
  entryExpectation: SkillEntryExpectation;
  weight: number;
}>;

export type CareerSkillRequirementRecord = Readonly<{
  careerSlug: string;
  titleFa: string;
  titleEn: string;
  softSkills: readonly CareerSkillRequirement[];
  foundationalSkills: readonly CareerSkillRequirement[];
  specializedSkills: readonly CareerSkillRequirement[];
  tools: readonly CareerSkillRequirement[];
}>;

type CareerSkillRequirementsPayload = Readonly<{
  schemaVersion: number;
  canonicalCareerCount: number;
  scoringDefaults: Readonly<{
    haveMultiplier: number;
    interestedMultiplier: number;
    missingCorePenalty: number;
    interestedCorePenaltyMultiplier: number;
  }>;
  records: readonly CareerSkillRequirementRecord[];
}>;

export type ResolvedCareerSkillRequirement = Readonly<{
  type: SkillType;
  requirement: CareerSkillRequirement;
  skill: SkillCatalogItem;
}>;

export const careerSkillRequirements = rawCareerSkillRequirements as CareerSkillRequirementsPayload;

const requirementsBySlug = new Map(
  careerSkillRequirements.records.map((record) => [record.careerSlug, record])
);

export function getCareerSkillRequirementsBySlug(careerSlug: string) {
  return requirementsBySlug.get(careerSlug);
}
export function resolveCareerSkillRequirements(
  record: CareerSkillRequirementRecord
): readonly ResolvedCareerSkillRequirement[] {
  const groups: readonly [SkillType, readonly CareerSkillRequirement[]][] = [
    ["soft", record.softSkills],
    ["foundational", record.foundationalSkills],
    ["specialized", record.specializedSkills],
    ["tool", record.tools]
  ];

  return groups.flatMap(([type, requirements]) => requirements.flatMap((requirement) => {
    const skill = getSkillById(requirement.skillId);
    return skill ? [{ type, requirement, skill }] : [];
  }));
}

export function getCareerRequirementSkills(
  careerSlug: string,
  type: SkillType
) {
  const record = getCareerSkillRequirementsBySlug(careerSlug);
  if (!record) return [];
  const requirements = {
    soft: record.softSkills,
    foundational: record.foundationalSkills,
    specialized: record.specializedSkills,
    tool: record.tools
  }[type];

  return requirements.flatMap((requirement) => {
    const skill = getSkillById(requirement.skillId);
    return skill ? [skill] : [];
  });
}
