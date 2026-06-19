import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { Header } from "@/components/header/Header";
import SupportPage from "@/app/support/page";
import { filterSupportFaqItems, supportFaqItems, supportFaqNoResults } from "@/features/v51/support/supportFaqData";

vi.mock("next/navigation", () => ({
  usePathname: () => "/support"
}));

vi.mock("@/features/v51/support/SupportFaqClient", () => ({
  SupportFaqClient: () => <section data-testid="support-faq">سوالات متداول</section>
}));

describe("Useravaa support and FAQ route", () => {
  it("connects the header support entry to the support page", () => {
    const html = renderToStaticMarkup(<Header />);

    expect(html).toContain('href="/support"');
    expect(html).toContain('aria-label="پشتیبانی"');
    expect(html).toContain("پشتیبانی");
  });

  it("renders support email access above FAQ content", () => {
    const html = renderToStaticMarkup(<SupportPage />);

    expect(html).toContain("پشتیبانی و سوالات متداول");
    expect(html).toContain("ارتباط با پشتیبانی");
    expect(html).toContain("ایمیل پشتیبانی");
    expect(html).toContain("Support@useravaa.ir");
    expect(html).toContain('href="mailto:Support@useravaa.ir"');
    expect(html).toContain('dir="ltr"');
    expect(html).toContain("ارسال ایمیل به پشتیبانی");
    expect(html.indexOf("ارتباط با پشتیبانی")).toBeLessThan(html.indexOf('data-testid="support-faq"'));
  });

  it("renders exactly 8 initial FAQ questions from static data", () => {
    expect(supportFaqItems).toHaveLength(8);

    supportFaqItems.forEach((item) => {
      expect(item.id).toBeTruthy();
      expect(item.category).toBeTruthy();
      expect(item.question).toBeTruthy();
      expect(item.answer).toBeTruthy();
    });
  });

  it("defines stable ids for accessible accordion controls", () => {
    const answerIds = supportFaqItems.map((item) => `support-faq-answer-${item.id}`);

    expect(new Set(answerIds).size).toBe(8);
    expect(answerIds).toContain("support-faq-answer-what-is-useravaa");
  });

  it("filters FAQ items by question, answer, and category", () => {
    expect(filterSupportFaqItems(supportFaqItems, "")).toHaveLength(8);
    expect(filterSupportFaqItems(supportFaqItems, "پرداخت").map((item) => item.id)).toEqual(
      expect.arrayContaining(["payment-does-not-confirm-session", "held-amount", "selecting-time-no-new-payment"])
    );
    expect(filterSupportFaqItems(supportFaqItems, "کیف پول").map((item) => item.id)).toEqual(
      expect.arrayContaining(["payment-does-not-confirm-session", "held-amount"])
    );
    expect(filterSupportFaqItems(supportFaqItems, "زمان").map((item) => item.id)).toEqual(
      expect.arrayContaining(["how-request-is-sent", "three-proposed-times", "selecting-time-no-new-payment"])
    );
    expect(filterSupportFaqItems(supportFaqItems, "سه زمان").map((item) => item.id)).toEqual(
      expect.arrayContaining(["how-request-is-sent", "payment-does-not-confirm-session", "three-proposed-times"])
    );
    expect(filterSupportFaqItems(supportFaqItems, "کد").map((item) => item.id)).toEqual(["attendance-verification-code"]);
    expect(filterSupportFaqItems(supportFaqItems, "پشتیبانی").map((item) => item.id)).toEqual(["contact-support"]);
  });

  it("keeps FAQ copy aligned with locked support and session wording", () => {
    const faqCopy = supportFaqItems.map((item) => `${item.category} ${item.question} ${item.answer}`).join(" ");

    expect(faqCopy).not.toContain("وقت");
    expect(faqCopy).not.toContain("سه وقت پیشنهادی");
    expect(faqCopy).not.toContain("وقت پیشنهادی");
    expect(faqCopy).not.toContain("رزرو فوری");
    expect(faqCopy).not.toContain("وقت آزاد");
    expect(faqCopy).not.toContain("تقویم آزاد");
    expect(faqCopy).not.toContain("ارسال درخواست رایگان");
    expect(faqCopy).not.toContain("ارسال رایگان");
    expect(faqCopy).not.toContain("تیکت");
    expect(faqCopy).not.toContain("چت");
    expect(faqCopy).not.toContain("بات");
    expect(faqCopy).not.toContain("CRM");
  });

  it("defines a calm no-results state with mailto support CTA", () => {
    expect(filterSupportFaqItems(supportFaqItems, "عبارت بدون نتیجه")).toHaveLength(0);
    expect(supportFaqNoResults.title).toBe("نتیجه‌ای پیدا نشد");
    expect(supportFaqNoResults.text).toContain("عبارت دیگری را جستجو کنید");
    expect(supportFaqNoResults.cta).toBe("ارسال ایمیل به پشتیبانی");
  });
});
