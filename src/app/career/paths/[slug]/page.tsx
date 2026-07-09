import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  buildCareerPathMetadata,
  getCareerPathSeoEntries,
  getCareerPathSeoEntryBySlug
} from "@/features/career/career-path-seo";
import { CareerPathProductPage } from "./CareerPathProductPage";

type CareerPathSeoPageProps = Readonly<{
  params: Promise<Readonly<{ slug: string }>>;
}>;

export function generateStaticParams() {
  return getCareerPathSeoEntries().map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata({ params }: CareerPathSeoPageProps): Promise<Metadata> {
  const { slug } = await params;
  const entry = getCareerPathSeoEntryBySlug(slug);
  if (!entry) return { title: "مسیر شغلی پیدا نشد | Useravaa" };

  return {
    ...buildCareerPathMetadata(entry),
    robots: {
      index: true,
      follow: true
    }
  };
}

export default async function CareerPathSeoPage({ params }: CareerPathSeoPageProps) {
  const { slug } = await params;
  const entry = getCareerPathSeoEntryBySlug(slug);
  if (!entry) notFound();

  return <CareerPathProductPage entry={entry} />;
}
