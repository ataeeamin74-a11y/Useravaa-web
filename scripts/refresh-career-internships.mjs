import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_OUTPUT_PATH = resolve(
  REPO_ROOT,
  "src/features/career/data/career-internships.json"
);
const CAREER_INDEX_PATH = resolve(
  REPO_ROOT,
  "src/features/career/data/career-research-index.json"
);
const MAX_AGE_DAYS = 45;
const DAY_MS = 24 * 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 20_000;
const USER_AGENT = "UseravaaCareerBot/1.0 (+https://useravaa.com/career/internships; refresh every 72h)";

const JOBVISION_CATEGORIES = [
  ["developer", []],
  ["software-qa", ["qa-automation-sdet"]],
  ["network", ["network-administration-and-infrastructure"]],
  ["data-science", ["analytics-and-business-insights"]],
  ["digital-marketing", ["digital-marketing"]],
  ["content", ["content-and-copywriting"]],
  ["graphics", ["graphic-design-and-visual-content"]],
  ["ui-ux", ["ui-ux"]],
  ["product-manager", ["product-management-and-ownership"]],
  ["business-development", ["business-development"]],
  ["accounting", ["career-path-1gt2jj"]],
  ["human-resources", ["hr-operations-and-personnel-administration"]],
  ["research", ["market-research-and-insights"]],
  ["public-relations", ["brand-pr-and-communications"]],
  ["sales", ["b2b-corporate-sales"]]
];

