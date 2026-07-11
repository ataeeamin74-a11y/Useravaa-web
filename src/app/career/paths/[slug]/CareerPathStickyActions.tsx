"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookmarkPlus, GitCompareArrows } from "lucide-react";
import styles from "./CareerPathSeoPage.module.css";

export function CareerPathStickyActions({
  saveHref,
  compareHref,
  saveLabel
}: Readonly<{
  saveHref: string;
  compareHref: string;
  saveLabel: string;
}>) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hero = document.querySelector<HTMLElement>("[data-career-product-hero]");
    if (!hero || !("IntersectionObserver" in window)) return undefined;

    const observer = new IntersectionObserver(([entry]) => {
      setIsVisible(!entry.isIntersecting);
    }, { rootMargin: "-72px 0px 0px", threshold: 0.05 });

    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  return (
    <aside
      className={`${styles.stickyBar} ${isVisible ? styles.stickyBarVisible : ""}`}
      aria-label="اقدام سریع مسیر شغلی"
      aria-hidden={isVisible ? undefined : "true"}
      data-visible={isVisible ? "true" : "false"}
    >
      <Link className={styles.primaryAction} href={saveHref} tabIndex={isVisible ? undefined : -1}>
        <BookmarkPlus className={styles.actionIcon} size={18} strokeWidth={2.5} aria-hidden="true" />
        <span>{saveLabel}</span>
      </Link>
      <Link className={styles.secondaryAction} href={compareHref} tabIndex={isVisible ? undefined : -1}>
        <GitCompareArrows className={styles.actionIcon} size={18} strokeWidth={2.5} aria-hidden="true" />
        <span>مقایسه</span>
      </Link>
    </aside>
  );
}
