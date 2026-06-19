import { isApiResponse, parseJsonBody, requireAdminViewer } from "@/lib/backend/route-utils";
import { adminContentService, serviceResultToResponse } from "@/lib/backend/services";
import { adminContentEntryArchiveSchema } from "@/lib/backend/validation";

export const dynamic = "force-dynamic";

type AdminContentArchiveRouteContext = {
  params: Promise<{ contentId: string }>;
};

export async function POST(request: Request, context: AdminContentArchiveRouteContext) {
  const auth = await requireAdminViewer();

  if (isApiResponse(auth)) {
    return auth;
  }

  const payload = await parseJsonBody(request, adminContentEntryArchiveSchema);

  if (isApiResponse(payload)) {
    return payload;
  }

  const { contentId } = await context.params;
  return serviceResultToResponse(await adminContentService.archive(auth.viewer, contentId, payload));
}
