import { isApiResponse, parseJsonBody, requireAdminViewer } from "@/lib/backend/route-utils";
import { adminLeadService, serviceResultToResponse } from "@/lib/backend/services";
import { adminLeadTagAddSchema } from "@/lib/backend/validation";

export const dynamic = "force-dynamic";

type AdminLeadTagRouteContext = {
  params: Promise<{ leadId: string }>;
};

export async function POST(request: Request, context: AdminLeadTagRouteContext) {
  const auth = await requireAdminViewer();

  if (isApiResponse(auth)) {
    return auth;
  }

  const payload = await parseJsonBody(request, adminLeadTagAddSchema);

  if (isApiResponse(payload)) {
    return payload;
  }

  const { leadId } = await context.params;
  return serviceResultToResponse(await adminLeadService.addTag(auth.viewer, leadId, payload));
}
