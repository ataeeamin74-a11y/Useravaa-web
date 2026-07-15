"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Layers3, Pencil, RotateCcw, Route, Search, X } from "./CareerIcons";
import { CompareTabIcon, SoftCloseIcon } from "./CareerSoftIcons";
import { EssentialChip, getDisplayLabel } from "./PathsPage";
import { useSavedCareerPaths } from "./career-saved-paths";
import { useSavedCareerComparisons } from "./career-saved-comparisons";
import {
  requestCareerLeadCapture,
  shouldRequestCareerLeadCapture
} from "./career-lead-capture";
import {
  careerPaths,
  getCareerPathByCardId,
  getCareerPathById
} from "./career-path-index";
import {
  clearCompareDraft,
  MAX_COMPARE_PATHS,
  MIN_COMPARE_PATHS,
  saveCompareDraftPathIds,
  updateCompareSelection,
  useCompareDraftPathIds,
  useRecentlyViewedCareerPaths
} from "./career-compare-state";
import { trackCareerEvent } from "./career-events";
import { getCareerPathSeoEntryBySlugOrLegacy } from "./career-path-seo";
import type { CareerComparisonContentItem } from "./career-comparison-content.server";
import type { CareerCard, CareerSubfamilyNode } from "./career-types";
import { normalizeSearchText } from "./career-utils";
import styles from "./ComparePage.module.css";

type CompareSource = "saved" | "recent";
type CompareView = "selection" | "table";
type ComparisonSectionId = "overview" | "duties" | "skills" | "tools";
type ComparisonSkillKind = "technical" | "soft";
type ComparisonTextDirection = "ltr" | "rtl";

type ComparisonItem = Readonly<{
  text: string;
  essential?: boolean;
  skillKind?: ComparisonSkillKind;
}>;

type ComparisonValue = readonly ComparisonItem[];

type ComparisonRow = Readonly<{
  label: string;
  values: readonly ComparisonValue[];
}>;

type ComparisonSection = Readonly<{
  id: ComparisonSectionId;
  label: string;
  rows: readonly ComparisonRow[];
}>;

export const compareSectionTabs = [
  { id: "overview", label: "نمای کلی" },
  { id: "duties", label: "شرح شغلی" },
  { id: "skills", label: "مهارت‌ها" },
  { id: "tools", label: "ابزارها" }
] as const satisfies readonly Readonly<{ id: ComparisonSectionId; label: string }>[];

const allCareerSubfamilies = careerPaths;
const subfamilyById = new Map(allCareerSubfamilies.map((subfamily) => [subfamily.id, subfamily]));

function uniqueValues(values: readonly string[]): readonly string[] {
  const uniqueItems = new Map<string, string>();

  for (const value of values) {
    const normalizedValue = normalizeSearchText(value);
    if (normalizedValue && !uniqueItems.has(normalizedValue)) uniqueItems.set(normalizedValue, value);
  }

  return [...uniqueItems.values()];
}

function valuesFromCards(
  path: CareerSubfamilyNode,
  getValues: (card: CareerCard) => readonly string[]
): readonly string[] {
  return uniqueValues(path.cards.flatMap(getValues));
}

function textComparisonItems(values: readonly string[]): ComparisonValue {
  return uniqueValues(values).map((text) => ({ text }));
}

function skillComparisonItems(
  path: CareerSubfamilyNode,
  skillKind: ComparisonSkillKind
): ComparisonValue {
  const essentialValues = skillKind === "technical"
    ? valuesFromCards(path, (card) => card.keyTechnicalSkills)
    : valuesFromCards(path, (card) => card.keySoftSkills);
  const supportingValues = skillKind === "technical"
    ? valuesFromCards(path, (card) => card.supportingTechnicalSkills)
    : valuesFromCards(path, (card) => card.supportingSoftSkills);
  const essentialKeys = new Set(essentialValues.map(normalizeSearchText));

  return [
    ...essentialValues.map((text) => ({ text, essential: true, skillKind }) as const),
    ...supportingValues
      .filter((text) => !essentialKeys.has(normalizeSearchText(text)))
      .map((text) => ({ text, essential: false, skillKind }) as const)
  ];
}

