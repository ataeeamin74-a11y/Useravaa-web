import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  IOS_INSTALL_GUIDE_DISMISSAL_MS,
  IOS_INSTALL_GUIDE_STORAGE_KEY,
  rememberIosInstallGuideDismissal,
  shouldShowIosInstallGuide,
  wasIosInstallGuideRecentlyDismissed,
  type InstallGuideStorage,
  type IosNavigatorSnapshot
} from "@/features/pwa/ios-install-guide";

const iosSafari: IosNavigatorSnapshot = {
  userAgent:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1",
  platform: "iPhone",
  maxTouchPoints: 5,
  standalone: false
};

function memoryStorage(): InstallGuideStorage {
  const values = new Map<string, string>();

  return {
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      values.set(key, value);
    }
  };
}

describe("iOS PWA install guide", () => {
  it("does not show on desktop browsers", () => {
    expect(
      shouldShowIosInstallGuide({
        navigatorSnapshot: {
          userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36",
          platform: "Win32",
          maxTouchPoints: 0
        }
      })
    ).toBe(false);
  });

  it("does not show in standalone mode", () => {
    expect(
      shouldShowIosInstallGuide({
        navigatorSnapshot: iosSafari,
        matchMedia: () => ({ matches: true })
      })
    ).toBe(false);

    expect(
      shouldShowIosInstallGuide({
        navigatorSnapshot: { ...iosSafari, standalone: true },
        matchMedia: () => ({ matches: false })
      })
    ).toBe(false);
  });

  it("shows in an iOS Safari-like browser, including iPad desktop mode", () => {
    expect(
      shouldShowIosInstallGuide({
        navigatorSnapshot: iosSafari,
        matchMedia: () => ({ matches: false })
      })
    ).toBe(true);

    expect(
      shouldShowIosInstallGuide({
        navigatorSnapshot: {
          userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1",
          platform: "MacIntel",
          maxTouchPoints: 5
        }
      })
    ).toBe(true);
  });

  it("stores dismissal under the stable key and suppresses the guide for seven days", () => {
    const storage = memoryStorage();
    const dismissedAt = 1_800_000_000_000;

    rememberIosInstallGuideDismissal(storage, dismissedAt);

    expect(storage.getItem(IOS_INSTALL_GUIDE_STORAGE_KEY)).toBe(String(dismissedAt));
    expect(wasIosInstallGuideRecentlyDismissed(storage, dismissedAt + IOS_INSTALL_GUIDE_DISMISSAL_MS - 1)).toBe(true);
    expect(
      shouldShowIosInstallGuide({
        navigatorSnapshot: iosSafari,
        storage,
        now: dismissedAt + 1000
      })
    ).toBe(false);
  });

  it("allows the guide again after seven days", () => {
    const storage = memoryStorage();
    const dismissedAt = 1_800_000_000_000;

    rememberIosInstallGuideDismissal(storage, dismissedAt);

    expect(wasIosInstallGuideRecentlyDismissed(storage, dismissedAt + IOS_INSTALL_GUIDE_DISMISSAL_MS)).toBe(false);
  });

  it("fails silently when localStorage is unavailable", () => {
    const unavailableStorage: InstallGuideStorage = {
      getItem() {
        throw new Error("storage blocked");
      },
      setItem() {
        throw new Error("storage blocked");
      }
    };

    expect(() => rememberIosInstallGuideDismissal(unavailableStorage)).not.toThrow();
    expect(
      shouldShowIosInstallGuide({
        navigatorSnapshot: iosSafari,
        storage: unavailableStorage
      })
    ).toBe(true);
  });

  it("stays isolated from Prisma and database modules", () => {
    const sourceFiles = [
      "src/features/pwa/IosInstallGuide.tsx",
      "src/features/pwa/ios-install-guide.ts",
      "src/features/career/CareerShell.tsx"
    ];

    sourceFiles.forEach((file) => {
      const source = fs.readFileSync(path.join(process.cwd(), file), "utf8");
      expect(source).not.toMatch(/prisma|database_url|@\/lib\/backend/i);
    });
  });

  it("keeps the sheet semantics and approved Persian actions explicit", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "src/features/pwa/IosInstallGuide.tsx"),
      "utf8"
    );

    expect(source).toContain('role="dialog"');
    expect(source).toContain('aria-modal="true"');
    expect(source).toContain("Useravaa را به صفحه اصلی اضافه کن");
    expect(source).toContain("متوجه شدم");
    expect(source).toContain("بعداً");
  });
});
