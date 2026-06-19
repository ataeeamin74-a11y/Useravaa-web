import { describe, expect, it } from "vitest";
import { appRoutes, getRouteById, getRouteIdByPathname, mainNavigation, utilityNavigation } from "@/lib/routes";

describe("phase 1 route scaffold", () => {
  it("keeps the handoff route count in the scaffold", () => {
    expect(appRoutes).toHaveLength(22);
  });

  it("maps dynamic paths to their route ids", () => {
    expect(getRouteIdByPathname("/profiles/ali")).toBe("profileDetail");
    expect(getRouteIdByPathname("/requests")).toBe("requests");
    expect(getRouteIdByPathname("/sessions")).toBe("sessions");
    expect(getRouteIdByPathname("/actions")).toBe("actions");
    expect(getRouteIdByPathname("/settings")).toBe("settings");
    expect(getRouteIdByPathname("/conversations/conv_1/propose-times")).toBe("proposeTimes");
    expect(getRouteIdByPathname("/conversations/conv_1/select-time")).toBe("selectTime");
    expect(getRouteIdByPathname("/checkout/conv_1")).toBe("checkout");
    expect(getRouteIdByPathname("/saved")).toBe("saved");
  });

  it("preserves route metadata for top-level and flow pages", () => {
    expect(getRouteById("discover").href).toBe("/discover");
    expect(getRouteById("insights").href).toBe("/insights");
    expect(getRouteById("requests").href).toBe("/requests");
    expect(getRouteById("sessions").href).toBe("/sessions");
    expect(getRouteById("actions").href).toBe("/actions");
    expect(getRouteById("conversations").href).toBe("/conversations");
    expect(getRouteById("checkout").href).toBe("/checkout/[conversationId]");
    expect(getRouteById("wallet").href).toBe("/wallet");
  });

  it("keeps one main navigation entry for the conversation/session cluster", () => {
    expect(mainNavigation.map((item) => item.href)).toEqual(["/discover", "/insights", "/conversations", "/guide"]);
    expect(mainNavigation[2].label).toBe("جلسه‌ها");
    expect(mainNavigation[2].routeIds).toEqual([
      "conversations",
      "conversationDetail",
      "proposeTimes",
      "selectTime",
      "checkout",
      "requestNew",
      "requests",
      "sessions",
      "actions"
    ]);
    expect(mainNavigation[3].label).toBe("راهنما");
    expect(mainNavigation[3].routeIds).toEqual(["guide"]);
    expect(utilityNavigation.map((item) => item.href)).toEqual(["/notifications", "/saved", "/wallet", "/guide"]);
  });
});
