import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import CareerSkillsRoute, { metadata as skillsMetadata } from "@/app/career/skills/page";
import { CareerSkillsPage } from "@/features/career/CareerSkillsPage";
import { navigationItems, isCareerTabActive } from "@/features/career/CareerBottomNav";
import {
  buildCareerPathProductContent
} from "@/features/career/career-path-page-content";
import {
  getCareerPathSeoEntries,
  getCareerPathSeoEntryBySlug
} from "@/features/career/career-path-seo";
import {
  careerSkillRequirements,
  resolveCareerSkillRequirements
} from "@/features/career/career-skill-requirements";
import {
  buildCareerSkillGap,
  getCareerSkillMatchBySlug,
  rankCareerSkillMatches
} from "@/features/career/career-skill-matcher";
import {
  CAREER_SKILL_PROFILE_STORAGE_KEY,
  clearSkillProfile,
  getSkillProfile,
  migrateSkillProfile,
  removeSkillSelection,
  saveSkillProfile,
  setSkillSelection,
  validateSkillProfile,
  type UserSkillProfile
} from "@/features/career/career-skill-profile";
import {
  getSkillById,
  normalizeSkillSearchText,
  resolveSkillId,
  searchSkillCatalog,
  skillCatalog,
  skillTypes
} from "@/features/career/skill-catalog";
import { sanitizeCareerEventPayload } from "@/features/career/career-events";

function profile(
  selections: readonly Readonly<{ skillId: string; state: "have" | "interested" }>[]
): UserSkillProfile {
  return {
    version: 1,
    selections,
    updatedAt: "2026-07-14T00:00:00.000Z"
  };
}

function createMemoryStorage() {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear: vi.fn(() => {
      values.clear();
    }),
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    key: vi.fn((index: number) => Array.from(values.keys())[index] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      values.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      values.delete(key);
    }),
    values
  } satisfies Storage & Readonly<{ values: Map<string, string> }>;
}

describe("career skill ontology", () => {
  it("provides stable unique atomic catalog items across four valid types", () => {
    expect(skillCatalog.itemCount).toBe(skillCatalog.items.length);
    expect(skillCatalog.items.length).toBeGreaterThan(250);
    expect(new Set(skillCatalog.items.map((item) => item.id)).size).toBe(skillCatalog.items.length);
    expect(new Set(skillCatalog.items.map((item) => normalizeSkillSearchText(item.titleFa))).size)
      .toBe(skillCatalog.items.length);
    expect(new Set(skillCatalog.items.map((item) => item.type))).toEqual(new Set(skillTypes));

    skillCatalog.items.forEach((item) => {
      expect(item.id).toMatch(/^(soft|foundational|specialized|tool)-[a-z0-9-]+$/u);
      expect(item.titleFa).not.toMatch(/[،,/;]|\sو\s/u);
      expect(item.descriptionFa.length).toBeGreaterThan(20);
      expect(item.isSelectable).toBe(true);
    });
  });

  it("resolves Persian and English aliases without duplicate selectable items", () => {
    expect(resolveSkillId("اکسل")).toBe("tool-microsoft-excel");
    expect(resolveSkillId("Excel")).toBe("tool-microsoft-excel");
    expect(resolveSkillId("ارتباطات مؤثر")).toBe("soft-effective-communication");
    expect(searchSkillCatalog("Excel").map((item) => item.id)).toContain("tool-microsoft-excel");
    expect(searchSkillCatalog("فیگما").map((item) => item.id)).toContain("tool-figma");
    expect(searchSkillCatalog("تحلیل داده").map((item) => item.id)).toContain("foundational-data-analysis");
    expect(resolveSkillId("تحلیل آماری")).not.toBe(resolveSkillId("تحلیل داده"));
    expect(resolveSkillId("تحقیق بازار")).not.toBe(resolveSkillId("تحقیق کاربر"));
  });

  it("covers all 58 canonical paths with valid typed references and healthy depth", () => {
    const canonicalSlugs = getCareerPathSeoEntries().map((entry) => entry.slug);
    const requirementSlugs = careerSkillRequirements.records.map((record) => record.careerSlug);

    expect(careerSkillRequirements.canonicalCareerCount).toBe(58);
    expect(careerSkillRequirements.records).toHaveLength(58);
    expect(new Set(requirementSlugs)).toEqual(new Set(canonicalSlugs));
    expect(requirementSlugs).toContain("social-media-marketing");
    expect(requirementSlugs).toContain("graphic-design-and-visual-content");
    expect(requirementSlugs).not.toContain("social-media-content-creation");
    expect(requirementSlugs).not.toContain("social-media-management");

    careerSkillRequirements.records.forEach((record) => {
      const requirements = resolveCareerSkillRequirements(record);
      expect(requirements.length).toBeGreaterThanOrEqual(16);
      expect(record.softSkills.length).toBeGreaterThanOrEqual(4);
      expect(record.foundationalSkills.length).toBeGreaterThanOrEqual(4);
      expect(record.specializedSkills.length).toBeGreaterThanOrEqual(4);
      expect(record.tools.length).toBeGreaterThanOrEqual(4);
      expect(new Set(requirements.map((item) => item.skill.id)).size).toBe(requirements.length);
      requirements.forEach((item) => {
        expect(getSkillById(item.skill.id)).toBeDefined();
        expect(["core", "important", "useful"]).toContain(item.requirement.importance);
        expect(["awareness", "basic", "working", "advanced"]).toContain(item.requirement.entryExpectation);
        expect(item.skill.type).toBe(item.type);
      });
    });
  });

  it("sources every visible career-page skill tag from canonical skill IDs", () => {
    const catalogTitles = new Set(skillCatalog.items.map((item) => item.titleFa));

    for (const entry of getCareerPathSeoEntries()) {
      const content = buildCareerPathProductContent(entry);
      const visibleTags = [
        ...content.reality.softSkills,
        ...content.reality.technicalSkills,
        ...content.reality.tools
      ];
      expect(visibleTags.length).toBeGreaterThan(0);
      visibleTags.forEach((title) => expect(catalogTitles.has(title), `${entry.slug}: ${title}`).toBe(true));
    }
  });
});

