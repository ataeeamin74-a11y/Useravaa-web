import { formatIban, validateIranIban, type SettlementSettings } from "./my-profile";
import { formatter, toman } from "./profiles";

export type WalletTransactionType = "payment" | "earning" | "payout" | "refund" | "topup";
export type WalletTransactionFilter = "" | WalletTransactionType;

export type WalletTransaction = {
  id: string;
  type: WalletTransactionType;
  title: string;
  date: string;
  amount: number;
};

export type WalletFixture = {
  balance: number;
  availablePayout: number;
  pendingPayout: number;
  settlement: SettlementSettings;
  transactions: WalletTransaction[];
};

export const topUpAmounts = [500000, 1000000, 2000000] as const;

export const walletTypeLabels: Record<WalletTransactionType, string> = {
  payment: "پرداخت",
  earning: "درآمد",
  payout: "تسویه",
  refund: "برگشت مبلغ",
  topup: "افزایش موجودی"
};

export const initialWalletFixture: WalletFixture = {
  balance: 100000,
  availablePayout: 8400000,
  pendingPayout: 1800000,
  settlement: {
    accountOwner: "",
    iban: "",
    verified: false
  },
  transactions: [
    { id: "tx-payment-1", type: "payment", title: "پرداخت جلسه مشاوره با علی ر.", date: "۲۴ خرداد، ۱۴:۴۰", amount: -900000 },
    { id: "tx-earning-1", type: "earning", title: "درآمد جلسه موفق", date: "۲۳ خرداد، ۱۷:۱۰", amount: 1800000 },
    { id: "tx-payout-1", type: "payout", title: "تسویه به حساب بانکی", date: "۲۰ خرداد، ۱۲:۰۰", amount: -1200000 },
    { id: "tx-refund-1", type: "refund", title: "برگشت مبلغ جلسه لغوشده", date: "۱۸ خرداد، ۱۰:۳۰", amount: 500000 }
  ]
};

export const walletFixtureWithSettlement: WalletFixture = {
  ...initialWalletFixture,
  settlement: {
    accountOwner: "علی ر.",
    iban: "IR123456789012345678901234",
    verified: true
  }
};

export function formatToman(value: number | null) {
  return toman(value);
}

export function signedToman(value: number) {
  const abs = formatToman(Math.abs(value));
  return value < 0 ? `-${abs}` : `+${abs}`;
}

export function filterWalletTransactions(transactions: readonly WalletTransaction[], filter: WalletTransactionFilter) {
  return filter ? transactions.filter((transaction) => transaction.type === filter) : [...transactions];
}

export function topUpWallet(wallet: WalletFixture, amount: number): WalletFixture {
  return {
    ...wallet,
    balance: wallet.balance + amount,
    transactions: [
      {
        id: `tx-topup-${wallet.transactions.length + 1}`,
        type: "topup",
        title: "افزایش موجودی کیف پول",
        date: "امروز",
        amount
      },
      ...wallet.transactions
    ]
  };
}

export type PayoutRequestResult =
  | {
      status: "blocked_missing_settlement_info";
      message: string;
    }
  | {
      status: "requested";
      message: string;
      wallet: WalletFixture;
    };

export function requestPayout(wallet: WalletFixture): PayoutRequestResult {
  const settlementIsValid = wallet.settlement.verified && validateIranIban(wallet.settlement.iban);

  if (!settlementIsValid) {
    return {
      status: "blocked_missing_settlement_info",
      message: "برای برداشت درآمد، ابتدا شماره شبا و نام صاحب حساب را ثبت کن."
    };
  }

  const payoutAmount = wallet.availablePayout;

  return {
    status: "requested",
    message: "درخواست تسویه ثبت شد.",
    wallet: {
      ...wallet,
      availablePayout: 0,
      pendingPayout: wallet.pendingPayout + payoutAmount,
      transactions:
        payoutAmount > 0
          ? [
              {
                id: `tx-payout-request-${wallet.transactions.length + 1}`,
                type: "payout",
                title: "درخواست تسویه",
                date: "امروز",
                amount: -payoutAmount
              },
              ...wallet.transactions
            ]
          : wallet.transactions
    }
  };
}

export function applyWalletSettlement(wallet: WalletFixture, settlement: SettlementSettings): WalletFixture {
  return {
    ...wallet,
    settlement: {
      ...settlement,
      iban: settlement.iban.replace(/\s+/g, ""),
      verified: true
    }
  };
}

export function settlementLine(settlement: SettlementSettings) {
  if (!settlement.verified || !settlement.iban) {
    return "اطلاعات تسویه ثبت نشده است";
  }

  return `حساب تسویه: ${formatIban(settlement.iban)} · صاحب حساب: ${settlement.accountOwner}`;
}

export function formatWalletCount(value: number) {
  return formatter.format(value);
}
