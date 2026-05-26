import { ProfileDashboardPage } from "@/features/v51/my-profile/pages/ProfileDashboardPage";

type ProfileRouteProps = Readonly<{
  searchParams: Promise<{
    state?: string;
    activeQuestionAnswered?: string;
  }>;
}>;

export default async function ProfileRoute({ searchParams }: ProfileRouteProps) {
  const params = await searchParams;

  return <ProfileDashboardPage state={params.state} activeQuestionAnswered={params.activeQuestionAnswered !== "false"} />;
}
