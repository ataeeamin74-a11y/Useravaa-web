import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Header } from "@/components/header/Header";
import { DiscoverPage } from "@/features/v51/discover/DiscoverPage";
import { currentInsightQuestionCycle } from "@/features/v51/data/insight-question-cycle";
import { getProfileInsights } from "@/features/v51/data/experience-discovery";
import { profiles } from "@/features/v51/data/profiles";
import { InsightsPage } from "@/features/v51/insights/InsightsPage";
import { ProfileDashboardPage } from "@/features/v51/my-profile/pages/ProfileDashboardPage";
import { ProfileDetailPage } from "@/features/v51/profile/ProfileDetailPage";
import { SavedPage } from "@/features/v51/saved/SavedPage";

let pathname = "/discover";

vi.mock("next/navigation", () => ({
  usePathname: () => pathname
}));

describe("Comprehensive V51 consistency fix v7", () => {
  beforeEach(() => {
    pathname = "/discover";
  });

  it("header uses official Useravaa logo assets and the scoped RTL nav hierarchy", () => {
    const html = renderToStaticMarkup(<Header />);

    expect(html).toContain("%2Fbrand%2Fuseravaa%2Fuseravaa-primary-logo-lockup-fullcolor-transparent.png");
    expect(html).toContain("%2Fbrand%2Fuseravaa%2Fuseravaa-responsive-narrow-wordmark-navy-transparent.png");
    expect(html).toContain('alt="Useravaa"');
    expect(html).toContain("کشف تجربه‌ها");
    expect(html).toContain("بینش‌ها");
    expect(html).toContain("جلسه‌ها");
    expect(html).not.toContain("گفت‌وگوها");
    const mainNavHtml = html.slice(html.indexOf('aria-label="ناوبری اصلی"'), html.indexOf('aria-label="ابزارهای حساب"'));
    expect(mainNavHtml).not.toContain("پروفایل من");
    expect(html).toContain("پروفایل من");
    expect(html).toContain('href="/saved"');
    expect(html).toContain("ذخیره‌شده‌ها");
    expect(html).not.toContain("مشاهده پروفایل عمومی");
    expect(html.indexOf("پروفایل من")).toBeLessThan(html.indexOf("ذخیره‌شده‌ها"));
    expect(html.indexOf("ذخیره‌شده‌ها")).toBeLessThan(html.indexOf("تنظیمات حساب"));
    expect(html).toContain("خروج از حساب کاربری");
    expect(html).not.toContain(">UA<");
  });

  it("guest header exposes login and registration entry points", () => {
    const html = renderToStaticMarkup(<Header authState="guest" />);

    expect(html).toContain("ورود");
    expect(html).toContain("شروع کنید");
    expect(html).not.toContain("خروج از حساب کاربری");
  });

  it("/insights renders the shared active insight question and the page name بینش‌ها", () => {
    const html = renderToStaticMarkup(<InsightsPage viewer={{ id: "user-requester", displayName: "علی" }} />);

    expect(html).toContain("<h1>بینش‌ها</h1>");
    expect(html).toContain(currentInsightQuestionCycle.questionText);
  });

  it("/profile renders the exact same active question text with the connected widget copy", () => {
    const html = renderToStaticMarkup(<ProfileDashboardPage activeQuestionAnswered={false} />);

    expect(html).toContain("سؤال جدید هنوز پاسخ داده نشده");
    expect(html).toContain("نوشتن پاسخ کوتاه");
    expect(html).toContain("بینش‌های من");
    expect(html).not.toContain("کامل‌تر شدن پروفایل");
    expect(html).not.toContain("پرسش این هفته");
  });

  it("discover cards have one visible save control, published insight count, and profile-driven CTA", () => {
    const html = renderToStaticMarkup(<DiscoverPage initialState="ready" />);

    expect(html).toContain('aria-label="ذخیره تجربه"');
    expect(html).toContain('viewBox="0 0 256 256"');
    expect(html).not.toContain("lucide-");
    expect(html).toContain("ua-stat-chip");
    expect(html).toContain("ua-stat-value");
    const insightChipHtml = html.slice(html.indexOf("ua-stat-chip"), html.indexOf("مشاهده تجربه"));
    expect(insightChipHtml.indexOf("۳")).toBeLessThan(insightChipHtml.indexOf("بینش"));
    expect(html).toContain("مشاهده تجربه");
    expect(html).toContain("هماهنگی جلسه");
    expect(html).not.toContain("هماهنگی جلسه مشاوره");
    expect(html).not.toContain("ذخیره تجربه</button>");
    expect(html).not.toContain("درخواست گفت‌وگو");
  });

  it("/saved renders saved people and saved insights from local fixture state", () => {
    const html = renderToStaticMarkup(<SavedPage initialSavedProfileIds={["ali"]} initialSavedInsightIds={["insight-ali-path-1"]} />);
    const emptyHtml = renderToStaticMarkup(<SavedPage />);

    expect(emptyHtml).toContain("هنوز فردی ذخیره نکرده‌اید.");
    expect(html).toContain("افراد ذخیره‌شده");
    expect(html).toContain("بینش‌های ذخیره‌شده");
    expect(html).toContain("مشاهده تجربه");
    expect(html).not.toContain(currentInsightQuestionCycle.questionText);
  });

  it("public profile shows published insights, hides draft/retracted insights, and does not expose unanswered questions", () => {
    const html = renderToStaticMarkup(<ProfileDetailPage profile={profiles[0]} />);

    expect(html).toContain("بینش‌های این تجربه");
    expect(getProfileInsights("ali")).toHaveLength(3);
    expect(html).not.toContain("پیش‌نویس داخلی");
    expect(html).not.toContain("پس‌گرفته‌شده");
    expect(html).toContain(currentInsightQuestionCycle.questionText);
    expect(html).not.toContain("سؤال فعال");
    expect(html).not.toContain("پاسخ می‌دهم");
    expect(html).not.toContain("Follow");
    expect(html).not.toContain("Followers");
    expect(html).not.toContain("Following");
    expect(html).not.toContain("دنبال");
  });
});
