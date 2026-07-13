import type { Metadata } from "next";
import { Suspense } from "react";
import { CareerSkillsPage } from "@/features/career/CareerSkillsPage";
import styles from "@/features/career/CareerSkillsPage.module.css";

export const metadata: Metadata = {
  title: "مهارت‌ها و مسیرهای نزدیک | Useravaa",
  description: "مهارت‌های فعلی و علاقه‌های یادگیری را برای مقایسه مسیرهای شغلی بررسی کن.",
  robots: { index: false, follow: false }
};

export default function CareerSkillsRoute() {
  return (
    <Suspense fallback={(
      <main className={styles.routeLoading} dir="rtl" aria-busy="true">
        <span>در حال آماده‌سازی مهارت‌ها...</span>
      </main>
    )}>
      <CareerSkillsPage />
    </Suspense>
  );
}
