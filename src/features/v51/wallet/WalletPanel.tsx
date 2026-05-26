import { V51Button } from "@/features/v51/components/V51Button";
import type { WalletFixture } from "@/features/v51/data/wallet";
import { formatToman, settlementLine, topUpAmounts } from "@/features/v51/data/wallet";
import styles from "./WalletPage.module.css";

export type WalletPanelMode = "topup" | "missing-settlement" | "payout" | "settlement-details" | null;

type WalletPanelProps = Readonly<{
  mode: WalletPanelMode;
  wallet: WalletFixture;
  selectedTopUpAmount: number | null;
  onTopUpAmount: (amount: number) => void;
  onOpenSettlement: () => void;
  onRequestPayout: () => void;
}>;

export function WalletPanel({ mode, wallet, selectedTopUpAmount, onTopUpAmount, onOpenSettlement, onRequestPayout }: WalletPanelProps) {
  if (!mode) {
    return null;
  }

  if (mode === "topup") {
    return (
      <section className={styles.walletPanel} aria-label="افزایش موجودی">
        <b>افزایش موجودی</b>
        <br />
        مبلغ را انتخاب کن:
        <div className={styles.panelActions}>
          {topUpAmounts.map((amount) => (
            <V51Button
              key={amount}
              type="button"
              tone="primary"
              className={selectedTopUpAmount === amount ? styles.selectedAmount : undefined}
              aria-pressed={selectedTopUpAmount === amount}
              onClick={() => onTopUpAmount(amount)}
            >
              {formatToman(amount)}
            </V51Button>
          ))}
        </div>
      </section>
    );
  }

  if (mode === "missing-settlement") {
    return (
      <section className={styles.walletPanel} aria-label="اطلاعات تسویه ثبت نشده است">
        <b>اطلاعات تسویه ثبت نشده است</b>
        <br />
        برای برداشت درآمد، ابتدا شماره شبا و نام صاحب حساب را ثبت کن.
        <div className={styles.panelActions}>
          <V51Button type="button" tone="primary" onClick={onOpenSettlement}>
            ثبت اطلاعات تسویه
          </V51Button>
        </div>
      </section>
    );
  }

  if (mode === "payout") {
    return (
      <section className={styles.walletPanel} aria-label="درخواست تسویه">
        <b>درخواست تسویه</b>
        <br />
        {settlementLine(wallet.settlement)}
        <div className={styles.panelActions}>
          <V51Button type="button" tone="primary" disabled={wallet.availablePayout <= 0} onClick={onRequestPayout}>
            ثبت درخواست تسویه
          </V51Button>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.walletPanel} aria-label="جزئیات در حال تسویه">
      <b>در حال تسویه</b>
      <br />
      {formatToman(wallet.pendingPayout)} در صف تسویه است.
    </section>
  );
}
