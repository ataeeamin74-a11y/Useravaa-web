import { isApiResponse, parseOptionalJsonBody, requireApiViewer } from "@/lib/backend/route-utils";
import { conversationService, serviceResultToResponse } from "@/lib/backend/services";
import { freePaymentFinalizationSchema } from "@/lib/backend/validation";

export const dynamic = "force-dynamic";

type ConversationRouteContext = {
  params: Promise<{ conversationId: string }>;
};

export async function POST(request: Request, context: ConversationRouteContext) {
  const auth = await requireApiViewer();

  if (isApiResponse(auth)) {
    return auth;
  }

  const payload = await parseOptionalJsonBody(request, freePaymentFinalizationSchema);

  if (isApiResponse(payload)) {
    return payload;
  }

  const { conversationId } = await context.params;
  return serviceResultToResponse(await conversationService.finalizeFreePayment(auth.viewer, conversationId, payload));
}
