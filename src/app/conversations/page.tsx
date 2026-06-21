import { PageContainer } from "@/components/layout/PageContainer";
import { ConversationsPage } from "@/features/v51/conversations/pages/ConversationsPage";
import { getVisibleConversationsForViewer } from "@/features/v51/permissions";
import { requireCurrentViewer } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function ConversationsRoute() {
  const viewer = await requireCurrentViewer();

  return (
    <PageContainer variant="dashboard">
      <ConversationsPage initialConversations={getVisibleConversationsForViewer(viewer)} />
    </PageContainer>
  );
}
