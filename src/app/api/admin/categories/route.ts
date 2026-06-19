import { isApiResponse, parseJsonBody, requireAdminViewer } from "@/lib/backend/route-utils";
import { adminCategoryService, serviceResultToResponse } from "@/lib/backend/services";
import { adminCategoryCreateSchema } from "@/lib/backend/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireAdminViewer();

  if (isApiResponse(auth)) {
    return auth;
  }

  const payload = await parseJsonBody(request, adminCategoryCreateSchema);

  if (isApiResponse(payload)) {
    return payload;
  }

  return serviceResultToResponse(await adminCategoryService.create(auth.viewer, payload));
}
