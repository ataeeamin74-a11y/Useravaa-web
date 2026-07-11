import { careerHierarchy, visibleCareerHierarchy } from "./career-data";
import {
  LEGACY_SOCIAL_MEDIA_CARD_IDS,
  LEGACY_SOCIAL_MEDIA_PATH_IDS,
  SOCIAL_MEDIA_MARKETING_CARD_ID
} from "./career-path-migration";
import type { CareerSubfamilyNode } from "./career-types";

export const careerPaths = visibleCareerHierarchy.flatMap((domain) => (
  domain.generalCategories.flatMap((category) => category.subfamilies)
));

const careerPathById = new Map(careerPaths.map((path) => [path.id, path]));
const careerPathIdByCardId = new Map(
  careerHierarchy.flatMap((domain) => domain.generalCategories.flatMap((category) => (
    category.subfamilies.flatMap((path) => path.cards.map((card) => [card.id, path.id] as const))
  )))
);
const socialMediaMarketingPathId = careerPathIdByCardId.get(SOCIAL_MEDIA_MARKETING_CARD_ID);
const legacyCareerPathIdAliases = new Map<string, string>(
  socialMediaMarketingPathId
    ? [
        ...LEGACY_SOCIAL_MEDIA_CARD_IDS,
        ...LEGACY_SOCIAL_MEDIA_PATH_IDS
      ].map((legacyId) => [legacyId, socialMediaMarketingPathId])
    : []
);

export function getCareerPathById(pathId: string): CareerSubfamilyNode | undefined {
  return careerPathById.get(pathId);
}

export function getCareerPathByCardId(cardId: string): CareerSubfamilyNode | undefined {
  const pathId = careerPathIdByCardId.get(cardId) ?? legacyCareerPathIdAliases.get(cardId);
  return pathId ? careerPathById.get(pathId) : undefined;
}

// Saved data from the first MVP used card IDs. New engagement features use
// path IDs, so this one-way resolver keeps existing saves useful.
export function resolveCareerPathId(id: string): string | undefined {
  return getCareerPathById(id)?.id
    ?? getCareerPathByCardId(id)?.id
    ?? legacyCareerPathIdAliases.get(id);
}

export function getCareerPathDetailHref(path: CareerSubfamilyNode): string {
  const representativeCard = path.cards[0];
  return representativeCard
    ? `/career?card=${encodeURIComponent(representativeCard.id)}`
    : "/career";
}
