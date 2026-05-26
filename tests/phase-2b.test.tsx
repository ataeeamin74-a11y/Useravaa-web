import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ConversationsPage } from "@/features/v51/conversations/pages/ConversationsPage";
import { RequestConversationPage } from "@/features/v51/conversations/pages/RequestConversationPage";
import {
  calculateCheckout,
  canSubmitProposedTimes,
  conversations,
  makeProposedTime,
  payConversation,
  profileOrThrow,
  selectTimeForConversation,
  toggleProposedTime
} from "@/features/v51/data/conversations";

describe("Phase 2B V51 conversation cluster", () => {
  it("request page renders selected profile and duration options", () => {
    const html = renderToStaticMarkup(<RequestConversationPage profile={profileOrThrow("ali")} initialDuration={60} />);

    expect(html).toContain("درخواست جلسه مشاوره");
    expect(html).toContain("علی ر.");
    expect(html).toContain("۳۰ دقیقه");
    expect(html).toContain("۱ ساعت");
    expect(html).toContain("ارسال درخواست جلسه مشاوره");
  });

  it("conversations tabs render sent and received groups", () => {
    const html = renderToStaticMarkup(<ConversationsPage initialConversations={conversations} />);

    expect(html).toContain("درخواست‌های من");
    expect(html).toContain("درخواست‌های دریافتی");
    expect(html).toContain("نیازمند اقدام");
    expect(html).toContain("در حال پیگیری");
    expect(html).toContain("تمام‌شده");
  });

  it("propose-times submit is disabled under 3 selections", () => {
    const selected = [makeProposedTime("d1", "۰۹:۰۰"), makeProposedTime("d1", "۱۰:۰۰")];

    expect(canSubmitProposedTimes(selected)).toBe(false);
  });

  it("propose-times submit is enabled at 3 selections", () => {
    const selected = [makeProposedTime("d1", "۰۹:۰۰"), makeProposedTime("d1", "۱۰:۰۰"), makeProposedTime("d2", "۱۵:۰۰")];

    expect(canSubmitProposedTimes(selected)).toBe(true);
  });

  it("selecting more than 6 proposed times is blocked", () => {
    const selected = [
      makeProposedTime("d1", "۰۹:۰۰"),
      makeProposedTime("d1", "۰۹:۳۰"),
      makeProposedTime("d1", "۱۰:۰۰"),
      makeProposedTime("d1", "۱۰:۳۰"),
      makeProposedTime("d1", "۱۱:۰۰"),
      makeProposedTime("d1", "۱۱:۳۰"),
      makeProposedTime("d1", "۱۴:۰۰")
    ].reduce((current, time) => toggleProposedTime(current, time), [] as ReturnType<typeof makeProposedTime>[]);

    expect(selected).toHaveLength(6);
  });

  it("select-time allows only one option", () => {
    const conversation = conversations.find((item) => item.id === "conv-time-options");
    expect(conversation).toBeDefined();

    const firstSelection = selectTimeForConversation(conversation!, conversation!.proposedTimes[0].id);
    const secondSelection = selectTimeForConversation(firstSelection, conversation!.proposedTimes[1].id);

    expect(firstSelection.selectedTime?.id).toBe(conversation!.proposedTimes[0].id);
    expect(secondSelection.selectedTime?.id).toBe(conversation!.proposedTimes[0].id);
    expect(secondSelection.state).toBe("pending_payment");
  });

  it("checkout shows wallet deduction and gateway payable amount", () => {
    const conversation = conversations.find((item) => item.id === "conv-awaiting-payment");
    expect(conversation).toBeDefined();

    const checkout = calculateCheckout(conversation!);

    expect(checkout.walletDeduction).toBe(100000);
    expect(checkout.gatewayPayable).toBe(900000);
  });

  it("successful mock payment moves conversation to confirmed", () => {
    const conversation = conversations.find((item) => item.id === "conv-awaiting-payment");
    expect(conversation).toBeDefined();

    const paidConversation = payConversation(conversation!);

    expect(paidConversation.state).toBe("confirmed");
  });
});
