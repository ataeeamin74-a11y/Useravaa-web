"use client";

import { useState } from "react";
import { UseravaaIcon } from "@/components/ui/UseravaaIcon";
import {
  applySettlementSettings,
  formatIban,
  normalizeIban,
  validateSettlementSettings,
  type SettlementSettings,
  type SettlementSettingsErrors
} from "@/features/v51/data/my-profile";
import {
  applyWalletSettlement,
  initialWalletFixture,
  submitWalletWithdrawalRequest,
  topUpWallet,
  validateWalletWithdrawalInput,
  walletWithdrawalCopy,
  type WalletFixture,
  type WalletTransactionFilter,
  type WalletWithdrawalErrors,
  type WalletWithdrawalInput
} from "@/features/v51/data/wallet";
import { SettlementInfoModal } from "@/features/v51/my-profile/components/SettlementInfoModal";
import { WalletPanel, type WalletPanelMode } from "./WalletPanel";
import styles from "./WalletPage.module.css";
import { WalletSummaryCards } from "./WalletSummaryCards";
import { WalletTransactionList } from "./WalletTransactionList";

type WalletPageProps = Readonly<{
  fixture?: WalletFixture;
  currentUserId?: string;
  initialPanel?: WalletPanelMode;
  initialSettlementModalOpen?: boolean;
}>;

