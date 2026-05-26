import { renderStars, type ReceivedFeedback } from "@/features/v51/data/my-profile";
import styles from "./MyProfile.module.css";

type FeedbackListProps = Readonly<{
  feedbacks: readonly ReceivedFeedback[];
}>;

export function FeedbackList({ feedbacks }: FeedbackListProps) {
  if (!feedbacks.length) {
    return <div className={styles.empty}>هنوز بازخوردی ثبت نشده است.</div>;
  }

  return (
    <div className={styles.feedbackPageList}>
      {feedbacks.map((item) => (
        <article className={styles.feedbackPageCard} key={item.id}>
          <h3>
            {item.name} · {item.role}
          </h3>
          <div className={styles.stars}>{renderStars(item.rating)}</div>
          <p>{item.text}</p>
        </article>
      ))}
    </div>
  );
}
