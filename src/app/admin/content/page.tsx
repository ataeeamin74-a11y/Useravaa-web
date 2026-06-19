import type { Metadata } from "next";
import { requireAdminPageAccess } from "@/features/v51/admin/access";
import { AdminAccessDenied, AdminContentManagement } from "@/features/v51/admin/AdminSurfaces";
import { getAdminContentRouteData, type AdminContentSearchParams } from "@/features/v51/admin/server-data";

export const metadata: Metadata = {
  title: "مدیریت محتوا | Useravaa"
};

type AdminContentPageProps = Readonly<{
  searchParams?: Promise<AdminContentSearchParams>;
}>;

export default async function AdminContentPage({ searchParams }: AdminContentPageProps) {
  const viewer = await requireAdminPageAccess();

  if (!viewer) {
    return <AdminAccessDenied />;
  }

  const routeData = await getAdminContentRouteData(viewer, await searchParams);

  return <AdminContentManagement data={routeData} />;
}
