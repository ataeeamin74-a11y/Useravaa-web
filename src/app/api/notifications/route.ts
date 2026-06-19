import { isApiResponse, requireApiViewer } from "@/lib/backend/route-utils";
import { notificationService, serviceResultToResponse } from "@/lib/backend/services";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiViewer();

  if (isApiResponse(auth)) {
    return auth;
  }

  return serviceResultToResponse(await notificationService.listForViewer(auth.viewer));
}
