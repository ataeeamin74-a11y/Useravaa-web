"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

export const SAVED_PATHS_STORAGE_KEY = "useravaa:career:saved-paths";
const SAVED_PATHS_CHANGE_EVENT = "useravaa:career:saved-paths-change";
const EMPTY_SAVED_PATHS = "[]";

export function toggleSavedCareerPathId(
  currentIds: ReadonlySet<string>,
  cardId: string
): ReadonlySet<string> {
  const nextIds = new Set(currentIds);

  if (nextIds.has(cardId)) nextIds.delete(cardId);
  else nextIds.add(cardId);

  return nextIds;
}

function parseSavedCareerPathIds(storedValue: string): ReadonlySet<string> {
  try {
    const parsedValue: unknown = JSON.parse(storedValue);
    if (!Array.isArray(parsedValue)) return new Set();

    return new Set(parsedValue.filter((value): value is string => typeof value === "string"));
  } catch {
    return new Set();
  }
}

function getSavedCareerPathSnapshot(): string {
  try {
    return window.localStorage.getItem(SAVED_PATHS_STORAGE_KEY) ?? EMPTY_SAVED_PATHS;
  } catch {
    return EMPTY_SAVED_PATHS;
  }
}

function subscribeToSavedCareerPaths(onStoreChange: () => void) {
  function handleStorage(event: StorageEvent) {
    if (event.key === SAVED_PATHS_STORAGE_KEY) onStoreChange();
  }

  window.addEventListener("storage", handleStorage);
  window.addEventListener(SAVED_PATHS_CHANGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(SAVED_PATHS_CHANGE_EVENT, onStoreChange);
  };
}

function subscribeToHydration() {
  return () => undefined;
}

function persistSavedCareerPathIds(savedCardIds: ReadonlySet<string>) {
  try {
    window.localStorage.setItem(SAVED_PATHS_STORAGE_KEY, JSON.stringify([...savedCardIds]));
    window.dispatchEvent(new Event(SAVED_PATHS_CHANGE_EVENT));
  } catch {
    // Backend persistence is intentionally out of scope for this MVP.
  }
}

export function useSavedCareerPaths() {
  const hasLoadedSavedPaths = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false
  );
  const serializedSavedPaths = useSyncExternalStore(
    subscribeToSavedCareerPaths,
    getSavedCareerPathSnapshot,
    () => EMPTY_SAVED_PATHS
  );
  const savedCardIds = useMemo(
    () => parseSavedCareerPathIds(serializedSavedPaths),
    [serializedSavedPaths]
  );

  const toggleSavedPath = useCallback((cardId: string) => {
    persistSavedCareerPathIds(toggleSavedCareerPathId(savedCardIds, cardId));
  }, [savedCardIds]);

  return { savedCardIds, hasLoadedSavedPaths, toggleSavedPath } as const;
}
