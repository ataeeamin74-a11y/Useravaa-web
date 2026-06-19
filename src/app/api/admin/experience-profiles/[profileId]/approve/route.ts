import { isApiResponse, parseJsonBody, requireAdminViewer } from "@/lib/backend/route-utils";
import { adminExperienceProfileService, serviceResultToResponse } from "@/lib/backend/services";
import { adminExperienceProfileApprovalSchema } from "@/lib/backend/validation";

export const dynamic = "force-dynamic";

type AdminExperienceProfileRouteContext = {
  params: Promise<{ profileId: string }>;
};

export async function POST(request: Request, context: AdminExperienceProfileRouteContext) {
  const auth = await requireAdminViewer();

  if (isApiResponse(auth)) {
    return auth;
  }

  const payload = await parseJsonBody(request, adminExperienceProfileApprovalSchema);

  if (isApiResponse(payload)) {
    return payload;
  }

  const { profileId } = await context.params;
  return serviceResultToResponse(await adminExperienceProfileService.approve(auth.viewer, profileId, payload));
}
