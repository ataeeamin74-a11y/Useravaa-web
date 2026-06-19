import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdminPageAccess } from "@/features/v51/admin/access";
import { AdminAccessDenied, AdminCancellationDetail } from "@/features/v51/admin/AdminSurfaces";
import { getAdminCancellationDetailRouteData } from "@/features/v51/admin/server-data";

type AdminCancellationDetailRouteProps = Readonly<{
  params: Promise<{
    cancellationId: string;
  }>;
}>;

export const metadata: Metadata = {
  title: "جزئیات لغو | Useravaa"
};

export default async function AdminCancellationDetailPage({ params }: AdminCancellationDetailRouteProps) {
  const viewer = await requireAdminPageAccess();

  if (!viewer) {
    return <AdminAccessDenied />;
  }

  const { cancellationId } = await params;
  const routeData = await getAdminCancellationDetailRouteData(viewer, cancellationId);

  if (routeData.item) {
    return <AdminCancellationDetail item={routeData.item} sourceNote={routeData.sourceNote} />;
  }

  if (!routeData.fallback) {
    notFound();
  }

  return <AdminCancellationDetail item={routeData.fallback} sourceNote={routeData.sourceNote} />;
}
