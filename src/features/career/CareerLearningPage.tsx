"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { CSSProperties } from "react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CalendarClock,
  Check,
  ChevronLeft,
  CircleDollarSign,
  CircleDot,
  ExternalLink,
  Filter,
  GitCompareArrows,
  GraduationCap,
  Layers3,
  ListChecks,
  Search,
  Sparkles,
  Users,
  Wrench,
  X
} from "./CareerIcons";
import {
  CAREER_COURSE_COMPARE_LIMIT,
  buildCareerLearningUrl,
  formatCourseVerifiedAt,
  getCareerLearningCourseCount,
  getCareerLearningCoverage,
  getCareerLearningLanguageLabel,
  getCareerLearningProvider,
  getCoursePricePresentation,
  getPersonalizedLearningSkills,
  getTrustedProviderLinks,
  normalizeCareerLearningQuery,
  readCareerLearningQuery,
  sanitizeComparedCourseIds,
  toggleComparedCourseId,
  type CareerLearningCourse,
  type CareerLearningLanguageQuery,
  type CareerLearningProviderId,
  type CareerLearningQueryState
} from "./career-learning";
import { trackCareerEvent } from "./career-events";
import { useSavedCareerPaths } from "./career-saved-paths";
import {
  getSkillById,
  searchSkillCatalog,
  skillTypeLabels,
  type SkillCatalogItem,
  type SkillType
} from "./skill-catalog";
import styles from "./CareerLearningPage.module.css";

type LearningMode = "personalized" | "all";
type SkillFilter = SkillType | "all";
type CourseLanguageFilter = "all" | CareerLearningLanguageQuery;
type CourseLoadState = Readonly<{
  skillId: string;
  status: "idle" | "loading" | "ready" | "error";
  courses: readonly CareerLearningCourse[];
}>;

const skillFilters: readonly Readonly<{ id: SkillFilter; label: string }>[] = [
  { id: "all", label: "همه" },
  { id: "soft", label: "نرم" },
  { id: "foundational", label: "پایه" },
  { id: "specialized", label: "تخصصی" },
  { id: "tool", label: "ابزار" }
];

const courseLanguageFilters: readonly Readonly<{
  id: CourseLanguageFilter;
  label: string;
}>[] = [
  { id: "all", label: "همه" },
  { id: "fa", label: "فارسی" },
  { id: "en", label: "انگلیسی" }
];

const typeIcons = {
  soft: Users,
  foundational: Layers3,
  specialized: ListChecks,
  tool: Wrench
} as const;

function skillTypeClass(type: SkillType) {
  return {
    soft: styles.typeSoft,
    foundational: styles.typeFoundational,
    specialized: styles.typeSpecialized,
    tool: styles.typeTool
  }[type];
}

function formatRating(course: CareerLearningCourse) {
  if (!course.rating || !course.ratingCount) return undefined;
  return `${course.rating.toLocaleString("fa-IR")} از ۵ · ${course.ratingCount.toLocaleString("fa-IR")} امتیاز`;
}

function certificateLabel(course: CareerLearningCourse) {
  if (course.certificate === "available") return "گواهی دارد";
  if (course.certificate === "unavailable") return "بدون گواهی";
  return undefined;
}

function comparablePriceLabel(course: CareerLearningCourse) {
  return course.price.kind === "unknown"
    ? undefined
    : getCoursePricePresentation(course).label;
}

function SkillRow({
  skill,
  pathTitles,
  onOpen
}: Readonly<{
  skill: SkillCatalogItem;
  pathTitles?: readonly string[];
  onOpen: (skill: SkillCatalogItem) => void;
}>) {
  const Icon = typeIcons[skill.type];
  const courseCount = getCareerLearningCourseCount(skill.id);

  return (
    <button
      type="button"
      className={styles.skillRow}
      onClick={() => onOpen(skill)}
      data-learning-skill={skill.id}
    >
      <span className={`${styles.skillIcon} ${skillTypeClass(skill.type)}`} aria-hidden>
        <Icon size={19} />
      </span>
      <span className={styles.skillIdentity}>
        <strong>{skill.titleFa}</strong>
        <small dir="ltr">{skill.titleEn}</small>
        {pathTitles?.length ? (
          <span className={styles.pathReason}>
            برای {pathTitles.slice(0, 2).join(" و ")}
            {pathTitles.length > 2 ? ` و ${pathTitles.length - 2} مسیر دیگر` : ""}
          </span>
        ) : null}
      </span>
      <span className={courseCount ? styles.courseCount : styles.sourceCount}>
        {courseCount
          ? `${courseCount.toLocaleString("fa-IR")} دوره`
          : "منابع یادگیری"}
      </span>
      <ChevronLeft size={18} aria-hidden />
    </button>
  );
}

