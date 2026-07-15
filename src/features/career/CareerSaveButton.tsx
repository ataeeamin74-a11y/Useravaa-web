"use client";

import type { MouseEvent } from "react";
import { Bookmark } from "./CareerIcons";
import styles from "./CareerPages.module.css";

type CareerSaveButtonProps = Readonly<{
  saved: boolean;
  onToggle: () => void;
}>;

export function CareerSaveButton({ saved, onToggle }: CareerSaveButtonProps) {
  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    onToggle();
  }

  return (
    <button
      type="button"
      className={saved ? styles.saveControlActive : styles.saveControl}
      aria-label={saved ? "حذف از ذخیره‌شده‌ها" : "ذخیره برای بررسی"}
      aria-pressed={saved}
      onClick={handleClick}
    >
      <Bookmark size={18} weight={saved ? "fill" : "duotone"} aria-hidden />
      <span>{saved ? "ذخیره‌شده" : "ذخیره برای بررسی"}</span>
    </button>
  );
}
