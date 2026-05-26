import { getConversationOrFallback } from "@/features/v51/data/conversations";
import { CheckoutPage } from "@/features/v51/conversations/pages/CheckoutPage";

type CheckoutRouteProps = Readonly<{
  params: Promise<{
    conversationId: string;
  }>;
}>;

export default async function CheckoutRoute({ params }: CheckoutRouteProps) {
  const { conversationId } = await params;

  return <CheckoutPage initialConversation={getConversationOrFallback(conversationId, "conv-awaiting-payment")} />;
}
