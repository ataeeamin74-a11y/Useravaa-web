"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Bookmark,
  BriefcaseBusiness,
  Check,
  ChevronLeft,
  CircleDot,
  Compass,
  GitCompareArrows,
  Layers3,
  ListChecks,
  RotateCcw,
  Search,
  Sparkles,
  Users,
  Wrench,
  X
} from "./CareerIcons";
import { getCareerPathSeoEntryBySlug } from "./career-path-seo";
import { trackCareerEvent } from "./career-events";
import {
  buildCareerSkillGap,
  getCareerSkillMatchBySlug,
  rankCareerSkillMatches,
  type CareerGapItem,
  type CareerSkillGap,
  type CareerSkillMatch
} from "./career-skill-matcher";
import {
  type SkillSelectionState,
  type UserSkillProfile,
  useCareerSkillProfile
} from "./career-skill-profile";
import { useSavedCareerPaths } from "./career-saved-paths";
import {
  searchSkillCatalog,
  skillTypeLabels,
  skillTypes,
  type SkillCatalogItem,
  type SkillType
} from "./skill-catalog";
import styles from "./CareerSkillsPage.module.css";

type SkillFilter = SkillType | "all";

const filterOptions: readonly Readonly<{ id: SkillFilter; label: string }>[] = [
  { id: "all", label: "همه" },
  { id: "soft", label: "نرم" },
  { id: "foundational", label: "پایه" },
  { id: "specialized", label: "تخصصی" },
  { id: "tool", label: "ابزار" }
];

const typeIcons = {
  soft: Users,
  foundational: Layers3,
  specialized: BriefcaseBusiness,
  tool: Wrench
} as const;

function typeClass(type: SkillType) {
  return {
    soft: styles.typeSoft,
    foundational: styles.typeFoundational,
    specialized: styles.typeSpecialized,
    tool: styles.typeTool
  }[type];
}

function SelectionStats({ profile }: Readonly<{ profile: UserSkillProfile }>) {
  const haveCount = profile.selections.filter((selection) => selection.state === "have").length;
  const interestedCount = profile.selections.length - haveCount;

  return (
    <div className={styles.selectionStats} aria-label="خلاصه انتخاب‌ها">
      <span><Check size={16} aria-hidden /> {haveCount.toLocaleString("fa-IR")} مهارت دارم</span>
      <span><Sparkles size={16} aria-hidden /> {interestedCount.toLocaleString("fa-IR")} علاقه به یادگیری</span>
    </div>
  );
}

function SkillRow({
  item,
  selectedState,
  onSelect,
  onRemove
}: Readonly<{
  item: SkillCatalogItem;
  selectedState?: SkillSelectionState;
  onSelect: (item: SkillCatalogItem, state: SkillSelectionState) => void;
  onRemove: (item: SkillCatalogItem) => void;
}>) {
  const Icon = typeIcons[item.type];

  return (
    <article className={`${styles.skillRow} ${selectedState ? styles.skillRowSelected : ""}`} data-skill-id={item.id}>
      <span className={`${styles.skillTypeIcon} ${typeClass(item.type)}`} aria-hidden>
        <Icon size={18} />
      </span>
      <div className={styles.skillIdentity}>
        <div className={styles.skillTitleLine}>
          <strong>{item.titleFa}</strong>
          <small dir="ltr">{item.titleEn}</small>
        </div>
        <p>{item.descriptionFa}</p>
      </div>
      <div className={styles.skillActions} role="group" aria-label={`وضعیت ${item.titleFa}`}>
        <button
          type="button"
          className={selectedState === "have" ? styles.stateButtonHaveActive : styles.stateButton}
          aria-pressed={selectedState === "have"}
          onClick={() => onSelect(item, "have")}
        >
          <Check size={15} aria-hidden />
          <span>دارم</span>
        </button>
        <button
          type="button"
          className={selectedState === "interested" ? styles.stateButtonInterestActive : styles.stateButton}
          aria-pressed={selectedState === "interested"}
          onClick={() => onSelect(item, "interested")}
        >
          <Sparkles size={15} aria-hidden />
          <span>می‌خواهم یاد بگیرم</span>
        </button>
        {selectedState ? (
          <button
            type="button"
            className={styles.removeSelection}
            aria-label={`حذف ${item.titleFa} از انتخاب‌ها`}
            onClick={() => onRemove(item)}
          >
            <X size={17} aria-hidden />
          </button>
        ) : null}
      </div>
    </article>
  );
}

