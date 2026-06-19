import { StatChip } from "@/components/ui/StatChip";
import { getFeedbackSummary, type ReceivedFeedback } from "@/features/v51/data/my-profile";
import { CsatValue } from "./ProfilePreviewCard";
import styles from "./MyProfile.module.css";

type FeedbackSummaryCardsProps = Readonly<{
  feedbacks: readonly ReceivedFeedback[];
}>;

export function FeedbackSummaryCards({ feedbacks }: FeedbackSummaryCardsProps) {
  const summary = getFeedbackSummary(feedbacks);

  return (
    <div className={styles.feedbackPageSummary}>
      <div className={styles.feedbackSummaryCard}>
        <StatChip value={summary.count} label="بازخورد دریافتی" />
      </div>
      <div className={styles.feedbackSummaryCard}>
        <b>{summary.average ? <CsatValue value={Number(summary.average.toFixed(1))} /> : "بدون امتیاز"}</b>
        <span>میانگین رضایت</span>
      </div>
      <div className={styles.feedbackSummaryCard}>
        <StatChip value={summary.successfulConversations} label="جلسه موفق" />
      </div>
    </div>
  );
}
