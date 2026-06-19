import { UnauthorizedState } from "@/components/auth/UnauthorizedState";
import { PageContainer } from "@/components/layout/PageContainer";
import { normalizeNetworkTab } from "@/features/v51/data/my-profile";
import { ProfileNetworkPage } from "@/features/v51/my-profile/pages/ProfileNetworkPage";
import { canEditProfile, V51_PROFILE_FIXTURE_OWNER_ID } from "@/features/v51/permissions";
import { requireCurrentViewer } from "@/lib/auth/session";

type ProfileNetworkRouteProps = Readonly<{
  searchParams: Promise<{
    tab?: string;
  }>;
}>;

export default async function ProfileNetworkRoute({ searchParams }: ProfileNetworkRouteProps) {
  const viewer = await requireCurrentViewer();
  const params = await searchParams;

  if (!canEditProfile(viewer, V51_PROFILE_FIXTURE_OWNER_ID)) {
    return (
      <PageContainer variant="empty">
        <UnauthorizedState />
      </PageContainer>
    );
  }

  return (
    <PageContainer variant="dashboard">
      <ProfileNetworkPage initialTab={normalizeNetworkTab(params.tab)} />
    </PageContainer>
  );
}
