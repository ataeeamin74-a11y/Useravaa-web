import fs from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  currentInsightQuestionCycle,
  getPublishedInsightBySlugOrId,
  publishedInsights
} from "@/features/v51/data/experience-discovery";
import { InsightsPage } from "@/features/v51/insights/InsightsPage";
import {
  buildInsightShareExportData,
  copyInsightCanonicalUrl,
  getInsightShareAnswerTextForRender,
  getInsightShareAnswerTypography,
  getInsightShareFilename,
  insightShareImageDimensions,
  insightShareFontFamily,
  insightShareVisualSpec
} from "@/features/v51/insights/insight-share-export";

function readProjectFile(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("Dynamic insight share export", () => {
  it("builds Mohsen share data from the selected insight and provider profile", () => {
    const data = buildInsightShareExportData("hidden-reality-data-to-product-mohsen");
    const html = renderToStaticMarkup(<InsightsPage initialDownloadInsightId="insight-mohsen-data-1" />);

    expect(data?.provider.id).toBe("mohsen");
    expect(data?.provider.name).toBe("محسن ن.");
    expect(data?.provider.avatarUrl).toBe("/avatars/mohsen.svg");
    expect(data?.provider.jobTitle).toBe("مدیر تحلیل داده");
    expect(data?.provider.companyName).toBe("دیجی‌کالا");
    expect(data?.provider.subtitle).toBe("مدیر تحلیل داده، دیجی‌کالا");
    expect(data?.insight.answerText).toContain("در تحلیل داده");
    expect(data?.insight.canonicalUrl).toBe("https://useravaa.com/insights/hidden-reality-data-to-product-mohsen");
    expect(html).not.toContain("دانلود تصویر بینش");
    expect(html).not.toContain("دانلود تصویر");
  });

  it("changes exported data when another provider insight is selected", () => {
    const mohsen = buildInsightShareExportData("hidden-reality-data-to-product-mohsen")!;
    const ali = buildInsightShareExportData("active-question-product-ambiguity-ali")!;

    expect(ali.provider.id).toBe("ali");
    expect(ali.provider.name).not.toBe(mohsen.provider.name);
    expect(ali.insight.answerText).not.toBe(mohsen.insight.answerText);
    expect(ali.insight.canonicalUrl).not.toBe(mohsen.insight.canonicalUrl);
  });

  it("uses templateStem for template insights and questionText for question-bank insights", () => {
    const templateInsight = publishedInsights.find((insight) => insight.id === "insight-mohsen-data-1")!;
    const questionBankInsight = publishedInsights.find((insight) => insight.id === "insight-ali-path-1")!;

    expect(buildInsightShareExportData(templateInsight.id)?.insight.promptHeader).toBe(templateInsight.templateStem);
    expect(buildInsightShareExportData(questionBankInsight.id)?.insight.promptHeader).toBe(currentInsightQuestionCycle.questionText);
  });

  it("copies the exact selected canonical URL", async () => {
    const data = buildInsightShareExportData("hidden-reality-data-to-product-mohsen")!;
    const writeText = vi.fn().mockResolvedValue(undefined);

    await copyInsightCanonicalUrl(data, { writeText });

    expect(writeText).toHaveBeenCalledWith(data.insight.canonicalUrl);
  });

  it("creates a selected-insight PNG filename and keeps the production modal input-free", () => {
    const data = buildInsightShareExportData("active-question-product-ambiguity-ali")!;
    const html = renderToStaticMarkup(<InsightsPage initialDownloadInsightId={data.insight.slug} />);

    expect(getInsightShareFilename(data)).toBe("useravaa-insight-active-question-product-ambiguity-ali.png");
    expect(html).not.toContain("دانلود تصویر بینش");
    expect(html).toContain("دانلود تصویر کارت");
    expect(html).toContain("کپی لینک");
    expect(html).not.toContain("بینش تجربه‌ای");
    expect(html).not.toContain("از تجربه در");
    expect(html).not.toContain("<input");
    expect(html).not.toContain("<textarea");
    expect(html).not.toContain("contenteditable");
  });

  it("keeps every published insight on a unique canonical URL", () => {
    const publicInsights = publishedInsights.filter((insight) => insight.status === "published");
    const urls = publicInsights.map((insight) => insight.canonicalUrl);

    expect(new Set(urls).size).toBe(urls.length);
    publicInsights.forEach((insight) => {
      expect(insight.canonicalUrl).toBe(`https://useravaa.com/insights/${insight.slug}`);
      expect(getPublishedInsightBySlugOrId(insight.slug)?.id).toBe(insight.id);
      expect(getPublishedInsightBySlugOrId(insight.id)?.slug).toBe(insight.slug);
    });
  });

  it("uses provider initials as the avatar fallback when no avatar exists", () => {
    const data = buildInsightShareExportData("active-question-product-ambiguity-ali")!;
    const html = renderToStaticMarkup(<InsightsPage initialDownloadInsightId={data.insight.id} />);

    expect(data.provider.avatarUrl).toBeUndefined();
    expect(data.provider.initials).toBe("ع");
    expect(html).toContain("ع");
  });

  it("renders and downloads PNG output instead of the removed SVG export path", () => {
    const exportSource = readProjectFile("src/features/v51/insights/insight-share-export.ts");
    const pageSource = readProjectFile("src/features/v51/insights/InsightsPage.tsx");

    expect(exportSource).toContain('"image/png"');
    expect(getInsightShareFilename(buildInsightShareExportData("insight-mohsen-data-1")!).endsWith(".png")).toBe(true);
    expect(exportSource).not.toContain("image/svg+xml");
    expect(pageSource).not.toContain("buildShareSvg");
    expect(pageSource).not.toContain("useravaa.com/insight\"");
  });

  it("uses a dedicated premium quote-card visual layout for PNG export", () => {
    const exportSource = readProjectFile("src/features/v51/insights/insight-share-export.ts");
    const previewSource = readProjectFile("src/features/v51/insights/InsightsPage.tsx");

    expect(insightShareImageDimensions).toEqual({ width: 1600, height: 900 });
    expect(insightShareVisualSpec.providerAvatarSize).toBeGreaterThanOrEqual(200);
    expect(insightShareVisualSpec.answerFontSize).toBeGreaterThanOrEqual(32);
    expect(insightShareVisualSpec.answerFontSize).toBeLessThanOrEqual(44);
    expect(insightShareVisualSpec.footerUrlFontSize).toBeLessThan(insightShareVisualSpec.answerFontSize);
    expect(exportSource).toContain("drawProviderAvatar(ctx, data, 1192, 196, avatarSize)");
    expect(exportSource).toContain("drawRoundedRect(ctx, 108, 206, 948, 492, 28)");
    expect(exportSource).toContain("drawFooterUrl(ctx, data.insight.canonicalUrl)");
    expect(exportSource).toContain("drawBrand(ctx, data)");
    expect(previewSource).toContain("previewQuotePanel");
    expect(previewSource).toContain("previewProvider");
  });

  it("adapts answer typography for short, medium, long, and 300-character renderer stress cases", () => {
    const short = "ا".repeat(80);
    const medium = "ب".repeat(170);
    const longValid = "پ".repeat(280);
    const stress = "ت".repeat(300);

    expect(getInsightShareAnswerTypography(short).sizeClass).toBe("short");
    expect(getInsightShareAnswerTypography(short).fontSize).toBeGreaterThan(getInsightShareAnswerTypography(medium).fontSize);
    expect(getInsightShareAnswerTypography(medium).sizeClass).toBe("medium");
    expect(getInsightShareAnswerTypography(longValid).sizeClass).toBe("long");
    expect(getInsightShareAnswerTypography(stress).sizeClass).toBe("long");
    expect(getInsightShareAnswerTypography(stress).fontSize).toBeLessThanOrEqual(36);
    expect(getInsightShareAnswerTextForRender(short)).toBe(short);
    expect(getInsightShareAnswerTextForRender(medium)).toBe(medium);
    expect(getInsightShareAnswerTextForRender(longValid)).toBe(longValid);
    expect(getInsightShareAnswerTextForRender(stress)).toBe(stress);
  });

  it("clamps only content beyond the 300-character renderer safety margin", () => {
    const stress = "ث".repeat(300);
    const overflow = "ج".repeat(301);

    expect(getInsightShareAnswerTextForRender(stress)).toHaveLength(300);
    expect(getInsightShareAnswerTextForRender(overflow)).toHaveLength(301);
    expect(getInsightShareAnswerTextForRender(overflow)).toMatch(/…$/);
  });

  it("uses the same answer typography tier in preview and downloaded PNG renderer", () => {
    const exportSource = readProjectFile("src/features/v51/insights/insight-share-export.ts");
    const pageSource = readProjectFile("src/features/v51/insights/InsightsPage.tsx");

    expect(exportSource).toContain("getInsightShareAnswerTypography");
    expect(exportSource).toContain("getCanvasAnswerTextFit");
    expect(pageSource).toContain("getInsightShareAnswerTypography");
    expect(pageSource).toContain("previewAnswerLong");
  });

  it("uses Yekan Bakh for V51 insights UI and PNG export typography", () => {
    const globals = readProjectFile("src/app/globals.css");
    const exportSource = readProjectFile("src/features/v51/insights/insight-share-export.ts");

    expect(globals).toContain("--font-yekan-bakh");
    expect(globals).toContain("--font-en");
    expect(globals).toContain("/fonts/yekan-bakh/yekan-bakh-medium.ttf");
    expect(globals).toContain("/fonts/manrope/manrope-variable.ttf");
    expect(insightShareFontFamily).toContain("Yekan Bakh");
    expect(exportSource).toContain("insightShareFontFamily");
    expect(exportSource).toContain("insightShareLatinFontFamily");
    expect(exportSource).toContain("ensureInsightShareFontsLoaded");
  });

  it("keeps export card metadata clean and quote-like", () => {
    const data = buildInsightShareExportData("active-question-product-ambiguity-ali")!;
    const html = renderToStaticMarkup(<InsightsPage initialDownloadInsightId={data.insight.id} />);
    const exportSource = readProjectFile("src/features/v51/insights/insight-share-export.ts");

    expect(data.provider.subtitle).toContain("،");
    expect(html).toContain(data.provider.subtitle);
    expect(html).not.toContain("رده سازمانی");
    expect(html).not.toContain("از تجربه در");
    expect(html).not.toContain("بینش تجربه‌ای");
    expect(exportSource).not.toContain("بینش تجربه‌ای");
    expect(exportSource).not.toContain("experienceCompanyText");
  });

  it("keeps the export renderer free from hardcoded provider or insight fixture data", () => {
    const exportSource = readProjectFile("src/features/v51/insights/insight-share-export.ts");

    ["محسن", "سارا", "علی ر.", "hidden-reality-data-to-product-mohsen", "career-switch-product-design-sara"].forEach((demoValue) => {
      expect(exportSource).not.toContain(demoValue);
    });
  });
});
