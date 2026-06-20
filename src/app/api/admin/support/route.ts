import { isApiResponse, parseJsonBody, requireAdminViewer } from "@/lib/backend/route-utils";
import { adminSupportService, serviceResultToResponse } from "@/lib/backend/services";
import { adminSupportTicketCreateSchema } from "@/lib/backend/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminViewer();

  if (isApiResponse(auth)) {
    return auth;
  }

  return serviceResultToResponse(await adminSupportService.list(auth.viewer));
}

export async function POST(request: Request) {
  const auth = await requireAdminViewer();

  if (isApiResponse(auth)) {
    return auth;
  }

  const payload = await parseJsonBody(request, adminSupportTicketCreateSchema);

  if (isApiResponse(payload)) {
    return payload;
  }

  return serviceResultToResponse(await adminSupportService.create(auth.viewer, payload));
}