export function WalletPage({ fixture = initialWalletFixture, currentUserId = fixture.ownerUserId, initialPanel = null, initialSettlementModalOpen = false }: WalletPageProps) {
  const [wallet, setWallet] = useState<WalletFixture>(fixture);
  const [panel, setPanel] = useState<WalletPanelMode>(initialPanel);
  const [filter, setFilter] = useState<WalletTransactionFilter>("");
  const [selectedTopUpAmount, setSelectedTopUpAmount] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [settlementModalOpen, setSettlementModalOpen] = useState(initialSettlementModalOpen);
  const [settlementDraft, setSettlementDraft] = useState<SettlementSettings>(fixture.settlement);
  const [settlementErrors, setSettlementErrors] = useState<SettlementSettingsErrors>(validateSettlementSettings(fixture.settlement));
  const [showSettlementErrors, setShowSettlementErrors] = useState(false);
  const [withdrawalDraft, setWithdrawalDraft] = useState<WalletWithdrawalInput>({
    accountHolderName: fixture.settlement.accountOwner,
    iban: fixture.settlement.iban
  });
  const [withdrawalErrors, setWithdrawalErrors] = useState<WalletWithdrawalErrors>({});
  const [showWithdrawalErrors, setShowWithdrawalErrors] = useState(false);

  const clearMessages = () => {
    setStatusMessage("");
    setErrorMessage("");
  };

  const openTopUpPanel = () => {
    clearMessages();
    setPanel("topup");
  };

  const applyTopUp = (amount: number) => {
    setSelectedTopUpAmount(amount);
    setWallet((current) => topUpWallet(current, amount));
    setErrorMessage("");
    setStatusMessage("موجودی کیف پول افزایش یافت.");
  };

  const openWithdrawalPanel = () => {
    clearMessages();
    setWithdrawalDraft({
      accountHolderName: wallet.settlement.accountOwner,
      iban: wallet.settlement.iban ? formatIban(wallet.settlement.iban) : ""
    });
    setWithdrawalErrors({});
    setShowWithdrawalErrors(false);
    setPanel("withdrawal");
  };

  const openSettlementDetails = () => {
    clearMessages();
    setPanel("settlement-details");
  };

  const openSettlementModal = () => {
    const draft = {
      ...wallet.settlement,
      accountOwner: wallet.settlement.accountOwner || "علی ر.",
      iban: wallet.settlement.iban ? formatIban(wallet.settlement.iban) : ""
    };
    clearMessages();
    setSettlementDraft(draft);
    setSettlementErrors(validateSettlementSettings(draft));
    setShowSettlementErrors(false);
    setSettlementModalOpen(true);
  };

  const closeSettlementModal = () => {
    setSettlementDraft(wallet.settlement);
    setShowSettlementErrors(false);
    setSettlementModalOpen(false);
  };

  const updateSettlementDraft = (draft: SettlementSettings) => {
    const normalized = normalizeIban(draft.iban);
    const nextDraft = {
      ...draft,
      iban: draft.iban ? formatIban(normalized.startsWith("IR") ? draft.iban : `IR${normalized.replace(/^IR/i, "")}`) : ""
    };

    setSettlementDraft(nextDraft);
    setSettlementErrors(validateSettlementSettings(nextDraft));
  };

  const saveSettlement = () => {
    const result = applySettlementSettings(wallet.settlement, settlementDraft);
    setSettlementErrors(result.errors);

    if (!result.saved) {
      setShowSettlementErrors(true);
      setErrorMessage("اطلاعات تسویه را کامل کن.");
      return;
    }

    setWallet((current) => applyWalletSettlement(current, result.settlement));
    setWithdrawalDraft({
      accountHolderName: result.settlement.accountOwner,
      iban: formatIban(result.settlement.iban)
    });
    setSettlementModalOpen(false);
    setShowSettlementErrors(false);
    setPanel("withdrawal");
    setErrorMessage("");
    setStatusMessage("اطلاعات تسویه ذخیره شد.");
  };

  const updateWithdrawalDraft = (draft: WalletWithdrawalInput) => {
    setWithdrawalDraft(draft);
    setWithdrawalErrors(validateWalletWithdrawalInput(draft).errors);
  };

  const submitWithdrawalRequest = () => {
    const result = submitWalletWithdrawalRequest(wallet, withdrawalDraft, currentUserId);

    if (result.status === "invalid") {
      setWithdrawalErrors(result.errors);
      setShowWithdrawalErrors(true);
      setStatusMessage("");
      setErrorMessage(Object.values(result.errors)[0] ?? walletWithdrawalCopy.ibanError);
      return;
    }

    if (result.status !== "requested") {
      setStatusMessage("");
      setErrorMessage(result.message);
      return;
    }

    setWallet(result.wallet);
    setWithdrawalDraft({
      accountHolderName: result.withdrawalRequest.accountHolderName,
      iban: formatIban(result.withdrawalRequest.iban)
    });
    setWithdrawalErrors({});
    setShowWithdrawalErrors(false);
    setPanel("withdrawal-success");
    setErrorMessage("");
    setStatusMessage(result.message);
  };

  return (
    <div className={styles.walletShell}>
      <h1>کیف پول و پرداخت‌ها</h1>
      <p className={styles.lead}>پرداخت جلسه‌های مشاوره، درآمد، تسویه و تراکنش‌ها.</p>

      <WalletSummaryCards
        wallet={wallet}
        currentUserId={currentUserId}
        onTopUp={openTopUpPanel}
        onPayout={openWithdrawalPanel}
        onSettlementDetails={openSettlementDetails}
      />

      <WalletPanel
        mode={panel}
        wallet={wallet}
        selectedTopUpAmount={selectedTopUpAmount}
        withdrawalDraft={withdrawalDraft}
        withdrawalErrors={withdrawalErrors}
        showWithdrawalErrors={showWithdrawalErrors}
        onTopUpAmount={applyTopUp}
        onOpenSettlement={openSettlementModal}
        onWithdrawalDraftChange={updateWithdrawalDraft}
        onSubmitWithdrawal={submitWithdrawalRequest}
        onBack={() => setPanel(null)}
      />

      {statusMessage ? (
        <p className={styles.successBox}>
          <UseravaaIcon name="success" size={16} aria-hidden="true" />
          {statusMessage}
        </p>
      ) : null}
      {errorMessage ? (
        <p className={styles.errorBox}>
          <UseravaaIcon name="warning" size={16} aria-hidden="true" />
          {errorMessage}
        </p>
      ) : null}

      <WalletTransactionList wallet={wallet} filter={filter} onFilterChange={setFilter} />

      {settlementModalOpen ? (
        <SettlementInfoModal
          draft={settlementDraft}
          errors={settlementErrors}
          showErrors={showSettlementErrors}
          onChange={updateSettlementDraft}
          onClose={closeSettlementModal}
          onSave={saveSettlement}
        />
      ) : null}
    </div>
  );
}
