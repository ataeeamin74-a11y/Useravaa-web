import type { Metadata } from "next";
import { requireAdminPageAccess } from "@/features/v51/admin/access";
import { AdminAccessDenied, AdminInsightsList } from "@/features/v51/admin/AdminSurfaces";
import { getAdminInsightRouteData } from "@/features/v51/admin/server-data";

export const metadata: Metadata = {
  title: "بینش‌های ادمین | Useravaa"
};

export default async function AdminInsightsPage() {
  const viewer = await requireAdminPageAccess();

  if (!viewer) {
    return <AdminAccessDenied />;
  }

  const routeData = await getAdminInsightRouteData(viewer);

  return <AdminInsightsList items={routeData.items} sourceNote={routeData.sourceNote} />;
}
