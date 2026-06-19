import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CheckoutPage } from "@/features/v51/conversations/pages/CheckoutPage";
import { SelectTimePage } from "@/features/v51/conversations/pages/SelectTimePage";
import {
  calculateCheckout,
  conversations,
  expiredTimeSelectionMessage,
  getConversationRouteAccess,
  getPrimaryConversationAction,
  getRepeatRequestHref,
  makeProposedTime,
  postConversationRequestSelectTime,
  repeatRequestCtaLabel,
  reliabilityMockNow,
  selectTimeForConversation
} from "@/features/v51/data/conversations";

function byId(id: string) {
  const conversation = conversations.find((item) => item.id === id);
  expect(conversation).toBeDefined();
  return conversation!;
}

function escapedHref(href: string) {
  return href.replaceAll("&", "&amp;");
}

function addHours(value: string, hours: number) {
  return new Date(new Date(value).getTime() + hours * 60 * 60 * 1000).toISOString();
}

describe("Phase 02 expired select-time and checkout guard", () => {
  it("renders expired proposed times as disabled and aria-disabled options", () => {
    const html = renderToStaticMarkup(<SelectTimePage initialConversation={byId("conv-mixed-time-options")} />);

    expect(html).toContain('data-time-state="expired"');
    expect(html).toMatch(/<button[^>]*aria-disabled="true"[^>]*data-time-state="expired"[^>]*disabled=""/);
  });

  it("rejects selecting a past proposed time in the action layer", () => {
    const conversation = byId("conv-mixed-time-options");
    const expiredTime = conversation.proposedTimes.find((time) => time.startAt && new Date(time.startAt).getTime() <= new Date("2026-05-23T09:00:00+03:30").getTime());
    expect(expiredTime).toBeDefined();

    const selected = selectTimeForConversation(conversation, expiredTime!.id);

    expect(selected.status).toBe("times_proposed");
    expect(selected.selectedTimeId).toBeUndefined();
    expect(selected.proposedTimes.some((time) => time.isSelected)).toBe(false);
  });

  it("rejects proposed times with less than six hours remaining", () => {
    const id = "conv-too-soon-selection";
    const tooSoon = { ...makeProposedTime("d1", "۰۹:۰۰", id), startAt: addHours(reliabilityMockNow, 5) };
    const conversation = {
      ...byId("conv-time-options"),
      id,
      proposedTimes: [tooSoon, { ...makeProposedTime("d2", "۱۰:۰۰", id) }, { ...makeProposedTime("d3", "۱۵:۰۰", id) }]
    };
    const html = renderToStaticMarkup(<SelectTimePage initialConversation={conversation} />);
    const selected = selectTimeForConversation(conversation, tooSoon.id);

    expect(html).toContain('data-time-state="too-soon"');
    expect(selected.status).toBe("times_proposed");
    expect(selected.selectedTimeId).toBeUndefined();
  });

  it("expired select-time hides payment/finalization CTAs and shows repeat request", () => {
    const conversation = byId("conv-expired-time-options");
    const html = renderToStaticMarkup(<SelectTimePage initialConversation={conversation} />);

    expect(html).toContain(expiredTimeSelectionMessage);
    expect(html).toContain(repeatRequestCtaLabel);
    expect(html).toContain(`href="${escapedHref(getRepeatRequestHref(conversation))}"`);
    expect(html).not.toContain("ادامه به پرداخت");
    expect(html).not.toContain("پرداخت و ثبت جلسه");
    expect(html).not.toContain("ثبت نهایی جلسه");
    expect(html).not.toContain("زمان انتخاب شد");
  });

  it("expired API/action response does not report success", () => {
    const conversation = byId("conv-expired-time-options");
    const response = postConversationRequestSelectTime(conversation.id, conversation.proposedTimes[0].id);

    expect(response.ok).toBe(false);
    expect(response.status).toBe("expired");
    expect(response.error).toBe(expiredTimeSelectionMessage);
    expect(response.selectedTimeId).toBeUndefined();
  });

  it("blocks checkout route and payment UI for expired requests", () => {
    const conversation = byId("conv-expired-time-options");
    const access = getConversationRouteAccess(conversation, "checkout");
    const html = renderToStaticMarkup(<CheckoutPage initialConversation={conversation} />);

    expect(access.allowed).toBe(false);
    expect(access.disabledReason).toBe("REQUEST_EXPIRED");
    expect(html).toContain(expiredTimeSelectionMessage);
    expect(html).toContain(repeatRequestCtaLabel);
    expect(html).not.toContain("پرداخت و ثبت جلسه");
    expect(html).not.toContain("ثبت نهایی جلسه");
  });

  it("blocks checkout when the selected time is stale or invalid", () => {
    const conversation = byId("conv-past-selected-time");
    const access = getConversationRouteAccess(conversation, "checkout");
    const checkout = calculateCheckout(conversation);
    const html = renderToStaticMarkup(<CheckoutPage initialConversation={conversation} />);

    expect(access.allowed).toBe(false);
    expect(checkout.paymentEnabled).toBe(false);
    expect(html).toContain(expiredTimeSelectionMessage);
    expect(html).not.toContain("پرداخت و ثبت جلسه");
    expect(html).not.toContain("ثبت نهایی جلسه");
  });

  it("repeat request CTA preserves the same provider profile and duration", () => {
    const conversation = byId("conv-expired-time-options");
    const action = getPrimaryConversationAction(conversation);

    expect(action.label).toBe(repeatRequestCtaLabel);
    expect(action.href).toBe("/requests/new?profileId=sara&duration=30");
  });

  it("never shows expired and success messages together", () => {
    const selectTimeHtml = renderToStaticMarkup(<SelectTimePage initialConversation={byId("conv-expired-time-options")} />);
    const checkoutHtml = renderToStaticMarkup(<CheckoutPage initialConversation={byId("conv-past-selected-time")} />);

    expect(selectTimeHtml).toContain(expiredTimeSelectionMessage);
    expect(selectTimeHtml).not.toContain("زمان انتخاب شد و جلسه مشاوره به مرحله نهایی‌سازی رسید.");
    expect(checkoutHtml).toContain(expiredTimeSelectionMessage);
    expect(checkoutHtml).not.toContain("جلسه مشاوره ثبت شد");
  });
});
