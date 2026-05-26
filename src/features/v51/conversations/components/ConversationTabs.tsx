import type { ConversationDirection, ConversationFixture } from "@/features/v51/data/conversations";
import { groupConversations } from "@/features/v51/data/conversations";
import styles from "./ConversationCluster.module.css";

type ConversationTabsProps = {
  activeTab: ConversationDirection;
  conversations: readonly ConversationFixture[];
  onTabChange: (direction: ConversationDirection) => void;
};

export function ConversationTabs({ activeTab, conversations, onTabChange }: ConversationTabsProps) {
  const sentGroups = groupConversations(conversations, "outgoing");
  const receivedGroups = groupConversations(conversations, "incoming");
  const sentCount = sentGroups.needsAction.length + sentGroups.tracking.length + sentGroups.done.length;
  const receivedCount = receivedGroups.needsAction.length + receivedGroups.tracking.length + receivedGroups.done.length;

  return (
    <div className={styles.tabs} role="tablist" aria-label="جلسه‌ها">
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === "outgoing"}
        className={`${styles.tab} ${activeTab === "outgoing" ? styles.tabActive : ""}`}
        onClick={() => onTabChange("outgoing")}
      >
        درخواست‌های من ({sentCount})
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === "incoming"}
        className={`${styles.tab} ${activeTab === "incoming" ? styles.tabActive : ""}`}
        onClick={() => onTabChange("incoming")}
      >
        درخواست‌های دریافتی ({receivedCount})
      </button>
    </div>
  );
}
