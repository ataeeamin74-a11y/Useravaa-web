import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  CareerComparisonTable,
  ComparePage,
  normalizeInitialComparePathIds
} from "@/features/career/ComparePage";
import { GuideEntryCard, PathEngagementActions } from "@/features/career/PathsPage";
import { MyPathsContent } from "@/features/career/MyPathsPage";
import {
  addSavedCareerComparison,
  includesSavedCareerComparison,
  parseSavedCareerComparisons,
  SAVED_COMPARISONS_STORAGE_KEY
} from "@/features/career/career-saved-comparisons";
import {
  addSavedCareerPathId,
  parseSavedCareerPathIds,
  SAVED_PATHS_STORAGE_KEY
} from "@/features/career/career-saved-paths";
import { careerPaths, getCareerPathByCardId } from "@/features/career/career-path-index";
import { navigationItems } from "@/features/career/CareerBottomNav";

describe("Path Seeker engagement", () => {
  const firstPath = careerPaths[0];
  const secondPath = careerPaths[1];

  it("migrates legacy card saves to stable path IDs and avoids duplicates", () => {
    const legacyPath = getCareerPathByCardId("CARD_001")!;
    const migrated = parseSavedCareerPathIds('["CARD_001","CARD_001"]');
    const legacyManagementVariant = parseSavedCareerPathIds('["CARD_033"]');
    const savedAgain = addSavedCareerPathId(migrated, legacyPath.id);

    expect([...migrated]).toEqual([legacyPath.id]);
    expect([...savedAgain]).toEqual([legacyPath.id]);
    expect([...legacyManagementVariant]).toEqual([getCareerPathByCardId("CARD_033")!.id]);
    expect(SAVED_PATHS_STORAGE_KEY).toBe("useravaa:career:saved-paths");
  });

  it("deduplicates saved comparisons regardless of selection order", () => {
    const saved = addSavedCareerComparison([], [firstPath.id, secondPath.id]);
    const duplicate = addSavedCareerComparison(saved, [secondPath.id, firstPath.id]);

    expect(duplicate).toHaveLength(1);
    expect(includesSavedCareerComparison(duplicate, [secondPath.id, firstPath.id])).toBe(true);
    expect(parseSavedCareerComparisons(JSON.stringify(duplicate))).toEqual(duplicate);
    expect(SAVED_COMPARISONS_STORAGE_KEY).toBe("useravaa:career:saved-comparisons");
  });

  it("renders detail engagement actions before the long-form content contract", () => {
    const unsavedHtml = renderToStaticMarkup(
      <PathEngagementActions path={firstPath} saved={false} onSave={() => true} />
    );
    const savedHtml = renderToStaticMarkup(
      <PathEngagementActions path={firstPath} saved onSave={() => true} />
    );

    expect(unsavedHtml).toContain("افزودن به مسیرهای شغلی من");
    expect(savedHtml).toContain("به مسیرهای شغلی من اضافه شد");
    expect(unsavedHtml).toContain("مقایسه با مسیرهای دیگر");
    expect(unsavedHtml).toContain(`/career/compare?path=${encodeURIComponent(firstPath.id)}`);
  });

  it("keeps the guide available outside the three-item bottom navigation", () => {
    const html = renderToStaticMarkup(<GuideEntryCard />);

    expect(html).toContain("نمی‌دونی از کدام مسیر شغلی شروع کنی؟");
    expect(html).toContain("راهنمای انتخاب مسیر شغلی را ببین.");
    expect(html).toContain('href="/career/guide"');
    expect(navigationItems.map((item) => item.label)).toEqual(["مسیرها", "مقایسه", "مسیرهای من"]);
  });

  it("preselects valid compare paths and asks for a second path", () => {
    expect(normalizeInitialComparePathIds([firstPath.id, "unknown", firstPath.id])).toEqual([firstPath.id]);
    const html = renderToStaticMarkup(<ComparePage initialPathIds={[firstPath.id]} />);

    expect(html).toContain("مسیر شغلی دوم را برای مقایسه انتخاب کن");
    expect(html).toContain("این مسیر شغلی برای مقایسه انتخاب شده است.");
    expect(html).toContain('aria-pressed="true"');
  });

  it("renders the save-comparison state in a valid comparison table", () => {
    const html = renderToStaticMarkup(
      <CareerComparisonTable
        paths={[firstPath, secondPath]}
        onEdit={() => undefined}
        onSave={() => undefined}
        saved
      />
    );

    expect(html).toContain("مقایسه ذخیره شد");
  });

  it("renders My Paths empty, saved path, and saved comparison states", () => {
    const emptyHtml = renderToStaticMarkup(
      <MyPathsContent savedPathIds={new Set()} savedComparisons={[]} hasLoaded />
    );
    const populatedHtml = renderToStaticMarkup(
      <MyPathsContent
        savedPathIds={new Set([firstPath.id])}
        savedComparisons={[[firstPath.id, secondPath.id]]}
        hasLoaded
      />
    );

    expect(emptyHtml).toContain("هنوز مسیر شغلی‌ای اضافه نکردی");
    expect(emptyHtml).toContain('href="/career"');
    expect(populatedHtml).toContain("مسیرهای شغلی ذخیره‌شده");
    expect(populatedHtml).toContain("مقایسه‌های ذخیره‌شده");
    expect(populatedHtml).toContain("/career?card=");
    expect(populatedHtml).toContain("/career/compare?path=");

    const myPathsSource = readFileSync("src/features/career/MyPathsPage.tsx", "utf8");
    expect(myPathsSource).toContain("مسیرهای شغلی من");
    expect(myPathsSource).toContain("مسیرهای شغلی‌ای که برای بررسی نگه می‌داری اینجا می‌آیند.");
  });

  it("uses refined Career UI icon strokes while preserving filled tab states", () => {
    const softIcons = readFileSync("src/features/career/CareerSoftIcons.tsx", "utf8");
    const careerIcons = [
      "src/features/career/PathsPage.tsx",
      "src/features/career/ComparePage.tsx",
      "src/features/career/MyPathsPage.tsx",
      "src/features/career/CareerSaveButton.tsx",
      "src/features/career/SavedPathsPage.tsx"
    ].map((file) => readFileSync(file, "utf8")).join("\n");
    const leadSheet = readFileSync("src/features/career/CareerLeadCaptureSheet.tsx", "utf8");

    expect(softIcons).not.toMatch(/strokeWidth="(?:2\.[1-9]|[3-9](?:\.\d+)?)"/);
    expect(careerIcons).not.toMatch(/strokeWidth=\{(?:2\.[1-9]|[3-9](?:\.\d+)?)\}/);
    expect(softIcons).toContain('strokeWidth="2"');
    expect(softIcons).toContain('fill="currentColor"');
    expect(leadSheet).toContain("<SoftCloseIcon size={18} />");
  });

  it("does not couple engagement storage to database or the install guide", () => {
    const sources = [
      "src/features/career/career-saved-paths.ts",
      "src/features/career/career-saved-comparisons.ts",
      "src/features/career/MyPathsPage.tsx",
      "src/features/career/ComparePage.tsx"
    ].map((file) => readFileSync(file, "utf8")).join("\n");
    const shell = readFileSync("src/features/career/CareerShell.tsx", "utf8");

    expect(sources).not.toMatch(/prisma|database_url|@\/lib\/backend/i);
    expect(shell).toContain("<IosInstallGuide />");
  });
});
