import { notFound } from "next/navigation";
import { PageContainer } from "@/components/layout/PageContainer";
import { getProfileById } from "@/features/v51/data/profiles";
import { ProfileDetailPage } from "@/features/v51/profile/ProfileDetailPage";

type ProfileDetailRouteProps = Readonly<{
  params: Promise<{
    profileId: string;
  }>;
}>;

export default async function ProfileDetailRoute({ params }: ProfileDetailRouteProps) {
  const { profileId } = await params;
  const profile = getProfileById(profileId);

  if (!profile) {
    notFound();
  }

  return (
    <PageContainer variant="flow">
      <ProfileDetailPage profile={profile} />
    </PageContainer>
  );
}
