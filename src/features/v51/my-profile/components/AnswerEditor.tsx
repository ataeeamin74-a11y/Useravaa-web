import {
  getInsightAnswerCharacterCount,
  insightAnswerMaxLength,
  limitInsightAnswerInput,
  weeklyQuestionCopy
} from "@/features/v51/data/experience-questions";
import { formatFaNumber } from "@/lib/fa-format";
import styles from "./MyProfile.module.css";

type AnswerEditorProps = Readonly<{
  value: string;
  onChange: (value: string) => void;
}>;

export function AnswerEditor({ value, onChange }: AnswerEditorProps) {
  const count = getInsightAnswerCharacterCount(value);

  return (
    <div className={`${styles.field} ${styles.fieldFull}`}>
      <label htmlFor="weeklyQuestionAnswer">پاسخ شما</label>
      <textarea
        id="weeklyQuestionAnswer"
        maxLength={insightAnswerMaxLength}
        value={value}
        placeholder="پاسخ کوتاه و حرفه‌ای خود را بنویسید."
        aria-describedby="weeklyQuestionAnswerHelper weeklyQuestionAnswerCounter"
        onChange={(event) => onChange(limitInsightAnswerInput(event.target.value))}
      />
      <div className={styles.answerMeta}>
        <small id="weeklyQuestionAnswerHelper" className={styles.helperText}>
          {weeklyQuestionCopy.answerHelper} {weeklyQuestionCopy.answerLimitHelper}
        </small>
        <span id="weeklyQuestionAnswerCounter" className={styles.answerCounter}>
          {formatFaNumber(count)} / {formatFaNumber(insightAnswerMaxLength)}
        </span>
      </div>
    </div>
  );
}
