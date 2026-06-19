const persianDigitMap: Record<string, string> = {
  "0": "۰",
  "1": "۱",
  "2": "۲",
  "3": "۳",
  "4": "۴",
  "5": "۵",
  "6": "۶",
  "7": "۷",
  "8": "۸",
  "9": "۹",
  "٠": "۰",
  "١": "۱",
  "٢": "۲",
  "٣": "۳",
  "٤": "۴",
  "٥": "۵",
  "٦": "۶",
  "٧": "۷",
  "٨": "۸",
  "٩": "۹"
};

export const faNumberFormatter = new Intl.NumberFormat("fa-IR");

export function toPersianDigits(value: string | number) {
  return String(value).replace(/[0-9٠-٩]/g, (digit) => persianDigitMap[digit] ?? digit);
}

export function formatFaNumber(value: number | string) {
  if (typeof value === "number") {
    return toPersianDigits(faNumberFormatter.format(value));
  }

  return toPersianDigits(value);
}

export function formatFaDecimal(
  value: number,
  options: { minimumFractionDigits?: number; maximumFractionDigits?: number } = {}
) {
  return toPersianDigits(new Intl.NumberFormat("fa-IR", {
    minimumFractionDigits: options.minimumFractionDigits ?? 0,
    maximumFractionDigits: options.maximumFractionDigits ?? 1
  }).format(value));
}

export function formatFaRating(value: number, max = 5) {
  return `${formatFaDecimal(value)} از ${formatFaNumber(max)}`;
}

export function formatFaCount(value: number, label: string) {
  return `${formatFaNumber(value)} ${label}`;
}

export function formatFaCurrencyToman(value: number) {
  return `${formatFaNumber(value)} تومان`;
}

export function formatFaDurationMinutes(value: number) {
  return `${formatFaNumber(value)} دقیقه`;
}

export function formatFaDate(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;

  return toPersianDigits(new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date));
}

export function formatFaTime(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;

  return toPersianDigits(new Intl.DateTimeFormat("fa-IR", {
    hour: "2-digit",
    hour12: false,
    minute: "2-digit"
  }).format(date));
}

export function formatFaDateTime(value: Date | string) {
  return `${formatFaDate(value)}، ${formatFaTime(value)}`;
}

export const formatPersianNumber = formatFaNumber;
export const formatPersianDecimal = formatFaDecimal;
export const formatPersianCurrency = formatFaCurrencyToman;
export const formatPersianDuration = formatFaDurationMinutes;
export const formatPersianDate = formatFaDate;
export const formatPersianTime = formatFaTime;
export const formatPersianDateTime = formatFaDateTime;
