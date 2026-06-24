import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import type { Viewer } from "./types";

export const STAGING_PRIMARY_ADMIN_ID = "staging-primary-admin";
export const STAGING_SUPPORT_ID = "staging-support";
export const STAGING_OPERATOR_COOKIE_NAME = "useravaa-staging-operator";
export const STAGING_OPERATOR_COOKIE_MAX_AGE_SECONDS = 8 * 60 * 60;

type StagingAccessEnvironment = {
  APP_ENV?: string;
  NODE_ENV?: string;
  AUTH_SECRET?: string;
  JWT_SECRET?: string;
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

type StagingOperatorKind = "primary_admin" | "support";

type StagingOperatorCookiePayload = {
  v: 1;
  operator: StagingOperatorKind;
  iat: number;
  exp: number;
  nonce: string;
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
        | "missing_primary_admin"
        | "missing_support"
        | "duplicate_operator_identifier";
    };

type StagingAccessDisabledReason = Extract<StagingAccessDecision, { enabled: false }>["reason"];

export type StagingCookieAccessDecision =
  | {
      enabled: true;
      reason: "enabled";
    }
  | {
      enabled: false;
      reason: StagingAccessDisabledReason | "missing_access_secret" | "missing_signing_secret";
    };

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

export type StagingOperatorLoginFailureReason =
  | Extract<StagingCookieAccessDecision, { enabled: false }>["reason"]
  | "invalid_secret"
  | "unknown_operator";

export type StagingOperatorLoginResult =
  | {
      ok: true;
      cookieValue: string;
      expiresAt: Date;
      viewer: Viewer;
    }
  | {
      ok: false;
      reason: StagingOperatorLoginFailureReason;
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

function getStagingAccessSecret(source: StagingAccessEnvironment) {
  return source.USERAVAA_STAGING_ACCESS_SECRET?.trim() ?? "";
}

function getStagingSigningSecret(source: StagingAccessEnvironment) {
  return source.AUTH_SECRET?.trim() || source.JWT_SECRET?.trim() || "";
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signCookieBody(encodedPayload: string, signingSecret: string) {
  return createHmac("sha256", signingSecret).update(encodedPayload).digest("base64url");
}

function signaturesMatch(expectedSignature: string, presentedSignature: string) {
  const expected = Buffer.from(expectedSignature);
  const presented = Buffer.from(presentedSignature);

  return expected.length === presented.length && timingSafeEqual(expected, presented);
}

function resolveStagingOperatorKind(operatorIdentifier: string | null | undefined, source: StagingAccessEnvironment): StagingOperatorKind | null {
  const normalizedIdentifier = normalizeOperatorIdentifier(operatorIdentifier);

  if (!normalizedIdentifier) {
    return null;
  }

  if (normalizedIdentifier === normalizeOperatorIdentifier(source.STAGING_PRIMARY_ADMIN_EMAIL)) {
    return "primary_admin";
  }

  if (normalizedIdentifier === normalizeOperatorIdentifier(source.STAGING_SUPPORT_EMAIL)) {
    return "support";
  }

  return null;
}

function viewerForStagingOperatorKind(operator: StagingOperatorKind): Viewer {
  if (operator === "primary_admin") {
    return {
      id: STAGING_PRIMARY_ADMIN_ID,
      role: "ADMIN",
      displayName: "Staging ADMIN"
    };
  }

  return {
    id: STAGING_SUPPORT_ID,
    role: "SUPPORT",
    displayName: "Staging SUPPORT"
  };
}

function encodeStagingOperatorCookiePayload(payload: StagingOperatorCookiePayload, source: StagingAccessEnvironment) {
  const signingSecret = getStagingSigningSecret(source);
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = signCookieBody(encodedPayload, signingSecret);

  return `${encodedPayload}.${signature}`;
}

function parseStagingOperatorCookiePayload(cookieValue: string, source: StagingAccessEnvironment): StagingOperatorCookiePayload | null {
  const signingSecret = getStagingSigningSecret(source);
  const [encodedPayload, presentedSignature, ...rest] = cookieValue.split(".");

  if (!encodedPayload || !presentedSignature || rest.length > 0) {
    return null;
  }

  const expectedSignature = signCookieBody(encodedPayload, signingSecret);

  if (!signaturesMatch(expectedSignature, presentedSignature)) {
    return null;
  }

  try {
    const parsed = JSON.parse(base64UrlDecode(encodedPayload)) as Partial<StagingOperatorCookiePayload>;

    if (parsed.v !== 1 || (parsed.operator !== "primary_admin" && parsed.operator !== "support")) {
      return null;
    }

    if (typeof parsed.iat !== "number" || typeof parsed.exp !== "number" || typeof parsed.nonce !== "string") {
      return null;
    }

    return {
      v: 1,
      operator: parsed.operator,
      iat: parsed.iat,
      exp: parsed.exp,
      nonce: parsed.nonce
    };
  } catch {
    return null;
  }
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

export function getStagingCookieAccessDecision(source: StagingAccessEnvironment = process.env): StagingCookieAccessDecision {
  const accessDecision = getStagingAccessDecision(source);

  if (!accessDecision.enabled) {
    return accessDecision;
  }

  if (!getStagingAccessSecret(source)) {
    return {
      enabled: false,
      reason: "missing_access_secret"
    };
  }

  if (!getStagingSigningSecret(source)) {
    return {
      enabled: false,
      reason: "missing_signing_secret"
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

  const operatorKind = resolveStagingOperatorKind(normalizedIdentifier, source);

  return operatorKind ? viewerForStagingOperatorKind(operatorKind) : null;
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

export function validateStagingOperatorLogin(
  input: {
    operatorEmail: string | null | undefined;
    accessSecret: string | null | undefined;
  },
  source: StagingAccessEnvironment = process.env,
  nowMs = Date.now()
): StagingOperatorLoginResult {
  const cookieDecision = getStagingCookieAccessDecision(source);

  if (!cookieDecision.enabled) {
    return {
      ok: false,
      reason: cookieDecision.reason
    };
  }

  const expectedSecret = getStagingAccessSecret(source);
  const presentedSecret = input.accessSecret?.trim() ?? "";

  if (!presentedSecret || !secretsMatch(expectedSecret, presentedSecret)) {
    return {
      ok: false,
      reason: "invalid_secret"
    };
  }

  const operatorKind = resolveStagingOperatorKind(input.operatorEmail, source);

  if (!operatorKind) {
    return {
      ok: false,
      reason: "unknown_operator"
    };
  }

  const issuedAt = Math.floor(nowMs / 1000);
  const expiresAtSeconds = issuedAt + STAGING_OPERATOR_COOKIE_MAX_AGE_SECONDS;
  const cookieValue = encodeStagingOperatorCookiePayload(
    {
      v: 1,
      operator: operatorKind,
      iat: issuedAt,
      exp: expiresAtSeconds,
      nonce: randomUUID()
    },
    source
  );

  return {
    ok: true,
    cookieValue,
    expiresAt: new Date(expiresAtSeconds * 1000),
    viewer: viewerForStagingOperatorKind(operatorKind)
  };
}

export function resolveStagingOperatorCookieViewer(
  cookieValue: string | null | undefined,
  source: StagingAccessEnvironment = process.env,
  nowMs = Date.now()
): Viewer | null {
  if (!cookieValue || !getStagingCookieAccessDecision(source).enabled) {
    return null;
  }

  const payload = parseStagingOperatorCookiePayload(cookieValue, source);

  if (!payload || payload.exp <= Math.floor(nowMs / 1000)) {
    return null;
  }

  return viewerForStagingOperatorKind(payload.operator);
}

export function shouldUseSecureStagingOperatorCookie(source: StagingAccessEnvironment = process.env) {
  return source.APP_ENV === "staging" || source.NODE_ENV === "production";
}
