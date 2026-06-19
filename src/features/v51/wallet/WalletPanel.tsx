import { UseravaaIcon } from "@/components/ui/UseravaaIcon";
import { V51Button } from "@/features/v51/components/V51Button";
import type { WalletFixture, WalletWithdrawalErrors, WalletWithdrawalInput } from "@/features/v51/data/wallet";
import { formatIban } from "@/features/v51/data/my-profile";
import { formatToman, getActiveWithdrawalRequest, topUpAmounts, walletWithdrawalCopy, walletWithdrawalStatusLabels } from "@/features/v51/data/wallet";
import styles from "./WalletPage.module.css";

export type WalletPanelMode = "topup" | "withdrawal" | "withdrawal-success" | "settlement-details" | null;

type WalletPanelProps = Readonly<{
  mode: WalletPanelMode;
  wallet: WalletFixture;
  selectedTopUpAmount: number | null;
  withdrawalDraft: WalletWithdrawalInput;
  withdrawalErrors: WalletWithdrawalErrors;
  showWithdrawalErrors: boolean;
  onTopUpAmount: (amount: number) => void;
  onOpenSettlement: () => void;
  onWithdrawalDraftChange: (draft: WalletWithdrawalInput) => void;
  onSubmitWithdrawal: () => void;
  onBack: () => void;
}>;

export function WalletPanel({
  mode,
  wallet,
  selectedTopUpAmount,
  withdrawalDraft,
  withdrawalErrors,
  showWithdrawalErrors,
  onTopUpAmount,
  onOpenSettlement,
  onWithdrawalDraftChange,
  onSubmitWithdrawal,
  onBack
}: WalletPanelProps) {
  if (!mode) {
    return null;
  }

  if (mode === "topup") {
    return (
      <section className={styles.walletPanel} aria-label="افزایش موجودی">
        <b className={styles.panelTitle}>
          <UseravaaIcon name="wallet" size={16} aria-hidden="true" />
          افزایش موجودی
        </b>
        <span>مبلغ را انتخاب کن:</span>
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

  if (mode === "withdrawal") {
    const activeRequest = getActiveWithdrawalRequest(wallet);

    return (
      <section className={styles.walletPanel} aria-label={walletWithdrawalCopy.title}>
        <b className={styles.panelTitle}>
          <UseravaaIcon name="payoutRequest" size={16} aria-hidden="true" />
          {walletWithdrawalCopy.title}
        </b>
        <span>{walletWithdrawalCopy.description}</span>

        <div className={styles.withdrawalAmountBox}>
          <span>مبلغ قابل برداشت</span>
          <b>{formatToman(wallet.availablePayout)}</b>
          <small>{walletWithdrawalCopy.fullAmountOnly}</small>
        </div>

        {activeRequest ? (
          <p className={styles.pendingWithdrawalNote}>
            وضعیت درخواست فعلی: {walletWithdrawalStatusLabels[activeRequest.status]} · مبلغ {formatToman(activeRequest.amount)}
          </p>
        ) : (
          <>
            <div className={styles.withdrawalForm}>
              <div className={styles.withdrawalField}>
                <label htmlFor="withdrawalAccountHolder">نام صاحب حساب</label>
                <input
                  id="withdrawalAccountHolder"
                  value={withdrawalDraft.accountHolderName}
                  placeholder="مثلاً فاطمه اصغری"
                  onChange={(event) => onWithdrawalDraftChange({ ...withdrawalDraft, accountHolderName: event.target.value })}
                />
                {showWithdrawalErrors && withdrawalErrors.accountHolderName ? <small>{withdrawalErrors.accountHolderName}</small> : null}
              </div>

              <div className={styles.withdrawalField}>
                <label htmlFor="withdrawalIban">شماره شبا</label>
                <input
                  id="withdrawalIban"
                  dir="ltr"
                  value={withdrawalDraft.iban}
                  placeholder="IR000000000000000000000000"
                  onChange={(event) => onWithdrawalDraftChange({ ...withdrawalDraft, iban: event.target.value })}
                />
                {showWithdrawalErrors && withdrawalErrors.iban ? <small>{withdrawalErrors.iban}</small> : null}
              </div>
            </div>

            <span>{walletWithdrawalCopy.confirmation}</span>
            <div className={styles.panelActions}>
              <V51Button type="button" tone="primary" disabled={wallet.availablePayout <= 0} onClick={onSubmitWithdrawal}>
                {walletWithdrawalCopy.submitCta}
              </V51Button>
              <V51Button type="button" onClick={onBack}>
                بازگشت
              </V51Button>
            </div>
          </>
        )}
      </section>
    );
  }

  if (mode === "withdrawal-success") {
    const activeRequest = getActiveWithdrawalRequest(wallet);

    return (
      <section className={styles.walletPanel} aria-label={walletWithdrawalCopy.successTitle}>
        <b className={styles.panelTitle}>
          <UseravaaIcon name="success" size={16} aria-hidden="true" />
          {walletWithdrawalCopy.successTitle}
        </b>
        <span>{walletWithdrawalCopy.successText}</span>
        {activeRequest ? (
          <div className={styles.withdrawalAmountBox}>
            <span>وضعیت برداشت</span>
            <b>{walletWithdrawalStatusLabels[activeRequest.status]}</b>
            <small>
              {formatToman(activeRequest.amount)} · {formatIban(activeRequest.iban)}
            </small>
          </div>
        ) : null}
        <div className={styles.panelActions}>
          <V51Button type="button" tone="primary" onClick={onBack}>
            مشاهده کیف پول
          </V51Button>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.walletPanel} aria-label="جزئیات برداشت‌های در حال بررسی">
      <b className={styles.panelTitle}>
        <UseravaaIcon name="transaction" size={16} aria-hidden="true" />
        برداشت‌های در حال بررسی
      </b>
      <span>{formatToman(wallet.pendingPayout)} در صف بررسی و پردازش برداشت است.</span>
      <div className={styles.pendingWithdrawalList}>
        {wallet.withdrawalRequests.length ? (
          wallet.withdrawalRequests.map((request) => (
            <article key={request.id} className={styles.pendingWithdrawalItem}>
              <b>{walletWithdrawalStatusLabels[request.status]}</b>
              <span>{formatToman(request.amount)}</span>
              <small>{formatIban(request.iban)}</small>
            </article>
          ))
        ) : (
          <span>درخواست برداشت فعالی ثبت نشده است.</span>
        )}
      </div>
      <div className={styles.panelActions}>
        <V51Button type="button" onClick={onOpenSettlement}>
          ثبت یا ویرایش شبا
        </V51Button>
      </div>
    </section>
  );
}
