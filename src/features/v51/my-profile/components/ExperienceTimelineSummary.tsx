import { formatter } from "@/features/v51/data/profiles";
import { summarizeTimelineItem, timelineCoverageYears, type ExperienceTimelineItem } from "@/features/v51/data/experience-timeline";
import styles from "./MyProfile.module.css";

type ExperienceTimelineSummaryProps = Readonly<{
  items: readonly ExperienceTimelineItem[];
  warning?: string;
}>;

export function ExperienceTimelineSummary({ items, warning }: ExperienceTimelineSummaryProps) {
  return (
    <div className={styles.timelineSummary}>
      <b>پوشش سوابق</b>
      <span>{formatter.format(Math.round(timelineCoverageYears(items)))} سال ثبت شده</span>
      {items.length ? (
        <small>{items.map(summarizeTimelineItem).join(" | ")}</small>
      ) : (
        <small>هنوز سابقه‌ای وارد نکرده‌اید.</small>
      )}
      {warning ? <p>{warning}</p> : null}
    </div>
  );
}
