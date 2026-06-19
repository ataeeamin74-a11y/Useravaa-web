import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = process.cwd();

function readProjectFile(relativePath: string) {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

describe("Checkpoint 3A-4 admin cancellation support review actions", () => {
  it("keeps cancellation support-review API routes admin guarded, service-bound, and fixture-free", () => {
    [
      "src/app/api/admin/cancellations/[cancellationId]/approve-credit/route.ts",
      "src/app/api/admin/cancellations/[cancellationId]/reject-credit/route.ts"
    ].forEach((relativePath) => {
      const source = readProjectFile(relativePath);

      expect(source).toContain("requireAdminViewer");
      expect(source).toContain("parseJsonBody");
      expect(source).toContain("adminCancellationService");
      expect(source).toContain("serviceResultToResponse(await");
      expect(source).not.toContain("@/features/v51/data");
      expect(source).not.toContain("getConversationOrFallback");
    });
  });

  it("binds the admin detail action UI to approve/reject credit APIs without optimistic success", () => {
    const actionSource = readProjectFile("src/features/v51/admin/AdminCancellationReviewActions.tsx");
    const surfaceSource = readProjectFile("src/features/v51/admin/AdminSurfaces.tsx");
    const routeDataSource = readProjectFile("src/features/v51/admin/server-data.ts");

    expect(actionSource).toContain("\"use client\"");
    expect(actionSource).toContain("approve-credit");
    expect(actionSource).toContain("reject-credit");
    expect(actionSource).toContain("if (!response.ok)");
    expect(actionSource).toContain("setState(\"success\")");
    expect(actionSource).toContain("router.refresh()");
    expect(actionSource).toContain("validCreditAmount");
    expect(actionSource).toContain("!trimmedReason");
    expect(surfaceSource).toContain("AdminCancellationReviewActions");
    expect(surfaceSource).toContain("item.auditItems");
    expect(routeDataSource).toContain("getCancellationAuditLog");
  });

  it("keeps audit labels and copy inside the allowed support-review scope", () => {
    const files = [
      "src/features/v51/admin/AdminCancellationReviewActions.tsx",
      "src/features/v51/admin/AdminSurfaces.tsx",
      "src/features/v51/admin/server-data.ts",
      "src/lib/backend/repositories/admin-audit.ts",
      "src/lib/backend/services.ts"
    ];
    const combined = files.map(readProjectFile).join("\n");

    expect(combined).toContain("CANCELLATION_SUPPORT_CREDIT_APPROVED");
    expect(combined).toContain("CANCELLATION_SUPPORT_CREDIT_REJECTED");

    expect(combined.toLowerCase()).not.toMatch(/\b(penalty|fine|punishment)\b/);

    for (const forbidden of [
      "آزادسازی پول",
      "جریمه",
      "پنالتی",
      "DATABASE_URL"
    ]) {
      expect(combined.includes(forbidden), `support-review source contains ${forbidden}`).toBe(false);
    }

    const adminSurfaceSource = [
      "src/features/v51/admin/AdminCancellationReviewActions.tsx",
      "src/features/v51/admin/AdminSurfaces.tsx",
      "src/features/v51/admin/server-data.ts",
      "src/lib/backend/repositories/admin-audit.ts",
      "src/lib/backend/repositories/cancellation.ts"
    ].map(readProjectFile).join("\n");

    for (const forbidden of ["codeHash", "codeSalt", "requesterCodeCiphertext"]) {
      expect(adminSurfaceSource.includes(forbidden), `admin cancellation source contains ${forbidden}`).toBe(false);
    }
  });
});
