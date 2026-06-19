import { isApiResponse, requireApiViewer } from "@/lib/backend/route-utils";
import { conversationService, serviceResultToResponse } from "@/lib/backend/services";

export const dynamic = "force-dynamic";

type ConversationRouteContext = {
  params: Promise<{ conversationId: string }>;
};

export async function GET(_request: Request, context: ConversationRouteContext) {
  const auth = await requireApiViewer();

  if (isApiResponse(auth)) {
    return auth;
  }

  const { conversationId } = await context.params;
  return serviceResultToResponse(await conversationService.getConversation(auth.viewer, conversationId));
}
