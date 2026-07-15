"use client";

import Image from "next/image";
import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import type { UIEvent } from "react";
import type { CareerIcon } from "./CareerIcons";
import {
  BriefcaseBusiness,
  BookOpen,
  ChartNoAxesCombined,
  CircleDollarSign,
  Code2,
  Compass,
  Layers3,
  Megaphone,
  Palette,
  RotateCcw,
  Route,
  Sparkles,
  Users,
  Waypoints
} from "./CareerIcons";
import { visibleCareerHierarchy as careerHierarchy } from "./career-data";
import {
  SoftBackIcon,
  SoftChevronIcon,
  SoftCloseIcon,
  SoftEssentialIcon,
  SoftSearchIcon
} from "./CareerSoftIcons";
import { getCareerPathSeoEntryByPathId } from "./career-path-seo";
import type {
  CareerDomainNode,
  CareerGeneralCategoryNode,
  CareerHierarchySelection,
  CareerSearchResult,
  CareerSubfamilyNode
} from "./career-types";
import {
  getCategoryContextSelection,
  getDomainContextSelection,
  getMeaningfulParentSelection,
  resolveCategorySelection,
  resolveDomainSelection,
  searchCareerHierarchy
} from "./career-utils";
import styles from "./CareerPages.module.css";

const INITIAL_SEARCH_RESULTS = 10;
const SEARCH_RESULTS_STEP = 10;

const TOP_LEVEL_DOMAIN_PRIORITY = [
  "Marketing & Growth",
  "Product & UX",
  "Data & AI"
] as const;

const prioritizedDomainNames = new Set<string>(TOP_LEVEL_DOMAIN_PRIORITY);
const orderedTopLevelDomains = [
  ...TOP_LEVEL_DOMAIN_PRIORITY.flatMap((domainName) => (
    careerHierarchy.filter((domain) => domain.name === domainName)
  )),
  ...careerHierarchy.filter((domain) => !prioritizedDomainNames.has(domain.name))
];

const domainLabels: Readonly<Record<string, string>> = {
  "Technology & Engineering": "فناوری و مهندسی",
  "Revenue & Customer Operations": "ارتباط با مشتری",
  "Data & AI": "داده و هوش مصنوعی",
  "People & Organization": "منابع انسانی و سازمان",
  "Marketing & Growth": "بازاریابی و رشد",
  "Business Operations": "عملیات کسب‌وکار",
  "Product & UX": "محصول و تجربه کاربری",
  "مالی و حسابداری": "مالی و حسابداری",
  "طراحی گرافیک و محتوای بصری": "طراحی گرافیک و محتوای بصری"
};

const generalCategoryLabels: Readonly<Record<string, string>> = {
  "Backend Engineering": "مهندسی بک‌اند",
  "Cybersecurity & Information Security": "امنیت سایبری و اطلاعات",
  "DevOps, Cloud & SRE": "دواپس، رایانش ابری و SRE",
  "Frontend Engineering": "مهندسی فرانت‌اند",
  "Full-Stack Engineering": "مهندسی فول‌استک",
  "IT Infrastructure & Support": "زیرساخت و پشتیبانی فناوری اطلاعات",
  "Mobile Engineering": "مهندسی موبایل",
  "QA & Software Testing": "تضمین کیفیت و تست نرم‌افزار",
  "CRM, Retention & Lifecycle": "ارتباط، نگهداشت و چرخه عمر مشتری",
  "Customer Experience & Success": "تجربه و موفقیت مشتری",
  "Sales & Business Development": "بازرگانی و توسعه بازار",
  "Data, BI & AI": "داده، هوش تجاری و هوش مصنوعی",
  "HR, Talent & People": "منابع انسانی و استعداد",
  "Marketing & Growth": "بازاریابی و رشد",
  "Operations, Logistics & Supply Chain": "عملیات، لجستیک و زنجیره تأمین",
  "Product Management & UX": "مدیریت محصول و تجربه کاربری",
  "مالی و حسابداری": "مالی و حسابداری",
  "طراحی گرافیک و خلاقه": "طراحی گرافیک و خلاقه"
};

const approvedTaxonomyLabels: Readonly<Record<string, string>> = {
  "Growth Marketing": "بازاریابی رشد"
};

