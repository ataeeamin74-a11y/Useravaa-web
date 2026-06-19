import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ConversationDetailPage } from "@/features/v51/conversations/pages/ConversationDetailPage";
import { CheckoutPage } from "@/features/v51/conversations/pages/CheckoutPage";
import {
  conversations,
  getSessionCoordinationContact,
  payConversation,
  postPaymentContactCopy,
  providerContactFixtures,
  requesterContactFixtures,
  sessionContactDetailsAreUnlocked
} from "@/features/v51/data/conversations";
import { profiles } from "@/features/v51/data/profiles";
import { DiscoverPage } from "@/features/v51/discover/DiscoverPage";
import { InsightsPage } from "@/features/v51/insights/InsightsPage";
import { ProfileDetailPage } from "@/features/v51/profile/ProfileDetailPage";
import { SavedPage } from "@/features/v51/saved/SavedPage";

const allContactValues = [
  ...Object.values(providerContactFixtures).flatMap((contact) => [contact.phoneNumber, contact.email]),
  ...Object.values(requesterContactFixtures).flatMap((contact) => [contact.phoneNumber, contact.email])
].filter((value): value is string => Boolean(value));

function expectNoContactDetails(html: string) {
  allContactValues.forEach((value) => {
    expect(html).not.toContain(value);
  });
}

describe("V51 paid session contact unlock", () => {
  it("keeps phone and email hidden before payment and shows locked contact copy", () => {
    const conversation = conversations.find((item) => item.id === "conv-awaiting-payment");
    expect(conversation).toBeDefined();

    const html = renderToStaticMarkup(<ConversationDetailPage initialConversation={conversation!} />);

    expect(sessionContactDetailsAreUnlocked(conversation!)).toBe(false);
    expect(getSessionCoordinationContact(conversation!)).toBeNull();
    expect(html).toContain(postPaymentContactCopy.lockedTitle);
    expect(html).toContain(postPaymentContactCopy.lockedHelper);
    expect(html).toContain("پرداخت امن و ارسال درخواست");
    expectNoContactDetails(html);
  });

  it("shows provider phone and email to the seeker after successful payment", () => {
    const conversation = conversations.find((item) => item.id === "conv-scheduled");
    expect(conversation).toBeDefined();

    const contact = providerContactFixtures[conversation!.profile.id];
    const html = renderToStaticMarkup(<ConversationDetailPage initialConversation={conversation!} />);

    expect(sessionContactDetailsAreUnlocked(conversation!)).toBe(true);
    expect(html).toContain(postPaymentContactCopy.unlockedTitle);
    expect(html).toContain(postPaymentContactCopy.unlockedHelper);
    expect(html).toContain("شماره تماس");
    expect(html).toContain("ایمیل");
    expect(html).toContain(contact.phoneNumber);
    expect(html).toContain(contact.email);
  });

  it("shows requester phone and email to the provider after successful payment", () => {
    const conversation = conversations.find((item) => item.id === "conv-provider-confirmed");
    expect(conversation).toBeDefined();

    const contact = requesterContactFixtures[conversation!.requesterId];
    const html = renderToStaticMarkup(<ConversationDetailPage initialConversation={conversation!} />);

    expect(sessionContactDetailsAreUnlocked(conversation!)).toBe(true);
    expect(html).toContain(postPaymentContactCopy.unlockedTitle);
    expect(html).toContain("شماره تماس");
    expect(html).toContain("ایمیل");
    expect(html).toContain(contact.phoneNumber);
    expect(html).toContain(contact.email);
  });

  it("mock payment keeps contact locked until requester selects a proposed time", () => {
    const conversation = conversations.find((item) => item.id === "conv-awaiting-payment");
    expect(conversation).toBeDefined();

    const paid = payConversation(conversation!);
    const html = renderToStaticMarkup(<ConversationDetailPage initialConversation={paid} />);

    expect(paid.status).toBe("pending_provider_response");
    expect(sessionContactDetailsAreUnlocked(paid)).toBe(false);
    expect(getSessionCoordinationContact(paid)).toBeNull();
    expect(html).toContain(postPaymentContactCopy.lockedTitle);
    expectNoContactDetails(html);
  });

  it("checkout explains that secure payment sends the request before coordination info unlocks", () => {
    const conversation = conversations.find((item) => item.id === "conv-awaiting-payment");
    expect(conversation).toBeDefined();

    const html = renderToStaticMarkup(<CheckoutPage initialConversation={conversation!} />);
    const heldFundsCopy = "مبلغ تا قطعی‌شدن جلسه نزد یوزراوا نگه داشته می‌شود";

    expect(html).toContain("با پرداخت، درخواست شما برای تجربه‌آفرین ارسال می‌شود");
    expect(html).toContain(heldFundsCopy);
    expect(html.split(heldFundsCopy).length - 1).toBe(1);
    expect(html).not.toContain(postPaymentContactCopy.checkoutNotice);
    expect(html).not.toContain(postPaymentContactCopy.unlockedTitle);
  });

  it("does not expose phone or email on public discovery, insights, saved, or profile pages", () => {
    const pages = [
      renderToStaticMarkup(<DiscoverPage initialState="ready" />),
      renderToStaticMarkup(<InsightsPage />),
      renderToStaticMarkup(<SavedPage initialSavedProfileIds={["ali"]} initialSavedInsightIds={["insight-ali-path-1"]} />),
      renderToStaticMarkup(<ProfileDetailPage profile={profiles[0]} />)
    ];

    pages.forEach(expectNoContactDetails);
    pages.forEach((html) => {
      expect(html).not.toContain(postPaymentContactCopy.unlockedTitle);
      expect(html).not.toContain(postPaymentContactCopy.lockedTitle);
    });
  });
});
