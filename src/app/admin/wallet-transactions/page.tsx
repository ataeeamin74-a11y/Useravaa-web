import type { Metadata } from "next";
import { requireAdminPageAccess } from "@/features/v51/admin/access";
import { AdminAccessDenied, AdminWalletLedger } from "@/features/v51/admin/AdminSurfaces";
import { getAdminWalletTransactionRouteData } from "@/features/v51/admin/server-data";

export const metadata: Metadata = {
  title: "دفتر تراکنش کیف پول | Useravaa"
};

export default async function AdminWalletTransactionsPage() {
  const viewer = await requireAdminPageAccess();

  if (!viewer) {
    return <AdminAccessDenied />;
  }

  const routeData = await getAdminWalletTransactionRouteData(viewer);

  return <AdminWalletLedger items={routeData.items} sourceNote={routeData.sourceNote} />;
}
