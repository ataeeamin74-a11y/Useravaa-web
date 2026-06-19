import { execFileSync, spawn } from "node:child_process";
import fsSync from "node:fs";
import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, "..", "..");
const OUT_DIR = path.join(ROOT, "visual-audit-screenshots");
const ZIP_PATH = path.join(ROOT, "visual-audit-screenshots.zip");
const BASE_URL = process.env.VISUAL_AUDIT_BASE_URL || "http://localhost:3000";
const TIMESTAMP = new Date().toISOString();

const viewports = [
  { label: "mobile-375", width: 375, height: 812 },
  { label: "mobile-430", width: 430, height: 932 },
  { label: "tablet-768", width: 768, height: 1024 },
  { label: "tablet-1024", width: 1024, height: 768 },
  { label: "laptop-1366", width: 1366, height: 900 },
  { label: "desktop-1440", width: 1440, height: 1000 }
];

function safeName(value) {
  const normalized = value
    .replace(/^https?:\/\/[^/]+/i, "")
    .replace(/^\//, "")
    .replace(/\?/g, "--")
    .replace(/&/g, "-")
    .replace(/=/g, "-")
    .replace(/\//g, "-")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return normalized || "home";
}

function csvEscape(value) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function psQuote(value) {
  return `'${value.replace(/'/g, "''")}'`;
}

async function readText(relativePath) {
  return fs.readFile(path.join(ROOT, relativePath), "utf8");
}

function unique(values) {
  return [...new Set(values)].filter(Boolean);
}

async function extractConversationIds() {
  const source = await readText("src/features/v51/data/conversations.ts");
  return unique([...source.matchAll(/^\s*id:\s*"([^"]+)"/gm)].map((match) => match[1]).filter((id) => id.startsWith("conv-")));
}

async function extractProfileIds() {
  const source = await readText("src/features/v51/data/profiles.ts");
  return unique([...source.matchAll(/^\s*id:\s*"([^"]+)"/gm)].map((match) => match[1]));
}

async function extractPublishedInsightSlugs() {
  const source = await readText("src/features/v51/data/experience-discovery.ts");
  const listMatch = source.match(/const publishedInsightSeeds\s*=\s*\[([\s\S]*?)\];/);
  const listSource = listMatch?.[1] ?? source;
  return unique([...listSource.matchAll(/slug:\s*"([^"]+)"[\s\S]*?status:\s*"published"/g)].map((match) => match[1]));
}

function requestUrl(url) {
  return new Promise((resolve) => {
    const request = http.get(url, (response) => {
      response.resume();
      response.on("end", () => resolve(response.statusCode || 0));
    });

    request.on("error", () => resolve(0));
    request.setTimeout(4000, () => {
      request.destroy();
      resolve(0);
    });
  });
}

async function ensureServer() {
  const status = await requestUrl(BASE_URL);

  if (status >= 200 && status < 500) {
    return null;
  }

  console.log(`No server responded at ${BASE_URL}; starting npm.cmd run dev.`);
  const child = spawn("npm.cmd", ["run", "dev"], {
    cwd: ROOT,
    shell: false,
    stdio: "ignore",
    windowsHide: true
  });

  const startedAt = Date.now();
  while (Date.now() - startedAt < 90000) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const nextStatus = await requestUrl(BASE_URL);
    if (nextStatus >= 200 && nextStatus < 500) {
      return child;
    }
  }

  child.kill();
  throw new Error(`Could not start dev server at ${BASE_URL}`);
}

async function launchBrowser() {
  const channels = [process.env.PLAYWRIGHT_CHANNEL, "chrome", "msedge"].filter(Boolean);
  for (const channel of channels) {
    try {
      return await chromium.launch({ channel, headless: true });
    } catch {
      // Try the next installed browser channel.
    }
  }

  const executablePaths = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
  ];

  for (const executablePath of executablePaths) {
    if (fsSync.existsSync(executablePath)) {
      try {
        return await chromium.launch({ executablePath, headless: true });
      } catch {
        // Try the next executable path.
      }
    }
  }

  return chromium.launch({ headless: true });
}

async function waitForSettledPage(page) {
  try {
    await page.waitForLoadState("networkidle", { timeout: 12000 });
  } catch {
    // Network idle is best-effort for local dev pages.
  }

  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0.001s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
        scroll-behavior: auto !important;
      }
    `
  });

  await page.evaluate(async () => {
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }

    await Promise.all(
      Array.from(document.images).map((image) => {
        if (image.complete) {
          return Promise.resolve();
        }

        return new Promise((resolve) => {
          image.addEventListener("load", resolve, { once: true });
          image.addEventListener("error", resolve, { once: true });
        });
      })
    );

    window.scrollTo(0, 0);
  });
}

async function clickFirst(page, selectorOrLocator, notes, label) {
  try {
    const locator = typeof selectorOrLocator === "string" ? page.locator(selectorOrLocator) : selectorOrLocator;
    const count = await locator.count();
    if (!count) {
      notes.push(`Interaction skipped: ${label} not found.`);
      return false;
    }

    await locator.first().click({ timeout: 5000 });
    await page.waitForTimeout(350);
    return true;
  } catch (error) {
    notes.push(`Interaction failed: ${label}: ${error.message}`);
    return false;
  }
}

async function fillFirst(page, selector, value, notes, label) {
  try {
    const locator = page.locator(selector);
    const count = await locator.count();
    if (!count) {
      notes.push(`Interaction skipped: ${label} not found.`);
      return false;
    }

    await locator.first().fill(value, { timeout: 5000 });
    await page.waitForTimeout(350);
    return true;
  } catch (error) {
    notes.push(`Interaction failed: ${label}: ${error.message}`);
    return false;
  }
}

async function getAuditSnapshot(page) {
  return page.evaluate(() => {
    const viewportWidth = window.innerWidth;
    const isVisible = (element) => {
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.visibility !== "hidden" && style.display !== "none" && Number(style.opacity) !== 0 && rect.width > 0 && rect.height > 0;
    };
    const selectorFor = (element) => {
      const id = element.id ? `#${element.id}` : "";
      const className =
        typeof element.className === "string" && element.className.trim()
          ? `.${element.className.trim().split(/\s+/).slice(0, 3).join(".")}`
          : "";
      return `${element.tagName.toLowerCase()}${id}${className}`;
    };
    const visibleElements = Array.from(document.querySelectorAll("body *")).filter(isVisible);
    const overflowingElements = visibleElements
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return { selector: selectorFor(element), left: Math.round(rect.left), right: Math.round(rect.right), width: Math.round(rect.width) };
      })
      .filter((item) => item.left < -1 || item.right > viewportWidth + 1)
      .slice(0, 25);
    const smallTargets = Array.from(document.querySelectorAll("a[href], button, input, select, textarea, [role='button']"))
      .filter(isVisible)
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return { selector: selectorFor(element), width: Math.round(rect.width), height: Math.round(rect.height), text: (element.textContent || "").trim().slice(0, 80) };
      })
      .filter((item) => item.width < 36 || item.height < 36)
      .slice(0, 25);
    const clippingRisks = visibleElements
      .filter((element) => {
        const style = window.getComputedStyle(element);
        const text = (element.textContent || "").trim();
        return (
          text.length > 0 &&
          (style.overflow === "hidden" || style.textOverflow === "ellipsis" || style.whiteSpace === "nowrap") &&
          (element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 1)
        );
      })
      .map((element) => ({ selector: selectorFor(element), text: (element.textContent || "").trim().slice(0, 100) }))
      .slice(0, 25);
    const brokenImages = Array.from(document.images)
      .filter((image) => !image.complete || image.naturalWidth === 0)
      .map((image) => image.currentSrc || image.src || image.alt || "unknown")
      .slice(0, 25);

    return {
      title: document.title,
      hasHorizontalScroll: document.documentElement.scrollWidth > viewportWidth,
      hasBodyOverflow: document.body.scrollWidth > viewportWidth,
      documentScrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      viewportWidth,
      overflowingElements,
      smallTargets,
      clippingRisks,
      brokenImages
    };
  });
}

