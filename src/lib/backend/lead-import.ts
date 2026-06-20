import { adminLeadCreateSchema } from "./validation";

export const LEAD_IMPORT_TEMPLATE_HEADERS = [
  "firstName",
  "lastName",
  "phone",
  "email",
  "lastCompany",
  "jobTitle",
  "jobCategory",
  "yearsOfExperience",
  "leadType",
  "temperature",
  "source",
  "tags",
  "notes",
  "nextFollowUpAt",
  "owner"
] as const;

export type LeadImportTemplateHeader = (typeof LEAD_IMPORT_TEMPLATE_HEADERS)[number];

export type ParsedLeadImportRow = {
  rowNumber: number;
  payload: ReturnType<typeof adminLeadCreateSchema.parse>;
  normalizedEmail: string | null;
  normalizedPhone: string | null;
};

export type LeadImportRowError = {
  rowNumber: number;
  reason: string;
};

export type ParsedLeadImportCsv = {
  totalRows: number;
  rows: ParsedLeadImportRow[];
  invalidRows: number;
  errorsPreview: LeadImportRowError[];
};

const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
const arabicDigits = "٠١٢٣٤٥٦٧٨٩";

function normalizeDigits(value: string) {
  return value.replace(/[۰-۹٠-٩]/g, (digit) => {
    const persianIndex = persianDigits.indexOf(digit);
    if (persianIndex >= 0) {
      return String(persianIndex);
    }

    const arabicIndex = arabicDigits.indexOf(digit);
    return arabicIndex >= 0 ? String(arabicIndex) : digit;
  });
}

export function normalizeLeadEmail(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase() ?? "";
  return normalized || null;
}

export function normalizeLeadPhone(value: string | null | undefined) {
  const normalized = normalizeDigits(value ?? "")
    .trim()
    .replace(/[^\d+]/g, "");
  return normalized || null;
}

export function normalizeLeadTag(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("fa-IR");
}

export function normalizeLeadTags(values: readonly string[]) {
  const seen = new Set<string>();
  const tags: string[] = [];

  values.forEach((value) => {
    const normalized = normalizeLeadTag(value);

    if (!normalized || seen.has(normalized)) {
      return;
    }

    seen.add(normalized);
    tags.push(value.trim().replace(/\s+/g, " "));
  });

  return tags;
}

export function buildLeadImportTemplateCsv() {
  return `${LEAD_IMPORT_TEMPLATE_HEADERS.join(",")}\n`;
}

function parseCsvLine(line: string) {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current);
  return cells.map((cell) => cell.trim());
}

function parseCsvRows(csvText: string) {
  return csvText
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .map(parseCsvLine);
}

function rowObject(cells: string[]) {
  return LEAD_IMPORT_TEMPLATE_HEADERS.reduce<Record<LeadImportTemplateHeader, string>>((record, header, index) => {
    record[header] = cells[index] ?? "";
    return record;
  }, {} as Record<LeadImportTemplateHeader, string>);
}

function optional(value: string) {
  const trimmed = value.trim();
  return trimmed || undefined;
}

function csvRowToPayload(row: Record<LeadImportTemplateHeader, string>) {
  const years = optional(row.yearsOfExperience);
  const tags = normalizeLeadTags(row.tags.split(";"));

  return {
    firstName: row.firstName,
    lastName: row.lastName,
    phone: optional(row.phone),
    email: optional(row.email),
    lastCompany: optional(row.lastCompany),
    jobTitle: optional(row.jobTitle),
    jobCategory: optional(row.jobCategory),
    yearsOfExperience: years ? Number(years) : undefined,
    leadType: optional(row.leadType) ?? undefined,
    temperature: optional(row.temperature) ?? undefined,
    source: optional(row.source) ?? "MANUAL_IMPORT",
    tags: tags.length ? tags : undefined,
    notes: optional(row.notes),
    nextFollowUpAt: optional(row.nextFollowUpAt),
    ownerAdminId: optional(row.owner)
  };
}

export function parseLeadImportCsv(csvText: string, maxRows = 10_000): ParsedLeadImportCsv {
  const rows = parseCsvRows(csvText);
  const header = rows[0] ?? [];
  const errorsPreview: LeadImportRowError[] = [];
  const parsedRows: ParsedLeadImportRow[] = [];

  if (header.join(",") !== LEAD_IMPORT_TEMPLATE_HEADERS.join(",")) {
    return {
      totalRows: Math.max(0, rows.length - 1),
      rows: [],
      invalidRows: Math.max(1, rows.length - 1),
      errorsPreview: [{ rowNumber: 1, reason: "csv_headers_do_not_match_template" }]
    };
  }

  const dataRows = rows.slice(1);

  if (dataRows.length > maxRows) {
    return {
      totalRows: dataRows.length,
      rows: [],
      invalidRows: dataRows.length,
      errorsPreview: [{ rowNumber: maxRows + 1, reason: "csv_row_limit_exceeded" }]
    };
  }

  dataRows.forEach((cells, index) => {
    const rowNumber = index + 2;

    if (cells.length !== LEAD_IMPORT_TEMPLATE_HEADERS.length) {
      errorsPreview.push({ rowNumber, reason: "csv_column_count_mismatch" });
      return;
    }

    const payload = csvRowToPayload(rowObject(cells));
    const result = adminLeadCreateSchema.safeParse(payload);

    if (!result.success) {
      errorsPreview.push({ rowNumber, reason: "row_validation_failed" });
      return;
    }

    parsedRows.push({
      rowNumber,
      payload: result.data,
      normalizedEmail: normalizeLeadEmail(result.data.email),
      normalizedPhone: normalizeLeadPhone(result.data.phone)
    });
  });

  return {
    totalRows: dataRows.length,
    rows: parsedRows,
    invalidRows: dataRows.length - parsedRows.length,
    errorsPreview: errorsPreview.slice(0, 20)
  };
}
