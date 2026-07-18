import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const skillCatalogPath = `${root}/src/features/career/data/skill-catalog.json`;
const courseCatalogPath = `${root}/src/features/career/data/career-learning-courses.json`;
const courseIndexPath = `${root}/src/features/career/data/career-learning-index.json`;
const userAgent = "Mozilla/5.0 (compatible; UseravaaCourseCatalog/1.0; +https://useravaa.com)";
const concurrency = Number.parseInt(process.env.CAREER_LEARNING_CONCURRENCY ?? "4", 10);
const requestTimeoutMs = Number.parseInt(process.env.CAREER_LEARNING_TIMEOUT_MS ?? "20000", 10);
const courseraLimitPerSkill = Number.parseInt(
  process.env.CAREER_LEARNING_COURSERA_LIMIT_PER_SKILL ?? "18",
  10
);
const telegramArchiveEnabled = process.env.CAREER_LEARNING_ARCHIVE !== "0";
const telegramArchiveMaxPages = Number.parseInt(
  process.env.CAREER_LEARNING_ARCHIVE_MAX_PAGES ?? "240",
  10
);

const providerSources = [
  {
    id: "maktabkhooneh",
    url: "https://maktabkhooneh.org/sitemap/course.xml",
    kind: "sitemap",
    include: (url) => url.includes("maktabkhooneh.org/course/")
  },
  {
    id: "faradars",
    url: "https://faradars.org/sitemap_base.xml",
    kind: "sitemap",
    include: (url) => url.includes("faradars.org/courses/")
  },
  {
    id: "hamrah-academy",
    url: "https://back.hamrah.academy/api/Sitemap/sitemap-course.xml",
    kind: "sitemap",
    include: (url) => url.includes("hamrah.academy/course/")
  },
  {
    id: "inverse",
    url: "https://inverseschool.com/sitemap.xml",
    kind: "sitemap",
    include: (url) => url.includes("inverseschool.com/course/")
  },
  {
    id: "novin-academy",
    url: "https://www.novin.com/academy/",
    kind: "html",
    include: (url) => {
      const pathname = new URL(url).pathname;
      return pathname.startsWith("/academy/")
        && pathname !== "/academy/"
        && !pathname.startsWith("/academy/page/")
        && !pathname.endsWith("/feed/")
        && !/(?:book|ebook|glossary|guide|template|terms|jobs|google-app-install-ads)/u.test(pathname);
    }
  },
  {
    id: "quera-college",
    url: "https://quera.org/sitemap_college.xml",
    kind: "sitemap",
    include: (url) => url.includes("quera.org/college/landpage/")
  },
  {
    id: "roocket",
    url: "https://roocket.ir/sitemap-courses/",
    kind: "sitemap",
    include: (url) => url.includes("roocket.ir/series/")
  },
  {
    id: "sabzlearn",
    url: "https://t.me/s/sabzlearn",
    kind: "telegram-archive",
    channel: "sabzlearn",
    include: (url) => /sabzlearn\.ir\/(?:course|product)\//u.test(url)
  },
  {
    id: "toplearn",
    url: "https://toplearn.com/sitemap-course.xml",
    kind: "sitemap",
    include: (url) => url.includes("toplearn.com/courses/")
  },
  {
    id: "bozhan-school",
    url: "https://t.me/s/bozhanschool",
    kind: "telegram-archive",
    channel: "bozhanschool",
    extractTelegramAnnouncements: true,
    include: () => false
  },
  {
    id: "pact",
    url: "https://pact.ir/",
    kind: "html",
    include: (url) => url.startsWith("https://pact.ir/course.cfm?id=")
  }
];

const courseraSitemap = "https://www.coursera.org/sitemap~www~courses.xml";
const preservedProviderIds = new Set(["maktabkhooneh", "roocket", "coursera"]);
const englishStopWords = new Set([
  "a", "an", "and", "as", "at", "by", "design", "for", "from", "in", "management",
  "of", "on", "operations", "professional", "system", "the", "to", "using", "with"
]);
const persianStopWords = new Set([
  "آموزش", "ابزار", "استفاده", "برای", "برنامه", "تخصصی", "جامع", "حرفه‌ای", "دوره",
  "سیستم", "طراحی", "عملیات", "کاربردی", "مدیریت", "مقدماتی", "نرم‌افزار"
]);

