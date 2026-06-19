import Link from "next/link";
import { PageContainer } from "@/components/layout/PageContainer";
import { PasswordField } from "@/features/v51/auth/PasswordField";
import styles from "@/features/v51/auth/AuthPage.module.css";

export default function RegisterPage() {
  return (
    <PageContainer as="main" variant="empty" className={styles.authShell}>
      <section className={styles.authPage}>
        <h1>ساخت حساب در یوزراوا</h1>
        <p>یک حساب بسازید تا بتوانید تجربه‌های مرتبط را ببینید، گفت‌وگو درخواست کنید و بعداً پروفایل خود را کامل کنید.</p>
        <form className={styles.authForm}>
          <label>
            نام
            <input type="text" autoComplete="name" dir="rtl" />
          </label>
          <label>
            ایمیل
            <input type="email" autoComplete="email" placeholder="you@example.com" />
          </label>
          <label>
            رمز عبور
            <PasswordField autoComplete="new-password" />
          </label>
          <button className={styles.primaryButton} type="button">
            <span className="button-label">ساخت حساب</span>
          </button>
          <Link className={styles.secondaryLink} href="/login">
            <span className="button-label">ورود به حساب موجود</span>
          </Link>
        </form>
      </section>
    </PageContainer>
  );
}
