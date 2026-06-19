import Link from "next/link";
import { UnauthorizedState } from "@/components/auth/UnauthorizedState";
import { PageContainer } from "@/components/layout/PageContainer";
import { UseravaaIcon } from "@/components/ui/UseravaaIcon";
import { getInsightPromptHeader, publishedInsights } from "@/features/v51/data/experience-discovery";
import styles from "@/features/v51/my-profile/components/MyProfile.module.css";
import { canEditProfile, V51_PROFILE_FIXTURE_OWNER_ID } from "@/features/v51/permissions";
import { requireCurrentViewer } from "@/lib/auth/session";

export default async function ProfileInsightsManagementPage() {
  const viewer = await requireCurrentViewer();

  if (!canEditProfile(viewer, V51_PROFILE_FIXTURE_OWNER_ID)) {
    return (
      <PageContainer variant="empty">
        <UnauthorizedState />
      </PageContainer>
    );
  }

  const ownInsights = publishedInsights.filter((insight) => insight.profileId === "ali" && insight.status !== "draft");

  return (
    <PageContainer as="main" variant="dashboard">
      <section className={styles.dashboardCard}>
        <div className={styles.sectionHead}>
          <div>
            <h1>مدیریت بینش‌های من</h1>
            <p>بینش‌های منتشرشده و برداشته‌شده از انتشار را از اینجا پیگیری کنید.</p>
          </div>
          <Link className={styles.secondaryDashboardAction} href="/profile">
            <UseravaaIcon name="arrowBackRtl" size={18} />
            <span className="button-label">بازگشت به پروفایل</span>
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
                      <span className="button-label">دانلود تصویر کارت</span>
                    </button>
                    <button type="button">
                      <UseravaaIcon name="link" size={16} />
                      <span className="button-label">کپی لینک</span>
                    </button>
                    <button type="button">
                      <UseravaaIcon name="archive" size={16} />
                      <span className="button-label">برداشتن از انتشار</span>
                    </button>
                  </>
                ) : null}
                <button type="button">
                  <UseravaaIcon name="edit" size={16} />
                  <span className="button-label">ویرایش بینش</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </PageContainer>
  );
}