const domainIcons: Readonly<Record<string, CareerIcon>> = {
  "Technology & Engineering": Code2,
  "Revenue & Customer Operations": Waypoints,
  "Sales & Business Development": BriefcaseBusiness,
  "Data & AI": ChartNoAxesCombined,
  "People & Organization": Users,
  "Marketing & Growth": Megaphone,
  "Business Operations": BriefcaseBusiness,
  "Product & UX": Sparkles,
  "مالی و حسابداری": CircleDollarSign,
  "طراحی گرافیک و محتوای بصری": Palette
};

const levelLabels = [
  { full: "انتخاب حوزه شغلی", compact: "حوزه شغلی" },
  { full: "انتخاب دسته شغلی (اگر لازم بود)", compact: "دسته شغلی" },
  { full: "انتخاب مسیر شغلی", compact: "مسیر شغلی" },
  { full: "مشاهده مسیر شغلی", compact: "مشاهده مسیر" }
] as const;

export function getDisplayLabel(value: string): string {
  return domainLabels[value] ?? generalCategoryLabels[value] ?? approvedTaxonomyLabels[value] ?? value;
}

type StepIndicatorProps = Readonly<{ currentLevel: number }>;

function StepIndicator({ currentLevel }: StepIndicatorProps) {
  return (
    <ol className={styles.stepIndicator} aria-label="مراحل انتخاب مسیر شغلی">
      {levelLabels.map((label, index) => {
        const level = index + 1;
        const className = level === currentLevel
          ? styles.stepActive
          : (level < currentLevel ? styles.stepComplete : styles.stepPending);

        return (
          <li className={className} key={label.full} aria-current={level === currentLevel ? "step" : undefined}>
            <span className={styles.stepNumber}>{level.toLocaleString("fa-IR")}</span>
            <strong>
              <span className={styles.stepLabelDesktop}>{label.full}</span>
              <span className={styles.stepLabelMobile}>{label.compact}</span>
            </strong>
          </li>
        );
      })}
    </ol>
  );
}

type HierarchyToolbarProps = Readonly<{
  currentLevel: number;
  domain?: CareerDomainNode;
  category?: CareerGeneralCategoryNode;
  subfamily?: CareerSubfamilyNode;
  onBack: () => void;
  onStartOver: () => void;
  onGoToDomain: () => void;
  onGoToCategory: () => void;
  domainNavigable: boolean;
  categoryNavigable: boolean;
  categoryRepeatsDomain: boolean;
}>;

function HierarchyToolbar({
  currentLevel,
  domain,
  category,
  subfamily,
  onBack,
  onStartOver,
  onGoToDomain,
  onGoToCategory,
  domainNavigable,
  categoryNavigable,
  categoryRepeatsDomain
}: HierarchyToolbarProps) {
  return (
    <div className={styles.hierarchyToolbar}>
      <nav className={styles.breadcrumbs} aria-label="مسیر انتخاب‌شده">
        <button type="button" onClick={onStartOver}>حوزه</button>
        {domain ? (
          <>
            <SoftChevronIcon size={14} />
            {domainNavigable ? <button type="button" onClick={onGoToDomain}>{getDisplayLabel(domain.name)}</button> : <span>{getDisplayLabel(domain.name)}</span>}
          </>
        ) : null}
        {category && !categoryRepeatsDomain ? (
          <>
            <SoftChevronIcon size={14} />
            {categoryNavigable ? <button type="button" onClick={onGoToCategory}>{getDisplayLabel(category.name)}</button> : <span>{getDisplayLabel(category.name)}</span>}
          </>
        ) : null}
        {subfamily ? (
          <>
            <SoftChevronIcon size={14} />
            <span dir="auto">{getDisplayLabel(subfamily.name)}</span>
          </>
        ) : null}
      </nav>

      <div className={styles.hierarchyActions}>
        {currentLevel > 1 ? (
          <button type="button" className={styles.backButton} onClick={onBack}>
            <SoftBackIcon size={17} />
            مرحله قبل
          </button>
        ) : null}
        {currentLevel > 1 ? (
          <button type="button" className={styles.resetButton} onClick={onStartOver}>
            <RotateCcw size={16} aria-hidden />
            همه مسیرها
          </button>
        ) : null}
      </div>
    </div>
  );
}

type DomainAccent = "blue" | "teal" | "yellow" | "persimmon" | "connection";

