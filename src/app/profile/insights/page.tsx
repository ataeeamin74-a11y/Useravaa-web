import Link from "next/link";
import { UseravaaIcon } from "@/components/ui/UseravaaIcon";
import { getInsightPromptHeader, publishedInsights } from "@/features/v51/data/experience-discovery";
import styles from "@/features/v51/my-profile/components/MyProfile.module.css";

export default function ProfileInsightsManagementPage() {
  const ownInsights = publishedInsights.filter((insight) => insight.profileId === "ali" && insight.status !== "draft");

  return (
    <main>
      <section className={styles.dashboardCard}>
        <div className={styles.sectionHead}>
          <div>
            <h1>مدیریت بینش‌های من</h1>
            <p>بینش‌های منتشرشده و برداشته‌شده از انتشار را از اینجا پیگیری کنید.</p>
          </div>
          <Link className={styles.secondaryDashboardAction} href="/profile">
            <UseravaaIcon name="arrowBackRtl" size={18} />
            بازگشت به پروفایل
          </Link>
        </div>
        <div className={styles.ownerInsightList}>
          {ownInsights.map((insight) => (
            <article className={styles.carouselInsightCard} key={insight.id}>
              <span>{insight.relativeDateFa}</span>
              {insight.status === "retracted" ? <small className={styles.ownerInsightStatus}>برداشته‌شده از انتشار</small> : null}
              <h3>{getInsightPromptHeader(insight)}</h3>
              <p>{insight.answerText}</p>
              <div>
                {insight.status === "published" ? (
                  <>
                    <button type="button">
                      <UseravaaIcon name="download" size={16} />
                      <span>دانلود تصویر کارت</span>
                    </button>
                    <button type="button">
                      <UseravaaIcon name="link" size={16} />
                      <span>کپی لینک</span>
                    </button>
                    <button type="button">
                      <UseravaaIcon name="archive" size={16} />
                      <span>برداشتن از انتشار</span>
                    </button>
                  </>
                ) : null}
                <button type="button">
                  <UseravaaIcon name="edit" size={16} />
                  <span>ویرایش بینش</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
