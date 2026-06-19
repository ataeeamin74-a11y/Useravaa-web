import { isApiResponse, parseJsonBody, requireAdminViewer } from "@/lib/backend/route-utils";
import { adminInsightModerationService, serviceResultToResponse } from "@/lib/backend/services";
import { adminInsightRestoreSchema } from "@/lib/backend/validation";

export const dynamic = "force-dynamic";

type AdminInsightRouteContext = {
  params: Promise<{ insightId: string }>;
};

export async function POST(request: Request, context: AdminInsightRouteContext) {
  const auth = await requireAdminViewer();

  if (isApiResponse(auth)) {
    return auth;
  }

  const payload = await parseJsonBody(request, adminInsightRestoreSchema);

  if (isApiResponse(payload)) {
    return payload;
  }

  const { insightId } = await context.params;
  return serviceResultToResponse(await adminInsightModerationService.restoreInsight(auth.viewer, insightId, payload));
}
