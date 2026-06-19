"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./AdminSurfaces.module.css";

type SubmissionState = "idle" | "hiding" | "success" | "error";

type AdminInsightAnswerModerationActionsProps = Readonly<{
  answerId: string;
  hideAvailable: boolean;
}>;

async function postInsightAnswerHide(answerId: string, payload: Record<string, string>) {
  const response = await fetch(`/api/admin/insight-answers/${encodeURIComponent(answerId)}/hide`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    let message = "کنش بررسی پاسخ کوتاه ثبت نشد.";

    try {
      const body = (await response.json()) as { error?: { message?: string }; message?: string };
      message = body.error?.message ?? body.message ?? message;
    } catch {
      message = "کنش بررسی پاسخ کوتاه ثبت نشد.";
    }

    throw new Error(message);
  }

  return response.json();
}

export function AdminInsightAnswerModerationActions({ answerId, hideAvailable }: AdminInsightAnswerModerationActionsProps) {
  const router = useRouter();
  const [state, setState] = useState<SubmissionState>("idle");
  const [reasonCode, setReasonCode] = useState("");
  const [reviewNote, setReviewNote] = useState("");
  const [message, setMessage] = useState("");
  const isSubmitting = state === "hiding";
  const trimmedReason = reasonCode.trim();
  const trimmedNote = reviewNote.trim();

  async function submit() {
    if (!hideAvailable || isSubmitting) {
      return;
    }

    if (!trimmedReason) {
      setState("error");
      setMessage("برای مخفی‌کردن پاسخ کوتاه، دلیل بررسی لازم است.");
      return;
    }

    setState("hiding");
    setMessage("");

    try {
      await postInsightAnswerHide(answerId, {
        reasonCode: trimmedReason,
        ...(trimmedNote ? { reviewNote: trimmedNote } : {})
      });

      setState("success");
      setMessage("پاسخ کوتاه مخفی شد.");
      router.refresh();
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "کنش بررسی پاسخ کوتاه ثبت نشد.");
    }
  }

  if (!hideAvailable) {
    return (
      <div className={styles.reviewBox}>
        <p>این پاسخ کوتاه در وضعیت قابل مخفی‌کردن نیست.</p>
      </div>
    );
  }

  return (
    <div className={styles.reviewBox}>
      <label>
        <span>دلیل بررسی</span>
        <textarea
          maxLength={120}
          value={reasonCode}
          onChange={(event) => setReasonCode(event.target.value)}
          placeholder="برای مخفی‌کردن الزامی است"
        />
      </label>
      <label>
        <span>یادداشت داخلی</span>
        <textarea
          maxLength={500}
          value={reviewNote}
          onChange={(event) => setReviewNote(event.target.value)}
          placeholder="یادداشت اختیاری برای گزارش ممیزی"
        />
      </label>
      <div className={styles.actions}>
        <button className={styles.dangerButton} type="button" disabled={isSubmitting || !trimmedReason} onClick={() => void submit()}>
          {state === "hiding" ? "در حال مخفی‌کردن..." : "مخفی‌کردن پاسخ"}
        </button>
      </div>
      {message ? (
        <p className={state === "error" ? styles.errorText : styles.successText} role="status">
          {message}
        </p>
      ) : (
        <p>کنش فقط پس از پاسخ موفق سرور ثبت و صفحه تازه‌سازی می‌شود.</p>
      )}
    </div>
  );
}
