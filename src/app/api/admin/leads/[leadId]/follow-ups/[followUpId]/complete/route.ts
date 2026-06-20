import { isApiResponse, parseJsonBody, requireAdminViewer } from "@/lib/backend/route-utils";
import { adminLeadService, serviceResultToResponse } from "@/lib/backend/services";
import { adminLeadFollowUpCompleteSchema } from "@/lib/backend/validation";

export const dynamic = "force-dynamic";

type AdminLeadFollowUpCompleteRouteContext = {
  params: Promise<{ leadId: string; followUpId: string }>;
};

export async function POST(request: Request, context: AdminLeadFollowUpCompleteRouteContext) {
  const auth = await requireAdminViewer();

  if (isApiResponse(auth)) {
    return auth;
  }

  const payload = await parseJsonBody(request, adminLeadFollowUpCompleteSchema);

  if (isApiResponse(payload)) {
    return payload;
  }

  const { leadId, followUpId } = await context.params;
  return serviceResultToResponse(await adminLeadService.completeFollowUp(auth.viewer, leadId, followUpId, payload));
}
