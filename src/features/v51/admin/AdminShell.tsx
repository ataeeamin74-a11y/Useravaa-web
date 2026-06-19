import Link from "next/link";
import type { ReactNode } from "react";
import type { Viewer } from "@/lib/auth/types";
import { adminNavigationGroups } from "./navigation";
import styles from "./AdminShell.module.css";

type AdminShellProps = Readonly<{
  viewer: Viewer;
  children: ReactNode;
}>;

function roleLabel(role: Viewer["role"]) {
  if (role === "ADMIN") {
    return "مدیر";
  }

  if (role === "SUPPORT") {
    return "پشتیبانی";
  }

  return "کاربر";
}

export function AdminShell({ viewer, children }: AdminShellProps) {
  const displayName = viewer.displayName?.trim() || "اپراتور";

  return (
    <section className={styles.shell} aria-label="پنل عملیات یوزراوا">
      <aside className={styles.sidebar} aria-label="ناوبری پنل عملیات">
        <div className={styles.brandBlock}>
          <Link href="/admin" className={styles.brandLink}>
            <span className={styles.brandMark} aria-hidden="true">
              U
            </span>
            <span>
              <strong>Admin Ops</strong>
              <small>یوزراوا</small>
            </span>
          </Link>
        </div>

        <nav className={styles.navigation}>
          {adminNavigationGroups.map((group) => (
            <section className={styles.navGroup} key={group.title}>
              <h2>{group.title}</h2>
              <div className={styles.navItems}>
                {group.items.map((item) =>
                  "href" in item && item.href ? (
                    <Link className={styles.navLink} href={item.href} key={item.label}>
                      <span>{item.label}</span>
                      <small>{item.description}</small>
                    </Link>
                  ) : (
                    <span className={styles.navDisabled} aria-disabled="true" key={item.label}>
                      <span>{item.label}</span>
                      <small>{item.description}</small>
                    </span>
                  )
                )}
              </div>
            </section>
          ))}
        </nav>
      </aside>

      <div className={styles.workspace}>
        <header className={styles.topbar}>
          <div>
            <p className={styles.breadcrumb}>پنل عملیات / نمای محافظت‌شده</p>
            <h1>مرکز عملیات یوزراوا</h1>
          </div>
          <div className={styles.identity} aria-label="هویت اپراتور فعلی">
            <span>{displayName.slice(0, 1)}</span>
            <div>
              <strong>{displayName}</strong>
              <small>
                {roleLabel(viewer.role)} · <span dir="ltr">{viewer.id}</span>
              </small>
            </div>
          </div>
        </header>

        <div className={styles.content}>{children}</div>
      </div>
    </section>
  );
}