function CourseRow({
  course,
  skill,
  selected,
  comparisonFull,
  onToggleCompare
}: Readonly<{
  course: CareerLearningCourse;
  skill: SkillCatalogItem;
  selected: boolean;
  comparisonFull: boolean;
  onToggleCompare: (courseId: string) => void;
}>) {
  const provider = getCareerLearningProvider(course.provider);
  const price = getCoursePricePresentation(course);
  const rating = formatRating(course);
  const certificate = certificateLabel(course);
  const hasPrice = course.price.kind !== "unknown";
  const hasFacts = hasPrice || course.durationLabel || course.practiceLabel || course.instructor;

  return (
    <article className={selected ? styles.courseRowSelected : styles.courseRow} data-learning-course={course.id}>
      <div className={styles.courseTopline}>
        <span className={styles.providerBadge}>{provider?.label ?? course.provider}</span>
        <button
          type="button"
          className={selected ? styles.compareToggleActive : styles.compareToggle}
          aria-pressed={selected}
          aria-label={selected
            ? `لغو انتخاب ${course.title} برای مقایسه`
            : `افزودن ${course.title} به مقایسه`}
          disabled={!selected && comparisonFull}
          onClick={() => onToggleCompare(course.id)}
        >
          <GitCompareArrows size={16} aria-hidden />
          <span>{selected ? "در مقایسه" : "مقایسه"}</span>
        </button>
      </div>

      <div className={styles.courseHeading}>
        <h3 dir="auto">{course.title}</h3>
        {course.selectionNote ? <p>{course.selectionNote}</p> : null}
      </div>

      {hasFacts ? <dl className={styles.courseFacts}>
        {hasPrice ? <div>
          <dt><CircleDollarSign size={16} aria-hidden /> هزینه</dt>
          <dd className={price.isFresh ? styles.freshPrice : undefined}>
            {price.previousLabel ? <del>{price.previousLabel}</del> : null}
            <span>{price.label}</span>
          </dd>
        </div> : null}
        {course.durationLabel ? (
          <div>
            <dt><CalendarClock size={16} aria-hidden /> زمان</dt>
            <dd>{course.durationLabel}</dd>
          </div>
        ) : null}
        {course.practiceLabel ? (
          <div>
            <dt><ListChecks size={16} aria-hidden /> تمرین</dt>
            <dd>{course.practiceLabel}</dd>
          </div>
        ) : null}
        {course.instructor ? (
          <div>
            <dt><GraduationCap size={16} aria-hidden /> مدرس</dt>
            <dd>{course.instructor}</dd>
          </div>
        ) : null}
      </dl> : null}

      {course.language || course.level || certificate ? (
        <div className={styles.courseMetaLine}>
          {course.language ? <span>{course.language}</span> : null}
          {course.level ? <span>{course.level}</span> : null}
          {certificate ? <span>{certificate}</span> : null}
        </div>
      ) : null}

      {rating || course.commentCount ? (
        <div className={styles.ratingLine}>
          {rating ? <span><Sparkles size={15} aria-hidden /> {rating}</span> : null}
          {course.commentCount ? <span>{course.commentCount.toLocaleString("fa-IR")} دیدگاه عمومی</span> : null}
        </div>
      ) : null}

      <div className={styles.courseActions}>
        <span className={styles.verifiedAt}>
          آخرین بررسی: {formatCourseVerifiedAt(course.price.verifiedAt)}
        </span>
        <a
          href={course.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackCareerEvent("career_learning_course_opened", {
            skillId: skill.id,
            provider: course.provider
          })}
        >
          دیدن در سایت اصلی <ExternalLink size={17} aria-hidden />
        </a>
      </div>
    </article>
  );
}

function ComparisonRow({
  label,
  values
}: Readonly<{ label: string; values: readonly (string | undefined)[] }>) {
  if (values.every((value) => !value)) return null;
  return (
    <div className={styles.comparisonRow}>
      <strong>{label}</strong>
      <div style={{ "--compare-columns": values.length } as CSSProperties}>
        {values.map((value, index) => <span dir="auto" key={`${label}-${index}`}>{value ?? "—"}</span>)}
      </div>
    </div>
  );
}

