import { isApiResponse, parseJsonBody, requireAdminViewer } from "@/lib/backend/route-utils";
import { adminPricingService, serviceResultToResponse } from "@/lib/backend/services";
import { adminPricingRuleCreateSchema } from "@/lib/backend/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireAdminViewer();

  if (isApiResponse(auth)) {
    return auth;
  }

  const payload = await parseJsonBody(request, adminPricingRuleCreateSchema);

  if (isApiResponse(payload)) {
    return payload;
  }

  return serviceResultToResponse(await adminPricingService.create(auth.viewer, payload));
}
