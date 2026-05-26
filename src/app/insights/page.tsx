import { InsightsPage } from "@/features/v51/insights/InsightsPage";

type InsightsRouteProps = Readonly<{
  searchParams: Promise<{
    answer?: string;
  }>;
}>;

export default async function InsightsRoute({ searchParams }: InsightsRouteProps) {
  const params = await searchParams;

  return <InsightsPage initialAnswerComposerOpen={params.answer === "active"} />;
}
