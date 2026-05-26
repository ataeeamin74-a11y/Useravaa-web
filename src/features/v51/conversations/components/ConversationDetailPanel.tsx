import {
  cancelConversation,
  conversationReliabilityCopy,
  formatDuration,
  formatPrice,
  getSessionCoordinationContact,
  getConversationActions,
  getConversationStatusLabel,
  getDeadlineText,
  getNextActionText,
  getPersonName,
  getPersonRole,
  postPaymentContactCopy,
  getSimilarExperiences,
  isNearProviderExpiration,
  rejectConversation,
  type ConversationAction,
  type ConversationFixture
} from "@/features/v51/data/conversations";
import { V51LinkButton } from "@/features/v51/components/V51Button";
import { StateActionButton } from "./StateActionButton";
import styles from "./ConversationCluster.module.css";

type ConversationDetailPanelProps = {
  conversation: ConversationFixture;
  onConversationChange?: (conversation: ConversationFixture) => void;
};

function SessionContactAccess({ conversation }: Readonly<{ conversation: ConversationFixture }>) {
  const contact = getSessionCoordinationContact(conversation);

  if (!contact) {
    return (
      <section className={styles.contactBox} aria-label={postPaymentContactCopy.lockedTitle}>
        <h2>{postPaymentContactCopy.lockedTitle}</h2>
        <p>{postPaymentContactCopy.lockedHelper}</p>
        {conversation.status === "pending_payment" ? (
          <div className={styles.actions}>
            <V51LinkButton href={`/checkout/${conversation.id}`} tone="primary">
              پرداخت و ثبت جلسه
            </V51LinkButton>
          </div>
        ) : null}
      </section>
    );
  }

  return (
    <section className={styles.contactBox} aria-label={postPaymentContactCopy.unlockedTitle}>
      <h2>{postPaymentContactCopy.unlockedTitle}</h2>
      <p>{postPaymentContactCopy.unlockedHelper}</p>
      <div className={styles.contactRows}>
        <div className={styles.contactRow}>
          <span>شماره تماس</span>
          <strong dir="ltr">{contact.phoneNumber || postPaymentContactCopy.missingPhone}</strong>
        </div>
        <div className={styles.contactRow}>
          <span>ایمیل</span>
          <strong dir="ltr">{contact.email || postPaymentContactCopy.missingEmail}</strong>
        </div>
      </div>
    </section>
  );
}

export function ConversationDetailPanel({ conversation, onConversationChange }: ConversationDetailPanelProps) {
  const actions = getConversationActions(conversation);
  const deadlineText = getDeadlineText(conversation);
  const similarExperiences = getSimilarExperiences(conversation);

  const handleAction = (action: ConversationAction) => {
    if (action.kind === "cancel") {
      onConversationChange?.(cancelConversation(conversation));
    }

    if (action.kind === "reject") {
      onConversationChange?.(rejectConversation(conversation));
    }
  };

  return (
    <div className={styles.detailGrid}>
      <section className={styles.panel}>
        <div className={styles.topline}>
          <div className={styles.person}>
            <span className={styles.avatar}>{conversation.direction === "incoming" ? "د" : conversation.profile.initials}</span>
            <div>
              <h2>{getPersonName(conversation)}</h2>
              <p className={styles.role}>{getPersonRole(conversation)}</p>
            </div>
          </div>
          <span className={`${styles.badge} ${styles.badgeAction}`}>{getConversationStatusLabel(conversation)}</span>
        </div>

        <div className={styles.badges}>
          <span className={styles.badge}>{formatDuration(conversation.duration)}</span>
          <span className={styles.badge}>{formatPrice(conversation)}</span>
          <span className={styles.badge}>{conversation.submittedAtLabel}</span>
          {deadlineText ? <span className={`${styles.badge} ${styles.badgeDeadline}`}>{deadlineText}</span> : null}
          {conversation.selectedTime ? (
            <span className={`${styles.badge} ${styles.badgeSoft}`}>
              {conversation.selectedTime.dateLabel}، {conversation.selectedTime.timeLabel}
            </span>
          ) : null}
        </div>

        <p className={styles.infoBox}>{getNextActionText(conversation)}</p>
        {isNearProviderExpiration(conversation) ? <p className={styles.warningBox}>{conversationReliabilityCopy.nearExpirationWarning}</p> : null}

        <SessionContactAccess conversation={conversation} />

        <h2>جزئیات درخواست</h2>
        <div className={styles.summaryRows}>
          <div className={styles.summaryRow}>
            <span>مدت جلسه مشاوره</span>
            <strong>{formatDuration(conversation.duration)}</strong>
          </div>
          <div className={styles.summaryRow}>
            <span>زمان انتخاب‌شده</span>
            <strong>
              {conversation.selectedTime ? `${conversation.selectedTime.dateLabel}، ${conversation.selectedTime.timeLabel}` : "هنوز انتخاب نشده است"}
            </strong>
          </div>
          <div className={styles.summaryRow}>
            <span>توضیح</span>
            <strong>{conversation.note}</strong>
          </div>
        </div>
        {similarExperiences.length > 0 ? (
          <section className={styles.similarSection} aria-label={conversationReliabilityCopy.similarTitle}>
            <h2>{conversationReliabilityCopy.similarTitle}</h2>
            <div className={styles.similarGrid}>
              {similarExperiences.map((profile) => (
                <a key={profile.profileId} href={`/profiles/${profile.profileId}`} className={styles.similarCard}>
                  <strong>{profile.displayName}</strong>
                  <span>{profile.jobTitle}</span>
                  <small>
                    {profile.jobField} · {profile.orgLevel}
                  </small>
                </a>
              ))}
            </div>
          </section>
        ) : null}
      </section>

      <aside className={styles.panel}>
        <h2>اقدام بعدی</h2>
        <div className={styles.actions}>
          {actions.map((action) => (
            <StateActionButton key={action.kind} action={action} onAction={handleAction} />
          ))}
        </div>

        <h2>جریان جلسه</h2>
        <div className={styles.timeline}>
          <div className={styles.timelineStep}>
            <strong>درخواست ثبت شد</strong>
            <span>درخواست جلسه مشاوره ساخته شد.</span>
          </div>
          <div className={styles.timelineStep}>
            <strong>زمان هماهنگ می‌شود</strong>
            <span>ارائه‌دهنده حداقل سه زمان پیشنهاد می‌دهد.</span>
          </div>
          <div className={styles.timelineStep}>
            <strong>نهایی‌سازی</strong>
            <span>بعد از انتخاب زمان، پرداخت انجام می‌شود.</span>
          </div>
          <div className={styles.timelineStep}>
            <strong>جلسه و بازخورد</strong>
            <span>بعد از جلسه مشاوره، بازخورد ثبت می‌شود.</span>
          </div>
        </div>
      </aside>
    </div>
  );
}
