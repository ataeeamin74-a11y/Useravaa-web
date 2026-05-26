import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ConversationCard } from "@/features/v51/conversations/components/ConversationCard";
import { ConversationDetailPage } from "@/features/v51/conversations/pages/ConversationDetailPage";
import { NotificationsPage } from "@/features/v51/notifications/NotificationsPage";
import {
  applyExpiration,
  calculateCheckout,
  conversationNotificationCopy,
  conversationNotifications,
  conversationReliabilityCopy,
  conversations,
  createConversationRemindersForOneHourWindow,
  createConversationRequest,
  createNearExpirationWarning,
  createProposedTimesNotificationAndEmail,
  getNoIndefinitePendingViolations,
  getSimilarExperiences,
  hasProviderReliabilityBadge,
  hasRequesterReliabilityBadge,
  hasUnreadNotificationBadge,
  makeProposedTime,
  mockEmailLogs,
  payConversation,
  profileOrThrow,
  proposeTimesForConversation,
  reliabilityMockNow,
  selectTimeForConversation,
  validateProposedTimes
} from "@/features/v51/data/conversations";

function addHours(value: string, hours: number) {
  return new Date(new Date(value).getTime() + hours * 60 * 60 * 1000).toISOString();
}

describe("Conversation Request Reliability System", () => {
  it("new request starts with pending_provider_response and a 24 hour deadline", () => {
    const request = createConversationRequest({
      profile: profileOrThrow("ali"),
      duration: 30,
      note: "نیاز به راهنمایی دارم.",
      createdAt: reliabilityMockNow
    });

    expect(request.status).toBe("pending_provider_response");
    expect(request.providerResponseDeadlineAt).toBe(addHours(reliabilityMockNow, 24));
  });

  it("Provider sees badge and countdown for pending_provider_response", () => {
    const conversation = conversations.find((item) => item.id === "conv-provider-request");
    expect(conversation).toBeDefined();

    const html = renderToStaticMarkup(<ConversationCard conversation={conversation!} bucket="needsAction" />);

    expect(html).toContain(conversationReliabilityCopy.newRequestBadge);
    expect(html).toContain(conversationReliabilityCopy.providerDeadlineSample);
    expect(html).toContain(conversationReliabilityCopy.proposeTimesCta);
  });

  it("Provider cannot propose fewer than 3 times", () => {
    const conversation = conversations.find((item) => item.id === "conv-provider-request");
    const selected = [makeProposedTime("d1", "۰۹:۰۰"), makeProposedTime("d1", "۱۰:۰۰")];

    expect(validateProposedTimes(selected).errors).toContain(conversationReliabilityCopy.minimumTimesError);
    expect(proposeTimesForConversation(conversation!, selected).status).toBe("pending_provider_response");
  });

  it("duplicate proposed times are rejected", () => {
    const duplicated = [makeProposedTime("d1", "۰۹:۰۰"), makeProposedTime("d1", "۰۹:۰۰"), makeProposedTime("d2", "۱۰:۰۰")];

    expect(validateProposedTimes(duplicated).valid).toBe(false);
    expect(validateProposedTimes(duplicated).errors).toContain(conversationReliabilityCopy.duplicateTimesError);
  });

  it("proposing 3 times changes status to times_proposed and gives Requester 48 hours", () => {
    const conversation = conversations.find((item) => item.id === "conv-provider-request");
    const selected = [makeProposedTime("d1", "۰۹:۰۰"), makeProposedTime("d2", "۱۰:۰۰"), makeProposedTime("d3", "۱۵:۰۰")];
    const updated = proposeTimesForConversation(conversation!, selected, reliabilityMockNow);

    expect(updated.status).toBe("times_proposed");
    expect(updated.requesterSelectionDeadlineAt).toBe(addHours(reliabilityMockNow, 48));
    expect(updated.proposedTimes.every((time) => time.conversationRequestId === conversation!.id)).toBe(true);
  });

  it("Requester receives proposed-times notification and email log", () => {
    const conversation = conversations.find((item) => item.id === "conv-time-options");
    const result = createProposedTimesNotificationAndEmail(conversation!);
    const html = renderToStaticMarkup(<NotificationsPage />);

    expect(result.notification.message).toBe(conversationNotificationCopy.proposedTimes);
    expect(result.notification.targetRoute).toBe(`/conversations/${conversation!.id}/select-time`);
    expect(result.emailLog.templateKey).toBe("proposed_times");
    expect(mockEmailLogs.some((log) => log.templateKey === "proposed_times")).toBe(true);
    expect(html).toContain(conversationNotificationCopy.proposedTimes);
  });

  it("selecting time changes status to pending_payment and payment becomes enabled", () => {
    const conversation = conversations.find((item) => item.id === "conv-time-options");
    const selected = selectTimeForConversation(conversation!, conversation!.proposedTimes[0].id);

    expect(selected.status).toBe("pending_payment");
    expect(selected.selectedTimeId).toBe(conversation!.proposedTimes[0].id);
    expect(calculateCheckout(selected).paymentEnabled).toBe(true);
  });

  it("payment is disabled before time selection", () => {
    const conversation = conversations.find((item) => item.id === "conv-time-options");
    const checkout = calculateCheckout(conversation!);

    expect(checkout.paymentEnabled).toBe(false);
    expect(checkout.disabledReason).toBe(conversationReliabilityCopy.paymentUnavailable);
  });

  it("mock successful payment changes status to confirmed", () => {
    const conversation = conversations.find((item) => item.id === "conv-awaiting-payment");
    const paid = payConversation(conversation!);

    expect(paid.status).toBe("confirmed");
    expect(paid.confirmedAt).toBe(reliabilityMockNow);
  });

  it("request expires after 24h without Provider response", () => {
    const request = createConversationRequest({
      profile: profileOrThrow("ali"),
      duration: 30,
      note: "",
      createdAt: reliabilityMockNow
    });

    expect(applyExpiration(request, addHours(reliabilityMockNow, 25)).status).toBe("expired");
  });

  it("proposed times expire after 48h without Requester selection", () => {
    const conversation = conversations.find((item) => item.id === "conv-time-options");

    expect(applyExpiration(conversation!, addHours(conversation!.timesProposedAt!, 49)).status).toBe("expired");
  });

  it("expired request shows 3 to 5 similar experiences without exposing ranking language", () => {
    const conversation = conversations.find((item) => item.id === "conv-expired");
    const html = renderToStaticMarkup(<ConversationDetailPage initialConversation={conversation!} />);
    const similar = getSimilarExperiences(conversation!);

    expect(similar.length).toBeGreaterThanOrEqual(3);
    expect(similar.length).toBeLessThanOrEqual(5);
    expect(html).toContain(conversationReliabilityCopy.similarTitle);
    expect(html).not.toContain("match");
    expect(html).not.toContain("score");
    expect(html).not.toContain("درصد نزدیکی");
  });

  it("near-expiration warning is in-app only", () => {
    const conversation = conversations.find((item) => item.id === "conv-provider-near-expiration");
    const result = createNearExpirationWarning(conversation!);

    expect(result.notification.message).toBe(conversationNotificationCopy.nearExpiration);
    expect(result.emailLog).toBeNull();
  });

  it("reminder notification and email log are created one hour before confirmed conversation", () => {
    const reminders = createConversationRemindersForOneHourWindow(conversations);

    expect(reminders).toHaveLength(2);
    expect(reminders.every((item) => item.notification.message === conversationNotificationCopy.reminder)).toBe(true);
    expect(reminders.every((item) => item.emailLog.templateKey === "one_hour_reminder")).toBe(true);
  });

  it("badge helpers reflect reliability actions and unread notifications", () => {
    expect(hasProviderReliabilityBadge(conversations)).toBe(true);
    expect(hasRequesterReliabilityBadge(conversations)).toBe(true);
    expect(hasUnreadNotificationBadge(conversationNotifications)).toBe(true);
    expect(hasUnreadNotificationBadge([])).toBe(false);
  });

  it("no request remains indefinitely pending in current fixtures", () => {
    expect(getNoIndefinitePendingViolations(conversations)).toHaveLength(0);
  });
});
