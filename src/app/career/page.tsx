import { permanentRedirect } from "next/navigation";
import {
  getCareerPathSeoEntryByCardId,
  getCareerPathSeoEntryBySlugOrLegacy
} from "@/features/career/career-path-seo";

type CareerPathsRouteProps = Readonly<{
  searchParams: Promise<Readonly<Record<string, string | string[] | undefined>>>;
}>;

export default async function CareerPathsRoute({ searchParams }: CareerPathsRouteProps) {
  const params = await searchParams;
  const cardParam = params.card;
  const pathParam = params.path;
  const initialCardId = Array.isArray(cardParam) ? cardParam[0] : cardParam;
  const initialPathSlug = Array.isArray(pathParam) ? pathParam[0] : pathParam;
  const careerPathEntry = initialPathSlug
    ? getCareerPathSeoEntryBySlugOrLegacy(initialPathSlug)
    : (initialCardId ? getCareerPathSeoEntryByCardId(initialCardId) : undefined);

  permanentRedirect(careerPathEntry?.pageHref ?? "/");
}