export function getComparisonTextDirection(value: string): ComparisonTextDirection {
  const latinCharacterCount = value.match(/[A-Za-z0-9]/g)?.length ?? 0;
  const rtlCharacterCount = value.match(/[\u0600-\u06ff]/g)?.length ?? 0;

  return latinCharacterCount > rtlCharacterCount ? "ltr" : "rtl";
}

function createComparisonRow(
  paths: readonly CareerSubfamilyNode[],
  label: string,
  getValues: (path: CareerSubfamilyNode) => ComparisonValue
): ComparisonRow | undefined {
  const values = paths.map(getValues);
  return values.some((value) => value.length) ? { label, values } : undefined;
}

function compactRows(rows: readonly (ComparisonRow | undefined)[]): readonly ComparisonRow[] {
  return rows.filter((row): row is ComparisonRow => Boolean(row));
}

export function getSavedComparisonPaths(savedCardIds: ReadonlySet<string>): readonly CareerSubfamilyNode[] {
  const seenPathIds = new Set<string>();
  const paths: CareerSubfamilyNode[] = [];

  for (const savedId of savedCardIds) {
    const path = getCareerPathById(savedId) ?? getCareerPathByCardId(savedId);
    if (!path || seenPathIds.has(path.id)) continue;
    paths.push(path);
    seenPathIds.add(path.id);
  }

  return paths;
}

export function getRecentlyViewedComparisonPaths(pathIds: readonly string[]): readonly CareerSubfamilyNode[] {
  const seenPathIds = new Set<string>();
  const paths: CareerSubfamilyNode[] = [];

  for (const pathId of pathIds) {
    const path = subfamilyById.get(pathId);
    if (!path || seenPathIds.has(path.id)) continue;
    paths.push(path);
    seenPathIds.add(path.id);
  }

  return paths;
}

export function buildComparisonSections(
  paths: readonly CareerSubfamilyNode[],
  comparisonContent: readonly CareerComparisonContentItem[] = []
): readonly ComparisonSection[] {
  const contentByPathId = new Map(comparisonContent.map((item) => [item.pathId, item]));
  const sections: readonly ComparisonSection[] = [
    {
      id: "overview",
      label: "نمای کلی",
      rows: compactRows([
        createComparisonRow(paths, "حوزه شغلی", (path) => textComparisonItems([getDisplayLabel(path.domain)])),
        createComparisonRow(paths, "دسته شغلی", (path) => textComparisonItems([getDisplayLabel(path.generalCategory)])),
        createComparisonRow(paths, "مسیر شغلی", (path) => textComparisonItems([getDisplayLabel(path.name)]))
      ])
    },
    {
      id: "duties",
      label: "شرح شغلی",
      rows: compactRows([
        createComparisonRow(paths, "وظایف اصلی", (path) => textComparisonItems(
          contentByPathId.get(path.id)?.duties ?? valuesFromCards(path, (card) => card.mainDuties)
        ))
      ])
    },
    {
      id: "skills",
      label: "مهارت‌ها",
      rows: compactRows([
        createComparisonRow(paths, "مهارت‌های تخصصی", (path) => {
          const curated = contentByPathId.get(path.id)?.technicalSkills;
          return curated?.length
            ? curated.map((text) => ({ text, essential: true, skillKind: "technical" as const }))
            : skillComparisonItems(path, "technical");
        }),
        createComparisonRow(paths, "مهارت‌های نرم", (path) => {
          const curated = contentByPathId.get(path.id)?.softSkills;
          return curated?.length
            ? curated.map((text) => ({ text, essential: true, skillKind: "soft" as const }))
            : skillComparisonItems(path, "soft");
        })
      ])
    },
    {
      id: "tools",
      label: "ابزارها",
      rows: compactRows([
        createComparisonRow(paths, "ابزارها و تکنولوژی‌ها", (path) => textComparisonItems(
          contentByPathId.get(path.id)?.tools ?? valuesFromCards(path, (card) => card.keyTools)
        ))
      ])
    }
  ];

  return sections.filter((section) => section.rows.length);
}

