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
  removeSavedCareerComparison,
  SAVED_COMPARISONS_STORAGE_KEY
} from "@/features/career/career-saved-comparisons";
import {
  addSavedCareerPathId,
  parseSavedCareerPathIds,
  removeSavedCareerPathId,
  SAVED_PATHS_STORAGE_KEY
} from "@/features/career/career-saved-paths";
import {
  COMPARE_DRAFT_STORAGE_KEY,
  parseCompareDraftPathIds,
  updateCompareDraftSelection
} from "@/features/career/career-compare-state";
import { careerPaths, getCareerPathByCardId } from "@/features/career/career-path-index";
import {
  LEGACY_SOCIAL_MEDIA_CARD_IDS,
  LEGACY_SOCIAL_MEDIA_PATH_IDS,
  SOCIAL_MEDIA_MARKETING_CARD_ID
} from "@/features/career/career-path-migration";
import { navigationItems } from "@/features/career/CareerBottomNav";

describe("Path Seeker engagement", () => {
  const firstPath = careerPaths[0];
  const secondPath = careerPaths[1];

  it("migrates legacy card saves to stable path IDs and avoids duplicates", () => {
    const legacyPath = getCareerPathByCardId("CARD_001")!;
    const migrated = parseSavedCareerPathIds('["CARD_001","CARD_001"]');
    const legacyManagementVariant = parseSavedCareerPathIds('["CARD_033"]');
    const savedAgain = addSavedCareerPathId(migrated, legacyPath.id);
    const removed = removeSavedCareerPathId(savedAgain, legacyPath.id);

    expect([...migrated]).toEqual([legacyPath.id]);
    expect([...savedAgain]).toEqual([legacyPath.id]);
    expect([...removed]).toEqual([]);
    expect([...legacyManagementVariant]).toEqual([getCareerPathByCardId("CARD_033")!.id]);
    expect(SAVED_PATHS_STORAGE_KEY).toBe("useravaa:career:saved-paths");
  });

  it("migrates every legacy social-media identifier to one saved path", () => {
    const socialMediaPath = getCareerPathByCardId(SOCIAL_MEDIA_MARKETING_CARD_ID)!;
    const storedIdentifiers = [
      SOCIAL_MEDIA_MARKETING_CARD_ID,
      ...LEGACY_SOCIAL_MEDIA_CARD_IDS,
      ...LEGACY_SOCIAL_MEDIA_PATH_IDS,
      socialMediaPath.id
    ];
    const migratedPaths = parseSavedCareerPathIds(JSON.stringify(storedIdentifiers));
    const unrelatedPath = careerPaths.find((path) => (
      path.id !== socialMediaPath.id
    ))!;
    const migratedComparisons = parseSavedCareerComparisons(JSON.stringify([
      [LEGACY_SOCIAL_MEDIA_PATH_IDS[0], LEGACY_SOCIAL_MEDIA_PATH_IDS[1], unrelatedPath.id],
      [SOCIAL_MEDIA_MARKETING_CARD_ID, unrelatedPath.id]
    ]));
    const migratedDraft = parseCompareDraftPathIds(JSON.stringify({
      pathIds: [
        LEGACY_SOCIAL_MEDIA_PATH_IDS[0],
        LEGACY_SOCIAL_MEDIA_CARD_IDS[0],
        unrelatedPath.id
      ],
      updatedAt: 1_800_000_000_000
    }), 1_800_000_000_001);

    expect([...migratedPaths]).toEqual([socialMediaPath.id]);
    expect(migratedComparisons).toEqual([
      [socialMediaPath.id, unrelatedPath.id].sort()
    ]);
    expect(migratedDraft).toEqual([socialMediaPath.id, unrelatedPath.id]);
    expect(getCareerPathByCardId(LEGACY_SOCIAL_MEDIA_CARD_IDS[0])?.id).toBe(socialMediaPath.id);
    LEGACY_SOCIAL_MEDIA_PATH_IDS.forEach((legacyId) => {
      expect(parseSavedCareerPathIds(JSON.stringify([legacyId]))).toEqual(new Set([socialMediaPath.id]));
    });
  });

  it("deduplicates saved comparisons regardless of selection order", () => {
    const saved = addSavedCareerComparison([], [firstPath.id, secondPath.id]);
    const duplicate = addSavedCareerComparison(saved, [secondPath.id, firstPath.id]);
    const removed = removeSavedCareerComparison(duplicate, [secondPath.id, firstPath.id]);

    expect(duplicate).toHaveLength(1);
    expect(includesSavedCareerComparison(duplicate, [secondPath.id, firstPath.id])).toBe(true);
    expect(parseSavedCareerComparisons(JSON.stringify(duplicate))).toEqual(duplicate);
    expect(removed).toEqual([]);
    expect(SAVED_COMPARISONS_STORAGE_KEY).toBe("useravaa:career:saved-comparisons");
  });

  it("keeps an in-progress compare draft in session storage shape", () => {
    const firstDraft = updateCompareDraftSelection([], firstPath.id);
    const sameDraft = updateCompareDraftSelection(firstDraft, firstPath.id);
    const twoPathDraft = updateCompareDraftSelection(firstDraft, secondPath.id);
    const restartedDraft = updateCompareDraftSelection(twoPathDraft, secondPath.id);
    const storedDraft = JSON.stringify({ pathIds: twoPathDraft, updatedAt: 1_800_000_000_000 });

    expect(firstDraft).toEqual([firstPath.id]);
    expect(sameDraft).toEqual([firstPath.id]);
    expect(twoPathDraft).toEqual([firstPath.id, secondPath.id]);
    expect(restartedDraft).toEqual([secondPath.id]);
    expect(parseCompareDraftPathIds(storedDraft, 1_800_000_000_001)).toEqual(twoPathDraft);
    expect(parseCompareDraftPathIds(storedDraft, 1_800_000_000_000 + (25 * 60 * 60 * 1000))).toEqual([]);
    expect(COMPARE_DRAFT_STORAGE_KEY).toBe("useravaa:career:compare-draft");
  });

  it("renders detail engagement actions before the long-form content contract", () => {
    const unsavedHtml = renderToStaticMarkup(
      <PathEngagementActions path={firstPath} saved={false} onSave={() => true} onRemove={() => true} />
    );
    const savedHtml = renderToStaticMarkup(
      <PathEngagementActions path={firstPath} saved onSave={() => true} onRemove={() => true} />
    );

    expect(unsavedHtml).toContain("افزودن به مسیرهای شغلی من");
    expect(unsavedHtml).not.toContain("حذف از مسیرهای شغلی من");
    expect(unsavedHtml).toContain('aria-pressed="false"');
    expect(unsavedHtml).toContain("قدم تصمیم‌گیری");
    expect(unsavedHtml).toContain("اگر این مسیر به تصمیمت نزدیک است، آن را برای ادامه بررسی نگه دار.");
    expect(savedHtml).toContain("به مسیرهای شغلی من اضافه شد");
    expect(savedHtml).toContain("حذف از مسیرهای شغلی من");
    expect(savedHtml).toContain('aria-pressed="true"');
    expect(savedHtml).toContain("این مسیر برای ادامه بررسی در مسیرهای شغلی من آماده است.");
    expect(unsavedHtml).toContain("مقایسه با مسیرهای دیگر");
    expect(unsavedHtml).toContain("مشاهده صفحه مسیر");
    expect(unsavedHtml).toContain(`/career/compare?path=${encodeURIComponent(firstPath.id)}`);

    const pathSource = readFileSync("src/features/career/PathsPage.tsx", "utf8");
    expect(pathSource).toContain("startCompareDraftFromPath(path.id)");
    expect(pathSource).toContain('trackCareerEvent("career_path_saved"');
    expect(pathSource).toContain('trackCareerEvent("career_path_removed"');
    expect(pathSource).toContain('trackCareerEvent("career_compare_started"');
    expect(pathSource).toContain('trackCareerEvent("career_path_viewed"');
  });

  it("keeps the guide available outside the three-item bottom navigation", () => {
    const html = renderToStaticMarkup(<GuideEntryCard />);
    const bottomNavSource = readFileSync("src/features/career/CareerBottomNav.tsx", "utf8");

    expect(html).toContain("نمی‌دونی از کدام مسیر شغلی شروع کنی؟");
    expect(html).toContain("راهنمای انتخاب مسیر شغلی را ببین.");
    expect(html).toContain('href="/career/guide"');
    expect(navigationItems.map((item) => item.label)).toEqual(["مسیرها", "مقایسه", "مسیرهای من"]);
    expect(bottomNavSource).toContain('aria-label="ناوبری مسیرهای شغلی"');
  });

  it("preselects valid compare paths and asks for a second path", () => {
    expect(normalizeInitialComparePathIds([firstPath.id, "unknown", firstPath.id])).toEqual([firstPath.id]);
    const html = renderToStaticMarkup(<ComparePage initialPathIds={[firstPath.id]} />);

    expect(html).toContain("مسیر شغلی دوم را برای مقایسه انتخاب کن");
    expect(html).toContain("این مسیر شغلی برای مقایسه انتخاب شده است. مسیر دوم را از فهرست زیر انتخاب کن.");
    expect(html).toContain("یک مسیر دیگر انتخاب کن تا مقایسه فعال شود.");
    expect(html).toContain("شروع مقایسه جدید");
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('aria-live="polite"');
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
    const compareSource = readFileSync("src/features/career/ComparePage.tsx", "utf8");
    expect(compareSource).toContain('trackCareerEvent("career_compare_started"');
    expect(compareSource).toContain('trackCareerEvent("career_compare_selection_changed"');
    expect(compareSource).toContain('trackCareerEvent("career_comparison_saved"');
  });

  it("renders My Paths accordion controls, CTAs, and remove actions", () => {
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
    expect(emptyHtml).toContain("هنوز مقایسه‌ای ذخیره نکردی");
    expect(emptyHtml).toContain("از صفحه مسیرها شروع کن؛ هر مسیری را که برای ادامه بررسی مهم است اینجا نگه می‌داری.");
    expect(emptyHtml).toContain("وقتی دو مسیر یا بیشتر را کنار هم می‌گذاری، مقایسه ذخیره‌شده اینجا می‌ماند.");
    expect(emptyHtml).toContain("افزودن مسیر شغلی");
    expect(emptyHtml).toContain("ساخت مقایسه جدید");
    expect(emptyHtml).toContain('href="/career"');
    expect(emptyHtml).toContain('href="/career/compare"');
    expect(populatedHtml).toContain('aria-expanded="false"');
    expect(populatedHtml).toContain('aria-label="۱ مسیر ذخیره‌شده"');
    expect(populatedHtml).toContain('aria-label="۱ مقایسه ذخیره‌شده"');
    expect(populatedHtml).toContain('hidden=""');
    expect(populatedHtml).toContain("مسیرهای شغلی ذخیره‌شده");
    expect(populatedHtml).toContain("مقایسه‌های ذخیره‌شده");
    expect(populatedHtml).toContain("حذف");
    expect(populatedHtml).toContain("/career?card=");
    expect(populatedHtml).toContain("/career/compare?path=");

    const myPathsSource = readFileSync("src/features/career/MyPathsPage.tsx", "utf8");
    expect(myPathsSource).toContain("مسیرهای شغلی من");
    expect(myPathsSource).toContain("از صفحه مسیرها شروع کن؛ هر مسیری را که برای ادامه بررسی مهم است اینجا نگه می‌داری.");
    expect(myPathsSource).toContain("aria-expanded");
    expect(myPathsSource).toContain("aria-label={`${savedPaths.length.toLocaleString");
    expect(myPathsSource).toContain("onRemovePath(path.id)");
    expect(myPathsSource).toContain("onRemoveComparison(pathIds)");
    expect(myPathsSource).toContain('trackCareerEvent("career_my_paths_viewed"');
  });

  it("keeps Career mobile conversion copy out of forbidden product frames", () => {
    const careerUiSources = [
      "src/features/career/PathsPage.tsx",
      "src/features/career/ComparePage.tsx",
      "src/features/career/MyPathsPage.tsx",
      "src/features/career/CareerLeadCaptureSheet.tsx",
      "src/features/career/CareerBottomNav.tsx"
    ].map((file) => readFileSync(file, "utf8")).join("\n");

    expect(careerUiSources).not.toMatch(/منتور|تجربه‌آفرین|مشاوره|جلسه|رزرو|پرداخت|استخدام تضمینی|تضمین موفقیت|موفقیت قطعی|دوره آموزشی|کلاس|job board|course|mentor|advisor|session|booking|payment/i);
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
      "src/features/career/ComparePage.tsx",
      "src/features/career/career-compare-state.ts"
    ].map((file) => readFileSync(file, "utf8")).join("\n");
    const shell = readFileSync("src/features/career/CareerShell.tsx", "utf8");

    expect(sources).not.toMatch(/prisma|database_url|@\/lib\/backend/i);
    expect(shell).toContain("<IosInstallGuide />");
    expect(shell).toContain("<CareerEventBootstrap />");
    expect(shell).toContain("<CareerAnalyticsScript />");
  });
});