function CourseComparison({
  courses,
  skill,
  onRemove
}: Readonly<{
  courses: readonly CareerLearningCourse[];
  skill: SkillCatalogItem;
  onRemove: (courseId: string) => void;
}>) {
  if (courses.length < 2) return null;

  const values = (selector: (course: CareerLearningCourse) => string | undefined) => courses.map(selector);

  return (
    <section className={styles.comparison} id="course-comparison" aria-labelledby="course-comparison-title">
      <div className={styles.sectionHeading}>
        <span className={styles.sectionIcon}><GitCompareArrows size={21} aria-hidden /></span>
        <div>
          <p>مقایسهٔ رو‌در‌رو</p>
          <h3 id="course-comparison-title">کدام دوره برای تو مناسب‌تر است؟</h3>
        </div>
      </div>

      <div className={styles.comparisonTitles} style={{ "--compare-columns": courses.length } as CSSProperties}>
        {courses.map((course) => (
          <div key={course.id}>
            <strong dir="auto">{course.title}</strong>
            <button type="button" onClick={() => onRemove(course.id)} aria-label={`حذف ${course.title} از جدول مقایسه`}>
              <X size={16} aria-hidden />
            </button>
          </div>
        ))}
      </div>

      <div className={styles.comparisonRows}>
        <ComparisonRow label="سایت" values={values((course) => getCareerLearningProvider(course.provider)?.label ?? course.provider)} />
        <ComparisonRow label="قیمت" values={values(comparablePriceLabel)} />
        <ComparisonRow label="مدت" values={values((course) => course.durationLabel)} />
        <ComparisonRow label="تمرین" values={values((course) => course.practiceLabel)} />
        <ComparisonRow label="زبان" values={values((course) => course.language)} />
        <ComparisonRow label="مدرس" values={values((course) => course.instructor)} />
        <ComparisonRow label="امتیاز" values={values(formatRating)} />
        <ComparisonRow label="گواهی" values={values(certificateLabel)} />
      </div>

      <div className={styles.comparisonLinks} style={{ "--compare-columns": courses.length } as CSSProperties}>
        {courses.map((course) => (
          <a
            key={course.id}
            href={course.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackCareerEvent("career_learning_course_opened", {
              skillId: skill.id,
              provider: course.provider
            })}
          >
            انتخاب این دوره <ExternalLink size={16} aria-hidden />
          </a>
        ))}
      </div>
    </section>
  );
}

function TrustedSources({ skill }: Readonly<{ skill: SkillCatalogItem }>) {
  const links = getTrustedProviderLinks(skill);
  return (
    <section className={styles.trustedSources} aria-labelledby="trusted-sources-title">
      <div className={styles.sectionHeading}>
        <span className={styles.sectionIconYellow}><Search size={21} aria-hidden /></span>
        <div>
          <p>برای گزینه‌های بیشتر</p>
          <h3 id="trusted-sources-title">این منابع را هم برای «{skill.titleFa}» بررسی کن</h3>
        </div>
      </div>
      <div className={styles.providerLinks}>
        {links.map((provider) => (
          <a key={provider.id} href={provider.href} target="_blank" rel="noopener noreferrer">
            <span>{provider.label}</span>
            <small>{provider.isDirectSearch ? "جست‌وجوی مستقیم" : "باز کردن منبع رسمی"}</small>
            <ExternalLink size={16} aria-hidden />
          </a>
        ))}
      </div>
      <p className={styles.sourceNotice}>
        تا وقتی مشخصات یک دوره از صفحهٔ اصلی خودش بررسی نشده باشد، Useravaa آن را با قیمت یا امتیاز قطعی پیشنهاد نمی‌کند.
      </p>
    </section>
  );
}

function CourseListSkeleton() {
  return (
    <div className={styles.courseSkeleton} role="status" aria-live="polite">
      <span className="sr-only">در حال آوردن دوره‌های مرتبط…</span>
      {[0, 1, 2].map((item) => (
        <div key={item} className={styles.courseSkeletonRow} aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      ))}
    </div>
  );
}

function ComparisonTray({
  count,
  onOpen,
  onClear
}: Readonly<{
  count: number;
  onOpen: () => void;
  onClear: () => void;
}>) {
  if (!count) return null;
  const canCompare = count >= 2;
  return (
    <aside className={styles.comparisonTray} aria-label="وضعیت مقایسهٔ دوره‌ها" aria-live="polite">
      <span className={styles.comparisonTrayIcon} aria-hidden><GitCompareArrows size={20} /></span>
      <div>
        <strong>{count.toLocaleString("fa-IR")} دوره انتخاب شده</strong>
        <small>{canCompare ? "آمادهٔ مقایسه است" : "یک دورهٔ دیگر انتخاب کن"}</small>
      </div>
      <button type="button" className={styles.clearComparison} onClick={onClear}>
        پاک کردن
      </button>
      <button type="button" className={styles.openComparison} disabled={!canCompare} onClick={onOpen}>
        مقایسه
      </button>
    </aside>
  );
}

