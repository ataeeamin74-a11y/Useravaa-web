"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { getSkillById, resolveSkillId } from "./skill-catalog";

export const CAREER_SKILL_PROFILE_STORAGE_KEY = "useravaa:career:skill-profile";
export const CAREER_SKILL_PROFILE_VERSION = 1;
const CAREER_SKILL_PROFILE_CHANGE_EVENT = "useravaa:career:skill-profile-change";

export const skillSelectionStates = ["have", "interested"] as const;
export type SkillSelectionState = (typeof skillSelectionStates)[number];

export type UserSkillSelection = Readonly<{
  skillId: string;
  state: SkillSelectionState;
}>;

export type UserSkillProfile = Readonly<{
  version: 1;
  selections: readonly UserSkillSelection[];
  updatedAt: string;
}>;

export type SkillProfileStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const EMPTY_PROFILE: UserSkillProfile = {
  version: CAREER_SKILL_PROFILE_VERSION,
  selections: [],
  updatedAt: "1970-01-01T00:00:00.000Z"
};
const EMPTY_PROFILE_SERIALIZED = JSON.stringify(EMPTY_PROFILE);

function isSelectionState(value: unknown): value is SkillSelectionState {
  return typeof value === "string" && skillSelectionStates.includes(value as SkillSelectionState);
}
function isIsoDate(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

export function validateSkillProfile(value: unknown): UserSkillProfile {
  if (!value || typeof value !== "object") return EMPTY_PROFILE;
  const candidate = value as Record<string, unknown>;
  const rawSelections = Array.isArray(candidate.selections) ? candidate.selections : [];
  const selectionBySkillId = new Map<string, UserSkillSelection>();

  for (const rawSelection of rawSelections) {
    if (!rawSelection || typeof rawSelection !== "object") continue;
    const selection = rawSelection as Record<string, unknown>;
    if (typeof selection.skillId !== "string" || !isSelectionState(selection.state)) continue;
    const skillId = resolveSkillId(selection.skillId);
    if (!skillId || !getSkillById(skillId)?.isSelectable) continue;
    selectionBySkillId.set(skillId, { skillId, state: selection.state });
  }

  return {
    version: CAREER_SKILL_PROFILE_VERSION,
    selections: [...selectionBySkillId.values()].sort((first, second) => (
      first.skillId.localeCompare(second.skillId, "en")
    )),
    updatedAt: isIsoDate(candidate.updatedAt) ? candidate.updatedAt : EMPTY_PROFILE.updatedAt
  };
}

export function migrateSkillProfile(value: unknown): UserSkillProfile {
  let parsedValue = value;
  if (typeof value === "string") {
    try {
      parsedValue = JSON.parse(value) as unknown;
    } catch {
      return EMPTY_PROFILE;
    }
  }

  if (!parsedValue || typeof parsedValue !== "object") return EMPTY_PROFILE;
  const candidate = parsedValue as Record<string, unknown>;
  if (candidate.version === CAREER_SKILL_PROFILE_VERSION) return validateSkillProfile(candidate);

  const legacySelections = Array.isArray(candidate.skills) ? candidate.skills : [];
  return validateSkillProfile({
    version: CAREER_SKILL_PROFILE_VERSION,
    selections: legacySelections.flatMap((rawSelection) => {
      if (!rawSelection || typeof rawSelection !== "object") return [];
      const selection = rawSelection as Record<string, unknown>;
      const identity = typeof selection.skillId === "string"
        ? selection.skillId
        : typeof selection.title === "string"
          ? selection.title
          : "";
      const skillId = resolveSkillId(identity);
      const state = selection.state === "want" ? "interested" : selection.state;
      return skillId && isSelectionState(state) ? [{ skillId, state }] : [];
    }),
    updatedAt: candidate.updatedAt
  });
}

function browserStorage() {
  try {
    return typeof window === "undefined" ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}

export function getSkillProfile(storage = browserStorage()): UserSkillProfile {
  try {
    return migrateSkillProfile(storage?.getItem(CAREER_SKILL_PROFILE_STORAGE_KEY) ?? EMPTY_PROFILE);
  } catch {
    return EMPTY_PROFILE;
  }
}

export function saveSkillProfile(
  profile: UserSkillProfile,
  storage = browserStorage(),
  updatedAt = new Date().toISOString()
) {
  const validated = validateSkillProfile({ ...profile, updatedAt });
  try {
    storage?.setItem(CAREER_SKILL_PROFILE_STORAGE_KEY, JSON.stringify(validated));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(CAREER_SKILL_PROFILE_CHANGE_EVENT));
    }
    return validated;
  } catch {
    return validated;
  }
}

export function clearSkillProfile(storage = browserStorage()) {
  try {
    storage?.removeItem(CAREER_SKILL_PROFILE_STORAGE_KEY);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(CAREER_SKILL_PROFILE_CHANGE_EVENT));
    }
    return true;
  } catch {
    return false;
  }
}

export function setSkillSelection(
  profile: UserSkillProfile,
  skillId: string,
  state: SkillSelectionState
): UserSkillProfile {
  if (!getSkillById(skillId)?.isSelectable) return profile;
  const selectionById = new Map(profile.selections.map((selection) => [selection.skillId, selection]));
  selectionById.set(skillId, { skillId, state });
  return validateSkillProfile({ ...profile, selections: [...selectionById.values()] });
}

export function removeSkillSelection(
  profile: UserSkillProfile,
  skillId: string
): UserSkillProfile {
  if (!profile.selections.some((selection) => selection.skillId === skillId)) return profile;
  return validateSkillProfile({
    ...profile,
    selections: profile.selections.filter((selection) => selection.skillId !== skillId)
  });
}

function getProfileSnapshot() {
  try {
    return window.localStorage.getItem(CAREER_SKILL_PROFILE_STORAGE_KEY) ?? EMPTY_PROFILE_SERIALIZED;
  } catch {
    return EMPTY_PROFILE_SERIALIZED;
  }
}

function subscribeToProfile(onStoreChange: () => void) {
  function handleStorage(event: StorageEvent) {
    if (event.key === CAREER_SKILL_PROFILE_STORAGE_KEY) onStoreChange();
  }
  window.addEventListener("storage", handleStorage);
  window.addEventListener(CAREER_SKILL_PROFILE_CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(CAREER_SKILL_PROFILE_CHANGE_EVENT, onStoreChange);
  };
}

export function useCareerSkillProfile() {
  const serializedProfile = useSyncExternalStore(
    subscribeToProfile,
    getProfileSnapshot,
    () => EMPTY_PROFILE_SERIALIZED
  );
  const profile = useMemo(() => migrateSkillProfile(serializedProfile), [serializedProfile]);

  const selectSkill = useCallback((skillId: string, state: SkillSelectionState) => {
    saveSkillProfile(setSkillSelection(getSkillProfile(), skillId, state));
  }, []);
  const removeSkill = useCallback((skillId: string) => {
    saveSkillProfile(removeSkillSelection(getSkillProfile(), skillId));
  }, []);
  const resetProfile = useCallback(() => clearSkillProfile(), []);

  return { profile, selectSkill, removeSkill, resetProfile } as const;
}
