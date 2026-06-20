import { isApiResponse, parseJsonBody, requireAdminViewer } from "@/lib/backend/route-utils";
import { adminLeadService, serviceResultToResponse } from "@/lib/backend/services";
import { adminLeadUpdateSchema } from "@/lib/backend/validation";

export const dynamic = "force-dynamic";

type AdminLeadRouteContext = {
  params: Promise<{ leadId: string }>;
};

export async function GET(_request: Request, context: AdminLeadRouteContext) {
  const auth = await requireAdminViewer();

  if (isApiResponse(auth)) {
    return auth;
  }

  const { leadId } = await context.params;
  return serviceResultToResponse(await adminLeadService.getDetail(auth.viewer, leadId));
}

export async function PATCH(request: Request, context: AdminLeadRouteContext) {
  const auth = await requireAdminViewer();

  if (isApiResponse(auth)) {
    return auth;
  }

  const payload = await parseJsonBody(request, adminLeadUpdateSchema);

  if (isApiResponse(payload)) {
    return payload;
  }

  const { leadId } = await context.params;
  return serviceResultToResponse(await adminLeadService.update(auth.viewer, leadId, payload));
}
