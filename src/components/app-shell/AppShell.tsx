import type { ReactNode } from "react";
import { Header, type HeaderNotification } from "@/components/header/Header";
import { conversationNotifications } from "@/features/v51/data/conversations";
import { weeklyQuestionNotification } from "@/features/v51/data/experience-questions";
import { getNotificationsForViewer, V51_PROFILE_FIXTURE_OWNER_ID } from "@/features/v51/permissions";
import { getCurrentSession } from "@/lib/auth/session";
import styles from "./AppShell.module.css";

type AppShellProps = Readonly<{
  children: ReactNode;
}>;

function buildHeaderNotifications(viewerId: string): HeaderNotification[] {
  const weeklyNotification: HeaderNotification[] =
    viewerId === V51_PROFILE_FIXTURE_OWNER_ID
      ? [
          {
            id: weeklyQuestionNotification.id,
            title: weeklyQuestionNotification.title,
            body: weeklyQuestionNotification.body,
            href: weeklyQuestionNotification.targetRoute,
            status: "unread",
            timeLabel: "امروز"
          }
        ]
      : [];

  const conversationItems = getNotificationsForViewer({ id: viewerId, role: "USER" }, conversationNotifications).map((notification, index) => ({
    id: notification.id,
    title: notification.title,
    body: notification.message,
    href: notification.targetRoute,
    status: notification.status,
    timeLabel: index === 0 ? "امروز" : `${index + 1} روز پیش`
  }));

  return [...weeklyNotification, ...conversationItems];
}

export async function AppShell({ children }: AppShellProps) {
  const session = await getCurrentSession();
  const viewer = session.viewer;
  const displayName = viewer?.displayName ?? "کاربر";

  return (
    <div className={styles.app}>
      <a className="skip-link" href="#main">
        پرش به محتوای اصلی
      </a>
      <Header
        authState={viewer ? "authenticated" : "guest"}
        currentUser={{
          firstName: displayName,
          initials: displayName.slice(0, 1),
          publicProfileUrl: "/profile"
        }}
        notifications={viewer ? buildHeaderNotifications(viewer.id) : []}
      />
      <main id="main" className={styles.main}>
        {children}
      </main>
    </div>
  );
}
