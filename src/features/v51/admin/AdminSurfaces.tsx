import Link from "next/link";
import { Fragment, type CSSProperties } from "react";
import { UnauthorizedState } from "@/components/auth/UnauthorizedState";
import { AdminCategoryActions } from "./AdminCategoryActions";
import { AdminCancellationReviewActions } from "./AdminCancellationReviewActions";
import { AdminContentActions } from "./AdminContentActions";
import { AdminExperienceProfileReviewActions } from "./AdminExperienceProfileReviewActions";
import { AdminInsightAnswerModerationActions } from "./AdminInsightAnswerModerationActions";
import { AdminInsightModerationActions } from "./AdminInsightModerationActions";
import { AdminPaymentReviewActions } from "./AdminPaymentReviewActions";
import { AdminPricingRuleActions } from "./AdminPricingRuleActions";
import { AdminSupportActions } from "./AdminSupportActions";
import {
  getConversationTimeline,
  getQualityChecklist,
  type AdminActionItem,
  type AdminAnalyticsData,
  type AdminAttendanceItem,
  type AdminAuditLogData,
  type AdminCancellationItem,
  type AdminCategoriesData,
  type AdminCategoryDetailData,
  type AdminContentData,
  type AdminContentDetailData,
  type AdminConversationListItem,
  type AdminDataSource,
  type AdminExperienceProfileDetailItem,
  type AdminExperienceProfileItem,
  type AdminInsightDetailItem,
  type AdminInsightItem,
  type AdminMetric,
  type AdminPaymentQueueItem,
  type AdminPlaceholderData,
  type AdminPricingRuleDetailData,
  type AdminPricingRulesData,
  type AdminReadDetail,
  type AdminSupportDetailData,
  type AdminSupportInboxData,
  type AdminUserItem,
  type AdminWalletLedgerItem
} from "./data";
import styles from "./AdminSurfaces.module.css";
import { formatDuration, type ConversationFixture } from "@/features/v51/data/conversations";
import type { ExperienceProfileFixture } from "@/features/v51/data/profiles";

type AdminPageHeaderProps = Readonly<{
  title: string;
  eyebrow?: string;
  description: string;
  sourceNote?: string;
}>;

type AdminHomeProps = Readonly<{
  metrics: readonly AdminMetric[];
  actionItems: readonly AdminActionItem[];
  sourceNote: string;
}>;

function sourceLabel(source: AdminDataSource) {
  if (source === "backend_repository") {
    return "Repository";
  }

  if (source === "local_demo") {
    return "Demo";
  }

  return "Placeholder";
}

function DataSourceBadge({ source }: Readonly<{ source: AdminDataSource }>) {
  return <span className={styles.sourceBadge}>{sourceLabel(source)}</span>;
}

function kpiStatusClass(status: AdminAnalyticsData["kpiTree"][number]["status"]) {
  if (status === "computed") {
    return styles.kpiStatusComputed;
  }

  if (status === "proxy") {
    return styles.kpiStatusProxy;
  }

  return styles.kpiStatusNotImplemented;
}

export function AdminAccessDenied() {
  return (
    <div className={styles.surface}>
      <UnauthorizedState />
    </div>
  );
}

export function AdminPageHeader({ title, eyebrow = "Admin P0", description, sourceNote }: AdminPageHeaderProps) {
  return (
    <header className={styles.pageHeader}>
      <p>{eyebrow}</p>
      <h2>{title}</h2>
      <span>{description}</span>
      {sourceNote ? <small>{sourceNote}</small> : null}
    </header>
  );
}

export function AdminHome({ metrics, actionItems, sourceNote }: AdminHomeProps) {
  return (
    <div className={styles.pageStack}>
      <AdminPageHeader
        title="صف اقدام"
        description="نمای اول پنل عملیات فقط روی مواردی تمرکز دارد که نیازمند توجه هستند."
        sourceNote={sourceNote}
      />

      <section className={styles.metricGrid} aria-label="خلاصه عملیاتی">
        {metrics.map((metric) => (
          <Link href={metric.href ?? "/admin"} className={styles.metricCard} key={metric.id}>
            <DataSourceBadge source={metric.source} />
            <strong>{metric.value}</strong>
            <span>{metric.label}</span>
            <small>{metric.helper}</small>
          </Link>
        ))}
      </section>

      <AdminActionQueue actionItems={actionItems} />
    </div>
  );
}

