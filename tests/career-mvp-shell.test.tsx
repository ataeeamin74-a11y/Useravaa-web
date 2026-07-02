import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ComparePage } from "@/features/career/ComparePage";
import { GuidePage } from "@/features/career/GuidePage";
import { PathsPage } from "@/features/career/PathsPage";
import { careerCards, careerDomains, guideCategories } from "@/features/career/career-data";
import { matchesCareerCard, splitCareerList } from "@/features/career/career-utils";

describe("career paths MVP shell", () => {
  it("normalizes the real career card JSON", () => {
    expect(careerCards).toHaveLength(68);
    expect(careerCards[0]).toMatchObject({
      id: "CARD_001",
      domain: "Technology & Engineering",
      title: ".NET / C# Backend - سطح کارشناسی",
      keyTechnicalSkills: [".NET / C#"],
      keyTools: ["SQL Databases", "Git"],
      keySoftSkills: ["کار تیمی و همکاری"]
    });
    expect(careerDomains).toHaveLength(10);
  });

  it("splits supported separators and searches categories, skills, and tools", () => {
    expect(splitCareerList("اول، دوم؛ سوم, چهارم")).toEqual(["اول", "دوم", "سوم", "چهارم"]);
    expect(matchesCareerCard(careerCards[0], "Backend Platform", "all")).toBe(true);
    expect(matchesCareerCard(careerCards[0], "SQL Databases", "all")).toBe(true);
    expect(matchesCareerCard(careerCards[0], "SQL Databases", "Data & AI")).toBe(false);
  });

  it("renders the paths search, JSON domains, and real cards", () => {
    const html = renderToStaticMarkup(<PathsPage />);
    expect(html).toContain("جست‌وجوی مسیر شغلی");
    expect(html).toContain("حوزه‌های شغلی");
    expect(html).toContain("Technology &amp; Engineering");
    expect(html).toContain(".NET / C# Backend - سطح کارشناسی");
    expect(html).toContain("مهارت‌های تخصصی");
    expect(html).toContain("ابزارها و تکنولوژی‌ها");
    expect(html).toContain("مهارت‌های نرم");
  });

  it("renders two selectors and the three comparison sections", () => {
    const html = renderToStaticMarkup(<ComparePage />);
    expect(html.match(/<select/g)).toHaveLength(2);
    expect(html).toContain("مشترک بین هر دو");
    expect(html).toContain("فقط مسیر اول");
    expect(html).toContain("فقط مسیر دوم");
  });

  it("renders exactly the four requested guide categories", () => {
    const html = renderToStaticMarkup(<GuidePage />);
    expect(guideCategories).toHaveLength(4);
    guideCategories.forEach((category) => expect(html).toContain(category.title));
  });
});
