"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./AdminSurfaces.module.css";

type SubmissionState = "idle" | "approving" | "rejecting" | "success" | "error";

type AdminCancellationReviewActionsProps = Readonly<{
  cancellationId: string;
  actionsAvailable: boolean;
  eligibleCreditAmountToman: number;
}>;

async function postCancellationReviewAction(
  cancellationId: string,
  action: "approve-credit" | "reject-credit",
  payload: Record<string, string | number>
) {
  const response = await fetch(`/api/admin/cancellations/${encodeURIComponent(cancellationId)}/${action}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    let message = "کنش بررسی لغو ثبت نشد.";

    try {
      const body = (await response.json()) as { error?: { message?: string }; message?: string };
      message = body.error?.message ?? body.message ?? message;
    } catch {
      message = "کنش بررسی لغو ثبت نشد.";
    }

    throw new Error(message);
  }

  return response.json();
}

export function AdminCancellationReviewActions({
  cancellationId,
  actionsAvailable,
  eligibleCreditAmountToman
}: AdminCancellationReviewActionsProps) {
  const router = useRouter();
  const [state, setState] = useState<SubmissionState>("idle");
  const [creditAmount, setCreditAmount] = useState(String(Math.max(eligibleCreditAmountToman, 0)));
  const [reviewNote, setReviewNote] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [message, setMessage] = useState("");
  const isSubmitting = state === "approving" || state === "rejecting";
  const parsedCreditAmount = Number(creditAmount);
  const validCreditAmount =
    Number.isInteger(parsedCreditAmount) && parsedCreditAmount > 0 && parsedCreditAmount <= eligibleCreditAmountToman;
  const trimmedNote = reviewNote.trim();
  const trimmedReason = rejectionReason.trim();

  async function submit(action: "approve-credit" | "reject-credit") {
    if (!actionsAvailable || isSubmitting) {
      return;
    }

    if (action === "approve-credit" && !validCreditAmount) {
      setState("error");
      setMessage("مبلغ اعتبار باید عددی مثبت و در محدوده مجاز باشد.");
      return;
    }

    if (action === "reject-credit" && !trimmedReason) {
      setState("error");
      setMessage("برای بستن بررسی بدون اعتبار، دلیل داخلی لازم است.");
      return;
    }

    setState(action === "approve-credit" ? "approving" : "rejecting");
    setMessage("");

    try {
      await postCancellationReviewAction(
        cancellationId,
        action,
        action === "approve-credit"
          ? {
              creditAmountToman: parsedCreditAmount,
              ...(trimmedNote ? { reviewNote: trimmedNote } : {})
            }
          : {
              rejectionReason: trimmedReason,
              ...(trimmedNote ? { reviewNote: trimmedNote } : {})
            }
      );

      setState("success");
      setMessage(action === "approve-credit" ? "اعتبار کیف پول با موفقیت ثبت شد." : "بررسی بدون اعتبار بسته شد.");
      router.refresh();
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "کنش بررسی لغو ثبت نشد.");
    }
  }

  if (!actionsAvailable) {
    return (
      <div className={styles.reviewBox}>
        <p>این لغو در وضعیت قابل بررسی پشتیبانی نیست.</p>
      </div>
    );
  }

  return (
    <div className={styles.reviewBox}>
      <label>
        <span>مبلغ اعتبار کیف پول</span>
        <input
          inputMode="numeric"
          min={1}
          max={eligibleCreditAmountToman}
          type="number"
          value={creditAmount}
          onChange={(event) => setCreditAmount(event.target.value)}
        />
      </label>
      <label>
        <span>یادداشت بررسی</span>
        <textarea
          maxLength={500}
          value={reviewNote}
          onChange={(event) => setReviewNote(event.target.value)}
          placeholder="یادداشت داخلی اختیاری برای گزارش ممیزی"
        />
      </label>
      <label>
        <span>دلیل بستن بدون اعتبار</span>
        <textarea
          maxLength={500}
          value={rejectionReason}
          onChange={(event) => setRejectionReason(event.target.value)}
          placeholder="برای رد اعتبار الزامی است"
        />
      </label>
      <div className={styles.actions}>
        <button
          className={styles.primaryButton}
          type="button"
          disabled={isSubmitting || !validCreditAmount}
          onClick={() => void submit("approve-credit")}
        >
          {state === "approving" ? "در حال ثبت..." : "تأیید اعتبار"}
        </button>
        <button
          className={styles.dangerButton}
          type="button"
          disabled={isSubmitting || !trimmedReason}
          onClick={() => void submit("reject-credit")}
        >
          {state === "rejecting" ? "در حال بستن..." : "بستن بدون اعتبار"}
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
