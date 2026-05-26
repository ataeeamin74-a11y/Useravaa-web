"use client";

import { useState } from "react";
import { UseravaaIcon } from "@/components/ui/UseravaaIcon";
import { V51Button, V51LinkButton } from "@/features/v51/components/V51Button";
import {
  canSubmitProposedTimes,
  proposalDateOptions,
  proposeTimesForConversation,
  toggleProposedTime,
  validateProposedTimes,
  type ConversationFixture,
  type ProposedTime
} from "@/features/v51/data/conversations";
import { SelectedTimesList } from "../components/SelectedTimesList";
import { TimeProposalPicker } from "../components/TimeProposalPicker";
import styles from "../components/ConversationCluster.module.css";

type ProposeTimesPageProps = {
  initialConversation: ConversationFixture;
};

export function ProposeTimesPage({ initialConversation }: ProposeTimesPageProps) {
  const [conversation, setConversation] = useState(initialConversation);
  const [selectedDateId, setSelectedDateId] = useState<string>(proposalDateOptions[0].id);
  const [selectedTimes, setSelectedTimes] = useState<ProposedTime[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const canSubmit = canSubmitProposedTimes(selectedTimes);
  const validation = validateProposedTimes(selectedTimes, conversation.id);

  const handleToggleTime = (time: ProposedTime) => {
    setSelectedTimes((current) => toggleProposedTime(current, time));
  };

  const submitTimes = () => {
    if (!canSubmit) {
      return;
    }

    setConversation((current) => proposeTimesForConversation(current, selectedTimes));
    setSubmitted(true);
  };

  return (
    <div className={styles.shell}>
      <section className={styles.hero}>
        <div className={styles.heroText}>
          <h1>پیشنهاد زمان</h1>
          <p className={styles.lead}>حداقل سه زمان انتخاب کن. طرف مقابل یکی از زمان‌های پیشنهادی را انتخاب می‌کند.</p>
        </div>
        <V51LinkButton href={`/conversations/${conversation.id}`}>
          <UseravaaIcon name="arrowBackRtl" size={16} aria-hidden="true" />
          بازگشت
        </V51LinkButton>
      </section>

      <div className={styles.timeLayout}>
        <TimeProposalPicker
          selectedDateId={selectedDateId}
          selectedTimes={selectedTimes}
          onDateChange={setSelectedDateId}
          onToggleTime={handleToggleTime}
        />

        <div>
          <SelectedTimesList selectedTimes={selectedTimes} onRemove={handleToggleTime} />
          {!validation.valid ? (
            <div className={styles.errorBox}>
              {validation.errors.map((error) => (
                <p key={error}>{error}</p>
              ))}
            </div>
          ) : null}
          <div className={styles.actions}>
            <V51LinkButton href={`/conversations/${conversation.id}`}>انصراف</V51LinkButton>
            <V51Button
              type="button"
              tone="primary"
              disabled={!canSubmit}
              className={!canSubmit ? styles.submitDisabled : undefined}
              onClick={submitTimes}
            >
              ارسال زمان‌ها
            </V51Button>
          </div>
          {submitted ? <p className={styles.successBox}>زمان‌های پیشنهادی ارسال شدند و وضعیت جلسه مشاوره به «منتظر انتخاب» تغییر کرد.</p> : null}
        </div>
      </div>
    </div>
  );
}
