"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { MetaChip } from "@/components/ui/MetaChip";
import { UseravaaIcon, type UseravaaIconName } from "@/components/ui/UseravaaIcon";
import { V51Button } from "@/features/v51/components/V51Button";
import {
  attendanceVerificationCopy,
  formatDuration,
  formatPrice,
  getAttendanceVerificationCardHelper,
  getAttendanceVerificationCodeForRequester,
  getAttendanceVerificationStatus,
  getCancellationStatusDescription,
  getCancellationStatusTitle,
  getConversationListPaymentLabel,
  getDeadlineText,
  getRejectedStatusDescription,
  getRejectedStatusTitle,
  getPersonName,
  getPersonRole,
  newTimeRequestCopy,
  providerTimeReplacementCopy,
  isAttendanceVerificationProviderActionRequired,
  verifySessionAttendanceCode,
  type ConversationAction,
  type ConversationBucket,
  type ConversationFixture
} from "@/features/v51/data/conversations";
import { StateActionButton } from "./StateActionButton";
import styles from "./ConversationCluster.module.css";

type ConversationStatusRowProps = {
  conversation: ConversationFixture;
  bucket: ConversationBucket;
};

type StatusChip = {
  label: string;
  icon: UseravaaIconName;
  className?: string;
};

function getStatusInboxAction(conversation: ConversationFixture): ConversationAction {
  if (conversation.status === "cancelled" || conversation.status === "refunded" || conversation.status === "rejected" || conversation.status === "expired") {
    return {
      kind: "open",
      label: "مشاهده جزئیات",
      href: `/conversations/${conversation.id}`,
      tone: "secondary"
    };
  }

  if (conversation.status === "new_time_requested") {
    return conversation.direction === "incoming"
      ? {
          kind: "propose_times",
          label: newTimeRequestCopy.providerActionTitle,
          href: `/conversations/${conversation.id}/propose-times`,
          tone: "primary"
        }
      : {
          kind: "open",
          label: "مشاهده جزئیات",
          href: `/conversations/${conversation.id}`,
          tone: "secondary"
        };
  }

  if (conversation.status === "confirmed") {
    return {
      kind: "open",
      label: "مشاهده جلسه",
      href: `/conversations/${conversation.id}`,
      tone: "secondary"
    };
  }

  if (conversation.direction === "outgoing" && conversation.status === "times_proposed") {
    return {
      kind: "select_time",
      label: providerTimeReplacementCopy.requesterCta,
      href: `/conversations/${conversation.id}/select-time`,
      tone: "primary"
    };
  }

  if (conversation.status === "pending_payment" || conversation.status === "payment_processing") {
    return {
      kind: "open",
      label: "مشاهده وضعیت",
      href: `/checkout/${conversation.id}`,
      tone: "secondary"
    };
  }

  return {
    kind: "open",
    label: "مشاهده جزئیات",
    href: `/conversations/${conversation.id}`,
    tone: "secondary"
  };
}

function getSelectedTimeLabel(conversation: ConversationFixture) {
  if (!conversation.selectedTime) {
    return "";
  }

  return `${conversation.selectedTime.dateLabel}، ساعت ${conversation.selectedTime.timeLabel}`;
}

