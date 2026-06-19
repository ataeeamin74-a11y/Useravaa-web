import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { Avatar, getAvatarSrc } from "@/components/ui/Avatar";
import { DEFAULT_AVATAR_SRC } from "@/components/ui/avatar-constants";
import { InlineIconText } from "@/components/ui/InlineIconText";
import { MetaChip } from "@/components/ui/MetaChip";
import { UseravaaIcon } from "@/components/ui/UseravaaIcon";
import { RatingDisplay } from "@/components/ui/RatingDisplay";
import { StatChip } from "@/components/ui/StatChip";
import { V51Button, V51LinkButton } from "@/features/v51/components/V51Button";
import { ConversationsPage } from "@/features/v51/conversations/pages/ConversationsPage";
import {
  formatFaCount,
  formatFaCurrencyToman,
  formatFaDateTime,
  formatFaDecimal,
  formatFaDurationMinutes,
  formatFaNumber,
  formatFaRating,
  formatPersianNumber,
  toPersianDigits
} from "@/lib/fa-format";

function readProjectFile(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("Phase 01 shared primitives", () => {
  it("formats user-facing Persian numerals and ratings without Latin digits", () => {
    expect(formatFaNumber(248)).toBe("۲۴۸");
    expect(formatFaDecimal(4.7)).toBe("۴٫۷");
    expect(formatFaRating(4.7)).toBe("۴٫۷ از ۵");
    expect(formatFaCount(3, "بینش")).toBe("۳ بینش");
    expect(formatFaCurrencyToman(1000000)).toBe("۱٬۰۰۰٬۰۰۰ تومان");
    expect(formatFaDurationMinutes(30)).toBe("۳۰ دقیقه");
    expect(formatPersianNumber(46)).toBe("۴۶");
    expect(formatFaDateTime("2026-06-01T15:00:00+03:30")).not.toMatch(/[0-9]/);
    expect(toPersianDigits("12:30")).toBe("۱۲:۳۰");
  });

  it("renders StatChip with value before label, Persian digits, and bidi isolation classes", () => {
    const html = renderToStaticMarkup(<StatChip value={248} label="بازدید پروفایل" />);
    const requestHtml = renderToStaticMarkup(<StatChip value={2} label="درخواست جدید" />);
    const insightHtml = renderToStaticMarkup(<StatChip value={3} label="بینش منتشرشده" icon="insight" />);

    expect(html).toContain("ua-stat-chip");
    expect(html).toContain("ua-stat-value");
    expect(html).toContain("ua-stat-label");
    expect(html.indexOf("۲۴۸")).toBeLessThan(html.indexOf("بازدید پروفایل"));
    expect(html).not.toContain("248");
    expect(requestHtml.indexOf("۲")).toBeLessThan(requestHtml.indexOf("درخواست جدید"));
    expect(insightHtml).toContain("lucide-sparkles");
    expect(insightHtml.indexOf("۳")).toBeLessThan(insightHtml.indexOf("بینش منتشرشده"));
  });

  it("renders conversation tab counts and summaries with Persian numerals", () => {
    const html = renderToStaticMarkup(<ConversationsPage />);

    expect(html).toContain("ارسالی ۱۳");
    expect(html).toContain("دریافتی ۸");
    expect(html).toContain("اقدام باز دارید");
    expect(html).not.toContain("ارسالی 13");
    expect(html).not.toContain("دریافتی 8");
    expect(html).not.toContain("9 اقدام باز دارید");
  });

  it("renders RatingDisplay with localized RTL rating text and controlled star color class", () => {
    const html = renderToStaticMarkup(<RatingDisplay value={4.7} count={3} showStars />);

    expect(html).toContain("۴٫۷ از ۵");
    expect(html).toContain("۳ بازخورد");
    expect(html).toContain("ua-rating-star-filled");
    expect(html).not.toContain("4.7");
    expect(html).not.toContain("3 بازخورد");
  });

  it("wraps button labels in the shared optical-alignment label span", () => {
    const buttonHtml = renderToStaticMarkup(<V51Button tone="primary">ارسال زمان‌ها</V51Button>);
    const linkHtml = renderToStaticMarkup(<V51LinkButton href="/discover">کشف تجربه‌ها</V51LinkButton>);

    expect(buttonHtml).toContain("ua-inline-control");
    expect(buttonHtml).toContain("ua-button");
    expect(buttonHtml).toContain("ua-inline-control-label button-label");
    expect(linkHtml).toContain("ua-inline-control");
    expect(linkHtml).toContain("ua-inline-control-label button-label");
  });

  it("keeps icon and label alignment classes together for utility buttons", () => {
    const html = renderToStaticMarkup(
      <V51Button type="button">
        <UseravaaIcon name="download" size={18} aria-hidden="true" />
        دانلود تصویر کارت
      </V51Button>
    );

    expect(html).toContain("ua-inline-control-icon");
    expect(html).toContain("ua-inline-control-label button-label");
    expect(html).toContain("دانلود تصویر کارت");
  });

  it("uses the shared default avatar asset instead of initials when no image is available", () => {
    const html = renderToStaticMarkup(<Avatar src="" alt="User avatar" size="lg" />);

    expect(DEFAULT_AVATAR_SRC).toBe("/assets/avatars/useravaa-default-profile-avatar.png");
    expect(fs.existsSync(path.join(process.cwd(), "public", DEFAULT_AVATAR_SRC))).toBe(true);
    expect(getAvatarSrc("")).toBe(DEFAULT_AVATAR_SRC);
    expect(html).toContain(DEFAULT_AVATAR_SRC);
    expect(html).toContain('data-avatar-mode="fallback"');
    expect(html).toContain('data-fallback="true"');
    expect(html).toContain("ua-avatar");
    expect(html).toContain("ua-avatar-image--fallback");
    expect(html).not.toContain("ua-avatar-image--photo");
    expect(html).not.toContain(">User avatar<");
  });

  it("keeps uploaded avatar images round through the shared avatar primitive", () => {
    const html = renderToStaticMarkup(<Avatar src="/avatars/mohsen.svg" alt="تصویر پروفایل محسن" size="profile" />);
    const avatarCss = readProjectFile("src/components/ui/Avatar.module.css");

    expect(html).toContain("/avatars/mohsen.svg");
    expect(html).toContain("ua-avatar");
    expect(html).toContain('data-avatar-mode="photo"');
    expect(html).toContain('data-fallback="false"');
    expect(html).toContain("ua-avatar-image--photo");
    expect(html).not.toContain("ua-avatar-image--fallback");
    expect(avatarCss).toContain("aspect-ratio: 1 / 1");
    expect(avatarCss).toContain("width: var(--ua-avatar-size, 40px)");
    expect(avatarCss).toContain("border-radius: 999px");
    expect(avatarCss).toContain("object-fit: cover");
    expect(avatarCss).not.toContain("object-fit: contain");
  });

  it("does not allow rounded avatar shape requests to become squircles", () => {
    const html = renderToStaticMarkup(<Avatar src="" alt="تصویر پروفایل" shape="rounded" size="sm" />);
    const avatarCss = readProjectFile("src/components/ui/Avatar.module.css");

    expect(html).toContain("ua-avatar");
    expect(html).toContain('data-avatar-mode="fallback"');
    expect(avatarCss).toContain(".rounded");
    expect(avatarCss).toContain("border-radius: 999px");
  });

  it("guards broken uploaded avatar errors without looping on the fallback asset", () => {
    const avatarSource = readProjectFile("src/components/ui/Avatar.tsx");

    expect(avatarSource).toContain("onError");
    expect(avatarSource).toContain("if (currentSrc !== fallbackSrc)");
    expect(avatarSource).toContain("setFailedSrc(currentSrc)");
  });

  it("keeps key person surfaces on the shared avatar primitive", () => {
    const keyAvatarSurfaces = [
      "src/components/header/Header.tsx",
      "src/features/v51/discover/DiscoverPage.tsx",
      "src/features/v51/profile/ProfileDetailPage.tsx",
      "src/features/v51/saved/SavedPage.tsx",
      "src/features/v51/conversations/components/ConversationCard.tsx",
      "src/features/v51/conversations/components/ConversationDetailPanel.tsx",
      "src/features/v51/my-profile/pages/ProfileDashboardClient.tsx",
      "src/features/v51/my-profile/components/ProfilePreviewCard.tsx"
    ];

    keyAvatarSurfaces.forEach((relativePath) => {
      const source = readProjectFile(relativePath);

      expect(source).toContain("<Avatar");
      expect(source).not.toContain("useravaa-default-avatar.png");
    });
  });

  it("keeps profile-specific avatar CSS overrides circular instead of squircle", () => {
    const profileCss = readProjectFile("src/features/v51/my-profile/components/MyProfile.module.css");
    const avatarClassNames = ["avatar", "bannerAvatar", "avatarPreview", "previewAvatar", "networkAvatar", "identityAvatar"];

    avatarClassNames.forEach((className) => {
      const matches = [...profileCss.matchAll(new RegExp(`\\.${className}\\s*\\{[^}]*\\}`, "g"))].map((match) => match[0]);

      expect(matches.length).toBeGreaterThan(0);
      matches.forEach((block) => {
        if (block.includes("border-radius")) {
          expect(block).toContain("border-radius: 999px");
        }
      });
    });
  });

  it("renders meta chips and inline icon text with shared optical alignment wrappers", () => {
    const chipHtml = renderToStaticMarkup(<MetaChip icon="insight">3 insights</MetaChip>);
    const inlineHtml = renderToStaticMarkup(<InlineIconText icon="download">Download</InlineIconText>);

    expect(chipHtml).toContain("ua-meta-chip");
    expect(chipHtml).toContain("ua-meta-chip-icon");
    expect(chipHtml).toContain("ua-meta-chip-label");
    expect(inlineHtml).toContain("ua-inline-icon-text");
    expect(inlineHtml).toContain("ua-inline-icon-text-icon");
    expect(inlineHtml).toContain("ua-inline-icon-text-label");
  });

  it("centralizes dropdown outside-click, Escape, and route-change close behavior", () => {
    const hookSource = readProjectFile("src/lib/use-click-outside.ts");
    const headerSource = readProjectFile("src/components/header/Header.tsx");
    const discoverSource = readProjectFile("src/features/v51/discover/DiscoverPage.tsx");

    expect(hookSource).toContain('document.addEventListener("pointerdown"');
    expect(headerSource).toContain("useClickOutside");
    expect(headerSource).toContain('event.key === "Escape"');
    expect(headerSource).toContain("usePathname");
    expect(discoverSource).toContain("useClickOutside");
  });
});
