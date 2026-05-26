import { V51LinkButton } from "@/features/v51/components/V51Button";
import { conversationNotifications } from "@/features/v51/data/conversations";
import { weeklyQuestionNotification } from "@/features/v51/data/experience-questions";
import styles from "./NotificationsPage.module.css";

export function NotificationsPage() {
  return (
    <section className={styles.notificationsShell}>
      <h1>اعلان‌ها</h1>
      <p className={styles.lead}>یادآوری‌های مهم حساب، پروفایل تجربه و جلسه‌های مشاوره.</p>

      <div className={styles.notificationList}>
        <article className={styles.notificationCard}>
          <div>
            <b>{weeklyQuestionNotification.title}</b>
            <p>{weeklyQuestionNotification.body}</p>
          </div>
          <V51LinkButton href={weeklyQuestionNotification.targetRoute} tone="primary">
            رفتن به سؤال
          </V51LinkButton>
        </article>

        {conversationNotifications.map((notification) => (
          <article key={notification.id} className={styles.notificationCard}>
            <div>
              <b>{notification.message}</b>
              <p>{notification.status === "unread" ? "خوانده‌نشده" : "خوانده‌شده"}</p>
            </div>
            <V51LinkButton href={notification.targetRoute} tone="primary">
              مشاهده
            </V51LinkButton>
          </article>
        ))}
      </div>
    </section>
  );
}
