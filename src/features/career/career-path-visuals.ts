import type { CareerSubfamilyNode } from "./career-types";

export type CareerPathSceneType =
  | "build"
  | "campaign"
  | "content"
  | "conversation"
  | "creative"
  | "data"
  | "decision"
  | "finance"
  | "interface"
  | "people"
  | "search"
  | "server"
  | "support";

export type CareerPathVisualAccent = "teal" | "yellow" | "persimmon";

export type CareerPathVisualProfile = Readonly<{
  accent: CareerPathVisualAccent;
  sceneType: CareerPathSceneType;
  focusLabel: string;
  fitLabel: string;
  frictionLabel: string;
  collaborationLabel: string;
  pressureLabel: string;
  workTypeLabel: string;
  interactionLevel: "کم" | "متوسط" | "زیاد";
  toolDataLevel: "کم" | "متوسط" | "زیاد";
  ambiguityLevel: "کم" | "متوسط" | "زیاد";
  portfolioNeed: "ممکن" | "نیازمند تمرین" | "دشوارتر";
  startWithoutExperience: "ممکن" | "نیازمند تمرین" | "دشوارتر";
  insightLabel: string;
  sceneCaption: string;
  propLabels: readonly [string, string, string];
}>;

const fallbackProfiles: readonly CareerPathVisualProfile[] = [
  {
    accent: "teal",
    sceneType: "decision",
    focusLabel: "فهم مسئله و ساخت خروجی قابل بررسی",
    fitLabel: "کسی که از حل مسئله و یادگیری مرحله‌ای انرژی می‌گیرد",
    frictionLabel: "ابهام و تغییر اولویت‌ها",
    collaborationLabel: "با تیم، ذی‌نفع و آدم‌هایی که از خروجی استفاده می‌کنند",
    pressureLabel: "شفاف کردن مسئله وقتی داده کامل نیست",
    workTypeLabel: "ترکیبی از تحلیل، اجرا و ارتباط",
    interactionLevel: "متوسط",
    toolDataLevel: "متوسط",
    ambiguityLevel: "متوسط",
    portfolioNeed: "نیازمند تمرین",
    startWithoutExperience: "نیازمند تمرین",
    insightLabel: "نقطه تصمیم",
    sceneCaption: "قبل از انتخاب، واقعیت کار را کوچک و قابل لمس کن.",
    propLabels: ["مسئله", "خروجی", "بازخورد"]
  },
  {
    accent: "yellow",
    sceneType: "build",
    focusLabel: "ساختن خروجی و بهتر کردن آن با بازخورد",
    fitLabel: "کسی که با تمرین پیوسته و دقت در جزئیات جلو می‌رود",
    frictionLabel: "تکرار، اصلاح و یادگیری ابزارها",
    collaborationLabel: "با هم‌تیمی‌ها و کسانی که خروجی را بررسی می‌کنند",
    pressureLabel: "رساندن خروجی قابل اتکا با زمان محدود",
    workTypeLabel: "اجرایی، دقیق و مرحله‌ای",
    interactionLevel: "متوسط",
    toolDataLevel: "زیاد",
    ambiguityLevel: "متوسط",
    portfolioNeed: "نیازمند تمرین",
    startWithoutExperience: "نیازمند تمرین",
    insightLabel: "تست کوچک",
    sceneCaption: "یک خروجی کوچک بهتر از خواندن طولانی تصمیم را روشن می‌کند.",
    propLabels: ["ابزار", "تمرین", "خروجی"]
  },
  {
    accent: "persimmon",
    sceneType: "conversation",
    focusLabel: "فهم نیاز آدم‌ها و تبدیل آن به اقدام مشخص",
    fitLabel: "کسی که از گفت‌وگو، پیگیری و حل مسئله انسانی خسته نمی‌شود",
    frictionLabel: "ابهام، انتظارهای متفاوت و پیگیری‌های تکراری",
    collaborationLabel: "با کاربر، مشتری، تیم داخلی و تصمیم‌گیرها",
    pressureLabel: "هماهنگ کردن انتظارها بدون وعده قطعی",
    workTypeLabel: "ارتباطی، پیگیرانه و مسئله‌محور",
    interactionLevel: "زیاد",
    toolDataLevel: "متوسط",
    ambiguityLevel: "زیاد",
    portfolioNeed: "ممکن",
    startWithoutExperience: "ممکن",
    insightLabel: "واقعیت ارتباط",
    sceneCaption: "سختی اصلی معمولاً در آدم‌ها و انتظارها پنهان است.",
    propLabels: ["نیاز", "پیگیری", "اعتماد"]
  }
];

