import { isApiResponse, parseJsonBody, requireAdminViewer } from "@/lib/backend/route-utils";
import { adminLeadService, serviceResultToResponse } from "@/lib/backend/services";
import { adminLeadAssignSchema } from "@/lib/backend/validation";

export const dynamic = "force-dynamic";

type AdminLeadAssignRouteContext = {
  params: Promise<{ leadId: string }>;
};

export async function POST(request: Request, context: AdminLeadAssignRouteContext) {
  const auth = await requireAdminViewer();

  if (isApiResponse(auth)) {
    return auth;
  }

  const payload = await parseJsonBody(request, adminLeadAssignSchema);

  if (isApiResponse(payload)) {
    return payload;
  }

  const { leadId } = await context.params;
  return serviceResultToResponse(await adminLeadService.assign(auth.viewer, leadId, payload));
}
