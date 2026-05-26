"use client";

import { useState } from "react";
import {
  applySettlementSettings,
  formatIban,
  normalizeIban,
  validateIranIban,
  validateSettlementSettings,
  type SettlementSettings,
  type SettlementSettingsErrors
} from "@/features/v51/data/my-profile";
import {
  applyWalletSettlement,
  initialWalletFixture,
  requestPayout,
  topUpWallet,
  type WalletFixture,
  type WalletTransactionFilter
} from "@/features/v51/data/wallet";
import { SettlementInfoModal } from "@/features/v51/my-profile/components/SettlementInfoModal";
import { WalletPanel, type WalletPanelMode } from "./WalletPanel";
import styles from "./WalletPage.module.css";
import { WalletSummaryCards } from "./WalletSummaryCards";
import { WalletTransactionList } from "./WalletTransactionList";

type WalletPageProps = Readonly<{
  fixture?: WalletFixture;
  initialPanel?: WalletPanelMode;
  initialSettlementModalOpen?: boolean;
}>;

export function WalletPage({ fixture = initialWalletFixture, initialPanel = null, initialSettlementModalOpen = false }: WalletPageProps) {
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

  const settlementIsReady = wallet.settlement.verified && validateIranIban(wallet.settlement.iban);

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

  const openPayoutPanel = () => {
    clearMessages();
    setPanel(settlementIsReady ? "payout" : "missing-settlement");
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
    setSettlementModalOpen(false);
    setShowSettlementErrors(false);
    setPanel("payout");
    setErrorMessage("");
    setStatusMessage("اطلاعات تسویه ذخیره شد.");
  };

  const submitPayoutRequest = () => {
    const result = requestPayout(wallet);

    if (result.status === "blocked_missing_settlement_info") {
      setPanel("missing-settlement");
      setStatusMessage("");
      setErrorMessage(result.message);
      return;
    }

    setWallet(result.wallet);
    setErrorMessage("");
    setStatusMessage(result.message);
  };

  return (
    <div className={styles.walletShell}>
      <h1>کیف پول و پرداخت‌ها</h1>
      <p className={styles.lead}>پرداخت جلسه‌های مشاوره، درآمد، تسویه و تراکنش‌ها.</p>

      <WalletSummaryCards wallet={wallet} onTopUp={openTopUpPanel} onPayout={openPayoutPanel} onSettlementDetails={openSettlementDetails} />

      <WalletPanel
        mode={panel}
        wallet={wallet}
        selectedTopUpAmount={selectedTopUpAmount}
        onTopUpAmount={applyTopUp}
        onOpenSettlement={openSettlementModal}
        onRequestPayout={submitPayoutRequest}
      />

      {statusMessage ? <p className={styles.successBox}>{statusMessage}</p> : null}
      {errorMessage ? <p className={styles.errorBox}>{errorMessage}</p> : null}

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
