"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { UseravaaLogo } from "@/components/logo/UseravaaLogo";
import { Avatar } from "@/components/ui/Avatar";
import { StatChip } from "@/components/ui/StatChip";
import { UseravaaIcon } from "@/components/ui/UseravaaIcon";
import { formatFaNumber } from "@/lib/fa-format";
import {
  allJobCategoriesFilterLabel,
  currentInsightQuestionCycle,
  getFilteredInsightCards,
  getInsightAuthor,
  getInsightPromptHeader,
  publishedInsights,
  type PublishedInsight
} from "@/features/v51/data/experience-discovery";
import {
  getInsightAnswerCharacterCount,
  insightAudienceOptions,
  insightAudienceRequiredError,
  insightAnswerIsWithinLimit,
  insightAnswerMaxLength,
  limitInsightAnswerInput,
  publishExperienceAnswer,
  weeklyQuestionCopy,
  type ExperienceAnswer,
  type InsightAudienceIntent
} from "@/features/v51/data/experience-questions";
import type { JobField } from "@/features/v51/data/job-fields";
import { categoryOptions } from "@/features/v51/data/profiles";
import { useSavedItems } from "@/features/v51/saved/useSavedItems";
import styles from "./InsightsPage.module.css";
import {
  buildInsightShareExportData,
  copyInsightCanonicalUrl,
  downloadInsightShareImage,
  getInsightShareAnswerTypography,
  type InsightShareExportData
} from "./insight-share-export";

type OpenFilter = "jobCategory" | null;

export type InsightsViewer = Readonly<{
  id: string;
  displayName?: string;
  avatarUrl?: string;
}> | null;

type InsightsPageProps = Readonly<{
  initialCategory?: JobField | "";
  initialOpenFilter?: OpenFilter;
  initialDownloadInsightId?: string;
  initialAnswerComposerOpen?: boolean;
  initialAuthPromptOpen?: boolean;
  initialAnswerDraft?: string;
  initialHasExperienceProfile?: boolean;
  initialSavedInsightIds?: readonly string[];
  viewer?: InsightsViewer;
  jobCategoryOptions?: readonly JobField[];
}>;

const initialVisibleCount = 4;
const emptySavedInsightIds: readonly string[] = [];
const currentViewerProfileId = "ali";

