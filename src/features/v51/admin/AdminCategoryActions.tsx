"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AdminCategoryItem, AdminCategoryOption } from "./data";
import styles from "./AdminSurfaces.module.css";

type SubmissionState = "idle" | "saving" | "archiving" | "restoring" | "success" | "error";
type CategoryFormMode = "create" | "edit";

type AdminCategoryActionsProps = Readonly<{
  mode: CategoryFormMode;
  category?: AdminCategoryItem | null;
  parentOptions: readonly AdminCategoryOption[];
  viewerCanMutate: boolean;
}>;

const jobFieldOptions = [
  { value: "", label: "بدون اتصال به JobField" },
  { value: "PRODUCT_UX", label: "Product / UX" },
  { value: "GRAPHIC_BRAND_IDENTITY", label: "Graphic / Brand Identity" },
  { value: "SOFTWARE_ENGINEERING", label: "Software Engineering" },
  { value: "DATA_AI", label: "Data / AI" },
  { value: "MARKETING_BRAND", label: "Marketing / Brand" },
  { value: "BUSINESS_ANALYSIS_DEVELOPMENT", label: "Business Analysis / Development" },
  { value: "OPERATIONS", label: "Operations" },
  { value: "CUSTOMER_EXPERIENCE", label: "Customer Experience" },
  { value: "CUSTOMER_SUPPORT", label: "Customer Support" },
  { value: "SALES_COMMERCE", label: "Sales / Commerce" },
  { value: "STRATEGY_BUSINESS_MODEL", label: "Strategy / Business Model" },
  { value: "FINANCE_LEGAL_INVESTMENT", label: "Finance / Legal / Investment" },
  { value: "HR_ORG_CULTURE", label: "HR / Org Culture" },
  { value: "MANAGEMENT_LEADERSHIP_ENTREPRENEURSHIP", label: "Management / Leadership / Entrepreneurship" }
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

function numberFromInput(value: string) {
  return Number.parseInt(value || "0", 10);
}

export function AdminCategoryActions({
  mode,
  category,
  parentOptions,
  viewerCanMutate
}: AdminCategoryActionsProps) {
  const router = useRouter();
  const [state, setState] = useState<SubmissionState>("idle");
  const [message, setMessage] = useState("");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [titleFa, setTitleFa] = useState(category?.titleFa ?? "");
  const [titleEn, setTitleEn] = useState(category?.titleEn ?? "");
  const [descriptionFa, setDescriptionFa] = useState(category?.descriptionFa ?? "");
  const [parentId, setParentId] = useState(category?.parentId ?? "");
  const [sortOrder, setSortOrder] = useState(category ? String(category.sortOrder) : "0");
  const [jobFieldCode, setJobFieldCode] = useState(category?.jobFieldCode ?? "");
  const [isActive, setIsActive] = useState(category?.isActive ?? true);
  const [showInDiscovery, setShowInDiscovery] = useState(category?.showInDiscovery ?? true);
  const [showInInsights, setShowInInsights] = useState(category?.showInInsights ?? true);
  const [showInPricing, setShowInPricing] = useState(category?.showInPricing ?? true);
  const [archiveReason, setArchiveReason] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const isSaving = state === "saving" || state === "archiving" || state === "restoring";

  function buildPayload() {
    return {
      slug: slug.trim(),
      titleFa: titleFa.trim(),
      ...(titleEn.trim() ? { titleEn: titleEn.trim() } : { titleEn: null }),
      ...(descriptionFa.trim() ? { descriptionFa: descriptionFa.trim() } : { descriptionFa: null }),
      parentId: parentId || null,
      sortOrder: numberFromInput(sortOrder),
      jobFieldCode: jobFieldCode || null,
      isActive,
      showInDiscovery,
      showInInsights,
      showInPricing
    };
  }

  async function saveCategory() {
    if (!viewerCanMutate || isSaving) {
      return;
    }

    if (!slug.trim() || !titleFa.trim()) {
      setState("error");
      setMessage("شناسه لاتین و عنوان فارسی دسته شغلی باید ثبت شود.");
      return;
    }

    setState("saving");
    setMessage("");

    try {
      const response = await fetch(mode === "create" ? "/api/admin/categories" : `/api/admin/categories/${encodeURIComponent(category?.id ?? "")}`, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(buildPayload())
      });
      const body = (await parseAdminResponse(response, "کنش دسته شغلی ثبت نشد.")) as { data?: { id?: string }; id?: string };
      const createdId = body.data?.id ?? body.id;

      setState("success");
      setMessage(mode === "create" ? "دسته شغلی با موفقیت ثبت شد." : "دسته شغلی با موفقیت به‌روزرسانی شد.");

      if (mode === "create" && createdId) {
        router.push(`/admin/categories/${createdId}`);
      } else {
        router.refresh();
      }
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "کنش دسته شغلی ثبت نشد.");
    }
  }

  async function archiveCategory() {
    if (!viewerCanMutate || !category || isSaving) {
      return;
    }

    if (!archiveReason.trim()) {
      setState("error");
      setMessage("برای آرشیو دسته شغلی، دلیل داخلی لازم است.");
      return;
    }

    setState("archiving");
    setMessage("");

    try {
      const response = await fetch(`/api/admin/categories/${encodeURIComponent(category.id)}/archive`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          reason: archiveReason.trim(),
          ...(internalNote.trim() ? { internalNote: internalNote.trim() } : {})
        })
      });
      await parseAdminResponse(response, "آرشیو دسته شغلی ثبت نشد.");
      setState("success");
      setMessage("دسته شغلی آرشیو شد و از گزینه‌های فعال کنار گذاشته شد.");
      router.refresh();
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "آرشیو دسته شغلی ثبت نشد.");
    }
  }

  async function restoreCategory() {
    if (!viewerCanMutate || !category || isSaving) {
      return;
    }

    setState("restoring");
    setMessage("");

    try {
      const response = await fetch(`/api/admin/categories/${encodeURIComponent(category.id)}/restore`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(internalNote.trim() ? { internalNote: internalNote.trim() } : {})
      });
      await parseAdminResponse(response, "بازفعال‌سازی دسته شغلی ثبت نشد.");
      setState("success");
      setMessage("دسته شغلی بازفعال شد. نمایش در مسیرها را جداگانه بررسی کنید.");
      router.refresh();
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "بازفعال‌سازی دسته شغلی ثبت نشد.");
    }
  }

  if (!viewerCanMutate) {
    return (
      <div className={styles.reviewBox}>
        <p>نقش پشتیبانی فقط دسترسی خواندنی به دسته‌های شغلی دارد.</p>
      </div>
    );
  }

  if (mode === "edit" && category?.isArchived) {
    return (
      <div className={styles.reviewBox}>
        <p>این دسته شغلی آرشیو شده است. بازفعال‌سازی فقط وضعیت آرشیو را برمی‌دارد و نمایش در مسیرها را روشن نمی‌کند.</p>
        <label>
          <span>یادداشت داخلی</span>
          <textarea maxLength={800} value={internalNote} onChange={(event) => setInternalNote(event.target.value)} />
        </label>
        <button className={styles.primaryButton} type="button" disabled={isSaving} onClick={() => void restoreCategory()}>
          {state === "restoring" ? "در حال بازفعال‌سازی..." : "بازفعال‌سازی دسته شغلی"}
        </button>
        {message ? (
          <p className={state === "error" ? styles.errorText : styles.successText} role="status">
            {message}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className={styles.reviewBox}>
      <label>
        <span>شناسه لاتین</span>
        <input dir="ltr" maxLength={80} value={slug} onChange={(event) => setSlug(event.target.value)} />
      </label>
      <label>
        <span>عنوان فارسی</span>
        <input maxLength={120} value={titleFa} onChange={(event) => setTitleFa(event.target.value)} />
      </label>
      <label>
        <span>عنوان انگلیسی</span>
        <input dir="ltr" maxLength={120} value={titleEn} onChange={(event) => setTitleEn(event.target.value)} />
      </label>
      <label>
        <span>توضیح کوتاه</span>
        <textarea maxLength={800} value={descriptionFa} onChange={(event) => setDescriptionFa(event.target.value)} />
      </label>
      <label>
        <span>دسته بالادست</span>
        <select value={parentId} onChange={(event) => setParentId(event.target.value)}>
          <option value="">بدون دسته بالادست</option>
          {parentOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>اتصال JobField</span>
        <select value={jobFieldCode} onChange={(event) => setJobFieldCode(event.target.value)}>
          {jobFieldOptions.map((option) => (
            <option key={option.value || "none"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>ترتیب نمایش</span>
        <input min={0} max={10000} type="number" value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} />
      </label>
      <label className={styles.checkboxLabel}>
        <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />
        <span>وضعیت فعال</span>
      </label>
      <label className={styles.checkboxLabel}>
        <input type="checkbox" checked={showInDiscovery} onChange={(event) => setShowInDiscovery(event.target.checked)} />
        <span>نمایش در کشف تجربه</span>
      </label>
      <label className={styles.checkboxLabel}>
        <input type="checkbox" checked={showInInsights} onChange={(event) => setShowInInsights(event.target.checked)} />
        <span>نمایش در بینش‌ها</span>
      </label>
      <label className={styles.checkboxLabel}>
        <input type="checkbox" checked={showInPricing} onChange={(event) => setShowInPricing(event.target.checked)} />
        <span>نمایش در قیمت‌گذاری</span>
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
        <button className={styles.primaryButton} type="button" disabled={isSaving} onClick={() => void saveCategory()}>
          {state === "saving" ? "در حال ثبت..." : mode === "create" ? "ثبت دسته شغلی" : "ویرایش دسته شغلی"}
        </button>
        {mode === "edit" ? (
          <button
            className={styles.dangerButton}
            type="button"
            disabled={isSaving || !archiveReason.trim()}
            onClick={() => void archiveCategory()}
          >
            {state === "archiving" ? "در حال آرشیو..." : "آرشیو دسته شغلی"}
          </button>
        ) : null}
      </div>
      {message ? (
        <p className={state === "error" ? styles.errorText : styles.successText} role="status">
          {message}
        </p>
      ) : (
        <p>این کنش فقط لایه دسته‌بندی را تغییر می‌دهد و رکوردهای پروفایل، بینش، قیمت‌گذاری یا گفت‌وگو را حذف نمی‌کند.</p>
      )}
    </div>
  );
}
