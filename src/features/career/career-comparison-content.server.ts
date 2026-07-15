import "server-only";

import { buildCareerPathProductContent } from "./career-path-page-content";
import { getCareerPathSeoEntries } from "./career-path-seo";

export type CareerComparisonContentItem = Readonly<{
  pathId: string;
  duties: readonly string[];
  softSkills: readonly string[];
  technicalSkills: readonly string[];
  tools: readonly string[];
}>;

export function buildCareerComparisonContent(): readonly CareerComparisonContentItem[] {
  return getCareerPathSeoEntries().map((entry) => {
    const content = buildCareerPathProductContent(entry);
    return {
      pathId: entry.path.id,
      duties: content.reality.workday,
      softSkills: content.reality.softSkills,
      technicalSkills: content.reality.technicalSkills,
      tools: content.reality.tools
    };
  });
}
