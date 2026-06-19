import { isApiResponse, parseJsonBody, requireAdminViewer } from "@/lib/backend/route-utils";
import { adminCategoryService, serviceResultToResponse } from "@/lib/backend/services";
import { adminCategoryUpdateSchema } from "@/lib/backend/validation";

export const dynamic = "force-dynamic";

type AdminCategoryRouteContext = {
  params: Promise<{ categoryId: string }>;
};

export async function PATCH(request: Request, context: AdminCategoryRouteContext) {
  const auth = await requireAdminViewer();

  if (isApiResponse(auth)) {
    return auth;
  }

  const payload = await parseJsonBody(request, adminCategoryUpdateSchema);

  if (isApiResponse(payload)) {
    return payload;
  }

  const { categoryId } = await context.params;
  return serviceResultToResponse(await adminCategoryService.update(auth.viewer, categoryId, payload));
}
