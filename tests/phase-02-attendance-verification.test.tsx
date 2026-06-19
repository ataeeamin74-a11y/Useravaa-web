import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ConversationCard } from "@/features/v51/conversations/components/ConversationCard";
import { ConversationDetailPanel } from "@/features/v51/conversations/components/ConversationDetailPanel";
import { NotificationsPage } from "@/features/v51/notifications/NotificationsPage";
import {
  attendanceVerificationCopy,
  conversationNotifications,
  conversations,
  createConfirmedConversationNotificationAndEmail,
  createOneHourConversationReminder,
  getAttendanceVerificationCodeForRequester,
  getAttendanceVerificationStatus,
  getFundStatus,
  getProviderPayoutStatus,
  groupConversationSections,
  reliabilityMockNow,
  selectTimeForConversation,
  verifySessionAttendanceCode,
  type ConversationFixture
} from "@/features/v51/data/conversations";

function byId(id: string) {
  const conversation = conversations.find((item) => item.id === id);

  expect(conversation).toBeDefined();

  return conversation!;
}

function afterSelectedSessionEnd(conversation: ConversationFixture) {
  expect(conversation.selectedTime?.startAt).toBeDefined();
  return new Date(new Date(conversation.selectedTime!.startAt!).getTime() + conversation.duration * 60 * 1000 + 60 * 1000).toISOString();
}

function startedConversation(conversation: ConversationFixture): ConversationFixture {
  return {
    ...conversation,
    selectedTime: conversation.selectedTime
      ? {
          ...conversation.selectedTime,
          startAt: new Date(new Date(reliabilityMockNow).getTime() - 10 * 60 * 1000).toISOString()
        }
      : conversation.selectedTime
  };
}

