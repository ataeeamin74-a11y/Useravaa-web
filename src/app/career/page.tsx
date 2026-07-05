import { redirect } from "next/navigation";

type CareerPathsRouteProps = Readonly<{
  searchParams: Promise<Readonly<Record<string, string | string[] | undefined>>>;
}>;

export default async function CareerPathsRoute({ searchParams }: CareerPathsRouteProps) {
  const cardParam = (await searchParams).card;
  const initialCardId = Array.isArray(cardParam) ? cardParam[0] : cardParam;

  // Preserve old shared detail links while making the root URL canonical.
  const rootDestination = initialCardId
    ? `/?card=${encodeURIComponent(initialCardId)}`
    : "/";

  redirect(rootDestination);
}
