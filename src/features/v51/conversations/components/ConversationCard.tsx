"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { MetaChip } from "@/components/ui/MetaChip";
import { UseravaaIcon } from "@/components/ui/UseravaaIcon";
import { V51Button } from "@/features/v51/components/V51Button";
import { getConversationStatusIconName } from "@/features/v51/conversations/conversation-icon-names";
import {
  attendanceVerificationCopy,
  formatDuration,
  getAttendanceVerificationCardHelper,
  getAttendanceVerificationCodeForRequester,
  getAttendanceVerificationStatus,
  getConversationCardStatusLabel,
  getConversationListPaymentLabel,
  getConversationMessage,
  getDeadlineText,
  getPersonName,
  getPersonRole,
  getPrimaryConversationAction,
  isAttendanceVerificationProviderActionRequired,
  isNearProviderExpiration,
  verifySessionAttendanceCode,
  type ConversationAction,
  type ConversationBucket,
  type ConversationFixture
} from "@/features/v51/data/conversations";
import { StateActionButton } from "./StateActionButton";
import styles from "./ConversationCluster.module.css";

type ConversationCardProps = {
  conversation: ConversationFixture;
  bucket: ConversationBucket;
  mode?: "action" | "status";
};

function getStatusInboxAction(conversation: ConversationFixture) {
  if (conversation.status === "confirmed") {
    return {
      kind: "open" as const,
      label: "مشاهده جلسه",
      href: `/conversations/${conversation.id}`,
      tone: "secondary" as const
    };
  }

  if (conversation.status === "pending_payment" || conversation.status === "payment_processing") {
    return {
      kind: "open" as const,
      label: "مشاهده وضعیت",
      href: `/checkout/${conversation.id}`,
      tone: "secondary" as const
    };
  }

  return {
    kind: "open" as const,
    label: "مشاهده",
    href: `/conversations/${conversation.id}`,
    tone: "secondary" as const
  };
}

