import { formatPrice, type ConversationDuration } from "@/features/v51/data/conversations";
import type { ExperienceProfileFixture } from "@/features/v51/data/profiles";
import styles from "./ConversationCluster.module.css";

type DurationSelectorProps = {
  profile: ExperienceProfileFixture;
  selectedDuration: ConversationDuration;
  onDurationChange: (duration: ConversationDuration) => void;
};

const durationOptions: ConversationDuration[] = [30, 60];

export function DurationSelector({ profile, selectedDuration, onDurationChange }: DurationSelectorProps) {
  return (
    <div className={styles.durationGrid}>
      {durationOptions.map((duration) => (
        <button
          key={duration}
          type="button"
          className={`${styles.durationOption} ${selectedDuration === duration ? styles.durationActive : ""}`}
          aria-pressed={selectedDuration === duration}
          onClick={() => onDurationChange(duration)}
        >
          <span className={styles.durationTitle}>{duration === 30 ? "۳۰ دقیقه" : "۱ ساعت"}</span>
          <span className={styles.durationPrice}>{formatPrice({ profile, duration })}</span>
        </button>
      ))}
    </div>
  );
}
