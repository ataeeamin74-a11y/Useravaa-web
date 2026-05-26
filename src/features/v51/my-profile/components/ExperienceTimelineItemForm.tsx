import { UseravaaIcon } from "@/components/ui/UseravaaIcon";
import { orgLevels, type OrgLevel } from "@/features/v51/data/my-profile";
import { persianMonthOptions, type ExperienceTimelineItem, type TimelineItemErrors } from "@/features/v51/data/experience-timeline";
import type { JobField } from "@/features/v51/data/job-fields";
import { V51Button } from "@/features/v51/components/V51Button";
import type { ReactNode } from "react";
import { JobFieldSelect } from "./JobFieldSelect";
import { JobTitleInput } from "./JobTitleInput";
import styles from "./MyProfile.module.css";

const yearOptions = Array.from({ length: 16 }, (_, index) => 1404 - index);

type ExperienceTimelineItemFormProps = Readonly<{
  item: ExperienceTimelineItem;
  index: number;
  errors: TimelineItemErrors;
  onChange: (item: ExperienceTimelineItem) => void;
  onRemove: () => void;
}>;

export function ExperienceTimelineItemForm({ item, index, errors, onChange, onRemove }: ExperienceTimelineItemFormProps) {
  const update = (patch: Partial<ExperienceTimelineItem>) => onChange({ ...item, ...patch });

  return (
    <article className={styles.timelineItem}>
      <div className={styles.timelineItemHead}>
        <b>سابقه {index + 1}</b>
        <V51Button type="button" onClick={onRemove}>
          <UseravaaIcon name="delete" size={16} />
          حذف
        </V51Button>
      </div>

      <div className={styles.formGrid}>
        <TimelineField label="عنوان شغلی" error={errors.jobTitle}>
          <JobTitleInput value={item.jobTitle} onChange={(jobTitle) => update({ jobTitle })} />
        </TimelineField>

        <TimelineField label="حوزه شغلی" error={errors.jobField}>
          <JobFieldSelect value={item.jobField} onChange={(jobField: JobField) => update({ jobField })} />
        </TimelineField>

        <TimelineField label="رده سازمانی" error={errors.orgLevel}>
          <span className={styles.selectWrap}>
            <select value={item.orgLevel} onChange={(event) => update({ orgLevel: event.target.value as OrgLevel })}>
              {orgLevels.map((level) => (
                <option key={level}>{level}</option>
              ))}
            </select>
            <span className={styles.selectCaret} aria-hidden="true">
              <UseravaaIcon name="dropdown" size={16} />
            </span>
          </span>
        </TimelineField>

        <TimelineField label="نام شرکت" error={errors.companyName}>
          <input value={item.companyName} onChange={(event) => update({ companyName: event.target.value })} />
        </TimelineField>

        <TimelineField label="کشور یا محل شرکت" error={errors.companyCountry}>
          <input value={item.companyCountry} onChange={(event) => update({ companyCountry: event.target.value })} />
        </TimelineField>

        <TimelineField label="زمینه فعالیت شرکت" error={errors.companyIndustry}>
          <input value={item.companyIndustry} placeholder="مثلاً حمل‌ونقل آنلاین" onChange={(event) => update({ companyIndustry: event.target.value })} />
        </TimelineField>

        <TimelineField label="ماه شروع" error={errors.startDate}>
          <MonthSelect value={item.startMonth} onChange={(startMonth) => update({ startMonth })} />
        </TimelineField>

        <TimelineField label="سال شروع">
          <YearSelect value={item.startYear} onChange={(startYear) => update({ startYear })} />
        </TimelineField>

        <TimelineField label="ماه پایان" error={errors.endDate}>
          <MonthSelect value={item.endMonth ?? 1} disabled={item.isCurrent} onChange={(endMonth) => update({ endMonth })} />
        </TimelineField>

        <TimelineField label="سال پایان">
          <YearSelect value={item.endYear ?? item.startYear} disabled={item.isCurrent} onChange={(endYear) => update({ endYear })} />
        </TimelineField>

        <label className={`${styles.freeToggle} ${styles.fieldFull}`}>
          <input
            type="checkbox"
            checked={item.isCurrent}
            onChange={(event) =>
              update({
                isCurrent: event.target.checked,
                endYear: event.target.checked ? null : item.endYear ?? item.startYear,
                endMonth: event.target.checked ? null : item.endMonth ?? 1
              })
            }
          />
          <span>
            <b>هنوز در این نقش هستم</b>
            <small>برای نقش فعلی، تاریخ پایان لازم نیست.</small>
          </span>
        </label>

        <TimelineField label="توضیح اختیاری" full>
          <textarea value={item.description ?? ""} maxLength={280} onChange={(event) => update({ description: event.target.value })} />
        </TimelineField>
      </div>

      {errors.dateRange ? <div className={styles.fieldError}>{errors.dateRange}</div> : null}
    </article>
  );
}

function TimelineField({
  label,
  children,
  error,
  full
}: Readonly<{
  label: string;
  children: ReactNode;
  error?: string;
  full?: boolean;
}>) {
  return (
    <div className={`${styles.field} ${full ? styles.fieldFull : ""}`}>
      <label>{label}</label>
      {children}
      {error ? <div className={styles.fieldError}>{error}</div> : null}
    </div>
  );
}

function MonthSelect({ value, disabled, onChange }: Readonly<{ value: number; disabled?: boolean; onChange: (value: number) => void }>) {
  return (
    <span className={styles.selectWrap}>
      <select value={value} disabled={disabled} onChange={(event) => onChange(Number(event.target.value))}>
        {persianMonthOptions.map((month) => (
          <option key={month.value} value={month.value}>
            {month.label}
          </option>
        ))}
      </select>
      <span className={styles.selectCaret} aria-hidden="true">
        <UseravaaIcon name="dropdown" size={16} />
      </span>
    </span>
  );
}

function YearSelect({ value, disabled, onChange }: Readonly<{ value: number; disabled?: boolean; onChange: (value: number) => void }>) {
  return (
    <span className={styles.selectWrap}>
      <select value={value} disabled={disabled} onChange={(event) => onChange(Number(event.target.value))}>
        {yearOptions.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
      <span className={styles.selectCaret} aria-hidden="true">
        <UseravaaIcon name="dropdown" size={16} />
      </span>
    </span>
  );
}