// Repeating a fixed sequence keeps the discovery palette balanced as taxonomy data changes.
const domainAccentSequence: readonly DomainAccent[] = ["yellow", "persimmon", "blue", "teal", "connection"];

export function getDomainAccent(domainName: string, index: number): DomainAccent {
  // These two identities have explicit brand-approved colors; the remaining
  // domains use the balanced discovery sequence.
  if (domainName === "Data & AI") return "blue";
  if (domainName === "Revenue & Customer Operations") return "teal";
  return domainAccentSequence[index % domainAccentSequence.length] ?? "blue";
}

type DomainCardProps = Readonly<{
  domain: CareerDomainNode;
  onSelect: (domain: CareerDomainNode) => void;
  accent?: DomainAccent;
}>;

export function DomainCard({ domain, onSelect, accent = "blue" }: DomainCardProps) {
  const Icon = domainIcons[domain.name] ?? Compass;
  const accentClass = {
    blue: styles.domainAccentBlue,
    teal: styles.domainAccentTeal,
    yellow: styles.domainAccentYellow,
    persimmon: styles.domainAccentPersimmon,
    connection: styles.domainAccentConnection
  }[accent];

  return (
    <button
      type="button"
      className={styles.domainCard}
      data-career-domain-card={domain.id}
      onClick={() => onSelect(domain)}
    >
      <span className={`${styles.domainIcon} ${accentClass}`} data-career-domain-part="icon" data-domain-accent={accent} aria-hidden><Icon size={24} /></span>
      <span className={styles.discoveryCardCopy} data-career-domain-part="title">
        <strong>{getDisplayLabel(domain.name)}</strong>
        <small>{domain.subfamilyCount.toLocaleString("fa-IR")} مسیر شغلی</small>
      </span>
      <span className={styles.forwardIcon} data-career-domain-part="arrow" aria-hidden><SoftChevronIcon size={18} /></span>
    </button>
  );
}

type CategoryCardProps = Readonly<{
  category: CareerGeneralCategoryNode;
  onSelect: (category: CareerGeneralCategoryNode) => void;
  accent?: DomainAccent;
}>;

export function getCategoryAccent(index: number): DomainAccent {
  return domainAccentSequence[index % domainAccentSequence.length] ?? "blue";
}

export function CategoryCard({ category, onSelect, accent = "blue" }: CategoryCardProps) {
  const accentClass = {
    blue: styles.categoryAccentBlue,
    teal: styles.categoryAccentTeal,
    yellow: styles.categoryAccentYellow,
    persimmon: styles.categoryAccentPersimmon,
    connection: styles.categoryAccentConnection
  }[accent];

  return (
    <button
      type="button"
      className={`${styles.categoryCard} ${accentClass}`}
      data-career-category-card={category.id}
      data-category-accent={accent}
      onClick={() => onSelect(category)}
    >
      <span className={styles.categoryCardTopline}>
        <span className={styles.categoryIcon} aria-hidden><Layers3 size={21} /></span>
        <span className={styles.itemCount}>{category.subfamilies.length.toLocaleString("fa-IR")} مسیر شغلی</span>
      </span>
      <strong>{getDisplayLabel(category.name)}</strong>
      <span className={styles.midPreview}>
        {category.midCategories.slice(0, 2).map((midCategory) => <small key={midCategory} dir="auto">{getDisplayLabel(midCategory)}</small>)}
      </span>
      <span className={styles.forwardText}>دیدن مسیرها <SoftChevronIcon size={16} /></span>
    </button>
  );
}

type SubfamilyCardProps = Readonly<{
  subfamily: CareerSubfamilyNode;
  onSelect: (subfamily: CareerSubfamilyNode) => void;
}>;

export function SubfamilyCard({ subfamily, onSelect }: SubfamilyCardProps) {
  return (
    <button type="button" className={styles.subfamilyCard} data-career-subfamily-card={subfamily.id} onClick={() => onSelect(subfamily)}>
      <span className={styles.subfamilyIcon} aria-hidden><Route size={19} /></span>
      <span className={styles.subfamilyCopy}>
        <strong dir="auto">{getDisplayLabel(subfamily.name)}</strong>
        <small dir="auto">{getDisplayLabel(subfamily.midCategory)}</small>
      </span>
      <SoftChevronIcon className={styles.subfamilyChevron} size={18} />
    </button>
  );
}

