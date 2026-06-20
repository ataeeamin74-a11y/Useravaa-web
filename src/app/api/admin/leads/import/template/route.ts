import { isApiResponse, requireAdminViewer } from "@/lib/backend/route-utils";
import { buildLeadImportTemplateCsv } from "@/lib/backend/lead-import";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminViewer();

  if (isApiResponse(auth)) {
    return auth;
  }

  return new Response(buildLeadImportTemplateCsv(), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="useravaa-leads-template.csv"'
    }
  });
}
