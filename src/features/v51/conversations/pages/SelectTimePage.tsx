"use client";

import { useState } from "react";
import { UseravaaIcon } from "@/components/ui/UseravaaIcon";
import { V51Button, V51LinkButton } from "@/features/v51/components/V51Button";
import {
  applyExpiration,
  cancelConversation,
  conversationReliabilityCopy,
  selectTimeForConversation,
  type ConversationFixture
} from "@/features/v51/data/conversations";
import styles from "../components/ConversationCluster.module.css";

type SelectTimePageProps = {
  initialConversation: ConversationFixture;
};

export function SelectTimePage({ initialConversation }: SelectTimePageProps) {
  const [conversation, setConversation] = useState(() => applyExpiration(initialConversation));
  const [selectedTimeId, setSelectedTimeId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const selectionAllowed = conversation.status === "times_proposed";

  const submitSelection = () => {
    if (!selectedTimeId || !selectionAllowed) {
      return;
    }

    setConversation((current) => selectTimeForConversation(current, selectedTimeId));
    setSubmitted(true);
  };

  const cancelSelection = () => {
    setConversation((current) => cancelConversation(current));
    setSubmitted(true);
  };

  return (
    <div className={styles.shell}>
      <section className={styles.hero}>
        <div className={styles.heroText}>
          <h1>انتخاب زمان</h1>
          <p className={styles.lead}>یکی از زمان‌های پیشنهادی را انتخاب کن.</p>
        </div>
        <V51LinkButton href={`/conversations/${conversation.id}`}>
          <UseravaaIcon name="arrowBackRtl" size={16} aria-hidden="true" />
          بازگشت
        </V51LinkButton>
      </section>

      <div className={styles.detailGrid}>
        <section className={styles.panel}>
          <h2>زمان‌های پیشنهادی</h2>
          {!selectionAllowed ? <p className={styles.errorBox}>{conversationReliabilityCopy.timeSelectionExpired}</p> : null}
          <div className={styles.optionList}>
            {conversation.proposedTimes.map((time) => (
              <button
                key={time.id}
                type="button"
                className={`${styles.optionChip} ${selectedTimeId === time.id ? styles.chipActive : ""}`}
                aria-pressed={selectedTimeId === time.id}
                disabled={!selectionAllowed}
                onClick={() => setSelectedTimeId(time.id)}
              >
                <span>{time.dateLabel}</span>
                <strong>{time.timeLabel}</strong>
              </button>
            ))}
          </div>
        </section>

        <aside className={styles.panel}>
          <h2>اقدام بعدی</h2>
          <p className={styles.infoBox}>بعد از انتخاب زمان، جلسه مشاوره وارد مرحله نهایی‌سازی و پرداخت می‌شود.</p>
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
              ادامه به نهایی‌سازی
            </V51Button>
          </div>
          {submitted ? (
            <p className={styles.successBox}>
              {conversation.state === "cancelled" ? "درخواست لغو شد." : "زمان انتخاب شد و جلسه مشاوره به مرحله نهایی‌سازی رسید."}
            </p>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
