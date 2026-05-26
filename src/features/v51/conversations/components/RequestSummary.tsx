import {
  formatDuration,
  formatPrice,
  type ConversationDuration
} from "@/features/v51/data/conversations";
import type { ExperienceProfileFixture } from "@/features/v51/data/profiles";
import styles from "./ConversationCluster.module.css";

type RequestSummaryProps = {
  profile: ExperienceProfileFixture;
  duration: ConversationDuration;
  note?: string;
  freeHelp?: boolean;
};

export function RequestSummary({ profile, duration, note, freeHelp }: RequestSummaryProps) {
  const summaryConversation = {
    profile,
    duration,
    freeHelp
  };

  return (
    <aside className={styles.panel}>
      <h2>خلاصه درخواست</h2>
      <div className={styles.summaryRows}>
        <div className={styles.summaryRow}>
          <span>فرد</span>
          <strong>{profile.name}</strong>
        </div>
        <div className={styles.summaryRow}>
          <span>زمان جلسه مشاوره</span>
          <strong>{formatDuration(duration)}</strong>
        </div>
        <div className={styles.summaryRow}>
          <span>هزینه</span>
          <strong>{formatPrice(summaryConversation)}</strong>
        </div>
        {note ? (
          <div className={styles.summaryRow}>
            <span>توضیح تو</span>
            <strong>{note}</strong>
          </div>
        ) : null}
      </div>
      <p className={styles.infoBox}>بعد از ارسال درخواست، ارائه‌دهنده باید حداقل سه زمان پیشنهادی شامل روز و ساعت اعلام کند.</p>
    </aside>
  );
}
