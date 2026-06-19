import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ActionsPage } from "@/features/v51/actions/pages/ActionsPage";
import { ConversationDetailPanel } from "@/features/v51/conversations/components/ConversationDetailPanel";
import { ConversationsPage } from "@/features/v51/conversations/pages/ConversationsPage";
import { ProposeTimesPage } from "@/features/v51/conversations/pages/ProposeTimesPage";
import { SelectTimePage } from "@/features/v51/conversations/pages/SelectTimePage";
import {
  canRequesterRequestNewTimes,
  conversations,
  createNewTimeOptionsNotification,
  createNewTimeRequestNotifications,
  getActiveProposedTimes,
  getConversationRouteAccess,
  groupConversationStatusSections,
  makeProposedTime,
  newTimeRequestCopy,
  proposeTimesForConversation,
  requestNewTimesForConversation,
  resolveUserActions,
  selectTimeForConversation,
  type ConversationFixture
} from "@/features/v51/data/conversations";

function byId(id: string) {
  const conversation = conversations.find((item) => item.id === id);

  expect(conversation).toBeDefined();

  return conversation!;
}

function validNewTimes(conversationId: string) {
  return [
    makeProposedTime("d3", "۱۵:۳۰", conversationId),
    makeProposedTime("d4", "۱۰:۰۰", conversationId),
    makeProposedTime("d5", "۱۶:۳۰", conversationId)
  ];
}

function supportReviewCancellation(conversation: ConversationFixture): ConversationFixture {
  return {
    ...conversation,
    id: "conv-cancellation-review-test",
    status: "cancelled",
    state: "cancelled",
    cancellationReviewStatus: "PENDING_SUPPORT_REVIEW",
    cancelledAt: "2026-05-23T10:00:00+03:30",
    walletCreditId: null,
    refundAmount: 0
  };
}

