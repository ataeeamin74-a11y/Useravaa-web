import { isApiResponse, parseJsonBody, requireAdminViewer } from "@/lib/backend/route-utils";
import { adminCategoryService, serviceResultToResponse } from "@/lib/backend/services";
import { adminCategoryArchiveSchema } from "@/lib/backend/validation";

export const dynamic = "force-dynamic";

type AdminCategoryArchiveRouteContext = {
  params: Promise<{ categoryId: string }>;
};

export async function POST(request: Request, context: AdminCategoryArchiveRouteContext) {
  const auth = await requireAdminViewer();

  if (isApiResponse(auth)) {
    return auth;
  }

  const payload = await parseJsonBody(request, adminCategoryArchiveSchema);

  if (isApiResponse(payload)) {
    return payload;
  }

  const { categoryId } = await context.params;
  return serviceResultToResponse(await adminCategoryService.archive(auth.viewer, categoryId, payload));
}
