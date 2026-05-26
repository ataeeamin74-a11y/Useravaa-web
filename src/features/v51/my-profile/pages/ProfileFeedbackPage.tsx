import { V51LinkButton } from "@/features/v51/components/V51Button";
import { receivedFeedbackItems, type ReceivedFeedback } from "@/features/v51/data/my-profile";
import { FeedbackList } from "../components/FeedbackList";
import { FeedbackSummaryCards } from "../components/FeedbackSummaryCards";
import styles from "../components/MyProfile.module.css";

type ProfileFeedbackPageProps = Readonly<{
  feedbacks?: readonly ReceivedFeedback[];
}>;

export function ProfileFeedbackPage({ feedbacks = receivedFeedbackItems }: ProfileFeedbackPageProps) {
  return (
    <div className={styles.feedbackShell}>
      <div className={styles.feedbackHero}>
        <V51LinkButton href="/profile">بازگشت</V51LinkButton>
        <div>
          <h1>بازخوردهای دریافتی</h1>
          <p className={styles.lead}>بازخوردهایی که بعد از جلسه‌ها برای تجربه تو ثبت شده‌اند.</p>
        </div>
      </div>

      <FeedbackSummaryCards feedbacks={feedbacks} />
      <FeedbackList feedbacks={feedbacks} />
    </div>
  );
}
