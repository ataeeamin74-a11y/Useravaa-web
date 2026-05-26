import fs from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DiscoverPage } from "@/features/v51/discover/DiscoverPage";
import { getRequestHref, profiles, toggleProfileIdSelection } from "@/features/v51/data/profiles";
import { ProfileDetailPage } from "@/features/v51/profile/ProfileDetailPage";
import { ProfileRequestPanel } from "@/features/v51/profile/ProfileRequestPanel";
import { ProfileBuilderPage } from "@/features/v51/my-profile/pages/ProfileBuilderPage";

const duration30Label = "\u06f3\u06f0 \u062f\u0642\u06cc\u0642\u0647";
const duration60Label = "\u06f1 \u0633\u0627\u0639\u062a";
const saveForLaterLabel = "\u0630\u062e\u06cc\u0631\u0647 \u062a\u062c\u0631\u0628\u0647";

function readProjectFile(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("Manual Chrome V51 UI fix batch", () => {
  it("feedback card renders reviewer identity beside rating and comment", () => {
    const profile = profiles[0];
    const html = renderToStaticMarkup(<ProfileDetailPage profile={profile} />);

    expect(html).toContain(profile.reviewAuthor.name);
    expect(html).toContain(profile.reviewAuthor.role);
    expect(html).toContain(profile.reviewAuthor.company);
    expect(html).toContain(profile.review);
    expect(html).toContain("reviewCard");
  });

  it("30-minute duration option is clickable and selected by default", () => {
    const html = renderToStaticMarkup(<ProfileRequestPanel profile={profiles[0]} />);

    expect(html).toContain("<button");
    expect(html).toContain(duration30Label);
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain("priceCardSelected");
  });

  it("60-minute duration option is clickable and can render as selected", () => {
    const html = renderToStaticMarkup(<ProfileRequestPanel profile={profiles[0]} initialDuration={60} />);

    expect(html).toContain("<button");
    expect(html).toContain(duration60Label);
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain("priceCardSelected");
  });

  it("request CTA routes with selected profile and duration", () => {
    const profile = profiles[0];
    const html = renderToStaticMarkup(<ProfileRequestPanel profile={profile} initialDuration={60} />);

    expect(getRequestHref(profile.id, 30)).toBe(`/requests/new?profileId=${profile.id}&duration=30`);
    expect(getRequestHref(profile.id, 60)).toBe(`/requests/new?profileId=${profile.id}&duration=60`);
    expect(html).toContain(`/requests/new?profileId=${profile.id}&amp;duration=60`);
  });

  it("RTL select controls keep text right-aligned and chevrons on the left", () => {
    const discoverCss = readProjectFile("src/features/v51/discover/DiscoverPage.module.css");
    const profileCss = readProjectFile("src/features/v51/my-profile/components/MyProfile.module.css");
    const builderHtml = renderToStaticMarkup(<ProfileBuilderPage />);

    expect(discoverCss).toContain("padding: 0 12px 0 44px;");
    expect(discoverCss).toContain("left: 20px;");
    expect(discoverCss).toContain("-webkit-appearance: none;");
    expect(profileCss).toContain(".selectWrap");
    expect(profileCss).toContain(".selectCaret");
    expect(profileCss).toContain("padding: 0 12px 0 44px;");
    expect(profileCss).toContain("left: 20px;");
    expect(builderHtml).toContain("selectCaret");
  });

  it("discover save button remains clickable after moving to the card left side", () => {
    const html = renderToStaticMarkup(<DiscoverPage initialState="ready" />);
    const discoverCss = readProjectFile("src/features/v51/discover/DiscoverPage.module.css");

    expect(html).toContain(`aria-label="${saveForLaterLabel}"`);
    expect(renderToStaticMarkup(<DiscoverPage initialState="ready" initialSavedProfileIds={[profiles[0].id]} />)).toContain("ذخیره‌شده");
    expect(html).toContain("<button");
    expect(discoverCss).toContain("inset-inline-end: 14px;");
    expect(discoverCss).toContain("padding-inline-end: 128px;");
  });

  it("saved and unsaved fixture state still toggles deterministically", () => {
    const profileId = profiles[0].id;
    const saved = toggleProfileIdSelection(new Set<string>(), profileId);
    const unsaved = toggleProfileIdSelection(saved, profileId);

    expect(saved.has(profileId)).toBe(true);
    expect(unsaved.has(profileId)).toBe(false);
  });
});
