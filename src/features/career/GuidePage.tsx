import { BriefcaseBusiness, ChevronLeft, FileText, GraduationCap, Route } from "lucide-react";
import { guideCategories, type GuideCategory } from "./career-data";
import styles from "./CareerPages.module.css";

const categoryIcons: Record<GuideCategory["id"], typeof Route> = {
  "career-choice": Route,
  resume: FileText,
  interview: BriefcaseBusiness,
  "specialized-learning": GraduationCap
};

export function GuidePage() {
  return (
    <section aria-labelledby="career-guide-title">
      <div className={styles.pageHeading}>
        <h1 id="career-guide-title">راهنما برای قدم بعدی</h1>
        <p>راهنمای کوتاه و کاربردی برای تصمیم‌های مهم مسیر حرفه‌ای.</p>
      </div>

      <div className={styles.guideList}>
        {guideCategories.map((category) => {
          const Icon = categoryIcons[category.id];

          return (
            <article className={styles.guideItem} key={category.id}>
              <span className={styles.guideIcon} aria-hidden>
                <Icon size={23} strokeWidth={1.9} />
              </span>
              <div>
                <h2>{category.title}</h2>
                <p>{category.description}</p>
              </div>
              <ChevronLeft className={styles.guideChevron} size={21} aria-hidden />
            </article>
          );
        })}
      </div>
    </section>
  );
}
