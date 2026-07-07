"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CompareTabIcon, PathsTabIcon, SavedTabIcon } from "./CareerSoftIcons";
import styles from "./CareerShell.module.css";

export const navigationItems = [
  { href: "/career", label: "مسیرها", icon: PathsTabIcon },
  { href: "/career/compare", label: "مقایسه", icon: CompareTabIcon },
  { href: "/career/my-paths", label: "مسیرهای من", icon: SavedTabIcon }
] as const;

export type CareerTabHref = (typeof navigationItems)[number]["href"];

type CareerBottomNavProps = Readonly<{
  onResetActiveTab: (href: CareerTabHref) => void;
}>;

export function isCareerTabActive(pathname: string, href: CareerTabHref): boolean {
  if (href === "/career") return pathname === "/" || pathname === "/career";
  return pathname === href;
}

export function getCareerTabClickAction(pathname: string, href: CareerTabHref) {
  return isCareerTabActive(pathname, href) ? "reset" : "navigate";
}

export function CareerBottomNav({ onResetActiveTab }: CareerBottomNavProps) {
  const pathname = usePathname();

  return (
    <nav className={styles.bottomNav} aria-label="ناوبری مسیرهای شغلی">
      {navigationItems.map((item) => {
        const isActive = isCareerTabActive(pathname, item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={isActive ? styles.navItemActive : styles.navItem}
            aria-current={isActive ? "page" : undefined}
            onClick={(event) => {
              if (getCareerTabClickAction(pathname, item.href) !== "reset") return;

              event.preventDefault();
              onResetActiveTab(item.href);
            }}
          >
            <span className={styles.navIcon} aria-hidden><Icon size={22} /></span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
