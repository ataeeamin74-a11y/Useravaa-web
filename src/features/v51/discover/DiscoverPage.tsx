"use client";

import Link from "next/link";
import { type FormEvent, type KeyboardEvent, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { MetaChip } from "@/components/ui/MetaChip";
import { StatChip } from "@/components/ui/StatChip";
import { UseravaaIcon } from "@/components/ui/UseravaaIcon";
import { useClickOutside } from "@/lib/use-click-outside";
import { V51Button } from "@/features/v51/components/V51Button";
import {
  formatter,
  getRequestHref,
  profiles,
  type DiscoveryState,
  type ExperienceProfileFixture
} from "@/features/v51/data/profiles";
import { useSavedItems } from "@/features/v51/saved/useSavedItems";
import {
  conversationLanguageOptions,
  emptyDiscoverFilters,
  filterDiscoverProfiles,
  getDiscoverExperienceCompanyOptions,
  getDiscoverJobCategoryOptions,
  getProfileJobTitle,
  getPublicCompanySummary,
  getPublishedInsightCountForProfile,
  getResultCountCopy,
  organizationalLevels,
  searchDiscoverExperienceCompanies,
  searchDiscoverJobCategories,
  toggleFilterValue,
  type ConversationLanguageOption,
  type DiscoverFilters
} from "@/features/v51/data/experience-discovery";
import type { JobField } from "@/features/v51/data/job-fields";
import styles from "./DiscoverPage.module.css";

type DiscoverPageProps = Readonly<{
  initialState: DiscoveryState;
  initialSavedProfileIds?: readonly string[];
  jobCategoryOptions?: readonly JobField[];
  initialJobCategoryComboboxOpen?: boolean;
  initialJobCategorySearchQuery?: string;
  initialCompanyComboboxOpen?: boolean;
  initialCompanySearchQuery?: string;
  heroCopy?: {
    title: string;
    description: string;
  };
}>;

type FilterGroup = keyof DiscoverFilters;

type ActiveFilterChip = {
  key: string;
  group: FilterGroup | "search";
  label: string;
  value?: string;
};

const emptySavedProfileIds: readonly string[] = [];

function classNames(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function SkeletonCards() {
  return (
    <div className={classNames(styles.skeletonGrid, styles.show)} aria-live="polite" aria-label="در حال پیدا کردن تجربه‌های مرتبط">
      {Array.from({ length: 6 }).map((_, index) => (
        <div className={styles.skeletonCard} key={index}>
          <div className={styles.skeletonAvatar} />
          <div className={classNames(styles.skeletonLine, styles.medium)} />
          <div className={classNames(styles.skeletonLine, styles.short)} />
          <span className={styles.skeletonChip} />
          <span className={styles.skeletonChip} />
          <div className={styles.skeletonLine} />
          <div className={classNames(styles.skeletonLine, styles.medium)} />
          <span className={styles.skeletonButton} />
        </div>
      ))}
    </div>
  );
}

function getFilterPlaceholder(label: string, count: number) {
  return count ? `${formatter.format(count)} ${label}` : label;
}

function hasAnyFilter(filters: DiscoverFilters) {
  return Object.values(filters).some((values) => values.length > 0);
}

function activeFilterChips(submittedSearchQuery: string, filters: DiscoverFilters) {
  const chips: ActiveFilterChip[] = [];

  if (submittedSearchQuery.trim()) {
    chips.push({
      key: "search",
      group: "search",
      label: `جستجو: ${submittedSearchQuery.trim()}`
    });
  }

  (Object.entries(filters) as Array<[FilterGroup, string[]]>).forEach(([group, values]) => {
    values.forEach((value) => {
      chips.push({
        key: `${group}-${value}`,
        group,
        label: group === "previousCompanies" ? `تجربه کاری در ${value}` : value,
        value
      });
    });
  });

  return chips;
}

function SearchableFilterCombobox({
  label,
  ariaLabel,
  placeholder,
  selectedValue,
  initialOpen,
  initialQuery,
  availableOptions,
  searchOptions,
  emptyAvailableText = "هنوز گزینه‌ای برای نمایش وجود ندارد",
  emptySearchText = "نتیجه‌ای پیدا نشد",
  onSelect,
  onClear
}: Readonly<{
  label: string;
  ariaLabel: string;
  placeholder: string;
  selectedValue: string;
  initialOpen: boolean;
  initialQuery: string;
  availableOptions: readonly string[];
  searchOptions: (query: string) => string[];
  emptyAvailableText?: string;
  emptySearchText?: string;
  onSelect: (value: string) => void;
  onClear: () => void;
}>) {
  const inputId = useId();
  const listboxId = useId();
  const comboboxRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [query, setQuery] = useState(initialQuery);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const results = useMemo(() => searchOptions(query), [query, searchOptions]);
  const hasAvailableOptions = availableOptions.length > 0;
  const closeCombobox = useCallback(() => setIsOpen(false), []);

  useClickOutside({
    refs: [comboboxRef],
    enabled: isOpen,
    onOutsideClick: closeCombobox
  });

  function chooseValue(value: string) {
    onSelect(value);
    setQuery("");
    setHighlightedIndex(0);
    setIsOpen(false);
  }

  function clearValue() {
    onClear();
    setQuery("");
    setHighlightedIndex(0);
    setIsOpen(false);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setIsOpen(false);
      return;
    }

    if (!isOpen && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      setIsOpen(true);
    }

    if (!results.length) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((current) => (current + 1) % results.length);
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((current) => (current - 1 + results.length) % results.length);
    }

    if (event.key === "Enter" && isOpen) {
      event.preventDefault();
      chooseValue(results[highlightedIndex] ?? results[0]);
    }
  }

  return (
    <div ref={comboboxRef} className={classNames(styles.companyCombobox, (selectedValue || isOpen) && styles.active)}>
      <label htmlFor={inputId}>{label}</label>
      <div className={styles.companyInputWrap}>
        <input
          id={inputId}
          type="search"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-label={ariaLabel}
          placeholder={selectedValue || placeholder}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setHighlightedIndex(0);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
        />
        {selectedValue ? (
          <button className={styles.comboboxClear} type="button" aria-label={`حذف ${label}`} onClick={clearValue}>
            <UseravaaIcon name="close" size={16} />
          </button>
        ) : (
          <span className={styles.comboboxIndicator} aria-hidden="true">
            <UseravaaIcon name="dropdown" size={16} />
          </span>
        )}
      </div>
      {isOpen ? (
        <div className={styles.companyResults} id={listboxId} role="listbox" aria-label={`نتایج ${label}`}>
          {!hasAvailableOptions ? (
            <div className={styles.companyEmpty} role="status">
              {emptyAvailableText}
            </div>
          ) : results.length ? (
            results.map((company, index) => (
              <button
                className={classNames(styles.companyOption, index === highlightedIndex && styles.companyOptionActive)}
                key={company}
                type="button"
                role="option"
                aria-selected={selectedValue === company}
                onMouseEnter={() => setHighlightedIndex(index)}
                onClick={() => chooseValue(company)}
              >
                <span className="button-label">{company}</span>
              </button>
            ))
          ) : (
            <div className={styles.companyEmpty} role="status">
              {emptySearchText}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function ExperienceProfileCard({
  profile,
  isSaved,
  onSave
}: Readonly<{
  profile: ExperienceProfileFixture;
  isSaved: boolean;
  onSave: (profileId: string) => void;
}>) {
  const companyLine = getPublicCompanySummary(profile);
  const publishedInsightCount = getPublishedInsightCountForProfile(profile.id);

  return (
    <article className={styles.card} aria-label={`کارت تجربه ${profile.name}، ${getProfileJobTitle(profile)}`}>
      <div className={styles.cardUtilities}>
        <button
          className={classNames(styles.bookmark, isSaved && styles.saved)}
          aria-label={isSaved ? "ذخیره‌شده" : "ذخیره تجربه"}
          aria-pressed={isSaved}
          type="button"
          onClick={() => onSave(profile.id)}
        >
          <UseravaaIcon name={isSaved ? "unsave" : "save"} size={18} />
          {isSaved ? <span className={`${styles.bookmarkLabel} button-label`}>ذخیره‌شده</span> : null}
        </button>
        {publishedInsightCount > 0 ? (
          <StatChip
            className={styles.insightCountBadge}
            icon="insight"
            value={publishedInsightCount}
            label="بینش"
            ariaLabel={`${formatter.format(publishedInsightCount)} بینش منتشرشده از این تجربه`}
          />
        ) : null}
      </div>

      <header className={styles.head}>
        <Avatar src={profile.avatarUrl} alt="" size="xl" className={styles.avatar} />
        <div className={styles.identity}>
          <h3 className={styles.name}>{profile.name}</h3>
          <p className={styles.role}>{getProfileJobTitle(profile)}</p>
        </div>
      </header>

      <div className={styles.trust}>
        <MetaChip className={classNames(styles.chip, styles.level)}>{profile.orgLevel}</MetaChip>
        <MetaChip className={styles.chip}>{profile.jobCategoriesFa[0]}</MetaChip>
      </div>

      {companyLine ? <div className={styles.companies}>{companyLine}</div> : null}
      <p className={styles.summary}>{profile.professionalSummary}</p>

      <div className={styles.divider} />

      <div className={styles.actions}>
        <Link className={classNames(styles.cta, styles.primary)} href={`/profiles/${profile.id}`}>
          <span className="button-label">مشاهده تجربه</span>
        </Link>
        <Link className={classNames(styles.cta, styles.secondary)} href={getRequestHref(profile.id, 30)}>
          <span className="button-label">هماهنگی جلسه</span>
        </Link>
      </div>
    </article>
  );
}

export function DiscoverPage({
  initialState,
  initialSavedProfileIds = emptySavedProfileIds,
  jobCategoryOptions,
  initialJobCategoryComboboxOpen = false,
  initialJobCategorySearchQuery = "",
  initialCompanyComboboxOpen = false,
  initialCompanySearchQuery = "",
  heroCopy = {
    title: "کشف تجربه‌ها",
    description: "آدم‌های باتجربه را پیدا کنید، تجربه‌شان را بررسی کنید، و در صورت نیاز جلسه مشاوره هماهنگ کنید."
  }
}: DiscoverPageProps) {
  const [searchDraft, setSearchDraft] = useState("");
  const [submittedSearchQuery, setSubmittedSearchQuery] = useState("");
  const [filters, setFilters] = useState<DiscoverFilters>(emptyDiscoverFilters);
  const [discoveryState, setDiscoveryState] = useState<DiscoveryState>(initialState);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { savedProfileIds, toggleSavedProfile: toggleSavedProfileId } = useSavedItems(initialSavedProfileIds);
  const [toastMessage, setToastMessage] = useState("");
  const toastTimeout = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimeout.current) {
        window.clearTimeout(toastTimeout.current);
      }
    };
  }, []);

  const results = useMemo(() => filterDiscoverProfiles(profiles, submittedSearchQuery, filters), [submittedSearchQuery, filters]);
  const chips = useMemo(() => activeFilterChips(submittedSearchQuery, filters), [submittedSearchQuery, filters]);
  const availableJobCategoryOptions = useMemo(
    () => jobCategoryOptions ?? getDiscoverJobCategoryOptions(profiles),
    [jobCategoryOptions]
  );
  const availableCompanyOptions = useMemo(() => getDiscoverExperienceCompanyOptions(profiles), []);
  const activeFilterCount = chips.length;
  const hasActiveFilters = hasAnyFilter(filters);
  const resultCountCopy = getResultCountCopy(results.length, submittedSearchQuery, hasActiveFilters);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittedSearchQuery(searchDraft);
  }

  function updateFilter<TKey extends FilterGroup>(key: TKey, value: DiscoverFilters[TKey][number]) {
    setFilters((current) => ({
      ...current,
      [key]: toggleFilterValue(current[key], value)
    }));
  }

  function selectExperienceCompany(company: string) {
    setFilters((current) => ({
      ...current,
      previousCompanies: [company]
    }));
  }

  function selectJobCategory(category: string) {
    setFilters((current) => ({
      ...current,
      jobCategories: [category as JobField]
    }));
  }

  function clearJobCategory() {
    setFilters((current) => ({
      ...current,
      jobCategories: []
    }));
  }

  function clearExperienceCompany() {
    setFilters((current) => ({
      ...current,
      previousCompanies: []
    }));
  }

  function removeFilter(chip: ActiveFilterChip) {
    if (chip.group === "search") {
      setSubmittedSearchQuery("");
      setSearchDraft("");
      return;
    }

    const group = chip.group as FilterGroup;

    setFilters((current) => ({
      ...current,
      [group]: current[group].filter((value) => value !== chip.value)
    }));
  }

  function clearAllFilters() {
    setFilters(emptyDiscoverFilters);
    setSubmittedSearchQuery("");
    setSearchDraft("");
    setIsDrawerOpen(false);
  }

  function showToast(message: string) {
    setToastMessage(message);

    if (toastTimeout.current) {
      window.clearTimeout(toastTimeout.current);
    }

    toastTimeout.current = window.setTimeout(() => setToastMessage(""), 2200);
  }

  function handleSavedProfileToggle(profileId: string) {
    const willBeSaved = !savedProfileIds.includes(profileId);
    toggleSavedProfileId(profileId);
    showToast(willBeSaved ? "تجربه ذخیره شد. از بخش ذخیره‌شده‌ها می‌توانید دوباره آن را ببینید." : "از ذخیره‌شده‌ها حذف شد.");
  }

  return (
    <section>
      <div
        className={classNames(styles.drawerScrim, isDrawerOpen && styles.drawerScrimOpen)}
        aria-hidden="true"
        onClick={() => setIsDrawerOpen(false)}
      />

      <div className={styles.discoverHero}>
        <h1>{heroCopy.title}</h1>
        <p className={styles.lead}>{heroCopy.description}</p>
      </div>
      <p className={styles.guidanceLine}>
        تجربه‌ها را ببینید، مشاوره بگیرید و مسیر شغلی خود را آگاهانه‌تر انتخاب کنید.
        <Link href="/guide">Useravaa چطور کار می‌کند؟</Link>
      </p>

      <form className={styles.searchBar} role="search" onSubmit={submitSearch}>
        <span className={styles.searchIcon}>
          <UseravaaIcon name="search" size={18} />
        </span>
        <input
          type="search"
          placeholder="نقش، شرکت، دسته‌بندی شغلی یا نام فرد را جستجو کن"
          value={searchDraft}
          onChange={(event) => setSearchDraft(event.target.value)}
        />
        <button type="submit">
          <span className="button-label">جستجو</span>
        </button>
      </form>

      <div className={styles.mobileFilterActions}>
        <button className={styles.mobileFilterButton} type="button" onClick={() => setIsDrawerOpen(true)}>
          <UseravaaIcon name="filter" size={18} />
          <span className="button-label">{activeFilterCount ? `فیلترها ${formatter.format(activeFilterCount)}` : "فیلترها"}</span>
        </button>
      </div>

      <div className={classNames(styles.filterShell, isDrawerOpen && styles.filterShellOpen)} aria-label="فیلترها">
        <div className={styles.mobileFilterHeader}>
          <strong>فیلترها</strong>
          <button type="button" onClick={() => setIsDrawerOpen(false)}>
            <UseravaaIcon name="close" size={16} />
            <span className="button-label">بستن</span>
          </button>
        </div>
        <div className={styles.filterGrid}>
          <SearchableFilterCombobox
            label="گروه شغلی"
            ariaLabel="گروه شغلی"
            placeholder="جستجوی گروه شغلی..."
            selectedValue={filters.jobCategories[0] ?? ""}
            initialOpen={initialJobCategoryComboboxOpen}
            initialQuery={initialJobCategorySearchQuery}
            availableOptions={availableJobCategoryOptions}
            searchOptions={(query) => searchDiscoverJobCategories(query, 14, profiles, availableJobCategoryOptions)}
            onSelect={selectJobCategory}
            onClear={clearJobCategory}
          />

          <span className={classNames(styles.field, filters.orgLevels.length > 0 && styles.active)}>
            <select aria-label="رده سازمانی" value="" onChange={(event) => updateFilter("orgLevels", event.target.value)}>
              <option value="">{getFilterPlaceholder("رده سازمانی", filters.orgLevels.length)}</option>
              {organizationalLevels.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
            <span className={styles.caret} aria-hidden="true">
              <UseravaaIcon name="dropdown" size={16} />
            </span>
          </span>

          <SearchableFilterCombobox
            label="نام شرکت"
            ariaLabel="نام شرکت"
            placeholder="جستجوی نام شرکت..."
            selectedValue={filters.previousCompanies[0] ?? ""}
            initialOpen={initialCompanyComboboxOpen}
            initialQuery={initialCompanySearchQuery}
            availableOptions={availableCompanyOptions}
            searchOptions={(query) => searchDiscoverExperienceCompanies(query, 14)}
            onSelect={selectExperienceCompany}
            onClear={clearExperienceCompany}
          />

          <span className={classNames(styles.field, filters.languages.length > 0 && styles.active)}>
            <select
              aria-label="زبان جلسه"
              value=""
              onChange={(event) => updateFilter("languages", event.target.value as ConversationLanguageOption)}
            >
              <option value="">{getFilterPlaceholder("زبان جلسه", filters.languages.length)}</option>
              {conversationLanguageOptions.map((language) => (
                <option key={language} value={language}>
                  {language}
                </option>
              ))}
            </select>
            <span className={styles.caret} aria-hidden="true">
              <UseravaaIcon name="dropdown" size={16} />
            </span>
          </span>
        </div>
      </div>

      <div className={classNames(styles.activeFilterRow, activeFilterCount > 0 && styles.showFlex)}>
        <div className={styles.activeFilterList}>
          <span className={styles.activeLabel}>فیلترهای فعال:</span>
          {chips.map((chip) => (
            <span className={styles.activeChip} key={chip.key}>
              {chip.label}
              <button type="button" aria-label={`حذف ${chip.label}`} onClick={() => removeFilter(chip)}>
                <UseravaaIcon name="close" size={13} />
              </button>
            </span>
          ))}
        </div>
        <button className={styles.clearAll} type="button" onClick={clearAllFilters}>
          <span className="button-label">پاک‌کردن همه</span>
        </button>
      </div>

      <div className={styles.resultsMeta}>
        <div className={styles.resultCount}>
          {discoveryState === "loading" ? "در حال پیدا کردن تجربه‌های مرتبط..." : resultCountCopy}
        </div>
      </div>

      {discoveryState === "loading" ? <SkeletonCards /> : null}

      {discoveryState === "error" ? (
        <div className={classNames(styles.statePanel, styles.showBlock)} role="alert">
          <h2>در دریافت نتایج مشکلی پیش آمد. دوباره تلاش کنید.</h2>
          <V51Button tone="primary" onClick={() => setDiscoveryState("ready")}>
            تلاش دوباره
          </V51Button>
        </div>
      ) : null}

      {discoveryState === "ready" ? (
        <>
          <div className={styles.grid}>
            {results.map((profile) => (
              <ExperienceProfileCard
                key={profile.id}
                profile={profile}
                isSaved={savedProfileIds.includes(profile.id)}
                onSave={handleSavedProfileToggle}
              />
            ))}
          </div>

          {!results.length ? (
            <div className={styles.empty}>
              <h2>برای این جستجو هنوز تجربه‌ای پیدا نکردیم.</h2>
              <p className={styles.lead}>می‌توانید فیلترها را کمتر کنید یا عبارت دیگری جستجو کنید.</p>
              <div className={styles.emptyActions}>
                <V51Button tone="primary" onClick={clearAllFilters}>
                  پاک‌کردن فیلترها
                </V51Button>
                <V51Button tone="secondary" onClick={clearAllFilters}>
                  بازگشت به همه تجربه‌ها
                </V51Button>
                <Link className={styles.guideLink} href="/guide">
                  راهنمای Useravaa
                </Link>
              </div>
            </div>
          ) : null}
        </>
      ) : null}
      <div className={classNames(styles.toast, toastMessage && styles.toastShow)} role="status" aria-live="polite">
        {toastMessage}
      </div>
    </section>
  );
}
