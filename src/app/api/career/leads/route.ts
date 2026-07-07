import { randomUUID } from "node:crypto";
import { appendFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import {
  CAREER_STAGE_OPTIONS,
  isValidCareerLeadContact,
  type CareerLeadSource,
  type CareerStage
} from "@/features/career/career-lead-capture";

export const runtime = "nodejs";

const DEFAULT_LEADS_PATH = "/var/log/useravaa/career-leads.jsonl";
const ALLOWED_SOURCES = new Set<CareerLeadSource>(["path_save", "comparison_save"]);
const ALLOWED_STAGES = new Set<string>(CAREER_STAGE_OPTIONS);

type StoredCareerLead = Readonly<{
  id: string;
  createdAt: string;
  contact: string;
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
  const contact = sanitizeText(value.contact);
  if (!isValidCareerLeadContact(contact) || !ALLOWED_SOURCES.has(value.source as CareerLeadSource)) {
    return undefined;
  }

  const stage = parseOptionalText(value.stage, 100);
  const uncertainty = parseOptionalText(value.uncertainty, 1000);
  const currentPathId = parseOptionalText(value.currentPathId, 300);
  const pathname = parseOptionalText(value.pathname, 500);
  const savedPathIds = parseStringList(value.savedPathIds, 100);
  const comparisonPathIds = parseStringList(value.comparisonPathIds, 5);
  const savedComparisons = parseComparisonList(value.savedComparisons);

  if (
    stage === null
    || uncertainty === null
    || currentPathId === null
    || pathname === null
    || savedPathIds === null
    || comparisonPathIds === null
    || savedComparisons === null
    || (stage !== undefined && !ALLOWED_STAGES.has(stage))
  ) {
    return undefined;
  }

  return {
    honeypot: false,
    lead: {
      contact,
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
  filePath = process.env.USERAVAA_CAREER_LEADS_PATH || DEFAULT_LEADS_PATH
) {
  await mkdir(dirname(filePath), { recursive: true });
  await appendFile(filePath, `${JSON.stringify(lead)}\n`, "utf8");
}

export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return Response.json({ ok: false }, { status: 400 });
  }

  let value: unknown;
  try {
    value = await request.json();
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }

  const payload = parseCareerLeadPayload(value);
  if (!payload) return Response.json({ ok: false }, { status: 400 });
  if (payload.honeypot) return Response.json({ ok: true });

  const lead: StoredCareerLead = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    ...payload.lead!
  };

  try {
    await appendCareerLead(lead);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
