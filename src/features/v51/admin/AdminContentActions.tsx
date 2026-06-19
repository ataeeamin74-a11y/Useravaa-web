"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AdminContentEntryItem } from "./data";
import styles from "./AdminSurfaces.module.css";

type SubmissionState = "idle" | "saving" | "archiving" | "restoring" | "success" | "error";
type ContentFormMode = "create" | "edit";

type AdminContentActionsProps = Readonly<{
  mode: ContentFormMode;
  entry?: AdminContentEntryItem | null;
  viewerCanMutate: boolean;
}>;

const contentTypeOptions = [
  { value: "SYSTEM_COPY", label: "کپی سیستمی" },
  { value: "PAGE_BLOCK", label: "بلوک صفحه" },
  { value: "FAQ", label: "پرسش پرتکرار" },
  { value: "HELP_TEXT", label: "متن راهنما" },
  { value: "EMPTY_STATE", label: "حالت خالی" },
  { value: "ERROR_MESSAGE", label: "پیام خطا" },
  { value: "CTA", label: "دعوت به اقدام" },
  { value: "ADMIN_COPY", label: "کپی ادمین" },
  { value: "NOTIFICATION_TEMPLATE", label: "الگوی اعلان" }
] as const;

const statusOptions = [
  { value: "DRAFT", label: "پیش‌نویس" },
  { value: "PUBLISHED", label: "منتشرشده" },
  { value: "HIDDEN", label: "مخفی" }
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

export function AdminContentActions({ mode, entry, viewerCanMutate }: AdminContentActionsProps) {
  const router = useRouter();
  const [state, setState] = useState<SubmissionState>("idle");
  const [message, setMessage] = useState("");
  const [key, setKey] = useState(entry?.key ?? "");
  const [namespace, setNamespace] = useState(entry?.namespace ?? "public.insights");
  const [locale, setLocale] = useState(entry?.locale ?? "fa");
  const [title, setTitle] = useState(entry?.title ?? "");
  const [body, setBody] = useState(entry?.bodyValue ?? "");
  const [shortText, setShortText] = useState(entry?.shortText ?? "");
  const [description, setDescription] = useState(entry?.description ?? "");
  const [contentType, setContentType] = useState(entry?.contentType ?? "PAGE_BLOCK");
  const [status, setStatus] = useState(entry?.status === "ARCHIVED" ? "DRAFT" : entry?.status ?? "DRAFT");
  const [isEditable, setIsEditable] = useState(entry?.isEditable ?? true);
  const [archiveReason, setArchiveReason] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const isSaving = state === "saving" || state === "archiving" || state === "restoring";
  const canEditEntry = viewerCanMutate && (!entry || entry.isEditable);

  function buildPayload() {
    const optionalTextFields = {
      ...(shortText.trim() ? { shortText: shortText.trim() } : mode === "edit" ? { shortText: null } : {}),
      ...(description.trim() ? { description: description.trim() } : mode === "edit" ? { description: null } : {})
    };
    const base = {
      title: title.trim(),
      body: body.trim(),
      ...optionalTextFields,
      contentType,
      status,
      isEditable
    };

    if (mode === "create") {
      return {
        key: key.trim(),
        namespace: namespace.trim(),
        locale: locale.trim() || "fa",
        ...base
      };
    }

    return base;
  }

  async function saveContent() {
    if (!canEditEntry || isSaving) {
      return;
    }

    if (!title.trim() || !body.trim() || (mode === "create" && (!key.trim() || !namespace.trim()))) {
      setState("error");
      setMessage("شناسه، فضا، عنوان و متن محتوا باید ثبت شود.");
      return;
    }

    setState("saving");
    setMessage("");

    try {
      const response = await fetch(mode === "create" ? "/api/admin/content" : `/api/admin/content/${encodeURIComponent(entry?.id ?? "")}`, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(buildPayload())
      });
      const bodyJson = (await parseAdminResponse(response, "کنش محتوا ثبت نشد.")) as { data?: { id?: string }; id?: string };
      const createdId = bodyJson.data?.id ?? bodyJson.id;

      setState("success");
      setMessage(mode === "create" ? "محتوا با موفقیت ثبت شد." : "محتوا با موفقیت به‌روزرسانی شد.");

      if (mode === "create" && createdId) {
        router.push(`/admin/content/${createdId}`);
      } else {
        router.refresh();
      }
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "کنش محتوا ثبت نشد.");
    }
  }

  async function archiveContent() {
    if (!canEditEntry || !entry || isSaving) {
      return;
    }

    if (!archiveReason.trim()) {
      setState("error");
      setMessage("برای آرشیو محتوا، دلیل داخلی لازم است.");
      return;
    }

    setState("archiving");
    setMessage("");

    try {
      const response = await fetch(`/api/admin/content/${encodeURIComponent(entry.id)}/archive`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          reason: archiveReason.trim(),
          ...(internalNote.trim() ? { internalNote: internalNote.trim() } : {})
        })
      });
      await parseAdminResponse(response, "آرشیو محتوا ثبت نشد.");
      setState("success");
      setMessage("محتوا آرشیو شد و از انتشار فعال کنار گذاشته شد.");
      router.refresh();
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "آرشیو محتوا ثبت نشد.");
    }
  }

  async function restoreContent() {
    if (!viewerCanMutate || !entry || isSaving) {
      return;
    }

    setState("restoring");
    setMessage("");

    try {
      const response = await fetch(`/api/admin/content/${encodeURIComponent(entry.id)}/restore`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(internalNote.trim() ? { internalNote: internalNote.trim() } : {})
      });
      await parseAdminResponse(response, "بازگردانی محتوا ثبت نشد.");
      setState("success");
      setMessage("محتوا به پیش‌نویس بازگردانده شد؛ انتشار دوباره نیازمند ویرایش جداگانه است.");
      router.refresh();
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "بازگردانی محتوا ثبت نشد.");
    }
  }

  if (!viewerCanMutate) {
    return (
      <div className={styles.reviewBox}>
        <p>نقش پشتیبانی فقط دسترسی خواندنی به مدیریت محتوا دارد.</p>
      </div>
    );
  }

  if (mode === "edit" && entry?.status === "ARCHIVED") {
    return (
      <div className={styles.reviewBox}>
        <p>این محتوا آرشیو شده است. بازگردانی آن را به پیش‌نویس منتقل می‌کند و انتشار دوباره جداگانه انجام می‌شود.</p>
        <label>
          <span>یادداشت داخلی</span>
          <textarea maxLength={800} value={internalNote} onChange={(event) => setInternalNote(event.target.value)} />
        </label>
        <button className={styles.primaryButton} type="button" disabled={isSaving} onClick={() => void restoreContent()}>
          {state === "restoring" ? "در حال بازگردانی..." : "بازگردانی به پیش‌نویس"}
        </button>
        {message ? (
          <p className={state === "error" ? styles.errorText : styles.successText} role="status">
            {message}
          </p>
        ) : null}
      </div>
    );
  }

  if (mode === "edit" && entry && !entry.isEditable) {
    return (
      <div className={styles.reviewBox}>
        <p>این ردیف غیرقابل ویرایش است و فقط برای مشاهده و ردیابی نگهداری می‌شود.</p>
      </div>
    );
  }

  return (
    <div className={styles.reviewBox}>
      {mode === "create" ? (
        <>
          <label>
            <span>شناسه محتوا</span>
            <input dir="ltr" maxLength={140} value={key} onChange={(event) => setKey(event.target.value)} />
          </label>
          <label>
            <span>فضای محتوا</span>
            <input dir="ltr" maxLength={100} value={namespace} onChange={(event) => setNamespace(event.target.value)} />
          </label>
          <label>
            <span>زبان</span>
            <input dir="ltr" maxLength={12} value={locale} onChange={(event) => setLocale(event.target.value)} />
          </label>
        </>
      ) : null}
      <label>
        <span>عنوان</span>
        <input maxLength={180} value={title} onChange={(event) => setTitle(event.target.value)} />
      </label>
      <label>
        <span>متن</span>
        <textarea maxLength={10000} value={body} onChange={(event) => setBody(event.target.value)} />
      </label>
      <label>
        <span>متن کوتاه</span>
        <textarea maxLength={500} value={shortText} onChange={(event) => setShortText(event.target.value)} />
      </label>
      <label>
        <span>توضیح داخلی</span>
        <textarea maxLength={1000} value={description} onChange={(event) => setDescription(event.target.value)} />
      </label>
      <label>
        <span>نوع محتوا</span>
        <select value={contentType} onChange={(event) => setContentType(event.target.value)}>
          {contentTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
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
      <label className={styles.checkboxLabel}>
        <input type="checkbox" checked={isEditable} onChange={(event) => setIsEditable(event.target.checked)} />
        <span>این محتوا قابل ویرایش باشد</span>
      </label>
      {mode === "edit" ? (
        <label>
          <span>دلیل آرشیو</span>
          <textarea
            maxLength={500}
            value={archiveReason}
            onChange={(event) => setArchiveReason(event.target.value)}
            placeholder="برای آرشیو لازم است"
          />
        </label>
      ) : null}
      <label>
        <span>یادداشت داخلی</span>
        <textarea maxLength={800} value={internalNote} onChange={(event) => setInternalNote(event.target.value)} />
      </label>
      <div className={styles.actions}>
        <button className={styles.primaryButton} type="button" disabled={isSaving} onClick={() => void saveContent()}>
          {state === "saving" ? "در حال ثبت..." : mode === "create" ? "ثبت محتوا" : "ویرایش محتوا"}
        </button>
        {mode === "edit" ? (
          <button
            className={styles.dangerButton}
            type="button"
            disabled={isSaving || !archiveReason.trim()}
            onClick={() => void archiveContent()}
          >
            {state === "archiving" ? "در حال آرشیو..." : "آرشیو محتوا"}
          </button>
        ) : null}
      </div>
      {message ? (
        <p className={state === "error" ? styles.errorText : styles.successText} role="status">
          {message}
        </p>
      ) : (
        <p>این کنش فقط محتوای پلتفرمی/مدیریت‌شده را تغییر می‌دهد و متن کاربرساخته را بازنویسی نمی‌کند.</p>
      )}
    </div>
  );
}
