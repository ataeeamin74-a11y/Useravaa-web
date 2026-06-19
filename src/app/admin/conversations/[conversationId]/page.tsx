import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdminPageAccess } from "@/features/v51/admin/access";
import { AdminAccessDenied, AdminConversationDetail, AdminReadDetailView } from "@/features/v51/admin/AdminSurfaces";
import { getAdminConversationDetailRouteData } from "@/features/v51/admin/server-data";

type AdminConversationDetailRouteProps = Readonly<{
  params: Promise<{
    conversationId: string;
  }>;
}>;

export const metadata: Metadata = {
  title: "جزئیات گفت‌وگو | Useravaa"
};

export default async function AdminConversationDetailPage({ params }: AdminConversationDetailRouteProps) {
  const viewer = await requireAdminPageAccess();

  if (!viewer) {
    return <AdminAccessDenied />;
  }

  const { conversationId } = await params;
  const routeData = await getAdminConversationDetailRouteData(viewer, conversationId);

  if (routeData.detail) {
    return <AdminReadDetailView detail={routeData.detail} />;
  }

  if (!routeData.fallback) {
    notFound();
  }

  return <AdminConversationDetail conversation={routeData.fallback} />;
}
