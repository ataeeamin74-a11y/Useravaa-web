import Link from "next/link";
import { PasswordField } from "@/features/v51/auth/PasswordField";
import styles from "@/features/v51/auth/AuthPage.module.css";

export default function LoginPage() {
  return (
    <main className={styles.authPage}>
      <h1>ورود به Useravaa</h1>
      <p>برای ذخیره تجربه‌ها، درخواست جلسه مشاوره و مدیریت پروفایل تجربه وارد حساب شوید.</p>
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
          ورود
        </button>
        <Link className={styles.secondaryLink} href="/register">
          ساخت حساب کاربری
        </Link>
      </form>
    </main>
  );
}
