import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ComparePage } from "@/features/career/ComparePage";
import { MyPathsContent } from "@/features/career/MyPathsPage";
import { PathsPage } from "@/features/career/PathsPage";
import { careerPaths } from "@/features/career/career-path-index";
import {
  addSavedCareerComparison,
  type SavedCareerComparison
} from "@/features/career/career-saved-comparisons";
import {
  addSavedCareerPathId,
  removeSavedCareerPathId
} from "@/features/career/career-saved-paths";
import {
  updateCompareDraftSelection
} from "@/features/career/career-compare-state";
import {
  resetCareerEventSessionForTests,
  trackCareerEvent
} from "@/features/career/career-events";
import {
  shouldRequestCareerLeadCapture,
  validateCareerLeadFormInput
} from "@/features/career/career-lead-capture";

const forbiddenEventFragments = [
  "fullName",
  "phone",
  "contact",
  "+989",
  "091",
  "۰۹۱",
  "بزرگ‌ترین ابهام من",
  "raw search query",
  "arbitrary user text"
];

function createMemoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => values.set(key, value)),
    values
  };
}

function installEventCapture() {
  const storage = createMemoryStorage();
  const sendBeacon = vi.fn((url: string, body?: BodyInit | null) => {
    void url;
    void body;
    return true;
  });

  vi.stubGlobal("window", {
    localStorage: storage,
    crypto: { randomUUID: () => "career-launch-session" }
  });
  vi.stubGlobal("navigator", { sendBeacon });

  return { sendBeacon };
}

async function readTrackedEvents(sendBeacon: ReturnType<typeof vi.fn>) {
  const events = [];
  for (const [, body] of sendBeacon.mock.calls) {
    events.push(JSON.parse(await (body as Blob).text()) as {
      event: string;
      payload?: Record<string, unknown>;
    });
  }
  return events;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  resetCareerEventSessionForTests();
});

