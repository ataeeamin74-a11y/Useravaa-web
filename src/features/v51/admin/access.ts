import { canAccessAdmin } from "@/features/v51/permissions";
import { requireCurrentViewer } from "@/lib/auth/session";
import type { Viewer } from "@/lib/auth/types";

export async function requireAdminPageAccess(): Promise<Viewer | null> {
  const viewer = await requireCurrentViewer();

  return canAccessAdmin(viewer) ? viewer : null;
}
