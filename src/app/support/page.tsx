import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/PageContainer";
import { V51LinkButton } from "@/features/v51/components/V51Button";
import { SupportFaqClient } from "@/features/v51/support/SupportFaqClient";
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from "@/lib/support";
import styles from "./SupportPage.module.css";

export const metadata: Metadata = {
  title: "پشتیبانی و سوالات متداول"
};

export default function SupportPage() {
  return (
    <PageContainer as="main" variant="empty" className={styles.shell}>
      <header className={styles.hero}>
        <h1>پشتیبانی و سوالات متداول</h1>
        <p>اگر برای استفاده از یوزراوا به راهنمایی نیاز دارید، ابتدا سوالات متداول را ببینید یا از طریق ایمیل با پشتیبانی در ارتباط باشید.</p>
      </header>

      <section className={styles.card} aria-labelledby="support-email-title">
        <div className={styles.cardIntro}>
          <h2>ارتباط با پشتیبانی</h2>
          <p>اگر پاسخ سوال خود را پیدا نکردید، می‌توانید از طریق ایمیل با پشتیبانی یوزراوا در ارتباط باشید.</p>
        </div>
        <div className={styles.emailBlock}>
          <span id="support-email-title">ایمیل پشتیبانی</span>
          <a href={SUPPORT_MAILTO} dir="ltr">
            {SUPPORT_EMAIL}
          </a>
        </div>
        <p className={styles.helper}>لطفاً در ایمیل خود، موضوع درخواست و توضیح کوتاهی از مسئله را بنویسید تا دقیق‌تر بررسی شود.</p>
        <div className={styles.actions}>
          <V51LinkButton href={SUPPORT_MAILTO} tone="primary">
            ارسال ایمیل به پشتیبانی
          </V51LinkButton>
        </div>
      </section>

      <SupportFaqClient />
    </PageContainer>
  );
}
