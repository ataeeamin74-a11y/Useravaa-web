import { PageContainer } from "@/components/layout/PageContainer";
import { getPublicJobFieldOptionsForUseCase } from "@/features/v51/data/public-category-options";
import { InsightsPage } from "@/features/v51/insights/InsightsPage";
import { getCurrentSession } from "@/lib/auth/session";

type InsightsRouteProps = Readonly<{
  searchParams: Promise<{
    answer?: string;
  }>;
}>;

export default async function InsightsRoute({ searchParams }: InsightsRouteProps) {
  const params = await searchParams;
  const session = await getCurrentSession();
  const jobCategoryOptions = await getPublicJobFieldOptionsForUseCase("insights");
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
        initialAnswerComposerOpen={Boolean(viewer && params.answer === "active")}
        initialAuthPromptOpen={Boolean(!viewer && params.answer === "active")}
      />
    </PageContainer>
  );
}
