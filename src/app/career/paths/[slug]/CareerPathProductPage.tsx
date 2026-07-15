import type { CareerIcon } from "@/features/career/CareerIcons";
import {
  BarChart3,
  BookmarkPlus,
  Bot,
  BriefcaseBusiness,
  Code2,
  HeartHandshake,
  MessageCircleQuestion,
  PenTool,
  ShieldAlert,
  Sparkles,
  TimerReset,
  TriangleAlert,
  Users,
  Wrench
} from "@/features/career/CareerIcons";
import type { CareerPathSeoEntry } from "@/features/career/career-path-seo";
import { buildCareerPathTitle } from "@/features/career/career-path-seo";
import { buildCareerPathProductContent, type Tone } from "@/features/career/career-path-page-content";
import {
  CareerPathCompareAction,
  CareerPathSaveAction,
  CareerPathViewTracker
} from "./CareerPathClientActions";
import { CareerPathHeroMascot, CareerPathSectionImage } from "./CareerPathMascotScene";
import { CareerPathRelatedPaths } from "./CareerPathRelatedPaths";
import { CareerPathSectionNav } from "./CareerPathSectionNav";
import { CareerPathStickyActions } from "./CareerPathStickyActions";
import styles from "./CareerPathSeoPage.module.css";

type CareerPathProductPageProps = Readonly<{
  entry: CareerPathSeoEntry;
}>;

function toneClass(tone: Tone) {
  return {
    blue: styles.toneBlue,
    teal: styles.toneTeal,
    yellow: styles.toneYellow,
    persimmon: styles.tonePersimmon
  }[tone];
}

function UiIcon({
  icon: Icon,
  tone,
  compact = false
}: Readonly<{
  icon: CareerIcon;
  tone: Tone;
  compact?: boolean;
}>) {
  return (
    <span
      className={`${styles.iconBubble} ${compact ? styles.iconBubbleCompact : ""} ${toneClass(tone)}`}
      data-career-ui-icon
      aria-hidden="true"
    >
      <Icon size={compact ? 15 : 18} />
    </span>
  );
}

function SectionHeader({
  id,
  label,
  title,
  description,
  icon,
  tone
}: Readonly<{
  id: string;
  label: string;
  title: string;
  description?: string;
  icon: CareerIcon;
  tone: Tone;
}>) {
  return (
    <div className={styles.sectionHeader}>
      <div className={styles.sectionHeading}>
        <UiIcon icon={icon} tone={tone} compact />
        <div>
          <p className={styles.sectionLabel}>{label}</p>
          <h2 id={id}>{title}</h2>
        </div>
      </div>
      {description ? <p className={styles.sectionDescription}>{description}</p> : null}
    </div>
  );
}

function fitDimensionIcon(label: string): CareerIcon {
  if (label.includes("آدم")) return Users;
  if (label.includes("ابزار")) return Wrench;
  if (label.includes("خلاقیت")) return PenTool;
  return BarChart3;
}

const decisionIcons = [BriefcaseBusiness, HeartHandshake, TriangleAlert] as const;
const hardshipIcons = [TriangleAlert, TimerReset, ShieldAlert] as const;

