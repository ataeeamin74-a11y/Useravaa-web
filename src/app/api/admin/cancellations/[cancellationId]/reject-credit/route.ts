import { isApiResponse, parseJsonBody, requireAdminViewer } from "@/lib/backend/route-utils";
import { adminCancellationService, serviceResultToResponse } from "@/lib/backend/services";
import { adminCancellationCreditRejectionSchema } from "@/lib/backend/validation";

export const dynamic = "force-dynamic";

type AdminCancellationRouteContext = {
  params: Promise<{ cancellationId: string }>;
};

export async function POST(request: Request, context: AdminCancellationRouteContext) {
  const auth = await requireAdminViewer();

  if (isApiResponse(auth)) {
    return auth;
  }

  const payload = await parseJsonBody(request, adminCancellationCreditRejectionSchema);

  if (isApiResponse(payload)) {
    return payload;
  }

  const { cancellationId } = await context.params;
  return serviceResultToResponse(await adminCancellationService.rejectCredit(auth.viewer, cancellationId, payload));
}
