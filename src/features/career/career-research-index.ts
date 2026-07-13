import rawCareerResearchIndex from "./data/career-research-index.json";

export type CareerResearchIndexEntry = Readonly<{
  roleId: string;
  researchSlug: string;
  sourceResearchSlugs: readonly string[];
  appSlug: string;
  cardId: string;
  categoryId: string;
  titleFa: string;
  titleEn: string;
  relatedResearchSlugs: readonly string[];
}>;

type CareerResearchIndex = Readonly<{
  schemaVersion: number;
  sourceRoleCount: number;
  roleCount: number;
  roles: readonly CareerResearchIndexEntry[];
}>;

export const careerResearchIndex = rawCareerResearchIndex as CareerResearchIndex;

const indexByCardId = new Map(careerResearchIndex.roles.map((role) => [role.cardId, role]));
const indexByResearchSlug = new Map(
  careerResearchIndex.roles.flatMap((role) => [
    [role.researchSlug, role] as const,
    ...role.sourceResearchSlugs.map((sourceSlug) => [sourceSlug, role] as const)
  ])
);

export function getCareerResearchIndexByCardId(cardId: string) {
  return indexByCardId.get(cardId);
}

export function getCareerResearchIndexByResearchSlug(researchSlug: string) {
  return indexByResearchSlug.get(researchSlug);
}
