import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/PageContainer";
import { ActionsPage } from "@/features/v51/actions/pages/ActionsPage";
import { getVisibleConversationsForViewer } from "@/features/v51/permissions";
import { requireCurrentViewer } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "اقدام‌ها"
};

export const dynamic = "force-dynamic";

export default async function ActionsRoute() {
  const viewer = await requireCurrentViewer();

  return (
    <PageContainer variant="dashboard">
      <ActionsPage initialConversations={getVisibleConversationsForViewer(viewer)} />
    </PageContainer>
  );
}
