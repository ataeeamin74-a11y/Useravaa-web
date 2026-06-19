import type { Metadata } from "next";
import { requireAdminPageAccess } from "@/features/v51/admin/access";
import { AdminAccessDenied, AdminPricingRules } from "@/features/v51/admin/AdminSurfaces";
import { getAdminPricingRouteData } from "@/features/v51/admin/server-data";

export const metadata: Metadata = {
  title: "قواعد قیمت‌گذاری | Useravaa"
};

export default async function AdminPricingPage() {
  const viewer = await requireAdminPageAccess();

  if (!viewer) {
    return <AdminAccessDenied />;
  }

  const routeData = await getAdminPricingRouteData(viewer);

  return <AdminPricingRules data={routeData} />;
}
