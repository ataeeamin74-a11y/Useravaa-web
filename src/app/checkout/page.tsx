import { notFound } from "next/navigation";
import { PageContainer } from "@/components/layout/PageContainer";
import { CheckoutPage } from "@/features/v51/conversations/pages/CheckoutPage";
import { getConversationById } from "@/features/v51/data/conversations";
import { alignConversationForViewer, canAccessCheckout } from "@/features/v51/permissions";
import { requireCurrentViewer } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function CheckoutIndexRoute() {
  const viewer = await requireCurrentViewer();
  const conversation = getConversationById("conv-awaiting-payment");

  if (!conversation || !canAccessCheckout(viewer, conversation)) {
    notFound();
  }

  return (
    <PageContainer variant="flow">
      <CheckoutPage initialConversation={alignConversationForViewer(viewer, conversation)} />
    </PageContainer>
  );
}