function getStatusTitle(conversation: ConversationFixture) {
  const attendanceStatus = getAttendanceVerificationStatus(conversation);

  if (attendanceStatus === "VERIFIED") {
    return attendanceVerificationCopy.verifiedTitle;
  }

  if (isAttendanceVerificationProviderActionRequired(conversation)) {
    return attendanceVerificationCopy.providerTitle;
  }

  if (conversation.status === "times_proposed") {
    if (conversation.direction === "outgoing" && (conversation.timeOptionsVersion ?? 1) > 1) {
      return providerTimeReplacementCopy.requesterTitle;
    }

    if (conversation.direction === "incoming" && (conversation.timeOptionsVersion ?? 1) > 1) {
      return providerTimeReplacementCopy.providerStatusTitle;
    }

    return conversation.direction === "outgoing" ? "انتخاب زمان در انتظار شماست" : "در انتظار انتخاب زمان";
  }

  if (conversation.status === "new_time_requested") {
    return conversation.direction === "incoming" ? newTimeRequestCopy.providerTitle : newTimeRequestCopy.requesterWaitingTitle;
  }

  if (conversation.status === "pending_provider_response") {
    return conversation.direction === "incoming" ? "پیشنهاد زمان در انتظار شماست" : "در انتظار پیشنهاد زمان";
  }

  if (conversation.status === "payment_processing") {
    return "پرداخت در حال بررسی است";
  }

  if (conversation.status === "pending_payment") {
    return "پرداخت درخواست در انتظار شماست";
  }

  if (conversation.status === "payment_not_required") {
    return "ثبت نهایی درخواست رایگان";
  }

  if (conversation.status === "confirmed") {
    return "جلسه قطعی";
  }

  if (conversation.status === "completed") {
    return "جلسه تکمیل شده است";
  }

  if (conversation.status === "cancelled") {
    return getCancellationStatusTitle(conversation);
  }

  if (conversation.status === "rejected") {
    return getRejectedStatusTitle(conversation);
  }

  return "درخواست بسته شده است";
}

function getStatusDescription(conversation: ConversationFixture) {
  const attendanceStatus = getAttendanceVerificationStatus(conversation);
  const selectedTime = getSelectedTimeLabel(conversation);
  const personName = getPersonName(conversation);
  const attendanceHelper = getAttendanceVerificationCardHelper(conversation);

  if (attendanceStatus === "VERIFIED") {
    return "برگزاری این جلسه ثبت شد و روند تسویه طبق فرایند یوزراوا پردازش می‌شود.";
  }

  if (isAttendanceVerificationProviderActionRequired(conversation)) {
    return "جلسه شروع شده یا برگزار شده است. لطفاً کد تأیید برگزاری را وارد کنید تا برگزاری جلسه ثبت شود.";
  }

  if (conversation.status === "times_proposed") {
    if (conversation.direction === "outgoing" && (conversation.timeOptionsVersion ?? 1) > 1) {
      return providerTimeReplacementCopy.requesterRowDescription;
    }

    if (conversation.direction === "incoming" && (conversation.timeOptionsVersion ?? 1) > 1) {
      return providerTimeReplacementCopy.providerStatusDescription;
    }

    return conversation.direction === "outgoing"
      ? "زمان‌های پیشنهادی آماده‌اند. لطفاً یکی از زمان‌ها را تا پایان مهلت انتخاب کنید."
      : "سه زمان پیشنهادی ارسال شده و در انتظار انتخاب درخواست‌دهنده است.";
  }

  if (conversation.status === "new_time_requested") {
    return conversation.direction === "incoming" ? newTimeRequestCopy.providerDescription : newTimeRequestCopy.requesterWaitingDescription;
  }

  if (conversation.status === "pending_provider_response") {
    return conversation.direction === "incoming"
      ? "درخواست پرداخت‌شده‌ای برای گفت‌وگو دریافت کرده‌اید. لطفاً سه زمان پیشنهادی ثبت کنید."
      : "درخواست شما ارسال شده و در انتظار اعلام سه زمان پیشنهادی است.";
  }

  if (conversation.status === "payment_processing") {
    return "اطلاعات پرداخت شما ثبت شده و پس از تأیید، درخواست برای تجربه‌آفرین ارسال می‌شود.";
  }

  if (conversation.status === "pending_payment") {
    return "برای ارسال درخواست، پرداخت امن را تکمیل کنید. جلسه بعد از انتخاب زمان قطعی می‌شود.";
  }

  if (conversation.status === "payment_not_required") {
    return "این درخواست نیازی به پرداخت ندارد و با ثبت نهایی برای تجربه‌آفرین ارسال می‌شود.";
  }

  if (conversation.status === "confirmed") {
    if (attendanceHelper) {
      return attendanceHelper;
    }

    if (selectedTime) {
      return conversation.direction === "incoming"
        ? `جلسه با ${personName} برای ${selectedTime} قطعی شده است.`
        : `جلسه شما برای ${selectedTime} قطعی شده است.`;
    }

    return conversation.direction === "incoming" ? `جلسه با ${personName} قطعی شده است.` : "جلسه شما قطعی شده است.";
  }

  if (conversation.status === "completed") {
    return "این جلسه تکمیل شده و در بخش گذشته نگه‌داری می‌شود.";
  }

  if (conversation.status === "refunded") {
    return "این درخواست بازگشت داده شده و در وضعیت بسته قرار دارد.";
  }

  if (conversation.status === "cancelled") {
    return getCancellationStatusDescription(conversation);
  }

  if (conversation.status === "rejected") {
    return getRejectedStatusDescription(conversation);
  }

  return "این درخواست دیگر فعال نیست و در بخش گذشته نگه‌داری می‌شود.";
}

