import fs from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DiscoverPage } from "@/features/v51/discover/DiscoverPage";
import { myProfileDashboardFixture, validateCompanyDisplaySettings } from "@/features/v51/data/my-profile";
import {
  INSIGHT_ANALYTICS_EVENTS,
  conversationLanguageOptions,
  currentInsightQuestionCycle,
  discoveryAnalyticsEvents,
  emptyDiscoverFilters,
  filterDiscoverProfiles,
  getDiscoverPreviousCompanyOptions,
  getDiscoverExperienceCompanyOptions,
  getDiscoverJobCategoryOptions,
  getInsightPromptHeader,
  getPublicCompanySummary,
  getProfileInsights,
  getPublishedInsightCountForProfile,
  jobFieldTaxonomy,
  latestCompanySelectionIsValid,
  languageMatches,
  normalizeDiscoveryText,
  profileAcceptsConversationRequests,
  publishedInsights,
  searchDiscoverExperienceCompanies,
  searchDiscoverJobCategories,
  type DiscoverFilters
} from "@/features/v51/data/experience-discovery";
import { profiles, type ExperienceProfileFixture } from "@/features/v51/data/profiles";
import { InsightsPage } from "@/features/v51/insights/InsightsPage";
import { ProfileInsightsSection } from "@/features/v51/profile/ProfileInsightsSection";
import { ProfileDashboardClient } from "@/features/v51/my-profile/pages/ProfileDashboardClient";
import { SavedPage } from "@/features/v51/saved/SavedPage";

