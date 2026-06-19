import fs from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ConfirmedSessionIllustration } from "@/features/v51/conversations/components/ConfirmedSessionIllustration";
import { ConversationDetailPanel } from "@/features/v51/conversations/components/ConversationDetailPanel";
import { RequestSentIllustration } from "@/features/v51/conversations/components/RequestSentIllustration";
import { CheckoutPage, RequestSentSuccessPanel } from "@/features/v51/conversations/pages/CheckoutPage";
import { ConfirmedSelectionSuccessPage } from "@/features/v51/conversations/pages/SelectTimePage";
import { ConversationsPage } from "@/features/v51/conversations/pages/ConversationsPage";
import { ProposeTimesPage } from "@/features/v51/conversations/pages/ProposeTimesPage";
import { conversations, type ConversationFixture } from "@/features/v51/data/conversations";

function byId(id: string) {
  const conversation = conversations.find((item) => item.id === id);

  expect(conversation).toBeDefined();

  return conversation!;
}

function readProjectFile(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

function readConversationFlowSource() {
  const sourceFiles = [
    "src/app/dev/pages/page.tsx",
    "src/features/v51/data/conversations.ts",
    "src/features/v51/profile/ProfileRequestPanel.tsx",
    "src/features/v51/conversations/components/CheckoutSummary.tsx",
    "src/features/v51/conversations/components/ConversationDetailPanel.tsx",
    "src/features/v51/conversations/components/RequestSentIllustration.tsx",
    "src/features/v51/conversations/components/ConversationTabs.tsx",
    "src/features/v51/conversations/components/RequestSummary.tsx",
    "src/features/v51/conversations/components/TimeProposalPicker.tsx",
    "src/features/v51/conversations/pages/CheckoutPage.tsx",
    "src/features/v51/conversations/pages/ProposeTimesPage.tsx",
    "src/features/v51/conversations/pages/RequestConversationPage.tsx",
    "src/features/v51/conversations/pages/SelectTimePage.tsx",
    "src/app/conversations/[conversationId]/propose-times/page.tsx",
    "src/app/conversations/[conversationId]/select-time/page.tsx"
  ];

  return sourceFiles.map(readProjectFile).join("\n");
}

function extractConfirmedSuccessCopy(html: string) {
  const start = html.indexOf('data-testid="confirmed-session-success-block"');
  const illustration = html.indexOf('data-testid="confirmed-session-illustration"', start);

  expect(start).toBeGreaterThanOrEqual(0);
  expect(illustration).toBeGreaterThan(start);

  return html.slice(start, illustration);
}

function countOccurrences(source: string, copy: string) {
  return source.split(copy).length - 1;
}

describe("Phase 02 V51 conversation copy and confirmed session illustration", () => {
  it("normalizes conversation copy to زمان and the exact free request CTA", () => {
    const oldTimeWord = ["و", "قت"].join("");
    const oldFreeRequestCopy = ["ارسال درخواست", "رایگان"].join(" ");
    const oldFreeShortCopy = ["ارسال", "رایگان"].join(" ");
    const source = readConversationFlowSource();
    const rendered = [
      renderToStaticMarkup(<ConversationsPage initialConversations={conversations} />),
      renderToStaticMarkup(<ProposeTimesPage initialConversation={byId("conv-provider-request")} />),
      renderToStaticMarkup(<CheckoutPage initialConversation={byId("conv-free-help")} />)
    ].join("\n");

    [
      "درخواست ارسالی",
      "درخواست دریافتی",
      "پیشنهاد سه زمان",
      "ارسال سه زمان پیشنهادی",
      "سه زمان پیشنهادی",
      "زمان‌ها ارسال شده‌اند",
      "زمان‌های پیشنهادی آماده انتخاب‌اند",
      "زمان‌های پیشنهادی منقضی شدند",
      "درخواست زمان‌های جدید",
      "ارسال درخواست جلسه رایگان"
    ].forEach((copy) => {
      expect(source + rendered).toContain(copy);
    });

    [
      ["پیشنهاد سه", oldTimeWord].join(" "),
      ["ارسال سه", oldTimeWord, "پیشنهادی"].join(" "),
      ["سه", oldTimeWord, "پیشنهادی"].join(" "),
      [oldTimeWord, "ها ارسال شده‌اند"].join("‌"),
      oldFreeRequestCopy,
      oldFreeShortCopy
    ].forEach((copy) => {
      expect(source).not.toContain(copy);
      expect(rendered).not.toContain(copy);
    });
  });

  it("renders the free request checkout without wallet, gateway, or fund-holding copy", () => {
    const html = renderToStaticMarkup(<CheckoutPage initialConversation={byId("conv-free-help")} />);

    expect(html).toContain("ثبت نهایی درخواست جلسه رایگان");
    expect(html).toContain("ارسال درخواست جلسه رایگان");
    expect(html).toContain("این درخواست نیازی به پرداخت ندارد");
    expect(html).not.toContain("کیف پول");
    expect(html).not.toContain("درگاه");
    expect(html).not.toContain("پرداخت از کیف پول");
    expect(html).not.toContain("پرداخت باقی‌مانده و ارسال درخواست");
    expect(html).not.toContain("پرداخت امن و ارسال درخواست");
  });

  it("renders paid request checkout with locked Route 4 summary and assurance copy", () => {
    const html = renderToStaticMarkup(<CheckoutPage initialConversation={byId("conv-awaiting-payment")} />);
    const heldFundsCopy = "مبلغ تا قطعی‌شدن جلسه نزد یوزراوا نگه داشته می‌شود";
    const notConfirmedCopy = "پرداخت موفق به معنی قطعی‌شدن جلسه نیست";

    expect(html).toContain("پرداخت امن درخواست جلسه");
    expect(html).toContain("خلاصه درخواست");
    expect(html).toContain("تجربه‌آفرین");
    expect(html).toContain("مدت گفت‌وگو");
    expect(html).toContain("موضوع کلی");
    expect(html).toContain("توضیح شما");
    expect(html).toContain("مبلغ");
    expect(html).toContain("با پرداخت، درخواست شما برای تجربه‌آفرین ارسال می‌شود");
    expect(html).toContain("روش پرداخت");
    expect(html).toContain("پرداخت اینترنتی");
    expect(html).toContain("موقتاً غیرفعال");
    expect(html).toContain("کارت‌به‌کارت");
    expect(html).toContain("ثبت پرداخت برای بررسی");
    expect(html).toContain(heldFundsCopy);
    expect(countOccurrences(html, heldFundsCopy)).toBe(1);
    expect(countOccurrences(html, notConfirmedCopy)).toBeLessThanOrEqual(1);
    expect(html).not.toContain("جلسه قطعی شد");
    expect(html).not.toContain("اطلاعات هماهنگی جلسه");
  });

  it("keeps the manual payment card focused on card-to-card submission", () => {
    const html = renderToStaticMarkup(<CheckoutPage initialConversation={byId("conv-awaiting-payment")} />);
    const paymentStart = html.indexOf("روش پرداخت");

    expect(paymentStart).toBeGreaterThanOrEqual(0);

    const paymentCard = html.slice(paymentStart);

    expect(paymentCard).toContain("پرداخت اینترنتی");
    expect(paymentCard).toContain("موقتاً غیرفعال");
    expect(paymentCard).toContain("کارت‌به‌کارت");
    expect(paymentCard).toContain("6104331155545750");
    expect(paymentCard).toContain("فاطمه اصغری");
    expect(paymentCard).toContain("شماره مرجع/ارجاع پرداخت");
    expect(paymentCard).toContain("تصویر رسید پرداخت");
    expect(paymentCard).toContain("ثبت پرداخت برای بررسی");
    expect(paymentCard).not.toContain("پرداخت موفق به معنی قطعی‌شدن جلسه نیست");
    expect(paymentCard).not.toContain("جلسه قطعی شد");
    expect(paymentCard).not.toContain("اطلاعات هماهنگی جلسه");
  });

  it("renders a distinct paid Route 4 request-sent success panel", () => {
    const html = renderToStaticMarkup(<RequestSentSuccessPanel conversation={byId("conv-awaiting-payment")} isFreeHelp={false} />);

    expect(html).toContain('data-testid="request-sent-success-panel"');
    expect(html).toContain('data-testid="request-sent-illustration"');
    expect(html).toContain("درخواست شما ارسال شد");
    expect(html).toContain("درخواست پرداخت‌شده شما همراه با موضوع گفت‌وگو برای تجربه‌آفرین ارسال شد");
    expect(html).toContain("وضعیت درخواست: در انتظار پیشنهاد زمان");
    expect(html).toContain("مبلغ تا قطعی‌شدن جلسه نزد یوزراوا نگه داشته می‌شود");
    expect(html).toContain("مشاهده درخواست");
    expect(html).toContain("بازگشت به کشف تجربه‌ها");
    expect(html).not.toContain('data-testid="confirmed-session-illustration"');
    expect(html).not.toContain("جلسه قطعی شد");
    expect(html).not.toContain("مشاهده جلسه");
    expect(html).not.toContain("زمان جلسه");
    expect(html).not.toContain("اطلاعات هماهنگی جلسه");
    expect(html).not.toContain("ورود به جلسه");
  });

  it("renders a distinct free Route 4 request-sent success panel without payment copy", () => {
    const html = renderToStaticMarkup(<RequestSentSuccessPanel conversation={byId("conv-free-help")} isFreeHelp />);

    expect(html).toContain('data-testid="request-sent-success-panel"');
    expect(html).toContain('data-testid="request-sent-illustration"');
    expect(html).toContain("درخواست شما ارسال شد");
    expect(html).toContain("درخواست جلسه رایگان شما همراه با موضوع گفت‌وگو برای تجربه‌آفرین ارسال شد");
    expect(html).toContain("وضعیت درخواست: در انتظار پیشنهاد زمان");
    expect(html).toContain("مشاهده درخواست");
    expect(html).toContain("بازگشت به کشف تجربه‌ها");
    expect(html).not.toContain("کیف پول");
    expect(html).not.toContain("درگاه");
    expect(html).not.toContain("پرداخت");
    expect(html).not.toContain("مبلغ تا قطعی‌شدن جلسه نزد یوزراوا نگه داشته می‌شود");
    expect(html).not.toContain('data-testid="confirmed-session-illustration"');
    expect(html).not.toContain("جلسه قطعی شد");
    expect(html).not.toContain("زمان جلسه");
    expect(html).not.toContain("اطلاعات هماهنگی جلسه");
  });

  it("renders the confirmed success block only for confirmed sessions", () => {
    const confirmedHtml = renderToStaticMarkup(<ConversationDetailPanel conversation={byId("conv-scheduled")} />);

    expect(confirmedHtml).toContain('data-testid="confirmed-session-success-block"');
    expect(confirmedHtml).not.toContain('data-testid="request-sent-illustration"');
    expect(confirmedHtml).toContain("جلسه قطعی شد");
    expect(confirmedHtml).toContain("زمان جلسه انتخاب شد");
    expect(confirmedHtml).toContain("اطلاعات هماهنگی");
    expect(confirmedHtml).toContain('href="#coordination"');

    const nonConfirmedConversations: ConversationFixture[] = [
      byId("conv-awaiting-payment"),
      byId("conv-time-options"),
      byId("conv-expired"),
      { ...byId("conv-scheduled"), id: "test-rejected", status: "rejected", state: "rejected" },
      { ...byId("conv-scheduled"), id: "test-cancelled", status: "cancelled", state: "cancelled" },
      { ...byId("conv-scheduled"), id: "test-refunded", status: "refunded", state: "refunded" }
    ];

    nonConfirmedConversations.forEach((conversation) => {
      const html = renderToStaticMarkup(<ConversationDetailPanel conversation={conversation} />);

      expect(html).not.toContain('data-testid="confirmed-session-success-block"');
      expect(html).not.toContain("جلسه قطعی شد");
    });
  });

  it("renders the full confirmed success hero after selecting a valid proposed time", () => {
    const html = renderToStaticMarkup(<ConfirmedSelectionSuccessPage conversation={byId("conv-scheduled")} />);

    expect(html).toContain('data-testid="confirmed-session-success-block"');
    expect(html).toContain('data-testid="confirmed-session-illustration"');
    expect(html).toContain("جلسه قطعی شد");
    expect(html).toContain("زمان جلسه انتخاب شد و اطلاعات هماهنگی مربوط به این گفت‌وگو در دسترس است.");
    expect(html).toContain("زمان جلسه");
    expect(html).toContain("مشاهده اطلاعات هماهنگی");
    expect(html).toContain('href="#coordination"');
    expect(html).toContain('id="coordination"');
    expect(html).toContain("بازگشت به جلسه‌ها");
    expect(html).toContain("موضوع گفت‌وگو");
    expect(html).toContain("مدت گفت‌وگو");
    expect(html).not.toContain('data-testid="request-sent-illustration"');
    [
      "پرداخت امن و ارسال درخواست",
      "ارسال درخواست جلسه رایگان",
      "انتخاب زمان",
      "پیشنهاد سه زمان",
      "ارسال سه زمان پیشنهادی",
      "در انتظار پیشنهاد زمان",
      "در انتظار انتخاب زمان",
      "زمان‌های پیشنهادی منقضی شدند",
      "درخواست زمان‌های جدید",
      "تسویه",
      "برداشت",
      "درآمد قابل برداشت"
    ].forEach((copy) => {
      expect(html).not.toContain(copy);
    });
  });

  it("keeps payment, selection, proposal, and settlement CTAs out of the confirmed success block", () => {
    const html = renderToStaticMarkup(<ConversationDetailPanel conversation={byId("conv-scheduled")} />);
    const successCopy = extractConfirmedSuccessCopy(html);

    expect(successCopy).toContain("مشاهده اطلاعات هماهنگی");
    expect(successCopy).toContain("بازگشت به جلسه‌ها");
    ["پرداخت", "انتخاب زمان", "پیشنهاد سه زمان", "درخواست دوباره", "تسویه", "برداشت"].forEach((copy) => {
      expect(successCopy).not.toContain(copy);
    });
  });

  it("keeps the full confirmed session detail focused on final time and coordination", () => {
    const html = renderToStaticMarkup(<ConversationDetailPanel conversation={byId("conv-scheduled")} />);

    expect(html).toContain("جزئیات جلسه");
    expect(html).toContain("زمان جلسه");
    expect(html).toContain("اطلاعات هماهنگی جلسه");
    expect(html).toContain("مدت گفت‌وگو");
    expect(html).toContain("موضوع گفت‌وگو");
    expect(html).toContain("وضعیت");
    expect(html).toContain("بازگشت به جلسه‌ها");
    ["پرداخت امن و ارسال درخواست", "ارسال درخواست جلسه رایگان", "پیشنهاد سه زمان", "انتخاب زمان", "درخواست زمان‌های جدید", "تسویه", "برداشت", "درآمد قابل برداشت"].forEach((copy) => {
      expect(html).not.toContain(copy);
    });
  });

  it("route guards redirect confirmed sessions away from stale select/propose routes", () => {
    const proposeRoute = readProjectFile("src/app/conversations/[conversationId]/propose-times/page.tsx");
    const selectRoute = readProjectFile("src/app/conversations/[conversationId]/select-time/page.tsx");

    [proposeRoute, selectRoute].forEach((source) => {
      expect(source).toContain("getConversationRouteAccess");
      expect(source).toContain('disabledReason === "SESSION_ALREADY_CONFIRMED"');
      expect(source).toContain("redirect(access.fallbackHref)");
    });
  });

  it("builds the confirmed illustration from brand-safe UI parts", () => {
    const html = renderToStaticMarkup(<ConfirmedSessionIllustration selectedTimeLabel="ساعت ۱۵:۰۰" />);
    const css = readProjectFile("src/features/v51/conversations/components/ConfirmedSessionIllustration.module.css");

    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('data-testid="confirmed-session-illustration"');
    expect(html.match(/data-illustration-part="profile-card"/g)).toHaveLength(2);
    expect(html.match(/data-illustration-part="time-capsule"/g)).toHaveLength(3);
    expect(html.match(/data-selected="true"/g)).toHaveLength(1);
    expect(html).toContain('data-illustration-part="success-node"');
    expect(html).toContain('data-illustration-part="session-mini-card"');
    expect(css).toContain("var(--teal)");
    expect(css).toContain("var(--blue)");
    expect(css).toContain("prefers-reduced-motion");
    expect(css).not.toMatch(/#(?:f5b301|f79009|fffaeb|f04438|b42318|7c3aed|a855f7)/i);
    expect(`${html}\n${css}`).not.toMatch(/confetti|trophy|rocket|gold|orange|purple|yellow/i);
  });

  it("builds the Route 4 request-sent illustration from waiting-for-times UI parts", () => {
    const html = renderToStaticMarkup(<RequestSentIllustration />);
    const css = readProjectFile("src/features/v51/conversations/components/RequestSentIllustration.module.css");

    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('data-testid="request-sent-illustration"');
    expect(html.match(/data-illustration-part="request-card"/g)).toHaveLength(1);
    expect(html.match(/data-illustration-part="provider-card"/g)).toHaveLength(1);
    expect(html.match(/data-illustration-part="pending-time-capsule"/g)).toHaveLength(3);
    expect(html).toContain('data-illustration-part="request-sent-node"');
    expect(html).toContain("در انتظار پیشنهاد زمان");
    expect(html).not.toContain('data-selected="true"');
    expect(html).not.toContain('data-illustration-part="session-mini-card"');
    expect(html).not.toContain("جلسه قطعی");
    expect(html).not.toContain("زمان جلسه");
    expect(html).not.toContain("اطلاعات هماهنگی");
    expect(css).toContain("var(--teal)");
    expect(css).toContain("var(--blue)");
    expect(css).toContain("prefers-reduced-motion");
    expect(css).not.toMatch(/#(?:f5b301|f79009|fffaeb|f04438|b42318|7c3aed|a855f7)/i);
    expect(`${html}\n${css}`).not.toMatch(/confetti|trophy|rocket|gold|orange|purple|yellow/i);
  });
});
