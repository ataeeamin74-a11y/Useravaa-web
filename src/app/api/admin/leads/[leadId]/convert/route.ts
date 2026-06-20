import { isApiResponse, parseJsonBody, requireAdminViewer } from "@/lib/backend/route-utils";
import { adminLeadService, serviceResultToResponse } from "@/lib/backend/services";
import { adminLeadConvertSchema } from "@/lib/backend/validation";

export const dynamic = "force-dynamic";

type AdminLeadConvertRouteContext = {
  params: Promise<{ leadId: string }>;
};

export async function POST(request: Request, context: AdminLeadConvertRouteContext) {
  const auth = await requireAdminViewer();

  if (isApiResponse(auth)) {
    return auth;
  }

  const payload = await parseJsonBody(request, adminLeadConvertSchema);

  if (isApiResponse(payload)) {
    return payload;
  }

  const { leadId } = await context.params;
  return serviceResultToResponse(await adminLeadService.convert(auth.viewer, leadId, payload));
}
