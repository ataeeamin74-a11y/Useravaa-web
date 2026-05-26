import { weeklyQuestionCopy } from "@/features/v51/data/experience-questions";
import styles from "./MyProfile.module.css";

type ResponsibilityCheckboxProps = Readonly<{
  checked: boolean;
  onChange: (checked: boolean) => void;
}>;

export function ResponsibilityCheckbox({ checked, onChange }: ResponsibilityCheckboxProps) {
  return (
    <label className={styles.responsibilityBox}>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>
        <b>{weeklyQuestionCopy.responsibilityText}</b>
        <small>{weeklyQuestionCopy.safetyText}</small>
      </span>
    </label>
  );
}
