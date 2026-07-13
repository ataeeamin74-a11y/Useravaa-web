import rawSkillCatalog from "./data/skill-catalog.json";

export const skillTypes = ["soft", "foundational", "specialized", "tool"] as const;
export type SkillType = (typeof skillTypes)[number];

export type SkillCatalogItem = Readonly<{
  id: string;
  type: SkillType;
  titleFa: string;
  titleEn: string;
  descriptionFa: string;
  aliasesFa: readonly string[];
  aliasesEn: readonly string[];
  searchTerms: readonly string[];
  isSelectable: boolean;
  isRecommended: boolean;
  prerequisiteSkillIds: readonly string[];
  relatedSkillIds: readonly string[];
  broaderSkillId: string | null;
  narrowerSkillIds: readonly string[];
}>;

type SkillCatalogPayload = Readonly<{
  schemaVersion: number;
  generatedFrom: string;
  itemCount: number;
  items: readonly SkillCatalogItem[];
}>;

export const skillCatalog = rawSkillCatalog as SkillCatalogPayload;

export const skillTypeLabels: Readonly<Record<SkillType, string>> = {
  soft: "مهارت‌های نرم",
  foundational: "مهارت‌های پایه",
  specialized: "مهارت‌های تخصصی",
  tool: "ابزارها"
};

export function normalizeSkillSearchText(value: string) {
  return value
    .normalize("NFKC")
    .replace(/[يى]/gu, "ی")
    .replace(/ك/gu, "ک")
    .replace(/[\u200c\u200d]/gu, " ")
    .replace(/[“”«»'`]/gu, "")
    .replace(/[.,،؛;:!?؟()[\]{}_/\\-]+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim()
    .toLocaleLowerCase("fa");
}
const skillById = new Map(skillCatalog.items.map((item) => [item.id, item]));
const skillIdBySearchTerm = new Map<string, string>();

for (const item of skillCatalog.items) {
  for (const term of [item.titleFa, item.titleEn, ...item.aliasesFa, ...item.aliasesEn]) {
    skillIdBySearchTerm.set(normalizeSkillSearchText(term), item.id);
  }
}

export function getSkillById(skillId: string) {
  return skillById.get(skillId);
}

export function resolveSkillId(value: string) {
  if (skillById.has(value)) return value;
  return skillIdBySearchTerm.get(normalizeSkillSearchText(value));
}

export function searchSkillCatalog(
  query: string,
  type: SkillType | "all" = "all"
) {
  const normalizedQuery = normalizeSkillSearchText(query);
  const tokens = normalizedQuery.split(" ").filter(Boolean);

  return skillCatalog.items.filter((item) => {
    if (!item.isSelectable || (type !== "all" && item.type !== type)) return false;
    if (!tokens.length) return true;
    const searchable = normalizeSkillSearchText(item.searchTerms.join(" "));
    return tokens.every((token) => searchable.includes(token));
  });
}

export function getRecommendedSkills(type?: SkillType) {
  return skillCatalog.items.filter((item) => (
    item.isSelectable
    && item.isRecommended
    && (!type || item.type === type)
  ));
}

export function getSkillsByType(type: SkillType) {
  return skillCatalog.items.filter((item) => item.isSelectable && item.type === type);
}
