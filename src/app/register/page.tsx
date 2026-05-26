import Link from "next/link";
import { PasswordField } from "@/features/v51/auth/PasswordField";
import styles from "@/features/v51/auth/AuthPage.module.css";

export default function RegisterPage() {
  return (
    <main className={styles.authPage}>
      <h1>شروع در Useravaa</h1>
      <p>یک حساب کاربری بسازید؛ بعداً می‌توانید هم جلسه مشاوره درخواست کنید و هم پروفایل تجربه خود را کامل کنید.</p>
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
          ساخت حساب کاربری
        </button>
        <Link className={styles.secondaryLink} href="/login">
          ورود به حساب موجود
        </Link>
      </form>
      <p className={styles.authNote}>در ثبت‌نام نیازی به انتخاب نقش جداگانه نیست؛ هر کاربر می‌تواند بعداً مسیر مناسب خود را ادامه دهد.</p>
    </main>
  );
}
