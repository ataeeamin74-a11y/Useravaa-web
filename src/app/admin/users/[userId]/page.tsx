import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdminPageAccess } from "@/features/v51/admin/access";
import { AdminAccessDenied, AdminReadDetailView, AdminUserDetail } from "@/features/v51/admin/AdminSurfaces";
import { getAdminUserDetailRouteData } from "@/features/v51/admin/server-data";

type AdminUserDetailRouteProps = Readonly<{
  params: Promise<{
    userId: string;
  }>;
}>;

export const metadata: Metadata = {
  title: "جزئیات کاربر | Useravaa"
};

export default async function AdminUserDetailPage({ params }: AdminUserDetailRouteProps) {
  const viewer = await requireAdminPageAccess();

  if (!viewer) {
    return <AdminAccessDenied />;
  }

  const { userId } = await params;
  const routeData = await getAdminUserDetailRouteData(viewer, userId);

  if (routeData.detail) {
    return <AdminReadDetailView detail={routeData.detail} />;
  }

  if (!routeData.fallback) {
    notFound();
  }

  return <AdminUserDetail item={routeData.fallback} conversationsCount={routeData.fallback.conversationsCount} />;
}
