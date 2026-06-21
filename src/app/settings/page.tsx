import { redirect } from "next/navigation";
import { requireCurrentViewer } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function SettingsRoute() {
  await requireCurrentViewer();
  redirect("/profile/settings");
}
