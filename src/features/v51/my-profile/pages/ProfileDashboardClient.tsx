"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { UseravaaIcon } from "@/components/ui/UseravaaIcon";
import {
  profileBuilderDraftStorageKey,
  profileFromBuilderDraft,
  transitionProfileStatus,
  type ExperienceProfileStatus,
  type MyExperienceProfile,
  type MyProfileDashboardFixture,
  type ProfileBuilderDraft
} from "@/features/v51/data/my-profile";
import { getInsightPromptHeader, publishedInsights } from "@/features/v51/data/experience-discovery";
import {
  getInsightAnswerCharacterCount,
  insightAnswerMaxLength,
  insightAudienceOptions,
  limitInsightAnswerInput,
  type InsightAudienceIntent
} from "@/features/v51/data/experience-questions";
import { formatter, toman } from "@/features/v51/data/profiles";
import { buildInsightShareExportData, copyInsightCanonicalUrl, downloadInsightShareImage } from "@/features/v51/insights/insight-share-export";
import { CsatValue } from "../components/ProfilePreviewCard";
import styles from "../components/MyProfile.module.css";

type ProfileDashboardClientProps = {
  fixture: MyProfileDashboardFixture;
  activeQuestionAnswered: boolean;
};

type DashboardAction = {
  title: string;
  body: string;
  href: string;
  cta: string;
};

const ownerProfileId = "ali";

function getLatestExperience(profile: MyExperienceProfile) {
  return (
    profile.experienceTimeline.find((item) => item.id === profile.latestCompanyId) ??
    profile.experienceTimeline.find((item) => item.isCurrent) ??
    profile.experienceTimeline[0] ??
    null
  );
}

function getPublicCompanies(profile: MyExperienceProfile) {
  const latest = getLatestExperience(profile);
  const optional = profile.publicExperienceCompanyIds
    .map((id) => profile.experienceTimeline.find((item) => item.id === id))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
  const seen = new Set<string>();

  return [latest, ...optional]
    .filter((item): item is NonNullable<typeof item> => Boolean(item?.companyName))
    .filter((item) => {
      if (seen.has(item.companyName)) {
        return false;
      }
      seen.add(item.companyName);
      return true;
    })
    .map((item) => item.companyName);
}

function buildPendingActions(fixture: MyProfileDashboardFixture, profile: MyExperienceProfile, status: ExperienceProfileStatus, activeQuestionAnswered: boolean) {
  const actions: DashboardAction[] = [];

  if (status !== "active") {
    actions.push({
      title: status === "none" ? "پروفایل تجربه ساخته نشده" : "پروفایل تجربه ناقص است",
      body: "برای دیده‌شدن در کشف تجربه‌ها، پروفایل تجربه را کامل کن.",
      href: "/profile/build",
      cta: status === "none" ? "شروع ساخت پروفایل تجربه" : "تکمیل پروفایل تجربه"
    });
  }

  if (fixture.incomingRequests > 0) {
    actions.push({
      title: "درخواست جلسه در انتظار بررسی",
      body: `${formatter.format(fixture.incomingRequests)} درخواست جلسه مشاوره جدید دارید.`,
      href: "/conversations",
      cta: "مشاهده درخواست‌ها"
    });
  }

  if (!fixture.settlement.iban) {
    actions.push({
      title: "اطلاعات تسویه ناقص است",
      body: "برای برداشت درآمد، شماره شبا و نام صاحب حساب را ثبت کنید.",
      href: "/profile/settings",
      cta: "ثبت یا ویرایش شبا"
    });
  }

  if (!activeQuestionAnswered) {
    actions.push({
      title: "سؤال جدید هنوز پاسخ داده نشده",
      body: "یک پاسخ کوتاه می‌تواند پروفایل تجربه شما را کامل‌تر کند.",
      href: "/insights?answer=active",
      cta: "نوشتن پاسخ کوتاه"
    });
  }

  if (!profile.avatarUrl) {
    actions.push({
      title: "تصویر پروفایل اضافه نشده",
      body: "یک تصویر واقعی اعتماد بیشتری در درخواست جلسه می‌سازد.",
      href: "/profile/build",
      cta: "افزودن تصویر"
    });
  }

  if (!profile.pricing[30] && !profile.pricing[60]) {
    actions.push({
      title: "قیمت جلسه تعیین نشده",
      body: "برای دریافت درخواست جلسه مشاوره، قیمت جلسه را مشخص کنید.",
      href: "/profile/build",
      cta: "تعیین قیمت جلسه"
    });
  }

  return actions;
}

