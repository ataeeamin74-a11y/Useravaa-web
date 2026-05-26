import { normalizeNetworkTab } from "@/features/v51/data/my-profile";
import { ProfileNetworkPage } from "@/features/v51/my-profile/pages/ProfileNetworkPage";

type ProfileNetworkRouteProps = Readonly<{
  searchParams: Promise<{
    tab?: string;
  }>;
}>;

export default async function ProfileNetworkRoute({ searchParams }: ProfileNetworkRouteProps) {
  const params = await searchParams;

  return <ProfileNetworkPage initialTab={normalizeNetworkTab(params.tab)} />;
}
