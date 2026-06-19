import { apiError } from "@/lib/backend/api-response";
import { isApiResponse, requireApiViewer } from "@/lib/backend/route-utils";
import { conversationService, serviceResultToResponse } from "@/lib/backend/services";

export const dynamic = "force-dynamic";

type ConversationRouteContext = {
  params: Promise<{ conversationId: string }>;
};

export async function POST(_request: Request, context: ConversationRouteContext) {
  if (process.env.NODE_ENV === "production") {
    return apiError("not_found", "This development-only route is unavailable in production.", 404);
  }

  const auth = await requireApiViewer();

  if (isApiResponse(auth)) {
    return auth;
  }

  const { conversationId } = await context.params;
  return serviceResultToResponse(conversationService.confirmDevPayment(auth.viewer, conversationId));
}

