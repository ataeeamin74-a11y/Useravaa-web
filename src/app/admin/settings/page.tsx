import type { Metadata } from "next";
import { requireAdminPageAccess } from "@/features/v51/admin/access";
import { AdminAccessDenied, AdminPlaceholder } from "@/features/v51/admin/AdminSurfaces";
import { getPlaceholderData } from "@/features/v51/admin/data";

export const metadata: Metadata = {
  title: "تنظیمات ادمین | Useravaa"
};

export default async function AdminSettingsPage() {
  const viewer = await requireAdminPageAccess();

  if (!viewer) {
    return <AdminAccessDenied />;
  }

  return <AdminPlaceholder data={getPlaceholderData("settings")} />;
}
