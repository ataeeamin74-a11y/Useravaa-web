import { V51Button, V51LinkButton } from "@/features/v51/components/V51Button";
import { statusCopy, type ExperienceProfileStatus } from "@/features/v51/data/my-profile";
import { formatter } from "@/features/v51/data/profiles";
import styles from "./MyProfile.module.css";

type ProfileStatusCardProps = {
  status: ExperienceProfileStatus;
  incomingRequests: number;
  onDeactivate?: () => void;
  onReactivate?: () => void;
};

export function ProfileStatusCard({ status, incomingRequests, onDeactivate, onReactivate }: ProfileStatusCardProps) {
  const copy = statusCopy(status);
  const toneClass =
    copy.tone === "none"
      ? styles.statusNone
      : copy.tone === "pending"
        ? styles.statusPending
        : copy.tone === "inactive"
          ? styles.statusInactive
          : "";

  return (
    <section className={styles.status}>
      <div className={`${styles.statusCard} ${toneClass}`}>
        <div>
          <span className={styles.statusBadge}>{copy.badge}</span>
          <h2>{copy.title}</h2>
          <p>{copy.body}</p>
          {incomingRequests > 0 && status === "active" ? (
            <V51LinkButton href="/conversations" className={styles.alertLink}>
              {formatter.format(incomingRequests)} درخواست جدید داری
            </V51LinkButton>
          ) : null}
        </div>
        <div className={styles.statusActions}>
          {status === "none" || status === "draft" ? (
            <>
              <V51LinkButton href="/profile/build" tone="primary">
                ساخت پروفایل تجربه
              </V51LinkButton>
              <V51LinkButton href="/discover">کشف تجربه‌ها</V51LinkButton>
            </>
          ) : null}
          {status === "pending_review" ? (
            <V51LinkButton href="/profile/build" tone="primary">
              ویرایش اطلاعات
            </V51LinkButton>
          ) : null}
          {status === "needs_changes" ? (
            <V51LinkButton href="/profile/build" tone="primary">
              ویرایش اطلاعات
            </V51LinkButton>
          ) : null}
          {status === "inactive" ? (
            <>
              <V51Button type="button" tone="primary" onClick={onReactivate}>
                فعال‌سازی دوباره
              </V51Button>
              <V51LinkButton href="/profile/build">ویرایش پروفایل</V51LinkButton>
            </>
          ) : null}
          {status === "active" ? (
            <>
              <V51LinkButton href="/profiles/ali" tone="primary">
                مشاهده پروفایل عمومی
              </V51LinkButton>
              <V51LinkButton href="/profile/build">ویرایش تجربه</V51LinkButton>
              <V51Button type="button" onClick={onDeactivate}>
                توقف دریافت درخواست‌ها
              </V51Button>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}
