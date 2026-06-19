import { isApiResponse, parseJsonBody, requireApiViewer } from "@/lib/backend/route-utils";
import { conversationService, serviceResultToResponse } from "@/lib/backend/services";
import { proposedTimesSubmissionSchema } from "@/lib/backend/validation";

export const dynamic = "force-dynamic";

type ConversationRouteContext = {
  params: Promise<{ conversationId: string }>;
};

export async function POST(request: Request, context: ConversationRouteContext) {
  const auth = await requireApiViewer();

  if (isApiResponse(auth)) {
    return auth;
  }

  const payload = await parseJsonBody(request, proposedTimesSubmissionSchema);

  if (isApiResponse(payload)) {
    return payload;
  }

  const { conversationId } = await context.params;
  return serviceResultToResponse(await conversationService.proposeTimes(auth.viewer, conversationId, payload));
}


