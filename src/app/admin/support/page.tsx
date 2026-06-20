import type { Metadata } from "next";
import { requireAdminPageAccess } from "@/features/v51/admin/access";
import { AdminAccessDenied, AdminSupportInbox } from "@/features/v51/admin/AdminSurfaces";
import { getAdminSupportRouteData, type AdminSupportSearchParams } from "@/features/v51/admin/server-data";

export const metadata: Metadata = {
  title: "پشتیبانی ادمین | Useravaa"
};

type AdminSupportPageProps = Readonly<{
  searchParams?: Promise<AdminSupportSearchParams>;
}>;

export default async function AdminSupportPage({ searchParams }: AdminSupportPageProps) {
  const viewer = await requireAdminPageAccess();

  if (!viewer) {
    return <AdminAccessDenied />;
  }

  const routeData = await getAdminSupportRouteData(viewer, await searchParams);

  return <AdminSupportInbox data={routeData} />;
}
