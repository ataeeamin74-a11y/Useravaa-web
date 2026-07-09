import { readFileSync } from "node:fs";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { POST, parseCareerLeadPayload, resetCareerLeadApiGuards } from "@/app/api/career/leads/route";

const originalLeadPath = process.env.USERAVAA_CAREER_LEADS_PATH;
const temporaryDirectories: string[] = [];

afterEach(async () => {
  vi.restoreAllMocks();
  resetCareerLeadApiGuards();
  if (originalLeadPath === undefined) delete process.env.USERAVAA_CAREER_LEADS_PATH;
  else process.env.USERAVAA_CAREER_LEADS_PATH = originalLeadPath;
  await Promise.all(temporaryDirectories.splice(0).map((directory) => (
    rm(directory, { recursive: true, force: true })
  )));
});

function leadRequest(body: unknown, headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/career/leads", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body)
  });
}

function rawLeadRequest(body: string, headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/career/leads", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body
  });
}

describe("POST /api/career/leads", () => {
  it("validates and sanitizes supported lead payloads", () => {
    expect(parseCareerLeadPayload({
      contact: " 09123456789 ",
      contactType: "phone",
      phone: "9123456789",
      fullName: "  علی   رضایی ",
      source: "path_save"
    })).toMatchObject({
      honeypot: false,
      lead: {
        contact: "+989123456789",
        contactType: "phone",
        phone: "+989123456789",
        fullName: "علی رضایی",
        source: "path_save"
      }
    });
    expect(parseCareerLeadPayload({ contact: "۹۱۲۳۴۵۶۷۸۹", source: "comparison_save" })).toBeDefined();
    expect(parseCareerLeadPayload({ contact: "path@example.com", source: "path_save" })).toBeUndefined();
    expect(parseCareerLeadPayload({ contact: "invalid", source: "path_save" })).toBeUndefined();
    expect(parseCareerLeadPayload({ contact: "09123456789", source: "unknown" })).toBeUndefined();
    expect(parseCareerLeadPayload({
      contact: "09123456789",
      phone: "09111111111",
      source: "path_save"
    })).toBeUndefined();
    expect(parseCareerLeadPayload({
      contact: "09123456789",
      fullName: "علی",
      source: "path_save"
    })).toBeUndefined();
  });

  it("appends valid phone leads as one JSON object per line", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "useravaa-career-leads-"));
    temporaryDirectories.push(directory);
    const leadPath = path.join(directory, "nested", "career-leads.jsonl");
    process.env.USERAVAA_CAREER_LEADS_PATH = leadPath;

    const firstResponse = await POST(leadRequest({
      contact: "09123456789",
      contactType: "phone",
      phone: "09123456789",
      fullName: "علی رضایی",
      source: "path_save",
      currentPathId: "path-1",
      savedPathIds: ["path-1"],
      pathname: "/career"
    }));
    const secondResponse = await POST(leadRequest({
      contact: "09123456780",
      fullName: "Sara Rezaei",
      source: "comparison_save",
      comparisonPathIds: ["path-1", "path-2"],
      savedComparisons: [["path-1", "path-2"]]
    }));

    expect(firstResponse.status).toBe(200);
    expect(secondResponse.status).toBe(200);
    const lines = (await readFile(leadPath, "utf8")).trim().split("\n");
    expect(lines).toHaveLength(2);
    const leads = lines.map((line) => JSON.parse(line) as Record<string, unknown>);
    expect(leads[0]).toMatchObject({
      contact: "+989123456789",
      contactType: "phone",
      phone: "+989123456789",
      fullName: "علی رضایی",
      source: "path_save"
    });
    expect(leads[1]).toMatchObject({
      contact: "+989123456780",
      fullName: "Sara Rezaei",
      source: "comparison_save"
    });
    expect(leads.every((lead) => typeof lead.id === "string" && typeof lead.createdAt === "string")).toBe(true);
    expect(leads.every((lead) => !("ip" in lead) && !("cookies" in lead) && !("fingerprint" in lead))).toBe(true);
  });

  it("rejects oversized requests before parsing JSON", async () => {
    const response = await POST(rawLeadRequest("{}", { "content-length": String(12 * 1024 + 1) }));

    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({ ok: false, error: "payload_too_large" });
  });

  it("returns a safe error for malformed JSON", async () => {
    const response = await POST(rawLeadRequest("{not-json"));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ ok: false, error: "invalid_json" });
  });

  it("rate limits repeated lead attempts by client key", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "useravaa-career-rate-limit-"));
    temporaryDirectories.push(directory);
    process.env.USERAVAA_CAREER_LEADS_PATH = path.join(directory, "career-leads.jsonl");

    for (let index = 0; index < 5; index += 1) {
      const response = await POST(leadRequest({
        contact: `0912345678${index}`,
        fullName: "Test User",
        source: "path_save"
      }, { "x-forwarded-for": "203.0.113.10, 198.51.100.1" }));
      expect(response.status).toBe(200);
    }

    const rateLimitedResponse = await POST(leadRequest({
      contact: "09123456785",
      fullName: "Test User",
      source: "path_save"
    }, { "x-forwarded-for": "203.0.113.10" }));

    expect(rateLimitedResponse.status).toBe(429);
    expect(await rateLimitedResponse.json()).toEqual({ ok: false, error: "rate_limited" });
  });

  it("dedupes the same normalized phone within the dedupe window without appending again", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "useravaa-career-dedupe-"));
    temporaryDirectories.push(directory);
    const leadPath = path.join(directory, "career-leads.jsonl");
    process.env.USERAVAA_CAREER_LEADS_PATH = leadPath;

    const firstResponse = await POST(leadRequest({
      contact: "09123456789",
      fullName: "علی رضایی",
      source: "path_save"
    }));
    const duplicateResponse = await POST(leadRequest({
      contact: "+989123456789",
      fullName: "Sara Rezaei",
      source: "comparison_save"
    }));

    expect(firstResponse.status).toBe(200);
    expect(duplicateResponse.status).toBe(200);
    expect(await duplicateResponse.json()).toEqual({ ok: true, deduped: true });
    const lines = (await readFile(leadPath, "utf8")).trim().split("\n");
    expect(lines).toHaveLength(1);
    expect(JSON.parse(lines[0])).toMatchObject({
      contact: "+989123456789",
      fullName: "علی رضایی",
      source: "path_save"
    });
  });

  it("returns a safe 500 when appending the JSONL row fails", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "useravaa-career-write-failure-"));
    temporaryDirectories.push(directory);
    process.env.USERAVAA_CAREER_LEADS_PATH = directory;
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const response = await POST(leadRequest({
      contact: "09123456789",
      fullName: "علی رضایی",
      source: "path_save"
    }));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ ok: false, error: "lead_write_failed" });
    expect(consoleError).toHaveBeenCalledWith("career lead write failed", expect.any(String));
  });

  it("rejects invalid contacts and sources with 400", async () => {
    expect((await POST(leadRequest({ contact: "invalid", source: "path_save" }))).status).toBe(400);
    expect((await POST(leadRequest({ contact: "path@example.com", source: "path_save" }))).status).toBe(400);
    expect((await POST(leadRequest({ contact: "09123456789", source: "invalid" }))).status).toBe(400);
  });

  it("rejects invalid full names with 400", async () => {
    const response = await POST(leadRequest({
      contact: "09123456789",
      fullName: "علی",
      source: "path_save"
    }));

    expect(response.status).toBe(400);
  });

  it("silently accepts honeypot submissions without writing", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "useravaa-career-honeypot-"));
    temporaryDirectories.push(directory);
    const leadPath = path.join(directory, "career-leads.jsonl");
    process.env.USERAVAA_CAREER_LEADS_PATH = leadPath;

    const response = await POST(leadRequest({ companyWebsite: "https://spam.example" }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    await expect(readFile(leadPath, "utf8")).rejects.toThrow();
  });

  it("does not import private systems or collect request-identifying metadata", () => {
    const source = readFileSync("src/app/api/career/leads/route.ts", "utf8");

    expect(source).not.toMatch(/prisma|database_url|@\/lib\/backend|@\/lib\/auth|cookies\(|headers\(/i);
    expect(source).not.toMatch(/user-agent|fingerprint|raw.?ip/i);
  });
});
