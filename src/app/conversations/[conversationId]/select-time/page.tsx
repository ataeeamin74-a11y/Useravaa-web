import { getConversationOrFallback } from "@/features/v51/data/conversations";
import { SelectTimePage } from "@/features/v51/conversations/pages/SelectTimePage";

type SelectTimeRouteProps = Readonly<{
  params: Promise<{
    conversationId: string;
  }>;
}>;

export default async function SelectTimeRoute({ params }: SelectTimeRouteProps) {
  const { conversationId } = await params;

  return <SelectTimePage initialConversation={getConversationOrFallback(conversationId, "conv-time-options")} />;
}
