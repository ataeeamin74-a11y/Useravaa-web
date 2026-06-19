import fs from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Header } from "@/components/header/Header";
import LoginPage from "@/app/login/page";
import RegisterPage from "@/app/register/page";
import { InsightsPage } from "@/features/v51/insights/InsightsPage";
import { getProtectedRouteAccess } from "@/features/v51/permissions";
import type { Viewer } from "@/lib/auth/types";

let pathname = "/discover";

vi.mock("next/navigation", () => ({
  usePathname: () => pathname
}));

const normalUser: Viewer = {
  id: "user-requester",
  role: "USER",
  displayName: "علی"
};

const adminUser: Viewer = {
  id: "admin-support",
  role: "ADMIN",
  displayName: "پشتیبانی"
};

function projectFile(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

function readSourceFiles(dir: string): string {
  return fs.readdirSync(dir, { withFileTypes: true }).reduce((content, entry) => {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      return content + readSourceFiles(fullPath);
    }

    if (!/\.(css|ts|tsx)$/.test(entry.name)) {
      return content;
    }

    return content + fs.readFileSync(fullPath, "utf8");
  }, "");
}

function promptSection(html: string, marker: string) {
  const start = html.indexOf(marker);
  const end = html.indexOf("دسته‌بندی شغلی بینش‌ها", start);

  expect(start).toBeGreaterThanOrEqual(0);

  return html.slice(start, end > start ? end : undefined);
}