describe("Phase 06 new-time request and cancellation status visibility", () => {
  it("lets eligible requesters ask for new times once and supersedes previous options", () => {
    const conversation = byId("conv-time-options");
    const updated = requestNewTimesForConversation(conversation, "این زمان‌ها برایم مناسب نیست.");

    expect(canRequesterRequestNewTimes(conversation)).toBe(true);
    expect(updated.status).toBe("new_time_requested");
    expect(updated.newTimeRequestCount).toBe(1);
    expect(updated.newTimeRequestNote).toBe("این زمان‌ها برایم مناسب نیست.");
    expect(updated.timeOptionsStatus).toBe("SUPERSEDED");
    expect(updated.timeOptionsVersion).toBe(2);
    expect(updated.proposedTimes.every((time) => time.status === "SUPERSEDED")).toBe(true);
    expect(getActiveProposedTimes(updated)).toHaveLength(0);
    expect(canRequesterRequestNewTimes(updated)).toBe(false);
    expect(getConversationRouteAccess(updated, "selectTime").allowed).toBe(false);
  });

  it("renders the requester detail change section before cancellation", () => {
    const html = renderToStaticMarkup(<ConversationDetailPanel conversation={byId("conv-time-options")} />);

    expect(html).toContain(newTimeRequestCopy.detailTitle);
    expect(html).toContain(newTimeRequestCopy.detailDescription);
    expect(html).toContain(newTimeRequestCopy.cta);
    expect(html).toContain("لغو درخواست");
    expect(html).not.toContain("درخواست زمان‌های جدید از همین فرد");
  });

  it("shows provider-side new-time requests as real actions without checkout", () => {
    const conversation = byId("conv-provider-waiting");
    const actions = resolveUserActions([conversation]);
    const actionsHtml = renderToStaticMarkup(<ActionsPage initialConversations={[conversation]} />);
    const sessionsHtml = renderToStaticMarkup(<ConversationsPage initialConversations={[conversation]} initialTab="incoming" />);
    const proposeHtml = renderToStaticMarkup(<ProposeTimesPage initialConversation={conversation} />);

    expect(conversation.status).toBe("new_time_requested");
    expect(getConversationRouteAccess(conversation, "proposeTimes").allowed).toBe(true);
    expect(getConversationRouteAccess(conversation, "selectTime").allowed).toBe(false);
    expect(actions.some((action) => action.primaryCta === newTimeRequestCopy.providerCta)).toBe(true);
    expect(actionsHtml).toContain(newTimeRequestCopy.providerActionTitle);
    expect(actionsHtml).toContain(newTimeRequestCopy.providerCta);
    expect(sessionsHtml).toContain(newTimeRequestCopy.providerTitle);
    expect(sessionsHtml).toContain(newTimeRequestCopy.providerActionTitle);
    expect(proposeHtml).toContain(newTimeRequestCopy.providerActionTitle);
    expect(proposeHtml).not.toContain("پرداخت امن و ارسال درخواست");
  });

  it("moves new provider options back to requester selection with only current active times", () => {
    const providerConversation = byId("conv-provider-waiting");
    const proposed = proposeTimesForConversation(providerConversation, validNewTimes(providerConversation.id));
    const requesterView: ConversationFixture = {
      ...proposed,
      direction: "outgoing",
      requesterName: "تو",
      requesterRole: "درخواست‌دهنده"
    };
    const activeTimes = getActiveProposedTimes(requesterView);
    const oldSupersededTime = providerConversation.proposedTimes[0];
    const staleSelection = selectTimeForConversation(requesterView, oldSupersededTime.id);
    const html = renderToStaticMarkup(<SelectTimePage initialConversation={requesterView} />);

    expect(proposed.status).toBe("times_proposed");
    expect(proposed.timeOptionsStatus).toBe("ACTIVE");
    expect(activeTimes).toHaveLength(3);
    expect(activeTimes.every((time) => time.version === 2 && time.status === "ACTIVE")).toBe(true);
    expect(staleSelection.status).toBe("times_proposed");
    expect(staleSelection.selectedTimeId).toBeFalsy();
    expect(html).toContain(newTimeRequestCopy.newOptionsTitle);
    expect(html).toContain(newTimeRequestCopy.newOptionsDescription);
    expect(html).not.toContain(oldSupersededTime.dateLabel);
  });

  it("keeps completed cancellation visible only as a closed row with a detail CTA", () => {
    const cancelled = byId("conv-expired");
    const grouped = groupConversationStatusSections([cancelled], "outgoing");
    const html = renderToStaticMarkup(<ConversationsPage initialConversations={[cancelled]} initialTab="outgoing" />);

    expect(cancelled.status).toBe("cancelled");
    expect(grouped.history).toHaveLength(1);
    expect(grouped.inProgress).toHaveLength(0);
    expect(html).toContain("گذشته و بسته‌شده");
    expect(html).toContain("درخواست لغو شد");
    expect(html).toContain("این درخواست لغو شد و مبلغ برگشتی به کیف پول شما اضافه شد.");
    expect(html).toContain("مشاهده جزئیات");
    expect(html).not.toContain("حالا چه کاری می‌توانید انجام دهید؟");
    expect(html).not.toContain("۹۰٪");
  });

  it("keeps support-review cancellations in progress, not history", () => {
    const review = supportReviewCancellation(byId("conv-scheduled"));
    const grouped = groupConversationStatusSections([review], "outgoing");
    const html = renderToStaticMarkup(<ConversationsPage initialConversations={[review]} initialTab="outgoing" />);

    expect(grouped.inProgress).toHaveLength(1);
    expect(grouped.history).toHaveLength(0);
    expect(html).toContain("در جریان");
    expect(html).toContain("لغو در حال بررسی است");
    expect(html).toContain("درخواست لغو ثبت شده و توسط پشتیبانی یوزراوا بررسی می‌شود.");
    expect(html).toContain("مشاهده جزئیات");
    expect(html).not.toContain("جلسه‌های قطعی");
  });

  it("creates new-time notifications without exposing old routes or payment copy", () => {
    const requested = requestNewTimesForConversation(byId("conv-time-options"));
    const requestNotifications = createNewTimeRequestNotifications(requested);
    const proposed = proposeTimesForConversation(byId("conv-provider-waiting"), validNewTimes("conv-provider-waiting"));
    const readyNotification = createNewTimeOptionsNotification(proposed);

    expect(requestNotifications.some((notification) => notification.targetRoute.endsWith("/propose-times"))).toBe(true);
    expect(requestNotifications.map((notification) => notification.message).join(" ")).toContain("زمان‌های جدید");
    expect(readyNotification.targetRoute).toBe(`/conversations/${proposed.id}/select-time`);
    expect(readyNotification.message).toBe(newTimeRequestCopy.notificationRequesterReadyText);
    [...requestNotifications, readyNotification].forEach((notification) => {
      expect(notification.message).not.toContain("پرداخت");
      expect(notification.message).not.toContain("کد تأیید");
    });
  });
});
