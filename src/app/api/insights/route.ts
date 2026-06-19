import { insightService, serviceResultToResponse } from "@/lib/backend/services";

export const dynamic = "force-dynamic";

export async function GET() {
  return serviceResultToResponse(await insightService.listPublicInsights());
}
