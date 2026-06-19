import type { Metadata } from "next";
import { requireAdminPageAccess } from "@/features/v51/admin/access";
import { AdminAccessDenied, AdminPricingRuleDetail } from "@/features/v51/admin/AdminSurfaces";
import { getAdminPricingDetailRouteData } from "@/features/v51/admin/server-data";

export const metadata: Metadata = {
  title: "جزئیات قانون قیمت‌گذاری | Useravaa"
};

type AdminPricingRuleDetailPageProps = Readonly<{
  params: Promise<{ ruleId: string }>;
}>;

export default async function AdminPricingRuleDetailPage({ params }: AdminPricingRuleDetailPageProps) {
  const viewer = await requireAdminPageAccess();

  if (!viewer) {
    return <AdminAccessDenied />;
  }

  const { ruleId } = await params;
  const routeData = await getAdminPricingDetailRouteData(viewer, ruleId);

  return <AdminPricingRuleDetail data={routeData} />;
}
