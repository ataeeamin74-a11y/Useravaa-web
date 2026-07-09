import Link from "next/link";
import type { CareerPathSeoEntry } from "@/features/career/career-path-seo";
import { buildCareerPathTitle, getRelatedCareerPathSeoEntries } from "@/features/career/career-path-seo";
import { buildCareerPathProductContent } from "@/features/career/career-path-page-content";
import { getCareerPathVisualProfile } from "@/features/career/career-path-visuals";
import { CareerPathMascotScene } from "./CareerPathMascotScene";
import styles from "./CareerPathSeoPage.module.css";

type CareerPathProductPageProps = Readonly<{
  entry: CareerPathSeoEntry;
}>;

function compareHref(currentPathId: string, relatedPathId?: string) {
  const params = relatedPathId
    ? `path=${encodeURIComponent(currentPathId)}&path=${encodeURIComponent(relatedPathId)}`
    : `path=${encodeURIComponent(currentPathId)}`;

  return `/career/compare?${params}`;
}

function toneClass(tone: "blue" | "teal" | "yellow" | "persimmon") {
  return {
    blue: styles.toneBlue,
    teal: styles.toneTeal,
    yellow: styles.toneYellow,
    persimmon: styles.tonePersimmon
  }[tone];
}

export function CareerPathProductPage({ entry }: CareerPathProductPageProps) {
  const relatedEntries = getRelatedCareerPathSeoEntries(entry.path, 4);
  const relatedTitles = relatedEntries.map((relatedEntry) => buildCareerPathTitle(relatedEntry.path));
  const content = buildCareerPathProductContent(entry, relatedTitles);
  const pathTitle = buildCareerPathTitle(entry.path);
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `مسیر شغلی ${pathTitle}`,
    description: `صفحه تصمیم‌گیری مسیر شغلی ${pathTitle} در Useravaa`,
    url: entry.canonicalUrl,
    inLanguage: "fa-IR"
  };

  return (
    <main className={styles.page} data-career-path-product-screen aria-labelledby="career-path-seo-title">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <header className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>صفحه تصمیم مسیر شغلی</p>
          <h1 id="career-path-seo-title" dir="auto">مسیر شغلی {pathTitle}</h1>
          <p className={styles.intro}>{content.intro}</p>
          <div className={styles.decisionCards} aria-label="سه نکته تصمیم مسیر شغلی">
            {content.decisionCards.map((card) => (
              <article className={`${styles.decisionCard} ${toneClass(card.tone)}`} key={card.label}>
                <span>{card.label}</span>
                <strong>{card.value}</strong>
              </article>
            ))}
          </div>
          <div className={styles.actions} aria-label="اقدام‌های مسیر شغلی">
            <Link className={styles.primaryAction} href={entry.pwaHref}>ذخیره برای بررسی</Link>
            <Link className={styles.secondaryAction} href={compareHref(entry.path.id)}>مقایسه با مسیرهای دیگر</Link>
            <Link className={styles.tertiaryAction} href="/career">بازگشت به مسیرها</Link>
          </div>
        </div>
        <CareerPathMascotScene pathTitle={pathTitle} profile={content.visualProfile} />
      </header>

      <section className={styles.section} aria-labelledby="career-path-snapshot-title">
        <div className={styles.sectionHeader}>
          <span>در یک نگاه</span>
          <h2 id="career-path-snapshot-title">در یک نگاه</h2>
          <p>یک خلاصه کوتاه برای اینکه قبل از اسکرول طولانی، جنس این مسیر شغلی را بفهمی.</p>
        </div>
        <dl className={styles.snapshotGrid}>
          {content.snapshotRows.map((row) => (
            <div className={`${styles.snapshotRow} ${toneClass(row.tone)}`} key={row.label}>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={styles.section} aria-labelledby="career-path-fit-title">
        <div className={styles.sectionHeader}>
          <span>تناسب سریع</span>
          <h2 id="career-path-fit-title">آیا این مسیر شغلی به تو نزدیک است؟</h2>
          <p>این بخش نتیجه قطعی نمی‌دهد؛ فقط چند نشانه عملی برای بررسی سریع است.</p>
        </div>
        <div className={styles.fitGrid}>
          <article className={styles.fitCard}>
            <h3>احتمالاً به تو می‌خورد اگر...</h3>
            <ul>{content.fitBullets.map((item) => <li key={item}>{item}</li>)}</ul>
          </article>
          <article className={styles.frictionCard}>
            <h3>احتمالاً اذیتت می‌کند اگر...</h3>
            <ul>{content.frictionBullets.map((item) => <li key={item}>{item}</li>)}</ul>
          </article>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="career-path-workday-title">
        <div className={styles.sectionHeader}>
          <span>روز کاری واقعی</span>
          <h2 id="career-path-workday-title">روز کاری واقعی</h2>
          <p>سه زاویه کوتاه برای اینکه کار را قابل تصور کنی، نه فقط قابل خواندن.</p>
        </div>
        <div className={styles.workdayGrid}>
          {content.workdayCards.map((card) => (
            <article className={`${styles.workdayCard} ${toneClass(card.tone)}`} key={card.title}>
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={`${styles.section} ${styles.startSection}`} aria-labelledby="career-path-start-title">
        <div className={styles.sectionHeader}>
          <span>شروع کم‌ریسک</span>
          <h2 id="career-path-start-title">شروع کم‌ریسک</h2>
          <p>قبل از تصمیم بزرگ، این مسیر شغلی را با یک آزمایش کوچک و واقعی لمس کن.</p>
        </div>
        <ol className={styles.startSteps}>
          {content.startSteps.map((step, index) => (
            <li className={`${styles.startStep} ${toneClass(step.tone)}`} key={step.title}>
              <span>{(index + 1).toLocaleString("fa-IR")}</span>
              <strong>{step.title}</strong>
              <p>{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.section} aria-labelledby="career-path-compare-title">
        <div className={styles.sectionHeader}>
          <span>کاهش سردرگمی</span>
          <h2 id="career-path-compare-title">مسیرهای شغلی نزدیک را اشتباه نگیر</h2>
          <p>چند گزینه نزدیک را کنار این مسیر شغلی ببین تا تفاوت اصلی روشن‌تر شود.</p>
        </div>
        <div className={styles.relatedGrid}>
          {relatedEntries.map((relatedEntry) => {
            const relatedProfile = getCareerPathVisualProfile(relatedEntry.path);
            return (
              <article className={styles.relatedCard} key={relatedEntry.slug}>
                <strong dir="auto">{buildCareerPathTitle(relatedEntry.path)}</strong>
                <p><span>فرق اصلی</span>{relatedProfile.focusLabel}</p>
                <p><span>چرا ممکن است اشتباه شود</span>چون بخشی از فضای کاری یا ابزارها نزدیک است، اما فشار روزمره فرق دارد.</p>
                <Link href={compareHref(entry.path.id, relatedEntry.path.id)}>مقایسه</Link>
              </article>
            );
          })}
        </div>
      </section>

      <section className={`${styles.section} ${styles.experienceSection}`} aria-labelledby="career-path-experience-title">
        <div className={styles.experienceHeader}>
          <div className={styles.sectionHeader}>
            <span>قبل از تصمیم</span>
            <h2 id="career-path-experience-title">قبل از تصمیم، این‌ها را از کسی که این مسیر را رفته بپرس</h2>
            <p>ارزش Useravaa اینجاست: سؤال خوب قبل از انتخاب، جلوی برداشت سطحی را می‌گیرد.</p>
          </div>
          <CareerPathMascotScene pathTitle={pathTitle} profile={content.visualProfile} compact />
        </div>
        <div className={styles.questionGrid}>
          {content.experienceQuestions.map((question) => (
            <article className={styles.questionCard} key={question}>{question}</article>
          ))}
        </div>
        <Link className={styles.experienceCta} href={entry.pwaHref}>قبل از تصمیم، تجربه واقعی این مسیر را ببین</Link>
      </section>

      <section className={styles.section} aria-labelledby="career-path-faq-title">
        <div className={styles.sectionHeader}>
          <span>پرسش‌های مهم</span>
          <h2 id="career-path-faq-title">سؤال‌های قبل از انتخاب این مسیر شغلی</h2>
          <p>پاسخ‌ها کوتاه و قابل خواندن هستند تا هم برای آدم‌ها روشن باشند و هم برای موتور جست‌وجو.</p>
        </div>
        <div className={styles.faqList}>
          {content.faqItems.map((item, index) => (
            <details className={styles.faqItem} open={index === 0} key={item.question}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <aside className={styles.stickyBar} aria-label="اقدام سریع مسیر شغلی">
        <Link className={styles.primaryAction} href={entry.pwaHref}>ذخیره برای بررسی</Link>
        <Link className={styles.secondaryAction} href={compareHref(entry.path.id)}>مقایسه</Link>
      </aside>
    </main>
  );
}
