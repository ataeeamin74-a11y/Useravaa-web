import { randomUUID } from "node:crypto";
import { appendFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import {
  isCareerEventName,
  sanitizeCareerEventPayload,
  type CareerEventName,
  type SanitizedCareerEventPayload
} from "@/features/career/career-events";

export const runtime = "nodejs";

const DEFAULT_EVENTS_PATH = "/var/log/useravaa/career-events.jsonl";
const MAX_EVENT_REQUEST_BYTES = 8 * 1024;
const TEN_MINUTES_MS = 10 * 60 * 1000;
const ONE_HOUR_MS = 60 * 60 * 1000;
const MAX_EVENT_ATTEMPTS_PER_TEN_MINUTES = 120;
const MAX_EVENT_ATTEMPTS_PER_HOUR = 500;
const SCHEMA_VERSION = 1;

type RateLimitBucket = {
  tenMinuteAttempts: number[];
  hourlyAttempts: number[];
};

type StoredCareerEvent = Readonly<{
  eventId: string;
  schemaVersion: number;
  event: CareerEventName;
  sessionId: string;
  receivedAt: string;
  occurredAt?: string;
  payload: SanitizedCareerEventPayload;
}>;

type ParsedCareerEvent = Readonly<{
  event: CareerEventName;
  sessionId: string;
  occurredAt?: string;
  payload: SanitizedCareerEventPayload;
}>;

const rateLimitBuckets = new Map<string, RateLimitBucket>();
let lastRateLimitCleanup = 0;

function jsonError(error: string, status: number) {
  return Response.json({ ok: false, error }, { status });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function firstHeaderValue(value: string | null) {
  return value?.split(",")[0]?.trim() || undefined;
}

function sanitizeSessionId(value: unknown) {
  if (typeof value !== "string") return undefined;
  const sanitized = value.replace(/[\u0000-\u001f\u007f]/g, "").trim();
  return sanitized && sanitized.length <= 160 && /^[\p{L}\p{N}._:-]+$/u.test(sanitized)
    ? sanitized
    : undefined;
}

function sanitizeIsoTimestamp(value: unknown) {
  if (typeof value !== "string" || value.length > 40) return undefined;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : undefined;
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

export function resetCareerEventApiGuards() {
  rateLimitBuckets.clear();
  lastRateLimitCleanup = 0;
}

export function getCareerEventsFilePath(source: NodeJS.ProcessEnv = process.env) {
  return source.USERAVAA_CAREER_EVENTS_PATH || DEFAULT_EVENTS_PATH;
}

export function isCareerEventRequestTooLarge(request: Request) {
  const contentLength = request.headers.get("content-length");
  if (!contentLength) return false;

  const parsedLength = Number(contentLength);
  return Number.isFinite(parsedLength) && parsedLength > MAX_EVENT_REQUEST_BYTES;
}

export function getCareerEventClientKey(request: Request) {
  return firstHeaderValue(request.headers.get("x-forwarded-for"))
    ?? firstHeaderValue(request.headers.get("x-real-ip"))
    ?? "unknown-client";
}

export function allowCareerEventAttempt(request: Request, now = Date.now()) {
  cleanupRateLimitBuckets(now);

  const key = getCareerEventClientKey(request);
  const bucket = rateLimitBuckets.get(key) ?? { tenMinuteAttempts: [], hourlyAttempts: [] };
  bucket.tenMinuteAttempts = pruneRecentAttempts(bucket.tenMinuteAttempts, now, TEN_MINUTES_MS);
  bucket.hourlyAttempts = pruneRecentAttempts(bucket.hourlyAttempts, now, ONE_HOUR_MS);

  if (
    bucket.tenMinuteAttempts.length >= MAX_EVENT_ATTEMPTS_PER_TEN_MINUTES
    || bucket.hourlyAttempts.length >= MAX_EVENT_ATTEMPTS_PER_HOUR
  ) {
    rateLimitBuckets.set(key, bucket);
    return false;
  }

  bucket.tenMinuteAttempts.push(now);
  bucket.hourlyAttempts.push(now);
  rateLimitBuckets.set(key, bucket);
  return true;
}

export function parseCareerEventPayload(value: unknown): ParsedCareerEvent | undefined {
  if (!isRecord(value) || !isCareerEventName(value.event)) return undefined;

  const sessionId = sanitizeSessionId(value.sessionId);
  if (!sessionId) return undefined;

  const eventPayload = isRecord(value.payload) ? value.payload : {};

  return {
    event: value.event,
    sessionId,
    payload: sanitizeCareerEventPayload(value.event, eventPayload),
    ...(value.occurredAt ? { occurredAt: sanitizeIsoTimestamp(value.occurredAt) } : {})
  };
}

export async function appendCareerEvent(
  event: StoredCareerEvent,
  filePath = getCareerEventsFilePath()
) {
  await mkdir(dirname(filePath), { recursive: true });
  await appendFile(filePath, `${JSON.stringify(event)}\n`, "utf8");
}

export async function POST(request: Request) {
  if (isCareerEventRequestTooLarge(request)) {
    return jsonError("payload_too_large", 413);
  }

  const now = Date.now();
  if (!allowCareerEventAttempt(request, now)) {
    return jsonError("rate_limited", 429);
  }

  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return jsonError("invalid_event", 400);
  }

  let value: unknown;
  try {
    value = await request.json();
  } catch {
    return jsonError("invalid_json", 400);
  }

  const payload = parseCareerEventPayload(value);
  if (!payload) return jsonError("invalid_event", 400);

  const event: StoredCareerEvent = {
    eventId: randomUUID(),
    schemaVersion: SCHEMA_VERSION,
    event: payload.event,
    sessionId: payload.sessionId,
    receivedAt: new Date(now).toISOString(),
    ...(payload.occurredAt ? { occurredAt: payload.occurredAt } : {}),
    payload: payload.payload
  };

  try {
    await appendCareerEvent(event);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("career event write failed", error instanceof Error ? error.message : "unknown error");
    return jsonError("event_write_failed", 500);
  }
}
