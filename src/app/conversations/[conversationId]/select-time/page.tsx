import { notFound, redirect } from "next/navigation";
import { PageContainer } from "@/components/layout/PageContainer";
import { getConversationById, getConversationRouteAccess } from "@/features/v51/data/conversations";
import { SelectTimePage } from "@/features/v51/conversations/pages/SelectTimePage";
import { alignConversationForViewer, canSelectTime, canViewConversation } from "@/features/v51/permissions";
import { requireCurrentViewer } from "@/lib/auth/session";

type SelectTimeRouteProps = Readonly<{
  params: Promise<{
    conversationId: string;
  }>;
}>;

export default async function SelectTimeRoute({ params }: SelectTimeRouteProps) {
  const viewer = await requireCurrentViewer();
  const { conversationId } = await params;
  const conversation = getConversationById(conversationId);

  if (!conversation || !canViewConversation(viewer, conversation)) {
    notFound();
  }

  const viewerConversation = alignConversationForViewer(viewer, conversation);
  const access = getConversationRouteAccess(viewerConversation, "selectTime");

  if (!access.allowed && access.disabledReason === "SESSION_ALREADY_CONFIRMED") {
    redirect(access.fallbackHref);
  }

  if (!canSelectTime(viewer, conversation)) {
    notFound();
  }

  return (
    <PageContainer variant="flow">
      <SelectTimePage initialConversation={viewerConversation} />
    </PageContainer>
  );
}
