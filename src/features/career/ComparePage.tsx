import { Plus, Scale } from "lucide-react";
import { comparisonSections } from "./career-data";
import styles from "./CareerPages.module.css";

export function ComparePage() {
  return (
    <section aria-labelledby="career-compare-title">
      <div className={styles.pageHeading}>
        <h1 id="career-compare-title">دو مسیر را کنار هم ببین</h1>
        <p>دو مسیر شغلی را انتخاب کن تا تفاوت‌ها و بخش‌های مشترکشان روشن‌تر شوند.</p>
      </div>

      <div className={styles.selectorGrid}>
        {["اول", "دوم"].map((position) => (
          <label className={styles.selectorField} key={position}>
            <span>مسیر {position}</span>
            <div>
              <Plus size={19} aria-hidden />
              <select defaultValue="" aria-label={`انتخاب مسیر ${position}`}>
                <option value="">انتخاب مسیر {position}</option>
              </select>
            </div>
          </label>
        ))}
      </div>

      <div className={styles.compareIntro}>
        <Scale size={22} aria-hidden />
        <span>با انتخاب هر دو مسیر، نتیجه مقایسه در بخش‌های زیر نمایش داده می‌شود.</span>
      </div>

      <div className={styles.comparisonSections}>
        {comparisonSections.map((section) => (
          <section className={styles.comparisonSection} key={section}>
            <h2>{section}</h2>
            <div className={styles.comparisonPlaceholder} aria-hidden>
              <span />
              <span />
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}
