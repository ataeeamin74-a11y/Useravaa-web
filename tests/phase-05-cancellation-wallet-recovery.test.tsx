import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CheckoutPage } from "@/features/v51/conversations/pages/CheckoutPage";
import { ConversationDetailPanel } from "@/features/v51/conversations/components/ConversationDetailPanel";
import { ConversationStatusRow } from "@/features/v51/conversations/components/ConversationStatusRow";
import {
  calculateCancellationFinancials,
  cancelConversation,
  cancellationPolicyCopy,
  cancellationReasonOptions,
  canRequesterCancelRequest,
  conversations,
  createCancellationNotifications,
  createCancellationWalletCredit,
  createProviderCompensationWalletCredit,
  getCancellationRecoveryActions,
  getCancellationRefundPolicy,
  reliabilityMockNow,
  validateCancellationReason,
  type ConversationFixture
} from "@/features/v51/data/conversations";
import { initialWalletFixture } from "@/features/v51/data/wallet";
import { WalletPage } from "@/features/v51/wallet/WalletPage";

function byId(id: string) {
  const conversation = conversations.find((item) => item.id === id);

  expect(conversation).toBeDefined();

  return conversation!;
}

function nearSession(conversation: ConversationFixture): ConversationFixture {
  return {
    ...conversation,
    selectedTime: conversation.selectedTime
      ? {
          ...conversation.selectedTime,
          startAt: "2026-05-23T11:00:00+03:30"
        }
      : conversation.selectedTime
  };
}

function confirmedLater(conversation: ConversationFixture): ConversationFixture {
  return {
    ...conversation,
    selectedTime: conversation.selectedTime
      ? {
          ...conversation.selectedTime,
          startAt: "2026-05-24T11:00:00+03:30"
        }
      : conversation.selectedTime
  };
}

function beforeProviderProposal(conversation: ConversationFixture): ConversationFixture {
  return {
    ...conversation,
    status: "pending_provider_response",
    proposedTimes: [],
    selectedTimeId: null,
    selectedTime: undefined,
    hasConfirmedSession: false
  };
}

const forbiddenCopy = ["جریمه", "پنالتی", "آزادسازی پول", "صاحب تجربه", "سه وقت پیشنهادی", "ارسال درخواست رایگان"];

