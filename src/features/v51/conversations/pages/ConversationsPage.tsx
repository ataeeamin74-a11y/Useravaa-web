"use client";

import { useMemo, useState } from "react";
import { V51LinkButton } from "@/features/v51/components/V51Button";
import {
  conversations as defaultConversations,
  groupConversations,
  type ConversationDirection,
  type ConversationFixture
} from "@/features/v51/data/conversations";
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
  lead = "درخواست‌های جلسه مشاوره و زمان‌های پیشنهادی‌ات را اینجا پیگیری کن."
}: ConversationsPageProps) {
  const [activeTab, setActiveTab] = useState<ConversationDirection>(initialTab);
  const groups = useMemo(() => groupConversations(initialConversations, activeTab), [activeTab, initialConversations]);
  const visibleCount = groups.needsAction.length + groups.tracking.length + groups.done.length;
  const actionCount = groups.needsAction.length;
  const isOutgoing = activeTab === "outgoing";

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

      <div className={styles.summary}>
        {isOutgoing
          ? `${visibleCount} درخواست فرستاده‌ای؛ ${actionCount} مورد نیاز به اقدام دارد.`
          : `${visibleCount} درخواست برای تو آمده؛ ${actionCount} مورد نیاز به اقدام دارد.`}
      </div>

      {visibleCount > 0 ? (
        <div className={styles.content}>
          <ConversationStatusGroup bucket="needsAction" conversations={groups.needsAction} emptyText="مورد نیازمند اقدامی نداری." />
          <ConversationStatusGroup bucket="tracking" conversations={groups.tracking} emptyText="درخواستی برای پیگیری وجود ندارد." />
          <ConversationStatusGroup bucket="done" conversations={groups.done} emptyText="جلسه تمام‌شده‌ای وجود ندارد." />
        </div>
      ) : (
        <div className={styles.empty}>{isOutgoing ? "هنوز درخواستی نفرستاده‌ای." : "هنوز درخواستی برای تو نیامده است."}</div>
      )}
    </div>
  );
}
