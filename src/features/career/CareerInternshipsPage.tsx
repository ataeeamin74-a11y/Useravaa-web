"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpLeft,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  ChevronDown,
  CircleAlert,
  ExternalLink,
  Filter,
  MapPin,
  RefreshCw,
  Search,
  Sparkles,
  X
} from "./CareerIcons";
import { trackCareerEvent } from "./career-events";
import {
  careerInternshipPathOptions,
  filterCareerInternships,
  getCareerInternshipCityOptions,
  getCareerInternshipProvinceOptions,
  getCareerPathSlugsForSavedIds,
  parseCareerInternshipFeed,
  type CareerInternship,
  type CareerInternshipFeed,
  type CareerInternshipSource
} from "./career-internships";
import { useSavedCareerPaths } from "./career-saved-paths";
import styles from "./CareerInternshipsPage.module.css";

type ViewMode = "personalized" | "all";
type InternshipApiResponse = CareerInternshipFeed & Readonly<{
  ok: true;
  isStale?: boolean;
  refreshStarted?: boolean;
}>;

const sourceLabels: Readonly<Record<CareerInternshipSource, string>> = {
  jobinja: "جابینجا",
  jobvision: "جاب‌ویژن"
};

const pathTitleBySlug = new Map(
  careerInternshipPathOptions.map((path) => [path.slug, path.titleFa])
);

function formatAge(publishedAt: string) {
  const days = Math.max(0, Math.floor((Date.now() - Date.parse(publishedAt)) / (24 * 60 * 60 * 1000)));
  if (days === 0) return "امروز";
  if (days === 1) return "دیروز";
  return `${days.toLocaleString("fa-IR")} روز پیش`;
}

