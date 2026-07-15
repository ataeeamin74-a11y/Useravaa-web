import type { Metadata } from "next";
import { CareerInternshipsPage } from "@/features/career/CareerInternshipsPage";

export const metadata: Metadata = {
  title: "آگهی‌های کارآموزی | Useravaa",
  description: "آگهی‌های تازه کارآموزی را بر اساس مسیرهای شغلی موردنظرت پیدا کن.",
  robots: { index: false, follow: false }
};

export default function CareerInternshipsRoute() {
  return <CareerInternshipsPage />;
}
