import { readFileSync } from "node:fs";
import { NextRequest } from "next/server";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import CareerLearningRoute, { metadata } from "@/app/career/learn/page";
import { GET as getCareerLearningCoursesRoute } from "@/app/api/career/learning/courses/route";
import { CareerLearningPageFallback } from "@/features/career/CareerLearningPage";
import { navigationItems, isCareerTabActive } from "@/features/career/CareerBottomNav";
import {
  CAREER_COURSE_COMPARE_LIMIT,
  CAREER_COURSE_PRICE_FRESH_DAYS,
  auditCareerLearningCourse,
  buildCareerLearningUrl,
  careerLearningProviders,
  getCareerLearningCourseCount,
  getCareerLearningCoverage,
  getCoursePricePresentation,
  getPersonalizedLearningSkills,
  getTrustedProviderLinks,
  normalizeCareerLearningQuery,
  readCareerLearningQuery,
  sanitizeComparedCourseIds,
  toggleComparedCourseId
} from "@/features/career/career-learning";
import {
  careerLearningCourses,
  getCareerLearningCoursesForSkill
} from "@/features/career/career-learning-server";
import { sanitizeCareerEventPayload } from "@/features/career/career-events";
import { getCareerPathSeoEntryBySlug } from "@/features/career/career-path-seo";
import { skillCatalog, skillTypes } from "@/features/career/skill-catalog";

const iranianLearningProviders = new Set([
  "maktabkhooneh",
  "faradars",
  "hamrah-academy",
  "inverse",
  "novin-academy",
  "quera-college",
  "roocket",
  "sabzlearn",
  "toplearn",
  "bozhan-school",
  "pact",
  "mostamar-academy",
  "hesabdaran-khebreh",
  "tehran-business-school"
]);