function SkillDetail({
  skill,
  courses,
  loadStatus,
  expectedCourseCount,
  languageFilter,
  providerFilter,
  comparedCourseIds,
  onBack,
  onRetry,
  onChangeLanguage,
  onChangeProvider,
  onResetFilters,
  onClearComparison,
  onToggleCompare
}: Readonly<{
  skill: SkillCatalogItem;
  courses: readonly CareerLearningCourse[];
  loadStatus: CourseLoadState["status"];
  expectedCourseCount: number;
  languageFilter: CourseLanguageFilter;
  providerFilter: CareerLearningProviderId | "all";
  comparedCourseIds: readonly string[];
  onBack: () => void;
  onRetry: () => void;
  onChangeLanguage: (language: CourseLanguageFilter) => void;
  onChangeProvider: (provider: CareerLearningProviderId | "all") => void;
  onResetFilters: () => void;
  onClearComparison: () => void;
  onToggleCompare: (courseId: string) => void;
}>) {
  const [visibleCourseLimit, setVisibleCourseLimit] = useState(24);
  const comparedCourses = comparedCourseIds.flatMap((courseId) => {
    const course = courses.find((item) => item.id === courseId);
    return course ? [course] : [];
  });
  const providerOptions = useMemo(() => [...new Set(courses.map((course) => course.provider))]
    .map((providerId) => ({
      id: providerId,
      label: getCareerLearningProvider(providerId)?.label ?? providerId
    }))
    .sort((left, right) => left.label.localeCompare(right.label, "fa")), [courses]);
  const languageCounts = useMemo(() => ({
    fa: courses.filter((course) => course.language === "فارسی").length,
    en: courses.filter((course) => course.language === "انگلیسی").length
  }), [courses]);
  const filteredCourses = useMemo(() => courses.filter((course) => (
    (languageFilter === "all" || course.language === getCareerLearningLanguageLabel(languageFilter))
    && (providerFilter === "all" || course.provider === providerFilter)
  )), [courses, languageFilter, providerFilter]);

  function changeLanguageFilter(nextFilter: CourseLanguageFilter) {
    onChangeLanguage(nextFilter);
    setVisibleCourseLimit(24);
    trackCareerEvent("career_learning_filter_changed", {
      filterType: "course_language",
      selectedCount: nextFilter === "all" ? 0 : 1
    });
  }

  function changeProviderFilter(nextProvider: CareerLearningProviderId | "all") {
    onChangeProvider(nextProvider);
    setVisibleCourseLimit(24);
    trackCareerEvent("career_learning_filter_changed", {
      filterType: "course_provider",
      selectedCount: nextProvider === "all" ? 0 : 1
    });
  }

  return (
    <article className={styles.skillDetail} data-learning-skill-detail={skill.id}>
      <button type="button" className={styles.backButton} onClick={onBack}>
        <ArrowRight size={18} aria-hidden /> همه مهارت‌ها
      </button>

      <header className={styles.detailHeader}>
        <span className={`${styles.detailIcon} ${skillTypeClass(skill.type)}`} aria-hidden>
          {(() => {
            const Icon = typeIcons[skill.type];
            return <Icon size={25} />;
          })()}
        </span>
        <div>
          <span>{skillTypeLabels[skill.type]}</span>
          <h2>{skill.titleFa}</h2>
          <p dir="ltr">{skill.titleEn}</p>
        </div>
      </header>

      <p className={styles.skillDescription}>{skill.descriptionFa}</p>

      <div className={styles.detailSummary}>
        <span><BookOpen size={17} aria-hidden /> {(loadStatus === "ready" ? courses.length : expectedCourseCount).toLocaleString("fa-IR")} دورهٔ مرتبط</span>
        <span><CircleDot size={17} aria-hidden /> مقایسه تا {CAREER_COURSE_COMPARE_LIMIT.toLocaleString("fa-IR")} دوره</span>
      </div>

      {loadStatus === "loading" ? (
        <CourseListSkeleton />
      ) : loadStatus === "error" ? (
        <div className={styles.noVerifiedCourses} role="alert">
          <BookOpen size={27} aria-hidden />
          <div>
            <h3>دوره‌ها دریافت نشدند</h3>
            <p>اتصال را بررسی کن و دوباره تلاش کن؛ انتخاب‌های قبلی‌ات پاک نمی‌شوند.</p>
            <button type="button" onClick={onRetry}>تلاش دوباره</button>
          </div>
        </div>
      ) : courses.length ? (
        <section className={styles.courseList} aria-labelledby="verified-courses-title">
          <div className={styles.courseListHeading}>
            <div>
              <h3 id="verified-courses-title">دوره‌های مرتبط</h3>
              <p>هر مشخصه فقط وقتی نشان داده می‌شود که در صفحهٔ اصلی همان دوره قابل‌بررسی باشد.</p>
            </div>
            {comparedCourses.length >= 2 ? (
              <button
                type="button"
                className={styles.jumpToCompare}
                onClick={() => document.getElementById("course-comparison")?.scrollIntoView({ behavior: "smooth" })}
              >
                مقایسهٔ {comparedCourses.length.toLocaleString("fa-IR")} دوره
                <GitCompareArrows size={17} aria-hidden />
              </button>
            ) : null}
          </div>

          <div className={styles.courseFilters} aria-label="فیلتر دوره‌ها">
            <div className={styles.languageFilter} role="group" aria-label="فیلتر زبان دوره">
              {courseLanguageFilters.map((option) => {
                const count = option.id === "all" ? courses.length : languageCounts[option.id];
                return (
                  <button
                    key={option.id}
                    type="button"
                    className={languageFilter === option.id ? styles.languageFilterActive : undefined}
                    aria-pressed={languageFilter === option.id}
                    disabled={!count}
                    onClick={() => changeLanguageFilter(option.id)}
                  >
                    {option.label}
                    <span>{count.toLocaleString("fa-IR")}</span>
                  </button>
                );
              })}
            </div>
            <label className={styles.providerFilter}>
              <span>منبع دوره</span>
              <select
                aria-label="فیلتر منبع دوره"
                value={providerFilter}
                onChange={(event) => changeProviderFilter(
                  event.target.value as CareerLearningProviderId | "all"
                )}
              >
                <option value="all">همهٔ منابع</option>
                {providerOptions.map((provider) => (
                  <option key={provider.id} value={provider.id}>{provider.label}</option>
                ))}
              </select>
            </label>
            <p aria-live="polite">
              {filteredCourses.length.toLocaleString("fa-IR")} نتیجه از {courses.length.toLocaleString("fa-IR")} دوره
            </p>
          </div>

          {filteredCourses.length ? <div className={styles.courseRows}>
            {filteredCourses.slice(0, visibleCourseLimit).map((course) => (
              <CourseRow
                key={course.id}
                course={course}
                skill={skill}
                selected={comparedCourseIds.includes(course.id)}
                comparisonFull={comparedCourseIds.length >= CAREER_COURSE_COMPARE_LIMIT}
                onToggleCompare={onToggleCompare}
              />
            ))}
          </div> : (
            <div className={styles.emptyCourseFilter}>
              <Filter size={23} aria-hidden />
              <div>
                <h3>با این فیلتر دوره‌ای پیدا نشد</h3>
                <button
                  type="button"
                  onClick={onResetFilters}
                >
                  پاک کردن فیلترها
                </button>
              </div>
            </div>
          )}

          {visibleCourseLimit < filteredCourses.length ? (
            <button
              type="button"
              className={styles.loadMoreCourses}
              onClick={() => setVisibleCourseLimit((limit) => limit + 24)}
            >
              دیدن دوره‌های بیشتر
              <span>{(filteredCourses.length - visibleCourseLimit).toLocaleString("fa-IR")}</span>
            </button>
          ) : null}
        </section>
      ) : (
        <div className={styles.noVerifiedCourses}>
          <BookOpen size={27} aria-hidden />
          <div>
            <h3>دورهٔ مستقیمی برای این مهارت پیدا نشد</h3>
            <p>منابع تخصصی پایین را می‌توانی مستقیم بررسی کنی.</p>
          </div>
        </div>
      )}

      <CourseComparison courses={comparedCourses} skill={skill} onRemove={onToggleCompare} />
      <TrustedSources skill={skill} />
      <ComparisonTray
        count={comparedCourses.length}
        onClear={onClearComparison}
        onOpen={() => document.getElementById("course-comparison")?.scrollIntoView({ behavior: "smooth" })}
      />
    </article>
  );
}

