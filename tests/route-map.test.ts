import { describe, expect, it } from "vitest";
import { appRoutes, getRouteById, getRouteIdByPathname, mainNavigation, utilityNavigation } from "@/lib/routes";

describe("phase 1 route scaffold", () => {
  it("keeps the handoff route count in the scaffold", () => {
    expect(appRoutes).toHaveLength(21);
  });

  it("maps dynamic paths to their route ids", () => {
    expect(getRouteIdByPathname("/profiles/ali")).toBe("profileDetail");
    expect(getRouteIdByPathname("/requests")).toBe("requests");
    expect(getRouteIdByPathname("/sessions")).toBe("sessions");
    expect(getRouteIdByPathname("/settings")).toBe("settings");
    expect(getRouteIdByPathname("/conversations/conv_1/propose-times")).toBe("proposeTimes");
    expect(getRouteIdByPathname("/conversations/conv_1/select-time")).toBe("selectTime");
    expect(getRouteIdByPathname("/checkout/conv_1")).toBe("checkout");
    expect(getRouteIdByPathname("/saved")).toBe("saved");
  });

  it("preserves the V51 primary labels for top-level pages", () => {
    expect(getRouteById("discover").title).toBe("کشف تجربه‌ها");
    expect(getRouteById("insights").title).toBe("بینش‌ها");
    expect(getRouteById("requests").title).toBe("درخواست‌ها");
    expect(getRouteById("sessions").title).toBe("جلسه‌ها");
    expect(getRouteById("conversations").title).toBe("جلسه‌ها");
    expect(getRouteById("profile").title).toBe("پروفایل من");
    expect(getRouteById("wallet").title).toBe("کیف پول و پرداخت‌ها");
  });

  it("keeps the V51 header navigation hierarchy and labels", () => {
    expect(mainNavigation.map((item) => item.label)).toEqual(["کشف تجربه‌ها", "بینش‌ها", "درخواست‌ها", "جلسه‌ها"]);
    expect(mainNavigation.map((item) => item.href)).toEqual(["/discover", "/insights", "/requests", "/sessions"]);
    expect(utilityNavigation.map((item) => item.label)).toEqual(["اعلان‌ها", "ذخیره‌شده‌ها", "کیف پول", "راهنما"]);
  });
});
