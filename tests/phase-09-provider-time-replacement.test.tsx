import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ActionsPage } from "@/features/v51/actions/pages/ActionsPage";
import { ConversationDetailPanel } from "@/features/v51/conversations/components/ConversationDetailPanel";
import { ConversationStatusRow } from "@/features/v51/conversations/components/ConversationStatusRow";
import { ConversationsPage } from "@/features/v51/conversations/pages/ConversationsPage";
import { ProposeTimesPage } from "@/features/v51/conversations/pages/ProposeTimesPage";
import { SelectTimePage } from "@/features/v51/conversations/pages/SelectTimePage";
import {
  canProviderReplaceProposedTimes,
  conversations,
  createProviderTimeReplacementNotifications,
  getActiveProposedTimes,
  getConversationRouteAccess,
  makeProposedTime,
  providerTimeReplacementCopy,
  replaceProviderProposedTimesForConversation,
  resolveUserActions,
  selectTimeForConversation,
  type ConversationFixture
} from "@/features/v51/data/conversations";

function byId(id: string) {
  const conversation = conversations.find((item) => item.id === id);

  expect(conversation).toBeDefined();

  return conversation!;
}

function replacementTimes(conversationId: string) {
  return [
    makeProposedTime("d3", "15:30", conversationId),
    makeProposedTime("d4", "10:00", conversationId),
    makeProposedTime("d5", "16:30", conversationId)
  ];
}

function requesterView(conversation: ConversationFixture): ConversationFixture {
  return {
    ...conversation,
    direction: "outgoing",
    requesterName: "تو",
    requesterRole: "درخواست‌دهنده"
  };
}

function projectSource(path: string) {
  return readFileSync(path, "utf8");
}

