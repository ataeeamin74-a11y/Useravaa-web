import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CAREER_EVENT_SESSION_STORAGE_KEY,
  getCareerEventSessionId,
  resetCareerEventSessionForTests,
  sanitizeCareerEventPayload,
  sendCareerEventToGa4,
  trackCareerEvent
} from "@/features/career/career-events";

const originalGaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

function createMemoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => values.set(key, value)),
    values
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  resetCareerEventSessionForTests();
  if (originalGaMeasurementId === undefined) delete process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  else process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = originalGaMeasurementId;
});

describe("career event tracking helper", () => {
  it("generates and reuses an anonymous session id", () => {
    const storage = createMemoryStorage();
    vi.stubGlobal("window", {
      localStorage: storage,
      crypto: { randomUUID: () => "career-session-id" }
    });

    expect(getCareerEventSessionId()).toBe("career-session-id");
    expect(getCareerEventSessionId()).toBe("career-session-id");
    expect(storage.values.get(CAREER_EVENT_SESSION_STORAGE_KEY)).toBe("career-session-id");
    expect(storage.setItem).toHaveBeenCalledTimes(1);
  });

  it("uses sendBeacon when available and strips PII payload fields", async () => {
    const storage = createMemoryStorage();
    const sendBeacon = vi.fn((url: string, body?: BodyInit | null) => {
      void url;
      void body;
      return true;
    });
    vi.stubGlobal("window", {
      localStorage: storage,
      crypto: { randomUUID: () => "career-session-id" }
    });
    vi.stubGlobal("navigator", { sendBeacon });

    trackCareerEvent("career_path_saved", {
      pathId: "data-ai",
      phone: "09123456789",
      fullName: "Ali Rezaei",
      query: "raw search"
    });

    expect(sendBeacon).toHaveBeenCalledTimes(1);
    const [url, body] = sendBeacon.mock.calls[0];
    expect(url).toBe("/api/career/events");
    const payload = JSON.parse(await (body as Blob).text()) as Record<string, unknown>;
    expect(payload).toMatchObject({
      event: "career_path_saved",
      sessionId: "career-session-id",
      payload: { pathId: "data-ai" }
    });
    expect(JSON.stringify(payload)).not.toContain("09123456789");
    expect(JSON.stringify(payload)).not.toContain("Ali Rezaei");
    expect(JSON.stringify(payload)).not.toContain("raw search");
  });

  it("falls back to fetch with keepalive and never throws on network failure", () => {
    const storage = createMemoryStorage();
    const sendBeacon = vi.fn((url: string, body?: BodyInit | null) => {
      void url;
      void body;
      return false;
    });
    const fetch = vi.fn(() => Promise.reject(new Error("offline")));
    vi.stubGlobal("window", {
      localStorage: storage,
      crypto: { randomUUID: () => "career-session-id" }
    });
    vi.stubGlobal("navigator", { sendBeacon });
    vi.stubGlobal("fetch", fetch);

    expect(() => trackCareerEvent("career_compare_selection_changed", { selectedCount: 2 })).not.toThrow();
    expect(fetch).toHaveBeenCalledWith("/api/career/events", expect.objectContaining({
      method: "POST",
      keepalive: true
    }));
  });

  it("sanitizes allowed payload keys for optional GA4 forwarding", () => {
    expect(sanitizeCareerEventPayload("career_lead_submit_succeeded", {
      trigger: "path_save",
      stage: "بین چند مسیر مرددم",
      phone: "09123456789",
      fullName: "Ali Rezaei",
      uncertainty: "raw text"
    })).toEqual({
      trigger: "path_save",
      stage: "بین چند مسیر مرددم"
    });
  });

  it("does nothing for GA4 when the measurement id is missing", () => {
    delete process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    const gtag = vi.fn();
    vi.stubGlobal("window", { gtag });

    expect(sendCareerEventToGa4("career_path_saved", { pathId: "data-ai" })).toBe(false);
    expect(gtag).not.toHaveBeenCalled();
  });

  it("sends only sanitized payload to GA4 when configured", () => {
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = "G-USERAVAA";
    const gtag = vi.fn();
    vi.stubGlobal("window", { gtag });

    expect(sendCareerEventToGa4("career_path_saved", {
      pathId: "data-ai",
      phone: "+989123456789",
      fullName: "Ali Rezaei"
    })).toBe(true);
    expect(gtag).toHaveBeenCalledWith("event", "career_path_saved", { pathId: "data-ai" });
  });
});
