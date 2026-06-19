import { isApiResponse, parseJsonBody, requireApiViewer } from "@/lib/backend/route-utils";
import { serviceResultToResponse, walletService } from "@/lib/backend/services";
import { walletWithdrawalRequestSchema } from "@/lib/backend/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireApiViewer();

  if (isApiResponse(auth)) {
    return auth;
  }

  const payload = await parseJsonBody(request, walletWithdrawalRequestSchema);

  if (isApiResponse(payload)) {
    return payload;
  }

  return serviceResultToResponse(walletService.requestWithdrawal(auth.viewer, payload));
}