describe("Phase 09 provider-side time replacement", () => {
  it("allows the provider to replace one active set of three proposed times before requester selection", () => {
    const conversation = byId("conv-provider-times-proposed");

    expect(canProviderReplaceProposedTimes(conversation)).toBe(true);
    expect(canProviderReplaceProposedTimes(conversation, "provider-other")).toBe(false);
    expect(canProviderReplaceProposedTimes(requesterView(conversation))).toBe(false);
    expect(canProviderReplaceProposedTimes(byId("conv-provider-confirmed"))).toBe(false);
    expect(getConversationRouteAccess(conversation, "proposeTimes").allowed).toBe(true);
  });

  it("renders the provider detail replacement entry before cancellation without support or wallet copy", () => {
    const html = renderToStaticMarkup(<ConversationDetailPanel conversation={byId("conv-provider-times-proposed")} />);

    expect(html).toContain(providerTimeReplacementCopy.sectionTitle);
    expect(html).toContain(providerTimeReplacementCopy.sectionText);
    expect(html).toContain(providerTimeReplacementCopy.cta);
    expect(html).toContain(providerTimeReplacementCopy.cancelCta);
    expect(html).not.toContain("ارتباط با پشتیبانی");
    expect(html).not.toContain("کیف پول");
  });

  it("keeps the replacement confirmation modal copy in the provider detail component", () => {
    const source = projectSource("src/features/v51/conversations/components/ConversationDetailPanel.tsx");

    expect(source).toContain("providerTimeReplacementCopy.modalTitle");
    expect(source).toContain("providerTimeReplacementCopy.modalText");
    expect(source).toContain("providerTimeReplacementCopy.modalHelper");
    expect(source).toContain("providerTimeReplacementCopy.modalConfirm");
    expect(source).toContain("providerTimeReplacementCopy.cta");
    expect(source).toContain("providerSideClosureCopy.continueCancelRequest");
  });

  it("reuses the three-time proposal route in provider replacement mode", () => {
    const html = renderToStaticMarkup(<ProposeTimesPage initialConversation={byId("conv-provider-times-proposed")} />);

    expect(html).toContain(providerTimeReplacementCopy.formTitle);
    expect(html).toContain(providerTimeReplacementCopy.formHelper);
    expect(html).toContain(providerTimeReplacementCopy.formCta);
    expect(html).not.toContain("پرداخت امن و ارسال درخواست");
    expect(html).not.toContain("درخواست زمان‌های جدید");
  });

  it("supersedes old options, activates exactly three new options, and blocks stale selection", () => {
    const conversation = byId("conv-provider-times-proposed");
    const oldTime = conversation.proposedTimes[0];
    const replaced = replaceProviderProposedTimesForConversation(conversation, replacementTimes(conversation.id));
    const activeTimes = getActiveProposedTimes(replaced);
    const staleSelection = selectTimeForConversation(requesterView(replaced), oldTime.id);
    const confirmedSelection = selectTimeForConversation(requesterView(replaced), activeTimes[0].id);

    expect(replaced.status).toBe("times_proposed");
    expect(replaced.timeOptionsVersion).toBe(2);
    expect(replaced.timeOptionsStatus).toBe("ACTIVE");
    expect(replaced.timeOptionsReplacedAt).toBeTruthy();
    expect(replaced.timeOptionsReplacedByUserId).toBe(conversation.providerId);
    expect(replaced.previousTimeOptions?.every((time) => time.status === "SUPERSEDED")).toBe(true);
    expect(replaced.proposedTimes.filter((time) => time.version === 1).every((time) => time.status === "SUPERSEDED")).toBe(true);
    expect(activeTimes).toHaveLength(3);
    expect(activeTimes.every((time) => time.version === 2 && time.status === "ACTIVE")).toBe(true);
    expect(staleSelection.selectedTimeId).toBeFalsy();
    expect(staleSelection.status).toBe("times_proposed");
    expect(confirmedSelection.status).toBe("confirmed");
  });

  it("does not create checkout, wallet, cancellation, or support-review state during replacement", () => {
    const conversation = byId("conv-provider-times-proposed");
    const replaced = replaceProviderProposedTimesForConversation(conversation, replacementTimes(conversation.id));

    expect(replaced.paidAt).toBe(conversation.paidAt);
    expect(replaced.walletCreditId).toBeFalsy();
    expect(replaced.refundAmount).toBeFalsy();
    expect(replaced.cancelledAt).toBeFalsy();
    expect(replaced.cancellationReviewStatus).toBeFalsy();
    expect(getConversationRouteAccess(replaced, "checkout").allowed).toBe(false);
    expect(canProviderReplaceProposedTimes(replaced)).toBe(false);
  });

  it("shows requester replacement options in actions, sessions rows, and select-time without old options", () => {
    const replaced = requesterView(replaceProviderProposedTimesForConversation(byId("conv-provider-times-proposed"), replacementTimes("conv-provider-times-proposed")));
    const actions = resolveUserActions([replaced]).filter((action) => action.filter === "sessions");
    const actionsHtml = renderToStaticMarkup(<ActionsPage initialConversations={[replaced]} />);
    const sessionsHtml = renderToStaticMarkup(<ConversationsPage initialConversations={[replaced]} initialTab="outgoing" />);
    const selectTimeHtml = renderToStaticMarkup(<SelectTimePage initialConversation={replaced} />);

    expect(actions).toHaveLength(1);
    expect(actions[0].title).toBe(providerTimeReplacementCopy.requesterCta);
    expect(actions[0].description).toBe(providerTimeReplacementCopy.requesterDescription);
    expect(actions[0].primaryCta).toBe(providerTimeReplacementCopy.requesterCta);
    expect(actionsHtml).toContain(providerTimeReplacementCopy.requesterDescription);
    expect(sessionsHtml).toContain(providerTimeReplacementCopy.requesterTitle);
    expect(sessionsHtml).toContain(providerTimeReplacementCopy.requesterRowDescription);
    expect(sessionsHtml).toContain(providerTimeReplacementCopy.requesterCta);
    expect(selectTimeHtml).toContain(providerTimeReplacementCopy.requesterTitle);
    expect(selectTimeHtml).toContain(providerTimeReplacementCopy.requesterDescription);
    expect(selectTimeHtml).not.toContain(replaced.previousTimeOptions?.[0]?.dateLabel ?? "not-found");
  });

  it("shows provider replacement as a passive status row and not as a new task", () => {
    const replaced = replaceProviderProposedTimesForConversation(byId("conv-provider-times-proposed"), replacementTimes("conv-provider-times-proposed"));
    const sessionActions = resolveUserActions([replaced]).filter((action) => action.filter === "sessions");
    const rowHtml = renderToStaticMarkup(<ConversationStatusRow conversation={replaced} bucket="tracking" />);
    const sessionsHtml = renderToStaticMarkup(<ConversationsPage initialConversations={[replaced]} initialTab="incoming" />);

    expect(sessionActions).toHaveLength(0);
    expect(rowHtml).toContain(providerTimeReplacementCopy.providerStatusTitle);
    expect(rowHtml).toContain(providerTimeReplacementCopy.providerStatusDescription);
    expect(rowHtml).toContain("مشاهده جزئیات");
    expect(rowHtml).not.toContain(providerTimeReplacementCopy.formCta);
    expect(sessionsHtml).toContain(providerTimeReplacementCopy.providerStatusTitle);
    expect(sessionsHtml).not.toContain("نیازمند اقدام");
  });

  it("creates requester and provider notifications without cancellation, support, or payment copy", () => {
    const replaced = replaceProviderProposedTimesForConversation(byId("conv-provider-times-proposed"), replacementTimes("conv-provider-times-proposed"));
    const notifications = createProviderTimeReplacementNotifications(replaced);
    const requesterNotification = notifications.find((notification) => notification.receiverId === replaced.requesterId);
    const providerNotification = notifications.find((notification) => notification.receiverId === replaced.providerId);

    expect(requesterNotification?.message).toBe(providerTimeReplacementCopy.notificationRequesterText);
    expect(requesterNotification?.targetRoute).toBe(`/conversations/${replaced.id}/select-time`);
    expect(providerNotification?.message).toBe(providerTimeReplacementCopy.notificationProviderText);
    expect(providerNotification?.targetRoute).toBe(`/conversations/${replaced.id}`);
    notifications.forEach((notification) => {
      expect(notification.message).not.toContain("لغو");
      expect(notification.message).not.toContain("پشتیبانی");
      expect(notification.message).not.toContain("پرداخت");
      expect(notification.message).not.toContain("کیف پول");
    });
  });
});
