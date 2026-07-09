import { readFileSync } from "node:fs";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  POST,
  parseCareerEventPayload,
  resetCareerEventApiGuards
} from "@/app/api/career/events/route";

const originalEventsPath = process.env.USERAVAA_CAREER_EVENTS_PATH;
const temporaryDirectories: string[] = [];

afterEach(async () => {
  vi.restoreAllMocks();
  resetCareerEventApiGuards();
  if (originalEventsPath === undefined) delete process.env.USERAVAA_CAREER_EVENTS_PATH;
  else process.env.USERAVAA_CAREER_EVENTS_PATH = originalEventsPath;
  await Promise.all(temporaryDirectories.splice(0).map((directory) => (
    rm(directory, { recursive: true, force: true })
  )));
});

function eventRequest(body: unknown, headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/career/events", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body)
  });
}

function rawEventRequest(body: string, headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/career/events", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body
  });
}

describe("POST /api/career/events", () => {
  it("appends valid events as sanitized JSONL rows", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "useravaa-career-events-"));
    temporaryDirectories.push(directory);
    const eventsPath = path.join(directory, "nested", "career-events.jsonl");
    process.env.USERAVAA_CAREER_EVENTS_PATH = eventsPath;

    const response = await POST(eventRequest({
      event: "career_path_saved",
      sessionId: "career-session-1",
      occurredAt: "2026-07-09T08:00:00.000Z",
      payload: {
        pathId: "data-ai",
        fullName: "Ali Rezaei",
        phone: "+989123456789"
      }
    }, { "x-forwarded-for": "203.0.113.20" }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    const lines = (await readFile(eventsPath, "utf8")).trim().split("\n");
    expect(lines).toHaveLength(1);
    const event = JSON.parse(lines[0]) as Record<string, unknown>;
    expect(event).toMatchObject({
      schemaVersion: 1,
      event: "career_path_saved",
      sessionId: "career-session-1",
      occurredAt: "2026-07-09T08:00:00.000Z",
      payload: { pathId: "data-ai" }
    });
    expect(typeof event.eventId).toBe("string");
    expect(typeof event.receivedAt).toBe("string");
    expect(lines[0]).not.toContain("203.0.113.20");
    expect(lines[0]).not.toContain("Ali Rezaei");
    expect(lines[0]).not.toContain("+989123456789");
  });

  it("returns safe errors for malformed, oversized, and unknown events", async () => {
    const malformedResponse = await POST(rawEventRequest("{not-json"));
    const oversizedResponse = await POST(rawEventRequest("{}", { "content-length": String(8 * 1024 + 1) }));
    const unknownResponse = await POST(eventRequest({
      event: "career_unknown",
      sessionId: "career-session-1"
    }));

    expect(malformedResponse.status).toBe(400);
    expect(await malformedResponse.json()).toEqual({ ok: false, error: "invalid_json" });
    expect(oversizedResponse.status).toBe(413);
    expect(await oversizedResponse.json()).toEqual({ ok: false, error: "payload_too_large" });
    expect(unknownResponse.status).toBe(400);
    expect(await unknownResponse.json()).toEqual({ ok: false, error: "invalid_event" });
  });

  it("removes disallowed payload fields and raw search text", () => {
    expect(parseCareerEventPayload({
      event: "career_search_used",
      sessionId: "career-session-1",
      payload: {
        query: "محصول",
        searchText: "محصول",
        fullName: "Ali Rezaei",
        phone: "09123456789",
        queryLength: 5,
        resultCount: 12
      }
    })).toMatchObject({
      event: "career_search_used",
      sessionId: "career-session-1",
      payload: {
        queryLength: 5,
        resultCount: 12
      }
    });
  });

  it("rate limits repeated events by client key", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "useravaa-career-events-rate-"));
    temporaryDirectories.push(directory);
    process.env.USERAVAA_CAREER_EVENTS_PATH = path.join(directory, "career-events.jsonl");

    for (let index = 0; index < 120; index += 1) {
      const response = await POST(eventRequest({
        event: "career_compare_selection_changed",
        sessionId: "career-session-1",
        payload: { selectedCount: index % 5 }
      }, { "x-real-ip": "203.0.113.30" }));
      expect(response.status).toBe(200);
    }

    const rateLimitedResponse = await POST(eventRequest({
      event: "career_compare_selection_changed",
      sessionId: "career-session-1",
      payload: { selectedCount: 2 }
    }, { "x-real-ip": "203.0.113.30" }));

    expect(rateLimitedResponse.status).toBe(429);
    expect(await rateLimitedResponse.json()).toEqual({ ok: false, error: "rate_limited" });
  });

  it("returns a safe 500 when event append fails", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "useravaa-career-events-failure-"));
    temporaryDirectories.push(directory);
    process.env.USERAVAA_CAREER_EVENTS_PATH = directory;
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const response = await POST(eventRequest({
      event: "career_entry",
      sessionId: "career-session-1",
      payload: { source: "root" }
    }));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ ok: false, error: "event_write_failed" });
    expect(consoleError).toHaveBeenCalledWith("career event write failed", expect.any(String));
  });

  it("does not import private systems or persist request-identifying metadata", () => {
    const source = readFileSync("src/app/api/career/events/route.ts", "utf8");

    expect(source).not.toMatch(/prisma|database_url|@\/lib\/backend|@\/lib\/auth|cookies\(|headers\(/i);
    expect(source).not.toMatch(/user-agent|fingerprint/i);
  });
});
