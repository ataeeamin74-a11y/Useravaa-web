"use client";

import { useMemo, useSyncExternalStore } from "react";
import { resolveCareerPathId } from "./career-path-index";

export const MIN_COMPARE_PATHS = 2;
export const MAX_COMPARE_PATHS = 5;
export const RECENTLY_VIEWED_PATHS_STORAGE_KEY = "useravaa:career:recently-viewed-paths";
export const COMPARE_DRAFT_STORAGE_KEY = "useravaa:career:compare-draft";
export const COMPARE_DRAFT_TTL_MS = 24 * 60 * 60 * 1000;

const RECENTLY_VIEWED_PATHS_CHANGE_EVENT = "useravaa:career:recently-viewed-paths-change";
const COMPARE_DRAFT_CHANGE_EVENT = "useravaa:career:compare-draft-change";
const EMPTY_RECENTLY_VIEWED_PATHS = "[]";
const EMPTY_COMPARE_DRAFT = "[]";
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

export function normalizeCompareDraftPathIds(pathIds: readonly string[]): readonly string[] {
  const normalizedPathIds: string[] = [];
  const seenPathIds = new Set<string>();

  for (const pathId of pathIds) {
    const resolvedPathId = resolveCareerPathId(pathId);
    if (!resolvedPathId || seenPathIds.has(resolvedPathId)) continue;

    normalizedPathIds.push(resolvedPathId);
    seenPathIds.add(resolvedPathId);
    if (normalizedPathIds.length >= MAX_COMPARE_PATHS) break;
  }

  return normalizedPathIds;
}

export function updateCompareDraftSelection(
  currentPathIds: readonly string[],
  pathId: string
): readonly string[] {
  const resolvedPathId = resolveCareerPathId(pathId);
  const currentDraftPathIds = normalizeCompareDraftPathIds(currentPathIds);
  if (!resolvedPathId) return currentDraftPathIds;

  if (!currentDraftPathIds.length) return [resolvedPathId];
  if (currentDraftPathIds.length === 1) {
    return currentDraftPathIds[0] === resolvedPathId
      ? currentDraftPathIds
      : [currentDraftPathIds[0], resolvedPathId];
  }

  return [resolvedPathId];
}

export function parseCompareDraftPathIds(
  storedValue: string,
  now = Date.now()
): readonly string[] {
  try {
    const parsedValue: unknown = JSON.parse(storedValue);
    if (Array.isArray(parsedValue)) {
      return normalizeCompareDraftPathIds(
        parsedValue.filter((value): value is string => typeof value === "string")
      );
    }

    if (
      typeof parsedValue === "object"
      && parsedValue !== null
      && "pathIds" in parsedValue
      && Array.isArray(parsedValue.pathIds)
    ) {
      const updatedAt = "updatedAt" in parsedValue && typeof parsedValue.updatedAt === "number"
        ? parsedValue.updatedAt
        : now;
      if (now - updatedAt > COMPARE_DRAFT_TTL_MS) return [];

      return normalizeCompareDraftPathIds(
        parsedValue.pathIds.filter((value): value is string => typeof value === "string")
      );
    }

    return [];
  } catch {
    return [];
  }
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

function getCompareDraftSnapshot(): string {
  try {
    return window.sessionStorage.getItem(COMPARE_DRAFT_STORAGE_KEY) ?? EMPTY_COMPARE_DRAFT;
  } catch {
    return EMPTY_COMPARE_DRAFT;
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

function subscribeToCompareDraft(onStoreChange: () => void) {
  function handleStorage(event: StorageEvent) {
    if (event.key === COMPARE_DRAFT_STORAGE_KEY) onStoreChange();
  }

  window.addEventListener("storage", handleStorage);
  window.addEventListener(COMPARE_DRAFT_CHANGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(COMPARE_DRAFT_CHANGE_EVENT, onStoreChange);
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

export function saveCompareDraftPathIds(pathIds: readonly string[]) {
  const normalizedPathIds = normalizeCompareDraftPathIds(pathIds);

  try {
    if (!normalizedPathIds.length) {
      window.sessionStorage.removeItem(COMPARE_DRAFT_STORAGE_KEY);
    } else {
      window.sessionStorage.setItem(
        COMPARE_DRAFT_STORAGE_KEY,
        JSON.stringify({ pathIds: normalizedPathIds, updatedAt: Date.now() })
      );
    }
    window.dispatchEvent(new Event(COMPARE_DRAFT_CHANGE_EVENT));
    return true;
  } catch {
    return false;
  }
}

export function clearCompareDraft() {
  return saveCompareDraftPathIds([]);
}

export function startCompareDraftFromPath(pathId: string): readonly string[] {
  const currentPathIds = parseCompareDraftPathIds(getCompareDraftSnapshot());
  const nextPathIds = updateCompareDraftSelection(currentPathIds, pathId);
  saveCompareDraftPathIds(nextPathIds);
  return nextPathIds;
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

export function useCompareDraftPathIds() {
  const hasLoadedCompareDraft = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false
  );
  const serializedCompareDraft = useSyncExternalStore(
    subscribeToCompareDraft,
    getCompareDraftSnapshot,
    () => EMPTY_COMPARE_DRAFT
  );
  const compareDraftPathIds = useMemo(
    () => parseCompareDraftPathIds(serializedCompareDraft),
    [serializedCompareDraft]
  );

  return { compareDraftPathIds, hasLoadedCompareDraft } as const;
}
