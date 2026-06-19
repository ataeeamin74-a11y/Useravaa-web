import type { Metadata } from "next";
import { requireAdminPageAccess } from "@/features/v51/admin/access";
import { AdminAccessDenied, AdminConversationList } from "@/features/v51/admin/AdminSurfaces";
import { getAdminConversationRouteData } from "@/features/v51/admin/server-data";

export const metadata: Metadata = {
  title: "گفت‌وگوهای ادمین | Useravaa"
};

export default async function AdminConversationsPage() {
  const viewer = await requireAdminPageAccess();

  if (!viewer) {
    return <AdminAccessDenied />;
  }

  const routeData = await getAdminConversationRouteData(viewer);

  return <AdminConversationList items={routeData.items} sourceNote={routeData.sourceNote} />;
}
