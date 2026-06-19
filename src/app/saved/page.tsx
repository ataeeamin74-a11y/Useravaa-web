import { PageContainer } from "@/components/layout/PageContainer";
import { SavedPage } from "@/features/v51/saved/SavedPage";
import { requireCurrentViewer } from "@/lib/auth/session";

type SavedRouteProps = Readonly<{
  searchParams: Promise<{
    tab?: string;
  }>;
}>;

export default async function SavedRoute({ searchParams }: SavedRouteProps) {
  await requireCurrentViewer();
  const params = await searchParams;

  return (
    <PageContainer variant="empty">
      <SavedPage initialTab={params.tab} />
    </PageContainer>
  );
}