const EXTRA_ALIASES = {
  "dotnet-c-sharp-backend": [".net", "asp.net", "c#", "سی شارپ", "دات نت"],
  "go-backend": ["golang", "برنامه نویس go", "توسعه دهنده go"],
  "java-jvm-backend": ["java", "spring boot", "جاوا"],
  "node-js-typescript-backend": ["node.js", "nodejs", "nestjs", "node js", "بک اند نود"],
  "php-laravel-backend": ["php", "laravel", "لاراول"],
  "python-django-backend": ["django", "بک اند پایتون", "python backend"],
  "angular-frontend": ["angular", "انگولار"],
  "react-next-js-frontend": ["react", "next.js", "nextjs", "ری اکت", "فرانت اند ری اکت"],
  "vue-nuxt-frontend": ["vue", "nuxt", "ویو جی اس"],
  "full-stack-dotnet-blazor": ["blazor", "فول استک .net", "full stack .net"],
  "full-stack-node-js-mern": ["mern", "full stack node", "فول استک node", "فول استک نود"],
  "android-native-kotlin": ["android", "kotlin", "اندروید", "کاتلین"],
  "kubernetes-platform-engineering": ["kubernetes", "platform engineer", "کوبرنتیز"],
  "sre-reliability-engineering": ["site reliability", "sre", "مهندس دواپس", "devops"],
  "offensive-security-penetration-testing": ["penetration test", "penetration testing", "تست نفوذ", "آزمون نفوذ"],
  "soc-security-monitoring-and-incident-response": ["soc analyst", "کارشناس soc", "پایش امنیت", "security analyst"],
  "it-support-helpdesk": ["helpdesk", "help desk", "پشتیبانی it", "پشتیبان فناوری اطلاعات", "پشتیبانی فنی نرم افزار", "کارآموز کامپیوتر"],
  "network-administration-and-infrastructure": ["network administrator", "کارشناس شبکه", "مدیر شبکه", "زیرساخت شبکه"],
  "windows-microsoft-infrastructure": ["windows server", "microsoft infrastructure", "اکتیو دایرکتوری", "active directory"],
  "qa-automation-sdet": ["qa", "quality assurance", "تست نرم افزار", "اتوماسیون تست", "software tester"],
  "analytics-and-business-insights": ["data analyst", "business analyst", "تحلیلگر داده", "تحلیل داده"],
  "data-engineering-and-platform": ["data engineer", "مهندس داده", "etl developer", "etl"],
  "llm-genai": ["machine learning", "هوش مصنوعی", "یادگیری ماشین", "generative ai", "llm"],
  "bi-dashboarding-and-reporting": ["business intelligence", "power bi", "هوش تجاری", "داشبورد"],
  "growth-marketing": ["growth marketing", "growth marketer", "بازاریابی رشد", "کارشناس رشد"],
  "content-and-copywriting": ["content", "copywriter", "copywriting", "تولید محتوا", "محتوا", "کپی رایتر"],
  "market-research-and-insights": ["market research", "تحقیقات بازار", "تحقیق بازار", "بینش بازار"],
  "digital-marketing": ["digital marketing", "دیجیتال مارکتینگ"],
  "seo": ["seo", "سئو"],
  "brand-pr-and-communications": ["public relations", "روابط عمومی", "برندینگ", "brand strategist", "مدیر برند"],
  "marketing-generalist-and-strategy": ["marketing specialist", "کارشناس بازاریابی", "استراتژی بازاریابی"],
  "performance-marketing": ["performance marketing", "پرفورمنس مارکتینگ", "تبلیغات آنلاین", "تبلیغات کلیکی"],
  "crm-operations": ["crm specialist", "کارشناس crm", "عملیات crm"],
  "crm-and-retention-operations": ["retention", "customer retention", "نگهداشت مشتری", "وفاداری مشتری"],
  "contact-center-operations": ["call center", "contact center", "مرکز تماس", "کال سنتر"],
  "account-management": ["account manager", "مدیر حساب", "اکانت منیجر"],
  "b2b-corporate-sales": ["b2b sales", "فروش سازمانی", "فروش b2b", "کارشناس فروش"],
  "business-development": ["business development", "توسعه کسب و کار", "توسعه کسب‌وکار"],
  "commercial-trading-operations": ["بازرگانی", "commercial specialist", "کارشناس تجاری", "تجارت بین الملل"],
  "market-development-merchant-acquisition": ["توسعه بازار", "جذب پذیرنده", "merchant acquisition"],
  "talent-acquisition": ["recruiter", "recruitment", "جذب و استخدام", "کارشناس استخدام"],
  "hr-management": ["hr manager", "مدیر منابع انسانی", "human resources manager"],
  "hr-operations-and-personnel-administration": ["hr specialist", "کارشناس منابع انسانی", "کارگزینی", "امور پرسنلی"],
  "ui-ux": ["ui/ux", "ui ux", "product designer", "ux designer", "طراح محصول", "طراح رابط کاربری", "تجربه کاربری"],
  "product-management-and-ownership": ["product manager", "product owner", "مدیر محصول", "مالک محصول"],
  "logistics-operations": ["logistics", "لجستیک", "زنجیره تامین", "انبار و لجستیک"],
  "career-path-1drths": ["internal audit", "حسابرسی داخلی", "حسابرس داخلی"],
  "career-path-fmhiml": ["payroll", "حقوق و دستمزد"],
  "career-path-1bed9m": ["treasury", "خزانه داری", "حسابدار خزانه"],
  "career-path-1b5cj3": ["tax accountant", "حسابدار مالیاتی", "حسابداری مالیاتی", "امور مالیاتی"],
  "career-path-1gt2jj": ["finance manager", "accounting manager", "مدیر مالی", "مدیر حسابداری", "حسابداری"],
  "graphic-design-and-visual-content": ["graphic designer", "graphic design", "طراح گرافیک", "گرافیست"],
  "career-path-1w9y14": ["video editor", "تدوینگر", "تدوین", "تدوین ویدیو", "تولید ویدیو"],
  "career-path-1u9xrl": ["illustrator", "تصویرگر", "digital artist", "نقاش دیجیتال"],
  "3d-art": ["3d artist", "3d designer", "طراح سه بعدی", "مدل ساز سه بعدی"],
  "career-path-1lo6cj": ["motion graphic", "motion designer", "موشن گرافیک", "انیماتور"],
  "career-path-1rtxp8": ["visual identity", "brand designer", "هویت بصری", "طراح برند"],
  "social-media-marketing": ["social media", "اینستاگرام", "شبکه های اجتماعی", "شبکه‌های اجتماعی", "ادمین شبکه", "ادمین محتوا"]
};

