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
  getCareerPathSlugs,
  getCareerPathSoftSkills,
  getCareerPathTechnicalSkills,
  getCareerPathTools,
  getRelatedCareerPathSeoEntries
} from "@/features/career/career-path-seo";

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

  it("renders a useful path page with levels, skills, related paths, and product CTAs", async () => {
    const entry = getCareerPathSeoEntries()[0];
    const html = renderToStaticMarkup(
      await CareerPathSeoPage({ params: Promise.resolve({ slug: entry.slug }) })
    );

    expect(html).toContain(`مسیر شغلی ${entry.path.name}`);
    expect(html).toContain("این مسیر شغلی درباره چیست؟");
    expect(html).toContain("این مسیر برای چه کسی مناسب‌تر است؟");
    expect(html).toContain("سطح‌های شغلی این مسیر");
    expect(html).toContain(entry.path.cards[0].seniority);
    expect(html).toContain(entry.path.cards[0].title);
    expect(html).toContain("مهارت‌های مهم این مسیر");
    expect(html).toContain(getCareerPathTechnicalSkills(entry.path)[0]);
    expect(html).toContain("ابزارها و تکنولوژی‌های رایج");
    expect(html).toContain(getCareerPathTools(entry.path)[0]);
    expect(html).toContain("مهارت‌های نرم مهم");
    expect(html).toContain(getCareerPathSoftSkills(entry.path)[0]);
    expect(html).toContain("مسیرهای مرتبط");
    expect(html).toContain(getRelatedCareerPathSeoEntries(entry.path)[0].pageHref);
    expect(html).toContain("بررسی این مسیر در Useravaa");
    expect(html).toContain("ذخیره برای بررسی بیشتر");
    expect(html).toContain("مقایسه با مسیرهای دیگر");
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
    forbiddenSeoLanguage.forEach((claim) => expect(html.toLowerCase()).not.toContain(claim.toLowerCase()));
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