describe("Auth pages copy, password layout, and Insights public access", () => {
  beforeEach(() => {
    pathname = "/discover";
  });

  it("register page uses the approved focused copy and no in-card guide or role explanation", () => {
    const html = renderToStaticMarkup(<RegisterPage />);

    expect(html).toContain("<h1>ساخت حساب در یوزراوا</h1>");
    expect(html).toContain("یک حساب بسازید تا بتوانید تجربه‌های مرتبط را ببینید، گفت‌وگو درخواست کنید و بعداً پروفایل خود را کامل کنید.");
    expect(html).toContain("نام");
    expect(html).toContain("ایمیل");
    expect(html).toContain("رمز عبور");
    expect(html).toContain("ساخت حساب");
    expect(html).toContain("ورود به حساب موجود");
    expect(html).not.toContain("قبل از شروع");
    expect(html).not.toContain("یوزراوا چطور کار می‌کند؟");
    expect(html).not.toContain("در ثبت‌نام نیازی به انتخاب نقش جداگانه نیست");
    expect(projectFile("src/app/register/page.tsx")).not.toContain("Useravaa");
  });

  it("login page uses the approved Persian copy and removes distracting in-card links", () => {
    const html = renderToStaticMarkup(<LoginPage />);

    expect(html).toContain("<h1>ورود به یوزراوا</h1>");
    expect(html).toContain("وارد حساب خود شوید و مسیر گفت‌وگوها، تجربه‌ها و پروفایل خود را ادامه دهید.");
    expect(html).toContain("ایمیل");
    expect(html).toContain("رمز عبور");
    expect(html).toContain("ورود");
    expect(html).toContain("ساخت حساب");
    expect(html).not.toContain("Useravaa");
    expect(html).not.toContain("قبل از شروع");
    expect(html).not.toContain("یوزراوا چطور کار می‌کند؟");
  });

  it("shared password field reserves stable icon-side padding inside the input", () => {
    const css = projectFile("src/features/v51/auth/AuthPage.module.css");
    const component = projectFile("src/features/v51/auth/PasswordField.tsx");

    expect(component).toContain("styles.passwordControl");
    expect(component).toContain('type={visible ? "text" : "password"}');
    expect(component).toContain("aria-pressed={visible}");
    expect(css).toContain(".passwordControl {");
    expect(css).toContain("position: relative;");
    expect(css).toContain("width: 100%;");
    expect(css).toContain("padding: 0 12px 0 56px;");
    expect(css).toContain("width: 32px;");
    expect(css).toContain("height: 32px;");
    expect(css).toContain("top: 50%;");
    expect(css).toContain("left: 14px;");
    expect(css).toContain("transform: translateY(-50%);");
  });

  it("guest header keeps Insights public and suppresses duplicate auth CTAs on auth pages", () => {
    pathname = "/register";
    const registerHeader = renderToStaticMarkup(<Header authState="guest" />);

    expect(registerHeader).toContain('href="/insights"');
    expect(registerHeader).toContain('href="/login"');
    expect(registerHeader).not.toContain('href="/register"');

    pathname = "/login";
    const loginHeader = renderToStaticMarkup(<Header authState="guest" />);

    expect(loginHeader).toContain('href="/insights"');
    expect(loginHeader).toContain('href="/register"');
    expect(loginHeader).not.toContain('href="/login"');
  });

  it("public Insights reading routes stay outside the protected route matrix", () => {
    expect(getProtectedRouteAccess("/insights", null).status).toBe("allowed");
    expect(getProtectedRouteAccess("/insights/how-product-managers-decide", null).status).toBe("allowed");
    expect(projectFile("src/app/insights/page.tsx")).not.toContain("requireCurrentViewer");
    expect(projectFile("src/app/insights/[insightSlug]/page.tsx")).not.toContain("requireCurrentViewer");
    expect(projectFile("src/app/insights/page.tsx")).not.toContain('redirect("/login")');
    expect(projectFile("src/app/insights/[insightSlug]/page.tsx")).not.toContain('redirect("/login")');
  });

  it("protected Insights writing and management paths require auth or admin roles", () => {
    expect(getProtectedRouteAccess("/insights/respond/active-question", null)).toMatchObject({
      status: "redirect_login",
      behavior: "redirect:/login"
    });
    expect(getProtectedRouteAccess("/insights/respond/active-question", normalUser).status).toBe("allowed");

    ["/insights/new", "/insights/create", "/insights/edit/weekly-question", "/admin/insights"].forEach((route) => {
      expect(getProtectedRouteAccess(route, null).status).toBe("redirect_login");
      expect(getProtectedRouteAccess(route, normalUser).status).toBe("unauthorized");
      expect(getProtectedRouteAccess(route, adminUser).status).toBe("allowed");
    });
  });

  it("unauthenticated Insights renders a generic answer prompt without private viewer props", () => {
    const html = renderToStaticMarkup(<InsightsPage viewer={null} />);
    const promptHtml = promptSection(html, "یک سؤال جدید برای پاسخ کوتاه");

    expect(promptHtml).toContain("در نقش شما، چه چیزی بیرون ساده به نظر می‌رسد اما در عمل سخت‌تر است؟");
    expect(promptHtml).toContain("پاسخ کوتاه شما می‌تواند به تصمیم شغلی دیگران کمک کند.");
    expect(promptHtml).toContain("نوشتن پاسخ کوتاه");
    expect(promptHtml).not.toContain("علی، یک سؤال جدید داری");
    expect(promptHtml).not.toContain("پروفایل تجربه‌تان");
    expect(promptHtml).not.toContain("questionAvatar");
    expect(html).not.toContain("برای ثبت پاسخ کوتاه، ابتدا وارد حساب خود شوید یا یک حساب بسازید.");
  });

  it("unauthenticated answer CTA opens the auth prompt instead of the answer composer", () => {
    const html = renderToStaticMarkup(<InsightsPage viewer={null} initialAuthPromptOpen />);
    const source = projectFile("src/features/v51/insights/InsightsPage.tsx");

    expect(source).toContain("function openAnswerFlow()");
    expect(source).toContain("setAuthPromptOpen(true);");
    expect(source).toContain("onClick={openAnswerFlow}");
    expect(html).toContain("برای نوشتن پاسخ وارد شوید");
    expect(html).toContain("برای ثبت پاسخ کوتاه، ابتدا وارد حساب خود شوید یا یک حساب بسازید.");
    expect(html).toContain("ورود");
    expect(html).toContain("ساخت حساب");
    expect(html).toContain("returnTo=%2Finsights%3Fanswer%3Dactive");
    expect(html).not.toContain("<textarea");
  });

  it("authenticated Insights may personalize the prompt from the current viewer and open the composer", () => {
    const viewer = {
      id: "user-mina",
      displayName: "مینا ر."
    } as const;
    const html = renderToStaticMarkup(<InsightsPage viewer={viewer} />);
    const promptHtml = promptSection(html, "مینا، یک سؤال جدید داری");
    const composerHtml = renderToStaticMarkup(<InsightsPage viewer={viewer} initialAnswerComposerOpen />);

    expect(promptHtml).toContain("مینا، یک سؤال جدید داری");
    expect(promptHtml).not.toContain("علی، یک سؤال جدید داری");
    expect(composerHtml).toContain("<textarea");
    expect(composerHtml).toContain("نوشتن پاسخ کوتاه");
    expect(composerHtml).not.toContain("برای نوشتن پاسخ وارد شوید");
  });

  it("does not contain the forbidden Insights answer CTA typo", () => {
    expect(readSourceFiles(path.join(process.cwd(), "src"))).not.toContain("توشتن پاسخ کوتاه");
  });
});
