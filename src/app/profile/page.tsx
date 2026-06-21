import { UnauthorizedState } from "@/components/auth/UnauthorizedState";
import { PageContainer } from "@/components/layout/PageContainer";
import { ProfileDashboardPage } from "@/features/v51/my-profile/pages/ProfileDashboardPage";
import { canEditProfile, V51_PROFILE_FIXTURE_OWNER_ID } from "@/features/v51/permissions";
import { requireCurrentViewer } from "@/lib/auth/session";

type ProfileRouteProps = Readonly<{
  searchParams: Promise<{
    state?: string;
    activeQuestionAnswered?: string;
  }>;
}>;

export const dynamic = "force-dynamic";

export default async function ProfileRoute({ searchParams }: ProfileRouteProps) {
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
      <ProfileDashboardPage state={params.state} activeQuestionAnswered={params.activeQuestionAnswered !== "false"} />
    </PageContainer>
  );
}
