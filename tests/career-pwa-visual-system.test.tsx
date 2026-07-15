import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { isCareerTabActive, navigationItems } from "@/features/career/CareerBottomNav";

const read = (path: string) => readFileSync(path, "utf8");

describe("career PWA visual system", () => {
  it("keeps one five-item mobile navigation with tactile and accessible states", () => {
    const shellStyles = read("src/features/career/CareerShell.module.css");

    expect(navigationItems).toHaveLength(5);
    expect(shellStyles).toContain("--career-motion: 180ms ease-out");
    expect(shellStyles).toContain("grid-template-columns: repeat(5, minmax(0, 1fr))");
    expect(shellStyles).toContain("min-height: 54px");
    expect(shellStyles).toContain("@media (min-width: 1024px)");
    expect(shellStyles).toContain("grid-template-columns: 1fr");
    expect(shellStyles).toContain("@media (prefers-reduced-motion: reduce)");
  });

  it("keeps parent navigation active on detail and legacy saved pages", () => {
    expect(isCareerTabActive("/career/paths/social-media-marketing", "/career")).toBe(true);
    expect(isCareerTabActive("/career/saved", "/career/my-paths")).toBe(true);
    expect(isCareerTabActive("/career/skills", "/career")).toBe(false);
  });

  it("uses shared tactile depth across every primary career control", () => {
    const styleFiles = [
      "src/features/career/CareerPages.module.css",
      "src/features/career/CareerSkillsPage.module.css",
      "src/features/career/CareerInternshipsPage.module.css",
      "src/features/career/ComparePage.module.css",
      "src/features/career/MyPathsPage.module.css",
      "src/app/career/paths/[slug]/CareerPathSeoPage.module.css"
    ];

    for (const file of styleFiles) {
      const source = read(file);
      expect(source, file).toContain("var(--career-shadow");
      expect(source, file).toContain("border-radius: 8px");
    }
  });

  it("keeps raised button shadows off content cards and panels", () => {
    const source = [
      "src/features/career/CareerPages.module.css",
      "src/features/career/CareerSkillsPage.module.css",
      "src/features/career/CareerInternshipsPage.module.css",
      "src/features/career/ComparePage.module.css",
      "src/features/career/MyPathsPage.module.css",
      "src/app/career/paths/[slug]/CareerPathSeoPage.module.css"
    ].map(read).join("\n");
    const flatSurfaceSelectors = new Set([
      ".careerHero",
      ".domainCard",
      ".categoryCard",
      ".subfamilyCard",
      ".searchResultCard",
      ".skillList",
      ".resultCard",
      ".gapList",
      ".intro",
      ".internshipList",
      ".pathCard",
      ".pathCardSelected",
      ".selectionTray",
      ".compareTableViewport",
      ".accordionSection",
      ".savedCard",
      ".comparisonCard",
      ".fitDimensions",
      ".intelligenceCompare",
      ".stickyBar"
    ]);

    for (const rule of source.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const selectors = rule[1].split(",").map((selector) => selector.trim());
      if (!selectors.some((selector) => flatSurfaceSelectors.has(selector))) continue;
      expect(rule[2]).not.toMatch(/box-shadow:\s*0\s+[345]px\s+0/);
    }
  });

  it("keeps comparison actions in flow and opens saved work immediately", () => {
    const compareStyles = read("src/features/career/ComparePage.module.css");
    const myPathsSource = read("src/features/career/MyPathsPage.tsx");

    expect(compareStyles).toContain("position: sticky");
    expect(compareStyles).toContain("padding-bottom: 32px");
    expect(myPathsSource).toContain('new Set(["saved-paths", "saved-comparisons"])');
  });

  it("uses the approved local mascot on internship discovery", () => {
    const internshipSource = read("src/features/career/CareerInternshipsPage.tsx");

    expect(internshipSource).toContain("/brand/Mascot/useravaa-mascot-magnifier-eye.webp");
    expect(internshipSource).toContain("className={styles.introMascot}");
  });

  it("uses Phosphor shapes throughout production Career pages without inline icon SVGs", () => {
    const iconSources = [
      "src/features/career/CareerIcons.tsx",
      "src/features/career/CareerSoftIcons.tsx",
      "src/features/career/PathsPage.tsx",
      "src/features/career/CareerSkillsPage.tsx",
      "src/features/career/CareerInternshipsPage.tsx",
      "src/features/career/ComparePage.tsx",
      "src/features/career/MyPathsPage.tsx",
      "src/features/career/CareerBottomNav.tsx",
      "src/app/career/paths/[slug]/CareerPathProductPage.tsx",
      "src/app/career/paths/[slug]/CareerPathSectionNav.tsx",
      "src/app/career/paths/[slug]/CareerPathRelatedPaths.tsx"
    ].map(read).join("\n");

    expect(iconSources).toContain("@phosphor-icons/react/ssr");
    expect(iconSources).toContain('"duotone"');
    expect(iconSources).toContain('"fill"');
    expect(iconSources).not.toContain("lucide-react");
    expect(read("src/features/career/CareerSoftIcons.tsx")).not.toContain("<svg");
  });

  it("keeps offline navigation public and avoids caching personalized page HTML", () => {
    const workerSource = read("public/career-sw.js");
    const recoverySource = read("src/features/career/CareerRecoveryPage.tsx");
    const navigationStrategy = workerSource
      .split("async function networkWithOfflineFallback")[1]
      ?.split("async function staleWhileRevalidate")[0] ?? "";

    expect(workerSource).toContain('const OFFLINE_URL = "/career/offline"');
    expect(workerSource).toContain('url.pathname.startsWith("/api/")');
    expect(workerSource).toContain("networkWithOfflineFallback(request)");
    expect(navigationStrategy).not.toContain("cache.put");
    expect(recoverySource).toContain('mode: "not-found" | "offline"');
    expect(recoverySource).toContain('href="/"');
  });

  it("saves and tracks career decisions on the canonical product page", () => {
    const actionSource = read("src/app/career/paths/[slug]/CareerPathClientActions.tsx");

    expect(actionSource).toContain("savePath(pathId)");
    expect(actionSource).toContain('trackCareerEvent("career_path_saved"');
    expect(actionSource).toContain("recordRecentlyViewedCareerPath(pathId)");
    expect(actionSource).toContain('trackCareerEvent("career_path_viewed"');
    expect(actionSource).toContain("startCompareDraftFromPath(pathId)");
  });
});