function parseCliArguments(argv) {
  const outputIndex = argv.indexOf("--output");
  const outputPath = outputIndex >= 0 ? argv[outputIndex + 1] : process.env.USERAVAA_CAREER_INTERNSHIPS_PATH;
  return { outputPath: outputPath ? resolve(outputPath) : DEFAULT_OUTPUT_PATH };
}

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[يى]/gu, "ی")
    .replace(/ك/gu, "ک")
    .replace(/[\u200c\u200f\u202a-\u202e]/gu, " ")
    .replace(/[^\p{L}\p{N}.+#]+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

function decodeHtml(value) {
  return String(value ?? "")
    .replace(/&zwnj;/giu, "‌")
    .replace(/&nbsp;/giu, " ")
    .replace(/&amp;/giu, "&")
    .replace(/&quot;/giu, '"')
    .replace(/&#39;|&apos;/giu, "'")
    .replace(/&#x([0-9a-f]+);/giu, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#([0-9]+);/gu, (_, code) => String.fromCodePoint(Number.parseInt(code, 10)));
}

function cleanHtmlText(value) {
  return decodeHtml(String(value ?? "").replace(/<[^>]*>/gu, " "))
    .replace(/\s+/gu, " ")
    .trim();
}

function toEnglishDigits(value) {
  return String(value).replace(/[۰-۹]/gu, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)));
}

function relativePersianDateToIso(value, now) {
  const normalized = toEnglishDigits(cleanHtmlText(value));
  if (/امروز|لحظه|ساعت|دقیقه/u.test(normalized)) return now.toISOString();
  if (/دیروز/u.test(normalized)) return new Date(now.getTime() - DAY_MS).toISOString();
  const dayMatch = normalized.match(/(\d+)\s*روز/u);
  if (!dayMatch) return undefined;
  return new Date(now.getTime() - Number(dayMatch[1]) * DAY_MS).toISOString();
}

function isRecent(publishedAt, now) {
  const timestamp = Date.parse(publishedAt);
  return Number.isFinite(timestamp)
    && timestamp <= now.getTime() + DAY_MS
    && now.getTime() - timestamp <= MAX_AGE_DAYS * DAY_MS;
}

function buildRules(index) {
  return index.roles.map((role) => ({
    slug: role.appSlug,
    aliases: [...new Set([
      role.titleFa,
      role.titleEn,
      ...(EXTRA_ALIASES[role.appSlug] ?? [])
    ].map(normalizeText).filter((alias) => alias.length >= 3))]
  }));
}

export function matchCareerPathSlugs(title, rules, fallbackSlugs = []) {
  const normalizedTitle = normalizeText(title);
  const matches = [];

  for (const rule of rules) {
    const strongestAlias = rule.aliases
      .filter((alias) => normalizedTitle.includes(alias))
      .sort((left, right) => right.length - left.length)[0];
    if (strongestAlias) matches.push({ slug: rule.slug, strength: strongestAlias.length });
  }

  const slugs = matches
    .sort((left, right) => right.strength - left.strength)
    .map((match) => match.slug);
  return [...new Set(slugs.length ? slugs : fallbackSlugs)].slice(0, 3);
}

function cleanJobinjaUrl(value) {
  const url = new URL(decodeHtml(value));
  url.search = "";
  return url.toString();
}

function getJobinjaLocation(value) {
  const location = cleanHtmlText(value) || "ایران";
  if (location === "دورکاری") return { location, isRemote: true };

  const [province, ...cityParts] = location
    .split(/[،,]/u)
    .map((part) => cleanHtmlText(part))
    .filter(Boolean);
  const city = cityParts.join("، ");
  return {
    location,
    ...(province && province !== "ایران" ? { province } : {}),
    ...(city ? { city } : {})
  };
}

export function parseJobinjaPage(html, { now = new Date(), rules = [], fallbackSlugs = [] } = {}) {
  const anchors = [...String(html).matchAll(
    /<a\s+class="c-jobListView__titleLink"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/giu
  )];

  return anchors.flatMap((anchor, index) => {
    const sourceUrl = cleanJobinjaUrl(anchor[1]);
    const title = cleanHtmlText(anchor[2]);
    const segment = String(html).slice(anchor.index, anchors[index + 1]?.index ?? String(html).length);
    const passedDays = segment.match(/c-jobListView__passedDays[^>]*>([\s\S]*?)<\/span>/iu)?.[1];
    const publishedAt = relativePersianDateToIso(passedDays, now);
    if (!publishedAt || !isRecent(publishedAt, now)) return [];

    const meta = [...segment.matchAll(
      /c-jobListView__metaItem[^>]*>[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>/giu
    )].map((match) => cleanHtmlText(match[1]));
    const id = sourceUrl.match(/\/jobs\/([^/]+)\//u)?.[1];
    const pathSlugs = matchCareerPathSlugs(title, rules, fallbackSlugs);
    if (!id || !title || !meta[0] || !pathSlugs.length) return [];
    const location = getJobinjaLocation(meta[1]);

    return [{
      id: `jobinja:${id}`,
      source: "jobinja",
      sourceUrl,
      title,
      company: meta[0],
      ...location,
      publishedAt,
      pathSlugs
    }];
  });
}

function jobvisionUrl(id, title) {
  const slug = `استخدام-${title}`.replace(/\s+/gu, "-");
  return `https://jobvision.ir/jobs/${id}/${encodeURIComponent(slug).replace(/%2F/giu, "-")}`;
}

export function parseJobvisionResponse(value, { now = new Date(), rules = [], fallbackSlugs = [] } = {}) {
  const posts = value?.data?.jobPosts;
  if (!value?.isSuccess || !Array.isArray(posts)) return [];

  return posts.flatMap((post) => {
    const publishedAt = post?.firstActivationTime?.date;
    const title = cleanHtmlText(post?.title);
    if (!title || !isRecent(publishedAt, now) || !post?.properties?.isInternship) return [];

    const pathSlugs = matchCareerPathSlugs(title, rules, fallbackSlugs);
    if (!pathSlugs.length) return [];
    const city = cleanHtmlText(post?.location?.city?.titleFa);
    const province = cleanHtmlText(post?.location?.province?.titleFa);
    const location = post?.properties?.isRemote
      ? "دورکاری"
      : [province, city].filter((item, itemIndex, items) => item && items.indexOf(item) === itemIndex).join("، ") || "ایران";

    return [{
      id: `jobvision:${post.id}`,
      source: "jobvision",
      sourceUrl: jobvisionUrl(post.id, title),
      title,
      company: cleanHtmlText(post?.company?.nameFa || post?.company?.nameEn) || "شرکت ثبت‌شده در جاب‌ویژن",
      location,
      ...(province ? { province } : {}),
      ...(city ? { city } : {}),
      ...(post?.properties?.isRemote ? { isRemote: true } : {}),
      publishedAt: new Date(publishedAt).toISOString(),
      ...(post?.expireTime?.date ? { expiresAt: new Date(post.expireTime.date).toISOString() } : {}),
      ...(post?.salary?.titleFa ? { salary: cleanHtmlText(post.salary.titleFa) } : {}),
      ...(post?.workType?.titleFa ? { workType: cleanHtmlText(post.workType.titleFa) } : {}),
      pathSlugs
    }];
  });
}

async function fetchText(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      ...options,
      headers: { "user-agent": USER_AGENT, ...options.headers },
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchJson(url, options = {}) {
  return JSON.parse(await fetchText(url, options));
}

async function mapWithConcurrency(items, concurrency, worker) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function run() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await worker(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, run));
  return results;
}

async function collectJobvision(now, rules, problems) {
  const endpoint = "https://candidateapi.jobvision.ir/api/v1/JobPost/List";
  const groups = await mapWithConcurrency(JOBVISION_CATEGORIES, 3, async ([category, fallbackSlugs]) => {
    try {
      const value = await fetchJson(endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "https://jobvision.ir",
          referer: `https://jobvision.ir/jobs/category/${category}/type/internship`
        },
        body: JSON.stringify({
          jobCategoryUrlTitle: category,
          keyword: null,
          companyId: null,
          salaryRanges: [],
          workTypes: [],
          workExperiences: [],
          seniorityLevels: [],
          industries: [],
          locationWrapper: null,
          isRemote: false,
          isInternship: true,
          suitableForDisabled: false,
          militaryServiceBenefit: false,
          jobBenefits: [],
          searchTimeRange: null,
          requestedPage: 1,
          sortBy: 0
        })
      });
      return parseJobvisionResponse(value, { now, rules, fallbackSlugs });
    } catch (error) {
      problems.push(`jobvision:${category}: ${error instanceof Error ? error.message : "unknown error"}`);
      return [];
    }
  });
  return groups.flat();
}

async function collectJobinja(now, rules, problems) {
  const pageNumbers = Array.from({ length: 6 }, (_, index) => index + 1);
  const groups = await mapWithConcurrency(pageNumbers, 2, async (page) => {
    try {
      const url = new URL("https://jobinja.ir/jobs");
      url.searchParams.set("filters[internship]", "1");
      if (page > 1) url.searchParams.set("page", String(page));
      const html = await fetchText(url);
      return parseJobinjaPage(html, { now, rules });
    } catch (error) {
      problems.push(`jobinja:page-${page}: ${error instanceof Error ? error.message : "unknown error"}`);
      return [];
    }
  });
  return groups.flat();
}

function dedupeAndSort(items) {
  return [...new Map(items.map((item) => [item.id, item])).values()]
    .sort((left, right) => Date.parse(right.publishedAt) - Date.parse(left.publishedAt));
}

async function writeAtomically(outputPath, value) {
  await mkdir(dirname(outputPath), { recursive: true });
  const temporaryPath = `${outputPath}.${process.pid}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(value)}\n`, "utf8");
  await rename(temporaryPath, outputPath);
}

