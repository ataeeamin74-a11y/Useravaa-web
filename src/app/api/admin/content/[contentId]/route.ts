import { isApiResponse, parseJsonBody, requireAdminViewer } from "@/lib/backend/route-utils";
import { adminContentService, serviceResultToResponse } from "@/lib/backend/services";
import { adminContentEntryUpdateSchema } from "@/lib/backend/validation";

export const dynamic = "force-dynamic";

type AdminContentRouteContext = {
  params: Promise<{ contentId: string }>;
};

export async function PATCH(request: Request, context: AdminContentRouteContext) {
  const auth = await requireAdminViewer();

  if (isApiResponse(auth)) {
    return auth;
  }

  const payload = await parseJsonBody(request, adminContentEntryUpdateSchema);

  if (isApiResponse(payload)) {
    return payload;
  }

  const { contentId } = await context.params;
  return serviceResultToResponse(await adminContentService.update(auth.viewer, contentId, payload));
}
