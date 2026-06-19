"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { UseravaaIcon } from "@/components/ui/UseravaaIcon";
import { V51Button, V51LinkButton } from "@/features/v51/components/V51Button";
import {
  createConversationRequest,
  type ConversationDuration,
  type ConversationFixture
} from "@/features/v51/data/conversations";
import { formatFaNumber } from "@/lib/fa-format";
import type { ExperienceProfileFixture } from "@/features/v51/data/profiles";
import { DurationSelector } from "../components/DurationSelector";
import { RequestSummary } from "../components/RequestSummary";
import styles from "../components/ConversationCluster.module.css";

type RequestConversationPageProps = {
  profile: ExperienceProfileFixture;
  initialDuration?: ConversationDuration;
  onCreate?: (conversation: ConversationFixture) => void;
};

const requestTopicOptions = [
  "رشد و پیشرفت در مسیر شغلی",
  "انتخاب مسیر شغلی",
  "بررسی رزومه / آمادگی مصاحبه",
  "سایر"
] as const;

const maxRequestNoteLength = 300;

export function RequestConversationPage({ profile, initialDuration = 30, onCreate }: RequestConversationPageProps) {
  const [duration, setDuration] = useState<ConversationDuration>(initialDuration);
  const [topic, setTopic] = useState<(typeof requestTopicOptions)[number] | "">("");
  const [note, setNote] = useState("");
  const [createdConversation, setCreatedConversation] = useState<ConversationFixture | null>(null);
  const [errors, setErrors] = useState<{ topic?: string; note?: string }>({});

  const submitRequest = () => {
    const nextErrors: typeof errors = {};
    const trimmedNote = note.trim();

    if (!topic) {
      nextErrors.topic = "موضوع گفت‌وگو را انتخاب کنید.";
    }

    if (!trimmedNote) {
      nextErrors.note = "لطفاً موضوع گفت‌وگو را کوتاه توضیح دهید.";
    } else if (trimmedNote.length > maxRequestNoteLength) {
      nextErrors.note = "توضیح موضوع باید کمتر از ۳۰۰ کاراکتر باشد.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const conversation = createConversationRequest({ profile, duration, note: trimmedNote, topic });
    setCreatedConversation(conversation);
    onCreate?.(conversation);

    if (!onCreate && typeof window !== "undefined") {
      window.setTimeout(() => window.location.assign(`/checkout/${conversation.id}`), 250);
    }
  };

  return (
    <div className={styles.shell}>
      <section className={styles.hero}>
        <div className={styles.heroText}>
          <h1>درخواست جلسه مشاوره</h1>
          <p className={styles.lead}>پرداخت امن انجام می‌شود و بعد از آن تجربه‌آفرین دقیقاً سه زمان پیشنهادی اعلام می‌کند.</p>
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
            <Avatar src={profile.avatarUrl} alt="" size="lg" className={styles.avatar} />
            <div>
              <h3 className={styles.name}>{profile.name}</h3>
              <p className={styles.role}>{profile.roleFa}</p>
            </div>
          </div>

          <h2>مدت گفت‌وگو را انتخاب کن</h2>
          <DurationSelector profile={profile} selectedDuration={duration} onDurationChange={setDuration} />

          <h2>موضوع شما بیشتر به کدام مورد مربوط است؟</h2>
          <div className={styles.optionList}>
            {requestTopicOptions.map((option) => (
              <button
                key={option}
                type="button"
                className={`${styles.optionChip} ${topic === option ? styles.chipActive : ""}`}
                aria-pressed={topic === option}
                onClick={() => {
                  setTopic(option);
                  setErrors((current) => ({ ...current, topic: undefined }));
                }}
              >
                <span className="button-label">{option}</span>
              </button>
            ))}
          </div>
          {errors.topic ? <p className={styles.errorBox}>{errors.topic}</p> : null}

          <h2>درباره موضوع گفت‌وگو کوتاه بنویسید</h2>
          <p className={styles.lead}>در کمتر از ۳۰۰ کاراکتر بنویسید تا تجربه‌آفرین بداند جلسه درباره چیست.</p>
          <textarea
            className={styles.note}
            value={note}
            maxLength={maxRequestNoteLength + 20}
            onChange={(event) => {
              setNote(event.target.value);
              setErrors((current) => ({ ...current, note: undefined }));
            }}
            placeholder="مثلاً: می‌خواهم درباره ورود به Product و آماده‌کردن رزومه‌ام حرف بزنم."
          />
          <p className={styles.lead}>{formatFaNumber(note.length)} / {formatFaNumber(maxRequestNoteLength)}</p>
          {errors.note ? <p className={styles.errorBox}>{errors.note}</p> : null}

          <div className={styles.actions}>
            <V51Button type="button" tone="primary" onClick={submitRequest}>
              ادامه به پرداخت امن
            </V51Button>
            <V51LinkButton href="/discover">انصراف</V51LinkButton>
          </div>

          {createdConversation ? (
            <p className={styles.successBox}>در حال انتقال به پرداخت امن درخواست جلسه.</p>
          ) : null}
        </section>

        <RequestSummary profile={profile} duration={duration} topic={topic} note={note} />
      </div>
    </div>
  );
}
