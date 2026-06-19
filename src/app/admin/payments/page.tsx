import type { Metadata } from "next";
import { requireAdminPageAccess } from "@/features/v51/admin/access";
import { AdminAccessDenied, AdminPaymentsList } from "@/features/v51/admin/AdminSurfaces";
import { getAdminPaymentRouteData } from "@/features/v51/admin/server-data";

export const metadata: Metadata = {
  title: "بررسی پرداخت‌ها | Useravaa"
};

export default async function AdminPaymentsPage() {
  const viewer = await requireAdminPageAccess();

  if (!viewer) {
    return <AdminAccessDenied />;
  }

  const paymentData = await getAdminPaymentRouteData(viewer);

  return <AdminPaymentsList items={paymentData.items} sourceNote={paymentData.sourceNote} />;
}