const queryOverrides = {
  "tool-r": ["r programming", "programming in r"],
  "tool-go": ["golang", "go programming"],
  "tool-csharp": ["c sharp", "csharp"],
  "tool-dax": ["dax", "data analysis expressions"],
  "tool-ga4": ["google analytics 4", "ga4"],
  "tool-gtm": ["google tag manager", "gtm"],
  "tool-burp": ["burp suite"],
  "tool-entra": ["microsoft entra", "azure active directory"],
  "tool-defender": ["microsoft defender"],
  "tool-sentinel": ["microsoft sentinel"],
  "tool-modian": ["سامانه مودیان", "صورتحساب الکترونیکی مالیاتی"],
  "tool-tax-portal": ["درگاه مالیاتی", "سامانه مالیاتی"],
  "tool-customs-portal": ["سامانه جامع تجارت", "ثبت سفارش واردات"],
  "tool-rahkaran": ["راهکاران", "همکاران سیستم"],
  "specialized-attribution": ["marketing attribution", "attribution modeling"],
  "specialized-queue-processing": ["message queue", "queue processing", "rabbitmq"],
  "specialized-growth-experimentation": ["growth experiments", "growth experimentation", "growth hacking"],
  "specialized-editorial-planning": ["editorial calendar", "content calendar", "editorial planning"],
  "specialized-paid-advertising": [
    "تبلیغات آنلاین",
    "تبلیغات اینترنتی",
    "تبلیغات کلیکی",
    "تبلیغات بنری",
    "تبلیغات در گوگل",
    "تبلیغات گوگل",
    "گوگل ادز",
    "کمپین تبلیغاتی",
    "کمپین بازاریابی دیجیتال",
    "digital advertising",
    "online advertising",
    "paid media",
    "paid search",
    "pay per click",
    "ppc advertising"
  ],
  "specialized-conversion-optimization": ["conversion rate optimization", "conversion optimization", "cro"],
  "specialized-creative-briefing": ["creative brief", "creative briefing"],
  "specialized-cohort-analysis": ["cohort analysis", "customer cohort"],
  "specialized-contact-center-operations": ["contact center", "call center operations"],
  "specialized-consultative-selling": ["consultative selling", "solution selling"],
  "specialized-trade-documentation": ["trade documentation", "international trade documents"],
  "specialized-incoterms": ["incoterms", "international commercial terms"],
  "specialized-structured-interviewing": ["structured interviewing", "structured interviews"],
  "specialized-prioritization": ["product prioritization", "feature prioritization"],
  "specialized-internal-audit": ["internal audit", "internal auditing"],
  "specialized-print-production": ["print production", "prepress"],
  "specialized-frontend-development": [
    "توسعه فرانت اند",
    "جاوا اسکریپت",
    "javascript",
    "html",
    "css",
    "frontend development",
    "front end development"
  ],
  "specialized-brand-governance": ["brand governance", "brand management"],
  "specialized-sourcing": ["talent sourcing", "recruitment sourcing"],
  "specialized-reconciliation": ["account reconciliation", "bank reconciliation"],
  "specialized-lighting": ["3d lighting", "lighting for 3d"],
  "specialized-rendering": ["3d rendering", "rendering"],
  "soft-curiosity": ["curiosity", "learning agility"],
  "soft-ownership": ["accountability", "taking ownership"],
  "tool-vue": ["vuejs", "vue js"],
  "tool-nuxt": ["nuxtjs", "nuxt js"],
  "tool-android-sdk": ["android development", "android studio", "android sdk"],
  "tool-cisco-ios": ["cisco ios", "cisco networking"],
  "tool-jira-service-management": ["jira service management", "jira service desk"],
  "tool-pgvector": ["pgvector", "vector database postgresql"],
  "tool-google-ads": [
    "گوگل ادز",
    "تبلیغات در گوگل",
    "تبلیغات گوگل",
    "google ads",
    "google adwords",
    "google advertising"
  ],
  "tool-screaming-frog": ["screaming frog", "seo site audit"],
  "tool-ahrefs": ["ahrefs", "seo competitive analysis"],
  "tool-hubspot": ["hubspot"],
  "tool-braze": ["braze", "customer engagement platform"],
  "tool-mixpanel": ["mixpanel", "product analytics"],
  "tool-zendesk": ["zendesk", "customer service platform"],
  "tool-meta-business-suite": ["meta business suite", "facebook business suite"],
  "tool-linkedin-recruiter": ["linkedin recruiter", "linkedin recruiting"],
  "tool-bamboohr": ["bamboohr", "human resources information system"],
  "tool-miro": ["miro", "online whiteboard"],
  "tool-productboard": ["productboard", "product roadmapping"],
  "tool-figjam": ["figjam", "figma whiteboard"],
  "tool-indesign": ["adobe indesign", "indesign"],
  "tool-audition": ["adobe audition", "audio editing adobe"],
  "tool-procreate": ["procreate"],
  "tool-clip-studio": ["clip studio paint"],
  "tool-substance-3d": ["adobe substance 3d", "substance painter"],
  "tool-media-encoder": ["adobe media encoder", "media encoding adobe"]
};

const manualCourseSkillIds = {
  "https://www.coursera.org/learn/cloud-computing-fundamentals-ccf": ["specialized-capacity-planning"],
  "https://www.coursera.org/learn/talent-acquisition": ["specialized-sourcing"],
  "https://www.coursera.org/learn/genai-for-compensation-benefits-and-payroll": ["specialized-payroll-processing"],
  "https://www.coursera.org/learn/site-reliability-engineering-principles": ["specialized-service-level-objectives"],
  "https://www.coursera.org/learn/advanced-marketing-analytics-funnels-and-dashboarding": ["specialized-funnel-analysis"],
  "https://www.coursera.org/learn/writing-editing-revising": ["soft-attention-to-detail"],
  "https://www.coursera.org/learn/pmp-exam-prep-gaining-business-acumen-for-project-managers": ["foundational-business-literacy"],
  "https://www.coursera.org/learn/think-like-a-leader": ["foundational-business-literacy"],
  "https://www.coursera.org/learn/packt-advanced-microservices-with-ddd-cqrs-and-event-driven-knzig": ["specialized-event-driven-architecture"],
  "https://www.coursera.org/learn/packt-event-driven-systems-security-and-microservices-0m1v3": ["specialized-event-driven-architecture"],
  "https://www.coursera.org/learn/building-interactive-user-interfaces-using-react-library": ["specialized-ui-implementation"],
  "https://www.coursera.org/learn/create-the-user-interface-android-studio": ["specialized-ui-implementation"],
  "https://www.coursera.org/learn/create-the-user-interface-with-swiftui": ["specialized-ui-implementation"],
  "https://www.coursera.org/learn/introduction-to-mobile-app-development": ["specialized-mobile-architecture"],
  "https://www.coursera.org/learn/mobile-app-notifications-databases-publishing": ["specialized-mobile-architecture", "specialized-offline-data"],
  "https://www.coursera.org/learn/packt-offline-first-apps-with-angular-ionic-pouchdb-and-couchdb-lbzo0": ["specialized-offline-data"],
  "https://www.coursera.org/learn/build-interactive-power-bi-dashboards-business-reporting": ["specialized-bi-dashboarding"],
  "https://www.coursera.org/learn/power-bi-dashboards-collaboration-optimization-lo095214": ["specialized-bi-dashboarding"],
  "https://www.coursera.org/learn/consumer-behavior-consumer-research": ["specialized-audience-research"],
  "https://www.coursera.org/learn/customer-research-with-generative-ai-for-product-managers": ["specialized-audience-research"],
  "https://www.coursera.org/learn/digital-content-planning-and-management": ["specialized-editorial-planning"],
  "https://www.coursera.org/learn/audit-seo-gaps-with-semrush-reports": ["specialized-technical-seo"],
  "https://www.coursera.org/learn/beginner-seo": ["specialized-technical-seo"],
  "https://www.coursera.org/learn/write-impactful-briefs": ["specialized-creative-briefing"],
  "https://www.coursera.org/learn/content-strategy-and-creation": ["specialized-creative-briefing", "specialized-editorial-planning"],
  "https://www.coursera.org/learn/social-media-content-and-strategy": ["specialized-social-content-production"],
  "https://www.coursera.org/learn/social-media-content-creation-with-canva": ["specialized-social-content-production"],
  "https://www.coursera.org/learn/service-operations-management": ["specialized-service-quality-monitoring"],
  "https://www.coursera.org/learn/generative-ai-in-customer-service-operations-training": ["specialized-service-quality-monitoring"],
  "https://www.coursera.org/learn/crm-analyze-apply-optimize-customer-success": ["specialized-account-health-analysis"],
  "https://www.coursera.org/learn/reports-dashboards-and-customer-success-in-salesforce": ["specialized-account-health-analysis"],
  "https://www.coursera.org/learn/business-proposal": ["specialized-proposal-writing"],
  "https://www.coursera.org/learn/effective-business-writing-lo097002": ["specialized-proposal-writing"],
  "https://www.coursera.org/learn/wiley-partnership-strategy-for-growth-the-partnership-economy": ["specialized-partnership-development"],
  "https://www.coursera.org/learn/create-win-win-partnerships": ["specialized-partnership-development"],
  "https://www.coursera.org/learn/b2b-and-territory-sales-strategies-and-techniques": ["specialized-territory-analysis"],
  "https://www.coursera.org/learn/forecasting-budgeting-territories-evaluation": ["specialized-territory-analysis"],
  "https://www.coursera.org/learn/dell-technologies-becoming-an-effective-seller": ["specialized-territory-analysis"],
  "https://www.coursera.org/learn/customer-identification-program-us": ["specialized-customer-verification"],
  "https://www.coursera.org/learn/mastering-financial-compliance-and-anti-money-laundering": ["specialized-customer-verification"],
  "https://www.coursera.org/learn/global-trade-exim-policy-fundamentals": ["specialized-trade-documentation"],
  "https://www.coursera.org/learn/master-trade-finance-international-trade-risks": ["specialized-trade-documentation"],
  "https://www.coursera.org/learn/supply-chain-planning": ["specialized-logistics-planning"],
  "https://www.coursera.org/learn/logistics-management": ["specialized-logistics-planning"],
  "https://www.coursera.org/learn/hiring-and-interviewing": ["specialized-structured-interviewing"],
  "https://www.coursera.org/learn/picking-the-right-candidate-evidence-based-selection": ["specialized-structured-interviewing", "specialized-evidence-evaluation"],
  "https://www.coursera.org/learn/audit-evidence--document-control": ["specialized-evidence-evaluation"],
  "https://www.coursera.org/learn/making-evidence-based-strategic-decisions": ["specialized-evidence-evaluation"],
  "https://www.coursera.org/learn/analyze-apply-treasury-forex-strategies": ["specialized-treasury-accounting"],
  "https://www.coursera.org/learn/banking-liquidity-risk-treasury-strategies": ["specialized-treasury-accounting"],
  "https://www.coursera.org/learn/graphic-design-theory---print-design": ["specialized-print-production"],
  "https://www.coursera.org/learn/xbox-digital-and-print-media-design": ["specialized-print-production"],
  "https://www.coursera.org/learn/vector-search-with-relational-databases-using-postgresql": ["tool-pgvector"],
  "https://www.coursera.org/learn/customer-engagement-specialist": ["tool-braze"]
};
const manuallyAssociatedUrls = new Set(Object.keys(manualCourseSkillIds));

