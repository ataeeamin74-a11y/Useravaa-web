import { isApiResponse, parseJsonBody, requireAdminViewer } from "@/lib/backend/route-utils";
import { adminSupportService, serviceResultToResponse } from "@/lib/backend/services";
import { adminSupportTicketReopenSchema } from "@/lib/backend/validation";

export const dynamic = "force-dynamic";

type AdminSupportTicketReopenRouteContext = {
  params: Promise<{ ticketId: string }>;
};

export async function POST(request: Request, context: AdminSupportTicketReopenRouteContext) {
  const auth = await requireAdminViewer();

  if (isApiResponse(auth)) {
    return auth;
  }

  const payload = await parseJsonBody(request, adminSupportTicketReopenSchema);

  if (isApiResponse(payload)) {
    return payload;
  }

  const { ticketId } = await context.params;
  return serviceResultToResponse(await adminSupportService.reopen(auth.viewer, ticketId, payload));
}
