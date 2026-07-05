"use client";

import { useMemo, useSyncExternalStore } from "react";

export const MIN_COMPARE_PATHS = 2;
export const MAX_COMPARE_PATHS = 5;
export const RECENTLY_VIEWED_PATHS_STORAGE_KEY = "useravaa:career:recently-viewed-paths";

const RECENTLY_VIEWED_PATHS_CHANGE_EVENT = "useravaa:career:recently-viewed-paths-change";
const EMPTY_RECENTLY_VIEWED_PATHS = "[]";
const MAX_RECENTLY_VIEWED_PATHS = 20;

export type CompareSelectionUpdate = Readonly<{
  selectedPathIds: readonly string[];
  limitReached: boolean;
}>;

export function updateCompareSelection(
  selectedPathIds: readonly string[],
  pathId: string
): CompareSelectionUpdate {
  if (selectedPathIds.includes(pathId)) {
    return {
      selectedPathIds: selectedPathIds.filter((selectedId) => selectedId !== pathId),
      limitReached: false
    };
  }

  if (selectedPathIds.length >= MAX_COMPARE_PATHS) {
    return { selectedPathIds, limitReached: true };
  }

  return {
    selectedPathIds: [...selectedPathIds, pathId],
    limitReached: false
  };
}

export function addRecentlyViewedPathId(
  currentPathIds: readonly string[],
  pathId: string
): readonly string[] {
  return [
    pathId,
    ...currentPathIds.filter((currentPathId) => currentPathId !== pathId)
  ].slice(0, MAX_RECENTLY_VIEWED_PATHS);
}

function parseRecentlyViewedPathIds(storedValue: string): readonly string[] {
  try {
    const parsedValue: unknown = JSON.parse(storedValue);
    if (!Array.isArray(parsedValue)) return [];

    return parsedValue.filter((value): value is string => typeof value === "string");
  } catch {
    return [];
  }
}

function getRecentlyViewedPathSnapshot(): string {
  try {
    return window.localStorage.getItem(RECENTLY_VIEWED_PATHS_STORAGE_KEY) ?? EMPTY_RECENTLY_VIEWED_PATHS;
  } catch {
    return EMPTY_RECENTLY_VIEWED_PATHS;
  }
}

function subscribeToRecentlyViewedPaths(onStoreChange: () => void) {
  function handleStorage(event: StorageEvent) {
    if (event.key === RECENTLY_VIEWED_PATHS_STORAGE_KEY) onStoreChange();
  }

  window.addEventListener("storage", handleStorage);
  window.addEventListener(RECENTLY_VIEWED_PATHS_CHANGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(RECENTLY_VIEWED_PATHS_CHANGE_EVENT, onStoreChange);
  };
}

function subscribeToHydration() {
  return () => undefined;
}

export function recordRecentlyViewedCareerPath(pathId: string) {
  try {
    const currentPathIds = parseRecentlyViewedPathIds(getRecentlyViewedPathSnapshot());
    const nextPathIds = addRecentlyViewedPathId(currentPathIds, pathId);
    window.localStorage.setItem(RECENTLY_VIEWED_PATHS_STORAGE_KEY, JSON.stringify(nextPathIds));
    window.dispatchEvent(new Event(RECENTLY_VIEWED_PATHS_CHANGE_EVENT));
  } catch {
    // Recently viewed paths intentionally remain local-only for the career MVP.
  }
}

export function useRecentlyViewedCareerPaths() {
  const hasLoadedRecentlyViewedPaths = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false
  );
  const serializedRecentlyViewedPaths = useSyncExternalStore(
    subscribeToRecentlyViewedPaths,
    getRecentlyViewedPathSnapshot,
    () => EMPTY_RECENTLY_VIEWED_PATHS
  );
  const recentlyViewedPathIds = useMemo(
    () => parseRecentlyViewedPathIds(serializedRecentlyViewedPaths),
    [serializedRecentlyViewedPaths]
  );

  return { recentlyViewedPathIds, hasLoadedRecentlyViewedPaths } as const;
}
