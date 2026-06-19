import { insightService, serviceResultToResponse } from "@/lib/backend/services";

export const dynamic = "force-dynamic";

type InsightRouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: Request, context: InsightRouteContext) {
  const { slug } = await context.params;
  return serviceResultToResponse(await insightService.getPublicInsight(slug));
}
