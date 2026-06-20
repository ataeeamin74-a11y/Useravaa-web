import type { Metadata } from "next";
import { requireAdminPageAccess } from "@/features/v51/admin/access";
import { AdminAccessDenied, AdminLeadInbox } from "@/features/v51/admin/AdminSurfaces";
import { getAdminLeadRouteData, type AdminLeadSearchParams } from "@/features/v51/admin/server-data";

export const metadata: Metadata = {
  title: "صندوق سرنخ‌ها | Useravaa"
};

type AdminLeadPageProps = Readonly<{
  searchParams?: Promise<AdminLeadSearchParams>;
}>;

export default async function AdminLeadPage({ searchParams }: AdminLeadPageProps) {
  const viewer = await requireAdminPageAccess();

  if (!viewer) {
    return <AdminAccessDenied />;
  }

  const routeData = await getAdminLeadRouteData(viewer, await searchParams);

  return <AdminLeadInbox data={routeData} />;
}
