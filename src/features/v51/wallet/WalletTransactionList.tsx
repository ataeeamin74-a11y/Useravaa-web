import { UseravaaIcon } from "@/components/ui/UseravaaIcon";
import type { WalletTransactionFilter, WalletTransactionType } from "@/features/v51/data/wallet";
import { filterWalletTransactions, formatToman, signedToman, walletTypeLabels, type WalletFixture } from "@/features/v51/data/wallet";
import styles from "./WalletPage.module.css";

const transactionFilterOptions: Array<{ value: WalletTransactionFilter; label: string }> = [
  { value: "", label: "همه" },
  { value: "payment", label: "پرداخت" },
  { value: "earning", label: "درآمد" },
  { value: "payout", label: "تسویه" },
  { value: "refund", label: "برگشت مبلغ" },
  { value: "CANCELLATION_CREDIT", label: "بازگشت اعتبار" },
  { value: "CANCELLATION_PROVIDER_COMPENSATION", label: "جبران کنسلی" },
  { value: "WITHDRAWAL_REQUEST", label: "درخواست برداشت وجه" }
];

type WalletTransactionListProps = Readonly<{
  wallet: WalletFixture;
  filter: WalletTransactionFilter;
  onFilterChange: (filter: WalletTransactionFilter) => void;
}>;

export function WalletTransactionList({ wallet, filter, onFilterChange }: WalletTransactionListProps) {
  const items = filterWalletTransactions(wallet.transactions, filter);

  return (
    <section className={styles.walletTableCard}>
      <div className={styles.walletTableHead}>
        <h2>تراکنش‌ها</h2>
        <label className={styles.filterControl} aria-label="فیلتر تراکنش‌ها">
          <select value={filter} onChange={(event) => onFilterChange(event.target.value as WalletTransactionFilter)}>
            {transactionFilterOptions.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <span className={styles.filterCaret} aria-hidden="true">
            <UseravaaIcon name="dropdown" size={16} />
          </span>
        </label>
      </div>

      {items.length ? (
        <div>
          {items.map((transaction) => (
            <article key={transaction.id} className={styles.walletRow}>
              <div>
                <b>{transaction.title}</b>
                <small>{transaction.date}</small>
                {transaction.type === "CANCELLATION_PROVIDER_COMPENSATION" ? (
                  <small className={styles.walletTransactionMeta}>
                    مبلغ جبران کنسلی: {formatToman(transaction.providerGrossCompensation ?? 0)} · سهم یوزراوا: {formatToman(transaction.useravaaFeeAmount ?? 0)} · مبلغ قابل تسویه برای شما:{" "}
                    {formatToman(transaction.providerNetAmount ?? transaction.amount)}
                  </small>
                ) : null}
              </div>
              <span className={styles.walletType}>{walletTypeLabels[transaction.type as WalletTransactionType]}</span>
              <span className={`${styles.walletAmount} ${transaction.amount >= 0 ? styles.walletAmountPositive : styles.walletAmountNegative}`}>
                {signedToman(transaction.amount)}
              </span>
            </article>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>تراکنشی پیدا نشد.</div>
      )}
    </section>
  );
}
