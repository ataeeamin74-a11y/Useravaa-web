"use client";

import { useState } from "react";
import { UseravaaIcon } from "@/components/ui/UseravaaIcon";
import { V51Button, V51LinkButton } from "@/features/v51/components/V51Button";
import {
  buildProposedTimesFromDrafts,
  canProviderReplaceProposedTimes,
  getConversationRouteAccess,
  getActiveProposedTimes,
  getValidProposalDateOptions,
  getValidProposalTimeSlots,
  newTimeRequestCopy,
  proposeTimesForConversation,
  providerTimeReplacementCopy,
  replaceProviderProposedTimesForConversation,
  validateProposedTimeDrafts,
  type ConversationFixture,
  type ProposedTime,
  type ProposedTimeDraft
} from "@/features/v51/data/conversations";
import styles from "../components/ConversationCluster.module.css";

type ProposeTimesPageProps = {
  initialConversation: ConversationFixture;
};

const rowLabels: Record<ProposedTimeDraft["id"], string> = {
  one: "زمان پیشنهادی شماره یک",
  two: "زمان پیشنهادی شماره دو",
  three: "زمان پیشنهادی شماره سه"
};

const initialDrafts: ProposedTimeDraft[] = [
  { id: "one", day: null, startTime: null },
  { id: "two", day: null, startTime: null },
  { id: "three", day: null, startTime: null }
];

function submittedTimeLabel(time: ProposedTime, index: number) {
  const labels = ["زمان پیشنهادی شماره یک", "زمان پیشنهادی شماره دو", "زمان پیشنهادی شماره سه"];

  return `${labels[index]}: ${time.dateLabel}، ساعت ${time.timeLabel}`;
}

export function ProposedTimesSuccessPanel({
  conversation,
  submittedTimes,
  mode = "initial"
}: Readonly<{ conversation: ConversationFixture; submittedTimes: readonly ProposedTime[]; mode?: "initial" | "requesterNewTime" | "providerReplacement" }>) {
  const requesterName = conversation.requesterName || "درخواست‌دهنده";
  const requesterLabel = conversation.requesterName ? requesterName : "درخواست‌دهنده";
  const isNewTimeProposal = mode === "requesterNewTime" || mode === "providerReplacement";
  const isProviderReplacement = mode === "providerReplacement";

  return (
    <section className={styles.proposeSuccessPanel} data-testid="propose-times-success-panel">
      <p className={styles.successEyebrow}>زمان‌ها ارسال شده‌اند</p>
      <h1>{isProviderReplacement ? providerTimeReplacementCopy.successTitle : isNewTimeProposal ? "زمان‌های پیشنهادی جدید ثبت شدند" : "زمان‌های پیشنهادی ارسال شدند"}</h1>
      <p>
        {isProviderReplacement
          ? providerTimeReplacementCopy.successDescription
          : `سه زمان پیشنهادی ${isNewTimeProposal ? "جدید " : ""}برای ${requesterLabel} ارسال شد. وقتی او یکی از زمان‌ها را انتخاب کند، جلسه قطعی می‌شود.`}
      </p>
      <p className={styles.requestSentStatusRow}>
        <UseravaaIcon name="success" size={16} aria-hidden="true" />
        در انتظار انتخاب زمان توسط {requesterLabel}
      </p>
      <div className={styles.proposedSummary}>
        <h2>خلاصه زمان‌های ارسال‌شده</h2>
        {submittedTimes.map((time, index) => (
          <p key={time.id}>{submittedTimeLabel(time, index)}</p>
        ))}
      </div>
      <div className={styles.requestSentActions}>
        <V51LinkButton href={`/conversations/${conversation.id}`} tone="primary">
          {isProviderReplacement ? providerTimeReplacementCopy.successCta : "مشاهده درخواست"}
        </V51LinkButton>
        <V51LinkButton href="/sessions">بازگشت به جلسه‌ها</V51LinkButton>
      </div>
    </section>
  );
}

