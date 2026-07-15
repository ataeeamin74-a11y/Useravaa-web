import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { CareerShell } from "@/features/career/CareerShell";
import { PathsPage } from "@/features/career/PathsPage";
import { getCareerPathSeoEntryByCardId } from "@/features/career/career-path-seo";
import { isSiteIndexingEnabled } from "@/lib/deployment/safety";

const rootTitle = "مسیرهای شغلی | Useravaa";
const rootDescription =
  "مسیرهای شغلی را با تجربه‌های واقعی بررسی، ذخیره و مقایسه کن تا تصمیم شغلی روشن‌تری بگیری.";
const rootUrl = "https://useravaa.com";
const shareImagePath = "/og/useravaa-career-share.png";
const shareImageAlt =
  "تصویر اشتراک‌گذاری یوزاوا برای بررسی، ذخیره و مقایسه مسیرهای شغلی با تجربه‌های واقعی";
const rootIndexingEnabled = isSiteIndexingEnabled();

export const metadata: Metadata = {
  title: rootTitle,
  description: rootDescription,
  alternates: {
    canonical: rootUrl
  },
  robots: {
    index: rootIndexingEnabled,
    follow: rootIndexingEnabled
  },
  openGraph: {
    title: rootTitle,
    description: rootDescription,
    url: rootUrl,
    siteName: "Useravaa",
    type: "website",
    locale: "fa_IR",
    images: [
      {
        url: shareImagePath,
        width: 1200,
        height: 630,
        alt: shareImageAlt
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: rootTitle,
    description: rootDescription,
    images: [
      {
        url: shareImagePath,
        alt: shareImageAlt
      }
    ]
  }
};

type HomePageProps = Readonly<{
  searchParams: Promise<Readonly<Record<string, string | string[] | undefined>>>;
}>;

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const cardParam = params.card;
  const domainParam = params.domain;
  const categoryParam = params.category;
  const initialCardId = Array.isArray(cardParam) ? cardParam[0] : cardParam;
  const initialDomainId = Array.isArray(domainParam) ? domainParam[0] : domainParam;
  const initialCategoryId = Array.isArray(categoryParam) ? categoryParam[0] : categoryParam;

  if (initialCardId) {
    const careerPathEntry = getCareerPathSeoEntryByCardId(initialCardId);
    if (careerPathEntry) permanentRedirect(careerPathEntry.pageHref);
  }

  // CareerShell marks the root as the launch PWA, allowing AppShell to hide
  // the legacy marketplace navigation without changing those future routes.
  return (
    <CareerShell>
      <PathsPage
        initialDomainId={initialDomainId}
        initialCategoryId={initialCategoryId}
      />
    </CareerShell>
  );
}
