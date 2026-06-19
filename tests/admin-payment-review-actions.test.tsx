import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = process.cwd();

function readProjectFile(relativePath: string) {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

describe("Checkpoint 3A-3 admin payment review actions", () => {
  it("keeps the payment detail action UI bound to the existing admin payment APIs", () => {
    const source = readProjectFile("src/features/v51/admin/AdminPaymentReviewActions.tsx");

    expect(source).toContain("\"use client\"");
    expect(source).toContain("useRouter");
    expect(source).toContain("fetch(`/api/admin/payments/${encodeURIComponent(paymentId)}/${action}`");
    expect(source).toContain("method: \"POST\"");
    expect(source).toContain("if (!response.ok)");
    expect(source).toContain("rejectionReason");
    expect(source).toContain("disabled={isSubmitting || !trimmedReason}");
    expect(source).toContain("setState(\"success\")");
    expect(source).toContain("router.refresh()");
  });

  it("renders payment audit history from the detail surface without hard-coded fixture events", () => {
    const surfaceSource = readProjectFile("src/features/v51/admin/AdminSurfaces.tsx");
    const routeDataSource = readProjectFile("src/features/v51/admin/server-data.ts");

    expect(surfaceSource).toContain("AdminPaymentReviewActions");
    expect(surfaceSource).toContain("item.auditItems");
    expect(routeDataSource).toContain("getPaymentAuditLog");
    expect(routeDataSource).toContain("PAYMENT_MANUAL_APPROVED");
    expect(routeDataSource).toContain("PAYMENT_MANUAL_REJECTED");
    expect(routeDataSource).not.toContain("receiptUrl");
  });

  it("persists only minimal audit fields for payment review events", () => {
    const schemaSource = readProjectFile("prisma/schema.prisma");
    const migrationSource = readProjectFile("prisma/migrations/20260613163000_admin_audit_events/migration.sql");
    const repositorySource = readProjectFile("src/lib/backend/repositories/admin-audit.ts");
    const serviceSource = readProjectFile("src/lib/backend/services.ts");

    expect(schemaSource).toContain("model AdminAuditEvent");
    expect(migrationSource).toContain("CREATE TABLE \"AdminAuditEvent\"");
    expect(repositorySource).toContain("PAYMENT_MANUAL_APPROVED");
    expect(repositorySource).toContain("PAYMENT_MANUAL_REJECTED");
    expect(serviceSource).toContain("createPaymentReviewEvent");

    for (const forbidden of ["receiptUrl", "codeHash", "codeSalt", "requesterCodeCiphertext", "DATABASE_URL"]) {
      expect(repositorySource.includes(forbidden), `admin-audit repository contains ${forbidden}`).toBe(false);
    }
  });
});
