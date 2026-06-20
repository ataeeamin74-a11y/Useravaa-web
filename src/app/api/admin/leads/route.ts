import { isApiResponse, parseJsonBody, requireAdminViewer } from "@/lib/backend/route-utils";
import { adminLeadService, serviceResultToResponse } from "@/lib/backend/services";
import { adminLeadCreateSchema } from "@/lib/backend/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminViewer();

  if (isApiResponse(auth)) {
    return auth;
  }

  return serviceResultToResponse(await adminLeadService.list(auth.viewer));
}

export async function POST(request: Request) {
  const auth = await requireAdminViewer();

  if (isApiResponse(auth)) {
    return auth;
  }

  const payload = await parseJsonBody(request, adminLeadCreateSchema);

  if (isApiResponse(payload)) {
    return payload;
  }

  return serviceResultToResponse(await adminLeadService.create(auth.viewer, payload));
}
