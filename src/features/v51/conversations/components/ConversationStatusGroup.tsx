import { UseravaaIcon } from "@/components/ui/UseravaaIcon";
import { conversationSectionIconNames } from "@/features/v51/conversations/conversation-icon-names";
import type { ConversationBucket, ConversationFixture, ConversationStatusSectionKey } from "@/features/v51/data/conversations";
import { formatFaNumber } from "@/lib/fa-format";
import { ConversationStatusRow } from "./ConversationStatusRow";
import styles from "./ConversationCluster.module.css";

type ConversationStatusGroupProps = {
  section: ConversationStatusSectionKey;
  conversations: readonly ConversationFixture[];
  defaultOpen?: boolean;
};

const groupCopy: Record<ConversationStatusSectionKey, { title: string; description: string; bucket: ConversationBucket }> = {
  inProgress: {
    title: "در جریان",
    description: "درخواست‌هایی که هنوز به نتیجه نهایی نرسیده‌اند.",
    bucket: "tracking"
  },
  confirmedSessions: {
    title: "جلسه‌های قطعی",
    description: "جلسه‌هایی که زمان آن‌ها مشخص شده است.",
    bucket: "done"
  },
  history: {
    title: "گذشته و بسته‌شده",
    description: "درخواست‌ها و جلسه‌هایی که کامل، لغو یا منقضی شده‌اند.",
    bucket: "done"
  }
};

export function ConversationStatusGroup({ section, conversations, defaultOpen }: ConversationStatusGroupProps) {
  const copy = groupCopy[section];

  if (conversations.length === 0) {
    return null;
  }

  return (
    <details className={styles.group} open={defaultOpen}>
      <summary className={styles.groupHead}>
        <div className={styles.groupTitle}>
          <div className={styles.groupTitleLine}>
            <UseravaaIcon name={conversationSectionIconNames[section]} size={18} aria-hidden="true" />
            <h2>{copy.title}</h2>
          </div>
          <p>{copy.description}</p>
        </div>
        <span className={styles.groupSummaryMeta}>
          <span className={styles.count}>{formatFaNumber(conversations.length)}</span>
          <UseravaaIcon name="dropdown" size={18} aria-hidden="true" />
        </span>
      </summary>
      <div className={styles.statusRows}>
        {conversations.map((conversation) => (
          <ConversationStatusRow key={conversation.id} conversation={conversation} bucket={copy.bucket} />
        ))}
      </div>
    </details>
  );
}
