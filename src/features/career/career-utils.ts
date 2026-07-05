import type {
  CareerCard,
  CareerDomainNode,
  CareerGeneralCategoryNode,
  CareerHierarchySelection,
  CareerSearchResult,
  CareerSubfamilyNode,
  RawCareerCard
} from "./career-types";

const LIST_SEPARATOR = /[،؛,]+/u;
const EXPERT_SENIORITY = /(?:کارشناس|متخصص|expert|specialist|individual contributor|\bic\b)/iu;
const MANAGEMENT_SENIORITY = /(?:مدیریت|مدیر|رهبری|management|manager|leadership|leader)/iu;

const TOOL_KEYWORDS = /(?:\b(?:software|platform|tools?|systems?|frameworks?|libraries|databases?|monitoring|observability|virtualization|microsoft|excel|word|powerpoint|office|power bi|tableau|metabase|figma|adobe|photoshop|illustrator|premiere|after effects|git|github|gitlab|jira|confluence|docker|kubernetes|terraform|ansible|jenkins|grafana|prometheus|sql server|mysql|postgresql|redis|mongodb|aws|azure|gcp|crm|erp|cms|siem|soar|firewall|vpn|ids|ips|edr|xdr|sap|linux|windows|kafka|spark|clickhouse|pytorch|tensorflow|langchain|ssis|ssas|dax|ngrx|rxjs|next\.js|nuxt\.js|ats|linkedin|google ads|google analytics|spss|semrush|screaming frog|canva|notion|playwright|cypress|selenium|jetpack compose|cinema 4d|blender|java|python|php|node\.js|typescript|javascript)\b|نرم افزار|ابزار|پلتفرم|سامانه|سپیدار|راهکاران|همکاران سیستم)/iu;
const SOFT_SKILL_KEYWORDS = /(?:ارتباط|همکاری|کار تیمی|حل مسئله|مسئولیت پذیری|تعهد|یادگیری پذیری|دقت|نظم کاری|مدیریت زمان|برنامه ریزی|مذاکره|متقاعدسازی|ارائه|رهبری|مدیریت تعارض|مدیریت استرس|صبوری|خلاقیت|نتیجه گرایی|پیگیری|تصمیم گیری|تفکر تحلیلی|تفکر سیستمی|تفکر استراتژیک|انعطاف پذیری|سازگاری|همدلی|مالکیت|خودانگیختگی|توجه به جزئیات|پذیرش بازخورد|communication|teamwork|leadership|negotiation|problem solving)/iu;

export type SupportingRequirementKind = "technical" | "tool" | "soft";

export type SupportingRequirementClassification = Readonly<{
  kind: SupportingRequirementKind;
  reason: "known-tool" | "known-soft" | "known-technical" | "tool-keyword" | "soft-keyword" | "default-technical";
}>;

export type CareerItemReferenceSets = Readonly<{
  technical: ReadonlySet<string>;
  tools: ReadonlySet<string>;
  soft: ReadonlySet<string>;
}>;

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

function getSenioritySortRank(seniority: string): number {
  if (EXPERT_SENIORITY.test(seniority)) return 0;
  if (MANAGEMENT_SENIORITY.test(seniority)) return 1;
  return 2;
}

export function sortCareerCardsBySeniority(cards: readonly CareerCard[]): readonly CareerCard[] {
  return cards
    .map((card, sourceIndex) => ({ card, sourceIndex }))
    .sort((first, second) => (
      getSenioritySortRank(first.card.seniority) - getSenioritySortRank(second.card.seniority)
      || first.sourceIndex - second.sourceIndex
    ))
    .map(({ card }) => card);
}

export function isManagementCareerCard(card: CareerCard): boolean {
  return MANAGEMENT_SENIORITY.test(card.seniority);
}

function getCareerPathIdentity(card: CareerCard): string {
  return [card.domain, card.generalCategory, card.subfamily]
    .map(normalizeSearchText)
    .join("::");
}

