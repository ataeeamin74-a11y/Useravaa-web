import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import {
  buildCareerPathMetadata,
  getCareerPathRedirectSlug,
  getCareerPathSeoEntries,
  getCareerPathSeoEntryBySlug,
  getCareerPathSeoEntryBySlugOrLegacy
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
  const entry = getCareerPathSeoEntryBySlugOrLegacy(slug);
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
  const redirectSlug = getCareerPathRedirectSlug(slug);
  if (redirectSlug) permanentRedirect(`/career/paths/${redirectSlug}`);

  const entry = getCareerPathSeoEntryBySlug(slug);
  if (!entry) notFound();

  return <CareerPathProductPage entry={entry} />;
}
