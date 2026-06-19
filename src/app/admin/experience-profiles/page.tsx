import type { Metadata } from "next";
import { requireAdminPageAccess } from "@/features/v51/admin/access";
import { AdminAccessDenied, AdminExperienceProfilesList } from "@/features/v51/admin/AdminSurfaces";
import { getAdminExperienceProfileRouteData } from "@/features/v51/admin/server-data";

export const metadata: Metadata = {
  title: "پروفایل‌های تجربه‌آفرین | Useravaa"
};

export default async function AdminExperienceProfilesPage() {
  const viewer = await requireAdminPageAccess();

  if (!viewer) {
    return <AdminAccessDenied />;
  }

  const routeData = await getAdminExperienceProfileRouteData(viewer);

  return <AdminExperienceProfilesList items={routeData.items} sourceNote={routeData.sourceNote} />;
}
