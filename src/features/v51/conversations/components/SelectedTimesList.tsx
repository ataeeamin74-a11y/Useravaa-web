import { UseravaaIcon } from "@/components/ui/UseravaaIcon";
import type { ProposedTime } from "@/features/v51/data/conversations";
import { formatFaNumber } from "@/lib/fa-format";
import styles from "./ConversationCluster.module.css";

type SelectedTimesListProps = {
  selectedTimes: readonly ProposedTime[];
  onRemove?: (time: ProposedTime) => void;
};

export function SelectedTimesList({ selectedTimes, onRemove }: SelectedTimesListProps) {
  return (
    <aside className={styles.panel}>
      <h2>زمان‌های انتخاب‌شده</h2>
      <span className={styles.badge}>{formatFaNumber(selectedTimes.length)} از {formatFaNumber(3)}</span>
      {selectedTimes.length > 0 ? (
        <div className={styles.selectedList} data-testid="selected-times-list">
          {selectedTimes.map((time) => (
            <div key={time.id} className={styles.selectedItem} data-testid="selected-time">
              <strong>
                {time.dateLabel}، {time.timeLabel}
              </strong>
              {onRemove ? (
                <button type="button" className={styles.removeButton} aria-label={`حذف ${time.dateLabel} ${time.timeLabel}`} onClick={() => onRemove(time)}>
                  <UseravaaIcon name="close" size={16} />
                </button>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <p className={styles.empty}>هنوز زمانی انتخاب نشده است.</p>
      )}
      <p className={styles.infoBox}>برای ارسال، دقیقاً سه زمان لازم است. زمان‌های تکراری انتخاب نمی‌شوند.</p>
    </aside>
  );
}
