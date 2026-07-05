import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  buildComparisonSections,
  CareerComparisonTable,
  compareSectionTabs,
  ComparePathCard,
  ComparePage,
  getComparisonTextDirection,
  getSavedComparisonPaths,
  SelectionTray
} from "@/features/career/ComparePage";
import { GuidePage } from "@/features/career/GuidePage";
import { navigationItems } from "@/features/career/CareerBottomNav";
import { CareerImageCarousel } from "@/features/career/CareerImageCarousel";
import { CareerSaveButton } from "@/features/career/CareerSaveButton";
import {
  CategoryCard,
  EssentialChip,
  DomainCard,
  groupRelatedCareerPaths,
  getDomainAccent,
  getDisplayLabel,
  isInitialExplorerState,
  PathsPage,
  PriorityGroup,
  RelatedPathsSection,
  SearchResults,
  SubfamilyCard
} from "@/features/career/PathsPage";
import { SavedPathsList } from "@/features/career/SavedPathsPage";
import { toggleSavedCareerPathId } from "@/features/career/career-saved-paths";
import {
  addRecentlyViewedPathId,
  MAX_COMPARE_PATHS,
  MIN_COMPARE_PATHS,
  updateCompareSelection
} from "@/features/career/career-compare-state";
import {
  careerCards,
  careerDomains,
  careerHierarchy,
  guideCategories,
  visibleCareerCards,
  visibleCareerHierarchy
} from "@/features/career/career-data";
import oldCareerCards from "@/features/career/data/career-cards.json";
import v2CareerCards from "@/features/career/data/career-cards-v2-with-duties.json";
import {
  getCareerSlideSlug,
  getCareerSlides,
  isCareerSlidePath
} from "@/features/career/data/career-slide-manifest";
import {
  buildCareerItemReferenceSets,
  classifySupportingRequirement,
  getCareerDisplaySubtitle,
  getCareerDisplayTitle,
  getMeaningfulParentSelection,
  getRelatedCareerSubfamilies,
  isManagementCareerCard,
  matchesCareerCard,
  normalizeSearchText,
  resolveCategorySelection,
  resolveDomainSelection,
  searchCareerHierarchy,
  sortCareerCardsBySeniority,
  splitCareerList
} from "@/features/career/career-utils";

