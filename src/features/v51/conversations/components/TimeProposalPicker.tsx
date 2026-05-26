import {
  makeProposedTime,
  proposalDateOptions,
  proposalTimeSlots,
  type ProposedTime
} from "@/features/v51/data/conversations";
import styles from "./ConversationCluster.module.css";

type TimeProposalPickerProps = {
  selectedDateId: string;
  selectedTimes: readonly ProposedTime[];
  onDateChange: (dateId: string) => void;
  onToggleTime: (time: ProposedTime) => void;
};

export function TimeProposalPicker({ selectedDateId, selectedTimes, onDateChange, onToggleTime }: TimeProposalPickerProps) {
  const selectedIds = new Set(selectedTimes.map((time) => time.id));

  return (
    <div className={styles.panel}>
      <h2>روز را انتخاب کن</h2>
      <p className={styles.lead}>تاریخ‌ها شمسی هستند.</p>
      <div className={styles.dateStrip}>
        {proposalDateOptions.map((dateOption) => (
          <button
            key={dateOption.id}
            type="button"
            className={`${styles.dateChip} ${selectedDateId === dateOption.id ? styles.chipActive : ""}`}
            aria-pressed={selectedDateId === dateOption.id}
            onClick={() => onDateChange(dateOption.id)}
          >
            <strong>{dateOption.day}</strong>
            <br />
            {dateOption.date}
          </button>
        ))}
      </div>

      <h2>ساعت‌های مناسب را انتخاب کن</h2>
      <p className={styles.lead}>با هر کلیک، همان زمان به لیست پیشنهادی اضافه می‌شود.</p>
      <div className={styles.slots}>
        {proposalTimeSlots.map((slot) => {
          const proposedTime = makeProposedTime(selectedDateId, slot);
          const selected = selectedIds.has(proposedTime.id);
          const blocked = selectedTimes.length >= 6 && !selected;

          return (
            <button
              key={slot}
              type="button"
              className={`${styles.slotChip} ${selected ? styles.chipActive : ""}`}
              aria-pressed={selected}
              disabled={blocked}
              onClick={() => onToggleTime(proposedTime)}
            >
              {slot}
            </button>
          );
        })}
      </div>
    </div>
  );
}
