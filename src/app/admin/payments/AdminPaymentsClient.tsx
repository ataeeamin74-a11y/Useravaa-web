"use client";

import { PageContainer } from "@/components/layout/PageContainer";
import { V51Button, V51LinkButton } from "@/features/v51/components/V51Button";
import {
  formatDuration,
  formatToman,
  getConversationPrice,
  getManualPaymentReviewItems,
  getManualPaymentStatusLabel,
  manualPaymentCopy,
  type ConversationFixture
} from "@/features/v51/data/conversations";
import styles from "./AdminPaymentsPage.module.css";

type AdminPaymentsClientProps = {
  initialItems: readonly ConversationFixture[];
};

export function AdminPaymentsClient({ initialItems }: AdminPaymentsClientProps) {
  const items = getManualPaymentReviewItems(initialItems);

  return (
    <PageContainer as="main" variant="dashboard" className={styles.page}>
      <header className={styles.hero}>
        <span className={styles.eyebrow}>ادمین</span>
        <h1>{manualPaymentCopy.adminTitle}</h1>
        <p>پرداخت‌های ثبت‌شده کارت‌به‌کارت اینجا به شکل نمای محلی نمایش داده می‌شوند. درخواست فقط پس از تأیید پرداخت برای تجربه‌آفرین قابل پیگیری است.</p>
      </header>

      <section className={styles.list} aria-label={manualPaymentCopy.adminTitle}>
        {items.map((item) => (
          <article className={styles.card} key={item.id}>
            <div className={styles.cardHead}>
              <div>
                <h2>{item.requestTopic ?? "درخواست گفت‌وگو"}</h2>
                <p>
                  {item.requesterName} برای {item.profile.name}
                </p>
              </div>
              <span className={styles.status}>{getManualPaymentStatusLabel(item)}</span>
            </div>

            <dl className={styles.metaGrid}>
              <div>
                <dt>شناسه درخواست</dt>
                <dd dir="ltr">{item.id}</dd>
              </div>
              <div>
                <dt>مبلغ</dt>
                <dd>{formatToman(getConversationPrice(item))}</dd>
              </div>
              <div>
                <dt>مدت گفت‌وگو</dt>
                <dd>{formatDuration(item.duration)}</dd>
              </div>
              <div>
                <dt>شماره مرجع</dt>
                <dd dir={item.manualPaymentReferenceNumber ? "ltr" : "rtl"}>{item.manualPaymentReferenceNumber || "ثبت نشده"}</dd>
              </div>
              <div>
                <dt>رسید پرداخت</dt>
                <dd>{item.manualPaymentReceiptFileName || "ثبت نشده"}</dd>
              </div>
              <div>
                <dt>زمان ثبت</dt>
                <dd>{item.manualPaymentSubmittedAt || "ثبت نشده"}</dd>
              </div>
            </dl>

            {item.manualPaymentStatus === "SUBMITTED" || item.manualPaymentStatus === "NEEDS_REVIEW" ? (
              <div className={styles.reviewControls}>
                <label>
                  <span>{manualPaymentCopy.adminRejectReasonLabel}</span>
                  <input disabled placeholder={manualPaymentCopy.adminRejectReasonPlaceholder} />
                </label>
                <div className={styles.actions}>
                  <V51Button type="button" tone="primary" disabled>
                    {manualPaymentCopy.adminApprove}
                  </V51Button>
                  <V51Button type="button" disabled>
                    {manualPaymentCopy.adminReject}
                  </V51Button>
                  <V51LinkButton href={`/admin/payments/${item.id}`}>مشاهده پرداخت</V51LinkButton>
                </div>
              </div>
            ) : (
              <div className={styles.actions}>
                <V51LinkButton href={`/admin/conversations/${item.id}`}>مشاهده درخواست</V51LinkButton>
              </div>
            )}
          </article>
        ))}
      </section>
    </PageContainer>
  );
}
