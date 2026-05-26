"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { UseravaaIcon } from "@/components/ui/UseravaaIcon";
import { V51Button } from "@/features/v51/components/V51Button";
import type { ExperienceTimelineItem } from "@/features/v51/data/experience-timeline";
import { insightAudienceOptions, type InsightAudienceIntent } from "@/features/v51/data/experience-questions";
import {
  builderLanguages,
  getPricingCap,
  initialBuilderDraft,
  orgLevels,
  pricingCapText,
  profileBuilderDraftStorageKey,
  profileDraftIsValid,
  setFreeHelp,
  submitProfileForReview,
  toggleSelection,
  updateDraftOrgLevel,
  validateAvatarCandidate,
  validateProfileDraft,
  type OrgLevel,
  type ProfileBuilderDraft,
  type ProfileValidationErrors
} from "@/features/v51/data/my-profile";
import { ExperienceTimelineEditor } from "../components/ExperienceTimelineEditor";
import { JobFieldSelect } from "../components/JobFieldSelect";
import { BuildProfilePreview, ProfileAvatar, SummaryCounter } from "../components/ProfilePreviewCard";
import styles from "../components/MyProfile.module.css";

type ProfileBuilderPageProps = {
  initialDraft?: ProfileBuilderDraft;
};

export function ProfileBuilderPage({ initialDraft = initialBuilderDraft }: ProfileBuilderPageProps) {
  const [draft, setDraft] = useState(initialDraft);
  const [draftStorageReady, setDraftStorageReady] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [touched, setTouched] = useState<Partial<Record<keyof ProfileValidationErrors, true>>>({});
  const [showErrors, setShowErrors] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [previousPaidPrices, setPreviousPaidPrices] = useState({
    price30: initialDraft.price30,
    price60: initialDraft.price60
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const errors = useMemo(() => validateProfileDraft(draft), [draft]);
  const isValid = profileDraftIsValid(draft);
  const statusLabel = submitted ? "در انتظار بررسی" : draftSaved ? "پیش‌نویس ذخیره‌شده" : "پیش‌نویس";
  const currentTimelineItem = draft.timeline.find((item) => item.isCurrent) ?? null;
  const currentJobTitle = currentTimelineItem?.jobTitle ?? draft.role;

  useEffect(() => {
    let storedDraft: ProfileBuilderDraft | null = null;

    try {
      const storedDraftValue = window.localStorage.getItem(profileBuilderDraftStorageKey);

      if (storedDraftValue) {
        storedDraft = JSON.parse(storedDraftValue) as ProfileBuilderDraft;
      }
    } catch {
      window.localStorage.removeItem(profileBuilderDraftStorageKey);
    }

    window.queueMicrotask(() => {
      if (storedDraft) {
        setDraft({ ...initialBuilderDraft, ...storedDraft, audienceIntents: storedDraft.audienceIntents ?? initialBuilderDraft.audienceIntents });
      }
      setDraftStorageReady(true);
    });
  }, []);

  useEffect(() => {
    if (!draftStorageReady) {
      return;
    }

    window.localStorage.setItem(profileBuilderDraftStorageKey, JSON.stringify(draft));
  }, [draft, draftStorageReady]);

  const markTouched = (...keys: Array<keyof ProfileValidationErrors>) => {
    setTouched((current) => {
      const next = { ...current };
      keys.forEach((key) => {
        next[key] = true;
      });
      return next;
    });
  };

  const updateDraft = (patch: Partial<ProfileBuilderDraft>, touchedKey?: keyof ProfileValidationErrors) => {
    setDraft((current) => ({ ...current, ...patch }));
    if (touchedKey) {
      markTouched(touchedKey);
    }
    setDraftSaved(false);
    setSubmitted(false);
  };

  const toggleLanguage = (language: string) => {
    setDraft((current) => ({
      ...current,
      languages: toggleSelection(current.languages, language)
    }));
    markTouched("languages");
    setDraftSaved(false);
    setSubmitted(false);
  };

  const toggleAudienceIntent = (intent: InsightAudienceIntent) => {
    setDraft((current) => ({
      ...current,
      audienceIntents: toggleSelection(current.audienceIntents ?? [], intent)
    }));
    markTouched("audienceIntents");
    setDraftSaved(false);
    setSubmitted(false);
  };

  const handleAvatarUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setAvatarError("");

    if (!file) {
      return;
    }

    const error = validateAvatarCandidate(file);
    if (error) {
      setAvatarError(error);
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      updateDraft({ avatarUrl: String(reader.result ?? "") });
    };
    reader.readAsDataURL(file);
  };

  const removeAvatar = () => {
    updateDraft({ avatarUrl: "" });
    setAvatarError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleOrgLevelChange = (orgLevel: OrgLevel) => {
    setDraft((current) => updateDraftOrgLevel(current, orgLevel));
    markTouched("price30", "price60");
    setDraftSaved(false);
    setSubmitted(false);
  };

  const updateTimeline = (timeline: ExperienceTimelineItem[]) => {
    const nextCurrent = timeline.find((item) => item.isCurrent);
    updateDraft({ timeline, role: nextCurrent?.jobTitle ?? draft.role, orgLevel: nextCurrent?.orgLevel ?? draft.orgLevel, categories: nextCurrent?.jobField ? [nextCurrent.jobField] : draft.categories }, "timeline");
  };

  const updatePrimaryJobTitle = (jobTitle: string) => {
    const timeline = draft.timeline.map((item) => (item.isCurrent ? { ...item, jobTitle } : item));
    updateDraft({ role: jobTitle, timeline }, "role");
    markTouched("timeline");
  };

  const handleFreeHelp = (enabled: boolean) => {
    if (enabled) {
      setPreviousPaidPrices({ price30: draft.price30, price60: draft.price60 });
      setDraft((current) => setFreeHelp(current, true));
    } else {
      setDraft((current) => setFreeHelp(current, false, previousPaidPrices));
    }

    markTouched("price30", "price60");
    setDraftSaved(false);
    setSubmitted(false);
  };

  const saveDraft = () => {
    setDraftSaved(true);
    setSubmitted(false);
  };

  const openPreview = () => {
    setPreviewOpen(true);
  };

  const submitForReview = () => {
    setShowErrors(true);
    const result = submitProfileForReview(draft);

    if (result.status !== "pending_review") {
      return;
    }

    setSubmitted(true);

    if (typeof window !== "undefined") {
      window.setTimeout(() => window.location.assign("/profile?state=pending_review"), 350);
    }
  };

  const cap = getPricingCap(draft.orgLevel);
  const capText = pricingCapText(draft.orgLevel);
  const [capTitle, ...capBody] = capText.split(":");

  return (
    <div className={styles.buildShell}>
      <section className={styles.buildHead}>
        <div>
          <h1>ساخت پروفایل تجربه</h1>
          <p className={styles.lead}>اطلاعاتی که اینجا ثبت می‌کنی، بعد از تأیید در پروفایل تجربه‌ات نمایش داده می‌شود.</p>
        </div>
        <div className={styles.buildStatus}>{statusLabel}</div>
      </section>

      <div className={styles.buildLayout}>
        <div className={styles.buildMain}>
          <section className={styles.buildCard}>
            <div className={styles.cardHead}>
              <h2>اطلاعات اصلی</h2>
              <p>عکس، نام و نقش حرفه‌ای تو.</p>
            </div>

            <div className={styles.profileRow}>
              <div className={styles.avatarZone}>
                <ProfileAvatar label="تصویر پروفایل" initials={draft.displayName.trim()[0] || "ع"} avatarUrl={draft.avatarUrl} size="builder" />
                <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={handleAvatarUpload} />
                <div className={styles.avatarActions}>
                  <V51Button type="button" onClick={() => fileInputRef.current?.click()}>
                    <UseravaaIcon name="imageUpload" size={16} />
                    آپلود عکس
                  </V51Button>
                  <V51Button type="button" onClick={removeAvatar}>
                    <UseravaaIcon name="delete" size={16} />
                    حذف
                  </V51Button>
                </div>
                <div className={styles.error}>{avatarError}</div>
                <small>PNG، JPG یا WebP تا ۲ مگابایت.</small>
              </div>

              <div className={styles.formGrid}>
                <Field label="نام نمایشی" error={errorText(errors, "displayName", showErrors || Boolean(touched.displayName))}>
                  <input value={draft.displayName} onChange={(event) => updateDraft({ displayName: event.target.value }, "displayName")} />
                </Field>
                <Field label="عنوان شغلی" error={errorText(errors, "role", showErrors || Boolean(touched.role))}>
                  <input value={currentJobTitle} placeholder="مثلاً مدیر محصول" onChange={(event) => updatePrimaryJobTitle(event.target.value)} />
                </Field>
                <Field label="رده سازمانی">
                  <span className={styles.selectWrap}>
                    <select value={draft.orgLevel} onChange={(event) => handleOrgLevelChange(event.target.value as OrgLevel)}>
                      {orgLevels.map((level) => (
                        <option key={level}>{level}</option>
                      ))}
                    </select>
                    <span className={styles.selectCaret} aria-hidden="true">
                      <UseravaaIcon name="dropdown" size={16} />
                    </span>
                  </span>
                </Field>
                <Field label="سال سابقه کار" error={errorText(errors, "years", showErrors || Boolean(touched.years))}>
                  <input
                    type="number"
                    min={0}
                    max={40}
                    value={draft.years}
                    onChange={(event) => updateDraft({ years: Number(event.target.value) }, "years")}
                  />
                </Field>
              </div>
            </div>
          </section>

          <section className={styles.buildCard}>
            <div className={styles.cardHead}>
              <h2>حوزه شغلی و زبان‌ها</h2>
              <p>برای اینکه پروفایل تجربه‌ات در جستجو و پرسش‌ها درست پیدا شود.</p>
            </div>

            <Field label="حوزه شغلی" full error={errorText(errors, "categories", showErrors || Boolean(touched.categories))}>
              <JobFieldSelect
                value={draft.categories[0] ?? initialBuilderDraft.categories[0]}
                onChange={(jobField) => updateDraft({ categories: [jobField], timeline: draft.timeline.map((item) => (item.isCurrent ? { ...item, jobField } : item)) }, "categories")}
              />
            </Field>

            <Field label="زبان جلسه" full error={errorText(errors, "languages", showErrors || Boolean(touched.languages))}>
              <div className={styles.chipset}>
                {builderLanguages.map((language) => (
                  <button
                    key={language}
                    type="button"
                    className={`${styles.chip} ${draft.languages.includes(language) ? styles.chipSelected : ""}`}
                    aria-pressed={draft.languages.includes(language)}
                    onClick={() => toggleLanguage(language)}
                  >
                    {language}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="تجربه شما بیشتر به درد چه کسانی می‌خورد؟" full error={errorText(errors, "audienceIntents", showErrors || Boolean(touched.audienceIntents))}>
              <p className={styles.fieldHelp}>این انتخاب کمک می‌کند پروفایل شما به آدم‌های مناسب‌تری پیشنهاد شود.</p>
              <div className={styles.profileAudienceOptions}>
                {insightAudienceOptions.map((option) => (
                  <label className={`${styles.profileAudienceCard} ${(draft.audienceIntents ?? []).includes(option.id) ? styles.profileAudienceCardSelected : ""}`} key={option.id}>
                    <input
                      type="checkbox"
                      value={option.id}
                      checked={(draft.audienceIntents ?? []).includes(option.id)}
                      onChange={() => toggleAudienceIntent(option.id)}
                    />
                    <span>
                      <b>{option.title}</b>
                      <small>{option.description}</small>
                    </span>
                  </label>
                ))}
              </div>
            </Field>
          </section>

          <section className={styles.buildCard}>
            <div className={styles.cardHead}>
              <h2>سوابق تجربه</h2>
              <p>برای اینکه پروفایل تجربه‌تان دقیق‌تر و پرسش‌های هفتگی مرتبط‌تر باشند، سوابق کاری حداقل پنج سال گذشته را وارد کنید.</p>
            </div>
            <ExperienceTimelineEditor items={draft.timeline} claimedYears={draft.years} showErrors={showErrors || Boolean(touched.timeline)} onChange={updateTimeline} />
            {errorText(errors, "timeline", showErrors || Boolean(touched.timeline)) ? (
              <div className={styles.fieldError}>{errorText(errors, "timeline", showErrors || Boolean(touched.timeline))}</div>
            ) : null}
          </section>

          <section className={styles.buildCard}>
            <div className={styles.cardHead}>
              <h2>معرفی حرفه‌ای</h2>
              <p>کوتاه، مشخص و بدون تبلیغ اضافه.</p>
            </div>
            <Field label="معرفی کوتاه" full>
              <textarea maxLength={220} value={draft.summary} onChange={(event) => updateDraft({ summary: event.target.value }, "summary")} />
              <div className={styles.rowHelp}>
                <SummaryCounter summary={draft.summary} />
                <span className={styles.fieldError}>{errorText(errors, "summary", showErrors || Boolean(touched.summary))}</span>
              </div>
            </Field>
          </section>

          <section className={styles.buildCard}>
            <div className={styles.cardHead}>
              <h2>قیمت جلسه</h2>
              <p>با انتخاب رده سازمانی، قیمت پیش‌فرض پر می‌شود؛ اما می‌توانی ویرایش کنی.</p>
            </div>

            <div className={styles.formGrid}>
              <Field label="۳۰ دقیقه، تومان" error={errorText(errors, "price30", showErrors || Boolean(touched.price30))}>
                <input
                  type="number"
                  min={0}
                  max={cap[30]}
                  step={50000}
                  value={draft.price30}
                  disabled={draft.freeHelp}
                  onChange={(event) => updateDraft({ price30: Number(event.target.value) }, "price30")}
                />
              </Field>
              <Field label="۱ ساعت، تومان" error={errorText(errors, "price60", showErrors || Boolean(touched.price60))}>
                <input
                  type="number"
                  min={0}
                  max={cap[60]}
                  step={50000}
                  value={draft.price60}
                  disabled={draft.freeHelp}
                  onChange={(event) => updateDraft({ price60: Number(event.target.value) }, "price60")}
                />
              </Field>
            </div>

            <label className={styles.freeToggle}>
              <input type="checkbox" checked={draft.freeHelp} onChange={(event) => handleFreeHelp(event.target.checked)} />
              <span>
                <b>کمک رایگان</b>
                <small>اگر فعال شود، جلسه بدون دریافت هزینه ارائه می‌شود.</small>
              </span>
            </label>

            <div className={styles.priceCap}>
              <b>{capTitle}</b>:{capBody.join(":")}
            </div>

            <div className={styles.buildActions}>
              <V51Button type="button" onClick={saveDraft}>
                ذخیره پیش‌نویس
              </V51Button>
              <V51Button type="button" onClick={openPreview}>
                پیش‌نمایش
              </V51Button>
              <V51Button type="button" tone="primary" disabled={!isValid || submitted} onClick={submitForReview}>
                ارسال برای بررسی
              </V51Button>
            </div>
            {draftSaved ? <p className={styles.successBox}>پیش‌نویس ذخیره شد.</p> : null}
            {submitted ? <p className={styles.successBox}>پروفایل تجربه برای بررسی ارسال شد.</p> : null}
          </section>
        </div>

        <aside>
          <div className={`${styles.buildCard} ${styles.sticky}`}>
            <div className={styles.cardHead}>
              <h2>پیش‌نمایش پروفایل</h2>
              <p>همین اطلاعات بعد از تأیید در پروفایل تجربه‌ات استفاده می‌شود.</p>
            </div>
            <BuildProfilePreview draft={draft} />
            <div className={styles.reviewStates}>
              <div>
                <b>پیش‌نویس</b>
                <span>اطلاعات را کامل کن.</span>
              </div>
              <div>
                <b>در انتظار بررسی</b>
                <span>بعد از ارسال فعال می‌شود.</span>
              </div>
              <div>
                <b>نیازمند اصلاح</b>
                <span>اگر موردی نیاز به تغییر داشته باشد.</span>
              </div>
              <div>
                <b>فعال</b>
                <span>بعد از تأیید در کشف تجربه‌ها نمایش داده می‌شود.</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {previewOpen ? (
        <div className={styles.modal} role="dialog" aria-modal="true">
          <div className={styles.modalCard}>
            <div className={styles.modalHead}>
              <h2>پیش‌نمایش پروفایل تجربه</h2>
              <button type="button" className={styles.modalClose} aria-label="بستن" onClick={() => setPreviewOpen(false)}>
                <UseravaaIcon name="close" size={18} />
              </button>
            </div>
            <BuildProfilePreview draft={draft} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Field({
  label,
  children,
  error,
  full
}: {
  label: string;
  children: ReactNode;
  error?: string;
  full?: boolean;
}) {
  return (
    <div className={`${styles.field} ${full ? styles.fieldFull : ""}`}>
      <label>{label}</label>
      {children}
      {error ? <div className={styles.fieldError}>{error}</div> : null}
    </div>
  );
}

function errorText(errors: ProfileValidationErrors, key: keyof ProfileValidationErrors, showErrors: boolean) {
  return showErrors ? errors[key] : "";
}
