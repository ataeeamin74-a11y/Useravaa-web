import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CheckoutPage } from "@/features/v51/conversations/pages/CheckoutPage";
import {
  calculateCheckout,
  conversations,
  getFundStatus,
  getConversationRouteAccess,
  getPrimaryConversationAction,
  getPaymentStatus,
  getRequestStatus,
  payConversation,
  resolveConversationAction,
  selectTimeForConversation,
  type ConversationFixture
} from "@/features/v51/data/conversations";

function byId(id: string) {
  const conversation = conversations.find((item) => item.id === id);

  expect(conversation).toBeDefined();

  return conversation!;
}

describe("Phase 02 session lifecycle state resolver", () => {
  it("uses the central resolver for every primary conversation CTA", () => {
    conversations.forEach((conversation) => {
      expect(getPrimaryConversationAction(conversation)).toEqual(resolveConversationAction(conversation));
    });
  });

  it("does not use vague open-copy for primary actions", () => {
    conversations.forEach((conversation) => {
      expect(getPrimaryConversationAction(conversation).label).not.toBe("باز کردن");
    });
  });

  it("blocks stale or role-mismatched route access", () => {
    expect(getConversationRouteAccess(byId("conv-time-options"), "proposeTimes").allowed).toBe(false);
    expect(getConversationRouteAccess(byId("conv-provider-waiting"), "selectTime").allowed).toBe(false);
    expect(getConversationRouteAccess(byId("conv-scheduled"), "proposeTimes").allowed).toBe(false);
    expect(getConversationRouteAccess(byId("conv-scheduled"), "selectTime").allowed).toBe(false);
    expect(getConversationRouteAccess(byId("conv-scheduled"), "checkout").allowed).toBe(false);
    expect(getConversationRouteAccess(byId("conv-expired"), "selectTime").allowed).toBe(false);
    expect(getConversationRouteAccess(byId("conv-expired"), "checkout").allowed).toBe(false);
  });

  it("keeps provider users out of checkout even if a pending payment shape exists", () => {
    const providerPaymentConversation: ConversationFixture = {
      ...byId("conv-awaiting-payment"),
      id: "provider-payment-shape",
      direction: "incoming"
    };

    const access = getConversationRouteAccess(providerPaymentConversation, "checkout");
    const action = getPrimaryConversationAction(providerPaymentConversation);

    expect(access.allowed).toBe(false);
    expect(action.disabled).toBe(true);
    expect(action.href).toBeUndefined();
  });

  it("keeps checkout disabled while requester is choosing from proposed times", () => {
    const conversation = byId("conv-time-options");
    const checkout = calculateCheckout(conversation);

    expect(checkout.paymentEnabled).toBe(false);
    expect(getConversationRouteAccess(conversation, "checkout").allowed).toBe(false);
  });

  it("selecting one paid proposed time confirms the session and blocks checkout", () => {
    const conversation = byId("conv-time-options");
    const selected = selectTimeForConversation(conversation, conversation.proposedTimes[0].id);
    const action = getPrimaryConversationAction(selected);

    expect(selected.status).toBe("confirmed");
    expect(selected.proposedTimes.filter((time) => time.isSelected)).toHaveLength(1);
    expect(action.kind).toBe("open");
    expect(action.label).toBe("مشاهده کد برگزاری");
    expect(getConversationRouteAccess(selected, "checkout").allowed).toBe(false);
  });

  it("successful secure payment sends a paid request to provider without confirming", () => {
    const conversation = byId("conv-awaiting-payment");
    const checkout = calculateCheckout(conversation);
    const action = getPrimaryConversationAction(conversation);
    const paid = payConversation(conversation);

    expect(checkout.paymentEnabled).toBe(true);
    expect(action.label).toBe("پرداخت امن و ارسال درخواست");
    expect(paid.status).toBe("pending_provider_response");
    expect(paid.confirmedAt).toBeUndefined();
    expect(getRequestStatus(paid)).toBe("AWAITING_TIME_PROPOSAL");
    expect(getPaymentStatus(paid)).toBe("PAID");
    expect(getFundStatus(paid)).toBe("HELD_BY_USERAVAA");
  });

  it("free-help requests can be sent without gateway payment before provider sees them", () => {
    const freeHelpConversation: ConversationFixture = {
      ...byId("conv-free-help"),
      freeHelp: true
    };
    const checkout = calculateCheckout(freeHelpConversation);
    const action = getPrimaryConversationAction(freeHelpConversation);
    const sent = payConversation(freeHelpConversation);

    expect(checkout.paymentEnabled).toBe(true);
    expect(checkout.gatewayPayable).toBe(0);
    expect(checkout.requiresGateway).toBe(false);
    expect(action.label).toBe("ارسال درخواست جلسه رایگان");
    expect(sent.status).toBe("pending_provider_response");
    expect(sent.paidAt).toBeNull();
    expect(getRequestStatus(sent)).toBe("AWAITING_TIME_PROPOSAL");
    expect(getPaymentStatus(sent)).toBe("NOT_REQUIRED");
    expect(getFundStatus(sent)).toBe("NONE");
  });

  it("checkout route fallback does not expose a payment CTA for stale confirmed sessions", () => {
    const html = renderToStaticMarkup(<CheckoutPage initialConversation={byId("conv-scheduled")} />);

    expect(html).toContain("این مسیر با وضعیت فعلی درخواست سازگار نیست");
    expect(html).not.toContain("پرداخت و ثبت جلسه");
  });
});
