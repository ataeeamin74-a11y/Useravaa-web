import type { Metadata } from "next";
import { CareerShell } from "@/features/career/CareerShell";
import { PathsPage } from "@/features/career/PathsPage";

export const metadata: Metadata = {
  title: "مسیرهای شغلی | Useravaa",
  description: "مسیرهای شغلی را ببین، ذخیره کن و مقایسه کن تا انتخابت روشن‌تر شود.",
  alternates: {
    canonical: "https://useravaa.com"
  }
};

type HomePageProps = Readonly<{
  searchParams: Promise<Readonly<Record<string, string | string[] | undefined>>>;
}>;

export default async function HomePage({ searchParams }: HomePageProps) {
  const cardParam = (await searchParams).card;
  const initialCardId = Array.isArray(cardParam) ? cardParam[0] : cardParam;

  // CareerShell marks the root as the launch PWA, allowing AppShell to hide
  // the legacy marketplace navigation without changing those future routes.
  return (
    <CareerShell>
      <PathsPage initialCardId={initialCardId} />
    </CareerShell>
  );
}
