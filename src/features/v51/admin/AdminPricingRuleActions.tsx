"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AdminPricingCategoryOption, AdminPricingRuleItem } from "./data";
import styles from "./AdminSurfaces.module.css";

type SubmissionState = "idle" | "saving" | "deactivating" | "success" | "error";
type PricingRuleFormMode = "create" | "edit";

type AdminPricingRuleActionsProps = Readonly<{
  mode: PricingRuleFormMode;
  rule?: AdminPricingRuleItem | null;
  categoryOptions: readonly AdminPricingCategoryOption[];
  viewerCanMutate: boolean;
}>;

const experienceLevelOptions = [
  { value: "", label: "همه سطح‌های تجربه" },
  { value: "INTERN", label: "تازه‌کار" },
  { value: "SPECIALIST", label: "متخصص" },
  { value: "SENIOR_SPECIALIST", label: "متخصص ارشد" },
  { value: "MIDDLE_MANAGER", label: "مدیر میانی" },
  { value: "SENIOR_MANAGER", label: "مدیر ارشد" },
  { value: "VP", label: "مدیر ارشد اجرایی" },
  { value: "BUSINESS_MANAGER", label: "مدیر کسب‌وکار" }
] as const;

const durationOptions = [
  { value: "", label: "همه مدت‌ها" },
  { value: "30", label: "جلسه ۳۰ دقیقه‌ای" },
  { value: "60", label: "جلسه ۶۰ دقیقه‌ای" }
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
  return Number.parseInt(value, 10);
}

