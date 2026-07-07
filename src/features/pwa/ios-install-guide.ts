export const IOS_INSTALL_GUIDE_STORAGE_KEY = "useravaa:pwa-ios-install-guide-dismissed";
export const IOS_INSTALL_GUIDE_DISMISSAL_MS = 7 * 24 * 60 * 60 * 1000;

export type IosNavigatorSnapshot = Readonly<{
  userAgent: string;
  platform?: string;
  maxTouchPoints?: number;
  standalone?: boolean;
}>;

export type InstallGuideStorage = Pick<Storage, "getItem" | "setItem">;

type InstallGuideEnvironment = Readonly<{
  navigatorSnapshot: IosNavigatorSnapshot;
  matchMedia?: (query: string) => Pick<MediaQueryList, "matches">;
  storage?: InstallGuideStorage;
  now?: number;
}>;

export function isIosSafariLike(navigatorSnapshot: IosNavigatorSnapshot) {
  const { userAgent, platform = "", maxTouchPoints = 0 } = navigatorSnapshot;
  const isNamedIosDevice = /iPad|iPhone|iPod/i.test(userAgent);
  const isIpadDesktopMode = platform === "MacIntel" && maxTouchPoints > 1;
  const isAlternativeIosBrowser = /CriOS|FxiOS|EdgiOS|OPiOS/i.test(userAgent);

  return (isNamedIosDevice || isIpadDesktopMode) && /AppleWebKit/i.test(userAgent) && /Safari/i.test(userAgent) && !isAlternativeIosBrowser;
}

export function isStandaloneDisplayMode(
  navigatorSnapshot: IosNavigatorSnapshot,
  matchMedia?: InstallGuideEnvironment["matchMedia"]
) {
  try {
    return navigatorSnapshot.standalone === true || matchMedia?.("(display-mode: standalone)").matches === true;
  } catch {
    return navigatorSnapshot.standalone === true;
  }
}

export function wasIosInstallGuideRecentlyDismissed(
  storage?: InstallGuideStorage,
  now = Date.now()
) {
  try {
    const storedValue = storage?.getItem(IOS_INSTALL_GUIDE_STORAGE_KEY);
    const dismissedAt = storedValue ? Number(storedValue) : Number.NaN;

    if (!Number.isFinite(dismissedAt)) {
      return false;
    }

    // Treat a future timestamp as dismissed too, which avoids repeatedly
    // showing the guide when a device clock moves backwards.
    return dismissedAt > now || now - dismissedAt < IOS_INSTALL_GUIDE_DISMISSAL_MS;
  } catch {
    return false;
  }
}

export function rememberIosInstallGuideDismissal(
  storage?: InstallGuideStorage,
  now = Date.now()
) {
  try {
    storage?.setItem(IOS_INSTALL_GUIDE_STORAGE_KEY, String(now));
  } catch {
    // Storage can be unavailable in private or restricted browsing contexts.
  }
}

export function shouldShowIosInstallGuide({
  navigatorSnapshot,
  matchMedia,
  storage,
  now = Date.now()
}: InstallGuideEnvironment) {
  return (
    isIosSafariLike(navigatorSnapshot) &&
    !isStandaloneDisplayMode(navigatorSnapshot, matchMedia) &&
    !wasIosInstallGuideRecentlyDismissed(storage, now)
  );
}
