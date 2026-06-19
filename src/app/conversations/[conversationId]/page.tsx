import { notFound } from "next/navigation";
import { PageContainer } from "@/components/layout/PageContainer";
import { ConversationDetailPage } from "@/features/v51/conversations/pages/ConversationDetailPage";
import { getAuthorizedConversationForViewer } from "@/features/v51/permissions";
import { requireCurrentViewer } from "@/lib/auth/session";

type ConversationDetailRouteProps = Readonly<{
  params: Promise<{
    conversationId: string;
  }>;
}>;

export default async function ConversationDetailRoute({ params }: ConversationDetailRouteProps) {
  const viewer = await requireCurrentViewer();
  const { conversationId } = await params;
  const conversation = getAuthorizedConversationForViewer(viewer, conversationId);

  if (!conversation) {
    notFound();
  }

  return (
    <PageContainer variant="flow">
      <ConversationDetailPage initialConversation={conversation} />
    </PageContainer>
  );
}
