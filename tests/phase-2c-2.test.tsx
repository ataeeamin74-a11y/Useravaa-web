import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  filterNetworkItems,
  getNetworkItems,
  initialSavedProfileIds,
  receivedFeedbackItems,
  toggleNetworkProfileId
} from "@/features/v51/data/my-profile";
import { toFaDecimal } from "@/features/v51/data/profiles";
import { ProfileFeedbackPage } from "@/features/v51/my-profile/pages/ProfileFeedbackPage";
import { ProfileNetworkPage } from "@/features/v51/my-profile/pages/ProfileNetworkPage";

describe("Phase 2C-2 V51 profile network and feedback pages", () => {
  it("network tabs render correctly with profile navigation", () => {
    const html = renderToStaticMarkup(<ProfileNetworkPage />);

    expect(html).toContain("ذخیره‌شده‌ها");
    expect(html).not.toContain("دنبال");
    expect(html).toContain("/profiles/nazanin");
    expect(html).toContain("/profiles/mina");
    expect(html).toContain("مشاهده تجربه");
  });

  it("network search works against visible network items", () => {
    const items = getNetworkItems("saved", [], initialSavedProfileIds);
    const filtered = filterNetworkItems(items, { query: "مینا", category: "", sort: "recent" });

    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe("mina");
  });

  it("network category filter works", () => {
    const items = getNetworkItems("saved", [], initialSavedProfileIds);
    const filtered = filterNetworkItems(items, { query: "", category: "مارکتینگ و برند", sort: "recent" });

    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe("mina");
  });

  it("network sort works by organization level", () => {
    const items = getNetworkItems("saved", [], initialSavedProfileIds);
    const sorted = filterNetworkItems(items, { query: "", category: "", sort: "level" });

    expect(sorted[0].id).toBe("nazanin");
  });

  it("saved state toggles where applicable", () => {
    const unsaved = toggleNetworkProfileId(initialSavedProfileIds, "mina");

    expect(unsaved).not.toContain("mina");
  });

  it("feedback page renders summary", () => {
    const html = renderToStaticMarkup(<ProfileFeedbackPage />);

    expect(html).toContain("بازخوردهای دریافتی");
    expect(html).toContain("بازخورد دریافتی");
    expect(html).toContain("میانگین رضایت");
    expect(html).toContain("جلسه موفق");
  });

  it("feedback cards show reviewer identity and rating display", () => {
    const html = renderToStaticMarkup(<ProfileFeedbackPage />);

    expect(html).toContain(receivedFeedbackItems[0].name);
    expect(html).toContain(receivedFeedbackItems[0].role);
    expect(html).toContain(`${toFaDecimal(receivedFeedbackItems[0].rating)} از ۵`);
  });

  it("feedback empty state renders when no feedback exists", () => {
    const html = renderToStaticMarkup(<ProfileFeedbackPage feedbacks={[]} />);

    expect(html).toContain("هنوز بازخوردی ثبت نشده است.");
  });
});
