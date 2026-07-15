"use client";

import { useEffect, useState } from "react";
import { CareerPathCompareAction, CareerPathSaveAction } from "./CareerPathClientActions";
import styles from "./CareerPathSeoPage.module.css";

export function CareerPathStickyActions({
  pathId,
  slug,
  saveLabel
}: Readonly<{
  pathId: string;
  slug: string;
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
      <CareerPathSaveAction
        pathId={pathId}
        className={styles.primaryAction}
        label={saveLabel}
        compact
        tabIndex={isVisible ? undefined : -1}
      />
      <CareerPathCompareAction
        pathId={pathId}
        slug={slug}
        className={styles.secondaryAction}
        label="مقایسه"
        compact
        tabIndex={isVisible ? undefined : -1}
      />
    </aside>
  );
}
