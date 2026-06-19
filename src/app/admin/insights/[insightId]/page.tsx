import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdminPageAccess } from "@/features/v51/admin/access";
import { AdminAccessDenied, AdminInsightDetail } from "@/features/v51/admin/AdminSurfaces";
import { getAdminInsightDetailRouteData } from "@/features/v51/admin/server-data";

type AdminInsightDetailRouteProps = Readonly<{
  params: Promise<{
    insightId: string;
  }>;
}>;

export const metadata: Metadata = {
  title: "جزئیات بینش | Useravaa"
};

export default async function AdminInsightDetailPage({ params }: AdminInsightDetailRouteProps) {
  const viewer = await requireAdminPageAccess();

  if (!viewer) {
    return <AdminAccessDenied />;
  }

  const { insightId } = await params;
  const routeData = await getAdminInsightDetailRouteData(viewer, insightId);

  if (!routeData.item) {
    notFound();
  }

  return <AdminInsightDetail item={routeData.item} sourceNote={routeData.sourceNote} />;
}
