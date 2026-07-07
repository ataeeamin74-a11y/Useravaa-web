"use client";

import Link from "next/link";
import { Bookmark, GitCompareArrows, Route } from "lucide-react";
import { SoftChevronIcon } from "./CareerSoftIcons";
import { getDisplayLabel } from "./PathsPage";
import {
  getCareerPathById,
  getCareerPathDetailHref
} from "./career-path-index";
import {
  useSavedCareerComparisons,
  type SavedCareerComparison
} from "./career-saved-comparisons";
import { useSavedCareerPaths } from "./career-saved-paths";
import styles from "./MyPathsPage.module.css";

type MyPathsContentProps = Readonly<{
  savedPathIds: ReadonlySet<string>;
  savedComparisons: readonly SavedCareerComparison[];
  hasLoaded: boolean;
}>;

function getComparisonHref(pathIds: readonly string[]): string {
  const params = new URLSearchParams();
  pathIds.forEach((pathId) => params.append("path", pathId));
  return `/career/compare?${params.toString()}`;
}

export function MyPathsContent({
  savedPathIds,
  savedComparisons,
  hasLoaded
}: MyPathsContentProps) {
  if (!hasLoaded) return <div className={styles.loadingState}>در حال آماده‌سازی مسیرهای تو...</div>;

  const savedPaths = [...savedPathIds].flatMap((pathId) => {
    const path = getCareerPathById(pathId);
    return path ? [path] : [];
  });
  const comparisons = savedComparisons.flatMap((pathIds) => {
    const paths = pathIds.flatMap((pathId) => {
      const path = getCareerPathById(pathId);
      return path ? [path] : [];
    });
    return paths.length >= 2 ? [{ pathIds, paths }] : [];
  });

  if (!savedPaths.length && !comparisons.length) {
    return (
      <div className={styles.emptyState} aria-live="polite">
        <span aria-hidden><Route size={27} /></span>
        <h2>هنوز مسیری اضافه نکردی</h2>
        <p>مسیرهایی که برای بررسی نگه می‌داری اینجا می‌آیند.</p>
        <Link href="/career">دیدن مسیرها</Link>
      </div>
    );
  }

  return (
    <div className={styles.sections}>
      <section aria-labelledby="saved-career-paths-title">
        <div className={styles.sectionHeading}>
          <Bookmark size={19} aria-hidden />
          <h2 id="saved-career-paths-title">مسیرهای ذخیره‌شده</h2>
        </div>
        {savedPaths.length ? (
          <div className={styles.cardList}>
            {savedPaths.map((path) => (
              <Link className={styles.savedCard} href={getCareerPathDetailHref(path)} key={path.id}>
                <span className={styles.cardMeta}>{getDisplayLabel(path.domain)}</span>
                <strong dir="auto">{getDisplayLabel(path.name)}</strong>
                <span className={styles.openLabel}>دیدن مسیر <SoftChevronIcon size={15} /></span>
              </Link>
            ))}
          </div>
        ) : <p className={styles.sectionEmpty}>هنوز مسیری اضافه نکردی</p>}
      </section>

      <section aria-labelledby="saved-comparisons-title">
        <div className={styles.sectionHeading}>
          <GitCompareArrows size={19} aria-hidden />
          <h2 id="saved-comparisons-title">مقایسه‌های ذخیره‌شده</h2>
        </div>
        {comparisons.length ? (
          <div className={styles.cardList}>
            {comparisons.map(({ pathIds, paths }) => (
              <Link
                className={styles.comparisonCard}
                href={getComparisonHref(pathIds)}
                key={pathIds.join("::")}
              >
                <span className={styles.cardMeta}>مقایسه {paths.length.toLocaleString("fa-IR")} مسیر</span>
                <strong>{paths.map((path) => getDisplayLabel(path.name)).join(" و ")}</strong>
                <span className={styles.openLabel}>دیدن مقایسه <SoftChevronIcon size={15} /></span>
              </Link>
            ))}
          </div>
        ) : <p className={styles.sectionEmpty}>هنوز مقایسه‌ای ذخیره نکردی</p>}
      </section>
    </div>
  );
}

export function MyPathsPage() {
  const { savedPathIds, hasLoadedSavedPaths } = useSavedCareerPaths();
  const { savedComparisons, hasLoadedSavedComparisons } = useSavedCareerComparisons();

  return (
    <section className={styles.page} data-career-paths aria-labelledby="my-career-paths-title">
      <div className={styles.pageHeading}>
        <h1 id="my-career-paths-title">مسیرهای من</h1>
        <p>مسیرها و مقایسه‌هایی که برای بررسی بیشتر نگه داشته‌ای.</p>
      </div>
      <MyPathsContent
        savedPathIds={savedPathIds}
        savedComparisons={savedComparisons}
        hasLoaded={hasLoadedSavedPaths && hasLoadedSavedComparisons}
      />
    </section>
  );
}