export function AdminActionQueue({ actionItems }: Readonly<{ actionItems: readonly AdminActionItem[] }>) {
  return (
    <section className={styles.surface} aria-label="صف اقدام">
      <div className={styles.surfaceHeader}>
        <div>
          <h3>موارد نیازمند توجه</h3>
          <p>هر ردیف به یک مسیر واقعی پنل عملیات وصل است.</p>
        </div>
      </div>

      {actionItems.length ? (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>نوع اقدام</th>
                <th>اولویت</th>
                <th>موجودیت مرتبط</th>
                <th>کاربران مرتبط</th>
                <th>وضعیت</th>
                <th>زمان ایجاد</th>
                <th>اقدام</th>
              </tr>
            </thead>
            <tbody>
              {actionItems.map((item) => (
                <tr key={item.id}>
                  <td>
                    <span className={styles.rowTitle}>{item.actionType}</span>
                    <DataSourceBadge source={item.source} />
                  </td>
                  <td>{item.priority}</td>
                  <td>{item.relatedEntity}</td>
                  <td>{item.relatedUsers}</td>
                  <td>{item.status}</td>
                  <td>{item.createdAt}</td>
                  <td>
                    <Link className={styles.actionLink} href={item.href}>
                      {item.ctaLabel}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="موردی برای اقدام فوری نیست" body="زمانی که صف عملیاتی داده امن داشته باشد، اینجا نمایش داده می‌شود." />
      )}
    </section>
  );
}

export function EmptyState({ title, body }: Readonly<{ title: string; body: string }>) {
  return (
    <div className={styles.emptyState}>
      <strong>{title}</strong>
      <p>{body}</p>
    </div>
  );
}

function FilterStrip({ filters }: Readonly<{ filters: readonly string[] }>) {
  return (
    <div className={styles.filters} aria-label="فیلترهای وضعیت">
      {filters.map((filter) => (
        <span key={filter}>{filter}</span>
      ))}
    </div>
  );
}

export function AdminPaymentsList({ items, sourceNote }: Readonly<{ items: readonly AdminPaymentQueueItem[]; sourceNote: string }>) {
  return (
    <div className={styles.pageStack}>
      <AdminPageHeader title="بررسی پرداخت‌ها" description="صف پرداخت دستی و وضعیت بررسی هر پرداخت." sourceNote={sourceNote} />
      <FilterStrip filters={["همه", "در انتظار بررسی", "نیازمند بررسی", "تأیید شده", "رد شده"]} />
      <section className={styles.listSurface} aria-label="صف بررسی پرداخت دستی">
        {items.length ? (
          items.map((item) => (
            <article className={styles.rowCard} key={item.paymentId}>
              <div>
                <DataSourceBadge source={item.source} />
                <h3>{item.requestTopic}</h3>
                <p>{item.requesterSummary} / {item.providerSummary}</p>
              </div>
              <dl className={styles.inlineMeta}>
                <div>
                  <dt>مبلغ</dt>
                  <dd>{item.amountLabel}</dd>
                </div>
                <div>
                  <dt>روش</dt>
                  <dd>{item.methodLabel}</dd>
                </div>
                <div>
                  <dt>وضعیت</dt>
                  <dd>{item.manualReviewStatusLabel}</dd>
                </div>
              </dl>
              <Link className={styles.actionLink} href={`/admin/payments/${item.paymentId}`}>
                مشاهده پرداخت
              </Link>
            </article>
          ))
        ) : (
          <EmptyState title="پرداختی در صف بررسی نیست" body="صف repository-backed مورد باز برنگردانده است." />
        )}
      </section>
    </div>
  );
}

export function AdminPaymentDetail({ item, sourceNote }: Readonly<{ item: AdminPaymentQueueItem; sourceNote: string }>) {
  return (
    <div className={styles.pageStack}>
      <AdminPageHeader title="جزئیات پرداخت" description="خلاصه امن پرداخت دستی، گفت‌وگو و وضعیت بررسی." sourceNote={sourceNote} />
      <section className={styles.detailGrid}>
        <article className={styles.surface}>
          <div className={styles.surfaceHeader}>
            <div>
              <h3>{item.requestTopic}</h3>
              <p>شناسه پرداخت: <span dir="ltr">{item.paymentId}</span></p>
            </div>
            <DataSourceBadge source={item.source} />
          </div>
          <dl className={styles.detailList}>
            <div>
              <dt>درخواست‌دهنده</dt>
              <dd>{item.requesterSummary}</dd>
            </div>
            <div>
              <dt>تجربه‌آفرین</dt>
              <dd>{item.providerSummary}</dd>
            </div>
            <div>
              <dt>مبلغ</dt>
              <dd>{item.amountLabel}</dd>
            </div>
            <div>
              <dt>وضعیت پرداخت</dt>
              <dd>{item.paymentStatusLabel}</dd>
            </div>
            <div>
              <dt>وضعیت بررسی دستی</dt>
              <dd>{item.manualReviewStatusLabel}</dd>
            </div>
            <div>
              <dt>وضعیت گفت‌وگو</dt>
              <dd>{item.conversationStatusLabel}</dd>
            </div>
            <div>
              <dt>نمایش به تجربه‌آفرین</dt>
              <dd>{item.providerVisibilityLabel}</dd>
            </div>
            <div>
              <dt>مرجع پرداخت</dt>
              <dd>{item.referenceSummary}</dd>
            </div>
            <div>
              <dt>رسید</dt>
              <dd>{item.receiptSummary}</dd>
            </div>
            <div>
              <dt>زمان ثبت</dt>
              <dd>{item.submittedAt}</dd>
            </div>
          </dl>
          <div className={styles.actions}>
            <Link className={styles.secondaryLink} href={`/admin/conversations/${item.conversationId}`}>
              مشاهده گفت‌وگو
            </Link>
            <Link className={styles.secondaryLink} href="/admin/audit-log">
              گزارش ممیزی
            </Link>
          </div>
        </article>

        <aside className={styles.surface}>
          <div className={styles.surfaceHeader}>
            <div>
              <h3>کنش بررسی</h3>
              <p>کنش‌ها فقط در صورت وجود API امن نمایش داده شده‌اند.</p>
            </div>
          </div>
          <AdminPaymentReviewActions paymentId={item.paymentId} actionsAvailable={item.actionsAvailable} />
        </aside>
      </section>

      <section className={styles.surface} aria-label="گزارش ممیزی پرداخت">
        <div className={styles.surfaceHeader}>
          <div>
            <h3>گزارش ممیزی</h3>
            <p>رویدادهای پایدار بررسی این پرداخت.</p>
          </div>
        </div>
        {item.auditItems?.length ? (
          <dl className={styles.detailList}>
            {item.auditItems.map((event) => (
              <div key={event.id}>
                <dt>{event.actionLabel}</dt>
                <dd>
                  {event.actorSummary} · {event.statusChange} · {event.createdAt}
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <EmptyState title="رویدادی ثبت نشده" body="پس از ثبت کنش تأیید یا رد، این بخش به روز می‌شود." />
        )}
      </section>
    </div>
  );
}

export function AdminConversationList({
  items,
  sourceNote = "نمای این بخش از fixture محلی ساخته شده است."
}: Readonly<{ items: readonly AdminConversationListItem[]; sourceNote?: string }>) {
  return (
    <div className={styles.pageStack}>
      <AdminPageHeader title="گفت‌وگوها و جلسه‌ها" description="فهرست عملیاتی چرخه عمر گفت‌وگوها با فیلترهای وضعیت." sourceNote={sourceNote} />
      <FilterStrip filters={["همه", "در انتظار پرداخت", "زمان پیشنهادی", "جلسه قطعی", "لغو شده"]} />
      <section className={styles.listSurface} aria-label="فهرست گفت‌وگوها">
        {items.map((item) => (
          <article className={styles.rowCard} key={item.id}>
            <div>
              <DataSourceBadge source={item.source} />
              <h3>{item.title}</h3>
              <p>{item.requesterSummary} / {item.providerSummary}</p>
            </div>
            <dl className={styles.inlineMeta}>
              <div>
                <dt>درخواست</dt>
                <dd>{item.requestStatusLabel}</dd>
              </div>
              <div>
                <dt>پرداخت</dt>
                <dd>{item.paymentStatusLabel}</dd>
              </div>
              <div>
                <dt>حضور</dt>
                <dd>{item.attendanceStatusLabel}</dd>
              </div>
            </dl>
            <Link className={styles.actionLink} href={item.href}>
              مشاهده گفت‌وگو
            </Link>
          </article>
        ))}
      </section>
    </div>
  );
}

export function AdminConversationDetail({ conversation }: Readonly<{ conversation: ConversationFixture }>) {
  const timeline = getConversationTimeline(conversation);

  return (
    <div className={styles.pageStack}>
      <AdminPageHeader title="جزئیات گفت‌وگو" description="نمای خط زمانی، پرداخت، زمان پیشنهادی، حضور و لغو بدون نمایش کد خام." sourceNote="نمای محلی/دمو از fixtureهای فعلی است." />
      <section className={styles.detailGrid}>
        <article className={styles.surface}>
          <div className={styles.surfaceHeader}>
            <div>
              <h3>{conversation.requestTopic ?? "گفت‌وگو"}</h3>
              <p>شناسه گفت‌وگو: <span dir="ltr">{conversation.id}</span></p>
            </div>
            <DataSourceBadge source="local_demo" />
          </div>
          <dl className={styles.detailList}>
            <div>
              <dt>درخواست‌دهنده</dt>
              <dd>{conversation.requesterName}</dd>
            </div>
            <div>
              <dt>تجربه‌آفرین</dt>
              <dd>{conversation.profile.name}</dd>
            </div>
            <div>
              <dt>مدت جلسه</dt>
              <dd>{formatDuration(conversation.duration)}</dd>
            </div>
            <div>
              <dt>موضوع</dt>
              <dd>{conversation.requestTopic ?? "ثبت نشده"}</dd>
            </div>
          </dl>
        </article>
        <article className={styles.surface}>
          <div className={styles.surfaceHeader}>
            <div>
              <h3>خط زمانی چرخه عمر</h3>
              <p>برای بررسی عملیاتی بدون داده محرمانه خام.</p>
            </div>
          </div>
          <ol className={styles.timeline}>
            {timeline.map((item) => (
              <li key={item.label}>
                <strong>{item.label}</strong>
                <span>{item.value}</span>
              </li>
            ))}
          </ol>
          <div className={styles.actions}>
            {conversation.walletCreditId ? (
              <Link className={styles.secondaryLink} href="/admin/wallet-transactions">
                مشاهده تراکنش کیف پول
              </Link>
            ) : null}
            {conversation.cancellationStage ? (
              <Link className={styles.secondaryLink} href={`/admin/cancellations/${conversation.id}`}>
                مشاهده لغو
              </Link>
            ) : null}
          </div>
        </article>
      </section>
    </div>
  );
}

export function AdminCancellationList({
  items,
  sourceNote = "نمای این بخش از fixture محلی ساخته شده است."
}: Readonly<{ items: readonly AdminCancellationItem[]; sourceNote?: string }>) {
  return (
    <div className={styles.pageStack}>
      <AdminPageHeader title="لغوها" description="صف لغوها با تأکید روی موارد در بررسی پشتیبانی." sourceNote={sourceNote} />
      <FilterStrip filters={["همه", "در بررسی پشتیبانی", "نیاز ندارد", "بررسی شده"]} />
      <section className={styles.listSurface} aria-label="فهرست لغوها">
        {items.map((item) => (
          <article className={styles.rowCard} key={item.id}>
            <div>
              <DataSourceBadge source={item.source} />
              <h3>{item.title}</h3>
              <p>{item.requesterSummary} / {item.providerSummary}</p>
            </div>
            <dl className={styles.inlineMeta}>
              <div>
                <dt>مرحله</dt>
                <dd>{item.stage}</dd>
              </div>
              <div>
                <dt>بررسی</dt>
                <dd>{item.supportStatus}</dd>
              </div>
              <div>
                <dt>اعتبار</dt>
                <dd>{item.actionsAvailable ? item.eligibleCreditAmountLabel : item.creditAmountLabel}</dd>
              </div>
              <div>
                <dt>جلسه</dt>
                <dd>{item.selectedSession}</dd>
              </div>
            </dl>
            <Link className={styles.actionLink} href={item.href}>
              مشاهده لغو
            </Link>
          </article>
        ))}
      </section>
    </div>
  );
}

export function AdminCancellationDetail({
  item,
  sourceNote = "تصمیم پشتیبانی برای لغوهای در بررسی از مسیر عملیاتی ثبت می‌شود."
}: Readonly<{ item: AdminCancellationItem; sourceNote?: string }>) {
  return (
    <div className={styles.pageStack}>
      <AdminPageHeader title="جزئیات لغو" description="بررسی پشتیبانی، مبلغ اعتبار کیف پول و گزارش ممیزی." sourceNote={sourceNote} />
      <section className={styles.detailGrid}>
        <article className={styles.surface}>
          <div className={styles.surfaceHeader}>
            <div>
              <h3>{item.title}</h3>
              <p>شناسه لغو: <span dir="ltr">{item.id}</span></p>
            </div>
            <DataSourceBadge source={item.source} />
          </div>
          <dl className={styles.detailList}>
            <div>
              <dt>دلیل</dt>
              <dd>{item.reason}</dd>
            </div>
            <div>
              <dt>مرحله</dt>
              <dd>{item.stage}</dd>
            </div>
            <div>
              <dt>وضعیت بررسی پشتیبانی</dt>
              <dd>{item.supportStatus}</dd>
            </div>
            <div>
              <dt>علت بررسی</dt>
              <dd>{item.supportReviewReason}</dd>
            </div>
            <div>
              <dt>جلسه انتخاب‌شده</dt>
              <dd>{item.selectedSession}</dd>
            </div>
            <div>
              <dt>وضعیت گفت‌وگو</dt>
              <dd>{item.conversationStatusLabel}</dd>
            </div>
            <div>
              <dt>وضعیت پرداخت</dt>
              <dd>{item.paymentStatusLabel}</dd>
            </div>
            <div>
              <dt>مبلغ پرداخت</dt>
              <dd>{item.paymentAmountLabel}</dd>
            </div>
            <div>
              <dt>محدوده اعتبار قابل بررسی</dt>
              <dd>{item.eligibleCreditAmountLabel}</dd>
            </div>
            <div>
              <dt>اعتبار ثبت‌شده</dt>
              <dd>{item.creditAmountLabel}</dd>
            </div>
            <div>
              <dt>درخواست‌دهنده</dt>
              <dd>{item.requesterSummary}</dd>
            </div>
            <div>
              <dt>تجربه‌آفرین</dt>
              <dd>{item.providerSummary}</dd>
            </div>
          </dl>
          <div className={styles.actions}>
            <Link className={styles.secondaryLink} href={`/admin/conversations/${item.conversationId}`}>
              مشاهده گفت‌وگو
            </Link>
            {item.walletTransactionHref ? (
              <Link className={styles.secondaryLink} href={item.walletTransactionHref}>
                مشاهده تراکنش کیف پول
              </Link>
            ) : null}
          </div>
        </article>
        <article className={styles.surface}>
          <div className={styles.surfaceHeader}>
            <div>
              <h3>تصمیم پشتیبانی</h3>
              <p>ثبت اعتبار کیف پول یا بستن بررسی بدون اعتبار.</p>
            </div>
          </div>
          <AdminCancellationReviewActions
            cancellationId={item.id}
            actionsAvailable={item.actionsAvailable}
            eligibleCreditAmountToman={item.eligibleCreditAmountToman}
          />
        </article>
      </section>
      <section className={styles.surface} aria-label="گزارش ممیزی لغو">
        <div className={styles.surfaceHeader}>
          <div>
            <h3>گزارش ممیزی</h3>
            <p>رویدادهای تصمیم پشتیبانی برای این لغو.</p>
          </div>
        </div>
        {item.auditItems?.length ? (
          <dl className={styles.detailList}>
            {item.auditItems.map((event) => (
              <div key={event.id}>
                <dt>{event.actionLabel}</dt>
                <dd>
                  {event.actorSummary} · {event.statusChange} · {event.createdAt}
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <EmptyState title="رویدادی ثبت نشده" body="پس از ثبت تصمیم پشتیبانی، این بخش به‌روز می‌شود." />
        )}
      </section>
    </div>
  );
}

export function AdminUsersList({
  items,
  sourceNote = "جست‌وجو و فیلتر در این چک‌پوینت اسکلت خواندنی دارد."
}: Readonly<{ items: readonly AdminUserItem[]; sourceNote?: string }>) {
  return (
    <div className={styles.pageStack}>
      <AdminPageHeader title="کاربران" description="فهرست امن کاربران، آمادگی پروفایل و وضعیت حساب." sourceNote={sourceNote} />
      <FilterStrip filters={["جست‌وجو", "همه", "درخواست‌دهنده", "تجربه‌آفرین", "نیازمند بررسی"]} />
      <section className={styles.listSurface} aria-label="فهرست کاربران">
        {items.map((item) => (
          <article className={styles.rowCard} key={item.id}>
            <div>
              <DataSourceBadge source={item.source} />
              <h3>{item.displayName}</h3>
              <p>{item.roleLabel} · <span dir="ltr">{item.id}</span></p>
            </div>
            <dl className={styles.inlineMeta}>
              <div>
                <dt>تکمیل پروفایل</dt>
                <dd>{item.profileCompletion}</dd>
              </div>
              <div>
                <dt>حساب</dt>
                <dd>{item.accountStatus}</dd>
              </div>
              <div>
                <dt>پروفایل تجربه‌آفرین</dt>
                <dd>{item.experienceProfileStatus}</dd>
              </div>
            </dl>
            <Link className={styles.actionLink} href={item.href}>
              مشاهده کاربر
            </Link>
          </article>
        ))}
      </section>
    </div>
  );
}

export function AdminUserDetail({ item, conversationsCount }: Readonly<{ item: AdminUserItem; conversationsCount: string }>) {
  return (
    <div className={styles.pageStack}>
      <AdminPageHeader title="جزئیات کاربر" description="خلاصه امن کاربر، آمادگی تجربه و پیوندهای مرتبط." sourceNote="یادداشت داخلی فقط جایگاه نمایشی دارد." />
      <section className={styles.detailGrid}>
        <article className={styles.surface}>
          <div className={styles.surfaceHeader}>
            <div>
              <h3>{item.displayName}</h3>
              <p><span dir="ltr">{item.id}</span></p>
            </div>
            <DataSourceBadge source={item.source} />
          </div>
          <dl className={styles.detailList}>
            <div>
              <dt>نقش</dt>
              <dd>{item.roleLabel}</dd>
            </div>
            <div>
              <dt>تکمیل پروفایل</dt>
              <dd>{item.profileCompletion}</dd>
            </div>
            <div>
              <dt>آمادگی تجربه</dt>
              <dd>{item.experienceProfileStatus}</dd>
            </div>
            <div>
              <dt>گفت‌وگوها</dt>
              <dd>{conversationsCount}</dd>
            </div>
            <div>
              <dt>بینش‌ها</dt>
              <dd>نمای خواندنی در آینده</dd>
            </div>
            <div>
              <dt>کیف پول</dt>
              <dd>فقط از مسیر دفتر تراکنش قابل مشاهده است</dd>
            </div>
          </dl>
        </article>
        <aside className={styles.surface}>
          <div className={styles.surfaceHeader}>
            <div>
              <h3>یادداشت داخلی</h3>
              <p>ثبت و ویرایش یادداشت در این چک‌پوینت فعال نیست.</p>
            </div>
          </div>
          <EmptyState title="یادداشتی ثبت نشده" body="جریان یادداشت داخلی در چک‌پوینت بعدی تعریف می‌شود." />
        </aside>
      </section>
    </div>
  );
}

export function AdminExperienceProfilesList({
  items,
  sourceNote = "در این چک‌پوینت کنش تأیید یا رد فعال نشده است."
}: Readonly<{ items: readonly AdminExperienceProfileItem[]; sourceNote?: string }>) {
  return (
    <div className={styles.pageStack}>
      <AdminPageHeader title="پروفایل‌های تجربه‌آفرین" description="صف بررسی، وضعیت نمایش و امتیاز آمادگی پروفایل‌ها." sourceNote={sourceNote} />
      <FilterStrip filters={["همه", "در بررسی", "فعال", "غیرفعال", "نیازمند تکمیل"]} />
      <section className={styles.listSurface} aria-label="فهرست پروفایل‌های تجربه‌آفرین">
        {items.map((item) => (
          <article className={styles.rowCard} key={item.id}>
            <div>
              <DataSourceBadge source={item.source} />
              <h3>{item.displayName}</h3>
              <p>{item.roleLabel} · {item.categories}</p>
            </div>
            <dl className={styles.inlineMeta}>
              <div>
                <dt>وضعیت نمایش</dt>
                <dd>{item.visibilityStatus}</dd>
              </div>
              <div>
                <dt>بررسی</dt>
                <dd>{item.reviewStatus}</dd>
              </div>
              <div>
                <dt>آمادگی</dt>
                <dd>{item.readinessScore}</dd>
              </div>
            </dl>
            <Link className={styles.actionLink} href={item.href}>
              مشاهده پروفایل
            </Link>
          </article>
        ))}
      </section>
    </div>
  );
}

export function AdminExperienceProfileDetail({ item, profile }: Readonly<{ item: AdminExperienceProfileItem; profile: ExperienceProfileFixture }>) {
  const checklist = getQualityChecklist(profile);

  return (
    <div className={styles.pageStack}>
      <AdminPageHeader title="جزئیات پروفایل تجربه‌آفرین" description="خلاصه حرفه‌ای، دسته‌ها، قیمت و چک‌لیست کیفیت." sourceNote="کنش بررسی پروفایل در این چک‌پوینت فعال نشده است." />
      <section className={styles.detailGrid}>
        <article className={styles.surface}>
          <div className={styles.surfaceHeader}>
            <div>
              <h3>{item.displayName}</h3>
              <p>{item.roleLabel}</p>
            </div>
            <DataSourceBadge source={item.source} />
          </div>
          <dl className={styles.detailList}>
            <div>
              <dt>معرفی حرفه‌ای</dt>
              <dd>{profile.professionalSummary}</dd>
            </div>
            <div>
              <dt>دسته شغلی</dt>
              <dd>{item.categories}</dd>
            </div>
            <div>
              <dt>گزینه‌های قیمت</dt>
              <dd>{item.pricing}</dd>
            </div>
            <div>
              <dt>وضعیت نمایش</dt>
              <dd>{item.visibilityStatus}</dd>
            </div>
            <div>
              <dt>وضعیت بررسی</dt>
              <dd>{item.reviewStatus}</dd>
            </div>
          </dl>
        </article>
        <aside className={styles.surface}>
          <div className={styles.surfaceHeader}>
            <div>
              <h3>چک‌لیست کیفیت</h3>
              <p>نمای خواندنی برای آماده‌سازی بررسی انسانی.</p>
            </div>
          </div>
          <dl className={styles.detailList}>
            {checklist.map((check) => (
              <div key={check.label}>
                <dt>{check.label}</dt>
                <dd>{check.value}</dd>
              </div>
            ))}
          </dl>
        </aside>
      </section>
    </div>
  );
}

export function AdminExperienceProfileReviewDetail({
  item,
  sourceNote = "تصمیم‌های بررسی پروفایل تجربه از مسیر عملیاتی ثبت می‌شود."
}: Readonly<{ item: AdminExperienceProfileDetailItem; sourceNote?: string }>) {
  const readinessItems = [
    { label: "وضعیت بررسی", value: item.reviewStatus },
    { label: "وضعیت نمایش", value: item.visibilityStatus },
    { label: "امتیاز آمادگی", value: item.readinessScore },
    { label: "یادداشت آخر", value: item.reviewNote }
  ];

  return (
    <div className={styles.pageStack}>
      <AdminPageHeader title="جزئیات پروفایل تجربه" description="بررسی معرفی حرفه‌ای، دسته شغلی، آمادگی و وضعیت نمایش." sourceNote={sourceNote} />
      <section className={styles.detailGrid}>
        <article className={styles.surface}>
          <div className={styles.surfaceHeader}>
            <div>
              <h3>{item.displayName}</h3>
              <p>شناسه پروفایل: <span dir="ltr">{item.id}</span></p>
            </div>
            <DataSourceBadge source={item.source} />
          </div>
          <dl className={styles.detailList}>
            <div>
              <dt>تجربه‌آفرین</dt>
              <dd>
                <Link className={styles.secondaryLink} href={item.ownerHref}>
                  {item.ownerSummary}
                </Link>
              </dd>
            </div>
            <div>
              <dt>معرفی حرفه‌ای</dt>
              <dd>{item.professionalSummary}</dd>
            </div>
            <div>
              <dt>عنوان حرفه‌ای</dt>
              <dd>{item.roleLabel}</dd>
            </div>
            <div>
              <dt>دسته شغلی</dt>
              <dd>{item.categories}</dd>
            </div>
            <div>
              <dt>سطح سازمانی</dt>
              <dd>{item.orgLevelLabel}</dd>
            </div>
            <div>
              <dt>سال تجربه</dt>
              <dd>{item.yearsOfExperienceLabel}</dd>
            </div>
            <div>
              <dt>۳۰ دقیقه</dt>
              <dd>{item.price30Label}</dd>
            </div>
            <div>
              <dt>۶۰ دقیقه</dt>
              <dd>{item.price60Label}</dd>
            </div>
            <div>
              <dt>کمک رایگان</dt>
              <dd>{item.freeHelpLabel}</dd>
            </div>
            <div>
              <dt>گفت‌وگوهای مرتبط</dt>
              <dd>{item.relatedConversationsCount}</dd>
            </div>
            <div>
              <dt>پاسخ‌های بینش</dt>
              <dd>{item.experienceAnswersCount}</dd>
            </div>
            <div>
              <dt>بینش رسمی</dt>
              <dd>{item.officialInsightsCount}</dd>
            </div>
          </dl>
          <div className={styles.actions}>
            <Link className={styles.secondaryLink} href="/admin/audit-log">
              گزارش ممیزی
            </Link>
          </div>
        </article>
        <aside className={styles.surface}>
          <div className={styles.surfaceHeader}>
            <div>
              <h3>تصمیم بررسی</h3>
              <p>تأیید، نیازمند اصلاح، یا مخفی‌سازی از کشف تجربه‌ها.</p>
            </div>
          </div>
          <AdminExperienceProfileReviewActions profileId={item.id} actionsAvailable={item.actionsAvailable} />
        </aside>
      </section>

      <section className={styles.surface} aria-label="چک‌لیست آمادگی پروفایل تجربه">
        <div className={styles.surfaceHeader}>
          <div>
            <h3>چک‌لیست آمادگی</h3>
            <p>نمای خواندنی برای تصمیم انسانی بررسی پروفایل تجربه.</p>
          </div>
        </div>
        <dl className={styles.detailList}>
          {readinessItems.map((check) => (
            <div key={check.label}>
              <dt>{check.label}</dt>
              <dd>{check.value}</dd>
            </div>
          ))}
          <div>
            <dt>ثبت</dt>
            <dd>{item.createdAt}</dd>
          </div>
          <div>
            <dt>به‌روزرسانی</dt>
            <dd>{item.updatedAt}</dd>
          </div>
        </dl>
      </section>

      <section className={styles.surface} aria-label="گزارش ممیزی پروفایل تجربه">
        <div className={styles.surfaceHeader}>
          <div>
            <h3>گزارش ممیزی</h3>
            <p>رویدادهای پایدار تصمیم‌های بررسی این پروفایل تجربه.</p>
          </div>
        </div>
        {item.auditItems?.length ? (
          <dl className={styles.detailList}>
            {item.auditItems.map((event) => (
              <div key={event.id}>
                <dt>{event.actionLabel}</dt>
                <dd>
                  {event.actorSummary} · {event.statusChange} · {event.createdAt}
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <EmptyState title="رویدادی ثبت نشده" body="پس از ثبت تصمیم بررسی، این بخش به‌روز می‌شود." />
        )}
      </section>
    </div>
  );
}

export function AdminInsightsList({
  items,
  sourceNote = "بینش‌ها از read model متصل به پایگاه داده خوانده می‌شوند."
}: Readonly<{ items: readonly AdminInsightItem[]; sourceNote?: string }>) {
  return (
    <div className={styles.pageStack}>
      <AdminPageHeader title="بینش‌ها" description="فهرست بررسی وضعیت انتشار، نویسنده، دسته و پاسخ‌های کوتاه." sourceNote={sourceNote} />
      <FilterStrip filters={["همه", "منتشر شده", "مخفی شده", "حذف نرم", "پیش‌نویس"]} />
      <section className={styles.listSurface} aria-label="فهرست بینش‌ها">
        {items.length ? (
          items.map((item) => (
            <article className={styles.rowCard} key={item.id}>
              <div>
                <DataSourceBadge source={item.source} />
                <h3>{item.title}</h3>
                <p>{item.authorSummary} · {item.categorySummary}</p>
              </div>
              <dl className={styles.inlineMeta}>
                <div>
                  <dt>وضعیت انتشار</dt>
                  <dd>{item.publicationStatus}</dd>
                </div>
                <div>
                  <dt>وضعیت بررسی</dt>
                  <dd>{item.moderationStatus}</dd>
                </div>
                <div>
                  <dt>پاسخ کوتاه</dt>
                  <dd>{item.answerCount}</dd>
                </div>
              </dl>
              <Link className={styles.actionLink} href={item.href}>
                مشاهده بینش
              </Link>
            </article>
          ))
        ) : (
          <EmptyState title="بینشی برای نمایش نیست" body="منبع داده خوانده شد و داده ساختگی نمایش داده نمی‌شود." />
        )}
      </section>
    </div>
  );
}

export function AdminInsightDetail({
  item,
  sourceNote = "کنش‌های بررسی بینش از مسیر عملیاتی ثبت می‌شوند."
}: Readonly<{ item: AdminInsightDetailItem; sourceNote?: string }>) {
  return (
    <div className={styles.pageStack}>
      <AdminPageHeader title="جزئیات بینش" description="بررسی محتوای بینش، وضعیت انتشار، پاسخ‌های کوتاه و گزارش ممیزی." sourceNote={sourceNote} />
      <section className={styles.detailGrid}>
        <article className={styles.surface}>
          <div className={styles.surfaceHeader}>
            <div>
              <h3>{item.title}</h3>
              <p>شناسه بینش: <span dir="ltr">{item.id}</span></p>
            </div>
            <DataSourceBadge source={item.source} />
          </div>
          <dl className={styles.detailList}>
            <div>
              <dt>نویسنده</dt>
              <dd>
                {item.authorHref ? (
                  <Link className={styles.secondaryLink} href={item.authorHref}>
                    {item.authorSummary}
                  </Link>
                ) : (
                  item.authorSummary
                )}
              </dd>
            </div>
            <div>
              <dt>پروفایل تجربه</dt>
              <dd>{item.profileSummary}</dd>
            </div>
            <div>
              <dt>دسته شغلی</dt>
              <dd>{item.categorySummary}</dd>
            </div>
            <div>
              <dt>وضعیت انتشار</dt>
              <dd>{item.publicationStatus}</dd>
            </div>
            <div>
              <dt>وضعیت بررسی</dt>
              <dd>{item.moderationStatus}</dd>
            </div>
            <div>
              <dt>پرسش</dt>
              <dd>{item.promptSummary}</dd>
            </div>
            <div>
              <dt>متن بینش</dt>
              <dd>{item.bodySummary}</dd>
            </div>
            <div>
              <dt>پاسخ‌های کوتاه</dt>
              <dd>{item.answerCount}</dd>
            </div>
            <div>
              <dt>انتشار</dt>
              <dd>{item.publishedAt}</dd>
            </div>
            <div>
              <dt>مخفی‌کردن</dt>
              <dd>{item.hiddenAt}</dd>
            </div>
          </dl>
          <div className={styles.actions}>
            <Link className={styles.secondaryLink} href="/admin/audit-log">
              گزارش ممیزی
            </Link>
          </div>
        </article>
        <aside className={styles.surface}>
          <div className={styles.surfaceHeader}>
            <div>
              <h3>تصمیم بررسی</h3>
              <p>مخفی‌کردن، بازگردانی یا حذف نرم بینش.</p>
            </div>
          </div>
          <AdminInsightModerationActions insightId={item.id} actionsAvailable={item.actionsAvailable} />
        </aside>
      </section>

      <section className={styles.surface} aria-label="پاسخ‌های کوتاه بینش">
        <div className={styles.surfaceHeader}>
          <div>
            <h3>پاسخ‌های کوتاه</h3>
            <p>پاسخ‌ها مستقل از خود بینش بررسی می‌شوند.</p>
          </div>
        </div>
        {item.answers.length ? (
          <div className={styles.answerModerationList}>
            {item.answers.map((answer) => (
              <article className={styles.answerModerationItem} key={answer.id}>
                <div>
                  <h3>{answer.questionSummary}</h3>
                  <p>{answer.answerSummary}</p>
                </div>
                <dl className={styles.inlineMeta}>
                  <div>
                    <dt>نویسنده</dt>
                    <dd>{answer.authorSummary}</dd>
                  </div>
                  <div>
                    <dt>وضعیت</dt>
                    <dd>{answer.statusLabel}</dd>
                  </div>
                  <div>
                    <dt>ثبت</dt>
                    <dd>{answer.submittedAt}</dd>
                  </div>
                </dl>
                <AdminInsightAnswerModerationActions answerId={answer.id} hideAvailable={answer.actionsAvailable.hide} />
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="پاسخ کوتاهی ثبت نشده" body="اگر پاسخ کوتاهی وجود داشته باشد، از همین بخش قابل بررسی است." />
        )}
      </section>

      <section className={styles.surface} aria-label="گزارش ممیزی بینش">
        <div className={styles.surfaceHeader}>
          <div>
            <h3>گزارش ممیزی</h3>
            <p>رویدادهای پایدار بررسی این بینش و پاسخ‌های کوتاه مرتبط.</p>
          </div>
        </div>
        {item.auditItems?.length ? (
          <dl className={styles.detailList}>
            {item.auditItems.map((event) => (
              <div key={event.id}>
                <dt>{event.actionLabel}</dt>
                <dd>
                  {event.actorSummary} · {event.statusChange} · {event.createdAt}
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <EmptyState title="رویدادی ثبت نشده" body="پس از ثبت تصمیم بررسی، این بخش به‌روز می‌شود." />
        )}
      </section>
    </div>
  );
}

export function AdminWalletLedger({
  items,
  sourceNote = "هیچ کنش تغییر موجودی در این صفحه وجود ندارد."
}: Readonly<{ items: readonly AdminWalletLedgerItem[]; sourceNote?: string }>) {
  return (
    <div className={styles.pageStack}>
      <AdminPageHeader title="دفتر تراکنش کیف پول" description="نمای خواندنی تراکنش‌ها با پیوند به گفت‌وگو، پرداخت و کاربر." sourceNote={sourceNote} />
      <section className={styles.listSurface} aria-label="دفتر تراکنش کیف پول">
        {items.map((item) => (
          <article className={styles.rowCard} key={item.id}>
            <div>
              <DataSourceBadge source={item.source} />
              <h3>{item.title}</h3>
              <p>{item.typeLabel} · {item.createdAt}</p>
            </div>
            <dl className={styles.inlineMeta}>
              <div>
                <dt>مبلغ</dt>
                <dd>{item.amountLabel}</dd>
              </div>
              <div>
                <dt>وضعیت</dt>
                <dd>{item.statusLabel}</dd>
              </div>
            </dl>
            <div className={styles.actions}>
              <Link className={styles.secondaryLink} href={item.userHref}>
                کاربر
              </Link>
              {item.sourceConversationHref ? (
                <Link className={styles.secondaryLink} href={item.sourceConversationHref}>
                  گفت‌وگو
                </Link>
              ) : null}
              {item.paymentHref ? (
                <Link className={styles.secondaryLink} href={item.paymentHref}>
                  پرداخت
                </Link>
              ) : null}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

export function AdminReadDetailView({ detail }: Readonly<{ detail: AdminReadDetail }>) {
  return (
    <div className={styles.pageStack}>
      <AdminPageHeader title={detail.title} description={detail.description} sourceNote={detail.sourceNote} />
      <section className={styles.detailGrid}>
        <article className={styles.surface}>
          <div className={styles.surfaceHeader}>
            <div>
              <h3>{detail.title}</h3>
              <p>
                {detail.idLabel}: <span dir="ltr">{detail.id}</span>
              </p>
            </div>
            <DataSourceBadge source={detail.source} />
          </div>
          {detail.sections.map((section) => (
            <dl className={styles.detailList} key={section.title}>
              <div>
                <dt>{section.title}</dt>
                <dd />
              </div>
              {section.items.map((item) => (
                <div key={`${section.title}-${item.label}`}>
                  <dt>{item.label}</dt>
                  <dd>
                    {item.href ? (
                      <Link className={styles.secondaryLink} href={item.href}>
                        {item.value}
                      </Link>
                    ) : (
                      item.value
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          ))}
          {detail.actions.length ? (
            <div className={styles.actions}>
              {detail.actions.map((action) => (
                <Link className={styles.secondaryLink} href={action.href} key={action.href}>
                  {action.label}
                </Link>
              ))}
            </div>
          ) : null}
        </article>
      </section>
    </div>
  );
}

export function AdminAttendanceList({ items, sourceNote }: Readonly<{ items: readonly AdminAttendanceItem[]; sourceNote: string }>) {
  return (
    <div className={styles.pageStack}>
      <AdminPageHeader title="حضور جلسه" description="نمای خواندنی برای وضعیت تأیید برگزاری جلسه، بدون نمایش داده خام." sourceNote={sourceNote} />
      <section className={styles.listSurface} aria-label="حضور جلسه">
        {items.length ? (
          items.map((item) => (
            <article className={styles.rowCard} key={item.id}>
              <div>
                <DataSourceBadge source={item.source} />
                <h3>{item.title}</h3>
                <p>{item.requesterSummary} / {item.providerSummary}</p>
              </div>
              <dl className={styles.inlineMeta}>
                <div>
                  <dt>جلسه</dt>
                  <dd>{item.selectedSession}</dd>
                </div>
                <div>
                  <dt>وضعیت</dt>
                  <dd>{item.attendanceStatusLabel}</dd>
                </div>
                <div>
                  <dt>تلاش</dt>
                  <dd>{item.attemptsLabel}</dd>
                </div>
              </dl>
              <Link className={styles.actionLink} href={item.href}>
                مشاهده گفت‌وگو
              </Link>
            </article>
          ))
        ) : (
          <EmptyState title="موردی برای بررسی نیست" body="منبع داده خوانده شد و صف بررسی خالی است." />
        )}
      </section>
    </div>
  );
}

export function AdminContentManagement({ data }: Readonly<{ data: AdminContentData }>) {
  return (
    <div className={styles.pageStack}>
      <AdminPageHeader
        title="مدیریت محتوا"
        description="مدیریت محدود و امن کپی وب‌سایت، محتوای پلتفرمی و مسیرهای moderation محتوای کاربرساخته."
        sourceNote={data.sourceNote}
      />
      <section className={styles.surface}>
        <div className={styles.surfaceHeader}>
          <div>
            <h3>فیلتر محتوا</h3>
            <p>فیلترها فقط ردیف‌های ContentEntry را محدود می‌کنند و ردیف ساختگی نمایش داده نمی‌شود.</p>
          </div>
          <DataSourceBadge source={data.source} />
        </div>
        <div>
          <p className={styles.filterTitle}>فضای محتوا</p>
          <div className={styles.filters}>
            {data.namespaceOptions.map((option) => (
              <Link className={option.active ? styles.filterLinkActive : styles.filterLink} href={option.href} key={`namespace-${option.value || "all"}`}>
                {option.label}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <p className={styles.filterTitle}>نوع محتوا</p>
          <div className={styles.filters}>
            {data.contentTypeOptions.map((option) => (
              <Link className={option.active ? styles.filterLinkActive : styles.filterLink} href={option.href} key={`type-${option.value || "all"}`}>
                {option.label}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <p className={styles.filterTitle}>وضعیت</p>
          <div className={styles.filters}>
            {data.statusOptions.map((option) => (
              <Link className={option.active ? styles.filterLinkActive : styles.filterLink} href={option.href} key={`status-${option.value || "all"}`}>
                {option.label}
              </Link>
            ))}
          </div>
        </div>
        <form className={styles.reviewBox} action="/admin/content">
          {data.activeFilters.namespace ? <input type="hidden" name="namespace" value={data.activeFilters.namespace} /> : null}
          {data.activeFilters.contentType ? <input type="hidden" name="contentType" value={data.activeFilters.contentType} /> : null}
          {data.activeFilters.status ? <input type="hidden" name="status" value={data.activeFilters.status} /> : null}
          <label>
            <span>جست‌وجو</span>
            <input name="search" defaultValue={data.activeFilters.search} placeholder="کلید، عنوان یا متن" />
          </label>
          <button className={styles.secondaryButton} type="submit">
            اعمال جست‌وجو
          </button>
        </form>
      </section>
      <section className={styles.detailGrid}>
        <article className={styles.surface}>
          <div className={styles.surfaceHeader}>
            <div>
              <h3>وب‌سایت و کپی سیستم</h3>
              <p>این جدول برای Platform/System Copy و Managed Content است؛ متن کاربرساخته از این مسیر ویرایش نمی‌شود.</p>
            </div>
          </div>
          {data.items.length ? (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>عنوان</th>
                    <th>کلید</th>
                    <th>فضا</th>
                    <th>نوع</th>
                    <th>وضعیت</th>
                    <th>ویرایش‌پذیری</th>
                    <th>خلاصه متن</th>
                    <th>آخرین تغییر</th>
                    <th>کنش</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.title}</td>
                      <td dir="ltr">{item.key}</td>
                      <td dir="ltr">{item.namespace}</td>
                      <td>{item.contentTypeLabel}</td>
                      <td>{item.statusLabel}</td>
                      <td>
                        {item.editableLabel} / {item.systemLabel}
                      </td>
                      <td>{item.bodySummary}</td>
                      <td>{item.updatedAt}</td>
                      <td>
                        <Link className={styles.secondaryLink} href={item.href}>
                          جزئیات
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="محتوای مدیریت‌شده‌ای ثبت نشده است"
              body="اگر DB یا ردیف محتوا در دسترس نباشد، این بخش ردیف نمایشی یا محتوای ساختگی نشان نمی‌دهد."
            />
          )}
        </article>
        <aside className={styles.surface}>
          <div className={styles.surfaceHeader}>
            <div>
              <h3>محتوای تازه</h3>
              <p>برای بلوک‌های مدیریت‌شده محدود؛ صفحه‌ساز یا ویرایشگر متن غنی در این checkpoint اضافه نشده است.</p>
            </div>
          </div>
          <AdminContentActions mode="create" viewerCanMutate={data.viewerCanMutate} />
        </aside>
      </section>
      <section className={styles.surface}>
        <div className={styles.surfaceHeader}>
          <div>
            <h3>مرور محتوای کاربرساخته</h3>
            <p>این بخش فقط مسیرهای moderation موجود را نشان می‌دهد و متن کاربر را بازنویسی نمی‌کند.</p>
          </div>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>نوع محتوا</th>
                <th>وضعیت</th>
                <th>توضیح</th>
                <th>مسیر</th>
              </tr>
            </thead>
            <tbody>
              {data.ugcOverview.map((item) => (
                <tr key={item.id}>
                  <td>{item.title}</td>
                  <td>{item.status}</td>
                  <td>{item.description}</td>
                  <td>
                    {item.href ? (
                      <Link className={styles.secondaryLink} href={item.href}>
                        {item.ctaLabel ?? "مشاهده"}
                      </Link>
                    ) : (
                      "پیاده‌سازی نشده"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export function AdminContentDetail({ data }: Readonly<{ data: AdminContentDetailData }>) {
  const item = data.item;

  if (!item) {
    return (
      <div className={styles.pageStack}>
        <AdminPageHeader title="جزئیات محتوا" description="ردیف محتوا پیدا نشد." sourceNote={data.sourceNote} />
        <section className={styles.surface}>
          <EmptyState title="محتوا پیدا نشد" body="هیچ ردیف ساختگی برای این جزئیات نمایش داده نمی‌شود." />
        </section>
      </div>
    );
  }

  return (
    <div className={styles.pageStack}>
      <AdminPageHeader
        title="جزئیات محتوای مدیریت‌شده"
        description="مشاهده و ویرایش محدود ردیف‌های امن محتوا؛ محتوای کاربرساخته از این مسیر بازنویسی نمی‌شود."
        sourceNote={data.sourceNote}
      />
      <section className={styles.detailGrid}>
        <article className={styles.surface}>
          <div className={styles.surfaceHeader}>
            <div>
              <h3>{item.title}</h3>
              <p>
                شناسه محتوا: <span dir="ltr">{item.id}</span>
              </p>
            </div>
            <DataSourceBadge source={item.source} />
          </div>
          <dl className={styles.detailList}>
            <div>
              <dt>کلید</dt>
              <dd dir="ltr">{item.key}</dd>
            </div>
            <div>
              <dt>فضا</dt>
              <dd dir="ltr">{item.namespace}</dd>
            </div>
            <div>
              <dt>زبان</dt>
              <dd dir="ltr">{item.locale}</dd>
            </div>
            <div>
              <dt>نوع محتوا</dt>
              <dd>{item.contentTypeLabel}</dd>
            </div>
            <div>
              <dt>وضعیت</dt>
              <dd>{item.statusLabel}</dd>
            </div>
            <div>
              <dt>ویرایش‌پذیری</dt>
              <dd>
                {item.editableLabel} / {item.systemLabel}
              </dd>
            </div>
            <div>
              <dt>متن کوتاه</dt>
              <dd>{item.shortText || "ثبت نشده"}</dd>
            </div>
            <div>
              <dt>توضیح داخلی</dt>
              <dd>{item.description || "ثبت نشده"}</dd>
            </div>
            <div>
              <dt>ثبت‌کننده</dt>
              <dd>{item.createdBySummary}</dd>
            </div>
            <div>
              <dt>آخرین ویرایش‌کننده</dt>
              <dd>{item.updatedBySummary}</dd>
            </div>
            <div>
              <dt>آخرین تغییر</dt>
              <dd>{item.updatedAt}</dd>
            </div>
            <div>
              <dt>آرشیو</dt>
              <dd>{item.archivedAt}</dd>
            </div>
          </dl>
          <section className={styles.emptyState}>
            <strong>متن کامل</strong>
            <p>{item.bodyValue}</p>
          </section>
          <div className={styles.actions}>
            <Link className={styles.secondaryLink} href="/admin/content">
              بازگشت به مدیریت محتوا
            </Link>
            <Link className={styles.secondaryLink} href="/admin/audit-log">
              گزارش ممیزی
            </Link>
          </div>
        </article>
        <aside className={styles.surface}>
          <div className={styles.surfaceHeader}>
            <div>
              <h3>ویرایش و آرشیو</h3>
              <p>فقط ADMIN می‌تواند ردیف‌های قابل ویرایش را تغییر دهد؛ SUPPORT این بخش را خواندنی می‌بیند.</p>
            </div>
          </div>
          <AdminContentActions mode="edit" entry={item} viewerCanMutate={data.viewerCanMutate} />
        </aside>
      </section>
      <section className={styles.surface} aria-label="گزارش ممیزی محتوا">
        <div className={styles.surfaceHeader}>
          <div>
            <h3>گزارش ممیزی</h3>
            <p>رویدادهای ایجاد، ویرایش، آرشیو و بازگردانی این محتوا.</p>
          </div>
        </div>
        {item.auditItems?.length ? (
          <dl className={styles.detailList}>
            {item.auditItems.map((event) => (
              <div key={event.id}>
                <dt>{event.actionLabel}</dt>
                <dd>
                  {event.actorSummary} · {event.statusChange} · {event.createdAt}
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <EmptyState title="رویدادی ثبت نشده" body="پس از ثبت کنش محتوا، این بخش از پایگاه داده به‌روز می‌شود." />
        )}
      </section>
    </div>
  );
}

export function AdminSupportInbox({ data }: Readonly<{ data: AdminSupportInboxData }>) {
  return (
    <div className={styles.pageStack}>
      <AdminPageHeader
        title="صندوق پشتیبانی"
        description="پیگیری عملیاتی تیکت‌ها بدون تغییر مستقیم پرداخت، کیف پول، لغو یا چرخه گفت‌وگو."
        sourceNote={data.sourceNote}
      />
      <section className={styles.metricGrid} aria-label="شاخص‌های پشتیبانی">
        {data.metrics.map((metric) =>
          metric.href ? (
            <Link className={styles.metricCard} href={metric.href} key={metric.id}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
              <small>{metric.helper}</small>
            </Link>
          ) : (
            <article className={styles.metricCard} key={metric.id}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
              <small>{metric.helper}</small>
            </article>
          )
        )}
      </section>
      <section className={styles.surface}>
        <div className={styles.surfaceHeader}>
          <div>
            <h3>صف‌ها و فیلترها</h3>
            <p>فقط ردیف‌های SupportTicket از پایگاه داده نمایش داده می‌شود؛ داده نمایشی جایگزین نمی‌شود.</p>
          </div>
          <DataSourceBadge source={data.source} />
        </div>
        <div>
          <p className={styles.filterTitle}>صف سریع</p>
          <div className={styles.filters}>
            {data.queueOptions.map((option) => (
              <Link className={option.active ? styles.filterLinkActive : styles.filterLink} href={option.href} key={`queue-${option.value || "all"}`}>
                {option.label}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <p className={styles.filterTitle}>وضعیت</p>
          <div className={styles.filters}>
            {data.statusOptions.map((option) => (
              <Link className={option.active ? styles.filterLinkActive : styles.filterLink} href={option.href} key={`status-${option.value || "all"}`}>
                {option.label}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <p className={styles.filterTitle}>اولویت</p>
          <div className={styles.filters}>
            {data.priorityOptions.map((option) => (
              <Link className={option.active ? styles.filterLinkActive : styles.filterLink} href={option.href} key={`priority-${option.value || "all"}`}>
                {option.label}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <p className={styles.filterTitle}>دسته و منبع</p>
          <div className={styles.filters}>
            {data.categoryOptions.map((option) => (
              <Link className={option.active ? styles.filterLinkActive : styles.filterLink} href={option.href} key={`category-${option.value || "all"}`}>
                {option.label}
              </Link>
            ))}
            {data.sourceOptions.map((option) => (
              <Link className={option.active ? styles.filterLinkActive : styles.filterLink} href={option.href} key={`source-${option.value || "all"}`}>
                {option.label}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <p className={styles.filterTitle}>موجودیت مرتبط</p>
          <div className={styles.filters}>
            {data.relatedEntityOptions.map((option) => (
              <Link className={option.active ? styles.filterLinkActive : styles.filterLink} href={option.href} key={`related-${option.value || "all"}`}>
                {option.label}
              </Link>
            ))}
          </div>
        </div>
        <form className={styles.reviewBox} action="/admin/support">
          {data.activeFilters.view ? <input type="hidden" name="view" value={data.activeFilters.view} /> : null}
          {data.activeFilters.status ? <input type="hidden" name="status" value={data.activeFilters.status} /> : null}
          {data.activeFilters.priority ? <input type="hidden" name="priority" value={data.activeFilters.priority} /> : null}
          {data.activeFilters.category ? <input type="hidden" name="category" value={data.activeFilters.category} /> : null}
          {data.activeFilters.source ? <input type="hidden" name="source" value={data.activeFilters.source} /> : null}
          {data.activeFilters.relatedEntityType ? <input type="hidden" name="relatedEntityType" value={data.activeFilters.relatedEntityType} /> : null}
          <label>
            <span>مسئول</span>
            <select name="assignee" defaultValue={data.activeFilters.assignee}>
              <option value="">همه</option>
              <option value="me">تیکت‌های من</option>
              <option value="unassigned">بدون مسئول</option>
            </select>
          </label>
          <label>
            <span>جست‌وجو</span>
            <input name="search" defaultValue={data.activeFilters.search} placeholder="شماره، موضوع، شرح یا شناسه مرتبط" />
          </label>
          <button className={styles.secondaryButton} type="submit">
            اعمال فیلتر
          </button>
        </form>
      </section>
      <section className={styles.detailGrid}>
        <article className={styles.surface}>
          <div className={styles.surfaceHeader}>
            <div>
              <h3>تیکت‌ها</h3>
              <p>کنش‌های حساس از صفحه رسمی همان موجودیت انجام می‌شود، نه از صندوق پشتیبانی.</p>
            </div>
          </div>
          {data.items.length ? (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>تیکت</th>
                    <th>وضعیت</th>
                    <th>اولویت</th>
                    <th>دسته</th>
                    <th>کاربر / مسئول</th>
                    <th>ارتباط</th>
                    <th>سن / آخرین تغییر</th>
                    <th>کنش</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong className={styles.rowTitle}>{item.subject}</strong>
                        <span dir="ltr">{item.ticketNumber}</span>
                        <br />
                        {item.preview}
                      </td>
                      <td>{item.statusLabel}</td>
                      <td>{item.priorityLabel}</td>
                      <td>
                        {item.categoryLabel}
                        <br />
                        {item.subcategory}
                      </td>
                      <td>
                        {item.requesterSummary}
                        <br />
                        {item.assigneeSummary}
                      </td>
                      <td>
                        {item.relatedEntityHref ? (
                          <Link className={styles.secondaryLink} href={item.relatedEntityHref}>
                            {item.relatedEntityLabel}
                          </Link>
                        ) : (
                          item.relatedEntityLabel
                        )}
                        <br />
                        <span dir="ltr">{item.relatedEntityId}</span>
                      </td>
                      <td>
                        {item.ageLabel}
                        <br />
                        {item.updatedAt}
                      </td>
                      <td>
                        <Link className={styles.secondaryLink} href={item.href}>
                          جزئیات
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="تیکتی برای نمایش نیست" body="اگر DB یا ردیف پشتیبانی در دسترس نباشد، این بخش ردیف نمایشی نشان نمی‌دهد." />
          )}
        </article>
        <aside className={styles.surface}>
          <div className={styles.surfaceHeader}>
            <div>
              <h3>تیکت تازه</h3>
              <p>برای ثبت پیگیری داخلی؛ ارسال پیام، اعلان یا تغییر چرخه محصول انجام نمی‌شود.</p>
            </div>
          </div>
          <AdminSupportActions
            mode="create"
            viewerCanCreate={data.viewerCanCreate}
            viewerCanMutate={data.viewerCanMutate}
            viewerCanArchive={data.viewerCanArchive}
            viewerId={data.viewerId}
          />
        </aside>
      </section>
    </div>
  );
}

export function AdminSupportDetail({ data }: Readonly<{ data: AdminSupportDetailData }>) {
  const item = data.item;

  if (!item) {
    return (
      <div className={styles.pageStack}>
        <AdminPageHeader title="جزئیات تیکت پشتیبانی" description="تیکت پیدا نشد." sourceNote={data.sourceNote} />
        <section className={styles.surface}>
          <EmptyState title="تیکت پیدا نشد" body="هیچ ردیف ساختگی برای این جزئیات نمایش داده نمی‌شود." />
        </section>
      </div>
    );
  }

  return (
    <div className={styles.pageStack}>
      <AdminPageHeader
        title="جزئیات تیکت پشتیبانی"
        description="پیگیری امن تیکت و لینک به مسیرهای رسمی برای کنش‌های حساس."
        sourceNote={data.sourceNote}
      />
      <section className={styles.detailGrid}>
        <article className={styles.surface}>
          <div className={styles.surfaceHeader}>
            <div>
              <h3>{item.subject}</h3>
              <p dir="ltr">{item.ticketNumber}</p>
            </div>
            <DataSourceBadge source={item.source} />
          </div>
          <dl className={styles.detailList}>
            <div>
              <dt>وضعیت</dt>
              <dd>{item.statusLabel}</dd>
            </div>
            <div>
              <dt>اولویت</dt>
              <dd>{item.priorityLabel}</dd>
            </div>
            <div>
              <dt>دسته</dt>
              <dd>{item.categoryLabel}</dd>
            </div>
            <div>
              <dt>زیردسته</dt>
              <dd>{item.subcategory}</dd>
            </div>
            <div>
              <dt>منبع</dt>
              <dd>{item.sourceLabel}</dd>
            </div>
            <div>
              <dt>کاربر</dt>
              <dd>
                {item.requesterHref ? (
                  <Link className={styles.secondaryLink} href={item.requesterHref}>
                    {item.requesterSummary}
                  </Link>
                ) : (
                  item.requesterSummary
                )}
              </dd>
            </div>
            <div>
              <dt>مسئول</dt>
              <dd>{item.assigneeSummary}</dd>
            </div>
            <div>
              <dt>موجودیت مرتبط</dt>
              <dd>
                {item.relatedEntityHref ? (
                  <Link className={styles.secondaryLink} href={item.relatedEntityHref}>
                    {item.relatedEntityLabel} · {item.relatedEntityId}
                  </Link>
                ) : (
                  `${item.relatedEntityLabel} · ${item.relatedEntityId}`
                )}
              </dd>
            </div>
            <div>
              <dt>ایجاد</dt>
              <dd>{item.createdAt}</dd>
            </div>
            <div>
              <dt>آخرین فعالیت</dt>
              <dd>{item.updatedAt}</dd>
            </div>
            <div>
              <dt>حل</dt>
              <dd>{item.resolvedAt}</dd>
            </div>
            <div>
              <dt>آرشیو</dt>
              <dd>{item.archivedAt}</dd>
            </div>
          </dl>
          <section className={styles.emptyState}>
            <strong>شرح مسئله</strong>
            <p>{item.description}</p>
          </section>
          <section className={styles.emptyState}>
            <strong>نتیجه پیگیری</strong>
            <p>{item.resolutionSummary}</p>
            <p>{item.resolutionReason}</p>
          </section>
          <div className={styles.actions}>
            <Link className={styles.secondaryLink} href="/admin/support">
              بازگشت به صندوق پشتیبانی
            </Link>
            <Link className={styles.secondaryLink} href="/admin/audit-log">
              گزارش ممیزی
            </Link>
          </div>
        </article>
        <aside className={styles.surface}>
          <div className={styles.surfaceHeader}>
            <div>
              <h3>کنش‌های تیکت</h3>
              <p>برای پرداخت، لغو، کیف پول یا گفت‌وگو از لینک موجودیت مرتبط استفاده کنید.</p>
            </div>
          </div>
          <AdminSupportActions
            mode="detail"
            ticket={item}
            viewerCanCreate={data.viewerCanCreate}
            viewerCanMutate={data.viewerCanMutate}
            viewerCanArchive={data.viewerCanArchive}
            viewerId={data.viewerId}
          />
        </aside>
      </section>
      <section className={styles.surface}>
        <div className={styles.surfaceHeader}>
          <div>
            <h3>یادداشت‌ها</h3>
            <p>PUBLIC_DRAFT فقط پیش‌نویس است و در این چک‌پوینت ارسال بیرونی ندارد.</p>
          </div>
        </div>
        {item.notes.length ? (
          <ol className={styles.timeline}>
            {item.notes.map((note) => (
              <li key={note.id}>
                <strong>{note.noteTypeLabel}</strong>
                <span>{note.body}</span>
                <span>
                  {note.createdBySummary} · {note.createdAt}
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <EmptyState title="یادداشتی ثبت نشده" body="یادداشت داخلی پس از ثبت در همین صفحه نمایش داده می‌شود." />
        )}
      </section>
      <section className={styles.surface} aria-label="گزارش ممیزی پشتیبانی">
        <div className={styles.surfaceHeader}>
          <div>
            <h3>گزارش ممیزی</h3>
            <p>رویدادهای ایجاد، ویرایش، تخصیص، یادداشت، حل، بازگشایی و آرشیو این تیکت.</p>
          </div>
        </div>
        {item.auditItems?.length ? (
          <dl className={styles.detailList}>
            {item.auditItems.map((event) => (
              <div key={event.id}>
                <dt>{event.actionLabel}</dt>
                <dd>
                  {event.actorSummary} · {event.statusChange} · {event.createdAt}
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <EmptyState title="رویدادی ثبت نشده" body="پس از ثبت کنش پشتیبانی، این بخش از پایگاه داده به‌روز می‌شود." />
        )}
      </section>
    </div>
  );
}

export function AdminCategories({ data }: Readonly<{ data: AdminCategoriesData }>) {
  return (
    <div className={styles.pageStack}>
      <AdminPageHeader
        title="دسته‌های شغلی و موضوعات تجربه"
        description="مدیریت ساختار شغلی که در کشف تجربه، بینش‌ها، قیمت‌گذاری و تحلیل استفاده می‌شود."
        sourceNote={data.sourceNote}
      />
      <section className={styles.detailGrid}>
        <article className={styles.surface}>
          <div className={styles.surfaceHeader}>
            <div>
              <h3>دسته‌های شغلی</h3>
              <p>ردیف‌ها از پایگاه داده خوانده می‌شوند و در صورت نبود DB، داده نمایشی نشان داده نمی‌شود.</p>
            </div>
            <DataSourceBadge source={data.source} />
          </div>
          {data.items.length ? (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>دسته شغلی</th>
                    <th>شناسه</th>
                    <th>دسته بالادست</th>
                    <th>وضعیت</th>
                    <th>نمایش</th>
                    <th>پروفایل / بینش / قیمت</th>
                    <th>آخرین تغییر</th>
                    <th>کنش</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.titleFa}</td>
                      <td dir="ltr">{item.slug}</td>
                      <td>{item.parentLabel}</td>
                      <td>{item.activeLabel}</td>
                      <td>{item.visibilitySummary}</td>
                      <td>
                        {item.profileCountLabel} / {item.insightCountLabel} / {item.pricingRuleCountLabel}
                      </td>
                      <td>{item.updatedAt}</td>
                      <td>
                        <Link className={styles.secondaryLink} href={item.href}>
                          جزئیات
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="دسته شغلی ثبت نشده است" body="بعد از آماده شدن DB، دسته‌های شغلی واقعی اینجا نمایش داده می‌شوند؛ ردیف ساختگی نداریم." />
          )}
        </article>
        <aside className={styles.surface}>
          <div className={styles.surfaceHeader}>
            <div>
              <h3>دسته شغلی تازه</h3>
              <p>شناسه لاتین پایدار می‌ماند و عنوان فارسی در تجربه محصول نمایش داده می‌شود.</p>
            </div>
          </div>
          <AdminCategoryActions mode="create" parentOptions={data.parentOptions} viewerCanMutate={data.viewerCanMutate} />
        </aside>
      </section>
    </div>
  );
}

export function AdminCategoryDetail({ data }: Readonly<{ data: AdminCategoryDetailData }>) {
  const item = data.item;

  if (!item) {
    return (
      <div className={styles.pageStack}>
        <AdminPageHeader title="جزئیات دسته شغلی" description="دسته شغلی پیدا نشد." sourceNote={data.sourceNote} />
        <section className={styles.surface}>
          <EmptyState title="دسته شغلی پیدا نشد" body="هیچ ردیف ساختگی برای این جزئیات نمایش داده نمی‌شود." />
        </section>
      </div>
    );
  }

  return (
    <div className={styles.pageStack}>
      <AdminPageHeader
        title="جزئیات دسته شغلی"
        description="ویرایش وضعیت، نمایش در مسیرها و آرشیو نرم دسته شغلی بدون حذف رکوردهای متصل."
        sourceNote={data.sourceNote}
      />
      <section className={styles.detailGrid}>
        <article className={styles.surface}>
          <div className={styles.surfaceHeader}>
            <div>
              <h3>{item.titleFa}</h3>
              <p>
                شناسه دسته: <span dir="ltr">{item.id}</span>
              </p>
            </div>
            <DataSourceBadge source={item.source} />
          </div>
          <dl className={styles.detailList}>
            <div>
              <dt>شناسه لاتین</dt>
              <dd dir="ltr">{item.slug}</dd>
            </div>
            <div>
              <dt>حوزه شغلی</dt>
              <dd>{item.parentLabel}</dd>
            </div>
            <div>
              <dt>اتصال JobField</dt>
              <dd>{item.jobFieldLabel}</dd>
            </div>
            <div>
              <dt>وضعیت فعال</dt>
              <dd>{item.activeLabel}</dd>
            </div>
            <div>
              <dt>نمایش در مسیرها</dt>
              <dd>{item.visibilitySummary}</dd>
            </div>
            <div>
              <dt>ترتیب نمایش</dt>
              <dd>{item.sortOrder}</dd>
            </div>
            <div>
              <dt>پروفایل‌های متصل</dt>
              <dd>{item.profileCountLabel}</dd>
            </div>
            <div>
              <dt>بینش‌های متصل</dt>
              <dd>{item.insightCountLabel}</dd>
            </div>
            <div>
              <dt>قوانین قیمت‌گذاری متصل</dt>
              <dd>{item.pricingRuleCountLabel}</dd>
            </div>
            <div>
              <dt>زیرموضوع‌ها</dt>
              <dd>{item.childCountLabel}</dd>
            </div>
            <div>
              <dt>توضیح</dt>
              <dd>{item.descriptionFa || "ثبت نشده"}</dd>
            </div>
            <div>
              <dt>آخرین تغییر</dt>
              <dd>{item.updatedAt}</dd>
            </div>
            <div>
              <dt>آرشیو</dt>
              <dd>{item.archivedAt}</dd>
            </div>
          </dl>
          <div className={styles.actions}>
            <Link className={styles.secondaryLink} href="/admin/categories">
              بازگشت به دسته‌ها
            </Link>
            <Link className={styles.secondaryLink} href="/admin/audit-log">
              گزارش ممیزی
            </Link>
          </div>
        </article>
        <aside className={styles.surface}>
          <div className={styles.surfaceHeader}>
            <div>
              <h3>ویرایش و آرشیو</h3>
              <p>آرشیو نرم، گزینه را از مسیرهای فعال کنار می‌گذارد و رکوردهای متصل را حذف نمی‌کند.</p>
            </div>
          </div>
          <AdminCategoryActions
            mode="edit"
            category={item}
            parentOptions={data.parentOptions}
            viewerCanMutate={data.viewerCanMutate}
          />
        </aside>
      </section>
      <section className={styles.surface} aria-label="گزارش ممیزی دسته شغلی">
        <div className={styles.surfaceHeader}>
          <div>
            <h3>گزارش ممیزی</h3>
            <p>رویدادهای پایدار ثبت، ویرایش، آرشیو و بازفعال‌سازی این دسته.</p>
          </div>
        </div>
        {item.auditItems?.length ? (
          <dl className={styles.detailList}>
            {item.auditItems.map((event) => (
              <div key={event.id}>
                <dt>{event.actionLabel}</dt>
                <dd>
                  {event.actorSummary} · {event.statusChange} · {event.createdAt}
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <EmptyState title="رویدادی ثبت نشده" body="پس از ثبت کنش دسته شغلی، این بخش از پایگاه داده به‌روز می‌شود." />
        )}
      </section>
    </div>
  );
}

export function AdminPricingRules({ data }: Readonly<{ data: AdminPricingRulesData }>) {
  return (
    <div className={styles.pageStack}>
      <AdminPageHeader
        title="قیمت‌گذاری"
        description="قوانین قیمت‌گذاری جلسه‌ها و کمیسیون پلتفرم، بدون تغییر سفارش‌ها یا پرداخت‌های تاریخی."
        sourceNote={data.sourceNote}
      />
      <section className={styles.detailGrid}>
        <article className={styles.surface}>
          <div className={styles.surfaceHeader}>
            <div>
              <h3>قوانین قیمت‌گذاری</h3>
              <p>قانون‌ها از پایگاه داده خوانده می‌شوند و ردیف ساختگی نمایش داده نمی‌شود.</p>
            </div>
            <DataSourceBadge source={data.source} />
          </div>
          {data.items.length ? (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>عنوان</th>
                    <th>دسته شغلی</th>
                    <th>سطح تجربه</th>
                    <th>زمان</th>
                    <th>قیمت</th>
                    <th>کمیسیون</th>
                    <th>رایگان</th>
                    <th>وضعیت</th>
                    <th>اثرگذاری</th>
                    <th>کنش</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.title}</td>
                      <td>{item.jobCategoryLabel}</td>
                      <td>{item.experienceLevelLabel}</td>
                      <td>{item.durationLabel}</td>
                      <td>
                        {item.minPriceLabel} / {item.suggestedPriceLabel} / {item.maxPriceLabel}
                      </td>
                      <td>{item.commissionLabel}</td>
                      <td>{item.freeSessionLabel}</td>
                      <td>{item.stateLabel}</td>
                      <td>{item.effectiveWindowLabel}</td>
                      <td>
                        <Link className={styles.secondaryLink} href={item.href}>
                          جزئیات
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="هنوز قانون قیمت‌گذاری ثبت نشده است." body="پس از ثبت اولین قانون، همین جدول با داده واقعی پر می‌شود." />
          )}
        </article>
        <aside className={styles.surface}>
          <div className={styles.surfaceHeader}>
            <div>
              <h3>قانون تازه</h3>
              <p>کمیسیون پیش‌فرض MVP برابر ۱۵٪ است و کمیسیون جلسه رایگان صفر می‌ماند.</p>
            </div>
          </div>
          <AdminPricingRuleActions
            mode="create"
            categoryOptions={data.categoryOptions}
            viewerCanMutate={data.viewerCanMutate}
          />
        </aside>
      </section>
    </div>
  );
}

export function AdminPricingRuleDetail({ data }: Readonly<{ data: AdminPricingRuleDetailData }>) {
  const item = data.item;

  if (!item) {
    return (
      <div className={styles.pageStack}>
        <AdminPageHeader
          title="جزئیات قانون قیمت‌گذاری"
          description="قانون قیمت‌گذاری پیدا نشد."
          sourceNote={data.sourceNote}
        />
        <section className={styles.surface}>
          <EmptyState title="قانون قیمت‌گذاری پیدا نشد" body="هیچ ردیف ساختگی برای این جزئیات نمایش داده نمی‌شود." />
        </section>
      </div>
    );
  }

  return (
    <div className={styles.pageStack}>
      <AdminPageHeader
        title="جزئیات قانون قیمت‌گذاری"
        description="ویرایش و آرشیو قانون قیمت‌گذاری بدون تغییر تراکنش‌ها یا گفت‌وگوهای موجود."
        sourceNote={data.sourceNote}
      />
      <section className={styles.detailGrid}>
        <article className={styles.surface}>
          <div className={styles.surfaceHeader}>
            <div>
              <h3>{item.title}</h3>
              <p>
                شناسه قانون: <span dir="ltr">{item.id}</span>
              </p>
            </div>
            <DataSourceBadge source={item.source} />
          </div>
          <dl className={styles.detailList}>
            <div>
              <dt>دسته شغلی</dt>
              <dd>{item.jobCategoryLabel}</dd>
            </div>
            <div>
              <dt>سطح تجربه</dt>
              <dd>{item.experienceLevelLabel}</dd>
            </div>
            <div>
              <dt>زمان جلسه</dt>
              <dd>{item.durationLabel}</dd>
            </div>
            <div>
              <dt>حداقل / پیشنهادی / حداکثر</dt>
              <dd>
                {item.minPriceLabel} / {item.suggestedPriceLabel} / {item.maxPriceLabel}
              </dd>
            </div>
            <div>
              <dt>کمیسیون پلتفرم</dt>
              <dd>{item.commissionLabel}</dd>
            </div>
            <div>
              <dt>کمیسیون جلسه رایگان</dt>
              <dd>{item.freeSessionCommissionLabel}</dd>
            </div>
            <div>
              <dt>جلسه کمک‌محور / رایگان</dt>
              <dd>{item.freeSessionLabel}</dd>
            </div>
            <div>
              <dt>وضعیت فعال</dt>
              <dd>{item.stateLabel}</dd>
            </div>
            <div>
              <dt>اثرگذاری</dt>
              <dd>{item.effectiveWindowLabel}</dd>
            </div>
            <div>
              <dt>آخرین به‌روزرسانی</dt>
              <dd>{item.updatedAt}</dd>
            </div>
            <div>
              <dt>ثبت‌کننده</dt>
              <dd>{item.createdBySummary}</dd>
            </div>
            <div>
              <dt>آخرین ویرایش‌کننده</dt>
              <dd>{item.updatedBySummary}</dd>
            </div>
          </dl>
          <div className={styles.actions}>
            <Link className={styles.secondaryLink} href="/admin/pricing">
              بازگشت به قیمت‌گذاری
            </Link>
            <Link className={styles.secondaryLink} href="/admin/audit-log">
              گزارش ممیزی
            </Link>
          </div>
        </article>
        <aside className={styles.surface}>
          <div className={styles.surfaceHeader}>
            <div>
              <h3>ویرایش و آرشیو</h3>
              <p>این کنش‌ها فقط قانون قیمت‌گذاری و گزارش ممیزی را تغییر می‌دهند.</p>
            </div>
          </div>
          <AdminPricingRuleActions
            mode="edit"
            rule={item}
            categoryOptions={data.categoryOptions}
            viewerCanMutate={data.viewerCanMutate}
          />
        </aside>
      </section>
      <section className={styles.surface} aria-label="گزارش ممیزی قیمت‌گذاری">
        <div className={styles.surfaceHeader}>
          <div>
            <h3>گزارش ممیزی</h3>
            <p>رویدادهای پایدار ثبت، ویرایش و غیرفعال‌سازی این قانون.</p>
          </div>
        </div>
        {item.auditItems?.length ? (
          <dl className={styles.detailList}>
            {item.auditItems.map((event) => (
              <div key={event.id}>
                <dt>{event.actionLabel}</dt>
                <dd>
                  {event.actorSummary} · {event.statusChange} · {event.createdAt}
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <EmptyState title="رویدادی ثبت نشده" body="پس از ثبت کنش قیمت‌گذاری، این بخش از پایگاه داده به‌روز می‌شود." />
        )}
      </section>
    </div>
  );
}

function AdminKpiTreeRows({
  nodes,
  depth = 0
}: Readonly<{ nodes: AdminAnalyticsData["kpiTree"]; depth?: number }>) {
  return (
    <>
      {nodes.map((node) => (
        <Fragment key={node.id}>
          <tr>
            <td>
              <span
                className={styles.kpiName}
                style={{ "--kpi-depth": depth } as CSSProperties}
              >
                {node.label}
              </span>
            </td>
            <td>{node.value}</td>
            <td>
              <span className={`${styles.kpiStatus} ${kpiStatusClass(node.status)}`}>
                {node.statusLabel}
              </span>
            </td>
            <td dir="ltr">{node.formula}</td>
            <td>{node.numerator}</td>
            <td>{node.denominator}</td>
            <td>
              <div className={styles.kpiNotes}>
                <span>{node.explanation}</span>
                <span>{node.dateRangeBehavior}</span>
                <span>{node.categoryFilterLabel}</span>
                {node.unsupportedReason ? <span>{node.unsupportedReason}</span> : null}
                {node.dataQualityNote ? <span>{node.dataQualityNote}</span> : null}
              </div>
            </td>
          </tr>
          {node.children.length ? (
            <AdminKpiTreeRows nodes={node.children} depth={depth + 1} />
          ) : null}
        </Fragment>
      ))}
    </>
  );
}

export function AdminAnalyticsSummary({ data }: Readonly<{ data: AdminAnalyticsData }>) {
  return (
    <div className={styles.pageStack}>
      <AdminPageHeader
        title="داشبورد تحلیل"
        description={`خلاصه عملیاتی با بازه ${data.activeDateRangeLabel} و دسته ${data.activeCategoryLabel}.`}
        sourceNote={data.sourceNote}
      />
      <section className={styles.surface} aria-label="فیلترهای تحلیل">
        <div className={styles.surfaceHeader}>
          <div>
            <h3>فیلترها</h3>
            <p>فیلترها از query param خوانده می‌شوند و داده دوباره از repository محاسبه می‌شود.</p>
          </div>
          <DataSourceBadge source={data.source} />
        </div>
        <div>
          <h4 className={styles.filterTitle}>بازه زمانی</h4>
          <nav className={styles.filters} aria-label="فیلتر بازه زمانی">
            {data.dateRangeOptions.map((option) => (
              <Link className={option.active ? styles.filterLinkActive : styles.filterLink} href={option.href} key={option.value}>
                {option.label}
              </Link>
            ))}
          </nav>
        </div>
        <div>
          <h4 className={styles.filterTitle}>دسته شغلی</h4>
          <nav className={styles.filters} aria-label="فیلتر دسته شغلی">
            {data.categoryOptions.map((option) => (
              <Link className={option.active ? styles.filterLinkActive : styles.filterLink} href={option.href} key={option.value || "all-categories"}>
                {option.label}
              </Link>
            ))}
          </nav>
        </div>
      </section>
      <section className={styles.metricGrid} aria-label="خلاصه تحلیل">
        {data.metrics.map((metric) => (
          <article className={styles.metricCard} key={metric.id}>
            <DataSourceBadge source={metric.source} />
            <strong>{metric.value}</strong>
            <span>{metric.label}</span>
            <small>{metric.helper}</small>
          </article>
        ))}
      </section>

      <section className={styles.surface} aria-label="درخت KPI جلسه‌های پرداخت‌شده">
        <div className={styles.surfaceHeader}>
          <div>
            <h3>درخت KPI جلسه‌های پرداخت‌شده</h3>
            <p>هر ردیف نشان می‌دهد KPI از داده فعلی DB محاسبه شده، تقریبی است، یا هنوز داده لازم برای آن وجود ندارد.</p>
          </div>
        </div>
        <div className={styles.tableWrap}>
          <table className={`${styles.table} ${styles.kpiTable}`}>
            <thead>
              <tr>
                <th>KPI</th>
                <th>مقدار / نرخ</th>
                <th>وضعیت</th>
                <th>فرمول</th>
                <th>صورت</th>
                <th>مخرج</th>
                <th>توضیح و منبع</th>
              </tr>
            </thead>
            <tbody>
              <AdminKpiTreeRows nodes={data.kpiTree} />
            </tbody>
          </table>
        </div>
      </section>

      {data.breakdownSections.map((section) => (
        <section className={styles.surface} aria-label={section.title} key={section.id}>
          <div className={styles.surfaceHeader}>
            <div>
              <h3>{section.title}</h3>
              <p>{section.description}</p>
            </div>
          </div>
          {section.rows.length ? (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>معیار</th>
                    <th>مقدار</th>
                    <th>یادداشت کیفیت داده</th>
                    <th>منبع</th>
                  </tr>
                </thead>
                <tbody>
                  {section.rows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.label}</td>
                      <td>{row.value}</td>
                      <td>{row.helper}</td>
                      <td>
                        <DataSourceBadge source={row.source} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="داده‌ای برای این شکست وجود ندارد" body="هیچ ردیف ساختگی برای این بخش نمایش داده نمی‌شود." />
          )}
        </section>
      ))}

      <section className={styles.surface}>
        <div className={styles.surfaceHeader}>
          <div>
            <h3>معیارهای پیاده‌سازی‌نشده</h3>
            <p>این موارد تا زمانی که مدل داده لازم اضافه نشود مقدار جعلی نمی‌گیرند.</p>
          </div>
        </div>
        <dl className={styles.detailList}>
          {data.unsupportedMetrics.map((metric) => (
            <div key={metric.id}>
              <dt>{metric.label}</dt>
              <dd>{metric.reason}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={styles.surface}>
        <div className={styles.surfaceHeader}>
          <div>
            <h3>یادداشت‌های کیفیت داده</h3>
            <p>مرزهای محاسبه و fallbackهای صادقانه این صفحه.</p>
          </div>
        </div>
        <ol className={styles.timeline}>
          {data.dataQualityNotes.map((note) => (
            <li key={note}>
              <strong>یادداشت</strong>
              <span>{note}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

export function AdminAuditLog({ data }: Readonly<{ data?: AdminAuditLogData }> = {}) {
  return (
    <div className={styles.pageStack}>
      <AdminPageHeader title="گزارش ممیزی" description="تاریخچه خواندنی کنش‌های ادمین." sourceNote={data?.sourceNote ?? "هیچ تاریخچه ساختگی نمایش داده نمی‌شود."} />
      <section className={styles.surface}>
        {data?.implemented && data.rows.length ? (
          <dl className={styles.detailList}>
            {data.rows.map((row) => (
              <div key={row.id}>
                <dt>{row.actionLabel}</dt>
                <dd>
                  {row.actorSummary} · {row.entitySummary} · {row.statusChange} · {row.createdAt}
                  {row.pricingHref ? (
                    <>
                      {" "}
                      <Link className={styles.secondaryLink} href={row.pricingHref}>
                        قانون قیمت‌گذاری
                      </Link>
                    </>
                  ) : null}
                  {row.categoryHref ? (
                    <>
                      {" "}
                      <Link className={styles.secondaryLink} href={row.categoryHref}>
                        دسته شغلی
                      </Link>
                    </>
                  ) : null}
                  {row.contentHref ? (
                    <>
                      {" "}
                      <Link className={styles.secondaryLink} href={row.contentHref}>
                        محتوا
                      </Link>
                    </>
                  ) : null}
                  {row.supportHref ? (
                    <>
                      {" "}
                      <Link className={styles.secondaryLink} href={row.supportHref}>
                        تیکت پشتیبانی
                      </Link>
                    </>
                  ) : null}
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <EmptyState title="گزارش ممیزی در دسترس نیست" body="اگر رویدادی ثبت نشده باشد، این صفحه خالی می‌ماند و داده ساختگی نمایش نمی‌دهد." />
        )}
      </section>
    </div>
  );
}

export function AdminPlaceholder({ data }: Readonly<{ data: AdminPlaceholderData }>) {
  return (
    <div className={styles.pageStack}>
      <AdminPageHeader title={data.title} description={data.description} sourceNote="این مسیر فعلاً کنش عملیاتی ندارد." />
      <section className={styles.surface}>
        <div className={styles.surfaceHeader}>
          <div>
            <h3>{data.status}</h3>
            <p>نمای امن برای ادامه چک‌پوینت‌های Admin/Ops.</p>
          </div>
        </div>
        {data.items.length ? (
          <dl className={styles.detailList}>
            {data.items.map((item) => (
              <div key={`${item.label}-${item.value}`}>
                <dt>{item.label}</dt>
                <dd>{item.value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <EmptyState title="داده‌ای برای نمایش نیست" body="این بخش هنوز به منبع داده عملیاتی وصل نشده است." />
        )}
      </section>
    </div>
  );
}
