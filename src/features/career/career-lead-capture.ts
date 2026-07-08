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
export type CareerLeadFormValidation = Readonly<
  | {
    ok: true;
    fullName: string;
    phone: string;
  }
  | {
    ok: false;
    fullNameError?: string;
    phoneError?: string;
  }
>;

const persianArabicDigitMap: Readonly<Record<string, string>> = {
  "۰": "0",
  "۱": "1",
  "۲": "2",
  "۳": "3",
  "۴": "4",
  "۵": "5",
  "۶": "6",
  "۷": "7",
  "۸": "8",
  "۹": "9",
  "٠": "0",
  "١": "1",
  "٢": "2",
  "٣": "3",
  "٤": "4",
  "٥": "5",
  "٦": "6",
  "٧": "7",
  "٨": "8",
  "٩": "9"
};

export const CAREER_LEAD_FULL_NAME_ERROR = "نام و نام خانوادگی را درست وارد کن.";
export const CAREER_LEAD_PHONE_ERROR = "شماره موبایل را درست وارد کن.";

export function normalizeCareerLeadDigits(value: string): string {
  return value.replace(/[۰-۹٠-٩]/g, (digit) => persianArabicDigitMap[digit] ?? digit);
}

export function normalizeCareerLeadFullName(fullName: string): string | undefined {
  const normalizedName = fullName.replace(/\s+/g, " ").trim();
  const words = normalizedName.split(" ").filter(Boolean);
  if (words.length < 2) return undefined;

  for (const word of words) {
    const letterCount = word.match(/\p{L}/gu)?.length ?? 0;
    if (letterCount < 2 || /[^\p{L}\u200c'-]/u.test(word)) return undefined;
  }

  return normalizedName;
}

export function normalizeIranianMobile(contact: string): string | undefined {
  const compactContact = normalizeCareerLeadDigits(contact)
    .trim()
    .replace(/[\s().-]/g, "");
  if (!compactContact || !/^\+?\d+$/.test(compactContact)) return undefined;

  let nationalNumber = compactContact;
  if (compactContact.startsWith("+98")) {
    nationalNumber = compactContact.slice(3);
  } else if (compactContact.startsWith("98")) {
    nationalNumber = compactContact.slice(2);
  } else if (compactContact.startsWith("0")) {
    nationalNumber = compactContact.slice(1);
  }

  return /^9\d{9}$/.test(nationalNumber) ? `+98${nationalNumber}` : undefined;
}

export function isValidCareerLeadFullName(fullName: string): boolean {
  return Boolean(normalizeCareerLeadFullName(fullName));
}

export function isValidCareerLeadContact(contact: string): boolean {
  return Boolean(normalizeIranianMobile(contact));
}

export function validateCareerLeadFormInput(
  fullName: string,
  phone: string
): CareerLeadFormValidation {
  const normalizedFullName = normalizeCareerLeadFullName(fullName);
  const normalizedPhone = normalizeIranianMobile(phone);

  if (normalizedFullName && normalizedPhone) {
    return { ok: true, fullName: normalizedFullName, phone: normalizedPhone };
  }

  return {
    ok: false,
    ...(!normalizedFullName ? { fullNameError: CAREER_LEAD_FULL_NAME_ERROR } : {}),
    ...(!normalizedPhone ? { phoneError: CAREER_LEAD_PHONE_ERROR } : {})
  };
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
