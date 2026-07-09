"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bookmark, GitCompareArrows, Route } from "lucide-react";
import { SoftChevronIcon } from "./CareerSoftIcons";
import { getDisplayLabel } from "./PathsPage";
import { trackCareerEvent } from "./career-events";
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
  onRemovePath?: (pathId: string) => boolean;
  onRemoveComparison?: (pathIds: readonly string[]) => boolean;
}>;

function getComparisonHref(pathIds: readonly string[]): string {
  const params = new URLSearchParams();
  pathIds.forEach((pathId) => params.append("path", pathId));
  return `/career/compare?${params.toString()}`;
}

export function MyPathsContent({
  savedPathIds,
  savedComparisons,
  hasLoaded,
  onRemovePath = () => false,
  onRemoveComparison = () => false
}: MyPathsContentProps) {
  const [expandedSectionIds, setExpandedSectionIds] = useState<ReadonlySet<string>>(() => new Set());

  function toggleSection(sectionId: string) {
    setExpandedSectionIds((currentSectionIds) => {
      const nextSectionIds = new Set(currentSectionIds);
      if (nextSectionIds.has(sectionId)) nextSectionIds.delete(sectionId);
      else nextSectionIds.add(sectionId);
      return nextSectionIds;
    });
  }

  if (!hasLoaded) return <div className={styles.loadingState}>در حال آماده‌سازی مسیرهای شغلی تو...</div>;

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
  const savedPathsExpanded = expandedSectionIds.has("saved-paths");
  const savedComparisonsExpanded = expandedSectionIds.has("saved-comparisons");

  return (
    <div className={styles.sections}>
      <section className={styles.accordionSection} aria-labelledby="saved-career-paths-title">
        <button
          type="button"
          className={styles.accordionTrigger}
          aria-expanded={savedPathsExpanded}
          aria-controls="saved-career-paths-panel"
          onClick={() => toggleSection("saved-paths")}
        >
          <span className={styles.sectionHeading}>
            <Bookmark size={19} strokeWidth={1.9} aria-hidden />
            <span id="saved-career-paths-title">مسیرهای شغلی ذخیره‌شده</span>
          </span>
          <span className={styles.sectionCount}>{savedPaths.length.toLocaleString("fa-IR")}</span>
          <SoftChevronIcon className={savedPathsExpanded ? styles.accordionIconExpanded : styles.accordionIcon} size={17} />
        </button>
        <div
          id="saved-career-paths-panel"
          className={styles.sectionPanel}
          hidden={!savedPathsExpanded}
        >
          <div className={styles.sectionTools}>
            <Link href="/career">افزودن مسیر شغلی</Link>
          </div>
          {savedPaths.length ? (
            <div className={styles.cardList}>
              {savedPaths.map((path) => (
                <article className={styles.savedCard} key={path.id}>
                  <span className={styles.cardMeta}>{getDisplayLabel(path.domain)}</span>
                  <strong dir="auto">{getDisplayLabel(path.name)}</strong>
                  <div className={styles.cardActions}>
                    <Link className={styles.primaryAction} href={getCareerPathDetailHref(path)}>
                      دیدن مسیر شغلی <SoftChevronIcon size={15} />
                    </Link>
                    <button type="button" className={styles.deleteAction} onClick={() => onRemovePath(path.id)}>
                      حذف
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className={styles.sectionEmptyState} aria-live="polite">
              <span aria-hidden><Route size={26} strokeWidth={1.9} /></span>
              <h3>هنوز مسیر شغلی‌ای اضافه نکردی</h3>
              <p>مسیرهای شغلی‌ای که برای بررسی نگه می‌داری اینجا می‌آیند.</p>
              <Link href="/career">افزودن مسیر شغلی</Link>
            </div>
          )}
        </div>
      </section>

      <section className={styles.accordionSection} aria-labelledby="saved-comparisons-title">
        <button
          type="button"
          className={styles.accordionTrigger}
          aria-expanded={savedComparisonsExpanded}
          aria-controls="saved-comparisons-panel"
          onClick={() => toggleSection("saved-comparisons")}
        >
          <span className={styles.sectionHeading}>
            <GitCompareArrows size={19} strokeWidth={1.9} aria-hidden />
            <span id="saved-comparisons-title">مقایسه‌های ذخیره‌شده</span>
          </span>
          <span className={styles.sectionCount}>{comparisons.length.toLocaleString("fa-IR")}</span>
          <SoftChevronIcon className={savedComparisonsExpanded ? styles.accordionIconExpanded : styles.accordionIcon} size={17} />
        </button>
        <div
          id="saved-comparisons-panel"
          className={styles.sectionPanel}
          hidden={!savedComparisonsExpanded}
        >
          <div className={styles.sectionTools}>
            <Link href="/career/compare">ساخت مقایسه جدید</Link>
          </div>
          {comparisons.length ? (
            <div className={styles.cardList}>
              {comparisons.map(({ pathIds, paths }) => (
                <article className={styles.comparisonCard} key={pathIds.join("::")}>
                  <span className={styles.cardMeta}>مقایسه {paths.length.toLocaleString("fa-IR")} مسیر شغلی</span>
                  <strong>{paths.map((path) => getDisplayLabel(path.name)).join(" و ")}</strong>
                  <div className={styles.cardActions}>
                    <Link className={styles.primaryAction} href={getComparisonHref(pathIds)}>
                      دیدن مقایسه <SoftChevronIcon size={15} />
                    </Link>
                    <button type="button" className={styles.deleteAction} onClick={() => onRemoveComparison(pathIds)}>
                      حذف
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className={styles.sectionEmptyState} aria-live="polite">
              <span aria-hidden><GitCompareArrows size={26} strokeWidth={1.9} /></span>
              <h3>هنوز مقایسه‌ای ذخیره نکردی</h3>
              <p>مقایسه‌های شغلی‌ای که ذخیره می‌کنی اینجا می‌آیند.</p>
              <Link href="/career/compare">ساخت مقایسه جدید</Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export function MyPathsPage() {
  const { savedPathIds, hasLoadedSavedPaths, removePath } = useSavedCareerPaths();
  const { savedComparisons, hasLoadedSavedComparisons, removeComparison } = useSavedCareerComparisons();
  const hasLoaded = hasLoadedSavedPaths && hasLoadedSavedComparisons;

  useEffect(() => {
    if (!hasLoaded) return;
    trackCareerEvent("career_my_paths_viewed", {
      savedPathCount: savedPathIds.size,
      savedComparisonCount: savedComparisons.length
    });
  }, [hasLoaded, savedComparisons.length, savedPathIds.size]);

  return (
    <section className={styles.page} data-career-paths aria-labelledby="my-career-paths-title">
      <div className={styles.pageHeading}>
        <h1 id="my-career-paths-title">مسیرهای شغلی من</h1>
        <p>مسیرهای شغلی و مقایسه‌هایی که برای بررسی بیشتر نگه داشته‌ای.</p>
      </div>
      <MyPathsContent
        savedPathIds={savedPathIds}
        savedComparisons={savedComparisons}
        hasLoaded={hasLoaded}
        onRemovePath={removePath}
        onRemoveComparison={removeComparison}
      />
    </section>
  );
}
