import {
  formatDuration,
  formatPrice,
  getConversationMessage,
  getConversationStatusLabel,
  getDeadlineText,
  getPersonName,
  getPersonRole,
  getPrimaryConversationAction,
  isNearProviderExpiration,
  type ConversationBucket,
  type ConversationFixture
} from "@/features/v51/data/conversations";
import { StateActionButton } from "./StateActionButton";
import styles from "./ConversationCluster.module.css";

type ConversationCardProps = {
  conversation: ConversationFixture;
  bucket: ConversationBucket;
};

export function ConversationCard({ conversation, bucket }: ConversationCardProps) {
  const action = getPrimaryConversationAction(conversation);
  const deadlineText = getDeadlineText(conversation);
  const selectedOrProposedTime = conversation.selectedTime
    ? `زمان انتخاب‌شده: ${conversation.selectedTime.dateLabel}، ${conversation.selectedTime.timeLabel}`
    : conversation.proposedAtLabel;

  return (
    <article className={`${styles.card} ${bucket === "needsAction" ? styles.cardNeedsAction : ""}`}>
      <div className={styles.topline}>
        <div className={styles.person}>
          <span className={styles.avatar}>{conversation.direction === "incoming" ? "د" : conversation.profile.initials}</span>
          <div>
            <h3 className={styles.name}>{getPersonName(conversation)}</h3>
            <p className={styles.role}>{getPersonRole(conversation)}</p>
          </div>
        </div>
        <span className={`${styles.badge} ${bucket === "needsAction" ? styles.badgeAction : ""}`}>
          {getConversationStatusLabel(conversation)}
        </span>
      </div>

      <div className={styles.badges}>
        <span className={styles.badge}>{formatDuration(conversation.duration)}</span>
        <span className={styles.badge}>{formatPrice(conversation)}</span>
        <span className={styles.badge}>{conversation.submittedAtLabel}</span>
        {deadlineText ? <span className={`${styles.badge} ${styles.badgeDeadline}`}>{deadlineText}</span> : null}
        {selectedOrProposedTime ? <span className={`${styles.badge} ${styles.badgeSoft}`}>{selectedOrProposedTime}</span> : null}
      </div>

      <p className={styles.message}>{getConversationMessage(conversation)}</p>
      {isNearProviderExpiration(conversation) ? <p className={styles.warningBox}>این درخواست تا چند ساعت دیگر منقضی می‌شود.</p> : null}

      <div className={styles.actions}>
        <StateActionButton action={action} />
      </div>
    </article>
  );
}
