import type { Metadata } from "next";
import { requireAdminPageAccess } from "@/features/v51/admin/access";
import { AdminAccessDenied, AdminHome } from "@/features/v51/admin/AdminSurfaces";
import { getAdminHomeRouteData } from "@/features/v51/admin/server-data";

export const metadata: Metadata = {
  title: "صف اقدام ادمین | Useravaa"
};

export default async function AdminHomePage() {
  const viewer = await requireAdminPageAccess();

  if (!viewer) {
    return <AdminAccessDenied />;
  }

  const homeData = await getAdminHomeRouteData(viewer);

  return <AdminHome metrics={homeData.metrics} actionItems={homeData.actionItems} sourceNote={homeData.sourceNote} />;
}
