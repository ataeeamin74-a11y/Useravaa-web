import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ActionsPage } from "@/features/v51/actions/pages/ActionsPage";
import { ConversationDetailPanel } from "@/features/v51/conversations/components/ConversationDetailPanel";
import { ConversationsPage } from "@/features/v51/conversations/pages/ConversationsPage";
import {
  cancelConversationByProvider,
  canProviderCancelConfirmedSession,
  canProviderCancelRequestBeforeSelection,
  canProviderRejectRequest,
  conversations,
  createCancellationNotifications,
  createCancellationWalletCredit,
  getCancellationRecoveryActions,
  groupConversationStatusSections,
  providerRequestCancellationReasonOptions,
  providerRejectionReasonOptions,
  providerSessionCancellationReasonOptions,
  providerSideClosureCopy,
  rejectConversationByProvider,
  validateProviderCancellationReason,
  validateProviderRejectionReason,
  type ConversationFixture
} from "@/features/v51/data/conversations";
import { initialWalletFixture } from "@/features/v51/data/wallet";
import { WalletPage } from "@/features/v51/wallet/WalletPage";

function byId(id: string) {
  const conversation = conversations.find((item) => item.id === id);

  expect(conversation).toBeDefined();

  return conversation!;
}

function incomingAfterTimes(): ConversationFixture {
  const source = byId("conv-time-options");

  return {
    ...source,
    id: "conv-provider-times-for-cancel-test",
    direction: "incoming",
    requesterId: "user-mahsa",
    requesterName: "مهسا ک.",
    requesterRole: "درخواست‌دهنده جلسه مشاوره",
    providerId: source.providerId,
    status: "times_proposed",
    state: "times_proposed",
    selectedTimeId: null,
    selectedTime: undefined
  };
}

function requesterView(conversation: ConversationFixture): ConversationFixture {
  return {
    ...conversation,
    direction: "outgoing",
    requesterId: "user-requester",
    requesterName: "تو",
    requesterRole: "درخواست‌دهنده"
  };
}

const forbiddenCopy = ["صاحب تجربه", "وقت", "جریمه", "پنالتی", "آزادسازی پول"];