function getStatusChips(conversation: ConversationFixture): StatusChip[] {
  const deadlineText = getDeadlineText(conversation);
  const selectedTime = getSelectedTimeLabel(conversation);
  const proposedLabel = conversation.proposedAtLabel ?? "";
  const chips: StatusChip[] = [
    {
      label: formatDuration(conversation.duration),
      icon: "sessionTime"
    }
  ];

  if (conversation.status === "cancelled") {
    return [
      {
        label: getCancellationStatusTitle(conversation),
        icon: "warning",
        className: styles.statusChipDanger
      },
      {
        label: formatDuration(conversation.duration),
        icon: "sessionTime"
      }
    ];
  }

  if (conversation.status === "rejected") {
    return [
      {
        label: getRejectedStatusTitle(conversation),
        icon: "archive",
        className: styles.statusChipSoft
      },
      {
        label: formatDuration(conversation.duration),
        icon: "sessionTime"
      }
    ];
  }

  if (conversation.status === "new_time_requested") {
    chips.push({
      label: newTimeRequestCopy.cta,
      icon: "reply",
      className: styles.statusChipSoft
    });

    return chips.slice(0, 3);
  }

  if (conversation.direction === "incoming") {
    chips.push({
      label: `مبلغ گفت‌وگو: ${formatPrice(conversation)}`,
      icon: "cost"
    });

    if (selectedTime) {
      chips.push({
        label: `زمان جلسه: ${selectedTime}`,
        icon: "calendar",
        className: styles.statusChipSoft
      });
    } else if (deadlineText) {
      chips.push({
        label: deadlineText,
        icon: "sessionTime",
        className: styles.statusChipDeadline
      });
    } else if (proposedLabel) {
      chips.push({
        label: proposedLabel,
        icon: "calendar",
        className: styles.statusChipSoft
      });
    }

    return chips.slice(0, 3);
  }

  if (selectedTime) {
    chips.push({
      label: `زمان جلسه: ${selectedTime}`,
      icon: "calendar",
      className: styles.statusChipSoft
    });
  } else if (deadlineText) {
    chips.push({
      label: deadlineText,
      icon: "sessionTime",
      className: styles.statusChipDeadline
    });
  } else if (proposedLabel) {
    chips.push({
      label: proposedLabel,
      icon: "calendar",
      className: styles.statusChipSoft
    });
  }

  chips.push({
    label: getConversationListPaymentLabel(conversation),
    icon: "check"
  });

  return chips.slice(0, 3);
}

function normalizeVerificationCode(value: string) {
  return value
    .replace(/[^\d۰-۹٠-٩]/g, "")
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .slice(0, 5);
}

