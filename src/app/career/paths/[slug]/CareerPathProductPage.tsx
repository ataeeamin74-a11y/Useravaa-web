import Link from "next/link";
import type { CareerPathSeoEntry } from "@/features/career/career-path-seo";
import { buildCareerPathTitle } from "@/features/career/career-path-seo";
import { buildCareerPathProductContent, type Tone } from "@/features/career/career-path-page-content";
import type { CareerPathVisualProfile } from "@/features/career/career-path-visuals";
import { CareerPathMascotScene } from "./CareerPathMascotScene";
import styles from "./CareerPathSeoPage.module.css";

type CareerPathProductPageProps = Readonly<{
  entry: CareerPathSeoEntry;
}>;

type SectionVisualVariant = "fit" | "reality" | "hardships" | "intelligence" | "interview";

function compareHref(currentPathId: string) {
  return `/career/compare?path=${encodeURIComponent(currentPathId)}`;
}

function toneClass(tone: Tone) {
  return {
    blue: styles.toneBlue,
    teal: styles.toneTeal,
    yellow: styles.toneYellow,
    persimmon: styles.tonePersimmon
  }[tone];
}

function SectionVisual({
  variant,
  profile
}: Readonly<{
  variant: SectionVisualVariant;
  profile: CareerPathVisualProfile;
}>) {
  return (
    <div
      className={`${styles.sectionVisual} ${styles[`visual${variant[0].toUpperCase()}${variant.slice(1)}`]}`}
      data-section-visual={variant}
      data-scene={profile.sceneType}
      aria-hidden="true"
    >
      <span className={styles.visualSignal} />
      <span className={styles.visualCard} data-card="1">{profile.propLabels[0]}</span>
      <span className={styles.visualCard} data-card="2">{profile.propLabels[1]}</span>
      <span className={styles.visualCard} data-card="3">{profile.propLabels[2]}</span>
      <span className={styles.visualPath} />
    </div>
  );
}