describe("Phase 07 provider-side rejection and cancellation", () => {
  it("shows provider rejection only before three times are proposed", () => {
    const pending = byId("conv-provider-request");
    const afterTimes = incomingAfterTimes();
    const pendingHtml = renderToStaticMarkup(<ConversationDetailPanel conversation={pending} />);
    const afterTimesHtml = renderToStaticMarkup(<ConversationDetailPanel conversation={afterTimes} />);

    expect(canProviderRejectRequest(pending)).toBe(true);
    expect(pendingHtml).toContain(providerSideClosureCopy.rejectSectionTitle);
    expect(pendingHtml).toContain("رد درخواست");
    expect(canProviderRejectRequest(afterTimes)).toBe(false);
    expect(canProviderCancelRequestBeforeSelection(afterTimes)).toBe(true);
    expect(afterTimesHtml).not.toContain(providerSideClosureCopy.rejectSectionTitle);
    expect(afterTimesHtml).toContain(providerSideClosureCopy.changeSectionTitle);
    expect(afterTimesHtml).toContain("لغو درخواست");
  });

  it("shows provider confirmed-session cancellation only after the session is confirmed", () => {
    const confirmed = byId("conv-provider-confirmed");
    const html = renderToStaticMarkup(<ConversationDetailPanel conversation={confirmed} />);

    expect(canProviderCancelConfirmedSession(confirmed)).toBe(true);
    expect(html).toContain(providerSideClosureCopy.confirmedCancelSectionTitle);
    expect(html).toContain("لغو جلسه");
    expect(html).not.toContain("رد درخواست");
  });

  it("does not expose provider-side actions to requester or unrelated users", () => {
    const requesterHtml = renderToStaticMarkup(<ConversationDetailPanel conversation={byId("conv-time-options")} />);

    expect(requesterHtml).not.toContain(providerSideClosureCopy.rejectSectionTitle);
    expect(requesterHtml).not.toContain(providerSideClosureCopy.confirmedCancelSectionTitle);
    expect(canProviderRejectRequest(byId("conv-provider-request"), "provider-other")).toBe(false);
    expect(canProviderCancelRequestBeforeSelection(incomingAfterTimes(), "provider-other")).toBe(false);
    expect(canProviderCancelConfirmedSession(byId("conv-provider-confirmed"), "provider-other")).toBe(false);
  });

  it("requires provider reasons and accepts prefer-not-to-say", () => {
    expect(validateProviderRejectionReason("")).toBe(false);
    expect(validateProviderCancellationReason("")).toBe(false);
    expect(validateProviderRejectionReason("PREFER_NOT_TO_SAY")).toBe(true);
    expect(validateProviderCancellationReason("PREFER_NOT_TO_SAY")).toBe(true);
    expect(providerRejectionReasonOptions.map((option) => option.label)).toContain("ترجیح می‌دهم نگویم");
    expect(providerRequestCancellationReasonOptions.map((option) => option.label)).toContain("ترجیح می‌دهم نگویم");
    expect(providerSessionCancellationReasonOptions.map((option) => option.label)).toContain("ترجیح می‌دهم نگویم");
  });

  it("saves provider rejection reason text and creates full wallet credit", () => {
    const rejected = rejectConversationByProvider(byId("conv-provider-request"), {
      reasonCode: "REQUEST_NOT_CLEAR",
      reasonText: "موضوع نیاز به شفاف‌سازی داشت."
    });
    const credit = createCancellationWalletCredit(rejected);

    expect(rejected.status).toBe("rejected");
    expect(rejected.rejectedByRole).toBe("EXPERIENCE_CREATOR");
    expect(rejected.rejectionReasonCode).toBe("REQUEST_NOT_CLEAR");
    expect(rejected.rejectionReasonText).toBe("موضوع نیاز به شفاف‌سازی داشت.");
    expect(rejected.refundRate).toBe(1);
    expect(credit?.title).toBe("اعتبار برگشتی از رد درخواست");
    expect(credit?.amount).toBe(rejected.refundAmount);
  });

  it("creates full wallet credit for provider cancellation before confirmation", () => {
    const cancelled = cancelConversationByProvider(incomingAfterTimes(), {
      reasonCode: "TIME_OPTIONS_NO_LONGER_WORK",
      reasonText: "زمان‌ها دیگر ممکن نیست."
    });
    const credit = createCancellationWalletCredit(cancelled);

    expect(cancelled.status).toBe("cancelled");
    expect(cancelled.cancelledByRole).toBe("EXPERIENCE_CREATOR");
    expect(cancelled.providerCancellationStage).toBe("AFTER_TIME_PROPOSAL_BEFORE_SELECTION");
    expect(cancelled.providerCancellationReasonText).toBe("زمان‌ها دیگر ممکن نیست.");
    expect(cancelled.proposedTimes.every((time) => time.status === "SUPERSEDED")).toBe(true);
    expect(cancelled.refundRate).toBe(1);
    expect(credit?.title).toBe("اعتبار برگشتی از لغو توسط تجربه‌آفرین");
  });

  it("creates full wallet credit for provider confirmed-session cancellation", () => {
    const cancelled = cancelConversationByProvider(byId("conv-provider-confirmed"), {
      reasonCode: "CANNOT_ATTEND_CONFIRMED_SESSION"
    });
    const credit = createCancellationWalletCredit(cancelled);

    expect(cancelled.status).toBe("cancelled");
    expect(cancelled.providerCancellationStage).toBe("AFTER_CONFIRMED_SESSION");
    expect(cancelled.hasConfirmedSession).toBe(true);
    expect(cancelled.refundRate).toBe(1);
    expect(cancelled.attendanceVerificationStatus).toBe("NOT_REQUIRED");
    expect(credit?.title).toBe("اعتبار برگشتی از لغو توسط تجربه‌آفرین");
  });

  it("flags near-session provider cancellation for support review while preserving wallet credit", () => {
    const nearSession = {
      ...byId("conv-provider-confirmed"),
      selectedTime: {
        ...byId("conv-provider-confirmed").selectedTime!,
        startAt: "2026-05-23T10:00:00+03:30"
      }
    };
    const cancelled = cancelConversationByProvider(nearSession, {
      reasonCode: "CANNOT_ATTEND_CONFIRMED_SESSION"
    });

    expect(cancelled.providerCancellationStage).toBe("NEAR_SESSION_START");
    expect(cancelled.requiresSupportReview).toBe(true);
    expect(cancelled.cancellationReviewStatus).toBe("PENDING_SUPPORT_REVIEW");
    expect(cancelled.refundRate).toBe(1);
    expect(cancelled.walletCreditId).toBeTruthy();
  });

  it("renders humble requester apology copy for provider-side closed states", () => {
    const rejected = requesterView(rejectConversationByProvider(byId("conv-provider-request"), { reasonCode: "NO_AVAILABILITY" }));
    const cancelledRequest = requesterView(cancelConversationByProvider(incomingAfterTimes(), { reasonCode: "TIME_OPTIONS_NO_LONGER_WORK" }));
    const cancelledSession = requesterView(cancelConversationByProvider(byId("conv-provider-confirmed"), { reasonCode: "CANNOT_ATTEND_CONFIRMED_SESSION" }));

    const html = [
      renderToStaticMarkup(<ConversationDetailPanel conversation={rejected} />),
      renderToStaticMarkup(<ConversationDetailPanel conversation={cancelledRequest} />),
      renderToStaticMarkup(<ConversationDetailPanel conversation={cancelledSession} />)
    ].join("\n");

    expect(html).toContain(providerSideClosureCopy.requesterRejectedText);
    expect(html).toContain(providerSideClosureCopy.requesterCancelledRequestText);
    expect(html).toContain(providerSideClosureCopy.requesterCancelledSessionText);
    expect(html).toContain("حالا چه کاری می‌توانید انجام دهید؟");
    expect(html).toContain("دیدن تجربه‌آفرین‌های مشابه");
    expect(html).toContain("درخواست جدید از همین حوزه");
    expect(html).toContain('href="/wallet"');
    expect(html).not.toContain("درخواست برداشت وجه");
  });

  it("keeps provider final states operational and private", () => {
    const rejected = rejectConversationByProvider(byId("conv-provider-request"), { reasonCode: "NO_AVAILABILITY" });
    const cancelled = cancelConversationByProvider(byId("conv-provider-confirmed"), { reasonCode: "CANNOT_ATTEND_CONFIRMED_SESSION" });
    const html = [
      renderToStaticMarkup(<ConversationDetailPanel conversation={rejected} />),
      renderToStaticMarkup(<ConversationDetailPanel conversation={cancelled} />)
    ].join("\n");

    expect(html).toContain(providerSideClosureCopy.providerRejectedText);
    expect(html).toContain(providerSideClosureCopy.providerCancelledSessionText);
    expect(html).not.toContain("مبلغ پرداختی به‌صورت کامل به کیف پول شما بازگشت");
    expect(html).not.toContain("حالا چه کاری می‌توانید انجام دهید؟");
  });

  it("places provider-side closed items in history and never in actions", () => {
    const rejectedRequester = requesterView(rejectConversationByProvider(byId("conv-provider-request"), { reasonCode: "NO_AVAILABILITY" }));
    const cancelledProvider = cancelConversationByProvider(byId("conv-provider-confirmed"), { reasonCode: "CANNOT_ATTEND_CONFIRMED_SESSION" });
    const requesterGroups = groupConversationStatusSections([rejectedRequester], "outgoing");
    const providerGroups = groupConversationStatusSections([cancelledProvider], "incoming");
    const sessionsHtml = renderToStaticMarkup(<ConversationsPage initialConversations={[rejectedRequester, cancelledProvider]} initialTab="outgoing" />);
    const providerSessionsHtml = renderToStaticMarkup(<ConversationsPage initialConversations={[cancelledProvider]} initialTab="incoming" />);
    const actionsHtml = renderToStaticMarkup(<ActionsPage initialConversations={[rejectedRequester, cancelledProvider]} />);

    expect(requesterGroups.history).toHaveLength(1);
    expect(providerGroups.history).toHaveLength(1);
    expect(sessionsHtml).toContain("درخواست پذیرفته نشد");
    expect(sessionsHtml).toContain("مشاهده جزئیات");
    expect(providerSessionsHtml).toContain("جلسه لغو شد");
    expect(actionsHtml).not.toContain("جلسه لغو شد");
    expect(actionsHtml).not.toContain("درخواست پذیرفته نشد");
  });

  it("creates role-aware notifications without provider financial details", () => {
    const rejected = requesterView(rejectConversationByProvider(byId("conv-provider-request"), { reasonCode: "NO_AVAILABILITY" }));
    const cancelled = cancelConversationByProvider(byId("conv-provider-confirmed"), { reasonCode: "CANNOT_ATTEND_CONFIRMED_SESSION" });
    const requesterRejected = createCancellationNotifications(rejected).find((notification) => notification.receiverId === rejected.requesterId);
    const requesterCancelled = createCancellationNotifications(cancelled).find((notification) => notification.receiverId === cancelled.requesterId);
    const providerNotification = createCancellationNotifications(cancelled).find((notification) => notification.receiverId === cancelled.providerId);

    expect(requesterRejected?.message).toContain("متأسفیم");
    expect(requesterRejected?.message).toContain("تجربه‌آفرین");
    expect(requesterCancelled?.message).toContain("جلسه از سمت تجربه‌آفرین لغو شد");
    expect(providerNotification?.message).toBe(providerSideClosureCopy.providerNotificationText);
    expect(providerNotification?.message).not.toContain("مبلغ");
    expect(providerNotification?.message).not.toContain("کیف پول");
  });

  it("wallet page shows provider-side cancellation credit transactions", () => {
    const html = renderToStaticMarkup(<WalletPage />);

    expect(initialWalletFixture.transactions.some((transaction) => transaction.title === "اعتبار برگشتی از رد درخواست")).toBe(true);
    expect(initialWalletFixture.transactions.some((transaction) => transaction.title === "اعتبار برگشتی از لغو توسط تجربه‌آفرین")).toBe(true);
    expect(html).toContain("اعتبار برگشتی از رد درخواست");
    expect(html).toContain("اعتبار برگشتی از لغو توسط تجربه‌آفرین");
  });

  it("does not introduce forbidden provider-side copy", () => {
    const html = [
      renderToStaticMarkup(<ConversationDetailPanel conversation={byId("conv-provider-request")} />),
      renderToStaticMarkup(<ConversationDetailPanel conversation={byId("conv-provider-confirmed")} />),
      providerSideClosureCopy.requesterCancelledSessionText,
      providerSideClosureCopy.requesterRejectedText,
      providerSideClosureCopy.requesterCancelledRequestText
    ].join("\n");
    const recoveryActions = getCancellationRecoveryActions(byId("conv-provider-cancelled-session"));

    forbiddenCopy.forEach((term) => {
      expect(html).not.toContain(term);
    });
    expect(html).not.toMatch(/لطفا(?!ً)/);
    expect(recoveryActions.some((action) => action.label === "درخواست برداشت وجه")).toBe(false);
  });
});
