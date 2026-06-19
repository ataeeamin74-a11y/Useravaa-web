import { isApiResponse, parseJsonBody, requireAdminViewer } from "@/lib/backend/route-utils";
import { adminCategoryService, serviceResultToResponse } from "@/lib/backend/services";
import { adminCategoryRestoreSchema } from "@/lib/backend/validation";

export const dynamic = "force-dynamic";

type AdminCategoryRestoreRouteContext = {
  params: Promise<{ categoryId: string }>;
};

export async function POST(request: Request, context: AdminCategoryRestoreRouteContext) {
  const auth = await requireAdminViewer();

  if (isApiResponse(auth)) {
    return auth;
  }

  const payload = await parseJsonBody(request, adminCategoryRestoreSchema);

  if (isApiResponse(payload)) {
    return payload;
  }

  const { categoryId } = await context.params;
  return serviceResultToResponse(await adminCategoryService.restore(auth.viewer, categoryId, payload));
}
