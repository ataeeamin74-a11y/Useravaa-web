import type { Metadata } from "next";
import { requireAdminPageAccess } from "@/features/v51/admin/access";
import { AdminAccessDenied, AdminOpsAnalyticsDashboard } from "@/features/v51/admin/AdminSurfaces";
import { getAdminOpsAnalyticsRouteData, type AdminOpsAnalyticsSearchParams } from "@/features/v51/admin/server-data";

export const metadata: Metadata = {
  title: "هوش عملیاتی ادمین | Useravaa"
};

type AdminOpsAnalyticsPageProps = Readonly<{
  searchParams?: Promise<AdminOpsAnalyticsSearchParams>;
}>;

export default async function AdminOpsAnalyticsPage({ searchParams }: AdminOpsAnalyticsPageProps) {
  const viewer = await requireAdminPageAccess();

  if (!viewer) {
    return <AdminAccessDenied />;
  }

  const routeData = await getAdminOpsAnalyticsRouteData(viewer, await searchParams);

  return <AdminOpsAnalyticsDashboard data={routeData} />;
}
