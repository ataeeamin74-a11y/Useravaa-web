import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import CareerPathSeoPage from "@/app/career/paths/[slug]/page";
import { careerHierarchy } from "@/features/career/career-data";
import { buildCareerPathProductContent } from "@/features/career/career-path-page-content";
import { getCareerPathSeoEntries, getCareerPathSeoEntryBySlug } from "@/features/career/career-path-seo";
import {
  careerResearch,
  getCareerResearchByAppSlug,
  getCareerResearchByCardId,
  getCareerResearchByResearchSlug
} from "@/features/career/career-research-content";
import { careerResearchIndex } from "@/features/career/career-research-index";

const approvedFitLabels = [
  "نیاز به تعامل با آدم‌ها",
  "نیاز به استفاده از ابزارها",
  "نیاز به خلاقیت",
  "نیاز به تحلیل آماری"
] as const;

function sha256(path: string) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

describe("career research ingestion", () => {
  it("reconciles 59 source reports into exactly 58 canonical career paths", () => {
    const hierarchyPaths = careerHierarchy.flatMap((domain) => (
      domain.generalCategories.flatMap((category) => category.subfamilies)
    ));
    const seoEntries = getCareerPathSeoEntries();

    expect(careerResearch.sourceRoleCount).toBe(59);
    expect(careerResearch.roleCount).toBe(58);
    expect(careerResearch.roles).toHaveLength(58);
    expect(careerResearchIndex.sourceRoleCount).toBe(59);
    expect(careerResearchIndex.roleCount).toBe(58);
    expect(careerResearchIndex.roles).toHaveLength(58);
    expect(hierarchyPaths).toHaveLength(58);
    expect(seoEntries).toHaveLength(58);
    expect(new Set(careerResearch.roles.map((role) => role.roleId)).size).toBe(58);
    expect(new Set(careerResearch.roles.map((role) => role.researchSlug)).size).toBe(58);
    expect(new Set(careerResearch.roles.map((role) => role.appSlug)).size).toBe(58);
    expect(new Set(careerResearch.roles.map((role) => role.cardId)).size).toBe(58);

    const socialMediaResearch = getCareerResearchByResearchSlug("social-media-marketing");
    expect(getCareerResearchByResearchSlug("social-media-content-creation"))
      .toBe(socialMediaResearch);
    expect(getCareerResearchByResearchSlug("social-media-management"))
      .toBe(socialMediaResearch);
    expect(socialMediaResearch).toMatchObject({
      appSlug: "social-media-marketing",
      cardId: "CARD_032",
      hero: {
        titleFa: "بازاریابی شبکه‌های اجتماعی",
        titleEn: "Social Media Marketing"
      },
      sourceResearchSlugs: ["social-media-content-creation", "social-media-management"]
    });
    expect(getCareerPathSeoEntryBySlug("social-media-content-creation")).toBeUndefined();
    expect(getCareerPathSeoEntryBySlug("social-media-management")).toBeUndefined();
    expect(getCareerResearchByResearchSlug("graphic-design-visual-content")?.appSlug)
      .toBe("graphic-design-and-visual-content");
  });

  it("keeps all 59 source DOCX files private, present, and checksum-matched", () => {
    const sourceDocuments = careerResearch.roles.flatMap((role) => role.source.documents);

    expect(sourceDocuments).toHaveLength(59);
    expect(new Set(sourceDocuments.map((document) => document.researchSlug)).size).toBe(59);
    sourceDocuments.forEach((document) => {
      expect(document.docxPath).toMatch(/^content\/career-research\/[a-z0-9-]+\/deep-research\.docx$/u);
      expect(document.docxPath).not.toContain("public/");
      expect(existsSync(document.docxPath)).toBe(true);
      expect(readFileSync(document.docxPath).subarray(0, 2).toString()).toBe("PK");
      expect(sha256(document.docxPath)).toBe(document.sha256);
    });
  });

  it("documents a curated social-media merge without discarding either report", () => {
    const socialMediaResearch = getCareerResearchByAppSlug("social-media-marketing")!;

    expect(socialMediaResearch.source.documents.map((document) => document.researchSlug)).toEqual([
      "social-media-content-creation",
      "social-media-management"
    ]);
    expect(socialMediaResearch.source.reconciliation).toMatchObject({
      strategy: "curated_merge",
      preservedEvidence: expect.arrayContaining([
        expect.stringContaining("production"),
        expect.stringContaining("community")
      ])
    });
    expect(socialMediaResearch.reality.technicalSkills.join(" ")).toMatch(/CapCut|Premiere/u);
    expect(socialMediaResearch.reality.technicalSkills.join(" ")).toMatch(/Social listening/iu);
    expect(socialMediaResearch.reality.tools.join(" ")).toMatch(/Platform analytics/iu);
    expect(socialMediaResearch.relatedResearchSlugs).toEqual([
      "content-marketing",
      "graphic-design-visual-content",
      "video-editing-production",
      "motion-graphics-animation",
      "brand-strategy-branding",
      "digital-marketing-general"
    ]);
  });

  it("validates the complete seven-part product payload for every career path", () => {
    careerResearch.roles.forEach((role) => {
      const entry = getCareerPathSeoEntryBySlug(role.appSlug);
      const content = entry ? buildCareerPathProductContent(entry) : null;

      expect(entry?.representativeCard.id).toBe(role.cardId);
      expect(getCareerResearchByCardId(role.cardId)).toBe(role);
      expect(getCareerResearchByAppSlug(role.appSlug)).toBe(role);
      expect(content?.title).toBe(role.hero.titleFa);
      expect(content?.intro).toBe(role.hero.decisionDescription.replace(/\bAI\b/gu, "هوش مصنوعی"));
      const visibleProductCopy = content ? [
        content.intro,
        content.heroDescriptor,
        ...content.decisionCards.map((card) => card.value),
        ...content.reality.workday,
        ...content.reality.softSkills,
        ...content.reality.technicalSkills,
        ...content.reality.tools,
        ...content.hardships.map((hardship) => hardship.body),
        ...content.intelligence.easier,
        ...content.intelligence.harder,
        ...content.interviewQuestions
      ].join(" ") : "";
      expect(visibleProductCopy).not.toMatch(/\bAI\b/u);
      expect(role.fitDimensions.map((dimension) => dimension.label)).toEqual(approvedFitLabels);
      role.fitDimensions.forEach((dimension) => expect(["کم", "متوسط", "زیاد"]).toContain(dimension.level));
      expect(role.reality.workday.length).toBeGreaterThan(0);
      expect(role.reality.softSkills.length).toBeGreaterThan(0);
      expect(role.reality.technicalSkills.length).toBeGreaterThan(0);
      expect(role.reality.tools.length).toBeGreaterThan(0);
      expect(role.hardships.length).toBeGreaterThanOrEqual(3);
      expect(role.hardships.length).toBeLessThanOrEqual(5);
      expect(role.intelligence.easier.length).toBeGreaterThan(0);
      expect(role.intelligence.harder.length).toBeGreaterThan(0);
      expect(role.interviewQuestions).toHaveLength(5);
      expect(role.relatedPaths).toHaveLength(6);
      role.relatedResearchSlugs.forEach((slug) => {
        expect(getCareerResearchByResearchSlug(slug)).toBeDefined();
      });
    });
  });

  it("server-renders all 58 complete canonical decision pages from researched content", async () => {
    for (const role of careerResearch.roles) {
      const html = renderToStaticMarkup(
        await CareerPathSeoPage({ params: Promise.resolve({ slug: role.appSlug }) })
      );

      expect(html).toContain(`مسیر شغلی ${role.hero.titleFa}`);
      expect(html).toContain(role.hero.decisionDescription);
      expect(html).toContain("این شغل مناسب منه؟");
      expect(html).toContain("واقعیت‌های شغلی");
      expect(html).toContain("سختی‌ها");
      expect(html).toContain("فرصت‌ها و تهدیدهای هوش مصنوعی");
      expect(html).toContain("سوالات متداول مصاحبه شغلی");
      expect((html.match(/data-interview-question/g) ?? [])).toHaveLength(5);
      expect(html).toContain("مسیرهای مشابه");
      expect(html).not.toContain("JobPosting");
      expect(html).not.toContain("Course");
      expect(html).not.toContain("Article");
    }
  });

  it("keeps ingestion reproducible without a DOCX parsing dependency", () => {
    const script = readFileSync("scripts/ingest-career-research.mjs", "utf8");
    const packageJson = readFileSync("package.json", "utf8");
    const sharedSeoHelper = readFileSync("src/features/career/career-path-seo.ts", "utf8");

    expect(script).toContain("USERAVAA_CAREER_RESEARCH_SOURCE");
    expect(script).toContain("role_manifest.json");
    expect(script).toContain("product appendix");
    expect(script).toContain("deep-research.docx");
    expect(packageJson).not.toMatch(/mammoth|docx-parser|officeparser/iu);
    expect(sharedSeoHelper).toContain("career-research-index");
    expect(sharedSeoHelper).not.toContain("career-research-content");
  });
});
