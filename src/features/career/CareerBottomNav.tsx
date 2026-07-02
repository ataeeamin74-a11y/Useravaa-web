"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Route, Scale } from "lucide-react";
import styles from "./CareerShell.module.css";

const navigationItems = [
  { href: "/career", label: "مسیرها", icon: Route },
  { href: "/career/compare", label: "مقایسه", icon: Scale },
  { href: "/career/guide", label: "راهنما", icon: Compass }
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
            <Icon size={21} strokeWidth={isActive ? 2.4 : 1.9} aria-hidden />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