function classNames(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function InlineFilterPopover({
  title,
  options,
  selectedValue,
  onSelect,
  onClose
}: Readonly<{
  title: string;
  options: readonly string[];
  selectedValue: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}>) {
  return (
    <>
      <button className={styles.popoverBackdrop} type="button" aria-label="بستن فیلتر" onClick={onClose} />
      <div className={styles.popover} role="dialog" aria-label={title}>
        <strong>{title}</strong>
        <button className={classNames(styles.option, selectedValue === "" && styles.optionSelected)} type="button" onClick={() => onSelect("")}>
          <span className="button-label">{allJobCategoriesFilterLabel}</span>
        </button>
        {options.map((option) => (
          <button
            className={classNames(styles.option, selectedValue === option && styles.optionSelected)}
            key={option}
            type="button"
            onClick={() => onSelect(option)}
          >
            <span className="button-label">{option}</span>
          </button>
        ))}
      </div>
    </>
  );
}

function InsightMasthead() {
  return (
    <header className={styles.masthead}>
      <div className={styles.mastheadCopy}>
        <h1>بینش‌ها</h1>
        <p>تجربه‌های کوتاه و واقعی برای تصمیم‌های شغلی بهتر.</p>
      </div>
    </header>
  );
}

function JobCategoryFilterModule({
  selectedJobCategory,
  categoryOptions,
  openFilter,
  onOpenFilter,
  onSelectJobCategory,
  onCloseFilter
}: Readonly<{
  selectedJobCategory: JobField | "";
  categoryOptions: readonly JobField[];
  openFilter: OpenFilter;
  onOpenFilter: (filter: OpenFilter) => void;
  onSelectJobCategory: (value: JobField | "") => void;
  onCloseFilter: () => void;
}>) {
  return (
    <section className={styles.filterModule} aria-label="دسته‌بندی شغلی بینش‌ها">
      <div className={styles.inlineFilters}>
        در حال خواندن بینش‌های{" "}
        <span className={styles.filterTokenWrap}>
          <button
            className={styles.filterToken}
            type="button"
            aria-label="دسته‌بندی شغلی"
            onClick={() => onOpenFilter(openFilter === "jobCategory" ? null : "jobCategory")}
          >
            <span className="button-label">{selectedJobCategory || allJobCategoriesFilterLabel}</span>
            <UseravaaIcon name="dropdown" size={16} />
          </button>
          {openFilter === "jobCategory" ? (
            <InlineFilterPopover
              title="دسته‌بندی شغلی"
              options={categoryOptions}
              selectedValue={selectedJobCategory}
              onSelect={(value) => onSelectJobCategory(value as JobField | "")}
              onClose={onCloseFilter}
            />
          ) : null}
        </span>
      </div>
    </section>
  );
}

function ActiveQuestionBar({
  viewer,
  onOpenAnswerComposer,
  onOpenAuthPrompt
}: Readonly<{
  viewer: InsightsViewer;
  onOpenAnswerComposer: () => void;
  onOpenAuthPrompt: () => void;
}>) {
  const viewerFirstName = viewer?.displayName?.trim().split(/\s+/)[0];
  const isAuthenticated = Boolean(viewer);
  const headline = isAuthenticated && viewerFirstName ? `${viewerFirstName}، یک سؤال جدید داری` : "یک سؤال جدید برای پاسخ کوتاه";
  const questionText = isAuthenticated
    ? currentInsightQuestionCycle.questionText
    : "در نقش شما، چه چیزی بیرون ساده به نظر می‌رسد اما در عمل سخت‌تر است؟";
  const helperText = isAuthenticated
    ? "پاسخ کوتاه شما در پروفایل تجربه‌تان منتشر می‌شود."
    : "پاسخ کوتاه شما می‌تواند به تصمیم شغلی دیگران کمک کند.";

  return (
    <section className={styles.questionBar} aria-label="سؤال جدید">
      <div className={styles.questionContentSide}>
        {viewer?.avatarUrl ? <Avatar src={viewer.avatarUrl} alt="" size="profile" className={styles.questionAvatar} /> : null}
        <div className={styles.questionCopy}>
          <div className={styles.questionLabel}>
            <UseravaaIcon name="insight" size={18} />
            <span>سؤال جدید</span>
          </div>
          <p className={styles.questionHeadline}>{headline}</p>
          <h2>{questionText}</h2>
          <small>{helperText}</small>
        </div>
      </div>
      <div className={styles.questionActions}>
        <button type="button" onClick={isAuthenticated ? onOpenAnswerComposer : onOpenAuthPrompt}>
          <span className="button-label">نوشتن پاسخ کوتاه</span>
        </button>
        <small>حداکثر ۲۸۰ کاراکتر</small>
      </div>
    </section>
  );
}

function InsightCard({
  insight,
  isSaved,
  onSave
}: Readonly<{
  insight: PublishedInsight;
  isSaved: boolean;
  onSave: (insightId: string) => void;
}>) {
  const author = getInsightAuthor(insight);

  if (!author) {
    return null;
  }

  return (
    <article className={styles.insightCard}>
      <div className={styles.cardHeader}>
        <p className={styles.promptHeader}>{getInsightPromptHeader(insight)}</p>
        <div className={styles.cardUtilities}>
          <small>{insight.relativeDateFa}</small>
          <button className={styles.iconAction} type="button" aria-label="ذخیره" aria-pressed={isSaved} onClick={() => onSave(insight.id)}>
            <UseravaaIcon name="save" size={18} />
            <span className={styles.srOnly}>{isSaved ? "ذخیره‌شده" : "ذخیره"}</span>
          </button>
        </div>
      </div>
      <p className={styles.quote}>{insight.answerText}</p>
      <div className={styles.authorLine}>
        <Avatar src={author.avatarUrl} alt="" size="lg" className={styles.avatar} />
        <div>
          <strong>{author.displayName}</strong>
          <span>
            {author.jobTitle} · {author.orgLevel}
          </span>
          <small>{author.experienceLine}</small>
        </div>
      </div>
      <div className={styles.cardActions}>
        <Link className={styles.primaryAction} href={author.profileUrl}>
          <span className="button-label">مشاهده تجربه</span>
        </Link>
      </div>
    </article>
  );
}

export function InsightShareModal({
  shareData,
  onClose
}: Readonly<{
  shareData: InsightShareExportData | null;
  onClose: () => void;
}>) {
  const [statusMessage, setStatusMessage] = useState("");

  if (!shareData) {
    return null;
  }

  const activeShareData = shareData;
  const answerTypography = getInsightShareAnswerTypography(shareData.insight.answerText);

  async function copyLink() {
    const didCopy = await copyInsightCanonicalUrl(activeShareData);
    setStatusMessage(didCopy ? "لینک کپی شد." : "لینک این بینش آماده است.");
  }

  async function saveImage() {
    await downloadInsightShareImage(activeShareData);
    setStatusMessage("تصویر بینش دانلود شد.");
  }

  return (
    <div className={styles.modalScrim} role="presentation">
      <div className={styles.previewModal} role="dialog" aria-modal="true" aria-label="دانلود تصویر کارت" dir="rtl">
        <div className={styles.modalHead}>
          <h2>دانلود تصویر کارت</h2>
          <button className={styles.modalCloseButton} type="button" aria-label="بستن" onClick={onClose}>
            <UseravaaIcon name="close" size={18} />
          </button>
        </div>
        <div className={styles.sharePreview}>
          <div className={styles.previewProvider}>
            <Avatar src={shareData.provider.avatarUrl} alt={`تصویر پروفایل ${shareData.provider.name}`} size="lg" className={styles.previewAvatarImage} />
            <div>
              <strong>{shareData.provider.name}</strong>
              <span>{shareData.provider.subtitle}</span>
            </div>
          </div>
          <div className={styles.previewBrandRow}>
            <UseravaaLogo variant="wordmark" className={styles.previewLogo} />
          </div>
          <div className={styles.previewQuotePanel}>
            <span>{shareData.insight.promptHeader}</span>
            <p
              className={classNames(
                answerTypography.sizeClass === "short" && styles.previewAnswerShort,
                answerTypography.sizeClass === "medium" && styles.previewAnswerMedium,
                answerTypography.sizeClass === "long" && styles.previewAnswerLong,
                answerTypography.sizeClass === "stress" && styles.previewAnswerStress
              )}
            >
              {shareData.insight.answerText}
            </p>
          </div>
          <footer>
            <b>{shareData.insight.canonicalUrl}</b>
          </footer>
        </div>
        <div className={styles.modalActions}>
          <button className={styles.primaryAction} type="button" onClick={saveImage}>
            <UseravaaIcon name="download" size={18} />
            <span className="button-label">دانلود تصویر کارت</span>
          </button>
          <button className={styles.textAction} type="button" onClick={copyLink}>
            <UseravaaIcon name="link" size={18} />
            <span className="button-label">کپی لینک</span>
          </button>
        </div>
        {statusMessage ? <p className={styles.modalStatus}>{statusMessage}</p> : null}
      </div>
    </div>
  );
}

function InsightAuthPromptModal({ onClose }: Readonly<{ onClose: () => void }>) {
  const returnTo = "/insights?answer=active";

  return (
    <div className={styles.modalScrim} role="presentation">
      <div className={styles.authPromptModal} role="dialog" aria-modal="true" aria-label="برای نوشتن پاسخ وارد شوید" dir="rtl">
        <div className={styles.modalHead}>
          <h2>برای نوشتن پاسخ وارد شوید</h2>
          <button className={styles.modalCloseButton} type="button" aria-label="بستن" onClick={onClose}>
            <UseravaaIcon name="close" size={18} />
          </button>
        </div>
        <p>برای ثبت پاسخ کوتاه، ابتدا وارد حساب خود شوید یا یک حساب بسازید.</p>
        <div className={styles.authPromptActions}>
          <Link className={styles.authPromptPrimary} href={`/login?returnTo=${encodeURIComponent(returnTo)}`}>
            <span className="button-label">ورود</span>
          </Link>
          <Link className={styles.authPromptSecondary} href={`/register?returnTo=${encodeURIComponent(returnTo)}`}>
            <span className="button-label">ساخت حساب</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function InsightAnswerComposerModal({
  answerDraft,
  audienceIntents,
  hasExperienceProfile,
  responsibilityAccepted,
  message,
  ownerShareData,
  onAnswerChange,
  onAudienceIntentToggle,
  onResponsibilityChange,
  onPublish,
  onDownloadOwnerCard,
  onCopyOwnerLink,
  onEditPublishedInsight,
  onClose
}: Readonly<{
  answerDraft: string;
  audienceIntents: readonly InsightAudienceIntent[];
  hasExperienceProfile: boolean;
  responsibilityAccepted: boolean;
  message: string;
  ownerShareData: InsightShareExportData | null;
  onAnswerChange: (value: string) => void;
  onAudienceIntentToggle: (value: InsightAudienceIntent) => void;
  onResponsibilityChange: (value: boolean) => void;
  onPublish: () => void;
  onDownloadOwnerCard: () => void;
  onCopyOwnerLink: () => void;
  onEditPublishedInsight: () => void;
  onClose: () => void;
}>) {
  const count = getInsightAnswerCharacterCount(answerDraft);
  const isWithinLimit = insightAnswerIsWithinLimit(answerDraft);
  const canSubmit = Boolean(answerDraft.trim()) && isWithinLimit && audienceIntents.length > 0;

  if (ownerShareData) {
    return (
      <div className={styles.modalScrim} role="presentation">
        <div className={styles.answerModal} role="dialog" aria-modal="true" aria-label="بینش منتشر شد">
          <div className={styles.modalHead}>
            <h2>بینش شما منتشر شد</h2>
            <button className={styles.modalCloseButton} type="button" aria-label="بستن" onClick={onClose}>
              <UseravaaIcon name="close" size={18} />
            </button>
          </div>
          <div className={styles.answerSuccess}>
            <p>بینش شما در پروفایل تجربه‌تان نمایش داده می‌شود.</p>
            <div className={styles.successActions}>
              <button className={styles.primaryAction} type="button" onClick={onDownloadOwnerCard}>
                <UseravaaIcon name="download" size={18} />
                <span className="button-label">دانلود تصویر کارت</span>
              </button>
              <button className={styles.textAction} type="button" onClick={onCopyOwnerLink}>
                <UseravaaIcon name="link" size={18} />
                <span className="button-label">کپی لینک</span>
              </button>
              <button className={styles.textAction} type="button" onClick={onEditPublishedInsight}>
                <UseravaaIcon name="edit" size={18} />
                <span className="button-label">ویرایش بینش</span>
              </button>
              <Link className={styles.textAction} href="/profiles/ali">
                <span className="button-label">مشاهده در پروفایل</span>
              </Link>
            </div>
            {message ? <p className={styles.modalStatus}>{message}</p> : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.modalScrim} role="presentation">
      <div className={styles.answerModal} role="dialog" aria-modal="true" aria-label="نوشتن پاسخ کوتاه">
        <div className={styles.modalHead}>
          <h2>نوشتن پاسخ کوتاه</h2>
          <button className={styles.modalCloseButton} type="button" aria-label="بستن" onClick={onClose}>
            <UseravaaIcon name="close" size={18} />
          </button>
        </div>
        {!hasExperienceProfile ? (
          <div className={styles.noProfileAnswer}>
            <p>برای پاسخ دادن، اول پروفایل تجربه بسازید.</p>
            <Link className={styles.primaryAction} href="/profile/build">
              <span className="button-label">ساخت پروفایل تجربه</span>
            </Link>
          </div>
        ) : (
          <>
            <div className={styles.answerModalBody}>
              <div className={styles.answerQuestion}>
                <span>سؤال جدید</span>
                <p>{currentInsightQuestionCycle.questionText}</p>
                <small>پاسخ کوتاه شما در پروفایل تجربه‌تان منتشر می‌شود.</small>
              </div>
              <label className={styles.answerField} htmlFor="insightAnswerDraft">
                <span>پاسخ شما</span>
                <textarea
                  id="insightAnswerDraft"
                  value={answerDraft}
                  maxLength={insightAnswerMaxLength}
                  aria-describedby="insightAnswerHelper insightAnswerCounter"
                  placeholder="تجربه خود را کوتاه، مشخص و بر اساس واقعیت بنویسید..."
                  onChange={(event) => onAnswerChange(limitInsightAnswerInput(event.target.value))}
                />
              </label>
              <div className={styles.answerMeta}>
                <small id="insightAnswerHelper">{weeklyQuestionCopy.answerLimitHelper}</small>
                <span
                  id="insightAnswerCounter"
                  className={classNames(styles.answerCounter, !isWithinLimit && styles.answerCounterInvalid)}
                >
                  {formatFaNumber(count)} / {formatFaNumber(insightAnswerMaxLength)}
                </span>
              </div>
              <fieldset className={styles.answerAudience}>
                <legend>این نکته بیشتر به درد چه کسانی می‌خورد؟</legend>
                <p>کمک می‌کند بینش شما به آدم‌های درست‌تری نمایش داده شود.</p>
                {insightAudienceOptions.map((option) => (
                  <label className={classNames(styles.audienceCard, audienceIntents.includes(option.id) && styles.audienceCardSelected)} key={option.id}>
                    <input
                      type="checkbox"
                      value={option.id}
                      checked={audienceIntents.includes(option.id)}
                      onChange={() => onAudienceIntentToggle(option.id)}
                    />
                    <span>
                      <b>{option.title}</b>
                      <small>{option.description}</small>
                    </span>
                    {audienceIntents.includes(option.id) ? <UseravaaIcon name="check" size={18} /> : null}
                  </label>
                ))}
              </fieldset>
              {!isWithinLimit ? <p className={styles.answerValidation}>{weeklyQuestionCopy.answerLimitError}</p> : null}
              {!audienceIntents.length && message === insightAudienceRequiredError ? <p className={styles.answerValidation}>{message}</p> : null}
              <label className={styles.answerResponsibility}>
                <input type="checkbox" checked={responsibilityAccepted} onChange={(event) => onResponsibilityChange(event.target.checked)} />
                <span>مسئولیت محتوای این پاسخ با من است.</span>
              </label>
              {message && message !== insightAudienceRequiredError ? <p className={styles.modalStatus}>{message}</p> : null}
            </div>
            <div className={styles.answerStickyFooter}>
              <button className={styles.primaryAction} type="button" disabled={!responsibilityAccepted || !canSubmit} onClick={onPublish}>
                <span className="button-label">انتشار بینش</span>
              </button>
              <button className={styles.textAction} type="button" onClick={onClose}>
                <span className="button-label">بستن</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function InsightsPage({
  initialCategory = "",
  initialOpenFilter = null,
  initialDownloadInsightId,
  initialAnswerComposerOpen = false,
  initialAuthPromptOpen = false,
  initialAnswerDraft = "",
  initialHasExperienceProfile = true,
  initialSavedInsightIds = emptySavedInsightIds,
  viewer = null,
  jobCategoryOptions
}: InsightsPageProps) {
  const isAuthenticated = Boolean(viewer);
  const [selectedJobCategory, setSelectedJobCategory] = useState<JobField | "">(initialCategory);
  const [openFilter, setOpenFilter] = useState<OpenFilter>(initialOpenFilter);
  const [visibleCount, setVisibleCount] = useState(initialVisibleCount);
  const { savedInsightIds, toggleSavedInsight: toggleSavedInsightId } = useSavedItems([], initialSavedInsightIds);
  const [savedStatusMessage, setSavedStatusMessage] = useState("");
  const [shareData, setShareData] = useState<InsightShareExportData | null>(() => {
    const initialInsight = initialDownloadInsightId
      ? publishedInsights.find((insight) => insight.id === initialDownloadInsightId || insight.slug === initialDownloadInsightId)
      : null;

    return initialInsight?.profileId === currentViewerProfileId ? buildInsightShareExportData(initialInsight.id) : null;
  });
  const [answerComposerOpen, setAnswerComposerOpen] = useState(isAuthenticated && initialAnswerComposerOpen);
  const [authPromptOpen, setAuthPromptOpen] = useState(!isAuthenticated && (initialAuthPromptOpen || initialAnswerComposerOpen));
  const [answerDraft, setAnswerDraft] = useState(limitInsightAnswerInput(initialAnswerDraft));
  const [answerAudienceIntents, setAnswerAudienceIntents] = useState<InsightAudienceIntent[]>([]);
  const [answerResponsibilityAccepted, setAnswerResponsibilityAccepted] = useState(false);
  const [answerMessage, setAnswerMessage] = useState("");
  const [createdOwnerShareData, setCreatedOwnerShareData] = useState<InsightShareExportData | null>(null);
  const resolvedCategoryOptions = jobCategoryOptions ?? categoryOptions;

  const filteredInsights = useMemo(
    () => getFilteredInsightCards(selectedJobCategory, ""),
    [selectedJobCategory]
  );

  const visibleInsights = filteredInsights.slice(0, visibleCount);
  const initialCards = visibleInsights.slice(0, initialVisibleCount);
  const moreCards = visibleInsights.slice(initialVisibleCount);
  const hasMore = visibleCount < filteredInsights.length;

  function selectJobCategory(value: JobField | "") {
    setSelectedJobCategory(value);
    setVisibleCount(initialVisibleCount);
    setOpenFilter(null);
  }

  function resetFilters() {
    setSelectedJobCategory("");
    setVisibleCount(initialVisibleCount);
    setOpenFilter(null);
  }

  function openAnswerFlow() {
    if (!isAuthenticated) {
      setAuthPromptOpen(true);
      return;
    }

    setAnswerComposerOpen(true);
  }

  function handleSavedInsightToggle(insightId: string) {
    const willBeSaved = !savedInsightIds.includes(insightId);
    toggleSavedInsightId(insightId);
    setSavedStatusMessage(willBeSaved ? "بینش ذخیره شد. از بخش ذخیره‌شده‌ها می‌توانید دوباره آن را ببینید." : "از ذخیره‌شده‌ها حذف شد.");
  }

  function handleAnswerDraftChange(value: string) {
    setAnswerDraft(limitInsightAnswerInput(value));
    setAnswerMessage("");
    setCreatedOwnerShareData(null);
  }

  function toggleAnswerAudienceIntent(value: InsightAudienceIntent) {
    setAnswerAudienceIntents((current) => (current.includes(value) ? current.filter((item) => item !== value) : [...current, value]));
    setAnswerMessage("");
    setCreatedOwnerShareData(null);
  }

  function createDraftAnswer(): ExperienceAnswer {
    return {
      id: "insight-answer-draft",
      profileId: "ali",
      questionId: currentInsightQuestionCycle.id,
      renderedQuestion: currentInsightQuestionCycle.questionText,
      answer: answerDraft,
      audienceIntents: answerAudienceIntents,
      status: "draft",
      publishedAt: null
    };
  }

  function publishAnswer() {
    const result = publishExperienceAnswer(createDraftAnswer(), answerResponsibilityAccepted);

    if (!result.published) {
      setAnswerMessage(result.error);
      return;
    }

    setAnswerMessage("بینش شما منتشر شد.");
    setCreatedOwnerShareData(buildInsightShareExportData("insight-ali-path-1"));
  }

  function editPublishedAnswer() {
    setCreatedOwnerShareData(null);
    setAnswerMessage("می‌توانید متن بینش را ویرایش و دوباره منتشر کنید.");
  }

  async function copyCreatedOwnerInsightLink() {
    if (!createdOwnerShareData) {
      return;
    }

    const didCopy = await copyInsightCanonicalUrl(createdOwnerShareData);
    setAnswerMessage(didCopy ? "لینک کپی شد." : "لینک این بینش آماده است.");
  }

  async function downloadCreatedOwnerInsightCard() {
    if (!createdOwnerShareData) {
      return;
    }

    await downloadInsightShareImage(createdOwnerShareData);
    setAnswerMessage("تصویر کارت دانلود شد.");
  }

  return (
    <section className={styles.page}>
      <InsightMasthead />
      {initialHasExperienceProfile ? (
        <ActiveQuestionBar viewer={viewer} onOpenAnswerComposer={openAnswerFlow} onOpenAuthPrompt={() => setAuthPromptOpen(true)} />
      ) : null}
      <JobCategoryFilterModule
        selectedJobCategory={selectedJobCategory}
        categoryOptions={resolvedCategoryOptions}
        openFilter={openFilter}
        onOpenFilter={setOpenFilter}
        onSelectJobCategory={selectJobCategory}
        onCloseFilter={() => setOpenFilter(null)}
      />

      <div className={styles.feedHeader}>
        <h2 className={styles.feedHeading}>تازه‌ترین بینش‌ها</h2>
        <StatChip className={styles.feedCountChip} icon="insight" value={filteredInsights.length} label="بینش برای خواندن" />
      </div>

      {filteredInsights.length ? (
        <>
          <div className={styles.cardGrid}>
            {initialCards.map((insight) => (
              <InsightCard
                key={insight.id}
                insight={insight}
                isSaved={savedInsightIds.includes(insight.id)}
                onSave={handleSavedInsightToggle}
              />
            ))}
          </div>

          <section className={styles.contributionReminder}>
            <div>
              <h2>تجربه‌ای برای پاسخ به سؤال جدید دارید؟</h2>
              <p>
                {isAuthenticated
                  ? "با یک پاسخ کوتاه، تجربه خود را به پروفایل‌تان وصل کنید و در بینش‌ها دیده شوید."
                  : "با یک پاسخ کوتاه، تجربه خود را به شکلی روشن و قابل استفاده با دیگران به اشتراک بگذارید."}
              </p>
            </div>
            <button type="button" onClick={openAnswerFlow}>
              <span className="button-label">نوشتن پاسخ کوتاه</span>
            </button>
          </section>

          {moreCards.length ? (
            <div className={styles.cardGrid}>
              {moreCards.map((insight) => (
                <InsightCard
                  key={insight.id}
                  insight={insight}
                  isSaved={savedInsightIds.includes(insight.id)}
                  onSave={handleSavedInsightToggle}
                />
              ))}
            </div>
          ) : null}

          {hasMore ? (
            <div className={styles.loadMoreRow}>
              <button type="button" onClick={() => setVisibleCount((current) => current + 4)}>
                <span className="button-label">نمایش بینش‌های بیشتر</span>
              </button>
            </div>
          ) : null}
        </>
      ) : (
        <section className={styles.emptyState}>
          <h2>برای این ترکیب هنوز بینشی نداریم.</h2>
          <button type="button" onClick={resetFilters}>
            <span className="button-label">دیدن همه بینش‌ها</span>
          </button>
        </section>
      )}

      {savedStatusMessage ? <p className={styles.savedStatus}>{savedStatusMessage}</p> : null}
      <footer className={styles.footer}>Useravaa · بینش‌های کوتاه از تجربه‌های واقعی</footer>
      <InsightShareModal shareData={shareData} onClose={() => setShareData(null)} />
      {authPromptOpen ? <InsightAuthPromptModal onClose={() => setAuthPromptOpen(false)} /> : null}
      {answerComposerOpen ? (
        <InsightAnswerComposerModal
          answerDraft={answerDraft}
          audienceIntents={answerAudienceIntents}
          hasExperienceProfile={initialHasExperienceProfile}
          responsibilityAccepted={answerResponsibilityAccepted}
          message={answerMessage}
          ownerShareData={createdOwnerShareData}
          onAnswerChange={handleAnswerDraftChange}
          onAudienceIntentToggle={toggleAnswerAudienceIntent}
          onResponsibilityChange={setAnswerResponsibilityAccepted}
          onPublish={publishAnswer}
          onDownloadOwnerCard={downloadCreatedOwnerInsightCard}
          onCopyOwnerLink={copyCreatedOwnerInsightLink}
          onEditPublishedInsight={editPublishedAnswer}
          onClose={() => setAnswerComposerOpen(false)}
        />
      ) : null}
    </section>
  );
}