function UnifiedProfileBanner({
  profile,
  fixture,
  latestExperience,
  publishedInsightCount,
  onDeactivate
}: Readonly<{
  profile: MyExperienceProfile;
  fixture: MyProfileDashboardFixture;
  latestExperience: ReturnType<typeof getLatestExperience>;
  publishedInsightCount: number;
  onDeactivate: () => void;
}>) {
  return (
    <section className={styles.profileManagementBanner} aria-label="مدیریت پروفایل تجربه">
      <div className={styles.bannerIdentity}>
        <div className={styles.bannerAvatarWrap}>
          <div className={styles.bannerAvatar}>
            {profile.avatarUrl ? <span className={styles.avatarImage} style={{ backgroundImage: `url(${profile.avatarUrl})` }} /> : profile.initials}
          </div>
          <Link className={styles.bannerAvatarEdit} href="/profile/build" aria-label="ویرایش تصویر پروفایل">
            <UseravaaIcon name="imageUpload" size={16} />
            ویرایش تصویر
          </Link>
        </div>
        <div className={styles.bannerCopy}>
          <h1>{profile.name}</h1>
          <p>{latestExperience ? `${latestExperience.jobTitle}، ${latestExperience.companyName}` : profile.roleFa}</p>
          <Link href="/profile/build">
            <UseravaaIcon name="edit" size={16} />
            <span>ویرایش نام، تصویر و شغل</span>
          </Link>
        </div>
      </div>

      <div className={styles.bannerMiddle}>
        <p>
          پروفایل و اطلاعات تجربه شما در <span className="brand-word">Useravaa</span> نمایش داده می‌شود.
        </p>
        <div className={styles.bannerStats}>
          <div>
            <span>بازدید پروفایل</span>
            <b>{formatter.format(fixture.stats.profileViews)}</b>
          </div>
          <div>
            <span>درخواست‌های جدید</span>
            <b>{formatter.format(fixture.incomingRequests)}</b>
          </div>
          <div>
            <UseravaaIcon name="insight" size={14} aria-hidden="true" />
            <span>بینش‌های منتشرشده</span>
            <b>{formatter.format(publishedInsightCount)}</b>
          </div>
        </div>
      </div>

      <div className={styles.bannerActions}>
        <Link className={styles.primaryDashboardAction} href="/profiles/ali">
          <UseravaaIcon name="view" size={18} />
          مشاهده پروفایل عمومی
        </Link>
        <Link className={styles.secondaryDashboardAction} href="/profile/build">
          <UseravaaIcon name="edit" size={18} />
          ویرایش پروفایل
        </Link>
        <button className={styles.ghostDashboardAction} type="button" onClick={onDeactivate}>
          توقف دریافت درخواست‌ها
        </button>
      </div>
    </section>
  );
}

