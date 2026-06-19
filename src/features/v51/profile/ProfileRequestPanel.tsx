"use client";

import { useState } from "react";
import { V51LinkButton } from "@/features/v51/components/V51Button";
import { getRequestHref, toman, type DurationPricing, type ExperienceProfileFixture } from "@/features/v51/data/profiles";
import styles from "./ProfileDetailPage.module.css";

type ProfileRequestPanelProps = Readonly<{
  profile: ExperienceProfileFixture;
  initialDuration?: 30 | 60;
}>;

const durations = [30, 60] as const;

export function ProfileRequestPanel({ profile, initialDuration = 30 }: ProfileRequestPanelProps) {
  const [selectedDuration, setSelectedDuration] = useState<30 | 60>(initialDuration);

  return (
    <aside className={`${styles.panel} ${styles.sticky}`}>
      <h2>هماهنگی جلسه</h2>
      <p className={styles.muted}>زمان‌های آزاد در پروفایل نمایش داده نمی‌شود. بعد از پرداخت امن درخواست، صاحب تجربه دقیقاً سه زمان پیشنهادی اعلام می‌کند.</p>
      <div className={styles.priceGrid} role="group" aria-label="انتخاب مدت جلسه مشاوره">
        {durations.map((duration) => (
          <button
            key={duration}
            type="button"
            className={`${styles.priceCard} ${selectedDuration === duration ? styles.priceCardSelected : ""}`}
            aria-pressed={selectedDuration === duration}
            onClick={() => setSelectedDuration(duration)}
          >
            <span className="button-label">{durationLabel(duration)}</span>
            <b className="button-label">{toman(profile.pricing[duration])}</b>
          </button>
        ))}
      </div>
      <V51LinkButton href={getRequestHref(profile.id, selectedDuration)} tone="primary" full className={styles.requestButton}>
        هماهنگی جلسه
      </V51LinkButton>
    </aside>
  );
}

function durationLabel(duration: keyof DurationPricing) {
  return duration === 60 ? "۱ ساعت" : "۳۰ دقیقه";
}
