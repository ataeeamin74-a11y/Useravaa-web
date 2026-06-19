import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ActionsPage } from "@/features/v51/actions/pages/ActionsPage";
import {
  filterWalletTransactions,
  formatToman,
  initialWalletFixture,
  requestPayout,
  submitWalletWithdrawalRequest,
  topUpAmounts,
  topUpWallet,
  validateWalletWithdrawalInput,
  walletWithdrawalCopy,
  walletWithdrawalStatusLabels,
  walletFixtureWithSettlement
} from "@/features/v51/data/wallet";
import { WalletPage } from "@/features/v51/wallet/WalletPage";

describe("Phase 2D V51 wallet and settlement", () => {
  it("wallet page renders summary cards", () => {
    const html = renderToStaticMarkup(<WalletPage />);

    expect(html).toContain("کیف پول و پرداخت‌ها");
    expect(html).toContain("موجودی قابل استفاده");
    expect(html).toContain("قابل برداشت");
    expect(html).toContain("در انتظار بررسی");
    expect(html).toContain("افزایش موجودی");
    expect(html).toContain("درخواست برداشت وجه");
  });

  it("top-up amount buttons work with V51 amount choices", () => {
    const html = renderToStaticMarkup(<WalletPage initialPanel="topup" />);

    expect(html).toContain("مبلغ را انتخاب کن:");
    expect(html).toContain(formatToman(topUpAmounts[0]));
    expect(html).toContain(formatToman(topUpAmounts[1]));
    expect(html).toContain(formatToman(topUpAmounts[2]));
  });

  it("mock top-up updates local fixture state", () => {
    const updated = topUpWallet(initialWalletFixture, topUpAmounts[1]);

    expect(updated.balance).toBe(initialWalletFixture.balance + topUpAmounts[1]);
    expect(updated.transactions[0].type).toBe("topup");
    expect(updated.transactions[0].title).toBe("افزایش موجودی کیف پول");
  });

  it("payout is blocked when settlement info is missing", () => {
    const result = requestPayout(initialWalletFixture);
    const html = renderToStaticMarkup(<WalletPage initialPanel="withdrawal" />);

    expect(result.status).toBe("blocked_missing_settlement_info");
    expect(result.message).toBe("برای ثبت درخواست برداشت، اطلاعات حساب را کامل کنید.");
    expect(html).toContain("درخواست برداشت وجه");
    expect(html).toContain("نام صاحب حساب");
    expect(html).toContain("شماره شبا");
  });

  it("withdrawal request works when settlement info exists", () => {
    const result = requestPayout(walletFixtureWithSettlement);
    const html = renderToStaticMarkup(<WalletPage fixture={walletFixtureWithSettlement} initialPanel="withdrawal" />);

    expect(result.status).toBe("requested");
    if (result.status === "requested") {
      expect(result.wallet.availablePayout).toBe(0);
      expect(result.wallet.pendingPayout).toBe(walletFixtureWithSettlement.pendingPayout + walletFixtureWithSettlement.availablePayout);
      expect(result.wallet.transactions[0].type).toBe("WITHDRAWAL_REQUEST");
      expect(result.wallet.withdrawalRequests[0].status).toBe("PENDING_REVIEW");
    }
    expect(html).toContain("ثبت درخواست برداشت");
  });

  it("shows withdrawal CTA only for withdrawable balance without active pending request", () => {
    const activeHtml = renderToStaticMarkup(<WalletPage />);
    const zeroHtml = renderToStaticMarkup(<WalletPage fixture={{ ...initialWalletFixture, availablePayout: 0 }} />);
    const pending = submitWalletWithdrawalRequest(walletFixtureWithSettlement, {
      accountHolderName: "علی ر.",
      iban: "IR123456789012345678901234"
    });

    expect(activeHtml).toContain(walletWithdrawalCopy.helper);
    expect(activeHtml).toContain(walletWithdrawalCopy.title);
    expect(zeroHtml).toContain("مبلغ قابل برداشت فعلاً وجود ندارد.");

    if (pending.status === "requested") {
      const pendingHtml = renderToStaticMarkup(<WalletPage fixture={{ ...pending.wallet, availablePayout: 200000 }} />);

      expect(pendingHtml).toContain(`درخواست برداشت: ${walletWithdrawalStatusLabels.PENDING_REVIEW}`);
      expect(pendingHtml).not.toContain(walletWithdrawalCopy.helper);
    }
  });

  it("opens withdrawal panel with required fields and amount copy", () => {
    const html = renderToStaticMarkup(<WalletPage fixture={walletFixtureWithSettlement} initialPanel="withdrawal" />);

    expect(html).toContain("مبلغ قابل برداشت");
    expect(html).toContain("نام صاحب حساب");
    expect(html).toContain("شماره شبا");
    expect(html).toContain("در این نسخه، درخواست برداشت برای کل مبلغ قابل برداشت ثبت می‌شود.");
    expect(html).toContain("پس از ثبت درخواست، وضعیت برداشت از همین صفحه قابل پیگیری است.");
  });

  it("validates and normalizes withdrawal account fields", () => {
    const empty = validateWalletWithdrawalInput({ accountHolderName: " ", iban: " " });
    const invalidIban = validateWalletWithdrawalInput({ accountHolderName: "  فاطمه اصغری  ", iban: "123" });
    const valid = validateWalletWithdrawalInput({ accountHolderName: "  فاطمه اصغری  ", iban: "123456789012345678901234" });

    expect(empty.errors.accountHolderName).toBe("نام صاحب حساب را وارد کنید.");
    expect(empty.errors.iban).toBe("شماره شبا را درست وارد کنید.");
    expect(invalidIban.normalized.accountHolderName).toBe("فاطمه اصغری");
    expect(invalidIban.errors.iban).toBe("شماره شبا را درست وارد کنید.");
    expect(valid.normalized.iban).toBe("IR123456789012345678901234");
    expect(valid.errors).toEqual({});
  });

  it("submitting withdrawal locks available balance and creates pending request", () => {
    const result = submitWalletWithdrawalRequest(walletFixtureWithSettlement, {
      accountHolderName: "  علی ر.  ",
      iban: "123456789012345678901234"
    });

    expect(result.status).toBe("requested");

    if (result.status === "requested") {
      expect(result.withdrawalRequest.status).toBe("PENDING_REVIEW");
      expect(result.withdrawalRequest.accountHolderName).toBe("علی ر.");
      expect(result.withdrawalRequest.iban).toBe("IR123456789012345678901234");
      expect(result.wallet.availablePayout).toBe(0);
      expect(result.wallet.pendingPayout).toBe(walletFixtureWithSettlement.pendingPayout + walletFixtureWithSettlement.availablePayout);
      expect(result.wallet.transactions[0].type).toBe("WITHDRAWAL_REQUEST");
      expect(result.wallet.transactions[0].title).toBe("درخواست برداشت وجه");
      expect(result.notification.title).toBe("درخواست برداشت ثبت شد");
      expect(result.notification.body).not.toContain("IR123456789012345678901234");
      expect(result.notification.href).toBe("/wallet");
    }
  });

  it("does not allow duplicate pending withdrawal for the same available balance", () => {
    const first = submitWalletWithdrawalRequest(walletFixtureWithSettlement, {
      accountHolderName: "علی ر.",
      iban: "IR123456789012345678901234"
    });

    expect(first.status).toBe("requested");

    if (first.status === "requested") {
      const duplicate = submitWalletWithdrawalRequest({ ...first.wallet, availablePayout: 500000 }, {
        accountHolderName: "علی ر.",
        iban: "IR123456789012345678901234"
      });

      expect(duplicate.status).toBe("blocked_pending_withdrawal");
    }
  });

  it("blocks unrelated users from submitting another wallet withdrawal", () => {
    const result = submitWalletWithdrawalRequest(walletFixtureWithSettlement, {
      accountHolderName: "علی ر.",
      iban: "IR123456789012345678901234"
    }, "other-user");
    const html = renderToStaticMarkup(<WalletPage fixture={walletFixtureWithSettlement} currentUserId="other-user" />);

    expect(result.status).toBe("forbidden");
    expect(html).not.toContain(walletWithdrawalCopy.helper);
  });

  it("shows pending withdrawal status on wallet after submission", () => {
    const result = submitWalletWithdrawalRequest(walletFixtureWithSettlement, {
      accountHolderName: "علی ر.",
      iban: "IR123456789012345678901234"
    });

    expect(result.status).toBe("requested");

    if (result.status === "requested") {
      const html = renderToStaticMarkup(<WalletPage fixture={result.wallet} initialPanel="settlement-details" />);

      expect(html).toContain("در انتظار بررسی");
      expect(html).toContain("برداشت‌های در حال بررسی");
      expect(html).toContain("درخواست برداشت وجه");
    }
  });

  it("does not create a task inbox action for a pending withdrawal request", () => {
    const actionsHtml = renderToStaticMarkup(<ActionsPage />);

    expect(actionsHtml).not.toContain("تکمیل اطلاعات برداشت وجه");
  });

  it("transaction filters work", () => {
    const payouts = filterWalletTransactions(initialWalletFixture.transactions, "payout");
    const payments = filterWalletTransactions(initialWalletFixture.transactions, "payment");

    expect(payouts).toHaveLength(1);
    expect(payouts.every((transaction) => transaction.type === "payout")).toBe(true);
    expect(payments).toHaveLength(1);
    expect(payments[0].title).toContain("پرداخت");
  });

  it("empty state renders when no transactions match", () => {
    const html = renderToStaticMarkup(<WalletPage fixture={{ ...initialWalletFixture, transactions: [] }} />);

    expect(html).toContain("تراکنشی پیدا نشد.");
  });

  it("Persian Toman formatting is preserved", () => {
    expect(formatToman(8400000)).toBe("۸٬۴۰۰٬۰۰۰ تومان");
    expect(formatToman(100000)).toBe("۱۰۰٬۰۰۰ تومان");
  });

  it("wallet withdrawal copy avoids forbidden financial scare terms", () => {
    const result = submitWalletWithdrawalRequest(walletFixtureWithSettlement, {
      accountHolderName: "علی ر.",
      iban: "IR123456789012345678901234"
    });
    const html = [
      renderToStaticMarkup(<WalletPage fixture={walletFixtureWithSettlement} initialPanel="withdrawal" />),
      result.status === "requested" ? renderToStaticMarkup(<WalletPage fixture={result.wallet} initialPanel="withdrawal-success" />) : "",
      walletWithdrawalCopy.title,
      walletWithdrawalCopy.successText
    ].join("\n");

    ["آزادسازی پول", "جریمه", "پنالتی", "برداشت فوری", "تسویه فوری"].forEach((term) => {
      expect(html).not.toContain(term);
    });
    expect(html).not.toMatch(/لطفا(?!ً)/);
  });
});