function findingRowsFor(entry, audit) {
  const rows = [];
  const add = (type, severity, message, details = "") => {
    rows.push({
      route: entry.route,
      variant: entry.variant,
      viewportLabel: entry.viewportLabel,
      width: entry.width,
      height: entry.height,
      screenshotPath: entry.screenshotPath,
      type,
      severity,
      message,
      details
    });
  };

  if (audit.hasHorizontalScroll) {
    add("horizontal-scroll", "warning", "Document scroll width exceeds viewport.", `document=${audit.documentScrollWidth}; viewport=${audit.viewportWidth}`);
  }

  if (audit.hasBodyOverflow) {
    add("body-overflow", "warning", "Body scroll width exceeds viewport.", `body=${audit.bodyScrollWidth}; viewport=${audit.viewportWidth}`);
  }

  audit.overflowingElements.forEach((item) => add("element-overflow", "warning", "Visible element extends horizontally beyond viewport.", JSON.stringify(item)));
  audit.smallTargets.forEach((item) => add("small-target", "info", "Clickable target is smaller than 36px in one dimension.", JSON.stringify(item)));
  audit.clippingRisks.forEach((item) => add("text-clipping-risk", "info", "Visible text may be clipped or ellipsized.", JSON.stringify(item)));
  audit.brokenImages.forEach((item) => add("broken-image", "warning", "Image did not complete or has zero natural width.", item));

  return rows;
}

