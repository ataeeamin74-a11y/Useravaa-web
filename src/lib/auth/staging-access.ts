import type { Viewer } from "./types";

export const STAGING_PRIMARY_ADMIN_ID = "staging-primary-admin";
export const STAGING_SUPPORT_ID = "staging-support";

type StagingAccessEnvironment = {
  APP_ENV?: string;
  NODE_ENV?: string;
  USERAVAA_ENABLE_STAGING_ACCESS?: string;
  STAGING_PRIMARY_ADMIN_EMAIL?: string;
  STAGING_SUPPORT_EMAIL?: string;
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

function normalizeOperatorIdentifier(value?: string | null) {
  return value?.trim().toLowerCase() ?? "";
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
