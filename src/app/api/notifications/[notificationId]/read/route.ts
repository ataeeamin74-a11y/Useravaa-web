import { isApiResponse, requireApiViewer } from "@/lib/backend/route-utils";
import { notificationService, serviceResultToResponse } from "@/lib/backend/services";
import { apiError } from "@/lib/backend/api-response";
import { notificationReadMutationSchema } from "@/lib/backend/validation";

export const dynamic = "force-dynamic";

type NotificationRouteContext = {
  params: Promise<{ notificationId: string }>;
};

export async function POST(_request: Request, context: NotificationRouteContext) {
  const auth = await requireApiViewer();

  if (isApiResponse(auth)) {
    return auth;
  }

  const { notificationId } = await context.params;
  const parsedParams = notificationReadMutationSchema.safeParse({ notificationId });

  if (!parsedParams.success) {
    return apiError("validation_error", "Route parameters are invalid.", 422, parsedParams.error.flatten());
  }

  return serviceResultToResponse(notificationService.markRead(auth.viewer, parsedParams.data.notificationId));
}
