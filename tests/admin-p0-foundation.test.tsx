import fs from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AdminShell } from "@/features/v51/admin/AdminShell";
import { AdminHome } from "@/features/v51/admin/AdminSurfaces";
import { buildAdminHomeData, getBrokenAdminCtaHrefs } from "@/features/v51/admin/data";
import { adminImplementedHrefs, adminNavigationGroups, adminRoutePatterns } from "@/features/v51/admin/navigation";
import { canAccessAdmin, getProtectedRouteAccess } from "@/features/v51/permissions";
import type { Viewer } from "@/lib/auth/types";

const admin: Viewer = {
  id: "admin-support",
  role: "ADMIN",
  displayName: "پشتیبانی"
};

const support: Viewer = {
  id: "support-operator",
  role: "SUPPORT",
  displayName: "پشتیبانی"
};

const requester: Viewer = {
  id: "user-requester",
  role: "USER",
  displayName: "علی"
};

const provider: Viewer = {
  id: "provider-reza",
  role: "USER",
  displayName: "رضا"
};

function projectFile(relativePath: string) {
  return path.join(process.cwd(), relativePath);
}

function readProjectFile(relativePath: string) {
  return fs.readFileSync(projectFile(relativePath), "utf8");
}

function routePatternToFile(routePattern: string) {
  const withoutSlash = routePattern.replace(/^\//, "");

  if (routePattern === "/admin") {
    return projectFile("src/app/admin/page.tsx");
  }

  return projectFile(path.join("src/app", withoutSlash, "page.tsx"));
}

function adminSourceFiles() {
  const roots = [projectFile("src/app/admin"), projectFile("src/features/v51/admin")];
  const files: string[] = [];

  function visit(current: string) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const next = path.join(current, entry.name);

      if (entry.isDirectory()) {
        visit(next);
      } else if (/\.(ts|tsx)$/.test(entry.name)) {
        files.push(next);
      }
    }
  }

  roots.forEach(visit);
  return files;
}

function adminApiRouteFiles() {
  const root = projectFile("src/app/api/admin");
  const files: string[] = [];

  function visit(current: string) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const next = path.join(current, entry.name);

      if (entry.isDirectory()) {
        visit(next);
      } else if (entry.name === "route.ts") {
        files.push(next);
      }
    }
  }

  visit(root);
  return files;
}