export function ProposeTimesPage({ initialConversation }: ProposeTimesPageProps) {
  const [conversation, setConversation] = useState(initialConversation);
  const [drafts, setDrafts] = useState<ProposedTimeDraft[]>(initialDrafts);
  const [submittedTimes, setSubmittedTimes] = useState<ProposedTime[]>([]);
  const [submittedMode, setSubmittedMode] = useState<"initial" | "requesterNewTime" | "providerReplacement">("initial");
  const [hasSubmitAttempted, setHasSubmitAttempted] = useState(false);
  const routeAccess = getConversationRouteAccess(conversation, "proposeTimes");
  const dateOptions = getValidProposalDateOptions();
  const validation = validateProposedTimeDrafts(drafts, conversation.id);
  const canSubmit = routeAccess.allowed && validation.valid;
  const isNewTimeRequest = conversation.status === "new_time_requested";
  const isProviderReplacement = canProviderReplaceProposedTimes(conversation);
  const pageTitle = isProviderReplacement ? providerTimeReplacementCopy.formTitle : isNewTimeRequest ? newTimeRequestCopy.providerActionTitle : "پیشنهاد سه زمان";

  const updateDraft = (id: ProposedTimeDraft["id"], patch: Partial<Pick<ProposedTimeDraft, "day" | "startTime">>) => {
    setDrafts((current) =>
      current.map((draft) => {
        if (draft.id !== id) {
          return draft;
        }

        const nextDay = patch.day !== undefined ? patch.day : draft.day;

        return {
          ...draft,
          ...patch,
          startTime: patch.day !== undefined && patch.day !== draft.day ? null : patch.startTime !== undefined ? patch.startTime : draft.startTime,
          day: nextDay
        };
      })
    );
  };

  const submitTimes = () => {
    setHasSubmitAttempted(true);

    if (!canSubmit) {
      return;
    }

    const times = buildProposedTimesFromDrafts(drafts, conversation.id);
    const mode = isProviderReplacement ? "providerReplacement" : isNewTimeRequest ? "requesterNewTime" : "initial";
    const nextConversation = isProviderReplacement
      ? replaceProviderProposedTimesForConversation(conversation, times)
      : proposeTimesForConversation(conversation, times);
    setConversation(nextConversation);
    setSubmittedMode(mode);
    setSubmittedTimes(getActiveProposedTimes(nextConversation));
  };

  if (submittedTimes.length === 3) {
    return (
      <div className={styles.shell}>
        <ProposedTimesSuccessPanel conversation={conversation} submittedTimes={submittedTimes} mode={submittedMode} />
      </div>
    );
  }

  if (!routeAccess.allowed) {
    return (
      <div className={styles.shell}>
        <section className={styles.hero}>
          <div className={styles.heroText}>
            <h1>{pageTitle}</h1>
            <p className={styles.lead}>این مسیر با وضعیت فعلی درخواست سازگار نیست.</p>
          </div>
          <V51LinkButton href={routeAccess.fallbackHref}>
            <UseravaaIcon name="arrowBackRtl" size={16} aria-hidden="true" />
            بازگشت
          </V51LinkButton>
        </section>
        <section className={styles.panel}>
          <p className={styles.errorBox}>
            <UseravaaIcon name="warning" size={16} aria-hidden="true" />
            {routeAccess.message}
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className={styles.shell}>
      <section className={styles.hero}>
        <div className={styles.heroText}>
          <h1>{pageTitle}</h1>
          <p className={styles.lead}>
            {isProviderReplacement
              ? providerTimeReplacementCopy.formHelper
              : isNewTimeRequest
              ? "درخواست‌دهنده زمان‌های قبلی را انتخاب نکرده و زمان‌های جدید خواسته است. دقیقاً سه زمان پیشنهادی جدید ثبت کنید."
              : "دقیقاً سه زمان پیشنهادی ثبت کنید. درخواست‌دهنده یکی از زمان‌های پیشنهادی را انتخاب می‌کند."}
          </p>
        </div>
        <V51LinkButton href={`/conversations/${conversation.id}`}>
          <UseravaaIcon name="arrowBackRtl" size={16} aria-hidden="true" />
          بازگشت
        </V51LinkButton>
      </section>

      <div className={styles.timeLayout}>
        <section className={styles.panel}>
          <h2>سه زمان پیشنهادی</h2>
          <p className={styles.lead}>برای هر زمان پیشنهادی، یک روز از تقویم شمسی و یک ساعت شروع انتخاب کنید.</p>
          <div className={styles.proposedRows}>
            {drafts.map((draft) => {
              const timeSlots = getValidProposalTimeSlots(draft.day);

              return (
                <div key={draft.id} className={styles.proposedTimeRow} data-testid="proposed-time-row">
                  <h3>{rowLabels[draft.id]}</h3>
                  <label>
                    <span>روز پیشنهادی</span>
                    <select value={draft.day ?? ""} onChange={(event) => updateDraft(draft.id, { day: event.target.value || null })}>
                      <option value="">انتخاب روز</option>
                      {dateOptions.map((dateOption) => (
                        <option key={dateOption.id} value={dateOption.id}>
                          {dateOption.full}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>ساعت شروع</span>
                    <select
                      value={draft.startTime ?? ""}
                      disabled={!draft.day}
                      onChange={(event) => updateDraft(draft.id, { startTime: event.target.value || null })}
                    >
                      <option value="">انتخاب ساعت شروع</option>
                      {timeSlots.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              );
            })}
          </div>
        </section>

        <aside className={styles.panel}>
          <h2>خلاصه زمان‌های پیشنهادی</h2>
          {validation.valid ? (
            <div className={styles.proposedSummary}>
              {buildProposedTimesFromDrafts(drafts, conversation.id).map((time, index) => (
                <p key={time.id}>{submittedTimeLabel(time, index)}</p>
              ))}
              <small>درخواست‌دهنده یکی از این سه زمان را انتخاب می‌کند. جلسه بعد از انتخاب او قطعی می‌شود.</small>
            </div>
          ) : (
            <p className={styles.empty}>لطفاً هر سه زمان پیشنهادی را کامل کنید.</p>
          )}
          {hasSubmitAttempted && !validation.valid ? (
            <div className={styles.errorBox}>
              {validation.errors.map((error) => (
                <p key={error}>{error}</p>
              ))}
            </div>
          ) : null}
          <div className={styles.actions}>
            <V51LinkButton href={`/conversations/${conversation.id}`}>بازگشت به جزئیات درخواست</V51LinkButton>
            <V51Button type="button" tone="primary" disabled={!canSubmit} className={!canSubmit ? styles.submitDisabled : undefined} onClick={submitTimes}>
              {canSubmit
                ? isProviderReplacement
                  ? providerTimeReplacementCopy.formCta
                  : isNewTimeRequest
                    ? newTimeRequestCopy.providerCta
                    : "ارسال سه زمان پیشنهادی"
                : isProviderReplacement
                  ? providerTimeReplacementCopy.formCta
                  : "سه زمان پیشنهادی را کامل کنید"}
            </V51Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
