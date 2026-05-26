import { getInsightPromptHeader, getProfileInsights } from "@/features/v51/data/experience-discovery";
import styles from "./ProfileDetailPage.module.css";

type ProfileInsightsSectionProps = Readonly<{
  profileId: string;
}>;

export function ProfileInsightsSection({ profileId }: ProfileInsightsSectionProps) {
  const insights = getProfileInsights(profileId).slice(0, 3);

  if (!insights.length) {
    return null;
  }

  return (
    <section className={styles.panel}>
      <h2>بینش‌های این تجربه</h2>
      <div className={styles.profileInsightsList}>
        {insights.map((insight) => (
          <article className={styles.profileInsightItem} key={insight.id}>
            <b>{getInsightPromptHeader(insight)}</b>
            <p>{insight.answerText}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
