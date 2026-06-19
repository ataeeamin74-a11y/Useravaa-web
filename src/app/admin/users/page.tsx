import type { Metadata } from "next";
import { requireAdminPageAccess } from "@/features/v51/admin/access";
import { AdminAccessDenied, AdminUsersList } from "@/features/v51/admin/AdminSurfaces";
import { getAdminUserRouteData } from "@/features/v51/admin/server-data";

export const metadata: Metadata = {
  title: "کاربران ادمین | Useravaa"
};

export default async function AdminUsersPage() {
  const viewer = await requireAdminPageAccess();

  if (!viewer) {
    return <AdminAccessDenied />;
  }

  const routeData = await getAdminUserRouteData(viewer);

  return <AdminUsersList items={routeData.items} sourceNote={routeData.sourceNote} />;
}
