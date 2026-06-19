import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authAdapter } from "@/lib/adapters/auth";
import { DEV_VIEWER_COOKIE, devFixtureAuthIsEnabled, resolveDevFixtureViewer } from "./dev-fixtures";
import type { AuthSession, Viewer } from "./types";

export async function getCurrentSession(): Promise<AuthSession> {
  const providerViewer = await authAdapter.getCurrentUser();

  if (providerViewer) {
    return {
      viewer: providerViewer,
      source: "provider"
    };
  }

  // Local fixture auth is a development-only bridge until a production provider is wired.
  if (devFixtureAuthIsEnabled()) {
    const cookieStore = await cookies();
    const viewer = resolveDevFixtureViewer(cookieStore.get(DEV_VIEWER_COOKIE)?.value ?? process.env.USERAVAA_DEV_VIEWER_ID);

    if (viewer) {
      return {
        viewer,
        source: "dev_fixture"
      };
    }
  }

  return {
    viewer: null,
    source: "none"
  };
}

export async function requireCurrentViewer(): Promise<Viewer> {
  const session = await getCurrentSession();

  if (!session.viewer) {
    redirect("/login");
  }

  return session.viewer;
}