describe("Checkpoint 3A-1 admin P0 foundation", () => {
  it("renders the admin shell and grouped sidebar navigation", () => {
    const html = renderToStaticMarkup(
      <AdminShell viewer={admin}>
        <div>صف اقدام</div>
      </AdminShell>
    );

    expect(html).toContain("مرکز عملیات یوزراوا");
    expect(html).toContain("صف اقدام");
    expect(html).toContain("پرداخت‌ها");
    expect(html).toContain("گفت‌وگوها");
    expect(html).toContain("لغوها");
    expect(html).toContain("کاربران");
    expect(html).toContain("پروفایل‌های تجربه‌آفرین");
    expect(html).toContain("دفتر تراکنش کیف پول");
    expect(html).toContain("گزارش ممیزی");
    expect(adminNavigationGroups.length).toBeGreaterThan(4);
  });

  it("keeps every sidebar href backed by an App Router page", () => {
    adminImplementedHrefs.forEach((href) => {
      expect(fs.existsSync(routePatternToFile(href)), href).toBe(true);
    });
  });

  it("creates the full P0 admin route skeleton map", () => {
    adminRoutePatterns.forEach((routePattern) => {
      expect(fs.existsSync(routePatternToFile(routePattern)), routePattern).toBe(true);
    });
  });

  it("protects /admin for unauthenticated, requester, provider, admin, and support viewers", () => {
    expect(getProtectedRouteAccess("/admin", null)).toMatchObject({ status: "redirect_login" });
    expect(getProtectedRouteAccess("/admin", requester)).toMatchObject({ status: "unauthorized" });
    expect(getProtectedRouteAccess("/admin/payments", provider)).toMatchObject({ status: "unauthorized" });
    expect(getProtectedRouteAccess("/admin", admin).status).toBe("allowed");
    expect(getProtectedRouteAccess("/admin/conversations/conv-scheduled", support).status).toBe("allowed");
    expect(readProjectFile("src/app/admin/layout.tsx")).toContain('dynamic = "force-dynamic"');
    expect(canAccessAdmin(admin)).toBe(true);
    expect(canAccessAdmin(support)).toBe(true);
    expect(canAccessAdmin(requester)).toBe(false);
    expect(canAccessAdmin(provider)).toBe(false);
  });

  it("builds the admin home action queue without orphan CTAs", () => {
    const homeData = buildAdminHomeData();
    const html = renderToStaticMarkup(<AdminHome metrics={homeData.metrics} actionItems={homeData.actionItems} sourceNote={homeData.sourceNote} />);

    expect(html).toContain("صف اقدام");
    expect(html).toContain("پرداخت‌های در انتظار بررسی");
    expect(html).toContain("موارد نیازمند توجه");
    expect(html).toContain("بررسی پرداخت دستی");
    expect(getBrokenAdminCtaHrefs()).toEqual([]);
  });

  it("guards each admin page before building route data", () => {
    adminRoutePatterns.forEach((routePattern) => {
      const routeFile = routePatternToFile(routePattern);
      const source = fs.readFileSync(routeFile, "utf8");
      const functionBody = source.slice(source.indexOf("export default async function"));

      expect(functionBody, routePattern).toContain("requireAdminPageAccess");
      expect(functionBody, routePattern).toMatch(/if \(!viewer\)/);
    });
  });

  it("guards every admin API route through the server-side admin viewer boundary", () => {
    adminApiRouteFiles().forEach((file) => {
      const source = fs.readFileSync(file, "utf8");

      expect(source, path.relative(process.cwd(), file)).toContain("requireAdminViewer");
    });
  });

  it("keeps dev QA routes unavailable in production builds", () => {
    const source = readProjectFile("src/app/dev/pages/page.tsx");

    expect(source).toContain("notFound");
    expect(source).toContain('process.env.NODE_ENV === "production"');
  });

  it("gates local admin demo fallback away from production-like admin routes", () => {
    const source = readProjectFile("src/features/v51/admin/server-data.ts");

    expect(source).toContain("function placeholderAdminList");
    expect(source).toContain("function placeholderAdminHome");
    expect(source).toContain('source.NODE_ENV !== "production"');
    expect(source).toContain('source.USERAVAA_ENABLE_ADMIN_DEMO_FALLBACK !== "0"');
    expect(source).toContain("if (!isAdminLocalDemoFallbackEnabled())");
    expect(source).toContain('source: "placeholder"');
  });

  it("keeps production backend and admin API paths free of fixture fallback helpers", () => {
    const checkedRoots = [projectFile("src/lib/backend"), projectFile("src/app/api/admin")];
    const files: string[] = [];

    function visit(current: string) {
      for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
        const next = path.join(current, entry.name);

        if (entry.isDirectory()) {
          visit(next);
        } else if (/\.(ts|tsx)$/.test(entry.name)) {
          files.push(next);
        }
      }
    }

    checkedRoots.forEach(visit);

    files.forEach((file) => {
      const source = fs.readFileSync(file, "utf8");

      expect(source, path.relative(process.cwd(), file)).not.toContain("getConversationOrFallback");
      expect(source, path.relative(process.cwd(), file)).not.toContain("@/features/v51/data");
    });
  });

  it("keeps admin copy free of forbidden terms and sensitive raw fields", () => {
    const forbiddenTerms = ["صاحب تجربه", "منتور", "کوچ", "وقت", "جریمه", "پنالت", "آزادسازی پول", "کد ضدتقلب", "کد امنیتی", "اثبات"];
    const forbiddenTechnical = ["attendanceVerificationCode", "DATABASE_URL", "PRISMA_ACCELERATE", "SECRET", "API_KEY"];

    adminSourceFiles().forEach((file) => {
      const source = fs.readFileSync(file, "utf8");
      [...forbiddenTerms, ...forbiddenTechnical].forEach((term) => {
        expect(source.includes(term), `${path.relative(process.cwd(), file)} contains ${term}`).toBe(false);
      });
    });
  });

  it("does not instantiate Prisma in admin client components", () => {
    adminSourceFiles().forEach((file) => {
      const source = fs.readFileSync(file, "utf8");

      if (!source.includes('"use client"') && !source.includes("'use client'")) {
        return;
      }

      expect(source).not.toContain("PrismaClient");
      expect(source).not.toContain("getPrismaClient");
      expect(source).not.toContain("@prisma/client");
    });
  });
});
