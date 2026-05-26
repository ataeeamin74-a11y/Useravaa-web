import { getCurrentTimelineItem, getPreviousTimelineItem, type ExperienceTimelineItem } from "./experience-timeline";
import { currentInsightQuestionCycle } from "./insight-question-cycle";
import { isValidJobField, type JobField } from "./job-fields";

export type ExperienceAnswerStatus = "draft" | "published" | "retracted";
export type ExperienceQuestionStatus = "active" | "replaced" | "skipped" | "expired";
export type ExperienceQuestionCategory = "hidden_role_reality" | "seniority_difference" | "company_environment" | "job_category_nature";
export type InsightAudienceIntent = "career_path" | "current_growth" | "career_change";

export const insightAudienceOptions: Array<{
  id: InsightAudienceIntent;
  title: string;
  description: string;
}> = [
  {
    id: "career_path",
    title: "انتخاب مسیر شغلی",
    description: "برای کسانی که هنوز در حال پیدا کردن مسیر مناسب خود هستند."
  },
  {
    id: "current_growth",
    title: "رشد در مسیر فعلی",
    description: "برای کسانی که می‌خواهند در نقش یا حوزه فعلی‌شان بهتر پیش بروند."
  },
  {
    id: "career_change",
    title: "تغییر مسیر شغلی",
    description: "برای کسانی که به تغییر مسیر و شروع یک حوزه تازه فکر می‌کنند."
  }
];

export type ExperienceQuestionTemplate = {
  id: string;
  category: ExperienceQuestionCategory;
  templateText: string;
  requiredFields: Array<keyof QuestionFieldMapping>;
};

export type QuestionFieldMapping = {
  current_role?: string;
  current_seniority?: string;
  current_company?: string;
  current_company_country?: string;
  previous_role?: string;
  previous_seniority?: string;
  previous_company?: string;
  job_category?: JobField;
};

export type ExperienceQuestion = {
  id: string;
  templateId: string;
  status: ExperienceQuestionStatus;
  renderedQuestion: string;
};

export type ExperienceAnswer = {
  id: string;
  profileId: string;
  questionId: string;
  renderedQuestion: string;
  answer: string;
  audienceIntents?: InsightAudienceIntent[];
  status: ExperienceAnswerStatus;
  publishedAt: string | null;
};

export const experienceAnswerStatuses = ["draft", "published", "retracted"] as const;
export const forbiddenExperienceAnswerStatuses = ["pending_review", "rejected", "hidden"] as const;
export const insightAnswerMaxLength = 280;
export const insightAudienceRequiredError = "مشخص کنید این نکته بیشتر به درد چه کسانی می‌خورد.";
export const insightAnswerLimitError = "متن بینش نمی‌تواند بیشتر از ۲۸۰ کاراکتر باشد.";

export function getInsightAnswerCharacterCount(value: string) {
  return Array.from(value).length;
}

export function limitInsightAnswerInput(value: string) {
  return Array.from(value).slice(0, insightAnswerMaxLength).join("");
}

export function insightAnswerIsWithinLimit(value: string) {
  return getInsightAnswerCharacterCount(value) <= insightAnswerMaxLength;
}

export function normalizeInsightAudienceIntents(values: readonly InsightAudienceIntent[] = []) {
  const validValues = new Set(insightAudienceOptions.map((option) => option.id));
  return Array.from(new Set(values.filter((value) => validValues.has(value))));
}

export const weeklyQuestionCopy = {
  title: "سؤال این دوره در بینش‌ها",
  description: "پاسخ کوتاه شما می‌تواند در پروفایل تجربه‌تان و صفحه بینش‌ها نمایش داده شود.",
  questionLabel: "سؤال فعال",
  answerAction: "پاسخ می‌دهم",
  replaceAction: "سؤال بعدی تا ۳ روز دیگر",
  skipAction: "انصراف",
  answerHelper: "پاسخ را بر اساس تجربه واقعی خودتان بنویسید. از توصیه‌های کلی، شعار، و اطلاعات محرمانه دوری کنید.",
  answerLimitHelper: "حداکثر ۲۸۰ کاراکتر",
  answerLimitError: insightAnswerLimitError,
  safetyText:
    "پاسخ را بر اساس تجربه واقعی خودتان بنویسید. از توصیه‌های کلی، شعار، و اطلاعات محرمانه دوری کنید.",
  responsibilityText: "مسئولیت محتوای این پاسخ با من است.",
  publishAction: "انتشار در بینش‌ها",
  retractAction: "برداشتن پاسخ از بینش‌ها",
  publicSectionTitle: "بینش‌های این تجربه",
  notificationTitle: "سؤال این دوره در بینش‌ها آماده است",
  notificationTarget: "/profile#weekly-question"
};