type PriorityGroupProps = Readonly<{
  primaryItems: readonly string[];
  supportingItems: readonly string[];
  kind: "technical" | "tool" | "soft";
}>;

type EssentialChipProps = Readonly<{
  item: string;
  kind: PriorityGroupProps["kind"];
}>;

export function EssentialChip({ item, kind }: EssentialChipProps) {
  const variantClass = kind === "technical"
    ? styles.priorityTechnical
    : (kind === "tool" ? styles.priorityTool : styles.prioritySoft);

  return (
    <span className={`${styles.essentialChip} ${variantClass}`} dir="ltr">
      <span className={styles.essentialStar} data-essential-part="star" aria-hidden>
        <SoftEssentialIcon size={12} />
      </span>
      <span className={styles.essentialItem} data-essential-part="item" dir="auto">{item}</span>
      <span className={styles.essentialSeparator} data-essential-part="separator" aria-hidden />
      <strong className={styles.essentialLabel} data-essential-part="label" dir="rtl">ضروری</strong>
    </span>
  );
}

export function PriorityGroup({ primaryItems, supportingItems, kind }: PriorityGroupProps) {
  if (!primaryItems.length && !supportingItems.length) return null;

  const secondaryClass = kind === "tool"
    ? styles.toolTag
    : (kind === "soft" ? styles.softTag : styles.neutralTag);

  return (
    <div className={styles.priorityGroup}>
      {primaryItems.length ? (
        <div className={styles.essentialGroup}>
          {primaryItems.map((item) => <EssentialChip item={item} kind={kind} key={item} />)}
        </div>
      ) : null}
      {supportingItems.length ? (
        <div className={styles.supportingGroup}>
          {supportingItems.map((item) => <span className={secondaryClass} key={item} dir="auto">{item}</span>)}
        </div>
      ) : null}
    </div>
  );
}

export function GuideEntryCard() {
  return (
    <aside className={styles.guideEntryCard} aria-labelledby="career-guide-entry-title">
      <span className={styles.guideEntryIcon} aria-hidden><BookOpen size={22} /></span>
      <div>
        <h2 id="career-guide-entry-title">نمی‌دونی از کدام مسیر شغلی شروع کنی؟</h2>
        <p>راهنمای انتخاب مسیر شغلی را ببین.</p>
      </div>
      <Link href="/career/guide">دیدن راهنما</Link>
    </aside>
  );
}

type SearchResultsProps = Readonly<{
  query: string;
  results: readonly CareerSearchResult[];
  visibleCount: number;
  onSelect: (result: CareerSearchResult) => void;
  onShowMore: () => void;
  onClear: () => void;
}>;

export function SearchResults({ query, results, visibleCount, onSelect, onShowMore, onClear }: SearchResultsProps) {
  const visibleResults = results.slice(0, visibleCount);

  return (
    <section className={styles.levelSection} aria-labelledby="career-search-results-title">
      <div className={styles.levelHeading}>
        <div>
          <span>جست‌وجوی سراسری</span>
          <h2 id="career-search-results-title">نتایج برای «{query}»</h2>
          <p>{results.length.toLocaleString("fa-IR")} مسیر شغلی مرتبط در ساختار شغلی پیدا شد.</p>
        </div>
        <button type="button" className={styles.clearSearchButton} onClick={onClear}>پاک‌کردن جست‌وجو</button>
      </div>

      {visibleResults.length ? (
        <>
          <div className={styles.searchResultList}>
            {visibleResults.map((result) => (
              <button type="button" className={styles.searchResultCard} key={result.subfamily.id} onClick={() => onSelect(result)}>
                <span className={styles.searchResultReason}>{result.matchReason}</span>
                <span className={styles.searchResultPath}>
                  {getDisplayLabel(result.subfamily.domain)} <SoftChevronIcon size={13} />
                  {getDisplayLabel(result.subfamily.domain) !== getDisplayLabel(result.subfamily.generalCategory) ? (
                    <>{getDisplayLabel(result.subfamily.generalCategory)} <SoftChevronIcon size={13} /></>
                  ) : null}
                  <strong dir="auto">{getDisplayLabel(result.subfamily.name)}</strong>
                </span>
                <span className={styles.searchResultMeta}>
                  <small dir="auto">{getDisplayLabel(result.subfamily.midCategory)}</small>
                </span>
                <SoftChevronIcon className={styles.searchResultChevron} size={18} />
              </button>
            ))}
          </div>
          {visibleCount < results.length ? <button type="button" className={styles.showMoreResults} onClick={onShowMore}>نمایش نتایج بیشتر</button> : null}
        </>
      ) : (
        <div className={styles.noResults}>
          <span className={styles.noResultsIcon} aria-hidden><SoftSearchIcon size={26} /></span>
          <span className={styles.noResultsAccent} aria-hidden />
          <h3>نتیجه‌ای در این ساختار پیدا نشد</h3>
          <p>عنوان، مهارت یا ابزار دیگری را امتحان کن.</p>
          <button type="button" onClick={onClear}>بازگشت به مسیر قبلی</button>
        </div>
      )}
    </section>
  );
}

