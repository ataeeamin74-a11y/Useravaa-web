import { readFileSync } from "node:fs";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { POST, parseCareerLeadPayload } from "@/app/api/career/leads/route";

const originalLeadPath = process.env.USERAVAA_CAREER_LEADS_PATH;
const temporaryDirectories: string[] = [];

afterEach(async () => {
  if (originalLeadPath === undefined) delete process.env.USERAVAA_CAREER_LEADS_PATH;
  else process.env.USERAVAA_CAREER_LEADS_PATH = originalLeadPath;
  await Promise.all(temporaryDirectories.splice(0).map((directory) => (
    rm(directory, { recursive: true, force: true })
  )));
});

function leadRequest(body: unknown) {
  return new Request("http://localhost/api/career/leads", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
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
      contact: "۹۱۲۳۴۵۶۷۸۹",
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
      contact: "+989123456789",
      fullName: "Sara Rezaei",
      source: "comparison_save"
    });
    expect(leads.every((lead) => typeof lead.id === "string" && typeof lead.createdAt === "string")).toBe(true);
    expect(leads.every((lead) => !("ip" in lead) && !("cookies" in lead) && !("fingerprint" in lead))).toBe(true);
  });

  it("rejects invalid contacts and sources with 400", async () => {
    expect((await POST(leadRequest({ contact: "invalid", source: "path_save" }))).status).toBe(400);
    expect((await POST(leadRequest({ contact: "path@example.com", source: "path_save" }))).status).toBe(400);
    expect((await POST(leadRequest({ contact: "09123456789", source: "invalid" }))).status).toBe(400);
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
