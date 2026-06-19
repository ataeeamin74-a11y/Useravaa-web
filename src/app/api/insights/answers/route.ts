import { isApiResponse, parseJsonBody, requireApiViewer } from "@/lib/backend/route-utils";
import { insightService, serviceResultToResponse } from "@/lib/backend/services";
import { insightAnswerSubmissionSchema } from "@/lib/backend/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireApiViewer();

  if (isApiResponse(auth)) {
    return auth;
  }

  const payload = await parseJsonBody(request, insightAnswerSubmissionSchema);

  if (isApiResponse(payload)) {
    return payload;
  }

  return serviceResultToResponse(insightService.submitAnswer(auth.viewer, payload));
}