function readProjectFile(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

const authenticatedInsightsViewer = {
  id: "user-requester",
  displayName: "علی"
} as const;

describe("Experience Discovery System", () => {
  it("discover renders search above the four allowed filters with the exact placeholder", () => {
    const html = renderToStaticMarkup(<DiscoverPage initialState="ready" />);

    expect(html.indexOf("نقش، شرکت، دسته‌بندی شغلی یا نام فرد را جستجو کن")).toBeLessThan(html.indexOf("گروه شغلی"));
    expect(html).toContain("aria-label=\"گروه شغلی\"");
    expect(html).toContain("aria-label=\"رده سازمانی\"");
    expect(html).toContain("aria-label=\"نام شرکت\"");
    expect(html).toContain("جستجوی گروه شغلی...");
    expect(html).toContain("جستجوی نام شرکت...");
    expect(html).not.toContain("aria-label=\"شرکت‌های قبلی\"");
    expect(html).toContain("aria-label=\"زبان جلسه\"");
    expect(html).not.toContain("aria-label=\"سابقه کار\"");
    expect(html).not.toContain("مرتب‌سازی");
  });

  it("discover search is submitted-state based and does not run from draft state directly", () => {
    const source = readProjectFile("src/features/v51/discover/DiscoverPage.tsx");
    const allResults = filterDiscoverProfiles(profiles, "", emptyDiscoverFilters);
    const submittedResults = filterDiscoverProfiles(profiles, "نازنین", emptyDiscoverFilters);

    expect(source).toContain("searchDraft");
    expect(source).toContain("submittedSearchQuery");
    expect(allResults.length).toBeGreaterThan(submittedResults.length);
    expect(submittedResults.map((profile) => profile.id)).toEqual(["nazanin"]);
  });

  it("discover search covers name, jobTitle, job category, current company, previous companies, and timeline company", () => {
    expect(filterDiscoverProfiles(profiles, "علی", emptyDiscoverFilters).map((profile) => profile.id)).toContain("ali");
    expect(filterDiscoverProfiles(profiles, "طراح محصول", emptyDiscoverFilters).map((profile) => profile.id)).toContain("sara");
    expect(filterDiscoverProfiles(profiles, "علوم داده و هوش مصنوعی", emptyDiscoverFilters).map((profile) => profile.id)).toContain("nazanin");
    expect(filterDiscoverProfiles(profiles, "کافه‌بازار", emptyDiscoverFilters).map((profile) => profile.id)).toContain("sara");
    expect(filterDiscoverProfiles(profiles, "علی‌بابا", emptyDiscoverFilters).map((profile) => profile.id)).toContain("nazanin");
    expect(getDiscoverPreviousCompanyOptions()).toContain("دیوار");
    expect(getDiscoverExperienceCompanyOptions()).toContain("کافه‌بازار");
  });

  it("discover search normalizes Persian variants and filter groups use AND with OR inside groups", () => {
    const filters: DiscoverFilters = {
      ...emptyDiscoverFilters,
      jobCategories: ["محصول و تجربه کاربر", "علوم داده و هوش مصنوعی"],
      languages: ["فارسی و انگلیسی"]
    };
    const results = filterDiscoverProfiles(profiles, "كافه‌بازار", filters);

    expect(normalizeDiscoveryText("  كافه‌بازار   تست  ")).toBe("کافه‌بازار تست");
    expect(results.map((profile) => profile.id)).toEqual(["sara"]);
  });

  it("discover company filter searches timeline companies and applies current-company context", () => {
    const html = renderToStaticMarkup(<DiscoverPage initialState="ready" initialCompanyComboboxOpen initialCompanySearchQuery="دیجی" />);
    const filters: DiscoverFilters = {
      ...emptyDiscoverFilters,
      previousCompanies: ["دیجی‌کالا"]
    };
    const results = filterDiscoverProfiles(profiles, "", filters).map((profile) => profile.id);

    expect(html).toContain("دیجی‌کالا");
    expect(searchDiscoverExperienceCompanies("دیجی")).toContain("دیجی‌کالا");
    expect(renderToStaticMarkup(<DiscoverPage initialState="ready" initialCompanyComboboxOpen initialCompanySearchQuery="زز" />)).toContain("نتیجه‌ای پیدا نشد");
    expect(results).toContain("nazanin");
    expect(results).toContain("reza");
  });

  it("discover searchable filters are data-backed for job group and company options", () => {
    const jobHtml = renderToStaticMarkup(<DiscoverPage initialState="ready" initialJobCategoryComboboxOpen initialJobCategorySearchQuery="محصول" />);
    const dbJobHtml = renderToStaticMarkup(
      <DiscoverPage initialState="ready" initialJobCategoryComboboxOpen jobCategoryOptions={[jobFieldTaxonomy[11]]} />
    );
    const emptyJobHtml = renderToStaticMarkup(<DiscoverPage initialState="ready" initialJobCategoryComboboxOpen initialJobCategorySearchQuery="مالی" />);
    const companyHtml = renderToStaticMarkup(<DiscoverPage initialState="ready" initialCompanyComboboxOpen initialCompanySearchQuery="دیجی" />);

    expect(getDiscoverJobCategoryOptions()).toContain("محصول و تجربه کاربر");
    expect(getDiscoverJobCategoryOptions()).not.toContain("مالی، حقوقی و سرمایه‌گذاری");
    expect(searchDiscoverJobCategories("محصول")).toEqual(["محصول و تجربه کاربر"]);
    expect(searchDiscoverExperienceCompanies("دیجی")).toContain("دیجی‌کالا");
    expect(jobHtml).toContain("محصول و تجربه کاربر");
    expect(dbJobHtml).toContain(jobFieldTaxonomy[11]);
    expect(companyHtml).toContain("دیجی‌کالا");
    expect(emptyJobHtml).toContain("نتیجه‌ای پیدا نشد");
  });

  it("conversation language filter respects Persian, English, and bilingual rules", () => {
    expect(conversationLanguageOptions).toEqual(["فارسی", "انگلیسی", "فارسی و انگلیسی"]);
    expect(languageMatches(["فارسی", "انگلیسی"], "فارسی و انگلیسی")).toBe(true);
    expect(languageMatches(["فارسی"], "انگلیسی")).toBe(false);
    expect(languageMatches(["فارسی", "انگلیسی"], "انگلیسی")).toBe(true);
  });

  it("discover cards exclude transactional and social affordances and keep profile CTAs", () => {
    const html = renderToStaticMarkup(<DiscoverPage initialState="ready" />);

    expect(html).toContain("مشاهده تجربه");
    expect(html).toContain("هماهنگی جلسه");
    expect(html).not.toContain("هماهنگی جلسه مشاوره");
    expect(html).toContain("aria-label=\"ذخیره تجربه\"");
    expect(html).toContain("بینش منتشرشده از این تجربه");
    expect(renderToStaticMarkup(<DiscoverPage initialState="ready" initialSavedProfileIds={["ali"]} />)).toContain("ذخیره‌شده");
    expect(html).not.toContain("دنبال");
    expect(html).not.toContain("درخواست گفت‌وگو");
    expect(html).not.toContain("تومان");
    expect(html).not.toContain("درصد نزدیکی");
    expect(getPublishedInsightCountForProfile("ali")).toBe(3);
  });

  it("discover excludes inactive profiles while keeping providers that do not accept conversation requests visible", () => {
    const inactive: ExperienceProfileFixture = { ...profiles[0], id: "inactive", status: "inactive" };
    const results = filterDiscoverProfiles([...profiles, inactive], "", emptyDiscoverFilters);

    expect(results.map((profile) => profile.id)).not.toContain("inactive");
    expect(profileAcceptsConversationRequests(profiles.find((profile) => profile.id === "hamid")!)).toBe(false);
    expect(results.map((profile) => profile.id)).toContain("hamid");
  });

  it("company summary uses public display settings and falls back to latest company", () => {
    const ali = profiles.find((profile) => profile.id === "ali")!;
    const mina = profiles.find((profile) => profile.id === "mina")!;
    const invalidSelection: ExperienceProfileFixture = {
      ...ali,
      publicExperienceCompanyIds: ["missing-company"]
    };

    expect(latestCompanySelectionIsValid(ali)).toBe(true);
    expect(getPublicCompanySummary(ali)).toBe("تجربه کاری در اسنپ و دیجی‌کالا");
    expect(getPublicCompanySummary(mina)).toBe("تجربه کاری در اسنپ");
    expect(getPublicCompanySummary(invalidSelection)).toBe("تجربه کاری در اسنپ");
  });

  it("insights renders the refined page name, masthead, inline filters, and current question", () => {
    const html = renderToStaticMarkup(<InsightsPage viewer={authenticatedInsightsViewer} />);

    expect(html).toContain("<h1>بینش‌ها</h1>");
    expect(html).toContain("تجربه‌های کوتاه و واقعی برای تصمیم‌های شغلی بهتر.");
    expect(html).not.toContain("فیلتر دسته‌بندی شغلی");
    expect(html).toContain("در حال خواندن بینش‌های");
    expect(html).toContain("همه دسته‌بندی‌های شغلی");
    expect(html).not.toContain(">همه دسته‌بندی‌ها<");
    expect(html).not.toContain("همه واقعیت‌ها");
    expect(html).not.toContain("نوع بینش");
    expect(html).toContain("سؤال جدید");
    expect(html).toContain(currentInsightQuestionCycle.questionText);
    expect(html).toContain("نوشتن پاسخ کوتاه");
    expect(html).not.toContain("فعلاً نه");
  });

  it("insights no longer renders intent-card onboarding, ask-question flow, or transfer branch", () => {
    const html = renderToStaticMarkup(<InsightsPage />);

    expect(html).not.toContain("۳ سؤال مهم برای");
    expect(html).not.toContain("جواب دقیق سؤالت را پیدا نکردی؟");
    expect(html).not.toContain("سؤال بپرس");
    expect(html).not.toContain("ثبت اولین بینش");
  });

  it("insights exposes only the job-category reader filter", () => {
    const categoryHtml = renderToStaticMarkup(<InsightsPage initialOpenFilter="jobCategory" />);

    jobFieldTaxonomy.forEach((category) => {
      expect(categoryHtml).toContain(category);
    });
    expect(categoryHtml).not.toContain("نوع بینش");
    expect(categoryHtml).not.toContain("همه واقعیت‌ها");
    expect(categoryHtml).not.toContain("همه قالب‌ها");
  });

  it("insights can receive active DB-backed category options without exposing inactive static options", () => {
    const categoryHtml = renderToStaticMarkup(
      <InsightsPage initialOpenFilter="jobCategory" jobCategoryOptions={[jobFieldTaxonomy[0]]} />
    );

    expect(categoryHtml).toContain(jobFieldTaxonomy[0]);
    expect(categoryHtml).not.toContain(jobFieldTaxonomy[1]);
  });

  it("insights filters results by selected category only", () => {
    const categoryHtml = renderToStaticMarkup(<InsightsPage initialCategory="علوم داده و هوش مصنوعی" />);

    expect(categoryHtml).toContain("علوم داده و هوش مصنوعی");
    expect(categoryHtml).toContain("نازنین ک.");
    expect(categoryHtml).not.toContain("علی ر.");
  });

  it("insight cards are equal-weight and render required source/action fields", () => {
    const html = renderToStaticMarkup(<InsightsPage />);

    expect(html).toContain(getInsightPromptHeader(publishedInsights[0]));
    expect(html).toContain("امروز");
    expect(html).toContain("علی ر.");
    expect(html).toContain("مدیر محصول");
    expect(html).toContain("مدیر میانی");
    expect(html).toContain("مشاهده تجربه");
    expect(html).toContain("تجربه کاری در");
    expect(html).not.toContain("از تجربه در");
    expect(html).not.toContain("اشتراک‌گذاری");
    expect(html).toContain("aria-label=\"ذخیره\"");
    expect(renderToStaticMarkup(<InsightsPage initialSavedInsightIds={["insight-ali-path-1"]} />)).toContain("ذخیره‌شده");
    expect(html).not.toContain("intentCard");
    expect(html).not.toContain("هماهنگی جلسه");
    expect(html).not.toContain(">دانلود<");
  });

  it("insight cards exclude request, price, booking, social, popularity, rating, and match wording", () => {
    const html = renderToStaticMarkup(<InsightsPage />);

    ["درخواست گفت‌وگو", "تومان", "رزرو", "فالو", "دنبال", "تعداد بازدید", "محبوب‌ترین", "پربازدیدترین", "امتیاز", "match", "score", "درصد نزدیکی"].forEach(
      (forbidden) => {
        expect(html).not.toContain(forbidden);
      }
    );
  });

  it("owner-only export uses selected owned insight data before copy and image actions", () => {
    const html = renderToStaticMarkup(<InsightsPage initialDownloadInsightId="insight-ali-path-1" />);
    const nonOwnerHtml = renderToStaticMarkup(<InsightsPage initialDownloadInsightId="insight-mohsen-data-1" />);
    const source = readProjectFile("src/features/v51/insights/InsightsPage.tsx");
    const insight = publishedInsights.find((item) => item.id === "insight-ali-path-1")!;

    expect(html).not.toContain("دانلود تصویر بینش");
    expect(html).toContain("دانلود تصویر کارت");
    expect(html).toContain("کپی لینک");
    expect(html).toContain(insight.canonicalUrl);
    expect(nonOwnerHtml).not.toContain("دانلود تصویر بینش");
    expect(source).not.toContain("onShare={setShareInsight}");
    expect(source).not.toContain("onClick={() => onShare(insight)}");
    expect(source).toContain("profileId === currentViewerProfileId");
    expect(source).toContain("downloadInsightShareImage(activeShareData)");
    expect(source).toContain("copyInsightCanonicalUrl(activeShareData)");
  });

  it("active question module links providers to the answer area without a provider CTA block", () => {
    const html = renderToStaticMarkup(<InsightsPage />);

    expect(html).toContain("نوشتن پاسخ کوتاه");
    expect(html).not.toContain("/profile#weekly-question");
    expect(html).not.toContain("تجربه‌ای درباره سؤال این دوره دارید؟");
  });

  it("insights answer composer renders the 280-character counter and enforces textarea length", () => {
    const emptyHtml = renderToStaticMarkup(<InsightsPage viewer={authenticatedInsightsViewer} initialAnswerComposerOpen />);
    const draftedHtml = renderToStaticMarkup(<InsightsPage viewer={authenticatedInsightsViewer} initialAnswerComposerOpen initialAnswerDraft={"ا".repeat(124)} />);

    expect(emptyHtml).toContain("<textarea");
    expect(emptyHtml).toContain("maxLength=\"280\"");
    expect(emptyHtml).toContain("۰ / ۲۸۰");
    expect(emptyHtml).toContain("حداکثر ۲۸۰ کاراکتر");
    expect(emptyHtml).toContain("سؤال جدید");
    expect(emptyHtml).toContain("این نکته بیشتر به درد چه کسانی می‌خورد؟");
    expect(emptyHtml).toContain('type="checkbox"');
    expect(emptyHtml).toContain("انتشار بینش");
    expect(draftedHtml).toContain("۱۲۴ / ۲۸۰");
  });

  it("insights answer composer keeps no-profile fallback inside the page flow", () => {
    const html = renderToStaticMarkup(<InsightsPage viewer={authenticatedInsightsViewer} initialAnswerComposerOpen initialHasExperienceProfile={false} />);

    expect(html).toContain("برای پاسخ دادن، اول پروفایل تجربه بسازید.");
    expect(html).toContain("ساخت پروفایل تجربه");
    expect(html).not.toContain("/profile#weekly-question");
  });

  it("load more is controlled by a button instead of infinite scroll", () => {
    const html = renderToStaticMarkup(<InsightsPage />);
    const source = readProjectFile("src/features/v51/insights/InsightsPage.tsx");

    expect(html).toContain("نمایش بینش‌های بیشتر");
    expect(source).toContain("setVisibleCount");
    expect(source).not.toContain("IntersectionObserver");
  });

  it("public profile insights section shows 2 to 3 published insights and hides when empty", () => {
    const aliHtml = renderToStaticMarkup(<ProfileInsightsSection profileId="ali" />);
    const emptyHtml = renderToStaticMarkup(<ProfileInsightsSection profileId="hamid" />);

    expect(aliHtml).toContain("بینش‌های این تجربه");
    expect(aliHtml).not.toContain("پیش‌نویس داخلی");
    expect(aliHtml).not.toContain("پس‌گرفته‌شده");
    expect(getProfileInsights("ali").length).toBeGreaterThanOrEqual(2);
    expect(getProfileInsights("ali").length).toBeLessThanOrEqual(3);
    expect(emptyHtml).not.toContain("بینش‌های این تجربه");
  });

  it("shared taxonomy and analytics contracts are present", () => {
    expect(jobFieldTaxonomy).toEqual([
      "محصول و تجربه کاربر",
      "طراحی گرافیک و هویت بصری",
      "فنی و مهندسی نرم‌افزار",
      "علوم داده و هوش مصنوعی",
      "مارکتینگ و برند",
      "تحلیل و توسعه کسب‌وکار",
      "عملیات",
      "تجربه مشتری",
      "پشتیبانی مشتریان",
      "فروش و بازرگانی",
      "استراتژی و مدل کسب‌وکار",
      "مالی، حقوقی و سرمایه‌گذاری",
      "منابع انسانی و فرهنگ سازمانی",
      "مدیریت، رهبری و کارآفرینی"
    ]);
    expect(discoveryAnalyticsEvents).toContain("discover_search_submitted");
    expect(INSIGHT_ANALYTICS_EVENTS.PAGE_OPENED).toBe("insight_page_opened");
    expect(INSIGHT_ANALYTICS_EVENTS.DOWNLOAD_PREVIEW_OPENED).toBe("insight_download_preview_opened");
    expect(INSIGHT_ANALYTICS_EVENTS.PROVIDER_ANSWER_CTA_CLICKED).toBe("provider_answer_cta_clicked");
    expect(publishedInsights.some((insight) => insight.status === "draft")).toBe(true);
    expect(publishedInsights.some((insight) => insight.status === "retracted")).toBe(true);
  });

  it("profile settings and owner dashboard expose mandatory company display and own insight actions", () => {
    const dashboardHtml = renderToStaticMarkup(<ProfileDashboardClient fixture={myProfileDashboardFixture} activeQuestionAnswered />);
    const settingsSource = readProjectFile("src/features/v51/my-profile/pages/ProfileSettingsPage.tsx");

    expect(validateCompanyDisplaySettings(myProfileDashboardFixture.profile).latestCompanyId).toBe("");
    expect(settingsSource).toContain("آخرین شرکت محل فعالیت");
    expect(settingsSource).toContain("شرکت‌های قابل نمایش در پروفایل");
    expect(settingsSource).toContain("آخرین شرکت محل فعالیت الزامی است و نمی‌تواند پنهان شود.");
    expect(dashboardHtml).toContain("بینش‌های من");
    expect(dashboardHtml).toContain("دانلود تصویر");
    expect(dashboardHtml).toContain("کپی لینک");
  });

  it("saved page renders local saved experiences and insights with the required empty state", () => {
    const emptyHtml = renderToStaticMarkup(<SavedPage />);
    const savedHtml = renderToStaticMarkup(
      <SavedPage initialSavedProfileIds={["ali"]} initialSavedInsightIds={["insight-ali-path-1", "insight-ali-draft-hidden"]} />
    );

    expect(emptyHtml).toContain("هنوز فردی ذخیره نکرده‌اید.");
    expect(savedHtml).toContain("ذخیره‌شده‌ها");
    expect(savedHtml).toContain("role=\"tablist\"");
    expect(savedHtml).toContain("افراد ذخیره‌شده");
    expect(savedHtml).toContain("بینش‌های ذخیره‌شده");
    expect(savedHtml).toContain("علی ر.");
    expect(savedHtml).not.toContain(currentInsightQuestionCycle.questionText);
    expect(savedHtml).not.toContain("پیش‌نویس داخلی");
    expect(renderToStaticMarkup(<SavedPage initialTab="insights" initialSavedProfileIds={["ali"]} initialSavedInsightIds={["insight-ali-path-1"]} />)).toContain(currentInsightQuestionCycle.questionText);
  });
});
