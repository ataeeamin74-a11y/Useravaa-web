import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const APPROVED_DESCRIPTION =
  "مسیرهای شغلی را با تجربه‌های واقعی بررسی، ذخیره و مقایسه کن تا تصمیم شغلی روشن‌تری بگیری.";

function projectFile(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("Phase 16 Career PWA readiness", () => {
  it("keeps the root manifest installable and scoped to the Career PWA", () => {
    const manifest = JSON.parse(projectFile("public/site.webmanifest")) as Record<string, unknown>;

    expect(manifest).toMatchObject({
      description: APPROVED_DESCRIPTION,
      id: "/",
      start_url: "/",
      scope: "/",
      display: "standalone",
      lang: "fa",
      dir: "rtl",
      background_color: "#FFFFFF",
      theme_color: "#091B49"
    });
  });

  it("uses approved public metadata and removes the internal scaffold description", () => {
    const pageSource = projectFile("src/app/page.tsx");
    const layoutSource = projectFile("src/app/layout.tsx");

    expect(pageSource).toContain(APPROVED_DESCRIPTION);
    expect(layoutSource).toContain(APPROVED_DESCRIPTION);
    expect(`${pageSource}\n${layoutSource}`).not.toContain("Production scaffold");
  });

  it("declares root safe-area and Apple standalone metadata without offline claims", () => {
    const manifestSource = projectFile("public/site.webmanifest");
    const pageSource = projectFile("src/app/page.tsx");
    const layoutSource = projectFile("src/app/layout.tsx");
    const publicMetadata = `${manifestSource}\n${pageSource}\n${layoutSource}`;

    expect(layoutSource).toContain('viewportFit: "cover"');
    expect(layoutSource).toContain('themeColor: "#091B49"');
    expect(layoutSource).toContain("appleWebApp");
    expect(layoutSource).toContain('statusBarStyle: "default"');
    expect(publicMetadata.toLowerCase()).not.toContain("offline");
    expect(publicMetadata).not.toContain("آفلاین");
  });
});
