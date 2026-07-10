import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import CareerPathSeoPage, {
  generateMetadata,
  generateStaticParams
} from "@/app/career/paths/[slug]/page";
import {
  CAREER_PATH_SEO_BASE_URL,
  CAREER_PATH_SHARE_IMAGE,
  buildCareerPathMetadata,
  getCareerPathSeoEntries,
  getCareerPathSeoEntryByPathId,
  getCareerPathSeoEntryBySlug,
  getCareerPathSlugs
} from "@/features/career/career-path-seo";
import { getCareerPathVisualAssetPaths } from "@/features/career/career-path-visual-assets";

const forbiddenSeoLanguage = [
  "تضمین",
  "استخدام تضمینی",
  "موفقیت قطعی",
  "دوره",
  "کلاس",
  "آگهی استخدام",
  "JobPosting",
  "job posting",
  "job opening",
  "course"
];

const forbiddenUserMetadata = [
  "fullName",
  "phone",
  "contact",
  "rawSearchQuery",
  "searchQuery",
  "raw search query",
  "user text input",
  "ambiguity"
];

const genericPlaceholderMetadata = [
  "مسیرهای شغلی را با تجربه‌های واقعی بررسی",
  "lorem ipsum",
  "placeholder",
  "untitled",
  "generic"
];

const representativeSharePreviewSlugs = [
  "seo",
  "performance-marketing",
  "product-management-and-ownership",
  "dotnet-c-sharp-backend"
] as const;

const requiredProductScreenLabels = [
  "کار اصلی",
  "مناسب‌تر برای",
  "سختی اصلی",
  "این شغل مناسب منه؟",
  "نیاز به تعامل با آدم‌ها",
  "نیاز به استفاده از ابزارها",
  "نیاز به خلاقیت",
  "نیاز به تحلیل آماری",
  "واقعیت‌های شغلی",
  "روز کاری واقعی",
  "مهم‌ترین مهارت‌های نرم",
  "مهم‌ترین مهارت‌های تخصصی",
  "مهم‌ترین ابزارها",
  "سختی‌ها",
  "فرصت‌ها و تهدیدهای هوش مصنوعی",
  "هوش مصنوعی چه چیزهایی را آسان‌تر می‌کند؟",
  "هوش مصنوعی چه چیزهایی را سخت‌تر می‌کند؟",
  "سوالات متداول مصاحبه شغلی"
] as const;

const rejectedProductScreenLabels = [
  "شروع کم‌ریسک",
  "کاهش سردرگمی",
  "مسیرهای نزدیک",
  "Similar paths",
  "قبل از تصمیم، این‌ها را از کسی که این مسیر را رفته بپرس",
  "پرسش‌های مهم",
  "شروع بدون سابقه",
  "نیاز به نمونه‌کار",
  "ابهام مسیر",
  "نیاز به کار با تحلیل آماری",
  "AI چه چیزهایی را آسان‌تر می‌کند؟",
  "AI چه چیزهایی را سخت‌تر می‌کند؟",
  "Reality Snapshot",
  "Stats Dashboard",
  "Day Reality Cards",
  "Match Check",
  "Reality Toggle",
  "Honest Friction",
  "Mini Start Map",
  "Skill Switcher",
  "Opportunity vs Threat",
  "Experience Bridge",
  "Interview Trainer",
  "Final Checkpoint"
] as const;

const removedCtaCopy = ["بررسی این", "مسیر در", "Useravaa"].join(" ");
const removedHardshipCopy = ["از بیرون", "ساده‌تر دیده می‌شود"].join(" ");

const forbiddenProductCopy = [
  "منتور",
  "مشاوره",
  "جلسه",
  "رزرو",
  "پرداخت",
  "استخدام تضمینی",
  "تضمین موفقیت",
  "دوره آموزشی",
  "کلاس"
] as const;

const approvedShareImageUrl = new URL(CAREER_PATH_SHARE_IMAGE, CAREER_PATH_SEO_BASE_URL).toString();

function getRequiredCareerPathEntry(slug: string) {
  const entry = getCareerPathSeoEntryBySlug(slug);
  if (!entry) throw new Error(`Expected career path SEO entry for ${slug}`);
  return entry;
}

