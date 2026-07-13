import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  curatedCareerPageContent,
  getCuratedCareerPageContent
} from "@/features/career/career-page-curated-content";
import { buildCareerPathProductContent } from "@/features/career/career-path-page-content";
import { getCareerPathSeoEntries } from "@/features/career/career-path-seo";
import { careerResearch } from "@/features/career/career-research-content";
import {
  getCareerSkillRequirementsBySlug,
  resolveCareerSkillRequirements
} from "@/features/career/career-skill-requirements";
import { getSkillById, skillCatalog } from "@/features/career/skill-catalog";

const bannedUxCopy = [
  "روزمره، مهارت‌ها و ابزارها در یک قاب کوتاه؛ نه یک مقاله طولانی.",
  "سختی‌ها برای ترساندن نیستند؛ برای این‌اند که قبل از انتخاب، تصویر کامل‌تری داشته باشی.",
  "نگاه آرام و عملی به اینکه چه چیزهایی سریع‌تر می‌شود و کجا قضاوت انسانی هنوز تعیین‌کننده است.",
  "قضاوت، کنترل منبع و مسئولیت نتیجه همچنان بخش مهم کار حرفه‌ای است.",
  "چهار بُعد ساده برای اینکه بدون تست شخصیت و عددسازی، حس اولیه‌ات را با واقعیت کار مقایسه کنی."
] as const;

const parserFragments = /(?:موقعیت رایج|راهکار:|\b(?:trade-off|legacy|handoff|verification|observability|metric|incident|rollback|production)\b)/iu;
const atomicTagSeparators = /[،,/]| و /u;
const invalidToolConcepts = /^(?:تحلیل داده|مدیریت پروژه|گزارش‌نویسی|تفکر طراحی)$/u;

function productionProse(page: (typeof curatedCareerPageContent.pages)[number]) {
  return [
    page.heroDescriptor,
    page.intro,
    ...Object.values(page.decisionCards),
    ...page.workday,
    ...page.hardships.flatMap((item) => [item.title, item.body]),
    ...page.intelligence.easier,
    ...page.intelligence.harder,
    ...page.interviewQuestions
  ];
}

function stripExplainedEnglish(value: string) {
  return value.replace(/\([^)]*[A-Za-z][^)]*\)/gu, "");
}