function SkillSelectionView({
  profile,
  onSelect,
  onRemove,
  onReset,
  onRequestResults
}: Readonly<{
  profile: UserSkillProfile;
  onSelect: (item: SkillCatalogItem, state: SkillSelectionState) => void;
  onRemove: (item: SkillCatalogItem) => void;
  onReset: () => void;
  onRequestResults: () => void;
}>) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<SkillFilter>("all");
  const [showAll, setShowAll] = useState(false);
  const selectedById = useMemo(
    () => new Map(profile.selections.map((selection) => [selection.skillId, selection.state])),
    [profile.selections]
  );
  const matchedSkills = useMemo(() => {
    const candidates = searchSkillCatalog(query, filter);
    if (query.trim() || showAll || filter !== "all") return candidates;
    return candidates.filter((item) => item.isRecommended || selectedById.has(item.id));
  }, [filter, query, selectedById, showAll]);
  const visibleSkills = showAll || query.trim() ? matchedSkills : matchedSkills.slice(0, 24);
  const groupedSkills = skillTypes.map((type) => ({
    type,
    items: visibleSkills.filter((item) => item.type === type)
  })).filter((group) => group.items.length);
  const selectionCount = profile.selections.length;
  const remainingSelectionCount = Math.max(0, 3 - selectionCount);
  const resultGuidance = remainingSelectionCount > 0
    ? `برای دیدن مسیرها، ${remainingSelectionCount.toLocaleString("fa-IR")} مورد دیگر را با «دارم» یا «می‌خواهم یاد بگیرم» مشخص کن.`
    : (selectionCount < 5
      ? "نتیجه آماده است؛ با انتخاب بیشتر، تفاوت مسیرها روشن‌تر می‌شود."
      : "نتیجه آماده است؛ حالا مسیرهای نزدیک به انتخاب‌هایت را ببین.");

  function resetWithConfirmation() {
    if (!profile.selections.length) return;
    if (window.confirm("همه انتخاب‌های مهارتی پاک شوند؟")) onReset();
  }

  return (
    <div className={styles.selectionView}>
      <Link href="/career" className={`${styles.backButton} ${styles.selectionBackButton}`}>
        <ArrowRight size={18} aria-hidden /> بازگشت به مسیرها
      </Link>

      <section className={styles.intro} aria-labelledby="career-skills-title">
        <span className={styles.eyebrow}><ListChecks size={16} aria-hidden /> تصمیم با شواهد بیشتر</span>
        <h1 id="career-skills-title">با مهارت‌ها و علاقه‌هات، مسیرهای نزدیک‌تر رو پیدا کن</h1>
        <p>مهارت‌هایی را که الان داری یا دوست داری یاد بگیری انتخاب کن. یوزراوا مسیرهایی را نشان می‌دهد که از نظر نوع کار و مهارت به انتخاب‌های تو نزدیک‌ترند.</p>
        <SelectionStats profile={profile} />
      </section>

      <section className={styles.resultRequest} aria-label="مشاهده مسیرهای نزدیک">
        <div aria-live="polite">
          <strong>{selectionCount.toLocaleString("fa-IR")} مورد انتخاب شده</strong>
          <span>{resultGuidance}</span>
        </div>
        <button type="button" disabled={selectionCount < 3} onClick={onRequestResults}>
          <Compass size={18} aria-hidden />
          دیدن مسیرهای نزدیک
        </button>
      </section>

      <section className={styles.explorer} aria-labelledby="skill-explorer-title">
        <div className={styles.sectionLead}>
          <div>
            <span>انتخاب مهارت</span>
            <h2 id="skill-explorer-title">از چیزهایی که واقعاً می‌شناسی شروع کن</h2>
          </div>
          <button type="button" className={styles.resetButton} onClick={resetWithConfirmation} disabled={!profile.selections.length}>
            <RotateCcw size={16} aria-hidden /> پاک‌کردن انتخاب‌ها
          </button>
        </div>

        <label className={styles.searchField}>
          <Search size={20} aria-hidden />
          <span className="sr-only">جست‌وجوی مهارت یا ابزار</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="مثلاً ارتباط مؤثر، Excel یا Figma"
            autoComplete="off"
          />
          {query ? (
            <button type="button" aria-label="پاک‌کردن جست‌وجو" onClick={() => setQuery("")}>
              <X size={18} aria-hidden />
            </button>
          ) : null}
        </label>

        <div className={styles.filterBar} role="group" aria-label="فیلتر نوع مهارت">
          {filterOptions.map((option) => (
            <button
              type="button"
              key={option.id}
              className={filter === option.id ? styles.filterActive : styles.filterButton}
              aria-pressed={filter === option.id}
              onClick={() => {
                setFilter(option.id);
                setShowAll(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>

        {groupedSkills.length ? (
          <div className={styles.skillGroups} aria-live="polite">
            {groupedSkills.map((group) => (
              <section className={styles.skillGroup} key={group.type} aria-labelledby={`skill-group-${group.type}`}>
                <div className={styles.groupHeading}>
                  <h3 id={`skill-group-${group.type}`}>{skillTypeLabels[group.type]}</h3>
                  <span>{group.items.length.toLocaleString("fa-IR")}</span>
                </div>
                <div className={styles.skillList}>
                  {group.items.map((item) => (
                    <SkillRow
                      key={item.id}
                      item={item}
                      selectedState={selectedById.get(item.id)}
                      onSelect={onSelect}
                      onRemove={onRemove}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className={styles.emptySearch}>
            <Search size={24} aria-hidden />
            <strong>مهارتی با این عبارت پیدا نشد</strong>
            <span>عبارت کوتاه‌تر یا نام انگلیسی ابزار را امتحان کن.</span>
          </div>
        )}

        {!query.trim() && !showAll ? (
          <button type="button" className={styles.showMoreButton} onClick={() => setShowAll(true)}>
            نمایش همه مهارت‌های این بخش
            <ChevronLeft size={18} aria-hidden />
          </button>
        ) : null}
      </section>

    </div>
  );
}

function ResultCounts({ match }: Readonly<{ match: CareerSkillMatch }>) {
  const basisLabel = {
    current: "بیشتر بر پایه مهارت‌های فعلی",
    interest: "بیشتر بر پایه علاقه یادگیری",
    mixed: "ترکیبی از مهارت فعلی و علاقه",
    limited: "شواهد مشترک محدود"
  }[match.basis];
  const nextStepCount = Math.min(3, match.missingCore.length);

  return (
    <div className={styles.resultCounts}>
      <span><Check size={14} aria-hidden /> {match.matchedCurrent.length.toLocaleString("fa-IR")} مهارت فعلی</span>
      <span><Sparkles size={14} aria-hidden /> {match.matchedInterests.length.toLocaleString("fa-IR")} علاقه</span>
      <span><CircleDot size={14} aria-hidden /> {nextStepCount.toLocaleString("fa-IR")} قدم پیشنهادی بعدی</span>
      <span data-match-basis={match.basis}>{basisLabel}</span>
    </div>
  );
}

function SkillResultsView({
  profile,
  onBack,
  onOpenMatch
}: Readonly<{
  profile: UserSkillProfile;
  onBack: () => void;
  onOpenMatch: (match: CareerSkillMatch, rank: number) => void;
}>) {
  const results = useMemo(() => rankCareerSkillMatches(profile, 10), [profile]);
  const resultCountLabel = results.length.toLocaleString("fa-IR");

  return (
    <section className={styles.resultsPage} aria-labelledby="skill-results-title">
      <button type="button" className={styles.backButton} onClick={onBack}>
        <ArrowRight size={18} aria-hidden /> ویرایش مهارت‌ها
      </button>
      <div className={styles.resultsHeader}>
        <span className={styles.eyebrow}><Compass size={16} aria-hidden /> مقایسه توضیح‌پذیر</span>
        <h1 id="skill-results-title">{resultCountLabel} مسیر نزدیک‌تر به انتخاب‌های تو</h1>
        <p>این ترتیب یک ابزار تصمیم‌گیری است؛ شباهت مهارتی را نشان می‌دهد و درباره تناسب قطعی یا استعداد تو قضاوت نمی‌کند.</p>
        <SelectionStats profile={profile} />
      </div>

      {profile.selections.length < 5 ? (
        <div className={styles.preliminaryNote}>
          <Sparkles size={18} aria-hidden />
          <span><strong>نتیجه مقدماتی</strong> با انتخاب مهارت‌های بیشتر، تفاوت مسیرها واضح‌تر می‌شود.</span>
        </div>
      ) : null}

      {results.length ? (
        <div className={styles.resultList} data-career-skill-results>
          {results.map((match, index) => (
            <article className={styles.resultCard} key={match.careerSlug} data-career-skill-result>
              <div className={styles.resultRank}>{(index + 1).toLocaleString("fa-IR")}</div>
              <div className={styles.resultBody}>
                <div className={styles.resultTitleLine}>
                  <div>
                    <h2>{match.titleFa}</h2>
                    <span dir="ltr">{match.titleEn}</span>
                  </div>
                  <strong className={`${styles.matchLabel} ${match.label === "خیلی نزدیک" ? styles.matchLabelStrong : ""}`}>{match.label}</strong>
                </div>
                <p className={styles.matchExplanation}>{match.explanation}</p>
                <div className={styles.reasonList} aria-label="قوی‌ترین دلیل‌ها">
                  {match.strongestReasons.map((reason) => (
                    <span key={reason.skill.id}>{reason.skill.titleFa}</span>
                  ))}
                </div>
                <ResultCounts match={match} />
              </div>
              <button type="button" className={styles.detailButton} onClick={() => onOpenMatch(match, index + 1)}>
                بررسی فاصله مهارتی
                <ChevronLeft size={18} aria-hidden />
              </button>
            </article>
          ))}
        </div>
      ) : (
        <div className={styles.noResults}>
          <ListChecks size={28} aria-hidden />
          <h2>هنوز انتخابی ثبت نشده</h2>
          <p>برای ساخت مقایسه قابل اتکا، دست‌کم سه مهارت یا علاقه یادگیری را انتخاب کن.</p>
          <button type="button" onClick={onBack}>رفتن به انتخاب مهارت‌ها</button>
        </div>
      )}
    </section>
  );
}

function GapRows({ items }: Readonly<{ items: readonly CareerGapItem[] }>) {
  return (
    <div className={styles.gapList}>
      {items.map((item) => (
        <article className={styles.gapRow} key={item.skill.id}>
          <div>
            <strong>{item.skill.titleFa}</strong>
            <span>{item.skill.descriptionFa}</span>
          </div>
          <div className={styles.gapMeta}>
            {item.selectedState === "interested" ? <span className={styles.interestHint}>در علاقه‌های تو</span> : null}
            <span className={item.priority === "شروع از اینجا" ? styles.priorityStart : styles.priorityLater}>{item.priority}</span>
          </div>
        </article>
      ))}
    </div>
  );
}

function GapItems({ items }: Readonly<{ items: readonly CareerGapItem[] }>) {
  if (!items.length) {
    return <p className={styles.gapEmpty}>در این گروه، نیاز مهم پوشش‌داده‌نشده‌ای دیده نمی‌شود.</p>;
  }

  const firstSteps = items.slice(0, 3);
  const laterSteps = items.slice(3);

  return (
    <>
      <GapRows items={firstSteps} />
      {laterSteps.length ? (
        <details className={styles.moreGapItems}>
          <summary>{laterSteps.length.toLocaleString("fa-IR")} مورد بعدی</summary>
          <GapRows items={laterSteps} />
        </details>
      ) : null}
    </>
  );
}

function GapGroup({
  title,
  description,
  items,
  type
}: Readonly<{
  title: string;
  description: string;
  items: readonly CareerGapItem[];
  type: SkillType;
}>) {
  const Icon = typeIcons[type];
  return (
    <section className={styles.gapGroup} aria-labelledby={`gap-${type}`}>
      <div className={styles.gapGroupHeading}>
        <span className={`${styles.skillTypeIcon} ${typeClass(type)}`} aria-hidden><Icon size={18} /></span>
        <div>
          <h2 id={`gap-${type}`}>{title}</h2>
          <p>{description}</p>
        </div>
      </div>
      <GapItems items={items} />
    </section>
  );
}

function ProfessionalGapGroup({ gap }: Readonly<{ gap: CareerSkillGap }>) {
  return (
    <section className={styles.gapGroup} aria-labelledby="gap-professional">
      <div className={styles.gapGroupHeading}>
        <span className={`${styles.skillTypeIcon} ${styles.typeSpecialized}`} aria-hidden><BriefcaseBusiness size={18} /></span>
        <div>
          <h2 id="gap-professional">مهارت‌های حرفه‌ای برای یادگیری</h2>
          <p>مهارت‌های پایه و تخصصی مسیر، با نقش هرکدام در شروع کار.</p>
        </div>
      </div>
      <div className={styles.professionalGroups}>
        <div className={styles.professionalGroup}>
          <h3><Layers3 size={16} aria-hidden /> مهارت‌های پایه</h3>
          <GapItems items={gap.foundational} />
        </div>
        <div className={styles.professionalGroup}>
          <h3><BriefcaseBusiness size={16} aria-hidden /> مهارت‌های تخصصی</h3>
          <GapItems items={gap.specialized} />
        </div>
      </div>
    </section>
  );
}

function CurrentSkills({ gap }: Readonly<{ gap: CareerSkillGap }>) {
  return (
    <section className={styles.currentSkills} aria-labelledby="gap-current">
      <div className={styles.gapGroupHeading}>
        <span className={`${styles.skillTypeIcon} ${styles.typeHave}`} aria-hidden><Check size={18} /></span>
        <div>
          <h2 id="gap-current">همین حالا داری</h2>
          <p>انتخاب‌های فعلی تو که مستقیماً با این مسیر هم‌پوشانی دارند.</p>
        </div>
      </div>
      {gap.current.length ? (
        <div className={styles.currentSkillList}>
          {gap.current.map((item) => <span key={item.skill.id}>{item.skill.titleFa}</span>)}
        </div>
      ) : <p className={styles.gapEmpty}>هنوز مهارتی با وضعیت «دارم» برای این مسیر ثبت نشده است.</p>}
    </section>
  );
}

function SkillGapView({
  profile,
  careerSlug,
  requestedRank,
  onBack
}: Readonly<{
  profile: UserSkillProfile;
  careerSlug: string;
  requestedRank: number;
  onBack: () => void;
}>) {
  const match = useMemo(() => getCareerSkillMatchBySlug(profile, careerSlug), [careerSlug, profile]);
  const gap = useMemo(() => match ? buildCareerSkillGap(match, profile) : null, [match, profile]);
  const entry = getCareerPathSeoEntryBySlug(careerSlug);
  const { savedPathIds, savePath } = useSavedCareerPaths();
  const pathId = entry?.path.id;
  const isSaved = pathId ? savedPathIds.has(pathId) : false;

  useEffect(() => {
    if (!match) return;
    trackCareerEvent("career_skill_gap_viewed", {
      careerSlug,
      resultRank: requestedRank,
      matchedCount: match.matchedCurrent.length + match.matchedInterests.length,
      missingCoreCount: match.missingCore.length
    });
  }, [careerSlug, match, requestedRank]);

  if (!match || !gap || !entry) {
    return (
      <section className={styles.noResults}>
        <Compass size={28} aria-hidden />
        <h1>این تحلیل در دسترس نیست</h1>
        <p>مهارت‌ها را دوباره مرور کن و یکی از مسیرهای نتیجه را باز کن.</p>
        <button type="button" onClick={onBack}>بازگشت به نتایج</button>
      </section>
    );
  }

  function handleSave() {
    if (!pathId || isSaved) return;
    if (savePath(pathId)) trackCareerEvent("career_path_saved", { pathId });
  }

  return (
    <section className={styles.gapPage} aria-labelledby="skill-gap-title">
      <button type="button" className={styles.backButton} onClick={onBack}>
        <ArrowRight size={18} aria-hidden /> بازگشت به مسیرها
      </button>
      <header className={styles.gapHeader}>
        <span className={styles.eyebrow}><CircleDot size={16} aria-hidden /> فاصله مهارتی قابل‌بررسی</span>
        <h1 id="skill-gap-title">{match.titleFa}</h1>
        <span dir="ltr">{match.titleEn}</span>
        <p>{match.explanation}</p>
        <ResultCounts match={match} />
      </header>

      <CurrentSkills gap={gap} />
      <GapGroup title="مهارت‌های نرم برای تقویت" description="رفتارها و توانایی‌های همکاری که در شروع این مسیر مهم‌اند." items={gap.soft} type="soft" />
      <ProfessionalGapGroup gap={gap} />
      <GapGroup title="ابزارها و نرم‌افزارها" description="ابزارهایی که برای شروع یا پیشرفت در جریان کاری لازم می‌شوند." items={gap.tools} type="tool" />

      <div className={styles.gapActions} aria-label="اقدام‌های مسیر شغلی">
        <Link
          className={styles.primaryAction}
          href={entry.pageHref}
          onClick={() => trackCareerEvent("career_skill_path_opened", {
            careerSlug,
            resultRank: requestedRank,
            matchedCount: match.matchedCurrent.length + match.matchedInterests.length,
            missingCoreCount: match.missingCore.length
          })}
        >
          <Compass size={18} aria-hidden /> مشاهده کامل مسیر
        </Link>
        <button type="button" className={styles.secondaryAction} onClick={handleSave} disabled={isSaved}>
          <Bookmark size={18} weight={isSaved ? "fill" : "duotone"} aria-hidden />
          {isSaved ? "مسیر ذخیره شده" : "ذخیره مسیر"}
        </button>
        <Link className={styles.secondaryAction} href={`/career/compare?path=${encodeURIComponent(entry.slug)}`}>
          <GitCompareArrows size={18} aria-hidden /> مقایسه با مسیر دیگر
        </Link>
      </div>
    </section>
  );
}

export function CareerSkillsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile, selectSkill, removeSkill, resetProfile } = useCareerSkillProfile();
  const careerSlug = searchParams.get("path");
  const showResults = searchParams.get("view") === "results";
  const requestedRank = Math.max(1, Number(searchParams.get("rank")) || 1);

  useEffect(() => {
    trackCareerEvent("career_skill_page_viewed");
  }, []);

  function handleSelect(item: SkillCatalogItem, state: SkillSelectionState) {
    const current = profile.selections.find((selection) => selection.skillId === item.id);
    selectSkill(item.id, state);
    trackCareerEvent(current ? "career_skill_state_changed" : "career_skill_selected", {
      skillId: item.id,
      skillType: item.type,
      selectionState: state
    });
  }

  function handleRemove(item: SkillCatalogItem) {
    removeSkill(item.id);
    trackCareerEvent("career_skill_removed", { skillId: item.id, skillType: item.type });
  }

  function requestResults() {
    const haveCount = profile.selections.filter((selection) => selection.state === "have").length;
    trackCareerEvent("career_skill_results_requested", {
      selectedCount: profile.selections.length,
      haveCount,
      interestedCount: profile.selections.length - haveCount
    });
    router.push("/career/skills?view=results");
  }

  function openMatch(match: CareerSkillMatch, rank: number) {
    trackCareerEvent("career_skill_match_viewed", {
      careerSlug: match.careerSlug,
      resultRank: rank,
      matchedCount: match.matchedCurrent.length + match.matchedInterests.length,
      missingCoreCount: match.missingCore.length
    });
    router.push(`/career/skills?path=${encodeURIComponent(match.careerSlug)}&rank=${rank}`);
  }

  return (
    <main className={styles.page} dir="rtl" data-career-skills-page>
      {careerSlug ? (
        <SkillGapView
          profile={profile}
          careerSlug={careerSlug}
          requestedRank={requestedRank}
          onBack={() => router.push("/career/skills?view=results")}
        />
      ) : showResults ? (
        <SkillResultsView
          profile={profile}
          onBack={() => router.push("/career/skills")}
          onOpenMatch={openMatch}
        />
      ) : (
        <SkillSelectionView
          profile={profile}
          onSelect={handleSelect}
          onRemove={handleRemove}
          onReset={resetProfile}
          onRequestResults={requestResults}
        />
      )}
    </main>
  );
}
