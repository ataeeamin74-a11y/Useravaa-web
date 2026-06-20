import { isApiResponse, parseJsonBody, requireAdminViewer } from "@/lib/backend/route-utils";
import { adminSupportService, serviceResultToResponse } from "@/lib/backend/services";
import { adminSupportTicketNoteCreateSchema } from "@/lib/backend/validation";

export const dynamic = "force-dynamic";

type AdminSupportTicketNoteRouteContext = {
  params: Promise<{ ticketId: string }>;
};

export async function POST(request: Request, context: AdminSupportTicketNoteRouteContext) {
  const auth = await requireAdminViewer();

  if (isApiResponse(auth)) {
    return auth;
  }

  const payload = await parseJsonBody(request, adminSupportTicketNoteCreateSchema);

  if (isApiResponse(payload)) {
    return payload;
  }

  const { ticketId } = await context.params;
  return serviceResultToResponse(await adminSupportService.addNote(auth.viewer, ticketId, payload));
}
