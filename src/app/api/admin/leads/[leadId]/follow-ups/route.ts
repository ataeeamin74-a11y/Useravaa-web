import { isApiResponse, parseJsonBody, requireAdminViewer } from "@/lib/backend/route-utils";
import { adminLeadService, serviceResultToResponse } from "@/lib/backend/services";
import { adminLeadFollowUpScheduleSchema } from "@/lib/backend/validation";

export const dynamic = "force-dynamic";

type AdminLeadFollowUpRouteContext = {
  params: Promise<{ leadId: string }>;
};

export async function POST(request: Request, context: AdminLeadFollowUpRouteContext) {
  const auth = await requireAdminViewer();

  if (isApiResponse(auth)) {
    return auth;
  }

  const payload = await parseJsonBody(request, adminLeadFollowUpScheduleSchema);

  if (isApiResponse(payload)) {
    return payload;
  }

  const { leadId } = await context.params;
  return serviceResultToResponse(await adminLeadService.scheduleFollowUp(auth.viewer, leadId, payload));
}
