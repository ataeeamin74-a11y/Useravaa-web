import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ActionsPage } from "@/features/v51/actions/pages/ActionsPage";
import { ConversationsPage } from "@/features/v51/conversations/pages/ConversationsPage";
import { conversations, reliabilityMockNow, type ConversationFixture } from "@/features/v51/data/conversations";

function byId(id: string) {
  const conversation = conversations.find((item) => item.id === id);

  expect(conversation).toBeDefined();

  return conversation!;
}

function startedConversation(conversation: ConversationFixture): ConversationFixture {
  return {
    ...conversation,
    selectedTime: conversation.selectedTime
      ? {
          ...conversation.selectedTime,
          startAt: new Date(new Date(reliabilityMockNow).getTime() - 10 * 60 * 1000).toISOString()
        }
      : conversation.selectedTime
  };
}

describe("sessions status inbox and actions task inbox", () => {
  it("renders sessions as a compact status inbox with short tabs and collapsible groups", () => {
    const html = renderToStaticMarkup(<ConversationsPage initialConversations={conversations} />);

    expect(html).toContain("جلسه‌ها");
    expect(html).toContain("درخواست‌ها و جلسه‌های خود را پیگیری کنید.");
    expect(html).toContain("ارسالی ۱۳");
    expect(html).toContain("دریافتی ۸");
    expect(html).toContain("درخواست‌ها و جلسه‌هایی که شما شروع کرده‌اید.");
    expect(html).toContain("مشاهده اقدام‌ها");
    expect(html).toContain("<details");
    expect(html).toContain("در جریان");
    expect(html).toContain("جلسه‌های قطعی");
    expect(html).toContain("گذشته و بسته‌شده");
  });

  it("hides amount values on sent session rows and shows amount context on received rows", () => {
    const sentHtml = renderToStaticMarkup(<ConversationsPage initialConversations={conversations} initialTab="outgoing" />);
    const receivedHtml = renderToStaticMarkup(<ConversationsPage initialConversations={conversations} initialTab="incoming" />);

    expect(sentHtml).toContain("درخواست پرداخت‌شده");
    expect(sentHtml).not.toContain("تومان");
    expect(receivedHtml).toContain("مبلغ گفت‌وگو");
    expect(receivedHtml).toContain("تومان");
  });

  it("shows the requester attendance code on the sent sessions page", () => {
    const html = renderToStaticMarkup(<ConversationsPage initialConversations={[byId("conv-scheduled")]} initialTab="outgoing" />);

    expect(html).toContain("کد تأیید برگزاری جلسه");
    expect(html).toContain("48291");
    expect(html).toContain("کپی");
    expect(html).not.toContain("کپی کد");
  });

  it("lets provider register attendance after session start without exposing the raw code", () => {
    const providerConversation = startedConversation(byId("conv-provider-confirmed"));
    const html = renderToStaticMarkup(<ConversationsPage initialConversations={[providerConversation]} initialTab="incoming" />);

    expect(html).toContain("ثبت برگزاری جلسه");
    expect(html).toContain("کد تأیید برگزاری جلسه");
    expect(html).toContain("مثلاً ۴۸۲۹۱");
    expect(html).not.toContain("72904");
  });

  it("renders the actions task inbox with urgency groups, filters, and locked badges", () => {
    const html = renderToStaticMarkup(<ActionsPage initialConversations={conversations} />);

    expect(html).toContain("اقدام‌ها");
    expect(html).toContain("کارهایی که برای ادامه مسیر نیاز به اقدام شما دارند.");
    expect(html).toContain("همه");
    expect(html).toContain("جلسه‌ها");
    expect(html).toContain("پرداخت");
    expect(html).toContain("پروفایل");
    expect(html).toContain("کیف پول");
    expect(html).toContain("فوری");
    expect(html).toContain("امروز");
    expect(html).toContain("نیازمند تکمیل");
    expect(html).toContain("درخواست ارسالی");
    expect(html).toContain("درخواست دریافتی");
    expect(html).toContain("حساب کاربری");
    expect(html).toContain("مبلغ گفت‌وگو");
    expect(html).not.toContain("در نقش درخواست‌دهنده");
    expect(html).not.toContain("در نقش تجربه‌آفرین");
    expect(html).not.toMatch(/لطفا(?!ً)/);
  });

  it("does not show amount values for sent-only actions", () => {
    const html = renderToStaticMarkup(<ActionsPage initialConversations={[byId("conv-time-options")]} />);

    expect(html).toContain("درخواست ارسالی");
    expect(html).toContain("انتخاب زمان");
    expect(html).not.toContain("تومان");
  });

  it("renders the compact empty state when there are no open actions", () => {
    const html = renderToStaticMarkup(<ActionsPage initialActions={[]} />);

    expect(html).toContain("فعلاً اقدامی از شما لازم نیست.");
    expect(html).toContain("درخواست‌ها و جلسه‌هایی که منتظر طرف مقابل هستند، در صفحه جلسه‌ها قابل پیگیری‌اند.");
    expect(html).toContain("رفتن به جلسه‌ها");
  });
});
