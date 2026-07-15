import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import CareerInternshipsRoute, { metadata } from "@/app/career/internships/page";
import { navigationItems, isCareerTabActive } from "@/features/career/CareerBottomNav";
import { sanitizeCareerEventPayload } from "@/features/career/career-events";
import {
  careerInternshipPathOptions,
  filterCareerInternships,
  getCareerInternshipCityOptions,
  getCareerInternshipProvinceOptions,
  getCareerPathSlugsForSavedIds,
  parseCareerInternshipFeed
} from "@/features/career/career-internships";
import { getCareerPathSeoEntryBySlug } from "@/features/career/career-path-seo";
import {
  matchCareerPathSlugs,
  parseJobinjaPage,
  parseJobvisionResponse
} from "../scripts/refresh-career-internships.mjs";

const NOW = new Date("2026-07-15T12:00:00.000Z");
const rules = [
  { slug: "seo", aliases: ["سئو", "seo"] },
  { slug: "social-media-marketing", aliases: ["اینستاگرام", "شبکه های اجتماعی"] }
];

describe("career internship source ingestion", () => {
  it("matches public listing titles deterministically without AI", () => {
    expect(matchCareerPathSlugs("کارآموز سایت و سئو", rules)).toEqual(["seo"]);
    expect(matchCareerPathSlugs("ادمین اینستاگرام", rules)).toEqual(["social-media-marketing"]);
    expect(matchCareerPathSlugs("عنوان ناشناخته", rules, ["digital-marketing"]))
      .toEqual(["digital-marketing"]);
  });

  it("parses the minimal Jobinja card fields and strips tracking parameters", () => {
    const html = `
      <a class="c-jobListView__titleLink" target="_blank" href="https://jobinja.ir/companies/acme/jobs/a123/job-title?_ref=16&amp;_t=abc">
        کارآموز سئو
      </a>
      <span class="c-jobListView__passedDays">(۲ روز پیش)</span>
      <li class="c-jobListView__metaItem"><span>شرکت نمونه</span></li>
      <li class="c-jobListView__metaItem"><span>تهران، تهران</span></li>
    `;
    const items = parseJobinjaPage(html, { now: NOW, rules });

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      id: "jobinja:a123",
      source: "jobinja",
      title: "کارآموز سئو",
      company: "شرکت نمونه",
      location: "تهران، تهران",
      province: "تهران",
      city: "تهران",
      pathSlugs: ["seo"]
    });
    expect(items[0].sourceUrl).toBe("https://jobinja.ir/companies/acme/jobs/a123/job-title");
  });

  it("parses fresh Jobvision internships and rejects non-internship records", () => {
    const response = {
      isSuccess: true,
      data: {
        jobPosts: [{
          id: 42,
          title: "ادمین اینستاگرام",
          properties: { isInternship: true, isRemote: false },
          company: { nameFa: "شرکت نمونه" },
          location: {
            province: { titleFa: "تهران" },
            city: { titleFa: "تهران" }
          },
          firstActivationTime: { date: "2026-07-14T10:00:00.000Z" },
          expireTime: { date: "2026-08-14T10:00:00.000Z" },
          workType: { titleFa: "پاره‌وقت" }
        }, {
          id: 43,
          title: "کارشناس سئو",
          properties: { isInternship: false },
          firstActivationTime: { date: "2026-07-14T10:00:00.000Z" }
        }]
      }
    };

    expect(parseJobvisionResponse(response, { now: NOW, rules })).toEqual([
      expect.objectContaining({
        id: "jobvision:42",
        source: "jobvision",
        title: "ادمین اینستاگرام",
        province: "تهران",
        city: "تهران",
        pathSlugs: ["social-media-marketing"]
      })
    ]);
  });
});

