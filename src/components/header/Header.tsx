"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { UseravaaLogo } from "@/components/logo/UseravaaLogo";
import { Avatar } from "@/components/ui/Avatar";
import { InlineIconText } from "@/components/ui/InlineIconText";
import { UseravaaIcon } from "@/components/ui/UseravaaIcon";
import { useClickOutside } from "@/lib/use-click-outside";
import { getRouteIdByPathname } from "@/lib/routes";
import styles from "./Header.module.css";

type HeaderAuthState = "guest" | "authenticated";

export type HeaderNotification = {
  id: string;
  title: string;
  body: string;
  href: string;
  status: "read" | "unread";
  timeLabel: string;
};

type HeaderProps = {
  authState?: HeaderAuthState;
  currentUser?: {
    firstName: string;
    initials: string;
    publicProfileUrl: string;
    avatarUrl?: string;
  };
  notifications?: readonly HeaderNotification[];
};

const guestNavigation = [
  { href: "/discover", label: "کشف تجربه‌ها", routeIds: ["discover"] },
  { href: "/insights", label: "بینش‌ها", routeIds: ["insights"] }
] as const;

const loggedInNavigation = [
  { href: "/discover", label: "کشف تجربه‌ها", routeIds: ["discover"] },
  { href: "/insights", label: "بینش‌ها", routeIds: ["insights"] },
  {
    href: "/conversations",
    label: "جلسه‌ها",
    routeIds: ["conversations", "conversationDetail", "proposeTimes", "selectTime", "checkout", "requestNew", "requests", "sessions", "actions"]
  }
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
  },
  notifications = []
}: HeaderProps) {
  const pathname = usePathname();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const notificationsTriggerRef = useRef<HTMLButtonElement | null>(null);
  const notificationsPopoverRef = useRef<HTMLDivElement | null>(null);
  const notificationsDrawerRef = useRef<HTMLDivElement | null>(null);
  const previousPathnameRef = useRef(pathname);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsDrawerOpen, setNotificationsDrawerOpen] = useState(false);
  const activeRouteId = getRouteIdByPathname(pathname);
  const isAuthenticated = authState === "authenticated";
  const navigation = isAuthenticated ? loggedInNavigation : guestNavigation;
  const showLoginCta = pathname !== "/login";
  const showRegisterCta = pathname !== "/register";
  const closeAccountMenu = useCallback(() => setAccountMenuOpen(false), []);
  const closeNotifications = useCallback(() => {
    setNotificationsOpen(false);
    setNotificationsDrawerOpen(false);
  }, []);
  const unreadCount = notifications.filter((notification) => notification.status === "unread").length;
  const recentNotifications = notifications.slice(0, 3);

  useClickOutside({
    refs: [triggerRef, menuRef],
    enabled: accountMenuOpen,
    onOutsideClick: closeAccountMenu
  });

  useClickOutside({
    refs: [notificationsTriggerRef, notificationsPopoverRef, notificationsDrawerRef],
    enabled: notificationsOpen || notificationsDrawerOpen,
    onOutsideClick: closeNotifications
  });

  useEffect(() => {
    if (previousPathnameRef.current === pathname) {
      return;
    }

    previousPathnameRef.current = pathname;

    if ((!accountMenuOpen && !notificationsOpen && !notificationsDrawerOpen) || typeof window === "undefined") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      closeAccountMenu();
      closeNotifications();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [accountMenuOpen, closeAccountMenu, closeNotifications, notificationsDrawerOpen, notificationsOpen, pathname]);

  useEffect(() => {
    if (!accountMenuOpen && !notificationsOpen && !notificationsDrawerOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeAccountMenu();
        closeNotifications();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [accountMenuOpen, closeAccountMenu, closeNotifications, notificationsDrawerOpen, notificationsOpen]);

  const routeIsActive = (routeIds: readonly string[]) => {
    return activeRouteId ? routeIds.includes(activeRouteId) : false;
  };

  return (
    <header className={styles.topbar}>
      <Link href="/discover" className={styles.brand} aria-label="Useravaa">
        <UseravaaLogo variant="primary" className={styles.logoDesktop} priority />
        <UseravaaLogo variant="wordmark" className={styles.logoCompact} priority />
        <UseravaaLogo variant="symbol" className={styles.logoSymbol} priority />
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
        <Link
          href="/guide"
          className={joinClasses(styles.utilityIconButton, routeIsActive(["guide"]) && styles.utilityIconActive)}
          aria-label="راهنما"
          title="راهنما"
        >
          <UseravaaIcon name="help" size={18} aria-hidden />
        </Link>
        {isAuthenticated ? (
          <>
            <div className={styles.notificationsMenu}>
              <button
                ref={notificationsTriggerRef}
                type="button"
                className={styles.utilityIconButton}
                aria-label="اعلان‌ها"
                title="اعلان‌ها"
                aria-haspopup="dialog"
                aria-expanded={notificationsOpen}
                aria-controls="notifications-popover"
                onClick={() => {
                  setNotificationsOpen((open) => !open);
                  setNotificationsDrawerOpen(false);
                  setAccountMenuOpen(false);
                }}
              >
                <UseravaaIcon name="notification" size={18} aria-hidden />
                {unreadCount > 0 ? <span className={styles.unreadDot} aria-hidden="true" /> : null}
              </button>
              <div
                ref={notificationsPopoverRef}
                className={styles.notificationsPopover}
                id="notifications-popover"
                role="dialog"
                aria-label="اعلان‌ها"
                hidden={!notificationsOpen}
              >
                <div className={styles.notificationsHead}>
                  <strong>اعلان‌ها</strong>
                  {unreadCount > 0 ? <span>{unreadCount} اعلان خوانده‌نشده</span> : null}
                </div>
                {notifications.length > 0 ? (
                  <div className={styles.notificationsList}>
                    {recentNotifications.map((notification) => (
                      <a key={notification.id} href={notification.href} className={styles.notificationItem} onClick={closeNotifications}>
                        <span className={joinClasses(styles.notificationStatus, notification.status === "unread" && styles.notificationStatusUnread)} />
                        <span>
                          <strong>{notification.title}</strong>
                          <small>{notification.body}</small>
                          <em>{notification.timeLabel}</em>
                        </span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className={styles.notificationsEmpty}>
                    <strong>اعلانی ندارید</strong>
                    <p>وقتی وضعیت درخواست‌ها یا جلسه‌های شما تغییر کند، اینجا نمایش داده می‌شود.</p>
                  </div>
                )}
                {notifications.length > 3 ? (
                  <button type="button" className={styles.notificationsMore} onClick={() => setNotificationsDrawerOpen(true)}>
                    مشاهده همه اعلان‌ها
                  </button>
                ) : null}
              </div>
              <div
                ref={notificationsDrawerRef}
                className={styles.notificationsDrawer}
                role="dialog"
                aria-label="همه اعلان‌ها"
                hidden={!notificationsDrawerOpen}
              >
                <div className={styles.notificationsHead}>
                  <strong>اعلان‌ها</strong>
                  <button type="button" className={styles.drawerClose} aria-label="بستن اعلان‌ها" onClick={closeNotifications}>
                    <UseravaaIcon name="close" size={16} aria-hidden />
                  </button>
                </div>
                <div className={styles.notificationsList}>
                  {notifications.map((notification) => (
                    <a key={notification.id} href={notification.href} className={styles.notificationItem} onClick={closeNotifications}>
                      <span className={joinClasses(styles.notificationStatus, notification.status === "unread" && styles.notificationStatusUnread)} />
                      <span>
                        <strong>{notification.title}</strong>
                        <small>{notification.body}</small>
                        <em>{notification.timeLabel}</em>
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
            <div className={styles.accountMenu}>
            <button
              ref={triggerRef}
              className={styles.accountTrigger}
              type="button"
              aria-haspopup="menu"
              aria-expanded={accountMenuOpen}
              aria-controls="account-menu"
              onClick={() => setAccountMenuOpen((open) => !open)}
            >
              <Avatar src={currentUser.avatarUrl} alt="" size="xs" className={styles.accountAvatar} />
              <span className="button-label">{currentUser.firstName}</span>
              <UseravaaIcon name="dropdown" size={16} aria-hidden />
            </button>
            <div ref={menuRef} className={styles.accountDropdown} id="account-menu" role="menu" hidden={!accountMenuOpen}>
              <div className={styles.accountDropdownProfile}>
                <Avatar src={currentUser.avatarUrl} alt={`تصویر پروفایل ${currentUser.firstName}`} size="sm" />
                <strong>{currentUser.firstName}</strong>
              </div>
              <Link href="/profile" role="menuitem" onClick={closeAccountMenu}>
                <InlineIconText icon="profile">پروفایل من</InlineIconText>
              </Link>
              <Link href="/saved" role="menuitem" onClick={closeAccountMenu}>
                <InlineIconText icon="save">ذخیره‌شده‌ها</InlineIconText>
              </Link>
              <Link href="/settings" role="menuitem" onClick={closeAccountMenu}>
                <InlineIconText icon="settings">تنظیمات حساب</InlineIconText>
              </Link>
              <Link href="/wallet" role="menuitem" onClick={closeAccountMenu}>
                <InlineIconText icon="wallet">کیف پول</InlineIconText>
              </Link>
              <Link href="/support" role="menuitem" aria-label="پشتیبانی" onClick={closeAccountMenu}>
                <InlineIconText icon="help">پشتیبانی</InlineIconText>
              </Link>
              <button type="button" role="menuitem" onClick={closeAccountMenu}>
                <InlineIconText icon="logout">خروج از حساب کاربری</InlineIconText>
              </button>
            </div>
          </div>
          </>
        ) : (
          <>
            {showLoginCta ? (
              <Link className={joinClasses(styles.authLink, styles.loginLink)} href="/login">
                <span className="button-label">ورود</span>
              </Link>
            ) : null}
            {showRegisterCta ? (
              <Link className={joinClasses(styles.authLink, styles.registerLink)} href="/register">
                <span className="button-label">شروع کنید</span>
              </Link>
            ) : null}
          </>
        )}
      </nav>
    </header>
  );
}