export function groupRelatedCareerPaths(
  paths: readonly CareerSubfamilyNode[]
): readonly (readonly CareerSubfamilyNode[])[] {
  const groups: CareerSubfamilyNode[][] = [];

  for (let index = 0; index < paths.length; index += 3) {
    groups.push(paths.slice(index, index + 3));
  }

  return groups;
}

type RelatedPathsSectionProps = Readonly<{
  paths: readonly CareerSubfamilyNode[];
  onSelect: (subfamily: CareerSubfamilyNode) => void;
}>;

function RelatedPathCopy({ path }: Readonly<{ path: CareerSubfamilyNode }>) {
  return (
    <span className={styles.relatedPathCopy}>
      <strong dir="auto">{getDisplayLabel(path.name)}</strong>
      <small dir="auto">{getDisplayLabel(path.midCategory)}</small>
    </span>
  );
}

export function RelatedPathsSection({ paths, onSelect }: RelatedPathsSectionProps) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const scrollFrameRef = useRef<number | null>(null);
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);
  const featuredPath = paths[0];
  const pathGroups = groupRelatedCareerPaths(paths.slice(1));

  useEffect(() => () => {
    if (scrollFrameRef.current !== null) {
      window.cancelAnimationFrame(scrollFrameRef.current);
    }
  }, []);

  if (!featuredPath) return null;

  function handleCarouselScroll(event: UIEvent<HTMLDivElement>) {
    const carousel = event.currentTarget;

    if (scrollFrameRef.current !== null) {
      window.cancelAnimationFrame(scrollFrameRef.current);
    }

    scrollFrameRef.current = window.requestAnimationFrame(() => {
      const carouselRect = carousel.getBoundingClientRect();
      const carouselCenter = carouselRect.left + carouselRect.width / 2;
      let closestGroupIndex = 0;
      let closestDistance = Number.POSITIVE_INFINITY;

      Array.from(carousel.children).forEach((group, groupIndex) => {
        const groupRect = group.getBoundingClientRect();
        const groupCenter = groupRect.left + groupRect.width / 2;
        const distance = Math.abs(groupCenter - carouselCenter);

        if (distance < closestDistance) {
          closestDistance = distance;
          closestGroupIndex = groupIndex;
        }
      });

      setActiveGroupIndex((currentIndex) => (
        currentIndex === closestGroupIndex ? currentIndex : closestGroupIndex
      ));
      scrollFrameRef.current = null;
    });
  }

  function showRelatedGroup(groupIndex: number) {
    const group = carouselRef.current?.children.item(groupIndex);
    if (!(group instanceof HTMLElement)) return;

    group.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "start"
    });
    setActiveGroupIndex(groupIndex);
  }

  return (
    <section className={styles.relatedPathsSection} aria-labelledby="career-related-paths-title">
      <div className={styles.relatedPathsTopline}>
        <div className={styles.relatedPathsHeading}>
          <h3 id="career-related-paths-title">مسیرهای مشابه برای بررسی</h3>
          <p>مسیرهایی که از نظر دسته یا حوزه شغلی به این مسیر نزدیک‌اند.</p>
        </div>
      </div>

      <button
        type="button"
        className={styles.relatedFeaturedCard}
        data-related-featured="true"
        onClick={() => onSelect(featuredPath)}
      >
        <span className={styles.relatedFeaturedIcon} aria-hidden><Route size={20} /></span>
        <span className={styles.relatedFeaturedCopy}>
          <span className={styles.relatedFeaturedLabel}>پیشنهاد نزدیک</span>
          <RelatedPathCopy path={featuredPath} />
        </span>
        <SoftChevronIcon className={styles.relatedPathChevron} size={19} />
      </button>

      {pathGroups.length ? (
        <>
          <div
            className={styles.relatedCarousel}
            aria-label="مسیرهای مشابه بیشتر"
            onScroll={handleCarouselScroll}
            tabIndex={0}
            ref={carouselRef}
          >
            {pathGroups.map((group, groupIndex) => (
              <div
                className={styles.relatedPathGroup}
                data-related-group-index={groupIndex}
                data-related-group-size={group.length}
                key={`${group[0].id}-${groupIndex}`}
              >
                {group.map((path) => (
                  <button type="button" className={styles.relatedPathCard} onClick={() => onSelect(path)} key={path.id}>
                    <RelatedPathCopy path={path} />
                    <SoftChevronIcon className={styles.relatedPathChevron} size={17} />
                  </button>
                ))}
              </div>
            ))}
          </div>
          {pathGroups.length > 1 ? (
            <div className={styles.relatedPagination} aria-live="polite">
              {pathGroups.map((group, groupIndex) => (
                <button
                  type="button"
                  className={groupIndex === activeGroupIndex ? styles.relatedPaginationDotActive : styles.relatedPaginationDot}
                  data-related-pagination-dot={groupIndex}
                  aria-label={`نمایش گروه ${groupIndex + 1}`}
                  aria-current={groupIndex === activeGroupIndex ? "page" : undefined}
                  onClick={() => showRelatedGroup(groupIndex)}
                  key={`related-dot-${group[0].id}`}
                />
              ))}
              <span className={styles.srOnly}>گروه {activeGroupIndex + 1} از {pathGroups.length}</span>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}

type PathsPageProps = Readonly<{
  initialDomainId?: string;
  initialCategoryId?: string;
}>;

function getInitialExplorerSelection(
  domainId?: string,
  categoryId?: string
): CareerHierarchySelection | undefined {
  const domain = careerHierarchy.find((item) => item.id === domainId);
  if (!domain) return undefined;
  const category = domain.generalCategories.find((item) => item.id === categoryId);

  return {
    domainId: domain.id,
    ...(category ? { categoryId: category.id } : {})
  };
}

export function getCareerExplorerHref(selection: CareerHierarchySelection): string {
  const params = new URLSearchParams();
  if (selection.domainId) params.set("domain", selection.domainId);
  if (selection.categoryId) params.set("category", selection.categoryId);
  const query = params.toString();
  return query ? `/?${query}` : "/";
}

export function isInitialExplorerState(selection: CareerHierarchySelection): boolean {
  return !selection.domainId && !selection.categoryId && !selection.subfamilyId;
}

export function PathsPage({
  initialDomainId,
  initialCategoryId
}: PathsPageProps = {}) {
  const initialSelection = getInitialExplorerSelection(initialDomainId, initialCategoryId);
  const [selectedDomainId, setSelectedDomainId] = useState<string | undefined>(() => initialSelection?.domainId);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(() => initialSelection?.categoryId);
  const [query, setQuery] = useState("");
  const [visibleSearchResults, setVisibleSearchResults] = useState(INITIAL_SEARCH_RESULTS);
  const flowStartRef = useRef<HTMLDivElement>(null);
  const hasRenderedInitialLevel = useRef(false);
  const deferredQuery = useDeferredValue(query);

  const selectedDomain = careerHierarchy.find((domain) => domain.id === selectedDomainId);
  const selectedCategory = selectedDomain?.generalCategories.find((category) => category.id === selectedCategoryId);
  const currentLevel = selectedCategory ? 3 : (selectedDomain ? 2 : 1);
  const isInitialExplorer = isInitialExplorerState({
    domainId: selectedDomainId,
    categoryId: selectedCategoryId
  });
  const categoryRepeatsDomain = Boolean(
    selectedDomain
    && selectedCategory
    && getDisplayLabel(selectedDomain.name) === getDisplayLabel(selectedCategory.name)
  );
  const searchResults = useMemo(() => searchCareerHierarchy(careerHierarchy, deferredQuery), [deferredQuery]);
  const searching = Boolean(deferredQuery.trim());
  const domainContextSelection = selectedDomain ? getDomainContextSelection(selectedDomain) : undefined;
  const categoryContextSelection = selectedDomain && selectedCategory
    ? getCategoryContextSelection(selectedDomain, selectedCategory)
    : undefined;
  const contextTargetsMatch = Boolean(
    domainContextSelection
    && categoryContextSelection
    && domainContextSelection.domainId === categoryContextSelection.domainId
    && domainContextSelection.categoryId === categoryContextSelection.categoryId
  );
  const domainNavigable = categoryRepeatsDomain
    ? false
    : Boolean(
      domainContextSelection
      && !contextTargetsMatch
      && domainContextSelection.categoryId !== selectedCategoryId
    );
  const categoryNavigable = false;

  useEffect(() => {
    if (!hasRenderedInitialLevel.current) {
      hasRenderedInitialLevel.current = true;
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      flowStartRef.current?.scrollIntoView({ block: "start" });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [currentLevel, searching]);

  function applyHierarchySelection(selection: CareerHierarchySelection) {
    window.history.replaceState(window.history.state, "", getCareerExplorerHref(selection));
    setSelectedDomainId(selection.domainId);
    setSelectedCategoryId(selection.categoryId);
  }

  function selectDomain(domain: CareerDomainNode) {
    const selection = resolveDomainSelection(domain);
    if (openResolvedCareerPath(domain, selection)) return;
    applyHierarchySelection(selection);
  }

  function selectCategory(category: CareerGeneralCategoryNode) {
    if (!selectedDomain) return;
    const selection = resolveCategorySelection(selectedDomain, category);
    if (openResolvedCareerPath(selectedDomain, selection)) return;
    applyHierarchySelection(selection);
  }

  function openCareerDecisionPage(subfamily: CareerSubfamilyNode) {
    const seoEntry = getCareerPathSeoEntryByPathId(subfamily.id);
    if (!seoEntry) return false;

    window.location.assign(seoEntry.pageHref);
    return true;
  }

  function openResolvedCareerPath(
    domain: CareerDomainNode,
    selection: CareerHierarchySelection
  ) {
    if (!selection.categoryId || !selection.subfamilyId) return false;
    const category = domain.generalCategories.find((item) => item.id === selection.categoryId);
    const subfamily = category?.subfamilies.find((item) => item.id === selection.subfamilyId);
    return subfamily ? openCareerDecisionPage(subfamily) : false;
  }

  function selectSubfamily(subfamily: CareerSubfamilyNode) {
    openCareerDecisionPage(subfamily);
  }

  function selectSearchResult(result: CareerSearchResult) {
    openCareerDecisionPage(result.subfamily);
  }

  function updateQuery(value: string) {
    setQuery(value);
    setVisibleSearchResults(INITIAL_SEARCH_RESULTS);
  }

  function startOver() {
    applyHierarchySelection({});
    setQuery("");
  }

  function backOneLevel() {
    applyHierarchySelection(getMeaningfulParentSelection(selectedDomain, selectedCategory));
  }

  function goToDomainContext() {
    const selection = categoryRepeatsDomain ? categoryContextSelection : domainContextSelection;
    if (!selection) return;
    applyHierarchySelection(selection);
  }

  function goToCategoryContext() {
    if (!categoryContextSelection) return;
    applyHierarchySelection(categoryContextSelection);
  }

  return (
    <section
      className={isInitialExplorer ? styles.careerPathsPage : `${styles.careerPathsPage} ${styles.careerPathsPageFocus}`}
      data-career-paths
      aria-labelledby={isInitialExplorer ? "career-paths-title" : undefined}
      aria-label={isInitialExplorer ? undefined : "مسیرهای شغلی"}
    >
      {isInitialExplorer ? (
        <div className={styles.careerHero}>
          <div className={styles.heroCopy}>
            <div className={styles.heroCopyText}>
              <h1 id="career-paths-title"><span className={styles.heroHighlight}>مسیر مناسب خودت</span> را<br />قدم‌به‌قدم پیدا کن</h1>
              <p>ده‌ها هزار آگهی شغلی بررسی شده تا تو مسیرها را روشن‌تر ببینی و مسیر شغلی بهتری انتخاب کنی.</p>
            </div>
            <Image
              className={styles.heroMascot}
              src="/brand/Mascot/useravaa-mascot-magnifier-eye.webp"
              alt=""
              width={240}
              height={240}
              sizes="(min-width: 620px) 168px, 78px"
              priority
              aria-hidden
            />
          </div>
          <label className={styles.heroSearch}>
            <SoftSearchIcon size={22} />
            <span className={styles.srOnly}>جست‌وجوی سراسری مسیر شغلی</span>
            <input data-career-search type="search" value={query} onChange={(event) => updateQuery(event.target.value)} placeholder="عنوان، مهارت یا ابزار را جست‌وجو کن" />
            {query ? <button type="button" aria-label="پاک‌کردن جست‌وجو" onClick={() => updateQuery("")}><SoftCloseIcon size={18} /></button> : null}
          </label>
        </div>
      ) : null}

      <div className={isInitialExplorer ? styles.flowStart : `${styles.flowStart} ${styles.flowStartFocused}`} ref={flowStartRef}>
        {isInitialExplorer ? <StepIndicator currentLevel={currentLevel} /> : null}
        {!isInitialExplorer ? (
          <HierarchyToolbar
            currentLevel={currentLevel}
            domain={selectedDomain}
            category={selectedCategory}
            onBack={backOneLevel}
            onStartOver={startOver}
            onGoToDomain={goToDomainContext}
            onGoToCategory={goToCategoryContext}
            domainNavigable={domainNavigable}
            categoryNavigable={categoryNavigable}
            categoryRepeatsDomain={categoryRepeatsDomain}
          />
        ) : null}
      </div>

      {isInitialExplorer && searching ? (
        <SearchResults
          query={deferredQuery}
          results={searchResults}
          visibleCount={visibleSearchResults}
          onSelect={selectSearchResult}
          onShowMore={() => setVisibleSearchResults((count) => count + SEARCH_RESULTS_STEP)}
          onClear={() => updateQuery("")}
        />
      ) : null}

      {!searching && currentLevel === 1 ? (
        <>
          <section className={styles.levelSection} aria-labelledby="career-domain-title">
            <div className={styles.levelHeading}>
              <div><span>مرحله اول</span><h2 id="career-domain-title">حوزه‌ای که کنجکاوت می‌کند</h2><p>یکی از ۱۰ حوزه واقعی را انتخاب کن تا دسته‌های داخلش را ببینی.</p></div>
              <Compass size={24} aria-hidden />
            </div>
            <div className={styles.domainGrid}>{orderedTopLevelDomains.map((domain, index) => {
              const accent = getDomainAccent(domain.name, index);
              return <DomainCard domain={domain} onSelect={selectDomain} accent={accent} key={domain.id} />;
            })}</div>
          </section>
          <GuideEntryCard />
        </>
      ) : null}

      {!searching && currentLevel === 2 && selectedDomain ? (
        <section className={styles.levelSection} aria-labelledby="career-category-title">
          <div className={styles.levelHeading}>
            <div><span>مرحله دوم · {getDisplayLabel(selectedDomain.name)}</span><h2 id="career-category-title">دسته شغلی را انتخاب کن</h2><p>{selectedDomain.generalCategories.length.toLocaleString("fa-IR")} دسته در این حوزه قرار دارد.</p></div>
            <Layers3 size={24} aria-hidden />
          </div>
          <div className={styles.categoryGrid}>{selectedDomain.generalCategories.map((category, index) => <CategoryCard category={category} onSelect={selectCategory} accent={getCategoryAccent(index)} key={category.id} />)}</div>
        </section>
      ) : null}

      {!searching && currentLevel === 3 && selectedCategory ? (
        <section className={styles.levelSection} aria-labelledby="career-subfamily-title">
          <div className={styles.levelHeading}>
            <div>
              <span>{categoryRepeatsDomain ? "انتخاب مسیر" : "مرحله سوم"} · {getDisplayLabel(selectedCategory.name)}</span>
              <h2 id="career-subfamily-title">مسیر تخصصی را انتخاب کن</h2>
              <p>یکی از مسیرها را انتخاب کن تا جزئیات آن را ببینی.</p>
            </div>
            <Route size={24} aria-hidden />
          </div>
          <div className={styles.subfamilyGrid}>{selectedCategory.subfamilies.map((subfamily) => <SubfamilyCard subfamily={subfamily} onSelect={selectSubfamily} key={subfamily.id} />)}</div>
        </section>
      ) : null}

    </section>
  );
}
