"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { BookmarkPlus, Check, GitCompareArrows } from "@/features/career/CareerIcons";
import {
  recordRecentlyViewedCareerPath,
  startCompareDraftFromPath
} from "@/features/career/career-compare-state";
import { trackCareerEvent } from "@/features/career/career-events";
import {
  requestCareerLeadCapture,
  shouldRequestCareerLeadCapture
} from "@/features/career/career-lead-capture";
import { useSavedCareerPaths } from "@/features/career/career-saved-paths";
import styles from "./CareerPathSeoPage.module.css";

type CareerPathActionProps = Readonly<{
  pathId: string;
  slug: string;
  className: string;
  label?: string;
  compact?: boolean;
  tabIndex?: number;
  heroPrimary?: boolean;
}>;

export function CareerPathSaveAction({
  pathId,
  className,
  label = "این مسیر را برای بررسی نگه دار",
  compact = false,
  tabIndex,
  heroPrimary = false
}: Omit<CareerPathActionProps, "slug">) {
  const { savedPathIds, hasLoadedSavedPaths, savePath } = useSavedCareerPaths();
  const saved = savedPathIds.has(pathId);

  function saveCurrentPath() {
    if (saved) return;
    const saveSucceeded = savePath(pathId);
    if (saveSucceeded) trackCareerEvent("career_path_saved", { pathId });
    if (shouldRequestCareerLeadCapture(saved, saveSucceeded)) {
      requestCareerLeadCapture({ source: "path_save", currentPathId: pathId });
    }
  }

  return (
    <button
      type="button"
      className={className}
      aria-busy={!hasLoadedSavedPaths}
      aria-pressed={saved}
      data-career-save-action
      data-career-hero-primary-action={heroPrimary ? "true" : undefined}
      data-saved={saved ? "true" : "false"}
      onClick={saveCurrentPath}
      tabIndex={tabIndex}
    >
      {saved ? <Check className={styles.actionIcon} size={compact ? 17 : 18} aria-hidden /> : (
        <BookmarkPlus className={styles.actionIcon} size={compact ? 17 : 18} aria-hidden />
      )}
      <span>{saved ? (compact ? "ذخیره شد" : "در مسیرهای من ذخیره شد") : label}</span>
    </button>
  );
}

export function CareerPathCompareAction({
  pathId,
  slug,
  className,
  label = "مقایسه با مسیرهای دیگر",
  compact = false,
  tabIndex
}: CareerPathActionProps) {
  return (
    <Link
      className={className}
      href={`/career/compare?path=${encodeURIComponent(slug)}`}
      onClick={() => {
        startCompareDraftFromPath(pathId);
        trackCareerEvent("career_compare_started", { fromPathId: pathId });
      }}
      tabIndex={tabIndex}
    >
      <GitCompareArrows className={styles.actionIcon} size={compact ? 17 : 18} aria-hidden />
      <span>{label}</span>
    </Link>
  );
}

export function CareerPathViewTracker({
  pathId,
  pathTitle
}: Readonly<{ pathId: string; pathTitle: string }>) {
  const trackedRef = useRef(false);

  useEffect(() => {
    if (trackedRef.current) return;
    trackedRef.current = true;
    recordRecentlyViewedCareerPath(pathId);
    trackCareerEvent("career_path_viewed", { pathId, pathTitle });
  }, [pathId, pathTitle]);

  return null;
}
