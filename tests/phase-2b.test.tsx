import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ConversationsPage } from "@/features/v51/conversations/pages/ConversationsPage";
import { RequestConversationPage } from "@/features/v51/conversations/pages/RequestConversationPage";
import {
  calculateCheckout,
  canSubmitProposedTimes,
  conversations,
  createConversationRequest,
  getPrimaryConversationAction,
  groupConversationSections,
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
    expect(html).toContain("ادامه به پرداخت امن");
  });

  it("conversations page separates requests, confirmed sessions, and history", () => {
    const html = renderToStaticMarkup(<ConversationsPage initialConversations={conversations} />);

    expect(html).toContain("ارسالی ۱۳");
    expect(html).toContain("دریافتی ۸");
    expect(html).toContain("در جریان");
    expect(html).toContain("جلسه‌های قطعی");
    expect(html).toContain("گذشته و بسته‌شده");
    expect(html).toContain("مشاهده اقدام‌ها");
    expect(html).toContain("<details");
  });

  it("hides empty conversation groups when the active tab has content elsewhere", () => {
    const confirmed = conversations.find((item) => item.id === "conv-scheduled");
    expect(confirmed).toBeDefined();

    const html = renderToStaticMarkup(<ConversationsPage initialConversations={[confirmed!]} initialTab="outgoing" />);

    expect(html).toContain("جلسه‌های قطعی");
    expect(html).not.toContain("<h2>نیازمند اقدام</h2>");
    expect(html).not.toContain("<h2>در جریان</h2>");
    expect(html).not.toContain("<h2>گذشته و بسته‌شده</h2>");
    expect(html).not.toContain("فعلاً اقدامی برای انجام دادن ندارید.");
  });

  it("conversation IA keeps request-stage statuses out of confirmed sessions", () => {
    const outgoing = groupConversationSections(conversations, "outgoing");
    const incoming = groupConversationSections(conversations, "incoming");
    const pendingOutgoingRequest = createConversationRequest({ profile: profileOrThrow("ali"), duration: 30, note: "نیاز به راهنمایی دارم." });
    const outgoingWithPendingRequest = groupConversationSections([...conversations, pendingOutgoingRequest], "outgoing");
    const actionStatuses = [...outgoing.needsAction, ...incoming.needsAction].map((conversation) => conversation.status);
    const requestStatuses = [...outgoingWithPendingRequest.requestStage, ...incoming.requestStage].map((conversation) => conversation.status);

    expect(actionStatuses).toContain("times_proposed");
    expect(actionStatuses).toContain("pending_payment");
    expect(actionStatuses).toContain("pending_provider_response");
    expect(actionStatuses).toContain("new_time_requested");
    expect(requestStatuses).toContain("payment_processing");
    expect([...outgoing.confirmedSessions, ...incoming.confirmedSessions].every((conversation) => conversation.status === "confirmed")).toBe(true);
    expect([...outgoing.confirmedSessions, ...incoming.confirmedSessions].some((conversation) => conversation.status === "pending_payment")).toBe(false);
  });

  it("pre-provider pending payment preserves the secure checkout CTA and route", () => {
    const conversation = conversations.find((item) => item.id === "conv-awaiting-payment");
    expect(conversation).toBeDefined();

    const action = getPrimaryConversationAction(conversation!);

    expect(action.kind).toBe("checkout");
    expect(action.href).toBe(`/checkout/${conversation!.id}`);
    expect(action.label).toBe("پرداخت امن و ارسال درخواست");
  });

  it("propose-times submit is disabled under 3 selections", () => {
    const selected = [makeProposedTime("d1", "۰۹:۰۰"), makeProposedTime("d1", "۱۰:۰۰")];

    expect(canSubmitProposedTimes(selected)).toBe(false);
  });

  it("propose-times submit is enabled at 3 selections", () => {
    const selected = [makeProposedTime("d3", "۱۵:۰۰"), makeProposedTime("d4", "۱۰:۰۰"), makeProposedTime("d5", "۱۶:۰۰")];

    expect(canSubmitProposedTimes(selected)).toBe(true);
  });

  it("selecting more than 3 proposed times is blocked", () => {
    const selected = [
      makeProposedTime("d1", "۰۹:۰۰"),
      makeProposedTime("d1", "۰۹:۳۰"),
      makeProposedTime("d1", "۱۰:۰۰"),
      makeProposedTime("d1", "۱۰:۳۰")
    ].reduce((current, time) => toggleProposedTime(current, time), [] as ReturnType<typeof makeProposedTime>[]);

    expect(selected).toHaveLength(3);
  });

  it("select-time allows only one option", () => {
    const conversation = conversations.find((item) => item.id === "conv-time-options");
    expect(conversation).toBeDefined();

    const firstSelection = selectTimeForConversation(conversation!, conversation!.proposedTimes[0].id);
    const secondSelection = selectTimeForConversation(firstSelection, conversation!.proposedTimes[1].id);

    expect(firstSelection.selectedTime?.id).toBe(conversation!.proposedTimes[0].id);
    expect(secondSelection.selectedTime?.id).toBe(conversation!.proposedTimes[0].id);
    expect(secondSelection.state).toBe("confirmed");
  });

  it("checkout shows wallet deduction and gateway payable amount", () => {
    const conversation = conversations.find((item) => item.id === "conv-awaiting-payment");
    expect(conversation).toBeDefined();

    const checkout = calculateCheckout(conversation!);

    expect(checkout.walletDeduction).toBe(100000);
    expect(checkout.gatewayPayable).toBe(900000);
  });

  it("successful mock payment moves conversation to paid waiting-for-provider state", () => {
    const conversation = conversations.find((item) => item.id === "conv-awaiting-payment");
    expect(conversation).toBeDefined();

    const paidConversation = payConversation(conversation!);

    expect(paidConversation.state).toBe("pending_provider_response");
  });
});
