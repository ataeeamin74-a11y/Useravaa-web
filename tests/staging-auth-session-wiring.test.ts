import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
  headers: vi.fn()
}));

import { authAdapter } from "@/lib/adapters/auth";
import { getCurrentSession } from "@/lib/auth/session";
import { STAGING_PRIMARY_ADMIN_ID, STAGING_SUPPORT_ID } from "@/lib/auth/staging-access";
import { cookies, headers } from "next/headers";

const originalGetCurrentUser = authAdapter.getCurrentUser;

const stagingEnv = {
  APP_ENV: "staging",
  NODE_ENV: "test",
  USERAVAA_ENABLE_DEV_AUTH: "0",
  USERAVAA_ENABLE_STAGING_ACCESS: "1",
  USERAVAA_STAGING_ACCESS_HEADER: "x-useravaa-staging-access",
  USERAVAA_STAGING_ACCESS_IDENTITY_HEADER: "x-useravaa-staging-operator",
  USERAVAA_STAGING_ACCESS_SECRET: "placeholder-shared-secret",
  STAGING_PRIMARY_ADMIN_EMAIL: "placeholder-primary-operator",
  STAGING_SUPPORT_EMAIL: "placeholder-support-operator"
};

function setEnv(overrides: Partial<typeof stagingEnv> = {}) {
  for (const [key, value] of Object.entries({ ...stagingEnv, ...overrides })) {
    vi.stubEnv(key, value);
  }
}

function headerStore(values: Record<string, string>) {
  const source = new Headers(values);

  return {
    get(name: string) {
      return source.get(name);
    }
  };
}

describe("Checkpoint 3B-7 getCurrentSession staging header wiring", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authAdapter.getCurrentUser = originalGetCurrentUser;
    vi.mocked(cookies).mockResolvedValue({ get: () => undefined } as Awaited<ReturnType<typeof cookies>>);
  });

  afterEach(() => {
    authAdapter.getCurrentUser = originalGetCurrentUser;
    vi.unstubAllEnvs();
  });

  it("does not read staging headers when staging access is disabled by default", async () => {
    setEnv({ USERAVAA_ENABLE_STAGING_ACCESS: "0" });
    vi.mocked(headers).mockRejectedValue(new Error("headers should not be read"));

    await expect(getCurrentSession()).resolves.toEqual({
      viewer: null,
      source: "none"
    });
    expect(headers).not.toHaveBeenCalled();
  });

  it("keeps provider auth ahead of the staging header bridge", async () => {
    setEnv();
    authAdapter.getCurrentUser = async () => ({
      id: "provider-viewer",
      role: "ADMIN",
      displayName: "Provider Viewer"
    });
    vi.mocked(headers).mockRejectedValue(new Error("headers should not be read when provider auth resolves"));

    await expect(getCurrentSession()).resolves.toMatchObject({
      viewer: {
        id: "provider-viewer",
        role: "ADMIN"
      },
      source: "provider"
    });
    expect(headers).not.toHaveBeenCalled();
  });

  it("rejects raw staging identity headers without the matching secret", async () => {
    setEnv();
    vi.mocked(headers).mockResolvedValue(
      headerStore({
        "x-useravaa-staging-operator": "placeholder-primary-operator"
      }) as Awaited<ReturnType<typeof headers>>
    );

    await expect(getCurrentSession()).resolves.toEqual({
      viewer: null,
      source: "none"
    });
  });

  it("rejects staging identity headers with the wrong secret", async () => {
    setEnv();
    vi.mocked(headers).mockResolvedValue(
      headerStore({
        "x-useravaa-staging-access": "wrong-placeholder-secret",
        "x-useravaa-staging-operator": "placeholder-primary-operator"
      }) as Awaited<ReturnType<typeof headers>>
    );

    await expect(getCurrentSession()).resolves.toEqual({
      viewer: null,
      source: "none"
    });
  });

  it("maps the primary staging operator to ADMIN only when fully gated", async () => {
    setEnv();
    vi.mocked(headers).mockResolvedValue(
      headerStore({
        "x-useravaa-staging-access": "placeholder-shared-secret",
        "x-useravaa-staging-operator": "placeholder-primary-operator"
      }) as Awaited<ReturnType<typeof headers>>
    );

    await expect(getCurrentSession()).resolves.toMatchObject({
      viewer: {
        id: STAGING_PRIMARY_ADMIN_ID,
        role: "ADMIN"
      },
      source: "staging_access"
    });
  });

  it("maps the support staging operator to SUPPORT only when fully gated", async () => {
    setEnv();
    vi.mocked(headers).mockResolvedValue(
      headerStore({
        "x-useravaa-staging-access": "placeholder-shared-secret",
        "x-useravaa-staging-operator": "placeholder-support-operator"
      }) as Awaited<ReturnType<typeof headers>>
    );

    await expect(getCurrentSession()).resolves.toMatchObject({
      viewer: {
        id: STAGING_SUPPORT_ID,
        role: "SUPPORT"
      },
      source: "staging_access"
    });
  });

  it("refuses the staging header bridge in production runtime", async () => {
    setEnv({ NODE_ENV: "production" });
    vi.mocked(headers).mockRejectedValue(new Error("headers should not be read in production"));

    await expect(getCurrentSession()).resolves.toEqual({
      viewer: null,
      source: "none"
    });
    expect(headers).not.toHaveBeenCalled();
  });
});