function staticScenario(route, variant = "default", note = "") {
  return { route, variant, note };
}

async function buildScenarios() {
  const [conversationIds, profileIds, insightSlugs] = await Promise.all([extractConversationIds(), extractProfileIds(), extractPublishedInsightSlugs()]);
  const scenarios = [
    staticScenario("/", "default", "Home/root route."),
    staticScenario("/discover", "default", "Discover default state."),
    staticScenario("/discover?state=loading", "loading-state", "Discover loading fixture state."),
    staticScenario("/discover?state=error", "error-state", "Discover error fixture state."),
    {
      route: "/discover",
      variant: "search-submitted",
      note: "Search submitted interaction.",
      action: async (page, notes) => {
        if (await fillFirst(page, 'input[type="search"]', "محصول", notes, "discover search input")) {
          await page.keyboard.press("Enter");
          await page.waitForTimeout(500);
        }
      }
    },
    {
      route: "/discover",
      variant: "job-group-combobox-open",
      note: "Job group searchable combobox open.",
      action: async (page, notes) => {
        await clickFirst(page, 'input[role="combobox"]', notes, "first discover combobox");
      }
    },
    {
      route: "/discover",
      variant: "company-combobox-open",
      note: "Company searchable combobox open.",
      action: async (page, notes) => {
        const comboboxes = page.locator('input[role="combobox"]');
        try {
          const count = await comboboxes.count();
          if (count > 1) {
            await comboboxes.nth(1).click();
            await page.waitForTimeout(350);
          } else {
            notes.push("Interaction skipped: second discover combobox not found.");
          }
        } catch (error) {
          notes.push(`Interaction failed: company combobox: ${error.message}`);
        }
      }
    },
    {
      route: "/discover",
      variant: "bookmark-toggled",
      note: "First bookmark/save control toggled.",
      action: async (page, notes) => {
        await clickFirst(page, 'button[aria-label*="ذخیره"]', notes, "discover save button");
      }
    },
    staticScenario("/insights", "default", "Insights feed default."),
    staticScenario("/insights?answer=active", "answer-modal-open", "Answer composer opened by supported query state."),
    {
      route: "/insights",
      variant: "filter-popover-open",
      note: "Insights job category filter open.",
      action: async (page, notes) => {
        await clickFirst(page, 'button[aria-label*="دسته"]', notes, "insights category filter");
      }
    },
    staticScenario("/guide", "default"),
    staticScenario("/saved", "default"),
    staticScenario("/saved?tab=people", "people-tab"),
    staticScenario("/saved?tab=insights", "insights-tab"),
    staticScenario("/notifications", "default"),
    staticScenario("/profile", "default"),
    staticScenario("/profile?activeQuestionAnswered=false", "active-question-unanswered"),
    staticScenario("/profile?activeQuestionAnswered=true", "active-question-answered"),
    staticScenario("/profile?state=none", "no-profile-state"),
    staticScenario("/profile?state=draft", "draft-profile-state"),
    staticScenario("/profile?state=pending_review", "pending-review-state"),
    staticScenario("/profile?state=needs_changes", "needs-changes-state"),
    staticScenario("/profile?state=inactive", "inactive-profile-state"),
    staticScenario("/profile/build", "default"),
    {
      route: "/profile/build",
      variant: "preview-modal-open",
      note: "Profile builder preview interaction if available.",
      action: async (page, notes) => {
        await clickFirst(page, page.getByText("پیش‌نمایش", { exact: false }), notes, "profile builder preview");
      }
    },
    staticScenario("/profile/network", "default"),
    staticScenario("/profile/network?tab=following", "following-tab"),
    staticScenario("/profile/network?tab=saved", "saved-tab"),
    staticScenario("/profile/network?tab=followers", "followers-tab"),
    staticScenario("/profile/feedback", "default"),
    staticScenario("/profile/settings", "default"),
    {
      route: "/profile/settings",
      variant: "account-edit-modal-open",
      action: async (page, notes) => {
        await clickFirst(page, page.getByText("ویرایش اطلاعات حساب", { exact: false }), notes, "account edit");
      }
    },
    {
      route: "/profile/settings",
      variant: "settlement-modal-open",
      action: async (page, notes) => {
        await clickFirst(page, page.getByText("ثبت یا ویرایش شبا", { exact: false }), notes, "settlement edit");
      }
    },
    staticScenario("/settings", "default"),
    staticScenario("/wallet", "default"),
    {
      route: "/wallet",
      variant: "top-up-panel-open",
      action: async (page, notes) => {
        await clickFirst(page, page.getByText("افزایش موجودی", { exact: false }), notes, "wallet top-up");
      }
    },
    {
      route: "/wallet",
      variant: "settlement-modal-open",
      action: async (page, notes) => {
        await clickFirst(page, page.getByText("ثبت یا ویرایش شبا", { exact: false }), notes, "wallet settlement");
      }
    },
    staticScenario("/requests", "legacy-requests-route", "Compatibility route still implemented, not in main nav."),
    staticScenario("/requests/new", "default"),
    staticScenario("/requests/new?profileId=ali&duration=30", "ali-30-minute"),
    staticScenario("/requests/new?profileId=ali&duration=60", "ali-60-minute"),
    staticScenario("/conversations", "default"),
    {
      route: "/conversations",
      variant: "incoming-tab",
      action: async (page, notes) => {
        await clickFirst(page, page.getByRole("tab", { name: "درخواست‌های دریافتی" }), notes, "incoming conversations tab");
      }
    },
    staticScenario("/sessions", "legacy-sessions-route", "Compatibility route still implemented, not in main nav."),
    staticScenario("/checkout", "default"),
    staticScenario("/login", "default"),
    staticScenario("/register", "default")
  ];

  for (const conversationId of conversationIds) {
    scenarios.push(staticScenario(`/conversations/${conversationId}`, "detail", `Conversation detail fixture: ${conversationId}.`));
    scenarios.push(staticScenario(`/conversations/${conversationId}/propose-times`, "propose-times", `Propose times route for fixture: ${conversationId}.`));
    scenarios.push(staticScenario(`/conversations/${conversationId}/select-time`, "select-time", `Select time route for fixture: ${conversationId}.`));
    scenarios.push(staticScenario(`/checkout/${conversationId}`, "checkout", `Checkout route for fixture: ${conversationId}.`));
  }

  scenarios.push({
    route: "/conversations/conv-provider-request/propose-times",
    variant: "propose-times-three-selected",
    note: "Provider propose-times route after selecting up to three visible time options.",
    action: async (page, notes) => {
      const slotButtons = page.locator("button").filter({ hasText: ":" });
      try {
        const count = Math.min(3, await slotButtons.count());
        if (!count) {
          notes.push("Interaction skipped: no time slot buttons found.");
          return;
        }
        for (let index = 0; index < count; index += 1) {
          await slotButtons.nth(index).click();
          await page.waitForTimeout(150);
        }
      } catch (error) {
        notes.push(`Interaction failed: selecting proposed times: ${error.message}`);
      }
    }
  });

  for (const profileId of profileIds) {
    scenarios.push(staticScenario(`/profiles/${profileId}`, "public-profile", `Public profile fixture: ${profileId}.`));
  }

  for (const insightSlug of insightSlugs) {
    scenarios.push(staticScenario(`/insights/${insightSlug}`, "detail", `Published insight fixture: ${insightSlug}.`));
  }

  return scenarios;
}

