"use client";

import { useState } from "react";
import { UseravaaIcon } from "@/components/ui/UseravaaIcon";
import { V51Button, V51LinkButton } from "@/features/v51/components/V51Button";
import {
  applyExpiration,
  cancelConversation,
  expiredTimeSelectionMessage,
  getActiveProposedTimes,
  getConversationRouteAccess,
  getRepeatRequestHref,
  isProposedTimeExpired,
  isProposedTimeSelectableByRequester,
  providerTimeReplacementCopy,
  requestNewTimesCtaLabel,
  repeatRequestCtaLabel,
  selectTimeForConversation,
  type ConversationFixture
} from "@/features/v51/data/conversations";
import { ConversationDetailPanel } from "../components/ConversationDetailPanel";
import styles from "../components/ConversationCluster.module.css";

type SelectTimePageProps = {
  initialConversation: ConversationFixture;
};

function isSuccessfulSelection(conversation: ConversationFixture) {
  return conversation.status === "confirmed";
}

export function ConfirmedSelectionSuccessPage({ conversation }: Readonly<{ conversation: ConversationFixture }>) {
  return <ConversationDetailPanel conversation={conversation} />;
}

export function SelectTimePage({ initialConversation }: SelectTimePageProps) {
  const [conversation, setConversation] = useState(() => applyExpiration(initialConversation));
  const [selectedTimeId, setSelectedTimeId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [selectionError, setSelectionError] = useState("");
  const routeAccess = getConversationRouteAccess(conversation, "selectTime");
  const selectionAllowed = routeAccess.allowed && conversation.status === "times_proposed";
  const activeProposedTimes = getActiveProposedTimes(conversation);
  const hasNewTimeOptions = (conversation.timeOptionsVersion ?? 1) > 1;
  const submitLabel = !selectedTimeId ? "انتخاب زمان" : "انتخاب و قطعی کردن جلسه";
  const isExpiredState = conversation.status === "expired" || routeAccess.disabledReason === "REQUEST_EXPIRED";
  const hasSelectableOptions = activeProposedTimes.some((time) => isProposedTimeSelectableByRequester(time));

  const handleSelectTime = (timeId: string, disabled: boolean) => {
    if (disabled) {
      return;
    }

    setSelectedTimeId(timeId);
    setSelectionError("");
  };

  const submitSelection = () => {
    if (!selectedTimeId || !selectionAllowed) {
      return;
    }

    const nextConversation = selectTimeForConversation(conversation, selectedTimeId);
    const success = isSuccessfulSelection(nextConversation);

    setConversation(nextConversation);
    setSubmitted(success);

    if (!success) {
      setSelectionError(nextConversation.status === "expired" ? expiredTimeSelectionMessage : "این زمان دیگر قابل انتخاب نیست.");
      setSelectedTimeId(null);
    }
  };

  const cancelSelection = () => {
    setConversation((current) => cancelConversation(current));
    setSubmitted(true);
  };

  if (submitted && isSuccessfulSelection(conversation)) {
    return <ConfirmedSelectionSuccessPage conversation={conversation} />;
  }

  if (isExpiredState || !routeAccess.allowed || (selectionAllowed && !hasSelectableOptions)) {
    const isAllTimesExpired = selectionAllowed && !hasSelectableOptions;

    return (
      <div className={styles.shell}>
        <section className={styles.hero}>
          <div className={styles.heroText}>
            <h1>{isAllTimesExpired ? "زمان‌های پیشنهادی منقضی شدند" : "انتخاب زمان"}</h1>
            <p className={styles.lead}>
              {isExpiredState || isAllTimesExpired ? expiredTimeSelectionMessage : "این مسیر با وضعیت فعلی درخواست سازگار نیست."}
            </p>
          </div>
        </section>
        <section className={styles.panel}>
          <p className={styles.errorBox}>
            <UseravaaIcon name="warning" size={16} aria-hidden="true" />
            {isExpiredState || isAllTimesExpired ? expiredTimeSelectionMessage : routeAccess.message}
          </p>
          {isExpiredState || isAllTimesExpired ? (
            <div className={styles.actions}>
              <V51LinkButton href={isAllTimesExpired ? `/conversations/${conversation.id}` : getRepeatRequestHref(conversation)} tone="primary">
                {isAllTimesExpired ? requestNewTimesCtaLabel : repeatRequestCtaLabel}
              </V51LinkButton>
              {isAllTimesExpired ? <V51LinkButton href="/discover">دیدن تجربه‌های مشابه</V51LinkButton> : null}
            </div>
          ) : (
            <div className={styles.actions}>
              <V51LinkButton href={routeAccess.fallbackHref}>
                <UseravaaIcon name="arrowBackRtl" size={16} aria-hidden="true" />
                بازگشت
              </V51LinkButton>
            </div>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className={styles.shell}>
      <section className={styles.hero}>
        <div className={styles.heroText}>
          <h1>انتخاب زمان</h1>
          <p className={styles.lead}>
            {hasNewTimeOptions ? providerTimeReplacementCopy.requesterDescription : "یکی از سه زمان پیشنهادی را انتخاب کنید. جلسه بعد از انتخاب شما قطعی می‌شود."}
          </p>
        </div>
        <V51LinkButton href={`/conversations/${conversation.id}`}>
          <UseravaaIcon name="arrowBackRtl" size={16} aria-hidden="true" />
          بازگشت
        </V51LinkButton>
      </section>

      <div className={styles.detailGrid}>
        <section className={styles.panel}>
          <h2>{hasNewTimeOptions ? providerTimeReplacementCopy.requesterTitle : "زمان‌های پیشنهادی"}</h2>
          {selectionError ? (
            <p className={styles.errorBox}>
              <UseravaaIcon name="warning" size={16} aria-hidden="true" />
              {selectionError}
            </p>
          ) : null}
          <div className={styles.optionList}>
            {activeProposedTimes.map((time) => {
              const timeExpired = isProposedTimeExpired(time);
              const tooSoon = !timeExpired && !isProposedTimeSelectableByRequester(time);
              const optionDisabled = !selectionAllowed || timeExpired || tooSoon;

              return (
                <button
                  key={time.id}
                  type="button"
                  className={`${styles.optionChip} ${selectedTimeId === time.id ? styles.chipActive : ""} ${optionDisabled ? styles.optionDisabled : ""}`}
                  aria-disabled={optionDisabled}
                  aria-pressed={selectedTimeId === time.id && !optionDisabled}
                  data-time-state={timeExpired ? "expired" : tooSoon ? "too-soon" : "available"}
                  disabled={optionDisabled}
                  onClick={() => handleSelectTime(time.id, optionDisabled)}
                >
                  <span className="button-label">{time.dateLabel}</span>
                  <strong className="button-label">{time.timeLabel}</strong>
                  {timeExpired ? <small className="button-label">منقضی شده</small> : null}
                  {tooSoon ? <small className="button-label">کمتر از ۶ ساعت مانده</small> : null}
                </button>
              );
            })}
          </div>
        </section>

        <aside className={styles.panel}>
          <h2>اقدام بعدی</h2>
          <p className={styles.infoBox}>
            پرداخت قبلاً انجام شده است. بعد از انتخاب یکی از زمان‌ها، جلسه مشاوره قطعی می‌شود.
          </p>
          <div className={styles.actions}>
            <V51Button type="button" tone="danger" onClick={cancelSelection}>
              لغو درخواست
            </V51Button>
            <V51Button
              type="button"
              tone="primary"
              disabled={!selectedTimeId || !selectionAllowed}
              className={!selectedTimeId || !selectionAllowed ? styles.submitDisabled : undefined}
              onClick={submitSelection}
            >
              {submitLabel}
            </V51Button>
          </div>
          {submitted && isSuccessfulSelection(conversation) ? (
            <p className={styles.successBox}>
              <UseravaaIcon name="success" size={16} aria-hidden="true" />
              جلسه قطعی شد و اطلاعات هماهنگی جلسه در دسترس است.
            </p>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