type ComparePathCardProps = Readonly<{
  path: CareerSubfamilyNode;
  selected: boolean;
  onToggle: (pathId: string) => void;
}>;

export function ComparePathCard({ path, selected, onToggle }: ComparePathCardProps) {
  const title = getDisplayLabel(path.name);
  const titleDirection = getComparisonTextDirection(title);

  return (
    <button
      type="button"
      className={selected ? styles.pathCardSelected : styles.pathCard}
      aria-pressed={selected}
      onClick={() => onToggle(path.id)}
    >
      <span className={styles.pathCardIcon} aria-hidden><Route size={20} /></span>
      <span className={styles.pathCardCopy}>
        <span className={styles.pathHierarchy}>
          {getDisplayLabel(path.domain)} · {getDisplayLabel(path.generalCategory)}
        </span>
        <strong
          className={titleDirection === "ltr" ? styles.pathTitleLtr : styles.pathTitleRtl}
          dir={titleDirection}
        >
          {title}
        </strong>
      </span>
      <span className={styles.selectionMark} aria-hidden>
        {selected ? <Check size={17} /> : <span />}
      </span>
    </button>
  );
}

type SelectionTrayProps = Readonly<{
  selectedPaths: readonly CareerSubfamilyNode[];
  limitMessage: string;
  onRemove: (pathId: string) => void;
  onCompare: () => void;
}>;

export function SelectionTray({ selectedPaths, limitMessage, onRemove, onCompare }: SelectionTrayProps) {
  const slots = Array.from({ length: MAX_COMPARE_PATHS }, (_, index) => selectedPaths[index]);
  const canCompare = selectedPaths.length >= MIN_COMPARE_PATHS;
  const nextStepMessage = canCompare
    ? "آماده‌ای مسیرهای انتخاب‌شده را کنار هم ببینی."
    : selectedPaths.length === 1
      ? "یک مسیر دیگر انتخاب کن تا مقایسه فعال شود."
      : "۲ تا ۵ مسیر را برای مقایسه انتخاب کن.";

  return (
    <aside className={styles.selectionTray} aria-label="مسیرهای انتخاب‌شده">
      <div className={styles.traySummary} aria-live="polite">
        <strong>{selectedPaths.length.toLocaleString("fa-IR")} از {MAX_COMPARE_PATHS.toLocaleString("fa-IR")} مسیر شغلی</strong>
        <span>{nextStepMessage}</span>
      </div>
      <div className={styles.selectionSlots}>
        {slots.map((path, index) => path ? (
          <button
            type="button"
            className={styles.filledSlot}
            aria-label={`حذف ${getDisplayLabel(path.name)} از مقایسه`}
            title={getDisplayLabel(path.name)}
            onClick={() => onRemove(path.id)}
            key={path.id}
          >
            <span>{index + 1}</span>
            <strong dir="auto">{getDisplayLabel(path.name)}</strong>
            <SoftCloseIcon size={13} />
          </button>
        ) : (
          <span className={styles.emptySlot} aria-hidden key={`empty-slot-${index}`}>
            <span>{index + 1}</span>
          </span>
        ))}
      </div>
      <p className={styles.selectionAlert} aria-live="polite">{limitMessage || nextStepMessage}</p>
      <button type="button" className={styles.compareCta} disabled={!canCompare} onClick={onCompare}>
        <CompareTabIcon size={20} />
        مقایسه مسیرها
      </button>
    </aside>
  );
}

