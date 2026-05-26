import { formatter, toFaDecimal, type ExperienceProfileFixture } from "@/features/v51/data/profiles";
import { ProfileInsightsSection } from "./ProfileInsightsSection";
import styles from "./ProfileDetailPage.module.css";
import { ProfileRequestPanel } from "./ProfileRequestPanel";

type ProfileDetailPageProps = Readonly<{
  profile: ExperienceProfileFixture;
}>;

export function ProfileDetailPage({ profile }: ProfileDetailPageProps) {
  return (
    <section className={styles.layout}>
      <div>
        <div className={styles.heroProfile}>
          <div className={styles.profileAvatar}>{profile.initials}</div>
          <div>
            <h1 className={styles.profileName}>{profile.name}</h1>
            <div className={styles.role}>{profile.roleFa}</div>
            <div className={styles.badges}>
              <span className={`${styles.chip} ${styles.level}`}>{profile.orgLevel}</span>
              <span className={styles.chip}>{formatter.format(profile.yearsOfExperience)} سال سابقه</span>
              {profile.csat ? (
                <span className={`${styles.chip} ${styles.csat}`}>
                  <span className={styles.star}>★</span>
                  {toFaDecimal(profile.csat)}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className={styles.panel}>
          <h2>معرفی حرفه‌ای</h2>
          <p>{profile.professionalSummary}</p>
        </div>

        <ProfileInsightsSection profileId={profile.id} />

        <div className={styles.panel}>
          <h2>اطلاعات حرفه‌ای</h2>
          <div className={styles.row}>
            <span className={styles.k}>رده سازمانی</span>
            <span className={styles.v}>{profile.orgLevel}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.k}>سابقه کار</span>
            <span className={styles.v}>{formatter.format(profile.yearsOfExperience)} سال</span>
          </div>
          <div className={styles.row}>
            <span className={styles.k}>دسته‌بندی شغلی</span>
            <span className={styles.v}>{profile.jobCategoriesFa.join("، ")}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.k}>تجربه در شرکت</span>
            <span className={styles.v}>{profile.previousCompaniesFa.length ? profile.previousCompaniesFa.join("، ") : "شرکت قبلی ثبت نشده است"}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.k}>زبان جلسه مشاوره</span>
            <span className={styles.v}>{profile.languages.join("، ")}</span>
          </div>
        </div>

        <div className={styles.panel}>
          <h2>رضایت جلسه‌های مشاوره</h2>
          <article className={styles.reviewCard}>
            <div className={styles.reviewHead}>
              <div>
                <b>{profile.reviewAuthor.name}</b>
                <span>
                  {profile.reviewAuthor.role}
                  {profile.reviewAuthor.company ? ` · ${profile.reviewAuthor.company}` : ""}
                </span>
              </div>
              <strong>{profile.csat ? `★ ${toFaDecimal(profile.csat)} از ۵` : "بدون امتیاز"}</strong>
            </div>
            <p>{profile.review}</p>
          </article>
        </div>
      </div>

      <ProfileRequestPanel profile={profile} />
    </section>
  );
}
