import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CareerLeadCaptureForm } from "@/features/career/CareerLeadCaptureSheet";
import {
  CAREER_LEAD_CAPTURE_DISMISSAL_MS,
  CAREER_LEAD_CAPTURE_DISMISSED_AT_KEY,
  CAREER_LEAD_FULL_NAME_ERROR,
  CAREER_LEAD_PHONE_ERROR,
  CAREER_LEAD_CAPTURE_SUBMITTED_KEY,
  isValidCareerLeadContact,
  normalizeIranianMobile,
  rememberCareerLeadCaptureDismissal,
  rememberCareerLeadCaptureSubmission,
  shouldRequestCareerLeadCapture,
  shouldShowCareerLeadCapture,
  validateCareerLeadFormInput
} from "@/features/career/career-lead-capture";

function createMemoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    values
  };
}

describe("career path-seeker lead capture", () => {
  it("only requests the sheet after a new path or comparison save succeeds", () => {
    expect(shouldRequestCareerLeadCapture(false, true)).toBe(true);
    expect(shouldRequestCareerLeadCapture(false, false)).toBe(false);
    expect(shouldRequestCareerLeadCapture(true, true)).toBe(false);

    const pathSource = readFileSync("src/features/career/PathsPage.tsx", "utf8");
    const compareSource = readFileSync("src/features/career/ComparePage.tsx", "utf8");
    expect(pathSource).toContain('source: "path_save"');
    expect(compareSource).toContain('source: "comparison_save"');
  });

  it("suppresses the sheet after submission and for seven days after dismissal", () => {
    const storage = createMemoryStorage();
    const now = 1_800_000_000_000;

    expect(shouldShowCareerLeadCapture(storage, now)).toBe(true);
    rememberCareerLeadCaptureDismissal(storage, now);
    expect(storage.values.get(CAREER_LEAD_CAPTURE_DISMISSED_AT_KEY)).toBe(String(now));
    expect(shouldShowCareerLeadCapture(storage, now + CAREER_LEAD_CAPTURE_DISMISSAL_MS - 1)).toBe(false);
    expect(shouldShowCareerLeadCapture(storage, now + CAREER_LEAD_CAPTURE_DISMISSAL_MS)).toBe(true);

    rememberCareerLeadCaptureSubmission(storage);
    expect(storage.values.get(CAREER_LEAD_CAPTURE_SUBMITTED_KEY)).toBe("1");
    expect(shouldShowCareerLeadCapture(storage, now + CAREER_LEAD_CAPTURE_DISMISSAL_MS)).toBe(false);
  });

  it("accepts only standard Iranian mobile numbers and normalizes them", () => {
    expect(isValidCareerLeadContact("path@example.com")).toBe(false);
    expect(isValidCareerLeadContact("09123456789")).toBe(true);
    expect(normalizeIranianMobile("09123456789")).toBe("+989123456789");
    expect(normalizeIranianMobile("9123456789")).toBe("+989123456789");
    expect(normalizeIranianMobile("+989123456789")).toBe("+989123456789");
    expect(normalizeIranianMobile("989123456789")).toBe("+989123456789");
    expect(normalizeIranianMobile("۰۹۱۲۳۴۵۶۷۸۹")).toBe("+989123456789");
    expect(normalizeIranianMobile("02112345678")).toBeUndefined();
    expect(normalizeIranianMobile("55141488855")).toBeUndefined();
    expect(normalizeIranianMobile("091234")).toBeUndefined();
    expect(normalizeIranianMobile("091234567890")).toBeUndefined();
    expect(normalizeIranianMobile("abcd")).toBeUndefined();
    expect(normalizeIranianMobile("+971501234567")).toBeUndefined();
  });

  it("validates full name before lead API submission can happen", () => {
    expect(validateCareerLeadFormInput("علی", "09123456789")).toEqual({
      ok: false,
      fullNameError: CAREER_LEAD_FULL_NAME_ERROR
    });
    expect(validateCareerLeadFormInput("123 456", "09123456789")).toEqual({
      ok: false,
      fullNameError: CAREER_LEAD_FULL_NAME_ERROR
    });
    expect(validateCareerLeadFormInput("علی رضایی", "55141488855")).toEqual({
      ok: false,
      phoneError: CAREER_LEAD_PHONE_ERROR
    });
    expect(validateCareerLeadFormInput("علی رضایی", "09123456789")).toEqual({
      ok: true,
      fullName: "علی رضایی",
      phone: "+989123456789"
    });
  });

  it("renders the approved Persian mobile-only form copy without parked-product language", () => {
    const html = renderToStaticMarkup(
      <CareerLeadCaptureForm
        fullName=""
        phoneNumber=""
        stage=""
        uncertainty=""
        companyWebsite=""
        fullNameError=""
        phoneError=""
        formError=""
        isSubmitting={false}
        onFullNameChange={() => undefined}
        onPhoneNumberChange={() => undefined}
        onStageChange={() => undefined}
        onUncertaintyChange={() => undefined}
        onCompanyWebsiteChange={() => undefined}
        onSubmit={() => undefined}
        onDismiss={() => undefined}
      />
    );
    const sheetSource = readFileSync("src/features/career/CareerLeadCaptureSheet.tsx", "utf8");

    expect(sheetSource).toContain("مسیرهای شغلی‌ات را برای ادامه بررسی نگه داریم؟");
    expect(sheetSource).toContain("نام و شماره‌ات را بگذار تا بعداً بتوانی مسیرهای شغلی و مقایسه‌هایت را پیگیری کنی.");
    expect(sheetSource).toContain("مثلاً نمی‌دانم این مسیر شغلی با من تناسب دارد یا نه");
    expect(sheetSource).toContain("ذخیره شد. می‌توانی از «مسیرهای شغلی من» ادامه بدهی.");
    expect(html).toContain("نام و نام خانوادگی");
    expect(html).toContain("مثلاً علی رضایی");
    expect(html).toContain("شماره موبایل");
    expect(html).toContain("+98");
    expect(html).toContain("ذخیره و ادامه بررسی");
    expect(html).toContain("فعلاً نه");
    expect(`${html}\n${sheetSource}`).not.toMatch(/موبایل یا ایمیل|name@email|ایمیل|منتور|تجربه‌آفرین|مشاوره|جلسه|رزرو|پرداخت|درخواست تجربه|متخصص|صحبت با آدم باتجربه|ثبت‌نام|ورود یا ثبت نام/);
  });

  it("keeps lead failure isolated and coordinates with the iOS guide", () => {
    const pathSource = readFileSync("src/features/career/PathsPage.tsx", "utf8");
    const compareSource = readFileSync("src/features/career/ComparePage.tsx", "utf8");
    const sheetSource = readFileSync("src/features/career/CareerLeadCaptureSheet.tsx", "utf8");
    const iosSource = readFileSync("src/features/pwa/IosInstallGuide.tsx", "utf8");

    expect(pathSource.indexOf("onSave(path.id)")).toBeLessThan(pathSource.lastIndexOf("requestCareerLeadCapture"));
    expect(compareSource.indexOf("saveComparison(selectedPathIds)")).toBeLessThan(compareSource.lastIndexOf("requestCareerLeadCapture"));
    expect(sheetSource).toContain("الان ذخیره نشد. کمی بعد دوباره امتحان کن.");
    expect(sheetSource).toContain("[data-ios-install-guide-dialog]");
    expect(iosSource).toContain("[data-career-lead-capture-dialog]");
  });
});