function getFirstMetadataImageUrl(images: unknown) {
  const image = Array.isArray(images) ? images[0] : images;
  if (typeof image === "string") return image;
  if (image instanceof URL) return image.toString();
  if (image && typeof image === "object" && "url" in image) {
    const url = (image as { url?: string | URL }).url;
    if (typeof url === "string") return url;
    if (url instanceof URL) return url.toString();
  }
  throw new Error("Expected metadata image URL");
}

function toAbsoluteMetadataUrl(url: string) {
  return new URL(url, CAREER_PATH_SEO_BASE_URL).toString();
}

function collectSchemaTypes(value: unknown): string[] {
  if (!value || typeof value !== "object") return [];
  if (Array.isArray(value)) return value.flatMap(collectSchemaTypes);

  const record = value as Record<string, unknown>;
  const ownType = typeof record["@type"] === "string" ? [record["@type"]] : [];
  const nestedTypes = Object.entries(record)
    .filter(([key]) => key !== "@type")
    .flatMap(([, child]) => collectSchemaTypes(child));

  return [...ownType, ...nestedTypes];
}

function collectImageSources(html: string) {
  const imageTags = [...html.matchAll(/<img\b[^>]*>/giu)].map((match) => match[0]);
  return imageTags.flatMap((tag) => {
    const src = tag.match(/\ssrc="([^"]+)"/iu)?.[1];
    const srcSet = tag.match(/\ssrcSet="([^"]+)"/iu)?.[1] ?? tag.match(/\ssrcset="([^"]+)"/iu)?.[1];
    return [src, srcSet].filter((value): value is string => Boolean(value));
  });
}

function stripTags(html: string) {
  return html.replace(/<[^>]+>/gu, " ").replace(/\s+/gu, " ").trim();
}

function collectHeadingTexts(html: string, level: 2 | 3) {
  return [...html.matchAll(new RegExp(`<h${level}[^>]*>(.*?)</h${level}>`, "giu"))]
    .map((match) => stripTags(match[1]));
}

function sectionByDataAttribute(html: string, attribute: string) {
  const pattern = new RegExp(`<section[^>]*${attribute}(?:="[^"]*")?[^>]*>[\\s\\S]*?</section>`, "iu");
  const match = html.match(pattern);
  if (!match) throw new Error(`Expected section with ${attribute}`);
  return match[0];
}

