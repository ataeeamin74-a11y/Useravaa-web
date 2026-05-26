import { createEmptyTimelineItem, getTimelineCoverageWarning, validateExperienceTimeline, type ExperienceTimelineItem } from "@/features/v51/data/experience-timeline";
import { UseravaaIcon } from "@/components/ui/UseravaaIcon";
import { V51Button } from "@/features/v51/components/V51Button";
import { ExperienceTimelineItemForm } from "./ExperienceTimelineItemForm";
import { ExperienceTimelineSummary } from "./ExperienceTimelineSummary";
import styles from "./MyProfile.module.css";

type ExperienceTimelineEditorProps = Readonly<{
  items: ExperienceTimelineItem[];
  claimedYears: number;
  showErrors: boolean;
  onChange: (items: ExperienceTimelineItem[]) => void;
}>;

export function ExperienceTimelineEditor({ items, claimedYears, showErrors, onChange }: ExperienceTimelineEditorProps) {
  const itemErrors = validateExperienceTimeline(items);
  const warning = getTimelineCoverageWarning(items, claimedYears);

  const updateItem = (index: number, nextItem: ExperienceTimelineItem) => {
    onChange(items.map((item, currentIndex) => (currentIndex === index ? nextItem : item)));
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, currentIndex) => currentIndex !== index));
  };

  const addItem = () => {
    onChange([...items, createEmptyTimelineItem(items.length + 1)]);
  };

  return (
    <div className={styles.timelineEditor}>
      <ExperienceTimelineSummary items={items} warning={warning} />
      {items.length ? (
        <div className={styles.timelineList}>
          {items.map((item, index) => (
            <ExperienceTimelineItemForm
              key={item.id}
              item={item}
              index={index}
              errors={showErrors ? itemErrors[index] ?? {} : {}}
              onChange={(nextItem) => updateItem(index, nextItem)}
              onRemove={() => removeItem(index)}
            />
          ))}
        </div>
      ) : (
        <div className={styles.empty}>هنوز سابقه‌ای وارد نکرده‌اید.</div>
      )}
      <div className={styles.timelineActions}>
        <V51Button type="button" onClick={addItem}>
          <UseravaaIcon name="add" size={16} aria-hidden="true" />
          افزودن سابقه
        </V51Button>
      </div>
    </div>
  );
}
