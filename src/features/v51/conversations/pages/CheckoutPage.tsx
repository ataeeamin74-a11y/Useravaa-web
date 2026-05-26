"use client";

import { useState } from "react";
import { UseravaaIcon } from "@/components/ui/UseravaaIcon";
import { V51Button, V51LinkButton } from "@/features/v51/components/V51Button";
import {
  calculateCheckout,
  conversationReliabilityCopy,
  getConversationStatusLabel,
  payConversation,
  postPaymentContactCopy,
  type ConversationFixture
} from "@/features/v51/data/conversations";
import { CheckoutSummary } from "../components/CheckoutSummary";
import styles from "../components/ConversationCluster.module.css";

type CheckoutPageProps = {
  initialConversation: ConversationFixture;
};

export function CheckoutPage({ initialConversation }: CheckoutPageProps) {
  const [conversation, setConversation] = useState(initialConversation);
  const checkout = calculateCheckout(conversation);

  const submitPayment = () => {
    setConversation((current) => payConversation(current));
  };

  return (
    <div className={styles.shell}>
      <section className={styles.hero}>
        <div className={styles.heroText}>
          <h1>مرور و نهایی‌کردن جلسه مشاوره</h1>
          <p className={styles.lead}>قبل از پرداخت، فرد، زمان و هزینه جلسه را یک‌بار بررسی کن.</p>
        </div>
        <V51LinkButton href={`/conversations/${conversation.id}`}>
          <UseravaaIcon name="arrowBackRtl" size={16} aria-hidden="true" />
          بازگشت
        </V51LinkButton>
      </section>

      <div className={styles.checkoutGrid}>
        <CheckoutSummary conversation={conversation} />
        <aside className={styles.panel}>
          <h2>کیف پول</h2>
          <p className={styles.infoBox}>اگر پرداخت کامل نشود، جلسه مشاوره ثبت نمی‌شود و مبلغی از کیف پولت کم نخواهد شد.</p>
          <div className={styles.summaryRows}>
            <div className={styles.summaryRow}>
              <span>وضعیت</span>
              <strong>{getConversationStatusLabel(conversation)}</strong>
            </div>
            <div className={styles.summaryRow}>
              <span>پرداخت درگاه</span>
              <strong>{checkout.requiresGateway ? "نیاز دارد" : "نیاز ندارد"}</strong>
            </div>
          </div>
          {!checkout.paymentEnabled ? <p className={styles.errorBox}>{conversationReliabilityCopy.paymentUnavailable}</p> : null}
          <p className={styles.infoBox}>{postPaymentContactCopy.checkoutNotice}</p>
          <div className={styles.actions}>
            <V51Button
              type="button"
              tone="primary"
              disabled={!checkout.paymentEnabled}
              className={!checkout.paymentEnabled ? styles.submitDisabled : undefined}
              onClick={submitPayment}
            >
              {checkout.isFreeHelp ? "نهایی‌کردن جلسه مشاوره" : "پرداخت و نهایی‌کردن جلسه مشاوره"}
            </V51Button>
          </div>
          {conversation.status === "confirmed" ? <p className={styles.successBox}>جلسه مشاوره ثبت شد و وضعیت آن «ثبت‌شده» است.</p> : null}
        </aside>
      </div>
    </div>
  );
}