export function ConversationStatusRow({ conversation, bucket }: ConversationStatusRowProps) {
  const [currentConversation, setCurrentConversation] = useState(conversation);
  const [copyMessage, setCopyMessage] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationMessage, setVerificationMessage] = useState("");
  const requesterAttendanceCode = getAttendanceVerificationCodeForRequester(currentConversation);
  const providerCanVerify = isAttendanceVerificationProviderActionRequired(currentConversation);
  const attendanceStatus = getAttendanceVerificationStatus(currentConversation);
  const isVerified = attendanceStatus === "VERIFIED";
  const action = getStatusInboxAction(currentConversation);
  const statusChips = getStatusChips(currentConversation);
  const directionLabel = currentConversation.direction === "incoming" ? "درخواست دریافتی" : "درخواست ارسالی";
  const directionIcon: UseravaaIconName = currentConversation.direction === "incoming" ? "message" : "send";

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
    <article
      className={`${styles.statusRow} ${bucket === "needsAction" ? styles.statusRowAction : ""} ${
        currentConversation.status === "cancelled" ? styles.statusRowCancelled : ""
      }`}
    >
      <div className={styles.statusActionSlot}>
        {requesterAttendanceCode ? (
          <div className={styles.attendanceCodeModule}>
            <strong>{attendanceVerificationCopy.title}</strong>
            <div className={styles.attendanceCodeValueRow}>
              <span className={styles.inlineCodeValue} dir="ltr">
                {requesterAttendanceCode}
              </span>
              <V51Button type="button" className={styles.inlineCopyButton} onClick={copyAttendanceCode}>
                {copyMessage || attendanceVerificationCopy.copy}
              </V51Button>
            </div>
            <StateActionButton action={{ kind: "open", label: "مشاهده جلسه", href: `/conversations/${currentConversation.id}`, tone: "secondary" }} />
          </div>
        ) : providerCanVerify && !isVerified ? (
          <form
            className={styles.attendanceEntryModule}
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
                onChange={(event) => {
                  setVerificationCode(normalizeVerificationCode(event.target.value));
                  setVerificationMessage("");
                }}
              />
            </label>
            {verificationMessage ? <p className={verificationMessage === attendanceVerificationCopy.wrongCode ? styles.statusInlineWarning : styles.statusInlineHelper}>{verificationMessage}</p> : null}
            <V51Button type="submit" tone="primary" className={styles.inlinePrimaryButton}>
              ثبت برگزاری
            </V51Button>
            <StateActionButton action={{ kind: "open", label: "مشاهده جلسه", href: `/conversations/${currentConversation.id}`, tone: "secondary" }} />
          </form>
        ) : isVerified ? (
          <div className={styles.attendanceVerifiedModule}>
            <strong>{attendanceVerificationCopy.verifiedBadge}</strong>
            <StateActionButton action={{ kind: "open", label: "مشاهده جلسه", href: `/conversations/${currentConversation.id}`, tone: "secondary" }} />
          </div>
        ) : (
          <>
            <StateActionButton action={action} />
            {action.disabledMessage ? <p className={styles.disabledReason}>{action.disabledMessage}</p> : null}
          </>
        )}
      </div>

      <div className={styles.statusContent}>
        <h3 className={styles.statusTitle}>{getStatusTitle(currentConversation)}</h3>
        <p className={styles.statusDescription}>{getStatusDescription(currentConversation)}</p>
        <div className={styles.statusMetaChips}>
          {statusChips.map((chip) => (
            <MetaChip key={`${currentConversation.id}-${chip.label}`} className={`${styles.badge} ${chip.className ?? ""}`} icon={chip.icon} iconSize={14}>
              {chip.label}
            </MetaChip>
          ))}
        </div>
      </div>

      <div className={styles.statusIdentity}>
        <Avatar src={currentConversation.direction === "incoming" ? undefined : currentConversation.profile.avatarUrl} alt="" size="lg" className={styles.statusAvatar} />
        <div className={styles.statusIdentityText}>
          <h3 className={styles.name}>{getPersonName(currentConversation)}</h3>
          <p className={styles.role}>{getPersonRole(currentConversation)}</p>
          <span className={`${styles.statusDirectionBadge} ${currentConversation.direction === "incoming" ? styles.statusDirectionReceived : styles.statusDirectionSent}`}>
            <UseravaaIcon name={directionIcon} size={14} aria-hidden="true" />
            {directionLabel}
          </span>
        </div>
      </div>
    </article>
  );
}