function ComparisonCell({ values }: Readonly<{ values: ComparisonValue }>) {
  if (!values.length) return <span className={styles.missingValue}>اطلاعات کافی موجود نیست</span>;

  if (values.some((item) => item.skillKind)) {
    return (
      <div className={styles.skillItems}>
        {values.map((item) => {
          const direction = getComparisonTextDirection(item.text);

          return item.essential && item.skillKind ? (
            <EssentialChip item={item.text} kind={item.skillKind} key={item.text} />
          ) : (
            <span
              className={`${styles.supportingSkill} ${direction === "ltr" ? styles.itemLtr : styles.itemRtl}`}
              dir={direction}
              key={item.text}
            >
              {item.text}
            </span>
          );
        })}
      </div>
    );
  }

  if (values.length === 1) {
    const item = values[0];
    const direction = getComparisonTextDirection(item.text);

    return <span className={direction === "ltr" ? styles.itemLtr : styles.itemRtl} dir={direction}>{item.text}</span>;
  }

  return (
    <ul className={styles.valueList}>
      {values.map((item) => {
        const direction = getComparisonTextDirection(item.text);

        return (
          <li className={direction === "ltr" ? styles.itemLtr : styles.itemRtl} dir={direction} key={item.text}>
            {item.text}
          </li>
        );
      })}
    </ul>
  );
}

type CareerComparisonTableProps = Readonly<{
  paths: readonly CareerSubfamilyNode[];
  comparisonContent?: readonly CareerComparisonContentItem[];
  onEdit: () => void;
  onReset?: () => void;
  onSave?: () => void;
  saved?: boolean;
}>;

