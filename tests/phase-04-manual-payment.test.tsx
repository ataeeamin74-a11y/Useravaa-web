import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AdminPaymentsClient } from "@/app/admin/payments/AdminPaymentsClient";
import { CheckoutPage } from "@/features/v51/conversations/pages/CheckoutPage";
import {
  approveManualPayment,
  conversations,
  getFundStatus,
  getManualPaymentReviewItems,
  getPaymentStatus,
  getRequestStatus,
  groupConversationSections,
  manualPaymentCardDetails,
  manualPaymentCopy,
  rejectManualPayment,
  submitManualPaymentForReview,
  validateManualPaymentInput
} from "@/features/v51/data/conversations";

function byId(id: string) {
  const conversation = conversations.find((item) => item.id === id);

  expect(conversation).toBeDefined();

  return conversation!;
}

describe("Route 4 card-to-card manual payment review flow", () => {
  it("renders internet payment as disabled and card-to-card as active on checkout", () => {
    const html = renderToStaticMarkup(<CheckoutPage initialConversation={byId("conv-awaiting-payment")} />);

    expect(html).toContain(manualPaymentCopy.methodsTitle);
    expect(html).toContain(manualPaymentCopy.onlineTitle);
    expect(html).toContain(manualPaymentCopy.onlineDisabledBadge);
    expect(html).toContain(manualPaymentCopy.cardToCardTitle);
    expect(html).toContain(manualPaymentCopy.cardToCardActiveBadge);
    expect(html).toContain(manualPaymentCardDetails.cardNumber);
    expect(html).toContain(manualPaymentCardDetails.cardholderName);
    expect(html).toContain(`dir="ltr">${manualPaymentCardDetails.cardNumber}</strong>`);
    expect(html).toContain(manualPaymentCopy.copy);
    expect(html).toContain(manualPaymentCopy.referenceLabel);
    expect(html).toContain(manualPaymentCopy.receiptLabel);
    expect(html).toContain(manualPaymentCopy.submit);
    expect(html).not.toContain("پرداخت موفق");
    expect(html).not.toContain("جلسه قطعی شد");
    expect(html).not.toContain("درخواست شما ارسال شد");
  });

  it("validates manual payment proof without requiring both fields", () => {
    expect(validateManualPaymentInput({}).message).toBe(manualPaymentCopy.missingProof);
    expect(validateManualPaymentInput({ referenceNumber: "۱۲۳ABC" }).message).toBe(manualPaymentCopy.invalidReference);
    expect(validateManualPaymentInput({ referenceNumber: "۱۲۳۴۵۶۷۸۹۰" })).toMatchObject({
      valid: true,
      normalizedReference: "1234567890"
    });
    expect(
      validateManualPaymentInput({
        receipt: { fileName: "receipt.png", mimeType: "image/png", size: 1234 }
      })
    ).toMatchObject({ valid: true });
  });

  it("submits valid card-to-card proof for admin review and keeps provider blind", () => {
    const result = submitManualPaymentForReview(byId("conv-awaiting-payment"), { referenceNumber: "۱۲۳۴۵۶۷۸۹۰" });

    expect(result.success).toBe(true);
    expect(result.conversation.status).toBe("payment_processing");
    expect(result.conversation.paymentMethod).toBe("CARD_TO_CARD");
    expect(result.conversation.manualPaymentStatus).toBe("SUBMITTED");
    expect(result.conversation.manualPaymentReferenceNumber).toBe("1234567890");
    expect(getPaymentStatus(result.conversation)).toBe("PENDING_REVIEW");
    expect(getRequestStatus(result.conversation)).toBe("AWAITING_PAYMENT");

    const providerView = groupConversationSections([{ ...result.conversation, direction: "incoming" }], "incoming");

    expect(providerView.needsAction).toHaveLength(0);
    expect(providerView.requestStage).toHaveLength(0);
    expect(providerView.confirmedSessions).toHaveLength(0);
    expect(providerView.history).toHaveLength(0);
  });

  it("renders pending-review status without request-sent copy before admin approval", () => {
    const html = renderToStaticMarkup(<CheckoutPage initialConversation={byId("conv-manual-payment-review")} />);

    expect(html).toContain(manualPaymentCopy.submittedTitle);
    expect(html).toContain(manualPaymentCopy.pendingStatus);
    expect(html).toContain(manualPaymentCopy.pendingHelper);
    expect(html).not.toContain("درخواست شما ارسال شد");
    expect(html).not.toContain("در انتظار پیشنهاد زمان");
    expect(html).not.toContain("جلسه قطعی شد");
  });

  it("lists submitted card-to-card payments in the admin review page", () => {
    const html = renderToStaticMarkup(<AdminPaymentsClient initialItems={getManualPaymentReviewItems(conversations)} />);

    expect(html).toContain(manualPaymentCopy.adminTitle);
    expect(html).toContain("conv-manual-payment-review");
    expect(html).toContain(manualPaymentCopy.adminPending);
    expect(html).toContain(manualPaymentCopy.adminApprove);
    expect(html).toContain(manualPaymentCopy.adminReject);
  });

  it("admin approval makes the paid request visible to provider as awaiting time proposal", () => {
    const approved = approveManualPayment(byId("conv-manual-payment-review")).conversation;

    expect(approved.status).toBe("pending_provider_response");
    expect(approved.manualPaymentStatus).toBe("APPROVED");
    expect(getPaymentStatus(approved)).toBe("PAID");
    expect(getRequestStatus(approved)).toBe("AWAITING_TIME_PROPOSAL");
    expect(getFundStatus(approved)).toBe("HELD_BY_USERAVAA");

    const providerView = groupConversationSections([{ ...approved, direction: "incoming" }], "incoming");

    expect(providerView.needsAction).toHaveLength(1);
    expect(renderToStaticMarkup(<CheckoutPage initialConversation={approved} />)).toContain(manualPaymentCopy.approvedTitle);
  });

  it("admin rejection returns the request to awaiting payment and keeps provider hidden", () => {
    const rejected = rejectManualPayment(byId("conv-manual-payment-review"), "شماره مرجع قابل بررسی نبود.").conversation;

    expect(rejected.status).toBe("pending_payment");
    expect(rejected.manualPaymentStatus).toBe("REJECTED");
    expect(getPaymentStatus(rejected)).toBe("FAILED");
    expect(getRequestStatus(rejected)).toBe("AWAITING_PAYMENT");
    expect(getFundStatus(rejected)).toBe("NONE");

    const providerView = groupConversationSections([{ ...rejected, direction: "incoming" }], "incoming");

    expect(providerView.needsAction).toHaveLength(0);
    expect(renderToStaticMarkup(<CheckoutPage initialConversation={rejected} />)).toContain(manualPaymentCopy.rejectedTitle);
  });
});
