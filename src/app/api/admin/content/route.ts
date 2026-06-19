import { isApiResponse, parseJsonBody, requireAdminViewer } from "@/lib/backend/route-utils";
import { adminContentService, serviceResultToResponse } from "@/lib/backend/services";
import { adminContentEntryCreateSchema } from "@/lib/backend/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireAdminViewer();

  if (isApiResponse(auth)) {
    return auth;
  }

  const payload = await parseJsonBody(request, adminContentEntryCreateSchema);

  if (isApiResponse(payload)) {
    return payload;
  }

  return serviceResultToResponse(await adminContentService.create(auth.viewer, payload));
}