describe("career learning catalog", () => {
  it("covers all 320 normalized selectable skills with direct courses and trusted discovery sources", () => {
    const coverage = getCareerLearningCoverage();
    const selectableSkills = skillCatalog.items.filter((skill) => skill.isSelectable);

    expect(coverage.totalSkillCount).toBe(320);
    expect(selectableSkills).toHaveLength(320);
    expect(new Set(selectableSkills.map((skill) => skill.type))).toEqual(new Set(skillTypes));
    selectableSkills.forEach((skill) => {
      expect(getCareerLearningCourseCount(skill.id)).toBeGreaterThan(0);
      expect(getCareerLearningCoursesForSkill(skill.id).length).toBeGreaterThan(0);
      expect(getTrustedProviderLinks(skill).length).toBeGreaterThanOrEqual(3);
      getTrustedProviderLinks(skill).forEach((provider) => {
        expect(provider.href).toMatch(/^https:\/\//u);
      });
    });
  });

  it("keeps every curated course traceable to a trusted HTTPS provider and normalized skills", () => {
    expect(careerLearningCourses.length).toBeGreaterThanOrEqual(5_000);
    expect(careerLearningProviders.length).toBeGreaterThanOrEqual(17);
    expect(new Set(careerLearningCourses.map((course) => course.id)).size)
      .toBe(careerLearningCourses.length);

    careerLearningCourses.forEach((course) => {
      expect(auditCareerLearningCourse(course)).toEqual([]);
      expect(course.sourceUrl).toMatch(/^https:\/\//u);
      expect(course.skillIds.length).toBeGreaterThan(0);
      course.skillIds.forEach((skillId) => {
        expect(skillCatalog.items.some((skill) => skill.id === skillId)).toBe(true);
      });
    });
  });

  it("discovers the large official Iranian catalogs and prioritizes local matches", () => {
    const index = JSON.parse(readFileSync(
      "src/features/career/data/career-learning-index.json",
      "utf8"
    )) as {
      sources: Array<{
        provider: string;
        status: string;
        discoveredUrlCount: number;
        archivePageCount?: number;
      }>;
    };
    const sourceByProvider = new Map(index.sources.map((source) => [source.provider, source]));
    const iranianCourseCount = careerLearningCourses.filter(
      (course) => iranianLearningProviders.has(course.provider)
    ).length;

    expect(sourceByProvider.get("maktabkhooneh")).toMatchObject({ status: "ok" });
    expect(sourceByProvider.get("maktabkhooneh")!.discoveredUrlCount).toBeGreaterThanOrEqual(4_000);
    expect(sourceByProvider.get("faradars")!.discoveredUrlCount).toBeGreaterThanOrEqual(3_400);
    expect(sourceByProvider.get("roocket")!.discoveredUrlCount).toBeGreaterThanOrEqual(100);
    expect(sourceByProvider.get("novin-academy")!.discoveredUrlCount).toBeGreaterThanOrEqual(50);
    expect(sourceByProvider.get("sabzlearn")).toMatchObject({
      status: "ok",
      archivePageCount: 203
    });
    expect(sourceByProvider.get("sabzlearn")!.discoveredUrlCount).toBeGreaterThanOrEqual(90);
    expect(sourceByProvider.get("bozhan-school")).toMatchObject({
      status: "ok",
      archivePageCount: 3
    });
    expect(sourceByProvider.get("bozhan-school")!.discoveredUrlCount).toBeGreaterThanOrEqual(20);
    expect(sourceByProvider.get("pact")!.discoveredUrlCount).toBeGreaterThanOrEqual(190);
    expect(iranianCourseCount).toBeGreaterThan(careerLearningCourses.length - iranianCourseCount);
    expect(careerLearningCourses.some((course) => /^https?:\/\//u.test(course.title))).toBe(false);
    expect(careerLearningCourses.some((course) => (
      course.skillIds.includes("tool-java")
      && /(?:javascript|java script|جاوا اسکریپت)/iu.test(course.title)
    ))).toBe(false);

    const paidAdvertising = getCareerLearningCoursesForSkill("specialized-paid-advertising");
    expect(paidAdvertising.length).toBeGreaterThanOrEqual(12);
    expect(paidAdvertising.some((course) => course.provider === "maktabkhooneh")).toBe(true);
    expect(paidAdvertising.some((course) => course.provider === "novin-academy")).toBe(true);
    expect(paidAdvertising.some((course) => course.provider === "hamrah-academy")).toBe(true);
    expect(iranianLearningProviders.has(paidAdvertising[0]!.provider)).toBe(true);
  });

  it("shows recent prices but hides stale numeric prices", () => {
    const paidCourse = careerLearningCourses.find((course) => course.price.kind === "paid")!;
    const verifiedAt = Date.parse(paidCourse.price.verifiedAt);
    const recent = getCoursePricePresentation(paidCourse, verifiedAt + 24 * 60 * 60 * 1000);
    const staleTime = verifiedAt + (CAREER_COURSE_PRICE_FRESH_DAYS + 2) * 24 * 60 * 60 * 1000;
    const stale = getCoursePricePresentation(paidCourse, staleTime);

    expect(recent.isFresh).toBe(true);
    expect(recent.label).toContain("تومان");
    expect(stale).toEqual({ label: "قیمت را در سایت ببین", isFresh: false });
    expect(stale.label).not.toMatch(/\d/u);
  });

  it("prioritizes normalized requirements from saved canonical career paths", () => {
    const socialMedia = getCareerPathSeoEntryBySlug("social-media-marketing")!;
    const personalized = getPersonalizedLearningSkills(new Set([socialMedia.path.id]));

    expect(personalized.length).toBeGreaterThanOrEqual(16);
    expect(personalized.every((item) => skillCatalog.items.some((skill) => skill.id === item.skill.id)))
      .toBe(true);
    expect(personalized.some((item) => item.pathTitles.includes("بازاریابی شبکه‌های اجتماعی")))
      .toBe(true);
    expect(getPersonalizedLearningSkills(new Set())).toEqual([]);
  });

  it("ranks direct skill matches and limits comparison to three valid unique courses", () => {
    const excelCourses = getCareerLearningCoursesForSkill("tool-microsoft-excel");
    const candidateIds = [...excelCourses.map((course) => course.id), "unknown", ...excelCourses.map((course) => course.id)];
    const selected = sanitizeComparedCourseIds(candidateIds, excelCourses);

    expect(excelCourses.length).toBeGreaterThanOrEqual(3);
    expect(selected).toHaveLength(CAREER_COURSE_COMPARE_LIMIT);
    expect(new Set(selected).size).toBe(selected.length);
  });

  it("serves only one skill slice through the API and rejects unknown skills", async () => {
    const response = getCareerLearningCoursesRoute(new NextRequest(
      "http://localhost/api/career/learning/courses?skillId=specialized-paid-advertising"
    ));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.skillId).toBe("specialized-paid-advertising");
    expect(payload.courses.length).toBeGreaterThanOrEqual(6);
    expect(payload.courses.every((course: { skillIds: string[] }) => (
      course.skillIds.includes("specialized-paid-advertising")
    ))).toBe(true);

    const invalid = getCareerLearningCoursesRoute(new NextRequest(
      "http://localhost/api/career/learning/courses?skillId=not-a-skill"
    ));
    expect(invalid.status).toBe(400);
    await expect(invalid.json()).resolves.toEqual({ ok: false, error: "invalid_skill" });

    const missing = getCareerLearningCoursesRoute(new NextRequest(
      "http://localhost/api/career/learning/courses"
    ));
    expect(missing.status).toBe(400);
    await expect(missing.json()).resolves.toEqual({ ok: false, error: "invalid_skill" });
  });

  it("serves valid direct API results for all 320 normalized skills", async () => {
    const selectableSkills = skillCatalog.items.filter((skill) => skill.isSelectable);

    for (const skill of selectableSkills) {
      const response = getCareerLearningCoursesRoute(new NextRequest(
        `http://localhost/api/career/learning/courses?skillId=${skill.id}`
      ));
      const payload = await response.json() as {
        ok: boolean;
        skillId: string;
        courses: Array<{ skillIds: string[] }>;
      };

      expect(response.status, skill.id).toBe(200);
      expect(payload.ok, skill.id).toBe(true);
      expect(payload.skillId).toBe(skill.id);
      expect(payload.courses.length, skill.id).toBeGreaterThan(0);
      expect(payload.courses.every((course) => course.skillIds.includes(skill.id)), skill.id)
        .toBe(true);
    }
  });

  it("supports direct routes for every skill type", async () => {
    for (const skillType of skillTypes) {
      const skill = skillCatalog.items.find((item) => item.isSelectable && item.type === skillType)!;
      const response = getCareerLearningCoursesRoute(new NextRequest(
        `http://localhost/api/career/learning/courses?skillId=${skill.id}`
      ));
      const payload = await response.json() as { skillId: string; courses: unknown[] };

      expect(response.status).toBe(200);
      expect(payload.skillId).toBe(skill.id);
      expect(payload.courses.length).toBeGreaterThan(0);
    }
  });

  it("normalizes filters and compare state in the learning URL", () => {
    const skillId = "tool-microsoft-excel";
    const courses = getCareerLearningCoursesForSkill(skillId);
    const provider = courses[0]!.provider;
    const selectedIds = courses.slice(0, 4).map((course) => course.id);
    const raw = new URLSearchParams({
      skill: skillId,
      language: "fa",
      provider,
      compare: `${selectedIds.join(",")},${selectedIds[0]},bad/id`,
      ignored: "arbitrary-user-text"
    });
    const normalized = normalizeCareerLearningQuery(raw, courses, true);
    const state = readCareerLearningQuery(normalized);
    const url = buildCareerLearningUrl(state);

    expect(normalized.get("skill")).toBe(skillId);
    expect(normalized.get("language")).toBe("fa");
    expect(normalized.get("provider")).toBe(provider);
    expect(state.comparedCourseIds).toEqual(selectedIds.slice(0, CAREER_COURSE_COMPARE_LIMIT));
    expect(normalized.has("ignored")).toBe(false);
    expect(url).toContain(`skill=${skillId}`);
    expect(url).toContain("language=fa");
    expect(url).toContain(`provider=${provider}`);
  });

  it("cleans invalid or incompatible route state and resets detail state between skills", () => {
    const skillId = "tool-microsoft-excel";
    const courses = getCareerLearningCoursesForSkill(skillId);
    const incompatibleProvider = careerLearningProviders.find((provider) => (
      !courses.some((course) => course.provider === provider.id)
    ))!;
    const invalid = normalizeCareerLearningQuery(new URLSearchParams({
      skill: skillId,
      language: "de",
      provider: incompatibleProvider.id,
      compare: "unknown-course"
    }), courses, true);

    expect(invalid.toString()).toBe(`skill=${skillId}`);
    expect(normalizeCareerLearningQuery(new URLSearchParams({
      skill: "not-a-skill",
      compare: "unknown-course"
    })).toString()).toBe("");
    expect(buildCareerLearningUrl({
      skillId: "soft-curiosity",
      comparedCourseIds: []
    })).toBe("/career/learn?skill=soft-curiosity");
  });

  it("adds, removes, deduplicates, and caps comparison selections", () => {
    const courses = getCareerLearningCoursesForSkill("tool-microsoft-excel");
    const [first, second, third, fourth] = courses;

    const one = toggleComparedCourseId([], first!.id, courses);
    const two = toggleComparedCourseId(one, second!.id, courses);
    const three = toggleComparedCourseId(two, third!.id, courses);
    const stillThree = toggleComparedCourseId(three, fourth!.id, courses);
    const removed = toggleComparedCourseId(stillThree, second!.id, courses);

    expect(one).toEqual([first!.id]);
    expect(two).toEqual([first!.id, second!.id]);
    expect(three).toHaveLength(CAREER_COURSE_COMPARE_LIMIT);
    expect(stillThree).toEqual(three);
    expect(removed).toEqual([first!.id, third!.id]);
  });
});

describe("career learning product integration", () => {
  it("adds the learning destination while preserving the five-item mobile nav", () => {
    expect(navigationItems).toHaveLength(5);
    expect(navigationItems.map((item) => [item.href, item.label])).toContainEqual(["/career/learn", "یادگیری"]);
    expect(navigationItems.map((item) => item.href)).not.toContain("/career/compare");
    expect(isCareerTabActive("/career/learn", "/career/learn")).toBe(true);
    expect(isCareerTabActive("/career/compare", "/career/learn")).toBe(false);
  });

  it("keeps the app-only route noindex and renders a useful loading state", () => {
    const route = CareerLearningRoute();
    const fallbackHtml = renderToStaticMarkup(<CareerLearningPageFallback />);

    expect(route).toBeTruthy();
    expect(metadata.robots).toEqual({ index: false, follow: false });
    expect(fallbackHtml).toContain("در حال آماده‌کردن دوره‌ها");
    expect(fallbackHtml).toContain("data-career-learning-page");
  });

  it("implements accessible search, deep-linked skill detail, comparison, and safe external links", () => {
    const source = readFileSync("src/features/career/CareerLearningPage.tsx", "utf8");
    const styles = readFileSync("src/features/career/CareerLearningPage.module.css", "utf8");

    expect(source).toContain('aria-label="جست‌وجوی مهارت"');
    expect(source).toContain("buildCareerLearningUrl(nextState)");
    expect(source).toContain("normalizeCareerLearningQuery(");
    expect(source).toContain("router.replace(");
    expect(source).toContain('rel="noopener noreferrer"');
    expect(source).toContain("catalog: coverage.generatedAt");
    expect(source).toContain("/api/career/learning/courses?${courseCatalogQuery.toString()}");
    expect(source).toContain('course.price.kind !== "unknown"');
    expect(source).toContain("قیمت، زمان، تمرین، مدرس، زبان و امتیاز");
    expect(source).toContain('aria-label="فیلتر زبان دوره"');
    expect(source).toContain('aria-label="فیلتر منبع دوره"');
    expect(source).toContain('aria-pressed={selected}');
    expect(source).toContain("comparisonTray");
    expect(source).toContain('role="status"');
    expect(source).toContain('role="alert"');
    expect(source).toContain("filteredCourses.slice(0, visibleCourseLimit)");
    expect(source).toContain("متن دیدگاه کاربران در Useravaa ذخیره نمی‌شود");
    expect(source).not.toContain("هنوز دوره‌ای با جزئیات قابل‌مقایسه ثبت نشده");
    expect(source).not.toContain('type="checkbox"');
    expect(source).not.toContain("<main");
    expect(styles).toContain("min-height: 44px");
    expect(styles).toContain(".pageWithDetail .intro");
    expect(styles).toContain(".comparisonTray");
    expect(styles).not.toMatch(/font-size:\s*(?:9|10|11)px/u);
    expect(styles).not.toMatch(/linear-gradient|radial-gradient/u);
  });

  it("keeps the full course payload server-only and the client on the lightweight index", () => {
    const clientSource = readFileSync("src/features/career/CareerLearningPage.tsx", "utf8");
    const sharedSource = readFileSync("src/features/career/career-learning.ts", "utf8");
    const serverSource = readFileSync("src/features/career/career-learning-server.ts", "utf8");

    expect(clientSource).not.toContain("career-learning-courses.json");
    expect(sharedSource).toContain("career-learning-index.json");
    expect(sharedSource).not.toContain("career-learning-courses.json");
    expect(serverSource).toContain("career-learning-courses.json");
  });

  it("keeps learning event payloads free of raw search text and PII", () => {
    expect(sanitizeCareerEventPayload("career_learning_skill_opened", {
      skillId: "tool-microsoft-excel",
      skillType: "tool",
      courseCount: 3,
      fullName: "نام نمونه",
      phone: "+989121234567",
      query: "متن دلخواه کاربر"
    })).toEqual({
      skillId: "tool-microsoft-excel",
      skillType: "tool",
      courseCount: 3
    });
    expect(sanitizeCareerEventPayload("career_learning_course_opened", {
      skillId: "tool-git",
      provider: "roocket",
      contact: "09121234567"
    })).toEqual({ skillId: "tool-git", provider: "roocket" });
  });
});
