import { PageContainer } from "@/components/layout/PageContainer";
import { ConversationsPage } from "@/features/v51/conversations/pages/ConversationsPage";
import { getVisibleConversationsForViewer } from "@/features/v51/permissions";
import { requireCurrentViewer } from "@/lib/auth/session";

export default async function SessionsRoute() {
  const viewer = await requireCurrentViewer();

  return (
    <PageContainer variant="dashboard">
      <ConversationsPage
        initialConversations={getVisibleConversationsForViewer(viewer)}
        initialTab="outgoing"
        title="جلسه‌ها"
        lead="درخواست‌ها و جلسه‌های خود را پیگیری کنید."
      />
    </PageContainer>
  );
}
