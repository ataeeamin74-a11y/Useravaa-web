"use client";

import { useEffect, type RefObject } from "react";

type UseClickOutsideOptions = Readonly<{
  refs: ReadonlyArray<RefObject<HTMLElement | null>>;
  enabled: boolean;
  onOutsideClick: () => void;
}>;

export function useClickOutside({ refs, enabled, onOutsideClick }: UseClickOutsideOptions) {
  useEffect(() => {
    if (!enabled || typeof document === "undefined") {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      const clickedInside = refs.some((ref) => ref.current?.contains(target));

      if (!clickedInside) {
        onOutsideClick();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown, true);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
    };
  }, [enabled, onOutsideClick, refs]);
}
