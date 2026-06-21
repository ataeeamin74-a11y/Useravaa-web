import { UnauthorizedState } from "@/components/auth/UnauthorizedState";
import { PageContainer } from "@/components/layout/PageContainer";
import { getPublicJobFieldOptionsForUseCase } from "@/features/v51/data/public-category-options";
import { ProfileBuilderPage } from "@/features/v51/my-profile/pages/ProfileBuilderPage";
import { canEditProfile, V51_PROFILE_FIXTURE_OWNER_ID } from "@/features/v51/permissions";
import { requireCurrentViewer } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function ProfileBuildRoute() {
  const viewer = await requireCurrentViewer();

  if (!canEditProfile(viewer, V51_PROFILE_FIXTURE_OWNER_ID)) {
    return (
      <PageContainer variant="empty">
        <UnauthorizedState />
      </PageContainer>
    );
  }

  const jobFieldOptions = await getPublicJobFieldOptionsForUseCase("profile");

  return (
    <PageContainer variant="dashboard">
      <ProfileBuilderPage jobFieldOptions={jobFieldOptions.options} />
    </PageContainer>
  );
}
