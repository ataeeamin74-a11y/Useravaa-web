import type { ReactNode } from "react";
import Link from "next/link";
import { UseravaaLogo } from "@/components/logo/UseravaaLogo";
import { CareerBottomNav } from "./CareerBottomNav";
import styles from "./CareerShell.module.css";

type CareerShellProps = Readonly<{
  children: ReactNode;
}>;

export function CareerShell({ children }: CareerShellProps) {
  return (
    <div className={styles.shell} data-career-pwa>
      <header className={styles.header}>
        <Link href="/" aria-label="Useravaa مسیرهای شغلی">
          <UseravaaLogo variant="wordmark" className={styles.logo} priority />
        </Link>
        <span className={styles.productName}>مسیرهای شغلی</span>
      </header>

      <div className={styles.content}>{children}</div>
      <CareerBottomNav />
    </div>
  );
}
