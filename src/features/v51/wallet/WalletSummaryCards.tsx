import { UseravaaIcon } from "@/components/ui/UseravaaIcon";
import { V51Button } from "@/features/v51/components/V51Button";
import type { WalletFixture } from "@/features/v51/data/wallet";
import { canRequestWalletWithdrawal, formatToman, getActiveWithdrawalRequest, walletWithdrawalCopy, walletWithdrawalStatusLabels } from "@/features/v51/data/wallet";
import styles from "./WalletPage.module.css";

type WalletSummaryCardsProps = Readonly<{
  wallet: WalletFixture;
  currentUserId?: string;
  onTopUp: () => void;
  onPayout: () => void;
  onSettlementDetails: () => void;
}>;

export function WalletSummaryCards({ wallet, currentUserId, onTopUp, onPayout, onSettlementDetails }: WalletSummaryCardsProps) {
  const activeWithdrawal = getActiveWithdrawalRequest(wallet);
  const canWithdraw = canRequestWalletWithdrawal(wallet, currentUserId ?? wallet.ownerUserId);

  return (
    <div className={styles.walletGrid}>
      <section className={`${styles.walletCard} ${styles.walletCardPrimary}`}>
        <span className={styles.walletCardLabel}>
          <UseravaaIcon name="wallet" size={16} aria-hidden="true" />
          موجودی قابل استفاده
        </span>
        <b>{formatToman(wallet.balance)}</b>
        <V51Button type="button" tone="primary" onClick={onTopUp}>
          افزایش موجودی
        </V51Button>
      </section>

      <section className={styles.walletCard}>
        <span className={styles.walletCardLabel}>
          <UseravaaIcon name="payoutRequest" size={16} aria-hidden="true" />
          قابل برداشت
        </span>
        <b>{formatToman(wallet.availablePayout)}</b>
        {activeWithdrawal ? (
          <span className={styles.walletCardNote}>درخواست برداشت: {walletWithdrawalStatusLabels[activeWithdrawal.status]}</span>
        ) : null}
        {!activeWithdrawal && wallet.availablePayout <= 0 ? <span className={styles.walletCardNote}>مبلغ قابل برداشت فعلاً وجود ندارد.</span> : null}
        {canWithdraw ? (
          <>
            <span className={styles.walletCardNote}>{walletWithdrawalCopy.helper}</span>
            <V51Button type="button" onClick={onPayout}>
              {walletWithdrawalCopy.title}
            </V51Button>
          </>
        ) : null}
      </section>

      <section className={styles.walletCard}>
        <span className={styles.walletCardLabel}>
          <UseravaaIcon name="transaction" size={16} aria-hidden="true" />
          در انتظار بررسی
        </span>
        <b>{formatToman(wallet.pendingPayout)}</b>
        <V51Button type="button" onClick={onSettlementDetails}>
          جزئیات
        </V51Button>
      </section>
    </div>
  );
}
