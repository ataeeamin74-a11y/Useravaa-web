import {
  calculateCheckout,
  formatDuration,
  formatToman,
  getPersonName,
  type ConversationFixture
} from "@/features/v51/data/conversations";
import styles from "./ConversationCluster.module.css";

type CheckoutSummaryProps = {
  conversation: ConversationFixture;
};

export function CheckoutSummary({ conversation }: CheckoutSummaryProps) {
  const checkout = calculateCheckout(conversation);

  return (
    <section className={styles.panel}>
      <h2>خلاصه پرداخت</h2>
      <div className={styles.summaryRows}>
        <div className={styles.summaryRow}>
          <span>فرد</span>
          <strong>{getPersonName(conversation)}</strong>
        </div>
        <div className={styles.summaryRow}>
          <span>زمان انتخاب‌شده</span>
          <strong>
            {conversation.selectedTime ? `${conversation.selectedTime.dateLabel}، ${conversation.selectedTime.timeLabel}` : "زمانی انتخاب نشده است"}
          </strong>
        </div>
        <div className={styles.summaryRow}>
          <span>زمان جلسه مشاوره</span>
          <strong>{formatDuration(conversation.duration)}</strong>
        </div>
        <div className={styles.summaryRow}>
          <span>هزینه جلسه مشاوره</span>
          <strong>{checkout.price === 0 ? "رایگان" : formatToman(checkout.price)}</strong>
        </div>
        <div className={styles.summaryRow}>
          <span>پرداخت از کیف پول</span>
          <strong>{formatToman(checkout.walletDeduction)}</strong>
        </div>
        <div className={styles.summaryRow}>
          <span>پرداخت از درگاه</span>
          <strong>{formatToman(checkout.gatewayPayable)}</strong>
        </div>
      </div>
      <div className={styles.checkoutTotal}>
        <span>موجودی کیف پول: {formatToman(checkout.walletBalance)}</span>
        <strong>{checkout.requiresGateway ? "باقی‌مانده از درگاه پرداخت می‌شود." : "کیف پول برای نهایی‌سازی کافی است."}</strong>
      </div>
    </section>
  );
}
