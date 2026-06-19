import { formatIban, normalizeIban, validateIranIban, type SettlementSettings } from "./my-profile";
import { formatter, toman } from "./profiles";

export type WalletTransactionType =
  | "payment"
  | "earning"
  | "payout"
  | "refund"
  | "topup"
  | "CANCELLATION_CREDIT"
  | "CANCELLATION_PROVIDER_COMPENSATION"
  | "WITHDRAWAL_REQUEST";
export type WalletTransactionFilter = "" | WalletTransactionType;

export type WalletWithdrawalStatus = "PENDING_REVIEW" | "PROCESSING" | "COMPLETED" | "FAILED" | "NEEDS_REVIEW";

export type WalletWithdrawalRequest = {
  id: string;
  userId: string;
  amount: number;
  accountHolderName: string;
  iban: string;
  status: WalletWithdrawalStatus;
  requestedAt: string;
  processedAt?: string;
  trackingNumber?: string;
  adminNote?: string;
};

export type WalletWithdrawalInput = {
  accountHolderName: string;
  iban: string;
};

export type WalletWithdrawalErrors = Partial<Record<"accountHolderName" | "iban", string>>;

export type WalletTransaction = {
  id: string;
  type: WalletTransactionType;
  title: string;
  date: string;
  amount: number;
  sourceRequestId?: string;
  sourceConversationId?: string;
  status?: "completed" | "pending" | "failed";
  settlementStatus?: "SETTLEMENT_PENDING" | "SETTLED" | "NOT_SETTLEABLE";
  cancelledByRole?: "REQUESTER" | "PROVIDER" | "EXPERIENCE_CREATOR" | "ADMIN_SUPPORT" | "PLATFORM";
  providerGrossCompensation?: number;
  useravaaFeeRate?: number;
  useravaaFeeAmount?: number;
  providerNetAmount?: number;
  refundRate?: number;
  refundAmount?: number;
  hoursUntilSession?: number | null;
  createdAt?: string;
};

export type WalletFixture = {
  ownerUserId: string;
  balance: number;
  availablePayout: number;
  pendingPayout: number;
  settlement: SettlementSettings;
  withdrawalRequests: WalletWithdrawalRequest[];
  transactions: WalletTransaction[];
};

export const topUpAmounts = [500000, 1000000, 2000000] as const;

export const walletTypeLabels: Record<WalletTransactionType, string> = {
  payment: "پرداخت",
  earning: "درآمد",
  payout: "تسویه",
  refund: "برگشت مبلغ",
  topup: "افزایش موجودی",
  CANCELLATION_CREDIT: "بازگشت اعتبار",
  CANCELLATION_PROVIDER_COMPENSATION: "جبران کنسلی",
  WITHDRAWAL_REQUEST: "درخواست برداشت وجه"
};

