import Link from "next/link";
import { StatChip } from "@/components/ui/StatChip";
import { V51LinkButton } from "@/features/v51/components/V51Button";
import { type MyProfileDashboardFixture } from "@/features/v51/data/my-profile";
import { toman } from "@/features/v51/data/profiles";
import { CsatValue, DashboardProfilePreview } from "./ProfilePreviewCard";
import styles from "./MyProfile.module.css";

type ProfileDashboardPanelsProps = {
  fixture: MyProfileDashboardFixture;
};

export function ProfileDashboardPanels({ fixture }: ProfileDashboardPanelsProps) {
  const showProfile = fixture.status !== "none";
  const showPerformance = fixture.status !== "none" && fixture.status !== "pending_review";

  return (
    <>
      <div className={styles.mainGrid}>
        <section className={styles.panel}>
          <div className={styles.sectionHead}>
            <div>
              <h2>پروفایل تجربه من</h2>
              <p>{showProfile ? "اطلاعاتی که در پروفایل تجربه‌ات نمایش داده می‌شود." : "هنوز پروفایل تجربه نداری."}</p>
            </div>
          </div>
          {showProfile ? (
            <>
              <DashboardProfilePreview profile={fixture.profile} />
              <div className={styles.actions}>
                <V51LinkButton href="/profiles/ali" tone="primary">
                  مشاهده پروفایل عمومی
                </V51LinkButton>
                <V51LinkButton href="/profile/build">ویرایش تجربه</V51LinkButton>
              </div>
            </>
          ) : (
            <>
              <div className={styles.empty}>برای دیده‌شدن در کشف تجربه‌ها، پروفایل تجربه بساز.</div>
              <div className={styles.actions}>
                <V51LinkButton href="/profile/build" tone="primary">
                  ساخت پروفایل تجربه
                </V51LinkButton>
              </div>
            </>
          )}
        </section>

        <section className={styles.panel}>
          <div className={styles.sectionHead}>
            <div>
              <h2>ذخیره‌شده‌ها</h2>
              <p>افراد و بینش‌هایی که برای بعد نگه داشته‌اید.</p>
            </div>
          </div>
          <div className={styles.networkGrid}>
            <Link href="/saved" className={styles.networkStat}>
              <StatChip value={fixture.network.saved} label="نفر ذخیره‌شده" />
            </Link>
          </div>
          <div className={styles.actions}>
            <V51LinkButton href="/saved" tone="primary">
              مشاهده ذخیره‌شده‌ها
            </V51LinkButton>
            <V51LinkButton href="/discover">کشف تجربه‌های بیشتر</V51LinkButton>
          </div>
        </section>
      </div>

      <div className={styles.mainGrid}>
        <section className={styles.panel}>
          {showPerformance ? (
            <>
              <div className={styles.sectionHead}>
                <div>
                  <h2>کیف پول و برداشت‌ها</h2>
                  <p>خلاصه عملکرد تجربه، جلسه‌های موفق و درآمد قابل برداشت.</p>
                </div>
                <V51LinkButton href="/wallet">مشاهده کیف پول</V51LinkButton>
              </div>
              <div className={styles.metrics}>
                <StatChip className={styles.metric} value={fixture.stats.successfulConversations} label="جلسه موفق" />
                <div className={styles.metric}>
                  <span>رضایت جلسه‌ها</span>
                  <b>
                    <CsatValue value={fixture.stats.csat} />
                  </b>
                </div>
                <StatChip className={styles.metric} value={fixture.stats.profileViews} label="بازدید پروفایل" />
                <div className={styles.metric}>
                  <span>قابل برداشت</span>
                  <b>{toman(fixture.stats.availableEarnings)}</b>
                </div>
              </div>
              <div className={styles.actions}>
                <V51LinkButton href="/wallet" tone="primary">
                  کیف پول و برداشت‌ها
                </V51LinkButton>
                {!fixture.settlement.iban ? <V51LinkButton href="/profile/settings">تکمیل اطلاعات تسویه</V51LinkButton> : null}
              </div>
            </>
          ) : null}
        </section>

        <section className={styles.panel}>
          {showPerformance ? (
            <>
              <div className={styles.sectionHead}>
                <div>
                  <h2>بازخوردهای دریافتی</h2>
                  <p>بازخوردهایی که بعد از جلسه‌های مشاوره برای تو ثبت شده‌اند.</p>
                </div>
              </div>
              <div className={styles.feedbackSummary}>
                <StatChip className={styles.metric} value={fixture.feedbackCount} label="بازخورد" />
                <div>
                  <b>
                    <CsatValue value={fixture.stats.csat} />
                  </b>
                  <span>میانگین رضایت</span>
                </div>
              </div>
              <div className={styles.actions}>
                <V51LinkButton href="/profile/feedback" tone="primary">
                  دیدن بازخوردها
                </V51LinkButton>
              </div>
            </>
          ) : null}
        </section>
      </div>

      <section className={styles.panel}>
        <div className={styles.sectionHead}>
          <div>
            <h2>حساب و تنظیمات</h2>
            <p>اطلاعات حساب، تسویه و حریم خصوصی.</p>
          </div>
        </div>
        <div className={styles.settingsGrid}>
          <div className={styles.settingsItem}>
            <b>اطلاعات حساب</b>
            <span>
              {fixture.account.name} · {fixture.account.email}
            </span>
            <V51LinkButton href="/profile/settings">ویرایش اطلاعات حساب</V51LinkButton>
          </div>
          <div className={styles.settingsItem}>
            <b>اطلاعات تسویه</b>
            <span>{fixture.settlement.iban ?? "شماره شبا ثبت نشده است."}</span>
            <V51LinkButton href="/profile/settings">ثبت / ویرایش شبا</V51LinkButton>
          </div>
          <div className={styles.settingsItem}>
            <b>تنظیمات کامل</b>
            <span>اعلان‌ها، حریم خصوصی و وضعیت نمایش پروفایل.</span>
            <V51LinkButton href="/profile/settings">رفتن به تنظیمات</V51LinkButton>
          </div>
        </div>
      </section>
    </>
  );
}
