import { UseravaaIcon } from "@/components/ui/UseravaaIcon";
import { jobFieldTaxonomy, type JobField } from "@/features/v51/data/job-fields";
import styles from "./MyProfile.module.css";

type JobFieldSelectProps = Readonly<{
  value: JobField;
  onChange: (value: JobField) => void;
  id?: string;
  label?: string;
}>;

export function JobFieldSelect({ value, onChange, id, label = "حوزه شغلی" }: JobFieldSelectProps) {
  return (
    <span className={styles.selectWrap}>
      <select id={id} aria-label={label} value={value} onChange={(event) => onChange(event.target.value as JobField)}>
        {jobFieldTaxonomy.map((field) => (
          <option key={field} value={field}>
            {field}
          </option>
        ))}
      </select>
      <span className={styles.selectCaret} aria-hidden="true">
        <UseravaaIcon name="dropdown" size={16} />
      </span>
    </span>
  );
}