const manualExternalCourseTemplates = [
  {
    id: "bamboohr-learning-courses",
    title: "BambooHR Learning Courses",
    provider: "bamboohr-learning",
    sourceUrl: "https://www.bamboohr.com/product-updates/bamboohr-learning-courses",
    skillIds: ["tool-bamboohr"],
    language: "انگلیسی",
    level: "مقدماتی تا پیشرفته",
    certificate: "unknown",
    priceKind: "unknown"
  },
  {
    id: "atlassian-jsm-get-started",
    title: "Get started quickly with Jira Service Management",
    provider: "atlassian-learning",
    sourceUrl: "https://community.atlassian.com/learning/hub/all-learning-paths/path/get-the-most-out-of-jira-service-management/course/get-started-quickly-with-jira-service-management",
    skillIds: ["tool-jira-service-management"],
    language: "انگلیسی",
    level: "مقدماتی",
    durationMinutes: 25,
    durationLabel: "۲۵ دقیقه",
    practice: "exercise",
    practiceLabel: "درس و تمرین در مسیر رسمی",
    certificate: "unknown",
    priceKind: "free"
  },
  {
    id: "microsoft-learn-postgresql-vector-search",
    title: "Develop AI solutions with Azure Database for PostgreSQL",
    provider: "microsoft-learn",
    sourceUrl: "https://learn.microsoft.com/en-us/training/paths/develop-ai-solutions-azure-database-postgresql/",
    skillIds: ["tool-pgvector"],
    language: "انگلیسی",
    level: "متوسط",
    practice: "exercise",
    practiceLabel: "ماژول‌های عملی",
    certificate: "unknown",
    priceKind: "free"
  },
  {
    id: "screaming-frog-seo-spider-training",
    title: "Screaming Frog SEO Spider Training",
    provider: "screaming-frog-training",
    sourceUrl: "https://www.screamingfrog.co.uk/seo-spider/training/",
    skillIds: ["specialized-technical-seo", "tool-screaming-frog"],
    language: "انگلیسی",
    level: "مقدماتی تا پیشرفته",
    practice: "exercise",
    practiceLabel: "تمرین روی خزش و ممیزی سایت",
    certificate: "unknown",
    priceKind: "unknown"
  },
  {
    id: "zendesk-foundational-support",
    title: "Zendesk Foundational Support Learning Path",
    provider: "zendesk-training",
    sourceUrl: "https://academy.zendesk.com/page/zendesk-course-catalog",
    skillIds: ["tool-zendesk"],
    language: "انگلیسی",
    level: "مقدماتی",
    durationMinutes: 165,
    durationLabel: "۲ ساعت و ۴۵ دقیقه",
    practice: "exercise",
    practiceLabel: "۳ دوره و ارزیابی پایانی",
    certificate: "available",
    priceKind: "free"
  },
  {
    id: "linkedin-recruiter-hiring-assistant",
    title: "A First Look at LinkedIn Hiring Assistant in Recruiter",
    provider: "linkedin-learning",
    sourceUrl: "https://www.linkedin.com/learning/a-first-look-at-the-linkedin-hiring-assistant-in-recruiter",
    skillIds: ["tool-linkedin-recruiter"],
    language: "انگلیسی",
    certificate: "available",
    priceKind: "regional"
  },
  {
    id: "linkedin-figjam-collaboration",
    title: "FigJam for Design Thinking and Collaboration",
    provider: "linkedin-learning",
    sourceUrl: "https://www.linkedin.com/learning/figjam-for-design-thinking-and-collaboration",
    skillIds: ["tool-figjam"],
    instructor: "Joseph Labrecque",
    language: "انگلیسی",
    level: "مقدماتی تا متوسط",
    durationMinutes: 39,
    durationLabel: "۳۹ دقیقه",
    practice: "exercise",
    practiceLabel: "فایل تمرینی",
    certificate: "available",
    priceKind: "regional"
  },
  {
    id: "linkedin-learning-print-production",
    title: "Learning Print Production",
    provider: "linkedin-learning",
    sourceUrl: "https://www.linkedin.com/learning/learning-print-production",
    skillIds: ["specialized-print-production"],
    instructor: "Claudia McCue",
    language: "انگلیسی",
    level: "مقدماتی",
    durationMinutes: 84,
    durationLabel: "۱ ساعت و ۲۴ دقیقه",
    practice: "exercise",
    practiceLabel: "فایل تمرینی و ۶ آزمون",
    certificate: "available",
    priceKind: "regional"
  },
  {
    id: "linkedin-building-focus",
    title: "Building Focus in a Distracting World",
    provider: "linkedin-learning",
    sourceUrl: "https://www.linkedin.com/learning/building-focus-in-a-distracting-world",
    skillIds: ["soft-attention-to-detail"],
    language: "انگلیسی",
    certificate: "available",
    priceKind: "regional"
  },
  {
    id: "rahkaran-quality-assurance",
    title: "دوره کنترل کیفیت نرم‌افزار راهکاران",
    provider: "mostamar-academy",
    sourceUrl: "https://mostamaracademy.ir/course/qa-rahkaran/",
    skillIds: ["tool-rahkaran"],
    instructor: "آروین طاهری",
    language: "فارسی",
    durationMinutes: 1440,
    durationLabel: "۲۴ ساعت",
    certificate: "unknown",
    priceKind: "unknown"
  },
  {
    id: "hac-modian-training",
    title: "آموزش سامانه مؤدیان مالیاتی",
    provider: "hesabdaran-khebreh",
    sourceUrl: "https://www.hac.ir/samaneh-modian-training/",
    skillIds: ["tool-modian", "tool-tax-portal"],
    language: "فارسی",
    level: "مقدماتی تا کاربردی",
    practice: "exercise",
    practiceLabel: "آموزش گام‌به‌گام ثبت و ارسال اطلاعات",
    certificate: "unknown",
    priceKind: "unknown"
  },
  {
    id: "tehran-business-school-ntsw-epl",
    title: "دوره سامانه‌های تجاری؛ جامع تجارت NTSW و گمرک EPL",
    provider: "tehran-business-school",
    sourceUrl: "https://postmba.org/ntsw/",
    skillIds: ["tool-customs-portal", "specialized-trade-documentation"],
    language: "فارسی",
    level: "کاربردی",
    certificate: "available",
    priceKind: "unknown"
  },
  {
    id: "icc-incoterms-2020-certificate",
    title: "Incoterms 2020 Certificate",
    provider: "icc-academy",
    sourceUrl: "https://academy.iccwbo.org/certifications/incoterms-2020-certificate/",
    skillIds: ["specialized-incoterms", "specialized-trade-documentation"],
    language: "انگلیسی",
    level: "تخصصی",
    certificate: "available",
    priceKind: "unknown"
  },
  {
    id: "adobe-learn-media-encoder",
    title: "Learn Adobe Media Encoder",
    provider: "adobe-learn",
    sourceUrl: "https://www.adobe.com/learn/media-encoder",
    skillIds: ["tool-media-encoder"],
    language: "انگلیسی",
    level: "مقدماتی تا پیشرفته",
    durationMinutes: 24,
    durationLabel: "حداقل ۲۴ دقیقه آموزش مرحله‌ای",
    practice: "exercise",
    practiceLabel: "آموزش‌های کوتاه عملی",
    certificate: "unknown",
    priceKind: "free"
  }
];

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/[يى]/gu, "ی")
    .replace(/ك/gu, "ک")
    .replace(/[\u200c\u200d]/gu, " ")
    .replace(/&(?:nbsp|zwnj);/giu, " ")
    .replace(/[^\p{L}\p{N}#+.]+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim()
    .toLocaleLowerCase("fa");
}

function decodeHtml(value) {
  return String(value ?? "")
    .replace(/<[^>]+>/gu, " ")
    .replace(/&nbsp;|&#160;/giu, " ")
    .replace(/&amp;/giu, "&")
    .replace(/&quot;|&#34;/giu, '"')
    .replace(/&apos;|&#39;|&#x27;/giu, "'")
    .replace(/&lt;/giu, "<")
    .replace(/&gt;/giu, ">")
    .replace(/&#(\d+);/gu, (_, value) => String.fromCodePoint(Number(value)))
    .replace(/&#x([0-9a-f]+);/giu, (_, value) => String.fromCodePoint(Number.parseInt(value, 16)))
    .replace(/\s+/gu, " ")
    .trim();
}

function normalizeDigits(value) {
  return String(value ?? "")
    .replace(/[۰-۹]/gu, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/gu, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
}

function parseNumber(value) {
  const normalized = normalizeDigits(value).replace(/[^0-9.]/gu, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function decodeUrlText(url) {
  try {
    return decodeURIComponent(new URL(url).pathname.replace(/[\/_-]+/gu, " "));
  } catch {
    return url;
  }
}

function extractSitemapUrls(xml) {
  return [...String(xml).matchAll(/<loc>(.*?)<\/loc>/gsu)]
    .map((match) => decodeHtml(match[1]));
}

function stripHtml(value) {
  return decodeHtml(String(value ?? "").replace(/<[^>]*>/gu, " "));
}

function scoreTitleHint(provider, title) {
  if (!title || title.length < 4 || title.length > 220) return -1000;
  if (/^https?:\/\//iu.test(title)) return -1000;
  if (/^(?:لینک|link|مشاهده|جزییات|جزئیات|ثبت.?نام|اطلاعات بیشتر)/iu.test(title)) return -1000;
  let score = Math.min(title.length, 80);
  if (/(?:دوره|پکیج|بسته|آموزش|کارگاه|درس)/u.test(title)) score += 100;
  if (provider === "pact" && /(?:دوره|درس|کارگاه)/u.test(title)) score += 100;
  if (/\b(?:course|training|workshop)\b/iu.test(title)) score += 60;
  return score;
}

function extractHtmlCourseTargets(html, source) {
  const targets = new Map();
  const anchors = String(html).matchAll(
    /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/giu
  );
  for (const [, href, content] of anchors) {
    let url;
    try {
      url = new URL(decodeHtml(href), source.url).href;
    } catch {
      continue;
    }
    if (!source.include(url)) continue;
    const titleHint = stripHtml(content);
    const titleScore = scoreTitleHint(source.id, titleHint);
    const current = targets.get(url);
    if (!current || titleScore > current.titleScore) {
      targets.set(url, {
        provider: source.id,
        url,
        ...(titleScore > 0 ? { titleHint } : {}),
        titleScore,
        forcePage: Boolean(source.forcePage)
      });
    }
  }
  return [...targets.values()].map((target) => {
    const cleanTarget = { ...target };
    delete cleanTarget.titleScore;
    return cleanTarget;
  });
}

function getTelegramPostIds(html, channel) {
  const pattern = new RegExp(`data-post=["']${channel}/(\\d+)["']`, "giu");
  return [...String(html).matchAll(pattern)]
    .map((match) => Number.parseInt(match[1], 10))
    .filter(Number.isFinite);
}

function getTelegramArchiveUrls(source, latestHtml) {
  const latestPostId = Math.max(0, ...getTelegramPostIds(latestHtml, source.channel));
  if (!telegramArchiveEnabled || latestPostId <= 20) return [];
  const pageCount = Math.min(
    Math.ceil((latestPostId - 20) / 20),
    telegramArchiveMaxPages
  );
  return Array.from(
    { length: pageCount },
    (_, index) => `${source.url}?before=${(index + 1) * 20 + 1}`
  );
}

function extractTelegramAnnouncementTargets(html, source) {
  const markerPattern = new RegExp(`data-post=["']${source.channel}/(\\d+)["']`, "giu");
  const markers = [...String(html).matchAll(markerPattern)];
  const targets = [];

  for (let index = 0; index < markers.length; index += 1) {
    const marker = markers[index];
    const nextMarker = markers[index + 1];
    const segment = String(html).slice(marker.index, nextMarker?.index ?? undefined);
    const messageHtml = segment.match(
      /tgme_widget_message_text[^>]*>([\s\S]*?)(?:<div class=["']tgme_widget_message_footer|<a class=["']tgme_widget_message_date)/iu
    )?.[1];
    if (!messageHtml) continue;

    const message = decodeHtml(
      messageHtml
        .replace(/<br\s*\/?\s*>/giu, "\n")
        .replace(/<\/(?:p|blockquote|div)>/giu, "\n")
    );
    if (!/(?:دوره|کارگاه|بوت[‌ -]?کمپ)/u.test(message)) continue;

    const title = message.match(
      /(?:دوره(?:ٔ|‌| )?(?:جامع |تخصصی |آموزشی )?[^،.\n]{3,90}|کارگاه[^،.\n]{3,90}|بوت[‌ -]?کمپ[^،.\n]{3,90})/u
    )?.[0]
      ?.split(/(?:⏹|⏪|◀|https?:\/\/)/u)[0]
      ?.replace(/\s+/gu, " ")
      .trim();
    if (!title || scoreTitleHint(source.id, title) <= 0) continue;

    targets.push({
      provider: source.id,
      url: `https://t.me/${source.channel}/${marker[1]}`,
      titleHint: title
    });
  }

  return targets;
}

function dedupeTargets(targets) {
  const byUrl = new Map();
  for (const target of targets) {
    let key = target.url;
    if (target.provider === "sabzlearn") {
      try {
        const url = new URL(target.url);
        key = `${url.hostname}/${url.pathname.split("/").filter(Boolean).at(-1) ?? ""}`;
      } catch {
        // Keep the original URL as the dedupe key when a third-party link is malformed.
      }
    }
    const current = byUrl.get(key);
    if (!current || scoreTitleHint(target.provider, target.titleHint) > scoreTitleHint(current.provider, current.titleHint)) {
      byUrl.set(key, target);
    }
  }
  return [...byUrl.values()];
}

async function discoverProviderTargets(source) {
  const sourceBody = await fetchText(source.url);
  if (source.kind === "sitemap") {
    return {
      targets: extractSitemapUrls(sourceBody)
        .filter(source.include)
        .map((url) => ({ provider: source.id, url })),
      archivePageCount: 0
    };
  }
  if (source.kind !== "telegram-archive") {
    return { targets: extractHtmlCourseTargets(sourceBody, source), archivePageCount: 0 };
  }

  const archiveUrls = getTelegramArchiveUrls(source, sourceBody);
  const archiveBodies = await mapWithConcurrency(archiveUrls, async (url) => {
    try {
      return await fetchText(url, 2);
    } catch (error) {
      console.error(`${source.id}: archive page failed ${url} (${error.message ?? error})`);
      return "";
    }
  });
  const bodies = [sourceBody, ...archiveBodies.filter(Boolean)];
  const targets = bodies.flatMap((body) => source.extractTelegramAnnouncements
    ? extractTelegramAnnouncementTargets(body, source)
    : extractHtmlCourseTargets(body, source));
  return { targets: dedupeTargets(targets), archivePageCount: archiveBodies.filter(Boolean).length };
}

async function fetchText(url, attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);
    try {
      const response = await fetch(url, {
        redirect: "follow",
        signal: controller.signal,
        headers: {
          accept: "text/html,application/xml;q=0.9,*/*;q=0.8",
          "user-agent": userAgent
        }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.text();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, attempt * 900));
    } finally {
      clearTimeout(timeout);
    }
  }
  throw lastError;
}

async function mapWithConcurrency(items, mapper) {
  const results = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await mapper(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}

function flattenJsonLd(value) {
  if (Array.isArray(value)) return value.flatMap(flattenJsonLd);
  if (!value || typeof value !== "object") return [];
  return [value, ...flattenJsonLd(value["@graph"] ?? [])];
}

function extractCourseSchema(html) {
  const scripts = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/giu)];
  for (const [, source] of scripts) {
    try {
      const nodes = flattenJsonLd(JSON.parse(source.trim()));
      const course = nodes.find((node) => {
        const type = node?.["@type"];
        return type === "Course" || (Array.isArray(type) && type.includes("Course"));
      });
      if (course) return course;
    } catch {
      // A malformed third-party JSON-LD block must not stop the whole catalog refresh.
    }
  }
  return undefined;
}

function isoDurationToMinutes(value) {
  const match = String(value ?? "").match(/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/u);
  if (!match) return undefined;
  const days = Number(match[1] ?? 0);
  const hours = Number(match[2] ?? 0);
  const minutes = Number(match[3] ?? 0);
  const seconds = Number(match[4] ?? 0);
  const total = days * 1440 + hours * 60 + minutes + Math.round(seconds / 60);
  return total > 0 ? total : undefined;
}

function formatDuration(minutes) {
  if (!minutes) return undefined;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (!hours) return `${remaining.toLocaleString("fa-IR")} دقیقه`;
  if (!remaining) return `${hours.toLocaleString("fa-IR")} ساعت`;
  return `${hours.toLocaleString("fa-IR")} ساعت و ${remaining.toLocaleString("fa-IR")} دقیقه`;
}

function collectInstructorNames(value) {
  const instructors = Array.isArray(value) ? value : value ? [value] : [];
  const names = instructors
    .map((instructor) => typeof instructor === "string" ? instructor : instructor?.name)
    .map(decodeHtml)
    .filter(Boolean);
  return [...new Set(names)].join("، ") || undefined;
}

function coursePrice(provider, schema, html, verifiedAt) {
  if (provider === "coursera") return { kind: "regional", verifiedAt };
  const offer = Array.isArray(schema?.offers) ? schema.offers[0] : schema?.offers;
  const schemaAmount = parseNumber(offer?.price);
  if (schema?.isAccessibleForFree === true || schemaAmount === 0) {
    return { kind: "free", verifiedAt };
  }
  if (schemaAmount) return { kind: "paid", amountToman: Math.round(schemaAmount), verifiedAt };

  if (provider === "inverse") {
    const amount = parseNumber(html.match(/data-price=["']([^"']+)["']/iu)?.[1]);
    if (amount) return { kind: "paid", amountToman: Math.round(amount), verifiedAt };
  }
  if (provider === "toplearn") {
    const block = html.match(/قیمت این دوره:\s*<span[^>]*class=["']price-amount["'][^>]*>([\s\S]*?)<\/span>/iu)?.[1];
    const label = decodeHtml(block);
    if (/رایگان/iu.test(label)) return { kind: "free", verifiedAt };
    const amount = parseNumber(label);
    if (amount) return { kind: "paid", amountToman: Math.round(amount), verifiedAt };
  }
  return { kind: "unknown", verifiedAt };
}

function inferPractice(text) {
  const normalized = normalizeText(text);
  const hasProject = /(?:project|capstone|پروژه)/u.test(normalized);
  const hasExercise = /(?:assignment|exercise|quiz|تمرین|آزمون)/u.test(normalized);
  if (hasProject && hasExercise) return { practice: "both", practiceLabel: "پروژه و تمرین" };
  if (hasProject) return { practice: "project", practiceLabel: "پروژهٔ عملی" };
  if (hasExercise) return { practice: "exercise", practiceLabel: "تمرین یا ارزیابی عملی" };
  return {};
}

function inferCertificate(text) {
  const normalized = normalizeText(text);
  if (/(?:certificate|credential|گواهی|مدرک)/u.test(normalized)) return "available";
  return undefined;
}

function normalizeLevel(value) {
  const level = decodeHtml(value);
  if (!level) return undefined;
  if (/beginner|introductory/iu.test(level)) return "مقدماتی";
  if (/intermediate/iu.test(level)) return "متوسط";
  if (/advanced/iu.test(level)) return "پیشرفته";
  return level;
}

function getSchemaDuration(schema) {
  const instance = Array.isArray(schema?.hasCourseInstance)
    ? schema.hasCourseInstance[0]
    : schema?.hasCourseInstance;
  const workload = isoDurationToMinutes(instance?.courseWorkload);
  if (workload) return workload;
  const sectionDurations = (schema?.syllabusSections ?? [])
    .map((section) => isoDurationToMinutes(section?.timeRequired))
    .filter(Boolean);
  return sectionDurations.length ? sectionDurations.reduce((sum, minutes) => sum + minutes, 0) : undefined;
}

function getSchemaInstructor(schema) {
  const instance = Array.isArray(schema?.hasCourseInstance)
    ? schema.hasCourseInstance[0]
    : schema?.hasCourseInstance;
  return collectInstructorNames(instance?.instructor ?? schema?.instructor);
}

function buildCourse(provider, url, html, fetchedAt) {
  const schema = extractCourseSchema(html);
  const openGraphTitle = decodeHtml(
    html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']*)["']/iu)?.[1]
      ?? html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+property=["']og:title["']/iu)?.[1]
  );
  const openGraphDescription = decodeHtml(
    html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']*)["']/iu)?.[1]
      ?? html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+property=["']og:description["']/iu)?.[1]
  );
  const htmlTitle = decodeHtml(html.match(/<title[^>]*>([\s\S]*?)<\/title>/iu)?.[1]);
  const inverseTitle = decodeHtml(html.match(/<h1[^>]*class=["'][^"']*main-course-title-single[^"']*["'][^>]*>([\s\S]*?)<\/h1>/iu)?.[1]);
  const title = decodeHtml(schema?.name ?? inverseTitle ?? openGraphTitle ?? htmlTitle.replace(/\s*[|\-–].*$/u, ""));
  if (!title || title === "Coursera Plus") return undefined;

  const description = decodeHtml(
    schema?.description
      ?? openGraphDescription
      ?? html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/iu)?.[1]
      ?? html.match(/<p[^>]*class=["'][^"']*single-course-subtitle-main[^"']*["'][^>]*>([\s\S]*?)<\/p>/iu)?.[1]
  );
  const schemaText = [
    description,
    ...(Array.isArray(schema?.about) ? schema.about.map((item) => typeof item === "string" ? item : item?.name) : []),
    ...(Array.isArray(schema?.teaches) ? schema.teaches : []),
    ...(Array.isArray(schema?.syllabusSections) ? schema.syllabusSections.flatMap((section) => [section?.name, section?.description]) : [])
  ].filter(Boolean).join(" ");

  let durationMinutes = getSchemaDuration(schema);
  if (!durationMinutes && provider === "inverse") {
    const hours = parseNumber(html.match(/<h5[^>]*class=["'][^"']*pro-title[^"']*["'][^>]*>\s*([\d۰-۹٠-٩.]+)\s*ساعت/iu)?.[1]);
    if (hours) durationMinutes = Math.round(hours * 60);
  }
  if (!durationMinutes && provider === "toplearn") {
    const duration = normalizeDigits(html.match(/مدت زمان دوره\s*:\s*<span>([^<]+)<\/span>/iu)?.[1]);
    const parts = duration?.match(/(\d+):(\d+):(\d+)/u);
    if (parts) durationMinutes = Number(parts[1]) * 60 + Number(parts[2]) + Math.round(Number(parts[3]) / 60);
  }

  let instructor = getSchemaInstructor(schema);
  if (!instructor && provider === "inverse") {
    instructor = decodeHtml(html.match(/<span[^>]*class=["']main-content-details["'][^>]*>([\s\S]*?)<\/span>/iu)?.[1]);
  }
  if (!instructor && provider === "toplearn") {
    instructor = decodeHtml(html.match(/مدرس دوره\s*:\s*<span>([^<]+)<\/span>/iu)?.[1]);
  }

  const rating = parseNumber(schema?.aggregateRating?.ratingValue);
  const ratingCount = parseNumber(schema?.aggregateRating?.ratingCount ?? schema?.aggregateRating?.reviewCount);
  const practice = inferPractice(schemaText);
  const certificate = inferCertificate(`${schemaText} ${JSON.stringify(schema?.educationalCredentialAwarded ?? "")}`);
  const languageCode = Array.isArray(schema?.inLanguage) ? schema.inLanguage[0] : schema?.inLanguage;
  const language = provider === "coursera"
    ? languageCode?.startsWith?.("fa") ? "فارسی" : "انگلیسی"
    : "فارسی";
  const id = `${provider}-${createHash("sha1").update(url).digest("hex").slice(0, 12)}`;

  return {
    id,
    title,
    provider,
    sourceUrl: url,
    skillIds: [],
    ...(instructor ? { instructor } : {}),
    ...(language ? { language } : {}),
    ...(normalizeLevel(schema?.educationalLevel) ? { level: normalizeLevel(schema.educationalLevel) } : {}),
    ...(durationMinutes ? { durationMinutes, durationLabel: formatDuration(durationMinutes) } : {}),
    ...practice,
    ...(certificate ? { certificate } : {}),
    ...(rating && rating >= 0 && rating <= 5 ? { rating } : {}),
    ...(ratingCount ? { ratingCount: Math.round(ratingCount) } : {}),
    price: coursePrice(provider, schema, html, fetchedAt),
    metadataStatus: "page",
    _matchText: `${title} ${description} ${schemaText}`.trim()
  };
}

function titleFromSitemapUrl(url) {
  let segment;
  try {
    const parts = new URL(url).pathname.split("/").filter(Boolean);
    segment = decodeURIComponent(parts.at(-1) ?? "");
  } catch {
    return undefined;
  }
  const title = decodeHtml(segment)
    .replace(/[-_]+/gu, " ")
    .replace(/\b(?:mk\d+|fv[a-z0-9]+|fs[a-z0-9]+)\b/giu, "")
    .replace(/\b[a-z0-9]{5}\b$/giu, "")
    .replace(/\s+/gu, " ")
    .trim();
  if (title.length < 3 || /^\d+$/u.test(title)) return undefined;
  return title.replace(/\b[a-z]/gu, (letter) => letter.toUpperCase());
}

function buildSitemapCourse(provider, url, fetchedAt, titleHint) {
  const title = titleHint || titleFromSitemapUrl(url);
  if (!title) return undefined;
  return {
    id: `${provider}-${createHash("sha1").update(url).digest("hex").slice(0, 12)}`,
    title,
    provider,
    sourceUrl: url,
    skillIds: [],
    language: provider === "coursera" ? "انگلیسی" : "فارسی",
    price: { kind: provider === "coursera" ? "regional" : "unknown", verifiedAt: fetchedAt },
    metadataStatus: "sitemap",
    _matchText: `${title} ${decodeUrlText(url)}`
  };
}

function phrasesForSkill(skill) {
  const values = [
    skill.titleFa,
    skill.titleEn,
    ...(skill.aliasesFa ?? []),
    ...(skill.aliasesEn ?? []),
    ...(skill.searchTerms ?? []).filter((term) => normalizeText(term).includes(" ")),
    ...(queryOverrides[skill.id] ?? [])
  ];
  return [...new Set(values.map(normalizeText).filter(Boolean))];
}

function meaningfulTokens(value) {
  return normalizeText(value).split(" ").filter((token) => {
    if (token.length < 2) return false;
    if (/^[a-z]/u.test(token)) return !englishStopWords.has(token);
    return !persianStopWords.has(token);
  });
}

function includesPhrase(haystack, phrase) {
  if (phrase.length <= 2) {
    return haystack.split(" ").includes(phrase);
  }
  return (` ${haystack} `).includes(` ${phrase} `);
}

function scoreSkillMatch(skill, titleText, detailText = "") {
  const title = normalizeText(titleText);
  const details = normalizeText(detailText);
  if (skill.id === "tool-java" && /(?:java\s*script|جاوا اسکریپت)/u.test(`${title} ${details}`)) {
    return 0;
  }
  let best = 0;
  for (const phrase of phrasesForSkill(skill)) {
    const tokens = meaningfulTokens(phrase);
    if (includesPhrase(title, phrase)) best = Math.max(best, 150 + Math.min(30, phrase.length));
    else if (phrase.length >= 4 && includesPhrase(details, phrase)) best = Math.max(best, 92 + Math.min(20, phrase.length));
    if (tokens.length) {
      const titleHits = tokens.filter((token) => title.split(" ").includes(token)).length;
      if (titleHits === tokens.length) best = Math.max(best, 118 + tokens.length * 4);
      else if (tokens.length >= 2 && titleHits / tokens.length >= 0.75) best = Math.max(best, 90 + titleHits * 4);
    }
  }
  return best;
}

function selectCourseraCandidates(urls, skills) {
  const selected = new Map();
  const associations = new Map();
  for (const skill of skills) {
    const ranked = urls
      .map((url) => ({ url, score: scoreSkillMatch(skill, decodeUrlText(url)) }))
      .filter((item) => item.score >= 90)
      .sort((left, right) => right.score - left.score || left.url.localeCompare(right.url))
      .slice(0, courseraLimitPerSkill);
    for (const item of ranked) {
      selected.set(item.url, item);
      const skillIds = associations.get(item.url) ?? new Set();
      skillIds.add(skill.id);
      associations.set(item.url, skillIds);
    }
  }
  const availableUrls = new Set(urls);
  for (const [url, skillIds] of Object.entries(manualCourseSkillIds)) {
    if (!url.includes("coursera.org/learn/") || !availableUrls.has(url)) continue;
    selected.set(url, { url, score: 1000 });
    associations.set(url, new Set([...(associations.get(url) ?? []), ...skillIds]));
  }
  return { urls: [...selected.keys()], associations };
}

function rankCourseForSkill(course, skill) {
  const score = scoreSkillMatch(skill, course.title, course._matchText);
  const languageBonus = course.language === "فارسی" ? 12 : 0;
  const ratingBonus = course.rating ? course.rating * 2 : 0;
  return score + languageBonus + ratingBonus;
}

function assignSkills(courses, skills, courseraAssociations, seedSkillIdsByUrl) {
  for (const course of courses) {
    const preserved = seedSkillIdsByUrl.get(course.sourceUrl) ?? [];
    const courseraCandidates = [...(courseraAssociations.get(course.sourceUrl) ?? [])];
    const ranked = skills
      .map((skill) => ({ skill, score: rankCourseForSkill(course, skill) }))
      .filter((item) => item.score >= 92)
      .sort((left, right) => right.score - left.score || left.skill.id.localeCompare(right.skill.id));
    course.skillIds = [...new Set([
      ...preserved,
      ...courseraCandidates,
      ...ranked.slice(0, 12).map((item) => item.skill.id)
    ])];
  }
}

function cleanCourse(course) {
  const clean = { ...course };
  delete clean._matchText;
  delete clean.selectionNote;
  return clean;
}

function mergeCourses(parsedCourses, seedCourses) {
  const byUrl = new Map();
  for (const course of parsedCourses) byUrl.set(course.sourceUrl, course);
  for (const seed of seedCourses) {
    const current = byUrl.get(seed.sourceUrl);
    byUrl.set(seed.sourceUrl, current
      ? {
          ...current,
          ...seed,
          skillIds: [...new Set([...(current.skillIds ?? []), ...(seed.skillIds ?? [])])],
          price: current.price?.kind !== "unknown" ? current.price : seed.price,
          _matchText: `${current._matchText ?? ""} ${seed.title ?? ""} ${seed.selectionNote ?? ""}`
        }
      : { ...seed, _matchText: `${seed.title ?? ""} ${seed.selectionNote ?? ""}` });
  }
  return [...byUrl.values()];
}

function buildManualExternalCourses(generatedAt) {
  return manualExternalCourseTemplates.map(({ priceKind, ...course }) => ({
    ...course,
    price: { kind: priceKind, verifiedAt: generatedAt },
    metadataStatus: "manually-verified",
    _matchText: course.title
  }));
}

function buildIndex(courses, skills, generatedAt, sources) {
  const skillsIndex = Object.fromEntries(skills.map((skill) => {
    const matches = courses.filter((course) => course.skillIds.includes(skill.id));
    return [skill.id, {
      courseCount: matches.length,
      providerCount: new Set(matches.map((course) => course.provider)).size
    }];
  }));
  return {
    schemaVersion: 1,
    generatedAt,
    totalCourseCount: courses.length,
    providerCount: new Set(courses.map((course) => course.provider)).size,
    sources,
    skills: skillsIndex
  };
}

async function main() {
  const generatedAt = new Date().toISOString();
  const skillCatalog = JSON.parse(await readFile(skillCatalogPath, "utf8"));
  const previousCatalog = JSON.parse(await readFile(courseCatalogPath, "utf8"));
  const skills = skillCatalog.items.filter((skill) => skill.isSelectable);
  const seedCourses = previousCatalog.courses.filter((course) => {
    if (!preservedProviderIds.has(course.provider)) return false;
    return !new RegExp(`^${course.provider}-[0-9a-f]{12}$`, "u").test(course.id);
  });
  const seedSkillIdsByUrl = new Map(seedCourses.map((course) => [course.sourceUrl, course.skillIds]));
  const cachedCoursesByUrl = new Map(previousCatalog.courses.map((course) => [course.sourceUrl, course]));
  const useFastSitemapFallback = process.env.CAREER_LEARNING_FAST === "1";
  const sourceReports = [];
  const crawlTargets = [];

  for (const source of providerSources) {
    try {
      const { targets, archivePageCount } = await discoverProviderTargets(source);
      sourceReports.push({
        provider: source.id,
        status: "ok",
        discoveredUrlCount: targets.length,
        ...(archivePageCount ? { archivePageCount } : {})
      });
      crawlTargets.push(...targets);
      console.log(`${source.id}: ${targets.length} course URLs${archivePageCount ? ` from ${archivePageCount} archive pages` : ""}`);
    } catch (error) {
      sourceReports.push({ provider: source.id, status: "failed", discoveredUrlCount: 0, error: String(error.message ?? error) });
      console.error(`${source.id}: catalog discovery failed (${error.message ?? error})`);
    }
  }

  const courseraXml = await fetchText(courseraSitemap);
  const courseraUrls = extractSitemapUrls(courseraXml).filter((url) => url.includes("coursera.org/learn/"));
  const courseraSelection = selectCourseraCandidates(courseraUrls, skills);
  sourceReports.push({
    provider: "coursera",
    status: "ok",
    discoveredUrlCount: courseraUrls.length,
    selectedUrlCount: courseraSelection.urls.length
  });
  crawlTargets.push(...courseraSelection.urls.map((url) => ({ provider: "coursera", url })));
  console.log(`coursera: ${courseraUrls.length} URLs, ${courseraSelection.urls.length} strong candidates`);

  let completed = 0;
  let failed = 0;
  const parsed = await mapWithConcurrency(crawlTargets, async (target) => {
    try {
      const cached = cachedCoursesByUrl.get(target.url);
      const shouldRefreshManualMetadata = manuallyAssociatedUrls.has(target.url)
        && cached?.metadataStatus === "sitemap";
      if (cached && !shouldRefreshManualMetadata) {
        const title = target.titleHint
          ?? (/^https?:\/\//iu.test(cached.title) ? titleFromSitemapUrl(target.url) : cached.title);
        return {
          ...cached,
          ...(title ? { title } : {}),
          skillIds: [],
          _matchText: `${title ?? cached.title} ${decodeUrlText(target.url)}`
        };
      }
      if (useFastSitemapFallback && !shouldRefreshManualMetadata && !target.forcePage) {
        return buildSitemapCourse(target.provider, target.url, generatedAt, target.titleHint);
      }
      const html = await fetchText(target.url, useFastSitemapFallback ? 1 : 3);
      const course = buildCourse(target.provider, target.url, html, generatedAt)
        ?? buildSitemapCourse(target.provider, target.url, generatedAt, target.titleHint);
      if (!course) throw new Error("course identity not found");
      return course;
    } catch (error) {
      failed += 1;
      if (failed <= 25) console.error(`failed ${target.url}: ${error.message ?? error}`);
      return useFastSitemapFallback
        ? buildSitemapCourse(target.provider, target.url, generatedAt, target.titleHint)
        : undefined;
    } finally {
      completed += 1;
      if (completed % 100 === 0 || completed === crawlTargets.length) {
        console.log(`processed ${completed}/${crawlTargets.length}`);
      }
    }
  });

  const parsedCourses = parsed.filter(Boolean);
  const manualSkillIdsByUrl = new Map(Object.entries(manualCourseSkillIds));
  assignSkills(
    parsedCourses,
    skills,
    courseraSelection.associations,
    new Map([...seedSkillIdsByUrl, ...manualSkillIdsByUrl])
  );
  const merged = mergeCourses(
    [...parsedCourses, ...buildManualExternalCourses(generatedAt)],
    seedCourses
  )
    .filter((course) => course.skillIds?.length)
    .sort((left, right) => left.provider.localeCompare(right.provider) || left.title.localeCompare(right.title, "fa"));
  const cleanCourses = merged.map(cleanCourse);
  const index = buildIndex(cleanCourses, skills, generatedAt, sourceReports);
  const uncoveredSkills = skills.filter((skill) => !index.skills[skill.id]?.courseCount);

  const catalog = {
    schemaVersion: 2,
    generatedAt,
    sourceCourseCount: parsedCourses.length,
    failedPageCount: failed,
    courses: cleanCourses
  };
  await writeFile(courseCatalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
  await writeFile(courseIndexPath, `${JSON.stringify(index, null, 2)}\n`);

  console.log(`wrote ${cleanCourses.length} matched courses across ${index.providerCount} providers`);
  console.log(`covered ${skills.length - uncoveredSkills.length}/${skills.length} skills`);
  if (uncoveredSkills.length) {
    console.log("uncovered skills:");
    for (const skill of uncoveredSkills) console.log(`- ${skill.id}\t${skill.titleFa}\t${skill.titleEn}`);
  }
}

await main();
