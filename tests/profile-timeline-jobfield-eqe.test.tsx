import fs from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DiscoverPage } from "@/features/v51/discover/DiscoverPage";
import {
  deriveQuestionFieldsFromTimeline,
  experienceAnswerStatuses,
  experienceQuestionTemplates,
  forbiddenExperienceAnswerStatuses,
  getActiveWeeklyQuestion,
  getInsightAnswerCharacterCount,
  getPublishedProfileAnswers,
  insightAnswerLimitError,
  insightAnswerMaxLength,
  limitInsightAnswerInput,
  publishExperienceAnswer,
  retractExperienceAnswer,
  templateIsEligible,
  weeklyQuestionCopy,
  type ExperienceAnswer
} from "@/features/v51/data/experience-questions";
import { getDiscoverJobCategoryOptions, getProfileInsights } from "@/features/v51/data/experience-discovery";
import { currentInsightQuestionCycle } from "@/features/v51/data/insight-question-cycle";
import { initialExperienceTimeline, validateTimelineItem, type ExperienceTimelineItem } from "@/features/v51/data/experience-timeline";
import { invalidLegacyJobFieldValues, isValidJobField, jobFieldTaxonomy, validateJobField, validateJobTitle, type JobField } from "@/features/v51/data/job-fields";
import { initialBuilderDraft } from "@/features/v51/data/my-profile";
import { categoryOptions, profiles } from "@/features/v51/data/profiles";
import { NotificationsPage } from "@/features/v51/notifications/NotificationsPage";
import { ProfileDashboardPage } from "@/features/v51/my-profile/pages/ProfileDashboardPage";
import { ProfileBuilderPage } from "@/features/v51/my-profile/pages/ProfileBuilderPage";
import { JobFieldSelect } from "@/features/v51/my-profile/components/JobFieldSelect";
import { JobTitleInput } from "@/features/v51/my-profile/components/JobTitleInput";
import { AnswerEditor } from "@/features/v51/my-profile/components/AnswerEditor";
import { WeeklyQuestionCard } from "@/features/v51/my-profile/components/WeeklyQuestionCard";
import { ProfileDetailPage } from "@/features/v51/profile/ProfileDetailPage";
import { profileFromBuilderDraft, submitProfileForReview, validateProfileDraft } from "@/features/v51/data/my-profile";

