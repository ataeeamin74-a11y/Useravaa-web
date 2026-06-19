import { isApiResponse, parseJsonBody, requireAdminViewer } from "@/lib/backend/route-utils";
import { adminPricingService, serviceResultToResponse } from "@/lib/backend/services";
import { adminPricingRuleDeactivateSchema } from "@/lib/backend/validation";

export const dynamic = "force-dynamic";

type AdminPricingRuleDeactivateRouteContext = {
  params: Promise<{ ruleId: string }>;
};

export async function POST(request: Request, context: AdminPricingRuleDeactivateRouteContext) {
  const auth = await requireAdminViewer();

  if (isApiResponse(auth)) {
    return auth;
  }

  const payload = await parseJsonBody(request, adminPricingRuleDeactivateSchema);

  if (isApiResponse(payload)) {
    return payload;
  }

  const { ruleId } = await context.params;
  return serviceResultToResponse(await adminPricingService.deactivate(auth.viewer, ruleId, payload));
}
