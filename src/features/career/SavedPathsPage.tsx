"use client";

import Link from "next/link";
import { Bookmark } from "./CareerIcons";
import { visibleCareerCards } from "./career-data";
import { CareerSaveButton } from "./CareerSaveButton";
import { SoftChevronIcon } from "./CareerSoftIcons";
import { getDisplayLabel } from "./PathsPage";
import { useSavedCareerPaths } from "./career-saved-paths";
import { getCareerDisplaySubtitle, getCareerDisplayTitle } from "./career-utils";
import styles from "./CareerPages.module.css";

type SavedPathsListProps = Readonly<{
  savedCardIds: ReadonlySet<string>;
  hasLoaded: boolean;
  onToggleSaved: (cardId: string) => void;
}>;

export function SavedPathsList({ savedCardIds, hasLoaded, onToggleSaved }: SavedPathsListProps) {
  if (!hasLoaded) return null;

  const savedCards = visibleCareerCards.filter((card) => savedCardIds.has(card.id));

  if (!savedCards.length) {
    return (
      <div className={styles.savedEmpty} aria-live="polite">
        <span className={styles.savedEmptyIcon} aria-hidden><Bookmark size={28} weight="fill" /></span>
        <h2>هنوز مسیر شغلی‌ای ذخیره نکرده‌ای</h2>
        <p>مسیرهای شغلی موردنظرت را ذخیره کن تا بعداً راحت‌تر به آن‌ها برگردی و بیشتر بررسی‌شان کنی.</p>
        <Link href="/" className={styles.savedEmptyAction}>مشاهده مسیرهای شغلی</Link>
      </div>
    );
  }

  return (
    <div className={styles.savedPathList}>
      {savedCards.map((card) => (
        <article className={styles.savedPathItem} key={card.id}>
          <Link href={`/?card=${encodeURIComponent(card.id)}`} className={styles.savedPathLink}>
            <span className={styles.savedPathHierarchy}>
              {getDisplayLabel(card.domain)} <SoftChevronIcon size={13} />
              {getDisplayLabel(card.generalCategory)} <SoftChevronIcon size={13} />
              <strong dir="auto">{getDisplayLabel(card.subfamily)}</strong>
            </span>
            <h2 dir="auto">{getCareerDisplayTitle(card.title)}</h2>
            <p dir="auto">{getCareerDisplaySubtitle(card.subtitle)}</p>
            <span className={styles.savedPathOpen}>مشاهده مسیر شغلی <SoftChevronIcon size={15} /></span>
          </Link>
          <CareerSaveButton saved onToggle={() => onToggleSaved(card.id)} />
        </article>
      ))}
    </div>
  );
}

export function SavedPathsPage() {
  const { savedCardIds, hasLoadedSavedPaths, toggleSavedPath } = useSavedCareerPaths();

  return (
    <section className={styles.careerPathsPage} aria-labelledby="career-saved-title" aria-busy={!hasLoadedSavedPaths}>
      <div className={styles.pageHeading}>
        <h1 id="career-saved-title">مسیرهای شغلی ذخیره‌شده</h1>
        <p>مسیرهای شغلی‌ای که برای بررسی بیشتر ذخیره کرده‌ای.</p>
      </div>
      <SavedPathsList savedCardIds={savedCardIds} hasLoaded={hasLoadedSavedPaths} onToggleSaved={toggleSavedPath} />
    </section>
  );
}
