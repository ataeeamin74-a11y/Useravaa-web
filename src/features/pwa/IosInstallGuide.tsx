"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  rememberIosInstallGuideDismissal,
  shouldShowIosInstallGuide,
  type InstallGuideStorage,
  type IosNavigatorSnapshot
} from "./ios-install-guide";
import styles from "./IosInstallGuide.module.css";

const SHOW_DELAY_MS = 3000;

function getSafeStorage(): InstallGuideStorage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

function navigatorSnapshot(): IosNavigatorSnapshot {
  const iosNavigator = navigator as Navigator & { standalone?: boolean };

  return {
    userAgent: iosNavigator.userAgent,
    platform: iosNavigator.platform,
    maxTouchPoints: iosNavigator.maxTouchPoints,
    standalone: iosNavigator.standalone
  };
}

export function IosInstallGuide() {
  const [isOpen, setIsOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const dismiss = useCallback(() => {
    rememberIosInstallGuideDismissal(getSafeStorage());
    setIsOpen(false);
  }, []);

  useEffect(() => {
    try {
      if (
        !shouldShowIosInstallGuide({
          navigatorSnapshot: navigatorSnapshot(),
          matchMedia: window.matchMedia.bind(window),
          storage: getSafeStorage()
        })
      ) {
        return;
      }

      const timer = window.setTimeout(() => setIsOpen(true), SHOW_DELAY_MS);
      return () => window.clearTimeout(timer);
    } catch {
      return;
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    const focusFrame = window.requestAnimationFrame(() => closeButtonRef.current?.focus());

    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        dismiss();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const dialog = document.querySelector<HTMLElement>("[data-ios-install-guide-dialog]");
      const controls = dialog?.querySelectorAll<HTMLElement>("button:not([disabled])");

      if (!controls?.length) {
        return;
      }

      const firstControl = controls[0];
      const lastControl = controls[controls.length - 1];

      if (event.shiftKey && document.activeElement === firstControl) {
        event.preventDefault();
        lastControl.focus();
      } else if (!event.shiftKey && document.activeElement === lastControl) {
        event.preventDefault();
        firstControl.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocusRef.current?.focus();
    };
  }, [dismiss, isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className={styles.backdrop}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          dismiss();
        }
      }}
    >
      <section
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ios-install-guide-title"
        aria-describedby="ios-install-guide-description"
        data-ios-install-guide-dialog
        dir="rtl"
      >
        <div className={styles.sheetHandle} aria-hidden="true" />
        <button
          ref={closeButtonRef}
          className={styles.closeButton}
          type="button"
          aria-label="بستن راهنمای نصب"
          onClick={dismiss}
        >
          <span aria-hidden="true">×</span>
        </button>

        <header className={styles.header}>
          <span className={styles.eyebrow}>راهنمای نصب روی iPhone</span>
          <h2 id="ios-install-guide-title">Useravaa را به صفحه اصلی اضافه کن</h2>
          <p id="ios-install-guide-description">
            برای اینکه هر وقت خواستی راحت‌تر به مسیرهای شغلی برگردی، Useravaa را مثل یک اپ روی گوشی داشته باش.
          </p>
        </header>

        <ol className={styles.steps} aria-label="مراحل اضافه کردن Useravaa به صفحه اصلی">
          <li>
            <span className={styles.stepNumber} aria-hidden="true">۱</span>
            <span>در Safari دکمه Share را بزن.</span>
          </li>
          <li>
            <span className={styles.stepNumber} aria-hidden="true">۲</span>
            <span>گزینه Add to Home Screen را انتخاب کن.</span>
          </li>
          <li>
            <span className={styles.stepNumber} aria-hidden="true">۳</span>
            <span>در مرحله آخر Add را بزن.</span>
          </li>
        </ol>

        <footer className={styles.actions}>
          <button className={styles.primaryButton} type="button" onClick={dismiss}>
            متوجه شدم
          </button>
          <button className={styles.laterButton} type="button" onClick={dismiss}>
            بعداً
          </button>
        </footer>
      </section>
    </div>
  );
}
