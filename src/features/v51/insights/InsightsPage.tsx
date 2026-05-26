"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { UseravaaIcon } from "@/components/ui/UseravaaIcon";
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
import { myProfileDashboardFixture } from "@/features/v51/data/my-profile";
import { categoryOptions, formatter } from "@/features/v51/data/profiles";
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

type InsightsPageProps = Readonly<{
  initialCategory?: JobField | "";
  initialOpenFilter?: OpenFilter;
  initialDownloadInsightId?: string;
  initialAnswerComposerOpen?: boolean;
  initialAnswerDraft?: string;
  initialHasExperienceProfile?: boolean;
  initialSavedInsightIds?: readonly string[];
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
          {allJobCategoriesFilterLabel}
        </button>
        {options.map((option) => (
          <button
            className={classNames(styles.option, selectedValue === option && styles.optionSelected)}
            key={option}
            type="button"
            onClick={() => onSelect(option)}
          >
            {option}
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
  openFilter,
  onOpenFilter,
  onSelectJobCategory,
  onCloseFilter
}: Readonly<{
  selectedJobCategory: JobField | "";
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
            <span>{selectedJobCategory || allJobCategoriesFilterLabel}</span>
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

function ActiveQuestionBar({ onOpenAnswerComposer }: Readonly<{ onOpenAnswerComposer: () => void }>) {
  const profile = myProfileDashboardFixture.profile;
  const profileFirstName = profile.name.trim().split(/\s+/)[0];
  const headline = profileFirstName ? `${profileFirstName}، یک سؤال جدید داری` : "یک سؤال جدید برای تجربه شما";

  return (
    <section className={styles.questionBar} aria-label="سؤال جدید">
      <div className={styles.questionContentSide}>
        <div className={styles.questionAvatar}>
          {profile.avatarUrl ? <span style={{ backgroundImage: `url(${profile.avatarUrl})` }} /> : profile.initials}
        </div>
        <div className={styles.questionCopy}>
          <div className={styles.questionLabel}>
            <UseravaaIcon name="insight" size={18} />
            <span>سؤال جدید</span>
          </div>
          <p className={styles.questionHeadline}>{headline}</p>
          <h2>{currentInsightQuestionCycle.questionText}</h2>
          <small>پاسخ کوتاه شما در پروفایل تجربه‌تان منتشر می‌شود.</small>
        </div>
      </div>
      <div className={styles.questionActions}>
        <button type="button" onClick={onOpenAnswerComposer}>
          نوشتن پاسخ کوتاه
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
        <div className={styles.avatar}>{author.initials}</div>
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
          مشاهده تجربه
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
  const [failedAvatarInsightId, setFailedAvatarInsightId] = useState<string | null>(null);

  if (!shareData) {
    return null;
  }

  const activeShareData = shareData;
  const shouldShowAvatar = Boolean(shareData.provider.avatarUrl && failedAvatarInsightId !== shareData.insight.id);
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
            {shouldShowAvatar && shareData.provider.avatarUrl ? (
              <Image
                className={styles.previewAvatarImage}
                src={shareData.provider.avatarUrl}
                alt={shareData.provider.name}
                width={48}
                height={48}
                onError={() => setFailedAvatarInsightId(shareData.insight.id)}
              />
            ) : (
              <span className={styles.previewAvatarFallback}>{shareData.provider.initials}</span>
            )}
            <div>
              <strong>{shareData.provider.name}</strong>
              <span>{shareData.provider.subtitle}</span>
            </div>
          </div>
          <div className={styles.previewBrandRow}>
            <Image className={styles.previewLogo} src={shareData.brand.logoAssetUrl} alt="Useravaa" width={152} height={48} />
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
            دانلود تصویر کارت
          </button>
          <button className={styles.textAction} type="button" onClick={copyLink}>
            <UseravaaIcon name="link" size={18} />
            کپی لینک
          </button>
        </div>
        {statusMessage ? <p className={styles.modalStatus}>{statusMessage}</p> : null}
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
                دانلود تصویر کارت
              </button>
              <button className={styles.textAction} type="button" onClick={onCopyOwnerLink}>
                <UseravaaIcon name="link" size={18} />
                کپی لینک
              </button>
              <button className={styles.textAction} type="button" onClick={onEditPublishedInsight}>
                <UseravaaIcon name="edit" size={18} />
                ویرایش بینش
              </button>
              <Link className={styles.textAction} href="/profiles/ali">
                مشاهده در پروفایل
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
              ساخت پروفایل تجربه
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
                  {count} / {insightAnswerMaxLength}
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
                انتشار بینش
              </button>
              <button className={styles.textAction} type="button" onClick={onClose}>
                بستن
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
  initialAnswerDraft = "",
  initialHasExperienceProfile = true,
  initialSavedInsightIds = emptySavedInsightIds
}: InsightsPageProps) {
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
  const [answerComposerOpen, setAnswerComposerOpen] = useState(initialAnswerComposerOpen);
  const [answerDraft, setAnswerDraft] = useState(limitInsightAnswerInput(initialAnswerDraft));
  const [answerAudienceIntents, setAnswerAudienceIntents] = useState<InsightAudienceIntent[]>([]);
  const [answerResponsibilityAccepted, setAnswerResponsibilityAccepted] = useState(false);
  const [answerMessage, setAnswerMessage] = useState("");
  const [createdOwnerShareData, setCreatedOwnerShareData] = useState<InsightShareExportData | null>(null);

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
      {initialHasExperienceProfile ? <ActiveQuestionBar onOpenAnswerComposer={() => setAnswerComposerOpen(true)} /> : null}
      <JobCategoryFilterModule
        selectedJobCategory={selectedJobCategory}
        openFilter={openFilter}
        onOpenFilter={setOpenFilter}
        onSelectJobCategory={selectJobCategory}
        onCloseFilter={() => setOpenFilter(null)}
      />

      <div className={styles.feedHeader}>
        <h2 className={styles.feedHeading}>تازه‌ترین بینش‌ها</h2>
        <span>
          <UseravaaIcon name="insight" size={16} aria-hidden="true" />
          {formatter.format(filteredInsights.length)} بینش برای خواندن
        </span>
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
              <p>با یک پاسخ کوتاه، تجربه خود را به پروفایل‌تان وصل کنید و در بینش‌ها دیده شوید.</p>
            </div>
            <button type="button" onClick={() => setAnswerComposerOpen(true)}>
              نوشتن پاسخ کوتاه
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
                نمایش بینش‌های بیشتر
              </button>
            </div>
          ) : null}
        </>
      ) : (
        <section className={styles.emptyState}>
          <h2>برای این ترکیب هنوز بینشی نداریم.</h2>
          <button type="button" onClick={resetFilters}>
            دیدن همه بینش‌ها
          </button>
        </section>
      )}

      {savedStatusMessage ? <p className={styles.savedStatus}>{savedStatusMessage}</p> : null}
      <footer className={styles.footer}>Useravaa · بینش‌های کوتاه از تجربه‌های واقعی</footer>
      <InsightShareModal shareData={shareData} onClose={() => setShareData(null)} />
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
