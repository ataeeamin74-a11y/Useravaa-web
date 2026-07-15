import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import { getCareerPathSeoEntries } from "@/features/career/career-path-seo";
import { getRobotsPolicy, productionSearchExcludedRoutes } from "@/lib/deployment/safety";

const APPROVED_DESCRIPTION =
  "مسیرهای شغلی را با تجربه‌های واقعی بررسی، ذخیره و مقایسه کن تا تصمیم شغلی روشن‌تری بگیری.";
const SHARE_IMAGE_PATH = "public/og/useravaa-career-share.png";

function projectFile(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

function env(source: Record<string, string | undefined>): NodeJS.ProcessEnv {
  return source as NodeJS.ProcessEnv;
}

describe("Phase 17 SEO and share readiness", () => {
  it("defines the approved root search and social metadata", () => {
    const layoutSource = projectFile("src/app/layout.tsx");
    const pageSource = projectFile("src/app/page.tsx");

    expect(layoutSource).toContain('metadataBase: new URL("https://useravaa.com")');
    expect(pageSource).toContain('const rootTitle = "مسیرهای شغلی | Useravaa"');
    expect(pageSource).toContain(APPROVED_DESCRIPTION);
    expect(pageSource).toContain("openGraph");
    expect(pageSource).toContain('siteName: "Useravaa"');
    expect(pageSource).toContain('type: "website"');
    expect(pageSource).toContain('locale: "fa_IR"');
    expect(pageSource).toContain('card: "summary_large_image"');
    expect(pageSource).toContain('const shareImagePath = "/og/useravaa-career-share.png"');
  });

  it("ships an accessible 1200 by 630 share image", () => {
    const image = fs.readFileSync(path.join(process.cwd(), SHARE_IMAGE_PATH));

    expect(image.subarray(1, 4).toString("ascii")).toBe("PNG");
    expect(image.readUInt32BE(16)).toBe(1200);
    expect(image.readUInt32BE(20)).toBe(630);
    expect(projectFile("src/app/page.tsx")).toContain(
      "تصویر اشتراک‌گذاری یوزاوا برای بررسی، ذخیره و مقایسه مسیرهای شغلی با تجربه‌های واقعی"
    );
  });

  it("publishes the approved root URL and indexable career path URLs in the sitemap", () => {
    const entries = sitemap();
    const urls = entries.map((entry) => entry.url);
    const careerPathUrls = getCareerPathSeoEntries().map((entry) => entry.canonicalUrl);

    expect(entries[0]).toEqual({
      url: "https://useravaa.com",
      changeFrequency: "weekly",
      priority: 1
    });
    expect(new Set(urls).size).toBe(urls.length);
    expect(careerPathUrls.every((url) => urls.includes(url))).toBe(true);
  });

  it("keeps non-production closed and excludes non-launch production routes", () => {
    expect(getRobotsPolicy(env({ APP_ENV: "staging", USERAVAA_SITE_INDEXING: "1" }))).toMatchObject({
      indexingEnabled: false,
      rules: { disallow: "/" }
    });

    const productionPolicy = getRobotsPolicy(
      env({ APP_ENV: "production", USERAVAA_SITE_INDEXING: "1" })
    );
    expect(productionPolicy).toMatchObject({
      indexingEnabled: true,
      rules: {
        allow: "/",
        disallow: productionSearchExcludedRoutes
      }
    });
    expect(productionSearchExcludedRoutes).toEqual(
      expect.arrayContaining(["/admin", "/api", "/discover", "/checkout", "/profile", "/requests", "/wallet"])
    );
  });

  it("uses a permanent legacy redirect to the complete career decision page", () => {
    const source = projectFile("src/app/career/page.tsx");

    expect(source).toContain('import { permanentRedirect } from "next/navigation"');
    expect(source).toContain("getCareerPathSeoEntryBySlugOrLegacy");
    expect(source).toContain("getCareerPathSeoEntryByCardId");
    expect(source).toContain('permanentRedirect(careerPathEntry?.pageHref ?? "/")');
    expect(source).toContain("initialPathSlug");
    expect(source).not.toContain("/?card=");
  });

  it("keeps public metadata free of internal, forbidden, and offline claims", () => {
    const publicMetadata = [
      projectFile("src/app/layout.tsx"),
      projectFile("src/app/page.tsx"),
      projectFile("src/app/sitemap.ts"),
      projectFile("src/features/career/career-path-seo.ts"),
      projectFile("public/site.webmanifest")
    ].join("\n");
    const forbidden = [
      "Production scaffold",
      "prototype",
      "job board",
      "education platform",
      "mentoring platform",
      "coaching service",
      "guaranteed success",
      "guaranteed hiring",
      "life transformation",
      "perfect path",
      "offline",
      "آفلاین"
    ];

    forbidden.forEach((claim) => expect(publicMetadata.toLowerCase()).not.toContain(claim.toLowerCase()));
  });
});
