"use client";

import { useMemo, useState } from "react";
import { SUPPORT_MAILTO } from "@/lib/support";
import { filterSupportFaqItems, supportFaqItems, supportFaqNoResults } from "./supportFaqData";
import styles from "./SupportFaq.module.css";

const SEARCH_LABEL = "جستجو در سوالات متداول";

export function SupportFaqClient() {
  const [query, setQuery] = useState("");
  const [openItems, setOpenItems] = useState<Set<string>>(() => new Set());
  const visibleItems = useMemo(() => filterSupportFaqItems(supportFaqItems, query), [query]);

  function toggleItem(id: string) {
    setOpenItems((current) => {
      const next = new Set(current);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  }

  return (
    <section className={styles.faqSection} aria-labelledby="support-faq-title">
      <header className={styles.sectionHeader}>
        <h2 id="support-faq-title">سوالات متداول</h2>
        <p>پاسخ سوالات رایج درباره درخواست جلسه، پرداخت، زمان‌های پیشنهادی، برگزاری جلسه و پروفایل را اینجا ببینید.</p>
      </header>

      <div className={styles.searchCard}>
        <label className={styles.searchLabel} htmlFor="support-faq-search">
          {SEARCH_LABEL}
        </label>
        <div className={styles.searchField}>
          <span className={styles.searchIcon} aria-hidden="true" />
          <input
            id="support-faq-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="مثلاً پرداخت، زمان پیشنهادی، کد تأیید برگزاری، کیف پول"
          />
        </div>
      </div>

      {visibleItems.length > 0 ? (
        <div className={styles.accordion} data-faq-count={visibleItems.length}>
          {visibleItems.map((item) => {
            const isOpen = openItems.has(item.id);
            const answerId = `support-faq-answer-${item.id}`;

            return (
              <article className={styles.faqItem} key={item.id}>
                <button
                  type="button"
                  className={styles.questionButton}
                  aria-expanded={isOpen}
                  aria-controls={answerId}
                  onClick={() => toggleItem(item.id)}
                >
                  <span className={styles.questionText}>
                    <span className={styles.category}>{item.category}</span>
                    <span>{item.question}</span>
                  </span>
                  <span className={isOpen ? styles.indicatorOpen : styles.indicator} aria-hidden="true" />
                </button>
                <div id={answerId} className={styles.answerPanel} hidden={!isOpen}>
                  <p>{item.answer}</p>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className={styles.noResults} role="status">
          <h3>{supportFaqNoResults.title}</h3>
          <p>{supportFaqNoResults.text}</p>
          <a className="ua-button" href={SUPPORT_MAILTO}>
            <span className="ua-button-label">{supportFaqNoResults.cta}</span>
          </a>
        </div>
      )}
    </section>
  );
}
