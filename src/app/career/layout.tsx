import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { CareerShell } from "@/features/career/CareerShell";

export const metadata: Metadata = {
  title: "مسیرهای شغلی | Useravaa",
  description: "کشف، مقایسه و شناخت مسیرهای شغلی با Useravaa."
};

export const viewport: Viewport = { themeColor: "#091B49" };

export default function CareerLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <CareerShell>{children}</CareerShell>;
}
