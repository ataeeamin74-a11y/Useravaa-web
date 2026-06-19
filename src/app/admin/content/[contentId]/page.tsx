import type { Metadata } from "next";
import { requireAdminPageAccess } from "@/features/v51/admin/access";
import { AdminAccessDenied, AdminContentDetail } from "@/features/v51/admin/AdminSurfaces";
import { getAdminContentDetailRouteData } from "@/features/v51/admin/server-data";

export const metadata: Metadata = {
  title: "جزئیات محتوای مدیریت‌شده | Useravaa"
};

type AdminContentDetailPageProps = Readonly<{
  params: Promise<{ contentId: string }>;
}>;

export default async function AdminContentDetailPage({ params }: AdminContentDetailPageProps) {
  const viewer = await requireAdminPageAccess();

  if (!viewer) {
    return <AdminAccessDenied />;
  }

  const { contentId } = await params;
  const routeData = await getAdminContentDetailRouteData(viewer, contentId);

  return <AdminContentDetail data={routeData} />;
}