export function CareerPathProductPage({ entry }: CareerPathProductPageProps) {
  const content = buildCareerPathProductContent(entry);
  const pathTitle = buildCareerPathTitle(entry.path);
  const realityModules = [
    {
      title: "روز کاری واقعی",
      icon: BriefcaseBusiness,
      tone: "teal" as const,
      content: <ul>{content.reality.workday.map((item) => <li key={item}>{item}</li>)}</ul>
    },
    {
      title: "مهم‌ترین مهارت‌های نرم",
      icon: HeartHandshake,
      tone: "yellow" as const,
      content: <div className={styles.tagGroup}>{content.reality.softSkills.map((item) => <span key={item}>{item}</span>)}</div>
    },
    {
      title: "مهم‌ترین مهارت‌های تخصصی",
      icon: Code2,
      tone: "blue" as const,
      content: <div className={styles.tagGroup}>{content.reality.technicalSkills.map((item) => <span key={item}>{item}</span>)}</div>
    },
    {
      title: "مهم‌ترین ابزارها",
      icon: Wrench,
      tone: "teal" as const,
      content: <div className={styles.tagGroup}>{content.reality.tools.map((item) => <span key={item}>{item}</span>)}</div>
    }
  ];
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `مسیر شغلی ${pathTitle}`,
    description: `صفحه تصمیم‌گیری مسیر شغلی ${pathTitle} در Useravaa`,
    url: entry.canonicalUrl,
    inLanguage: "fa-IR"
  };

  return (
    <main className={styles.page} data-career-paths data-career-path-product-screen aria-labelledby="career-path-seo-title">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <CareerPathViewTracker pathId={entry.path.id} pathTitle={pathTitle} />

      <header className={styles.hero} data-career-product-hero>
        <p className={styles.eyebrow}>
          <UiIcon icon={Sparkles} tone="teal" compact />
          <span>صفحه تصمیم مسیر شغلی</span>
        </p>
        <CareerPathHeroMascot slug={entry.slug} pathTitle={pathTitle} profile={content.visualProfile} />
        <div className={styles.heroCopy}>
          <h1 id="career-path-seo-title" dir="auto">مسیر شغلی {pathTitle}</h1>
          <p className={styles.heroDescriptor}>{content.heroDescriptor}</p>
          <p className={styles.intro}>{content.intro}</p>
          <div className={styles.actions} aria-label="اقدام‌های مسیر شغلی">
            <CareerPathSaveAction
              pathId={entry.path.id}
              className={styles.primaryAction}
              label={content.finalCtaText}
              heroPrimary
            />
            <CareerPathCompareAction
              pathId={entry.path.id}
              slug={entry.slug}
              className={styles.secondaryAction}
            />
          </div>
        </div>
        <div className={styles.decisionSummary} aria-label="سه نکته تصمیم مسیر شغلی">
          {content.decisionCards.map((card, index) => (
            <div className={`${styles.decisionItem} ${toneClass(card.tone)}`} key={card.label}>
              <UiIcon icon={decisionIcons[index] ?? Sparkles} tone={card.tone} />
              <div>
                <span>{card.label}</span>
                <strong>{card.value}</strong>
              </div>
            </div>
          ))}
        </div>
      </header>

      <CareerPathSectionNav />

      <section id="career-path-fit" className={`${styles.section} ${styles.fitSection}`} data-career-section="fit" data-career-fit-section aria-labelledby="career-path-fit-title">
        <div className={styles.sectionLead}>
          <SectionHeader
            id="career-path-fit-title"
            label="تناسب سریع"
            title="این شغل مناسب منه؟"
            icon={Users}
            tone="teal"
          />
          <CareerPathSectionImage
            slug={entry.slug}
            pathTitle={pathTitle}
            profile={content.visualProfile}
            slot="fit"
            alt={`تصویر تناسب شغلی مسیر ${pathTitle}`}
          />
        </div>
        <dl className={styles.fitDimensions}>
          {content.fitDimensions.map((dimension) => (
            <div className={`${styles.fitDimension} ${toneClass(dimension.tone)}`} key={dimension.label}>
              <dt>
                <UiIcon icon={fitDimensionIcon(dimension.label)} tone={dimension.tone} compact />
                <span>{dimension.label}</span>
              </dt>
              <dd>{dimension.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section id="career-path-realities" className={`${styles.section} ${styles.realitySection}`} data-career-section="realities" data-career-realities-section aria-labelledby="career-path-realities-title">
        <div className={styles.sectionLead}>
          <SectionHeader
            id="career-path-realities-title"
            label="داخل کار"
            title="واقعیت‌های شغلی"
            icon={BriefcaseBusiness}
            tone="yellow"
          />
          <CareerPathSectionImage
            slug={entry.slug}
            pathTitle={pathTitle}
            profile={content.visualProfile}
            slot="jobReality"
            alt={`تصویر واقعیت‌های شغلی مسیر ${pathTitle}`}
          />
        </div>
        <div className={styles.realityList}>
          {realityModules.map((module) => (
            <article className={`${styles.realityRow} ${toneClass(module.tone)}`} key={module.title}>
              <h3>
                <UiIcon icon={module.icon} tone={module.tone} compact />
                <span>{module.title}</span>
              </h3>
              {module.content}
            </article>
          ))}
        </div>
      </section>

      <section id="career-path-hardships" className={`${styles.section} ${styles.hardshipSection}`} data-career-section="hardships" data-career-hardships-section aria-labelledby="career-path-hardships-title">
        <div className={styles.sectionLead}>
          <SectionHeader
            id="career-path-hardships-title"
            label="واقعیت سخت"
            title="سختی‌ها"
            icon={TriangleAlert}
            tone="persimmon"
          />
          <CareerPathSectionImage
            slug={entry.slug}
            pathTitle={pathTitle}
            profile={content.visualProfile}
            slot="difficulties"
            alt={`تصویر سختی‌های مسیر ${pathTitle}`}
          />
        </div>
        <div className={styles.hardshipRail}>
          {content.hardships.map((hardship, index) => (
            <article className={`${styles.hardshipRow} ${toneClass(hardship.tone)}`} key={hardship.title}>
              <h3>
                <UiIcon icon={hardshipIcons[index] ?? TriangleAlert} tone={hardship.tone} compact />
                <span>{hardship.title}</span>
              </h3>
              <p>{hardship.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="career-path-intelligence" className={`${styles.section} ${styles.intelligenceSection}`} data-career-section="intelligence" data-career-intelligence-section aria-labelledby="career-path-intelligence-title">
        <div className={styles.sectionLead}>
          <SectionHeader
            id="career-path-intelligence-title"
            label="آینده نزدیک"
            title="فرصت‌ها و تهدیدهای هوش مصنوعی"
            icon={Bot}
            tone="blue"
          />
          <CareerPathSectionImage
            slug={entry.slug}
            pathTitle={pathTitle}
            profile={content.visualProfile}
            slot="aiImpact"
            alt={`تصویر اثر هوش مصنوعی بر مسیر ${pathTitle}`}
          />
        </div>
        <div className={styles.intelligenceCompare}>
          <article className={styles.intelligenceCard}>
            <h3>
              <UiIcon icon={Sparkles} tone="teal" compact />
              <span>هوش مصنوعی چه چیزهایی را آسان‌تر می‌کند؟</span>
            </h3>
            <ul>{content.intelligence.easier.map((item) => <li key={item}>{item}</li>)}</ul>
          </article>
          <article className={styles.intelligenceCardHarder}>
            <h3>
              <UiIcon icon={ShieldAlert} tone="persimmon" compact />
              <span>هوش مصنوعی چه چیزهایی را سخت‌تر یا حساس‌تر می‌کند؟</span>
            </h3>
            <ul>{content.intelligence.harder.map((item) => <li key={item}>{item}</li>)}</ul>
          </article>
        </div>
      </section>

      <section id="career-path-interview" className={`${styles.section} ${styles.interviewSection}`} data-career-section="interview" data-career-interview-section aria-labelledby="career-path-interview-title">
        <div className={styles.sectionLead}>
          <SectionHeader
            id="career-path-interview-title"
            label="مصاحبه شغلی"
            title="سوالات متداول مصاحبه شغلی"
            icon={MessageCircleQuestion}
            tone="yellow"
          />
          <CareerPathSectionImage
            slug={entry.slug}
            pathTitle={pathTitle}
            profile={content.visualProfile}
            slot="interviewQuestions"
            alt={`تصویر سوالات مصاحبه شغلی مسیر ${pathTitle}`}
          />
        </div>
        <div className={styles.interviewList}>
          {content.interviewQuestions.map((question, index) => (
            <article className={styles.interviewItem} data-interview-question key={question}>
              <span>{(index + 1).toLocaleString("fa-IR")}</span>
              <h3 dir="rtl">{question}</h3>
            </article>
          ))}
        </div>
      </section>

      <section className={`${styles.section} ${styles.finalSection}`} data-career-final-section aria-labelledby="career-path-final-title">
        <SectionHeader
          id="career-path-final-title"
          label="قدم بعدی"
          title="با این مسیر شغلی چه کار کنم؟"
          description="اگر هنوز دو یا سه گزینه در ذهنت داری، این مسیر را نگه دار و بعد کنار گزینه‌های دیگر مقایسه کن."
          icon={BookmarkPlus}
          tone="blue"
        />
        <div className={styles.finalActions}>
          <CareerPathSaveAction
            pathId={entry.path.id}
            className={styles.primaryAction}
            label={content.finalCtaText}
          />
          <CareerPathCompareAction
            pathId={entry.path.id}
            slug={entry.slug}
            className={styles.secondaryAction}
          />
        </div>
      </section>

      <CareerPathRelatedPaths entry={entry} />

      <CareerPathStickyActions
        pathId={entry.path.id}
        slug={entry.slug}
        saveLabel={content.finalCtaText}
      />
    </main>
  );
}
