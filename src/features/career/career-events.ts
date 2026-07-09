export const CAREER_EVENT_SESSION_STORAGE_KEY = "useravaa:career:event-session-id";

export const careerEventNames = [
  "career_entry",
  "career_path_viewed",
  "career_path_saved",
  "career_path_removed",
  "career_compare_started",
  "career_compare_selection_changed",
  "career_comparison_saved",
  "career_my_paths_viewed",
  "career_lead_sheet_shown",
  "career_lead_submit_succeeded",
  "career_lead_submit_failed",
  "career_lead_sheet_dismissed",
  "career_search_used",
  "career_filter_changed"
] as const;

export type CareerEventName = (typeof careerEventNames)[number];
export type CareerEventPayloadValue = string | number;
export type CareerEventPayload = Readonly<Record<string, unknown>>;
export type SanitizedCareerEventPayload = Readonly<Record<string, CareerEventPayloadValue>>;
export type CareerEventBody = Readonly<{
  event: CareerEventName;
  sessionId: string;
  payload?: SanitizedCareerEventPayload;
  occurredAt?: string;
}>;

type BrowserWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
};

let memorySessionId: string | undefined;

const eventNameSet = new Set<string>(careerEventNames);
const allowedEntrySources = new Set(["root", "career", "unknown"]);
const allowedLeadTriggers = new Set(["path_save", "comparison_save"]);
const allowedLeadFailureReasons = new Set(["validation", "api", "rate_limited", "unknown"]);

export function isCareerEventName(value: unknown): value is CareerEventName {
  return typeof value === "string" && eventNameSet.has(value);
}

function sanitizeText(value: unknown, maximumLength: number) {
  if (typeof value !== "string") return undefined;
  const sanitized = value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
  if (!sanitized || sanitized.length > maximumLength) return undefined;
  return sanitized;
}

function containsIranianMobile(value: string) {
  const compactValue = value.replace(/[\s().-]/g, "");
  return /(?:\+?98|0)?9\d{9}/.test(compactValue);
}

