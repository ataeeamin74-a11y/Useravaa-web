import { permanentRedirect } from "next/navigation";
import { getCareerPathSeoEntryBySlug } from "@/features/career/career-path-seo";

type CareerPathsRouteProps = Readonly<{
  searchParams: Promise<Readonly<Record<string, string | string[] | undefined>>>;
}>;

export default async function CareerPathsRoute({ searchParams }: CareerPathsRouteProps) {
  const params = await searchParams;
  const cardParam = params.card;
  const pathParam = params.path;
  const initialCardId = Array.isArray(cardParam) ? cardParam[0] : cardParam;
  const initialPathSlug = Array.isArray(pathParam) ? pathParam[0] : pathParam;
  const initialPathCardId = initialPathSlug
    ? getCareerPathSeoEntryBySlug(initialPathSlug)?.representativeCard.id
    : undefined;
  const resolvedCardId = initialCardId ?? initialPathCardId;

  // Preserve old shared detail links while making the root URL canonical.
  const rootDestination = resolvedCardId
    ? `/?card=${encodeURIComponent(resolvedCardId)}`
    : "/";

  permanentRedirect(rootDestination);
}
