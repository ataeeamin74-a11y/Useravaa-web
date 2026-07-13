import { createHash } from "node:crypto";
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const repoRoot = process.cwd();
const sourceRoot = path.resolve(
  process.env.USERAVAA_CAREER_RESEARCH_SOURCE ?? path.join(repoRoot, "..", "job research")
);
const manifestPath = path.join(sourceRoot, "research", "role_manifest.json");
const draftsDirectory = path.join(sourceRoot, "drafts");
const deliverablesDirectory = path.join(sourceRoot, "deliverables", "roles");
const rawCareerCardsPath = path.join(
  repoRoot,
  "src",
  "features",
  "career",
  "data",
  "career-cards-v2-with-duties.json"
);
const generatedContentPath = path.join(
  repoRoot,
  "src",
  "features",
  "career",
  "data",
  "career-research-content.json"
);
const generatedIndexPath = path.join(
  repoRoot,
  "src",
  "features",
  "career",
  "data",
  "career-research-index.json"
);
const privateResearchDirectory = path.join(repoRoot, "content", "career-research");
const reconciliationReportPath = path.join(
  repoRoot,
  "docs",
  "launch",
  "Useravaa_Career_Research_Slug_Reconciliation_v1.md"
);

const ROLE_APP_MAP = {
  "backend-dotnet-csharp": ["CARD_001", "dotnet-c-sharp-backend"],
  "backend-go": ["CARD_002", "go-backend"],
  "backend-java-jvm": ["CARD_003", "java-jvm-backend"],
  "backend-nodejs-typescript": ["CARD_004", "node-js-typescript-backend"],
  "backend-php-laravel": ["CARD_005", "php-laravel-backend"],
  "backend-python-django": ["CARD_006", "python-django-backend"],
  "crm-operations": ["CARD_007", "crm-operations"],
  "crm-retention-operations": ["CARD_008", "crm-and-retention-operations"],
  "contact-center-operations": ["CARD_009", "contact-center-operations"],
  "penetration-testing": ["CARD_010", "offensive-security-penetration-testing"],
  "soc-security-monitoring": ["CARD_011", "soc-security-monitoring-and-incident-response"],
  "data-analysis-business-insights": ["CARD_012", "analytics-and-business-insights"],
  "data-engineering-platform": ["CARD_013", "data-engineering-and-platform"],
  "ai-engineering-llm-genai": ["CARD_014", "llm-genai"],
  "business-intelligence-dashboard-reporting": ["CARD_015", "bi-dashboarding-and-reporting"],
  "kubernetes-platform-engineering": ["CARD_016", "kubernetes-platform-engineering"],
  "sre-reliability-engineering": ["CARD_017", "sre-reliability-engineering"],
  "frontend-angular": ["CARD_018", "angular-frontend"],
  "frontend-react-nextjs": ["CARD_019", "react-next-js-frontend"],
  "frontend-vue-nuxt": ["CARD_020", "vue-nuxt-frontend"],
  "fullstack-dotnet-blazor": ["CARD_021", "full-stack-dotnet-blazor"],
  "fullstack-node-mern": ["CARD_022", "full-stack-node-js-mern"],
  "talent-acquisition-recruitment": ["CARD_023", "talent-acquisition"],
  "human-resources-management": ["CARD_024", "hr-management"],
  "hr-operations-personnel-administration": ["CARD_025", "hr-operations-and-personnel-administration"],
  "it-helpdesk": ["CARD_026", "it-support-helpdesk"],
  "network-administration": ["CARD_027", "network-administration-and-infrastructure"],
  "windows-microsoft-infrastructure": ["CARD_028", "windows-microsoft-infrastructure"],
  "growth-marketing": ["CARD_029", "growth-marketing"],
  "content-marketing": ["CARD_030", "content-and-copywriting"],
  "market-research-insights": ["CARD_031", "market-research-and-insights"],
  "social-media-content-creation": ["CARD_032", "social-media-marketing"],
  "digital-marketing-general": ["CARD_034", "digital-marketing"],
  seo: ["CARD_036", "seo"],
  "social-media-management": ["CARD_032", "social-media-marketing"],
  "brand-strategy-branding": ["CARD_039", "brand-pr-and-communications"],
  "marketing-generalist": ["CARD_041", "marketing-generalist-and-strategy"],
  "performance-marketing": ["CARD_042", "performance-marketing"],
  "android-native-kotlin": ["CARD_043", "android-native-kotlin"],
  "logistics-operations": ["CARD_044", "logistics-operations"],
  "product-ui-ux-design": ["CARD_045", "ui-ux"],
  "product-management": ["CARD_046", "product-management-and-ownership"],
  "qa-automation-sdet": ["CARD_047", "qa-automation-sdet"],
  "account-management": ["CARD_048", "account-management"],
  "b2b-corporate-sales": ["CARD_049", "b2b-corporate-sales"],
  "business-development": ["CARD_050", "business-development"],
  "commercial-trading-operations": ["CARD_051", "commercial-trading-operations"],
  "market-development-merchant-acquisition": ["CARD_052", "market-development-merchant-acquisition"],
  "internal-audit": ["CARD_054", "career-path-1drths"],
  payroll: ["CARD_056", "career-path-fmhiml"],
  "treasury-accounting": ["CARD_058", "career-path-1bed9m"],
  "tax-accounting": ["CARD_060", "career-path-1b5cj3"],
  "financial-accounting-management": ["CARD_061", "career-path-1gt2jj"],
  "graphic-design-visual-content": ["CARD_069", "graphic-design-and-visual-content"],
  "video-editing-production": ["CARD_063", "career-path-1w9y14"],
  "illustration-digital-design": ["CARD_064", "career-path-1u9xrl"],
  "3d-art-design": ["CARD_065", "3d-art"],
  "motion-graphics-animation": ["CARD_067", "career-path-1lo6cj"],
  "visual-identity-brand-design": ["CARD_068", "career-path-1rtxp8"]
};

