import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CareerLeadCaptureForm } from "@/features/career/CareerLeadCaptureSheet";
import {
  CAREER_LEAD_CAPTURE_DISMISSAL_MS,
  CAREER_LEAD_CAPTURE_DISMISSED_AT_KEY,
  CAREER_LEAD_CAPTURE_SUBMITTED_KEY,
  isValidCareerLeadContact,
  rememberCareerLeadCaptureDismissal,
  rememberCareerLeadCaptureSubmission,
  shouldRequestCareerLeadCapture,
  shouldShowCareerLeadCapture
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

  it("accepts email and phone formats while rejecting invalid contact", () => {
    expect(isValidCareerLeadContact("path@example.com")).toBe(true);
    expect(isValidCareerLeadContact("09121234567")).toBe(true);
    expect(isValidCareerLeadContact("not-contact")).toBe(false);
  });

  it("renders the approved Persian form copy without parked-product language", () => {
    const html = renderToStaticMarkup(
      <CareerLeadCaptureForm
        contact=""
        stage=""
        uncertainty=""
        companyWebsite=""
        errorMessage=""
        isSubmitting={false}
        onContactChange={() => undefined}
        onStageChange={() => undefined}
        onUncertaintyChange={() => undefined}
        onCompanyWebsiteChange={() => undefined}
        onSubmit={() => undefined}
        onDismiss={() => undefined}
      />
    );
    const sheetSource = readFileSync("src/features/career/CareerLeadCaptureSheet.tsx", "utf8");

    expect(sheetSource).toContain("مسیرهای شغلی‌ات را برای ادامه بررسی نگه داریم؟");
    expect(sheetSource).toContain("یک راه ارتباطی بگذار تا بعداً بتوانی مسیرهای شغلی و مقایسه‌هایت را پیگیری کنی.");
    expect(sheetSource).toContain("مثلاً نمی‌دانم این مسیر شغلی با من تناسب دارد یا نه");
    expect(sheetSource).toContain("ذخیره شد. می‌توانی از «مسیرهای شغلی من» ادامه بدهی.");
    expect(html).toContain("موبایل یا ایمیل");
    expect(html).toContain("ذخیره و ادامه بررسی");
    expect(html).toContain("فعلاً نه");
    expect(`${html}\n${sheetSource}`).not.toMatch(/منتور|تجربه‌آفرین|مشاوره|جلسه|رزرو|پرداخت|درخواست تجربه|متخصص|صحبت با آدم باتجربه|ثبت‌نام برای جلسه/);
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
