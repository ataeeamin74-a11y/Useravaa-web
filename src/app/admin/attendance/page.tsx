import type { Metadata } from "next";
import { requireAdminPageAccess } from "@/features/v51/admin/access";
import { AdminAccessDenied, AdminAttendanceList } from "@/features/v51/admin/AdminSurfaces";
import { getAdminAttendanceRouteData } from "@/features/v51/admin/server-data";

export const metadata: Metadata = {
  title: "حضور جلسه | Useravaa"
};

export default async function AdminAttendancePage() {
  const viewer = await requireAdminPageAccess();

  if (!viewer) {
    return <AdminAccessDenied />;
  }

  const routeData = await getAdminAttendanceRouteData(viewer);

  return <AdminAttendanceList items={routeData.items} sourceNote={routeData.sourceNote} />;
}
