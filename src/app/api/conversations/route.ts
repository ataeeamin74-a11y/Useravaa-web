import { isApiResponse, parseJsonBody, requireApiViewer } from "@/lib/backend/route-utils";
import { conversationService, serviceResultToResponse } from "@/lib/backend/services";
import { requestCreationSchema } from "@/lib/backend/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiViewer();

  if (isApiResponse(auth)) {
    return auth;
  }

  return serviceResultToResponse(await conversationService.listForViewer(auth.viewer));
}

export async function POST(request: Request) {
  const auth = await requireApiViewer();

  if (isApiResponse(auth)) {
    return auth;
  }

  const payload = await parseJsonBody(request, requestCreationSchema);

  if (isApiResponse(payload)) {
    return payload;
  }

  return serviceResultToResponse(await conversationService.createConversation(auth.viewer, payload));
}
