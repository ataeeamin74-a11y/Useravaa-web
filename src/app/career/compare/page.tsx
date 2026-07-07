import { ComparePage } from "@/features/career/ComparePage";

type CareerCompareRouteProps = Readonly<{
  searchParams: Promise<Readonly<Record<string, string | string[] | undefined>>>;
}>;

export default async function CareerCompareRoute({ searchParams }: CareerCompareRouteProps) {
  const pathParam = (await searchParams).path;
  const initialPathIds = Array.isArray(pathParam)
    ? pathParam
    : (pathParam ? [pathParam] : []);

  return <ComparePage initialPathIds={initialPathIds} />;
}
