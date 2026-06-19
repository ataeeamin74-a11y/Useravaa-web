import { PageContainer } from "@/components/layout/PageContainer";
import { DiscoverPage } from "@/features/v51/discover/DiscoverPage";
import { getPublicJobFieldOptionsForUseCase } from "@/features/v51/data/public-category-options";
import type { DiscoveryState } from "@/features/v51/data/profiles";

type DiscoverRouteProps = Readonly<{
  searchParams: Promise<{
    state?: string;
  }>;
}>;

function parseDiscoveryState(state: string | undefined): DiscoveryState {
  return state === "loading" || state === "error" ? state : "ready";
}

export default async function DiscoverRoute({ searchParams }: DiscoverRouteProps) {
  const params = await searchParams;
  const jobCategoryOptions = await getPublicJobFieldOptionsForUseCase("discovery");

  return (
    <PageContainer variant="marketplace">
      <DiscoverPage initialState={parseDiscoveryState(params.state)} jobCategoryOptions={jobCategoryOptions.options} />
    </PageContainer>
  );
}
