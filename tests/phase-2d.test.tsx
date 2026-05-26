import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  filterWalletTransactions,
  formatToman,
  initialWalletFixture,
  requestPayout,
  topUpAmounts,
  topUpWallet,
  walletFixtureWithSettlement
} from "@/features/v51/data/wallet";
import { WalletPage } from "@/features/v51/wallet/WalletPage";

describe("Phase 2D V51 wallet and settlement", () => {
  it("wallet page renders summary cards", () => {
    const html = renderToStaticMarkup(<WalletPage />);

    expect(html).toContain("کیف پول و پرداخت‌ها");
    expect(html).toContain("موجودی قابل استفاده");
    expect(html).toContain("قابل برداشت");
    expect(html).toContain("در حال تسویه");
    expect(html).toContain("افزایش موجودی");
    expect(html).toContain("درخواست تسویه");
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
    const html = renderToStaticMarkup(<WalletPage initialPanel="missing-settlement" />);

    expect(result.status).toBe("blocked_missing_settlement_info");
    expect(result.message).toBe("برای برداشت درآمد، ابتدا شماره شبا و نام صاحب حساب را ثبت کن.");
    expect(html).toContain("اطلاعات تسویه ثبت نشده است");
    expect(html).toContain("ثبت اطلاعات تسویه");
  });

  it("payout request works when settlement info exists", () => {
    const result = requestPayout(walletFixtureWithSettlement);
    const html = renderToStaticMarkup(<WalletPage fixture={walletFixtureWithSettlement} initialPanel="payout" />);

    expect(result.status).toBe("requested");
    if (result.status === "requested") {
      expect(result.wallet.availablePayout).toBe(0);
      expect(result.wallet.pendingPayout).toBe(walletFixtureWithSettlement.pendingPayout + walletFixtureWithSettlement.availablePayout);
      expect(result.wallet.transactions[0].type).toBe("payout");
    }
    expect(html).toContain("ثبت درخواست تسویه");
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
});
