import type { Metadata } from "next";
import { Suspense } from "react";
import {
  CareerLearningPage,
  CareerLearningPageFallback
} from "@/features/career/CareerLearningPage";

export const metadata: Metadata = {
  title: "دوره‌های مهارت | Useravaa",
  description: "دوره‌های مرتبط با مهارت‌های مسیر شغلی‌ات را پیدا و با هم مقایسه کن.",
  robots: { index: false, follow: false }
};

export default function CareerLearningRoute() {
  return (
    <Suspense fallback={<CareerLearningPageFallback />}>
      <CareerLearningPage />
    </Suspense>
  );
}
