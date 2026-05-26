import type { ExperienceAnswer } from "@/features/v51/data/experience-questions";
import styles from "./ProfileDetailPage.module.css";

type ExperienceAnswerItemProps = Readonly<{
  answer: ExperienceAnswer;
}>;

export function ExperienceAnswerItem({ answer }: ExperienceAnswerItemProps) {
  return (
    <article className={styles.experienceAnswerItem}>
      <b>{answer.renderedQuestion}</b>
      <p>{answer.answer}</p>
    </article>
  );
}