export const experienceQuestionTemplates: ExperienceQuestionTemplate[] = [
  {
    id: "EQE-T-001",
    category: "hidden_role_reality",
    templateText: currentInsightQuestionCycle.questionText,
    requiredFields: []
  },
  {
    id: "EQE-T-015",
    category: "seniority_difference",
    templateText: "وقتی سطح مسئولیت تغییر می‌کند، کدام بخش کار از بیرون کمتر دیده می‌شود اما در عمل تعیین‌کننده‌تر است؟",
    requiredFields: []
  },
  {
    id: "EQE-T-021",
    category: "company_environment",
    templateText: "چه چیزی در محیط کاری از بیرون ساده به نظر می‌رسد اما در عمل روی کیفیت تصمیم‌ها اثر زیادی دارد؟",
    requiredFields: []
  },
  {
    id: "EQE-T-031",
    category: "job_category_nature",
    templateText: "کدام بخش کار در مسیر شما کمتر دیده می‌شود اما بیشترین اثر را روی نتیجه دارد؟",
    requiredFields: []
  }
];

export const initialExperienceAnswers: ExperienceAnswer[] = [
  {
    id: "answer-published-4",
    profileId: "ali",
    questionId: "published-q-4",
    renderedQuestion: "در محصول و تجربه کاربر، کدام مهارت کمتر درباره‌اش حرف زده می‌شود اما در عمل تعیین‌کننده است؟",
    answer:
      "توانایی تبدیل ابهام به چند تصمیم کوچک خیلی تعیین‌کننده است. در کار روزمره محصول، همیشه اطلاعات کامل نیست و باید با تیم‌ها به یک مسیر قابل اجرا رسید. این مهارت از بیرون ساده دیده می‌شود، اما کیفیت تصمیم‌ها را تغییر می‌دهد.",
    status: "published",
    publishedAt: "2026-05-20T09:00:00.000Z"
  },
  {
    id: "answer-published-3",
    profileId: "ali",
    questionId: "published-q-3",
    renderedQuestion: "کار در دیجی‌کالا و اسنپ از نظر سرعت تصمیم‌گیری چه تفاوت عملی داشت؟",
    answer:
      "در اسنپ سرعت چرخه تصمیم‌گیری بیشتر به هماهنگی بین عملیات و محصول وابسته بود. در دیجی‌کالا، داده و آزمایش نقش پررنگ‌تری در متقاعد کردن ذی‌نفعان داشت. هر دو فضا یاد دادند که تصمیم خوب فقط خروجی تحلیل نیست و به زمینه سازمانی هم وابسته است.",
    status: "published",
    publishedAt: "2026-05-18T09:00:00.000Z"
  },
  {
    id: "answer-published-2",
    profileId: "ali",
    questionId: "published-q-2",
    renderedQuestion: "در حرکت از کارشناس ارشد به مدیر میانی، بیشترین تغییر در نوع پاسخ‌گویی تو چه بود؟",
    answer:
      "مسئولیت از انجام دقیق تحلیل به ساختن چارچوب تصمیم منتقل شد. باید مطمئن می‌شدم تیم می‌تواند بدون حضور دائمی من تصمیم‌های کوچک درست بگیرد. این تغییر بیشتر رفتاری بود تا فقط تغییر عنوان شغلی.",
    status: "published",
    publishedAt: "2026-05-12T09:00:00.000Z"
  },
  {
    id: "answer-published-1",
    profileId: "ali",
    questionId: "published-q-1",
    renderedQuestion: currentInsightQuestionCycle.questionText,
    answer:
      "اختیار واقعی من در شفاف کردن مسئله و ساختن اولویت‌هاست. اما خیلی از تصمیم‌ها بدون هم‌راستایی با عملیات، داده و طراحی پیش نمی‌رود. نقش محصول بیشتر از چیزی که از بیرون دیده می‌شود به اعتمادسازی وابسته است.",
    status: "published",
    publishedAt: "2026-05-02T09:00:00.000Z"
  },
  {
    id: "answer-retracted-1",
    profileId: "ali",
    questionId: "published-q-0",
    renderedQuestion: currentInsightQuestionCycle.questionText,
    answer: "این پاسخ از پروفایل حذف شده است.",
    status: "retracted",
    publishedAt: "2026-04-22T09:00:00.000Z"
  }
];

