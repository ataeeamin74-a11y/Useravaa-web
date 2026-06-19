import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdminPageAccess } from "@/features/v51/admin/access";
import { AdminAccessDenied, AdminPaymentDetail } from "@/features/v51/admin/AdminSurfaces";
import { getAdminPaymentDetailRouteData } from "@/features/v51/admin/server-data";

type AdminPaymentDetailRouteProps = Readonly<{
  params: Promise<{
    paymentId: string;
  }>;
}>;

export const metadata: Metadata = {
  title: "جزئیات پرداخت | Useravaa"
};

export default async function AdminPaymentDetailPage({ params }: AdminPaymentDetailRouteProps) {
  const viewer = await requireAdminPageAccess();

  if (!viewer) {
    return <AdminAccessDenied />;
  }

  const { paymentId } = await params;
  const detailData = await getAdminPaymentDetailRouteData(viewer, paymentId);

  if (!detailData.item) {
    notFound();
  }

  return <AdminPaymentDetail item={detailData.item} sourceNote={detailData.sourceNote} />;
}
