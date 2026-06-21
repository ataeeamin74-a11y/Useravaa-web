import { UnauthorizedState } from "@/components/auth/UnauthorizedState";
import { PageContainer } from "@/components/layout/PageContainer";
import { ProfileSettingsPage as ProfileSettingsSurface } from "@/features/v51/my-profile/pages/ProfileSettingsPage";
import { canEditProfile, V51_PROFILE_FIXTURE_OWNER_ID } from "@/features/v51/permissions";
import { requireCurrentViewer } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function ProfileSettingsRoute() {
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
      <ProfileSettingsSurface />
    </PageContainer>
  );
}