describe("Career PWA launch core flow regression", () => {
  it("protects the path-save, lead, My Paths, compare, and event funnel flow", async () => {
    const firstPath = careerPaths[0];
    const secondPath = careerPaths[1];
    const landingHtml = renderToStaticMarkup(<PathsPage />);
    const explorerSource = readFileSync("src/features/career/PathsPage.tsx", "utf8");

    expect(landingHtml).toContain("مسیر مناسب خودت");
    expect(landingHtml).toContain("حوزه‌ای که کنجکاوت می‌کند");
    expect(explorerSource).toContain("window.location.assign(seoEntry.pageHref)");
    expect(explorerSource).not.toContain("currentLevel === 4");

    const { sendBeacon } = installEventCapture();
    const leadApi = vi.fn(() => Promise.resolve(Response.json({ ok: true })));
    vi.stubGlobal("fetch", leadApi);

    trackCareerEvent("career_path_viewed", {
      pathId: firstPath.id,
      pathTitle: firstPath.name,
      fullName: "Ali Rezaei",
      phone: "09123456789"
    });

    let savedPathIds = new Set<string>();
    const wasAlreadySaved = savedPathIds.has(firstPath.id);
    const nextSavedPathIds = addSavedCareerPathId(savedPathIds, firstPath.id);
    const saveSucceeded = nextSavedPathIds !== savedPathIds;
    savedPathIds = new Set(nextSavedPathIds);
    expect(savedPathIds.has(firstPath.id)).toBe(true);
    expect(shouldRequestCareerLeadCapture(wasAlreadySaved, saveSucceeded)).toBe(true);
    trackCareerEvent("career_path_saved", {
      pathId: firstPath.id,
      contact: "09123456789",
      rawSearch: "raw search query"
    });
    trackCareerEvent("career_lead_sheet_shown", { trigger: "path_save" });

    const invalidLead = validateCareerLeadFormInput("Ali", "09123456789");
    expect(invalidLead.ok).toBe(false);
    trackCareerEvent("career_lead_submit_failed", {
      reason: "validation",
      fullName: "Ali",
      phone: "09123456789",
      uncertainty: "بزرگ‌ترین ابهام من",
      rawText: "arbitrary user text"
    });

    const validLead = validateCareerLeadFormInput("Ali Rezaei", "09123456789");
    expect(validLead).toMatchObject({
      ok: true,
      fullName: "Ali Rezaei",
      phone: "+989123456789"
    });
    await fetch("/api/career/leads", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contact: "+989123456789",
        phone: "+989123456789",
        fullName: "Ali Rezaei",
        source: "path_save"
      })
    });
    expect(leadApi).toHaveBeenCalledWith("/api/career/leads", expect.objectContaining({
      method: "POST"
    }));
    trackCareerEvent("career_lead_submit_succeeded", {
      trigger: "path_save",
      stage: "بین چند مسیر مرددم",
      contact: "+989123456789",
      fullName: "Ali Rezaei"
    });

    const savedMyPathsHtml = renderToStaticMarkup(
      <MyPathsContent savedPathIds={savedPathIds} savedComparisons={[]} hasLoaded />
    );
    expect(savedMyPathsHtml).toContain("مسیرهای شغلی ذخیره‌شده");
    expect(savedMyPathsHtml).toContain("۱");
    expect(savedMyPathsHtml).toContain(firstPath.name);
    trackCareerEvent("career_my_paths_viewed", {
      savedPathCount: savedPathIds.size,
      savedComparisonCount: 0
    });

    const removedPathIds = removeSavedCareerPathId(savedPathIds, firstPath.id);
    expect([...removedPathIds]).toEqual([]);
    savedPathIds = new Set(removedPathIds);
    trackCareerEvent("career_path_removed", { pathId: firstPath.id });
    const emptyMyPathsHtml = renderToStaticMarkup(
      <MyPathsContent savedPathIds={savedPathIds} savedComparisons={[]} hasLoaded />
    );
    expect(emptyMyPathsHtml).toContain("هنوز مسیر شغلی‌ای اضافه نکردی");

    trackCareerEvent("career_compare_started", { fromPathId: firstPath.id });
    const onePathDraft = updateCompareDraftSelection([], firstPath.id);
    trackCareerEvent("career_compare_selection_changed", {
      selectedCount: onePathDraft.length
    });
    const twoPathDraft = updateCompareDraftSelection(onePathDraft, secondPath.id);
    trackCareerEvent("career_compare_selection_changed", {
      selectedCount: twoPathDraft.length,
      phone: "09123456789"
    });
    expect(twoPathDraft).toEqual([firstPath.id, secondPath.id]);
    const compareHtml = renderToStaticMarkup(<ComparePage initialPathIds={twoPathDraft} />);
    expect(compareHtml).toContain("مقایسه مسیرها");
    expect(compareHtml).toContain(firstPath.name);
    expect(compareHtml).toContain(secondPath.name);

    let savedComparisons: readonly SavedCareerComparison[] = [];
    const nextComparisons = addSavedCareerComparison(savedComparisons, twoPathDraft);
    expect(nextComparisons).toHaveLength(1);
    savedComparisons = nextComparisons;
    trackCareerEvent("career_comparison_saved", {
      selectedCount: twoPathDraft.length,
      fullName: "Ali Rezaei"
    });
    const comparisonMyPathsHtml = renderToStaticMarkup(
      <MyPathsContent savedPathIds={savedPathIds} savedComparisons={savedComparisons} hasLoaded />
    );
    expect(comparisonMyPathsHtml).toContain("مقایسه‌های ذخیره‌شده");
    expect(comparisonMyPathsHtml).toContain("مقایسه ۲ مسیر شغلی");
    expect(comparisonMyPathsHtml).toContain(firstPath.name);
    expect(comparisonMyPathsHtml).toContain(secondPath.name);
    trackCareerEvent("career_my_paths_viewed", {
      savedPathCount: savedPathIds.size,
      savedComparisonCount: savedComparisons.length
    });

    const events = await readTrackedEvents(sendBeacon);
    expect(events.map((event) => event.event)).toEqual([
      "career_path_viewed",
      "career_path_saved",
      "career_lead_sheet_shown",
      "career_lead_submit_failed",
      "career_lead_submit_succeeded",
      "career_my_paths_viewed",
      "career_path_removed",
      "career_compare_started",
      "career_compare_selection_changed",
      "career_compare_selection_changed",
      "career_comparison_saved",
      "career_my_paths_viewed"
    ]);
    expect(events).toEqual(expect.arrayContaining([
      expect.objectContaining({ event: "career_path_saved", payload: { pathId: firstPath.id } }),
      expect.objectContaining({ event: "career_lead_submit_failed", payload: { reason: "validation" } }),
      expect.objectContaining({
        event: "career_lead_submit_succeeded",
        payload: { trigger: "path_save", stage: "بین چند مسیر مرددم" }
      }),
      expect.objectContaining({ event: "career_compare_selection_changed", payload: { selectedCount: 2 } }),
      expect.objectContaining({ event: "career_comparison_saved", payload: { selectedCount: 2 } }),
      expect.objectContaining({
        event: "career_my_paths_viewed",
        payload: { savedPathCount: 0, savedComparisonCount: 1 }
      })
    ]));

    const serializedEvents = JSON.stringify(events);
    for (const forbiddenFragment of forbiddenEventFragments) {
      expect(serializedEvents).not.toContain(forbiddenFragment);
    }
  });

  it("keeps tracking failures isolated from the core save flow", () => {
    const storage = createMemoryStorage();
    vi.stubGlobal("window", {
      localStorage: storage,
      crypto: { randomUUID: () => "career-launch-session" }
    });
    vi.stubGlobal("navigator", {
      sendBeacon: vi.fn(() => {
        throw new Error("beacon failed");
      })
    });
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("network failed"))));

    let savedPathIds = new Set<string>();
    const nextSavedPathIds = addSavedCareerPathId(savedPathIds, careerPaths[0].id);
    expect(() => trackCareerEvent("career_path_saved", { pathId: careerPaths[0].id })).not.toThrow();
    savedPathIds = new Set(nextSavedPathIds);

    expect(savedPathIds.has(careerPaths[0].id)).toBe(true);
  });

  it("pins passive event hooks to the central Career flow components", () => {
    const source = [
      "src/features/career/PathsPage.tsx",
      "src/app/career/paths/[slug]/CareerPathClientActions.tsx",
      "src/features/career/ComparePage.tsx",
      "src/features/career/MyPathsPage.tsx",
      "src/features/career/CareerLeadCaptureSheet.tsx",
      "src/features/career/CareerShell.tsx"
    ].map((file) => readFileSync(file, "utf8")).join("\n");

    expect(source).toContain('trackCareerEvent("career_path_viewed"');
    expect(source).toContain('trackCareerEvent("career_path_saved"');
    expect(source).toContain('trackCareerEvent("career_path_removed"');
    expect(source).toContain('trackCareerEvent("career_lead_sheet_shown"');
    expect(source).toContain('trackCareerEvent("career_lead_submit_failed"');
    expect(source).toContain('trackCareerEvent("career_lead_submit_succeeded"');
    expect(source).toContain('trackCareerEvent("career_compare_started"');
    expect(source).toContain('trackCareerEvent("career_compare_selection_changed"');
    expect(source).toContain('trackCareerEvent("career_comparison_saved"');
    expect(source).toContain('trackCareerEvent("career_my_paths_viewed"');
    expect(source).toContain("<CareerEventBootstrap />");
  });
});
