"use client";

import type { ReactNode } from "react";
import { useCallback, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CareerBottomNav, type CareerTabHref } from "./CareerBottomNav";
import styles from "./CareerShell.module.css";

type CareerTabRootProps = Readonly<{
  children: ReactNode;
}>;

export function CareerTabRoot({ children }: CareerTabRootProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [resetVersion, setResetVersion] = useState(0);

  const resetActiveTab = useCallback((href: CareerTabHref) => {
    // Remounting the active tab clears its internal React state. Replacing the
    // URL also removes detail query state without adding a misleading Back entry.
    setResetVersion((version) => version + 1);
    router.replace(href);
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [router]);

  return (
    <>
      <div className={styles.content} key={`${pathname}:${resetVersion}`}>
        {children}
      </div>
      <CareerBottomNav onResetActiveTab={resetActiveTab} />
    </>
  );
}
