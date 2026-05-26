import { SavedPage } from "@/features/v51/saved/SavedPage";

type SavedRouteProps = Readonly<{
  searchParams: Promise<{
    tab?: string;
  }>;
}>;

export default async function SavedRoute({ searchParams }: SavedRouteProps) {
  const params = await searchParams;

  return <SavedPage initialTab={params.tab} />;
}
