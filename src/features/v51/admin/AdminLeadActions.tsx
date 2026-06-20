"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { AdminLeadItem } from "./data";
import styles from "./AdminSurfaces.module.css";

type SubmissionState =
  | "idle"
  | "saving"
  | "assigning"
  | "noting"
  | "tagging"
  | "scheduling"
  | "completing"
  | "converting"
  | "losing"
  | "reopening"
  | "archiving"
  | "importing"
  | "success"
  | "error";

type AdminLeadActionsProps = Readonly<{
  mode: "create" | "detail";
  lead?: AdminLeadItem | null;
  viewerCanCreate: boolean;
  viewerCanMutate: boolean;
  viewerCanImport: boolean;
  viewerCanArchive: boolean;
  viewerId: string;
}>;

const leadTypeOptions = [
  { value: "REQUESTER_LEAD", label: "سرنخ درخواست‌کننده" },
  { value: "EXPERIENCE_CREATOR_LEAD", label: "سرنخ تجربه‌آفرین" },
  { value: "PARTNER_LEAD", label: "سرنخ شریک" },
  { value: "GENERAL_LEAD", label: "سرنخ عمومی" }
] as const;

const temperatureOptions = [
  { value: "COLD", label: "سرد" },
  { value: "WARM", label: "گرم" },
  { value: "HOT", label: "داغ" },
  { value: "QUALIFIED", label: "واجد شرایط" },
  { value: "CONVERTED", label: "تبدیل‌شده" },
  { value: "LOST", label: "از دست‌رفته" }
] as const;

const stageOptions = [
  { value: "NEW", label: "جدید" },
  { value: "CONTACTED", label: "تماس گرفته‌شده" },
  { value: "QUALIFIED", label: "واجد شرایط" },
  { value: "FOLLOW_UP", label: "پیگیری بعدی" },
  { value: "CONVERTED", label: "تبدیل‌شده" },
  { value: "LOST", label: "از دست‌رفته" }
] as const;

const sourceOptions = [
  { value: "ORGANIC", label: "ارگانیک" },
  { value: "REFERRAL", label: "معرفی" },
  { value: "LINKEDIN", label: "لینکدین" },
  { value: "TELEGRAM", label: "تلگرام" },
  { value: "INSTAGRAM", label: "اینستاگرام" },
  { value: "EVENT", label: "رویداد" },
  { value: "MANUAL_IMPORT", label: "ورود CSV" },
  { value: "ADMIN_CREATED", label: "ساخته‌شده توسط ادمین" },
  { value: "WAITLIST", label: "لیست انتظار" },
  { value: "INSIGHT_INTERACTION", label: "تعامل با بینش" },
  { value: "PROFILE_VIEW", label: "مشاهده پروفایل" },
  { value: "CHECKOUT_ABANDONED", label: "رهاسازی پرداخت" },
  { value: "CONVERSATION_REQUEST_STARTED", label: "شروع درخواست گفت‌وگو" },
  { value: "OTHER", label: "سایر" }
] as const;

const followUpChannelOptions = [
  { value: "PHONE", label: "تلفن" },
  { value: "WHATSAPP", label: "واتساپ" },
  { value: "TELEGRAM", label: "تلگرام" },
  { value: "EMAIL", label: "ایمیل" },
  { value: "LINKEDIN", label: "لینکدین" },
  { value: "IN_APP", label: "داخل محصول" },
  { value: "MANUAL", label: "دستی" }
] as const;