describe("Career path SEO pages", () => {
  it("creates one unique deterministic slug for every career path group", () => {
    const entries = getCareerPathSeoEntries();
    const slugs = getCareerPathSlugs();

    expect(entries.length).toBeGreaterThan(40);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs.every((slug) => /^[a-z0-9-]+$/u.test(slug))).toBe(true);
    expect(generateStaticParams()).toEqual(entries.map((entry) => ({ slug: entry.slug })));
  });

  it("looks up valid and invalid career path slugs safely", () => {
    const entry = getCareerPathSeoEntries()[0];

    expect(getCareerPathSeoEntryBySlug(entry.slug)?.path.id).toBe(entry.path.id);
    expect(getCareerPathSeoEntryByPathId(entry.path.id)?.slug).toBe(entry.slug);
    expect(getCareerPathSeoEntryBySlug("not-a-real-career-path")).toBeUndefined();
  });

  it("renders the refined product-screen structure with required sections and CTAs", async () => {
    const entry = getCareerPathSeoEntries()[0];
    const html = renderToStaticMarkup(
      await CareerPathSeoPage({ params: Promise.resolve({ slug: entry.slug }) })
    );
    const h2Texts = collectHeadingTexts(html, 2);
    const eyebrowIndex = html.indexOf("صفحه تصمیم مسیر شغلی");
    const heroVisualIndex = html.indexOf("data-career-mascot-scene");
    const h1Index = html.indexOf('<h1 id="career-path-seo-title"');
    const firstCtaIndex = html.indexOf("این مسیر را برای بررسی نگه دار");

    expect(html).toContain(`مسیر شغلی ${entry.path.name}`);
    requiredProductScreenLabels.forEach((label) => expect(html).toContain(label));
    rejectedProductScreenLabels.forEach((label) => expect(html).not.toContain(label));
    expect(h2Texts).toEqual(expect.arrayContaining([
      "این شغل مناسب منه؟",
      "واقعیت‌های شغلی",
      "سختی‌ها",
      "فرصت‌ها و تهدیدهای هوش مصنوعی",
      "سوالات متداول مصاحبه شغلی"
    ]));
    expect(h2Texts).not.toContain("تناسب سریع");
    expect(h2Texts).not.toContain("روز کاری واقعی");
    expect(html).toContain("صفحه تصمیم مسیر شغلی");
    expect(html).toContain("data-career-product-hero");
    expect(html).toContain("data-career-hero-primary-action");
    expect(html).toContain("این مسیر را برای بررسی نگه دار");
    expect(html).toContain("مقایسه با مسیرهای دیگر");
    expect(html).not.toContain(removedCtaCopy);
    expect(eyebrowIndex).toBeGreaterThanOrEqual(0);
    expect(heroVisualIndex).toBeGreaterThan(eyebrowIndex);
    expect(h1Index).toBeGreaterThan(heroVisualIndex);
    expect(firstCtaIndex).toBeGreaterThan(h1Index);
    expect((html.match(/data-career-ui-icon/g) ?? []).length).toBeGreaterThanOrEqual(18);
  });

  it("keeps the fit section to the four allowed qualitative dimensions", async () => {
    const entry = getRequiredCareerPathEntry("seo");
    const html = renderToStaticMarkup(
      await CareerPathSeoPage({ params: Promise.resolve({ slug: entry.slug }) })
    );
    const fitSection = sectionByDataAttribute(html, "data-career-fit-section");
    const fitLabels = [...fitSection.matchAll(/<dt>(.*?)<\/dt>/giu)].map((match) => stripTags(match[1]));
    const fitValues = [...fitSection.matchAll(/<dd>(.*?)<\/dd>/giu)].map((match) => stripTags(match[1]));

    expect(fitLabels).toEqual([
      "نیاز به تعامل با آدم‌ها",
      "نیاز به استفاده از ابزارها",
      "نیاز به خلاقیت",
      "نیاز به تحلیل آماری"
    ]);
    expect(fitValues).toHaveLength(4);
    fitValues.forEach((value) => expect(["کم", "متوسط", "زیاد"]).toContain(value));
    [
      "شروع بدون سابقه",
      "شروع کم‌ریسک",
      "نیاز به نمونه‌کار",
      "ابهام مسیر",
      "نیاز به کار با تحلیل آماری"
    ].forEach((copy) => expect(fitSection).not.toContain(copy));
  });

  it("merges workday details into job realities and renders exactly five interview questions without answers", async () => {
    const entry = getRequiredCareerPathEntry("performance-marketing");
    const html = renderToStaticMarkup(
      await CareerPathSeoPage({ params: Promise.resolve({ slug: entry.slug }) })
    );
    const realitiesSection = sectionByDataAttribute(html, "data-career-realities-section");
    const interviewSection = sectionByDataAttribute(html, "data-career-interview-section");
    const h2Texts = collectHeadingTexts(html, 2);
    const h3Texts = collectHeadingTexts(realitiesSection, 3);
    const interviewQuestionTexts = collectHeadingTexts(interviewSection, 3);

    expect(h2Texts).toContain("واقعیت‌های شغلی");
    expect(h2Texts).not.toContain("روز کاری واقعی");
    expect(h3Texts).toEqual(expect.arrayContaining([
      "روز کاری واقعی",
      "مهم‌ترین مهارت‌های نرم",
      "مهم‌ترین مهارت‌های تخصصی",
      "مهم‌ترین ابزارها"
    ]));
    expect((interviewSection.match(/data-interview-question/g) ?? [])).toHaveLength(5);
    expect(interviewQuestionTexts).toHaveLength(5);
    expect(interviewSection).not.toContain("<details");
    expect(interviewSection).not.toContain("<summary");
    expect(interviewSection).not.toContain("<p>به علاقه واقعی");
  });

  it("maps hero and section image slots to slug-based public asset paths without broken external sources", async () => {
    const entry = getRequiredCareerPathEntry("seo");
    const html = renderToStaticMarkup(
      await CareerPathSeoPage({ params: Promise.resolve({ slug: entry.slug }) })
    );
    const expectedPaths = getCareerPathVisualAssetPaths(entry.slug);
    const imageSources = collectImageSources(html);

    Object.values(expectedPaths).forEach((path) => {
      expect(path).toMatch(/\.webp$/u);
      expect(path).not.toMatch(/\.png$/u);
    });
    expect(html).toContain("data-career-mascot-scene");
    expect((html.match(/data-career-mascot-scene/g) ?? [])).toHaveLength(1);
    expect((html.match(/data-section-visual/g) ?? []).length).toBeGreaterThanOrEqual(5);
    expect(html).toContain(`data-expected-src="${expectedPaths.heroMascot}"`);
    expect(html).toContain(`data-expected-src="${expectedPaths.fit}"`);
    expect(html).toContain(`data-expected-src="${expectedPaths.jobReality}"`);
    expect(html).toContain(`data-expected-src="${expectedPaths.difficulties}"`);
    expect(html).toContain(`data-expected-src="${expectedPaths.aiImpact}"`);
    expect(html).toContain(`data-expected-src="${expectedPaths.interviewQuestions}"`);
    expect(html).not.toMatch(/data-expected-src="\/career-paths\/[^"]+\.png"/u);
    expect(html).toContain('data-career-image-slot="heroMascot"');
    expect(html).toContain('data-career-image-slot="fit"');
    expect(html).toContain('data-career-image-slot="jobReality"');
    expect(html).toContain('data-career-image-slot="difficulties"');
    expect(html).toContain('data-career-image-slot="aiImpact"');
    expect(html).toContain('data-career-image-slot="interviewQuestions"');
    expect(html).toContain('data-has-image="false"');
    imageSources.forEach((source) => {
      expect(source).not.toMatch(/^https?:\/\//iu);
      expect(source).not.toContain("src=\"\"");
    });
  });

  it("generates safe metadata and canonical URLs for path pages", async () => {
    const entry = getCareerPathSeoEntries()[0];
    const metadata = await generateMetadata({ params: Promise.resolve({ slug: entry.slug }) });
    const helperMetadata = buildCareerPathMetadata(entry);
    const serializedMetadata = JSON.stringify(metadata).toLowerCase();

    expect(metadata.title).toBe(`${entry.path.name} | مسیر شغلی در Useravaa`);
    expect(metadata.description).toBe(helperMetadata.description);
    expect(metadata.alternates).toEqual({ canonical: entry.canonicalUrl });
    expect(metadata.robots).toEqual({ index: true, follow: true });
    expect(metadata.openGraph).toMatchObject({
      title: metadata.title,
      description: metadata.description,
      url: entry.canonicalUrl,
      type: "website"
    });
    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      title: metadata.title,
      description: metadata.description
    });
    forbiddenSeoLanguage.forEach((claim) => expect(serializedMetadata).not.toContain(claim.toLowerCase()));
    expect(serializedMetadata).not.toContain("noindex");
    expect(serializedMetadata).not.toContain("nofollow");
  });

  it("generates share-ready social metadata for representative path pages", async () => {
    for (const slug of representativeSharePreviewSlugs) {
      const entry = getRequiredCareerPathEntry(slug);
      const metadata = await generateMetadata({ params: Promise.resolve({ slug }) });
      const expectedTitle = `${entry.path.name} | مسیر شغلی در Useravaa`;
      const expectedDescription =
        `با مسیر شغلی ${entry.path.name} آشنا شو؛ سطح‌های شغلی، مهارت‌ها، ابزارها و نکته‌های تصمیم‌گیری را قبل از انتخاب مسیر بررسی کن.`;
      const serializedMetadata = JSON.stringify(metadata).toLowerCase();
      const openGraphImages = (metadata.openGraph as { images?: unknown } | undefined)?.images;
      const twitterImages = (metadata.twitter as { images?: unknown } | undefined)?.images;
      const ogImageUrl = toAbsoluteMetadataUrl(getFirstMetadataImageUrl(openGraphImages));
      const twitterImageUrl = toAbsoluteMetadataUrl(getFirstMetadataImageUrl(twitterImages));

      expect(generateStaticParams()).toContainEqual({ slug });
      expect(renderToStaticMarkup(
        await CareerPathSeoPage({ params: Promise.resolve({ slug }) })
      )).toContain(`مسیر شغلی ${entry.path.name}`);
      expect(metadata.title).toBe(expectedTitle);
      expect(metadata.description).toBe(expectedDescription);
      expect(metadata.alternates).toEqual({ canonical: entry.canonicalUrl });
      expect(metadata.robots).toEqual({ index: true, follow: true });
      expect(metadata.openGraph).toMatchObject({
        title: expectedTitle,
        description: expectedDescription,
        url: entry.canonicalUrl,
        siteName: "Useravaa",
        type: "website"
      });
      expect(ogImageUrl).toBe(approvedShareImageUrl);
      expect(ogImageUrl).toMatch(/^https:\/\/useravaa\.com\/og\/useravaa-career-share\.png$/u);
      expect(metadata.twitter).toMatchObject({
        card: "summary_large_image",
        title: expectedTitle,
        description: expectedDescription
      });
      expect(twitterImageUrl).toBe(approvedShareImageUrl);
      expect(twitterImageUrl).toMatch(/^https:\/\//u);
      expect(serializedMetadata).not.toContain("noindex");
      expect(serializedMetadata).not.toContain("nofollow");
      expect(serializedMetadata).not.toMatch(/\+989\d{9}/u);
      expect(serializedMetadata).not.toMatch(/09\d{9}/u);
      forbiddenSeoLanguage.forEach((claim) => expect(serializedMetadata).not.toContain(claim.toLowerCase()));
      forbiddenUserMetadata.forEach((claim) => expect(serializedMetadata).not.toContain(claim.toLowerCase()));
      genericPlaceholderMetadata.forEach((claim) => expect(serializedMetadata).not.toContain(claim.toLowerCase()));
    }
  });

  it("includes every career path page in sitemap without duplicates or invalid paths", () => {
    const urls = sitemap().map((entry) => entry.url);
    const pathUrls = getCareerPathSeoEntries().map((entry) => entry.canonicalUrl);

    expect(urls).toContain("https://useravaa.com");
    expect(pathUrls).toHaveLength(58);
    expect(new Set(urls).size).toBe(urls.length);
    expect(pathUrls.every((url) => urls.includes(url))).toBe(true);
    expect(urls).not.toContain("https://useravaa.com/career/paths/not-a-real-career-path");
    expect(sitemap()).toEqual(expect.arrayContaining(
      pathUrls.map((url) => expect.objectContaining({
        url,
        changeFrequency: "monthly",
        priority: 0.7
      }))
    ));
  });

  it("uses only safe WebPage structured data and avoids job/course schema", async () => {
    const entry = getCareerPathSeoEntries()[0];
    const html = renderToStaticMarkup(
      await CareerPathSeoPage({ params: Promise.resolve({ slug: entry.slug }) })
    );
    const schemaMatch = html.match(/<script type="application\/ld\+json">(.+?)<\/script>/u);
    expect(schemaMatch?.[1]).toBeDefined();
    const schema = JSON.parse(schemaMatch![1]) as Record<string, unknown>;

    expect(schema["@type"]).toBe("WebPage");
    expect(schema.url).toBe(entry.canonicalUrl);
    expect(html).not.toContain("JobPosting");
    expect(html).not.toContain("Course");
    expect(html).not.toContain("Article");
    expect(html).not.toContain(removedCtaCopy);
    expect(html).not.toContain(removedHardshipCopy);
    forbiddenSeoLanguage.forEach((claim) => expect(html.toLowerCase()).not.toContain(claim.toLowerCase()));
    forbiddenProductCopy.forEach((claim) => expect(html.toLowerCase()).not.toContain(claim.toLowerCase()));
  });

  it("renders only WebPage schema for representative share preview pages", async () => {
    for (const slug of representativeSharePreviewSlugs) {
      const entry = getRequiredCareerPathEntry(slug);
      const html = renderToStaticMarkup(
        await CareerPathSeoPage({ params: Promise.resolve({ slug }) })
      );
      const schemaMatch = html.match(/<script type="application\/ld\+json">(.+?)<\/script>/u);
      expect(schemaMatch?.[1]).toBeDefined();
      const schema = JSON.parse(schemaMatch![1]) as Record<string, unknown>;
      const schemaTypes = collectSchemaTypes(schema);

      expect(schemaTypes).toEqual(["WebPage"]);
      expect(schema.url).toBe(entry.canonicalUrl);
      expect(schemaTypes).not.toEqual(expect.arrayContaining(["JobPosting", "Course", "Product", "Review", "FAQ", "FAQPage"]));
    }
  });
});
