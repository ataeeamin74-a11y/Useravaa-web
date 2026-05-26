import { getPublishedProfileAnswers, weeklyQuestionCopy, type ExperienceAnswer } from "@/features/v51/data/experience-questions";
import { ExperienceAnswerItem } from "./ExperienceAnswerItem";
import styles from "./ProfileDetailPage.module.css";

type ProfileExperienceAnswersSectionProps = Readonly<{
  profileId: string;
  answers?: readonly ExperienceAnswer[];
}>;

export function ProfileExperienceAnswersSection({ profileId, answers }: ProfileExperienceAnswersSectionProps) {
  const publishedAnswers = getPublishedProfileAnswers(profileId, answers);

  if (!publishedAnswers.length) {
    return null;
  }

  return (
    <section className={styles.panel}>
      <h2>{weeklyQuestionCopy.publicSectionTitle}</h2>
      <div className={styles.experienceAnswersList}>
        {publishedAnswers.map((answer) => (
          <ExperienceAnswerItem key={answer.id} answer={answer} />
        ))}
      </div>
    </section>
  );
}
