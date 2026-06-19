"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./AdminSurfaces.module.css";

type SubmissionState = "idle" | "approving" | "rejecting" | "success" | "error";

type AdminPaymentReviewActionsProps = Readonly<{
  paymentId: string;
  actionsAvailable: boolean;
}>;

async function postPaymentReviewAction(paymentId: string, action: "approve" | "reject", payload: Record<string, string>) {
  const response = await fetch(`/api/admin/payments/${encodeURIComponent(paymentId)}/${action}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    let message = "کنش پرداخت ثبت نشد.";

    try {
      const body = (await response.json()) as { error?: { message?: string }; message?: string };
      message = body.error?.message ?? body.message ?? message;
    } catch {
      message = "کنش پرداخت ثبت نشد.";
    }

    throw new Error(message);
  }

  return response.json();
}

export function AdminPaymentReviewActions({ paymentId, actionsAvailable }: AdminPaymentReviewActionsProps) {
  const router = useRouter();
  const [state, setState] = useState<SubmissionState>("idle");
  const [adminNote, setAdminNote] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [message, setMessage] = useState("");
  const isSubmitting = state === "approving" || state === "rejecting";
  const trimmedReason = rejectionReason.trim();
  const trimmedNote = adminNote.trim();

  async function submit(action: "approve" | "reject") {
    if (!actionsAvailable || isSubmitting) {
      return;
    }

    if (action === "reject" && !trimmedReason) {
      setState("error");
      setMessage("دلیل رد پرداخت باید ثبت شود.");
      return;
    }

    setState(action === "approve" ? "approving" : "rejecting");
    setMessage("");

    try {
      await postPaymentReviewAction(paymentId, action, {
        ...(trimmedNote ? { adminNote: trimmedNote } : {}),
        ...(action === "reject" ? { rejectionReason: trimmedReason } : {})
      });

      setState("success");
      setMessage(action === "approve" ? "پرداخت با موفقیت تأیید شد." : "پرداخت با موفقیت رد شد.");
      router.refresh();
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "کنش پرداخت ثبت نشد.");
    }
  }

  if (!actionsAvailable) {
    return (
      <div className={styles.reviewBox}>
        <p>این پرداخت در وضعیت قابل بررسی دستی نیست.</p>
      </div>
    );
  }

  return (
    <div className={styles.reviewBox}>
      <label>
        <span>یادداشت بررسی</span>
        <textarea
          maxLength={500}
          value={adminNote}
          onChange={(event) => setAdminNote(event.target.value)}
          placeholder="یادداشت اختیاری برای گزارش ممیزی"
        />
      </label>
      <label>
        <span>دلیل رد پرداخت</span>
        <textarea
          maxLength={500}
          value={rejectionReason}
          onChange={(event) => setRejectionReason(event.target.value)}
          placeholder="برای رد پرداخت الزامی است"
        />
      </label>
      <div className={styles.actions}>
        <button className={styles.primaryButton} type="button" disabled={isSubmitting} onClick={() => void submit("approve")}>
          {state === "approving" ? "در حال تأیید..." : "تأیید پرداخت"}
        </button>
        <button
          className={styles.dangerButton}
          type="button"
          disabled={isSubmitting || !trimmedReason}
          onClick={() => void submit("reject")}
        >
          {state === "rejecting" ? "در حال رد..." : "رد پرداخت"}
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