describe("career paths MVP shell", () => {
  it("normalizes the real career card JSON", () => {
    expect(careerCards).toHaveLength(68);
    expect(careerCards[0]).toMatchObject({
      id: "CARD_001",
      domain: "Technology & Engineering",
      keyTechnicalSkills: [".NET / C#"],
      keyTools: ["SQL Databases", "Git"],
      mainDuties: [
        "طراحی و کار با پایگاه داده",
        "طراحی و توسعه API و سرویس‌های سمت سرور",
        "بهینه‌سازی عملکرد، مقیاس‌پذیری و امنیت"
      ]
    });
    expect(careerDomains).toHaveLength(10);
  });

  it("splits supported separators and searches categories, skills, and tools", () => {
    expect(splitCareerList("اول، دوم؛ سوم, چهارم")).toEqual(["اول", "دوم", "سوم", "چهارم"]);
    expect(matchesCareerCard(careerCards[0], "Backend Platform", "all")).toBe(true);
    expect(matchesCareerCard(careerCards[0], "SQL Databases", "all")).toBe(true);
    expect(matchesCareerCard(careerCards[0], "SQL Databases", "Data & AI")).toBe(false);
  });

  it("derives the four-level career hierarchy from the flat JSON", () => {
    const categories = careerHierarchy.flatMap((domain) => domain.generalCategories);
    const subfamilies = categories.flatMap((category) => category.subfamilies);
    const cards = subfamilies.flatMap((subfamily) => subfamily.cards);

    expect(careerHierarchy).toHaveLength(10);
    expect(categories).toHaveLength(18);
    expect(subfamilies).toHaveLength(58);
    expect(cards).toHaveLength(68);
    expect(careerHierarchy.find((domain) => domain.name === "Technology & Engineering")).toMatchObject({
      subfamilyCount: 20,
      cardCount: 20
    });
  });

  it("promotes sales and business development into its own presentation domain", () => {
    const customerOperations = careerHierarchy.find((domain) => domain.name === "Revenue & Customer Operations")!;
    const sales = careerHierarchy.find((domain) => domain.name === "Sales & Business Development")!;

    expect(customerOperations.generalCategories.map((category) => category.name)).not.toContain("Sales & Business Development");
    expect(sales.generalCategories).toHaveLength(1);
    expect(sales.generalCategories[0].name).toBe("Sales & Business Development");
    expect(sales.subfamilyCount).toBe(5);
    expect(resolveDomainSelection(sales)).toEqual({
      domainId: sales.id,
      categoryId: sales.generalCategories[0].id,
      subfamilyId: undefined
    });

    const salesSearchResult = searchCareerHierarchy(careerHierarchy, "B2B / Corporate Sales")
      .find((result) => result.subfamily.name === "B2B / Corporate Sales");
    expect(salesSearchResult?.subfamily.domain).toBe("Sales & Business Development");
  });

  it("groups global search matches by final job subfamily", () => {
    const results = searchCareerHierarchy(careerHierarchy, "Docker");
    const resultIds = results.map((result) => result.subfamily.id);

    expect(results.length).toBeGreaterThan(0);
    expect(new Set(resultIds).size).toBe(results.length);
    expect(results.every((result) => result.matchingCards.length > 0)).toBe(true);
  });

  it("detects initial explorer and every focused hierarchy state", () => {
    expect(isInitialExplorerState({})).toBe(true);
    expect(isInitialExplorerState({ domainId: "domain" })).toBe(false);
    expect(isInitialExplorerState({ domainId: "domain", categoryId: "category" })).toBe(false);
    expect(isInitialExplorerState({
      domainId: "domain",
      categoryId: "category",
      subfamilyId: "subfamily"
    })).toBe(false);
  });

  it("recommends related paths by category then raw domain without duplicates", () => {
    const currentPath = careerHierarchy
      .flatMap((domain) => domain.generalCategories)
      .flatMap((category) => category.subfamilies)
      .find((subfamily) => subfamily.name === "Node.js / TypeScript Backend")!;
    const relatedPaths = getRelatedCareerSubfamilies(careerHierarchy, currentPath);
    const names = relatedPaths.map((path) => path.name);
    const firstBroaderDomainIndex = relatedPaths.findIndex(
      (path) => path.generalCategory !== currentPath.generalCategory
    );

    expect(names).not.toContain(currentPath.name);
    expect(new Set(names).size).toBe(names.length);
    expect(relatedPaths.length).toBeGreaterThan(3);
    expect(firstBroaderDomainIndex).toBeGreaterThan(0);
    expect(relatedPaths.slice(0, firstBroaderDomainIndex).every(
      (path) => path.generalCategory === currentPath.generalCategory
    )).toBe(true);
    expect(relatedPaths.slice(firstBroaderDomainIndex).every(
      (path) => path.cards[0].domain === currentPath.cards[0].domain
    )).toBe(true);
  });

  it("renders one featured related path and snap groups of at most three without seniority", () => {
    const currentPath = careerHierarchy
      .flatMap((domain) => domain.generalCategories)
      .flatMap((category) => category.subfamilies)
      .find((subfamily) => subfamily.name === "Node.js / TypeScript Backend")!;
    const relatedPaths = getRelatedCareerSubfamilies(careerHierarchy, currentPath);
    const groups = groupRelatedCareerPaths(relatedPaths.slice(1));
    const html = renderToStaticMarkup(
      <RelatedPathsSection paths={relatedPaths} onSelect={() => undefined} />
    );

    expect(html).toContain("مسیرهای مشابه برای بررسی");
    expect(html).toContain('data-related-featured="true"');
    expect(html).toContain("پیشنهاد نزدیک");
    expect(html.indexOf(relatedPaths[0].name)).toBeLessThan(html.indexOf(relatedPaths[1].name));
    expect(groups.every((group) => group.length > 0 && group.length <= 3)).toBe(true);
    expect(html.match(/data-related-group-size="[1-3]"/g)).toHaveLength(groups.length);
    expect(html.match(/data-related-pagination-dot="\d+"/g)).toHaveLength(groups.length);
    expect(html.match(/aria-current="page"/g)).toHaveLength(1);
    expect(html).toContain('aria-label="نمایش گروه 2"');
    expect(html).not.toContain("گروه قبلی");
    expect(html).not.toContain("گروه بعدی");
    expect(html).not.toContain("سطح کارشناسی");
    expect(html).not.toContain("سطح مدیریت");
    expect(html).not.toContain(">سطح<");
  });

  it("renders at most fifteen manifest-style portrait slides with lazy loading and pagination", () => {
    const slides = Array.from({ length: 16 }, (_, index) => {
      const fileName = String(index + 1).padStart(2, "0");
      return {
        src: `/career-slides/sample-path/${fileName}.webp`,
        alt: `Career slide ${index + 1}`
      };
    });
    const html = renderToStaticMarkup(<CareerImageCarousel slides={slides} />);

    expect(html).toContain('data-career-image-carousel="true"');
    expect(html.match(/data-career-slide="\d+"/g)).toHaveLength(15);
    expect(html.match(/loading="eager"/g)).toHaveLength(1);
    expect(html.match(/loading="lazy"/g)).toHaveLength(14);
    expect(html.match(/aria-label="نمایش تصویر \d+"/g)).toHaveLength(15);
    expect(html.match(/aria-current="true"/g)).toHaveLength(1);
    expect(html).toContain("1 / 15");
    expect(html).not.toContain("16.webp");
  });

  it("omits an empty carousel and enforces the career slide path convention", () => {
    expect(renderToStaticMarkup(<CareerImageCarousel slides={[]} />)).toBe("");
    expect(getCareerSlides("مسیر بدون تصویر")).toEqual([]);
    expect(getCareerSlides("بازاریابی محتوا")).toEqual([]);
    expect(getCareerSlides("طراحی محصول و تجربه کاربری (UI/UX)")).toEqual([]);
    expect(getCareerSlideSlug("هوش تجاری، داشبورد و گزارش‌سازی")).toBe("هوش-تجاری-داشبورد-و-گزارش-سازی");
    expect(isCareerSlidePath("/career-slides/sample-path/01.webp", "sample-path")).toBe(true);
    expect(isCareerSlidePath("/career-slides/sample-path/15.webp", "sample-path")).toBe(true);
    expect(isCareerSlidePath("/career-slides/sample-path/16.webp", "sample-path")).toBe(false);
    expect(isCareerSlidePath("/career-slides/sample-path/hero.webp", "sample-path")).toBe(false);
  });

  it("orders expert variants before management variants without alphabetical sorting", () => {
    const managementCard = careerCards.find((card) => card.id === "CARD_033")!;
    const expertCard = careerCards.find((card) => card.id === "CARD_034")!;
    const orderedCards = sortCareerCardsBySeniority([managementCard, expertCard]);
    const digitalMarketing = careerHierarchy
      .flatMap((domain) => domain.generalCategories)
      .flatMap((category) => category.subfamilies)
      .find((subfamily) => subfamily.name === "دیجیتال مارکتینگ عمومی")!;

    expect(orderedCards.map((card) => card.seniority)).toEqual(["سطح کارشناسی", "سطح مدیریت"]);
    expect(digitalMarketing.cards.map((card) => card.seniority)).toEqual(["سطح کارشناسی", "سطح مدیریت"]);
  });

  it("selects one visible non-management representative for each career path", () => {
    const subfamilies = visibleCareerHierarchy
      .flatMap((domain) => domain.generalCategories)
      .flatMap((category) => category.subfamilies);
    const digitalMarketing = subfamilies
      .find((subfamily) => subfamily.name === "دیجیتال مارکتینگ عمومی")!;

    expect(visibleCareerCards).toHaveLength(54);
    expect(visibleCareerCards.every((card) => !isManagementCareerCard(card))).toBe(true);
    expect(subfamilies).toHaveLength(54);
    expect(subfamilies.every((subfamily) => subfamily.cards.length === 1)).toBe(true);
    expect(digitalMarketing.cards.map((card) => card.id)).toEqual(["CARD_034"]);
    expect(subfamilies.map((subfamily) => subfamily.name)).not.toContain("مدیریت منابع انسانی");
  });

  it("removes seniority fragments from display titles and subtitles", () => {
    expect(getCareerDisplayTitle("Angular Frontend - سطح کارشناسی")).toBe("Angular Frontend");
    expect(getCareerDisplayTitle("مدیریت محصول - سطح مدیریت")).toBe("مدیریت محصول");
    expect(getCareerDisplaySubtitle("Frontend Engineering | سطح کارشناسی")).toBe("Frontend Engineering");
    expect(getCareerDisplaySubtitle("سطح مدیریت | Product Management")).toBe("Product Management");
  });

  it("renders one clean path card without seniority labels for grouped variants", () => {
    const digitalMarketing = visibleCareerHierarchy
      .flatMap((domain) => domain.generalCategories)
      .flatMap((category) => category.subfamilies)
      .find((subfamily) => subfamily.name === "دیجیتال مارکتینگ عمومی")!;
    const html = renderToStaticMarkup(
      <SubfamilyCard subfamily={digitalMarketing} onSelect={() => undefined} />
    );

    expect(digitalMarketing.cards).toHaveLength(1);
    expect(html.match(/<button/g)).toHaveLength(1);
    expect(html).toContain("دیجیتال مارکتینگ عمومی");
    expect(html).toContain("Digital Marketing");
    expect(html).not.toContain("کارشناسی");
    expect(html).not.toContain("مدیریت");
    expect(html).not.toContain("سطح");
  });

  it("keeps seniority out of grouped global search path cards", () => {
    const results = searchCareerHierarchy(visibleCareerHierarchy, "دیجیتال مارکتینگ عمومی");
    const html = renderToStaticMarkup(
      <SearchResults
        query="دیجیتال مارکتینگ عمومی"
        results={results}
        visibleCount={10}
        onSelect={() => undefined}
        onShowMore={() => undefined}
        onClear={() => undefined}
      />
    );

    expect(results).toHaveLength(1);
    expect(results[0].matchingCards).toHaveLength(1);
    expect(html).not.toContain("سطح کارشناسی");
    expect(html).not.toContain("سطح مدیریت");
  });

  it("toggles saved path IDs without duplicates", () => {
    const saved = toggleSavedCareerPathId(new Set<string>(), "CARD_001");
    const removed = toggleSavedCareerPathId(saved, "CARD_001");

    expect([...saved]).toEqual(["CARD_001"]);
    expect([...removed]).toEqual([]);
  });

  it("uses heart controls and the exact save-for-review labels", () => {
    const unsavedHtml = renderToStaticMarkup(<CareerSaveButton saved={false} onToggle={() => undefined} />);
    const savedHtml = renderToStaticMarkup(<CareerSaveButton saved onToggle={() => undefined} />);

    expect(unsavedHtml).toContain('aria-label="ذخیره برای بررسی"');
    expect(savedHtml).toContain('aria-label="حذف از ذخیره‌شده‌ها"');
    expect(savedHtml).toContain("ذخیره‌شده");
    expect(unsavedHtml).toContain("lucide-bookmark");
    expect(unsavedHtml).not.toContain("lucide-heart");
  });

  it("renders saved paths and the empty saved-paths state", () => {
    const emptyHtml = renderToStaticMarkup(
      <SavedPathsList savedCardIds={new Set()} hasLoaded onToggleSaved={() => undefined} />
    );
    const savedHtml = renderToStaticMarkup(
      <SavedPathsList savedCardIds={new Set(["CARD_001"])} hasLoaded onToggleSaved={() => undefined} />
    );
    const twoVariantHtml = renderToStaticMarkup(
      <SavedPathsList savedCardIds={new Set(["CARD_033", "CARD_034"])} hasLoaded onToggleSaved={() => undefined} />
    );
    const managementOnlyHtml = renderToStaticMarkup(
      <SavedPathsList savedCardIds={new Set(["CARD_024"])} hasLoaded onToggleSaved={() => undefined} />
    );

    expect(emptyHtml).toContain("هنوز مسیری ذخیره نکرده‌ای");
    expect(emptyHtml).toContain("مشاهده مسیرهای شغلی");
    expect(savedHtml).toContain(getCareerDisplayTitle(careerCards[0].title));
    expect(savedHtml).not.toContain("سطح کارشناسی");
    expect(savedHtml).toContain("ذخیره‌شده");
    expect(savedHtml).toContain("/?card=CARD_001");
    expect(twoVariantHtml).toContain("/?card=CARD_034");
    expect(twoVariantHtml).not.toContain("/?card=CARD_033");
    expect(twoVariantHtml).not.toContain("سطح کارشناسی");
    expect(twoVariantHtml).not.toContain("سطح مدیریت");
    expect(managementOnlyHtml).toContain("هنوز مسیری ذخیره نکرده‌ای");
  });

  it("keeps exactly three bottom tabs and replaces guide with saved paths", () => {
    const labels: readonly string[] = navigationItems.map((item) => item.label);

    expect(labels).toEqual(["مسیرها", "مقایسه", "ذخیره‌شده‌ها"]);
    expect(navigationItems.map((item) => item.href)).toEqual(["/", "/career/compare", "/career/saved"]);
    expect(labels).not.toContain("راهنما");
  });

  it("compresses single-child levels without changing hierarchy identity", () => {
    const technology = careerHierarchy.find((domain) => domain.name === "Technology & Engineering")!;
    const marketing = careerHierarchy.find((domain) => domain.name === "Marketing & Growth")!;
    const businessOperations = careerHierarchy.find((domain) => domain.name === "Business Operations")!;
    const mobile = technology.generalCategories.find((category) => category.name === "Mobile Engineering")!;

    expect(resolveDomainSelection(technology)).toEqual({ domainId: technology.id });
    expect(resolveDomainSelection(marketing)).toEqual({
      domainId: marketing.id,
      categoryId: marketing.generalCategories[0].id,
      subfamilyId: undefined
    });
    expect(resolveDomainSelection(businessOperations)).toEqual({
      domainId: businessOperations.id,
      categoryId: businessOperations.generalCategories[0].id,
      subfamilyId: businessOperations.generalCategories[0].subfamilies[0].id
    });
    expect(resolveCategorySelection(technology, mobile)).toEqual({
      domainId: technology.id,
      categoryId: mobile.id,
      subfamilyId: mobile.subfamilies[0].id
    });
  });

  it("returns to the nearest meaningful choice level", () => {
    const technology = careerHierarchy.find((domain) => domain.name === "Technology & Engineering")!;
    const marketing = careerHierarchy.find((domain) => domain.name === "Marketing & Growth")!;
    const businessOperations = careerHierarchy.find((domain) => domain.name === "Business Operations")!;
    const mobile = technology.generalCategories.find((category) => category.name === "Mobile Engineering")!;

    expect(getMeaningfulParentSelection(technology, mobile, mobile.subfamilies[0])).toEqual({ domainId: technology.id });
    expect(getMeaningfulParentSelection(marketing, marketing.generalCategories[0])).toEqual({});
    expect(getMeaningfulParentSelection(
      businessOperations,
      businessOperations.generalCategories[0],
      businessOperations.generalCategories[0].subfamilies[0]
    )).toEqual({});
  });

  it("preserves IDs and hierarchy while adding non-empty duties to every card", () => {
    const hierarchyFields = [
      "Job_Domain_Group",
      "General_Job_Category",
      "Mid_Job_Category",
      "Final_Job_Subfamily",
      "Seniority_Level"
    ] as const;

    expect(v2CareerCards).toHaveLength(68);
    expect(v2CareerCards.map((card) => card.Card_ID)).toEqual(oldCareerCards.map((card) => card.Card_ID));
    oldCareerCards.forEach((oldCard, index) => {
      const nextCard = v2CareerCards[index];
      hierarchyFields.forEach((field) => expect(nextCard[field]).toBe(oldCard[field]));
    });
    expect(v2CareerCards.every((card) => (
      Array.isArray(card.Main_Duties_List_FA)
      && card.Main_Duties_List_FA.length > 0
    ))).toBe(true);
  });

  it.each([".NET / C#", "حل مسئله و تفکر تحلیلی"])(
    "keeps essential-chip parts in a stable order for %s",
    (item) => {
      const html = renderToStaticMarkup(<EssentialChip item={item} kind="technical" />);
      const parts = ["star", "item", "separator", "label"].map((part) => html.indexOf(`data-essential-part="${part}"`));

      expect(parts.every((position) => position >= 0)).toBe(true);
      expect(parts).toEqual([...parts].sort((first, second) => first - second));
      expect(html).toContain('dir="ltr"');
      expect(html).toContain('dir="auto"');
      expect(html).toContain('dir="rtl"');
    }
  );

  it("renders every primary item as essential and supporting items as secondary", () => {
    const html = renderToStaticMarkup(
      <PriorityGroup
        primaryItems={["REST / GraphQL API Design", "OOP"]}
        supportingItems={["Microservices و معماری توزیع‌شده"]}
        kind="technical"
      />
    );

    expect(html.match(/data-essential-part="star"/g)).toHaveLength(2);
    expect(html.match(/data-essential-part="label"/g)).toHaveLength(2);
    expect(html).toContain("Microservices و معماری توزیع‌شده");
  });

  it("classifies and deduplicates every supporting requirement", () => {
    const referenceSets = buildCareerItemReferenceSets(v2CareerCards);

    expect(classifySupportingRequirement("SQL Databases", referenceSets)).toEqual({ kind: "tool", reason: "known-tool" });
    expect(classifySupportingRequirement("مسئولیت‌پذیری و تعهد", referenceSets)).toEqual({ kind: "soft", reason: "known-soft" });
    expect(classifySupportingRequirement("REST / GraphQL API Design", referenceSets)).toEqual({ kind: "technical", reason: "known-technical" });
    expect(classifySupportingRequirement("سامانه اختصاصی", referenceSets)).toEqual({ kind: "tool", reason: "tool-keyword" });
    expect(classifySupportingRequirement("Selenium", referenceSets)).toEqual({ kind: "tool", reason: "tool-keyword" });
    expect(classifySupportingRequirement("مذاکره و متقاعدسازی", referenceSets)).toEqual({ kind: "technical", reason: "known-technical" });
    expect(classifySupportingRequirement("تفکر سیستمی", referenceSets)).toEqual({ kind: "soft", reason: "soft-keyword" });
    expect(classifySupportingRequirement("دانش مقررات تخصصی", referenceSets)).toEqual({ kind: "technical", reason: "default-technical" });

    careerCards.forEach((card) => {
      const primaryItems = new Set(
        [...card.keyTechnicalSkills, ...card.keyTools, ...card.keySoftSkills].map(normalizeSearchText)
      );
      const expectedSupportingItems = new Set(
        card.supportingRequirements
          .map(normalizeSearchText)
          .filter((item) => !primaryItems.has(item))
      );
      const classifiedSupportingItems = [
        ...card.supportingTechnicalSkills,
        ...card.supportingTools,
        ...card.supportingSoftSkills
      ].map(normalizeSearchText);

      expect(new Set(classifiedSupportingItems)).toEqual(expectedSupportingItems);
      expect(classifiedSupportingItems.every((item) => !primaryItems.has(item))).toBe(true);
    });
  });

  it("uses only the approved taxonomy display-label corrections", () => {
    expect(getDisplayLabel("Revenue & Customer Operations")).toBe("ارتباط با مشتری");
    expect(getDisplayLabel("Sales & Business Development")).toBe("بازرگانی و توسعه بازار");
    expect(getDisplayLabel("Growth Marketing")).toBe("بازاریابی رشد");
    expect(getDisplayLabel("Backend Platform & Services")).toBe("Backend Platform & Services");
  });

  it("renders only level-one discovery before a hierarchy selection", () => {
    const html = renderToStaticMarkup(<PathsPage />);

    expect(html).toContain("حوزه‌ای که کنجکاوت می‌کند");
    expect(html).toContain("یکی از ۱۰ حوزه واقعی را انتخاب کن تا دسته‌های داخلش را ببینی.");
    expect(html).not.toContain("بین حوزه‌های شغلی جست و جو کن");
    expect(html).toContain("useravaa-mascot-magnifier-eye.webp");
    expect(html).toContain("مسیر مناسب خودت");
    expect(html).toContain("قدم‌به‌قدم پیدا کن");
    expect(html).toContain("ده‌ها هزار آگهی شغلی بررسی شده تا تو مسیرها را روشن‌تر ببینی و مسیر شغلی بهتری انتخاب کنی.");
    expect(html).not.toContain("قبل از انتخاب مسیر، تصویر واقعی‌تری از کار، مهارت‌ها و تصمیم‌های پیش رو ببین.");
    expect(html).toContain('data-domain-accent="yellow"');
    expect(html).toContain('data-domain-accent="persimmon"');
    expect(html).toContain('data-career-search="true"');
    expect(html).not.toContain("از حوزه شروع کن، دسته و مسیر را بشناس و بعد جزئیات هر سطح را ببین.");
    expect(html).toContain("انتخاب حوزه شغلی");
    expect(html).toContain("انتخاب دسته شغلی");
    expect(html).toContain("انتخاب مسیر شغلی");
    expect(html).toContain("مشاهده مسیر شغلی");
    expect(html).toContain("حوزه شغلی");
    expect(html).toContain("دسته شغلی");
    expect(html).toContain("مسیر شغلی");
    expect(html).toContain("مشاهده مسیر");
    expect(html).toContain("فناوری و مهندسی");
    expect(html).toContain("ارتباط با مشتری");
    expect(html).toContain("بازرگانی و توسعه بازار");
    expect(html).not.toContain("درآمد و عملیات مشتری");
    expect(html).not.toContain("فروش و ارتباط با مشتری");
    expect(html).toContain("داده و هوش مصنوعی");
    const domainCountLabels = [...html.matchAll(/<small>([^<]*مسیر شغلی)<\/small>/g)]
      .map((match) => match[1]);
    expect(domainCountLabels).toHaveLength(careerHierarchy.length);
    expect(domainCountLabels.every((label) => !label.includes("دسته"))).toBe(true);
    expect(html).not.toContain(".NET / C# Backend");
    expect(html).not.toContain("مهارت‌های تخصصی");
    expect(html).not.toContain("شروع دوباره");
    expect(html.match(/<article/g)).toBeNull();
  });

  it("prioritizes the requested top-level domains without reordering the remainder", () => {
    const html = renderToStaticMarkup(<PathsPage />);
    const priority = ["Marketing & Growth", "Product & UX", "Data & AI"];
    const remainingDomains = careerHierarchy
      .map((domain) => domain.name)
      .filter((domainName) => !priority.includes(domainName));
    const renderedPositions = [...priority, ...remainingDomains]
      .map((domainName) => html.indexOf(getDisplayLabel(domainName)));

    expect(renderedPositions.every((position) => position >= 0)).toBe(true);
    expect(renderedPositions).toEqual([...renderedPositions].sort((left, right) => left - right));
  });

  it("makes the full domain card a native clickable control", () => {
    const domain = careerHierarchy[0];
    const onSelect = vi.fn();
    const card = DomainCard({ domain, onSelect });
    const props = card.props as Readonly<{
      type: string;
      onClick: () => void;
      "data-career-domain-card": string;
    }>;

    expect(card.type).toBe("button");
    expect(props.type).toBe("button");
    expect(props["data-career-domain-card"]).toBe(domain.id);
    props.onClick();
    expect(onSelect).toHaveBeenCalledOnce();
    expect(onSelect).toHaveBeenCalledWith(domain);
  });

  it("keeps icon, title, white space, and arrow inside the clickable domain button", () => {
    const domain = careerHierarchy[0];
    const html = renderToStaticMarkup(<DomainCard domain={domain} accent="persimmon" onSelect={() => undefined} />);

    expect(html.match(/<button/g)).toHaveLength(1);
    expect(html).toContain('data-career-domain-part="icon"');
    expect(html).toContain('data-career-domain-part="title"');
    expect(html).toContain('data-career-domain-part="arrow"');
    expect(html).toContain(`${domain.subfamilyCount.toLocaleString("fa-IR")} مسیر شغلی`);
    expect(html).not.toContain(" دسته");
  });

  it("keeps Data and AI blue and replaces the rejected customer accent with teal", () => {
    expect(getDomainAccent("Data & AI", 2)).toBe("blue");
    expect(getDomainAccent("Revenue & Customer Operations", 4)).toBe("teal");
  });

  it("keeps category and path cards as native full-card controls", () => {
    const category = careerHierarchy.find((domain) => domain.name === "Technology & Engineering")!.generalCategories[0];
    const subfamily = category.subfamilies[0];
    const onCategorySelect = vi.fn();
    const onSubfamilySelect = vi.fn();
    const categoryCard = CategoryCard({ category, onSelect: onCategorySelect });
    const subfamilyCard = SubfamilyCard({ subfamily, onSelect: onSubfamilySelect });

    expect(categoryCard.type).toBe("button");
    expect(categoryCard.props.type).toBe("button");
    categoryCard.props.onClick();
    expect(onCategorySelect).toHaveBeenCalledWith(category);

    expect(subfamilyCard.type).toBe("button");
    expect(subfamilyCard.props.type).toBe("button");
    subfamilyCard.props.onClick();
    expect(onSubfamilySelect).toHaveBeenCalledWith(subfamily);
  });

  it("keeps the mascot visible at all breakpoints and decorative layers non-interactive", () => {
    const css = readFileSync("src/features/career/CareerPages.module.css", "utf8");
    const mascotRule = css.match(/\.heroMascot\s*\{([^}]*)\}/)?.[1] ?? "";
    const persimmonRule = css.match(/\.domainAccentPersimmon\s*\{([^}]*)\}/)?.[1] ?? "";

    expect(mascotRule).toContain("display: block");
    expect(mascotRule).toContain("pointer-events: none");
    expect(mascotRule).not.toContain("display: none");
    expect(persimmonRule).toContain("color: #fff");
  });

  it("hides explorer chrome and full stepper in path detail focus mode", () => {
    const html = renderToStaticMarkup(<PathsPage initialCardId="CARD_034" />);

    expect(html).not.toContain("مسیر مناسب خودت");
    expect(html).not.toContain("هزاران آگهی شغلی بررسی شده");
    expect(html).not.toContain("عنوان، مهارت یا ابزار را جست‌وجو کن");
    expect(html).not.toContain("مراحل انتخاب مسیر شغلی");
    expect(html).toContain("همه مسیرها");
    expect(html).toContain("مرحله قبل");
    expect(html).not.toContain("شروع مجدد");
    expect(html).not.toContain("شروع دوباره");
    expect(html).not.toContain("به مرحله قبل");
    expect(html).not.toContain("یک مرحله قبل");
    expect(html).toContain("مسیرهای مشابه برای بررسی");
    expect(html.indexOf("مسیرهای مشابه برای بررسی")).toBeGreaterThan(html.lastIndexOf("مهارت‌های نرم"));
  });

  it("hides unapproved slides on a path that previously exposed them", () => {
    const html = renderToStaticMarkup(<PathsPage initialCardId="CARD_045" />);

    expect(html).toContain("طراحی محصول و تجربه کاربری (UI/UX)");
    expect(html).not.toContain('data-career-image-carousel="true"');
    expect(html).not.toContain("career-slides/");
  });

  it("keeps path details clean and hides management variants", () => {
    const expertHtml = renderToStaticMarkup(<PathsPage initialCardId="CARD_015" />);
    const managementHtml = renderToStaticMarkup(<PathsPage initialCardId="CARD_033" />);
    const managementOnlyHtml = renderToStaticMarkup(<PathsPage initialCardId="CARD_024" />);

    expect(expertHtml).toContain(getCareerDisplayTitle(careerCards.find((card) => card.id === "CARD_015")!.title));
    expect(expertHtml).not.toContain("سطح کارشناسی");
    expect(expertHtml).not.toContain("سطح مدیریت");
    expect(expertHtml).not.toContain("سطح‌های موجود");
    expect(managementHtml).not.toContain("دیجیتال مارکتینگ عمومی - سطح مدیریت");
    expect(managementOnlyHtml).not.toContain("مدیریت منابع انسانی - سطح مدیریت");
  });

  it("renders the compare selection shell with two sources and five slots", () => {
    const html = renderToStaticMarkup(<ComparePage />);

    expect(html).toContain("مقایسه مسیرها");
    expect(html).toContain("۲ تا ۵ مسیر را برای مقایسه انتخاب کن");
    expect(html).toContain("ذخیره‌شده‌ها");
    expect(html).toContain("اخیراً دیده‌شده‌ها");
    expect(html.match(/emptySlot/g)).toHaveLength(5);
    expect(html).toContain("مقایسه مسیرها</button>");
    expect(html).toContain("disabled");
    expect(html).not.toContain("<select");
  });

  it("enforces the two-to-five comparison selection contract", () => {
    const selectedPathIds = ["path-1", "path-2", "path-3", "path-4", "path-5"];
    const rejectedSelection = updateCompareSelection(selectedPathIds, "path-6");
    const removedSelection = updateCompareSelection(selectedPathIds, "path-3");

    expect(MIN_COMPARE_PATHS).toBe(2);
    expect(MAX_COMPARE_PATHS).toBe(5);
    expect(rejectedSelection).toEqual({ selectedPathIds, limitReached: true });
    expect(removedSelection).toEqual({
      selectedPathIds: ["path-1", "path-2", "path-4", "path-5"],
      limitReached: false
    });
  });

  it("keeps recently viewed paths unique and most-recent first", () => {
    expect(addRecentlyViewedPathId(["path-2", "path-1"], "path-1")).toEqual(["path-1", "path-2"]);
  });

  it("uses only the visible representative for saved comparison paths", () => {
    const paths = getSavedComparisonPaths(new Set(["CARD_033", "CARD_034"]));
    const managementOnlyPaths = getSavedComparisonPaths(new Set(["CARD_024"]));

    expect(paths).toHaveLength(1);
    expect(paths[0].cards.map((card) => card.id)).toEqual(["CARD_034"]);
    expect(managementOnlyPaths).toEqual([]);
  });

  it("renders only the four approved RTL comparison sections", () => {
    const paths = visibleCareerHierarchy
      .flatMap((domain) => domain.generalCategories)
      .flatMap((category) => category.subfamilies)
      .slice(0, 2);
    const html = renderToStaticMarkup(<CareerComparisonTable paths={paths} onEdit={() => undefined} />);
    const sections = buildComparisonSections(paths);
    const rowLabels = sections.flatMap((section) => section.rows.map((row) => row.label));

    expect(compareSectionTabs.map((section) => section.label)).toEqual(["نمای کلی", "شرح شغلی", "مهارت‌ها", "ابزارها"]);
    expect(sections.map((section) => section.id)).toEqual(["overview", "duties", "skills", "tools"]);
    compareSectionTabs.forEach((section) => expect(html).toContain(section.label));
    expect(html).toContain('data-compare-table="rtl"');
    expect(html).toContain("معیار مقایسه");
    expect(html.indexOf("معیار مقایسه")).toBeLessThan(html.indexOf(getDisplayLabel(paths[0].name)));
    expect(html.indexOf(getDisplayLabel(paths[0].name))).toBeLessThan(html.indexOf(getDisplayLabel(paths[1].name)));
    expect(rowLabels).not.toContain("سطح‌های موجود");
    expect(rowLabels).not.toContain("خروجی‌های کاری");
  });

  it("combines essential and classified supporting skills without duplicates", () => {
    const path = visibleCareerHierarchy
      .flatMap((domain) => domain.generalCategories)
      .flatMap((category) => category.subfamilies)
      .find((subfamily) => subfamily.cards.some((card) => card.id === "CARD_001"))!;
    const card = path.cards.find((item) => item.id === "CARD_001")!;
    const skillSection = buildComparisonSections([path]).find((section) => section.id === "skills")!;
    const technicalItems = skillSection.rows.find((row) => row.label === "مهارت‌های تخصصی")!.values[0];
    const softItems = skillSection.rows.find((row) => row.label === "مهارت‌های نرم")!.values[0];
    const technicalTexts = technicalItems.map((item) => item.text);
    const softTexts = softItems.map((item) => item.text);

    card.keyTechnicalSkills.forEach((skill) => {
      expect(technicalItems.find((item) => item.text === skill)?.essential).toBe(true);
    });
    card.supportingTechnicalSkills.forEach((skill) => expect(technicalTexts).toContain(skill));
    card.keySoftSkills.forEach((skill) => {
      expect(softItems.find((item) => item.text === skill)?.essential).toBe(true);
    });
    card.supportingSoftSkills.forEach((skill) => expect(softTexts).toContain(skill));
    expect(new Set(technicalTexts.map(normalizeSearchText)).size).toBe(technicalTexts.length);
    expect(new Set(softTexts.map(normalizeSearchText)).size).toBe(softTexts.length);
  });

  it("renders essential labels and preserves supporting skills without that label", () => {
    const path = visibleCareerHierarchy
      .flatMap((domain) => domain.generalCategories)
      .flatMap((category) => category.subfamilies)
      .find((subfamily) => subfamily.cards.some((card) => card.id === "CARD_001"))!;
    const html = renderToStaticMarkup(<CareerComparisonTable paths={[path]} onEdit={() => undefined} />);

    expect(html).toContain('data-essential-part="label"');
    expect(html).toContain("ضروری");
    expect(html).toContain(path.cards[0].supportingTechnicalSkills[0]);
    expect(html).toContain(path.cards[0].supportingSoftSkills[0]);
  });

  it("detects Latin-heavy and Persian comparison items without rewriting text", () => {
    expect(getComparisonTextDirection("REST / GraphQL API Design")).toBe("ltr");
    expect(getComparisonTextDirection("Design Patterns و Clean Architecture")).toBe("ltr");
    expect(getComparisonTextDirection("طراحی و توسعه سرویس‌های سمت سرور")).toBe("rtl");
  });

  it("renders long comparison-card titles with explicit readable direction", () => {
    const paths = visibleCareerHierarchy
      .flatMap((domain) => domain.generalCategories)
      .flatMap((category) => category.subfamilies);
    const ltrPath = paths.find((path) => path.name === "SOC / Security Monitoring & Incident Response")!;
    const rtlPath = paths.find((path) => path.name === "دیجیتال مارکتینگ عمومی")!;
    const ltrHtml = renderToStaticMarkup(<ComparePathCard path={ltrPath} selected={false} onToggle={() => undefined} />);
    const rtlHtml = renderToStaticMarkup(<ComparePathCard path={rtlPath} selected={false} onToggle={() => undefined} />);

    expect(ltrHtml).toContain('dir="ltr"');
    expect(ltrHtml).toContain("SOC / Security Monitoring &amp; Incident Response");
    expect(rtlHtml).toContain('dir="rtl"');
    expect(rtlHtml).toContain("دیجیتال مارکتینگ عمومی");
  });

  it("shows the insufficient-data fallback when only one compared path lacks a value", () => {
    const paths = visibleCareerHierarchy
      .flatMap((domain) => domain.generalCategories)
      .flatMap((category) => category.subfamilies)
      .slice(0, 2);
    const pathWithoutTools = {
      ...paths[1],
      cards: paths[1].cards.map((card) => ({ ...card, keyTools: [] }))
    };
    const html = renderToStaticMarkup(
      <CareerComparisonTable paths={[paths[0], pathWithoutTools]} onEdit={() => undefined} />
    );
    const toolSection = buildComparisonSections([paths[0], pathWithoutTools])
      .find((section) => section.id === "tools");

    expect(toolSection?.rows[0].values[1]).toEqual([]);
    expect(html).toContain("اطلاعات کافی موجود نیست");
  });

  it("disables the compare CTA for one path and enables it for two", () => {
    const paths = visibleCareerHierarchy
      .flatMap((domain) => domain.generalCategories)
      .flatMap((category) => category.subfamilies)
      .slice(0, 2);
    const onePathHtml = renderToStaticMarkup(
      <SelectionTray
        selectedPaths={paths.slice(0, 1)}
        limitMessage="حداکثر ۵ مسیر را می‌توانی مقایسه کنی."
        onRemove={() => undefined}
        onCompare={() => undefined}
      />
    );
    const twoPathHtml = renderToStaticMarkup(
      <SelectionTray selectedPaths={paths} limitMessage="" onRemove={() => undefined} onCompare={() => undefined} />
    );

    expect(onePathHtml).toContain("disabled");
    expect(onePathHtml).toContain("حداکثر ۵ مسیر را می‌توانی مقایسه کنی.");
    expect(twoPathHtml).not.toContain("disabled");
    expect(twoPathHtml.match(/filledSlot/g)).toHaveLength(2);
    expect(twoPathHtml.match(/emptySlot/g)).toHaveLength(3);
  });

  it("renders exactly the four requested guide categories", () => {
    const html = renderToStaticMarkup(<GuidePage />);
    expect(guideCategories).toHaveLength(4);
    guideCategories.forEach((category) => expect(html).toContain(category.title));
  });
});
