import { isApiResponse, parseJsonBody, requireAdminViewer } from "@/lib/backend/route-utils";
import { adminInsightModerationService, serviceResultToResponse } from "@/lib/backend/services";
import { adminInsightAnswerHideSchema } from "@/lib/backend/validation";

export const dynamic = "force-dynamic";

type AdminInsightAnswerRouteContext = {
  params: Promise<{ answerId: string }>;
};

export async function POST(request: Request, context: AdminInsightAnswerRouteContext) {
  const auth = await requireAdminViewer();

  if (isApiResponse(auth)) {
    return auth;
  }

  const payload = await parseJsonBody(request, adminInsightAnswerHideSchema);

  if (isApiResponse(payload)) {
    return payload;
  }

  const { answerId } = await context.params;
  return serviceResultToResponse(await adminInsightModerationService.hideInsightAnswer(auth.viewer, answerId, payload));
}
