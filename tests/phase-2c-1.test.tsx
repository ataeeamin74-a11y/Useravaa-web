import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  addCompanyTag,
  faSummaryCount,
  getDashboardFixture,
  initialBuilderDraft,
  normalizeUserMotivations,
  profileDraftIsValid,
  removeCompanyTag,
  setFreeHelp,
  shuffleMotivationOptionsForUser,
  submitProfileForReview,
  toggleSelection,
  transitionProfileStatus,
  updateUserMotivationSelection,
  userMotivationOptions,
  updateDraftOrgLevel,
  validateAvatarCandidate,
  validateProfileDraft
} from "@/features/v51/data/my-profile";
import { ProfileBuilderPage } from "@/features/v51/my-profile/pages/ProfileBuilderPage";
import { ProfileDashboardPage } from "@/features/v51/my-profile/pages/ProfileDashboardPage";

describe("Phase 2C-1 V51 profile dashboard and builder", () => {
  it("profile dashboard renders the unified profile banner and dashboard panels", () => {
    const html = renderToStaticMarkup(<ProfileDashboardPage fixture={getDashboardFixture("active")} />);

    expect(html).not.toContain("پروفایل تجربه شما فعال است");
    expect(html).toContain("پروفایل و اطلاعات تجربه شما");
    expect(html).toContain("مشاهده پروفایل عمومی");
    expect(html).toContain("ویرایش پروفایل");
    expect(html).toContain("پروفایل تجربه من");
    expect(html).toContain("ذخیره‌شده‌ها");
    expect(html).toContain("کیف پول و پرداخت‌ها");
    expect(html).toContain("درخواست‌ها و جلسه‌ها");
    expect(html).toContain("اقدام‌های مهم");
    expect(html).toContain("حساب و تنظیمات");
    expect(html).toContain("توقف دریافت درخواست‌ها");
    expect(html).toContain("/saved");
    expect(html).toContain("ذخیره‌شده");
    expect(html).not.toContain("دنبال");
  });

  it("profile dashboard only shows active question action when unanswered", () => {
    const unansweredHtml = renderToStaticMarkup(<ProfileDashboardPage fixture={getDashboardFixture("active")} activeQuestionAnswered={false} />);
    const answeredHtml = renderToStaticMarkup(<ProfileDashboardPage fixture={getDashboardFixture("active")} activeQuestionAnswered />);

    expect(unansweredHtml).toContain("سؤال جدید هنوز پاسخ داده نشده");
    expect(unansweredHtml).toContain("نوشتن پاسخ کوتاه");
    expect(answeredHtml).not.toContain("سؤال جدید هنوز پاسخ داده نشده");
  });

  it("profile dashboard renders the no-profile state CTA", () => {
    const html = renderToStaticMarkup(<ProfileDashboardPage fixture={getDashboardFixture("none")} />);

    expect(html).toContain("پروفایل تجربه ساخته نشده");
    expect(html).toContain("شروع ساخت پروفایل تجربه");
    expect(html).toContain("کشف تجربه‌ها");
  });

  it("profile dashboard renders the inactive reactivation action", () => {
    const html = renderToStaticMarkup(<ProfileDashboardPage fixture={getDashboardFixture("inactive")} />);

    expect(html).toContain("پروفایل تجربه ناقص است");
    expect(html).toContain("تکمیل پروفایل تجربه");
  });

  it("profile builder renders V51 form sections, preview, and actions", () => {
    const html = renderToStaticMarkup(<ProfileBuilderPage />);

    expect(html).toContain("ساخت پروفایل تجربه");
    expect(html).toContain("آپلود عکس");
    expect(html).toContain("حوزه شغلی و زبان‌ها");
    expect(html).toContain("شناخت بهتر مسیر شما");
    expect(html).toContain("برای چه موضوعاتی بیشتر به یوزرآوا نیاز دارید؟");
    expect(html).toContain("تجربه شما بیشتر به درد چه کسانی می‌خورد؟");
    expect(html).toContain("سوابق تجربه");
    expect(html).toContain("معرفی حرفه‌ای");
    expect(html).toContain("کمک رایگان");
    expect(html).toContain("پیش‌نمایش پروفایل");
    expect(html).toContain("ذخیره پیش‌نویس");
    expect(html).toContain("ارسال برای بررسی");
  });

  it("organization-level pricing applies defaults and allows lower prices", () => {
    const updated = updateDraftOrgLevel(initialBuilderDraft, "کارشناس");
    const lowerThanCap = { ...updated, price30: 200000, price60: 350000 };
    const errors = validateProfileDraft(lowerThanCap);

    expect(updated.price30).toBe(300000);
    expect(updated.price60).toBe(500000);
    expect(errors.price30).toBeUndefined();
    expect(errors.price60).toBeUndefined();
    expect(profileDraftIsValid(lowerThanCap)).toBe(true);
  });

  it("pricing validation blocks values above organization caps", () => {
    const draft = { ...updateDraftOrgLevel(initialBuilderDraft, "کارشناس"), price30: 350000 };
    const errors = validateProfileDraft(draft);

    expect(errors.price30).toContain("حداکثر قیمت ۳۰ دقیقه");
  });

  it("invalid builder draft renders disabled submit and validation messages", () => {
    const invalidDraft = { ...initialBuilderDraft, displayName: "", role: "", summary: "", categories: [], companies: [], languages: [], price30: 1200000 };
    const html = renderToStaticMarkup(<ProfileBuilderPage initialDraft={invalidDraft} />);

    expect(html).toContain("disabled=\"\"");
    expect(validateProfileDraft(invalidDraft).displayName).toBe("نام نمایشی را کامل کن.");
    expect(validateProfileDraft(invalidDraft).categories).toBe("حوزه شغلی را از لیست انتخاب کن.");
    expect(validateProfileDraft(invalidDraft).summary).toBe("معرفی حرفه‌ای باید حداقل ۲۰ کاراکتر باشد.");
  });

  it("unified profile motivation options render with other last and removed options absent", () => {
    const html = renderToStaticMarkup(<ProfileBuilderPage />);
    const labels = userMotivationOptions.map((option) => option.label);

    expect(html).toContain("برای چه موضوعاتی بیشتر به یوزرآوا نیاز دارید؟");
    expect(html).toContain("رشد و پیشرفت در مسیر شغلی");
    expect(html).toContain("کسب درآمد جانبی");
    expect(html).toContain("کمک به دیگران");
    expect(html).not.toContain("افزایش درآمد");
    expect(html).not.toContain("کمک به دیگران با تجربه واقعی خودم");
    expect(html).not.toContain("ساخت اعتبار حرفه‌ای");
    expect(html).not.toContain("شبکه‌سازی حرفه‌ای");
    expect(labels.at(-1)).toBe("سایر");
  });

  it("motivation validation requires one option and blocks more than three", () => {
    const withoutMotivation = { ...initialBuilderDraft, userMotivations: [] };
    const three = updateUserMotivationSelection(["CAREER_GROWTH", "CAREER_CHOICE"], "CAREER_CHANGE");
    const fourthAttempt = updateUserMotivationSelection(three.values, "RESUME_INTERVIEW");

    expect(validateProfileDraft(withoutMotivation).userMotivations).toBe("حداقل یک گزینه را انتخاب کنید.");
    expect(three.values).toEqual(["CAREER_GROWTH", "CAREER_CHOICE", "CAREER_CHANGE"]);
    expect(fourthAttempt.values).toEqual(three.values);
    expect(fourthAttempt.error).toBe("حداکثر سه گزینه را انتخاب کنید.");
  });

  it("motivation normalization maps deprecated values and drops removed values", () => {
    expect(normalizeUserMotivations(["INCREASE_INCOME", "HELP_OTHERS_WITH_EXPERIENCE", "PROFESSIONAL_NETWORKING", "BUILD_PROFESSIONAL_CREDIBILITY", "SIDE_INCOME"])).toEqual([
      "SIDE_INCOME",
      "HELP_OTHERS"
    ]);
  });

  it("motivation option shuffle is stable and keeps other as the final option", () => {
    const first = shuffleMotivationOptionsForUser(userMotivationOptions, "profile-ali");
    const second = shuffleMotivationOptionsForUser(userMotivationOptions, "profile-ali");
    const otherUser = shuffleMotivationOptionsForUser(userMotivationOptions, "profile-sara");

    expect(first.map((option) => option.value)).toEqual(second.map((option) => option.value));
    expect(first.at(-1)?.value).toBe("OTHER");
    expect(otherUser.at(-1)?.value).toBe("OTHER");
  });

  it("other motivation requires trimmed text and clears when deselected", () => {
    const withOther = { ...initialBuilderDraft, userMotivations: ["OTHER" as const], userMotivationOtherText: "   " };
    const tooLong = { ...withOther, userMotivationOtherText: "الف".repeat(121) };
    const deselected = updateUserMotivationSelection(withOther.userMotivations, "OTHER");

    expect(validateProfileDraft(withOther).userMotivationOtherText).toBe("موضوع موردنظر را کوتاه بنویسید.");
    expect(validateProfileDraft(tooLong).userMotivationOtherText).toBe("حداکثر ۱۲۰ کاراکتر بنویسید.");
    expect(deselected.values).toEqual([]);
    expect(deselected.otherTextShouldClear).toBe(true);
  });

  it("free-help mode sets prices to zero and renders disabled price inputs", () => {
    const freeDraft = setFreeHelp(initialBuilderDraft, true);
    const html = renderToStaticMarkup(<ProfileBuilderPage initialDraft={freeDraft} />);

    expect(freeDraft.price30).toBe(0);
    expect(freeDraft.price60).toBe(0);
    expect(validateProfileDraft(freeDraft).price30).toBeUndefined();
    expect(html).toContain("checked=\"\"");
    expect(html).toContain("disabled=\"\"");
  });

  it("professional summary counter preserves V51 Persian format", () => {
    expect(faSummaryCount("")).toBe("۰ / ۲۵۰");
  });

  it("professional summary validates 250 characters without silent truncation and trims before save", () => {
    const longSummary = "a".repeat(251);
    const paddedSummary = `  ${initialBuilderDraft.summary}  `;
    const longDraft = { ...initialBuilderDraft, summary: longSummary };
    const result = submitProfileForReview({ ...initialBuilderDraft, summary: paddedSummary });

    expect(validateProfileDraft(longDraft).summary).toBe("معرفی حرفه‌ای حداکثر می‌تواند ۲۵۰ کاراکتر باشد.");
    expect(profileDraftIsValid(longDraft)).toBe(false);
    expect(result.profile?.professionalSummary).toBe(initialBuilderDraft.summary);
    expect(longDraft.summary).toHaveLength(251);
  });

  it("mock submit for review moves a valid draft to pending_review", () => {
    const result = submitProfileForReview(initialBuilderDraft);

    expect(result.status).toBe("pending_review");
    expect(result.profile?.name).toBe(initialBuilderDraft.displayName);
    expect(result.profile?.userMotivations).toEqual(initialBuilderDraft.userMotivations);
  });

  it("mock profile status actions follow the handoff state machine", () => {
    expect(transitionProfileStatus("active", "deactivate_profile")).toBe("inactive");
    expect(transitionProfileStatus("inactive", "reactivate_requires_review")).toBe("pending_review");
    expect(transitionProfileStatus("pending_review", "deactivate_profile")).toBe("pending_review");
  });

  it("company, category, and language chip helpers prevent duplicates and remove selections", () => {
    expect(addCompanyTag(["اسنپ"], "اسنپ")).toEqual(["اسنپ"]);
    expect(addCompanyTag(["اسنپ"], "دیوار")).toEqual(["اسنپ", "دیوار"]);
    expect(removeCompanyTag(["اسنپ", "دیوار"], "اسنپ")).toEqual(["دیوار"]);
    expect(toggleSelection(["فارسی"], "انگلیسی")).toEqual(["فارسی", "انگلیسی"]);
    expect(toggleSelection(["فارسی", "انگلیسی"], "فارسی")).toEqual(["انگلیسی"]);
  });

  it("avatar validation preserves V51 file type and size rules", () => {
    expect(validateAvatarCandidate({ type: "image/gif", size: 1000 })).toBe("فرمت عکس باید PNG، JPG یا WebP باشد.");
    expect(validateAvatarCandidate({ type: "image/png", size: 3 * 1024 * 1024 })).toBe("حجم عکس نباید بیشتر از ۲ مگابایت باشد.");
    expect(validateAvatarCandidate({ type: "image/webp", size: 1024 })).toBe("");
  });
});