describe("career internship feed safety and matching", () => {
  const seoEntry = getCareerPathSeoEntryBySlug("seo")!;
  const rawFeed = {
    updatedAt: NOW.toISOString(),
    items: [{
      id: "jobinja:fresh",
      source: "jobinja",
      sourceUrl: "https://jobinja.ir/companies/acme/jobs/fresh/job",
      title: "کارآموز سئو",
      company: "نمونه",
      location: "تهران، شهریار",
      province: "تهران",
      city: "شهریار",
      publishedAt: "2026-07-10T12:00:00.000Z",
      pathSlugs: ["seo"]
    }, {
      id: "jobvision:old",
      source: "jobvision",
      sourceUrl: "https://jobvision.ir/jobs/100/old",
      title: "آگهی قدیمی",
      company: "نمونه",
      location: "تهران",
      publishedAt: "2026-05-01T12:00:00.000Z",
      pathSlugs: ["seo"]
    }, {
      id: "jobinja:unsafe",
      source: "jobinja",
      sourceUrl: "https://example.com/phishing",
      title: "آگهی نامعتبر",
      company: "نمونه",
      location: "تهران",
      publishedAt: "2026-07-10T12:00:00.000Z",
      pathSlugs: ["seo"]
    }]
  };

  it("keeps only HTTPS source links from the last 45 days", () => {
    const feed = parseCareerInternshipFeed(rawFeed, NOW.getTime())!;
    expect(feed.items.map((item) => item.id)).toEqual(["jobinja:fresh"]);
    expect(feed.maxAgeDays).toBe(45);
    expect(feed.canonicalPathCount).toBe(58);
  });

  it("filters by saved career, explicit path, source, province, city, and local query", () => {
    const feed = parseCareerInternshipFeed(rawFeed, NOW.getTime())!;
    const savedPathSlugs = getCareerPathSlugsForSavedIds(new Set([seoEntry.path.id]));

    expect(filterCareerInternships(feed.items, {
      mode: "personalized",
      savedPathSlugs,
      selectedPathSlug: "seo",
      source: "jobinja",
      province: "تهران",
      city: "شهریار",
      query: "شهریار"
    })).toHaveLength(1);
    expect(filterCareerInternships(feed.items, {
      mode: "personalized",
      savedPathSlugs: new Set()
    })).toEqual([]);
  });

  it("builds unique province options and scopes city options to the selected province", () => {
    const feed = parseCareerInternshipFeed({
      updatedAt: NOW.toISOString(),
      items: [rawFeed.items[0], {
        ...rawFeed.items[0],
        id: "jobinja:second",
        sourceUrl: "https://jobinja.ir/companies/acme/jobs/second/job",
        location: "البرز، کرج",
        province: "البرز",
        city: "کرج"
      }]
    }, NOW.getTime())!;

    expect(getCareerInternshipProvinceOptions(feed.items)).toEqual(["البرز", "تهران"]);
    expect(getCareerInternshipCityOptions(feed.items, "تهران")).toEqual(["شهریار"]);
    expect(getCareerInternshipCityOptions(feed.items, "البرز")).toEqual(["کرج"]);
  });

  it("offers every canonical career path as a filter", () => {
    expect(careerInternshipPathOptions).toHaveLength(58);
    expect(new Set(careerInternshipPathOptions.map((path) => path.slug)).size).toBe(58);
    expect(careerInternshipPathOptions.map((path) => path.slug)).toContain("social-media-marketing");
  });
});

describe("career internship product integration", () => {
  it("adds an app-only route and fifth bottom-navigation destination", () => {
    expect(CareerInternshipsRoute().type.name).toBe("CareerInternshipsPage");
    expect(metadata.robots).toEqual({ index: false, follow: false });
    expect(navigationItems.map((item) => [item.href, item.label]))
      .toContainEqual(["/career/internships", "کارآموزی"]);
    expect(isCareerTabActive("/career/internships", "/career/internships")).toBe(true);
  });

  it("keeps the UI lightweight, accessible, and linked to original ads", () => {
    const source = readFileSync("src/features/career/CareerInternshipsPage.tsx", "utf8");
    const styles = readFileSync("src/features/career/CareerInternshipsPage.module.css", "utf8");
    const refresher = readFileSync("scripts/refresh-career-internships.mjs", "utf8");

    expect(source).toContain('aria-label="فیلتر آگهی‌های کارآموزی"');
    expect(source).toContain('aria-label="فیلتر مسیر شغلی"');
    expect(source).toContain('aria-label="فیلتر استان"');
    expect(source).toContain('aria-label="فیلتر شهر"');
    expect(source).toContain('aria-label="فیلتر منبع آگهی"');
    expect(source).toContain('target="_blank"');
    expect(source).toContain('rel="noopener noreferrer"');
    expect(source).toContain("برای مسیرهای من");
    expect(source).toContain("همه مسیرها");
    expect(source).toContain("visibleItems.slice(0, visibleLimit)");
    expect(styles).toContain("@media (max-width: 680px)");
    expect(styles).not.toContain("linear-gradient");
    expect(refresher).toContain("MAX_AGE_DAYS = 45");
    expect(refresher).toContain("refresh every 72h");
    expect(refresher).not.toMatch(/openai|anthropic|gemini|ollama/iu);
  });

  it("tracks only non-PII internship interaction fields", () => {
    const payload = sanitizeCareerEventPayload("career_internship_opened", {
      source: "jobvision",
      careerSlug: "seo",
      fullName: "نام کاربر",
      phone: "09123456789",
      query: "متن دلخواه"
    });
    expect(payload).toEqual({ source: "jobvision", careerSlug: "seo" });
    expect(JSON.stringify(payload)).not.toMatch(/09123456789|نام کاربر|متن دلخواه/u);
  });
});
