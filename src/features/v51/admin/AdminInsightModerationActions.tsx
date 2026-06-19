"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./AdminSurfaces.module.css";

type InsightAction = "hide" | "restore" | "delete";
type SubmissionState = "idle" | "hiding" | "restoring" | "deleting" | "success" | "error";

type AdminInsightModerationActionsProps = Readonly<{
  insightId: string;
  actionsAvailable: {
    hide: boolean;
    restore: boolean;
    delete: boolean;
  };
}>;

async function postInsightModerationAction(insightId: string, action: InsightAction, payload: Record<string, string>) {
  const response = await fetch(`/api/admin/insights/${encodeURIComponent(insightId)}/${action}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    let message = "کنش بررسی بینش ثبت نشد.";

    try {
      const body = (await response.json()) as { error?: { message?: string }; message?: string };
      message = body.error?.message ?? body.message ?? message;
    } catch {
      message = "کنش بررسی بینش ثبت نشد.";
    }

    throw new Error(message);
  }

  return response.json();
}

export function AdminInsightModerationActions({ insightId, actionsAvailable }: AdminInsightModerationActionsProps) {
  const router = useRouter();
  const [state, setState] = useState<SubmissionState>("idle");
  const [reasonCode, setReasonCode] = useState("");
  const [reviewNote, setReviewNote] = useState("");
  const [message, setMessage] = useState("");
  const isSubmitting = state === "hiding" || state === "restoring" || state === "deleting";
  const trimmedReason = reasonCode.trim();
  const trimmedNote = reviewNote.trim();
  const anyActionAvailable = actionsAvailable.hide || actionsAvailable.restore || actionsAvailable.delete;

  async function submit(action: InsightAction) {
    if (!anyActionAvailable || isSubmitting) {
      return;
    }

    if (action !== "restore" && !trimmedReason) {
      setState("error");
      setMessage("برای مخفی‌کردن یا حذف نرم، دلیل بررسی لازم است.");
      return;
    }

    setState(action === "hide" ? "hiding" : action === "restore" ? "restoring" : "deleting");
    setMessage("");

    try {
      await postInsightModerationAction(insightId, action, {
        ...(action !== "restore" ? { reasonCode: trimmedReason } : {}),
        ...(trimmedNote ? { reviewNote: trimmedNote } : {})
      });

      setState("success");
      setMessage(action === "hide" ? "بینش مخفی شد." : action === "restore" ? "بینش بازگردانی شد." : "بینش حذف نرم شد.");
      router.refresh();
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "کنش بررسی بینش ثبت نشد.");
    }
  }

  if (!anyActionAvailable) {
    return (
      <div className={styles.reviewBox}>
        <p>این بینش در وضعیت قابل بررسی نیست.</p>
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
          placeholder="برای مخفی‌کردن یا حذف نرم الزامی است"
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
        <button
          className={styles.dangerButton}
          type="button"
          disabled={isSubmitting || !actionsAvailable.hide || !trimmedReason}
          onClick={() => void submit("hide")}
        >
          {state === "hiding" ? "در حال مخفی‌کردن..." : "مخفی‌کردن"}
        </button>
        <button
          className={styles.secondaryButton}
          type="button"
          disabled={isSubmitting || !actionsAvailable.restore}
          onClick={() => void submit("restore")}
        >
          {state === "restoring" ? "در حال بازگردانی..." : "بازگردانی"}
        </button>
        <button
          className={styles.dangerButton}
          type="button"
          disabled={isSubmitting || !actionsAvailable.delete || !trimmedReason}
          onClick={() => void submit("delete")}
        >
          {state === "deleting" ? "در حال حذف نرم..." : "حذف نرم"}
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
