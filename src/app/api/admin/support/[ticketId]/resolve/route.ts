import { isApiResponse, parseJsonBody, requireAdminViewer } from "@/lib/backend/route-utils";
import { adminSupportService, serviceResultToResponse } from "@/lib/backend/services";
import { adminSupportTicketResolveSchema } from "@/lib/backend/validation";

export const dynamic = "force-dynamic";

type AdminSupportTicketResolveRouteContext = {
  params: Promise<{ ticketId: string }>;
};

export async function POST(request: Request, context: AdminSupportTicketResolveRouteContext) {
  const auth = await requireAdminViewer();

  if (isApiResponse(auth)) {
    return auth;
  }

  const payload = await parseJsonBody(request, adminSupportTicketResolveSchema);

  if (isApiResponse(payload)) {
    return payload;
  }

  const { ticketId } = await context.params;
  return serviceResultToResponse(await adminSupportService.resolve(auth.viewer, ticketId, payload));
}
