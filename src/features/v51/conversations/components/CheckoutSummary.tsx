import { UseravaaIcon } from "@/components/ui/UseravaaIcon";
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
    <section id="checkout-summary" className={styles.panel}>
      <h2 className={styles.panelTitleWithIcon}>
        <UseravaaIcon name="payoutRequest" size={18} aria-hidden="true" />
        خلاصه درخواست
      </h2>
      <div className={styles.summaryRows}>
        <div className={styles.summaryRow}>
          <span>تجربه‌آفرین</span>
          <strong>{getPersonName(conversation)}</strong>
        </div>
        <div className={styles.summaryRow}>
          <span>مدت گفت‌وگو</span>
          <strong>{formatDuration(conversation.duration)}</strong>
        </div>
        {conversation.requestTopic ? (
          <div className={styles.summaryRow}>
            <span>موضوع کلی</span>
            <strong>{conversation.requestTopic}</strong>
          </div>
        ) : null}
        <div className={styles.summaryRow}>
          <span>توضیح شما</span>
          <strong>{conversation.note || "ثبت نشده است"}</strong>
        </div>
        <div className={styles.summaryRow}>
          <span>مبلغ</span>
          <strong>{checkout.price === 0 ? "رایگان" : formatToman(checkout.price)}</strong>
        </div>
      </div>
    </section>
  );
}
