import { getDefaultRequestProfile, type ConversationDuration } from "@/features/v51/data/conversations";
import { RequestConversationPage } from "@/features/v51/conversations/pages/RequestConversationPage";

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
  const params = await searchParams;
  const profile = getDefaultRequestProfile(params.profileId);

  return <RequestConversationPage profile={profile} initialDuration={parseDuration(params.duration)} />;
}