describe("career skill matching engine", () => {
  const figma = "tool-figma";
  const userResearch = "specialized-user-research";
  const communication = "soft-effective-communication";

  it("returns exactly ten deterministic canonical results without duplicates", () => {
    const input = profile([
      { skillId: figma, state: "have" },
      { skillId: communication, state: "have" },
      { skillId: userResearch, state: "interested" },
      { skillId: "foundational-data-analysis", state: "interested" },
      { skillId: "soft-active-listening", state: "have" }
    ]);
    const first = rankCareerSkillMatches(input);
    const second = rankCareerSkillMatches(JSON.parse(JSON.stringify(input)) as UserSkillProfile);

    expect(first).toHaveLength(10);
    expect(first.map((match) => match.careerSlug)).toEqual(second.map((match) => match.careerSlug));
    expect(new Set(first.map((match) => match.careerSlug)).size).toBe(10);
    first.forEach((match) => {
      expect(getCareerPathSeoEntryBySlug(match.careerSlug)).toBeDefined();
      expect(match.explanation).not.toMatch(/ساخته شده|بهترین شغل|تناسب قطعی|شخصیت تو/u);
      expect(match.strongestReasons.length).toBeLessThanOrEqual(3);
      expect(Object.values(match.missingCoreByType).flat()).toHaveLength(match.missingCore.length);
      expect(["current", "interest", "mixed", "limited"]).toContain(match.basis);
    });
  });

  it("weights current capability more than interest and reduces score for missing core skills", () => {
    const haveMatch = getCareerSkillMatchBySlug(profile([{ skillId: figma, state: "have" }]), "ui-ux")!;
    const interestMatch = getCareerSkillMatchBySlug(profile([{ skillId: figma, state: "interested" }]), "ui-ux")!;
    const withCoreInterest = getCareerSkillMatchBySlug(profile([
      { skillId: figma, state: "have" },
      { skillId: userResearch, state: "interested" }
    ]), "ui-ux")!;

    expect(haveMatch.score).toBeGreaterThan(interestMatch.score);
    expect(withCoreInterest.score).toBeGreaterThan(haveMatch.score);
    expect(haveMatch.missingCore.length).toBeGreaterThan(0);
    expect(withCoreInterest.matchedInterests.map((item) => item.skill.id)).toContain(userResearch);
  });

  it("returns no ranking without input and builds explainable prioritized gap groups", () => {
    expect(rankCareerSkillMatches(profile([]))).toEqual([]);
    const input = profile([
      { skillId: figma, state: "have" },
      { skillId: userResearch, state: "interested" },
      { skillId: communication, state: "have" }
    ]);
    const match = getCareerSkillMatchBySlug(input, "ui-ux")!;
    const gap = buildCareerSkillGap(match, input);

    expect(gap.current.map((item) => item.skill.id)).toEqual(expect.arrayContaining([figma, communication]));
    expect(gap.specialized.some((item) => item.skill.id === userResearch && item.selectedState === "interested")).toBe(true);
    expect([...gap.soft, ...gap.foundational, ...gap.specialized, ...gap.tools]
      .every((item) => ["شروع از اینجا", "قدم بعد", "برای بعدتر"].includes(item.priority)))
      .toBe(true);
  });
});

