import rawCuratedCareerPageContent from "./data/career-page-curated-content.json";

export type CuratedCareerPageContent = Readonly<{
  careerSlug: string;
  titleFa: string;
  sourceResearchSlugs: readonly string[];
  heroDescriptor: string;
  intro: string;
  decisionCards: Readonly<{
    attraction: string;
    fit: string;
    mainDifficulty: string;
  }>;
  workday: readonly string[];
  hardships: readonly Readonly<{
    title: string;
    body: string;
  }>[];
  intelligence: Readonly<{
    easier: readonly string[];
    harder: readonly string[];
  }>;
  interviewQuestions: readonly string[];
}>;

type CuratedCareerPagePayload = Readonly<{
  schemaVersion: number;
  generatedFrom: string;
  pageCount: number;
  pages: readonly CuratedCareerPageContent[];
}>;

export const curatedCareerPageContent = rawCuratedCareerPageContent as CuratedCareerPagePayload;

const curatedContentBySlug = new Map(
  curatedCareerPageContent.pages.map((page) => [page.careerSlug, page])
);

export function getCuratedCareerPageContent(careerSlug: string) {
  return curatedContentBySlug.get(careerSlug);
}