async function captureScenario(browser, scenario, viewport) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
    locale: "fa-IR",
    colorScheme: "light"
  });
  const page = await context.newPage();
  const consoleMessages = [];
  const pageErrors = [];
  const failedRequests = [];
  const notes = scenario.note ? [scenario.note] : [];

  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") {
      consoleMessages.push(`${message.type()}: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("requestfailed", (request) => failedRequests.push(`${request.method()} ${request.url()} ${request.failure()?.errorText || ""}`.trim()));

  const routeSlug = safeName(scenario.route);
  const variantSlug = safeName(scenario.variant);
  const viewportDir = path.join(OUT_DIR, viewport.label, routeSlug);
  const filename = `${viewport.label}__${routeSlug}__${variantSlug}.png`;
  const absolutePath = path.join(viewportDir, filename);
  const relativePath = path.relative(OUT_DIR, absolutePath).replace(/\\/g, "/");
  const url = new URL(scenario.route, BASE_URL).toString();

  try {
    await fs.mkdir(viewportDir, { recursive: true });
    const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
    const status = response?.status() ?? 0;
    if (status >= 400) {
      throw new Error(`HTTP ${status}`);
    }

    await waitForSettledPage(page);
    if (scenario.action) {
      await scenario.action(page, notes);
      await waitForSettledPage(page);
    }

    const audit = await getAuditSnapshot(page);
    await page.screenshot({ path: absolutePath, fullPage: true, animations: "disabled" });

    const entry = {
      route: scenario.route,
      variant: scenario.variant,
      viewportLabel: viewport.label,
      width: viewport.width,
      height: viewport.height,
      screenshotPath: relativePath,
      timestamp: new Date().toISOString(),
      pageTitle: audit.title,
      horizontalScroll: audit.hasHorizontalScroll,
      documentBodyScrollWidth: audit.bodyScrollWidth,
      documentScrollWidth: audit.documentScrollWidth,
      viewportWidth: audit.viewportWidth,
      visibleElementOverflowCount: audit.overflowingElements.length,
      consoleErrors: consoleMessages,
      pageErrors,
      failedNetworkRequests: failedRequests,
      notes
    };

    return {
      entry,
      findings: [
        ...findingRowsFor(entry, audit),
        ...consoleMessages.map((message) => ({
          route: entry.route,
          variant: entry.variant,
          viewportLabel: entry.viewportLabel,
          width: entry.width,
          height: entry.height,
          screenshotPath: entry.screenshotPath,
          type: "console",
          severity: message.startsWith("error") ? "error" : "warning",
          message,
          details: ""
        })),
        ...pageErrors.map((message) => ({
          route: entry.route,
          variant: entry.variant,
          viewportLabel: entry.viewportLabel,
          width: entry.width,
          height: entry.height,
          screenshotPath: entry.screenshotPath,
          type: "page-error",
          severity: "error",
          message,
          details: ""
        })),
        ...failedRequests.map((message) => ({
          route: entry.route,
          variant: entry.variant,
          viewportLabel: entry.viewportLabel,
          width: entry.width,
          height: entry.height,
          screenshotPath: entry.screenshotPath,
          type: "failed-request",
          severity: "warning",
          message,
          details: ""
        }))
      ],
      failure: null
    };
  } catch (error) {
    return {
      entry: null,
      findings: [],
      failure: {
        route: scenario.route,
        variant: scenario.variant,
        viewportLabel: viewport.label,
        width: viewport.width,
        height: viewport.height,
        timestamp: new Date().toISOString(),
        error: error.message,
        notes
      }
    };
  } finally {
    await context.close();
  }
}

async function writeJson(relativePath, value) {
  await fs.writeFile(path.join(OUT_DIR, relativePath), `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function writeCsv(relativePath, rows, columns) {
  const lines = [columns.join(",")];
  for (const row of rows) {
    lines.push(columns.map((column) => csvEscape(row[column])).join(","));
  }
  await fs.writeFile(path.join(OUT_DIR, relativePath), `${lines.join("\n")}\n`, "utf8");
}

async function writeReadme({ manifest, findings, failures, scenarios }) {
  const routes = unique(scenarios.map((scenario) => scenario.route)).sort();
  const content = `# Useravaa Visual Audit Screenshots

Generated: ${TIMESTAMP}

## Command

\`\`\`bash
npm run visual:audit
\`\`\`

Base URL: \`${BASE_URL}\`

## Viewports

${viewports.map((viewport) => `- ${viewport.label}: ${viewport.width}x${viewport.height}`).join("\n")}

## Summary

- Screenshots generated: ${manifest.length}
- Route/state variants requested: ${scenarios.length}
- Unique routes covered: ${routes.length}
- Audit warning/error rows: ${findings.length}
- Failed captures: ${failures.length}

## Routes Covered

${routes.map((route) => `- \`${route}\``).join("\n")}