export function ConversationCard({ conversation, bucket, mode = "action" }: ConversationCardProps) {
  const [currentConversation, setCurrentConversation] = useState(conversation);
  const [copyMessage, setCopyMessage] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationMessage, setVerificationMessage] = useState("");
  const action: ConversationAction = mode === "status" ? getStatusInboxAction(currentConversation) : getPrimaryConversationAction(currentConversation);
  const deadlineText = getDeadlineText(currentConversation);
  const selectedOrProposedTime = currentConversation.selectedTime
    ? `زمان جلسه: ${currentConversation.selectedTime.dateLabel}، ساعت ${currentConversation.selectedTime.timeLabel}`
    : currentConversation.proposedAtLabel;
  const attendanceHelper = getAttendanceVerificationCardHelper(currentConversation);
  const requesterAttendanceCode = mode === "status" ? getAttendanceVerificationCodeForRequester(currentConversation) : null;
  const providerCanVerify = mode === "status" && isAttendanceVerificationProviderActionRequired(currentConversation);
  const attendanceStatus = getAttendanceVerificationStatus(currentConversation);
  const isVerified = attendanceStatus === "VERIFIED";

  const copyAttendanceCode = async () => {
    if (!requesterAttendanceCode) {
      return;
    }

    try {
      await navigator.clipboard.writeText(requesterAttendanceCode);
      setCopyMessage(attendanceVerificationCopy.copied);
    } catch {
      setCopyMessage(attendanceVerificationCopy.copyFailed);
    }
  };

  const submitVerificationCode = () => {
    const result = verifySessionAttendanceCode(currentConversation, verificationCode, currentConversation.providerId);
    setCurrentConversation(result.conversation);
    setVerificationMessage(result.message);

    if (result.success) {
      setVerificationCode("");
    }
  };

  return (
    <article className={`${styles.card} ${bucket === "needsAction" ? styles.cardNeedsAction : ""}`}>
      <div className={styles.topline}>
        <div className={styles.person}>
          <Avatar src={currentConversation.direction === "incoming" ? undefined : currentConversation.profile.avatarUrl} alt="" size="lg" className={styles.avatar} />
          <div>
            <h3 className={styles.name}>{getPersonName(currentConversation)}</h3>
            <p className={styles.role}>{getPersonRole(currentConversation)}</p>
          </div>
        </div>
        <MetaChip className={`${styles.badge} ${bucket === "needsAction" ? styles.badgeAction : ""}`} icon={getConversationStatusIconName(currentConversation.status)} iconSize={14}>
          {getConversationCardStatusLabel(currentConversation)}
        </MetaChip>
      </div>

      <div className={styles.badges}>
        <MetaChip className={styles.badge} icon="sessionTime" iconSize={14}>
          {formatDuration(currentConversation.duration)}
        </MetaChip>
        <MetaChip className={styles.badge} icon="cost" iconSize={14}>
          {getConversationListPaymentLabel(currentConversation)}
        </MetaChip>
        {deadlineText ? (
          <MetaChip className={`${styles.badge} ${styles.badgeDeadline}`} icon="warning" iconSize={14}>
            {deadlineText}
          </MetaChip>
        ) : null}
        {selectedOrProposedTime ? (
          <MetaChip className={`${styles.badge} ${styles.badgeSoft}`} icon="sessionTime" iconSize={14}>
            {selectedOrProposedTime}
          </MetaChip>
        ) : null}
      </div>

      <p className={styles.message}>{getConversationMessage(currentConversation)}</p>
      {attendanceHelper ? (
        <p className={styles.attendanceCardHint}>
          <UseravaaIcon name={currentConversation.direction === "incoming" ? "check" : "info"} size={16} aria-hidden="true" />
          {attendanceHelper}
        </p>
      ) : null}
      {requesterAttendanceCode ? (
        <div className={styles.attendanceCodeInline}>
          <div>
            <strong>{attendanceVerificationCopy.title}</strong>
            <p>لطفاً در شروع گفت‌وگو، این کد را فقط با تجربه‌آفرین همین جلسه به اشتراک بگذارید.</p>
          </div>
          <span className={styles.inlineCodeValue} dir="ltr">
            {requesterAttendanceCode}
          </span>
          <V51Button type="button" className={styles.inlineCopyButton} onClick={copyAttendanceCode}>
            {copyMessage || attendanceVerificationCopy.copy}
          </V51Button>
        </div>
      ) : null}
      {providerCanVerify && !isVerified ? (
        <form
          className={styles.inlineVerificationForm}
          onSubmit={(event) => {
            event.preventDefault();
            submitVerificationCode();
          }}
        >
          <strong>{attendanceVerificationCopy.providerTitle}</strong>
          <label>
            <span>{attendanceVerificationCopy.title}</span>
            <input
              dir="ltr"
              inputMode="numeric"
              maxLength={5}
              placeholder="مثلاً ۴۸۲۹۱"
              value={verificationCode}
              onChange={(event) => setVerificationCode(event.target.value)}
            />
          </label>
          <p>{attendanceVerificationCopy.providerDetail}</p>
          {verificationMessage ? <p className={verificationMessage === attendanceVerificationCopy.wrongCode ? styles.warningBox : styles.attendanceHelper}>{verificationMessage}</p> : null}
          <div className={styles.inlineVerificationActions}>
            <V51Button type="submit" tone="primary" className={styles.inlinePrimaryButton}>
              {attendanceVerificationCopy.providerTitle}
            </V51Button>
            <StateActionButton action={{ kind: "open", label: "مشاهده جلسه", href: `/conversations/${currentConversation.id}`, tone: "secondary" }} />
          </div>
        </form>
      ) : null}
      {isVerified && mode === "status" ? (
        <div className={styles.attendanceVerifiedInline}>
          <span>{attendanceVerificationCopy.verifiedBadge}</span>
          <strong>{attendanceVerificationCopy.verifiedTitle}</strong>
          <p>برگزاری این جلسه ثبت شد و روند تسویه طبق فرایند یوزراوا پردازش می‌شود.</p>
        </div>
      ) : null}
      {isNearProviderExpiration(currentConversation) ? (
        <p className={styles.warningBox}>
          <UseravaaIcon name="warning" size={16} aria-hidden="true" />
          این درخواست تا چند ساعت دیگر منقضی می‌شود.
        </p>
      ) : null}

      <div className={styles.actions}>
        <StateActionButton action={action} />
      </div>
      {action.disabledMessage ? <p className={styles.disabledReason}>{action.disabledMessage}</p> : null}
    </article>
  );
}
