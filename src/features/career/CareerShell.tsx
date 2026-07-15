import type { ReactNode } from "react";
import Link from "next/link";
import { UseravaaLogo } from "@/components/logo/UseravaaLogo";
import { IosInstallGuide } from "@/features/pwa/IosInstallGuide";
import { CareerServiceWorker } from "@/features/pwa/CareerServiceWorker";
import { CareerAnalyticsScript } from "./CareerAnalyticsScript";
import { CareerEventBootstrap } from "./CareerEventBootstrap";
import { CareerLeadCaptureSheet } from "./CareerLeadCaptureSheet";
import { CareerTabRoot } from "./CareerTabRoot";
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
      <CareerTabRoot>{children}</CareerTabRoot>
      <CareerEventBootstrap />
      <CareerAnalyticsScript />
      <CareerLeadCaptureSheet />
      <IosInstallGuide />
      <CareerServiceWorker />
    </div>
  );
}
