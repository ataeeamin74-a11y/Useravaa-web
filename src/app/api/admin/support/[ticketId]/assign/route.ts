import { isApiResponse, parseJsonBody, requireAdminViewer } from "@/lib/backend/route-utils";
import { adminSupportService, serviceResultToResponse } from "@/lib/backend/services";
import { adminSupportTicketAssignSchema } from "@/lib/backend/validation";

export const dynamic = "force-dynamic";

type AdminSupportTicketAssignRouteContext = {
  params: Promise<{ ticketId: string }>;
};

export async function POST(request: Request, context: AdminSupportTicketAssignRouteContext) {
  const auth = await requireAdminViewer();

  if (isApiResponse(auth)) {
    return auth;
  }

  const payload = await parseJsonBody(request, adminSupportTicketAssignSchema);

  if (isApiResponse(payload)) {
    return payload;
  }

  const { ticketId } = await context.params;
  return serviceResultToResponse(await adminSupportService.assign(auth.viewer, ticketId, payload));
}
