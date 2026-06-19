import { isApiResponse, parseJsonBody, requireAdminViewer } from "@/lib/backend/route-utils";
import { adminPaymentService, serviceResultToResponse } from "@/lib/backend/services";
import { adminPaymentApprovalSchema } from "@/lib/backend/validation";

export const dynamic = "force-dynamic";

type AdminPaymentRouteContext = {
  params: Promise<{ paymentId: string }>;
};

export async function POST(request: Request, context: AdminPaymentRouteContext) {
  const auth = await requireAdminViewer();

  if (isApiResponse(auth)) {
    return auth;
  }

  const payload = await parseJsonBody(request, adminPaymentApprovalSchema);

  if (isApiResponse(payload)) {
    return payload;
  }

  const { paymentId } = await context.params;
  return serviceResultToResponse(await adminPaymentService.approve(auth.viewer, paymentId, payload));
}
