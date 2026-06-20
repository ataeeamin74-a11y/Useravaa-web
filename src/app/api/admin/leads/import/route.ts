import { isApiResponse, requireAdminViewer } from "@/lib/backend/route-utils";
import { adminLeadService, serviceResultToResponse } from "@/lib/backend/services";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireAdminViewer();

  if (isApiResponse(auth)) {
    return auth;
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return serviceResultToResponse(adminLeadService.validateCsvFile({ size: 0, type: "", name: "" }) ?? {
      ok: false,
      area: "admin_leads",
      code: "validation_error",
      status: 422,
      message: "CSV file is required."
    });
  }

  const fileError = adminLeadService.validateCsvFile({
    size: file.size,
    type: file.type,
    name: file.name
  });

  if (fileError) {
    return serviceResultToResponse(fileError);
  }

  const dryRun = formData.get("dryRun") === "true";
  return serviceResultToResponse(await adminLeadService.importCsv(auth.viewer, await file.text(), { dryRun }));
}
