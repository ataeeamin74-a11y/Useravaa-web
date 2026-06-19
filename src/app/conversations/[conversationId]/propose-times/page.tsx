import { notFound, redirect } from "next/navigation";
import { PageContainer } from "@/components/layout/PageContainer";
import { getConversationById, getConversationRouteAccess } from "@/features/v51/data/conversations";
import { ProposeTimesPage } from "@/features/v51/conversations/pages/ProposeTimesPage";
import { alignConversationForViewer, canProposeTimes, canViewConversation } from "@/features/v51/permissions";
import { requireCurrentViewer } from "@/lib/auth/session";

type ProposeTimesRouteProps = Readonly<{
  params: Promise<{
    conversationId: string;
  }>;
}>;

export default async function ProposeTimesRoute({ params }: ProposeTimesRouteProps) {
  const viewer = await requireCurrentViewer();
  const { conversationId } = await params;
  const conversation = getConversationById(conversationId);

  if (!conversation || !canViewConversation(viewer, conversation)) {
    notFound();
  }

  const viewerConversation = alignConversationForViewer(viewer, conversation);
  const access = getConversationRouteAccess(viewerConversation, "proposeTimes");

  if (!access.allowed && access.disabledReason === "SESSION_ALREADY_CONFIRMED") {
    redirect(access.fallbackHref);
  }

  if (!canProposeTimes(viewer, conversation)) {
    notFound();
  }

  return (
    <PageContainer variant="flow">
      <ProposeTimesPage initialConversation={viewerConversation} />
    </PageContainer>
  );
}