const APPROVED_FIT_DIMENSIONS = [
  "نیاز به تعامل با آدم‌ها",
  "نیاز به استفاده از ابزارها",
  "نیاز به خلاقیت",
  "نیاز به تحلیل آماری"
];
const APPROVED_LEVELS = new Set(["کم", "متوسط", "زیاد"]);
const SOCIAL_MEDIA_SOURCE_SLUGS = [
  "social-media-content-creation",
  "social-media-management"
];
const SOCIAL_MEDIA_CANONICAL_SLUG = "social-media-marketing";

function clean(value) {
  return value
    .replace(/\*\*/gu, "")
    .replace(/`/gu, "")
    .replace(/\s+/gu, " ")
    .trim();
}

function normalizeLabel(value) {
  return clean(value)
    .replace(/[«»]/gu, "")
    .replace(/[\u200c\u200d]/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

function parseTable(section) {
  return section
    .split("\n")
    .filter((line) => line.trim().startsWith("|") && line.trim().endsWith("|"))
    .map((line) => line.trim().slice(1, -1).split("|").map(clean))
    .filter((cells) => cells.length > 1 && !cells.every((cell) => /^:?-{3,}:?$/u.test(cell)));
}

function parseKeyValues(section) {
  const values = new Map();

  for (const match of section.matchAll(/^-\s+([^:]+):\s*(.+)$/gmu)) {
    values.set(normalizeLabel(match[1]), clean(match[2]));
  }

  for (const [key, value] of parseTable(section)) {
    if (["فیلد", "field"].includes(normalizeLabel(key).toLocaleLowerCase())) continue;
    values.set(normalizeLabel(key), clean(value));
  }

  return values;
}

function requiredValue(values, field, aliases = []) {
  for (const label of [field, ...aliases]) {
    const value = values.get(normalizeLabel(label));
    if (value) return value;
  }
  throw new Error(`Missing appendix field: ${field}`);
}

function getAppendixSections(markdown, researchSlug) {
  const appendixStart = markdown.indexOf("# پیوست: استخراج آماده انتشار Useravaa");
  const sourcesStart = markdown.indexOf("# منابع و روش پژوهش", appendixStart);
  if (appendixStart < 0 || sourcesStart < 0) {
    throw new Error(`${researchSlug}: product appendix boundaries were not found`);
  }

  const appendix = markdown.slice(appendixStart, sourcesStart);
  const matches = [...appendix.matchAll(/^##\s+([A-G])\.\s+.+$/gmu)];
  if (matches.length !== 7) {
    throw new Error(`${researchSlug}: expected seven appendix sections, found ${matches.length}`);
  }

  return Object.fromEntries(matches.map((match, index) => {
    const start = match.index + match[0].length;
    const end = matches[index + 1]?.index ?? appendix.length;
    return [match[1], appendix.slice(start, end).trim()];
  }));
}

function splitList(value) {
  return value
    .split(/[؛،]+/u)
    .map(clean)
    .filter(Boolean);
}

function uniqueValues(values) {
  const seen = new Set();
  return values.filter((value) => {
    const key = normalizeLabel(value).toLocaleLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function mergeSocialMediaResearch(sourceRoles) {
  const contentCreation = sourceRoles.find((role) => (
    role.researchSlug === "social-media-content-creation"
  ));
  const management = sourceRoles.find((role) => (
    role.researchSlug === "social-media-management"
  ));

  if (!contentCreation || !management) {
    throw new Error("Both social-media source reports are required for canonical reconciliation");
  }

  return {
    roleId: "marketing_social_media_marketing",
    researchSlug: SOCIAL_MEDIA_CANONICAL_SLUG,
    sourceResearchSlugs: [...SOCIAL_MEDIA_SOURCE_SLUGS],
    appSlug: SOCIAL_MEDIA_CANONICAL_SLUG,
    cardId: "CARD_032",
    categoryId: management.categoryId,
    source: {
      documents: [
        ...contentCreation.source.documents,
        ...management.source.documents
      ],
      reconciliation: {
        strategy: "curated_merge",
        summary: "The content-creation and channel-management reports are reconciled into one approved Social Media Marketing product path.",
        preservedEvidence: [
          "Content ideation, scripting, production, editing, asset rights, and platform-ready publishing from the content-creation report.",
          "Channel strategy, calendar ownership, community response, moderation, social listening, crisis handling, and performance analysis from the management report."
        ],
        deduplication: "Shared fit dimensions, hardships, AI impacts, and overlapping workflow evidence are retained once; role-specific tools and responsibilities are merged by meaning rather than concatenated verbatim."
      }
    },
    hero: {
      titleFa: "بازاریابی شبکه‌های اجتماعی",
      titleEn: "Social Media Marketing",
      definition: "هدف برند را به استراتژی شبکه‌ها، تقویم و تعامل با جامعه تبدیل می‌کند و هم‌زمان تولید، انتشار و سنجش محتوای مناسب هر پلتفرم را پیش می‌برد.",
      decisionDescription: "مناسب فردی که از ترکیب ایده‌پردازی و تولید محتوا با مدیریت پیوسته کانال، گفت‌وگو با مخاطب و تصمیم‌گیری بر پایه عملکرد لذت می‌برد.",
      workNatureLabel: management.hero.workNatureLabel,
      attraction: management.hero.attraction,
      fitIndicator: management.hero.fitIndicator,
      mainDifficulty: management.hero.mainDifficulty
    },
    fitDimensions: management.fitDimensions,
    reality: {
      workday: [
        "پژوهش مخاطب و ترند، تنظیم brief و تقویم، تولید یا هماهنگی محتوا، انتشار و پاسخ‌گویی، پایش جامعه، کنترل کیفیت و تحلیل عملکرد برای اصلاح برنامه."
      ],
      softSkills: uniqueValues([
        ...contentCreation.reality.softSkills,
        ...management.reality.softSkills,
        "مدیریت بحران و گفت‌وگوی مسئولانه با مخاطب"
      ]),
      technicalSkills: uniqueValues([
        ...contentCreation.reality.technicalSkills,
        ...management.reality.technicalSkills,
        "استراتژی کانال و تقویم محتوا",
        "Community Management و Social Listening"
      ]),
      tools: uniqueValues([
        ...contentCreation.reality.tools,
        ...management.reality.tools
      ])
    },
    hardships: management.hardships,
    intelligence: management.intelligence,
    interviewQuestions: [
      "یک پروژه بازاریابی شبکه‌های اجتماعی را از مسئله و برنامه محتوا تا نتیجه و یادگیری توضیح بده؟",
      ...management.interviewQuestions.slice(1)
    ],
    relatedResearchSlugs: uniqueValues([
      ...contentCreation.relatedResearchSlugs,
      ...management.relatedResearchSlugs
    ]).filter((slug) => !SOCIAL_MEDIA_SOURCE_SLUGS.includes(slug)),
    relatedPaths: [
      contentCreation.relatedPaths[1],
      contentCreation.relatedPaths[3],
      contentCreation.relatedPaths[2],
      contentCreation.relatedPaths[4],
      management.relatedPaths[2],
      management.relatedPaths[3]
    ].map((item, index) => ({ ...item, rank: index + 1 }))
  };
}

function parseFitDimensions(section, researchSlug) {
  const normalizedApprovedDimensions = APPROVED_FIT_DIMENSIONS.map(normalizeLabel);
  function getApprovedDimensionIndex(value) {
    const normalizedValue = normalizeLabel(value);
    return normalizedApprovedDimensions.findIndex((approved) => (
      normalizedValue === approved || normalizedValue.startsWith(`${approved} `)
    ));
  }
  const dimensions = parseTable(section)
    .filter((cells) => getApprovedDimensionIndex(cells[0]) >= 0)
    .map(([label, level, explanation]) => ({
      label: APPROVED_FIT_DIMENSIONS[getApprovedDimensionIndex(label)],
      level: clean(level),
      explanation: clean(explanation)
    }));

  if (dimensions.length !== 4) {
    throw new Error(`${researchSlug}: expected four approved fit dimensions`);
  }
  if (dimensions.some((dimension) => !APPROVED_LEVELS.has(dimension.level))) {
    throw new Error(`${researchSlug}: fit dimensions contain a non-qualitative level`);
  }
  if (dimensions.map((dimension) => dimension.label).join("|") !== APPROVED_FIT_DIMENSIONS.join("|")) {
    throw new Error(`${researchSlug}: fit dimension order or labels do not match the product contract`);
  }

  return dimensions;
}

function parseHardships(section, researchSlug) {
  const rows = parseTable(section)
    .filter((cells) => !["عنوان کوتاه", "عنوان"].includes(normalizeLabel(cells[0])))
    .map(([title, explanation, context]) => ({
      title: clean(title),
      explanation: clean(explanation),
      context: clean(context)
    }))
    .filter((item) => item.title && item.explanation && item.context);

  if (rows.length < 3 || rows.length > 5) {
    throw new Error(`${researchSlug}: expected three to five hardships, found ${rows.length}`);
  }
  return rows;
}

function parseAiList(section, heading, researchSlug) {
  const markers = [`### ${heading}`, `**${heading}**`];
  const marker = markers.find((candidate) => section.includes(candidate));
  if (!marker) throw new Error(`${researchSlug}: missing AI prompt ${heading}`);
  const headingIndex = section.indexOf(marker);
  const contentStart = headingIndex + marker.length;
  const boundaries = [
    section.indexOf("### ", contentStart),
    section.indexOf("**هوش مصنوعی چه چیزهایی را", contentStart)
  ].filter((index) => index >= 0);
  const contentEnd = boundaries.length ? Math.min(...boundaries) : section.length;
  const content = section.slice(contentStart, contentEnd).trim();
  const bullets = [...content.matchAll(/^-\s+(.+)$/gmu)].map((match) => clean(match[1]));
  if (bullets.length) return bullets;

  const paragraph = clean(content);
  if (!paragraph) throw new Error(`${researchSlug}: empty AI prompt ${heading}`);
  return [paragraph];
}

function parseInterviewQuestions(section, researchSlug) {
  const questions = [...section.matchAll(/^\d+\.\s+(.+)$/gmu)].map((match) => clean(match[1]));
  if (questions.length !== 5) {
    throw new Error(`${researchSlug}: expected exactly five interview questions, found ${questions.length}`);
  }
  return questions;
}

function parseRelatedPaths(section, researchSlug) {
  const paths = parseTable(section)
    .filter((cells) => /^\d+$/u.test(cells[0]))
    .map(([rank, titleFa, titleEn, similarity, difference]) => ({
      rank: Number(rank),
      titleFa: clean(titleFa),
      titleEn: clean(titleEn),
      similarity: clean(similarity),
      difference: clean(difference)
    }));
  if (paths.length !== 6) {
    throw new Error(`${researchSlug}: expected six related-path rows, found ${paths.length}`);
  }
  return paths;
}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

async function writeIfChanged(filePath, contents) {
  let current = null;
  try {
    current = await readFile(filePath);
  } catch {
    // The first ingestion creates the file.
  }
  const next = Buffer.isBuffer(contents) ? contents : Buffer.from(contents);
  if (current?.equals(next)) return false;
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, next);
  return true;
}

