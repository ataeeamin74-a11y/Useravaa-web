import Link from "next/link";
import { Compass, RefreshCw, Route } from "./CareerIcons";
import styles from "./CareerRecoveryPage.module.css";

export function CareerRecoveryPage({ mode }: Readonly<{ mode: "not-found" | "offline" }>) {
  const offline = mode === "offline";

  return (
    <main className={styles.page} aria-labelledby="career-recovery-title">
      <span className={styles.icon} aria-hidden>{offline ? <RefreshCw size={32} /> : <Route size={32} />}</span>
      <p className={styles.eyebrow}>{offline ? "اتصال اینترنت" : "مسیر نامعتبر"}</p>
      <h1 id="career-recovery-title">
        {offline ? "فعلاً به اینترنت دسترسی نداری" : "این مسیر شغلی پیدا نشد"}
      </h1>
      <p>
        {offline
          ? "صفحه‌هایی که قبلاً دیده‌ای ممکن است هنوز در دسترس باشند. بعد از وصل‌شدن دوباره تلاش کن."
          : "ممکن است آدرس مسیر تغییر کرده باشد. از فهرست مسیرهای فعلی، گزینه درست را پیدا کن."}
      </p>
      <div className={styles.actions}>
        {offline ? (
          <Link className={styles.primaryAction} href="/">
            <RefreshCw size={18} aria-hidden /> تلاش دوباره
          </Link>
        ) : (
          <Link className={styles.primaryAction} href="/">
            <Compass size={18} aria-hidden /> دیدن مسیرهای شغلی
          </Link>
        )}
        <Link className={styles.secondaryAction} href="/career/my-paths">رفتن به مسیرهای من</Link>
      </div>
    </main>
  );
}