export const weeklyQuestionNotification = {
  id: "notification-weekly-question",
  title: weeklyQuestionCopy.notificationTitle,
  body: "برای پاسخ دادن به سؤال این دوره بینش‌ها وارد پروفایل خودت شو.",
  targetRoute: weeklyQuestionCopy.notificationTarget
};

export function deriveQuestionFieldsFromTimeline(timeline: readonly ExperienceTimelineItem[], profileJobFields: readonly string[] = []) {
  void profileJobFields;
  const current = getCurrentTimelineItem(timeline);
  const previous = getPreviousTimelineItem(timeline);
  const currentJobField = current?.jobField && isValidJobField(current.jobField) ? current.jobField : null;

  return {
    current_role: current?.jobTitle || undefined,
    current_seniority: current?.orgLevel || undefined,
    current_company: current?.companyName || undefined,
    current_company_country: current?.companyCountry || undefined,
    previous_role: previous?.jobTitle || undefined,
    previous_seniority: previous?.orgLevel || undefined,
    previous_company: previous?.companyName || undefined,
    job_category: currentJobField ?? undefined
  } satisfies QuestionFieldMapping;
}

export function renderExperienceQuestion(template: ExperienceQuestionTemplate, fields: QuestionFieldMapping) {
  return template.templateText.replace(/\{([a-z_]+)\}/g, (_, key: keyof QuestionFieldMapping) => fields[key] ?? "");
}

export function templateIsEligible(template: ExperienceQuestionTemplate, fields: QuestionFieldMapping) {
  return template.requiredFields.every((field) => Boolean(fields[field]));
}

export function getEligibleQuestionTemplates(fields: QuestionFieldMapping) {
  return experienceQuestionTemplates.filter((template) => templateIsEligible(template, fields));
}

export function getActiveWeeklyQuestion(timeline: readonly ExperienceTimelineItem[], profileJobFields: readonly string[] = []) {
  void timeline;
  void profileJobFields;

  return {
    id: currentInsightQuestionCycle.id,
    templateId: "insight-question-cycle",
    status: "active",
    renderedQuestion: currentInsightQuestionCycle.questionText
  } satisfies ExperienceQuestion;
}

export function publishExperienceAnswer(answer: ExperienceAnswer, responsibilityAccepted: boolean) {
  if (!insightAnswerIsWithinLimit(answer.answer)) {
    return {
      answer,
      published: false,
      error: insightAnswerLimitError
    };
  }

  if (!responsibilityAccepted || !answer.answer.trim()) {
    return {
      answer,
      published: false,
      error: weeklyQuestionCopy.responsibilityText
    };
  }

  if (!normalizeInsightAudienceIntents(answer.audienceIntents).length) {
    return {
      answer,
      published: false,
      error: insightAudienceRequiredError
    };
  }

  return {
    answer: {
      ...answer,
      audienceIntents: normalizeInsightAudienceIntents(answer.audienceIntents),
      status: "published" as ExperienceAnswerStatus,
      publishedAt: answer.publishedAt ?? "2026-05-22T12:00:00.000Z"
    },
    published: true,
    error: ""
  };
}

export function retractExperienceAnswer(answer: ExperienceAnswer) {
  return {
    ...answer,
    status: "retracted" as ExperienceAnswerStatus
  };
}

export function getPublishedProfileAnswers(profileId: string, answers: readonly ExperienceAnswer[] = initialExperienceAnswers) {
  return answers
    .filter((answer) => answer.profileId === profileId && answer.status === "published")
    .sort((a, b) => String(b.publishedAt).localeCompare(String(a.publishedAt)))
    .slice(0, 3);
}
