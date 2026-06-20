"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AdminSupportTicketItem } from "./data";
import styles from "./AdminSurfaces.module.css";

type SubmissionState =
  | "idle"
  | "saving"
  | "assigning"
  | "noting"
  | "resolving"
  | "reopening"
  | "archiving"
  | "success"
  | "error";

type AdminSupportActionsProps = Readonly<{
  mode: "create" | "detail";
  ticket?: AdminSupportTicketItem | null;
  viewerCanCreate: boolean;
  viewerCanMutate: boolean;
  viewerCanArchive: boolean;
  viewerId: string;
}>;

const statusOptions = [
  { value: "NEW", label: "جدید" },
  { value: "OPEN", label: "باز" },
  { value: "IN_PROGRESS", label: "در حال پیگیری" },
  { value: "WAITING_FOR_USER", label: "در انتظار کاربر" },
  { value: "WAITING_FOR_PROVIDER", label: "در انتظار تجربه‌آفرین" },
  { value: "ESCALATED", label: "ارجاع‌شده" },
  { value: "RESOLVED", label: "حل‌شده" }
] as const;

const priorityOptions = [
  { value: "LOW", label: "کم" },
  { value: "NORMAL", label: "معمولی" },
  { value: "HIGH", label: "بالا" },
  { value: "URGENT", label: "فوری" }
] as const;

const categoryOptions = [
  { value: "CONVERSATION", label: "گفت‌وگو" },
  { value: "PAYMENT", label: "پرداخت" },
  { value: "CANCELLATION_REFUND_WALLET", label: "لغو / مبلغ برگشتی / کیف پول" },
  { value: "PROFILE_EXPERIENCE_CREATOR", label: "پروفایل تجربه‌آفرین" },
  { value: "INSIGHT_CONTENT", label: "بینش / محتوا" },
  { value: "ACCOUNT_AUTH", label: "حساب و ورود" },
  { value: "PRICING_CATEGORY", label: "قیمت‌گذاری / دسته‌بندی" },
  { value: "TECHNICAL_ISSUE", label: "مسئله فنی" },
  { value: "TRUST_SAFETY", label: "اعتماد و ایمنی" },
  { value: "GENERAL_QUESTION", label: "پرسش عمومی" }
] as const;

const sourceOptions = [
  { value: "ADMIN_CREATED", label: "ساخته‌شده توسط ادمین" },
  { value: "USER_REPORTED", label: "گزارش کاربر" },
  { value: "SYSTEM_FLAGGED", label: "پرچم سیستمی" },
  { value: "PAYMENT_REVIEW", label: "بررسی پرداخت" },
  { value: "CONVERSATION_FLOW", label: "مسیر گفت‌وگو" },
  { value: "PROFILE_REVIEW", label: "بررسی پروفایل" },
  { value: "INSIGHT_REPORT", label: "گزارش بینش" },
  { value: "MANUAL", label: "دستی" }
] as const;

const relatedEntityTypeOptions = [
  { value: "NONE", label: "بدون ارتباط" },
  { value: "USER", label: "کاربر" },
  { value: "CONVERSATION", label: "گفت‌وگو" },
  { value: "PAYMENT", label: "پرداخت" },
  { value: "PROFILE", label: "پروفایل تجربه‌آفرین" },
  { value: "INSIGHT", label: "بینش" },
  { value: "WALLET_TRANSACTION", label: "تراکنش کیف پول" },
  { value: "CONTENT_ENTRY", label: "محتوا" }
] as const;

async function parseAdminResponse(response: Response, fallback: string) {
  if (response.ok) {
    return response.json();
  }

  let message = fallback;

  try {
    const body = (await response.json()) as { error?: { message?: string }; message?: string };
    message = body.error?.message ?? body.message ?? message;
  } catch {
    message = fallback;
  }

  throw new Error(message);
}

function optionalText(value: string) {
  return value.trim() ? value.trim() : null;
}

