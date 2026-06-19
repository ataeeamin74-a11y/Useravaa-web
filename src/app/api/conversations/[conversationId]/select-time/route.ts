import { isApiResponse, parseJsonBody, requireApiViewer } from "@/lib/backend/route-utils";
import { conversationService, serviceResultToResponse } from "@/lib/backend/services";
import { timeSelectionSchema } from "@/lib/backend/validation";

export const dynamic = "force-dynamic";

type ConversationRouteContext = {
  params: Promise<{ conversationId: string }>;
};

export async function POST(request: Request, context: ConversationRouteContext) {
  const auth = await requireApiViewer();

  if (isApiResponse(auth)) {
    return auth;
  }

  const payload = await parseJsonBody(request, timeSelectionSchema);

  if (isApiResponse(payload)) {
    return payload;
  }

  const { conversationId } = await context.params;
  return serviceResultToResponse(await conversationService.selectTime(auth.viewer, conversationId, payload));
}


