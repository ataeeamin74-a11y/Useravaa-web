import { DiscoverPage } from "@/features/v51/discover/DiscoverPage";
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

  return <DiscoverPage initialState={parseDiscoveryState(params.state)} />;
}
