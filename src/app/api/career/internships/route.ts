import { isCareerInternshipFeedStale } from "@/features/career/career-internships";
import {
  loadCareerInternshipFeed,
  startCareerInternshipRefresh
} from "@/features/career/career-internships.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const now = Date.now();
  const feed = await loadCareerInternshipFeed(now);
  const isStale = isCareerInternshipFeedStale(feed, now);
  const refreshStarted = startCareerInternshipRefresh(feed, now);

  return Response.json(
    { ok: true, ...feed, isStale, refreshStarted },
    {
      headers: {
        "cache-control": "public, max-age=300, s-maxage=900, stale-while-revalidate=3600"
      }
    }
  );
}
