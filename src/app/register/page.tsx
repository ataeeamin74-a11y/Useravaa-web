import Link from "next/link";
import { PageContainer } from "@/components/layout/PageContainer";
import styles from "@/features/v51/auth/AuthPage.module.css";

export default function RegisterPage() {
  return (
    <PageContainer as="main" variant="empty" className={styles.authShell}>
      <section className={styles.authPage}>
        <h1>ثبت‌نام عمومی فعلاً فعال نیست</h1>
        <p>
          ساخت حساب کاربری در محیط staging هنوز به ارائه‌دهنده احراز هویت واقعی وصل نشده است. این صفحه حساب جدید
          نمی‌سازد و رمز عبور دریافت نمی‌کند.
        </p>
        <div className={styles.authNotice} role="status">
          <strong>برای تست داخلی، دسترسی فقط از مسیر امن staging انجام می‌شود.</strong>
          <span>بعد از انتخاب و اتصال احراز هویت واقعی، ثبت‌نام عمومی در یک checkpoint جداگانه فعال می‌شود.</span>
        </div>
        <div className={styles.authForm}>
          <button className={styles.primaryButton} type="button" disabled>
            <span className="button-label">ثبت‌نام فعلاً غیرفعال است</span>
          </button>
          <Link className={styles.secondaryLink} href="/discover">
            <span className="button-label">بازگشت به کشف تجربه‌ها</span>
          </Link>
        </div>
      </section>
    </PageContainer>
  );
}
