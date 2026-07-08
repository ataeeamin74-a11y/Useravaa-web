"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CAREER_LEAD_CAPTURE_EVENT,
  CAREER_STAGE_OPTIONS,
  validateCareerLeadFormInput,
  rememberCareerLeadCaptureDismissal,
  rememberCareerLeadCaptureSubmission,
  shouldShowCareerLeadCapture,
  type CareerLeadCaptureRequest,
  type CareerLeadStorage,
  type CareerStage
} from "./career-lead-capture";
import {
  parseSavedCareerComparisons,
  SAVED_COMPARISONS_STORAGE_KEY
} from "./career-saved-comparisons";
import {
  parseSavedCareerPathIds,
  SAVED_PATHS_STORAGE_KEY
} from "./career-saved-paths";
import { SoftCloseIcon } from "./CareerSoftIcons";
import styles from "./CareerLeadCaptureSheet.module.css";

const OPEN_DELAY_MS = 450;

function getSafeStorage(): CareerLeadStorage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

function getStoredLeadContext(storage?: CareerLeadStorage) {
  try {
    return {
      savedPathIds: [...parseSavedCareerPathIds(storage?.getItem(SAVED_PATHS_STORAGE_KEY) ?? "[]")],
      savedComparisons: parseSavedCareerComparisons(
        storage?.getItem(SAVED_COMPARISONS_STORAGE_KEY) ?? "[]"
      )
    };
  } catch {
    return { savedPathIds: [], savedComparisons: [] };
  }
}

type CareerLeadCaptureFormProps = Readonly<{
  fullName: string;
  phoneNumber: string;
  stage: CareerStage | "";
  uncertainty: string;
  companyWebsite: string;
  fullNameError: string;
  phoneError: string;
  formError: string;
  isSubmitting: boolean;
  onFullNameChange: (value: string) => void;
  onPhoneNumberChange: (value: string) => void;
  onStageChange: (value: CareerStage | "") => void;
  onUncertaintyChange: (value: string) => void;
  onCompanyWebsiteChange: (value: string) => void;
  onSubmit: () => void;
  onDismiss: () => void;
}>;

export function CareerLeadCaptureForm({
  fullName,
  phoneNumber,
  stage,
  uncertainty,
  companyWebsite,
  fullNameError,
  phoneError,
  formError,
  isSubmitting,
  onFullNameChange,
  onPhoneNumberChange,
  onStageChange,
  onUncertaintyChange,
  onCompanyWebsiteChange,
  onSubmit,
  onDismiss
}: CareerLeadCaptureFormProps) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className={styles.fieldGroup}>
        <label htmlFor="career-lead-full-name">نام و نام خانوادگی</label>
        <input
          id="career-lead-full-name"
          name="fullName"
          type="text"
          autoComplete="name"
          maxLength={120}
          value={fullName}
          placeholder="مثلاً علی رضایی"
          aria-invalid={Boolean(fullNameError)}
          aria-describedby={fullNameError ? "career-lead-full-name-error" : undefined}
          onChange={(event) => onFullNameChange(event.target.value)}
          required
        />
        <p className={styles.fieldError} id="career-lead-full-name-error" role="alert" aria-live="polite">
          {fullNameError}
        </p>
      </div>

      <div className={styles.fieldGroup}>
        <label htmlFor="career-lead-phone">شماره موبایل</label>
        <div className={styles.phoneInputRow} dir="ltr">
          <span className={styles.phonePrefix} aria-hidden="true">+98</span>
          <input
            id="career-lead-phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            maxLength={20}
            value={phoneNumber}
            placeholder="شماره موبایل"
            aria-invalid={Boolean(phoneError)}
            aria-describedby={phoneError ? "career-lead-phone-error" : undefined}
            onChange={(event) => onPhoneNumberChange(event.target.value)}
            required
          />
        </div>
        <p className={styles.fieldError} id="career-lead-phone-error" role="alert" aria-live="polite">
          {phoneError}
        </p>
      </div>

      <div className={styles.fieldGroup}>
        <label htmlFor="career-lead-stage">الان بیشتر به کدام مرحله نزدیک‌تری؟</label>
        <select
          id="career-lead-stage"
          name="stage"
          value={stage}
          onChange={(event) => onStageChange(event.target.value as CareerStage | "")}
        >
          <option value="">انتخاب کن</option>
          {CAREER_STAGE_OPTIONS.map((option) => <option value={option} key={option}>{option}</option>)}
        </select>
      </div>

      <div className={styles.fieldGroup}>
        <label htmlFor="career-lead-uncertainty">بزرگ‌ترین ابهامت چیست؟</label>
        <textarea
          id="career-lead-uncertainty"
          name="uncertainty"
          maxLength={1000}
          rows={3}
          value={uncertainty}
          placeholder="مثلاً نمی‌دانم این مسیر شغلی با من تناسب دارد یا نه"
          onChange={(event) => onUncertaintyChange(event.target.value)}
        />
      </div>

      <div className={styles.honeypot} aria-hidden="true">
        <label htmlFor="career-lead-company">Company website</label>
        <input
          id="career-lead-company"
          name="companyWebsite"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={companyWebsite}
          onChange={(event) => onCompanyWebsiteChange(event.target.value)}
        />
      </div>

      <p className={styles.errorMessage} id="career-lead-error" role="alert" aria-live="polite">
        {formError}
      </p>

      <div className={styles.actions}>
        <button className={styles.primaryButton} type="submit" disabled={isSubmitting}>
          {isSubmitting ? "در حال ذخیره..." : "ذخیره و ادامه بررسی"}
        </button>
        <button className={styles.laterButton} type="button" onClick={onDismiss}>
          فعلاً نه
        </button>
      </div>
    </form>
  );
}

