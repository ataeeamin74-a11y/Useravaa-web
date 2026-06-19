import { UnauthorizedState } from "@/components/auth/UnauthorizedState";
import { PageContainer } from "@/components/layout/PageContainer";
import { ProfileFeedbackPage as ProfileFeedbackSurface } from "@/features/v51/my-profile/pages/ProfileFeedbackPage";
import { canEditProfile, V51_PROFILE_FIXTURE_OWNER_ID } from "@/features/v51/permissions";
import { requireCurrentViewer } from "@/lib/auth/session";

export default async function ProfileFeedbackRoute() {
  const viewer = await requireCurrentViewer();

  if (!canEditProfile(viewer, V51_PROFILE_FIXTURE_OWNER_ID)) {
    return (
      <PageContainer variant="empty">
        <UnauthorizedState />
      </PageContainer>
    );
  }

  return (
    <PageContainer variant="dashboard">
      <ProfileFeedbackSurface />
    </PageContainer>
  );
}
