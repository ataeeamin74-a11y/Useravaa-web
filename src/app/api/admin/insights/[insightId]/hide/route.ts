import { isApiResponse, parseJsonBody, requireAdminViewer } from "@/lib/backend/route-utils";
import { adminInsightModerationService, serviceResultToResponse } from "@/lib/backend/services";
import { adminInsightHideSchema } from "@/lib/backend/validation";

export const dynamic = "force-dynamic";

type AdminInsightRouteContext = {
  params: Promise<{ insightId: string }>;
};

export async function POST(request: Request, context: AdminInsightRouteContext) {
  const auth = await requireAdminViewer();

  if (isApiResponse(auth)) {
    return auth;
  }

  const payload = await parseJsonBody(request, adminInsightHideSchema);

  if (isApiResponse(payload)) {
    return payload;
  }

  const { insightId } = await context.params;
  return serviceResultToResponse(await adminInsightModerationService.hideInsight(auth.viewer, insightId, payload));
}
