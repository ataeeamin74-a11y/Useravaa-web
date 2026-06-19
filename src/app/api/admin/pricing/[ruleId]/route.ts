import { isApiResponse, parseJsonBody, requireAdminViewer } from "@/lib/backend/route-utils";
import { adminPricingService, serviceResultToResponse } from "@/lib/backend/services";
import { adminPricingRuleUpdateSchema } from "@/lib/backend/validation";

export const dynamic = "force-dynamic";

type AdminPricingRuleRouteContext = {
  params: Promise<{ ruleId: string }>;
};

export async function PATCH(request: Request, context: AdminPricingRuleRouteContext) {
  const auth = await requireAdminViewer();

  if (isApiResponse(auth)) {
    return auth;
  }

  const payload = await parseJsonBody(request, adminPricingRuleUpdateSchema);

  if (isApiResponse(payload)) {
    return payload;
  }

  const { ruleId } = await context.params;
  return serviceResultToResponse(await adminPricingService.update(auth.viewer, ruleId, payload));
}
