import { isApiResponse, parseJsonBody, requireAdminViewer } from "@/lib/backend/route-utils";
import { adminSupportService, serviceResultToResponse } from "@/lib/backend/services";
import { adminSupportTicketUpdateSchema } from "@/lib/backend/validation";

export const dynamic = "force-dynamic";

type AdminSupportTicketRouteContext = {
  params: Promise<{ ticketId: string }>;
};

export async function GET(_request: Request, context: AdminSupportTicketRouteContext) {
  const auth = await requireAdminViewer();

  if (isApiResponse(auth)) {
    return auth;
  }

  const { ticketId } = await context.params;
  return serviceResultToResponse(await adminSupportService.getDetail(auth.viewer, ticketId));
}

export async function PATCH(request: Request, context: AdminSupportTicketRouteContext) {
  const auth = await requireAdminViewer();

  if (isApiResponse(auth)) {
    return auth;
  }

  const payload = await parseJsonBody(request, adminSupportTicketUpdateSchema);

  if (isApiResponse(payload)) {
    return payload;
  }

  const { ticketId } = await context.params;
  return serviceResultToResponse(await adminSupportService.update(auth.viewer, ticketId, payload));
}
