"use client";

import { useEffect, useRef, useState } from "react";

export const savedProfileIdsStorageKey = "useravaa.saved.profileIds";
export const savedInsightIdsStorageKey = "useravaa.saved.insightIds";
const emptySavedIds: readonly string[] = [];

function readIds(storageKey: string, fallback: readonly string[]) {
  if (typeof window === "undefined") {
    return [...fallback];
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    const parsed = raw ? JSON.parse(raw) : fallback;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [...fallback];
  } catch {
    return [...fallback];
  }
}

function writeIds(storageKey: string, ids: readonly string[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(storageKey, JSON.stringify(ids));
}

function toggleId(ids: readonly string[], id: string) {
  return ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id];
}

export function useSavedItems(initialProfileIds: readonly string[] = emptySavedIds, initialInsightIds: readonly string[] = emptySavedIds) {
  const initialProfileIdsRef = useRef(initialProfileIds);
  const initialInsightIdsRef = useRef(initialInsightIds);
  const [savedProfileIds, setSavedProfileIds] = useState<string[]>(() => [...initialProfileIds]);
  const [savedInsightIds, setSavedInsightIds] = useState<string[]>(() => [...initialInsightIds]);

  useEffect(() => {
    let isCancelled = false;

    window.queueMicrotask(() => {
      if (isCancelled) {
        return;
      }

      setSavedProfileIds(readIds(savedProfileIdsStorageKey, initialProfileIdsRef.current));
      setSavedInsightIds(readIds(savedInsightIdsStorageKey, initialInsightIdsRef.current));
    });

    return () => {
      isCancelled = true;
    };
  }, []);

  function toggleSavedProfile(profileId: string) {
    setSavedProfileIds((current) => {
      const next = toggleId(current, profileId);
      writeIds(savedProfileIdsStorageKey, next);
      return next;
    });
  }

  function toggleSavedInsight(insightId: string) {
    setSavedInsightIds((current) => {
      const next = toggleId(current, insightId);
      writeIds(savedInsightIdsStorageKey, next);
      return next;
    });
  }

  function removeSavedProfile(profileId: string) {
    setSavedProfileIds((current) => {
      const next = current.filter((id) => id !== profileId);
      writeIds(savedProfileIdsStorageKey, next);
      return next;
    });
  }

  function removeSavedInsight(insightId: string) {
    setSavedInsightIds((current) => {
      const next = current.filter((id) => id !== insightId);
      writeIds(savedInsightIdsStorageKey, next);
      return next;
    });
  }

  return {
    savedProfileIds,
    savedInsightIds,
    toggleSavedProfile,
    toggleSavedInsight,
    removeSavedProfile,
    removeSavedInsight
  };
}