describe("Phase 05 cancellation, wallet credit, and recovery journey", () => {
  it("shows cancellation option only on requester-owned eligible detail pages", () => {
    const requesterHtml = renderToStaticMarkup(<ConversationDetailPanel conversation={byId("conv-time-options")} />);
    const providerHtml = renderToStaticMarkup(<ConversationDetailPanel conversation={byId("conv-provider-request")} />);

    expect(canRequesterCancelRequest(byId("conv-time-options"))).toBe(true);
    expect(canRequesterCancelRequest(byId("conv-time-options"), "other-user")).toBe(false);
    expect(canRequesterCancelRequest(byId("conv-provider-request"))).toBe(false);
    expect(requesterHtml).toContain("تغییر در این درخواست");
    expect(requesterHtml).toContain("درخواست زمان‌های جدید");
    expect(requesterHtml).toContain("لغو درخواست");
    expect(providerHtml).not.toContain("لغو درخواست");
  });

  it("calculates 90 percent requester credit and 10 percent provider compensation after time proposal", () => {
    const conversation = byId("conv-time-options");
    const policy = getCancellationRefundPolicy(conversation);
    const cancelled = cancelConversation(conversation, {
      reasonCode: "TIME_OPTIONS_NOT_SUITABLE",
      reasonText: "زمان‌ها مناسب نبود.",
      cancelledByRole: "REQUESTER"
    });
    const credit = createCancellationWalletCredit(cancelled);
    const providerCompensation = createProviderCompensationWalletCredit(cancelled);

    expect(policy.stage).toBe("AFTER_TIME_PROPOSAL_BEFORE_SELECTION");
    expect(policy.refundRate).toBe(0.9);
    expect(policy.refundAmount).toBe(450000);
    expect(policy.providerGrossCompensation).toBe(50000);
    expect(policy.useravaaFeeAmount).toBe(7500);
    expect(policy.providerNetCompensation).toBe(42500);
    expect(policy.refundDestination).toBe("WALLET");
    expect(cancelled.status).toBe("cancelled");
    expect(cancelled.refundRate).toBe(0.9);
    expect(cancelled.providerGrossCompensation).toBe(50000);
    expect(cancelled.providerNetCompensation).toBe(42500);
    expect(cancelled.refundDestination).toBe("WALLET");
    expect(cancelled.requestStatusBeforeCancel).toBe("times_proposed");
    expect(cancelled.paymentStatusBeforeCancel).toBe("PAID");
    expect(cancelled.cancellationReasonText).toBe("زمان‌ها مناسب نبود.");
    expect(credit?.type).toBe("CANCELLATION_CREDIT");
    expect(credit?.title).toBe("بازگشت اعتبار از لغو درخواست");
    expect(providerCompensation?.type).toBe("CANCELLATION_PROVIDER_COMPENSATION");
    expect(providerCompensation?.amount).toBe(42500);
    expect(providerCompensation?.settlementStatus).toBe("SETTLEMENT_PENDING");
  });

  it("calculates 50 percent wallet credit after confirmed session", () => {
    const cancelled = cancelConversation(confirmedLater(byId("conv-scheduled")), {
      reasonCode: "PREFER_NOT_TO_SAY",
      cancelledByRole: "REQUESTER"
    });

    expect(cancelled.cancellationStage).toBe("AFTER_CONFIRMED_SESSION");
    expect(cancelled.refundRate).toBe(0.5);
    expect(cancelled.refundAmount).toBe(250000);
    expect(cancelled.providerGrossCompensation).toBe(250000);
    expect(cancelled.useravaaFeeAmount).toBe(37500);
    expect(cancelled.providerNetCompensation).toBe(212500);
    expect(cancelled.hasConfirmedSession).toBe(true);
    expect(cancelled.walletCreditId).toBeTruthy();
  });

  it("late requester cancellation creates no refund and credits provider compensation after Useravaa fee", () => {
    const cancelled = cancelConversation(nearSession(byId("conv-scheduled")), {
      reasonCode: "PREFER_NOT_TO_SAY",
      cancelledByRole: "REQUESTER"
    }, reliabilityMockNow);
    const requesterCredit = createCancellationWalletCredit(cancelled);
    const providerCredit = createProviderCompensationWalletCredit(cancelled);

    expect(cancelled.cancellationStage).toBe("NEAR_SESSION_START");
    expect(cancelled.cancellationReviewStatus).toBe("NOT_REQUIRED");
    expect(cancelled.isLateRequesterCancellation).toBe(true);
    expect(cancelled.walletCreditId).toBeNull();
    expect(cancelled.requesterRefundWalletTransactionId).toBeNull();
    expect(cancelled.providerCompensationWalletTransactionId).toBeTruthy();
    expect(cancelled.refundRate).toBe(0);
    expect(cancelled.refundAmount).toBe(0);
    expect(cancelled.providerGrossCompensation).toBe(500000);
    expect(cancelled.useravaaFeeRate).toBe(0.15);
    expect(cancelled.useravaaFeeAmount).toBe(75000);
    expect(cancelled.providerNetCompensation).toBe(425000);
    expect(requesterCredit).toBeNull();
    expect(providerCredit?.title).toBe("جبران کنسلی درخواست");
    expect(providerCredit?.amount).toBe(425000);
    expect(providerCredit?.settlementStatus).toBe("SETTLEMENT_PENDING");
    expect(providerCredit?.providerGrossCompensation).toBe(500000);
    expect(providerCredit?.useravaaFeeAmount).toBe(75000);
    expect(providerCredit?.providerNetAmount).toBe(425000);
  });

  it("provider and platform fault cancellation returns 100 percent to wallet", () => {
    const providerFault = cancelConversation(byId("conv-provider-request"), {
      reasonCode: "RESPONSE_TOO_SLOW",
      cancelledByRole: "PROVIDER",
      stageOverride: "PROVIDER_FAULT"
    });
    const platformFault = cancelConversation(byId("conv-time-options"), {
      reasonCode: "OTHER",
      cancelledByRole: "PLATFORM",
      stageOverride: "PLATFORM_FAULT"
    });

    expect(providerFault.refundRate).toBe(1);
    expect(providerFault.refundDestination).toBe("WALLET");
    expect(providerFault.providerGrossCompensation).toBe(0);
    expect(providerFault.providerNetCompensation).toBe(0);
    expect(platformFault.refundRate).toBe(1);
    expect(platformFault.refundDestination).toBe("WALLET");
    expect(platformFault.providerGrossCompensation).toBe(0);
    expect(platformFault.providerNetCompensation).toBe(0);
  });

  it("refunds 100 percent before provider proposes time options", () => {
    const financials = calculateCancellationFinancials(beforeProviderProposal(byId("conv-time-options")), "REQUESTER", reliabilityMockNow);

    expect(financials.stage).toBe("BEFORE_TIME_PROPOSAL");
    expect(financials.refundRate).toBe(1);
    expect(financials.refundAmount).toBe(500000);
    expect(financials.providerGrossCompensation).toBe(0);
    expect(financials.providerNetCompensation).toBe(0);
    expect(financials.useravaaFeeAmount).toBe(0);
  });

  it("requires a cancellation reason and accepts prefer-not-to-say", () => {
    expect(validateCancellationReason("")).toBe(false);
    expect(validateCancellationReason("PREFER_NOT_TO_SAY")).toBe(true);
    expect(cancellationReasonOptions.map((option) => option.code)).toContain("PREFER_NOT_TO_SAY");
  });

  it("requester late-cancellation modal copy explains no refund politely before confirmation", () => {
    expect(cancellationPolicyCopy.nearSessionModalTitle).toBe("لغو این درخواست را ادامه می‌دهید؟");
    expect(cancellationPolicyCopy.nearSessionModalText).toContain("کمتر از ۳ ساعت تا زمان جلسه باقی مانده است");
    expect(cancellationPolicyCopy.nearSessionModalText).toContain("تجربه‌آفرین این زمان را برای گفت‌وگو با شما نگه داشته است");
    expect(cancellationPolicyCopy.nearSessionModalText).toContain("مبلغی به کیف پول شما بازنمی‌گردد");
    expect(cancellationPolicyCopy.nearSessionModalSecondaryText).toBe("اگر همچنان مایل به لغو هستید، می‌توانید درخواست را لغو کنید.");
    expect(cancellationPolicyCopy.confirmCancel).toBe("تأیید لغو درخواست");
    expect(cancellationPolicyCopy.back).toBe("بازگشت");
    expect(cancellationPolicyCopy.nearSessionModalText).not.toContain("جریمه");
    expect(cancellationPolicyCopy.nearSessionModalText).not.toContain("پنالتی");
  });

  it("checkout shows cancellation policy as compact disclosure", () => {
    const html = renderToStaticMarkup(<CheckoutPage initialConversation={byId("conv-awaiting-payment")} />);

    expect(html).toContain(cancellationPolicyCopy.disclosureTitle);
    expect(html).toContain("۹۰٪ مبلغ پرداختی");
    expect(html).toContain("۵۰٪ مبلغ پرداختی");
    expect(html).toContain("کمتر از ۳ ساعت");
    expect(html).toContain("مبلغی به کیف پول شما بازنمی‌گردد");
  });

  it("cancelled detail page renders recovery actions with working destinations", () => {
    const cancelled = cancelConversation(byId("conv-time-options"), {
      reasonCode: "TIME_OPTIONS_NOT_SUITABLE",
      cancelledByRole: "REQUESTER"
    });
    const html = renderToStaticMarkup(<ConversationDetailPanel conversation={cancelled} />);
    const actions = getCancellationRecoveryActions(cancelled);

    expect(html).toContain("درخواست لغو شد");
    expect(html).toContain("حالا چه کاری می‌توانید انجام دهید؟");
    expect(html).toContain('href="/wallet"');
    expect(html).toContain('href="/support"');
    expect(actions.some((action) => action.href.startsWith("/requests/new?profileId=sara"))).toBe(true);
    expect(actions.some((action) => action.href.startsWith("/discover"))).toBe(true);
  });

  it("requester cancelled detail explains late no-refund without provider fee math", () => {
    const cancelled = cancelConversation(nearSession(byId("conv-scheduled")), {
      reasonCode: "PREFER_NOT_TO_SAY",
      cancelledByRole: "REQUESTER"
    }, reliabilityMockNow);
    const html = renderToStaticMarkup(<ConversationDetailPanel conversation={cancelled} />);

    expect(html).toContain("درخواست لغو شد");
    expect(html).toContain("این درخواست کمتر از ۳ ساعت مانده به زمان جلسه لغو شد");
    expect(html).toContain("مبلغی به کیف پول شما بازنگشت");
    expect(html).toContain("مبلغ برگشتی");
    expect(html).not.toContain("سهم یوزراوا");
    expect(html).not.toContain("مبلغ جبران کنسلی");
    expect(html).not.toContain("مبلغ قابل تسویه برای شما");
  });

  it("provider cancelled detail shows compact compensation financials", () => {
    const requesterCancelled = cancelConversation(nearSession(byId("conv-scheduled")), {
      reasonCode: "PREFER_NOT_TO_SAY",
      cancelledByRole: "REQUESTER"
    }, reliabilityMockNow);
    const providerView: ConversationFixture = {
      ...requesterCancelled,
      direction: "incoming"
    };
    const html = renderToStaticMarkup(<ConversationDetailPanel conversation={providerView} />);

    expect(html).toContain("این درخواست توسط درخواست‌کننده لغو شد");
    expect(html).toContain("مبلغ جبران کنسلی برای شما محاسبه و به حساب شما اضافه شد");
    expect(html).toContain("مبلغ جبران کنسلی");
    expect(html).toContain("سهم یوزراوا");
    expect(html).toContain("مبلغ قابل تسویه برای شما");
  });

  it("wallet page shows cancellation credit transaction and filter type", () => {
    const html = renderToStaticMarkup(<WalletPage />);

    expect(initialWalletFixture.transactions.some((transaction) => transaction.type === "CANCELLATION_CREDIT")).toBe(true);
    expect(initialWalletFixture.transactions.some((transaction) => transaction.type === "CANCELLATION_PROVIDER_COMPENSATION")).toBe(true);
    expect(html).toContain("بازگشت اعتبار از لغو درخواست");
    expect(html).toContain("جبران کنسلی درخواست");
    expect(html).toContain("مبلغ جبران کنسلی");
    expect(html).toContain("سهم یوزراوا");
    expect(html).toContain("مبلغ قابل تسویه برای شما");
    expect(html).toContain("بازگشت اعتبار");
  });

  it("creates role-aware cancellation notifications without requester financial leakage", () => {
    const cancelled = cancelConversation(byId("conv-time-options"), {
      reasonCode: "PREFER_NOT_TO_SAY",
      cancelledByRole: "REQUESTER"
    });
    const notifications = createCancellationNotifications(cancelled);
    const requesterNotification = notifications.find((notification) => notification.receiverId === cancelled.requesterId);
    const providerNotification = notifications.find((notification) => notification.receiverId === cancelled.providerId);

    expect(notifications.map((notification) => notification.message).join(" ")).toContain("درخواست لغو");
    expect(requesterNotification?.message).toContain("مبلغ برگشتی به کیف پول شما اضافه شد");
    expect(requesterNotification?.message).not.toContain("سهم یوزراوا");
    expect(requesterNotification?.message).not.toContain("جبران کنسلی");
    expect(providerNotification?.title).toBe("جبران کنسلی برای شما ثبت شد");
    expect(providerNotification?.message).toContain("مبلغ قابل تسویه برای شما محاسبه شد");
    expect(providerNotification?.message).not.toContain("سهم یوزراوا");
  });

  it("late no-refund cancellation sends requester notification without provider compensation details", () => {
    const cancelled = cancelConversation(nearSession(byId("conv-scheduled")), {
      reasonCode: "PREFER_NOT_TO_SAY",
      cancelledByRole: "REQUESTER"
    }, reliabilityMockNow);
    const notifications = createCancellationNotifications(cancelled);
    const requesterNotification = notifications.find((notification) => notification.receiverId === cancelled.requesterId);
    const providerNotification = notifications.find((notification) => notification.receiverId === cancelled.providerId);

    expect(requesterNotification?.message).toContain("مبلغی به کیف پول شما بازنگشت");
    expect(requesterNotification?.message).not.toContain("مبلغ قابل تسویه");
    expect(requesterNotification?.message).not.toContain("سهم یوزراوا");
    expect(providerNotification?.title).toBe("جبران کنسلی برای شما ثبت شد");
    expect(providerNotification?.message).toContain("مبلغ قابل تسویه برای شما محاسبه شد");
  });

  it("sessions rows stay compact and do not expose full fee breakdown", () => {
    const requesterCancelled = cancelConversation(nearSession(byId("conv-scheduled")), {
      reasonCode: "PREFER_NOT_TO_SAY",
      cancelledByRole: "REQUESTER"
    }, reliabilityMockNow);
    const providerCancelled: ConversationFixture = {
      ...requesterCancelled,
      direction: "incoming"
    };
    const requesterRow = renderToStaticMarkup(<ConversationStatusRow conversation={requesterCancelled} bucket="done" />);
    const providerRow = renderToStaticMarkup(<ConversationStatusRow conversation={providerCancelled} bucket="done" />);

    expect(requesterRow).toContain("درخواست لغو شد");
    expect(requesterRow).toContain("کمتر از ۳ ساعت");
    expect(requesterRow).not.toContain("سهم یوزراوا");
    expect(requesterRow).not.toContain("مبلغ قابل تسویه برای شما");
    expect(providerRow).toContain("درخواست لغو شد");
    expect(providerRow).toContain("مبلغ جبران کنسلی برای شما محاسبه شد");
    expect(providerRow).not.toContain("سهم یوزراوا");
    expect(providerRow).not.toContain("مبلغ قابل تسویه برای شما");
  });

  it("keeps sessions rows free of cancellation policy copy and avoids forbidden terms", () => {
    const detailHtml = renderToStaticMarkup(<ConversationDetailPanel conversation={byId("conv-time-options")} />);
    const checkoutHtml = renderToStaticMarkup(<CheckoutPage initialConversation={byId("conv-awaiting-payment")} />);
    const copy = `${detailHtml} ${checkoutHtml} ${cancellationPolicyCopy.disclosureBody}`;

    forbiddenCopy.forEach((term) => {
      expect(copy).not.toContain(term);
    });
    expect(copy).not.toMatch(/لطفا(?!ً)/);
    expect(copy).not.toContain("سه وقت پیشنهادی");
    expect(copy).not.toContain("وقت پیشنهادی");
  });
});