export function CareerComparisonTable({
  paths,
  comparisonContent = [],
  onEdit,
  onReset,
  onSave,
  saved = false
}: CareerComparisonTableProps) {
  const sections = useMemo(
    () => buildComparisonSections(paths, comparisonContent),
    [comparisonContent, paths]
  );
  const [activeSectionId, setActiveSectionId] = useState<ComparisonSectionId>("overview");

  function showSection(sectionId: ComparisonSectionId) {
    setActiveSectionId(sectionId);
    window.requestAnimationFrame(() => {
      document.getElementById(`compare-section-${sectionId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  return (
    <div className={styles.comparisonView}>
      <div className={styles.comparisonHeading}>
        <div>
          <h1 id="career-compare-title">مقایسه مسیرها</h1>
          <p>{paths.length.toLocaleString("fa-IR")} مسیر شغلی انتخاب‌شده را معیاربه‌معیار بررسی کن.</p>
        </div>
        <div className={styles.comparisonActions}>
          {onSave ? (
            <button type="button" className={saved ? styles.saveComparisonSaved : styles.saveComparison} onClick={onSave}>
              <Check size={17} />
              {saved ? "مقایسه ذخیره شد" : "ذخیره این مقایسه"}
            </button>
          ) : null}
          <button type="button" className={styles.editSelection} onClick={onEdit}>
            <Pencil size={17} />
            ویرایش انتخاب‌ها
          </button>
          {onReset ? (
            <button type="button" className={styles.resetComparison} onClick={onReset}>
              <RotateCcw size={17} />
              شروع مقایسه جدید
            </button>
          ) : null}
        </div>
      </div>

      <nav className={styles.sectionTabs} aria-label="بخش‌های مقایسه">
        {compareSectionTabs.map((section) => (
          <button
            type="button"
            className={activeSectionId === section.id ? styles.sectionTabActive : styles.sectionTab}
            aria-pressed={activeSectionId === section.id}
            onClick={() => showSection(section.id)}
            key={section.id}
          >
            {section.label}
          </button>
        ))}
      </nav>

      <p className={styles.tableHint}>برای دیدن همه مسیرها، جدول را به چپ بکش.</p>
      <div className={styles.compareTableViewport} tabIndex={0} aria-label="جدول مقایسه مسیرهای شغلی">
        <table className={styles.compareTable} data-compare-table="rtl">
          <thead>
            <tr>
              <th className={styles.criteriaHeader} scope="col">معیار مقایسه</th>
              {paths.map((path, index) => (
                <th className={styles.pathHeader} scope="col" key={path.id}>
                  <span>{(index + 1).toLocaleString("fa-IR")}</span>
                  <strong dir="auto">{getDisplayLabel(path.name)}</strong>
                  <small>{getDisplayLabel(path.domain)}</small>
                </th>
              ))}
            </tr>
          </thead>
          {sections.map((section) => (
            <tbody
              id={`compare-section-${section.id}`}
              className={styles.comparisonTableSection}
              data-active={activeSectionId === section.id ? "true" : "false"}
              key={section.id}
            >
              <tr className={styles.sectionDivider}>
                <th colSpan={paths.length + 1}>{section.label}</th>
              </tr>
              {section.rows.map((row) => (
                <tr key={row.label}>
                  <th className={styles.criteriaCell} scope="row">{row.label}</th>
                  {row.values.map((values, index) => (
                    <td className={styles.valueCell} key={`${row.label}-${paths[index].id}`}>
                      <ComparisonCell values={values} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>
    </div>
  );
}

export function normalizeInitialComparePathIds(pathIds: readonly string[]): readonly string[] {
  return [...new Set(pathIds.flatMap((value) => {
    if (subfamilyById.has(value)) return [value];
    const entry = getCareerPathSeoEntryBySlugOrLegacy(value);
    return entry ? [entry.path.id] : [];
  }))].slice(0, MAX_COMPARE_PATHS);
}

type ComparePageProps = Readonly<{
  initialPathIds?: readonly string[];
  comparisonContent?: readonly CareerComparisonContentItem[];
}>;

export function ComparePage({ initialPathIds = [], comparisonContent = [] }: ComparePageProps) {
  const normalizedInitialPathIds = normalizeInitialComparePathIds(initialPathIds);
  const [activeSource, setActiveSource] = useState<CompareSource>("saved");
  const [selectedPathIds, setSelectedPathIds] = useState<readonly string[]>(() => normalizedInitialPathIds);
  const [limitMessage, setLimitMessage] = useState("");
  const [candidateQuery, setCandidateQuery] = useState("");
  const [candidateLimit, setCandidateLimit] = useState(12);
  const [view, setView] = useState<CompareView>(() => (
    normalizedInitialPathIds.length >= MIN_COMPARE_PATHS ? "table" : "selection"
  ));
  const { savedPathIds, hasLoadedSavedPaths } = useSavedCareerPaths();
  const { saveComparison, isComparisonSaved } = useSavedCareerComparisons();
  const { recentlyViewedPathIds, hasLoadedRecentlyViewedPaths } = useRecentlyViewedCareerPaths();
  const { compareDraftPathIds, hasLoadedCompareDraft } = useCompareDraftPathIds();
  const hasAppliedInitialDraftRef = useRef(false);
  const hasTrackedCompareEntryRef = useRef(false);
  const savedPaths = useMemo(() => getSavedComparisonPaths(savedPathIds), [savedPathIds]);
  const recentPaths = useMemo(
    () => getRecentlyViewedComparisonPaths(recentlyViewedPathIds),
    [recentlyViewedPathIds]
  );
  const selectedPaths = useMemo(
    () => selectedPathIds.flatMap((pathId) => {
      const path = subfamilyById.get(pathId);
      return path ? [path] : [];
    }),
    [selectedPathIds]
  );
  const hasInitialComparison = normalizedInitialPathIds.length >= MIN_COMPARE_PATHS;
  const hasSingleSelection = selectedPathIds.length === 1;
  const candidatePaths = useMemo(() => {
    const anchorPath = selectedPaths[0];
    const basePaths = hasSingleSelection
      ? allCareerSubfamilies
      : (activeSource === "saved" ? savedPaths : recentPaths);
    const normalizedQuery = normalizeSearchText(candidateQuery);

    return [...basePaths]
      .filter((path) => path.id !== anchorPath?.id)
      .filter((path) => !normalizedQuery || normalizeSearchText([
        path.name,
        path.domain,
        path.generalCategory,
        path.midCategory
      ].join(" ")).includes(normalizedQuery))
      .sort((first, second) => {
        if (!anchorPath) return 0;
        const firstPriority = first.generalCategory === anchorPath.generalCategory
          ? 0
          : (first.domain === anchorPath.domain ? 1 : 2);
        const secondPriority = second.generalCategory === anchorPath.generalCategory
          ? 0
          : (second.domain === anchorPath.domain ? 1 : 2);
        return firstPriority - secondPriority;
      });
  }, [activeSource, candidateQuery, hasSingleSelection, recentPaths, savedPaths, selectedPaths]);
  const visibleCandidatePaths = candidatePaths.slice(0, candidateLimit);
  const candidatesLoaded = hasSingleSelection
    || (activeSource === "saved" ? hasLoadedSavedPaths : hasLoadedRecentlyViewedPaths);
  const comparisonSaved = isComparisonSaved(selectedPathIds);

  useEffect(() => {
    if (hasTrackedCompareEntryRef.current) return;
    hasTrackedCompareEntryRef.current = true;
    trackCareerEvent("career_compare_started", normalizedInitialPathIds[0] ? {
      fromPathId: normalizedInitialPathIds[0]
    } : {});
  }, [normalizedInitialPathIds]);

  useEffect(() => {
    if (
      hasAppliedInitialDraftRef.current
      || !hasLoadedCompareDraft
      || hasInitialComparison
      || !compareDraftPathIds.length
    ) {
      return;
    }

    hasAppliedInitialDraftRef.current = true;
    const frame = window.requestAnimationFrame(() => {
      setSelectedPathIds(compareDraftPathIds);
      setView(compareDraftPathIds.length >= MIN_COMPARE_PATHS ? "table" : "selection");
      setLimitMessage("");
    });

    return () => window.cancelAnimationFrame(frame);
  }, [compareDraftPathIds, hasInitialComparison, hasLoadedCompareDraft]);

  function togglePath(pathId: string) {
    hasAppliedInitialDraftRef.current = true;
    const update = updateCompareSelection(selectedPathIds, pathId);
    setSelectedPathIds(update.selectedPathIds);
    saveCompareDraftPathIds(update.selectedPathIds);
    trackCareerEvent("career_compare_selection_changed", {
      selectedCount: update.selectedPathIds.length
    });
    setLimitMessage(update.limitReached ? "حداکثر ۵ مسیر را می‌توانی مقایسه کنی." : "");
  }

  function startComparison() {
    if (selectedPaths.length < MIN_COMPARE_PATHS) return;
    setView("table");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetComparison() {
    clearCompareDraft();
    setSelectedPathIds([]);
    setLimitMessage("");
    setView("selection");
    setActiveSource("saved");
    setCandidateQuery("");
    setCandidateLimit(12);
    window.history.replaceState(window.history.state, "", "/career/compare");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function saveCurrentComparison() {
    const saveSucceeded = saveComparison(selectedPathIds);
    if (saveSucceeded) {
      trackCareerEvent("career_comparison_saved", {
        selectedCount: selectedPathIds.length
      });
    }
    if (shouldRequestCareerLeadCapture(comparisonSaved, saveSucceeded)) {
      requestCareerLeadCapture({
        source: "comparison_save",
        comparisonPathIds: selectedPathIds
      });
    }
  }

  if (view === "table") {
    return (
      <section className={styles.comparePage} data-career-paths aria-labelledby="career-compare-title">
        <CareerComparisonTable
          paths={selectedPaths}
          comparisonContent={comparisonContent}
          onEdit={() => setView("selection")}
          onReset={resetComparison}
          onSave={saveCurrentComparison}
          saved={comparisonSaved}
        />
      </section>
    );
  }

  return (
    <section className={`${styles.comparePage} ${styles.selectionPage}`} data-career-paths aria-labelledby="career-compare-title">
      <div className={styles.selectionHeading}>
        <span className={styles.headingIcon} aria-hidden><Layers3 size={24} /></span>
        <div>
          <h1 id="career-compare-title">مقایسه مسیرها</h1>
          <p>{hasSingleSelection ? "مسیر شغلی دوم را برای مقایسه انتخاب کن" : "۲ تا ۵ مسیر شغلی را برای مقایسه انتخاب کن"}</p>
        </div>
        {selectedPathIds.length ? (
          <button type="button" className={styles.resetComparison} onClick={resetComparison}>
            <RotateCcw size={17} />
            شروع مقایسه جدید
          </button>
        ) : null}
      </div>

      {hasSingleSelection ? (
        <p className={styles.preselectedHelper}>این مسیر شغلی برای مقایسه انتخاب شده است. مسیر دوم را از فهرست زیر انتخاب کن.</p>
      ) : (
      <div className={styles.sourceTabs} role="tablist" aria-label="منبع مسیرها">
        <button
          type="button"
          role="tab"
          aria-selected={activeSource === "saved"}
          className={activeSource === "saved" ? styles.sourceTabActive : styles.sourceTab}
          onClick={() => setActiveSource("saved")}
        >
          ذخیره‌شده‌ها
          <span>{savedPaths.length.toLocaleString("fa-IR")}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeSource === "recent"}
          className={activeSource === "recent" ? styles.sourceTabActive : styles.sourceTab}
          onClick={() => setActiveSource("recent")}
        >
          اخیراً دیده‌شده‌ها
          <span>{recentPaths.length.toLocaleString("fa-IR")}</span>
        </button>
      </div>
      )}

      <label className={styles.candidateSearch}>
        <Search size={19} aria-hidden />
        <span className="sr-only">جست‌وجوی مسیر برای مقایسه</span>
        <input
          type="search"
          value={candidateQuery}
          placeholder="نام مسیر یا حوزه را جست‌وجو کن"
          onChange={(event) => {
            setCandidateQuery(event.target.value);
            setCandidateLimit(12);
          }}
        />
        {candidateQuery ? (
          <button type="button" aria-label="پاک‌کردن جست‌وجوی مقایسه" onClick={() => setCandidateQuery("")}>
            <X size={17} aria-hidden />
          </button>
        ) : null}
      </label>

      <div className={styles.candidatePanel} role="tabpanel" aria-busy={!candidatesLoaded}>
        {!candidatesLoaded ? <div className={styles.loadingState}>در حال آماده‌سازی مسیرها...</div> : null}
        {candidatesLoaded && candidatePaths.length ? (
          <div className={styles.pathGrid}>
            {visibleCandidatePaths.map((path) => (
              <ComparePathCard
                path={path}
                selected={selectedPathIds.includes(path.id)}
                onToggle={togglePath}
                key={path.id}
              />
            ))}
          </div>
        ) : null}
        {candidatesLoaded && visibleCandidatePaths.length < candidatePaths.length ? (
          <button type="button" className={styles.showMoreCandidates} onClick={() => setCandidateLimit((current) => current + 12)}>
            نمایش مسیرهای بیشتر
          </button>
        ) : null}
        {candidatesLoaded && !candidatePaths.length ? (
          <div className={styles.emptyState}>
            <span aria-hidden><Route size={26} /></span>
            <h2>{activeSource === "saved" ? "هنوز مسیر ذخیره‌شده‌ای نداری" : "هنوز مسیری را ندیده‌ای"}</h2>
            <p>{activeSource === "saved" ? "مسیرهای موردنظرت را ذخیره کن و برای مقایسه به اینجا برگرد." : "یک مسیر شغلی را باز کن تا در این فهرست دیده شود."}</p>
            <Link href="/career">مشاهده مسیرهای شغلی</Link>
          </div>
        ) : null}
      </div>

      <SelectionTray
        selectedPaths={selectedPaths}
        limitMessage={limitMessage}
        onRemove={togglePath}
        onCompare={startComparison}
      />
    </section>
  );
}
