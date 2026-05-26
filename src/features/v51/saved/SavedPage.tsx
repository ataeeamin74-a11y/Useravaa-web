"use client";

import Link from "next/link";
import { useState } from "react";
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
          <span>افراد ذخیره‌شده</span>
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
          <span>بینش‌های ذخیره‌شده</span>
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

                return (
                  <article className={styles.card} key={profile.id}>
                    <div className={styles.personLine}>
                      <div className={styles.avatar}>{profile.initials}</div>
                      <div>
                        <h3>{profile.name}</h3>
                        <p>{getProfileJobTitle(profile)}</p>
                      </div>
                    </div>
                    <p>{profile.professionalSummary}</p>
                    <div className={styles.meta}>
                      <span className={styles.chip}>{profile.orgLevel}</span>
                      <span className={styles.chip}>{profile.jobCategoriesFa[0]}</span>
                      {company ? <span className={styles.chip}>تجربه کاری در {company}</span> : null}
                    </div>
                    <div className={styles.actions}>
                      <Link className={styles.link} href={`/profiles/${profile.id}`}>
                        مشاهده تجربه
                      </Link>
                      <Link className={styles.secondaryLink} href={getRequestHref(profile.id, 30)}>
                        هماهنگی جلسه
                      </Link>
                      <button className={styles.removeButton} type="button" onClick={() => removeSavedProfile(profile.id)}>
                        <UseravaaIcon name="unsave" size={16} />
                        حذف از ذخیره‌شده‌ها
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
                کشف تجربه‌ها
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
                      <span className={styles.chip}>{author?.displayName}</span>
                      {author ? <span className={styles.chip}>{author.jobTitle} · {author.orgLevel}</span> : null}
                      {author ? <span className={styles.chip}>{author.experienceLine}</span> : null}
                    </div>
                    <div className={styles.actions}>
                      <Link className={styles.link} href={author?.profileUrl ?? "/insights"}>
                        مشاهده تجربه
                      </Link>
                      <button className={styles.removeButton} type="button" onClick={() => removeSavedInsight(insight.id)}>
                        <UseravaaIcon name="unsave" size={16} />
                        حذف از ذخیره‌شده‌ها
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
                رفتن به بینش‌ها
              </Link>
            </div>
          )}
        </section>
      ) : null}

    </section>
  );
}
