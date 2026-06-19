import Link from "next/link";
import { PageContainer } from "@/components/layout/PageContainer";
import { PasswordField } from "@/features/v51/auth/PasswordField";
import styles from "@/features/v51/auth/AuthPage.module.css";

export default function LoginPage() {
  return (
    <PageContainer as="main" variant="empty" className={styles.authShell}>
      <section className={styles.authPage}>
        <h1>ورود به یوزراوا</h1>
        <p>وارد حساب خود شوید و مسیر گفت‌وگوها، تجربه‌ها و پروفایل خود را ادامه دهید.</p>
        <form className={styles.authForm}>
          <label>
            ایمیل
            <input type="email" autoComplete="email" placeholder="you@example.com" />
          </label>
          <label>
            رمز عبور
            <PasswordField autoComplete="current-password" />
          </label>
          <button className={styles.primaryButton} type="button">
            <span className="button-label">ورود</span>
          </button>
          <Link className={styles.secondaryLink} href="/register">
            <span className="button-label">ساخت حساب</span>
          </Link>
        </form>
      </section>
    </PageContainer>
  );
}
