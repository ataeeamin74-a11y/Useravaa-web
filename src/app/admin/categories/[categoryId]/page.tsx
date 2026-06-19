import type { Metadata } from "next";
import { requireAdminPageAccess } from "@/features/v51/admin/access";
import { AdminAccessDenied, AdminCategoryDetail } from "@/features/v51/admin/AdminSurfaces";
import { getAdminCategoryDetailRouteData } from "@/features/v51/admin/server-data";

export const metadata: Metadata = {
  title: "جزئیات دسته شغلی | Useravaa"
};

type AdminCategoryDetailPageProps = Readonly<{
  params: Promise<{ categoryId: string }>;
}>;

export default async function AdminCategoryDetailPage({ params }: AdminCategoryDetailPageProps) {
  const viewer = await requireAdminPageAccess();

  if (!viewer) {
    return <AdminAccessDenied />;
  }

  const { categoryId } = await params;
  const routeData = await getAdminCategoryDetailRouteData(viewer, categoryId);

  return <AdminCategoryDetail data={routeData} />;
}
