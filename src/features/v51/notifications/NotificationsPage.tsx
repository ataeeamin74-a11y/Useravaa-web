import { UseravaaIcon } from "@/components/ui/UseravaaIcon";
import { conversationNotificationIconNames } from "@/features/v51/conversations/conversation-icon-names";
import { V51LinkButton } from "@/features/v51/components/V51Button";
import { conversationNotifications, type ConversationNotification } from "@/features/v51/data/conversations";
import { weeklyQuestionNotification } from "@/features/v51/data/experience-questions";
import styles from "./NotificationsPage.module.css";

type NotificationsPageProps = Readonly<{
  conversationItems?: readonly ConversationNotification[];
  showWeeklyQuestion?: boolean;
}>;

export function NotificationsPage({ conversationItems = conversationNotifications, showWeeklyQuestion = true }: NotificationsPageProps) {
  return (
    <section className={styles.notificationsShell}>
      <h1>اعلان‌ها</h1>
      <p className={styles.lead}>یادآوری‌های مهم حساب، پروفایل تجربه و جلسه‌های مشاوره.</p>

      <div className={styles.notificationList}>
        {showWeeklyQuestion ? (
          <article className={styles.notificationCard}>
          <div className={styles.notificationContent}>
            <span className={styles.notificationIcon} aria-hidden="true">
              <UseravaaIcon name="insight" size={18} />
            </span>
            <div>
              <b>{weeklyQuestionNotification.title}</b>
              <p>{weeklyQuestionNotification.body}</p>
            </div>
          </div>
          <V51LinkButton href={weeklyQuestionNotification.targetRoute} tone="primary">
            رفتن به سؤال
          </V51LinkButton>
          </article>
        ) : null}

        {conversationItems.map((notification) => (
          <article key={notification.id} className={styles.notificationCard}>
            <div className={styles.notificationContent}>
              <span className={styles.notificationIcon} aria-hidden="true">
                <UseravaaIcon name={conversationNotificationIconNames[notification.type]} size={18} />
              </span>
              <div>
                <b>{notification.message}</b>
                <p>{notification.status === "unread" ? "خوانده‌نشده" : "خوانده‌شده"}</p>
              </div>
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
