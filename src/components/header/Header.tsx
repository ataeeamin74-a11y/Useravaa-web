"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UseravaaIcon } from "@/components/ui/UseravaaIcon";
import { getRouteIdByPathname } from "@/lib/routes";
import styles from "./Header.module.css";

type HeaderAuthState = "guest" | "authenticated";

type HeaderProps = {
  authState?: HeaderAuthState;
  currentUser?: {
    firstName: string;
    initials: string;
    publicProfileUrl: string;
  };
};

const guestNavigation = [
  { href: "/discover", label: "کشف تجربه‌ها", routeIds: ["discover"] },
  { href: "/insights", label: "بینش‌ها", routeIds: ["insights"] }
] as const;

const loggedInNavigation = [
  { href: "/discover", label: "کشف تجربه‌ها", routeIds: ["discover"] },
  { href: "/insights", label: "بینش‌ها", routeIds: ["insights"] },
  { href: "/requests", label: "درخواست‌ها", routeIds: ["requests", "requestNew"] },
  { href: "/sessions", label: "جلسه‌ها", routeIds: ["sessions", "conversations", "conversationDetail", "proposeTimes", "selectTime", "checkout"] }
] as const;

function joinClasses(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function Header({
  authState = "authenticated",
  currentUser = {
    firstName: "علی",
    initials: "ع",
    publicProfileUrl: "/profiles/ali"
  }
}: HeaderProps) {
  const pathname = usePathname();
  const activeRouteId = getRouteIdByPathname(pathname);
  const isAuthenticated = authState === "authenticated";
  const navigation = isAuthenticated ? loggedInNavigation : guestNavigation;

  const routeIsActive = (routeIds: readonly string[]) => {
    return activeRouteId ? routeIds.includes(activeRouteId) : false;
  };

  return (
    <header className={styles.topbar}>
      <Link href="/discover" className={styles.brand} aria-label="Useravaa">
        <Image className={styles.logo} src="/brand/useravaa-logo-horizontal.png" alt="Useravaa" width={145} height={109} priority />
      </Link>

      <nav className={styles.mainNav} aria-label="ناوبری اصلی">
        {navigation.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={joinClasses(styles.mainNavLink, routeIsActive(item.routeIds) && styles.active)}
            aria-current={routeIsActive(item.routeIds) ? "page" : undefined}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <nav className={styles.utilities} aria-label="ابزارهای حساب">
        {isAuthenticated ? (
          <details className={styles.accountMenu}>
            <summary className={styles.accountTrigger}>
              <span className={styles.accountAvatar}>{currentUser.initials}</span>
              <span>{currentUser.firstName}</span>
              <UseravaaIcon name="dropdown" size={16} />
            </summary>
            <div className={styles.accountDropdown}>
              <Link href="/profile">
                <UseravaaIcon name="profile" size={17} />
                <span>پروفایل من</span>
              </Link>
              <Link href={currentUser.publicProfileUrl}>
                <UseravaaIcon name="view" size={17} />
                <span>مشاهده پروفایل عمومی</span>
              </Link>
              <Link href="/settings">
                <UseravaaIcon name="settings" size={17} />
                <span>تنظیمات حساب</span>
              </Link>
              <Link href="/wallet">
                <UseravaaIcon name="wallet" size={17} />
                <span>کیف پول</span>
              </Link>
              <button type="button">
                <UseravaaIcon name="logout" size={17} />
                <span>خروج از حساب کاربری</span>
              </button>
            </div>
          </details>
        ) : (
          <>
            <Link className={joinClasses(styles.authLink, styles.loginLink)} href="/login">
              ورود
            </Link>
            <Link className={joinClasses(styles.authLink, styles.registerLink)} href="/register">
              شروع کنید
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
