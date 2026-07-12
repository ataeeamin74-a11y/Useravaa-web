import Link from "next/link";
import { ChevronLeft, Route } from "lucide-react";
import type { CareerPathSeoEntry } from "@/features/career/career-path-seo";
import {
  buildCareerPathTitle,
  getRelatedCareerPathSeoEntries
} from "@/features/career/career-path-seo";
import styles from "./CareerPathSeoPage.module.css";

function getEnglishTitle(entry: CareerPathSeoEntry) {
  const title = entry.path.midCategory.trim();
  const primaryTitle = entry.path.name.trim();

  if (!/[a-z]/iu.test(title) || title.toLocaleLowerCase() === primaryTitle.toLocaleLowerCase()) {
    return null;
  }

  return title;
}

export function CareerPathRelatedPaths({ entry }: Readonly<{ entry: CareerPathSeoEntry }>) {
  const relatedEntries = getRelatedCareerPathSeoEntries(entry.path);

  if (!relatedEntries.length) return null;

  return (
    <section
      className={`${styles.section} ${styles.relatedSection}`}
      data-career-related-paths-section
      aria-labelledby="career-path-related-title"
    >
      <div className={styles.relatedHeading}>
        <span className={styles.relatedHeadingIcon} aria-hidden="true">
          <Route size={17} strokeWidth={2.4} />
        </span>
        <h2 id="career-path-related-title">مسیرهای مشابه</h2>
      </div>

      <nav className={styles.relatedPathList} aria-label="مسیرهای مشابه">
        {relatedEntries.map((relatedEntry) => {
          const englishTitle = getEnglishTitle(relatedEntry);

          return (
            <Link
              className={styles.relatedPathRow}
              href={relatedEntry.pageHref}
              data-career-related-path-row
              key={relatedEntry.path.id}
            >
              <span className={styles.relatedPathTitles}>
                <strong dir="auto">{buildCareerPathTitle(relatedEntry.path)}</strong>
                {englishTitle ? <small dir="ltr">{englishTitle}</small> : null}
              </span>
              <ChevronLeft className={styles.relatedPathArrow} size={20} strokeWidth={2.4} aria-hidden="true" />
            </Link>
          );
        })}
      </nav>
    </section>
  );
}
