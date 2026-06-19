import { isApiResponse, requireApiViewer } from "@/lib/backend/route-utils";
import { profileService, serviceResultToResponse } from "@/lib/backend/services";

export const dynamic = "force-dynamic";

export async function POST() {
  const auth = await requireApiViewer();

  if (isApiResponse(auth)) {
    return auth;
  }

  return serviceResultToResponse(profileService.submitForReview(auth.viewer));
}

