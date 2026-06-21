import { timingSafeEqual } from "node:crypto";
import type { Viewer } from "./types";

export const STAGING_PRIMARY_ADMIN_ID = "staging-primary-admin";
export const STAGING_SUPPORT_ID = "staging-support";

type StagingAccessEnvironment = {
  APP_ENV?: string;
  NODE_ENV?: string;
  USERAVAA_ENABLE_STAGING_ACCESS?: string;
  USERAVAA_STAGING_ACCESS_HEADER?: string;
  USERAVAA_STAGING_ACCESS_IDENTITY_HEADER?: string;
  USERAVAA_STAGING_ACCESS_SECRET?: string;
  STAGING_PRIMARY_ADMIN_EMAIL?: string;
  STAGING_SUPPORT_EMAIL?: string;
};

type HeaderSource = {
  get(name: string): string | null | undefined;
};

export type StagingAccessDecision =
  | {
      enabled: true;
      reason: "enabled";
    }
  | {
      enabled: false;
      reason:
        | "flag_disabled"
        | "not_staging"
        | "production_runtime"
        | "missing_primary_admin"
        | "missing_support"
        | "duplicate_operator_identifier";
    };

type StagingAccessDisabledReason = Extract<StagingAccessDecision, { enabled: false }>["reason"];

export type StagingHeaderAccessDecision =
  | {
      enabled: true;
      reason: "enabled";
      accessHeaderName: string;
      identityHeaderName: string;
    }
  | {
      enabled: false;
      reason:
        | StagingAccessDisabledReason
        | "missing_access_header"
        | "missing_identity_header"
        | "missing_access_secret"
        | "invalid_access_header"
        | "invalid_identity_header"
        | "duplicate_staging_header";
    };

const httpHeaderNamePattern = /^[A-Za-z0-9!#$%&'*+.^_`|~-]+$/u;

function normalizeOperatorIdentifier(value?: string | null) {
  return value?.trim().toLowerCase() ?? "";
}

function normalizeHeaderName(value?: string | null) {
  return value?.trim().toLowerCase() ?? "";
}

function isValidHeaderName(value: string) {
  return httpHeaderNamePattern.test(value);
}

function secretsMatch(expectedSecret: string, presentedSecret: string) {
  const expected = Buffer.from(expectedSecret);
  const presented = Buffer.from(presentedSecret);

  return expected.length === presented.length && timingSafeEqual(expected, presented);
}

export function getStagingAccessDecision(source: StagingAccessEnvironment = process.env): StagingAccessDecision {
  if (source.USERAVAA_ENABLE_STAGING_ACCESS !== "1") {
    return {
      enabled: false,
      reason: "flag_disabled"
    };
  }

  if (source.APP_ENV !== "staging") {
    return {
      enabled: false,
      reason: "not_staging"
    };
  }

  if (source.NODE_ENV === "production") {
    return {
      enabled: false,
      reason: "production_runtime"
    };
  }

  const primaryAdminIdentifier = normalizeOperatorIdentifier(source.STAGING_PRIMARY_ADMIN_EMAIL);
  const supportIdentifier = normalizeOperatorIdentifier(source.STAGING_SUPPORT_EMAIL);

  if (!primaryAdminIdentifier) {
    return {
      enabled: false,
      reason: "missing_primary_admin"
    };
  }

  if (!supportIdentifier) {
    return {
      enabled: false,
      reason: "missing_support"
    };
  }

  if (primaryAdminIdentifier === supportIdentifier) {
    return {
      enabled: false,
      reason: "duplicate_operator_identifier"
    };
  }

  return {
    enabled: true,
    reason: "enabled"
  };
}

export function getStagingHeaderAccessDecision(source: StagingAccessEnvironment = process.env): StagingHeaderAccessDecision {
  const accessDecision = getStagingAccessDecision(source);

  if (!accessDecision.enabled) {
    return accessDecision;
  }

  const accessHeaderName = normalizeHeaderName(source.USERAVAA_STAGING_ACCESS_HEADER);
  const identityHeaderName = normalizeHeaderName(source.USERAVAA_STAGING_ACCESS_IDENTITY_HEADER);
  const expectedSecret = source.USERAVAA_STAGING_ACCESS_SECRET?.trim() ?? "";

  if (!accessHeaderName) {
    return {
      enabled: false,
      reason: "missing_access_header"
    };
  }

  if (!identityHeaderName) {
    return {
      enabled: false,
      reason: "missing_identity_header"
    };
  }

  if (!expectedSecret) {
    return {
      enabled: false,
      reason: "missing_access_secret"
    };
  }

  if (!isValidHeaderName(accessHeaderName)) {
    return {
      enabled: false,
      reason: "invalid_access_header"
    };
  }

  if (!isValidHeaderName(identityHeaderName)) {
    return {
      enabled: false,
      reason: "invalid_identity_header"
    };
  }

  if (accessHeaderName === identityHeaderName) {
    return {
      enabled: false,
      reason: "duplicate_staging_header"
    };
  }

  return {
    enabled: true,
    reason: "enabled",
    accessHeaderName,
    identityHeaderName
  };
}

export function resolveStagingOperatorViewer(
  trustedOperatorIdentifier: string | null | undefined,
  source: StagingAccessEnvironment = process.env
): Viewer | null {
  if (!getStagingAccessDecision(source).enabled) {
    return null;
  }

  const normalizedIdentifier = normalizeOperatorIdentifier(trustedOperatorIdentifier);

  if (!normalizedIdentifier) {
    return null;
  }

  if (normalizedIdentifier === normalizeOperatorIdentifier(source.STAGING_PRIMARY_ADMIN_EMAIL)) {
    return {
      id: STAGING_PRIMARY_ADMIN_ID,
      role: "ADMIN",
      displayName: "Staging ADMIN"
    };
  }

  if (normalizedIdentifier === normalizeOperatorIdentifier(source.STAGING_SUPPORT_EMAIL)) {
    return {
      id: STAGING_SUPPORT_ID,
      role: "SUPPORT",
      displayName: "Staging SUPPORT"
    };
  }

  return null;
}

export function resolveStagingHeaderViewer(
  headers: HeaderSource | null | undefined,
  source: StagingAccessEnvironment = process.env
): Viewer | null {
  if (!headers) {
    return null;
  }

  const headerDecision = getStagingHeaderAccessDecision(source);

  if (!headerDecision.enabled) {
    return null;
  }

  const expectedSecret = source.USERAVAA_STAGING_ACCESS_SECRET?.trim() ?? "";
  const presentedSecret = headers.get(headerDecision.accessHeaderName);

  if (!presentedSecret || !secretsMatch(expectedSecret, presentedSecret)) {
    return null;
  }

  return resolveStagingOperatorViewer(headers.get(headerDecision.identityHeaderName), source);
}
