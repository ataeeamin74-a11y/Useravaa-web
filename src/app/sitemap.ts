import type { MetadataRoute } from "next";
import { getCareerPathSeoEntries } from "@/features/career/career-path-seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://useravaa.com",
      changeFrequency: "weekly",
      priority: 1
    },
    ...getCareerPathSeoEntries().map((entry) => ({
      url: entry.canonicalUrl,
      changeFrequency: "monthly" as const,
      priority: 0.7
    }))
  ];
}
