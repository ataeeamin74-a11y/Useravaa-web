import Link from "next/link";
import { notFound } from "next/navigation";
import { PageContainer } from "@/components/layout/PageContainer";
import { Avatar } from "@/components/ui/Avatar";
import {
  getInsightAuthor,
  getInsightPromptHeader,
  getPublishedInsightBySlugOrId,
  publishedInsights
} from "@/features/v51/data/experience-discovery";
import styles from "@/features/v51/insights/InsightsPage.module.css";

type InsightDetailRouteProps = Readonly<{
  params: Promise<{
    insightSlug: string;
  }>;
}>;

export function generateStaticParams() {
  return publishedInsights
    .filter((insight) => insight.status === "published")
    .map((insight) => ({
      insightSlug: insight.slug
    }));
}

export default async function InsightDetailRoute({ params }: InsightDetailRouteProps) {
  const { insightSlug } = await params;
  const insight = getPublishedInsightBySlugOrId(insightSlug);

  if (!insight) {
    notFound();
  }

  const author = getInsightAuthor(insight);

  if (!author) {
    notFound();
  }

  return (
    <PageContainer as="main" variant="dashboard" className={styles.page}>
      <article className={styles.insightDetail}>
        <Link className={styles.detailBackLink} href="/insights">
          بینش‌ها
        </Link>
        <div className={styles.cardMeta}>
          <span>{getInsightPromptHeader(insight)}</span>
          <small>{insight.relativeDateFa}</small>
        </div>
        <h1>{insight.answerText}</h1>
        <div className={styles.authorLine}>
          <Avatar src={author.avatarUrl} alt="" size="lg" className={styles.avatar} />
          <div>
            <strong>{author.displayName}</strong>
            <span>
              {author.jobTitle} · {author.orgLevel}
            </span>
            <small>{author.experienceLine}</small>
          </div>
        </div>
        <div className={styles.detailActions}>
          <Link className={styles.primaryAction} href={author.profileUrl}>
            <span className="button-label">مشاهده تجربه</span>
          </Link>
          <span>{insight.canonicalUrl}</span>
        </div>
      </article>
    </PageContainer>
  );
}
