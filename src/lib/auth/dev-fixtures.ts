import type { Viewer } from "./types";

export const DEV_VIEWER_COOKIE = "useravaa-dev-viewer";

export const DEV_FIXTURE_VIEWERS = {
  requester: {
    id: "user-requester",
    role: "USER",
    displayName: "علی",
    canOfferExperience: true
  },
  provider: {
    id: "provider-reza",
    role: "USER",
    displayName: "رضا",
    canOfferExperience: true
  },
  admin: {
    id: "admin-support",
    role: "ADMIN",
    displayName: "پشتیبانی"
  },
  support: {
    id: "support-operator",
    role: "SUPPORT",
    displayName: "پشتیبانی"
  },
  unrelated: {
    id: "user-unrelated",
    role: "USER",
    displayName: "کاربر"
  }
} satisfies Record<string, Viewer>;

export type DevFixtureViewerKey = keyof typeof DEV_FIXTURE_VIEWERS;

export function devFixtureAuthIsEnabled(source: NodeJS.ProcessEnv = process.env) {
  return source.NODE_ENV !== "production" && source.USERAVAA_ENABLE_DEV_AUTH !== "0";
}

export function resolveDevFixtureViewer(value?: string | null): Viewer | null {
  if (!value) {
    return null;
  }

  return DEV_FIXTURE_VIEWERS[value as DevFixtureViewerKey] ?? null;
}