function DetailPrompt() {
  return (
    <aside className={styles.detailPrompt}>
      <Image
        src="/brand/Mascot/useravaa-mascot-magnifier-eye.webp"
        width={118}
        height={118}
        alt=""
        aria-hidden="true"
      />
      <span><BookOpen size={18} aria-hidden /> انتخاب آگاهانه</span>
      <h2>یک مهارت را باز کن</h2>
      <p>قیمت، زمان، تمرین، مدرس، زبان و امتیاز دوره‌های بررسی‌شده را کنار هم می‌بینی.</p>
    </aside>
  );
}

export function CareerLearningPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { savedPathIds, hasLoadedSavedPaths } = useSavedCareerPaths();
  const [mode, setMode] = useState<LearningMode>("personalized");
  const [filter, setFilter] = useState<SkillFilter>("all");
  const [query, setQuery] = useState("");
  const [visibleLimit, setVisibleLimit] = useState(40);
  const [courseLoadState, setCourseLoadState] = useState<CourseLoadState>({
    skillId: "",
    status: "idle",
    courses: []
  });
  const [courseReloadKey, setCourseReloadKey] = useState(0);
  const deferredQuery = useDeferredValue(query);
  const rawSearchParams = searchParams.toString();
  const queryState = useMemo(
    () => readCareerLearningQuery(new URLSearchParams(rawSearchParams)),
    [rawSearchParams]
  );
  const personalizedSkills = useMemo(
    () => getPersonalizedLearningSkills(savedPathIds),
    [savedPathIds]
  );
  const personalizedById = useMemo(
    () => new Map(personalizedSkills.map((item) => [item.skill.id, item])),
    [personalizedSkills]
  );
  const effectiveMode = mode === "personalized" && !personalizedSkills.length ? "all" : mode;
  const selectedSkillId = queryState.skillId ?? "";
  const selectedSkillCandidate = getSkillById(selectedSkillId);
  const selectedSkill = selectedSkillCandidate?.isSelectable ? selectedSkillCandidate : undefined;
  const selectedSkillCourses = useMemo(
    () => courseLoadState.skillId === selectedSkillId ? courseLoadState.courses : [],
    [courseLoadState.courses, courseLoadState.skillId, selectedSkillId]
  );
  const courseDataIsReady = Boolean(
    selectedSkill
    && courseLoadState.skillId === selectedSkill.id
    && courseLoadState.status === "ready"
  );
  const comparedCourseIds = courseDataIsReady
    ? sanitizeComparedCourseIds(queryState.comparedCourseIds, selectedSkillCourses)
    : queryState.comparedCourseIds;
  const languageFilter: CourseLanguageFilter = queryState.language ?? "all";
  const providerFilter: CareerLearningProviderId | "all" = queryState.provider ?? "all";
  const coverage = getCareerLearningCoverage();

  const matchedSkillIds = useMemo(
    () => new Set(searchSkillCatalog(deferredQuery, filter).map((skill) => skill.id)),
    [deferredQuery, filter]
  );
  const visibleSkills = useMemo(() => {
    if (effectiveMode === "personalized") {
      return personalizedSkills
        .filter((item) => matchedSkillIds.has(item.skill.id))
        .map((item) => item.skill);
    }
    return searchSkillCatalog(deferredQuery, filter)
      .slice()
      .sort((left, right) => left.titleFa.localeCompare(right.titleFa, "fa"));
  }, [deferredQuery, effectiveMode, filter, matchedSkillIds, personalizedSkills]);

  useEffect(() => {
    const normalized = normalizeCareerLearningQuery(
      new URLSearchParams(rawSearchParams),
      selectedSkillCourses,
      courseDataIsReady
    );
    if (normalized.toString() === rawSearchParams) return;
    const queryString = normalized.toString();
    router.replace(queryString ? `/career/learn?${queryString}` : "/career/learn", { scroll: false });
  }, [courseDataIsReady, rawSearchParams, router, selectedSkillCourses]);

  useEffect(() => {
    if (!hasLoadedSavedPaths) return;
    trackCareerEvent("career_learning_page_viewed", {
      savedPathCount: savedPathIds.size,
      courseCount: coverage.courseCount
    });
  }, [coverage.courseCount, hasLoadedSavedPaths, savedPathIds.size]);

  useEffect(() => {
    if (!selectedSkill) return;
    const controller = new AbortController();
    const courseCatalogQuery = new URLSearchParams({
      skillId: selectedSkill.id,
      catalog: coverage.generatedAt
    });
    fetch(`/api/career/learning/courses?${courseCatalogQuery.toString()}`, {
      signal: controller.signal
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("course_fetch_failed");
        return response.json() as Promise<Readonly<{
          ok: boolean;
          skillId: string;
          courses: readonly CareerLearningCourse[];
        }>>;
      })
      .then((payload) => {
        if (!payload.ok || payload.skillId !== selectedSkill.id) throw new Error("invalid_course_payload");
        setCourseLoadState({ skillId: selectedSkill.id, status: "ready", courses: payload.courses });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setCourseLoadState({ skillId: selectedSkill.id, status: "error", courses: [] });
      });
    return () => controller.abort();
  }, [courseReloadKey, coverage.generatedAt, selectedSkill]);

  function updateDetailQuery(nextState: CareerLearningQueryState) {
    router.push(buildCareerLearningUrl(nextState), { scroll: false });
  }

  function openSkill(skill: SkillCatalogItem) {
    updateDetailQuery({ skillId: skill.id, comparedCourseIds: [] });
    trackCareerEvent("career_learning_skill_opened", {
      skillId: skill.id,
      skillType: skill.type,
      courseCount: getCareerLearningCourseCount(skill.id)
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleComparison(courseId: string) {
    if (!selectedSkill) return;
    const next = toggleComparedCourseId(comparedCourseIds, courseId, selectedSkillCourses);
    updateDetailQuery({
      skillId: selectedSkill.id,
      ...(queryState.language ? { language: queryState.language } : {}),
      ...(queryState.provider ? { provider: queryState.provider } : {}),
      comparedCourseIds: next
    });
    trackCareerEvent("career_learning_compare_changed", {
      skillId: selectedSkill.id,
      selectedCount: next.length
    });
  }

  function changeCourseLanguage(nextLanguage: CourseLanguageFilter) {
    if (!selectedSkill) return;
    updateDetailQuery({
      skillId: selectedSkill.id,
      ...(nextLanguage === "all" ? {} : { language: nextLanguage }),
      ...(queryState.provider ? { provider: queryState.provider } : {}),
      comparedCourseIds
    });
  }

  function changeCourseProvider(nextProvider: CareerLearningProviderId | "all") {
    if (!selectedSkill) return;
    updateDetailQuery({
      skillId: selectedSkill.id,
      ...(queryState.language ? { language: queryState.language } : {}),
      ...(nextProvider === "all" ? {} : { provider: nextProvider }),
      comparedCourseIds
    });
  }

  function clearComparison() {
    if (!selectedSkill) return;
    updateDetailQuery({
      skillId: selectedSkill.id,
      ...(queryState.language ? { language: queryState.language } : {}),
      ...(queryState.provider ? { provider: queryState.provider } : {}),
      comparedCourseIds: []
    });
  }

  function resetCourseFilters() {
    if (!selectedSkill) return;
    updateDetailQuery({
      skillId: selectedSkill.id,
      comparedCourseIds
    });
  }

  function changeMode(nextMode: LearningMode) {
    setMode(nextMode);
    setVisibleLimit(40);
    trackCareerEvent("career_learning_filter_changed", {
      filterType: "view_mode",
      selectedCount: nextMode === "personalized" ? savedPathIds.size : 0
    });
  }

  return (
    <section
      className={`${styles.page} ${selectedSkill ? styles.pageWithDetail : ""} ${comparedCourseIds.length ? styles.pageWithComparison : ""}`}
      dir="rtl"
      data-career-learning-page
      aria-labelledby="career-learning-title"
    >
      <header className={styles.intro}>
        <div className={styles.introCopy}>
          <span className={styles.eyebrow}><GraduationCap size={17} aria-hidden /> یادگیری برای مسیر واقعی</span>
          <h1 id="career-learning-title">برای مهارت بعدی، دورهٔ درست را پیدا کن</h1>
          <p>مهارت‌های مسیرهای موردعلاقه‌ات را ببین و دوره‌ها را با قیمت، زمان، تمرین و مدرس مقایسه کن.</p>
        </div>
        <Image
          className={styles.heroMascot}
          src="/brand/Mascot/useravaa-mascot-magnifier-eye.webp"
          width={150}
          height={150}
          alt=""
          aria-hidden="true"
          priority
        />
        <div className={styles.coverageStrip} aria-label="پوشش بخش یادگیری">
          <span><strong>{coverage.totalSkillCount.toLocaleString("fa-IR")}</strong> مهارت کامل</span>
          <span><strong>{coverage.providerCount.toLocaleString("fa-IR")}</strong> منبع معتبر</span>
          <span><strong>{coverage.courseCount.toLocaleString("fa-IR")}</strong> دوره و مسیر یادگیری</span>
        </div>
      </header>

      <section className={styles.controls} aria-label="پیدا کردن مهارت">
        <div className={styles.modeControl} role="group" aria-label="نوع مهارت‌ها">
          <button
            type="button"
            className={effectiveMode === "personalized" ? styles.modeActive : styles.modeButton}
            aria-pressed={effectiveMode === "personalized"}
            disabled={!personalizedSkills.length}
            onClick={() => changeMode("personalized")}
          >
            <Sparkles size={17} aria-hidden /> برای مسیرهای من
          </button>
          <button
            type="button"
            className={effectiveMode === "all" ? styles.modeActive : styles.modeButton}
            aria-pressed={effectiveMode === "all"}
            onClick={() => changeMode("all")}
          >
            همهٔ {coverage.totalSkillCount.toLocaleString("fa-IR")} مهارت
          </button>
        </div>

        {!personalizedSkills.length ? (
          <div className={styles.personalizationHint}>
            <Sparkles size={19} aria-hidden />
            <span>یک مسیر شغلی را نگه دار تا مهارت‌های لازم آن اینجا جلو بیایند.</span>
            <Link href="/career">انتخاب مسیر <ChevronLeft size={16} aria-hidden /></Link>
          </div>
        ) : null}

        <label className={styles.searchField}>
          <Search size={20} aria-hidden />
          <span className="sr-only">جست‌وجوی مهارت</span>
          <input
            aria-label="جست‌وجوی مهارت"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setVisibleLimit(40);
            }}
            placeholder="مثلاً اکسل، مذاکره یا Figma"
            autoComplete="off"
          />
          {query ? (
            <button type="button" onClick={() => setQuery("")} aria-label="پاک کردن جست‌وجو">
              <X size={17} aria-hidden />
            </button>
          ) : null}
        </label>

        <div className={styles.filterChips} role="group" aria-label="فیلتر نوع مهارت">
          <Filter size={18} aria-hidden />
          {skillFilters.map((option) => (
            <button
              key={option.id}
              type="button"
              className={filter === option.id ? styles.filterActive : styles.filterChip}
              aria-pressed={filter === option.id}
              onClick={() => {
                setFilter(option.id);
                setVisibleLimit(40);
                trackCareerEvent("career_learning_filter_changed", { filterType: option.id });
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <div className={styles.workspace}>
        <section className={`${styles.skillBrowser} ${selectedSkill ? styles.browserWithSelection : ""}`} aria-labelledby="skill-browser-title">
          <div className={styles.browserHeading}>
            <div>
              <p>{effectiveMode === "personalized" ? "اولویت مسیرهای ذخیره‌شده" : "کاتالوگ کامل مهارت‌ها"}</p>
              <h2 id="skill-browser-title">
                {visibleSkills.length.toLocaleString("fa-IR")} مهارت پیدا شد
              </h2>
            </div>
            <span><Check size={16} aria-hidden /> دادهٔ استاندارد</span>
          </div>

          <div className={styles.skillRows}>
            {visibleSkills.slice(0, visibleLimit).map((skill) => (
              <SkillRow
                key={skill.id}
                skill={skill}
                pathTitles={personalizedById.get(skill.id)?.pathTitles}
                onOpen={openSkill}
              />
            ))}
          </div>

          {!visibleSkills.length ? (
            <div className={styles.emptySkills}>
              <Search size={25} aria-hidden />
              <h3>مهارتی با این عبارت پیدا نشد</h3>
              <p>نام فارسی یا انگلیسی مهارت را کوتاه‌تر بنویس.</p>
            </div>
          ) : null}

          {visibleLimit < visibleSkills.length ? (
            <button type="button" className={styles.loadMore} onClick={() => setVisibleLimit((limit) => limit + 40)}>
              دیدن مهارت‌های بیشتر
              <span>{(visibleSkills.length - visibleLimit).toLocaleString("fa-IR")}</span>
            </button>
          ) : null}
        </section>

        {selectedSkill ? (
          <SkillDetail
            key={selectedSkill.id}
            skill={selectedSkill}
            courses={selectedSkillCourses}
            loadStatus={courseLoadState.skillId === selectedSkill.id ? courseLoadState.status : "loading"}
            expectedCourseCount={getCareerLearningCourseCount(selectedSkill.id)}
            languageFilter={languageFilter}
            providerFilter={providerFilter}
            comparedCourseIds={comparedCourseIds}
            onBack={() => updateDetailQuery({ comparedCourseIds: [] })}
            onRetry={() => {
              setCourseLoadState({ skillId: selectedSkill.id, status: "loading", courses: [] });
              setCourseReloadKey((key) => key + 1);
            }}
            onChangeLanguage={changeCourseLanguage}
            onChangeProvider={changeCourseProvider}
            onResetFilters={resetCourseFilters}
            onClearComparison={clearComparison}
            onToggleCompare={toggleComparison}
          />
        ) : <DetailPrompt />}
      </div>

      <footer className={styles.dataNote}>
        <CircleDot size={18} aria-hidden />
        <p>
          آخرین مرور رجیستری دوره‌ها: {formatCourseVerifiedAt(coverage.generatedAt)}.
          قیمت و امتیاز از سایت اصلی می‌آید و متن دیدگاه کاربران در Useravaa ذخیره نمی‌شود.
        </p>
      </footer>
    </section>
  );
}

export function CareerLearningPageFallback() {
  return (
    <section className={styles.page} dir="rtl" data-career-learning-page aria-busy="true" aria-label="صفحهٔ یادگیری">
      <div className={styles.loadingState} role="status">
        <GraduationCap size={26} aria-hidden />
        <span>در حال آماده‌کردن دوره‌ها…</span>
      </div>
    </section>
  );
}
