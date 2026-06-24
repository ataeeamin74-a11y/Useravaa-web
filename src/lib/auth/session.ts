import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authAdapter } from "@/lib/adapters/auth";
import { DEV_VIEWER_COOKIE, devFixtureAuthIsEnabled, resolveDevFixtureViewer } from "./dev-fixtures";
import { getStagingCookieAccessDecision, resolveStagingOperatorCookieViewer, STAGING_OPERATOR_COOKIE_NAME } from "./staging-access";
import type { AuthSession, Viewer } from "./types";

export async function getCurrentSession(): Promise<AuthSession> {
  const providerViewer = await authAdapter.getCurrentUser();

  if (providerViewer) {
    return {
      viewer: providerViewer,
      source: "provider"
    };
  }

  let cookieStore: Awaited<ReturnType<typeof cookies>> | null = null;
  const readCookie = async (name: string) => {
    cookieStore ??= await cookies();

    return cookieStore.get(name)?.value;
  };

  const stagingAccessDecision = getStagingCookieAccessDecision();

  if (stagingAccessDecision.enabled) {
    const stagingViewer = resolveStagingOperatorCookieViewer(await readCookie(STAGING_OPERATOR_COOKIE_NAME));

    if (stagingViewer) {
      return {
        viewer: stagingViewer,
        source: "staging_access"
      };
    }
  }

  // Local fixture auth is a development-only bridge until a production provider is wired.
  if (devFixtureAuthIsEnabled()) {
    const viewer = resolveDevFixtureViewer((await readCookie(DEV_VIEWER_COOKIE)) ?? process.env.USERAVAA_DEV_VIEWER_ID);

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
