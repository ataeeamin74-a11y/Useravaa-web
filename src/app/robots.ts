import type { MetadataRoute } from "next";
import { getRobotsPolicy, getSitemapUrl } from "@/lib/deployment/safety";

export default function robots(): MetadataRoute.Robots {
  const policy = getRobotsPolicy();

  if (!policy.indexingEnabled) {
    return {
      rules: policy.rules
    };
  }

  const sitemap = getSitemapUrl() ?? "https://useravaa.com/sitemap.xml";

  return {
    rules: policy.rules,
    sitemap
  };
}