export function selectVisibleCareerRepresentatives(
  cards: readonly CareerCard[]
): readonly CareerCard[] {
  const representatives = new Map<string, CareerCard>();

  for (const card of cards) {
    if (isManagementCareerCard(card)) continue;

    const identity = getCareerPathIdentity(card);
    const currentRepresentative = representatives.get(identity);

    if (!currentRepresentative || (
      EXPERT_SENIORITY.test(card.seniority)
      && !EXPERT_SENIORITY.test(currentRepresentative.seniority)
    )) {
      representatives.set(identity, card);
    }
  }

  return [...representatives.values()];
}

const CAREER_SENIORITY_SUFFIX = /\s*[-–—]\s*(?:سطح\s*)?(?:کارشناسی|مدیریت)\s*$/iu;
const CAREER_SENIORITY_FRAGMENT = /^(?:سطح\s*)?(?:کارشناسی|مدیریت)$/iu;

export function getCareerDisplayTitle(title: string): string {
  return title.replace(CAREER_SENIORITY_SUFFIX, "").trim();
}

export function getCareerDisplaySubtitle(subtitle: string): string {
  return subtitle
    .split("|")
    .map((part) => part.trim())
    .filter((part) => part && !CAREER_SENIORITY_FRAGMENT.test(part))
    .join(" | ");
}

export function buildCareerItemReferenceSets(rawCards: readonly RawCareerCard[]): CareerItemReferenceSets {
  const technical = new Set<string>();
  const tools = new Set<string>();
  const soft = new Set<string>();

  for (const card of rawCards) {
    splitCareerList(card.Key_Technical_Skills_FA).forEach((item) => technical.add(normalizeSearchText(item)));
    splitCareerList(card.Key_Tools_Tech_FA).forEach((item) => tools.add(normalizeSearchText(item)));
    splitCareerList(card.Key_Soft_Skills_FA).forEach((item) => soft.add(normalizeSearchText(item)));
  }

  return { technical, tools, soft };
}

export function classifySupportingRequirement(
  item: string,
  referenceSets: CareerItemReferenceSets
): SupportingRequirementClassification {
  const normalizedItem = normalizeSearchText(item);

  if (referenceSets.tools.has(normalizedItem)) return { kind: "tool", reason: "known-tool" };
  if (referenceSets.soft.has(normalizedItem)) return { kind: "soft", reason: "known-soft" };
  if (referenceSets.technical.has(normalizedItem)) return { kind: "technical", reason: "known-technical" };
  if (TOOL_KEYWORDS.test(normalizedItem)) return { kind: "tool", reason: "tool-keyword" };
  if (SOFT_SKILL_KEYWORDS.test(normalizedItem)) return { kind: "soft", reason: "soft-keyword" };

  return { kind: "technical", reason: "default-technical" };
}

function classifySupportingRequirements(
  supportingRequirements: readonly string[],
  primaryItems: readonly string[],
  referenceSets: CareerItemReferenceSets
) {
  const primaryItemSet = new Set(primaryItems.map(normalizeSearchText));
  const seenSupportingItems = new Set<string>();
  const technical: string[] = [];
  const tools: string[] = [];
  const soft: string[] = [];

  for (const item of supportingRequirements) {
    const normalizedItem = normalizeSearchText(item);

    if (primaryItemSet.has(normalizedItem) || seenSupportingItems.has(normalizedItem)) continue;
    seenSupportingItems.add(normalizedItem);

    const classification = classifySupportingRequirement(item, referenceSets);
    if (classification.kind === "tool") tools.push(item);
    else if (classification.kind === "soft") soft.push(item);
    else technical.push(item);
  }

  return { technical, tools, soft };
}

export function normalizeCareerCard(
  rawCard: RawCareerCard,
  referenceSets: CareerItemReferenceSets = buildCareerItemReferenceSets([rawCard])
): CareerCard {
  const keyTechnicalSkills = splitCareerList(rawCard.Key_Technical_Skills_FA);
  const keyTools = splitCareerList(rawCard.Key_Tools_Tech_FA);
  const keySoftSkills = splitCareerList(rawCard.Key_Soft_Skills_FA);
  const supportingRequirements = splitCareerList(rawCard.Supporting_Requirements_FA);
  const classifiedSupportingRequirements = classifySupportingRequirements(
    supportingRequirements,
    [...keyTechnicalSkills, ...keyTools, ...keySoftSkills],
    referenceSets
  );
  const mainDuties = rawCard.Main_Duties_List_FA.map((duty) => duty.trim()).filter(Boolean);
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
      ...supportingRequirements,
      ...mainDuties,
      rawCard.Audience_Card_Text_FA
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
    supportingTechnicalSkills: classifiedSupportingRequirements.technical,
    supportingTools: classifiedSupportingRequirements.tools,
    supportingSoftSkills: classifiedSupportingRequirements.soft,
    audienceText: rawCard.Audience_Card_Text_FA,
    mainDuties,
    searchableText
  };
}