describe("Phase 02 attendance verification for paid confirmed sessions", () => {
  it("generates a one-time five digit attendance code when requester selects a paid proposed time", () => {
    const conversation = byId("conv-time-options");
    const selected = selectTimeForConversation(conversation, conversation.proposedTimes[0].id);

    expect(selected.status).toBe("confirmed");
    expect(selected.attendanceVerificationStatus).toBe("PENDING");
    expect(selected.attendanceVerificationAttempts).toBe(0);
    expect(selected.attendanceVerificationCode).toMatch(/^\d{5}$/);
    expect(selected.attendanceVerificationCodeHash).toBeTruthy();
    expect(getAttendanceVerificationCodeForRequester(selected)).toBe(selected.attendanceVerificationCode);
  });

  it("shows the requester code on the confirmed session detail page", () => {
    const conversation = byId("conv-scheduled");
    const html = renderToStaticMarkup(<ConversationDetailPanel conversation={conversation} />);

    expect(html).toContain("کد تأیید برگزاری جلسه");
    expect(html).toContain(conversation.attendanceVerificationCode);
    expect(html).toContain("کپی");
    expect(html).not.toContain("کپی کد");
    expect(html).not.toContain("کد کپی شد");
    expect(html).toContain(attendanceVerificationCopy.requesterDetail);
    expect(attendanceVerificationCopy.copied).toBe("کپی شد");
    expect(attendanceVerificationCopy.copyFailed).toBe("کپی انجام نشد. لطفاً کد را به‌صورت دستی کپی کنید.");
    expect(html.indexOf("کد تأیید برگزاری جلسه")).toBeLessThan(html.indexOf("اطلاعات هماهنگی جلسه"));
  });

  it("does not expose the requester code to the provider and shows provider entry UI instead", () => {
    const conversation = byId("conv-provider-confirmed");
    const html = renderToStaticMarkup(<ConversationDetailPanel conversation={conversation} />);

    expect(html).toContain("ثبت برگزاری جلسه");
    expect(html).toContain(attendanceVerificationCopy.providerDetail);
    expect(html).toContain("کد تأیید برگزاری جلسه");
    expect(html.indexOf("ثبت برگزاری جلسه")).toBeLessThan(html.indexOf("اطلاعات هماهنگی جلسه"));
    expect(html).not.toContain(conversation.attendanceVerificationCode);
  });

  it("verifies attendance with the correct provider code and blocks code reuse", () => {
    const conversation = byId("conv-provider-confirmed");
    const verified = verifySessionAttendanceCode(conversation, conversation.attendanceVerificationCode!, conversation.providerId);

    expect(verified.success).toBe(true);
    expect(verified.message).toBe(attendanceVerificationCopy.verifiedTitle);
    expect(getAttendanceVerificationStatus(verified.conversation)).toBe("VERIFIED");
    expect(verified.conversation.attendanceVerifiedByProviderId).toBe(conversation.providerId);

    const reused = verifySessionAttendanceCode(verified.conversation, conversation.attendanceVerificationCode!, conversation.providerId);

    expect(reused.success).toBe(false);
    expect(reused.message).toBe(attendanceVerificationCopy.alreadyVerified);
  });

  it("keeps incorrect submissions calm and moves to review after five attempts", () => {
    let conversation = byId("conv-provider-confirmed");

    for (let attempt = 1; attempt <= 4; attempt += 1) {
      const result = verifySessionAttendanceCode(conversation, "00000", conversation.providerId);
      conversation = result.conversation;

      expect(result.success).toBe(false);
      expect(result.message).toBe(attendanceVerificationCopy.wrongCode);
      expect(conversation.attendanceVerificationAttempts).toBe(attempt);
    }

    const finalAttempt = verifySessionAttendanceCode(conversation, "00000", conversation.providerId);

    expect(finalAttempt.success).toBe(false);
    expect(finalAttempt.conversation.attendanceVerificationAttempts).toBe(5);
    expect(getAttendanceVerificationStatus(finalAttempt.conversation)).toBe("NEEDS_REVIEW");
    expect(finalAttempt.message).toBe(attendanceVerificationCopy.needsReview);
  });

  it("does not enable attendance verification for free, cancelled, rejected, or refunded sessions", () => {
    const base = byId("conv-scheduled");
    const blockedStates: ConversationFixture[] = [
      { ...base, id: "free-confirmed", freeHelp: true, paidAt: null },
      { ...base, id: "cancelled-confirmed", status: "cancelled", state: "cancelled" },
      { ...base, id: "rejected-confirmed", status: "rejected", state: "rejected" },
      { ...base, id: "refunded-confirmed", status: "refunded", state: "refunded" }
    ];

    blockedStates.forEach((conversation) => {
      const html = renderToStaticMarkup(<ConversationDetailPanel conversation={conversation} />);
      const result = verifySessionAttendanceCode(conversation, conversation.attendanceVerificationCode ?? "48291", conversation.providerId);

      expect(getAttendanceVerificationStatus(conversation)).toBe("NOT_REQUIRED");
      expect(getAttendanceVerificationCodeForRequester(conversation)).toBeNull();
      expect(result.success).toBe(false);
      expect(html).not.toContain("کد تأیید برگزاری جلسه");
      expect(html).not.toContain("روند تسویه");
    });
  });

  it("moves verified paid sessions into payout processing only after scheduled end", () => {
    const conversation = byId("conv-provider-confirmed");
    const beforeEnd = verifySessionAttendanceCode(conversation, conversation.attendanceVerificationCode!, conversation.providerId);
    const afterEnd = verifySessionAttendanceCode(
      {
        ...conversation,
        attendanceVerificationStatus: "PENDING",
        attendanceVerificationAttempts: 0
      },
      conversation.attendanceVerificationCode!,
      conversation.providerId,
      afterSelectedSessionEnd(conversation)
    );

    expect(getProviderPayoutStatus(beforeEnd.conversation)).toBe("NOT_READY");
    expect(getProviderPayoutStatus(afterEnd.conversation)).toBe("BLOCKED_MISSING_SETTLEMENT_INFO");
    expect(getFundStatus(afterEnd.conversation)).toBe("HELD_BY_USERAVAA");
  });

  it("shows missing settlement information copy only after verified provider attendance", () => {
    const conversation = byId("conv-provider-confirmed");
    const verified = verifySessionAttendanceCode(conversation, conversation.attendanceVerificationCode!, conversation.providerId, afterSelectedSessionEnd(conversation));
    const html = renderToStaticMarkup(<ConversationDetailPanel conversation={verified.conversation} />);

    expect(html).toContain("برگزاری جلسه ثبت شد");
    expect(html).toContain("برای پردازش تسویه، اطلاعات حساب خود را در کیف پول تکمیل کنید.");
    expect(html).toContain("تکمیل اطلاعات حساب");
    expect(html).not.toContain("اثبات");
    expect(html).not.toContain("ضدتقلب");
    expect(html).not.toContain("آزادسازی پول");
    expect(html).not.toContain("درآمد قابل برداشت");
  });

  it("marks verified ended paid sessions release-pending when settlement info is complete", () => {
    const conversation: ConversationFixture = {
      ...byId("conv-scheduled"),
      direction: "incoming",
      providerSettlementInfoComplete: true
    };
    const verified = verifySessionAttendanceCode(conversation, conversation.attendanceVerificationCode!, conversation.providerId, afterSelectedSessionEnd(conversation));

    expect(verified.success).toBe(true);
    expect(getProviderPayoutStatus(verified.conversation)).toBe("PENDING_24H");
    expect(getFundStatus(verified.conversation)).toBe("RELEASE_PENDING");
  });

  it("shows requester and provider attendance reminders on confirmed session cards", () => {
    const requester = startedConversation(byId("conv-scheduled"));
    const provider = startedConversation(byId("conv-provider-confirmed"));
    const requesterHtml = renderToStaticMarkup(<ConversationCard conversation={requester} bucket="done" />);
    const providerHtml = renderToStaticMarkup(<ConversationCard conversation={provider} bucket="needsAction" />);

    expect(requesterHtml).toContain(attendanceVerificationCopy.requesterCardAfterStart);
    expect(requesterHtml).not.toContain(requester.attendanceVerificationCode);
    expect(providerHtml).toContain(attendanceVerificationCopy.providerCardAfterStart);
    expect(providerHtml).toContain(attendanceVerificationCopy.providerNeedsActionStatus);
    expect(providerHtml).not.toContain(provider.attendanceVerificationCode);
  });

  it("keeps confirmed provider sessions out of needs action before the session starts", () => {
    const provider = byId("conv-provider-confirmed");
    const grouped = groupConversationSections(conversations, "incoming");

    expect(grouped.needsAction.some((conversation) => conversation.id === provider.id)).toBe(false);
    expect(grouped.confirmedSessions.some((conversation) => conversation.id === provider.id)).toBe(true);
  });

  it("surfaces started unverified provider sessions under needs action", () => {
    const startedProvider = startedConversation(byId("conv-provider-confirmed"));
    const grouped = groupConversationSections(conversations.map((conversation) => (conversation.id === startedProvider.id ? startedProvider : conversation)), "incoming");

    expect(grouped.needsAction.some((conversation) => conversation.id === "conv-provider-confirmed")).toBe(true);
    expect(grouped.confirmedSessions.some((conversation) => conversation.id === "conv-provider-confirmed")).toBe(false);
  });

  it("shows verified attendance status without keeping the provider input visible", () => {
    const conversation = byId("conv-provider-confirmed");
    const verified = verifySessionAttendanceCode(conversation, conversation.attendanceVerificationCode!, conversation.providerId);
    const html = renderToStaticMarkup(<ConversationDetailPanel conversation={verified.conversation} />);

    expect(html).toContain(attendanceVerificationCopy.verifiedTitle);
    expect(html).not.toContain('placeholder="مثلاً ۴۸۲۹۱"');
    expect(html).not.toContain(conversation.attendanceVerificationCode);
  });

  it("creates attendance-aware notifications without exposing the five digit code", () => {
    const requesterConfirmed = createConfirmedConversationNotificationAndEmail(byId("conv-scheduled"), "requester").notification;
    const providerConfirmed = createConfirmedConversationNotificationAndEmail(byId("conv-provider-confirmed"), "provider").notification;
    const requesterReminder = createOneHourConversationReminder(byId("conv-scheduled"), "requester").notification;
    const providerReminder = createOneHourConversationReminder(byId("conv-provider-confirmed"), "provider").notification;
    const notificationsHtml = renderToStaticMarkup(<NotificationsPage />);

    [requesterConfirmed, providerConfirmed, requesterReminder, providerReminder].forEach((notification) => {
      expect(notification.message).toContain("کد تأیید برگزاری");
      expect(notification.message).not.toMatch(/\d{5}/);
      expect(notification.message).not.toContain(byId("conv-scheduled").attendanceVerificationCode);
      expect(notification.message).not.toContain(byId("conv-provider-confirmed").attendanceVerificationCode);
    });

    expect(conversationNotifications.map((notification) => notification.message).join("\n")).toContain("کد تأیید برگزاری");
    expect(notificationsHtml).toContain("کد تأیید برگزاری");
    expect(notificationsHtml).not.toContain(byId("conv-scheduled").attendanceVerificationCode);
    expect(notificationsHtml).not.toContain(byId("conv-provider-confirmed").attendanceVerificationCode);
  });

  it("keeps distrust-heavy verification language out of the visible attendance flow", () => {
    const html = [
      renderToStaticMarkup(<ConversationDetailPanel conversation={byId("conv-scheduled")} />),
      renderToStaticMarkup(<ConversationDetailPanel conversation={byId("conv-provider-confirmed")} />),
      renderToStaticMarkup(<ConversationCard conversation={byId("conv-scheduled")} bucket="done" />),
      renderToStaticMarkup(<ConversationCard conversation={byId("conv-provider-confirmed")} bucket="needsAction" />)
    ].join("\n");

    ["اثبات", "ضدتقلب", "کد امنیتی", "آزادسازی پول"].forEach((copy) => {
      expect(html).not.toContain(copy);
    });
  });
});
