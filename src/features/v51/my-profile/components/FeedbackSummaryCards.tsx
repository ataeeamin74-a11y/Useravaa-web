import { formatter, toFaDecimal } from "@/features/v51/data/profiles";
import { getFeedbackSummary, type ReceivedFeedback } from "@/features/v51/data/my-profile";
import styles from "./MyProfile.module.css";

type FeedbackSummaryCardsProps = Readonly<{
  feedbacks: readonly ReceivedFeedback[];
}>;

export function FeedbackSummaryCards({ feedbacks }: FeedbackSummaryCardsProps) {
  const summary = getFeedbackSummary(feedbacks);

  return (
    <div className={styles.feedbackPageSummary}>
      <div className={styles.feedbackSummaryCard}>
        <b>{formatter.format(summary.count)}</b>
        <span>بازخورد دریافتی</span>
      </div>
      <div className={styles.feedbackSummaryCard}>
        <b>{summary.average ? `★ ${toFaDecimal(Number(summary.average.toFixed(1)))}` : "بدون امتیاز"}</b>
        <span>میانگین رضایت</span>
      </div>
      <div className={styles.feedbackSummaryCard}>
        <b>{formatter.format(summary.successfulConversations)}</b>
        <span>جلسه موفق</span>
      </div>
    </div>
  );
}
