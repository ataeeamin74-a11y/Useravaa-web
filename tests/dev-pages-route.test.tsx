import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import DevPagesRoute from "@/app/dev/pages/page";

describe("/dev/pages QA navigation route", () => {
  it("lists implemented Useravaa routes and separates missing routes", () => {
    const html = renderToStaticMarkup(<DevPagesRoute />);

    expect(html).toContain("بررسی صفحات Useravaa");
    expect(html).toContain('href="/discover"');
    expect(html).toContain('href="/insights"');
    expect(html).toContain('href="/profile"');
    expect(html).toContain('href="/requests"');
    expect(html).toContain('href="/sessions"');
    expect(html).toContain('href="/settings"');
    expect(html).toContain('href="/profiles/ali"');
    expect(html).toContain('href="/profile/build"');
    expect(html).toContain('href="/insights/active-question-product-ambiguity-ali"');
    expect(html).toContain('href="/profile?state=none"');
    expect(html).toContain('href="/saved?tab=insights"');
    expect(html).toContain("پیاده‌سازی نشده");
    expect(html).not.toContain("صفحه مستقیم وجود ندارد");
    expect(html).toContain('href="/conversations/conv-provider-request/propose-times"');
    expect(html).toContain('href="/conversations/conv-time-options/select-time"');
  });
});