export function CareerPathProductPage({ entry }: CareerPathProductPageProps) {
  const content = buildCareerPathProductContent(entry);
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
          <p className={styles.heroDescriptor}>{content.heroDescriptor}</p>
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
            <Link className={styles.primaryAction} href={entry.pwaHref}>{content.finalCtaText}</Link>
            <Link className={styles.secondaryAction} href={compareHref(entry.path.id)}>مقایسه با مسیرهای دیگر</Link>
          </div>
        </div>
        <CareerPathMascotScene pathTitle={pathTitle} profile={content.visualProfile} />
      </header>

      <section className={styles.section} data-career-fit-section aria-labelledby="career-path-fit-title">
        <div className={styles.sectionHeader}>
          <span>تناسب سریع</span>
          <h2 id="career-path-fit-title">این شغل مناسب منه؟</h2>
          <p>چهار بُعد ساده برای اینکه بدون تست شخصیت و عددسازی، حس اولیه‌ات را با واقعیت کار مقایسه کنی.</p>
        </div>
        <SectionVisual variant="fit" profile={content.visualProfile} />
        <dl className={styles.fitDimensions}>
          {content.fitDimensions.map((dimension) => (
            <div className={`${styles.fitDimension} ${toneClass(dimension.tone)}`} key={dimension.label}>
              <dt>{dimension.label}</dt>
              <dd>{dimension.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={styles.section} data-career-realities-section aria-labelledby="career-path-realities-title">
        <div className={styles.sectionHeader}>
          <span>داخل کار</span>
          <h2 id="career-path-realities-title">واقعیت‌های شغلی</h2>
          <p>روزمره، مهارت‌ها و ابزارها در یک قاب کوتاه؛ نه یک مقاله طولانی.</p>
        </div>
        <SectionVisual variant="reality" profile={content.visualProfile} />
        <div className={styles.realityGrid}>
          <article className={styles.realityCard}>
            <h3>روز کاری واقعی</h3>
            <ul>{content.reality.workday.map((item) => <li key={item}>{item}</li>)}</ul>
          </article>
          <article className={styles.realityCard}>
            <h3>مهم‌ترین مهارت‌های نرم</h3>
            <div className={styles.tagGroup}>{content.reality.softSkills.map((item) => <span key={item}>{item}</span>)}</div>
          </article>
          <article className={styles.realityCard}>
            <h3>مهم‌ترین مهارت‌های تخصصی</h3>
            <div className={styles.tagGroup}>{content.reality.technicalSkills.map((item) => <span key={item}>{item}</span>)}</div>
          </article>
          <article className={styles.realityCard}>
            <h3>مهم‌ترین ابزارها</h3>
            <div className={styles.tagGroup}>{content.reality.tools.map((item) => <span key={item}>{item}</span>)}</div>
          </article>
        </div>
      </section>

      <section className={styles.section} data-career-hardships-section aria-labelledby="career-path-hardships-title">
        <div className={styles.sectionHeader}>
          <span>واقعیت سخت</span>
          <h2 id="career-path-hardships-title">سختی‌ها</h2>
          <p>سختی‌ها برای ترساندن نیستند؛ برای این‌اند که قبل از انتخاب، تصویر کامل‌تری داشته باشی.</p>
        </div>
        <SectionVisual variant="hardships" profile={content.visualProfile} />
        <div className={styles.hardshipGrid}>
          {content.hardships.map((hardship) => (
            <article className={`${styles.hardshipCard} ${toneClass(hardship.tone)}`} key={hardship.title}>
              <h3>{hardship.title}</h3>
              <p>{hardship.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section} data-career-intelligence-section aria-labelledby="career-path-intelligence-title">
        <div className={styles.sectionHeader}>
          <span>آینده نزدیک</span>
          <h2 id="career-path-intelligence-title">فرصت‌ها و تهدیدهای هوش مصنوعی</h2>
          <p>نگاه آرام و عملی به اینکه چه چیزهایی سریع‌تر می‌شود و کجا قضاوت انسانی هنوز تعیین‌کننده است.</p>
        </div>
        <SectionVisual variant="intelligence" profile={content.visualProfile} />
        <div className={styles.intelligenceGrid}>
          <article className={styles.intelligenceCard}>
            <h3>هوش مصنوعی چه چیزهایی را آسان‌تر می‌کند؟</h3>
            <ul>{content.intelligence.easier.map((item) => <li key={item}>{item}</li>)}</ul>
          </article>
          <article className={styles.intelligenceCardHarder}>
            <h3>هوش مصنوعی چه چیزهایی را سخت‌تر می‌کند؟</h3>
            <ul>{content.intelligence.harder.map((item) => <li key={item}>{item}</li>)}</ul>
          </article>
        </div>
        <p className={styles.judgmentNote}>{content.intelligence.judgment}</p>
      </section>

      <section className={styles.section} data-career-interview-section aria-labelledby="career-path-interview-title">
        <div className={styles.sectionHeader}>
          <span>مصاحبه شغلی</span>
          <h2 id="career-path-interview-title">سوالات متداول مصاحبه شغلی</h2>
          <p>پنج سؤال عملی که کمک می‌کند بفهمی در شروع این مسیر شغلی از تو چه انتظاری می‌رود.</p>
        </div>
        <SectionVisual variant="interview" profile={content.visualProfile} />
        <div className={styles.interviewList}>
          {content.interviewQuestions.map((item, index) => (
            <details className={styles.interviewItem} data-interview-question open={index === 0} key={item.question}>
              <summary>{item.question}</summary>
              <p>{item.hint}</p>
            </details>
          ))}
        </div>
      </section>

      <section className={`${styles.section} ${styles.finalSection}`} aria-labelledby="career-path-final-title">
        <div className={styles.sectionHeader}>
          <span>قدم بعدی</span>
          <h2 id="career-path-final-title">با این مسیر شغلی چه کار کنم؟</h2>
          <p>اگر هنوز دو یا سه گزینه در ذهنت داری، این مسیر را نگه دار و بعد کنار گزینه‌های دیگر مقایسه کن.</p>
        </div>
        <div className={styles.finalActions}>
          <Link className={styles.primaryAction} href={entry.pwaHref}>{content.finalCtaText}</Link>
          <Link className={styles.secondaryAction} href={compareHref(entry.path.id)}>مقایسه با مسیرهای دیگر</Link>
          <Link className={styles.tertiaryAction} href={entry.pwaHref}>بررسی این مسیر در Useravaa</Link>
        </div>
      </section>

      <aside className={styles.stickyBar} aria-label="اقدام سریع مسیر شغلی">
        <Link className={styles.primaryAction} href={entry.pwaHref}>{content.finalCtaText}</Link>
        <Link className={styles.secondaryAction} href={compareHref(entry.path.id)}>مقایسه</Link>
      </aside>
    </main>
  );
}
