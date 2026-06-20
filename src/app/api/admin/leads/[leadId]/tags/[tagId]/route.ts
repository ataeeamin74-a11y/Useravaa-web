import { isApiResponse, requireAdminViewer } from "@/lib/backend/route-utils";
import { adminLeadService, serviceResultToResponse } from "@/lib/backend/services";

export const dynamic = "force-dynamic";

type AdminLeadTagDeleteRouteContext = {
  params: Promise<{ leadId: string; tagId: string }>;
};

export async function DELETE(_request: Request, context: AdminLeadTagDeleteRouteContext) {
  const auth = await requireAdminViewer();

  if (isApiResponse(auth)) {
    return auth;
  }

  const { leadId, tagId } = await context.params;
  return serviceResultToResponse(await adminLeadService.removeTag(auth.viewer, leadId, tagId));
}
