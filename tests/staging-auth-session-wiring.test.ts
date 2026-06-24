import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  cookies: vi.fn()
}));

import { authAdapter } from "@/lib/adapters/auth";
import { getCurrentSession } from "@/lib/auth/session";
import {
  STAGING_OPERATOR_COOKIE_NAME,
  STAGING_PRIMARY_ADMIN_ID,
  STAGING_SUPPORT_ID,
  validateStagingOperatorLogin
} from "@/lib/auth/staging-access";
import { cookies } from "next/headers";

const originalGetCurrentUser = authAdapter.getCurrentUser;

const stagingEnv = {
  APP_ENV: "staging",
  NODE_ENV: "test",
  AUTH_SECRET: "placeholder-auth-signing-secret",
  USERAVAA_ENABLE_DEV_AUTH: "0",
  USERAVAA_ENABLE_STAGING_ACCESS: "1",
  USERAVAA_STAGING_ACCESS_SECRET: "placeholder-shared-secret",
  STAGING_PRIMARY_ADMIN_EMAIL: "placeholder-primary-operator",
  STAGING_SUPPORT_EMAIL: "placeholder-support-operator"
};

function setEnv(overrides: Partial<typeof stagingEnv> = {}) {
  for (const [key, value] of Object.entries({ ...stagingEnv, ...overrides })) {
    vi.stubEnv(key, value);
  }
}

function cookieStore(values: Record<string, string>) {
  return {
    get(name: string) {
      const value = values[name];

      return value ? { name, value } : undefined;
    }
  };
}

function createCookie(operatorEmail: string, overrides: Partial<typeof stagingEnv> = {}) {
  const result = validateStagingOperatorLogin(
    {
      operatorEmail,
      accessSecret: "placeholder-shared-secret"
    },
    {
      ...stagingEnv,
      ...overrides
    }
  );

  expect(result.ok).toBe(true);

  return result.ok ? result.cookieValue : "";
}

describe("Checkpoint 3B-22B getCurrentSession staging operator cookie wiring", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authAdapter.getCurrentUser = originalGetCurrentUser;
    vi.mocked(cookies).mockResolvedValue(cookieStore({}) as Awaited<ReturnType<typeof cookies>>);
  });

  afterEach(() => {
    authAdapter.getCurrentUser = originalGetCurrentUser;
    vi.unstubAllEnvs();
  });

  it("does not read staging cookies when staging access is disabled by default", async () => {
    setEnv({ USERAVAA_ENABLE_STAGING_ACCESS: "0" });
    vi.mocked(cookies).mockRejectedValue(new Error("cookies should not be read"));

    await expect(getCurrentSession()).resolves.toEqual({
      viewer: null,
      source: "none"
    });
    expect(cookies).not.toHaveBeenCalled();
  });

  it("keeps provider auth ahead of the staging operator cookie", async () => {
    setEnv();
    authAdapter.getCurrentUser = async () => ({
      id: "provider-viewer",
      role: "ADMIN",
      displayName: "Provider Viewer"
    });
    vi.mocked(cookies).mockRejectedValue(new Error("cookies should not be read when provider auth resolves"));

    await expect(getCurrentSession()).resolves.toMatchObject({
      viewer: {
        id: "provider-viewer",
        role: "ADMIN"
      },
      source: "provider"
    });
    expect(cookies).not.toHaveBeenCalled();
  });

  it("rejects missing and tampered staging operator cookies", async () => {
    setEnv();
    vi.mocked(cookies).mockResolvedValue(
      cookieStore({
        [STAGING_OPERATOR_COOKIE_NAME]: "tampered-cookie"
      }) as Awaited<ReturnType<typeof cookies>>
    );

    await expect(getCurrentSession()).resolves.toEqual({
      viewer: null,
      source: "none"
    });
  });

  it("maps the primary staging operator cookie to ADMIN only when fully gated", async () => {
    setEnv();
    vi.mocked(cookies).mockResolvedValue(
      cookieStore({
        [STAGING_OPERATOR_COOKIE_NAME]: createCookie("placeholder-primary-operator")
      }) as Awaited<ReturnType<typeof cookies>>
    );

    await expect(getCurrentSession()).resolves.toMatchObject({
      viewer: {
        id: STAGING_PRIMARY_ADMIN_ID,
        role: "ADMIN"
      },
      source: "staging_access"
    });
  });

  it("maps the support staging operator cookie to SUPPORT only when fully gated", async () => {
    setEnv();
    vi.mocked(cookies).mockResolvedValue(
      cookieStore({
        [STAGING_OPERATOR_COOKIE_NAME]: createCookie("placeholder-support-operator")
      }) as Awaited<ReturnType<typeof cookies>>
    );

    await expect(getCurrentSession()).resolves.toMatchObject({
      viewer: {
        id: STAGING_SUPPORT_ID,
        role: "SUPPORT"
      },
      source: "staging_access"
    });
  });

  it("allows the staging cookie bridge in APP_ENV=staging even when NODE_ENV=production", async () => {
    setEnv({ NODE_ENV: "production" });
    vi.mocked(cookies).mockResolvedValue(
      cookieStore({
        [STAGING_OPERATOR_COOKIE_NAME]: createCookie("placeholder-primary-operator", { NODE_ENV: "production" })
      }) as Awaited<ReturnType<typeof cookies>>
    );

    await expect(getCurrentSession()).resolves.toMatchObject({
      viewer: {
        id: STAGING_PRIMARY_ADMIN_ID,
        role: "ADMIN"
      },
      source: "staging_access"
    });
  });

  it("refuses the staging cookie bridge when APP_ENV=production", async () => {
    setEnv({ APP_ENV: "production", NODE_ENV: "production" });
    vi.mocked(cookies).mockRejectedValue(new Error("cookies should not be read when APP_ENV is production"));

    await expect(getCurrentSession()).resolves.toEqual({
      viewer: null,
      source: "none"
    });
    expect(cookies).not.toHaveBeenCalled();
  });
});
