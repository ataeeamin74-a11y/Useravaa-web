export const CAREER_LEAD_CAPTURE_SUBMITTED_KEY = "useravaa:career:lead-capture-submitted";
export const CAREER_LEAD_CAPTURE_DISMISSED_AT_KEY = "useravaa:career:lead-capture-dismissed-at";
export const CAREER_LEAD_CAPTURE_DISMISSAL_MS = 7 * 24 * 60 * 60 * 1000;
export const CAREER_LEAD_CAPTURE_EVENT = "useravaa:career:lead-capture-requested";

export const CAREER_STAGE_OPTIONS = [
  "هنوز دارم مسیرها را می‌شناسم",
  "بین چند مسیر مرددم",
  "می‌خواهم وارد یک مسیر شوم",
  "می‌خواهم مسیرم را تغییر بدهم",
  "می‌خواهم در مسیر فعلی رشد کنم"
] as const;

export type CareerLeadSource = "path_save" | "comparison_save";
export type CareerStage = (typeof CAREER_STAGE_OPTIONS)[number];
export type CareerLeadCaptureRequest = Readonly<{
  source: CareerLeadSource;
  currentPathId?: string;
  comparisonPathIds?: readonly string[];
}>;
export type CareerLeadStorage = Pick<Storage, "getItem" | "setItem">;

export function isValidCareerLeadContact(contact: string): boolean {
  const normalizedContact = contact.trim();
  if (!normalizedContact || normalizedContact.length > 160) return false;

  const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedContact);
  const phoneDigits = normalizedContact.replace(/\D/g, "");
  const looksLikePhone = /^[+\d][\d\s().-]+$/.test(normalizedContact)
    && phoneDigits.length >= 7
    && phoneDigits.length <= 15;

  return looksLikeEmail || looksLikePhone;
}

export function wasCareerLeadCaptureDismissedRecently(
  storage?: CareerLeadStorage,
  now = Date.now()
): boolean {
  try {
    const storedValue = storage?.getItem(CAREER_LEAD_CAPTURE_DISMISSED_AT_KEY);
    const dismissedAt = storedValue ? Number(storedValue) : Number.NaN;
    if (!Number.isFinite(dismissedAt)) return false;

    return dismissedAt > now || now - dismissedAt < CAREER_LEAD_CAPTURE_DISMISSAL_MS;
  } catch {
    return false;
  }
}

export function shouldShowCareerLeadCapture(
  storage?: CareerLeadStorage,
  now = Date.now()
): boolean {
  try {
    return storage?.getItem(CAREER_LEAD_CAPTURE_SUBMITTED_KEY) !== "1"
      && !wasCareerLeadCaptureDismissedRecently(storage, now);
  } catch {
    return false;
  }
}

export function rememberCareerLeadCaptureDismissal(
  storage?: CareerLeadStorage,
  now = Date.now()
) {
  try {
    storage?.setItem(CAREER_LEAD_CAPTURE_DISMISSED_AT_KEY, String(now));
  } catch {
    // Local storage can be unavailable in private or restricted contexts.
  }
}

export function rememberCareerLeadCaptureSubmission(storage?: CareerLeadStorage) {
  try {
    storage?.setItem(CAREER_LEAD_CAPTURE_SUBMITTED_KEY, "1");
  } catch {
    // Lead submission succeeded even if this device cannot remember it.
  }
}

export function shouldRequestCareerLeadCapture(
  wasAlreadySaved: boolean,
  saveSucceeded: boolean
): boolean {
  return !wasAlreadySaved && saveSucceeded;
}

export function requestCareerLeadCapture(detail: CareerLeadCaptureRequest) {
  try {
    window.dispatchEvent(new CustomEvent<CareerLeadCaptureRequest>(CAREER_LEAD_CAPTURE_EVENT, { detail }));
  } catch {
    // Lead capture must never interfere with the original save action.
  }
}
