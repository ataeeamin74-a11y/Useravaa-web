import { getConversationOrFallback } from "@/features/v51/data/conversations";
import { ConversationDetailPage } from "@/features/v51/conversations/pages/ConversationDetailPage";

type ConversationDetailRouteProps = Readonly<{
  params: Promise<{
    conversationId: string;
  }>;
}>;

export default async function ConversationDetailRoute({ params }: ConversationDetailRouteProps) {
  const { conversationId } = await params;

  return <ConversationDetailPage initialConversation={getConversationOrFallback(conversationId)} />;
}
