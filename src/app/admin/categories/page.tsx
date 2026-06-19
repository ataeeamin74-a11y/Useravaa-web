import type { Metadata } from "next";
import { requireAdminPageAccess } from "@/features/v51/admin/access";
import { AdminAccessDenied, AdminCategories } from "@/features/v51/admin/AdminSurfaces";
import { getAdminCategoryRouteData } from "@/features/v51/admin/server-data";

export const metadata: Metadata = {
  title: "دسته‌بندی‌ها و موضوعات | Useravaa"
};

export default async function AdminCategoriesPage() {
  const viewer = await requireAdminPageAccess();

  if (!viewer) {
    return <AdminAccessDenied />;
  }

  const routeData = await getAdminCategoryRouteData(viewer);

  return <AdminCategories data={routeData} />;
}
