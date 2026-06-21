import { PageContainer } from "@/components/layout/PageContainer";
import { ConversationsPage } from "@/features/v51/conversations/pages/ConversationsPage";
import { getVisibleConversationsForViewer } from "@/features/v51/permissions";
import { requireCurrentViewer } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function RequestsRoute() {
  const viewer = await requireCurrentViewer();

  return (
    <PageContainer variant="dashboard">
      <ConversationsPage
        initialConversations={getVisibleConversationsForViewer(viewer)}
        initialTab="incoming"
        title="درخواست‌ها"
        lead="درخواست‌های جلسه مشاوره، وضعیت پاسخ و اقدام‌های لازم را اینجا پیگیری کن."
      />
    </PageContainer>
  );
}
