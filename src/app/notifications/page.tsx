import { PageContainer } from "@/components/layout/PageContainer";
import { conversationNotifications } from "@/features/v51/data/conversations";
import { NotificationsPage as V51NotificationsPage } from "@/features/v51/notifications/NotificationsPage";
import { getNotificationsForViewer, V51_PROFILE_FIXTURE_OWNER_ID } from "@/features/v51/permissions";
import { requireCurrentViewer } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const viewer = await requireCurrentViewer();

  return (
    <PageContainer variant="dashboard">
      <V51NotificationsPage
        conversationItems={getNotificationsForViewer(viewer, conversationNotifications)}
        showWeeklyQuestion={viewer.id === V51_PROFILE_FIXTURE_OWNER_ID}
      />
    </PageContainer>
  );
}