## Known Failed Captures

${failures.length ? failures.map((failure) => `- ${failure.viewportLabel} \`${failure.route}\` (${failure.variant}): ${failure.error}`).join("\n") : "- None"}

## Manual Review Recommendation

Open \`index.html\` and review each route across mobile, tablet, laptop, and desktop. Prioritize screenshots with horizontal-scroll, element-overflow, broken-image, console, page-error, or failed-request findings.
`;

  await fs.writeFile(path.join(OUT_DIR, "README.md"), content, "utf8");
}

async function writeIndex(manifest, findingsByScreenshot) {
  const grouped = new Map();
  for (const entry of manifest) {
    if (!grouped.has(entry.route)) {
      grouped.set(entry.route, []);
    }
    grouped.get(entry.route).push(entry);
  }

  const sections = [...grouped.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([route, entries]) => {
      const cards = entries
        .sort((a, b) => `${a.variant}-${a.viewportLabel}`.localeCompare(`${b.variant}-${b.viewportLabel}`))
        .map((entry) => {
          const warnings = findingsByScreenshot.get(entry.screenshotPath) || [];
          return `<article class="shot">
  <a href="${entry.screenshotPath}" target="_blank" rel="noreferrer"><img src="${entry.screenshotPath}" loading="lazy" alt="${entry.route} ${entry.variant} ${entry.viewportLabel}"></a>
  <div class="meta">
    <strong>${entry.viewportLabel}</strong>
    <span>${entry.variant}</span>
    <code>${entry.width}x${entry.height}</code>
    ${warnings.length ? `<b class="warn">${warnings.length} warning${warnings.length === 1 ? "" : "s"}</b>` : `<b class="ok">clean</b>`}
  </div>
  ${warnings.length ? `<ul>${warnings.slice(0, 5).map((warning) => `<li>${warning.type}: ${warning.message}</li>`).join("")}</ul>` : ""}
</article>`;
        })
        .join("\n");

      return `<section>
  <h2>${route}</h2>
  <div class="grid">${cards}</div>
</section>`;
    })
    .join("\n");

  const html = `<!doctype html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>بررسی تصویری Useravaa</title>
  <style>
    body { margin: 0; background: #f8fafc; color: #0f1d43; font-family: system-ui, -apple-system, Segoe UI, sans-serif; }
    header { position: sticky; top: 0; z-index: 2; background: #fff; border-bottom: 1px solid #e4e7ec; padding: 18px 24px; }
    h1, h2 { margin: 0; }
    h1 { font-size: 24px; }
    h2 { margin: 28px 0 14px; font-size: 20px; }
    main { padding: 24px; }
    section { border-bottom: 1px solid #e4e7ec; padding-bottom: 24px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
    .shot { overflow: hidden; border: 1px solid #e4e7ec; border-radius: 16px; background: #fff; box-shadow: 0 12px 32px rgba(15, 29, 67, 0.06); }
    .shot img { width: 100%; height: 220px; object-fit: cover; object-position: top center; display: block; border-bottom: 1px solid #e4e7ec; background: #fff; }
    .meta { display: grid; gap: 5px; padding: 12px; color: #58657d; font-size: 13px; }
    .meta strong { color: #0f1d43; font-size: 15px; }
    code { direction: ltr; text-align: right; }
    .warn { color: #b54708; }
    .ok { color: #027a48; }
    ul { margin: 0; padding: 0 28px 14px 12px; color: #58657d; font-size: 12px; line-height: 1.7; }
  </style>
</head>
<body>
  <header>
    <h1>بررسی صفحات Useravaa</h1>
    <p>${manifest.length} تصویر، ${findingsByScreenshot.size} تصویر دارای هشدار</p>
  </header>
  <main>${sections}</main>
</body>
</html>`;

  await fs.writeFile(path.join(OUT_DIR, "index.html"), html, "utf8");
}

