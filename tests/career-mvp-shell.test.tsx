import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ComparePage } from "@/features/career/ComparePage";
import { GuidePage } from "@/features/career/GuidePage";
import { PathsPage } from "@/features/career/PathsPage";
import { careerPaths, guideCategories } from "@/features/career/career-data";

describe("career paths MVP shell", () => {
  it("keeps real career card data empty for the shell phase", () => {
    expect(careerPaths).toEqual([]);
  });

  it("renders the paths search, domains, and placeholder list", () => {
    const html = renderToStaticMarkup(<PathsPage />);
    expect(html).toContain("جست‌وجوی مسیر شغلی");
    expect(html).toContain("حوزه‌های شغلی");
    expect(html).toContain("کارت‌های مسیر به‌زودی اینجا قرار می‌گیرند");
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
