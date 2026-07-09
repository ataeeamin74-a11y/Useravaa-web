import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  buildCareerPathDescription,
  buildCareerPathMetadata,
  buildCareerPathTitle,
  getCareerPathAudienceTexts,
  getCareerPathMainDuties,
  getCareerPathSeoEntries,
  getCareerPathSeoEntryBySlug,
  getCareerPathSoftSkills,
  getCareerPathTechnicalSkills,
  getCareerPathTools,
  getRelatedCareerPathSeoEntries
} from "@/features/career/career-path-seo";
import styles from "./CareerPathSeoPage.module.css";

type CareerPathSeoPageProps = Readonly<{
  params: Promise<Readonly<{ slug: string }>>;
}>;

export function generateStaticParams() {
  return getCareerPathSeoEntries().map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata({ params }: CareerPathSeoPageProps): Promise<Metadata> {
  const { slug } = await params;
  const entry = getCareerPathSeoEntryBySlug(slug);
  if (!entry) return { title: "مسیر شغلی پیدا نشد | Useravaa" };

  return {
    ...buildCareerPathMetadata(entry),
    robots: {
      index: true,
      follow: true
    }
  };
}

function sentenceList(items: readonly string[]) {
  return new Intl.ListFormat("fa-IR", { style: "long", type: "conjunction" }).format(items);
}

export default async function CareerPathSeoPage({ params }: CareerPathSeoPageProps) {
  const { slug } = await params;
  const entry = getCareerPathSeoEntryBySlug(slug);
  if (!entry) notFound();

  const pathTitle = buildCareerPathTitle(entry.path);
  const description = buildCareerPathDescription(entry.path);
  const duties = getCareerPathMainDuties(entry.path);
  const audienceTexts = getCareerPathAudienceTexts(entry.path);
  const technicalSkills = getCareerPathTechnicalSkills(entry.path);
  const tools = getCareerPathTools(entry.path);
  const softSkills = getCareerPathSoftSkills(entry.path);
  const relatedEntries = getRelatedCareerPathSeoEntries(entry.path);
  const aboutText = duties.length
    ? `در داده‌های این مسیر، کارهایی مثل ${sentenceList(duties.slice(0, 3))} دیده می‌شود. این صفحه کمک می‌کند پیش از انتخاب، تصویر دقیق‌تری از کار روزمره و نیازهای این مسیر داشته باشی.`
    : audienceTexts[0];
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `مسیر شغلی ${pathTitle}`,
    description,
    url: entry.canonicalUrl,
    inLanguage: "fa-IR"
  };

  return (
    <article className={styles.page} aria-labelledby="career-path-seo-title">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <header className={styles.hero}>
        <p className={styles.eyebrow}>صفحه قابل اشتراک مسیر شغلی</p>
        <h1 id="career-path-seo-title" dir="auto">مسیر شغلی {pathTitle}</h1>
        <p className={styles.intro}>
          این صفحه کمک می‌کند مسیر شغلی {pathTitle} را با اطلاعاتی نزدیک به کار واقعی بررسی کنی؛
          از سطح‌های شغلی و مهارت‌ها تا ابزارها و مسیرهای مرتبط.
        </p>
        <div className={styles.actions} aria-label="اقدام‌های مسیر شغلی">
          <Link className={styles.primaryAction} href={entry.pwaHref}>بررسی این مسیر در Useravaa</Link>
          <Link className={styles.secondaryAction} href={entry.pwaHref}>ذخیره برای بررسی بیشتر</Link>
          <Link className={styles.secondaryAction} href={`/career/compare?path=${encodeURIComponent(entry.path.id)}`}>
            مقایسه با مسیرهای دیگر
          </Link>
        </div>
      </header>

      <section className={styles.section} aria-labelledby="career-path-about-title">
        <h2 id="career-path-about-title">این مسیر شغلی درباره چیست؟</h2>
        <p>{aboutText}</p>
      </section>

      <section className={styles.section} aria-labelledby="career-path-audience-title">
        <h2 id="career-path-audience-title">این مسیر برای چه کسی مناسب‌تر است؟</h2>
        <ul>
          {audienceTexts.map((text) => <li key={text}>{text}</li>)}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="career-path-levels-title">
        <h2 id="career-path-levels-title">سطح‌های شغلی این مسیر</h2>
        <ul className={styles.cardGrid}>
          {entry.path.cards.map((card) => (
            <li className={styles.levelCard} key={card.id}>
              <strong>{card.seniority}</strong>
              <span>{card.title}</span>
              {card.subtitle ? <span>{card.subtitle}</span> : null}
              {card.audienceText ? <p>{card.audienceText}</p> : null}
            </li>
          ))}
        </ul>
      </section>

      {technicalSkills.length ? (
        <section className={styles.section} aria-labelledby="career-path-skills-title">
          <h2 id="career-path-skills-title">مهارت‌های مهم این مسیر</h2>
          <ul className={styles.chipList}>
            {technicalSkills.map((skill) => <li key={skill}>{skill}</li>)}
          </ul>
        </section>
      ) : null}

      {tools.length ? (
        <section className={styles.section} aria-labelledby="career-path-tools-title">
          <h2 id="career-path-tools-title">ابزارها و تکنولوژی‌های رایج</h2>
          <ul className={styles.chipList}>
            {tools.map((tool) => <li key={tool}>{tool}</li>)}
          </ul>
        </section>
      ) : null}

      {softSkills.length ? (
        <section className={styles.section} aria-labelledby="career-path-soft-skills-title">
          <h2 id="career-path-soft-skills-title">مهارت‌های نرم مهم</h2>
          <ul className={styles.chipList}>
            {softSkills.map((skill) => <li key={skill}>{skill}</li>)}
          </ul>
        </section>
      ) : null}

      <section className={styles.section} aria-labelledby="career-path-related-title">
        <h2 id="career-path-related-title">مسیرهای مرتبط</h2>
        <div className={styles.relatedGrid}>
          {relatedEntries.map((relatedEntry) => (
            <Link className={styles.relatedCard} href={relatedEntry.pageHref} key={relatedEntry.slug}>
              <strong dir="auto">{buildCareerPathTitle(relatedEntry.path)}</strong>
              <span>{relatedEntry.path.generalCategory}</span>
            </Link>
          ))}
        </div>
      </section>
    </article>
  );
}
