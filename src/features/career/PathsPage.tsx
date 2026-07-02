"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { Bookmark, Search } from "lucide-react";
import { careerCards, careerDomains } from "./career-data";
import type { CareerCard } from "./career-types";
import { matchesCareerCard } from "./career-utils";
import styles from "./CareerPages.module.css";

type CareerPathCardProps = Readonly<{
  card: CareerCard;
  isSaved: boolean;
  onToggleSaved: (cardId: string) => void;
}>;

function CareerPathCard({ card, isSaved, onToggleSaved }: CareerPathCardProps) {
  const skillGroups = [
    { label: "مهارت‌های تخصصی", items: card.keyTechnicalSkills },
    { label: "ابزارها و تکنولوژی‌ها", items: card.keyTools },
    { label: "مهارت‌های نرم", items: card.keySoftSkills }
  ] as const;

  return (
    <article className={styles.careerCard}>
      <div className={styles.cardHeader}>
        <div>
          <p className={styles.cardDomain}>{card.domain}</p>
          <h3>{card.title}</h3>
          <p className={styles.cardSubtitle}>{card.subtitle}</p>
        </div>
        <button
          type="button"
          className={isSaved ? styles.bookmarkActive : styles.bookmark}
          aria-label={isSaved ? `حذف ${card.title} از ذخیره‌شده‌ها` : `ذخیره ${card.title}`}
          aria-pressed={isSaved}
          onClick={() => onToggleSaved(card.id)}
        >
          <Bookmark size={20} fill={isSaved ? "currentColor" : "none"} aria-hidden />
        </button>
      </div>

      <div className={styles.skillGroups}>
        {skillGroups.map((group) => (
          <section className={styles.skillGroup} key={group.label}>
            <h4>{group.label}</h4>
            <div className={styles.skillList}>
              {group.items.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}

export function PathsPage() {
  const [activeDomainId, setActiveDomainId] = useState(careerDomains[0].id);
  const [query, setQuery] = useState("");
  const [savedCardIds, setSavedCardIds] = useState<ReadonlySet<string>>(() => new Set());
  const deferredQuery = useDeferredValue(query);
  const filteredCards = useMemo(
    () => careerCards.filter((card) => matchesCareerCard(card, deferredQuery, activeDomainId)),
    [activeDomainId, deferredQuery]
  );

  function toggleSaved(cardId: string) {
    setSavedCardIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (nextIds.has(cardId)) {
        nextIds.delete(cardId);
      } else {
        nextIds.add(cardId);
      }

      return nextIds;
    });
  }

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
          <span aria-live="polite">{filteredCards.length.toLocaleString("fa-IR")} مسیر</span>
        </div>
        {filteredCards.length ? (
          <div className={styles.cardList}>
            {filteredCards.map((card) => (
              <CareerPathCard
                key={card.id}
                card={card}
                isSaved={savedCardIds.has(card.id)}
                onToggleSaved={toggleSaved}
              />
            ))}
          </div>
        ) : (
          <div className={styles.emptyState} aria-live="polite">
            <div className={styles.emptyMark} aria-hidden>
              <span />
              <span />
              <span />
            </div>
            <h3>مسیر شغلی مرتبطی پیدا نشد</h3>
            <p>عبارت جست‌وجو یا حوزه انتخاب‌شده را تغییر بده.</p>
          </div>
        )}
      </section>
    </section>
  );
}
