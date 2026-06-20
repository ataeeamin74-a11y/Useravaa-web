import type { Metadata } from "next";
import { requireAdminPageAccess } from "@/features/v51/admin/access";
import { AdminAccessDenied, AdminLeadDetail } from "@/features/v51/admin/AdminSurfaces";
import { getAdminLeadDetailRouteData } from "@/features/v51/admin/server-data";

export const metadata: Metadata = {
  title: "جزئیات سرنخ | Useravaa"
};

type AdminLeadDetailPageProps = Readonly<{
  params: Promise<{ leadId: string }>;
}>;

export default async function AdminLeadDetailPage({ params }: AdminLeadDetailPageProps) {
  const viewer = await requireAdminPageAccess();

  if (!viewer) {
    return <AdminAccessDenied />;
  }

  const { leadId } = await params;
  const routeData = await getAdminLeadDetailRouteData(viewer, leadId);

  return <AdminLeadDetail data={routeData} />;
}
