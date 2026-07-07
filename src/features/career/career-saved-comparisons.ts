"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { MAX_COMPARE_PATHS, MIN_COMPARE_PATHS } from "./career-compare-state";
import { resolveCareerPathId } from "./career-path-index";

export const SAVED_COMPARISONS_STORAGE_KEY = "useravaa:career:saved-comparisons";
const SAVED_COMPARISONS_CHANGE_EVENT = "useravaa:career:saved-comparisons-change";
const EMPTY_SAVED_COMPARISONS = "[]";

export type SavedCareerComparison = readonly string[];

export function normalizeCareerComparison(
  pathIds: readonly string[]
): SavedCareerComparison | undefined {
  const normalizedIds = [...new Set(pathIds.flatMap((id) => {
    const pathId = resolveCareerPathId(id);
    return pathId ? [pathId] : [];
  }))].sort((left, right) => left.localeCompare(right));

  if (normalizedIds.length < MIN_COMPARE_PATHS || normalizedIds.length > MAX_COMPARE_PATHS) {
    return undefined;
  }

  return normalizedIds;
}

function comparisonKey(pathIds: readonly string[]): string {
  return pathIds.join("\u001f");
}

export function parseSavedCareerComparisons(storedValue: string): readonly SavedCareerComparison[] {
  try {
    const parsedValue: unknown = JSON.parse(storedValue);
    if (!Array.isArray(parsedValue)) return [];

    const comparisons = parsedValue.flatMap((value) => {
      if (!Array.isArray(value)) return [];
      const comparison = normalizeCareerComparison(
        value.filter((id): id is string => typeof id === "string")
      );
      return comparison ? [comparison] : [];
    });
    const uniqueComparisons = new Map(
      comparisons.map((comparison) => [comparisonKey(comparison), comparison])
    );

    return [...uniqueComparisons.values()];
  } catch {
    return [];
  }
}

export function addSavedCareerComparison(
  currentComparisons: readonly SavedCareerComparison[],
  pathIds: readonly string[]
): readonly SavedCareerComparison[] {
  const comparison = normalizeCareerComparison(pathIds);
  if (!comparison) return currentComparisons;
  const nextKey = comparisonKey(comparison);
  if (currentComparisons.some((item) => comparisonKey(item) === nextKey)) {
    return currentComparisons;
  }

  return [...currentComparisons, comparison];
}

export function includesSavedCareerComparison(
  comparisons: readonly SavedCareerComparison[],
  pathIds: readonly string[]
): boolean {
  const comparison = normalizeCareerComparison(pathIds);
  if (!comparison) return false;
  const key = comparisonKey(comparison);
  return comparisons.some((item) => comparisonKey(item) === key);
}

function getSavedComparisonsSnapshot(): string {
  try {
    return window.localStorage.getItem(SAVED_COMPARISONS_STORAGE_KEY) ?? EMPTY_SAVED_COMPARISONS;
  } catch {
    return EMPTY_SAVED_COMPARISONS;
  }
}

function subscribeToSavedComparisons(onStoreChange: () => void) {
  function handleStorage(event: StorageEvent) {
    if (event.key === SAVED_COMPARISONS_STORAGE_KEY) onStoreChange();
  }

  window.addEventListener("storage", handleStorage);
  window.addEventListener(SAVED_COMPARISONS_CHANGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(SAVED_COMPARISONS_CHANGE_EVENT, onStoreChange);
  };
}

function subscribeToHydration() {
  return () => undefined;
}

function persistSavedComparisons(comparisons: readonly SavedCareerComparison[]) {
  try {
    window.localStorage.setItem(SAVED_COMPARISONS_STORAGE_KEY, JSON.stringify(comparisons));
    window.dispatchEvent(new Event(SAVED_COMPARISONS_CHANGE_EVENT));
    return true;
  } catch {
    // Saved comparisons intentionally remain local-only for the launch PWA.
    return false;
  }
}

export function useSavedCareerComparisons() {
  const hasLoadedSavedComparisons = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false
  );
  const serializedComparisons = useSyncExternalStore(
    subscribeToSavedComparisons,
    getSavedComparisonsSnapshot,
    () => EMPTY_SAVED_COMPARISONS
  );
  const savedComparisons = useMemo(
    () => parseSavedCareerComparisons(serializedComparisons),
    [serializedComparisons]
  );
  const saveComparison = useCallback((pathIds: readonly string[]) => {
    const nextComparisons = addSavedCareerComparison(savedComparisons, pathIds);
    return nextComparisons !== savedComparisons && persistSavedComparisons(nextComparisons);
  }, [savedComparisons]);

  return {
    savedComparisons,
    hasLoadedSavedComparisons,
    saveComparison,
    isComparisonSaved: (pathIds: readonly string[]) => (
      includesSavedCareerComparison(savedComparisons, pathIds)
    )
  } as const;
}
