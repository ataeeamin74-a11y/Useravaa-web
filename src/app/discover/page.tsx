import { PageContainer } from "@/components/layout/PageContainer";
import { DiscoverPage } from "@/features/v51/discover/DiscoverPage";
import { getPublicJobFieldOptionsForUseCase } from "@/features/v51/data/public-category-options";
import type { DiscoveryState } from "@/features/v51/data/profiles";
import { getPublishedContentMap } from "@/lib/backend/content-runtime";

type DiscoverRouteProps = Readonly<{
  searchParams: Promise<{
    state?: string;
  }>;
}>;

function parseDiscoveryState(state: string | undefined): DiscoveryState {
  return state === "loading" || state === "error" ? state : "ready";
}

export default async function DiscoverRoute({ searchParams }: DiscoverRouteProps) {
  const params = await searchParams;
  const jobCategoryOptions = await getPublicJobFieldOptionsForUseCase("discovery");
  const copy = await getPublishedContentMap([
    {
      namespace: "public.discovery",
      key: "page_title",
      fallback: "کشف تجربه‌ها"
    },
    {
      namespace: "public.discovery",
      key: "page_description",
      fallback: "آدم‌های باتجربه را پیدا کنید، تجربه‌شان را بررسی کنید، و در صورت نیاز جلسه مشاوره هماهنگ کنید."
    }
  ]);

  return (
    <PageContainer variant="marketplace">
      <DiscoverPage
        initialState={parseDiscoveryState(params.state)}
        jobCategoryOptions={jobCategoryOptions.options}
        heroCopy={{
          title: copy["public.discovery.page_title"],
          description: copy["public.discovery.page_description"]
        }}
      />
    </PageContainer>
  );
}
