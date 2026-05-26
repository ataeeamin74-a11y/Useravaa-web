"use client";

import { useState } from "react";
import { V51Button } from "@/features/v51/components/V51Button";
import {
  insightAnswerIsWithinLimit,
  publishExperienceAnswer,
  retractExperienceAnswer,
  weeklyQuestionCopy,
  type ExperienceAnswer,
  type ExperienceQuestion
} from "@/features/v51/data/experience-questions";
import { AnswerEditor } from "./AnswerEditor";
import { ResponsibilityCheckbox } from "./ResponsibilityCheckbox";
import { RetractAnswerButton } from "./RetractAnswerButton";
import styles from "./MyProfile.module.css";

type WeeklyQuestionCardProps = Readonly<{
  question: ExperienceQuestion | null;
}>;

export function WeeklyQuestionCard({ question }: WeeklyQuestionCardProps) {
  const [mode, setMode] = useState<"idle" | "answering" | "published" | "skipped">(question ? "idle" : "skipped");
  const [answerText, setAnswerText] = useState("");
  const [responsibilityAccepted, setResponsibilityAccepted] = useState(false);
  const [publishedAnswer, setPublishedAnswer] = useState<ExperienceAnswer | null>(null);
  const [message, setMessage] = useState("");
  const answerIsValid = Boolean(answerText.trim()) && insightAnswerIsWithinLimit(answerText);

  if (!question) {
    return (
      <section id="weekly-question" className={styles.weeklyQuestionCard} aria-labelledby="weeklyQuestionTitle">
        <div className={styles.sectionHead}>
          <div>
            <h2 id="weeklyQuestionTitle">{weeklyQuestionCopy.title}</h2>
            <p>{weeklyQuestionCopy.description}</p>
          </div>
        </div>
        <p className={styles.inlineNote}>در حال حاضر سؤال فعالی برای بینش‌ها در دسترس نیست.</p>
      </section>
    );
  }

  const draftAnswer: ExperienceAnswer = {
    id: "weekly-answer-draft",
    profileId: "ali",
    questionId: question.id,
    renderedQuestion: question.renderedQuestion,
    answer: answerText,
    status: "draft",
    publishedAt: null
  };

  const publish = () => {
    const result = publishExperienceAnswer(draftAnswer, responsibilityAccepted);

    if (!result.published) {
      setMessage(result.error);
      return;
    }

    setPublishedAnswer(result.answer);
    setMode("published");
    setMessage("پاسخ در بینش‌ها منتشر شد و در پروفایل تجربه‌تان نمایش داده می‌شود.");
  };

  const retract = () => {
    if (!publishedAnswer) {
      return;
    }

    setPublishedAnswer(retractExperienceAnswer(publishedAnswer));
    setMode("idle");
    setAnswerText("");
    setResponsibilityAccepted(false);
    setMessage("پاسخ از بینش‌ها برداشته شد.");
  };

  return (
    <section id="weekly-question" className={styles.weeklyQuestionCard} aria-labelledby="weeklyQuestionTitle">
      <div className={styles.sectionHead}>
        <div>
          <h2 id="weeklyQuestionTitle">{weeklyQuestionCopy.title}</h2>
          <p>{weeklyQuestionCopy.description}</p>
        </div>
      </div>

      {mode !== "published" ? (
        <div className={styles.weeklyQuestionPrompt}>
          <span>{weeklyQuestionCopy.questionLabel}</span>
          <p>{question.renderedQuestion}</p>
          <small>{weeklyQuestionCopy.answerHelper}</small>
        </div>
      ) : null}

      {mode === "idle" ? (
        <div className={styles.actions}>
          <V51Button type="button" tone="primary" onClick={() => setMode("answering")}>
            {weeklyQuestionCopy.answerAction}
          </V51Button>
          <V51Button type="button" onClick={() => setMode("skipped")}>
            {weeklyQuestionCopy.skipAction}
          </V51Button>
          <span className={styles.passiveCadence}>{weeklyQuestionCopy.replaceAction}</span>
        </div>
      ) : null}

      {mode === "answering" ? (
        <div className={styles.answerEditor}>
          <AnswerEditor value={answerText} onChange={setAnswerText} />
          <ResponsibilityCheckbox checked={responsibilityAccepted} onChange={setResponsibilityAccepted} />
          <div className={styles.actions}>
            <V51Button type="button" tone="primary" disabled={!responsibilityAccepted || !answerIsValid} onClick={publish}>
              {weeklyQuestionCopy.publishAction}
            </V51Button>
            <V51Button type="button" onClick={() => setMode("idle")}>
              انصراف
            </V51Button>
          </div>
        </div>
      ) : null}

      {mode === "published" && publishedAnswer?.status === "published" ? (
        <article className={styles.publishedAnswerCard}>
          <b>{publishedAnswer.renderedQuestion}</b>
          <p>{publishedAnswer.answer}</p>
          <RetractAnswerButton onRetract={retract} />
        </article>
      ) : null}

      {mode === "skipped" ? <p className={styles.inlineNote}>فعلاً این سؤال کنار گذاشته شد.</p> : null}
      {message ? <p className={styles.statusMessage}>{message}</p> : null}
    </section>
  );
}