async function main() {
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const rawCards = JSON.parse(await readFile(rawCareerCardsPath, "utf8"));
  const roles = manifest.roles;
  const cardIds = new Set(rawCards.map((card) => card.Card_ID));
  const manifestSlugs = new Set(roles.map((role) => role.slug));
  const mappedSlugs = new Set(Object.keys(ROLE_APP_MAP));

  if (manifest.role_count !== 59 || roles.length !== 59) {
    throw new Error(`Expected a 59-role source manifest, found ${roles.length}`);
  }
  const unmappedResearchSlugs = [...manifestSlugs].filter((slug) => !mappedSlugs.has(slug));
  const extraMappedSlugs = [...mappedSlugs].filter((slug) => !manifestSlugs.has(slug));
  if (unmappedResearchSlugs.length || extraMappedSlugs.length) {
    throw new Error(`Slug map mismatch: unmapped=${unmappedResearchSlugs.join(",")}; extra=${extraMappedSlugs.join(",")}`);
  }

  const appSlugs = Object.values(ROLE_APP_MAP).map(([, appSlug]) => appSlug);
  if (new Set(appSlugs).size !== 58) {
    throw new Error("Expected 59 source reports to reconcile to 58 canonical app slugs");
  }
  const duplicatedAppSlugs = [...new Set(appSlugs.filter((slug, index) => (
    appSlugs.indexOf(slug) !== index
  )))];
  if (duplicatedAppSlugs.length !== 1 || duplicatedAppSlugs[0] !== SOCIAL_MEDIA_CANONICAL_SLUG) {
    throw new Error(`Unexpected duplicate app slugs: ${duplicatedAppSlugs.join(",")}`);
  }

  const roleById = new Map(roles.map((role) => [role.id, role]));
  const parsedSourceRoles = [];
  let copiedDocxCount = 0;

  for (const role of roles) {
    const [cardId, appSlug] = ROLE_APP_MAP[role.slug];
    if (!cardIds.has(cardId)) throw new Error(`${role.slug}: mapped career card ${cardId} is missing`);

    const markdown = await readFile(path.join(draftsDirectory, `${role.slug}.md`), "utf8");
    const sections = getAppendixSections(markdown, role.slug);
    const heroValues = parseKeyValues(sections.A);
    const realityValues = parseKeyValues(sections.C);
    const sourceDocxPath = path.join(deliverablesDirectory, `${role.slug}.docx`);
    const sourceDocx = await readFile(sourceDocxPath);
    const privateDocxSlug = SOCIAL_MEDIA_SOURCE_SLUGS.includes(role.slug) ? role.slug : appSlug;
    const privateDocxPath = path.join(privateResearchDirectory, privateDocxSlug, "deep-research.docx");

    await mkdir(path.dirname(privateDocxPath), { recursive: true });
    let existingDocx = null;
    try {
      existingDocx = await readFile(privateDocxPath);
    } catch {
      // The first ingestion creates the private source file.
    }
    if (!existingDocx?.equals(sourceDocx)) {
      await cp(sourceDocxPath, privateDocxPath);
      copiedDocxCount += 1;
    }

    parsedSourceRoles.push({
      roleId: role.id,
      researchSlug: role.slug,
      sourceResearchSlugs: [role.slug],
      appSlug,
      cardId,
      categoryId: role.category_id,
      source: {
        documents: [{
          researchSlug: role.slug,
          docxPath: `content/career-research/${privateDocxSlug}/deep-research.docx`,
          sha256: sha256(sourceDocx)
        }],
        reconciliation: null
      },
      hero: {
        titleFa: requiredValue(heroValues, "عنوان فارسی"),
        titleEn: requiredValue(heroValues, "عنوان انگلیسی"),
        definition: requiredValue(heroValues, "تعریف یک جمله ای", ["تعریف یک‌جمله‌ای"]),
        decisionDescription: requiredValue(heroValues, "توصیف تصمیم محور", ["توصیف تصمیم‌محور"]),
        workNatureLabel: requiredValue(heroValues, "برچسب ماهیت کار"),
        attraction: requiredValue(heroValues, "جذابیت"),
        fitIndicator: requiredValue(heroValues, "نشانه تناسب"),
        mainDifficulty: requiredValue(heroValues, "دشواری اصلی")
      },
      fitDimensions: parseFitDimensions(sections.B, role.slug),
      reality: {
        workday: [requiredValue(realityValues, "روز کاری واقعی")],
        softSkills: splitList(requiredValue(realityValues, "مهارت های نرم", ["مهارت‌های نرم"])),
        technicalSkills: splitList(requiredValue(realityValues, "مهارت های تخصصی", ["مهارت‌های تخصصی"])),
        tools: splitList(requiredValue(realityValues, "ابزارها"))
      },
      hardships: parseHardships(sections.D, role.slug),
      intelligence: {
        easier: parseAiList(sections.E, "هوش مصنوعی چه چیزهایی را آسان‌تر می‌کند؟", role.slug),
        harder: parseAiList(sections.E, "هوش مصنوعی چه چیزهایی را سخت‌تر می‌کند؟", role.slug)
      },
      interviewQuestions: parseInterviewQuestions(sections.F, role.slug),
      relatedResearchSlugs: role.adjacent_roles.map((roleId) => {
        const relatedRole = roleById.get(roleId);
        if (!relatedRole) throw new Error(`${role.slug}: unknown adjacent role ${roleId}`);
        return relatedRole.slug;
      }),
      relatedPaths: parseRelatedPaths(sections.G, role.slug)
    });
  }

  const socialMediaResearch = mergeSocialMediaResearch(parsedSourceRoles);
  const generatedRolesBeforeRelatedPathReconciliation = [
    ...parsedSourceRoles.filter((role) => !SOCIAL_MEDIA_SOURCE_SLUGS.includes(role.researchSlug)),
    socialMediaResearch
  ];
  const canonicalResearchSlugBySourceSlug = new Map(
    generatedRolesBeforeRelatedPathReconciliation.flatMap((role) => (
      role.sourceResearchSlugs.map((sourceSlug) => [sourceSlug, role.researchSlug])
    ))
  );
  const generatedRoles = generatedRolesBeforeRelatedPathReconciliation.map((role) => ({
    ...role,
    relatedResearchSlugs: uniqueValues(role.relatedResearchSlugs.map((relatedSlug) => (
      canonicalResearchSlugBySourceSlug.get(relatedSlug) ?? relatedSlug
    ))).filter((relatedSlug) => relatedSlug !== role.researchSlug)
  }));

  if (generatedRoles.length !== 58) {
    throw new Error(`Expected 58 canonical career paths, found ${generatedRoles.length}`);
  }
  if (new Set(generatedRoles.map((role) => role.appSlug)).size !== 58) {
    throw new Error("Canonical app slug mapping contains duplicates");
  }
  if (new Set(generatedRoles.map((role) => role.cardId)).size !== 58) {
    throw new Error("Canonical career card mapping contains duplicates");
  }

  const generatedPayload = {
    schemaVersion: 2,
    researchDate: manifest.research_date,
    primaryMarket: manifest.primary_market,
    globalReferencePeriod: manifest.global_reference_period,
    sourceRoleCount: roles.length,
    roleCount: generatedRoles.length,
    roles: generatedRoles
  };
  const generatedIndex = {
    schemaVersion: 2,
    sourceRoleCount: roles.length,
    roleCount: generatedRoles.length,
    roles: generatedRoles.map((role) => ({
      roleId: role.roleId,
      researchSlug: role.researchSlug,
      sourceResearchSlugs: role.sourceResearchSlugs,
      appSlug: role.appSlug,
      cardId: role.cardId,
      categoryId: role.categoryId,
      titleFa: role.hero.titleFa,
      titleEn: role.hero.titleEn,
      relatedResearchSlugs: role.relatedResearchSlugs
    }))
  };
  const generatedChanged = await writeIfChanged(
    generatedContentPath,
    `${JSON.stringify(generatedPayload, null, 2)}\n`
  );
  await writeIfChanged(generatedIndexPath, `${JSON.stringify(generatedIndex, null, 2)}\n`);
  await writeIfChanged(
    path.join(privateResearchDirectory, "source-manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`
  );

  const reportRows = generatedRoles.map((role) => {
    const researchSlugs = role.sourceResearchSlugs.map((slug) => `\`${slug}\``).join("<br>");
    const docxPaths = role.source.documents.map((document) => `\`${document.docxPath}\``).join("<br>");
    return `| ${researchSlugs} | \`${role.appSlug}\` | \`${role.cardId}\` | ${docxPaths} |`;
  });
  const report = [
    "# Useravaa Career Research Slug Reconciliation v1",
    "",
    `- Source manifest roles: **${roles.length}**`,
    `- Mapped app career paths: **${generatedRoles.length}**`,
    "- Unmatched research roles: **0**",
    "- App paths without research: **0**",
    "- Unintended duplicate research slugs, app slugs, or card mappings: **0**",
    "- The two social-media source reports are intentionally reconciled into the single approved `social-media-marketing` canonical path.",
    "- Reconciliation keeps production/craft evidence from the content-creation report and strategy/community/performance evidence from the management report; shared fit, hardship, AI, and workflow material is deduplicated by meaning.",
    "- Both source DOCX files and their checksums remain attached to the canonical generated record for provenance.",
    "- The missing graphic and visual content design path was added as an independent career path.",
    "",
    "| Research slug | App slug | Career card | Private DOCX |",
    "|---|---|---|---|",
    ...reportRows,
    ""
  ].join("\n");
  await writeIfChanged(reconciliationReportPath, report);

  process.stdout.write([
    `Ingested ${roles.length} source reports into ${generatedRoles.length} canonical career paths.`,
    `Copied or refreshed ${copiedDocxCount} private DOCX files.`,
    `Generated product payload ${generatedChanged ? "updated" : "already current"}.`,
    "Slug problems: 0."
  ].join("\n") + "\n");
}

main().catch((error) => {
  process.stderr.write(`Career research ingestion failed: ${error.message}\n`);
  process.exitCode = 1;
});
