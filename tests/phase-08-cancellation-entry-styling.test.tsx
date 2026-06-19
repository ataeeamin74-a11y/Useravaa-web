import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ConversationDetailPanel } from "@/features/v51/conversations/components/ConversationDetailPanel";
import { ConversationStatusRow } from "@/features/v51/conversations/components/ConversationStatusRow";
import {
  cancelConversation,
  cancellationPolicyCopy,
  conversations,
  reliabilityMockNow,
  type ConversationFixture
} from "@/features/v51/data/conversations";

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
          startAt: "2026-05-23T10:00:00+03:30"
        }
      : conversation.selectedTime
  };
}

const forbiddenNormalCancellationCopy = [
  "راه‌های کم‌هزینه‌تر",
  "کم‌هزینه‌تر",
  "قبل از لغو، شاید بتوانیم مسیر را ساده‌تر کنیم",
  "صاحب تجربه",
  "وقت",
  "جریمه",
  "پنالتی",
  "آزادسازی پول"
];

describe("Phase 08 cancellation entry and semantic state styling", () => {
  it("renders the normal cancellation entry as self-service without support as the default path", () => {
    const html = renderToStaticMarkup(<ConversationDetailPanel conversation={byId("conv-time-options")} />);

    expect(html).toContain("تغییر در این درخواست");
    expect(html).toContain("اگر ادامه این گفت‌وگو برایتان مناسب نیست، می‌توانید لغو درخواست را بررسی کنید.");
    expect(html).toContain("پیش از تأیید نهایی، مقدار بازگشت اعتبار نمایش داده می‌شود.");
    expect(html).toContain("بررسی لغو درخواست");
    expect(html).not.toContain("ارتباط با پشتیبانی");
  });

  it("keeps the first cancellation modal copy locked and support-free", () => {
    expect(cancellationPolicyCopy.alternativesTitle).toBe("لغو درخواست");
    expect(cancellationPolicyCopy.alternativesText).toContain("تا زمانی که لغو را تأیید نکنید، تغییری در درخواست ایجاد نمی‌شود.");
    expect(cancellationPolicyCopy.back).toBe("بازگشت");
    expect(cancellationPolicyCopy.continueCancel).toBe("ادامه لغو درخواست");
    expect(cancellationPolicyCopy.alternativesText).not.toContain("ارتباط با پشتیبانی");
  });

  it("uses danger classes for completed cancellation detail states but keeps entry neutral", () => {
    const cancelled = cancelConversation(byId("conv-time-options"), {
      reasonCode: "TIME_OPTIONS_NOT_SUITABLE",
      cancelledByRole: "REQUESTER"
    });
    const activeHtml = renderToStaticMarkup(<ConversationDetailPanel conversation={byId("conv-time-options")} />);
    const cancelledHtml = renderToStaticMarkup(<ConversationDetailPanel conversation={cancelled} />);

    expect(activeHtml).not.toContain("cancelledStateDanger");
    expect(cancelledHtml).toContain("درخواست لغو شد");
    expect(cancelledHtml).toContain("cancelledStateDanger");
    expect(cancelledHtml).toContain("cancelledStatusDanger");
  });

  it("uses danger classes for late no-refund cancellation detail states", () => {
    const cancelled = cancelConversation(nearSession(byId("conv-scheduled")), {
      reasonCode: "PREFER_NOT_TO_SAY",
      cancelledByRole: "REQUESTER"
    }, reliabilityMockNow);
    const html = renderToStaticMarkup(<ConversationDetailPanel conversation={cancelled} />);

    expect(html).toContain("درخواست لغو شد");
    expect(html).toContain("این درخواست کمتر از ۳ ساعت مانده به زمان جلسه لغو شد");
    expect(html).toContain("مبلغی به کیف پول شما بازنگشت");
    expect(html).toContain("cancelledStateDanger");
    expect(html).toContain("cancelledStatusDanger");
  });

  it("uses danger styling on compact cancelled rows", () => {
    const cancelled = cancelConversation(byId("conv-time-options"), {
      reasonCode: "TIME_OPTIONS_NOT_SUITABLE",
      cancelledByRole: "REQUESTER"
    });
    const html = renderToStaticMarkup(<ConversationStatusRow conversation={cancelled} bucket="done" />);

    expect(html).toContain("statusRowCancelled");
    expect(html).toContain("statusChipDanger");
    expect(html).toContain("درخواست لغو شد");
  });

  it("keeps support copy only for review or cancelled recovery states", () => {
    const activeHtml = renderToStaticMarkup(<ConversationDetailPanel conversation={byId("conv-time-options")} />);
    const cancelled = cancelConversation(byId("conv-time-options"), {
      reasonCode: "TIME_OPTIONS_NOT_SUITABLE",
      cancelledByRole: "REQUESTER"
    });
    const cancelledHtml = renderToStaticMarkup(<ConversationDetailPanel conversation={cancelled} />);

    expect(activeHtml).not.toContain("ارتباط با پشتیبانی");
    expect(cancelledHtml).toContain("ارتباط با پشتیبانی");
  });

  it("does not render forbidden cancellation copy in the updated entry or first modal copy", () => {
    const html = [
      renderToStaticMarkup(<ConversationDetailPanel conversation={byId("conv-time-options")} />),
      cancellationPolicyCopy.changeHelper,
      cancellationPolicyCopy.alternativesTitle,
      cancellationPolicyCopy.alternativesText
    ].join("\n");

    forbiddenNormalCancellationCopy.forEach((term) => {
      expect(html).not.toContain(term);
    });
    expect(html).not.toMatch(/لطفا(?!ً)/);
  });
});
