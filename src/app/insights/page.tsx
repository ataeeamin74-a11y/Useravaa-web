import { PageContainer } from "@/components/layout/PageContainer";
import { getPublicJobFieldOptionsForUseCase } from "@/features/v51/data/public-category-options";
import { InsightsPage } from "@/features/v51/insights/InsightsPage";
import { getCurrentSession } from "@/lib/auth/session";
import { getPublishedContentMap } from "@/lib/backend/content-runtime";

type InsightsRouteProps = Readonly<{
  searchParams: Promise<{
    answer?: string;
  }>;
}>;

export default async function InsightsRoute({ searchParams }: InsightsRouteProps) {
  const params = await searchParams;
  const session = await getCurrentSession();
  const jobCategoryOptions = await getPublicJobFieldOptionsForUseCase("insights");
  const copy = await getPublishedContentMap([
    {
      namespace: "public.insights",
      key: "page_title",
      fallback: "بینش‌ها"
    },
    {
      namespace: "public.insights",
      key: "page_description",
      fallback: "تجربه‌های کوتاه و واقعی برای تصمیم‌های شغلی بهتر."
    }
  ]);
  const viewer = session.viewer
    ? {
        id: session.viewer.id,
        displayName: session.viewer.displayName
      }
    : null;

  return (
    <PageContainer variant="dashboard">
      <InsightsPage
        viewer={viewer}
        jobCategoryOptions={jobCategoryOptions.options}
        mastheadCopy={{
          title: copy["public.insights.page_title"],
          description: copy["public.insights.page_description"]
        }}
        initialAnswerComposerOpen={Boolean(viewer && params.answer === "active")}
        initialAuthPromptOpen={Boolean(!viewer && params.answer === "active")}
      />
    </PageContainer>
  );
}