function readProjectFile(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("Profile timeline, job field taxonomy, and EQE integration", () => {
  it("/profile renders compact active-question action only when unanswered", () => {
    const html = renderToStaticMarkup(<ProfileDashboardPage activeQuestionAnswered={false} />);

    expect(html).toContain("اقدام‌های مهم");
    expect(html).toContain("سؤال جدید هنوز پاسخ داده نشده");
    expect(html).toContain("بینش‌های من");
    expect(html).toContain("نوشتن پاسخ کوتاه");
  });

  it("profile management banner is placed before dashboard sections", () => {
    const html = renderToStaticMarkup(<ProfileDashboardPage activeQuestionAnswered={false} />);

    expect(html).not.toContain("پروفایل تجربه شما فعال است");
    expect(html.indexOf("پروفایل و اطلاعات تجربه شما")).toBeLessThan(html.indexOf("اقدام‌های مهم"));
    expect(html.indexOf("اقدام‌های مهم")).toBeLessThan(html.indexOf("پروفایل تجربه من"));
  });

  it("public profile does not render the active question as an unanswered prompt", () => {
    const activeQuestion = getActiveWeeklyQuestion(initialExperienceTimeline, initialBuilderDraft.categories);
    const html = renderToStaticMarkup(<ProfileDetailPage profile={profiles[0]} />);

    expect(activeQuestion).not.toBeNull();
    expect(html).toContain(activeQuestion!.renderedQuestion);
    expect(html).not.toContain("سؤال فعال");
    expect(html).not.toContain("پاسخ می‌دهم");
  });

  it("published insight answers render inside “بینش‌های این تجربه” on /profiles/[profileId]", () => {
    const html = renderToStaticMarkup(<ProfileDetailPage profile={profiles[0]} />);

    expect(html).toContain("بینش‌های این تجربه");
    expect(html).toContain("تبدیل ابهام");
    expect(html).not.toContain("از تجربه من");
  });

  it("old public profile answer section is removed", () => {
    const html = renderToStaticMarkup(<ProfileDetailPage profile={profiles[0]} />);

    expect(html).not.toContain("از تجربه من");
  });

  it("public profile maps only published insight answers into the insight section", () => {
    const html = renderToStaticMarkup(<ProfileDetailPage profile={profiles[0]} />);

    expect(html).toContain("بینش‌های این تجربه");
    expect(getProfileInsights("ali")).toHaveLength(3);
    expect(getPublishedProfileAnswers("ali")).toHaveLength(3);
  });

  it("notification links to /profile#weekly-question and does not include full question text", () => {
    const activeQuestion = getActiveWeeklyQuestion(initialExperienceTimeline, initialBuilderDraft.categories);
    const html = renderToStaticMarkup(<NotificationsPage />);

    expect(html).toContain("/profile#weekly-question");
    expect(html).toContain(weeklyQuestionCopy.notificationTitle);
    expect(html).not.toContain(activeQuestion!.renderedQuestion);
  });

  it("profile question uses the shared active insight question instead of role-specific generation", () => {
    const originalQuestion = getActiveWeeklyQuestion(initialExperienceTimeline, initialBuilderDraft.categories);
    const changedTimeline = initialExperienceTimeline.map((item) => (item.isCurrent ? { ...item, jobTitle: "تحلیلگر داده" } : item));
    const question = getActiveWeeklyQuestion(changedTimeline, initialBuilderDraft.categories);

    expect(originalQuestion?.renderedQuestion).toBe(currentInsightQuestionCycle.questionText);
    expect(question?.renderedQuestion).toBe(currentInsightQuestionCycle.questionText);
    expect(question?.renderedQuestion).not.toContain("مدیر محصول");
    expect(question?.renderedQuestion).not.toContain("تحلیلگر داده");
  });

  it("current timeline jobTitle overrides stale profile role state", () => {
    const changedTimeline = initialExperienceTimeline.map((item) => (item.isCurrent ? { ...item, jobTitle: "تحلیلگر داده" } : item));
    const profile = profileFromBuilderDraft({ ...initialBuilderDraft, role: "مدیر محصول", timeline: changedTimeline });

    expect(profile.roleFa).toBe("تحلیلگر داده");
  });

  it("missing current timeline item still renders the shared active insight question", () => {
    const withoutCurrent = initialExperienceTimeline.map((item) => ({ ...item, isCurrent: false }));
    const question = getActiveWeeklyQuestion(withoutCurrent, initialBuilderDraft.categories);
    const html = renderToStaticMarkup(<WeeklyQuestionCard question={question} />);

    expect(question?.renderedQuestion).toBe(currentInsightQuestionCycle.questionText);
    expect(html).toContain(currentInsightQuestionCycle.questionText);
    expect(html).not.toContain("مدیر محصول");
  });

  it("profile builder UI uses عنوان شغلی and does not render نقش اصلی", () => {
    const html = renderToStaticMarkup(<ProfileBuilderPage />);

    expect(html).toContain("عنوان شغلی");
    expect(html).not.toContain("نقش اصلی");
  });

  it("publish is blocked without responsibility checkbox", () => {
    const draft: ExperienceAnswer = {
      id: "draft",
      profileId: "ali",
      questionId: "q1",
      renderedQuestion: "پرسش",
      answer: "پاسخ کوتاه حرفه‌ای",
      audienceIntents: ["current_growth"],
      status: "draft",
      publishedAt: null
    };

    const result = publishExperienceAnswer(draft, false);

    expect(result.published).toBe(false);
    expect(result.answer.status).toBe("draft");
  });

  it("publishing valid answer changes status from draft to published", () => {
    const draft: ExperienceAnswer = {
      id: "draft",
      profileId: "ali",
      questionId: "q1",
      renderedQuestion: "پرسش",
      answer: "پاسخ کوتاه حرفه‌ای",
      audienceIntents: ["current_growth"],
      status: "draft",
      publishedAt: null
    };

    const result = publishExperienceAnswer(draft, true);

    expect(result.published).toBe(true);
    expect(result.answer.status).toBe("published");
  });

  it("profile answer editor shows a live 280-character counter", () => {
    const emptyHtml = renderToStaticMarkup(<AnswerEditor value="" onChange={() => undefined} />);
    const filledHtml = renderToStaticMarkup(<AnswerEditor value={"ا".repeat(124)} onChange={() => undefined} />);

    expect(emptyHtml).toContain("0 / 280");
    expect(emptyHtml).toContain("maxLength=\"280\"");
    expect(emptyHtml).toContain("حداکثر ۲۸۰ کاراکتر");
    expect(filledHtml).toContain("124 / 280");
    expect(getInsightAnswerCharacterCount("ا".repeat(124))).toBe(124);
  });

  it("answer input and publishing enforce the 280-character insight limit", () => {
    const acceptedAnswer = "ا".repeat(insightAnswerMaxLength);
    const overflowingAnswer = "ب".repeat(insightAnswerMaxLength + 1);
    const acceptedDraft: ExperienceAnswer = {
      id: "accepted-draft",
      profileId: "ali",
      questionId: "q1",
      renderedQuestion: "پرسش",
      answer: acceptedAnswer,
      audienceIntents: ["current_growth"],
      status: "draft",
      publishedAt: null
    };
    const overflowingDraft: ExperienceAnswer = {
      ...acceptedDraft,
      id: "overflowing-draft",
      answer: overflowingAnswer
    };

    expect(limitInsightAnswerInput(overflowingAnswer)).toHaveLength(insightAnswerMaxLength);
    expect(publishExperienceAnswer(acceptedDraft, true).published).toBe(true);
    expect(publishExperienceAnswer(overflowingDraft, true)).toMatchObject({
      published: false,
      error: insightAnswerLimitError
    });
  });

  it("Provider can retract own published answer", () => {
    const published = getPublishedProfileAnswers("ali")[0];
    const retracted = retractExperienceAnswer(published);

    expect(retracted.status).toBe("retracted");
  });

  it("retracted answer disappears from public profile", () => {
    const published = getPublishedProfileAnswers("ali")[0];
    const retracted = retractExperienceAnswer(published);

    expect(getPublishedProfileAnswers("ali", [retracted])).toHaveLength(0);
  });

  it("no Admin routes, states, or components are added for EQE", () => {
    expect(experienceAnswerStatuses).toEqual(["draft", "published", "retracted"]);
    expect(forbiddenExperienceAnswerStatuses.every((status) => !(experienceAnswerStatuses as readonly string[]).includes(status))).toBe(true);
    expect(fs.existsSync(path.join(process.cwd(), "src/app/admin/experience-answers"))).toBe(false);
    expect(fs.existsSync(path.join(process.cwd(), "src/features/v51/admin"))).toBe(false);
  });

  it("timeline item requires job title, job field, org level, company name, company country, start date, and end date unless current", () => {
    const invalid = {
      ...initialExperienceTimeline[0],
      jobTitle: "",
      jobField: "محصول",
      orgLevel: "",
      companyName: "",
      companyCountry: "",
      companyIndustry: "",
      startYear: 0,
      startMonth: 0,
      isCurrent: false,
      endYear: null,
      endMonth: null
    } as unknown as ExperienceTimelineItem;

    const errors = validateTimelineItem(invalid);

    expect(errors.jobTitle).toBe("عنوان شغلی را کامل وارد کنید.");
    expect(errors.jobField).toBe("حوزه شغلی را از لیست انتخاب کنید.");
    expect(errors.orgLevel).toBe("رده سازمانی را انتخاب کن.");
    expect(errors.companyName).toBe("نام شرکت را کامل وارد کن.");
    expect(errors.companyCountry).toBe("کشور یا محل شرکت را وارد کن.");
    expect(errors.companyIndustry).toBe("زمینه فعالیت شرکت را وارد کن.");
    expect(errors.startDate).toBe("تاریخ شروع را کامل وارد کن.");
    expect(errors.endDate).toBe("برای سابقه قبلی، تاریخ پایان را وارد کن.");
  });

  it("jobTitle accepts manual free text and is rendered as an input", () => {
    const html = renderToStaticMarkup(<JobTitleInput value="مدیرعامل رشد محصول" onChange={() => undefined} />);

    expect(validateJobTitle("مدیرعامل رشد محصول")).toBe("");
    expect(html).toContain("مدیرعامل رشد محصول");
    expect(html).toContain("<input");
  });

  it("jobField only accepts the fixed taxonomy and is rendered as a select", () => {
    const html = renderToStaticMarkup(<JobFieldSelect value="محصول و تجربه کاربر" onChange={() => undefined} />);

    expect(isValidJobField("محصول و تجربه کاربر")).toBe(true);
    expect(validateJobField("محصول")).toBe("حوزه شغلی را از لیست انتخاب کنید.");
    expect(html).toContain("<select");
    expect(html).toContain("محصول و تجربه کاربر");
  });

  it("profile form accepts exactly one selected jobField", () => {
    const validDraft = { ...initialBuilderDraft, categories: ["محصول و تجربه کاربر" as JobField] };
    const invalidDraft = { ...initialBuilderDraft, categories: ["محصول و تجربه کاربر", "علوم داده و هوش مصنوعی"] as JobField[] };

    expect(validateProfileDraft(validDraft).categories).toBeUndefined();
    expect(validateProfileDraft(invalidDraft).categories).toBe("حوزه شغلی را از لیست انتخاب کن.");
  });

  it("jobField dropdown options are exactly the fixed taxonomy list", () => {
    const html = renderToStaticMarkup(<JobFieldSelect value="محصول و تجربه کاربر" onChange={() => undefined} />);

    expect(html.match(/<option/g) ?? []).toHaveLength(jobFieldTaxonomy.length);
    jobFieldTaxonomy.forEach((field) => {
      expect(html).toContain(`value="${field}"`);
    });
  });

  it("invalid old values are not accepted as standalone jobField values unless mapped to fixed taxonomy", () => {
    invalidLegacyJobFieldValues.forEach((value) => {
      expect(isValidJobField(value)).toBe(false);
    });
  });

  it("current role/seniority/company are derived from timeline item with isCurrent=true", () => {
    const fields = deriveQuestionFieldsFromTimeline(initialExperienceTimeline, initialBuilderDraft.categories);

    expect(fields.current_role).toBe("مدیر محصول");
    expect(fields.current_seniority).toBe("مدیر میانی");
    expect(fields.current_company).toBe("اسنپ");
    expect(fields.current_company_country).toBe("ایران");
  });

  it("previous role/seniority/company are derived from most recent non-current timeline item", () => {
    const fields = deriveQuestionFieldsFromTimeline(initialExperienceTimeline, initialBuilderDraft.categories);

    expect(fields.previous_role).toBe("تحلیلگر داده محصول");
    expect(fields.previous_seniority).toBe("کارشناس ارشد");
    expect(fields.previous_company).toBe("دیجی‌کالا");
  });

  it("{current_role} uses jobTitle and {job_category} uses jobField", () => {
    const fields = deriveQuestionFieldsFromTimeline(initialExperienceTimeline, []);

    expect(fields.current_role).toBe(initialExperienceTimeline[0].jobTitle);
    expect(fields.job_category).toBe(initialExperienceTimeline[0].jobField);
  });

  it("company comparison templates remain approved bank entries without driving the active question", () => {
    const companyTemplate = experienceQuestionTemplates.find((template) => template.category === "company_environment");
    expect(companyTemplate).toBeDefined();

    const currentOnly = deriveQuestionFieldsFromTimeline([initialExperienceTimeline[0]], initialBuilderDraft.categories);
    const full = deriveQuestionFieldsFromTimeline(initialExperienceTimeline, initialBuilderDraft.categories);

    expect(templateIsEligible(companyTemplate!, currentOnly)).toBe(true);
    expect(templateIsEligible(companyTemplate!, full)).toBe(true);
    expect(getActiveWeeklyQuestion(initialExperienceTimeline, initialBuilderDraft.categories)?.renderedQuestion).toBe(currentInsightQuestionCycle.questionText);
  });

  it("seniority comparison templates remain approved bank entries without driving the active question", () => {
    const seniorityTemplate = experienceQuestionTemplates.find((template) => template.category === "seniority_difference");
    expect(seniorityTemplate).toBeDefined();

    const currentOnly = deriveQuestionFieldsFromTimeline([initialExperienceTimeline[0]], initialBuilderDraft.categories);
    const full = deriveQuestionFieldsFromTimeline(initialExperienceTimeline, initialBuilderDraft.categories);

    expect(templateIsEligible(seniorityTemplate!, currentOnly)).toBe(true);
    expect(templateIsEligible(seniorityTemplate!, full)).toBe(true);
    expect(getActiveWeeklyQuestion(initialExperienceTimeline, initialBuilderDraft.categories)?.renderedQuestion).toBe(currentInsightQuestionCycle.questionText);
  });

  it("free-text previousCompanies is not used as source of truth for Question Engine eligibility", () => {
    const freeTextPreviousCompanies = ["دیجی‌کالا"];
    const fields = deriveQuestionFieldsFromTimeline([initialExperienceTimeline[0]], initialBuilderDraft.categories);

    expect(freeTextPreviousCompanies).toContain("دیجی‌کالا");
    expect(fields.previous_company).toBeUndefined();
  });

  it("profile builder form does not render the previous-companies tag input", () => {
    const html = renderToStaticMarkup(<ProfileBuilderPage />);

    expect(html).not.toContain("شرکت‌های قبلی");
    expect(html).not.toContain("نام شرکت را بنویس و Enter بزن");
  });

  it("public/profile summary does not require duplicate previous company entry", () => {
    const draftWithoutPreviousCompanyTags = { ...initialBuilderDraft, companies: [] };
    const result = submitProfileForReview(draftWithoutPreviousCompanyTags);
    const profile = profileFromBuilderDraft(draftWithoutPreviousCompanyTags);

    expect(result.status).toBe("pending_review");
    expect(profile.previousCompaniesFa).toEqual(["دیجی‌کالا"]);
  });

  it("discovery job-field filters use the fixed taxonomy but only show data-backed active categories", () => {
    const html = renderToStaticMarkup(<DiscoverPage initialState="ready" />);
    const source = readProjectFile("src/features/v51/data/profiles.ts");
    const activeOptions = getDiscoverJobCategoryOptions();

    expect(categoryOptions).toEqual(jobFieldTaxonomy);
    expect(source).toContain("categoryOptions = [...jobFieldTaxonomy]");
    activeOptions.forEach((field) => {
      expect(html).toContain(field);
    });
    expect(activeOptions).not.toContain("مالی، حقوقی و سرمایه‌گذاری");
    expect(html).not.toContain("مالی، حقوقی و سرمایه‌گذاری");
  });
});
