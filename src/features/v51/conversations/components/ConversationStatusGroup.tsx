import type { ConversationBucket, ConversationFixture } from "@/features/v51/data/conversations";
import { bucketConversation } from "@/features/v51/data/conversations";
import { ConversationCard } from "./ConversationCard";
import styles from "./ConversationCluster.module.css";

type ConversationStatusGroupProps = {
  bucket: ConversationBucket;
  conversations: readonly ConversationFixture[];
  emptyText: string;
};

const groupCopy: Record<ConversationBucket, { title: string; description: string }> = {
  needsAction: {
    title: "نیازمند اقدام",
    description: "این موارد باید جلو بروند."
  },
  tracking: {
    title: "در حال پیگیری",
    description: "فعلاً فقط وضعیتشان را مرور کن."
  },
  done: {
    title: "تمام‌شده",
    description: "برای سابقه و بازخورد."
  }
};

export function ConversationStatusGroup({ bucket, conversations, emptyText }: ConversationStatusGroupProps) {
  const copy = groupCopy[bucket];

  return (
    <section className={`${styles.group} ${bucket === "needsAction" ? styles.groupAction : ""}`}>
      <div className={styles.groupHead}>
        <div className={styles.groupTitle}>
          <h2>{copy.title}</h2>
          <p>{copy.description}</p>
        </div>
        <span className={styles.count}>{conversations.length}</span>
      </div>
      {conversations.length > 0 ? (
        <div className={styles.list}>
          {conversations.map((conversation) => (
            <ConversationCard key={conversation.id} conversation={conversation} bucket={bucketConversation(conversation)} />
          ))}
        </div>
      ) : (
        <div className={styles.empty}>{emptyText}</div>
      )}
    </section>
  );
}
