import { isApiResponse, parseJsonBody, requireAdminViewer } from "@/lib/backend/route-utils";
import { adminContentService, serviceResultToResponse } from "@/lib/backend/services";
import { adminContentEntryRestoreSchema } from "@/lib/backend/validation";

export const dynamic = "force-dynamic";

type AdminContentRestoreRouteContext = {
  params: Promise<{ contentId: string }>;
};

export async function POST(request: Request, context: AdminContentRestoreRouteContext) {
  const auth = await requireAdminViewer();

  if (isApiResponse(auth)) {
    return auth;
  }

  const payload = await parseJsonBody(request, adminContentEntryRestoreSchema);

  if (isApiResponse(payload)) {
    return payload;
  }

  const { contentId } = await context.params;
  return serviceResultToResponse(await adminContentService.restore(auth.viewer, contentId, payload));
}
