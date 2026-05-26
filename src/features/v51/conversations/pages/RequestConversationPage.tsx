"use client";

import { useState } from "react";
import { UseravaaIcon } from "@/components/ui/UseravaaIcon";
import { V51Button, V51LinkButton } from "@/features/v51/components/V51Button";
import {
  createConversationRequest,
  type ConversationDuration,
  type ConversationFixture
} from "@/features/v51/data/conversations";
import type { ExperienceProfileFixture } from "@/features/v51/data/profiles";
import { DurationSelector } from "../components/DurationSelector";
import { RequestSummary } from "../components/RequestSummary";
import styles from "../components/ConversationCluster.module.css";

type RequestConversationPageProps = {
  profile: ExperienceProfileFixture;
  initialDuration?: ConversationDuration;
  onCreate?: (conversation: ConversationFixture) => void;
};

export function RequestConversationPage({ profile, initialDuration = 30, onCreate }: RequestConversationPageProps) {
  const [duration, setDuration] = useState<ConversationDuration>(initialDuration);
  const [note, setNote] = useState("");
  const [createdConversation, setCreatedConversation] = useState<ConversationFixture | null>(null);

  const submitRequest = () => {
    const conversation = createConversationRequest({ profile, duration, note });
    setCreatedConversation(conversation);
    onCreate?.(conversation);

    if (!onCreate && typeof window !== "undefined") {
      window.setTimeout(() => window.location.assign(`/conversations/${conversation.id}`), 250);
    }
  };

  return (
    <div className={styles.shell}>
      <section className={styles.hero}>
        <div className={styles.heroText}>
          <h1>درخواست جلسه مشاوره</h1>
          <p className={styles.lead}>مدت جلسه را انتخاب کن. بعد از ثبت درخواست، صاحب تجربه حداقل سه زمان پیشنهادی اعلام می‌کند.</p>
        </div>
        <V51LinkButton href={`/profiles/${profile.id}`}>
          <UseravaaIcon name="arrowBackRtl" size={16} aria-hidden="true" />
          بازگشت به پروفایل
        </V51LinkButton>
      </section>

      <div className={styles.requestGrid}>
        <section className={styles.panel}>
          <h2>فرد انتخاب‌شده</h2>
          <div className={styles.profileSummary}>
            <span className={styles.avatar}>{profile.initials}</span>
            <div>
              <h3 className={styles.name}>{profile.name}</h3>
              <p className={styles.role}>{profile.roleFa}</p>
            </div>
          </div>

          <h2>زمان جلسه مشاوره</h2>
          <DurationSelector profile={profile} selectedDuration={duration} onDurationChange={setDuration} />

          <h2>توضیح اختیاری</h2>
          <p className={styles.lead}>اگر نکته‌ای داری، کوتاه بنویس تا درخواستت واضح‌تر باشد.</p>
          <textarea
            className={styles.note}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="مثلاً: می‌خواهم درباره ورود به Product و آماده‌کردن رزومه‌ام حرف بزنم."
          />

          <div className={styles.actions}>
            <V51Button type="button" tone="primary" onClick={submitRequest}>
              ارسال درخواست جلسه مشاوره
            </V51Button>
            <V51LinkButton href="/discover">انصراف</V51LinkButton>
          </div>

          {createdConversation ? (
            <p className={styles.successBox}>درخواست جلسه مشاوره ثبت شد و به صفحه جزئیات جلسه منتقل می‌شوی.</p>
          ) : null}
        </section>

        <RequestSummary profile={profile} duration={duration} note={note} />
      </div>
    </div>
  );
}
