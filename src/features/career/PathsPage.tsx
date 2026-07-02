"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { careerDomains, careerPaths } from "./career-data";
import styles from "./CareerPages.module.css";

export function PathsPage() {
  const [activeDomainId, setActiveDomainId] = useState(careerDomains[0].id);
  const [query, setQuery] = useState("");

  return (
    <section aria-labelledby="career-paths-title">
      <div className={styles.pageHeading}>
        <h1 id="career-paths-title">مسیر مناسب خودت را پیدا کن</h1>
        <p>مسیرهای شغلی را جست‌وجو کن و براساس حوزه‌ای که به آن فکر می‌کنی جلو برو.</p>
      </div>

      <label className={styles.searchField}>
        <Search size={20} strokeWidth={2} aria-hidden />
        <span className={styles.srOnly}>جست‌وجوی مسیر شغلی</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="جست‌وجوی مسیر شغلی"
        />
      </label>

      <div className={styles.chipScroller} aria-label="حوزه‌های شغلی">
        {careerDomains.map((domain) => {
          const isActive = domain.id === activeDomainId;

          return (
            <button
              key={domain.id}
              type="button"
              className={isActive ? styles.chipActive : styles.chip}
              aria-pressed={isActive}
              onClick={() => setActiveDomainId(domain.id)}
            >
              {domain.label}
            </button>
          );
        })}
      </div>

      <section className={styles.listArea} aria-labelledby="paths-list-title">
        <div className={styles.listHeading}>
          <h2 id="paths-list-title">مسیرهای شغلی</h2>
          <span>{careerPaths.length.toLocaleString("fa-IR")} مسیر</span>
        </div>
        <div className={styles.emptyState} aria-live="polite">
          <div className={styles.emptyMark} aria-hidden>
            <span />
            <span />
            <span />
          </div>
          <h3>کارت‌های مسیر به‌زودی اینجا قرار می‌گیرند</h3>
          <p>ساختار صفحه آماده است و داده‌های واقعی در مرحله بعد متصل می‌شوند.</p>
        </div>
      </section>
    </section>
  );
}
