import type { Metadata } from "next";
import { requireAdminPageAccess } from "@/features/v51/admin/access";
import { AdminAccessDenied, AdminSupportDetail } from "@/features/v51/admin/AdminSurfaces";
import { getAdminSupportDetailRouteData } from "@/features/v51/admin/server-data";

export const metadata: Metadata = {
  title: "جزئیات تیکت پشتیبانی | Useravaa"
};

type AdminSupportDetailPageProps = Readonly<{
  params: Promise<{ ticketId: string }>;
}>;

export default async function AdminSupportDetailPage({ params }: AdminSupportDetailPageProps) {
  const viewer = await requireAdminPageAccess();

  if (!viewer) {
    return <AdminAccessDenied />;
  }

  const { ticketId } = await params;
  const routeData = await getAdminSupportDetailRouteData(viewer, ticketId);

  return <AdminSupportDetail data={routeData} />;
}
