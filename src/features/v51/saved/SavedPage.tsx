"use client";

import Link from "next/link";
import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { MetaChip } from "@/components/ui/MetaChip";
import { UseravaaIcon } from "@/components/ui/UseravaaIcon";
import {
  getCurrentCompany,
  getInsightAuthor,
  getInsightPromptHeader,
  getProfileJobTitle,
  publishedInsights
} from "@/features/v51/data/experience-discovery";
import { formatter, getProfileById, getRequestHref, profiles } from "@/features/v51/data/profiles";
import { useSavedItems } from "./useSavedItems";
import styles from "./SavedPage.module.css";

type SavedTab = "people" | "insights";

type SavedPageProps = Readonly<{
  initialSavedProfileIds?: readonly string[];
  initialSavedInsightIds?: readonly string[];
  initialTab?: string | null;
}>;

const emptySavedIds: readonly string[] = [];

function normalizeSavedTab(tab?: string | null): SavedTab {
  return tab === "insights" ? "insights" : "people";
}

export function SavedPage({
  initialSavedProfileIds = emptySavedIds,
  initialSavedInsightIds = emptySavedIds,
  initialTab
}: SavedPageProps) {
  const { savedProfileIds, savedInsightIds, removeSavedProfile, removeSavedInsight } = useSavedItems(
    initialSavedProfileIds,
    initialSavedInsightIds
  );
  const [activeTab, setActiveTab] = useState<SavedTab>(normalizeSavedTab(initialTab));

  const savedProfiles = savedProfileIds.map((profileId) => getProfileById(profileId)).filter((profile): profile is (typeof profiles)[number] => Boolean(profile));
  const savedInsights = savedInsightIds
    .map((insightId) => publishedInsights.find((insight) => insight.id === insightId && insight.status === "published"))
    .filter((insight): insight is (typeof publishedInsights)[number] => Boolean(insight));

  function selectTab(tab: SavedTab) {
    setActiveTab(tab);

    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `/saved?tab=${tab}`);
    }
  }

  return (
    <section className={styles.savedShell}>
      <header className={styles.hero}>
        <h1>ذخیره‌شده‌ها</h1>
        <p className={styles.lead}>افراد و بینش‌هایی که برای تصمیم‌های بعدی ذخیره کرده‌اید؛ برای بررسی تجربه‌ها یا هماهنگی جلسه به آن‌ها برگردید.</p>
      </header>

      <div className={styles.tabs} role="tablist" aria-label="بخش‌های ذخیره‌شده‌ها">
        <button
          className={`${styles.tab} ${activeTab === "people" ? styles.tabActive : ""}`}
          type="button"
          role="tab"
          aria-selected={activeTab === "people"}
          aria-controls="saved-people-panel"
          id="saved-people-tab"
          onClick={() => selectTab("people")}
        >
          <span className="button-label">افراد ذخیره‌شده</span>
          <b>{formatter.format(savedProfiles.length)}</b>
        </button>
        <button
          className={`${styles.tab} ${activeTab === "insights" ? styles.tabActive : ""}`}
          type="button"
          role="tab"
          aria-selected={activeTab === "insights"}
          aria-controls="saved-insights-panel"
          id="saved-insights-tab"
          onClick={() => selectTab("insights")}
        >
          <span className="button-label">بینش‌های ذخیره‌شده</span>
          <b>
            <UseravaaIcon name="insight" size={14} aria-hidden="true" />
            {formatter.format(savedInsights.length)}
          </b>
        </button>
      </div>

      {activeTab === "people" ? (
        <section className={styles.section} id="saved-people-panel" role="tabpanel" aria-labelledby="saved-people-tab">
          {savedProfiles.length ? (
            <div className={styles.grid}>
              {savedProfiles.map((profile) => {
                const company = getCurrentCompany(profile);
                const avatarUrl = "avatarUrl" in profile ? profile.avatarUrl : undefined;

                return (
                  <article className={styles.card} key={profile.id}>
                    <div className={styles.personLine}>
                      <Avatar src={avatarUrl} alt="" size="lg" className={styles.avatar} />
                      <div>
                        <h3>{profile.name}</h3>
                        <p>{getProfileJobTitle(profile)}</p>
                      </div>
                    </div>
                    <p>{profile.professionalSummary}</p>
                    <div className={styles.meta}>
                      <MetaChip className={styles.chip}>{profile.orgLevel}</MetaChip>
                      <MetaChip className={styles.chip}>{profile.jobCategoriesFa[0]}</MetaChip>
                      {company ? <MetaChip className={styles.chip}>تجربه کاری در {company}</MetaChip> : null}
                    </div>
                    <div className={styles.actions}>
                      <Link className={styles.link} href={`/profiles/${profile.id}`}>
                        <span className="button-label">مشاهده تجربه</span>
                      </Link>
                      <Link className={styles.secondaryLink} href={getRequestHref(profile.id, 30)}>
                        <span className="button-label">هماهنگی جلسه</span>
                      </Link>
                      <button className={styles.removeButton} type="button" onClick={() => removeSavedProfile(profile.id)}>
                        <UseravaaIcon name="unsave" size={16} />
                        <span className="button-label">حذف از ذخیره‌شده‌ها</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className={styles.sectionEmpty}>
              <UseravaaIcon name="save" size={22} />
              <p>هنوز فردی ذخیره نکرده‌اید.</p>
              <Link className={styles.secondaryLink} href="/discover">
                <span className="button-label">کشف تجربه‌ها</span>
              </Link>
              <Link className={styles.secondaryLink} href="/guide">
                <span className="button-label">راهنمای Useravaa</span>
              </Link>
            </div>
          )}
        </section>
      ) : null}

      {activeTab === "insights" ? (
        <section className={styles.section} id="saved-insights-panel" role="tabpanel" aria-labelledby="saved-insights-tab">
          {savedInsights.length ? (
            <div className={styles.grid}>
              {savedInsights.map((insight) => {
                const author = getInsightAuthor(insight);

                return (
                  <article className={styles.card} key={insight.id}>
                    <h3>{getInsightPromptHeader(insight)}</h3>
                    <p>{insight.answerText}</p>
                    <div className={styles.meta}>
                      <MetaChip className={styles.chip}>{author?.displayName}</MetaChip>
                      {author ? <MetaChip className={styles.chip}>{author.jobTitle} · {author.orgLevel}</MetaChip> : null}
                      {author ? <MetaChip className={styles.chip}>{author.experienceLine}</MetaChip> : null}
                    </div>
                    <div className={styles.actions}>
                      <Link className={styles.link} href={author?.profileUrl ?? "/insights"}>
                        <span className="button-label">مشاهده تجربه</span>
                      </Link>
                      <button className={styles.removeButton} type="button" onClick={() => removeSavedInsight(insight.id)}>
                        <UseravaaIcon name="unsave" size={16} />
                        <span className="button-label">حذف از ذخیره‌شده‌ها</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className={styles.sectionEmpty}>
              <UseravaaIcon name="insight" size={22} />
              <p>هنوز بینشی ذخیره نکرده‌اید.</p>
              <Link className={styles.secondaryLink} href="/insights">
                <span className="button-label">رفتن به بینش‌ها</span>
              </Link>
              <Link className={styles.secondaryLink} href="/guide">
                <span className="button-label">راهنمای Useravaa</span>
              </Link>
            </div>
          )}
        </section>
      ) : null}

    </section>
  );
}
