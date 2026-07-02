import type { CareerCard, RawCareerCard } from "./career-types";

const LIST_SEPARATOR = /[،؛,]+/u;

export function splitCareerList(value: string): string[] {
  return value
    .split(LIST_SEPARATOR)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFKC")
    .replaceAll("ي", "ی")
    .replaceAll("ك", "ک")
    .replace(/[\u200c\u200d]/gu, " ")
    .replace(/\s+/gu, " ")
    .trim()
    .toLocaleLowerCase("fa-IR");
}

export function normalizeCareerCard(rawCard: RawCareerCard): CareerCard {
  const keyTechnicalSkills = splitCareerList(rawCard.Key_Technical_Skills_FA);
  const keyTools = splitCareerList(rawCard.Key_Tools_Tech_FA);
  const keySoftSkills = splitCareerList(rawCard.Key_Soft_Skills_FA);
  const supportingRequirements = splitCareerList(rawCard.Supporting_Requirements_FA);
  const searchableText = normalizeSearchText(
    [
      rawCard.Card_Title_FA,
      rawCard.Card_Subtitle_FA,
      rawCard.Job_Domain_Group,
      rawCard.General_Job_Category,
      rawCard.Mid_Job_Category,
      rawCard.Final_Job_Subfamily,
      rawCard.Seniority_Level,
      ...keyTechnicalSkills,
      ...keyTools,
      ...keySoftSkills,
      ...supportingRequirements
    ].join(" ")
  );

  return {
    id: rawCard.Card_ID,
    domain: rawCard.Job_Domain_Group,
    generalCategory: rawCard.General_Job_Category,
    midCategory: rawCard.Mid_Job_Category,
    subfamily: rawCard.Final_Job_Subfamily,
    seniority: rawCard.Seniority_Level,
    title: rawCard.Card_Title_FA,
    subtitle: rawCard.Card_Subtitle_FA,
    keyTechnicalSkills,
    keyTools,
    keySoftSkills,
    supportingRequirements,
    audienceText: rawCard.Audience_Card_Text_FA,
    searchableText
  };
}

export function matchesCareerCard(card: CareerCard, query: string, domain: string): boolean {
  const matchesDomain = domain === "all" || card.domain === domain;
  const normalizedQuery = normalizeSearchText(query);

  return matchesDomain && (!normalizedQuery || card.searchableText.includes(normalizedQuery));
}