describe("career skill profile storage", () => {
  it("persists canonical IDs, reloads deterministically, and clears state", () => {
    const storage = createMemoryStorage();
    const selected = setSkillSelection(profile([]), "tool-microsoft-excel", "have");
    const withInterest = setSkillSelection(selected, "soft-effective-communication", "interested");
    const saved = saveSkillProfile(withInterest, storage, "2026-07-14T10:00:00.000Z");

    expect(storage.values.get(CAREER_SKILL_PROFILE_STORAGE_KEY)).not.toContain("Microsoft Excel");
    expect(getSkillProfile(storage)).toEqual(saved);
    expect(removeSkillSelection(saved, "tool-microsoft-excel").selections).toHaveLength(1);
    expect(clearSkillProfile(storage)).toBe(true);
    expect(getSkillProfile(storage).selections).toEqual([]);
  });

  it("migrates aliases and removes invalid or duplicate legacy entries", () => {
    const migrated = migrateSkillProfile({
      version: 0,
      skills: [
        { title: "Excel", state: "have" },
        { title: "اکسل", state: "want" },
        { title: "not-real", state: "have" },
        { skillId: "soft-teamwork", state: "invalid" }
      ],
      updatedAt: "2026-07-14T10:00:00.000Z"
    });

    expect(migrated.selections).toEqual([{ skillId: "tool-microsoft-excel", state: "interested" }]);
    expect(validateSkillProfile({ version: 1, selections: null }).selections).toEqual([]);
  });
});

describe("career skills product integration", () => {
  it("adds an active bottom-nav destination and a direct route without changing sitemap paths", () => {
    expect(navigationItems.map((item) => [item.href, item.label])).toContainEqual(["/career/skills", "مهارت‌ها"]);
    expect(isCareerTabActive("/career/skills", "/career/skills")).toBe(true);
    expect(isCareerTabActive("/career", "/career/skills")).toBe(false);
    expect(CareerSkillsRoute().props.children.type).toBe(CareerSkillsPage);
    expect(skillsMetadata.robots).toEqual({ index: false, follow: false });
    expect(getCareerPathSeoEntries()).toHaveLength(58);
  });

  it("keeps UI controls accessible and mobile layout explicitly constrained", () => {
    const componentSource = readFileSync("src/features/career/CareerSkillsPage.tsx", "utf8");
    const stylesSource = readFileSync("src/features/career/CareerSkillsPage.module.css", "utf8");

    expect(componentSource).toContain('aria-label="فیلتر نوع مهارت"');
    expect(componentSource).toContain('role="group"');
    expect(componentSource).toContain("aria-pressed");
    expect(componentSource).toContain('href="/career"');
    expect(componentSource).toContain("بازگشت به مسیرها");
    expect(componentSource).toContain("برای دیدن مسیرها");
    expect(componentSource).toContain('aria-live="polite"');
    expect(componentSource).toContain("data-career-skill-result");
    expect(componentSource).toContain("مشاهده کامل مسیر");
    expect(stylesSource).toContain("@media (max-width: 680px)");
    expect(stylesSource).toContain("@media (max-width: 1023px)");
    expect(stylesSource).toContain("position: fixed");
    expect(stylesSource).toContain("inset-block-end: calc(94px + env(safe-area-inset-bottom))");
    expect(stylesSource).toContain("padding-bottom: 132px");
    expect(stylesSource).toContain("minmax(0, 1fr)");
    expect(stylesSource).not.toContain("linear-gradient");
  });

  it("sanitizes every new event without retaining free text", () => {
    expect(sanitizeCareerEventPayload("career_skill_selected", {
      skillId: "tool-microsoft-excel",
      skillType: "tool",
      selectionState: "have",
      query: "09123456789 raw text"
    })).toEqual({
      skillId: "tool-microsoft-excel",
      skillType: "tool",
      selectionState: "have"
    });
    expect(sanitizeCareerEventPayload("career_skill_results_requested", {
      selectedCount: 5,
      haveCount: 3,
      interestedCount: 2,
      fullName: "Ali Rezaei"
    })).toEqual({ selectedCount: 5, haveCount: 3, interestedCount: 2 });
    expect(sanitizeCareerEventPayload("career_skill_path_opened", {
      careerSlug: "ui-ux",
      resultRank: 1,
      matchedCount: 5,
      missingCoreCount: 3,
      phone: "+989123456789"
    })).toEqual({ careerSlug: "ui-ux", resultRank: 1, matchedCount: 5, missingCoreCount: 3 });
  });
});
