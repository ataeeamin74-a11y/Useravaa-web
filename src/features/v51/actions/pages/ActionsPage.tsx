"use client";

import { useMemo, useState } from "react";
import { V51Button, V51LinkButton } from "@/features/v51/components/V51Button";
import {
  conversations,
  resolveUserActions,
  type ConversationFixture,
  type UserAction,
  type UserActionBadge,
  type UserActionFilter,
  type UserActionUrgency
} from "@/features/v51/data/conversations";
import { formatFaNumber } from "@/lib/fa-format";
import styles from "./ActionsPage.module.css";

type ActionsPageProps = {
  initialActions?: readonly UserAction[];
  initialConversations?: readonly ConversationFixture[];
};

const filters: ReadonlyArray<{ id: UserActionFilter; label: string }> = [
  { id: "all", label: "همه" },
  { id: "sessions", label: "جلسه‌ها" },
  { id: "payment", label: "پرداخت" },
  { id: "profile", label: "پروفایل" },
  { id: "wallet", label: "کیف پول" }
];

const urgencyGroups: ReadonlyArray<{ id: UserActionUrgency; title: string; helper: string }> = [
  {
    id: "urgent",
    title: "فوری",
    helper: "اقدام‌هایی که مسیر درخواست یا جلسه را متوقف کرده‌اند."
  },
  {
    id: "today",
    title: "امروز",
    helper: "اقدام‌هایی که برای زمان نزدیک یا آماده‌سازی جلسه لازم‌اند."
  },
  {
    id: "completion",
    title: "نیازمند تکمیل",
    helper: "کارهای مهمی که برای کامل‌تر شدن مسیر شما لازم‌اند."
  }
];

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function badgeTone(badge: UserActionBadge) {
  if (badge === "درخواست ارسالی" || badge === "پرداخت") {
    return styles.badgeBlue;
  }

  if (badge === "درخواست دریافتی") {
    return styles.badgeTeal;
  }

  return styles.badgeNeutral;
}

function countByUrgency(actions: readonly UserAction[], urgency: UserActionUrgency) {
  return actions.filter((action) => action.urgency === urgency).length;
}

function ActionRow({ action }: Readonly<{ action: UserAction }>) {
  return (
    <article className={styles.actionRow}>
      <div className={styles.actionMain}>
        <div className={styles.actionTitleRow}>
          <h3>{action.title}</h3>
          <span className={cx(styles.badge, badgeTone(action.badge))}>{action.badge}</span>
        </div>
        <p>{action.description}</p>
        {action.chips.length > 0 ? (
          <div className={styles.chips}>
            {action.chips.map((chip) => (
              <span key={`${action.id}-${chip}`}>{chip}</span>
            ))}
          </div>
        ) : null}
      </div>
      <div className={styles.actionCtas}>
        <V51LinkButton href={action.primaryHref} tone="primary">
          {action.primaryCta}
        </V51LinkButton>
        {action.secondaryHref && action.secondaryCta ? (
          <V51LinkButton href={action.secondaryHref} tone="secondary">
            {action.secondaryCta}
          </V51LinkButton>
        ) : null}
      </div>
    </article>
  );
}

export function ActionsPage({ initialActions, initialConversations = conversations }: ActionsPageProps) {
  const [activeFilter, setActiveFilter] = useState<UserActionFilter>("all");
  const actions = useMemo(() => initialActions ?? resolveUserActions(initialConversations), [initialActions, initialConversations]);
  const filteredActions = activeFilter === "all" ? actions : actions.filter((action) => action.filter === activeFilter);
  const urgentCount = countByUrgency(actions, "urgent");
  const todayCount = countByUrgency(actions, "today");
  const completionCount = countByUrgency(actions, "completion");

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>اقدام‌ها</h1>
          <p>کارهایی که برای ادامه مسیر نیاز به اقدام شما دارند.</p>
        </div>
        <div className={styles.summaryCard} aria-label="خلاصه اقدام‌ها">
          <strong>{formatFaNumber(actions.length)} اقدام باز</strong>
          <span>
            {formatFaNumber(urgentCount)} فوری · {formatFaNumber(todayCount)} امروز · {formatFaNumber(completionCount)} نیازمند تکمیل
          </span>
        </div>
      </header>

      <div className={styles.filters} aria-label="فیلتر اقدام‌ها">
        {filters.map((filter) => (
          <V51Button
            key={filter.id}
            type="button"
            tone={activeFilter === filter.id ? "primary" : "secondary"}
            className={styles.filterButton}
            aria-pressed={activeFilter === filter.id}
            onClick={() => setActiveFilter(filter.id)}
          >
            {filter.label}
          </V51Button>
        ))}
      </div>

      {filteredActions.length > 0 ? (
        <div className={styles.groups}>
          {urgencyGroups.map((group) => {
            const groupActions = filteredActions.filter((action) => action.urgency === group.id);

            if (groupActions.length === 0) {
              return null;
            }

            return (
              <section className={styles.group} key={group.id}>
                <div className={styles.groupHeader}>
                  <div>
                    <h2>{group.title}</h2>
                    <p>{group.helper}</p>
                  </div>
                  <span>{formatFaNumber(groupActions.length)}</span>
                </div>
                <div className={styles.rows}>
                  {groupActions.map((action) => (
                    <ActionRow key={action.id} action={action} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <section className={styles.emptyState}>
          <h2>فعلاً اقدامی از شما لازم نیست.</h2>
          <p>درخواست‌ها و جلسه‌هایی که منتظر طرف مقابل هستند، در صفحه جلسه‌ها قابل پیگیری‌اند.</p>
          <V51LinkButton href="/sessions" tone="primary">
            رفتن به جلسه‌ها
          </V51LinkButton>
        </section>
      )}
    </div>
  );
}
