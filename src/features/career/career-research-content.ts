import rawCareerResearch from "./data/career-research-content.json";

export type CareerResearchFitDimension = Readonly<{
  label: "نیاز به تعامل با آدم‌ها" | "نیاز به استفاده از ابزارها" | "نیاز به خلاقیت" | "نیاز به تحلیل آماری";
  level: "کم" | "متوسط" | "زیاد";
  explanation: string;
}>;

export type CareerResearchContent = Readonly<{
  roleId: string;
  researchSlug: string;
  sourceResearchSlugs: readonly string[];
  appSlug: string;
  cardId: string;
  categoryId: string;
  source: Readonly<{
    documents: readonly Readonly<{
      researchSlug: string;
      docxPath: string;
      sha256: string;
    }>[];
    reconciliation: null | Readonly<{
      strategy: "curated_merge";
      summary: string;
      preservedEvidence: readonly string[];
      deduplication: string;
    }>;
  }>;
  hero: Readonly<{
    titleFa: string;
    titleEn: string;
    definition: string;
    decisionDescription: string;
    workNatureLabel: string;
    attraction: string;
    fitIndicator: string;
    mainDifficulty: string;
  }>;
  fitDimensions: readonly CareerResearchFitDimension[];
  reality: Readonly<{
    workday: readonly string[];
    softSkills: readonly string[];
    technicalSkills: readonly string[];
    tools: readonly string[];
  }>;
  hardships: readonly Readonly<{
    title: string;
    explanation: string;
    context: string;
  }>[];
  intelligence: Readonly<{
    easier: readonly string[];
    harder: readonly string[];
  }>;
  interviewQuestions: readonly string[];
  relatedResearchSlugs: readonly string[];
  relatedPaths: readonly Readonly<{
    rank: number;
    titleFa: string;
    titleEn: string;
    similarity: string;
    difference: string;
  }>[];
}>;

type CareerResearchPayload = Readonly<{
  schemaVersion: number;
  researchDate: string;
  primaryMarket: string;
  globalReferencePeriod: string;
  sourceRoleCount: number;
  roleCount: number;
  roles: readonly CareerResearchContent[];
}>;

export const careerResearch = rawCareerResearch as CareerResearchPayload;

const researchByCardId = new Map(careerResearch.roles.map((role) => [role.cardId, role]));
const researchByAppSlug = new Map(careerResearch.roles.map((role) => [role.appSlug, role]));
const researchByResearchSlug = new Map(careerResearch.roles.flatMap((role) => [
  [role.researchSlug, role] as const,
  ...role.sourceResearchSlugs.map((sourceSlug) => [sourceSlug, role] as const)
]));

export function getCareerResearchByCardId(cardId: string) {
  return researchByCardId.get(cardId);
}

export function getCareerResearchByAppSlug(appSlug: string) {
  return researchByAppSlug.get(appSlug);
}

export function getCareerResearchByResearchSlug(researchSlug: string) {
  return researchByResearchSlug.get(researchSlug);
}
