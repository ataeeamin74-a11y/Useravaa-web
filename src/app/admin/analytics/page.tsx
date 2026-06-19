import type { Metadata } from "next";
import { requireAdminPageAccess } from "@/features/v51/admin/access";
import { AdminAccessDenied, AdminAnalyticsSummary } from "@/features/v51/admin/AdminSurfaces";
import { getAdminAnalyticsRouteData, type AdminAnalyticsSearchParams } from "@/features/v51/admin/server-data";

export const metadata: Metadata = {
  title: "داشبورد ادمین | Useravaa"
};

type AdminAnalyticsPageProps = Readonly<{
  searchParams?: Promise<AdminAnalyticsSearchParams>;
}>;

export default async function AdminAnalyticsPage({ searchParams }: AdminAnalyticsPageProps) {
  const viewer = await requireAdminPageAccess();

  if (!viewer) {
    return <AdminAccessDenied />;
  }

  const routeData = await getAdminAnalyticsRouteData(viewer, await searchParams);

  return <AdminAnalyticsSummary data={routeData} />;
}
