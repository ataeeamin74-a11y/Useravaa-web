import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdminPageAccess } from "@/features/v51/admin/access";
import {
  AdminAccessDenied,
  AdminExperienceProfileDetail,
  AdminExperienceProfileReviewDetail,
  AdminReadDetailView
} from "@/features/v51/admin/AdminSurfaces";
import { getAdminExperienceProfileDetailRouteData } from "@/features/v51/admin/server-data";

type AdminExperienceProfileDetailRouteProps = Readonly<{
  params: Promise<{
    profileId: string;
  }>;
}>;

export const metadata: Metadata = {
  title: "جزئیات پروفایل تجربه‌آفرین | Useravaa"
};

export default async function AdminExperienceProfileDetailPage({ params }: AdminExperienceProfileDetailRouteProps) {
  const viewer = await requireAdminPageAccess();

  if (!viewer) {
    return <AdminAccessDenied />;
  }

  const { profileId } = await params;
  const routeData = await getAdminExperienceProfileDetailRouteData(viewer, profileId);

  if (routeData.item) {
    return <AdminExperienceProfileReviewDetail item={routeData.item} sourceNote={routeData.sourceNote} />;
  }

  if (routeData.detail) {
    return <AdminReadDetailView detail={routeData.detail} />;
  }

  if (!routeData.fallback) {
    notFound();
  }

  return <AdminExperienceProfileDetail item={routeData.fallback.item} profile={routeData.fallback.profile} />;
}
