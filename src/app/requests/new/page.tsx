import { PageContainer } from "@/components/layout/PageContainer";
import { getDefaultRequestProfile, type ConversationDuration } from "@/features/v51/data/conversations";
import { RequestConversationPage } from "@/features/v51/conversations/pages/RequestConversationPage";
import { requireCurrentViewer } from "@/lib/auth/session";

type NewRequestRouteProps = Readonly<{
  searchParams: Promise<{
    profileId?: string;
    duration?: string;
  }>;
}>;

function parseDuration(duration?: string): ConversationDuration {
  return duration === "60" ? 60 : 30;
}

export default async function NewRequestRoute({ searchParams }: NewRequestRouteProps) {
  await requireCurrentViewer();
  const params = await searchParams;
  const profile = getDefaultRequestProfile(params.profileId);

  return (
    <PageContainer variant="flow">
      <RequestConversationPage profile={profile} initialDuration={parseDuration(params.duration)} />
    </PageContainer>
  );
}
