import type { Metadata } from "next";
import { requireAdminPageAccess } from "@/features/v51/admin/access";
import { AdminAccessDenied, AdminCancellationList } from "@/features/v51/admin/AdminSurfaces";
import { getAdminCancellationRouteData } from "@/features/v51/admin/server-data";

export const metadata: Metadata = {
  title: "لغوها | Useravaa"
};

export default async function AdminCancellationsPage() {
  const viewer = await requireAdminPageAccess();

  if (!viewer) {
    return <AdminAccessDenied />;
  }

  const routeData = await getAdminCancellationRouteData(viewer);

  return <AdminCancellationList items={routeData.items} sourceNote={routeData.sourceNote} />;
}