function createHierarchyId(...parts: string[]): string {
  return parts.map(encodeURIComponent).join("::");
}

export function buildCareerHierarchy(cards: readonly CareerCard[]): readonly CareerDomainNode[] {
  const domainCards = new Map<string, CareerCard[]>();

  for (const card of cards) {
    const presentationDomain = getPresentationDomainName(card);
    const existingCards = domainCards.get(presentationDomain);

    if (existingCards) {
      existingCards.push(card);
    } else {
      domainCards.set(presentationDomain, [card]);
    }
  }

  return Array.from(domainCards, ([domain, cardsInDomain]) => {
    const generalCategoryCards = new Map<string, CareerCard[]>();

    for (const card of cardsInDomain) {
      const existingCards = generalCategoryCards.get(card.generalCategory);

      if (existingCards) {
        existingCards.push(card);
      } else {
        generalCategoryCards.set(card.generalCategory, [card]);
      }
    }

    const generalCategories: CareerGeneralCategoryNode[] = Array.from(
      generalCategoryCards,
      ([generalCategory, cardsInGeneralCategory]) => {
        const subfamilyCards = new Map<string, CareerCard[]>();

        for (const card of cardsInGeneralCategory) {
          const existingCards = subfamilyCards.get(card.subfamily);

          if (existingCards) {
            existingCards.push(card);
          } else {
            subfamilyCards.set(card.subfamily, [card]);
          }
        }

        const subfamilies: CareerSubfamilyNode[] = Array.from(
          subfamilyCards,
          ([subfamily, cardsInSubfamily]) => ({
            id: createHierarchyId(domain, generalCategory, subfamily),
            domain,
            generalCategory,
            midCategory: cardsInSubfamily[0].midCategory,
            name: subfamily,
            cards: sortCareerCardsBySeniority(cardsInSubfamily)
          })
        );

        return {
          id: createHierarchyId(domain, generalCategory),
          domain,
          name: generalCategory,
          midCategories: Array.from(new Set(cardsInGeneralCategory.map((card) => card.midCategory))),
          subfamilies
        };
      }
    );

    return {
      id: createHierarchyId(domain),
      name: domain,
      generalCategories,
      subfamilyCount: generalCategories.reduce((count, category) => count + category.subfamilies.length, 0),
      cardCount: cardsInDomain.length
    };
  });
}

function includesQuery(values: readonly string[], normalizedQuery: string): boolean {
  return values.some((value) => normalizeSearchText(value).includes(normalizedQuery));
}

function getSearchMatchReason(card: CareerCard, normalizedQuery: string): string {
  if (includesQuery([card.title, card.subtitle, card.domain, card.generalCategory, card.midCategory, card.subfamily], normalizedQuery)) {
    return "عنوان یا دسته‌بندی";
  }

  if (includesQuery(card.keyTechnicalSkills, normalizedQuery)) return "مهارت تخصصی";
  if (includesQuery(card.keyTools, normalizedQuery)) return "ابزار و تکنولوژی";
  if (includesQuery(card.keySoftSkills, normalizedQuery)) return "مهارت نرم";
  if (includesQuery(card.supportingRequirements, normalizedQuery)) return "نیازمندی همراه";
  if (normalizeSearchText(card.audienceText).includes(normalizedQuery)) return "خلاصه برای مخاطب";

  return "اطلاعات مسیر";
}

export function searchCareerHierarchy(
  hierarchy: readonly CareerDomainNode[],
  query: string
): readonly CareerSearchResult[] {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) return [];

  const results: CareerSearchResult[] = [];

  for (const domain of hierarchy) {
    for (const category of domain.generalCategories) {
      for (const subfamily of category.subfamilies) {
        const matchingCards = subfamily.cards.filter((card) => card.searchableText.includes(normalizedQuery));

        if (matchingCards.length) {
          results.push({
            subfamily,
            matchingCards,
            matchReason: getSearchMatchReason(matchingCards[0], normalizedQuery)
          });
        }
      }
    }
  }

  return results;
}