function normalizedPathText(path: CareerSubfamilyNode) {
  return [
    path.domain,
    path.generalCategory,
    path.midCategory,
    path.name
  ].join(" ").toLowerCase();
}

function hasAny(value: string, keywords: readonly string[]) {
  return keywords.some((keyword) => value.includes(keyword.toLowerCase()));
}

function buildProfile(overrides: Partial<CareerPathVisualProfile>, fallbackIndex = 0): CareerPathVisualProfile {
  const fallback = fallbackProfiles[fallbackIndex % fallbackProfiles.length];
  return { ...fallback, ...overrides };
}

export function getCareerPathVisualProfile(path: CareerSubfamilyNode): CareerPathVisualProfile {
  const text = normalizedPathText(path);

  if (hasAny(text, ["ui/ux", "product design", "ux", "طراحی محصول", "تجربه کاربری"])) {
    return buildProfile({
      accent: "teal",
      sceneType: "interface",
      focusLabel: "تبدیل رفتار کاربر به رابط و جریان قابل استفاده",
      fitLabel: "کسی که بین زیبایی، کاربرد و محدودیت محصول تعادل می‌سازد",
      frictionLabel: "نقد شدن، ابهام نیاز کاربر و اصلاح چندباره",
      collaborationLabel: "با کاربر، محصول، طراحی و تیم فنی",
      pressureLabel: "دفاع از تصمیم طراحی وقتی همه چیز سلیقه‌ای به نظر می‌رسد",
      workTypeLabel: "تحلیلی، خلاق و ارتباطی",
      interactionLevel: "زیاد",
      toolDataLevel: "متوسط",
      ambiguityLevel: "زیاد",
      portfolioNeed: "نیازمند تمرین",
      startWithoutExperience: "نیازمند تمرین",
      insightLabel: "رفتار کاربر",
      sceneCaption: "این صفحه را مثل یک پروتوتایپ تصمیم ببین.",
      propLabels: ["وایرفریم", "جریان کاربر", "بازخورد"]
    });
  }

  if (hasAny(text, ["seo", "سئو"])) {
    return buildProfile({
      accent: "yellow",
      sceneType: "search",
      focusLabel: "کمک به پیدا شدن محتوای درست در جست‌وجو",
      fitLabel: "کسی که از ترکیب تحلیل، محتوا و صبر برای نتیجه گرفتن لذت می‌برد",
      frictionLabel: "نتیجه‌های کند، تغییر الگوریتم و آزمون مداوم فرضیه‌ها",
      collaborationLabel: "با محتوا، محصول، فنی و تصمیم‌گیرهای رشد",
      pressureLabel: "توضیح دادن اثر کار وقتی نتیجه فوری نیست",
      workTypeLabel: "تحلیلی، محتوایی و پیوسته",
      interactionLevel: "متوسط",
      toolDataLevel: "زیاد",
      ambiguityLevel: "زیاد",
      portfolioNeed: "نیازمند تمرین",
      startWithoutExperience: "ممکن",
      insightLabel: "قبل از کلیک",
      sceneCaption: "اینجا تصمیم با سؤال درست شروع می‌شود، نه فقط رتبه گرفتن.",
      propLabels: ["جست‌وجو", "محتوا", "سیگنال"]
    });
  }

  if (hasAny(text, ["performance", "growth", "digital marketing", "پرفورمنس", "دیجیتال مارکتینگ", "مارکتینگ"])) {
    return buildProfile({
      accent: "yellow",
      sceneType: "campaign",
      focusLabel: "ساخت، سنجش و بهتر کردن پیام‌های رشد",
      fitLabel: "کسی که با داده، پیام و آزمون مداوم راحت است",
      frictionLabel: "ابهام نتیجه، تغییر کانال‌ها و فشار تصمیم سریع",
      collaborationLabel: "با محتوا، فروش، محصول و تیم رشد",
      pressureLabel: "تصمیم‌گیری با نشانه‌های ناقص و بودجه محدود",
      workTypeLabel: "تحلیلی، ارتباطی و آزمایشی",
      interactionLevel: "متوسط",
      toolDataLevel: "زیاد",
      ambiguityLevel: "زیاد",
      portfolioNeed: "نیازمند تمرین",
      startWithoutExperience: "ممکن",
      insightLabel: "فرضیه رشد",
      sceneCaption: "مهم است بدانی با پیام، کانال و ابهام چقدر راحتی.",
      propLabels: ["پیام", "کانال", "آزمون"]
    });
  }

  if (hasAny(text, ["product management", "ownership", "مدیریت محصول"])) {
    return buildProfile({
      accent: "teal",
      sceneType: "decision",
      focusLabel: "مرتب کردن مسئله‌ها، اولویت‌ها و تصمیم‌های محصول",
      fitLabel: "کسی که بین کاربر، کسب‌وکار و اجرا پل می‌زند",
      frictionLabel: "تصمیم سخت با داده ناقص و انتظارهای متضاد",
      collaborationLabel: "با طراحی، فنی، رشد، پشتیبانی و تصمیم‌گیرها",
      pressureLabel: "نه گفتن به گزینه‌های جذاب اما کم‌اولویت",
      workTypeLabel: "تصمیم‌محور، ارتباطی و تحلیلی",
      interactionLevel: "زیاد",
      toolDataLevel: "زیاد",
      ambiguityLevel: "زیاد",
      portfolioNeed: "نیازمند تمرین",
      startWithoutExperience: "دشوارتر",
      insightLabel: "اولویت واقعی",
      sceneCaption: "سختی کار در انتخاب بین گزینه‌های خوب است.",
      propLabels: ["اولویت", "تصمیم", "هماهنگی"]
    });
  }

  if (hasAny(text, ["backend", "server", "api", "java", "node", "python", "php", "go ", ".net", "c#", "full-stack", "frontend", "mobile", "android", "qa", "sdet", "devops", "sre", "kubernetes", "security", "network", "infrastructure", "پلتفرم"])) {
    const isBackend = hasAny(text, ["backend", "server", "api", "java", "node", "python", "php", "go ", ".net", "c#"]);
    const isSecurity = hasAny(text, ["security", "soc", "penetration"]);
    const isReliability = hasAny(text, ["devops", "sre", "kubernetes", "platform", "infrastructure", "network"]);
    return buildProfile({
      accent: isSecurity || isReliability ? "persimmon" : "teal",
      sceneType: isBackend ? "server" : "build",
      focusLabel: isBackend ? "ساخت منطق پشت محصول و سرویس‌های قابل اتکا" : "ساخت، تست و نگهداری تجربه فنی قابل اتکا",
      fitLabel: "کسی که از حل مسئله دقیق، یادگیری فنی و ساختن خروجی قابل اتکا لذت می‌برد",
      frictionLabel: isSecurity
        ? "جزئیات حساس، فشار خطا و نیاز به دقت بالا"
        : (isReliability ? "فشار پایداری، خطاهای مبهم و مسئولیت سرویس" : "دیباگ، جزئیات فنی و تغییر نیازها"),
      collaborationLabel: "با فنی، محصول، طراحی و گاهی عملیات",
      pressureLabel: isReliability ? "پیدا کردن علت خطا وقتی نشانه‌ها کامل نیست" : "تحویل خروجی تمیز بدون ساده‌سازی بیش از حد مسئله",
      workTypeLabel: "فنی، تحلیلی و ساخت‌محور",
      interactionLevel: "متوسط",
      toolDataLevel: "زیاد",
      ambiguityLevel: isSecurity || isReliability ? "زیاد" : "متوسط",
      portfolioNeed: "نیازمند تمرین",
      startWithoutExperience: "دشوارتر",
      insightLabel: isBackend ? "پشت صحنه محصول" : "اتکاپذیری خروجی",
      sceneCaption: "واقعیت این مسیر شغلی با تمرین عملی و خطاهای واقعی روشن می‌شود.",
      propLabels: isBackend ? ["API", "داده", "سرویس"] : ["کد", "تست", "پایداری"]
    }, 1);
  }

  if (hasAny(text, ["data", "analytics", "bi", "ai", "dashboard", "تحلیل داده", "هوش مصنوعی", "داشبورد", "بینش"])) {
    return buildProfile({
      accent: "teal",
      sceneType: "data",
      focusLabel: "تبدیل داده خام به بینش قابل تصمیم",
      fitLabel: "کسی که با سؤال دقیق، الگوها و توضیح ساده نتیجه راحت است",
      frictionLabel: "داده ناقص، تعریف مبهم مسئله و انتظار پاسخ قطعی",
      collaborationLabel: "با محصول، کسب‌وکار، فنی و تصمیم‌گیرها",
      pressureLabel: "توضیح محدودیت داده بدون قطعی حرف زدن",
      workTypeLabel: "تحلیلی، داده‌محور و توضیحی",
      interactionLevel: "متوسط",
      toolDataLevel: "زیاد",
      ambiguityLevel: "زیاد",
      portfolioNeed: "نیازمند تمرین",
      startWithoutExperience: "نیازمند تمرین",
      insightLabel: "بینش مسیر",
      sceneCaption: "داده وقتی ارزش دارد که به سؤال درست وصل شود.",
      propLabels: ["داده", "الگو", "بینش"]
    });
  }

  if (hasAny(text, ["hr", "talent", "people", "منابع انسانی", "جذب", "کارگزینی"])) {
    return buildProfile({
      accent: "yellow",
      sceneType: "people",
      focusLabel: "هم‌راستا کردن نیاز آدم‌ها و نیاز سازمان",
      fitLabel: "کسی که گوش دادن، نظم و قضاوت انسانی را با هم دارد",
      frictionLabel: "گفت‌وگوهای حساس، پیگیری زیاد و تصمیم‌های انسانی سخت",
      collaborationLabel: "با افراد، مدیرها، تیم عملیات و تصمیم‌گیرها",
      pressureLabel: "حفظ اعتماد در موقعیت‌های مبهم و حساس",
      workTypeLabel: "انسانی، پیگیرانه و ساختارمند",
      interactionLevel: "زیاد",
      toolDataLevel: "متوسط",
      ambiguityLevel: "زیاد",
      portfolioNeed: "ممکن",
      startWithoutExperience: "ممکن",
      insightLabel: "تناسب انسانی",
      sceneCaption: "تصمیم خوب فقط با فرم و فرآیند ساخته نمی‌شود.",
      propLabels: ["آدم‌ها", "تناسب", "اعتماد"]
    }, 2);
  }

  if (hasAny(text, ["sales", "account", "business development", "customer", "crm", "retention", "contact center", "success", "فروش", "مشتری", "بازار"])) {
    return buildProfile({
      accent: "persimmon",
      sceneType: hasAny(text, ["customer", "crm", "retention", "contact center", "success", "مشتری"]) ? "support" : "conversation",
      focusLabel: "فهم نیاز، ساخت رابطه و پیگیری تا نتیجه روشن",
      fitLabel: "کسی که از گفت‌وگو، پیگیری و حل مسئله آدم‌ها انرژی می‌گیرد",
      frictionLabel: "رد شدن، انتظارهای متفاوت و پیگیری‌های طولانی",
      collaborationLabel: "با مشتری، فروش، محصول، عملیات و پشتیبانی",
      pressureLabel: "نگه داشتن اعتماد بدون وعده اغراق‌آمیز",
      workTypeLabel: "ارتباطی، پیگیرانه و نتیجه‌محور",
      interactionLevel: "زیاد",
      toolDataLevel: "متوسط",
      ambiguityLevel: "زیاد",
      portfolioNeed: "ممکن",
      startWithoutExperience: "ممکن",
      insightLabel: "اعتماد و پیگیری",
      sceneCaption: "سختی این مسیر شغلی بیشتر در گفت‌وگوی واقعی خودش را نشان می‌دهد.",
      propLabels: ["نیاز", "رابطه", "پیگیری"]
    }, 2);
  }

  if (hasAny(text, ["content", "copywriting", "social", "brand", "pr", "communications", "محتوا", "شبکه", "برند", "کپی"])) {
    return buildProfile({
      accent: "yellow",
      sceneType: "content",
      focusLabel: "تبدیل پیام و ایده به محتوای قابل فهم",
      fitLabel: "کسی که با نوشتن، روایت و فهم مخاطب راحت است",
      frictionLabel: "بازنویسی، ابهام سلیقه و فشار انتشار منظم",
      collaborationLabel: "با برند، رشد، طراحی، محصول و مخاطب",
      pressureLabel: "ساخت پیام روشن وقتی نظرها پراکنده است",
      workTypeLabel: "خلاق، ارتباطی و پیوسته",
      interactionLevel: "متوسط",
      toolDataLevel: "متوسط",
      ambiguityLevel: "زیاد",
      portfolioNeed: "نیازمند تمرین",
      startWithoutExperience: "ممکن",
      insightLabel: "پیام قابل فهم",
      sceneCaption: "قبل از انتخاب، ببین از بازنویسی و بازخورد انرژی می‌گیری یا نه.",
      propLabels: ["پیام", "مخاطب", "بازنویسی"]
    });
  }

  if (hasAny(text, ["finance", "accounting", "audit", "payroll", "tax", "treasury", "مالی", "حسابداری", "حسابرسی", "حقوق و دستمزد", "مالیاتی", "خزانه"])) {
    return buildProfile({
      accent: "teal",
      sceneType: "finance",
      focusLabel: "مرتب کردن عدد، سند و تصمیم‌های مالی قابل اتکا",
      fitLabel: "کسی که با دقت، نظم و مسئولیت‌پذیری در جزئیات راحت است",
      frictionLabel: "خطای کوچک، فشار زمان و نیاز به پیگیری دقیق",
      collaborationLabel: "با مالی، عملیات، مدیریت و واحدهای داخلی",
      pressureLabel: "دقیق ماندن وقتی کار تکراری و حساس است",
      workTypeLabel: "دقیق، ساختارمند و پیگیرانه",
      interactionLevel: "متوسط",
      toolDataLevel: "زیاد",
      ambiguityLevel: "متوسط",
      portfolioNeed: "ممکن",
      startWithoutExperience: "نیازمند تمرین",
      insightLabel: "دقت قابل اعتماد",
      sceneCaption: "واقعیت این مسیر شغلی در نظم، پیگیری و جزئیات معلوم می‌شود.",
      propLabels: ["سند", "عدد", "کنترل"]
    });
  }

  if (hasAny(text, ["graphic", "visual", "video", "motion", "3d", "illustration", "طراحی گرافیک", "تصویرسازی", "ویدیو", "موشن", "هویت بصری"])) {
    return buildProfile({
      accent: "yellow",
      sceneType: "creative",
      focusLabel: "ساخت خروجی بصری که پیام را روشن‌تر می‌کند",
      fitLabel: "کسی که از ترکیب سلیقه، تمرین و بازخورد برای خروجی بهتر لذت می‌برد",
      frictionLabel: "بازخورد سلیقه‌ای، اصلاح زیاد و فشار زمان",
      collaborationLabel: "با محتوا، برند، رشد، محصول و سفارش‌دهنده داخلی",
      pressureLabel: "حفظ کیفیت وقتی زمان و نظرها محدود است",
      workTypeLabel: "خلاق، اجرایی و جزئیات‌محور",
      interactionLevel: "متوسط",
      toolDataLevel: "زیاد",
      ambiguityLevel: "زیاد",
      portfolioNeed: "نیازمند تمرین",
      startWithoutExperience: "ممکن",
      insightLabel: "خروجی دیدنی",
      sceneCaption: "قبل از انتخاب، ببین با اصلاح چندباره کنار می‌آیی یا نه.",
      propLabels: ["اتود", "سبک", "بازخورد"]
    }, 1);
  }

  const hash = path.id.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return fallbackProfiles[hash % fallbackProfiles.length];
}
