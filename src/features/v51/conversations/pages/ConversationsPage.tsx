"use client";

import { useMemo, useState } from "react";
import { V51LinkButton } from "@/features/v51/components/V51Button";
import {
  conversations as defaultConversations,
  groupConversationStatusSections,
  hasConversationStarted,
  resolveUserActions,
  type ConversationDirection,
  type ConversationFixture
} from "@/features/v51/data/conversations";
import { formatFaNumber } from "@/lib/fa-format";
import { ConversationStatusGroup } from "../components/ConversationStatusGroup";
import { ConversationTabs } from "../components/ConversationTabs";
import styles from "../components/ConversationCluster.module.css";

type ConversationsPageProps = {
  initialConversations?: readonly ConversationFixture[];
  initialTab?: ConversationDirection;
  title?: string;
  lead?: string;
};

export function ConversationsPage({
  initialConversations = defaultConversations,
  initialTab = "outgoing",
  title = "جلسه‌ها",
  lead = "درخواست‌ها و جلسه‌های خود را پیگیری کنید."
}: ConversationsPageProps) {
  const [activeTab, setActiveTab] = useState<ConversationDirection>(initialTab);
  const groups = useMemo(() => groupConversationStatusSections(initialConversations, activeTab), [activeTab, initialConversations]);
  const actionCount = useMemo(() => resolveUserActions(initialConversations).length, [initialConversations]);
  const visibleCount = groups.inProgress.length + groups.confirmedSessions.length + groups.history.length;
  const activeTabHelper =
    activeTab === "outgoing" ? "درخواست‌ها و جلسه‌هایی که شما شروع کرده‌اید." : "درخواست‌هایی که برای گفت‌وگو با شما ثبت شده‌اند.";
  const shouldOpenConfirmed = groups.confirmedSessions.some((conversation) => hasConversationStarted(conversation) || conversation.selectedTime?.startAt);

  return (
    <div className={styles.shell}>
      <section className={styles.hero}>
        <div className={styles.heroText}>
          <h1>{title}</h1>
          <p className={styles.lead}>{lead}</p>
        </div>
        <V51LinkButton href="/discover" tone="primary">
          کشف تجربه‌ها
        </V51LinkButton>
      </section>

      <ConversationTabs activeTab={activeTab} conversations={initialConversations} onTabChange={setActiveTab} />

      <p className={styles.tabHelper}>{activeTabHelper}</p>

      {actionCount > 0 ? (
        <section className={styles.actionStrip}>
          <div>
            <strong>{formatFaNumber(actionCount)} اقدام باز دارید.</strong>
            <p>برای ادامه مسیر، اقدام‌های لازم را در صفحه اقدام‌ها انجام دهید.</p>
          </div>
          <V51LinkButton href="/actions" tone="primary">
            مشاهده اقدام‌ها
          </V51LinkButton>
        </section>
      ) : null}

      {visibleCount > 0 ? (
        <div className={styles.content}>
          <ConversationStatusGroup section="inProgress" conversations={groups.inProgress} defaultOpen={groups.inProgress.length > 0} />
          <ConversationStatusGroup section="confirmedSessions" conversations={groups.confirmedSessions} defaultOpen={shouldOpenConfirmed} />
          <ConversationStatusGroup section="history" conversations={groups.history} defaultOpen={false} />
        </div>
      ) : (
        <div className={styles.empty}>هنوز موردی برای نمایش وجود ندارد.</div>
      )}
    </div>
  );
}
