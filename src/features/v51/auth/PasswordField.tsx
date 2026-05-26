"use client";

import { useState } from "react";
import { UseravaaIcon } from "@/components/ui/UseravaaIcon";
import styles from "./AuthPage.module.css";

type PasswordFieldProps = Readonly<{
  autoComplete: string;
}>;

export function PasswordField({ autoComplete }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <span className={styles.passwordControl}>
      <input type={visible ? "text" : "password"} autoComplete={autoComplete} />
      <button
        type="button"
        aria-label={visible ? "پنهان کردن رمز عبور" : "نمایش رمز عبور"}
        aria-pressed={visible}
        onClick={() => setVisible((current) => !current)}
      >
        <UseravaaIcon name={visible ? "hidden" : "view"} size={18} aria-hidden="true" />
      </button>
    </span>
  );
}
