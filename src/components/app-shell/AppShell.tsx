import type { ReactNode } from "react";
import { Header } from "@/components/header/Header";
import styles from "./AppShell.module.css";

type AppShellProps = Readonly<{
  children: ReactNode;
}>;

export function AppShell({ children }: AppShellProps) {
  return (
    <div className={styles.app}>
      <a className="skip-link" href="#main">
        پرش به محتوای اصلی
      </a>
      <Header />
      <main id="main" className={styles.main}>
        {children}
      </main>
    </div>
  );
}
