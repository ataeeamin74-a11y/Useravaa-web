import { isApiResponse, parseJsonBody, requireAdminViewer } from "@/lib/backend/route-utils";
import { adminLeadService, serviceResultToResponse } from "@/lib/backend/services";
import { adminLeadLostSchema } from "@/lib/backend/validation";

export const dynamic = "force-dynamic";

type AdminLeadLostRouteContext = {
  params: Promise<{ leadId: string }>;
};

export async function POST(request: Request, context: AdminLeadLostRouteContext) {
  const auth = await requireAdminViewer();

  if (isApiResponse(auth)) {
    return auth;
  }

  const payload = await parseJsonBody(request, adminLeadLostSchema);

  if (isApiResponse(payload)) {
    return payload;
  }

  const { leadId } = await context.params;
  return serviceResultToResponse(await adminLeadService.markLost(auth.viewer, leadId, payload));
}