function formatUpdatedAt(updatedAt: string) {
  return new Intl.DateTimeFormat("fa-IR", {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(updatedAt));
}

function InternshipRow({
  internship,
  savedPathSlugs
}: Readonly<{
  internship: CareerInternship;
  savedPathSlugs: ReadonlySet<string>;
}>) {
  const matchedSavedPath = internship.pathSlugs.find((slug) => savedPathSlugs.has(slug));

  return (
    <article className={styles.internshipRow} data-career-internship={internship.id}>
      <div className={styles.rowTopline}>
        <span className={styles.sourceBadge}>{sourceLabels[internship.source]}</span>
        <time dateTime={internship.publishedAt}>{formatAge(internship.publishedAt)}</time>
      </div>

      <div className={styles.rowMain}>
        <div className={styles.rowCopy}>
          <h2>{internship.title}</h2>
          <div className={styles.jobMeta}>
            <span><Building2 size={15} aria-hidden /> {internship.company}</span>
            <span><MapPin size={15} aria-hidden /> {internship.location}</span>
            {internship.workType ? <span><BriefcaseBusiness size={15} aria-hidden /> {internship.workType}</span> : null}
          </div>
          {internship.salary ? <p className={styles.salary}>{internship.salary}</p> : null}
          <div className={styles.pathMatches} aria-label="مسیرهای شغلی مرتبط">
            {internship.pathSlugs.map((slug) => (
              <span key={slug}>{pathTitleBySlug.get(slug) ?? slug}</span>
            ))}
          </div>
          {matchedSavedPath ? (
            <p className={styles.matchReason}>
              <Sparkles size={15} aria-hidden />
              مرتبط با مسیر ذخیره‌شدهٔ «{pathTitleBySlug.get(matchedSavedPath)}»
            </p>
          ) : null}
        </div>

        <a
          className={styles.openAction}
          href={internship.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`دیدن آگهی ${internship.title} در ${sourceLabels[internship.source]}`}
          onClick={() => trackCareerEvent("career_internship_opened", {
            source: internship.source,
            careerSlug: internship.pathSlugs[0]
          })}
        >
          <ExternalLink size={19} aria-hidden />
          <span>دیدن آگهی</span>
        </a>
      </div>
    </article>
  );
}

function EmptyState({
  hasSavedPaths,
  isFiltered
}: Readonly<{ hasSavedPaths: boolean; isFiltered: boolean }>) {
  if (!hasSavedPaths && !isFiltered) {
    return (
      <div className={styles.emptyState}>
        <Sparkles size={25} aria-hidden />
        <div>
          <h2>اول مسیر موردنظرت را نگه دار</h2>
          <p>بعد از ذخیره یک مسیر، آگهی‌های مرتبط همین‌جا جدا می‌شوند.</p>
        </div>
        <Link href="/career">انتخاب مسیر <ArrowUpLeft size={17} aria-hidden /></Link>
      </div>
    );
  }

  return (
    <div className={styles.emptyState}>
      <CircleAlert size={25} aria-hidden />
      <div>
        <h2>آگهی تازه‌ای با این فیلتر پیدا نشد</h2>
        <p>فیلتر را عوض کن یا کمی بعد دوباره سر بزن؛ آگهی‌های قدیمی نمایش داده نمی‌شوند.</p>
      </div>
    </div>
  );
}

export function CareerInternshipsPage() {
  const { savedPathIds, hasLoadedSavedPaths } = useSavedCareerPaths();
  const [feed, setFeed] = useState<CareerInternshipFeed>();
  const [isStale, setIsStale] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [loadRequest, setLoadRequest] = useState(0);
  const [mode, setMode] = useState<ViewMode>("personalized");
  const [selectedPathSlug, setSelectedPathSlug] = useState("");
  const [source, setSource] = useState<CareerInternshipSource | "">("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [query, setQuery] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [visibleLimit, setVisibleLimit] = useState(30);
  const savedPathSlugs = useMemo(
    () => getCareerPathSlugsForSavedIds(savedPathIds),
    [savedPathIds]
  );
  const effectiveMode = mode === "personalized" && !savedPathSlugs.size ? "all" : mode;
  const provinceOptions = useMemo(
    () => getCareerInternshipProvinceOptions(feed?.items ?? []),
    [feed?.items]
  );
  const cityOptions = useMemo(
    () => getCareerInternshipCityOptions(feed?.items ?? [], province),
    [feed?.items, province]
  );

  useEffect(() => {
    let isCurrent = true;
    fetch("/api/career/internships")
      .then(async (response) => {
        if (!response.ok) throw new Error("internship feed request failed");
        return response.json() as Promise<InternshipApiResponse>;
      })
      .then((value) => {
        if (!isCurrent) return;
        const parsed = parseCareerInternshipFeed(value);
        if (!parsed) throw new Error("internship feed response was invalid");
        setFeed(parsed);
        setIsStale(Boolean(value.isStale));
        setLoadFailed(false);
      })
      .catch(() => {
        if (isCurrent) setLoadFailed(true);
      });
    return () => {
      isCurrent = false;
    };
  }, [loadRequest]);

  useEffect(() => {
    if (!hasLoadedSavedPaths) return;
    trackCareerEvent("career_internship_page_viewed", { savedPathCount: savedPathSlugs.size });
  }, [hasLoadedSavedPaths, savedPathSlugs.size]);

  const visibleItems = useMemo(() => filterCareerInternships(feed?.items ?? [], {
    mode: effectiveMode,
    savedPathSlugs,
    ...(selectedPathSlug ? { selectedPathSlug } : {}),
    ...(source ? { source } : {}),
    ...(province ? { province } : {}),
    ...(city ? { city } : {}),
    query
  }), [city, effectiveMode, feed?.items, province, query, savedPathSlugs, selectedPathSlug, source]);
  const listedItems = visibleItems.slice(0, visibleLimit);

  function changeMode(nextMode: ViewMode) {
    setMode(nextMode);
    setVisibleLimit(30);
    trackCareerEvent("career_internship_filter_changed", {
      filterType: "view_mode",
      selectedCount: nextMode === "personalized" ? savedPathSlugs.size : 0
    });
  }

  function changePath(nextSlug: string) {
    setSelectedPathSlug(nextSlug);
    setVisibleLimit(30);
    trackCareerEvent("career_internship_filter_changed", {
      filterType: "career_path",
      careerSlug: nextSlug || "all"
    });
  }

  function changeProvince(nextProvince: string) {
    setProvince(nextProvince);
    setCity("");
    setVisibleLimit(30);
    trackCareerEvent("career_internship_filter_changed", { filterType: "province" });
  }

  function changeCity(nextCity: string) {
    setCity(nextCity);
    setVisibleLimit(30);
    trackCareerEvent("career_internship_filter_changed", { filterType: "city" });
  }

  function changeSource(nextSource: CareerInternshipSource | "") {
    setSource(nextSource);
    setVisibleLimit(30);
    trackCareerEvent("career_internship_filter_changed", { filterType: "source" });
  }

  const activeAdvancedFilterCount = Number(Boolean(selectedPathSlug)) + Number(Boolean(source));

  return (
    <main className={styles.page} dir="rtl" data-career-internships-page>
      <header className={styles.intro}>
        <div className={styles.introTopline}>
          <span className={styles.eyebrow}><BriefcaseBusiness size={16} aria-hidden /> فرصت‌های شروع</span>
          <Image
            className={styles.introMascot}
            src="/brand/Mascot/useravaa-mascot-magnifier-eye.webp"
            width={76}
            height={76}
            alt=""
            aria-hidden="true"
          />
        </div>
        <h1>کارآموزی‌های نزدیک به مسیر تو</h1>
        <p>آگهی‌های تازهٔ جابینجا و جاب‌ویژن را بر اساس مسیرهایی که دنبال می‌کنی یک‌جا ببین.</p>
        <div className={styles.freshnessLine}>
          <RefreshCw size={16} aria-hidden />
          <span>بعد از ۳ روز، با اولین بازدید تازه‌سازی می‌شود</span>
          <span aria-hidden>•</span>
          <span>فقط آگهی‌های ۴۵ روز اخیر</span>
        </div>
      </header>

      <section className={styles.controlSection} aria-label="فیلتر آگهی‌های کارآموزی">
        <div className={styles.modeControl} role="group" aria-label="نوع پیشنهادها">
          <button
            type="button"
            className={effectiveMode === "personalized" ? styles.modeActive : styles.modeButton}
            aria-pressed={effectiveMode === "personalized"}
            disabled={!savedPathSlugs.size}
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
            همه آگهی‌ها
          </button>
        </div>

        {!savedPathSlugs.size && hasLoadedSavedPaths ? (
          <div className={styles.savedPathHint}>
            <Sparkles size={17} aria-hidden />
            <span>با ذخیره‌کردن مسیر شغلی، پیشنهادهای شخصی اینجا فعال می‌شوند.</span>
            <Link href="/career">رفتن به مسیرها</Link>
          </div>
        ) : null}

        <button
          type="button"
          className={styles.filterToggle}
          aria-expanded={showAdvancedFilters}
          aria-controls="career-internship-advanced-filters"
          data-open={showAdvancedFilters ? "true" : "false"}
          onClick={() => setShowAdvancedFilters((current) => !current)}
        >
          <Filter size={18} aria-hidden />
          <span>فیلترهای بیشتر</span>
          {activeAdvancedFilterCount ? <strong>{activeAdvancedFilterCount.toLocaleString("fa-IR")}</strong> : null}
          <ChevronDown size={17} aria-hidden />
        </button>

        <div
          id="career-internship-advanced-filters"
          className={`${styles.filterGrid} ${showAdvancedFilters ? styles.filterGridAdvanced : ""}`}
        >
          <label className={styles.searchField}>
            <Search size={18} aria-hidden />
            <span className={styles.srOnly}>جست‌وجوی آگهی</span>
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setVisibleLimit(30);
              }}
              placeholder="عنوان، شرکت یا شهر"
            />
            {query ? (
              <button type="button" onClick={() => {
                setQuery("");
                setVisibleLimit(30);
              }} aria-label="پاک‌کردن جست‌وجو">
                <X size={17} aria-hidden />
              </button>
            ) : null}
          </label>

          <label className={`${styles.selectField} ${styles.pathField} ${styles.advancedField}`}>
            <Filter size={17} aria-hidden />
            <span>مسیر شغلی</span>
            <select
              aria-label="فیلتر مسیر شغلی"
              value={selectedPathSlug}
              onChange={(event) => changePath(event.target.value)}
            >
              <option value="">همه مسیرها</option>
              {careerInternshipPathOptions.map((path) => (
                <option key={path.slug} value={path.slug}>{path.titleFa}</option>
              ))}
            </select>
            <ChevronDown size={16} aria-hidden />
          </label>

          <label className={`${styles.selectField} ${styles.provinceField}`}>
            <MapPin size={17} aria-hidden />
            <span>استان</span>
            <select
              aria-label="فیلتر استان"
              value={province}
              onChange={(event) => changeProvince(event.target.value)}
            >
              <option value="">همه استان‌ها</option>
              {provinceOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <ChevronDown size={16} aria-hidden />
          </label>

          <label className={`${styles.selectField} ${styles.cityField}`}>
            <MapPin size={17} aria-hidden />
            <span>شهر</span>
            <select
              aria-label="فیلتر شهر"
              value={city}
              onChange={(event) => changeCity(event.target.value)}
            >
              <option value="">همه شهرها</option>
              {cityOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <ChevronDown size={16} aria-hidden />
          </label>

          <label className={`${styles.selectField} ${styles.sourceField} ${styles.advancedField}`}>
            <BriefcaseBusiness size={17} aria-hidden />
            <span>منبع</span>
            <select
              aria-label="فیلتر منبع آگهی"
              value={source}
              onChange={(event) => changeSource(event.target.value as CareerInternshipSource | "")}
            >
              <option value="">هر دو سایت</option>
              <option value="jobinja">جابینجا</option>
              <option value="jobvision">جاب‌ویژن</option>
            </select>
            <ChevronDown size={16} aria-hidden />
          </label>
        </div>
      </section>

      <section className={styles.resultsSection} aria-labelledby="internship-results-title">
        <div className={styles.resultsHeading}>
          <div>
            <span>{effectiveMode === "personalized" ? "مرتبط با انتخاب‌های تو" : "فرصت‌های تازه"}</span>
            <h2 id="internship-results-title">
              {feed ? `${visibleItems.length.toLocaleString("fa-IR")} آگهی` : "در حال بررسی آگهی‌ها"}
            </h2>
          </div>
          {feed ? (
            <p title={new Date(feed.updatedAt).toISOString()}>
              <CalendarClock size={15} aria-hidden />
              {isStale ? "در حال تازه‌سازی" : `به‌روز تا ${formatUpdatedAt(feed.updatedAt)}`}
            </p>
          ) : null}
        </div>

        {!feed && !loadFailed ? (
          <div className={styles.loadingRows} aria-live="polite" aria-busy="true">
            <span>در حال آوردن آگهی‌های تازه...</span>
            <i /><i /><i />
          </div>
        ) : null}

        {loadFailed ? (
          <div className={styles.errorState} role="alert">
            <CircleAlert size={24} aria-hidden />
            <div>
              <h2>فعلاً آگهی‌ها در دسترس نیستند</h2>
              <p>می‌توانی مستقیم سراغ فهرست کارآموزی منبع‌ها بروی.</p>
            </div>
            <button type="button" onClick={() => {
              setFeed(undefined);
              setLoadFailed(false);
              setLoadRequest((current) => current + 1);
            }}>
              تلاش دوباره
            </button>
            <a href="https://jobinja.ir/jobs?filters%5Binternship%5D=1" target="_blank" rel="noopener noreferrer">جابینجا</a>
            <a href="https://jobvision.ir/jobs/type/internship" target="_blank" rel="noopener noreferrer">جاب‌ویژن</a>
          </div>
        ) : null}

        {feed && visibleItems.length ? (
          <div className={styles.internshipList}>
            {listedItems.map((internship) => (
              <InternshipRow
                key={internship.id}
                internship={internship}
                savedPathSlugs={savedPathSlugs}
              />
            ))}
          </div>
        ) : null}

        {feed && listedItems.length < visibleItems.length ? (
          <button
            type="button"
            className={styles.loadMore}
            onClick={() => setVisibleLimit((current) => current + 30)}
          >
            نمایش آگهی‌های بیشتر
            <ChevronDown size={18} aria-hidden />
          </button>
        ) : null}

        {feed && !visibleItems.length ? (
          <EmptyState
            hasSavedPaths={savedPathSlugs.size > 0}
            isFiltered={Boolean(
              selectedPathSlug || source || province || city || query || effectiveMode === "personalized"
            )}
          />
        ) : null}
      </section>
    </main>
  );
}