export function ProfileDashboardClient({ fixture, activeQuestionAnswered }: ProfileDashboardClientProps) {
  const [status, setStatus] = useState(fixture.status);
  const [profile, setProfile] = useState<MyExperienceProfile>(fixture.profile);
  const [message, setMessage] = useState("");
  const [ownerInsightStatuses, setOwnerInsightStatuses] = useState<Record<string, "published" | "retracted">>({});
  const [ownerInsightTextOverrides, setOwnerInsightTextOverrides] = useState<Record<string, string>>({});
  const [ownerInsightAudienceOverrides, setOwnerInsightAudienceOverrides] = useState<Record<string, InsightAudienceIntent[]>>({});
  const [editingInsightId, setEditingInsightId] = useState<string | null>(null);
  const [editingInsightText, setEditingInsightText] = useState("");
  const [editingAudienceIntents, setEditingAudienceIntents] = useState<InsightAudienceIntent[]>(["current_growth"]);
  const latestExperience = getLatestExperience(profile);
  const publicCompanies = getPublicCompanies(profile);
  const pendingActions = buildPendingActions(fixture, profile, status, activeQuestionAnswered);
  const ownerInsights = publishedInsights
    .filter((insight) => insight.profileId === ownerProfileId && insight.status !== "draft")
    .map((insight) => {
      const answerText = ownerInsightTextOverrides[insight.id] ?? insight.answerText;

      return {
        ...insight,
        answer: answerText,
        answerText,
        audienceIntents: ownerInsightAudienceOverrides[insight.id] ?? ["current_growth" as InsightAudienceIntent],
        status: ownerInsightStatuses[insight.id] ?? insight.status
      };
    });
  const publishedInsightCount = ownerInsights.filter((insight) => insight.status === "published").length;
  const editingInsight = ownerInsights.find((insight) => insight.id === editingInsightId) ?? null;

  useEffect(() => {
    let storedProfile: MyExperienceProfile | null = null;

    try {
      const storedDraft = window.localStorage.getItem(profileBuilderDraftStorageKey);

      if (storedDraft) {
        storedProfile = profileFromBuilderDraft(JSON.parse(storedDraft) as ProfileBuilderDraft);
      }
    } catch {
      window.localStorage.removeItem(profileBuilderDraftStorageKey);
    }

    window.queueMicrotask(() => {
      if (storedProfile) {
        setProfile(storedProfile);
      }
    });
  }, []);

  const deactivateProfile = () => {
    const confirmed = typeof window === "undefined" ? true : window.confirm("دریافت درخواست‌های جلسه مشاوره متوقف شود؟");

    if (!confirmed) {
      return;
    }

    setStatus((current) => transitionProfileStatus(current, "deactivate_profile"));
    setMessage("دریافت درخواست‌های جلسه مشاوره متوقف شد.");
  };

  const copyOwnerInsightLink = async (insightId: string) => {
    const shareData = buildInsightShareExportData(insightId);

    if (!shareData) {
      return;
    }

    const didCopy = await copyInsightCanonicalUrl(shareData);
    setMessage(didCopy ? "لینک کپی شد." : "لینک این بینش آماده است.");
  };

  const downloadOwnerInsightCard = async (insightId: string) => {
    const shareData = buildInsightShareExportData(insightId);

    if (!shareData) {
      return;
    }

    await downloadInsightShareImage(shareData);
    setMessage("تصویر کارت دانلود شد.");
  };

  const toggleEditingAudienceIntent = (value: InsightAudienceIntent) => {
    setEditingAudienceIntents((current) => (current.includes(value) ? current.filter((item) => item !== value) : [...current, value]));
  };

  const beginEditOwnerInsight = (insightId: string) => {
    const insight = ownerInsights.find((item) => item.id === insightId);

    if (!insight) {
      return;
    }

    setEditingInsightId(insight.id);
    setEditingInsightText(limitInsightAnswerInput(insight.answerText));
    setEditingAudienceIntents(insight.audienceIntents.length ? insight.audienceIntents : ["current_growth"]);
  };

  const saveOwnerInsightEdit = () => {
    if (!editingInsight || !editingInsightText.trim()) {
      return;
    }

    if (!editingAudienceIntents.length) {
      setMessage("مشخص کنید این نکته بیشتر به درد چه کسانی می‌خورد.");
      return;
    }

    setOwnerInsightTextOverrides((current) => ({
      ...current,
      [editingInsight.id]: limitInsightAnswerInput(editingInsightText)
    }));
    setOwnerInsightAudienceOverrides((current) => ({
      ...current,
      [editingInsight.id]: editingAudienceIntents
    }));
    setMessage("تغییرات بینش ذخیره شد.");
    setEditingInsightId(null);
  };

  const retractOwnerInsight = (insightId: string) => {
    const confirmed = typeof window === "undefined" ? true : window.confirm("برداشتن بینش از انتشار؟\nاین بینش از صفحه بینش‌ها و پروفایل عمومی شما برداشته می‌شود. بعداً می‌توانید دوباره منتشرش کنید.");

    if (!confirmed) {
      return;
    }

    setOwnerInsightStatuses((current) => ({
      ...current,
      [insightId]: "retracted"
    }));
    setMessage("بینش از انتشار برداشته شد.");
  };

  return (
    <>
      <UnifiedProfileBanner
        profile={profile}
        fixture={fixture}
        latestExperience={latestExperience}
        publishedInsightCount={publishedInsightCount}
        onDeactivate={deactivateProfile}
      />

      {message ? (
        <p className={styles.statusMessage} role="status" aria-live="polite">
          {message}
        </p>
      ) : null}

      <div className={styles.dashboardColumns}>
        <main className={styles.dashboardMainColumn}>
          <section className={styles.dashboardCard}>
            <div className={styles.sectionHead}>
              <div>
                <h2>اقدام‌های مهم</h2>
                <p>فقط کارهایی که الان به توجه شما نیاز دارند.</p>
              </div>
            </div>
            {pendingActions.length ? (
              <div className={styles.compactActionList}>
                {pendingActions.map((action) => (
                  <article className={styles.compactActionCard} key={action.title}>
                    <h3>{action.title}</h3>
                    <p>{action.body}</p>
                    <Link href={action.href}>{action.cta}</Link>
                  </article>
                ))}
              </div>
            ) : (
              <div className={styles.readyState}>همه چیز آماده است.</div>
            )}
          </section>

          <section className={styles.dashboardCard}>
            <div className={styles.sectionHead}>
              <div>
                <h2>درخواست‌ها و جلسه‌ها</h2>
                <p>خلاصه وضعیت جلسه‌های مشاوره شما.</p>
              </div>
              <Link className={styles.secondaryDashboardAction} href="/conversations">
                مشاهده درخواست‌ها
              </Link>
            </div>
            <div className={styles.sessionStats}>
              <div>
                <span>درخواست‌های جدید</span>
                <b>{formatter.format(fixture.incomingRequests)}</b>
              </div>
              <div>
                <span>جلسه‌های آینده</span>
                <b>{formatter.format(1)}</b>
              </div>
              <div>
                <span>جلسه‌های انجام‌شده</span>
                <b>{formatter.format(fixture.stats.successfulConversations)}</b>
              </div>
            </div>
          </section>

          <section className={styles.dashboardCard}>
            <div className={styles.sectionHead}>
              <div>
                <h2>بینش‌های من</h2>
                <p>بینش‌هایی که از تجربه کاری خود منتشر کرده‌اید.</p>
              </div>
              <Link className={styles.secondaryDashboardAction} href="/profile/insights">
                مدیریت همه بینش‌ها
              </Link>
            </div>
            <div className={styles.insightCarousel} tabIndex={0} aria-label="بینش‌های من">
              {ownerInsights.map((insight) => (
                <article className={styles.carouselInsightCard} key={insight.id}>
                  <span>{insight.relativeDateFa}</span>
                  {insight.status === "retracted" ? <small className={styles.ownerInsightStatus}>برداشته‌شده از انتشار</small> : null}
                  <h3>{getInsightPromptHeader(insight)}</h3>
                  <p>{insight.answerText}</p>
                  <div>
                    {insight.status === "published" ? (
                      <>
                        <button type="button" onClick={() => downloadOwnerInsightCard(insight.id)}>
                          <UseravaaIcon name="download" size={16} />
                          دانلود تصویر کارت
                        </button>
                        <button type="button" onClick={() => copyOwnerInsightLink(insight.id)}>
                          <UseravaaIcon name="link" size={16} />
                          کپی لینک
                        </button>
                        <button type="button" onClick={() => retractOwnerInsight(insight.id)}>
                          <UseravaaIcon name="archive" size={16} />
                          برداشتن از انتشار
                        </button>
                      </>
                    ) : null}
                    <button type="button" onClick={() => beginEditOwnerInsight(insight.id)}>
                      <UseravaaIcon name="edit" size={16} />
                      ویرایش بینش
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className={styles.dashboardCard}>
            <div className={styles.sectionHead}>
              <div>
                <h2>پروفایل تجربه من</h2>
                <p>خلاصه‌ای از اطلاعاتی که در پروفایل عمومی دیده می‌شود.</p>
              </div>
            </div>
            <div className={styles.profileSummaryGrid}>
              <div>
                <span>عنوان فعلی</span>
                <b>{latestExperience?.jobTitle ?? profile.roleFa}</b>
              </div>
              <div>
                <span>شرکت فعلی</span>
                <b>{latestExperience?.companyName ?? "ثبت نشده"}</b>
              </div>
              <div>
                <span>رده سازمانی</span>
                <b>{latestExperience?.orgLevel ?? profile.orgLevel}</b>
              </div>
              <div>
                <span>گروه شغلی</span>
                <b>{profile.jobCategoriesFa[0] ?? "ثبت نشده"}</b>
              </div>
              <div>
                <span>شرکت‌های قابل نمایش</span>
                <b>{publicCompanies.length ? publicCompanies.join("، ") : "ثبت نشده"}</b>
              </div>
              <div>
                <span>قیمت جلسه</span>
                <b>
                  ۳۰ دقیقه: {toman(profile.pricing[30])}
                  <br />۱ ساعت: {toman(profile.pricing[60])}
                </b>
              </div>
              <div>
                <span>کمک رایگان</span>
                <b>{profile.freeHelp ? "فعال" : "غیرفعال"}</b>
              </div>
            </div>
            <div className={styles.cardActionRow}>
              <Link className={styles.secondaryDashboardAction} href="/profile/build">
                <UseravaaIcon name="edit" size={18} />
                ویرایش تجربه
              </Link>
            </div>
          </section>

          <section className={styles.dashboardCard}>
            <div className={styles.sectionHead}>
              <div>
                <h2>کیف پول و پرداخت‌ها</h2>
                <p>وضعیت درآمد و جلسه‌های موفق.</p>
              </div>
            </div>
            <div className={styles.walletGrid}>
              <div>
                <span>جلسه موفق</span>
                <b>{formatter.format(fixture.stats.successfulConversations)}</b>
              </div>
              <div>
                <span>رضایت جلسه‌ها</span>
                <b>
                  <CsatValue value={fixture.stats.csat} />
                </b>
              </div>
              <div>
                <span>قابل برداشت</span>
                <b>{toman(fixture.stats.availableEarnings)}</b>
              </div>
            </div>
            <div className={styles.cardActionRow}>
              <Link className={styles.primaryDashboardAction} href="/wallet">
                کیف پول و پرداخت‌ها
              </Link>
              <Link className={styles.secondaryDashboardAction} href="/profile/settings">
                <UseravaaIcon name="edit" size={18} />
                ثبت یا ویرایش شبا
              </Link>
            </div>
          </section>
        
          <section className={styles.dashboardCardSoft}>
            <h2>بازخوردها</h2>
            <div className={styles.feedbackSummaryClean}>
              <b>{formatter.format(fixture.feedbackCount)} بازخورد دریافت‌شده</b>
              <span>
                میانگین رضایت: <CsatValue value={fixture.stats.csat} /> از ۵
              </span>
              <p>بر اساس بازخوردهای ثبت‌شده پس از جلسه</p>
            </div>
            <Link className={styles.secondaryDashboardAction} href="/profile/feedback">
              <UseravaaIcon name="star" size={18} />
              دیدن بازخوردها
            </Link>
          </section>

          <section className={styles.dashboardCardSoft}>
            <h2>ذخیره‌شده‌ها</h2>
            <div className={styles.savedShortcutGrid}>
              <div>
                <span>افراد ذخیره‌شده</span>
                <b>{formatter.format(fixture.network.saved)}</b>
              </div>
              <div>
                <UseravaaIcon name="insight" size={14} aria-hidden="true" />
                <span>بینش‌های ذخیره‌شده</span>
                <b>{formatter.format(1)}</b>
              </div>
            </div>
            <Link className={styles.secondaryDashboardAction} href="/saved">
              <UseravaaIcon name="save" size={18} />
              مشاهده ذخیره‌شده‌ها
            </Link>
          </section>

          <section className={styles.dashboardCardSoft}>
            <h2>حساب و تنظیمات</h2>
            <div className={styles.settingsShortcutList}>
              <Link href="/profile/settings">
                <UseravaaIcon name="edit" size={16} />
                <span>ویرایش اطلاعات حساب</span>
              </Link>
              <Link href="/profile/settings">
                <UseravaaIcon name="edit" size={16} />
                <span>ثبت یا ویرایش شبا</span>
              </Link>
              <Link href="/profile/settings">
                <UseravaaIcon name="settings" size={16} />
                <span>رفتن به تنظیمات</span>
              </Link>
            </div>
          </section>
        </main>
      </div>

      {editingInsight ? (
        <div className={styles.modal} role="presentation">
          <div className={styles.modalCard} role="dialog" aria-modal="true" aria-label="ویرایش بینش">
            <div className={styles.modalHead}>
              <h2>ویرایش بینش</h2>
              <button className={styles.modalClose} type="button" onClick={() => setEditingInsightId(null)} aria-label="بستن">
                <UseravaaIcon name="close" size={18} />
              </button>
            </div>
            <label className={styles.ownerInsightEditField} htmlFor="ownerInsightEditText">
              <span>متن بینش</span>
              <textarea
                id="ownerInsightEditText"
                value={editingInsightText}
                maxLength={insightAnswerMaxLength}
                onChange={(event) => setEditingInsightText(limitInsightAnswerInput(event.target.value))}
              />
            </label>
            <div className={styles.ownerInsightEditMeta}>
              <span>{getInsightAnswerCharacterCount(editingInsightText)} / {insightAnswerMaxLength}</span>
            </div>
            <fieldset className={styles.ownerAudienceOptions}>
              <legend>این نکته بیشتر به درد چه کسانی می‌خورد؟</legend>
              {insightAudienceOptions.map((option) => (
                <label className={editingAudienceIntents.includes(option.id) ? styles.ownerAudienceSelected : ""} key={option.id}>
                  <input
                    type="checkbox"
                    value={option.id}
                    checked={editingAudienceIntents.includes(option.id)}
                    onChange={() => toggleEditingAudienceIntent(option.id)}
                  />
                  <span>
                    <b>{option.title}</b>
                    <small>{option.description}</small>
                  </span>
                  {editingAudienceIntents.includes(option.id) ? <UseravaaIcon name="check" size={18} /> : null}
                </label>
              ))}
            </fieldset>
            <div className={styles.cardActionRow}>
              <button className={styles.primaryDashboardAction} type="button" onClick={saveOwnerInsightEdit} disabled={!editingInsightText.trim() || !editingAudienceIntents.length}>
                ذخیره تغییرات
              </button>
              <button className={styles.secondaryDashboardAction} type="button" onClick={() => setEditingInsightId(null)}>
                انصراف
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