export function AdminPricingRuleActions({
  mode,
  rule,
  categoryOptions,
  viewerCanMutate
}: AdminPricingRuleActionsProps) {
  const router = useRouter();
  const [state, setState] = useState<SubmissionState>("idle");
  const [message, setMessage] = useState("");
  const [title, setTitle] = useState(rule?.title ?? "");
  const [jobFieldCode, setJobFieldCode] = useState(rule?.jobFieldCode ?? "");
  const [experienceLevel, setExperienceLevel] = useState(rule?.experienceLevelCode ?? "");
  const [duration, setDuration] = useState(rule?.durationValue ?? "");
  const [minPriceToman, setMinPriceToman] = useState(rule ? String(rule.minPriceToman) : "0");
  const [suggestedPriceToman, setSuggestedPriceToman] = useState(rule ? String(rule.suggestedPriceToman) : "0");
  const [maxPriceToman, setMaxPriceToman] = useState(rule ? String(rule.maxPriceToman) : "0");
  const [commissionRateBps, setCommissionRateBps] = useState(rule ? String(rule.commissionRateBps) : "1500");
  const [allowFreeSession, setAllowFreeSession] = useState(rule?.allowFreeSession ?? true);
  const [effectiveFrom, setEffectiveFrom] = useState(rule?.effectiveFromValue ?? new Date().toISOString().slice(0, 10));
  const [effectiveTo, setEffectiveTo] = useState(rule?.effectiveToValue ?? "");
  const [internalNote, setInternalNote] = useState(rule?.internalNote ?? "");
  const [deactivationReason, setDeactivationReason] = useState("");
  const isSaving = state === "saving" || state === "deactivating";
  const titleText = mode === "create" ? "ثبت قانون قیمت‌گذاری" : "ویرایش قانون قیمت‌گذاری";

  function buildPayload() {
    return {
      title: title.trim(),
      jobFieldCode: jobFieldCode || null,
      experienceLevel: experienceLevel || null,
      sessionDurationMinutes: duration ? numberFromInput(duration) : null,
      minPriceToman: numberFromInput(minPriceToman),
      suggestedPriceToman: numberFromInput(suggestedPriceToman),
      maxPriceToman: numberFromInput(maxPriceToman),
      commissionRateBps: numberFromInput(commissionRateBps),
      freeSessionCommissionRateBps: 0,
      allowFreeSession,
      ...(effectiveFrom ? { effectiveFrom: new Date(`${effectiveFrom}T00:00:00.000Z`).toISOString() } : {}),
      effectiveTo: effectiveTo ? new Date(`${effectiveTo}T00:00:00.000Z`).toISOString() : null,
      ...(internalNote.trim() ? { internalNote: internalNote.trim() } : {})
    };
  }

  async function saveRule() {
    if (!viewerCanMutate || isSaving) {
      return;
    }

    if (!title.trim()) {
      setState("error");
      setMessage("عنوان قانون قیمت‌گذاری باید ثبت شود.");
      return;
    }

    setState("saving");
    setMessage("");

    try {
      const response = await fetch(mode === "create" ? "/api/admin/pricing" : `/api/admin/pricing/${encodeURIComponent(rule?.id ?? "")}`, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(buildPayload())
      });
      const body = (await parseAdminResponse(response, "کنش قیمت‌گذاری ثبت نشد.")) as { data?: { id?: string }; id?: string };
      const createdId = body.data?.id ?? body.id;

      setState("success");
      setMessage(mode === "create" ? "قانون قیمت‌گذاری با موفقیت ثبت شد." : "قانون قیمت‌گذاری با موفقیت به‌روزرسانی شد.");

      if (mode === "create" && createdId) {
        router.push(`/admin/pricing/${createdId}`);
      } else {
        router.refresh();
      }
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "کنش قیمت‌گذاری ثبت نشد.");
    }
  }

  async function deactivateRule() {
    if (!viewerCanMutate || !rule || isSaving) {
      return;
    }

    if (!deactivationReason.trim()) {
      setState("error");
      setMessage("برای غیرفعال‌سازی قانون قیمت‌گذاری، دلیل داخلی لازم است.");
      return;
    }

    setState("deactivating");
    setMessage("");

    try {
      const response = await fetch(`/api/admin/pricing/${encodeURIComponent(rule.id)}/deactivate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          reason: deactivationReason.trim(),
          ...(internalNote.trim() ? { internalNote: internalNote.trim() } : {})
        })
      });
      await parseAdminResponse(response, "غیرفعال‌سازی قانون قیمت‌گذاری ثبت نشد.");
      setState("success");
      setMessage("قانون قیمت‌گذاری با موفقیت غیرفعال و آرشیو شد.");
      router.refresh();
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "غیرفعال‌سازی قانون قیمت‌گذاری ثبت نشد.");
    }
  }

  if (!viewerCanMutate) {
    return (
      <div className={styles.reviewBox}>
        <p>نقش پشتیبانی فقط دسترسی خواندنی به قیمت‌گذاری دارد.</p>
      </div>
    );
  }

  if (mode === "edit" && rule?.isArchived) {
    return (
      <div className={styles.reviewBox}>
        <p>این قانون قیمت‌گذاری آرشیو شده و قابل ویرایش یا بازفعال‌سازی نیست.</p>
      </div>
    );
  }

  return (
    <div className={styles.reviewBox}>
      <label>
        <span>عنوان</span>
        <input maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} />
      </label>
      <label>
        <span>دسته شغلی</span>
        <select value={jobFieldCode} onChange={(event) => setJobFieldCode(event.target.value)}>
          <option value="">همه دسته‌های شغلی</option>
          {categoryOptions.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>سطح تجربه</span>
        <select value={experienceLevel} onChange={(event) => setExperienceLevel(event.target.value)}>
          {experienceLevelOptions.map((option) => (
            <option key={option.value || "all-levels"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>زمان جلسه</span>
        <select value={duration} onChange={(event) => setDuration(event.target.value)}>
          {durationOptions.map((option) => (
            <option key={option.value || "all-durations"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>حداقل قیمت</span>
        <input min={0} type="number" value={minPriceToman} onChange={(event) => setMinPriceToman(event.target.value)} />
      </label>
      <label>
        <span>قیمت پیشنهادی</span>
        <input
          min={0}
          type="number"
          value={suggestedPriceToman}
          onChange={(event) => setSuggestedPriceToman(event.target.value)}
        />
      </label>
      <label>
        <span>حداکثر قیمت</span>
        <input min={0} type="number" value={maxPriceToman} onChange={(event) => setMaxPriceToman(event.target.value)} />
      </label>
      <label>
        <span>کمیسیون پلتفرم، basis point</span>
        <input min={0} max={10000} type="number" value={commissionRateBps} onChange={(event) => setCommissionRateBps(event.target.value)} />
      </label>
      <label>
        <span>شروع اثرگذاری</span>
        <input type="date" value={effectiveFrom} onChange={(event) => setEffectiveFrom(event.target.value)} />
      </label>
      <label>
        <span>پایان اثرگذاری</span>
        <input type="date" value={effectiveTo} onChange={(event) => setEffectiveTo(event.target.value)} />
      </label>
      <label className={styles.checkboxLabel}>
        <input type="checkbox" checked={allowFreeSession} onChange={(event) => setAllowFreeSession(event.target.checked)} />
        <span>جلسه کمک‌محور / رایگان مجاز است و کمیسیون آن صفر می‌ماند.</span>
      </label>
      <label>
        <span>یادداشت داخلی</span>
        <textarea maxLength={800} value={internalNote} onChange={(event) => setInternalNote(event.target.value)} />
      </label>
      {mode === "edit" ? (
        <label>
          <span>دلیل غیرفعال‌سازی</span>
          <textarea
            maxLength={500}
            value={deactivationReason}
            onChange={(event) => setDeactivationReason(event.target.value)}
            placeholder="برای غیرفعال‌سازی لازم است"
          />
        </label>
      ) : null}
      <div className={styles.actions}>
        <button className={styles.primaryButton} type="button" disabled={isSaving} onClick={() => void saveRule()}>
          {state === "saving" ? "در حال ثبت..." : titleText}
        </button>
        {mode === "edit" ? (
          <button
            className={styles.dangerButton}
            type="button"
            disabled={isSaving || !deactivationReason.trim()}
            onClick={() => void deactivateRule()}
          >
            {state === "deactivating" ? "در حال غیرفعال‌سازی..." : "غیرفعال‌سازی / آرشیو"}
          </button>
        ) : null}
      </div>
      {message ? (
        <p className={state === "error" ? styles.errorText : styles.successText} role="status">
          {message}
        </p>
      ) : (
        <p>کنش فقط پس از پاسخ موفق سرور ثبت می‌شود و هیچ سفارش یا پرداخت تاریخی تغییر نمی‌کند.</p>
      )}
    </div>
  );
}