describe("career page content curation", () => {
  it("covers all 58 canonical careers with verified research-backed records", () => {
    const canonicalSlugs = getCareerPathSeoEntries().map((entry) => entry.slug);
    const curatedSlugs = curatedCareerPageContent.pages.map((page) => page.careerSlug);

    expect(curatedCareerPageContent.pageCount).toBe(58);
    expect(curatedCareerPageContent.pages).toHaveLength(58);
    expect(new Set(curatedSlugs)).toEqual(new Set(canonicalSlugs));
    curatedCareerPageContent.pages.forEach((page) => {
      expect(page.sourceResearchSlugs.length).toBeGreaterThan(0);
      expect(getCuratedCareerPageContent(page.careerSlug)).toBe(page);
    });
  });

  it("provides concrete novice-readable daily work and explained difficulties on every page", () => {
    for (const entry of getCareerPathSeoEntries()) {
      const content = buildCareerPathProductContent(entry);

      expect(content.reality.workday.length, entry.slug).toBeGreaterThanOrEqual(5);
      expect(content.reality.workday.length, entry.slug).toBeLessThanOrEqual(8);
      content.reality.workday.forEach((item) => {
        expect(item.length, `${entry.slug}: ${item}`).toBeGreaterThanOrEqual(45);
        expect(item, entry.slug).toMatch(/\.$/u);
        expect(item, entry.slug).not.toMatch(parserFragments);
      });

      expect(content.hardships.length, entry.slug).toBeGreaterThanOrEqual(4);
      expect(content.hardships.length, entry.slug).toBeLessThanOrEqual(6);
      content.hardships.forEach((item) => {
        expect(item.title.trim().length, entry.slug).toBeGreaterThanOrEqual(6);
        expect(item.body.length, `${entry.slug}: ${item.title}`).toBeGreaterThanOrEqual(90);
        expect(item.body, entry.slug).toMatch(/\.$/u);
        expect(item.body, entry.slug).not.toMatch(parserFragments);
      });
    }
  });

  it("keeps every visible skill atomic, normalized, correctly categorized, and tool-safe", () => {
    const catalogTitlesByType = new Map(
      skillCatalog.items.map((item) => [`${item.type}:${item.titleFa}`, item.id])
    );

    for (const entry of getCareerPathSeoEntries()) {
      const record = getCareerSkillRequirementsBySlug(entry.slug);
      const content = buildCareerPathProductContent(entry);

      expect(record, entry.slug).toBeDefined();
      const resolved = resolveCareerSkillRequirements(record!);
      expect(resolved).toHaveLength(
        record!.softSkills.length
        + record!.foundationalSkills.length
        + record!.specializedSkills.length
        + record!.tools.length
      );
      resolved.forEach(({ type, requirement, skill }) => {
        expect(getSkillById(requirement.skillId), `${entry.slug}: ${requirement.skillId}`).toBe(skill);
        expect(skill.type, `${entry.slug}: ${skill.titleFa}`).toBe(type);
      });

      expect(content.reality.softSkills.length, entry.slug).toBeGreaterThanOrEqual(5);
      expect(content.reality.softSkills.length, entry.slug).toBeLessThanOrEqual(8);
      content.reality.softSkills.forEach((title) => {
        expect(catalogTitlesByType.get(`soft:${title}`), `${entry.slug}: ${title}`).toBeDefined();
        expect(title, entry.slug).not.toMatch(atomicTagSeparators);
      });

      content.reality.technicalSkills.forEach((title) => {
        const isNormalizedTechnicalSkill = catalogTitlesByType.has(`foundational:${title}`)
          || catalogTitlesByType.has(`specialized:${title}`);
        expect(isNormalizedTechnicalSkill, `${entry.slug}: ${title}`).toBe(true);
        expect(title, entry.slug).not.toMatch(atomicTagSeparators);
      });

      expect(content.reality.tools.length, entry.slug).toBeGreaterThanOrEqual(4);
      expect(content.reality.tools.length, entry.slug).toBeLessThanOrEqual(8);
      content.reality.tools.forEach((title) => {
        expect(catalogTitlesByType.get(`tool:${title}`), `${entry.slug}: ${title}`).toBeDefined();
        expect(title, entry.slug).not.toMatch(invalidToolConcepts);
      });
    }
  });

  it("provides career-specific AI opportunities and sensitivities instead of filler", () => {
    for (const entry of getCareerPathSeoEntries()) {
      const content = buildCareerPathProductContent(entry);

      for (const items of [content.intelligence.easier, content.intelligence.harder]) {
        expect(items.length, entry.slug).toBeGreaterThanOrEqual(4);
        expect(items.length, entry.slug).toBeLessThanOrEqual(6);
        items.forEach((item) => {
          expect(item.length, `${entry.slug}: ${item}`).toBeGreaterThanOrEqual(100);
          expect(item, entry.slug).toMatch(/\.$/u);
          expect(item, entry.slug).not.toMatch(parserFragments);
        });
      }

      content.intelligence.easier.forEach((item) => {
        expect(item, entry.slug).toContain("هوش مصنوعی");
        expect(item, entry.slug).toMatch(/(?:هنوز|اما|باید|فقط)/u);
      });
    }
  });

  it("keeps exactly five natural RTL Persian interview questions per career", () => {
    for (const entry of getCareerPathSeoEntries()) {
      const content = buildCareerPathProductContent(entry);

      expect(content.interviewQuestions, entry.slug).toHaveLength(5);
      content.interviewQuestions.forEach((item) => {
        expect(item, entry.slug).toMatch(/؟$/u);
        expect(item, entry.slug).not.toMatch(/\?$/u);
        expect(stripExplainedEnglish(item), `${entry.slug}: ${item}`).not.toMatch(/[A-Za-z]{2,}/u);
      });
    }

    const component = readFileSync(
      "src/app/career/paths/[slug]/CareerPathProductPage.tsx",
      "utf8"
    );
    const css = readFileSync(
      "src/app/career/paths/[slug]/CareerPathSeoPage.module.css",
      "utf8"
    );
    const questionRule = css.match(/\.interviewItem h3\s*\{([\s\S]*?)\}/u)?.[1] ?? "";

    expect(component).toContain('<h3 dir="rtl">{question}</h3>');
    expect(component).toMatch(/<span>\{\(index \+ 1\).*?<\/span>[\s\S]*?<h3 dir="rtl">\{question\}<\/h3>/u);
    expect(questionRule).toContain("direction: rtl");
    expect(questionRule).toContain("text-align: right");
    expect(questionRule).toContain("unicode-bidi: plaintext");
  });

  it("contains no banned UX filler, raw research fallback, or duplicated production prose", () => {
    const rawResearchStrings = new Set(careerResearch.roles.flatMap((role) => [
      ...role.reality.workday,
      ...role.hardships.flatMap((item) => [item.title, item.explanation, item.context]),
      ...role.intelligence.easier,
      ...role.intelligence.harder,
      ...role.interviewQuestions
    ]));
    const owners = new Map<string, string[]>();

    for (const page of curatedCareerPageContent.pages) {
      const prose = productionProse(page);
      const duplicateSensitiveProse = [
        ...page.workday,
        ...page.hardships.map((item) => item.body),
        ...page.intelligence.easier,
        ...page.intelligence.harder,
        ...page.interviewQuestions
      ];

      prose.forEach((item) => {
        bannedUxCopy.forEach((banned) => expect(item, page.careerSlug).not.toContain(banned));
        expect(item, page.careerSlug).not.toMatch(parserFragments);
        expect(stripExplainedEnglish(item), `${page.careerSlug}: ${item}`).not.toMatch(/[A-Za-z]{2,}/u);
      });
      duplicateSensitiveProse.forEach((item) => {
        expect(rawResearchStrings.has(item), `${page.careerSlug}: raw fallback`).toBe(false);
        owners.set(item, [...(owners.get(item) ?? []), page.careerSlug]);
      });
    }

    const crossCareerDuplicates = [...owners.entries()].filter(([, slugs]) => new Set(slugs).size > 1);
    expect(crossCareerDuplicates).toEqual([]);
  });
});