const followUpOutcomeOptions = [
  { value: "NO_RESPONSE", label: "بدون پاسخ" },
  { value: "INTERESTED", label: "علاقه‌مند" },
  { value: "NOT_NOW", label: "فعلاً نه" },
  { value: "ASKED_FOR_MORE_INFO", label: "درخواست اطلاعات بیشتر" },
  { value: "WANTS_SPECIFIC_EXPERIENCE", label: "نیاز به تجربه مشخص" },
  { value: "PRICE_CONCERN", label: "نگرانی قیمت" },
  { value: "NEEDS_TRUST", label: "نیاز به اعتماد بیشتر" },
  { value: "BAD_FIT", label: "نامتناسب" },
  { value: "CONVERTED", label: "تبدیل‌شده" },
  { value: "LOST", label: "از دست‌رفته" }
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

function displayValue(value: string | undefined, fallback = "") {
  return value && value !== "ثبت نشده" ? value : fallback;
}

export function AdminLeadActions({
  mode,
  lead,
  viewerCanCreate,
  viewerCanMutate,
  viewerCanImport,
  viewerCanArchive,
  viewerId
}: AdminLeadActionsProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [state, setState] = useState<SubmissionState>("idle");
  const [message, setMessage] = useState("");
  const [firstName, setFirstName] = useState(lead?.fullName.split(" ")[0] ?? "");
  const [lastName, setLastName] = useState(lead?.fullName.split(" ").slice(1).join(" ") ?? "");
  const [phone, setPhone] = useState(displayValue(lead?.phone));
  const [email, setEmail] = useState(displayValue(lead?.email));
  const [lastCompany, setLastCompany] = useState(displayValue(lead?.companySummary));
  const [jobTitle, setJobTitle] = useState(displayValue(lead?.jobTitle));
  const [jobCategory, setJobCategory] = useState(displayValue(lead?.jobCategory));
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  const [leadType, setLeadType] = useState(lead?.leadType ?? "GENERAL_LEAD");
  const [temperature, setTemperature] = useState(lead?.temperature ?? "WARM");
  const [stage, setStage] = useState(lead?.stage === "ARCHIVED" ? "FOLLOW_UP" : lead?.stage ?? "NEW");
  const [source, setSource] = useState(lead?.sourceCode ?? "ADMIN_CREATED");
  const [ownerAdminId, setOwnerAdminId] = useState(lead?.ownerAdminId ?? "");
  const [intentSummary, setIntentSummary] = useState(displayValue(lead?.intentSummary));
  const [blocker, setBlocker] = useState(displayValue(lead?.blocker));
  const [notes, setNotes] = useState(displayValue(lead?.notes));
  const [score, setScore] = useState(lead?.scoreValue === null || lead?.scoreValue === undefined ? "" : String(lead.scoreValue));
  const [tag, setTag] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [followUpChannel, setFollowUpChannel] = useState("MANUAL");
  const [followUpSummary, setFollowUpSummary] = useState("");
  const [followUpId, setFollowUpId] = useState(lead?.followUps.find((item) => !item.completedAt || item.completedAt === "ثبت نشده")?.id ?? "");
  const [followUpOutcome, setFollowUpOutcome] = useState("INTERESTED");
  const [lostReason, setLostReason] = useState("");
  const [reopenReason, setReopenReason] = useState("");
  const [archiveReason, setArchiveReason] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [dryRun, setDryRun] = useState(false);
  const isSaving = state !== "idle" && state !== "success" && state !== "error";
  const canCreate = mode === "create" && viewerCanCreate;
  const canEdit = mode === "detail" && Boolean(lead) && viewerCanMutate && lead?.actionsAvailable;

  function buildPayload() {
    return {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: optionalText(phone),
      email: optionalText(email),
      lastCompany: optionalText(lastCompany),
      jobTitle: optionalText(jobTitle),
      jobCategory: optionalText(jobCategory),
      yearsOfExperience: yearsOfExperience.trim() ? Number(yearsOfExperience) : null,
      leadType,
      temperature,
      stage,
      source,
      notes: optionalText(notes),
      ownerAdminId: optionalText(ownerAdminId) ?? (viewerCanArchive ? null : viewerId),
      intentSummary: optionalText(intentSummary),
      blocker: optionalText(blocker),
      score: score.trim() ? Number(score) : null
    };
  }

  async function saveLead() {
    if (isSaving || (!canCreate && !canEdit)) {
      return;
    }

    if (!firstName.trim() || !lastName.trim() || (!phone.trim() && !email.trim())) {
      setState("error");
      setMessage("نام، نام خانوادگی و دست‌کم یکی از تلفن یا ایمیل باید ثبت شود.");
      return;
    }

    setState("saving");
    setMessage("");

    try {
      const response = await fetch(mode === "create" ? "/api/admin/leads" : `/api/admin/leads/${encodeURIComponent(lead?.id ?? "")}`, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(buildPayload())
      });
      const bodyJson = (await parseAdminResponse(response, "کنش سرنخ ثبت نشد.")) as { data?: { id?: string }; id?: string };
      const createdId = bodyJson.data?.id ?? bodyJson.id;
      setState("success");
      setMessage(mode === "create" ? "سرنخ ثبت شد." : "سرنخ به‌روزرسانی شد.");

      if (mode === "create" && createdId) {
        router.push(`/admin/leads/${createdId}`);
      } else {
        router.refresh();
      }
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "کنش سرنخ ثبت نشد.");
    }
  }

  async function postLeadAction(action: string, payload: Record<string, unknown>, nextState: SubmissionState) {
    if (!lead || isSaving) {
      return;
    }

    setState(nextState);
    setMessage("");

    try {
      const response = await fetch(`/api/admin/leads/${encodeURIComponent(lead.id)}/${action}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      await parseAdminResponse(response, "کنش سرنخ ثبت نشد.");
      setState("success");
      setMessage("کنش سرنخ ثبت شد.");
      router.refresh();
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "کنش سرنخ ثبت نشد.");
    }
  }

  async function removeTag(tagId: string) {
    if (!lead || isSaving) {
      return;
    }

    setState("tagging");
    setMessage("");

    try {
      const response = await fetch(`/api/admin/leads/${encodeURIComponent(lead.id)}/tags/${encodeURIComponent(tagId)}`, {
        method: "DELETE"
      });
      await parseAdminResponse(response, "حذف برچسب ثبت نشد.");
      setState("success");
      setMessage("برچسب حذف شد.");
      router.refresh();
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "حذف برچسب ثبت نشد.");
    }
  }

  async function importCsv() {
    const file = fileInputRef.current?.files?.[0];

    if (!file || isSaving || !viewerCanImport) {
      return;
    }

    setState("importing");
    setMessage("");

    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("dryRun", dryRun ? "true" : "false");
      const response = await fetch("/api/admin/leads/import", {
        method: "POST",
        body: formData
      });
      const bodyJson = (await parseAdminResponse(response, "ورود CSV ثبت نشد.")) as {
        data?: { imported?: number; skippedDuplicates?: number; invalidRows?: number };
      };
      setState("success");
      setMessage(
        `نتیجه CSV: ثبت ${bodyJson.data?.imported ?? 0}، تکراری ${bodyJson.data?.skippedDuplicates ?? 0}، نامعتبر ${bodyJson.data?.invalidRows ?? 0}.`
      );
      router.refresh();
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "ورود CSV ثبت نشد.");
    }
  }

  function downloadTemplate() {
    window.location.assign("/api/admin/leads/import/template");
  }

  if (mode === "create" && !viewerCanCreate) {
    return (
      <div className={styles.reviewBox}>
        <p>در حال حاضر امکان ثبت سرنخ از این مسیر فعال نیست.</p>
      </div>
    );
  }

  if (mode === "detail" && (!lead || !viewerCanMutate || !lead.actionsAvailable)) {
    return (
      <div className={styles.reviewBox}>
        <p>این سرنخ فقط برای مشاهده در دسترس است.</p>
      </div>
    );
  }

  return (
    <div className={styles.reviewBox}>
      <label>
        <span>نام</span>
        <input maxLength={80} value={firstName} onChange={(event) => setFirstName(event.target.value)} />
      </label>
      <label>
        <span>نام خانوادگی</span>
        <input maxLength={80} value={lastName} onChange={(event) => setLastName(event.target.value)} />
      </label>
      <label>
        <span>تلفن</span>
        <input dir="ltr" maxLength={40} value={phone} onChange={(event) => setPhone(event.target.value)} />
      </label>
      <label>
        <span>ایمیل</span>
        <input dir="ltr" maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} />
      </label>
      <label>
        <span>آخرین شرکت</span>
        <input maxLength={160} value={lastCompany} onChange={(event) => setLastCompany(event.target.value)} />
      </label>
      <label>
        <span>عنوان شغلی</span>
        <input maxLength={160} value={jobTitle} onChange={(event) => setJobTitle(event.target.value)} />
      </label>
      <label>
        <span>دسته شغلی</span>
        <input maxLength={160} value={jobCategory} onChange={(event) => setJobCategory(event.target.value)} />
      </label>
      <label>
        <span>سال تجربه</span>
        <input dir="ltr" inputMode="numeric" value={yearsOfExperience} onChange={(event) => setYearsOfExperience(event.target.value)} />
      </label>
      <label>
        <span>نوع سرنخ</span>
        <select value={leadType} onChange={(event) => setLeadType(event.target.value)}>
          {leadTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>دما</span>
        <select value={temperature} onChange={(event) => setTemperature(event.target.value)}>
          {temperatureOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>وضعیت</span>
        <select value={stage} onChange={(event) => setStage(event.target.value)}>
          {stageOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
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
      {viewerCanArchive ? (
        <label>
          <span>شناسه مسئول</span>
          <input dir="ltr" maxLength={160} value={ownerAdminId} onChange={(event) => setOwnerAdminId(event.target.value)} />
        </label>
      ) : null}
      <label>
        <span>خلاصه نیت</span>
        <textarea maxLength={1000} value={intentSummary} onChange={(event) => setIntentSummary(event.target.value)} />
      </label>
      <label>
        <span>مانع اصلی</span>
        <textarea maxLength={800} value={blocker} onChange={(event) => setBlocker(event.target.value)} />
      </label>
      <label>
        <span>یادداشت پایه</span>
        <textarea maxLength={2000} value={notes} onChange={(event) => setNotes(event.target.value)} />
      </label>
      <label>
        <span>امتیاز</span>
        <input dir="ltr" inputMode="numeric" value={score} onChange={(event) => setScore(event.target.value)} />
      </label>
      <div className={styles.actions}>
        <button className={styles.primaryButton} type="button" disabled={isSaving} onClick={() => void saveLead()}>
          {state === "saving" ? "در حال ثبت..." : mode === "create" ? "ثبت سرنخ" : "ویرایش سرنخ"}
        </button>
        {mode === "detail" && lead ? (
          <button
            className={styles.secondaryButton}
            type="button"
            disabled={isSaving}
            onClick={() => void postLeadAction("assign", { ownerAdminId: viewerCanArchive ? optionalText(ownerAdminId) : viewerId }, "assigning")}
          >
            {state === "assigning" ? "در حال تخصیص..." : viewerCanArchive ? "ثبت مسئول" : "تخصیص به من"}
          </button>
        ) : null}
      </div>
      {mode === "detail" && lead ? (
        <>
          <label>
            <span>برچسب</span>
            <input maxLength={60} value={tag} onChange={(event) => setTag(event.target.value)} />
          </label>
          <button
            className={styles.secondaryButton}
            type="button"
            disabled={isSaving || !tag.trim()}
            onClick={() => void postLeadAction("tags", { tag: tag.trim() }, "tagging")}
          >
            افزودن برچسب
          </button>
          {lead.tags.length ? (
            <div className={styles.filters}>
              {lead.tags.map((item) => (
                <button className={styles.filterLink} key={item.id} type="button" disabled={isSaving} onClick={() => void removeTag(item.tagId)}>
                  حذف {item.name}
                </button>
              ))}
            </div>
          ) : null}
          <label>
            <span>یادداشت داخلی</span>
            <textarea maxLength={2000} value={noteBody} onChange={(event) => setNoteBody(event.target.value)} />
          </label>
          <button
            className={styles.secondaryButton}
            type="button"
            disabled={isSaving || !noteBody.trim()}
            onClick={() => void postLeadAction("notes", { body: noteBody.trim(), noteType: "INTERNAL" }, "noting")}
          >
            افزودن یادداشت
          </button>
          <label>
            <span>کانال پیگیری</span>
            <select value={followUpChannel} onChange={(event) => setFollowUpChannel(event.target.value)}>
              {followUpChannelOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>زمان پیگیری بعدی</span>
            <input dir="ltr" type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} />
          </label>
          <label>
            <span>خلاصه پیگیری</span>
            <textarea maxLength={800} value={followUpSummary} onChange={(event) => setFollowUpSummary(event.target.value)} />
          </label>
          <button
            className={styles.secondaryButton}
            type="button"
            disabled={isSaving || !scheduledAt}
            onClick={() =>
              void postLeadAction(
                "follow-ups",
                {
                  channel: followUpChannel,
                  scheduledAt,
                  summary: optionalText(followUpSummary)
                },
                "scheduling"
              )
            }
          >
            زمان‌بندی پیگیری
          </button>
          {lead.followUps.length ? (
            <>
              <label>
                <span>شناسه پیگیری برای تکمیل</span>
                <select value={followUpId} onChange={(event) => setFollowUpId(event.target.value)}>
                  {lead.followUps.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.channelLabel} · {item.scheduledAt}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>نتیجه پیگیری</span>
                <select value={followUpOutcome} onChange={(event) => setFollowUpOutcome(event.target.value)}>
                  {followUpOutcomeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <button
                className={styles.secondaryButton}
                type="button"
                disabled={isSaving || !followUpId}
                onClick={() =>
                  void postLeadAction(
                    `follow-ups/${encodeURIComponent(followUpId)}/complete`,
                    {
                      outcome: followUpOutcome,
                      summary: optionalText(followUpSummary)
                    },
                    "completing"
                  )
                }
              >
                ثبت نتیجه پیگیری
              </button>
            </>
          ) : null}
          {viewerCanArchive ? (
            <>
              <label>
                <span>دلیل از دست رفتن</span>
                <textarea maxLength={500} value={lostReason} onChange={(event) => setLostReason(event.target.value)} />
              </label>
              <label>
                <span>دلیل بازگشایی</span>
                <textarea maxLength={500} value={reopenReason} onChange={(event) => setReopenReason(event.target.value)} />
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
                  disabled={isSaving}
                  onClick={() => void postLeadAction("convert", { internalNote: optionalText(internalNote) }, "converting")}
                >
                  تبدیل سرنخ
                </button>
                <button
                  className={styles.secondaryButton}
                  type="button"
                  disabled={isSaving || !lostReason.trim()}
                  onClick={() => void postLeadAction("lost", { lostReason: lostReason.trim(), internalNote: optionalText(internalNote) }, "losing")}
                >
                  ثبت از دست‌رفته
                </button>
                <button
                  className={styles.secondaryButton}
                  type="button"
                  disabled={isSaving || !reopenReason.trim()}
                  onClick={() => void postLeadAction("reopen", { reason: reopenReason.trim(), internalNote: optionalText(internalNote) }, "reopening")}
                >
                  بازگشایی
                </button>
                <button
                  className={styles.dangerButton}
                  type="button"
                  disabled={isSaving || !archiveReason.trim()}
                  onClick={() => void postLeadAction("archive", { reason: archiveReason.trim(), internalNote: optionalText(internalNote) }, "archiving")}
                >
                  آرشیو سرنخ
                </button>
              </div>
            </>
          ) : null}
        </>
      ) : null}
      {mode === "create" && viewerCanImport ? (
        <section className={styles.emptyState}>
          <strong>ورود CSV سرنخ</strong>
          <p>فایل CSV ذخیره نمی‌شود؛ فقط ردیف‌های معتبر Lead ساخته می‌شوند و یک رویداد ممیزی فشرده ثبت می‌شود.</p>
          <button className={styles.secondaryButton} type="button" onClick={downloadTemplate}>
            دریافت قالب CSV
          </button>
          <label>
            <span>فایل CSV</span>
            <input ref={fileInputRef} accept=".csv,text/csv" type="file" />
          </label>
          <label>
            <span>Dry run</span>
            <input checked={dryRun} type="checkbox" onChange={(event) => setDryRun(event.target.checked)} />
          </label>
          <button className={styles.secondaryButton} type="button" disabled={isSaving} onClick={() => void importCsv()}>
            {state === "importing" ? "در حال بررسی..." : "ورود CSV"}
          </button>
        </section>
      ) : null}
      {message ? (
        <p className={state === "error" ? styles.errorText : styles.successText} role="status">
          {message}
        </p>
      ) : (
        <p>این مسیر فقط ردیف‌های Lead، برچسب، یادداشت، پیگیری و ممیزی را تغییر می‌دهد و پرداخت، کیف پول، گفت‌وگو، لغو یا پشتیبانی را تغییر نمی‌دهد.</p>
      )}
    </div>
  );
}
