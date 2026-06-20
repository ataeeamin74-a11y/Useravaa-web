import { isApiResponse, parseJsonBody, requireAdminViewer } from "@/lib/backend/route-utils";
import { adminSupportService, serviceResultToResponse } from "@/lib/backend/services";
import { adminSupportTicketArchiveSchema } from "@/lib/backend/validation";

export const dynamic = "force-dynamic";

type AdminSupportTicketArchiveRouteContext = {
  params: Promise<{ ticketId: string }>;
};

export async function POST(request: Request, context: AdminSupportTicketArchiveRouteContext) {
  const auth = await requireAdminViewer();

  if (isApiResponse(auth)) {
    return auth;
  }

  const payload = await parseJsonBody(request, adminSupportTicketArchiveSchema);

  if (isApiResponse(payload)) {
    return payload;
  }

  const { ticketId } = await context.params;
  return serviceResultToResponse(await adminSupportService.archive(auth.viewer, ticketId, payload));
}
