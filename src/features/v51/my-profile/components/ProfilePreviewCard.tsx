import {
  faSummaryCount,
  formatCsat,
  moneyOrFree,
  type MyExperienceProfile,
  type ProfileBuilderDraft
} from "@/features/v51/data/my-profile";
import { derivePreviousCompaniesFromTimeline, getCurrentTimelineItem } from "@/features/v51/data/experience-timeline";
import { formatter, toman } from "@/features/v51/data/profiles";
import styles from "./MyProfile.module.css";

type AvatarProps = {
  label: string;
  initials: string;
  avatarUrl?: string;
  size: "dashboard" | "builder" | "preview";
};

export function ProfileAvatar({ label, initials, avatarUrl, size }: AvatarProps) {
  const className = size === "dashboard" ? styles.avatar : size === "builder" ? styles.avatarPreview : styles.previewAvatar;

  return (
    <span className={className} aria-label={label}>
      {avatarUrl ? <span className={styles.avatarImage} style={{ backgroundImage: `url(${avatarUrl})` }} /> : initials}
    </span>
  );
}

export function DashboardProfilePreview({ profile }: { profile: MyExperienceProfile }) {
  return (
    <>
      <div className={styles.profileTop}>
        <ProfileAvatar label="تصویر پروفایل" initials={profile.initials} avatarUrl={profile.avatarUrl} size="dashboard" />
        <div>
          <h3>{profile.roleFa}</h3>
          <p>
            {profile.orgLevel} · {formatter.format(profile.yearsOfExperience)} سال سابقه
          </p>
        </div>
      </div>

      <div className={styles.badges}>
        {profile.jobCategoriesFa.slice(0, 3).map((category) => (
          <span key={category} className={styles.badge}>
            {category}
          </span>
        ))}
        {profile.previousCompaniesFa.slice(0, 2).map((company) => (
          <span key={company} className={styles.badge}>
            {company}
          </span>
        ))}
      </div>

      <div className={styles.priceGrid}>
        <div>
          <span>۳۰ دقیقه</span>
          <b>{profile.freeHelp ? "رایگان" : toman(profile.pricing[30])}</b>
        </div>
        <div>
          <span>۱ ساعت</span>
          <b>{profile.freeHelp ? "رایگان" : toman(profile.pricing[60])}</b>
        </div>
      </div>
    </>
  );
}

export function BuildProfilePreview({ draft }: { draft: ProfileBuilderDraft }) {
  const initials = draft.displayName.trim()[0] || "؟";
  const current = getCurrentTimelineItem(draft.timeline);
  const previousCompanies = derivePreviousCompaniesFromTimeline(draft.timeline);
  const jobField = current?.jobField ?? draft.categories[0];

  return (
    <div className={styles.publicPreview}>
      <div className={styles.previewTop}>
        <ProfileAvatar label="تصویر پروفایل" initials={initials} avatarUrl={draft.avatarUrl} size="preview" />
        <div>
          <h3>{draft.displayName || "نام نمایشی"}</h3>
          <p>
            {current?.jobTitle || draft.role || "عنوان شغلی"} · {current?.orgLevel || draft.orgLevel || "رده سازمانی"} · {formatter.format(draft.years || 0)} سال سابقه
          </p>
        </div>
      </div>

      <div className={styles.previewBadges}>
        {draft.freeHelp ? <span>کمک رایگان</span> : null}
        {jobField ? <span>{jobField}</span> : null}
        {previousCompanies.slice(0, 2).map((company) => (
          <span key={company}>{company}</span>
        ))}
        {draft.languages.map((language) => (
          <span key={language}>{language}</span>
        ))}
      </div>

      <p>{draft.summary || "معرفی حرفه‌ای کوتاه"}</p>
      <div className={styles.previewPrice}>
        <div>
          <small>۳۰ دقیقه</small>
          <b>{moneyOrFree(draft.price30)}</b>
        </div>
        <div>
          <small>۱ ساعت</small>
          <b>{moneyOrFree(draft.price60)}</b>
        </div>
      </div>
    </div>
  );
}

export function SummaryCounter({ summary }: { summary: string }) {
  return <span>{faSummaryCount(summary)}</span>;
}

export function CsatValue({ value }: { value: number }) {
  return <>★ {formatCsat(value)}</>;
}
