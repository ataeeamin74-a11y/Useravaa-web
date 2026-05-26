import { getConversationOrFallback } from "@/features/v51/data/conversations";
import { ProposeTimesPage } from "@/features/v51/conversations/pages/ProposeTimesPage";

type ProposeTimesRouteProps = Readonly<{
  params: Promise<{
    conversationId: string;
  }>;
}>;

export default async function ProposeTimesRoute({ params }: ProposeTimesRouteProps) {
  const { conversationId } = await params;

  return <ProposeTimesPage initialConversation={getConversationOrFallback(conversationId, "conv-provider-request")} />;
}