export function AdminSupportActions({
  mode,
  ticket,
  viewerCanCreate,
  viewerCanMutate,
  viewerCanArchive,
  viewerId
}: AdminSupportActionsProps) {
  const router = useRouter();
  const [state, setState] = useState<SubmissionState>("idle");
  const [message, setMessage] = useState("");
  const [subject, setSubject] = useState(ticket?.subject ?? "");
  const [description, setDescription] = useState(ticket?.description ?? "");
  const [status, setStatus] = useState(ticket?.status === "ARCHIVED" ? "OPEN" : ticket?.status ?? "NEW");
  const [priority, setPriority] = useState(ticket?.priority ?? "NORMAL");
  const [category, setCategory] = useState(ticket?.category ?? "GENERAL_QUESTION");
  const [subcategory, setSubcategory] = useState(ticket?.subcategory === "ثبت نشده" ? "" : ticket?.subcategory ?? "");
  const [source, setSource] = useState(ticket?.sourceCode ?? "ADMIN_CREATED");
  const [requesterUserId, setRequesterUserId] = useState(ticket?.requesterHref?.split("/").pop() ?? "");
  const [assigneeAdminId, setAssigneeAdminId] = useState(ticket?.assigneeSummary === "ثبت نشده" ? "" : ticket?.assigneeSummary.split(" · ").pop() ?? "");
  const [relatedEntityType, setRelatedEntityType] = useState(ticket?.relatedEntityType ?? "NONE");
  const [relatedEntityId, setRelatedEntityId] = useState(ticket?.relatedEntityId === "ثبت نشده" ? "" : ticket?.relatedEntityId ?? "");
  const [noteBody, setNoteBody] = useState("");
  const [noteType, setNoteType] = useState("INTERNAL");
  const [resolutionSummary, setResolutionSummary] = useState("");
  const [resolutionReason, setResolutionReason] = useState("");
  const [reopenReason, setReopenReason] = useState("");
  const [archiveReason, setArchiveReason] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const isSaving = state !== "idle" && state !== "success" && state !== "error";
  const canCreate = mode === "create" && viewerCanCreate;
  const canEdit = mode === "detail" && Boolean(ticket) && viewerCanMutate && ticket?.actionsAvailable;

  function buildCreatePayload() {
    return {
      subject: subject.trim(),
      description: description.trim(),
      priority,
      category,
      source,
      ...(optionalText(subcategory) ? { subcategory: optionalText(subcategory) } : {}),
      ...(optionalText(requesterUserId) ? { requesterUserId: optionalText(requesterUserId) } : {}),
      ...(optionalText(assigneeAdminId) ? { assigneeAdminId: optionalText(assigneeAdminId) } : {}),
      relatedEntityType,
      ...(relatedEntityType !== "NONE" && optionalText(relatedEntityId) ? { relatedEntityId: optionalText(relatedEntityId) } : {})
    };
  }

  function buildUpdatePayload() {
    return {
      subject: subject.trim(),
      description: description.trim(),
      status,
      priority,
      category,
      source,
      subcategory: optionalText(subcategory),
      requesterUserId: optionalText(requesterUserId),
      assigneeAdminId: optionalText(assigneeAdminId),
      relatedEntityType,
      relatedEntityId: relatedEntityType === "NONE" ? null : optionalText(relatedEntityId)
    };
  }

  async function saveTicket() {
    if (isSaving || (!canCreate && !canEdit)) {
      return;
    }

    if (!subject.trim() || !description.trim()) {
      setState("error");
      setMessage("موضوع و شرح تیکت باید ثبت شود.");
      return;
    }

    setState("saving");
    setMessage("");

    try {
      const response = await fetch(mode === "create" ? "/api/admin/support" : `/api/admin/support/${encodeURIComponent(ticket?.id ?? "")}`, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(mode === "create" ? buildCreatePayload() : buildUpdatePayload())
      });
      const bodyJson = (await parseAdminResponse(response, "کنش پشتیبانی ثبت نشد.")) as { data?: { id?: string }; id?: string };
      const createdId = bodyJson.data?.id ?? bodyJson.id;
      setState("success");
      setMessage(mode === "create" ? "تیکت پشتیبانی ثبت شد." : "تیکت پشتیبانی به‌روزرسانی شد.");

      if (mode === "create" && createdId) {
        router.push(`/admin/support/${createdId}`);
      } else {
        router.refresh();
      }
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "کنش پشتیبانی ثبت نشد.");
    }
  }

  async function postTicketAction(action: "assign" | "notes" | "resolve" | "reopen" | "archive", payload: Record<string, unknown>, nextState: SubmissionState) {
    if (!ticket || isSaving) {
      return;
    }

    setState(nextState);
    setMessage("");

    try {
      const response = await fetch(`/api/admin/support/${encodeURIComponent(ticket.id)}/${action}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      await parseAdminResponse(response, "کنش پشتیبانی ثبت نشد.");
      setState("success");
      setMessage("کنش پشتیبانی ثبت شد.");
      router.refresh();
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "کنش پشتیبانی ثبت نشد.");
    }
  }

  if (mode === "create" && !viewerCanCreate) {
    return (
      <div className={styles.reviewBox}>
        <p>در حالت فعلی امکان ثبت تیکت پشتیبانی از این مسیر فعال نیست.</p>
      </div>
    );
  }

  if (mode === "detail" && (!ticket || !viewerCanMutate || !ticket.actionsAvailable)) {
    return (
      <div className={styles.reviewBox}>
        <p>این تیکت فقط برای مشاهده در دسترس است.</p>
      </div>
    );
  }

  return (
    <div className={styles.reviewBox}>
      <label>
        <span>موضوع</span>
        <input maxLength={180} value={subject} onChange={(event) => setSubject(event.target.value)} />
      </label>
      <label>
        <span>شرح</span>
        <textarea maxLength={4000} value={description} onChange={(event) => setDescription(event.target.value)} />
      </label>
      {mode === "detail" ? (
        <label>
          <span>وضعیت</span>
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <label>
        <span>اولویت</span>
        <select value={priority} onChange={(event) => setPriority(event.target.value)}>
          {priorityOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>دسته</span>
        <select value={category} onChange={(event) => setCategory(event.target.value)}>
          {categoryOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>زیردسته</span>
        <input maxLength={120} value={subcategory} onChange={(event) => setSubcategory(event.target.value)} />
      </label>
      <label>
        <span>منبع</span>
        <select value={source} onChange={(event) => setSource(event.target.value)}>
          {sourceOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>شناسه کاربر درخواست‌کننده</span>
        <input dir="ltr" maxLength={160} value={requesterUserId} onChange={(event) => setRequesterUserId(event.target.value)} />
      </label>
      {viewerCanArchive ? (
        <label>
          <span>شناسه مسئول</span>
          <input dir="ltr" maxLength={160} value={assigneeAdminId} onChange={(event) => setAssigneeAdminId(event.target.value)} />
        </label>
      ) : null}
      <label>
        <span>نوع موجودیت مرتبط</span>
        <select value={relatedEntityType} onChange={(event) => setRelatedEntityType(event.target.value)}>
          {relatedEntityTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>شناسه موجودیت مرتبط</span>
        <input dir="ltr" maxLength={160} value={relatedEntityId} onChange={(event) => setRelatedEntityId(event.target.value)} />
      </label>
      <div className={styles.actions}>
        <button className={styles.primaryButton} type="button" disabled={isSaving} onClick={() => void saveTicket()}>
          {state === "saving" ? "در حال ثبت..." : mode === "create" ? "ثبت تیکت" : "ویرایش تیکت"}
        </button>
        {mode === "detail" && ticket ? (
          <button
            className={styles.secondaryButton}
            type="button"
            disabled={isSaving}
            onClick={() => void postTicketAction("assign", { assigneeAdminId: viewerCanArchive ? optionalText(assigneeAdminId) : viewerId }, "assigning")}
          >
            {state === "assigning" ? "در حال تخصیص..." : viewerCanArchive ? "ثبت مسئول" : "تخصیص به من"}
          </button>
        ) : null}
      </div>
      {mode === "detail" && ticket ? (
        <>
          <label>
            <span>یادداشت داخلی</span>
            <textarea maxLength={2000} value={noteBody} onChange={(event) => setNoteBody(event.target.value)} />
          </label>
          <label>
            <span>نوع یادداشت</span>
            <select value={noteType} onChange={(event) => setNoteType(event.target.value)}>
              <option value="INTERNAL">یادداشت داخلی</option>
              <option value="PUBLIC_DRAFT">پیش‌نویس عمومی</option>
            </select>
          </label>
          <button
            className={styles.secondaryButton}
            type="button"
            disabled={isSaving || !noteBody.trim()}
            onClick={() => void postTicketAction("notes", { body: noteBody.trim(), noteType }, "noting")}
          >
            {state === "noting" ? "در حال ثبت..." : "افزودن یادداشت"}
          </button>
          {viewerCanArchive ? (
            <>
              <label>
                <span>خلاصه حل</span>
                <textarea maxLength={1000} value={resolutionSummary} onChange={(event) => setResolutionSummary(event.target.value)} />
              </label>
              <label>
                <span>دلیل حل</span>
                <input maxLength={300} value={resolutionReason} onChange={(event) => setResolutionReason(event.target.value)} />
              </label>
              <label>
                <span>دلیل بازگشایی</span>
                <input maxLength={500} value={reopenReason} onChange={(event) => setReopenReason(event.target.value)} />
              </label>
              <label>
                <span>دلیل آرشیو</span>
                <textarea maxLength={500} value={archiveReason} onChange={(event) => setArchiveReason(event.target.value)} />
              </label>
              <label>
                <span>یادداشت داخلی برای کنش</span>
                <textarea maxLength={800} value={internalNote} onChange={(event) => setInternalNote(event.target.value)} />
              </label>
              <div className={styles.actions}>
                <button
                  className={styles.primaryButton}
                  type="button"
                  disabled={isSaving || !resolutionSummary.trim() || !resolutionReason.trim()}
                  onClick={() =>
                    void postTicketAction(
                      "resolve",
                      {
                        resolutionSummary: resolutionSummary.trim(),
                        resolutionReason: resolutionReason.trim(),
                        ...(internalNote.trim() ? { internalNote: internalNote.trim() } : {})
                      },
                      "resolving"
                    )
                  }
                >
                  {state === "resolving" ? "در حال حل..." : "حل تیکت"}
                </button>
                <button
                  className={styles.secondaryButton}
                  type="button"
                  disabled={isSaving || !reopenReason.trim()}
                  onClick={() =>
                    void postTicketAction(
                      "reopen",
                      {
                        reason: reopenReason.trim(),
                        ...(internalNote.trim() ? { internalNote: internalNote.trim() } : {})
                      },
                      "reopening"
                    )
                  }
                >
                  {state === "reopening" ? "در حال بازگشایی..." : "بازگشایی"}
                </button>
                <button
                  className={styles.dangerButton}
                  type="button"
                  disabled={isSaving || !archiveReason.trim()}
                  onClick={() =>
                    void postTicketAction(
                      "archive",
                      {
                        reason: archiveReason.trim(),
                        ...(internalNote.trim() ? { internalNote: internalNote.trim() } : {})
                      },
                      "archiving"
                    )
                  }
                >
                  {state === "archiving" ? "در حال آرشیو..." : "آرشیو تیکت"}
                </button>
              </div>
            </>
          ) : null}
        </>
      ) : null}
      {message ? (
        <p className={state === "error" ? styles.errorText : styles.successText} role="status">
          {message}
        </p>
      ) : (
        <p>این مسیر فقط خود تیکت پشتیبانی را تغییر می‌دهد و برای پرداخت، کیف پول، لغو یا گفت‌وگو باید از صفحه رسمی همان بخش اقدام شود.</p>
      )}
    </div>
  );
}
