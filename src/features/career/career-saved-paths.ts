"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { getCareerPathById, resolveCareerPathId } from "./career-path-index";

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

export function parseSavedCareerPathIds(storedValue: string): ReadonlySet<string> {
  try {
    const parsedValue: unknown = JSON.parse(storedValue);
    if (!Array.isArray(parsedValue)) return new Set();

    return new Set(parsedValue.flatMap((value) => {
      if (typeof value !== "string") return [];
      const pathId = resolveCareerPathId(value);
      return pathId ? [pathId] : [];
    }));
  } catch {
    return new Set();
  }
}

export function addSavedCareerPathId(
  currentIds: ReadonlySet<string>,
  pathId: string
): ReadonlySet<string> {
  const resolvedPathId = resolveCareerPathId(pathId);
  if (!resolvedPathId) return currentIds;

  return new Set([...currentIds, resolvedPathId]);
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

function persistSavedCareerPathIds(savedPathIds: ReadonlySet<string>) {
  try {
    window.localStorage.setItem(SAVED_PATHS_STORAGE_KEY, JSON.stringify([...savedPathIds]));
    window.dispatchEvent(new Event(SAVED_PATHS_CHANGE_EVENT));
    return true;
  } catch {
    // Backend persistence is intentionally out of scope for this MVP.
    return false;
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
  const savedPathIds = useMemo(
    () => parseSavedCareerPathIds(serializedSavedPaths),
    [serializedSavedPaths]
  );
  const savedCardIds = useMemo(() => new Set(
    [...savedPathIds].flatMap((pathId) => {
      const cardId = getCareerPathById(pathId)?.cards[0]?.id;
      return cardId ? [cardId] : [];
    })
  ), [savedPathIds]);

  const toggleSavedPath = useCallback((id: string) => {
    const pathId = resolveCareerPathId(id);
    if (!pathId) return;
    persistSavedCareerPathIds(toggleSavedCareerPathId(savedPathIds, pathId));
  }, [savedPathIds]);

  const savePath = useCallback((pathId: string) => {
    const nextPathIds = addSavedCareerPathId(savedPathIds, pathId);
    return nextPathIds !== savedPathIds && persistSavedCareerPathIds(nextPathIds);
  }, [savedPathIds]);

  return {
    savedPathIds,
    savedCardIds,
    hasLoadedSavedPaths,
    savePath,
    toggleSavedPath
  } as const;
}
