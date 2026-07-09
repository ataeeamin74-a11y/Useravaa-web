import { createHash, randomUUID } from "node:crypto";
import { appendFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import {
  CAREER_STAGE_OPTIONS,
  isValidCareerLeadFullName,
  isValidCareerLeadContact,
  normalizeCareerLeadFullName,
  normalizeIranianMobile,
  type CareerLeadSource,
  type CareerStage
} from "@/features/career/career-lead-capture";

export const runtime = "nodejs";

const DEFAULT_LEADS_PATH = "/var/log/useravaa/career-leads.jsonl";
const MAX_LEAD_REQUEST_BYTES = 12 * 1024;
const TEN_MINUTES_MS = 10 * 60 * 1000;
const ONE_HOUR_MS = 60 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const MAX_LEAD_ATTEMPTS_PER_TEN_MINUTES = 5;
const MAX_LEAD_ATTEMPTS_PER_HOUR = 20;
const ALLOWED_SOURCES = new Set<CareerLeadSource>(["path_save", "comparison_save"]);
const ALLOWED_STAGES = new Set<string>(CAREER_STAGE_OPTIONS);

type RateLimitBucket = {
  tenMinuteAttempts: number[];
  hourlyAttempts: number[];
};

const rateLimitBuckets = new Map<string, RateLimitBucket>();
const dedupeTimestamps = new Map<string, number>();
let lastRateLimitCleanup = 0;
let lastDedupeCleanup = 0;

type StoredCareerLead = Readonly<{
  id: string;
  createdAt: string;
  contact: string;
  contactType?: "phone";
  phone?: string;
  fullName?: string;
  source: CareerLeadSource;
  stage?: CareerStage;
  uncertainty?: string;
  savedPathIds?: readonly string[];
  savedComparisons?: readonly (readonly string[])[];
  currentPathId?: string;
  comparisonPathIds?: readonly string[];
  pathname?: string;
}>;

type ParsedLeadPayload = Readonly<{
  honeypot: boolean;
  lead?: Omit<StoredCareerLead, "id" | "createdAt">;
}>;

function jsonError(error: string, status: number) {
  return Response.json({ ok: false, error }, { status });
}

export function resetCareerLeadApiGuards() {
  rateLimitBuckets.clear();
  dedupeTimestamps.clear();
  lastRateLimitCleanup = 0;
  lastDedupeCleanup = 0;
}

export function getCareerLeadsFilePath(source: NodeJS.ProcessEnv = process.env) {
  return source.USERAVAA_CAREER_LEADS_PATH || DEFAULT_LEADS_PATH;
}

export function isCareerLeadRequestTooLarge(request: Request) {
  const contentLength = request.headers.get("content-length");
  if (!contentLength) return false;

  const parsedLength = Number(contentLength);
  return Number.isFinite(parsedLength) && parsedLength > MAX_LEAD_REQUEST_BYTES;
}

function firstHeaderValue(value: string | null) {
  return value?.split(",")[0]?.trim() || undefined;
}

export function getCareerLeadClientKey(request: Request) {
  return firstHeaderValue(request.headers.get("x-forwarded-for"))
    ?? firstHeaderValue(request.headers.get("x-real-ip"))
    ?? "unknown-client";
}

function pruneRecentAttempts(attempts: readonly number[], now: number, windowMs: number) {
  return attempts.filter((attemptedAt) => now - attemptedAt < windowMs);
}

function cleanupRateLimitBuckets(now: number) {
  if (now - lastRateLimitCleanup < TEN_MINUTES_MS) return;

  for (const [key, bucket] of rateLimitBuckets) {
    bucket.tenMinuteAttempts = pruneRecentAttempts(bucket.tenMinuteAttempts, now, TEN_MINUTES_MS);
    bucket.hourlyAttempts = pruneRecentAttempts(bucket.hourlyAttempts, now, ONE_HOUR_MS);
    if (!bucket.tenMinuteAttempts.length && !bucket.hourlyAttempts.length) {
      rateLimitBuckets.delete(key);
    }
  }
  lastRateLimitCleanup = now;
}

export function allowCareerLeadAttempt(request: Request, now = Date.now()) {
  cleanupRateLimitBuckets(now);

  const key = getCareerLeadClientKey(request);
  const bucket = rateLimitBuckets.get(key) ?? { tenMinuteAttempts: [], hourlyAttempts: [] };
  bucket.tenMinuteAttempts = pruneRecentAttempts(bucket.tenMinuteAttempts, now, TEN_MINUTES_MS);
  bucket.hourlyAttempts = pruneRecentAttempts(bucket.hourlyAttempts, now, ONE_HOUR_MS);

  if (
    bucket.tenMinuteAttempts.length >= MAX_LEAD_ATTEMPTS_PER_TEN_MINUTES
    || bucket.hourlyAttempts.length >= MAX_LEAD_ATTEMPTS_PER_HOUR
  ) {
    rateLimitBuckets.set(key, bucket);
    return false;
  }

  bucket.tenMinuteAttempts.push(now);
  bucket.hourlyAttempts.push(now);
  rateLimitBuckets.set(key, bucket);
  return true;
}

function cleanupDedupeTimestamps(now: number) {
  if (now - lastDedupeCleanup < ONE_HOUR_MS) return;

  for (const [key, receivedAt] of dedupeTimestamps) {
    if (now - receivedAt >= ONE_DAY_MS) dedupeTimestamps.delete(key);
  }
  lastDedupeCleanup = now;
}

export function getCareerLeadDedupeKey(contact: string) {
  return createHash("sha256").update(contact).digest("hex");
}

export function isDuplicateCareerLead(contact: string, now = Date.now()) {
  cleanupDedupeTimestamps(now);
  const receivedAt = dedupeTimestamps.get(getCareerLeadDedupeKey(contact));
  return receivedAt !== undefined && now - receivedAt < ONE_DAY_MS;
}

export function rememberCareerLeadDedupe(contact: string, now = Date.now()) {
  cleanupDedupeTimestamps(now);
  dedupeTimestamps.set(getCareerLeadDedupeKey(contact), now);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sanitizeText(value: string): string {
  return value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
}

function parseOptionalText(
  value: unknown,
  maximumLength: number
): string | undefined | null {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string" || value.length > maximumLength) return null;
  const sanitized = sanitizeText(value);
  return sanitized || undefined;
}

function parseStringList(
  value: unknown,
  maximumItems: number
): readonly string[] | undefined | null {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value) || value.length > maximumItems) return null;

  const values: string[] = [];
  for (const item of value) {
    const parsedItem = parseOptionalText(item, 300);
    if (parsedItem === null || parsedItem === undefined) return null;
    if (!values.includes(parsedItem)) values.push(parsedItem);
  }
  return values;
}

