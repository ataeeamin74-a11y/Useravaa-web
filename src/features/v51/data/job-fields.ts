export const jobFieldTaxonomy = [
  "محصول و تجربه کاربر",
  "طراحی گرافیک و هویت بصری",
  "فنی و مهندسی نرم‌افزار",
  "علوم داده و هوش مصنوعی",
  "مارکتینگ و برند",
  "تحلیل و توسعه کسب‌وکار",
  "عملیات",
  "تجربه مشتری",
  "پشتیبانی مشتریان",
  "فروش و بازرگانی",
  "استراتژی و مدل کسب‌وکار",
  "مالی، حقوقی و سرمایه‌گذاری",
  "منابع انسانی و فرهنگ سازمانی",
  "مدیریت، رهبری و کارآفرینی"
] as const;

export type JobField = (typeof jobFieldTaxonomy)[number];

export const legacyJobFieldMappings: Record<string, JobField> = {
  محصول: "محصول و تجربه کاربر",
  "تجربه کاربر": "محصول و تجربه کاربر",
  "طراحی محصول": "محصول و تجربه کاربر",
  "هوش تجاری": "علوم داده و هوش مصنوعی",
  "تحلیل داده": "علوم داده و هوش مصنوعی",
  داشبورد: "علوم داده و هوش مصنوعی",
  SQL: "علوم داده و هوش مصنوعی",
  "گزارش‌سازی": "علوم داده و هوش مصنوعی",
  رشد: "مارکتینگ و برند",
  مارکتینگ: "مارکتینگ و برند",
  "جذب کاربر": "مارکتینگ و برند",
  مهندسی: "فنی و مهندسی نرم‌افزار",
  "رهبری تیم": "مدیریت، رهبری و کارآفرینی",
  "منابع انسانی": "منابع انسانی و فرهنگ سازمانی",
  افراد: "منابع انسانی و فرهنگ سازمانی",
  "مسیر شغلی": "منابع انسانی و فرهنگ سازمانی",
  مصاحبه: "منابع انسانی و فرهنگ سازمانی",
  پورتفولیو: "طراحی گرافیک و هویت بصری"
};

export const invalidLegacyJobFieldValues = ["محصول", "تحلیل داده", "مهندسی", "رشد", "هوش تجاری", "طراحی محصول"] as const;

export function isValidJobField(value: string): value is JobField {
  return jobFieldTaxonomy.includes(value as JobField);
}

export function mapLegacyJobField(value: string): JobField | null {
  if (isValidJobField(value)) {
    return value;
  }

  return legacyJobFieldMappings[value] ?? null;
}

export function mapLegacyJobFields(values: readonly string[]) {
  return Array.from(new Set(values.map((value) => mapLegacyJobField(value)).filter((value): value is JobField => Boolean(value))));
}

export function validateJobField(value: string) {
  return isValidJobField(value) ? "" : "حوزه شغلی را از لیست انتخاب کنید.";
}

export function validateJobTitle(value: string) {
  const title = value.trim();

  if (title.length < 2 || title.length > 100) {
    return "عنوان شغلی را کامل وارد کنید.";
  }

  return "";
}
