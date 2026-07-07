import { careerHierarchy, visibleCareerHierarchy } from "./career-data";
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

export function getCareerPathById(pathId: string): CareerSubfamilyNode | undefined {
  return careerPathById.get(pathId);
}

export function getCareerPathByCardId(cardId: string): CareerSubfamilyNode | undefined {
  const pathId = careerPathIdByCardId.get(cardId);
  return pathId ? careerPathById.get(pathId) : undefined;
}

// Saved data from the first MVP used card IDs. New engagement features use
// path IDs, so this one-way resolver keeps existing saves useful.
export function resolveCareerPathId(id: string): string | undefined {
  return getCareerPathById(id)?.id ?? getCareerPathByCardId(id)?.id;
}

export function getCareerPathDetailHref(path: CareerSubfamilyNode): string {
  const representativeCard = path.cards[0];
  return representativeCard
    ? `/career?card=${encodeURIComponent(representativeCard.id)}`
    : "/career";
}