function parseComparisonList(
  value: unknown
): readonly (readonly string[])[] | undefined | null {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value) || value.length > 50) return null;

  const comparisons: string[][] = [];
  for (const comparison of value) {
    const parsedComparison = parseStringList(comparison, 5);
    if (!parsedComparison || parsedComparison.length < 2) return null;
    comparisons.push([...parsedComparison]);
  }
  return comparisons;
}

export function parseCareerLeadPayload(value: unknown): ParsedLeadPayload | undefined {
  if (!isRecord(value)) return undefined;

  const companyWebsite = parseOptionalText(value.companyWebsite, 300);
  if (companyWebsite === null) return undefined;
  if (companyWebsite) return { honeypot: true };

  if (typeof value.contact !== "string" || typeof value.source !== "string") return undefined;
  const normalizedContact = normalizeIranianMobile(sanitizeText(value.contact));
  if (!normalizedContact || !isValidCareerLeadContact(normalizedContact) || !ALLOWED_SOURCES.has(value.source as CareerLeadSource)) {
    return undefined;
  }

  const phone = parseOptionalText(value.phone, 30);
  const normalizedPhone = phone ? normalizeIranianMobile(phone) : undefined;
  const contactType = parseOptionalText(value.contactType, 20);
  const fullName = parseOptionalText(value.fullName, 120);
  const stage = parseOptionalText(value.stage, 100);
  const uncertainty = parseOptionalText(value.uncertainty, 1000);
  const currentPathId = parseOptionalText(value.currentPathId, 300);
  const pathname = parseOptionalText(value.pathname, 500);
  const savedPathIds = parseStringList(value.savedPathIds, 100);
  const comparisonPathIds = parseStringList(value.comparisonPathIds, 5);
  const savedComparisons = parseComparisonList(value.savedComparisons);

  if (
    phone === null
    || contactType === null
    || fullName === null
    || stage === null
    || uncertainty === null
    || currentPathId === null
    || pathname === null
    || savedPathIds === null
    || comparisonPathIds === null
    || savedComparisons === null
    || (phone !== undefined && normalizedPhone !== normalizedContact)
    || (contactType !== undefined && contactType !== "phone")
    || (fullName !== undefined && !isValidCareerLeadFullName(fullName))
    || (stage !== undefined && !ALLOWED_STAGES.has(stage))
  ) {
    return undefined;
  }
  const normalizedFullName = fullName ? normalizeCareerLeadFullName(fullName) : undefined;

  return {
    honeypot: false,
    lead: {
      contact: normalizedContact,
      ...(contactType ? { contactType: "phone" as const } : {}),
      ...(normalizedPhone ? { phone: normalizedPhone } : {}),
      ...(normalizedFullName ? { fullName: normalizedFullName } : {}),
      source: value.source as CareerLeadSource,
      ...(stage ? { stage: stage as CareerStage } : {}),
      ...(uncertainty ? { uncertainty } : {}),
      ...(savedPathIds ? { savedPathIds } : {}),
      ...(savedComparisons ? { savedComparisons } : {}),
      ...(currentPathId ? { currentPathId } : {}),
      ...(comparisonPathIds ? { comparisonPathIds } : {}),
      ...(pathname ? { pathname } : {})
    }
  };
}

export async function appendCareerLead(
  lead: StoredCareerLead,
  filePath = getCareerLeadsFilePath()
) {
  await mkdir(dirname(filePath), { recursive: true });
  await appendFile(filePath, `${JSON.stringify(lead)}\n`, "utf8");
}

export async function POST(request: Request) {
  if (isCareerLeadRequestTooLarge(request)) {
    return jsonError("payload_too_large", 413);
  }

  const now = Date.now();
  if (!allowCareerLeadAttempt(request, now)) {
    return jsonError("rate_limited", 429);
  }

  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return Response.json({ ok: false }, { status: 400 });
  }

  let value: unknown;
  try {
    value = await request.json();
  } catch {
    return jsonError("invalid_json", 400);
  }

  const payload = parseCareerLeadPayload(value);
  if (!payload) return Response.json({ ok: false }, { status: 400 });
  if (payload.honeypot) return Response.json({ ok: true });

  if (isDuplicateCareerLead(payload.lead!.contact, now)) {
    return Response.json({ ok: true, deduped: true });
  }

  const lead: StoredCareerLead = {
    id: randomUUID(),
    createdAt: new Date(now).toISOString(),
    ...payload.lead!
  };

  try {
    await appendCareerLead(lead);
    rememberCareerLeadDedupe(lead.contact, now);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("career lead write failed", error instanceof Error ? error.message : "unknown error");
    return jsonError("lead_write_failed", 500);
  }
}
