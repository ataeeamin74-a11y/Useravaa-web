"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CompareTabIcon, PathsTabIcon, SavedTabIcon } from "./CareerSoftIcons";
import styles from "./CareerShell.module.css";

export const navigationItems = [
  { href: "/", label: "مسیرها", icon: PathsTabIcon },
  { href: "/career/compare", label: "مقایسه", icon: CompareTabIcon },
  { href: "/career/saved", label: "ذخیره‌شده‌ها", icon: SavedTabIcon }
] as const;

export function CareerBottomNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.bottomNav} aria-label="ناوبری مسیرهای شغلی">
      {navigationItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={isActive ? styles.navItemActive : styles.navItem}
            aria-current={isActive ? "page" : undefined}
          >
            <span className={styles.navIcon} aria-hidden><Icon size={22} /></span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