function sanitizeIdentifier(value: unknown) {
  const sanitized = sanitizeText(value, 160);
  return sanitized
    && !containsIranianMobile(sanitized)
    && /^[\p{L}\p{N}\s._:%/#&+,-]+$/u.test(sanitized)
    ? sanitized
    : undefined;
}

function sanitizePublicTitle(value: unknown) {
  const sanitized = sanitizeText(value, 160);
  if (!sanitized || containsIranianMobile(sanitized)) {
    return undefined;
  }
  return sanitized;
}

function sanitizeCount(value: unknown, maximum = 10_000) {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  return Math.max(0, Math.min(maximum, Math.trunc(value)));
}

function setIfString(
  payload: Record<string, CareerEventPayloadValue>,
  key: string,
  value: unknown,
  sanitizer: (value: unknown) => string | undefined = sanitizeIdentifier
) {
  const sanitized = sanitizer(value);
  if (sanitized) payload[key] = sanitized;
}

function setIfCount(
  payload: Record<string, CareerEventPayloadValue>,
  key: string,
  value: unknown,
  maximum?: number
) {
  const sanitized = sanitizeCount(value, maximum);
  if (sanitized !== undefined) payload[key] = sanitized;
}

export function sanitizeCareerEventPayload(
  event: CareerEventName,
  payload: CareerEventPayload = {}
): SanitizedCareerEventPayload {
  const sanitized: Record<string, CareerEventPayloadValue> = {};

  switch (event) {
    case "career_entry": {
      const source = sanitizeText(payload.source, 20);
      sanitized.source = source && allowedEntrySources.has(source) ? source : "unknown";
      break;
    }
    case "career_path_viewed":
      setIfString(sanitized, "pathId", payload.pathId);
      setIfString(sanitized, "pathTitle", payload.pathTitle, sanitizePublicTitle);
      break;
    case "career_path_saved":
    case "career_path_removed":
      setIfString(sanitized, "pathId", payload.pathId);
      break;
    case "career_compare_started":
      setIfString(sanitized, "fromPathId", payload.fromPathId);
      break;
    case "career_compare_selection_changed":
    case "career_comparison_saved":
      setIfCount(sanitized, "selectedCount", payload.selectedCount);
      break;
    case "career_my_paths_viewed":
      setIfCount(sanitized, "savedPathCount", payload.savedPathCount);
      setIfCount(sanitized, "savedComparisonCount", payload.savedComparisonCount);
      break;
    case "career_lead_sheet_shown":
    case "career_lead_submit_succeeded":
    case "career_lead_sheet_dismissed": {
      const trigger = sanitizeText(payload.trigger, 40);
      if (trigger && allowedLeadTriggers.has(trigger)) sanitized.trigger = trigger;
      if (event === "career_lead_submit_succeeded") {
        setIfString(sanitized, "stage", payload.stage, (value) => sanitizeText(value, 120));
      }
      break;
    }
    case "career_lead_submit_failed": {
      const reason = sanitizeText(payload.reason, 40);
      sanitized.reason = reason && allowedLeadFailureReasons.has(reason) ? reason : "unknown";
      break;
    }
    case "career_search_used":
      setIfCount(sanitized, "queryLength", payload.queryLength, 300);
      setIfCount(sanitized, "resultCount", payload.resultCount);
      break;
    case "career_filter_changed":
      setIfString(sanitized, "filterType", payload.filterType);
      setIfCount(sanitized, "selectedCount", payload.selectedCount);
      break;
  }

  return sanitized;
}

function getBrowserWindow(): BrowserWindow | undefined {
  return typeof window === "undefined" ? undefined : window;
}

function getSafeStorage(): Pick<Storage, "getItem" | "setItem"> | undefined {
  try {
    return getBrowserWindow()?.localStorage;
  } catch {
    return undefined;
  }
}

function createSessionId() {
  const cryptoSource = getBrowserWindow()?.crypto ?? globalThis.crypto;
  if (typeof cryptoSource?.randomUUID === "function") return cryptoSource.randomUUID();
  if (typeof cryptoSource?.getRandomValues === "function") {
    const values = cryptoSource.getRandomValues(new Uint32Array(4));
    return `career-${[...values].map((value) => value.toString(16).padStart(8, "0")).join("")}`;
  }
  return `career-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export function getCareerEventSessionId() {
  const storage = getSafeStorage();
  try {
    const storedSessionId = storage?.getItem(CAREER_EVENT_SESSION_STORAGE_KEY);
    if (storedSessionId) return storedSessionId;
  } catch {
    // Fall back to process-local memory when storage is restricted.
  }

  if (!memorySessionId) memorySessionId = createSessionId();
  try {
    storage?.setItem(CAREER_EVENT_SESSION_STORAGE_KEY, memorySessionId);
  } catch {
    // Best-effort analytics must not affect the user experience.
  }
  return memorySessionId;
}

export function resetCareerEventSessionForTests() {
  memorySessionId = undefined;
}

export function sendCareerEventToGa4(
  event: CareerEventName,
  payload: CareerEventPayload = {}
) {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  const gtag = getBrowserWindow()?.gtag;
  if (!measurementId || typeof gtag !== "function") return false;

  try {
    gtag("event", event, sanitizeCareerEventPayload(event, payload));
    return true;
  } catch {
    return false;
  }
}

export function sendCareerEventToFirstParty(body: CareerEventBody) {
  try {
    const serializedBody = JSON.stringify(body);
    const browserNavigator = typeof navigator === "undefined" ? undefined : navigator;
    if (typeof browserNavigator?.sendBeacon === "function") {
      const accepted = browserNavigator.sendBeacon(
        "/api/career/events",
        new Blob([serializedBody], { type: "application/json" })
      );
      if (accepted) return true;
    }

    if (typeof fetch === "function") {
      void fetch("/api/career/events", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: serializedBody,
        keepalive: true
      }).catch(() => undefined);
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

export function trackCareerEvent(event: CareerEventName, payload: CareerEventPayload = {}) {
  try {
    const sanitizedPayload = sanitizeCareerEventPayload(event, payload);
    sendCareerEventToFirstParty({
      event,
      sessionId: getCareerEventSessionId(),
      payload: sanitizedPayload,
      occurredAt: new Date().toISOString()
    });
    sendCareerEventToGa4(event, sanitizedPayload);
  } catch {
    // Tracking is passive and must never interrupt Career PWA flows.
  }
}
