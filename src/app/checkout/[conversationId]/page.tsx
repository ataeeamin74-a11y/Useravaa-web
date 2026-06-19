import { notFound } from "next/navigation";
import { PageContainer } from "@/components/layout/PageContainer";
import { getConversationById } from "@/features/v51/data/conversations";
import { CheckoutPage } from "@/features/v51/conversations/pages/CheckoutPage";
import { alignConversationForViewer, canAccessCheckout } from "@/features/v51/permissions";
import { requireCurrentViewer } from "@/lib/auth/session";

type CheckoutRouteProps = Readonly<{
  params: Promise<{
    conversationId: string;
  }>;
}>;

export default async function CheckoutRoute({ params }: CheckoutRouteProps) {
  const viewer = await requireCurrentViewer();
  const { conversationId } = await params;
  const conversation = getConversationById(conversationId);

  if (!conversation || !canAccessCheckout(viewer, conversation)) {
    notFound();
  }

  return (
    <PageContainer variant="flow">
      <CheckoutPage initialConversation={alignConversationForViewer(viewer, conversation)} />
    </PageContainer>
  );
}