function zipOutput() {
  if (fsSync.existsSync(ZIP_PATH)) {
    fsSync.rmSync(ZIP_PATH, { force: true });
  }

  try {
    execFileSync("tar.exe", ["-a", "-cf", ZIP_PATH, "-C", ROOT, "visual-audit-screenshots"], { cwd: ROOT, stdio: "inherit" });
  } catch {
    const command = `Compress-Archive -Path ${psQuote(path.join(OUT_DIR, "*"))} -DestinationPath ${psQuote(ZIP_PATH)} -Force`;
    execFileSync("powershell.exe", ["-NoProfile", "-Command", command], { cwd: ROOT, stdio: "inherit" });
  }
}

async function main() {
  await fs.rm(OUT_DIR, { recursive: true, force: true });
  await fs.mkdir(OUT_DIR, { recursive: true });

  const serverProcess = await ensureServer();
  const scenarios = await buildScenarios();
  const manifest = [];
  const findings = [];
  const failures = [];
  const browser = await launchBrowser();

  try {
    let index = 0;
    const total = scenarios.length * viewports.length;
    for (const viewport of viewports) {
      for (const scenario of scenarios) {
        index += 1;
        console.log(`[${index}/${total}] ${viewport.label} ${scenario.route} ${scenario.variant}`);
        const result = await captureScenario(browser, scenario, viewport);
        if (result.entry) {
          manifest.push(result.entry);
          findings.push(...result.findings);
        }
        if (result.failure) {
          failures.push(result.failure);
        }
      }
    }
  } finally {
    await browser.close();
    if (serverProcess) {
      serverProcess.kill();
    }
  }

  const findingsByScreenshot = new Map();
  for (const finding of findings) {
    if (!findingsByScreenshot.has(finding.screenshotPath)) {
      findingsByScreenshot.set(finding.screenshotPath, []);
    }
    findingsByScreenshot.get(finding.screenshotPath).push(finding);
  }

  await writeJson("manifest.json", { generatedAt: TIMESTAMP, baseUrl: BASE_URL, viewports, screenshotCount: manifest.length, screenshots: manifest, failures });
  await writeCsv("manifest.csv", manifest, [
    "route",
    "variant",
    "viewportLabel",
    "width",
    "height",
    "screenshotPath",
    "timestamp",
    "pageTitle",
    "horizontalScroll",
    "documentBodyScrollWidth",
    "documentScrollWidth",
    "viewportWidth",
    "visibleElementOverflowCount",
    "consoleErrors",
    "pageErrors",
    "failedNetworkRequests",
    "notes"
  ]);
  await writeJson("audit-findings.json", { generatedAt: TIMESTAMP, findingCount: findings.length, findings, failures });
  await writeCsv("audit-findings.csv", findings, [
    "route",
    "variant",
    "viewportLabel",
    "width",
    "height",
    "screenshotPath",
    "type",
    "severity",
    "message",
    "details"
  ]);
  await writeReadme({ manifest, findings, failures, scenarios });
  await writeIndex(manifest, findingsByScreenshot);
  zipOutput();

  console.log(`Visual audit complete: ${manifest.length} screenshots, ${findings.length} findings, ${failures.length} failed captures.`);
  console.log(ZIP_PATH);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
