"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./AdminSurfaces.module.css";

type ReviewAction = "approve" | "request-changes" | "hide";
type SubmissionState = "idle" | "approving" | "requesting" | "hiding" | "success" | "error";

type AdminExperienceProfileReviewActionsProps = Readonly<{
  profileId: string;
  actionsAvailable: {
    approve: boolean;
    requestChanges: boolean;
    hide: boolean;
  };
}>;

async function postExperienceProfileReviewAction(profileId: string, action: ReviewAction, payload: Record<string, string>) {
  const response = await fetch(`/api/admin/experience-profiles/${encodeURIComponent(profileId)}/${action}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    let message = "کنش بررسی پروفایل تجربه ثبت نشد.";

    try {
      const body = (await response.json()) as { error?: { message?: string }; message?: string };
      message = body.error?.message ?? body.message ?? message;
    } catch {
      message = "کنش بررسی پروفایل تجربه ثبت نشد.";
    }

    throw new Error(message);
  }

  return response.json();
}

export function AdminExperienceProfileReviewActions({
  profileId,
  actionsAvailable
}: AdminExperienceProfileReviewActionsProps) {
  const router = useRouter();
  const [state, setState] = useState<SubmissionState>("idle");
  const [reviewReason, setReviewReason] = useState("");
  const [reviewNote, setReviewNote] = useState("");
  const [message, setMessage] = useState("");
  const isSubmitting = state === "approving" || state === "requesting" || state === "hiding";
  const trimmedReason = reviewReason.trim();
  const trimmedNote = reviewNote.trim();
  const anyActionAvailable = actionsAvailable.approve || actionsAvailable.requestChanges || actionsAvailable.hide;

  async function submit(action: ReviewAction) {
    if (!anyActionAvailable || isSubmitting) {
      return;
    }

    if (action !== "approve" && !trimmedReason) {
      setState("error");
      setMessage("برای درخواست اصلاح یا مخفی‌سازی، دلیل داخلی لازم است.");
      return;
    }

    setState(action === "approve" ? "approving" : action === "request-changes" ? "requesting" : "hiding");
    setMessage("");

    try {
      await postExperienceProfileReviewAction(profileId, action, {
        ...(action !== "approve" ? { reviewReason: trimmedReason } : {}),
        ...(trimmedNote ? { reviewNote: trimmedNote } : {})
      });

      setState("success");
      setMessage(
        action === "approve"
          ? "پروفایل تجربه با موفقیت تأیید شد."
          : action === "request-changes"
            ? "پروفایل تجربه به وضعیت نیازمند اصلاح منتقل شد."
            : "پروفایل تجربه از نمایش مخفی شد."
      );
      router.refresh();
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "کنش بررسی پروفایل تجربه ثبت نشد.");
    }
  }

  if (!anyActionAvailable) {
    return (
      <div className={styles.reviewBox}>
        <p>این پروفایل تجربه در وضعیت قابل بررسی یا مخفی‌سازی نیست.</p>
      </div>
    );
  }

  return (
    <div className={styles.reviewBox}>
      <label>
        <span>دلیل بررسی</span>
        <textarea
          maxLength={500}
          value={reviewReason}
          onChange={(event) => setReviewReason(event.target.value)}
          placeholder="برای نیازمند اصلاح یا مخفی از نمایش الزامی است"
        />
      </label>
      <label>
        <span>یادداشت بررسی</span>
        <textarea
          maxLength={500}
          value={reviewNote}
          onChange={(event) => setReviewNote(event.target.value)}
          placeholder="یادداشت اختیاری برای گزارش ممیزی"
        />
      </label>
      <div className={styles.actions}>
        <button
          className={styles.primaryButton}
          type="button"
          disabled={isSubmitting || !actionsAvailable.approve}
          onClick={() => void submit("approve")}
        >
          {state === "approving" ? "در حال تأیید..." : "تأیید پروفایل"}
        </button>
        <button
          className={styles.secondaryButton}
          type="button"
          disabled={isSubmitting || !actionsAvailable.requestChanges || !trimmedReason}
          onClick={() => void submit("request-changes")}
        >
          {state === "requesting" ? "در حال ثبت..." : "نیازمند اصلاح"}
        </button>
        <button
          className={styles.dangerButton}
          type="button"
          disabled={isSubmitting || !actionsAvailable.hide || !trimmedReason}
          onClick={() => void submit("hide")}
        >
          {state === "hiding" ? "در حال مخفی‌سازی..." : "مخفی از نمایش"}
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