export function getRelatedCareerSubfamilies(
  hierarchy: readonly CareerDomainNode[],
  currentSubfamily: CareerSubfamilyNode
): readonly CareerSubfamilyNode[] {
  const currentRawDomain = currentSubfamily.cards[0]?.domain;
  const seenSubfamilies = new Set([currentSubfamily.name]);
  const subfamilies = hierarchy.flatMap((domain) => (
    domain.generalCategories.flatMap((category) => category.subfamilies)
  ));
  const relatedSubfamilies: CareerSubfamilyNode[] = [];

  for (const subfamily of subfamilies) {
    if (seenSubfamilies.has(subfamily.name)) continue;
    if (subfamily.generalCategory !== currentSubfamily.generalCategory) continue;

    relatedSubfamilies.push(subfamily);
    seenSubfamilies.add(subfamily.name);
  }

  for (const subfamily of subfamilies) {
    if (seenSubfamilies.has(subfamily.name)) continue;
    if (!currentRawDomain || subfamily.cards[0]?.domain !== currentRawDomain) continue;

    relatedSubfamilies.push(subfamily);
    seenSubfamilies.add(subfamily.name);
  }

  return relatedSubfamilies;
}

export function resolveDomainSelection(domain: CareerDomainNode): CareerHierarchySelection {
  const category = domain.generalCategories.length === 1 ? domain.generalCategories[0] : undefined;
  const subfamily = category?.subfamilies.length === 1 ? category.subfamilies[0] : undefined;

  return {
    domainId: domain.id,
    categoryId: category?.id,
    subfamilyId: subfamily?.id
  };
}

export function normalizeCareerCards(rawCards: readonly RawCareerCard[]): readonly CareerCard[] {
  const referenceSets = buildCareerItemReferenceSets(rawCards);
  return rawCards.map((card) => normalizeCareerCard(card, referenceSets));
}

export function getPresentationDomainName(card: CareerCard): string {
  return card.generalCategory === "Sales & Business Development"
    ? "Sales & Business Development"
    : card.domain;
}

export function resolveCategorySelection(
  domain: CareerDomainNode,
  category: CareerGeneralCategoryNode
): CareerHierarchySelection {
  const subfamily = category.subfamilies.length === 1 ? category.subfamilies[0] : undefined;

  return {
    domainId: domain.id,
    categoryId: category.id,
    subfamilyId: subfamily?.id
  };
}

export function getMeaningfulParentSelection(
  domain?: CareerDomainNode,
  category?: CareerGeneralCategoryNode,
  subfamily?: CareerSubfamilyNode
): CareerHierarchySelection {
  if (!domain) return {};

  if (subfamily && category) {
    if (category.subfamilies.length > 1) return { domainId: domain.id, categoryId: category.id };
    if (domain.generalCategories.length > 1) return { domainId: domain.id };
    return {};
  }

  if (category) {
    if (domain.generalCategories.length > 1) return { domainId: domain.id };
    return {};
  }

  return {};
}

export function getDomainContextSelection(domain: CareerDomainNode): CareerHierarchySelection | undefined {
  if (domain.generalCategories.length > 1) return { domainId: domain.id };

  const category = domain.generalCategories[0];
  if (category && category.subfamilies.length > 1) return { domainId: domain.id, categoryId: category.id };

  return undefined;
}

export function getCategoryContextSelection(
  domain: CareerDomainNode,
  category: CareerGeneralCategoryNode
): CareerHierarchySelection | undefined {
  if (category.subfamilies.length <= 1) return undefined;
  return { domainId: domain.id, categoryId: category.id };
}

export function matchesCareerCard(card: CareerCard, query: string, domain: string): boolean {
  const matchesDomain = domain === "all" || card.domain === domain;
  const normalizedQuery = normalizeSearchText(query);

  return matchesDomain && (!normalizedQuery || card.searchableText.includes(normalizedQuery));
}
