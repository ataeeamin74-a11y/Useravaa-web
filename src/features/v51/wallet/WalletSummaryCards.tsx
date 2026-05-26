import { V51Button } from "@/features/v51/components/V51Button";
import type { WalletFixture } from "@/features/v51/data/wallet";
import { formatToman } from "@/features/v51/data/wallet";
import styles from "./WalletPage.module.css";

type WalletSummaryCardsProps = Readonly<{
  wallet: WalletFixture;
  onTopUp: () => void;
  onPayout: () => void;
  onSettlementDetails: () => void;
}>;

export function WalletSummaryCards({ wallet, onTopUp, onPayout, onSettlementDetails }: WalletSummaryCardsProps) {
  return (
    <div className={styles.walletGrid}>
      <section className={`${styles.walletCard} ${styles.walletCardPrimary}`}>
        <span>موجودی قابل استفاده</span>
        <b>{formatToman(wallet.balance)}</b>
        <V51Button type="button" tone="primary" onClick={onTopUp}>
          افزایش موجودی
        </V51Button>
      </section>

      <section className={styles.walletCard}>
        <span>قابل برداشت</span>
        <b>{formatToman(wallet.availablePayout)}</b>
        <V51Button type="button" onClick={onPayout} disabled={wallet.availablePayout <= 0}>
          درخواست تسویه
        </V51Button>
      </section>

      <section className={styles.walletCard}>
        <span>در حال تسویه</span>
        <b>{formatToman(wallet.pendingPayout)}</b>
        <V51Button type="button" onClick={onSettlementDetails}>
          جزئیات
        </V51Button>
      </section>
    </div>
  );
}