export const initialWalletFixture: WalletFixture = {
  ownerUserId: "user-requester",
  balance: 100000,
  availablePayout: 8400000,
  pendingPayout: 1800000,
  settlement: {
    accountOwner: "",
    iban: "",
    verified: false
  },
  withdrawalRequests: [],
  transactions: [
    {
      id: "wallet-credit-provider-rejection-conv-provider-rejected",
      type: "CANCELLATION_CREDIT",
      title: "اعتبار برگشتی از رد درخواست",
      date: "امروز",
      amount: 900000,
      sourceRequestId: "conv-provider-rejected",
      sourceConversationId: "conv-provider-rejected",
      status: "completed",
      createdAt: "2026-05-23T12:00:00+03:30"
    },
    {
      id: "wallet-credit-provider-cancellation-conv-provider-cancelled-session",
      type: "CANCELLATION_CREDIT",
      title: "اعتبار برگشتی از لغو توسط تجربه‌آفرین",
      date: "امروز",
      amount: 1800000,
      sourceRequestId: "conv-provider-cancelled-session",
      sourceConversationId: "conv-provider-cancelled-session",
      status: "completed",
      createdAt: "2026-05-23T12:10:00+03:30"
    },
    {
      id: "wallet-credit-cancellation-conv-time-options",
      type: "CANCELLATION_CREDIT",
      title: "بازگشت اعتبار از لغو درخواست",
      date: "امروز",
      amount: 810000,
      sourceRequestId: "conv-time-options",
      sourceConversationId: "conv-time-options",
      status: "completed",
      createdAt: "2026-05-23T09:00:00+03:30"
    },
    {
      id: "wallet-credit-provider-compensation-conv-late-cancel",
      type: "CANCELLATION_PROVIDER_COMPENSATION",
      title: "جبران کنسلی درخواست",
      date: "امروز",
      amount: 850000,
      sourceRequestId: "conv-late-cancel",
      sourceConversationId: "conv-late-cancel",
      status: "pending",
      settlementStatus: "SETTLEMENT_PENDING",
      cancelledByRole: "REQUESTER",
      providerGrossCompensation: 1000000,
      useravaaFeeRate: 0.15,
      useravaaFeeAmount: 150000,
      providerNetAmount: 850000,
      refundRate: 0,
      refundAmount: 0,
      hoursUntilSession: 2,
      createdAt: "2026-05-23T09:00:00+03:30"
    },
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

export const walletWithdrawalStatusLabels: Record<WalletWithdrawalStatus, string> = {
  PENDING_REVIEW: "در انتظار بررسی",
  PROCESSING: "در حال پردازش",
  COMPLETED: "تسویه شده",
  FAILED: "ناموفق",
  NEEDS_REVIEW: "نیازمند بررسی"
};

export const walletWithdrawalCopy = {
  title: "درخواست برداشت وجه",
  helper: "می‌توانید برای اعتبار قابل برداشت کیف پول، درخواست برداشت ثبت کنید.",
  description: "اطلاعات حساب را وارد کنید تا درخواست برداشت اعتبار کیف پول ثبت شود.",
  fullAmountOnly: "در این نسخه، درخواست برداشت برای کل مبلغ قابل برداشت ثبت می‌شود.",
  confirmation: "پس از ثبت درخواست، وضعیت برداشت از همین صفحه قابل پیگیری است.",
  submitCta: "ثبت درخواست برداشت",
  successTitle: "درخواست برداشت ثبت شد",
  successText: "درخواست برداشت وجه ثبت شد و وضعیت آن از کیف پول قابل پیگیری است.",
  accountHolderError: "نام صاحب حساب را وارد کنید.",
  ibanError: "شماره شبا را درست وارد کنید."
};

export function normalizeWithdrawalIban(value: string) {
  const normalized = normalizeIban(value);
  return normalized.startsWith("IR") ? normalized : `IR${normalized.replace(/^IR/i, "")}`;
}

export function validateWalletWithdrawalInput(input: WalletWithdrawalInput): { errors: WalletWithdrawalErrors; normalized: WalletWithdrawalInput } {
  const normalized = {
    accountHolderName: input.accountHolderName.trim().replace(/\s+/g, " "),
    iban: normalizeWithdrawalIban(input.iban)
  };
  const errors: WalletWithdrawalErrors = {};

  if (normalized.accountHolderName.length < 3 || normalized.accountHolderName.length > 80) {
    errors.accountHolderName = walletWithdrawalCopy.accountHolderError;
  }

  if (!validateIranIban(normalized.iban)) {
    errors.iban = walletWithdrawalCopy.ibanError;
  }

  return { errors, normalized };
}

export function getActiveWithdrawalRequest(wallet: WalletFixture) {
  return (
    wallet.withdrawalRequests.find((request) => request.status === "PENDING_REVIEW" || request.status === "PROCESSING" || request.status === "NEEDS_REVIEW") ??
    null
  );
}

export function canRequestWalletWithdrawal(wallet: WalletFixture, actorUserId = wallet.ownerUserId) {
  return actorUserId === wallet.ownerUserId && wallet.availablePayout > 0 && !getActiveWithdrawalRequest(wallet);
}

export type WalletWithdrawalResult =
  | {
      status: "forbidden";
      message: string;
    }
  | {
      status: "blocked_no_balance";
      message: string;
    }
  | {
      status: "blocked_pending_withdrawal";
      message: string;
      activeRequest: WalletWithdrawalRequest;
    }
  | {
      status: "invalid";
      errors: WalletWithdrawalErrors;
    }
  | {
      status: "requested";
      message: string;
      wallet: WalletFixture;
      withdrawalRequest: WalletWithdrawalRequest;
      notification: WalletWithdrawalNotification;
    };

export type WalletWithdrawalNotification = {
  userId: string;
  title: string;
  body: string;
  href: "/wallet";
};

export function createWalletWithdrawalNotification(request: WalletWithdrawalRequest): WalletWithdrawalNotification {
  return {
    userId: request.userId,
    title: walletWithdrawalCopy.successTitle,
    body: walletWithdrawalCopy.successText,
    href: "/wallet"
  };
}

export function submitWalletWithdrawalRequest(
  wallet: WalletFixture,
  input: WalletWithdrawalInput,
  actorUserId = wallet.ownerUserId,
  requestedAt = "2026-05-23T12:00:00+03:30"
): WalletWithdrawalResult {
  if (actorUserId !== wallet.ownerUserId) {
    return {
      status: "forbidden",
      message: "دسترسی به کیف پول امکان‌پذیر نیست."
    };
  }

  if (wallet.availablePayout <= 0) {
    return {
      status: "blocked_no_balance",
      message: "مبلغ قابل برداشت وجود ندارد."
    };
  }

  const activeRequest = getActiveWithdrawalRequest(wallet);

  if (activeRequest) {
    return {
      status: "blocked_pending_withdrawal",
      message: "یک درخواست برداشت در انتظار بررسی است.",
      activeRequest
    };
  }

  const validation = validateWalletWithdrawalInput(input);

  if (Object.keys(validation.errors).length > 0) {
    return {
      status: "invalid",
      errors: validation.errors
    };
  }

  const amount = wallet.availablePayout;
  const withdrawalRequest: WalletWithdrawalRequest = {
    id: `withdrawal-${wallet.withdrawalRequests.length + 1}`,
    userId: wallet.ownerUserId,
    amount,
    accountHolderName: validation.normalized.accountHolderName,
    iban: validation.normalized.iban,
    status: "PENDING_REVIEW",
    requestedAt
  };
  const notification = createWalletWithdrawalNotification(withdrawalRequest);

  return {
    status: "requested",
    message: walletWithdrawalCopy.successText,
    withdrawalRequest,
    notification,
    wallet: {
      ...wallet,
      availablePayout: 0,
      pendingPayout: wallet.pendingPayout + amount,
      settlement: {
        accountOwner: validation.normalized.accountHolderName,
        iban: validation.normalized.iban,
        verified: true
      },
      withdrawalRequests: [withdrawalRequest, ...wallet.withdrawalRequests],
      transactions: [
        {
          id: `tx-withdrawal-request-${wallet.transactions.length + 1}`,
          type: "WITHDRAWAL_REQUEST",
          title: walletWithdrawalCopy.title,
          date: "امروز",
          amount: -amount,
          status: "pending",
          createdAt: requestedAt
        },
        ...wallet.transactions
      ]
    }
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
      message: "برای ثبت درخواست برداشت، اطلاعات حساب را کامل کنید."
    };
  }

  const result = submitWalletWithdrawalRequest(
    wallet,
    {
      accountHolderName: wallet.settlement.accountOwner,
      iban: wallet.settlement.iban
    },
    wallet.ownerUserId
  );

  if (result.status !== "requested") {
    return {
      status: "blocked_missing_settlement_info",
      message: result.status === "blocked_pending_withdrawal" ? result.message : "برای ثبت درخواست برداشت، اطلاعات حساب را کامل کنید."
    };
  }

  return {
    status: "requested",
    message: result.message,
    wallet: result.wallet
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
