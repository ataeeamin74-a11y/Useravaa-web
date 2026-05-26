import { CheckoutPage } from "@/features/v51/conversations/pages/CheckoutPage";
import { getConversationOrFallback } from "@/features/v51/data/conversations";

export default function CheckoutIndexRoute() {
  return <CheckoutPage initialConversation={getConversationOrFallback("conv-awaiting-payment", "conv-awaiting-payment")} />;
}
