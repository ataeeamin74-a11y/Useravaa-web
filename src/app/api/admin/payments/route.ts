import { requireAdminViewer, isApiResponse } from "@/lib/backend/route-utils";
import { adminPaymentService, serviceResultToResponse } from "@/lib/backend/services";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminViewer();

  if (isApiResponse(auth)) {
    return auth;
  }

  return serviceResultToResponse(await adminPaymentService.listPending(auth.viewer));
}
