import type { Metadata } from "next";
import { requireAdminPageAccess } from "@/features/v51/admin/access";
import { AdminAccessDenied, AdminAuditLog } from "@/features/v51/admin/AdminSurfaces";
import { getAdminAuditLogRouteData } from "@/features/v51/admin/server-data";

export const metadata: Metadata = {
  title: "گزارش ممیزی | Useravaa"
};

export default async function AdminAuditLogPage() {
  const viewer = await requireAdminPageAccess();

  if (!viewer) {
    return <AdminAccessDenied />;
  }

  const routeData = await getAdminAuditLogRouteData(viewer);

  return <AdminAuditLog data={routeData} />;
}