export async function refreshCareerInternships({ outputPath = DEFAULT_OUTPUT_PATH, now = new Date() } = {}) {
  const index = JSON.parse(await readFile(CAREER_INDEX_PATH, "utf8"));
  if (!Array.isArray(index.roles) || index.roles.length !== 58) {
    throw new Error("career research index must contain 58 canonical roles");
  }

  const rules = buildRules(index);
  const problems = [];
  const [jobvisionItems, jobinjaItems] = await Promise.all([
    collectJobvision(now, rules, problems),
    collectJobinja(now, rules, problems)
  ]);
  const items = dedupeAndSort([...jobvisionItems, ...jobinjaItems]);
  if (!items.length) throw new Error(`no internships collected; ${problems.join(" | ")}`);

  const feed = {
    schemaVersion: 1,
    updatedAt: now.toISOString(),
    refreshEveryHours: 72,
    maxAgeDays: MAX_AGE_DAYS,
    canonicalPathCount: index.roles.length,
    sourceCounts: {
      jobinja: items.filter((item) => item.source === "jobinja").length,
      jobvision: items.filter((item) => item.source === "jobvision").length
    },
    items
  };
  await writeAtomically(outputPath, feed);
  return { feed, problems, outputPath };
}

const isMainModule = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMainModule) {
  const { outputPath } = parseCliArguments(process.argv.slice(2));
  refreshCareerInternships({ outputPath })
    .then(({ feed, problems }) => {
      console.log(`Updated ${feed.items.length} fresh internships (${feed.sourceCounts.jobinja} Jobinja, ${feed.sourceCounts.jobvision} Jobvision).`);
      console.log(`Matched against ${feed.canonicalPathCount} canonical career paths; max age ${feed.maxAgeDays} days.`);
      console.log(`Source problems: ${problems.length}`);
      for (const problem of problems) console.warn(`- ${problem}`);
      console.log(`Wrote ${outputPath}`);
    })
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