export function CareerLeadCaptureSheet() {
  const [request, setRequest] = useState<CareerLeadCaptureRequest>();
  const [isOpen, setIsOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [stage, setStage] = useState<CareerStage | "">("");
  const [uncertainty, setUncertainty] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [fullNameError, setFullNameError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const openTimerRef = useRef<number | undefined>(undefined);
  const iosObserverRef = useRef<MutationObserver | undefined>(undefined);

  const close = useCallback(() => {
    setIsOpen(false);
    setRequest(undefined);
    setFullName("");
    setPhoneNumber("");
    setStage("");
    setUncertainty("");
    setCompanyWebsite("");
    setFullNameError("");
    setPhoneError("");
    setFormError("");
    setIsSubmitting(false);
    setSubmitted(false);
  }, []);

  const dismiss = useCallback(() => {
    rememberCareerLeadCaptureDismissal(getSafeStorage());
    close();
  }, [close]);

  useEffect(() => {
    function openWhenAvailable(detail: CareerLeadCaptureRequest) {
      if (!shouldShowCareerLeadCapture(getSafeStorage())) return;

      const attemptOpen = () => {
        if (document.querySelector("[data-ios-install-guide-dialog]")) {
          iosObserverRef.current?.disconnect();
          iosObserverRef.current = new MutationObserver(() => {
            if (!document.querySelector("[data-ios-install-guide-dialog]")) {
              iosObserverRef.current?.disconnect();
              openWhenAvailable(detail);
            }
          });
          iosObserverRef.current.observe(document.body, { childList: true, subtree: true });
          return;
        }

        setRequest(detail);
        setIsOpen(true);
      };

      if (openTimerRef.current !== undefined) window.clearTimeout(openTimerRef.current);
      openTimerRef.current = window.setTimeout(attemptOpen, OPEN_DELAY_MS);
    }

    function handleLeadRequest(event: Event) {
      const detail = (event as CustomEvent<CareerLeadCaptureRequest>).detail;
      if (detail?.source) openWhenAvailable(detail);
    }

    window.addEventListener(CAREER_LEAD_CAPTURE_EVENT, handleLeadRequest);
    return () => {
      window.removeEventListener(CAREER_LEAD_CAPTURE_EVENT, handleLeadRequest);
      if (openTimerRef.current !== undefined) window.clearTimeout(openTimerRef.current);
      iosObserverRef.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    const focusFrame = window.requestAnimationFrame(() => closeButtonRef.current?.focus());
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        dismiss();
        return;
      }
      if (event.key !== "Tab") return;

      const dialog = document.querySelector<HTMLElement>("[data-career-lead-capture-dialog]");
      const controls = dialog?.querySelectorAll<HTMLElement>(
        "button:not([disabled]), input:not([disabled]):not([tabindex='-1']), select:not([disabled]), textarea:not([disabled])"
      );
      if (!controls?.length) return;

      const firstControl = controls[0];
      const lastControl = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === firstControl) {
        event.preventDefault();
        lastControl.focus();
      } else if (!event.shiftKey && document.activeElement === lastControl) {
        event.preventDefault();
        firstControl.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocusRef.current?.focus();
    };
  }, [dismiss, isOpen]);

  async function submitLead() {
    if (!request || isSubmitting) return;
    const validation = validateCareerLeadFormInput(fullName, phoneNumber);
    if (!validation.ok) {
      setFullNameError(validation.fullNameError ?? "");
      setPhoneError(validation.phoneError ?? "");
      setFormError("");
      return;
    }

    setFullNameError("");
    setPhoneError("");
    setFormError("");
    setIsSubmitting(true);
    const storage = getSafeStorage();
    const storedContext = getStoredLeadContext(storage);

    try {
      const response = await fetch("/api/career/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contact: validation.phone,
          contactType: "phone",
          phone: validation.phone,
          fullName: validation.fullName,
          source: request.source,
          stage: stage || undefined,
          uncertainty: uncertainty || undefined,
          companyWebsite,
          ...storedContext,
          currentPathId: request.currentPathId,
          comparisonPathIds: request.comparisonPathIds,
          pathname: window.location.pathname
        })
      });

      if (!response.ok) throw new Error("lead request failed");
      rememberCareerLeadCaptureSubmission(storage);
      setSubmitted(true);
    } catch {
      setFormError("الان ذخیره نشد. کمی بعد دوباره امتحان کن.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen || !request) return null;

  return (
    <div
      className={styles.backdrop}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) dismiss();
      }}
    >
      <section
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby="career-lead-title"
        aria-describedby="career-lead-description"
        data-career-lead-capture-dialog
        dir="rtl"
      >
        <div className={styles.sheetHandle} aria-hidden="true" />
        <button
          ref={closeButtonRef}
          className={styles.closeButton}
          type="button"
          aria-label="بستن"
          onClick={submitted ? close : dismiss}
        >
          <SoftCloseIcon size={18} />
        </button>

        <header className={styles.header}>
          <h2 id="career-lead-title">مسیرهای شغلی‌ات را برای ادامه بررسی نگه داریم؟</h2>
          <p id="career-lead-description">
            نام و شماره‌ات را بگذار تا بعداً بتوانی مسیرهای شغلی و مقایسه‌هایت را پیگیری کنی.
          </p>
        </header>

        {submitted ? (
          <div className={styles.successState} role="status" aria-live="polite">
            <span aria-hidden="true">✓</span>
            <p>ذخیره شد. می‌توانی از «مسیرهای شغلی من» ادامه بدهی.</p>
            <button type="button" onClick={close}>ادامه بررسی</button>
          </div>
        ) : (
          <CareerLeadCaptureForm
            fullName={fullName}
            phoneNumber={phoneNumber}
            stage={stage}
            uncertainty={uncertainty}
            companyWebsite={companyWebsite}
            fullNameError={fullNameError}
            phoneError={phoneError}
            formError={formError}
            isSubmitting={isSubmitting}
            onFullNameChange={setFullName}
            onPhoneNumberChange={setPhoneNumber}
            onStageChange={setStage}
            onUncertaintyChange={setUncertainty}
            onCompanyWebsiteChange={setCompanyWebsite}
            onSubmit={submitLead}
            onDismiss={dismiss}
          />
        )}
      </section>
    </div>
  );
}
