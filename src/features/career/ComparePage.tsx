"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Check, Layers3, Pencil, Route } from "lucide-react";
import { visibleCareerHierarchy as careerHierarchy } from "./career-data";
import { CompareTabIcon, SoftCloseIcon } from "./CareerSoftIcons";
import { EssentialChip, getDisplayLabel } from "./PathsPage";
import { useSavedCareerPaths } from "./career-saved-paths";
import {
  MAX_COMPARE_PATHS,
  MIN_COMPARE_PATHS,
  updateCompareSelection,
  useRecentlyViewedCareerPaths
} from "./career-compare-state";
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

const allCareerSubfamilies = careerHierarchy.flatMap((domain) => (
  domain.generalCategories.flatMap((category) => category.subfamilies)
));
const subfamilyById = new Map(allCareerSubfamilies.map((subfamily) => [subfamily.id, subfamily]));
const subfamilyByCardId = new Map(
  allCareerSubfamilies.flatMap((subfamily) => (
    subfamily.cards.map((card) => [card.id, subfamily] as const)
  ))
);

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

  for (const cardId of savedCardIds) {
    const path = subfamilyByCardId.get(cardId);
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

export function buildComparisonSections(paths: readonly CareerSubfamilyNode[]): readonly ComparisonSection[] {
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
        createComparisonRow(paths, "وظایف اصلی", (path) => textComparisonItems(valuesFromCards(path, (card) => card.mainDuties)))
      ])
    },
    {
      id: "skills",
      label: "مهارت‌ها",
      rows: compactRows([
        createComparisonRow(paths, "مهارت‌های تخصصی", (path) => skillComparisonItems(path, "technical")),
        createComparisonRow(paths, "مهارت‌های نرم", (path) => skillComparisonItems(path, "soft"))
      ])
    },
    {
      id: "tools",
      label: "ابزارها",
      rows: compactRows([
        createComparisonRow(paths, "ابزارها و تکنولوژی‌ها", (path) => textComparisonItems(valuesFromCards(path, (card) => card.keyTools)))
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
      <span className={styles.pathCardIcon} aria-hidden><Route size={20} strokeWidth={2.8} /></span>
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
        {selected ? <Check size={17} strokeWidth={3.2} /> : <span />}
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

  return (
    <aside className={styles.selectionTray} aria-label="مسیرهای انتخاب‌شده">
      <div className={styles.traySummary}>
        <strong>{selectedPaths.length.toLocaleString("fa-IR")} از {MAX_COMPARE_PATHS.toLocaleString("fa-IR")} مسیر شغلی</strong>
        <span>۲ تا ۵ مسیر را برای مقایسه انتخاب کن</span>
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
      <p className={styles.selectionAlert} aria-live="polite">{limitMessage}</p>
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
  onEdit: () => void;
}>;

export function CareerComparisonTable({ paths, onEdit }: CareerComparisonTableProps) {
  const sections = useMemo(() => buildComparisonSections(paths), [paths]);
  const [activeSectionId, setActiveSectionId] = useState<ComparisonSectionId>("overview");

  function showSection(sectionId: ComparisonSectionId) {
    setActiveSectionId(sectionId);
    document.getElementById(`compare-section-${sectionId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className={styles.comparisonView}>
      <div className={styles.comparisonHeading}>
        <div>
          <h1 id="career-compare-title">مقایسه مسیرها</h1>
          <p>{paths.length.toLocaleString("fa-IR")} مسیر شغلی انتخاب‌شده را معیاربه‌معیار بررسی کن.</p>
        </div>
        <button type="button" className={styles.editSelection} onClick={onEdit}>
          <Pencil size={17} strokeWidth={2.7} />
          ویرایش انتخاب‌ها
        </button>
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
            <tbody id={`compare-section-${section.id}`} className={styles.comparisonTableSection} key={section.id}>
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

export function ComparePage() {
  const [activeSource, setActiveSource] = useState<CompareSource>("saved");
  const [selectedPathIds, setSelectedPathIds] = useState<readonly string[]>([]);
  const [limitMessage, setLimitMessage] = useState("");
  const [view, setView] = useState<CompareView>("selection");
  const { savedCardIds, hasLoadedSavedPaths } = useSavedCareerPaths();
  const { recentlyViewedPathIds, hasLoadedRecentlyViewedPaths } = useRecentlyViewedCareerPaths();
  const savedPaths = useMemo(() => getSavedComparisonPaths(savedCardIds), [savedCardIds]);
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
  const candidatePaths = activeSource === "saved" ? savedPaths : recentPaths;
  const candidatesLoaded = activeSource === "saved" ? hasLoadedSavedPaths : hasLoadedRecentlyViewedPaths;

  function togglePath(pathId: string) {
    const update = updateCompareSelection(selectedPathIds, pathId);
    setSelectedPathIds(update.selectedPathIds);
    setLimitMessage(update.limitReached ? "حداکثر ۵ مسیر را می‌توانی مقایسه کنی." : "");
  }

  function startComparison() {
    if (selectedPaths.length < MIN_COMPARE_PATHS) return;
    setView("table");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (view === "table") {
    return (
      <section className={styles.comparePage} data-career-paths aria-labelledby="career-compare-title">
        <CareerComparisonTable paths={selectedPaths} onEdit={() => setView("selection")} />
      </section>
    );
  }

  return (
    <section className={`${styles.comparePage} ${styles.selectionPage}`} data-career-paths aria-labelledby="career-compare-title">
      <div className={styles.selectionHeading}>
        <span className={styles.headingIcon} aria-hidden><Layers3 size={24} strokeWidth={2.7} /></span>
        <div>
          <h1 id="career-compare-title">مقایسه مسیرها</h1>
          <p>۲ تا ۵ مسیر را برای مقایسه انتخاب کن</p>
        </div>
      </div>

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

      <div className={styles.candidatePanel} role="tabpanel" aria-busy={!candidatesLoaded}>
        {!candidatesLoaded ? <div className={styles.loadingState}>در حال آماده‌سازی مسیرها...</div> : null}
        {candidatesLoaded && candidatePaths.length ? (
          <div className={styles.pathGrid}>
            {candidatePaths.map((path) => (
              <ComparePathCard
                path={path}
                selected={selectedPathIds.includes(path.id)}
                onToggle={togglePath}
                key={path.id}
              />
            ))}
          </div>
        ) : null}
        {candidatesLoaded && !candidatePaths.length ? (
          <div className={styles.emptyState}>
            <span aria-hidden><Route size={26} strokeWidth={2.7} /></span>
            <h2>{activeSource === "saved" ? "هنوز مسیر ذخیره‌شده‌ای نداری" : "هنوز مسیری را ندیده‌ای"}</h2>
            <p>{activeSource === "saved" ? "مسیرهای موردنظرت را ذخیره کن و برای مقایسه به اینجا برگرد." : "یک مسیر شغلی را باز کن تا در این فهرست دیده شود."}</p>
            <Link href="/">مشاهده مسیرهای شغلی</Link>
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
