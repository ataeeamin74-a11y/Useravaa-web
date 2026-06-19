import { profileService, serviceResultToResponse } from "@/lib/backend/services";
import { isApiResponse, parseJsonBody, requireApiViewer } from "@/lib/backend/route-utils";
import { profileUpdateSchema } from "@/lib/backend/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiViewer();

  if (isApiResponse(auth)) {
    return auth;
  }

  return serviceResultToResponse(await profileService.getCurrentProfile(auth.viewer));
}

export async function PATCH(request: Request) {
  const auth = await requireApiViewer();

  if (isApiResponse(auth)) {
    return auth;
  }

  const payload = await parseJsonBody(request, profileUpdateSchema);

  if (isApiResponse(payload)) {
    return payload;
  }

  return serviceResultToResponse(profileService.updateCurrentProfile(auth.viewer, payload));
}
