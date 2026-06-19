import { formatter, getProfileById, profiles, toman, type ExperienceProfileFixture } from "./profiles";
import { toPersianDigits } from "@/lib/fa-format";

export type ConversationDirection = "outgoing" | "incoming";
export type ViewerRole = "REQUESTER" | "PROVIDER";

export type ConversationRequestStatus =
  | "pending_provider_response"
  | "times_proposed"
  | "pending_payment"
  | "payment_not_required"
  | "payment_processing"
  | "new_time_requested"
  | "confirmed"
  | "completed"
  | "rejected"
  | "expired"
  | "cancelled"
  | "refunded";

export type ConversationState = ConversationRequestStatus;
export type ConversationDuration = 30 | 60;
export type ConversationBucket = "needsAction" | "tracking" | "done";
export type ConversationSectionKey = "needsAction" | "requestStage" | "inProgress" | "confirmedSessions" | "history";
export type ConversationStatusSectionKey = "inProgress" | "confirmedSessions" | "history";
export type UserActionBadge = "درخواست ارسالی" | "درخواست دریافتی" | "پرداخت" | "پروفایل" | "کیف پول" | "حساب کاربری";
export type UserActionUrgency = "urgent" | "today" | "completion";
export type UserActionFilter = "all" | "sessions" | "payment" | "profile" | "wallet";
export type UserAction = {
  id: string;
  title: string;
  badge: UserActionBadge;
  urgency: UserActionUrgency;
  filter: UserActionFilter;
  description: string;
  chips: string[];
  primaryCta: string;
  primaryHref: string;
  secondaryCta?: string;
  secondaryHref?: string;
};
export type CancellationReasonCode =
  | "TIME_OPTIONS_NOT_SUITABLE"
  | "NOT_SURE_NEEDED"
  | "NEED_CHANGED"
  | "WANT_DIFFERENT_EXPERIENCE_CREATOR"
  | "CREATED_BY_MISTAKE"
  | "PRICE_NOT_SUITABLE"
  | "PAYMENT_OR_COORDINATION_DIFFICULT"
  | "RESPONSE_TOO_SLOW"
  | "OTHER"
  | "PREFER_NOT_TO_SAY";
export type ProviderRejectionReasonCode =
  | "TOPIC_NOT_ALIGNED"
  | "NO_AVAILABILITY"
  | "NOT_ENOUGH_TIME_TO_RESPOND"
  | "REQUEST_NOT_CLEAR"
  | "ACCEPTED_BY_MISTAKE"
  | "OTHER"
  | "PREFER_NOT_TO_SAY";
export type ProviderCancellationReasonCode =
  | "NO_AVAILABILITY"
  | "TIME_OPTIONS_NO_LONGER_WORK"
  | "TOPIC_NOT_ALIGNED"
  | "WORK_OR_PERSONAL_CONDITION_CHANGED"
  | "REQUEST_NOT_CLEAR"
  | "ACCEPTED_BY_MISTAKE"
  | "CANNOT_ATTEND_CONFIRMED_SESSION"
  | "OTHER"
  | "PREFER_NOT_TO_SAY";
export type ProviderCancellationStage =
  | "BEFORE_TIME_PROPOSAL"
  | "AFTER_TIME_PROPOSAL_BEFORE_SELECTION"
  | "AFTER_CONFIRMED_SESSION"
  | "NEAR_SESSION_START";
export type CancellationStage =
  | "BEFORE_TIME_PROPOSAL"
  | "AFTER_TIME_PROPOSAL_BEFORE_SELECTION"
  | "AFTER_CONFIRMED_SESSION"
  | "NEAR_SESSION_START"
  | "PROVIDER_FAULT"
  | "PLATFORM_FAULT";
export type CancellationReviewStatus = "NOT_REQUIRED" | "PENDING_SUPPORT_REVIEW" | "APPROVED" | "REJECTED";
export type CancellationRefundDestination = "WALLET" | "NONE";
export type CancelledByRole = "REQUESTER" | "PROVIDER" | "EXPERIENCE_CREATOR" | "ADMIN_SUPPORT" | "PLATFORM";
export type CancellationRecordInput = {
  reasonCode: CancellationReasonCode;
  reasonText?: string;
  cancelledByRole?: CancelledByRole;
  stageOverride?: Extract<CancellationStage, "PROVIDER_FAULT" | "PLATFORM_FAULT">;
};
export type ProviderRejectionInput = {
  reasonCode: ProviderRejectionReasonCode;
  reasonText?: string;
  providerId?: string;
};
export type ProviderCancellationInput = {
  reasonCode: ProviderCancellationReasonCode;
  reasonText?: string;
  providerId?: string;
};
export type CancellationRefundPolicy = {
  stage: CancellationStage;
  refundRate: number;
  refundAmount: number;
  refundDestination: CancellationRefundDestination;
  providerGrossCompensation: number;
  useravaaFeeRate: number;
  useravaaFeeAmount: number;
  providerNetCompensation: number;
  isLateRequesterCancellation: boolean;
  requiresSupportReview: boolean;
  copy: string;
  destinationCopy: string;
};
export type CancellationRecoveryAction = {
  id: "wallet" | "same_provider" | "same_field" | "similar" | "discover" | "previous_requests" | "support" | "free_request" | "short_options";
  label: string;
  href: string;
  tone?: "primary" | "secondary";
};
export type ConversationActionKind = "open" | "propose_times" | "reject" | "select_time" | "checkout" | "cancel";
export type CanonicalSessionFlow =
  | "REQUEST_CREATED_BY_REQUESTER"
  | "WAITING_FOR_PROVIDER_TO_PROPOSE_TIMES"
  | "PROVIDER_PROPOSED_TIMES_WAITING_FOR_REQUESTER_SELECTION"
  | "REQUESTER_SELECTED_TIME_WAITING_FOR_PAYMENT"
  | "REQUESTER_SELECTED_TIME_NO_PAYMENT_REQUIRED"
  | "REQUESTER_REQUESTED_NEW_TIMES"
  | "PAYMENT_PROCESSING"
  | "SESSION_CONFIRMED_CONTACT_UNLOCKED"
  | "SESSION_COMPLETED_WAITING_FOR_FEEDBACK"
  | "SESSION_COMPLETED_FEEDBACK_DONE"
  | "REQUEST_EXPIRED"
  | "REQUEST_CANCELLED"
  | "PAYMENT_FAILED"
  | "REFUNDED";
export type PaymentStatus =
  | "NOT_REQUIRED"
  | "UNPAID"
  | "PENDING_REVIEW"
  | "PARTIALLY_COVERED_BY_WALLET"
  | "FULLY_COVERED_BY_WALLET"
  | "PAID"
  | "PROCESSING"
  | "FAILED"
  | "REFUND_PENDING"
  | "REFUNDED";
export type PaymentMethod = "ONLINE" | "CARD_TO_CARD" | "WALLET" | "FREE";
export type ManualPaymentStatus = "NOT_REQUIRED" | "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "NEEDS_REVIEW";
export type RequestStatus =
  | "AWAITING_PAYMENT"
  | "AWAITING_TIME_PROPOSAL"
  | "AWAITING_TIME_REPROPOSAL"
  | "TIME_OPTIONS_SENT"
  | "SCHEDULED"
  | "COMPLETED"
  | "REJECTED"
  | "CANCELLED"
  | "EXPIRED"
  | "REFUNDED";
export type FundStatus = "NONE" | "HELD_BY_USERAVAA" | "RELEASE_PENDING" | "RELEASED_TO_PROVIDER" | "RETURNED_TO_REQUESTER";
export type AttendanceVerificationStatus = "NOT_REQUIRED" | "PENDING" | "VERIFIED" | "FAILED" | "EXPIRED" | "NEEDS_REVIEW";
export type ProviderPayoutStatus =
  | "NOT_READY"
  | "PENDING_24H"
  | "BLOCKED_MISSING_SETTLEMENT_INFO"
  | "PROCESSING"
  | "PAID"
  | "FAILED"
  | "NEEDS_REVIEW";
export type PaymentRequirement =
  | "PAYMENT_REQUIRED"
  | "NO_PAYMENT_REQUIRED_FREE_HELP"
  | "NO_PAYMENT_REQUIRED_MANUAL"
  | "FULL_WALLET_COVERED"
  | "PARTIAL_GATEWAY_REQUIRED";
export type DisabledReason =
  | "NO_TIME_SELECTED"
  | "REQUEST_EXPIRED"
  | "WAITING_FOR_PROVIDER"
  | "WAITING_FOR_REQUESTER"
  | "PAYMENT_ALREADY_DONE"
  | "PAYMENT_NOT_REQUIRED"
  | "WALLET_OR_GATEWAY_UNAVAILABLE"
  | "SESSION_ALREADY_CONFIRMED"
  | "NO_VALID_SELECTED_TIME"
  | "ROLE_NOT_ALLOWED"
  | "ROUTE_STATE_MISMATCH";
export type SessionRouteKind = "proposeTimes" | "selectTime" | "checkout" | "sessionDetail";
export type NotificationStatus = "unread" | "read";
export type EmailLogStatus = "queued" | "sent" | "failed";

export type ConversationNotificationType =
  | "new_request"
  | "proposed_times"
  | "near_expiration"
  | "confirmed"
  | "one_hour_reminder"
  | "expired"
  | "cancellation"
  | "new_time_request"
  | "new_time_options"
  | "provider_time_replacement";

export type EmailTemplateKey = "new_request" | "proposed_times" | "confirmed" | "one_hour_reminder";

export type ProposedTime = {
  id: string;
  conversationRequestId: string;
  date: string;
  time: string;
  displayDateFa: string;
  displayTimeFa: string;
  isSelected: boolean;
  dateId: string;
  dateLabel: string;
  dayLabel: string;
  timeLabel: string;
  startAt?: string;
  status?: "ACTIVE" | "SUPERSEDED" | "SELECTED";
  version?: number;
};

export type ConversationFixture = {
  id: string;
  requesterId: string;
  providerId: string;
  profileId: string;
  direction: ConversationDirection;
  status: ConversationRequestStatus;
  state: ConversationState;
  profile: ExperienceProfileFixture;
  requesterName: string;
  requesterRole: string;
  durationMinutes: ConversationDuration;
  duration: ConversationDuration;
  requestNote: string;
  requestTopic?: string;
  note: string;
  createdAt: string;
  providerResponseDeadlineAt: string;
  providerRespondedAt?: string | null;
  timesProposedAt?: string | null;
  requesterSelectionDeadlineAt?: string | null;
  selectedTimeId?: string | null;
  selectedAt?: string | null;
  paidAt?: string | null;
  confirmedAt?: string | null;
  rejectedAt?: string | null;
  expiredAt?: string | null;
  cancelledAt?: string | null;
  submittedAtLabel: string;
  proposedAtLabel?: string;
  selectedTime?: ProposedTime;
  proposedTimes: ProposedTime[];
  timeOptionsVersion?: number;
  timeOptionsStatus?: "ACTIVE" | "SUPERSEDED";
  timeOptionsReplacedAt?: string | null;
  timeOptionsReplacedByUserId?: string | null;
  newTimeRequestCount?: number;
  newTimeRequestedAt?: string | null;
  newTimeRequestedByUserId?: string | null;
  newTimeRequestNote?: string | null;
  previousTimeOptions?: ProposedTime[];
  walletBalanceToman?: number;
  freeHelp?: boolean;
  paymentMethod?: PaymentMethod;
  manualPaymentStatus?: ManualPaymentStatus;
  manualPaymentReferenceNumber?: string | null;
  manualPaymentReceiptUrl?: string | null;
  manualPaymentReceiptFileName?: string | null;
  manualPaymentReceiptMimeType?: string | null;
  manualPaymentReceiptSize?: number | null;
  manualPaymentSubmittedAt?: string | null;
  manualPaymentReviewedAt?: string | null;
  manualPaymentReviewedByAdminId?: string | null;
  manualPaymentAdminNote?: string | null;
  attendanceVerificationCode?: string | null;
  attendanceVerificationCodeHash?: string | null;
  attendanceVerificationCodeGeneratedAt?: string | null;
  attendanceVerificationCodeExpiresAt?: string | null;
  attendanceVerificationStatus?: AttendanceVerificationStatus;
  attendanceVerificationAttempts?: number;
  attendanceVerifiedAt?: string | null;
  attendanceVerifiedByProviderId?: string | null;
  providerPayoutStatus?: ProviderPayoutStatus;
  providerPayoutAvailableAt?: string | null;
  providerPayoutProcessedAt?: string | null;
  providerSettlementInfoComplete?: boolean;
  cancellationReasonCode?: CancellationReasonCode | null;
  cancellationReasonText?: string | null;
  cancelledByRole?: CancelledByRole | null;
  cancellationStage?: CancellationStage | null;
  providerCancellationReasonCode?: ProviderCancellationReasonCode | null;
  providerCancellationReasonText?: string | null;
  providerCancelledAt?: string | null;
  providerCancellationStage?: ProviderCancellationStage | null;
  rejectedByRole?: "EXPERIENCE_CREATOR" | null;
  rejectionReasonCode?: ProviderRejectionReasonCode | null;
  rejectionReasonText?: string | null;
  requiresSupportReview?: boolean;
  refundRate?: number | null;
  refundAmount?: number | null;
  refundDestination?: CancellationRefundDestination | null;
  providerGrossCompensation?: number | null;
  providerNetCompensation?: number | null;
  useravaaFeeRate?: number | null;
  useravaaFeeAmount?: number | null;
  providerCompensationWalletTransactionId?: string | null;
  requesterRefundWalletTransactionId?: string | null;
  isLateRequesterCancellation?: boolean;
  walletCreditId?: string | null;
  requestStatusBeforeCancel?: ConversationRequestStatus | null;
  paymentStatusBeforeCancel?: PaymentStatus | null;
  hasTimeOptions?: boolean;
  hasConfirmedSession?: boolean;
  hoursUntilSession?: number | null;
  cancellationReviewStatus?: CancellationReviewStatus | null;
};

export type ConversationAction = {
  kind: ConversationActionKind;
  label: string;
  href?: string;
  tone: "primary" | "secondary" | "danger";
  disabled?: boolean;
  disabledReason?: DisabledReason;
  disabledMessage?: string;
};

export type ConversationNotification = {
  id: string;
  receiverId: string;
  type: ConversationNotificationType;
  title: string;
  message: string;
  targetRoute: string;
  status: NotificationStatus;
  createdAt: string;
};

export type EmailTemplate = {
  key: EmailTemplateKey;
  subject: string;
  body: string;
  targetLabel: string;
};

export type EmailLog = {
  id: string;
  receiverId: string;
  conversationRequestId: string;
  templateKey: EmailTemplateKey;
  toEmail: string;
  subject: string;
  status: EmailLogStatus;
  sentAt?: string | null;
  failedReason?: string | null;
};

export type SimilarExperience = {
  profileId: string;
  displayName: string;
  jobTitle: string;
  jobField: string;
  orgLevel: string;
};

export type ProposedTimesValidation = {
  valid: boolean;
  errors: string[];
};

export type ProposedTimeDraft = {
  id: "one" | "two" | "three";
  day: string | null;
  startTime: string | null;
};

export type ManualPaymentReceiptInput = {
  fileName: string;
  mimeType: string;
  size: number;
  url?: string | null;
};

export type SubmitManualPaymentInput = {
  referenceNumber?: string;
  receipt?: ManualPaymentReceiptInput | null;
};

export type ManualPaymentActionResult = {
  conversation: ConversationFixture;
  success: boolean;
  message: string;
};

export type SessionContactDetails = {
  phoneNumber?: string;
  email?: string;
};

const MS_PER_HOUR = 60 * 60 * 1000;
const ATTENDANCE_VERIFICATION_MAX_ATTEMPTS = 5;
const MANUAL_PAYMENT_MAX_RECEIPT_SIZE_BYTES = 5 * 1024 * 1024;
const LATE_REQUESTER_CANCELLATION_THRESHOLD_HOURS = 3;
export const USERAVAA_PLATFORM_FEE_RATE = 0.15;
const manualPaymentAllowedReceiptTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"] as const;
export const reliabilityMockNow = "2026-05-23T09:00:00+03:30";
export const walletBalanceToman = 100000;
export const conversationEmailSender = "notifications@useravaa.com";

export const manualPaymentCardDetails = {
  cardNumber: "6104331155545750",
  cardholderName: "فاطمه اصغری"
} as const;

export const manualPaymentCopy = {
  methodsTitle: "روش پرداخت",
  onlineTitle: "پرداخت اینترنتی",
  onlineDisabledBadge: "موقتاً غیرفعال",
  onlineDescription: "این روش پرداخت در حال حاضر فعال نیست. لطفاً از روش کارت‌به‌کارت استفاده کنید.",
  cardToCardTitle: "کارت‌به‌کارت",
  cardToCardActiveBadge: "فعال",
  cardToCardDescription: "مبلغ درخواست را به کارت زیر واریز کنید و سپس شماره مرجع/ارجاع یا تصویر رسید را ثبت کنید.",
  cardNumberLabel: "شماره کارت",
  cardholderLabel: "به نام",
  copy: "کپی",
  copied: "کپی شد",
  instructions: "پس از واریز، لطفاً شماره مرجع/ارجاع را وارد کنید یا تصویر رسید پرداخت را بارگذاری کنید.",
  adminReviewNote: "درخواست شما پس از تأیید پرداخت توسط ادمین برای تجربه‌آفرین ارسال می‌شود.",
  providerHiddenAssurance: "تا زمان تأیید پرداخت، درخواست برای تجربه‌آفرین نمایش داده نمی‌شود.",
  formTitle: "ثبت اطلاعات پرداخت کارت‌به‌کارت",
  referenceLabel: "شماره مرجع/ارجاع پرداخت",
  referencePlaceholder: "مثلاً ۱۲۳۴۵۶۷۸۹۰",
  referenceHelper: "اگر شماره مرجع را دارید، آن را اینجا وارد کنید.",
  receiptLabel: "تصویر رسید پرداخت",
  receiptHelper: "اگر رسید تصویری دارید، آن را بارگذاری کنید.",
  missingProof: "لطفاً شماره مرجع/ارجاع را وارد کنید یا تصویر رسید پرداخت را بارگذاری کنید.",
  invalidReference: "لطفاً شماره مرجع/ارجاع را فقط با عدد وارد کنید.",
  invalidReceiptType: "فرمت فایل رسید قابل قبول نیست. لطفاً تصویر رسید را با فرمت مجاز بارگذاری کنید.",
  receiptTooLarge: "حجم فایل رسید بیشتر از حد مجاز است.",
  submit: "ثبت پرداخت برای بررسی",
  backToSummary: "بازگشت به خلاصه درخواست",
  submittedTitle: "پرداخت برای بررسی ثبت شد",
  submittedText: "اطلاعات پرداخت شما ثبت شد و توسط ادمین بررسی می‌شود. پس از تأیید پرداخت، درخواست شما برای تجربه‌آفرین ارسال خواهد شد.",
  pendingStatus: "در انتظار تأیید پرداخت",
  pendingHelper: "تا زمان تأیید پرداخت، درخواست برای تجربه‌آفرین نمایش داده نمی‌شود.",
  viewStatus: "مشاهده وضعیت درخواست",
  approvedTitle: "پرداخت تأیید شد",
  approvedText: "پرداخت شما تأیید شد و درخواست پرداخت‌شده برای تجربه‌آفرین ارسال شد. پس از اعلام سه زمان پیشنهادی، می‌توانید یکی را انتخاب کنید و جلسه را قطعی کنید.",
  rejectedTitle: "پرداخت تأیید نشد",
  rejectedText: "اطلاعات پرداخت ثبت‌شده تأیید نشد. می‌توانید اطلاعات پرداخت را دوباره ثبت کنید یا از پشتیبانی پیگیری کنید.",
  rejectionReason: "دلیل بررسی",
  resubmit: "ثبت دوباره اطلاعات پرداخت",
  contactSupport: "ارتباط با پشتیبانی",
  adminTitle: "بررسی پرداخت‌های کارت‌به‌کارت",
  adminPending: "در انتظار بررسی",
  adminApproved: "تأیید شده",
  adminRejected: "رد شده",
  adminApprove: "تأیید پرداخت",
  adminReject: "رد پرداخت",
  adminRejectReasonLabel: "دلیل رد پرداخت",
  adminRejectReasonPlaceholder: "مثلاً شماره مرجع قابل بررسی نبود یا مبلغ واریزی تطابق نداشت."
} as const;

export const postPaymentContactCopy = {
  unlockedTitle: "اطلاعات هماهنگی جلسه",
  unlockedHelper: "جلسه قطعی شده است. جزئیات هماهنگی مربوط به همین گفت‌وگو در همین بخش نمایش داده می‌شود.",
  lockedTitle: "اطلاعات هماهنگی بعد از قطعی‌شدن باز می‌شود",
  lockedHelper: "پرداخت قبلاً انجام شده است؛ اطلاعات هماهنگی بعد از انتخاب زمان و قطعی‌شدن جلسه نمایش داده می‌شود.",
  checkoutNotice: "پرداخت به‌صورت امن نگه داشته می‌شود و درخواست فقط بعد از پرداخت برای تجربه‌آفرین ارسال می‌شود.",
  missingPhone: "شماره تماس ثبت نشده است.",
  missingEmail: "ایمیل ثبت نشده است."
} as const;

const baseDisabledReasonCopy: Record<Exclude<DisabledReason, "NO_VALID_SELECTED_TIME">, string> = {
  NO_TIME_SELECTED: "برای ادامه، یکی از زمان‌های پیشنهادی را انتخاب کنید.",
  REQUEST_EXPIRED: "مهلت این درخواست تمام شده است. برای ادامه، درخواست جدید بسازید.",
  WAITING_FOR_PROVIDER: "پس از پیشنهاد زمان توسط مشاور، می‌توانید زمان مناسب را انتخاب کنید.",
  WAITING_FOR_REQUESTER: "زمان‌ها پیشنهاد شده‌اند و طرف مقابل باید یکی را انتخاب کند.",
  PAYMENT_ALREADY_DONE: "پرداخت انجام شده و درخواست برای تجربه‌آفرین ارسال شده است.",
  PAYMENT_NOT_REQUIRED: "این درخواست بدون پرداخت ارسال می‌شود.",
  WALLET_OR_GATEWAY_UNAVAILABLE: "پرداخت در حال حاضر در دسترس نیست.",
  SESSION_ALREADY_CONFIRMED: "این جلسه قبلاً قطعی شده است.",
  ROLE_NOT_ALLOWED: "این اقدام برای نقش شما در این مرحله فعال نیست.",
  ROUTE_STATE_MISMATCH: "این مسیر با وضعیت فعلی درخواست سازگار نیست."
};

export const disabledReasonCopy: Record<DisabledReason, string> = {
  ...baseDisabledReasonCopy,
  NO_VALID_SELECTED_TIME: "زمان انتخاب‌شده دیگر معتبر نیست. لطفاً درخواست خود را دوباره ثبت کنید."
};

export const providerContactFixtures: Record<string, SessionContactDetails> = {
  ali: { phoneNumber: "۰۹۱۲۱۲۳۴۵۶۷", email: "ali.product@example.com" },
  sara: { phoneNumber: "۰۹۱۲۲۲۳۳۴۴۵", email: "sara.design@example.com" },
  reza: { phoneNumber: "۰۹۱۲۴۴۴۵۵۶۶", email: "reza.engineering@example.com" },
  nazanin: { phoneNumber: "۰۹۱۲۶۶۶۷۷۸۸", email: "nazanin.data@example.com" },
  mina: { phoneNumber: "۰۹۱۲۸۸۸۹۹۰۰", email: "mina.growth@example.com" },
  niloofar: { phoneNumber: "۰۹۱۲۳۳۳۴۴۵۵", email: "niloofar.hr@example.com" },
  hamid: { phoneNumber: "۰۹۱۲۵۵۵۶۶۷۷", email: "hamid.bi@example.com" }
};

export const requesterContactFixtures: Record<string, SessionContactDetails> = {
  "user-requester": { phoneNumber: "۰۹۱۲۰۰۰۱۱۲۲", email: "requester@example.com" },
  "user-mahsa": { phoneNumber: "۰۹۱۲۷۷۷۸۸۹۹", email: "mahsa@example.com" },
  "user-arash": { phoneNumber: "۰۹۱۲۹۹۹۰۰۱۱", email: "arash@example.com" }
};

export function sessionContactDetailsAreUnlocked(conversation: Pick<ConversationFixture, "status">) {
  return conversation.status === "confirmed" || conversation.status === "completed";
}

export function getSessionCoordinationContact(conversation: Pick<ConversationFixture, "direction" | "profile" | "requesterId" | "status">) {
  if (!sessionContactDetailsAreUnlocked(conversation)) {
    return null;
  }

  return conversation.direction === "incoming"
    ? (requesterContactFixtures[conversation.requesterId] ?? {})
    : (providerContactFixtures[conversation.profile.id] ?? {});
}

export const conversationReliabilityCopy = {
  newRequestBadge: "درخواست جدید",
  providerDeadlineSample: "۱۸ ساعت تا پایان مهلت پاسخ",
  proposeTimesCta: "ارسال سه زمان پیشنهادی",
  rejectRequestCta: "رد درخواست",
  nearExpirationWarning: "این درخواست تا چند ساعت دیگر منقضی می‌شود.",
  waitingProviderTitle: "در انتظار پیشنهاد زمان",
  waitingProviderBody: "درخواست پرداخت‌شده برای تجربه‌آفرین ارسال شده و منتظر پیشنهاد زمان است.",
  timesReadyTitle: "زمان‌های پیشنهادی آماده انتخاب‌اند",
  timesReadyBody: "یکی از زمان‌ها را تا ۴۸ ساعت آینده انتخاب کنید.",
  pendingPaymentTitle: "پرداخت امن درخواست جلسه",
  pendingPaymentBody: "بعد از پرداخت، درخواست برای تجربه‌آفرین ارسال می‌شود.",
  expiredBody: "این درخواست در زمان مقرر پاسخ نگرفت. می‌توانید تجربه‌های مشابه را بررسی کنید.",
  similarTitle: "تجربه‌های مشابه برای ادامه مسیر",
  minimumTimesError: "لطفاً هر سه زمان پیشنهادی را کامل کنید.",
  duplicateTimesError: "این زمان قبلاً انتخاب شده است. لطفاً زمان دیگری انتخاب کنید.",
  minimumLeadTimeError: "لطفاً زمانی را انتخاب کنید که حداقل ۶ ساعت بعد از اکنون باشد.",
  maximumProposalWindowError: "زمان پیشنهادی باید حداکثر تا ۷ روز آینده باشد.",
  providerTimeRangeError: "لطفاً ساعت شروع را بین ۷ صبح تا ۱۱ شب انتخاب کنید.",
  futureTimeError: "لطفاً زمانی در آینده انتخاب کنید.",
  invalidDayError: "برای این روز ساعت معتبری وجود ندارد. لطفاً روز دیگری انتخاب کنید.",
  paymentUnavailable: "پرداخت فقط در مرحله ارسال درخواست فعال است.",
  timeSelectionExpired: "مهلت انتخاب زمان تمام شده است."
} as const;

export const expiredTimeSelectionMessage = "مهلت انتخاب زمان تمام شده است. لطفاً درخواست خود را دوباره ثبت کنید.";
export const repeatRequestCtaLabel = "درخواست دوباره از همین مشاور";
export const requestNewTimesCtaLabel = "درخواست زمان‌های جدید";

export const providerTimeReplacementCopy = {
  sectionTitle: "تغییر در این درخواست",
  sectionText: "اگر زمان‌های پیشنهادی دیگر برایتان مناسب نیست، می‌توانید سه زمان پیشنهادی جدید ثبت کنید یا درخواست را لغو کنید.",
  cta: "ثبت زمان‌های جدید",
  cancelCta: "لغو درخواست",
  modalTitle: "ثبت زمان‌های جدید",
  modalText: "با ثبت زمان‌های جدید، زمان‌های پیشنهادی قبلی غیرفعال می‌شوند و درخواست‌دهنده فقط می‌تواند از میان زمان‌های جدید انتخاب کند.",
  modalHelper: "نیازی به پرداخت دوباره نیست.",
  modalConfirm: "ادامه ثبت زمان‌های جدید",
  modalBack: "بازگشت",
  formTitle: "ثبت زمان‌های جدید",
  formHelper: "سه زمان پیشنهادی جدید را ثبت کنید تا درخواست‌دهنده بتواند یکی از آن‌ها را انتخاب کند.",
  formCta: "ثبت سه زمان پیشنهادی جدید",
  successTitle: "زمان‌های پیشنهادی جدید ثبت شد",
  successDescription: "درخواست‌دهنده می‌تواند یکی از زمان‌های پیشنهادی جدید را انتخاب کند.",
  successCta: "مشاهده جزئیات",
  requesterTitle: "زمان‌های پیشنهادی جدید آماده انتخاب‌اند",
  requesterDescription: "سه زمان پیشنهادی جدید ثبت شده است. یکی از زمان‌ها را برای قطعی‌شدن جلسه انتخاب کنید.",
  requesterRowDescription: "سه زمان پیشنهادی جدید ثبت شده است. یکی از زمان‌ها را انتخاب کنید.",
  requesterCta: "انتخاب زمان",
  providerStatusTitle: "زمان‌های پیشنهادی جدید ثبت شد",
  providerStatusDescription: "درخواست‌دهنده می‌تواند یکی از زمان‌های پیشنهادی جدید را انتخاب کند.",
  limitReachedHelper: "برای تغییر بیشتر، می‌توانید وضعیت درخواست را از جزئیات پیگیری کنید.",
  notificationRequesterTitle: "زمان‌های پیشنهادی جدید ثبت شد",
  notificationRequesterText: "سه زمان پیشنهادی جدید آماده انتخاب است.",
  notificationProviderTitle: "زمان‌های پیشنهادی جدید ثبت شد",
  notificationProviderText: "درخواست‌دهنده می‌تواند یکی از زمان‌های پیشنهادی جدید را انتخاب کند."
} as const;

export const newTimeRequestCopy = {
  detailTitle: "تغییر در این درخواست",
  detailDescription:
    "اگر ادامه این گفت‌وگو برایتان مناسب نیست، می‌توانید لغو درخواست را بررسی کنید. پیش از تأیید نهایی، مقدار بازگشت اعتبار نمایش داده می‌شود.",
  cta: "درخواست زمان‌های جدید",
  modalTitle: "درخواست زمان‌های جدید",
  modalText: "با ثبت این درخواست، تجربه‌آفرین سه زمان پیشنهادی جدید اعلام می‌کند و زمان‌های قبلی دیگر قابل انتخاب نخواهند بود.",
  modalHelper: "نیازی به پرداخت دوباره نیست.",
  modalConfirm: "ثبت درخواست زمان‌های جدید",
  modalBack: "بازگشت",
  optionalNoteLabel: "توضیح کوتاه، اختیاری",
  optionalNotePlaceholder: "مثلاً زمان‌های پیشنهادی با برنامه من هماهنگ نیست.",
  cancellationTitle: "لغو درخواست",
  cancellationText:
    "در مرحله بعد دلیل لغو را انتخاب می‌کنید و مقدار بازگشت اعتبار به شما نمایش داده می‌شود. تا زمانی که لغو را تأیید نکنید، تغییری در درخواست ایجاد نمی‌شود.",
  requesterWaitingTitle: "در انتظار زمان‌های جدید",
  requesterWaitingDescription: "درخواست زمان‌های جدید ثبت شده و منتظر پاسخ تجربه‌آفرین است.",
  requesterDetailDescription: "درخواست زمان‌های جدید ثبت شد. پس از اعلام سه زمان پیشنهادی جدید، می‌توانید یکی از آن‌ها را انتخاب کنید.",
  providerTitle: "درخواست زمان‌های جدید دریافت شد",
  providerDescription: "درخواست‌دهنده زمان‌های قبلی را انتخاب نکرده و منتظر سه زمان پیشنهادی جدید است.",
  providerActionTitle: "پیشنهاد زمان‌های جدید",
  providerActionDescription: "درخواست‌دهنده زمان‌های قبلی را انتخاب نکرده و زمان‌های جدید خواسته است.",
  providerCta: "ثبت سه زمان پیشنهادی",
  newOptionsTitle: "زمان‌های پیشنهادی جدید آماده انتخاب‌اند",
  newOptionsDescription: "سه زمان پیشنهادی جدید ثبت شده است. یکی از زمان‌ها را برای قطعی‌شدن جلسه انتخاب کنید.",
  notificationProviderTitle: "درخواست زمان‌های جدید",
  notificationProviderText: "درخواست‌دهنده زمان‌های قبلی را انتخاب نکرده و زمان‌های جدید خواسته است.",
  notificationRequesterSubmittedTitle: "درخواست زمان‌های جدید ثبت شد",
  notificationRequesterSubmittedText: "پس از اعلام سه زمان پیشنهادی جدید، می‌توانید یکی از آن‌ها را انتخاب کنید.",
  notificationRequesterReadyTitle: "زمان‌های پیشنهادی جدید ثبت شد",
  notificationRequesterReadyText: "سه زمان پیشنهادی جدید آماده انتخاب است.",
  limitReachedHelper: "برای تغییر بیشتر، می‌توانید درخواست را لغو کنید و دوباره ثبت کنید."
} as const;

export const conversationNotificationCopy = {
  cancellationTitle: "درخواست لغو شد",
  cancellationProviderCompensationTitle: "جبران کنسلی برای شما ثبت شد",
  newRequest: "یک درخواست جلسه مشاوره جدید دریافت کردید.",
  proposedTimes: "زمان‌های پیشنهادی برای جلسه مشاوره شما آماده است.",
  nearExpiration: "این درخواست تا چند ساعت دیگر منقضی می‌شود.",
  confirmed: "جلسه مشاوره شما قطعی شد.",
  confirmedRequester: "جلسه شما قطعی شد. کد تأیید برگزاری جلسه در جزئیات جلسه در دسترس است.",
  confirmedProvider: "جلسه قطعی شد. لطفاً در شروع گفت‌وگو، کد تأیید برگزاری را از درخواست‌دهنده دریافت و ثبت کنید.",
  reminder: "جلسه مشاوره شما تا یک ساعت دیگر شروع می‌شود.",
  reminderRequester: "جلسه شما نزدیک است. لطفاً کد تأیید برگزاری جلسه را در شروع گفت‌وگو با تجربه‌آفرین به اشتراک بگذارید.",
  reminderProvider: "جلسه شما نزدیک است. لطفاً در شروع گفت‌وگو، کد تأیید برگزاری را از درخواست‌دهنده دریافت و ثبت کنید.",
  verificationRequesterReminder: "اگر گفت‌وگو برگزار شده است، لطفاً کد تأیید برگزاری را با تجربه‌آفرین به اشتراک بگذارید.",
  verificationProviderReminder: "اگر گفت‌وگو برگزار شده است، لطفاً کد تأیید برگزاری را در جزئیات جلسه ثبت کنید.",
  expired: "درخواست جلسه مشاوره شما منقضی شد.",
  cancellationCredited: "درخواست لغو شد و مبلغ برگشتی به کیف پول شما اضافه شد.",
  cancellationNoRefund: "درخواست کمتر از ۳ ساعت مانده به زمان جلسه لغو شد و مبلغی به کیف پول شما بازنگشت.",
  cancellationReview: "درخواست لغو ثبت شده و توسط پشتیبانی یوزراوا بررسی می‌شود.",
  cancellationProvider: "این درخواست توسط درخواست‌کننده لغو شد.",
  cancellationProviderCompensation: "درخواست‌کننده جلسه را لغو کرد و مبلغ قابل تسویه برای شما محاسبه شد.",
  cancellationWallet: "اعتبار برگشتی از لغو درخواست به کیف پول شما اضافه شد.",
  newTimeProvider: newTimeRequestCopy.notificationProviderText,
  newTimeRequesterSubmitted: newTimeRequestCopy.notificationRequesterSubmittedText,
  newTimeOptionsReady: newTimeRequestCopy.notificationRequesterReadyText,
  providerTimeReplacementRequester: providerTimeReplacementCopy.notificationRequesterText,
  providerTimeReplacementProvider: providerTimeReplacementCopy.notificationProviderText
} as const;

export const cancellationPolicyCopy = {
  // Product/Legal/Finance must review final refund and cancellation terms before production launch.
  legalFinanceNote:
    "TODO(Product/Legal/Finance): Final refund and cancellation terms must be reviewed before production launch.",
  disclosureTitle: "قوانین لغو و بازگشت اعتبار",
  disclosureBody:
    "پیش از پیشنهاد زمان‌ها، در صورت لغو درخواست، مبلغ پرداختی به کیف پول شما بازمی‌گردد.\n\nبعد از پیشنهاد سه زمان و پیش از قطعی‌شدن جلسه، در صورت لغو، ۹۰٪ مبلغ پرداختی به کیف پول شما بازمی‌گردد.\n\nبعد از قطعی‌شدن جلسه و تا زمانی که ۳ ساعت یا بیشتر تا زمان جلسه باقی مانده باشد، در صورت لغو، ۵۰٪ مبلغ پرداختی به کیف پول شما بازمی‌گردد.\n\nاگر کمتر از ۳ ساعت تا زمان جلسه باقی مانده باشد، مبلغی به کیف پول شما بازنمی‌گردد.",
  beforeTimeProposal: "در صورت لغو، مبلغ پرداختی به کیف پول شما بازمی‌گردد.",
  beforeConfirmed: "در صورت لغو، ۹۰٪ مبلغ پرداختی به کیف پول شما بازمی‌گردد.",
  afterConfirmed: "در صورت لغو، ۵۰٪ مبلغ پرداختی به کیف پول شما بازمی‌گردد.",
  nearSession: "با توجه به اینکه کمتر از ۳ ساعت تا زمان جلسه باقی مانده و تجربه‌آفرین این زمان را برای گفت‌وگو با شما نگه داشته است، در صورت لغو، مبلغی به کیف پول شما بازنمی‌گردد.",
  nearSessionModalTitle: "لغو این درخواست را ادامه می‌دهید؟",
  nearSessionModalText: "کمتر از ۳ ساعت تا زمان جلسه باقی مانده است. تجربه‌آفرین این زمان را برای گفت‌وگو با شما نگه داشته است و در صورت لغو، مبلغی به کیف پول شما بازنمی‌گردد.",
  nearSessionModalSecondaryText: "اگر همچنان مایل به لغو هستید، می‌توانید درخواست را لغو کنید.",
  fullRefund: "مبلغ پرداختی به کیف پول شما بازمی‌گردد.",
  destination: "مبلغ برگشتی ابتدا به کیف پول شما اضافه می‌شود. در صورت نیاز می‌توانید از کیف پول درخواست برداشت وجه ثبت کنید.",
  noRefundDestination: "برای این لغو، مبلغی به کیف پول شما بازنمی‌گردد.",
  changeTitle: "تغییر در این درخواست",
  changeHelper:
    "اگر ادامه این گفت‌وگو برایتان مناسب نیست، می‌توانید لغو درخواست را بررسی کنید. پیش از تأیید نهایی، مقدار بازگشت اعتبار نمایش داده می‌شود.",
  cancelCta: "بررسی لغو درخواست",
  alternativesTitle: "لغو درخواست",
  alternativesText:
    "در مرحله بعد دلیل لغو را انتخاب می‌کنید و مقدار بازگشت اعتبار به شما نمایش داده می‌شود. تا زمانی که لغو را تأیید نکنید، تغییری در درخواست ایجاد نمی‌شود.",
  continueCancel: "ادامه لغو درخواست",
  reasonTitle: "دلیل لغو درخواست را انتخاب کنید",
  optionalTextLabel: "توضیح بیشتر، اختیاری",
  previewTitle: "نتیجه لغو درخواست",
  confirmCancel: "تأیید لغو درخواست",
  back: "بازگشت",
  cancelledTitle: "درخواست لغو شد",
  creditedText: "این درخواست لغو شد و مبلغ برگشتی به کیف پول شما اضافه شد.",
  lateRequesterCancelledText: "این درخواست کمتر از ۳ ساعت مانده به زمان جلسه لغو شد.",
  lateRequesterDetailText: "این درخواست کمتر از ۳ ساعت مانده به زمان جلسه لغو شد. با توجه به اینکه تجربه‌آفرین این زمان را برای گفت‌وگو با شما نگه داشته بود، مبلغی به کیف پول شما بازنگشت.",
  providerCompensationText: "این درخواست توسط درخواست‌کننده لغو شد و مبلغ جبران کنسلی برای شما محاسبه شد.",
  providerCompensationDetailText: "این درخواست توسط درخواست‌کننده لغو شد. مبلغ جبران کنسلی برای شما محاسبه و به حساب شما اضافه شد.",
  providerLateCompensationNotification:
    "این جلسه کمتر از ۳ ساعت مانده به زمان برگزاری توسط درخواست‌کننده لغو شد. با توجه به زمانی که برای این گفت‌وگو اختصاص داده بودید، مبلغ قابل تسویه برای شما محاسبه و به حساب شما اضافه شد.",
  requesterLateCancellationNotification: "درخواست کمتر از ۳ ساعت مانده به زمان جلسه لغو شد و مبلغی به کیف پول شما بازنگشت.",
  providerCompensationNotification: "درخواست‌کننده جلسه را لغو کرد و مبلغ قابل تسویه برای شما محاسبه شد.",
  providerCompensationWalletText: "مبلغ جبران کنسلی به حساب شما اضافه شد.",
  providerCancellationGrossLabel: "مبلغ جبران کنسلی",
  providerCancellationFeeLabel: "سهم یوزراوا",
  providerCancellationNetLabel: "مبلغ قابل تسویه برای شما",
  reviewText: "درخواست لغو ثبت شده و توسط پشتیبانی یوزراوا بررسی می‌شود.",
  recoveryTitle: "حالا چه کاری می‌توانید انجام دهید؟",
  recoveryDefaultText: "این درخواست بسته شده، اما می‌توانید مسیر را از کیف پول، پشتیبانی یا یک درخواست تازه ادامه دهید.",
  recoveryTimeText: "اگر موضوع گفت‌وگو هنوز برایتان مهم است، می‌توانید دوباره از همین تجربه‌آفرین درخواست بدهید یا افراد مشابه را ببینید.",
  recoveryDifferentCreatorText: "می‌توانید تجربه‌آفرین‌های مشابه را ببینید و درخواست تازه‌ای ثبت کنید.",
  recoveryPriceText: "می‌توانید گزینه‌های کوتاه‌تر یا تجربه‌آفرین‌های دیگر را بررسی کنید.",
  recoveryNeedChangedText: "اگر موضوع یا نیازتان تغییر کرده، از کشف تجربه‌آفرین‌ها مسیر مناسب‌تری پیدا کنید.",
  walletAction: "مشاهده کیف پول",
  sameProviderAction: "درخواست جدید از همین تجربه‌آفرین",
  similarAction: "دیدن تجربه‌آفرین‌های مشابه",
  discoverAction: "کشف تجربه‌آفرین‌ها",
  shortOptionsAction: "دیدن گزینه‌های ۳۰ دقیقه‌ای",
  previousRequestsAction: "مشاهده درخواست‌های قبلی",
  supportAction: "ارتباط با پشتیبانی",
  freeRequestAction: "ارسال درخواست جلسه رایگان",
  walletCreditTitle: "بازگشت اعتبار از لغو درخواست",
  providerCompensationWalletTitle: "جبران کنسلی درخواست",
  withdrawalAction: "درخواست برداشت وجه"
} as const;

export const cancellationReasonOptions: ReadonlyArray<{ code: CancellationReasonCode; label: string }> = [
  { code: "TIME_OPTIONS_NOT_SUITABLE", label: "زمان‌های پیشنهادی برایم مناسب نیست" },
  { code: "NOT_SURE_NEEDED", label: "هنوز مطمئن نیستم این گفت‌وگو برایم لازم است" },
  { code: "NEED_CHANGED", label: "موضوع یا نیازم تغییر کرده است" },
  { code: "WANT_DIFFERENT_EXPERIENCE_CREATOR", label: "می‌خواهم با تجربه‌آفرین دیگری گفت‌وگو کنم" },
  { code: "CREATED_BY_MISTAKE", label: "اشتباه ثبت کرده‌ام" },
  { code: "PRICE_NOT_SUITABLE", label: "هزینه برایم مناسب نیست" },
  { code: "PAYMENT_OR_COORDINATION_DIFFICULT", label: "فرایند پرداخت یا هماهنگی برایم سخت بود" },
  { code: "RESPONSE_TOO_SLOW", label: "پاسخ یا هماهنگی بیشتر از انتظارم طول کشید" },
  { code: "OTHER", label: "دلیل دیگر" },
  { code: "PREFER_NOT_TO_SAY", label: "ترجیح می‌دهم نگویم" }
] as const;

export const providerSideClosureCopy = {
  rejectSectionTitle: "امکان پاسخ به این درخواست را ندارید؟",
  rejectSectionText: "اگر این گفت‌وگو با تجربه، زمان یا شرایط فعلی شما هم‌خوان نیست، می‌توانید درخواست را رد کنید.",
  rejectCta: "رد درخواست",
  rejectModalTitle: "رد این درخواست را تأیید می‌کنید؟",
  rejectModalText: "با رد این درخواست، درخواست‌دهنده دیگر منتظر پیشنهاد زمان از سمت شما نخواهد بود و مبلغ پرداختی او به کیف پولش بازمی‌گردد.",
  rejectionReasonLabel: "دلیل رد درخواست را انتخاب کنید",
  confirmReject: "تأیید رد درخواست",
  changeSectionTitle: "تغییر در این درخواست",
  changeSectionText: "اگر زمان‌های پیشنهادی دیگر برایتان مناسب نیست، می‌توانید زمان‌های جدید ثبت کنید یا درخواست را لغو کنید.",
  changeSectionTextWithoutReplacement: "اگر زمان‌های پیشنهادی دیگر برایتان مناسب نیست و امکان ادامه این درخواست را ندارید، می‌توانید درخواست را لغو کنید.",
  cancelRequestCta: "لغو درخواست",
  cancelRequestModalTitle: "لغو این درخواست را ادامه می‌دهید؟",
  cancelRequestModalText: "با لغو این درخواست، زمان‌های پیشنهادی قبلی غیرفعال می‌شوند و مبلغ پرداختی درخواست‌دهنده به کیف پولش بازمی‌گردد.",
  cancelRequestReasonLabel: "دلیل لغو درخواست را انتخاب کنید",
  continueCancelRequest: "ادامه لغو درخواست",
  confirmedCancelSectionTitle: "امکان برگزاری این جلسه را ندارید؟",
  confirmedCancelSectionText:
    "اگر واقعاً امکان برگزاری این جلسه را ندارید، می‌توانید جلسه را لغو کنید. در این حالت مبلغ پرداختی درخواست‌دهنده به کیف پول او بازمی‌گردد.",
  cancelSessionCta: "لغو جلسه",
  cancelSessionModalTitle: "لغو این جلسه را تأیید می‌کنید؟",
  cancelSessionModalText:
    "این جلسه قطعی شده است. با لغو آن، درخواست‌دهنده دیگر امکان برگزاری این گفت‌وگو را در زمان انتخاب‌شده نخواهد داشت و مبلغ پرداختی او به کیف پولش بازمی‌گردد.",
  cancelSessionReasonLabel: "دلیل لغو جلسه را انتخاب کنید",
  confirmCancelSession: "تأیید لغو جلسه",
  optionalTextLabel: "توضیح بیشتر، اختیاری",
  back: "بازگشت",
  providerRejectedTitle: "درخواست رد شد",
  providerRejectedText: "این درخواست از سمت شما رد شده است.",
  providerCancelledRequestTitle: "درخواست لغو شد",
  providerCancelledRequestText: "این درخواست از سمت شما لغو شده است.",
  providerCancelledSessionTitle: "جلسه لغو شد",
  providerCancelledSessionText: "این جلسه از سمت شما لغو شده است.",
  requesterRejectedTitle: "درخواست پذیرفته نشد",
  requesterRejectedText: "متأسفیم، این درخواست از سمت تجربه‌آفرین پذیرفته نشد. مبلغ پرداختی به‌صورت کامل به کیف پول شما بازگشت.",
  requesterCancelledRequestTitle: "درخواست لغو شد",
  requesterCancelledRequestText: "متأسفیم، این درخواست از سمت تجربه‌آفرین ادامه پیدا نکرد. مبلغ پرداختی به‌صورت کامل به کیف پول شما بازگشت.",
  requesterCancelledSessionTitle: "جلسه لغو شد",
  requesterCancelledSessionText:
    "متأسفیم، این جلسه از سمت تجربه‌آفرین لغو شد. می‌دانیم برای انتخاب و پیگیری این گفت‌وگو زمان گذاشته‌اید. مبلغ پرداختی به‌صورت کامل به کیف پول شما بازگشت.",
  requesterRejectedRowText: "این درخواست از سمت تجربه‌آفرین پذیرفته نشد و مبلغ پرداختی به کیف پول شما بازگشت.",
  requesterCancelledRequestRowText: "این درخواست از سمت تجربه‌آفرین لغو شد و مبلغ پرداختی به کیف پول شما بازگشت.",
  requesterCancelledSessionRowText: "این جلسه از سمت تجربه‌آفرین لغو شد و مبلغ پرداختی به کیف پول شما بازگشت.",
  providerClosedTitle: "درخواست از سمت شما بسته شد",
  providerClosedText: "این مورد در وضعیت بسته‌شده قرار گرفت.",
  providerSessionClosedTitle: "جلسه از سمت شما لغو شد",
  supportReviewTitle: "لغو در حال بررسی است",
  supportReviewText: "لغو جلسه ثبت شده و توسط پشتیبانی یوزراوا بررسی می‌شود.",
  recoveryTitle: "حالا چه کاری می‌توانید انجام دهید؟",
  recoveryText: "می‌توانید تجربه‌آفرین‌های مشابه را ببینید، درخواست تازه‌ای در همین حوزه ثبت کنید یا بازگشت اعتبار را در کیف پول پیگیری کنید.",
  similarAction: "دیدن تجربه‌آفرین‌های مشابه",
  sameFieldAction: "درخواست جدید از همین حوزه",
  walletAction: "مشاهده کیف پول",
  rejectedWalletCreditTitle: "اعتبار برگشتی از رد درخواست",
  providerCancellationWalletCreditTitle: "اعتبار برگشتی از لغو توسط تجربه‌آفرین",
  requesterRejectedNotificationTitle: "درخواست پذیرفته نشد",
  requesterRejectedNotificationText: "متأسفیم، این درخواست از سمت تجربه‌آفرین پذیرفته نشد. مبلغ پرداختی به کیف پول شما بازگشت.",
  requesterCancelledRequestNotificationTitle: "درخواست لغو شد",
  requesterCancelledRequestNotificationText: "متأسفیم، این درخواست از سمت تجربه‌آفرین لغو شد. مبلغ پرداختی به کیف پول شما بازگشت.",
  requesterCancelledSessionNotificationTitle: "جلسه لغو شد",
  requesterCancelledSessionNotificationText: "متأسفیم، این جلسه از سمت تجربه‌آفرین لغو شد. مبلغ پرداختی به کیف پول شما بازگشت.",
  providerNotificationText: "این مورد در وضعیت بسته‌شده قرار گرفت."
} as const;

export const providerRejectionReasonOptions: ReadonlyArray<{ code: ProviderRejectionReasonCode; label: string }> = [
  { code: "TOPIC_NOT_ALIGNED", label: "موضوع گفت‌وگو با تجربه من هم‌خوان نیست" },
  { code: "NO_AVAILABILITY", label: "در این بازه امکان برگزاری گفت‌وگو ندارم" },
  { code: "NOT_ENOUGH_TIME_TO_RESPOND", label: "زمان کافی برای پاسخ‌گویی ندارم" },
  { code: "REQUEST_NOT_CLEAR", label: "درخواست برای من شفاف نیست" },
  { code: "ACCEPTED_BY_MISTAKE", label: "اشتباهی درخواست را پذیرفته‌ام" },
  { code: "OTHER", label: "دلیل دیگر" },
  { code: "PREFER_NOT_TO_SAY", label: "ترجیح می‌دهم نگویم" }
] as const;

export const providerRequestCancellationReasonOptions: ReadonlyArray<{ code: ProviderCancellationReasonCode; label: string }> = [
  { code: "TIME_OPTIONS_NO_LONGER_WORK", label: "زمان‌های پیشنهادی دیگر برایم ممکن نیست" },
  { code: "NO_AVAILABILITY", label: "در این بازه امکان برگزاری گفت‌وگو ندارم" },
  { code: "TOPIC_NOT_ALIGNED", label: "موضوع گفت‌وگو با تجربه من هم‌خوان نیست" },
  { code: "WORK_OR_PERSONAL_CONDITION_CHANGED", label: "شرایط کاری یا شخصی من تغییر کرده است" },
  { code: "REQUEST_NOT_CLEAR", label: "درخواست برای من شفاف نیست" },
  { code: "OTHER", label: "دلیل دیگر" },
  { code: "PREFER_NOT_TO_SAY", label: "ترجیح می‌دهم نگویم" }
] as const;

export const providerSessionCancellationReasonOptions: ReadonlyArray<{ code: ProviderCancellationReasonCode; label: string }> = [
  { code: "CANNOT_ATTEND_CONFIRMED_SESSION", label: "در زمان جلسه امکان حضور ندارم" },
  { code: "WORK_OR_PERSONAL_CONDITION_CHANGED", label: "شرایط کاری یا شخصی من تغییر کرده است" },
  { code: "TOPIC_NOT_ALIGNED", label: "موضوع گفت‌وگو با تجربه من هم‌خوان نیست" },
  { code: "ACCEPTED_BY_MISTAKE", label: "جلسه را اشتباه تأیید کرده‌ام" },
  { code: "OTHER", label: "دلیل دیگر" },
  { code: "PREFER_NOT_TO_SAY", label: "ترجیح می‌دهم نگویم" }
] as const;

export const attendanceVerificationCopy = {
  title: "کد تأیید برگزاری جلسه",
  providerTitle: "ثبت برگزاری جلسه",
  verifiedTitle: "برگزاری جلسه ثبت شد",
  requesterDetail:
    "این کد برای ثبت برگزاری جلسه در یوزراوا استفاده می‌شود. لطفاً در شروع گفت‌وگو، آن را فقط با تجربه‌آفرین همین جلسه به اشتراک بگذارید.",
  requesterHelper: "پس از ثبت این کد توسط تجربه‌آفرین، برگزاری جلسه در یوزراوا ثبت می‌شود.",
  providerDetail:
    "لطفاً کدی را که درخواست‌دهنده در صفحه جلسه می‌بیند وارد کنید تا برگزاری جلسه در یوزراوا ثبت شود.",
  verifiedProvider:
    "برگزاری این جلسه در یوزراوا ثبت شد. پس از پایان زمان جلسه، روند تسویه طبق فرایند یوزراوا پردازش می‌شود.",
  payoutPending: "پس از ثبت برگزاری و پایان زمان جلسه، تسویه این جلسه حداکثر تا ۲۴ ساعت پردازش می‌شود.",
  missingSettlement: "برای پردازش تسویه، اطلاعات حساب خود را در کیف پول تکمیل کنید.",
  missingSettlementCta: "تکمیل اطلاعات حساب",
  requesterCard: "لطفاً در شروع گفت‌وگو، کد تأیید برگزاری را با تجربه‌آفرین به اشتراک بگذارید.",
  requesterCardAfterStart: "اگر گفت‌وگو برگزار شده است، لطفاً کد تأیید برگزاری را با تجربه‌آفرین به اشتراک بگذارید.",
  providerCard: "لطفاً در شروع گفت‌وگو، کد تأیید برگزاری را از درخواست‌دهنده دریافت و ثبت کنید.",
  providerCardAfterStart: "اگر گفت‌وگو شروع شده یا برگزار شده است، لطفاً کد تأیید برگزاری را وارد کنید.",
  providerNeedsActionStatus: "نیازمند ثبت برگزاری",
  verifiedBadge: "برگزاری ثبت شد",
  copy: "کپی",
  copied: "کپی شد",
  copyFailed: "کپی انجام نشد. لطفاً کد را به‌صورت دستی کپی کنید.",
  wrongCode: "کد واردشده درست نیست. لطفاً کدی را که درخواست‌دهنده در صفحه جلسه می‌بیند بررسی کنید.",
  needsReview: "لطفاً برای بررسی این جلسه، از پشتیبانی یوزراوا پیگیری کنید.",
  expired: "زمان ثبت این کد گذشته است. لطفاً برای بررسی جلسه، از پشتیبانی یوزراوا پیگیری کنید.",
  inactive: "ثبت برگزاری برای این جلسه فعال نیست.",
  alreadyVerified: "برگزاری این جلسه قبلاً ثبت شده است."
} as const;

export const emailTemplates: Record<EmailTemplateKey, EmailTemplate> = {
  new_request: {
    key: "new_request",
    subject: "درخواست جلسه مشاوره جدید در Useravaa",
    body: "سلام،\n\nیک درخواست جلسه مشاوره جدید دریافت کرده‌اید.\nلطفاً تا ۲۴ ساعت آینده درخواست را بررسی کنید و در صورت امکان حداقل ۳ زمان پیشنهادی ارسال کنید.\n\nمشاهده درخواست در Useravaa",
    targetLabel: "مشاهده درخواست در Useravaa"
  },
  proposed_times: {
    key: "proposed_times",
    subject: "زمان‌های پیشنهادی جلسه مشاوره شما آماده است",
    body: "سلام،\n\nزمان‌های پیشنهادی برای جلسه مشاوره شما آماده شده است.\nلطفاً یکی از زمان‌ها را انتخاب کنید تا جلسه قطعی شود.\n\nمشاهده زمان‌های پیشنهادی",
    targetLabel: "مشاهده زمان‌های پیشنهادی"
  },
  confirmed: {
    key: "confirmed",
    subject: "جلسه مشاوره شما در Useravaa قطعی شد",
    body: "سلام،\n\nجلسه مشاوره شما با موفقیت قطعی شد.\nجزئیات زمان جلسه در حساب کاربری شما قابل مشاهده است.\n\nمشاهده جلسه",
    targetLabel: "مشاهده جلسه"
  },
  one_hour_reminder: {
    key: "one_hour_reminder",
    subject: "یادآوری جلسه مشاوره امروز",
    body: "سلام،\n\nجلسه مشاوره شما تا یک ساعت دیگر شروع می‌شود.\nلطفاً جزئیات جلسه را در Useravaa بررسی کنید.\n\nمشاهده جلسه",
    targetLabel: "مشاهده جلسه"
  }
};

export const proposalDateOptions = [
  { id: "d1", day: "شنبه", date: "۲ خرداد ۱۴۰۵", full: "شنبه ۲ خرداد ۱۴۰۵", isoDate: "2026-05-23" },
  { id: "d2", day: "یکشنبه", date: "۳ خرداد ۱۴۰۵", full: "یکشنبه ۳ خرداد ۱۴۰۵", isoDate: "2026-05-24" },
  { id: "d3", day: "دوشنبه", date: "۴ خرداد ۱۴۰۵", full: "دوشنبه ۴ خرداد ۱۴۰۵", isoDate: "2026-05-25" },
  { id: "d4", day: "سه‌شنبه", date: "۵ خرداد ۱۴۰۵", full: "سه‌شنبه ۵ خرداد ۱۴۰۵", isoDate: "2026-05-26" },
  { id: "d5", day: "چهارشنبه", date: "۶ خرداد ۱۴۰۵", full: "چهارشنبه ۶ خرداد ۱۴۰۵", isoDate: "2026-05-27" },
  { id: "d6", day: "پنجشنبه", date: "۷ خرداد ۱۴۰۵", full: "پنجشنبه ۷ خرداد ۱۴۰۵", isoDate: "2026-05-28" },
  { id: "d7", day: "جمعه", date: "۸ خرداد ۱۴۰۵", full: "جمعه ۸ خرداد ۱۴۰۵", isoDate: "2026-05-29" }
] as const;

export const proposalTimeSlots = [
  "۰۷:۰۰",
  "۰۷:۳۰",
  "۰۸:۰۰",
  "۰۸:۳۰",
  "۰۹:۰۰",
  "۰۹:۳۰",
  "۱۰:۰۰",
  "۱۰:۳۰",
  "۱۱:۰۰",
  "۱۱:۳۰",
  "۱۴:۰۰",
  "۱۴:۳۰",
  "۱۵:۰۰",
  "۱۵:۳۰",
  "۱۶:۰۰",
  "۱۶:۳۰",
  "۱۷:۰۰",
  "۱۷:۳۰",
  "۱۸:۰۰",
  "۱۸:۳۰",
  "۱۹:۰۰",
  "۱۹:۳۰",
  "۲۰:۰۰",
  "۲۰:۳۰",
  "۲۱:۰۰",
  "۲۱:۳۰",
  "۲۲:۰۰",
  "۲۲:۳۰",
  "۲۳:۰۰"
] as const;

const latinTimeByFa = new Map<string, string>([
  ["۰۷:۰۰", "07:00"],
  ["۰۷:۳۰", "07:30"],
  ["۰۸:۰۰", "08:00"],
  ["۰۸:۳۰", "08:30"],
  ["۰۹:۰۰", "09:00"],
  ["۰۹:۳۰", "09:30"],
  ["۱۰:۰۰", "10:00"],
  ["۱۰:۳۰", "10:30"],
  ["۱۱:۰۰", "11:00"],
  ["۱۱:۳۰", "11:30"],
  ["۱۴:۰۰", "14:00"],
  ["۱۴:۳۰", "14:30"],
  ["۱۵:۰۰", "15:00"],
  ["۱۵:۳۰", "15:30"],
  ["۱۶:۰۰", "16:00"],
  ["۱۶:۳۰", "16:30"],
  ["۱۷:۰۰", "17:00"],
  ["۱۷:۳۰", "17:30"],
  ["۱۸:۰۰", "18:00"],
  ["۱۸:۳۰", "18:30"],
  ["۱۹:۰۰", "19:00"],
  ["۱۹:۳۰", "19:30"],
  ["۲۰:۰۰", "20:00"],
  ["۲۰:۳۰", "20:30"],
  ["۲۱:۰۰", "21:00"],
  ["۲۱:۳۰", "21:30"],
  ["۲۲:۰۰", "22:00"],
  ["۲۲:۳۰", "22:30"],
  ["۲۳:۰۰", "23:00"]
]);

function addHours(value: string | Date, hours: number) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Date(date.getTime() + hours * MS_PER_HOUR).toISOString();
}

function subtractHours(value: string | Date, hours: number) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Date(date.getTime() - hours * MS_PER_HOUR).toISOString();
}

function addMinutes(value: string | Date, minutes: number) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Date(date.getTime() + minutes * 60 * 1000).toISOString();
}

function hoursUntil(deadline: string, now = reliabilityMockNow) {
  return Math.max(0, Math.ceil((new Date(deadline).getTime() - new Date(now).getTime()) / MS_PER_HOUR));
}

function setConversationStatus(conversation: ConversationFixture, status: ConversationRequestStatus): ConversationFixture {
  return {
    ...conversation,
    status,
    state: status
  };
}

function buildConversation(input: Omit<ConversationFixture, "profileId" | "durationMinutes" | "requestNote" | "status" | "state" | "providerResponseDeadlineAt" | "proposedTimes"> & {
  status: ConversationRequestStatus;
  proposedTimes?: ProposedTime[];
  providerResponseDeadlineAt?: string;
}): ConversationFixture {
  return {
    ...input,
    profileId: input.profile.id,
    durationMinutes: input.duration,
    requestNote: input.note,
    state: input.status,
    providerResponseDeadlineAt: input.providerResponseDeadlineAt ?? addHours(input.createdAt, 24),
    proposedTimes: input.proposedTimes ?? []
  };
}

function withConversationId(times: readonly ProposedTime[], conversationRequestId: string, selectedTimeId?: string | null) {
  return times.map((time) => ({
    ...time,
    conversationRequestId,
    isSelected: time.id === selectedTimeId
  }));
}

export function makeProposedTime(dateId: string, timeLabel: string, conversationRequestId = ""): ProposedTime {
  const dateOption = proposalDateOptions.find((item) => item.id === dateId) ?? proposalDateOptions[0];
  const latinTime = latinTimeByFa.get(timeLabel) ?? timeLabel;
  const displayTime = toPersianDigits(timeLabel);

  return {
    id: `${dateOption.id}-${latinTime}`,
    conversationRequestId,
    date: dateOption.isoDate,
    time: latinTime,
    displayDateFa: dateOption.full,
    displayTimeFa: displayTime,
    isSelected: false,
    dateId: dateOption.id,
    dateLabel: dateOption.full,
    dayLabel: dateOption.day,
    timeLabel: displayTime,
    startAt: `${dateOption.isoDate}T${latinTime}:00+03:30`
  };
}

export function generateAttendanceVerificationCode(seed?: string) {
  if (seed) {
    let seeded = 0;

    for (const char of seed) {
      seeded = (seeded * 31 + char.charCodeAt(0)) % 100000;
    }

    return seeded.toString().padStart(5, "0");
  }

  const cryptoSource = globalThis.crypto;

  if (cryptoSource?.getRandomValues) {
    const value = new Uint32Array(1);
    cryptoSource.getRandomValues(value);
    return (value[0] % 100000).toString().padStart(5, "0");
  }

  const fallback = `${Date.now()}-${Math.random()}`;
  return generateAttendanceVerificationCode(fallback);
}

export function hashAttendanceVerificationCode(code: string, conversationId: string) {
  const source = `${conversationId}:${code}`;
  let hash = 2166136261;

  for (const char of source) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
}

export function normalizeManualPaymentReferenceNumber(value: string) {
  const digitMap: Record<string, string> = {
    "۰": "0",
    "۱": "1",
    "۲": "2",
    "۳": "3",
    "۴": "4",
    "۵": "5",
    "۶": "6",
    "۷": "7",
    "۸": "8",
    "۹": "9",
    "٠": "0",
    "١": "1",
    "٢": "2",
    "٣": "3",
    "٤": "4",
    "٥": "5",
    "٦": "6",
    "٧": "7",
    "٨": "8",
    "٩": "9"
  };

  return value.trim().replace(/[۰-۹٠-٩0-9]/g, (digit) => digitMap[digit] ?? digit);
}

export function validateManualPaymentInput(input: SubmitManualPaymentInput) {
  const normalizedReference = normalizeManualPaymentReferenceNumber(input.referenceNumber ?? "");
  const hasReference = normalizedReference.length > 0;
  const hasReceipt = Boolean(input.receipt);

  if (!hasReference && !hasReceipt) {
    return {
      valid: false,
      message: manualPaymentCopy.missingProof,
      normalizedReference
    };
  }

  if (hasReference && !/^\d+$/.test(normalizedReference)) {
    return {
      valid: false,
      message: manualPaymentCopy.invalidReference,
      normalizedReference
    };
  }

  if (input.receipt && !manualPaymentAllowedReceiptTypes.includes(input.receipt.mimeType as (typeof manualPaymentAllowedReceiptTypes)[number])) {
    return {
      valid: false,
      message: manualPaymentCopy.invalidReceiptType,
      normalizedReference
    };
  }

  if (input.receipt && input.receipt.size > MANUAL_PAYMENT_MAX_RECEIPT_SIZE_BYTES) {
    return {
      valid: false,
      message: manualPaymentCopy.receiptTooLarge,
      normalizedReference
    };
  }

  return {
    valid: true,
    message: "",
    normalizedReference
  };
}

export function profileOrThrow(profileId: string) {
  const profile = getProfileById(profileId);

  if (!profile) {
    throw new Error(`Missing V51 profile fixture: ${profileId}`);
  }

  return profile;
}

const proposedTimeA = makeProposedTime("d2", "۱۰:۳۰");
const proposedTimeB = makeProposedTime("d3", "۱۵:۰۰");
const proposedTimeC = makeProposedTime("d5", "۱۶:۰۰");
const selectedTimeA = { ...proposedTimeA, isSelected: true };
const selectedTimeB = {
  ...makeProposedTime("d5", "۱۶:۰۰"),
  isSelected: true,
  startAt: addHours(reliabilityMockNow, 1)
};

const defaultProposedTimes = [proposedTimeA, proposedTimeB, proposedTimeC];
const expiredProposedTime = { ...makeProposedTime("d2", "10:30"), startAt: subtractHours(reliabilityMockNow, 1) };
const validProposedTimeA = { ...makeProposedTime("d3", "15:00"), startAt: addHours(reliabilityMockNow, 6) };
const validProposedTimeB = { ...makeProposedTime("d5", "16:00"), startAt: addHours(reliabilityMockNow, 30) };
const pastSelectedTime = { ...expiredProposedTime, isSelected: true };

export const conversations = [
  buildConversation({
    id: "conv-time-options",
    requesterId: "user-requester",
    providerId: "provider-sara",
    direction: "outgoing",
    status: "times_proposed",
    profile: profileOrThrow("sara"),
    requesterName: "تو",
    requesterRole: "درخواست‌دهنده",
    duration: 30,
    note: "می‌خواهم درباره آماده‌کردن پورتفولیو و مسیر ورود به Product Design حرف بزنم.",
    createdAt: subtractHours(reliabilityMockNow, 10),
    paidAt: subtractHours(reliabilityMockNow, 9),
    providerRespondedAt: subtractHours(reliabilityMockNow, 2),
    timesProposedAt: subtractHours(reliabilityMockNow, 2),
    requesterSelectionDeadlineAt: addHours(reliabilityMockNow, 46),
    submittedAtLabel: "ثبت‌شده در ۲۴ خرداد ۱۴۰۵",
    proposedAtLabel: "۳ زمان پیشنهادی دریافت شده",
    proposedTimes: withConversationId(defaultProposedTimes, "conv-time-options"),
    walletBalanceToman
  }),
  buildConversation({
    id: "conv-mixed-time-options",
    requesterId: "user-requester",
    providerId: "provider-sara",
    direction: "outgoing",
    status: "times_proposed",
    profile: profileOrThrow("sara"),
    requesterName: "تو",
    requesterRole: "درخواست‌دهنده",
    duration: 30,
    note: "برای تست دستی انتخاب زمان منقضی‌شده.",
    createdAt: subtractHours(reliabilityMockNow, 10),
    paidAt: subtractHours(reliabilityMockNow, 9),
    providerRespondedAt: subtractHours(reliabilityMockNow, 2),
    timesProposedAt: subtractHours(reliabilityMockNow, 2),
    requesterSelectionDeadlineAt: addHours(reliabilityMockNow, 46),
    submittedAtLabel: "ثبت‌شده برای بررسی دستی",
    proposedAtLabel: "یک زمان گذشته و دو زمان معتبر",
    timeOptionsVersion: 2,
    timeOptionsStatus: "ACTIVE",
    newTimeRequestCount: 1,
    previousTimeOptions: withConversationId(defaultProposedTimes, "conv-mixed-time-options").map((time) => ({
      ...time,
      status: "SUPERSEDED" as const,
      version: 1
    })),
    proposedTimes: withConversationId([expiredProposedTime, validProposedTimeA, validProposedTimeB], "conv-mixed-time-options").map((time) => ({
      ...time,
      status: "ACTIVE" as const,
      version: 2
    })),
    walletBalanceToman
  }),
  buildConversation({
    id: "conv-expired-time-options",
    requesterId: "user-requester",
    providerId: "provider-sara",
    direction: "outgoing",
    status: "expired",
    profile: profileOrThrow("sara"),
    requesterName: "تو",
    requesterRole: "درخواست‌دهنده",
    duration: 30,
    note: "برای تست دستی مهلت انتخاب زمان.",
    createdAt: subtractHours(reliabilityMockNow, 60),
    providerRespondedAt: subtractHours(reliabilityMockNow, 50),
    timesProposedAt: subtractHours(reliabilityMockNow, 50),
    requesterSelectionDeadlineAt: subtractHours(reliabilityMockNow, 1),
    submittedAtLabel: "ثبت‌شده برای بررسی دستی",
    proposedAtLabel: "مهلت انتخاب گذشته است",
    proposedTimes: withConversationId(defaultProposedTimes, "conv-expired-time-options"),
    walletBalanceToman
  }),
  buildConversation({
    id: "conv-past-selected-time",
    requesterId: "user-requester",
    providerId: "provider-sara",
    direction: "outgoing",
    status: "pending_payment",
    profile: profileOrThrow("sara"),
    requesterName: "تو",
    requesterRole: "درخواست‌دهنده",
    duration: 30,
    note: "برای تست دستی پرداخت با زمان گذشته.",
    createdAt: subtractHours(reliabilityMockNow, 60),
    providerRespondedAt: subtractHours(reliabilityMockNow, 50),
    timesProposedAt: subtractHours(reliabilityMockNow, 50),
    requesterSelectionDeadlineAt: addHours(reliabilityMockNow, 20),
    selectedTimeId: pastSelectedTime.id,
    selectedAt: subtractHours(reliabilityMockNow, 2),
    submittedAtLabel: "ثبت‌شده برای بررسی دستی",
    proposedAtLabel: "زمان انتخاب شده اما گذشته است",
    selectedTime: { ...pastSelectedTime, conversationRequestId: "conv-past-selected-time" },
    proposedTimes: withConversationId([pastSelectedTime, validProposedTimeA, validProposedTimeB], "conv-past-selected-time", pastSelectedTime.id),
    walletBalanceToman
  }),
  buildConversation({
    id: "conv-awaiting-payment",
    requesterId: "user-requester",
    providerId: "provider-ali",
    direction: "outgoing",
    status: "pending_payment",
    profile: profileOrThrow("ali"),
    requesterName: "تو",
    requesterRole: "درخواست‌دهنده",
    duration: 30,
    note: "می‌خواهم درباره ورود به Product و آماده‌کردن رزومه‌ام حرف بزنم.",
    createdAt: subtractHours(reliabilityMockNow, 12),
    submittedAtLabel: "ثبت‌شده در ۲۳ خرداد ۱۴۰۵",
    requestTopic: "بررسی رزومه / آمادگی مصاحبه",
    walletBalanceToman
  }),
  buildConversation({
    id: "conv-manual-payment-review",
    requesterId: "user-requester",
    providerId: "provider-ali",
    direction: "outgoing",
    status: "payment_processing",
    profile: profileOrThrow("ali"),
    requesterName: "تو",
    requesterRole: "درخواست‌دهنده",
    duration: 30,
    note: "می‌خواهم درباره ورود به Product و آماده‌کردن رزومه‌ام حرف بزنم.",
    createdAt: subtractHours(reliabilityMockNow, 12),
    submittedAtLabel: "ثبت‌شده در ۲۳ خرداد ۱۴۰۵",
    requestTopic: "بررسی رزومه / آمادگی مصاحبه",
    paymentMethod: "CARD_TO_CARD",
    manualPaymentStatus: "SUBMITTED",
    manualPaymentReferenceNumber: "1234567890",
    manualPaymentReceiptFileName: "receipt-useravaa.png",
    manualPaymentReceiptMimeType: "image/png",
    manualPaymentReceiptSize: 245000,
    manualPaymentReceiptUrl: "/mock/receipts/receipt-useravaa.png",
    manualPaymentSubmittedAt: subtractHours(reliabilityMockNow, 2),
    walletBalanceToman
  }),
  buildConversation({
    id: "conv-provider-request",
    requesterId: "user-mahsa",
    providerId: "provider-reza",
    direction: "incoming",
    status: "pending_provider_response",
    profile: profileOrThrow("reza"),
    requesterName: "مهسا ک.",
    requesterRole: "درخواست‌دهنده جلسه مشاوره",
    duration: 60,
    note: "می‌خواهم درباره رشد مسیر مهندسی و تصمیم‌های مدیریتی حرف بزنم.",
    createdAt: subtractHours(reliabilityMockNow, 6),
    paidAt: subtractHours(reliabilityMockNow, 6),
    submittedAtLabel: "ثبت‌شده در ۲۵ خرداد ۱۴۰۵",
    walletBalanceToman
  }),
  buildConversation({
    id: "conv-provider-near-expiration",
    requesterId: "user-arash",
    providerId: "provider-reza",
    direction: "incoming",
    status: "pending_provider_response",
    profile: profileOrThrow("reza"),
    requesterName: "آرش ن.",
    requesterRole: "درخواست‌دهنده جلسه مشاوره",
    duration: 30,
    note: "برای تصمیم درباره مسیر فنی به راهنمایی نیاز دارم.",
    createdAt: subtractHours(reliabilityMockNow, 22),
    paidAt: subtractHours(reliabilityMockNow, 22),
    submittedAtLabel: "ثبت‌شده در ۲۴ خرداد ۱۴۰۵",
    walletBalanceToman
  }),
  buildConversation({
    id: "conv-provider-waiting",
    requesterId: "user-arash",
    providerId: "provider-nazanin",
    direction: "incoming",
    status: "new_time_requested",
    profile: profileOrThrow("nazanin"),
    requesterName: "آرش ن.",
    requesterRole: "درخواست‌دهنده جلسه مشاوره",
    duration: 30,
    note: "برای ساخت داشبوردهای تصمیم‌سازی به راهنمایی نیاز دارم.",
    createdAt: subtractHours(reliabilityMockNow, 20),
    paidAt: subtractHours(reliabilityMockNow, 19),
    providerRespondedAt: subtractHours(reliabilityMockNow, 8),
    timesProposedAt: subtractHours(reliabilityMockNow, 8),
    requesterSelectionDeadlineAt: null,
    newTimeRequestedAt: subtractHours(reliabilityMockNow, 3),
    newTimeRequestedByUserId: "user-arash",
    newTimeRequestCount: 1,
    timeOptionsVersion: 2,
    timeOptionsStatus: "SUPERSEDED",
    submittedAtLabel: "ثبت‌شده در ۲۲ خرداد ۱۴۰۵",
    proposedAtLabel: "زمان‌های قبلی کنار گذاشته شدند",
    proposedTimes: withConversationId(defaultProposedTimes, "conv-provider-waiting").map((time) => ({
      ...time,
      status: "SUPERSEDED" as const,
      version: 1
    })),
    previousTimeOptions: withConversationId(defaultProposedTimes, "conv-provider-waiting").map((time) => ({
      ...time,
      status: "SUPERSEDED" as const,
      version: 1
    })),
    walletBalanceToman
  }),
  buildConversation({
    id: "conv-provider-times-proposed",
    requesterId: "user-mahsa",
    providerId: "provider-reza",
    direction: "incoming",
    status: "times_proposed",
    profile: profileOrThrow("reza"),
    requesterName: "مهسا ک.",
    requesterRole: "درخواست‌دهنده جلسه مشاوره",
    duration: 60,
    note: "می‌خواهم درباره رشد مسیر مهندسی و تصمیم‌های مدیریتی حرف بزنم.",
    createdAt: subtractHours(reliabilityMockNow, 18),
    paidAt: subtractHours(reliabilityMockNow, 18),
    providerRespondedAt: subtractHours(reliabilityMockNow, 5),
    timesProposedAt: subtractHours(reliabilityMockNow, 5),
    requesterSelectionDeadlineAt: addHours(reliabilityMockNow, 43),
    submittedAtLabel: "ثبت‌شده در ۲۴ خرداد ۱۴۰۵",
    proposedAtLabel: "سه زمان پیشنهادی ارسال شد",
    proposedTimes: withConversationId(defaultProposedTimes, "conv-provider-times-proposed"),
    walletBalanceToman
  }),
  buildConversation({
    id: "conv-scheduled",
    requesterId: "user-requester",
    providerId: "provider-mina",
    direction: "outgoing",
    status: "confirmed",
    profile: profileOrThrow("mina"),
    requesterName: "تو",
    requesterRole: "درخواست‌دهنده",
    duration: 60,
    note: "درباره کمپین رشد و قیف جذب کاربر سوال دارم.",
    createdAt: subtractHours(reliabilityMockNow, 72),
    providerRespondedAt: subtractHours(reliabilityMockNow, 50),
    timesProposedAt: subtractHours(reliabilityMockNow, 50),
    requesterSelectionDeadlineAt: subtractHours(reliabilityMockNow, 2),
    selectedTimeId: selectedTimeB.id,
    selectedAt: subtractHours(reliabilityMockNow, 26),
    paidAt: subtractHours(reliabilityMockNow, 24),
    confirmedAt: subtractHours(reliabilityMockNow, 24),
    submittedAtLabel: "ثبت‌شده در ۲۰ خرداد ۱۴۰۵",
    proposedAtLabel: "جلسه قطعی شده است",
    selectedTime: { ...selectedTimeB, conversationRequestId: "conv-scheduled" },
    proposedTimes: withConversationId(defaultProposedTimes, "conv-scheduled", selectedTimeB.id),
    attendanceVerificationCode: "48291",
    attendanceVerificationCodeHash: hashAttendanceVerificationCode("48291", "conv-scheduled"),
    attendanceVerificationCodeGeneratedAt: subtractHours(reliabilityMockNow, 24),
    attendanceVerificationCodeExpiresAt: addHours(reliabilityMockNow, 72),
    attendanceVerificationStatus: "PENDING",
    attendanceVerificationAttempts: 0,
    providerPayoutStatus: "NOT_READY",
    providerSettlementInfoComplete: true,
    walletBalanceToman
  }),
  buildConversation({
    id: "conv-requester-late-cancelled",
    requesterId: "user-requester",
    providerId: "provider-mina",
    direction: "outgoing",
    status: "cancelled",
    profile: profileOrThrow("mina"),
    requesterName: "تو",
    requesterRole: "درخواست‌کننده",
    duration: 60,
    note: "درباره کمپین رشد و قیف جذب کاربر سوال داشتم.",
    createdAt: subtractHours(reliabilityMockNow, 72),
    providerRespondedAt: subtractHours(reliabilityMockNow, 50),
    timesProposedAt: subtractHours(reliabilityMockNow, 50),
    requesterSelectionDeadlineAt: subtractHours(reliabilityMockNow, 2),
    selectedTimeId: selectedTimeB.id,
    selectedAt: subtractHours(reliabilityMockNow, 26),
    paidAt: subtractHours(reliabilityMockNow, 24),
    confirmedAt: subtractHours(reliabilityMockNow, 24),
    cancelledAt: subtractHours(reliabilityMockNow, 1),
    cancellationReasonCode: "PREFER_NOT_TO_SAY",
    cancelledByRole: "REQUESTER",
    cancellationStage: "NEAR_SESSION_START",
    cancellationReviewStatus: "NOT_REQUIRED",
    refundRate: 0,
    refundAmount: 0,
    refundDestination: "NONE",
    providerGrossCompensation: 500000,
    useravaaFeeRate: USERAVAA_PLATFORM_FEE_RATE,
    useravaaFeeAmount: 75000,
    providerNetCompensation: 425000,
    providerCompensationWalletTransactionId: "wallet-credit-provider-compensation-conv-requester-late-cancelled",
    requesterRefundWalletTransactionId: null,
    isLateRequesterCancellation: true,
    requestStatusBeforeCancel: "confirmed",
    paymentStatusBeforeCancel: "PAID",
    hasTimeOptions: true,
    hasConfirmedSession: true,
    hoursUntilSession: 2,
    submittedAtLabel: "ثبت‌شده در ۲۰ خرداد ۱۴۰۵",
    proposedAtLabel: "درخواست لغو شد",
    selectedTime: { ...selectedTimeB, conversationRequestId: "conv-requester-late-cancelled" },
    proposedTimes: withConversationId(defaultProposedTimes, "conv-requester-late-cancelled", selectedTimeB.id),
    attendanceVerificationStatus: "NOT_REQUIRED",
    providerPayoutStatus: "PENDING_24H",
    providerSettlementInfoComplete: true,
    walletBalanceToman
  }),
  buildConversation({
    id: "conv-provider-confirmed",
    requesterId: "user-mahsa",
    providerId: "provider-reza",
    direction: "incoming",
    status: "confirmed",
    profile: profileOrThrow("reza"),
    requesterName: "مهسا ک.",
    requesterRole: "درخواست‌دهنده جلسه مشاوره",
    duration: 60,
    note: "جلسه برای هماهنگی درباره رشد مسیر مهندسی ثبت شده است.",
    createdAt: subtractHours(reliabilityMockNow, 72),
    providerRespondedAt: subtractHours(reliabilityMockNow, 50),
    timesProposedAt: subtractHours(reliabilityMockNow, 50),
    requesterSelectionDeadlineAt: subtractHours(reliabilityMockNow, 2),
    selectedTimeId: selectedTimeA.id,
    selectedAt: subtractHours(reliabilityMockNow, 26),
    paidAt: subtractHours(reliabilityMockNow, 24),
    confirmedAt: subtractHours(reliabilityMockNow, 24),
    submittedAtLabel: "ثبت‌شده در ۲۰ خرداد ۱۴۰۵",
    proposedAtLabel: "جلسه قطعی شده است",
    selectedTime: { ...selectedTimeA, conversationRequestId: "conv-provider-confirmed" },
    proposedTimes: withConversationId(defaultProposedTimes, "conv-provider-confirmed", selectedTimeA.id),
    attendanceVerificationCode: "72904",
    attendanceVerificationCodeHash: hashAttendanceVerificationCode("72904", "conv-provider-confirmed"),
    attendanceVerificationCodeGeneratedAt: subtractHours(reliabilityMockNow, 24),
    attendanceVerificationCodeExpiresAt: addHours(reliabilityMockNow, 72),
    attendanceVerificationStatus: "PENDING",
    attendanceVerificationAttempts: 0,
    providerPayoutStatus: "NOT_READY",
    providerSettlementInfoComplete: false,
    walletBalanceToman
  }),
  buildConversation({
    id: "conv-provider-requester-late-cancelled",
    requesterId: "user-mahsa",
    providerId: "provider-reza",
    direction: "incoming",
    status: "cancelled",
    profile: profileOrThrow("reza"),
    requesterName: "مهسا ک.",
    requesterRole: "درخواست‌کننده جلسه مشاوره",
    duration: 60,
    note: "جلسه برای هماهنگی درباره رشد مسیر مهندسی ثبت شده بود.",
    createdAt: subtractHours(reliabilityMockNow, 72),
    providerRespondedAt: subtractHours(reliabilityMockNow, 50),
    timesProposedAt: subtractHours(reliabilityMockNow, 50),
    requesterSelectionDeadlineAt: subtractHours(reliabilityMockNow, 2),
    selectedTimeId: selectedTimeA.id,
    selectedAt: subtractHours(reliabilityMockNow, 26),
    paidAt: subtractHours(reliabilityMockNow, 24),
    confirmedAt: subtractHours(reliabilityMockNow, 24),
    cancelledAt: subtractHours(reliabilityMockNow, 1),
    cancellationReasonCode: "PREFER_NOT_TO_SAY",
    cancelledByRole: "REQUESTER",
    cancellationStage: "NEAR_SESSION_START",
    cancellationReviewStatus: "NOT_REQUIRED",
    refundRate: 0,
    refundAmount: 0,
    refundDestination: "NONE",
    providerGrossCompensation: 1800000,
    useravaaFeeRate: USERAVAA_PLATFORM_FEE_RATE,
    useravaaFeeAmount: 270000,
    providerNetCompensation: 1530000,
    providerCompensationWalletTransactionId: "wallet-credit-provider-compensation-conv-provider-requester-late-cancelled",
    requesterRefundWalletTransactionId: null,
    isLateRequesterCancellation: true,
    requestStatusBeforeCancel: "confirmed",
    paymentStatusBeforeCancel: "PAID",
    hasTimeOptions: true,
    hasConfirmedSession: true,
    hoursUntilSession: 2,
    submittedAtLabel: "ثبت‌شده در ۲۰ خرداد ۱۴۰۵",
    proposedAtLabel: "درخواست لغو شد",
    selectedTime: { ...selectedTimeA, conversationRequestId: "conv-provider-requester-late-cancelled" },
    proposedTimes: withConversationId(defaultProposedTimes, "conv-provider-requester-late-cancelled", selectedTimeA.id),
    providerPayoutStatus: "PENDING_24H",
    providerSettlementInfoComplete: false,
    walletBalanceToman
  }),
  buildConversation({
    id: "conv-expired",
    requesterId: "user-requester",
    providerId: "provider-hamid",
    direction: "outgoing",
    status: "cancelled",
    profile: profileOrThrow("hamid"),
    requesterName: "تو",
    requesterRole: "درخواست‌دهنده",
    duration: 30,
    note: "برای شروع مسیر تحلیل داده راهنمایی می‌خواستم.",
    createdAt: subtractHours(reliabilityMockNow, 30),
    paidAt: subtractHours(reliabilityMockNow, 29),
    cancelledAt: subtractHours(reliabilityMockNow, 2),
    cancellationReasonCode: "PREFER_NOT_TO_SAY",
    cancelledByRole: "REQUESTER",
    cancellationStage: "BEFORE_TIME_PROPOSAL",
    cancellationReviewStatus: "NOT_REQUIRED",
    refundRate: 1,
    refundAmount: 600000,
    refundDestination: "WALLET",
    walletCreditId: "wallet-credit-cancellation-conv-expired",
    requestStatusBeforeCancel: "pending_provider_response",
    paymentStatusBeforeCancel: "PAID",
    hasTimeOptions: false,
    hasConfirmedSession: false,
    submittedAtLabel: "ثبت‌شده در ۱۸ خرداد ۱۴۰۵",
    proposedTimes: [],
    walletBalanceToman
  }),
  buildConversation({
    id: "conv-provider-rejected",
    requesterId: "user-requester",
    providerId: "provider-ali",
    direction: "outgoing",
    status: "rejected",
    profile: profileOrThrow("ali"),
    requesterName: "تو",
    requesterRole: "درخواست‌دهنده",
    duration: 30,
    note: "می‌خواستم درباره آماده‌سازی مصاحبه محصول صحبت کنم.",
    createdAt: subtractHours(reliabilityMockNow, 34),
    paidAt: subtractHours(reliabilityMockNow, 33),
    providerRespondedAt: subtractHours(reliabilityMockNow, 10),
    rejectedAt: subtractHours(reliabilityMockNow, 10),
    rejectedByRole: "EXPERIENCE_CREATOR",
    rejectionReasonCode: "NO_AVAILABILITY",
    rejectionReasonText: null,
    providerCancellationStage: "BEFORE_TIME_PROPOSAL",
    refundRate: 1,
    refundAmount: 1000000,
    refundDestination: "WALLET",
    walletCreditId: "wallet-credit-provider-rejection-conv-provider-rejected",
    requestStatusBeforeCancel: "pending_provider_response",
    paymentStatusBeforeCancel: "PAID",
    hasTimeOptions: false,
    hasConfirmedSession: false,
    submittedAtLabel: "ثبت‌شده در ۱۹ خرداد ۱۴۰۵",
    proposedTimes: [],
    walletBalanceToman
  }),
  buildConversation({
    id: "conv-provider-rejected-incoming",
    requesterId: "user-mahsa",
    providerId: "provider-reza",
    direction: "incoming",
    status: "rejected",
    profile: profileOrThrow("reza"),
    requesterName: "مهسا ک.",
    requesterRole: "درخواست‌دهنده جلسه مشاوره",
    duration: 60,
    note: "درخواست درباره مسیر رشد مهندسی بود.",
    createdAt: subtractHours(reliabilityMockNow, 36),
    paidAt: subtractHours(reliabilityMockNow, 35),
    providerRespondedAt: subtractHours(reliabilityMockNow, 12),
    rejectedAt: subtractHours(reliabilityMockNow, 12),
    rejectedByRole: "EXPERIENCE_CREATOR",
    rejectionReasonCode: "TOPIC_NOT_ALIGNED",
    rejectionReasonText: null,
    providerCancellationStage: "BEFORE_TIME_PROPOSAL",
    refundRate: 1,
    refundAmount: 1800000,
    refundDestination: "WALLET",
    walletCreditId: "wallet-credit-provider-rejection-conv-provider-rejected-incoming",
    requestStatusBeforeCancel: "pending_provider_response",
    paymentStatusBeforeCancel: "PAID",
    hasTimeOptions: false,
    hasConfirmedSession: false,
    submittedAtLabel: "ثبت‌شده در ۱۹ خرداد ۱۴۰۵",
    proposedTimes: [],
    walletBalanceToman
  }),
  buildConversation({
    id: "conv-provider-cancelled-request",
    requesterId: "user-requester",
    providerId: "provider-sara",
    direction: "outgoing",
    status: "cancelled",
    profile: profileOrThrow("sara"),
    requesterName: "تو",
    requesterRole: "درخواست‌دهنده",
    duration: 30,
    note: "می‌خواستم درباره پورتفولیو و مسیر طراحی محصول حرف بزنم.",
    createdAt: subtractHours(reliabilityMockNow, 40),
    paidAt: subtractHours(reliabilityMockNow, 39),
    providerRespondedAt: subtractHours(reliabilityMockNow, 20),
    timesProposedAt: subtractHours(reliabilityMockNow, 20),
    cancelledAt: subtractHours(reliabilityMockNow, 8),
    cancelledByRole: "EXPERIENCE_CREATOR",
    cancellationStage: "PROVIDER_FAULT",
    providerCancellationReasonCode: "TIME_OPTIONS_NO_LONGER_WORK",
    providerCancellationReasonText: null,
    providerCancelledAt: subtractHours(reliabilityMockNow, 8),
    providerCancellationStage: "AFTER_TIME_PROPOSAL_BEFORE_SELECTION",
    cancellationReviewStatus: "NOT_REQUIRED",
    refundRate: 1,
    refundAmount: 900000,
    refundDestination: "WALLET",
    walletCreditId: "wallet-credit-provider-cancellation-conv-provider-cancelled-request",
    requestStatusBeforeCancel: "times_proposed",
    paymentStatusBeforeCancel: "PAID",
    hasTimeOptions: true,
    hasConfirmedSession: false,
    submittedAtLabel: "ثبت‌شده در ۱۸ خرداد ۱۴۰۵",
    proposedAtLabel: "زمان‌های پیشنهادی غیرفعال شدند",
    proposedTimes: withConversationId(defaultProposedTimes, "conv-provider-cancelled-request").map((time) => ({
      ...time,
      status: "SUPERSEDED" as const,
      version: 1
    })),
    timeOptionsStatus: "SUPERSEDED",
    walletBalanceToman
  }),
  buildConversation({
    id: "conv-provider-cancelled-session",
    requesterId: "user-requester",
    providerId: "provider-mina",
    direction: "outgoing",
    status: "cancelled",
    profile: profileOrThrow("mina"),
    requesterName: "تو",
    requesterRole: "درخواست‌دهنده",
    duration: 60,
    note: "درباره کمپین رشد و قیف جذب کاربر سوال داشتم.",
    createdAt: subtractHours(reliabilityMockNow, 80),
    paidAt: subtractHours(reliabilityMockNow, 78),
    providerRespondedAt: subtractHours(reliabilityMockNow, 60),
    timesProposedAt: subtractHours(reliabilityMockNow, 60),
    selectedTimeId: selectedTimeA.id,
    selectedAt: subtractHours(reliabilityMockNow, 40),
    confirmedAt: subtractHours(reliabilityMockNow, 40),
    cancelledAt: subtractHours(reliabilityMockNow, 6),
    cancelledByRole: "EXPERIENCE_CREATOR",
    cancellationStage: "PROVIDER_FAULT",
    providerCancellationReasonCode: "CANNOT_ATTEND_CONFIRMED_SESSION",
    providerCancellationReasonText: null,
    providerCancelledAt: subtractHours(reliabilityMockNow, 6),
    providerCancellationStage: "AFTER_CONFIRMED_SESSION",
    cancellationReviewStatus: "NOT_REQUIRED",
    refundRate: 1,
    refundAmount: 1800000,
    refundDestination: "WALLET",
    walletCreditId: "wallet-credit-provider-cancellation-conv-provider-cancelled-session",
    requestStatusBeforeCancel: "confirmed",
    paymentStatusBeforeCancel: "PAID",
    hasTimeOptions: true,
    hasConfirmedSession: true,
    selectedTime: { ...selectedTimeA, conversationRequestId: "conv-provider-cancelled-session" },
    submittedAtLabel: "ثبت‌شده در ۱۷ خرداد ۱۴۰۵",
    proposedAtLabel: "جلسه بعد از قطعی‌شدن لغو شد",
    proposedTimes: withConversationId(defaultProposedTimes, "conv-provider-cancelled-session", selectedTimeA.id),
    walletBalanceToman
  }),
  buildConversation({
    id: "conv-provider-cancelled-session-incoming",
    requesterId: "user-mahsa",
    providerId: "provider-reza",
    direction: "incoming",
    status: "cancelled",
    profile: profileOrThrow("reza"),
    requesterName: "مهسا ک.",
    requesterRole: "درخواست‌دهنده جلسه مشاوره",
    duration: 60,
    note: "جلسه برای هماهنگی درباره رشد مسیر مهندسی ثبت شده بود.",
    createdAt: subtractHours(reliabilityMockNow, 80),
    paidAt: subtractHours(reliabilityMockNow, 78),
    providerRespondedAt: subtractHours(reliabilityMockNow, 60),
    timesProposedAt: subtractHours(reliabilityMockNow, 60),
    selectedTimeId: selectedTimeA.id,
    selectedAt: subtractHours(reliabilityMockNow, 40),
    confirmedAt: subtractHours(reliabilityMockNow, 40),
    cancelledAt: subtractHours(reliabilityMockNow, 6),
    cancelledByRole: "EXPERIENCE_CREATOR",
    cancellationStage: "PROVIDER_FAULT",
    providerCancellationReasonCode: "CANNOT_ATTEND_CONFIRMED_SESSION",
    providerCancellationReasonText: null,
    providerCancelledAt: subtractHours(reliabilityMockNow, 6),
    providerCancellationStage: "AFTER_CONFIRMED_SESSION",
    cancellationReviewStatus: "NOT_REQUIRED",
    refundRate: 1,
    refundAmount: 1800000,
    refundDestination: "WALLET",
    walletCreditId: "wallet-credit-provider-cancellation-conv-provider-cancelled-session-incoming",
    requestStatusBeforeCancel: "confirmed",
    paymentStatusBeforeCancel: "PAID",
    hasTimeOptions: true,
    hasConfirmedSession: true,
    selectedTime: { ...selectedTimeA, conversationRequestId: "conv-provider-cancelled-session-incoming" },
    submittedAtLabel: "ثبت‌شده در ۱۷ خرداد ۱۴۰۵",
    proposedAtLabel: "جلسه بعد از قطعی‌شدن لغو شد",
    proposedTimes: withConversationId(defaultProposedTimes, "conv-provider-cancelled-session-incoming", selectedTimeA.id),
    walletBalanceToman
  }),
  buildConversation({
    id: "conv-free-help",
    requesterId: "user-requester",
    providerId: "provider-niloofar",
    direction: "outgoing",
    status: "payment_not_required",
    profile: profileOrThrow("niloofar"),
    requesterName: "تو",
    requesterRole: "درخواست‌دهنده",
    duration: 30,
    note: "یک جلسه کمکی کوتاه برای مسیر شغلی.",
    createdAt: subtractHours(reliabilityMockNow, 16),
    submittedAtLabel: "ثبت‌شده در ۲۱ خرداد ۱۴۰۵",
    walletBalanceToman,
    freeHelp: true
  })
] as const satisfies readonly ConversationFixture[];

function conversationFixtureById(id: string) {
  const conversation = conversations.find((item) => item.id === id);

  if (!conversation) {
    throw new Error(`Missing V51 conversation fixture: ${id}`);
  }

  return conversation;
}

export const conversationNotifications: ConversationNotification[] = [
  createConversationNotification(conversationFixtureById("conv-provider-request"), "new_request", "provider"),
  createConversationNotification(conversationFixtureById("conv-time-options"), "proposed_times", "requester"),
  createConversationNotification(conversationFixtureById("conv-provider-near-expiration"), "near_expiration", "provider"),
  createConversationNotification(conversationFixtureById("conv-scheduled"), "confirmed", "requester"),
  createConversationNotification(conversationFixtureById("conv-provider-confirmed"), "confirmed", "provider"),
  createConversationNotification(conversationFixtureById("conv-scheduled"), "one_hour_reminder", "requester"),
  createConversationNotification(conversationFixtureById("conv-provider-confirmed"), "one_hour_reminder", "provider"),
  createConversationNotification(conversationFixtureById("conv-provider-rejected"), "cancellation", "requester"),
  createConversationNotification(conversationFixtureById("conv-provider-rejected-incoming"), "cancellation", "provider"),
  createConversationNotification(conversationFixtureById("conv-provider-cancelled-session"), "cancellation", "requester"),
  createConversationNotification(conversationFixtureById("conv-provider-cancelled-session-incoming"), "cancellation", "provider")
];

export const mockEmailLogs: EmailLog[] = [
  queueMockEmail(conversationFixtureById("conv-provider-request"), "new_request", "provider"),
  queueMockEmail(conversationFixtureById("conv-time-options"), "proposed_times", "requester"),
  queueMockEmail(conversationFixtureById("conv-scheduled"), "confirmed", "requester"),
  queueMockEmail(conversationFixtureById("conv-scheduled"), "one_hour_reminder", "requester")
];

export const conversationRequestApiContracts = [
  "POST /api/conversation-requests",
  "GET /api/conversation-requests",
  "GET /api/conversation-requests/{id}",
  "POST /api/conversation-requests/{id}/propose-times",
  "POST /api/conversation-requests/{id}/reject",
  "POST /api/conversation-requests/{id}/select-time",
  "POST /api/conversation-requests/{id}/cancel",
  "POST /api/conversation-requests/{id}/expire",
  "GET /api/conversation-requests/{id}/similar-experiences"
] as const;

export const mockReliabilityJobs = [
  { key: "expire_pending_provider_requests", cadence: "every 15 minutes" },
  { key: "expire_proposed_times", cadence: "every 15 minutes" },
  { key: "conversation_reminder", cadence: "every 15 minutes" },
  { key: "expiration_warning", cadence: "every 1 hour" }
] as const;

export function getConversationById(conversationId: string) {
  return conversations.find((conversation) => conversation.id === conversationId);
}

export function getConversationOrFallback(conversationId: string, fallbackId = "conv-time-options") {
  return getConversationById(conversationId) ?? getMockRequestConversation(conversationId) ?? getConversationById(fallbackId) ?? conversations[0];
}

export function getPersonName(conversation: ConversationFixture) {
  return conversation.direction === "incoming" ? conversation.requesterName : conversation.profile.name;
}

export function getPersonRole(conversation: ConversationFixture) {
  return conversation.direction === "incoming" ? conversation.requesterRole : conversation.profile.roleFa;
}

export function formatDuration(duration: ConversationDuration) {
  return duration === 30 ? "۳۰ دقیقه" : "۱ ساعت";
}

export function getConversationPrice(conversation: Pick<ConversationFixture, "duration" | "freeHelp" | "profile">) {
  if (conversation.freeHelp) {
    return 0;
  }

  return conversation.profile.pricing[conversation.duration] ?? 0;
}

export function formatPrice(conversation: Pick<ConversationFixture, "duration" | "freeHelp" | "profile">) {
  const price = getConversationPrice(conversation);
  return price === 0 ? "رایگان" : toman(price);
}

export function formatToman(value: number) {
  return `${formatter.format(value)} تومان`;
}

function roundRefundAmount(amount: number, refundRate: number) {
  return Math.round(amount * refundRate);
}

export function calculateProviderNetAmount(grossAmount: number) {
  const useravaaFeeAmount = Math.round((grossAmount * 15) / 100);

  return {
    grossAmount,
    useravaaFeeRate: USERAVAA_PLATFORM_FEE_RATE,
    useravaaFeeAmount,
    providerNetAmount: grossAmount - useravaaFeeAmount
  };
}

function getSelectedStartAt(conversation: Pick<ConversationFixture, "selectedTime">) {
  return conversation.selectedTime?.startAt ?? null;
}

export function getHoursUntilSession(conversation: Pick<ConversationFixture, "selectedTime">, now = reliabilityMockNow) {
  const startAt = getTimeValue(getSelectedStartAt(conversation));
  const nowAt = getTimeValue(now);

  if (startAt === null || nowAt === null) {
    return null;
  }

  return (startAt - nowAt) / MS_PER_HOUR;
}

export function canRequesterCancelRequest(conversation: ConversationFixture, requesterId = conversation.requesterId) {
  if (conversation.direction !== "outgoing" || conversation.requesterId !== requesterId) {
    return false;
  }

  return !["completed", "rejected", "expired", "cancelled", "refunded"].includes(conversation.status);
}

export function isExperienceCreatorActor(role?: CancelledByRole | null) {
  return role === "EXPERIENCE_CREATOR" || role === "PROVIDER";
}

export function isProviderSideRejection(conversation: Pick<ConversationFixture, "status" | "rejectedByRole">) {
  return conversation.status === "rejected" && conversation.rejectedByRole === "EXPERIENCE_CREATOR";
}

export function isProviderSideCancellation(conversation: Pick<ConversationFixture, "status" | "cancelledByRole">) {
  return conversation.status === "cancelled" && isExperienceCreatorActor(conversation.cancelledByRole);
}

export function isProviderSideClosure(conversation: Pick<ConversationFixture, "status" | "cancelledByRole" | "rejectedByRole">) {
  return isProviderSideRejection(conversation) || isProviderSideCancellation(conversation);
}

export function hasProviderCancellationCompensation(
  conversation: Pick<ConversationFixture, "providerNetCompensation" | "providerGrossCompensation" | "providerCompensationWalletTransactionId">
) {
  return Boolean(
    conversation.providerCompensationWalletTransactionId ||
      (conversation.providerNetCompensation && conversation.providerNetCompensation > 0) ||
      (conversation.providerGrossCompensation && conversation.providerGrossCompensation > 0)
  );
}

function isClosedConversation(conversation: Pick<ConversationFixture, "status">) {
  return ["completed", "rejected", "expired", "cancelled", "refunded"].includes(conversation.status);
}

function providerActorMatches(conversation: Pick<ConversationFixture, "providerId">, providerId?: string) {
  return !providerId || conversation.providerId === providerId;
}

export function canProviderRejectRequest(conversation: ConversationFixture, providerId = conversation.providerId) {
  return (
    conversation.direction === "incoming" &&
    providerActorMatches(conversation, providerId) &&
    conversation.status === "pending_provider_response" &&
    getPaymentStatus(conversation) === "PAID" &&
    !isClosedConversation(conversation) &&
    conversation.proposedTimes.length === 0 &&
    !conversation.selectedTimeId &&
    conversation.cancellationReviewStatus !== "PENDING_SUPPORT_REVIEW"
  );
}

export function canProviderCancelRequestBeforeSelection(conversation: ConversationFixture, providerId = conversation.providerId) {
  return (
    conversation.direction === "incoming" &&
    providerActorMatches(conversation, providerId) &&
    conversation.status === "times_proposed" &&
    getPaymentStatus(conversation) === "PAID" &&
    conversation.proposedTimes.length > 0 &&
    !conversation.selectedTimeId &&
    !isConfirmedSessionConversation(conversation) &&
    !isClosedConversation(conversation) &&
    conversation.cancellationReviewStatus !== "PENDING_SUPPORT_REVIEW"
  );
}

export function canProviderReplaceProposedTimes(conversation: ConversationFixture, providerId = conversation.providerId, now = reliabilityMockNow) {
  const resolvedConversation = applyExpiration(conversation, now);
  const paymentStatus = getPaymentStatus(resolvedConversation);

  return (
    resolvedConversation.direction === "incoming" &&
    providerActorMatches(resolvedConversation, providerId) &&
    resolvedConversation.status === "times_proposed" &&
    (paymentStatus === "PAID" || paymentStatus === "NOT_REQUIRED") &&
    getActiveProposedTimes(resolvedConversation).length === 3 &&
    !resolvedConversation.selectedTimeId &&
    !isConfirmedSessionConversation(resolvedConversation) &&
    !isClosedConversation(resolvedConversation) &&
    resolvedConversation.cancellationReviewStatus !== "PENDING_SUPPORT_REVIEW" &&
    (resolvedConversation.timeOptionsVersion ?? 1) === 1 &&
    !resolvedConversation.timeOptionsReplacedAt
  );
}

export function canProviderCancelConfirmedSession(conversation: ConversationFixture, providerId = conversation.providerId) {
  return (
    conversation.direction === "incoming" &&
    providerActorMatches(conversation, providerId) &&
    isConfirmedSessionConversation(conversation) &&
    conversation.status !== "completed" &&
    !["cancelled", "refunded", "rejected", "expired"].includes(conversation.status) &&
    conversation.cancellationReviewStatus !== "PENDING_SUPPORT_REVIEW"
  );
}

export function canProviderCloseConversation(conversation: ConversationFixture, providerId = conversation.providerId) {
  return (
    canProviderRejectRequest(conversation, providerId) ||
    canProviderCancelRequestBeforeSelection(conversation, providerId) ||
    canProviderCancelConfirmedSession(conversation, providerId)
  );
}

export function validateProviderRejectionReason(reasonCode: ProviderRejectionReasonCode | "") {
  return Boolean(reasonCode);
}

export function validateProviderCancellationReason(reasonCode: ProviderCancellationReasonCode | "") {
  return Boolean(reasonCode);
}

export function getCancellationStage(
  conversation: ConversationFixture,
  now = reliabilityMockNow,
  stageOverride?: Extract<CancellationStage, "PROVIDER_FAULT" | "PLATFORM_FAULT">
): CancellationStage {
  if (stageOverride) {
    return stageOverride;
  }

  const confirmed = isConfirmedSessionConversation(conversation);
  const hours = getHoursUntilSession(conversation, now);

  if (confirmed && hours !== null && hours >= 0 && hours < LATE_REQUESTER_CANCELLATION_THRESHOLD_HOURS) {
    return "NEAR_SESSION_START";
  }

  if (confirmed) {
    return "AFTER_CONFIRMED_SESSION";
  }

  return conversation.proposedTimes.length > 0 || conversation.status === "times_proposed" ? "AFTER_TIME_PROPOSAL_BEFORE_SELECTION" : "BEFORE_TIME_PROPOSAL";
}

export function calculateCancellationFinancials(
  conversation: ConversationFixture,
  cancelledByRole: CancelledByRole = "REQUESTER",
  now = reliabilityMockNow,
  stageOverride?: Extract<CancellationStage, "PROVIDER_FAULT" | "PLATFORM_FAULT">
): Omit<CancellationRefundPolicy, "copy" | "destinationCopy"> {
  const stage = getCancellationStage(conversation, now, stageOverride);
  const paidAmount = getConversationPrice(conversation);
  const isRequesterCancellation = cancelledByRole === "REQUESTER";
  const fullRefundStages: CancellationStage[] = ["PROVIDER_FAULT", "PLATFORM_FAULT"];
  const refundRate = (() => {
    if (fullRefundStages.includes(stage) || !isRequesterCancellation || stage === "BEFORE_TIME_PROPOSAL") {
      return 1;
    }

    if (stage === "AFTER_TIME_PROPOSAL_BEFORE_SELECTION") {
      return 0.9;
    }

    if (stage === "AFTER_CONFIRMED_SESSION") {
      return 0.5;
    }

    if (stage === "NEAR_SESSION_START") {
      return 0;
    }

    return 1;
  })();
  const refundAmount = roundRefundAmount(paidAmount, refundRate);
  const providerGrossCompensation = isRequesterCancellation ? Math.max(0, paidAmount - refundAmount) : 0;
  const providerAmounts = calculateProviderNetAmount(providerGrossCompensation);
  const isLateRequesterCancellation = isRequesterCancellation && stage === "NEAR_SESSION_START";

  return {
    stage,
    refundRate,
    refundAmount,
    refundDestination: refundAmount > 0 ? "WALLET" : "NONE",
    providerGrossCompensation,
    useravaaFeeRate: providerAmounts.useravaaFeeRate,
    useravaaFeeAmount: providerAmounts.useravaaFeeAmount,
    providerNetCompensation: providerAmounts.providerNetAmount,
    isLateRequesterCancellation,
    requiresSupportReview: false
  };
}

export function getCancellationRefundPolicy(
  conversation: ConversationFixture,
  now = reliabilityMockNow,
  stageOverride?: Extract<CancellationStage, "PROVIDER_FAULT" | "PLATFORM_FAULT">
): CancellationRefundPolicy {
  const financials = calculateCancellationFinancials(conversation, "REQUESTER", now, stageOverride);
  const fullRefundStages: CancellationStage[] = ["PROVIDER_FAULT", "PLATFORM_FAULT"];
  const stage = financials.stage;
  const copy = fullRefundStages.includes(stage)
    ? cancellationPolicyCopy.fullRefund
    : stage === "BEFORE_TIME_PROPOSAL"
      ? cancellationPolicyCopy.beforeTimeProposal
      : stage === "AFTER_TIME_PROPOSAL_BEFORE_SELECTION"
        ? cancellationPolicyCopy.beforeConfirmed
    : stage === "AFTER_CONFIRMED_SESSION"
      ? cancellationPolicyCopy.afterConfirmed
      : stage === "NEAR_SESSION_START"
        ? cancellationPolicyCopy.nearSession
        : cancellationPolicyCopy.fullRefund;

  return {
    ...financials,
    copy,
    destinationCopy: financials.refundAmount > 0 ? cancellationPolicyCopy.destination : cancellationPolicyCopy.noRefundDestination
  };
}

export function getProviderCancellationStage(conversation: ConversationFixture, now = reliabilityMockNow): ProviderCancellationStage {
  if (conversation.status === "pending_provider_response") {
    return "BEFORE_TIME_PROPOSAL";
  }

  if (conversation.status === "times_proposed") {
    return "AFTER_TIME_PROPOSAL_BEFORE_SELECTION";
  }

  const hours = getHoursUntilSession(conversation, now);

  if (isConfirmedSessionConversation(conversation) && hours !== null && hours >= 0 && hours < LATE_REQUESTER_CANCELLATION_THRESHOLD_HOURS) {
    return "NEAR_SESSION_START";
  }

  return "AFTER_CONFIRMED_SESSION";
}

export function getProviderSideRefundAmount(conversation: ConversationFixture) {
  return getConversationPrice(conversation);
}

export function validateCancellationReason(reasonCode: CancellationReasonCode | "") {
  return Boolean(reasonCode);
}

export function createCancellationWalletCredit(conversation: ConversationFixture) {
  const creditId = conversation.requesterRefundWalletTransactionId ?? conversation.walletCreditId;

  if (!creditId || !conversation.refundAmount || conversation.refundAmount <= 0) {
    return null;
  }

  const title = isProviderSideRejection(conversation)
    ? providerSideClosureCopy.rejectedWalletCreditTitle
    : isProviderSideCancellation(conversation)
      ? providerSideClosureCopy.providerCancellationWalletCreditTitle
      : cancellationPolicyCopy.walletCreditTitle;

  return {
    id: creditId,
    type: "CANCELLATION_CREDIT" as const,
    title,
    date: "امروز",
    amount: conversation.refundAmount,
    sourceRequestId: conversation.id,
    sourceConversationId: conversation.id,
    status: "completed" as const,
    createdAt: conversation.cancelledAt ?? reliabilityMockNow
  };
}

export function createProviderCompensationWalletCredit(conversation: ConversationFixture) {
  if (!conversation.providerCompensationWalletTransactionId || !conversation.providerNetCompensation || conversation.providerNetCompensation <= 0) {
    return null;
  }

  return {
    id: conversation.providerCompensationWalletTransactionId,
    type: "CANCELLATION_PROVIDER_COMPENSATION" as const,
    title: cancellationPolicyCopy.providerCompensationWalletTitle,
    date: "امروز",
    amount: conversation.providerNetCompensation,
    sourceRequestId: conversation.id,
    sourceConversationId: conversation.id,
    status: "pending" as const,
    settlementStatus: "SETTLEMENT_PENDING" as const,
    cancelledByRole: conversation.cancelledByRole ?? "REQUESTER",
    providerGrossCompensation: conversation.providerGrossCompensation ?? 0,
    useravaaFeeRate: conversation.useravaaFeeRate ?? USERAVAA_PLATFORM_FEE_RATE,
    useravaaFeeAmount: conversation.useravaaFeeAmount ?? 0,
    providerNetAmount: conversation.providerNetCompensation,
    refundRate: conversation.refundRate ?? 0,
    refundAmount: conversation.refundAmount ?? 0,
    hoursUntilSession: conversation.hoursUntilSession ?? null,
    createdAt: conversation.cancelledAt ?? reliabilityMockNow
  };
}

export function getCancellationRecoveryCopy(conversation: ConversationFixture) {
  if (isProviderSideClosure(conversation)) {
    return providerSideClosureCopy.recoveryText;
  }

  switch (conversation.cancellationReasonCode) {
    case "TIME_OPTIONS_NOT_SUITABLE":
      return cancellationPolicyCopy.recoveryTimeText;
    case "WANT_DIFFERENT_EXPERIENCE_CREATOR":
      return cancellationPolicyCopy.recoveryDifferentCreatorText;
    case "PRICE_NOT_SUITABLE":
      return cancellationPolicyCopy.recoveryPriceText;
    case "NEED_CHANGED":
      return cancellationPolicyCopy.recoveryNeedChangedText;
    default:
      return cancellationPolicyCopy.recoveryDefaultText;
  }
}

function buildRecoveryAction(id: CancellationRecoveryAction["id"], label: string, href: string, tone: CancellationRecoveryAction["tone"] = "secondary"): CancellationRecoveryAction {
  return { id, label, href, tone };
}

export function getCancellationRecoveryActions(conversation: ConversationFixture): CancellationRecoveryAction[] {
  const wallet = buildRecoveryAction("wallet", cancellationPolicyCopy.walletAction, "/wallet");
  const sameProvider = buildRecoveryAction("same_provider", cancellationPolicyCopy.sameProviderAction, `/requests/new?profileId=${conversation.profile.id}&duration=${conversation.duration}`);
  const similar = buildRecoveryAction("similar", cancellationPolicyCopy.similarAction, `/discover?field=${encodeURIComponent(conversation.profile.jobCategoriesFa[0] ?? "")}`);
  const sameField = buildRecoveryAction("same_field", providerSideClosureCopy.sameFieldAction, `/discover?field=${encodeURIComponent(conversation.profile.jobCategoriesFa[0] ?? "")}`);
  const discover = buildRecoveryAction("discover", cancellationPolicyCopy.discoverAction, "/discover");
  const shortOptions = buildRecoveryAction("short_options", cancellationPolicyCopy.shortOptionsAction, "/discover?duration=30");
  const previousRequests = buildRecoveryAction("previous_requests", cancellationPolicyCopy.previousRequestsAction, "/requests");
  const support = buildRecoveryAction("support", cancellationPolicyCopy.supportAction, "/support");

  if (isProviderSideClosure(conversation)) {
    return [similar, sameField, wallet].map((action, index) => ({ ...action, tone: index === 0 ? "primary" : action.tone }));
  }

  const ordered = (() => {
    switch (conversation.cancellationReasonCode) {
      case "TIME_OPTIONS_NOT_SUITABLE":
        return [sameProvider, similar, wallet, support];
      case "WANT_DIFFERENT_EXPERIENCE_CREATOR":
        return [similar, discover, wallet, support];
      case "PRICE_NOT_SUITABLE":
        return [shortOptions, discover, wallet, support];
      case "NEED_CHANGED":
        return [discover, previousRequests, wallet, support];
      default:
        return [wallet, sameProvider, similar, support];
    }
  })();

  return ordered.map((action, index) => ({ ...action, tone: index === 0 ? "primary" : action.tone }));
}

export function isCancellationUnderSupportReview(conversation: Pick<ConversationFixture, "status" | "cancellationReviewStatus">) {
  return conversation.status === "cancelled" && conversation.cancellationReviewStatus === "PENDING_SUPPORT_REVIEW";
}

export function getCancellationStatusTitle(
  conversation: Pick<ConversationFixture, "status" | "cancellationReviewStatus" | "direction" | "cancelledByRole" | "providerCancellationStage">
) {
  if (isCancellationUnderSupportReview(conversation)) {
    return isProviderSideCancellation(conversation) ? providerSideClosureCopy.supportReviewTitle : "لغو در حال بررسی است";
  }

  if (isProviderSideCancellation(conversation)) {
    return conversation.providerCancellationStage === "AFTER_CONFIRMED_SESSION" || conversation.providerCancellationStage === "NEAR_SESSION_START"
      ? providerSideClosureCopy.requesterCancelledSessionTitle
      : providerSideClosureCopy.requesterCancelledRequestTitle;
  }

  return cancellationPolicyCopy.cancelledTitle;
}

export function getCancellationStatusDescription(
  conversation: Pick<
    ConversationFixture,
    | "status"
    | "cancellationReviewStatus"
    | "walletCreditId"
    | "direction"
    | "cancelledByRole"
    | "providerCancellationStage"
    | "isLateRequesterCancellation"
    | "refundAmount"
    | "providerGrossCompensation"
    | "providerNetCompensation"
    | "providerCompensationWalletTransactionId"
  >
) {
  if (isCancellationUnderSupportReview(conversation)) {
    return isProviderSideCancellation(conversation) ? providerSideClosureCopy.supportReviewText : cancellationPolicyCopy.reviewText;
  }

  if (isProviderSideCancellation(conversation)) {
    if (conversation.direction === "incoming") {
      return conversation.providerCancellationStage === "AFTER_CONFIRMED_SESSION" || conversation.providerCancellationStage === "NEAR_SESSION_START"
        ? providerSideClosureCopy.providerCancelledSessionText
        : providerSideClosureCopy.providerCancelledRequestText;
    }

    return conversation.providerCancellationStage === "AFTER_CONFIRMED_SESSION" || conversation.providerCancellationStage === "NEAR_SESSION_START"
      ? providerSideClosureCopy.requesterCancelledSessionRowText
      : providerSideClosureCopy.requesterCancelledRequestRowText;
  }

  if (conversation.walletCreditId) {
    return cancellationPolicyCopy.creditedText;
  }

  if (conversation.direction === "incoming" && hasProviderCancellationCompensation(conversation)) {
    return cancellationPolicyCopy.providerCompensationText;
  }

  if (conversation.isLateRequesterCancellation || conversation.refundAmount === 0) {
    return cancellationPolicyCopy.lateRequesterCancelledText;
  }

  return "این درخواست لغو شده است. جزئیات بازگشت اعتبار در صفحه درخواست قابل مشاهده است.";
}

export function getRejectedStatusTitle(conversation: Pick<ConversationFixture, "direction" | "rejectedByRole">) {
  if (conversation.rejectedByRole === "EXPERIENCE_CREATOR") {
    return conversation.direction === "incoming" ? providerSideClosureCopy.providerRejectedTitle : providerSideClosureCopy.requesterRejectedTitle;
  }

  return conversation.direction === "incoming" ? providerSideClosureCopy.providerRejectedTitle : providerSideClosureCopy.requesterRejectedTitle;
}

export function getRejectedStatusDescription(conversation: Pick<ConversationFixture, "direction" | "rejectedByRole">) {
  if (conversation.rejectedByRole === "EXPERIENCE_CREATOR") {
    return conversation.direction === "incoming" ? providerSideClosureCopy.providerRejectedText : providerSideClosureCopy.requesterRejectedRowText;
  }

  return conversation.direction === "incoming" ? providerSideClosureCopy.providerRejectedText : "این درخواست پذیرفته نشد و در بخش بسته‌شده نگه‌داری می‌شود.";
}

export function getClosedDetailTitle(conversation: ConversationFixture) {
  if (conversation.status === "rejected") {
    return getRejectedStatusTitle(conversation);
  }

  if (conversation.status === "cancelled") {
    if (isCancellationUnderSupportReview(conversation)) {
      return isProviderSideCancellation(conversation) ? providerSideClosureCopy.supportReviewTitle : "لغو در حال بررسی است";
    }

    if (isProviderSideCancellation(conversation) && conversation.direction === "incoming") {
      return conversation.providerCancellationStage === "AFTER_CONFIRMED_SESSION" || conversation.providerCancellationStage === "NEAR_SESSION_START"
        ? providerSideClosureCopy.providerCancelledSessionTitle
        : providerSideClosureCopy.providerCancelledRequestTitle;
    }

    return getCancellationStatusTitle(conversation);
  }

  return "درخواست بسته شده است";
}

export function getClosedDetailDescription(conversation: ConversationFixture) {
  if (conversation.status === "rejected") {
    return isProviderSideRejection(conversation) && conversation.direction === "outgoing"
      ? providerSideClosureCopy.requesterRejectedText
      : getRejectedStatusDescription(conversation);
  }

  if (conversation.status === "cancelled") {
    if (isCancellationUnderSupportReview(conversation)) {
      return isProviderSideCancellation(conversation) ? providerSideClosureCopy.supportReviewText : cancellationPolicyCopy.reviewText;
    }

    if (isProviderSideCancellation(conversation)) {
      if (conversation.direction === "incoming") {
        return conversation.providerCancellationStage === "AFTER_CONFIRMED_SESSION" || conversation.providerCancellationStage === "NEAR_SESSION_START"
          ? providerSideClosureCopy.providerCancelledSessionText
          : providerSideClosureCopy.providerCancelledRequestText;
      }

      return conversation.providerCancellationStage === "AFTER_CONFIRMED_SESSION" || conversation.providerCancellationStage === "NEAR_SESSION_START"
        ? providerSideClosureCopy.requesterCancelledSessionText
        : providerSideClosureCopy.requesterCancelledRequestText;
    }

    if (conversation.direction === "incoming" && hasProviderCancellationCompensation(conversation)) {
      return cancellationPolicyCopy.providerCompensationDetailText;
    }

    if (conversation.direction === "outgoing" && (conversation.isLateRequesterCancellation || conversation.refundAmount === 0)) {
      return cancellationPolicyCopy.lateRequesterDetailText;
    }

    return getCancellationStatusDescription(conversation);
  }

  return "این مورد در وضعیت بسته‌شده قرار دارد.";
}

function getTimeValue(value?: string | null) {
  if (!value) {
    return null;
  }

  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : null;
}

export function isProposedTimeExpired(time: Pick<ProposedTime, "startAt">, now = reliabilityMockNow) {
  const startAt = getTimeValue(time.startAt);
  const nowAt = getTimeValue(now);

  return startAt !== null && nowAt !== null && startAt <= nowAt;
}

export function isRequesterSelectionExpired(conversation: Pick<ConversationFixture, "requesterSelectionDeadlineAt">, now = reliabilityMockNow) {
  const deadlineAt = getTimeValue(conversation.requesterSelectionDeadlineAt);
  const nowAt = getTimeValue(now);

  return deadlineAt !== null && nowAt !== null && deadlineAt <= nowAt;
}

export function isProposedTimeSelectableByRequester(time: Pick<ProposedTime, "startAt">, now = reliabilityMockNow) {
  const startAt = getTimeValue(time.startAt);
  const nowAt = getTimeValue(now);

  return startAt !== null && nowAt !== null && startAt >= nowAt + 6 * MS_PER_HOUR;
}

export function isActiveProposedTime(
  time: Pick<ProposedTime, "status" | "version">,
  conversation?: Pick<ConversationFixture, "timeOptionsVersion">
) {
  if (time.status === "SUPERSEDED") {
    return false;
  }

  if (conversation?.timeOptionsVersion && time.version && time.version !== conversation.timeOptionsVersion) {
    return false;
  }

  return true;
}

export function getActiveProposedTimes(conversation: Pick<ConversationFixture, "proposedTimes" | "timeOptionsVersion">) {
  return conversation.proposedTimes.filter((time) => isActiveProposedTime(time, conversation));
}

export function canRequesterRequestNewTimes(conversation: ConversationFixture, requesterId = conversation.requesterId, now = reliabilityMockNow) {
  const resolvedConversation = applyExpiration(conversation, now);
  const paymentStatus = getPaymentStatus(resolvedConversation);

  return (
    resolvedConversation.direction === "outgoing" &&
    resolvedConversation.requesterId === requesterId &&
    resolvedConversation.status === "times_proposed" &&
    !resolvedConversation.selectedTimeId &&
    getActiveProposedTimes(resolvedConversation).length > 0 &&
    (paymentStatus === "PAID" || paymentStatus === "NOT_REQUIRED") &&
    (resolvedConversation.newTimeRequestCount ?? 0) < 1
  );
}

function isProposedTimeAtLeastSixHoursAway(time: Pick<ProposedTime, "startAt">, now = reliabilityMockNow) {
  const startAt = getTimeValue(time.startAt);
  const nowAt = getTimeValue(now);

  return startAt !== null && nowAt !== null && startAt >= nowAt + 6 * MS_PER_HOUR;
}

function isProposedTimeWithinSevenDays(time: Pick<ProposedTime, "startAt">, now = reliabilityMockNow) {
  const startAt = getTimeValue(time.startAt);
  const nowAt = getTimeValue(now);

  return startAt !== null && nowAt !== null && startAt <= nowAt + 7 * 24 * MS_PER_HOUR;
}

function isProposedTimeWithinProviderWindow(time: Pick<ProposedTime, "time">) {
  const [hourValue, minuteValue = "0"] = time.time.split(":");
  const hour = Number(hourValue);
  const minute = Number(minuteValue);

  return Number.isFinite(hour) && Number.isFinite(minute) && hour >= 7 && (hour < 23 || (hour === 23 && minute === 0));
}

export function getSelectedProposedTime(
  conversation: Pick<ConversationFixture, "id" | "proposedTimes" | "selectedTimeId">
): ProposedTime | undefined {
  if (!conversation.selectedTimeId) {
    return undefined;
  }

  return conversation.proposedTimes.find((time) => time.id === conversation.selectedTimeId && time.conversationRequestId === conversation.id);
}

export function hasValidSelectedTime(conversation: Pick<ConversationFixture, "id" | "proposedTimes" | "selectedTimeId">, now = reliabilityMockNow) {
  const selectedTime = getSelectedProposedTime(conversation);
  return Boolean(selectedTime?.startAt && !isProposedTimeExpired(selectedTime, now));
}

export function getRepeatRequestHref(conversation: Pick<ConversationFixture, "duration" | "profile">) {
  return `/requests/new?profileId=${conversation.profile.id}&duration=${conversation.duration}`;
}

export type SessionRouteAccess = {
  allowed: boolean;
  fallbackHref: string;
  disabledReason?: DisabledReason;
  message?: string;
};

function createDisabledAction(label: string, disabledReason: DisabledReason): ConversationAction {
  return {
    kind: "open",
    label,
    href: undefined,
    tone: "secondary",
    disabled: true,
    disabledReason,
    disabledMessage: disabledReasonCopy[disabledReason]
  };
}

export function getViewerRole(conversation: Pick<ConversationFixture, "direction">): ViewerRole {
  return conversation.direction === "incoming" ? "PROVIDER" : "REQUESTER";
}

export function mapToCanonicalFlow(conversation: Pick<ConversationFixture, "status" | "freeHelp" | "selectedTimeId">): CanonicalSessionFlow {
  switch (conversation.status) {
    case "pending_payment":
    case "payment_not_required":
      return "REQUEST_CREATED_BY_REQUESTER";
    case "pending_provider_response":
      return "WAITING_FOR_PROVIDER_TO_PROPOSE_TIMES";
    case "times_proposed":
      return "PROVIDER_PROPOSED_TIMES_WAITING_FOR_REQUESTER_SELECTION";
    case "new_time_requested":
      return "REQUESTER_REQUESTED_NEW_TIMES";
    case "payment_processing":
      return "PAYMENT_PROCESSING";
    case "confirmed":
      return "SESSION_CONFIRMED_CONTACT_UNLOCKED";
    case "completed":
      return "SESSION_COMPLETED_WAITING_FOR_FEEDBACK";
    case "expired":
      return "REQUEST_EXPIRED";
    case "cancelled":
    case "rejected":
      return "REQUEST_CANCELLED";
    case "refunded":
      return "REFUNDED";
  }
}

export function getPaymentRequirement(
  conversation: Pick<ConversationFixture, "duration" | "freeHelp" | "profile" | "status" | "walletBalanceToman">,
  walletBalance = conversation.walletBalanceToman ?? walletBalanceToman
): PaymentRequirement {
  const price = getConversationPrice(conversation);

  if (conversation.freeHelp || price === 0) {
    return "NO_PAYMENT_REQUIRED_FREE_HELP";
  }

  if (conversation.status === "payment_not_required") {
    return "NO_PAYMENT_REQUIRED_MANUAL";
  }

  if (walletBalance >= price) {
    return "FULL_WALLET_COVERED";
  }

  if (walletBalance > 0) {
    return "PARTIAL_GATEWAY_REQUIRED";
  }

  return "PAYMENT_REQUIRED";
}

export function getPaymentStatus(conversation: ConversationFixture, walletBalance = conversation.walletBalanceToman ?? walletBalanceToman): PaymentStatus {
  if (conversation.status === "refunded") {
    return "REFUNDED";
  }

  if (conversation.manualPaymentStatus === "REJECTED") {
    return "FAILED";
  }

  if (conversation.manualPaymentStatus === "SUBMITTED") {
    return "PENDING_REVIEW";
  }

  if (conversation.status === "payment_processing") {
    return "PROCESSING";
  }

  const requirement = getPaymentRequirement(conversation, walletBalance);

  if (requirement === "NO_PAYMENT_REQUIRED_FREE_HELP" || requirement === "NO_PAYMENT_REQUIRED_MANUAL") {
    return "NOT_REQUIRED";
  }

  if (
    conversation.status === "pending_provider_response" ||
    conversation.status === "times_proposed" ||
    conversation.status === "new_time_requested" ||
    conversation.status === "confirmed" ||
    conversation.status === "completed"
  ) {
    return "PAID";
  }

  if (requirement === "FULL_WALLET_COVERED") {
    return "FULLY_COVERED_BY_WALLET";
  }

  if (requirement === "PARTIAL_GATEWAY_REQUIRED") {
    return "PARTIALLY_COVERED_BY_WALLET";
  }

  return "UNPAID";
}

export function isPaidConfirmedSession(conversation: ConversationFixture) {
  return (
    (conversation.status === "confirmed" || conversation.status === "completed") &&
    !conversation.freeHelp &&
    getPaymentStatus(conversation) === "PAID"
  );
}

export function getConversationScheduledEndAt(conversation: ConversationFixture) {
  if (!conversation.selectedTime?.startAt) {
    return null;
  }

  return addMinutes(conversation.selectedTime.startAt, conversation.duration);
}

export function hasConversationScheduledEndPassed(conversation: ConversationFixture, now = reliabilityMockNow) {
  const scheduledEndAt = getConversationScheduledEndAt(conversation);

  if (!scheduledEndAt) {
    return false;
  }

  return new Date(scheduledEndAt).getTime() <= new Date(now).getTime();
}

export function hasConversationStarted(conversation: ConversationFixture, now = reliabilityMockNow) {
  if (!conversation.selectedTime?.startAt) {
    return false;
  }

  return new Date(conversation.selectedTime.startAt).getTime() <= new Date(now).getTime();
}

export function getAttendanceVerificationStatus(conversation: ConversationFixture, now = reliabilityMockNow): AttendanceVerificationStatus {
  if (!isPaidConfirmedSession(conversation)) {
    return "NOT_REQUIRED";
  }

  if (conversation.attendanceVerificationStatus === "VERIFIED") {
    return "VERIFIED";
  }

  if (conversation.attendanceVerificationStatus === "NEEDS_REVIEW") {
    return "NEEDS_REVIEW";
  }

  if (
    conversation.attendanceVerificationCodeExpiresAt &&
    new Date(conversation.attendanceVerificationCodeExpiresAt).getTime() <= new Date(now).getTime()
  ) {
    return "EXPIRED";
  }

  if ((conversation.attendanceVerificationAttempts ?? 0) >= ATTENDANCE_VERIFICATION_MAX_ATTEMPTS) {
    return "NEEDS_REVIEW";
  }

  return conversation.attendanceVerificationStatus ?? "PENDING";
}

export function getAttendanceVerificationCodeForRequester(conversation: ConversationFixture, now = reliabilityMockNow) {
  if (conversation.direction !== "outgoing") {
    return null;
  }

  if (getAttendanceVerificationStatus(conversation, now) !== "PENDING") {
    return null;
  }

  return conversation.attendanceVerificationCode ?? null;
}

export function shouldShowAttendanceVerificationFlow(conversation: ConversationFixture, now = reliabilityMockNow) {
  return isPaidConfirmedSession(conversation) && getAttendanceVerificationStatus(conversation, now) === "PENDING";
}

export function isAttendanceVerificationProviderActionRequired(conversation: ConversationFixture, now = reliabilityMockNow) {
  return conversation.direction === "incoming" && shouldShowAttendanceVerificationFlow(conversation, now) && hasConversationStarted(conversation, now);
}

export function isAttendanceVerificationRequesterActionAvailable(conversation: ConversationFixture, now = reliabilityMockNow) {
  return conversation.direction === "outgoing" && shouldShowAttendanceVerificationFlow(conversation, now);
}

export function getAttendanceVerificationCardHelper(conversation: ConversationFixture, now = reliabilityMockNow) {
  const status = getAttendanceVerificationStatus(conversation, now);

  if (!isPaidConfirmedSession(conversation)) {
    return "";
  }

  if (status === "VERIFIED") {
    return attendanceVerificationCopy.verifiedBadge;
  }

  if (status !== "PENDING") {
    return "";
  }

  if (conversation.direction === "incoming") {
    return hasConversationStarted(conversation, now) ? attendanceVerificationCopy.providerCardAfterStart : attendanceVerificationCopy.providerCard;
  }

  return hasConversationStarted(conversation, now) ? attendanceVerificationCopy.requesterCardAfterStart : attendanceVerificationCopy.requesterCard;
}

export function getConversationCardStatusLabel(conversation: ConversationFixture, now = reliabilityMockNow) {
  const attendanceStatus = getAttendanceVerificationStatus(conversation, now);

  if (attendanceStatus === "VERIFIED") {
    return attendanceVerificationCopy.verifiedBadge;
  }

  if (isAttendanceVerificationProviderActionRequired(conversation, now)) {
    return attendanceVerificationCopy.providerNeedsActionStatus;
  }

  return getConversationStatusLabel(conversation);
}

function getPayoutStatusAfterVerification(conversation: ConversationFixture, now = reliabilityMockNow): ProviderPayoutStatus {
  if (!hasConversationScheduledEndPassed(conversation, now)) {
    return "NOT_READY";
  }

  if (conversation.providerSettlementInfoComplete === false) {
    return "BLOCKED_MISSING_SETTLEMENT_INFO";
  }

  return "PENDING_24H";
}

export function getProviderPayoutStatus(conversation: ConversationFixture, now = reliabilityMockNow): ProviderPayoutStatus {
  if (!isPaidConfirmedSession(conversation) || getAttendanceVerificationStatus(conversation, now) !== "VERIFIED") {
    return "NOT_READY";
  }

  if (conversation.providerPayoutStatus && conversation.providerPayoutStatus !== "NOT_READY") {
    return conversation.providerPayoutStatus;
  }

  return getPayoutStatusAfterVerification(conversation, now);
}

function normalizeVerificationCodeInput(code: string) {
  return code
    .trim()
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
}

function withAttendanceVerificationOnConfirmation(conversation: ConversationFixture, now = reliabilityMockNow): ConversationFixture {
  if (!isPaidConfirmedSession(conversation)) {
    return {
      ...conversation,
      attendanceVerificationCode: null,
      attendanceVerificationCodeHash: null,
      attendanceVerificationStatus: "NOT_REQUIRED",
      attendanceVerificationAttempts: 0,
      providerPayoutStatus: "NOT_READY"
    };
  }

  const code = generateAttendanceVerificationCode();

  return {
    ...conversation,
    attendanceVerificationCode: code,
    attendanceVerificationCodeHash: hashAttendanceVerificationCode(code, conversation.id),
    attendanceVerificationCodeGeneratedAt: now,
    attendanceVerificationCodeExpiresAt: addHours(now, 72),
    attendanceVerificationStatus: "PENDING",
    attendanceVerificationAttempts: 0,
    attendanceVerifiedAt: null,
    attendanceVerifiedByProviderId: null,
    providerPayoutStatus: "NOT_READY",
    providerPayoutAvailableAt: null,
    providerPayoutProcessedAt: null,
    providerSettlementInfoComplete: conversation.providerSettlementInfoComplete ?? true
  };
}

export function verifySessionAttendanceCode(
  conversation: ConversationFixture,
  code: string,
  providerId = conversation.providerId,
  now = reliabilityMockNow
): { conversation: ConversationFixture; success: boolean; message: string } {
  const currentStatus = getAttendanceVerificationStatus(conversation, now);

  if (!isPaidConfirmedSession(conversation) || providerId !== conversation.providerId) {
    return {
      conversation,
      success: false,
      message: attendanceVerificationCopy.inactive
    };
  }

  if (currentStatus === "VERIFIED") {
    return {
      conversation,
      success: false,
      message: attendanceVerificationCopy.alreadyVerified
    };
  }

  if (currentStatus === "EXPIRED" || currentStatus === "NEEDS_REVIEW") {
    return {
      conversation: {
        ...conversation,
        attendanceVerificationStatus: currentStatus
      },
      success: false,
      message: currentStatus === "EXPIRED" ? attendanceVerificationCopy.expired : attendanceVerificationCopy.needsReview
    };
  }

  const normalizedCode = normalizeVerificationCodeInput(code);
  const expectedHash = conversation.attendanceVerificationCodeHash ?? "";
  const submittedHash = hashAttendanceVerificationCode(normalizedCode, conversation.id);

  if (normalizedCode.length !== 5 || submittedHash !== expectedHash) {
    const attempts = (conversation.attendanceVerificationAttempts ?? 0) + 1;
    const nextStatus: AttendanceVerificationStatus = attempts >= ATTENDANCE_VERIFICATION_MAX_ATTEMPTS ? "NEEDS_REVIEW" : "FAILED";

    return {
      conversation: {
        ...conversation,
        attendanceVerificationAttempts: attempts,
        attendanceVerificationStatus: nextStatus
      },
      success: false,
      message: nextStatus === "NEEDS_REVIEW" ? attendanceVerificationCopy.needsReview : attendanceVerificationCopy.wrongCode
    };
  }

  const providerPayoutStatus = getPayoutStatusAfterVerification(conversation, now);
  const scheduledEndAt = getConversationScheduledEndAt(conversation);

  return {
    conversation: {
      ...conversation,
      attendanceVerificationStatus: "VERIFIED",
      attendanceVerificationAttempts: conversation.attendanceVerificationAttempts ?? 0,
      attendanceVerifiedAt: now,
      attendanceVerifiedByProviderId: providerId,
      providerPayoutStatus,
      providerPayoutAvailableAt: providerPayoutStatus === "PENDING_24H" ? addHours(scheduledEndAt ?? now, 24) : null
    },
    success: true,
    message: attendanceVerificationCopy.verifiedTitle
  };
}

export function getRequestStatus(conversation: ConversationFixture): RequestStatus {
  const resolvedConversation = applyExpiration(conversation);

  switch (resolvedConversation.status) {
    case "pending_payment":
    case "payment_not_required":
      return "AWAITING_PAYMENT";
    case "pending_provider_response":
      return "AWAITING_TIME_PROPOSAL";
    case "new_time_requested":
      return "AWAITING_TIME_REPROPOSAL";
    case "times_proposed":
      return "TIME_OPTIONS_SENT";
    case "confirmed":
      return "SCHEDULED";
    case "completed":
      return "COMPLETED";
    case "rejected":
      return "REJECTED";
    case "cancelled":
      return "CANCELLED";
    case "expired":
      return "EXPIRED";
    case "refunded":
      return "REFUNDED";
    case "payment_processing":
      return "AWAITING_PAYMENT";
  }
}

export function getFundStatus(conversation: ConversationFixture): FundStatus {
  const paymentStatus = getPaymentStatus(conversation);

  if (conversation.status === "refunded") {
    return "RETURNED_TO_REQUESTER";
  }

  if (getProviderPayoutStatus(conversation) === "PENDING_24H") {
    return "RELEASE_PENDING";
  }

  if (getProviderPayoutStatus(conversation) === "PAID") {
    return "RELEASED_TO_PROVIDER";
  }

  if (paymentStatus === "PAID") {
    return "HELD_BY_USERAVAA";
  }

  return "NONE";
}

function isCheckoutPendingConversation(conversation: Pick<ConversationFixture, "status">) {
  return conversation.status === "pending_payment" || conversation.status === "payment_not_required";
}

function isPreProviderCheckoutConversation(conversation: Pick<ConversationFixture, "status" | "selectedTimeId">) {
  return isCheckoutPendingConversation(conversation) && !conversation.selectedTimeId;
}

export function resolveConversationAction(conversation: ConversationFixture): ConversationAction {
  const resolvedConversation = applyExpiration(conversation);
  const role = getViewerRole(resolvedConversation);
  const flow = mapToCanonicalFlow(resolvedConversation);

  if (flow === "REQUEST_CREATED_BY_REQUESTER") {
    if (role === "REQUESTER" && isPreProviderCheckoutConversation(resolvedConversation)) {
      return {
        kind: "checkout",
        label: resolvedConversation.freeHelp || getConversationPrice(resolvedConversation) === 0 ? "ارسال درخواست جلسه رایگان" : "پرداخت امن و ارسال درخواست",
        href: `/checkout/${resolvedConversation.id}`,
        tone: "primary"
      };
    }

    return createDisabledAction("پرداخت قبلاً انجام شده است", "ROUTE_STATE_MISMATCH");
  }

  if (flow === "WAITING_FOR_PROVIDER_TO_PROPOSE_TIMES") {
    return role === "PROVIDER"
      ? {
          kind: "propose_times",
          label: conversationReliabilityCopy.proposeTimesCta,
          href: `/conversations/${resolvedConversation.id}/propose-times`,
          tone: "primary"
        }
      : createDisabledAction("در انتظار پیشنهاد زمان", "WAITING_FOR_PROVIDER");
  }

  if (flow === "PROVIDER_PROPOSED_TIMES_WAITING_FOR_REQUESTER_SELECTION") {
    return role === "REQUESTER"
      ? {
          kind: "select_time",
          label: "انتخاب زمان",
          href: `/conversations/${resolvedConversation.id}/select-time`,
          tone: "primary"
        }
      : createDisabledAction("منتظر انتخاب زمان", "WAITING_FOR_REQUESTER");
  }

  if (flow === "REQUESTER_REQUESTED_NEW_TIMES") {
    return role === "PROVIDER"
      ? {
          kind: "propose_times",
          label: newTimeRequestCopy.providerActionTitle,
          href: `/conversations/${resolvedConversation.id}/propose-times`,
          tone: "primary"
        }
      : createDisabledAction(newTimeRequestCopy.requesterWaitingTitle, "WAITING_FOR_PROVIDER");
  }

  if (flow === "REQUEST_EXPIRED") {
    return {
      kind: "open",
      label: repeatRequestCtaLabel,
      href: getRepeatRequestHref(resolvedConversation),
      tone: "primary"
    };
  }

  if (flow === "PAYMENT_PROCESSING") {
    return {
      kind: "open",
      label: manualPaymentCopy.viewStatus,
      href: `/checkout/${resolvedConversation.id}`,
      tone: "secondary"
    };
  }

  if (isAttendanceVerificationProviderActionRequired(resolvedConversation)) {
    return {
      kind: "open",
      label: attendanceVerificationCopy.providerTitle,
      href: `/conversations/${resolvedConversation.id}#attendance-provider-title`,
      tone: "primary"
    };
  }

  if (isAttendanceVerificationRequesterActionAvailable(resolvedConversation)) {
    return {
      kind: "open",
      label: "مشاهده کد برگزاری",
      href: `/conversations/${resolvedConversation.id}#attendance-code-title`,
      tone: "secondary"
    };
  }

  return {
    kind: "open",
    label: "مشاهده جلسه",
    href: `/conversations/${resolvedConversation.id}`,
    tone: "secondary"
  };
}

export function getConversationRouteAccess(conversation: ConversationFixture, route: SessionRouteKind): SessionRouteAccess {
  const resolvedConversation = applyExpiration(conversation);
  const role = getViewerRole(resolvedConversation);
  const fallbackHref = `/conversations/${resolvedConversation.id}`;
  const flow = mapToCanonicalFlow(resolvedConversation);

  if (route === "sessionDetail") {
    return { allowed: true, fallbackHref };
  }

  if (flow === "REQUEST_EXPIRED") {
    return {
      allowed: false,
      fallbackHref,
      disabledReason: "REQUEST_EXPIRED",
      message: disabledReasonCopy.REQUEST_EXPIRED
    };
  }

  if (flow === "SESSION_CONFIRMED_CONTACT_UNLOCKED" || flow === "SESSION_COMPLETED_WAITING_FOR_FEEDBACK" || flow === "SESSION_COMPLETED_FEEDBACK_DONE") {
    return {
      allowed: false,
      fallbackHref,
      disabledReason: "SESSION_ALREADY_CONFIRMED",
      message: disabledReasonCopy.SESSION_ALREADY_CONFIRMED
    };
  }

  if (route === "proposeTimes") {
    if (role !== "PROVIDER") {
      return { allowed: false, fallbackHref, disabledReason: "ROLE_NOT_ALLOWED", message: disabledReasonCopy.ROLE_NOT_ALLOWED };
    }

    return flow === "WAITING_FOR_PROVIDER_TO_PROPOSE_TIMES" || flow === "REQUESTER_REQUESTED_NEW_TIMES" || canProviderReplaceProposedTimes(resolvedConversation)
      ? { allowed: true, fallbackHref }
      : { allowed: false, fallbackHref, disabledReason: "ROUTE_STATE_MISMATCH", message: disabledReasonCopy.ROUTE_STATE_MISMATCH };
  }

  if (route === "selectTime") {
    if (role !== "REQUESTER") {
      return { allowed: false, fallbackHref, disabledReason: "ROLE_NOT_ALLOWED", message: disabledReasonCopy.ROLE_NOT_ALLOWED };
    }

    return flow === "PROVIDER_PROPOSED_TIMES_WAITING_FOR_REQUESTER_SELECTION"
      ? { allowed: true, fallbackHref }
      : { allowed: false, fallbackHref, disabledReason: "ROUTE_STATE_MISMATCH", message: disabledReasonCopy.ROUTE_STATE_MISMATCH };
  }

  if (route === "checkout") {
    if (role !== "REQUESTER") {
      return { allowed: false, fallbackHref, disabledReason: "ROLE_NOT_ALLOWED", message: disabledReasonCopy.ROLE_NOT_ALLOWED };
    }

    if (resolvedConversation.selectedTimeId && !hasValidSelectedTime(resolvedConversation)) {
      return { allowed: false, fallbackHref, disabledReason: "NO_VALID_SELECTED_TIME", message: disabledReasonCopy.NO_VALID_SELECTED_TIME };
    }

    return flow === "REQUEST_CREATED_BY_REQUESTER" && isPreProviderCheckoutConversation(resolvedConversation)
      ? { allowed: true, fallbackHref }
      : { allowed: false, fallbackHref, disabledReason: "ROUTE_STATE_MISMATCH", message: disabledReasonCopy.ROUTE_STATE_MISMATCH };
  }

  return { allowed: false, fallbackHref, disabledReason: "ROUTE_STATE_MISMATCH", message: disabledReasonCopy.ROUTE_STATE_MISMATCH };
}

export function getConversationStatusLabel(conversation: ConversationFixture) {
  if (conversation.status === "pending_provider_response" && conversation.direction === "incoming") {
    return "درخواست پرداخت‌شده";
  }

  if (conversation.status === "pending_provider_response") {
    return conversationReliabilityCopy.waitingProviderTitle;
  }

  if (conversation.status === "times_proposed" && conversation.direction === "outgoing") {
    if ((conversation.timeOptionsVersion ?? 1) > 1) {
      return providerTimeReplacementCopy.requesterTitle;
    }

    return "زمان‌های پیشنهادی آماده انتخاب‌اند";
  }

  if (conversation.status === "times_proposed") {
    if ((conversation.timeOptionsVersion ?? 1) > 1) {
      return providerTimeReplacementCopy.providerStatusTitle;
    }

    return "زمان‌ها ارسال شده‌اند";
  }

  if (conversation.status === "new_time_requested") {
    return conversation.direction === "incoming" ? newTimeRequestCopy.providerTitle : newTimeRequestCopy.requesterWaitingTitle;
  }

  if (conversation.status === "rejected") {
    return getRejectedStatusTitle(conversation);
  }

  if (conversation.status === "cancelled") {
    return getCancellationStatusTitle(conversation);
  }

  const labels: Record<ConversationRequestStatus, string> = {
    pending_provider_response: "در انتظار پیشنهاد زمان",
    times_proposed: "زمان‌ها ارسال شدند",
    new_time_requested: "در انتظار زمان‌های جدید",
    pending_payment: "پرداخت امن",
    payment_not_required: "در انتظار پیشنهاد زمان",
    payment_processing: conversation.manualPaymentStatus === "SUBMITTED" ? manualPaymentCopy.pendingStatus : "پرداخت در حال بررسی",
    confirmed: "جلسه قطعی",
    completed: "تکمیل‌شده",
    rejected: "رد شده",
    expired: "منقضی شده",
    cancelled: "لغو شده",
    refunded: "بازگشت وجه"
  };

  return labels[conversation.status];
}

export function getConversationMessage(conversation: ConversationFixture) {
  const name = getPersonName(conversation);

  if (conversation.status === "pending_provider_response" && conversation.direction === "incoming") {
    return `${name} می‌خواهد درباره «${conversation.requestTopic ?? "موضوع گفت‌وگو"}» با شما گفت‌وگو کند.`;
  }

  if (conversation.status === "pending_provider_response") {
    return conversation.freeHelp
      ? `درخواست جلسه رایگان شما برای ${name} ارسال شد و منتظر اعلام سه زمان پیشنهادی است.`
      : `درخواست شما برای ${name} ارسال شد و منتظر اعلام سه زمان پیشنهادی است.`;
  }

  if (conversation.status === "times_proposed" && conversation.direction === "outgoing") {
    if ((conversation.timeOptionsVersion ?? 1) > 1) {
      return providerTimeReplacementCopy.requesterDescription;
    }

    return `${conversationReliabilityCopy.timesReadyTitle}. ${conversationReliabilityCopy.timesReadyBody}`;
  }

  if (conversation.status === "times_proposed") {
    if ((conversation.timeOptionsVersion ?? 1) > 1) {
      return providerTimeReplacementCopy.providerStatusDescription;
    }

    return `در انتظار انتخاب زمان توسط ${name} هستی.`;
  }

  if (conversation.status === "new_time_requested") {
    return conversation.direction === "incoming" ? newTimeRequestCopy.providerDescription : newTimeRequestCopy.requesterWaitingDescription;
  }

  if (conversation.status === "pending_payment") {
    return `${conversationReliabilityCopy.pendingPaymentTitle}. ${conversationReliabilityCopy.pendingPaymentBody}`;
  }

  if (conversation.status === "payment_not_required") {
    return "این درخواست بدون پرداخت ارسال می‌شود.";
  }

  if (conversation.status === "payment_processing") {
    return conversation.manualPaymentStatus === "SUBMITTED"
      ? "اطلاعات پرداخت شما ثبت شده و در حال بررسی است. پس از تأیید پرداخت، درخواست برای تجربه‌آفرین ارسال می‌شود."
      : "پرداخت در حال بررسی است و پس از تایید، درخواست برای تجربه‌آفرین ارسال می‌شود.";
  }

  if (conversation.status === "confirmed") {
    if (conversation.selectedTime) {
      return conversation.direction === "incoming"
        ? `${name} زمان ${conversation.selectedTime.dateLabel}، ساعت ${conversation.selectedTime.timeLabel} را برای گفت‌وگو انتخاب کرده است.`
        : `جلسه شما با ${name} برای ${conversation.selectedTime.dateLabel}، ساعت ${conversation.selectedTime.timeLabel} قطعی شده است.`;
    }

    return conversation.direction === "incoming" ? `جلسه با ${name} قطعی شده است.` : `جلسه شما با ${name} قطعی شده است.`;
  }

  if (conversation.status === "completed") {
    return `جلسه مشاوره با ${name} تکمیل شده است.`;
  }

  if (conversation.status === "rejected") {
    return getRejectedStatusDescription(conversation);
  }

  if (conversation.status === "cancelled") {
    return getCancellationStatusDescription(conversation);
  }

  if (conversation.status === "expired") {
    return conversationReliabilityCopy.expiredBody;
  }

  if (conversation.status === "refunded") {
    return "مبلغ این جلسه بازگشت داده شده است.";
  }

  return "جزئیات درخواست آماده است.";
}

export function getDeadlineText(conversation: ConversationFixture, now = reliabilityMockNow) {
  if (conversation.status === "pending_provider_response") {
    return `${formatter.format(hoursUntil(conversation.providerResponseDeadlineAt, now))} ساعت تا پایان مهلت پاسخ`;
  }

  if (conversation.status === "times_proposed" && conversation.requesterSelectionDeadlineAt) {
    return `${formatter.format(hoursUntil(conversation.requesterSelectionDeadlineAt, now))} ساعت تا پایان مهلت انتخاب زمان`;
  }

  return "";
}

export function isNearProviderExpiration(conversation: ConversationFixture, now = reliabilityMockNow) {
  return conversation.status === "pending_provider_response" && hoursUntil(conversation.providerResponseDeadlineAt, now) <= 3;
}

export function getNextActionText(conversation: ConversationFixture) {
  if (conversation.status === "pending_provider_response" && conversation.direction === "incoming") {
    return `این درخواست پرداخت‌شده است. دقیقاً سه زمان پیشنهاد بده یا درخواست را رد کن. ${getDeadlineText(conversation)}`;
  }

  if (conversation.status === "pending_provider_response") {
    return `${conversationReliabilityCopy.waitingProviderTitle}. ${conversationReliabilityCopy.waitingProviderBody}`;
  }

  if (conversation.status === "times_proposed" && conversation.direction === "outgoing") {
    if ((conversation.timeOptionsVersion ?? 1) > 1) {
      return providerTimeReplacementCopy.requesterDescription;
    }

    return `${conversationReliabilityCopy.timesReadyTitle}. ${conversationReliabilityCopy.timesReadyBody}`;
  }

  if (conversation.status === "times_proposed") {
    if ((conversation.timeOptionsVersion ?? 1) > 1) {
      return providerTimeReplacementCopy.providerStatusDescription;
    }

    return `در انتظار انتخاب زمان توسط ${getPersonName(conversation)}.`;
  }

  if (conversation.status === "new_time_requested") {
    return conversation.direction === "incoming" ? newTimeRequestCopy.providerActionDescription : newTimeRequestCopy.requesterDetailDescription;
  }

  if (conversation.status === "pending_payment") {
    return `${conversationReliabilityCopy.pendingPaymentTitle}. ${conversationReliabilityCopy.pendingPaymentBody}`;
  }

  if (conversation.status === "payment_not_required") {
    return "این درخواست بدون پرداخت ارسال می‌شود.";
  }

  if (conversation.status === "payment_processing") {
    return conversation.manualPaymentStatus === "SUBMITTED"
      ? "اطلاعات پرداخت شما ثبت شده و در حال بررسی است. پس از تأیید پرداخت، درخواست برای تجربه‌آفرین ارسال می‌شود."
      : "پرداخت در حال بررسی است. پس از تایید پرداخت، درخواست برای تجربه‌آفرین ارسال می‌شود.";
  }

  if (conversation.status === "confirmed") {
    return conversation.direction === "incoming"
      ? `جلسه شما با ${getPersonName(conversation)} قطعی شده است. جزئیات زمان و اطلاعات هماهنگی را در همین صفحه ببینید.`
      : `جلسه شما با ${getPersonName(conversation)} قطعی شده است. جزئیات زمان و اطلاعات هماهنگی را در همین صفحه ببینید.`;
  }

  if (conversation.status === "completed") {
    return "جلسه مشاوره تکمیل شده است و اطلاعات تماس برای سابقه جلسه در دسترس می‌ماند.";
  }

  if (conversation.status === "rejected") {
    return getRejectedStatusDescription(conversation);
  }

  if (conversation.status === "cancelled") {
    return getCancellationStatusDescription(conversation);
  }

  if (conversation.status === "expired") {
    return conversationReliabilityCopy.expiredBody;
  }

  if (conversation.status === "refunded") {
    return "مبلغ این جلسه بازگشت داده شده است و جلسه در وضعیت بسته قرار دارد.";
  }

  return "وضعیت درخواست را پیگیری کن.";
}

export function shouldShowAmountInConversationList(conversation: Pick<ConversationFixture, "direction">) {
  return conversation.direction === "incoming";
}

export function getConversationListPaymentLabel(conversation: ConversationFixture) {
  if (shouldShowAmountInConversationList(conversation)) {
    return `مبلغ گفت‌وگو · ${formatPrice(conversation)}`;
  }

  const paymentStatus = getPaymentStatus(conversation);

  if (conversation.freeHelp || paymentStatus === "NOT_REQUIRED") {
    return "رایگان";
  }

  if (paymentStatus === "PENDING_REVIEW") {
    return manualPaymentCopy.pendingStatus;
  }

  if (paymentStatus === "FAILED") {
    return "پرداخت ناموفق";
  }

  if (
    paymentStatus === "PAID" ||
    conversation.status === "pending_provider_response" ||
    conversation.status === "times_proposed" ||
    conversation.status === "new_time_requested" ||
    conversation.status === "confirmed"
  ) {
    return "درخواست پرداخت‌شده";
  }

  return "نیازمند پرداخت";
}

export function getConversationListGroup(conversation: ConversationFixture): ConversationStatusSectionKey {
  if (conversation.status === "cancelled" && conversation.cancellationReviewStatus === "PENDING_SUPPORT_REVIEW") {
    return "inProgress";
  }

  if (isConfirmedSessionConversation(conversation)) {
    return "confirmedSessions";
  }

  if (isPastOrFeedbackConversation(conversation)) {
    return "history";
  }

  return "inProgress";
}

export function groupConversationStatusSections(items: readonly ConversationFixture[], direction: ConversationDirection) {
  const visibleItems = items.map((conversation) => applyExpiration(conversation)).filter((conversation) => isVisibleConversationForDirection(conversation, direction));

  return {
    inProgress: visibleItems.filter((conversation) => getConversationListGroup(conversation) === "inProgress"),
    confirmedSessions: visibleItems.filter((conversation) => getConversationListGroup(conversation) === "confirmedSessions"),
    history: visibleItems.filter((conversation) => getConversationListGroup(conversation) === "history")
  };
}

function actionDeadlineChip(conversation: ConversationFixture, prefix: string) {
  const deadlineText = getDeadlineText(conversation);

  if (!deadlineText) {
    return "";
  }

  const hourMatch = deadlineText.match(/^(.+?) ساعت تا پایان مهلت/);

  if (hourMatch) {
    return `${prefix}: ${hourMatch[1]} ساعت`;
  }

  return deadlineText;
}

function selectedSessionChip(conversation: ConversationFixture) {
  if (!conversation.selectedTime) {
    return "";
  }

  return `${conversation.selectedTime.dateLabel}، ساعت ${conversation.selectedTime.timeLabel}`;
}

export function resolveUserActions(items: readonly ConversationFixture[] = conversations): UserAction[] {
  const conversationActions = items
    .map((conversation) => applyExpiration(conversation))
    .flatMap<UserAction>((conversation) => {
      if (!isVisibleConversationForDirection(conversation, conversation.direction)) {
        return [];
      }

      const durationChip = formatDuration(conversation.duration);
      const personName = getPersonName(conversation);

      if (conversation.direction === "outgoing" && conversation.status === "times_proposed") {
        const hasProviderReplacementOptions = (conversation.timeOptionsVersion ?? 1) > 1;

        return [
          {
            id: `select-time-${conversation.id}`,
            title: hasProviderReplacementOptions ? providerTimeReplacementCopy.requesterCta : "انتخاب زمان جلسه",
            badge: "درخواست ارسالی",
            urgency: "urgent",
            filter: "sessions",
            description: hasProviderReplacementOptions
              ? providerTimeReplacementCopy.requesterDescription
              : `${personName} سه زمان پیشنهادی فرستاده است. لطفاً یکی از زمان‌های معتبر را انتخاب کنید.`,
            chips: [durationChip, actionDeadlineChip(conversation, "مهلت انتخاب")].filter(Boolean),
            primaryCta: "انتخاب زمان",
            primaryHref: `/conversations/${conversation.id}/select-time`,
            secondaryCta: "جزئیات",
            secondaryHref: `/conversations/${conversation.id}`
          }
        ];
      }

      if (conversation.direction === "incoming" && conversation.status === "pending_provider_response") {
        return [
          {
            id: `propose-times-${conversation.id}`,
            title: "پیشنهاد سه زمان",
            badge: "درخواست دریافتی",
            urgency: "completion",
            filter: "sessions",
            description: `${personName} درخواست پرداخت‌شده‌ای برای گفت‌وگو فرستاده است. لطفاً سه زمان پیشنهادی ثبت کنید.`,
            chips: [durationChip, getConversationListPaymentLabel(conversation), actionDeadlineChip(conversation, "مهلت پاسخ")].filter(Boolean),
            primaryCta: "پیشنهاد سه زمان",
            primaryHref: `/conversations/${conversation.id}/propose-times`,
            secondaryCta: "جزئیات",
            secondaryHref: `/conversations/${conversation.id}`
          }
        ];
      }

      if (conversation.direction === "incoming" && conversation.status === "new_time_requested") {
        return [
          {
            id: `propose-new-times-${conversation.id}`,
            title: newTimeRequestCopy.providerActionTitle,
            badge: "درخواست دریافتی",
            urgency: "completion",
            filter: "sessions",
            description: newTimeRequestCopy.providerActionDescription,
            chips: [durationChip, getConversationListPaymentLabel(conversation)].filter(Boolean),
            primaryCta: newTimeRequestCopy.providerCta,
            primaryHref: `/conversations/${conversation.id}/propose-times`,
            secondaryCta: "جزئیات",
            secondaryHref: `/conversations/${conversation.id}`
          }
        ];
      }

      if (conversation.direction === "outgoing" && conversation.status === "pending_payment") {
        const rejected = conversation.manualPaymentStatus === "REJECTED";

        return [
          {
            id: `payment-${conversation.id}`,
            title: rejected ? "ثبت دوباره پرداخت" : "ثبت اطلاعات پرداخت",
            badge: "پرداخت",
            urgency: rejected ? "urgent" : "completion",
            filter: "payment",
            description: rejected
              ? "پرداخت ثبت‌شده تأیید نشد. لطفاً اطلاعات پرداخت را دوباره ثبت کنید."
              : "پس از واریز، لطفاً شماره مرجع/ارجاع یا تصویر رسید پرداخت را ثبت کنید.",
            chips: [durationChip, rejected ? "پرداخت ناموفق" : "کارت‌به‌کارت"],
            primaryCta: rejected ? manualPaymentCopy.resubmit : manualPaymentCopy.submit,
            primaryHref: `/checkout/${conversation.id}`,
            secondaryCta: "جزئیات",
            secondaryHref: `/conversations/${conversation.id}`
          }
        ];
      }

      if (conversation.direction === "outgoing" && conversation.status === "payment_processing" && conversation.manualPaymentStatus === "SUBMITTED") {
        return [
          {
            id: `payment-review-${conversation.id}`,
            title: "پیگیری تأیید پرداخت",
            badge: "پرداخت",
            urgency: "completion",
            filter: "payment",
            description: "اطلاعات پرداخت شما ثبت شده و در حال بررسی است. وضعیت را از همین مسیر پیگیری کنید.",
            chips: [manualPaymentCopy.pendingStatus],
            primaryCta: manualPaymentCopy.viewStatus,
            primaryHref: `/checkout/${conversation.id}`,
            secondaryCta: "جزئیات",
            secondaryHref: `/conversations/${conversation.id}`
          }
        ];
      }

      if (conversation.direction === "incoming" && isAttendanceVerificationProviderActionRequired(conversation)) {
        return [
          {
            id: `attendance-provider-${conversation.id}`,
            title: attendanceVerificationCopy.providerTitle,
            badge: "درخواست دریافتی",
            urgency: "urgent",
            filter: "sessions",
            description: `جلسه با ${personName} شروع شده یا برگزار شده است. لطفاً کد تأیید برگزاری را وارد کنید.`,
            chips: [selectedSessionChip(conversation), durationChip, getConversationListPaymentLabel(conversation)].filter(Boolean),
            primaryCta: attendanceVerificationCopy.providerTitle,
            primaryHref: `/conversations/${conversation.id}#attendance-provider-title`,
            secondaryCta: "مشاهده جلسه",
            secondaryHref: `/conversations/${conversation.id}`
          }
        ];
      }

      if (conversation.direction === "outgoing" && isAttendanceVerificationRequesterActionAvailable(conversation)) {
        return [
          {
            id: `attendance-requester-${conversation.id}`,
            title: "کد برگزاری جلسه را آماده داشته باشید",
            badge: "درخواست ارسالی",
            urgency: "today",
            filter: "sessions",
            description: `جلسه شما با ${personName} برگزار می‌شود. لطفاً کد تأیید برگزاری جلسه را در شروع گفت‌وگو با تجربه‌آفرین به اشتراک بگذارید.`,
            chips: [selectedSessionChip(conversation), durationChip].filter(Boolean),
            primaryCta: "مشاهده کد برگزاری",
            primaryHref: `/conversations/${conversation.id}#attendance-code-title`,
            secondaryCta: "مشاهده جلسه",
            secondaryHref: `/conversations/${conversation.id}`
          }
        ];
      }

      if (conversation.direction === "incoming" && shouldShowAttendanceVerificationFlow(conversation)) {
        return [
          {
            id: `attendance-provider-prepare-${conversation.id}`,
            title: "آماده دریافت کد برگزاری باشید",
            badge: "درخواست دریافتی",
            urgency: "today",
            filter: "sessions",
            description: `جلسه با ${personName} نزدیک است. لطفاً در شروع گفت‌وگو، کد تأیید برگزاری را از درخواست‌دهنده دریافت کنید.`,
            chips: [selectedSessionChip(conversation), durationChip, getConversationListPaymentLabel(conversation)].filter(Boolean),
            primaryCta: "مشاهده جلسه",
            primaryHref: `/conversations/${conversation.id}`
          }
        ];
      }

      return [];
    });

  const profileAndAccountActions: UserAction[] = [
    {
      id: "wallet-settlement-info",
      title: "تکمیل اطلاعات حساب",
      badge: "کیف پول",
      urgency: "completion",
      filter: "wallet",
      description: "برای پردازش تسویه جلسه‌های برگزارشده، لطفاً اطلاعات حساب خود را تکمیل کنید.",
      chips: ["اطلاعات تسویه"],
      primaryCta: "تکمیل اطلاعات حساب",
      primaryHref: "/wallet"
    },
    {
      id: "profile-needs-changes",
      title: "اصلاح پروفایل تجربه",
      badge: "پروفایل",
      urgency: "completion",
      filter: "profile",
      description: "برای فعال‌شدن پروفایل، لطفاً بخش‌های مشخص‌شده را اصلاح کنید.",
      chips: ["پروفایل تجربه"],
      primaryCta: "ادامه اصلاح پروفایل",
      primaryHref: "/profile/build"
    },
    {
      id: "account-info",
      title: "ویرایش اطلاعات حساب",
      badge: "حساب کاربری",
      urgency: "completion",
      filter: "profile",
      description: "برای کامل‌تر شدن حساب کاربری، لطفاً اطلاعات حساب خود را بررسی کنید.",
      chips: ["حساب کاربری"],
      primaryCta: "تکمیل اطلاعات حساب",
      primaryHref: "/settings"
    }
  ];

  const urgencyOrder: Record<UserActionUrgency, number> = {
    urgent: 0,
    today: 1,
    completion: 2
  };

  return [...conversationActions, ...profileAndAccountActions].sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);
}

export function bucketConversation(conversation: ConversationFixture): ConversationBucket {
  if (conversation.direction === "outgoing") {
    if (conversation.status === "times_proposed" || isPreProviderCheckoutConversation(conversation)) {
      return "needsAction";
    }

    if (
      conversation.status === "pending_provider_response" ||
      conversation.status === "payment_processing" ||
      conversation.status === "new_time_requested" ||
      (conversation.status === "cancelled" && conversation.cancellationReviewStatus === "PENDING_SUPPORT_REVIEW")
    ) {
      return "tracking";
    }

    return "done";
  }

  if (isAttendanceVerificationProviderActionRequired(conversation)) {
    return "needsAction";
  }

  if (conversation.status === "pending_provider_response" || conversation.status === "new_time_requested") {
    return "needsAction";
  }

  if (
    conversation.status === "times_proposed" ||
    conversation.status === "payment_processing"
  ) {
    return "tracking";
  }

  return "done";
}

export function isActionRequiredConversation(conversation: ConversationFixture) {
  if (isAttendanceVerificationProviderActionRequired(conversation)) {
    return true;
  }

  if (conversation.status === "pending_provider_response") {
    return conversation.direction === "incoming";
  }

  if (conversation.status === "new_time_requested") {
    return conversation.direction === "incoming";
  }

  if (conversation.status === "times_proposed" || isPreProviderCheckoutConversation(conversation)) {
    return conversation.direction === "outgoing";
  }

  return false;
}

export function isRequestStageConversation(conversation: ConversationFixture) {
  return (
    conversation.status === "pending_provider_response" ||
    conversation.status === "times_proposed" ||
    conversation.status === "new_time_requested" ||
    isPreProviderCheckoutConversation(conversation) ||
    conversation.status === "payment_processing"
  );
}

export function isConfirmedSessionConversation(conversation: ConversationFixture) {
  return conversation.status === "confirmed" || (conversation.status as string) === "scheduled";
}

export function isPastOrFeedbackConversation(conversation: ConversationFixture) {
  return (
    conversation.status === "completed" ||
    conversation.status === "rejected" ||
    conversation.status === "expired" ||
    conversation.status === "cancelled" ||
    conversation.status === "refunded"
  );
}

function isVisibleConversationForDirection(conversation: ConversationFixture, direction: ConversationDirection) {
  if (conversation.direction !== direction) {
    return false;
  }

  if (direction === "incoming" && (conversation.status === "pending_payment" || conversation.status === "payment_not_required" || conversation.status === "payment_processing")) {
    return false;
  }

  return true;
}

export function groupConversationSections(items: readonly ConversationFixture[], direction: ConversationDirection) {
  const visibleItems = items.map((conversation) => applyExpiration(conversation)).filter((conversation) => isVisibleConversationForDirection(conversation, direction));
  const needsAction = visibleItems.filter(isActionRequiredConversation);
  const needsActionIds = new Set(needsAction.map((conversation) => conversation.id));
  const requestStage = visibleItems.filter((conversation) => !needsActionIds.has(conversation.id) && isRequestStageConversation(conversation));

  return {
    needsAction,
    requestStage,
    inProgress: visibleItems.filter(isRequestStageConversation),
    confirmedSessions: visibleItems.filter((conversation) => !needsActionIds.has(conversation.id) && isConfirmedSessionConversation(conversation)),
    history: visibleItems.filter(isPastOrFeedbackConversation)
  };
}

export function groupConversations(items: readonly ConversationFixture[], direction: ConversationDirection) {
  const visibleItems = items.map((conversation) => applyExpiration(conversation)).filter((conversation) => isVisibleConversationForDirection(conversation, direction));

  return {
    needsAction: visibleItems.filter((conversation) => bucketConversation(conversation) === "needsAction"),
    tracking: visibleItems.filter((conversation) => bucketConversation(conversation) === "tracking"),
    done: visibleItems.filter((conversation) => bucketConversation(conversation) === "done")
  };
}

export function getPrimaryConversationAction(conversation: ConversationFixture): ConversationAction {
  return resolveConversationAction(conversation);
}

export function canCancelConversation(conversation: ConversationFixture) {
  return canRequesterCancelRequest(conversation);
}

export function canRejectConversation(conversation: ConversationFixture) {
  return canProviderRejectRequest(conversation);
}

export function getConversationActions(conversation: ConversationFixture) {
  const resolvedConversation = applyExpiration(conversation);
  const actions = [getPrimaryConversationAction(resolvedConversation)];

  if (canCancelConversation(resolvedConversation)) {
    actions.push({
      kind: "cancel",
      label: "لغو درخواست",
      tone: "danger"
    });
  }

  return actions;
}

export function createConversationRequest({
  profile,
  duration,
  note,
  topic,
  createdAt = reliabilityMockNow
}: {
  profile: ExperienceProfileFixture;
  duration: ConversationDuration;
  note: string;
  topic?: string;
  createdAt?: string;
}): ConversationFixture {
  return buildConversation({
    id: `mock-request-${profile.id}-${duration}`,
    requesterId: "user-requester",
    providerId: `provider-${profile.id}`,
    direction: "outgoing",
    status: getConversationPrice({ profile, duration }) === 0 ? "payment_not_required" : "pending_payment",
    profile,
    requesterName: "تو",
    requesterRole: "درخواست‌دهنده",
    duration,
    note,
    requestTopic: topic,
    createdAt,
    submittedAtLabel: "همین حالا ثبت شد",
    walletBalanceToman
  });
}

export function getMockRequestConversation(conversationId: string) {
  const match = /^mock-request-(.+)-(30|60)$/.exec(conversationId);

  if (!match) {
    return undefined;
  }

  const profile = getProfileById(match[1]);

  if (!profile) {
    return undefined;
  }

  return createConversationRequest({
    profile,
    duration: Number(match[2]) as ConversationDuration,
    note: ""
  });
}

export function hasDuplicateProposedTime(selectedTimes: readonly ProposedTime[], nextTime: ProposedTime) {
  return selectedTimes.some((time) => time.id === nextTime.id);
}

export function hasDuplicateProposedTimes(selectedTimes: readonly ProposedTime[]) {
  return new Set(selectedTimes.map((time) => `${time.date}-${time.time}`)).size !== selectedTimes.length;
}

export function getValidProposalTimeSlots(dateId: string | null, now = reliabilityMockNow) {
  if (!dateId) {
    return [];
  }

  return proposalTimeSlots.filter((slot) => {
    const proposedTime = makeProposedTime(dateId, slot);

    return (
      !isProposedTimeExpired(proposedTime, now) &&
      isProposedTimeAtLeastSixHoursAway(proposedTime, now) &&
      isProposedTimeWithinSevenDays(proposedTime, now) &&
      isProposedTimeWithinProviderWindow(proposedTime)
    );
  });
}

export function getValidProposalDateOptions(now = reliabilityMockNow) {
  return proposalDateOptions.filter((dateOption) => getValidProposalTimeSlots(dateOption.id, now).length > 0);
}

export function buildProposedTimesFromDrafts(drafts: readonly ProposedTimeDraft[], conversationId = "") {
  return drafts
    .filter((draft): draft is ProposedTimeDraft & { day: string; startTime: string } => Boolean(draft.day && draft.startTime))
    .map((draft) => makeProposedTime(draft.day, draft.startTime, conversationId));
}

export function toggleProposedTime(selectedTimes: readonly ProposedTime[], nextTime: ProposedTime) {
  if (hasDuplicateProposedTime(selectedTimes, nextTime)) {
    return selectedTimes.filter((time) => time.id !== nextTime.id);
  }

  if (selectedTimes.length >= 3) {
    return [...selectedTimes];
  }

  return [...selectedTimes, nextTime];
}

export function validateProposedTimes(selectedTimes: readonly ProposedTime[], conversationId?: string, now = reliabilityMockNow): ProposedTimesValidation {
  const errors: string[] = [];

  if (selectedTimes.length !== 3) {
    errors.push(conversationReliabilityCopy.minimumTimesError);
  }

  if (hasDuplicateProposedTimes(selectedTimes)) {
    errors.push(conversationReliabilityCopy.duplicateTimesError);
  }

  if (selectedTimes.some((time) => !time.date || !time.time)) {
    errors.push(conversationReliabilityCopy.minimumTimesError);
  }

  if (selectedTimes.some((time) => isProposedTimeExpired(time, now))) {
    errors.push(conversationReliabilityCopy.futureTimeError);
  }

  if (selectedTimes.some((time) => !isProposedTimeAtLeastSixHoursAway(time, now))) {
    errors.push(conversationReliabilityCopy.minimumLeadTimeError);
  }

  if (selectedTimes.some((time) => !isProposedTimeWithinSevenDays(time, now))) {
    errors.push(conversationReliabilityCopy.maximumProposalWindowError);
  }

  if (selectedTimes.some((time) => !isProposedTimeWithinProviderWindow(time))) {
    errors.push(conversationReliabilityCopy.providerTimeRangeError);
  }

  if (conversationId && selectedTimes.some((time) => time.conversationRequestId && time.conversationRequestId !== conversationId)) {
    errors.push("زمان پیشنهادی باید متعلق به همین درخواست باشد.");
  }

  return {
    valid: errors.length === 0 && selectedTimes.length === 3,
    errors
  };
}

export function validateProposedTimeDrafts(drafts: readonly ProposedTimeDraft[], conversationId?: string, now = reliabilityMockNow): ProposedTimesValidation {
  if (drafts.length !== 3 || drafts.some((draft) => !draft.day || !draft.startTime)) {
    return {
      valid: false,
      errors: [conversationReliabilityCopy.minimumTimesError]
    };
  }

  return validateProposedTimes(buildProposedTimesFromDrafts(drafts, conversationId), conversationId, now);
}

export function canSubmitProposedTimes(selectedTimes: readonly ProposedTime[]) {
  return validateProposedTimes(selectedTimes).valid;
}

export function proposeTimesForConversation(conversation: ConversationFixture, selectedTimes: readonly ProposedTime[], now = reliabilityMockNow): ConversationFixture {
  const validation = validateProposedTimes(selectedTimes, conversation.id, now);
  const isNewTimeProposal = conversation.status === "new_time_requested";

  if ((conversation.status !== "pending_provider_response" && !isNewTimeProposal) || !validation.valid) {
    return conversation;
  }

  const version = isNewTimeProposal ? conversation.timeOptionsVersion ?? 2 : conversation.timeOptionsVersion ?? 1;
  const normalizedTimes = withConversationId(selectedTimes, conversation.id).map((time) => ({
    ...time,
    status: "ACTIVE" as const,
    version
  }));

  return setConversationStatus(
    {
      ...conversation,
      providerRespondedAt: now,
      timesProposedAt: now,
      requesterSelectionDeadlineAt: addHours(now, 48),
      proposedAtLabel: isNewTimeProposal ? "سه زمان پیشنهادی جدید ثبت شد" : "سه زمان پیشنهادی ارسال شد",
      proposedTimes: normalizedTimes,
      timeOptionsStatus: "ACTIVE",
      timeOptionsVersion: version
    },
    "times_proposed"
  );
}

export function replaceProviderProposedTimesForConversation(
  conversation: ConversationFixture,
  selectedTimes: readonly ProposedTime[],
  providerId = conversation.providerId,
  now = reliabilityMockNow
): ConversationFixture {
  const resolvedConversation = applyExpiration(conversation, now);
  const validation = validateProposedTimes(selectedTimes, resolvedConversation.id, now);

  if (!canProviderReplaceProposedTimes(resolvedConversation, providerId, now) || !validation.valid) {
    return resolvedConversation;
  }

  const currentVersion = resolvedConversation.timeOptionsVersion ?? 1;
  const nextVersion = currentVersion + 1;
  const supersededTimes = resolvedConversation.proposedTimes.map((time) => ({
    ...time,
    isSelected: false,
    status: "SUPERSEDED" as const,
    version: time.version ?? currentVersion
  }));
  const normalizedTimes = withConversationId(selectedTimes, resolvedConversation.id).map((time, index) => ({
    ...time,
    id: `${resolvedConversation.id}-v${nextVersion}-${index + 1}-${time.id}`,
    isSelected: false,
    status: "ACTIVE" as const,
    version: nextVersion
  }));

  return setConversationStatus(
    {
      ...resolvedConversation,
      proposedTimes: [...supersededTimes, ...normalizedTimes],
      previousTimeOptions: [...(resolvedConversation.previousTimeOptions ?? []), ...supersededTimes],
      selectedTimeId: null,
      selectedTime: undefined,
      selectedAt: null,
      providerRespondedAt: resolvedConversation.providerRespondedAt ?? now,
      timesProposedAt: now,
      requesterSelectionDeadlineAt: addHours(now, 48),
      proposedAtLabel: "سه زمان پیشنهادی جدید ثبت شد",
      timeOptionsStatus: "ACTIVE",
      timeOptionsVersion: nextVersion,
      timeOptionsReplacedAt: now,
      timeOptionsReplacedByUserId: providerId
    },
    "times_proposed"
  );
}

export function requestNewTimesForConversation(
  conversation: ConversationFixture,
  note = "",
  requesterId = conversation.requesterId,
  now = reliabilityMockNow
): ConversationFixture {
  if (!canRequesterRequestNewTimes(conversation, requesterId, now)) {
    return applyExpiration(conversation, now);
  }

  const resolvedConversation = applyExpiration(conversation, now);
  const currentVersion = resolvedConversation.timeOptionsVersion ?? 1;
  const nextVersion = currentVersion + 1;
  const supersededTimes = resolvedConversation.proposedTimes.map((time) => ({
    ...time,
    isSelected: false,
    status: "SUPERSEDED" as const,
    version: time.version ?? currentVersion
  }));
  const previousTimeOptions = [
    ...(resolvedConversation.previousTimeOptions ?? []),
    ...supersededTimes
  ];

  return setConversationStatus(
    {
      ...resolvedConversation,
      proposedTimes: supersededTimes,
      previousTimeOptions,
      selectedTimeId: null,
      selectedTime: undefined,
      requesterSelectionDeadlineAt: null,
      providerResponseDeadlineAt: addHours(now, 24),
      timeOptionsStatus: "SUPERSEDED",
      timeOptionsVersion: nextVersion,
      newTimeRequestCount: (resolvedConversation.newTimeRequestCount ?? 0) + 1,
      newTimeRequestedAt: now,
      newTimeRequestedByUserId: requesterId,
      newTimeRequestNote: note.trim().slice(0, 200) || null
    },
    "new_time_requested"
  );
}

export function selectTimeForConversation(conversation: ConversationFixture, proposedTimeId: string, now = reliabilityMockNow): ConversationFixture {
  const current = applyExpiration(conversation, now);

  if (current.status !== "times_proposed") {
    return current;
  }

  const selectedTime = getActiveProposedTimes(current).find((time) => time.id === proposedTimeId && time.conversationRequestId === current.id);

  if (!selectedTime) {
    return current;
  }

  if (!isProposedTimeSelectableByRequester(selectedTime, now)) {
    return current;
  }

  const confirmedConversation = setConversationStatus(
    {
      ...current,
      selectedTimeId: selectedTime.id,
      selectedAt: now,
      confirmedAt: now,
      selectedTime: { ...selectedTime, isSelected: true, status: "SELECTED" as const },
      proposedTimes: current.proposedTimes.map((time) => ({
        ...time,
        isSelected: time.id === selectedTime.id && isActiveProposedTime(time, current),
        status: time.id === selectedTime.id && isActiveProposedTime(time, current) ? "SELECTED" as const : time.status
      }))
    },
    "confirmed"
  );

  return withAttendanceVerificationOnConfirmation(confirmedConversation, now);
}

export function cancelConversation(
  conversation: ConversationFixture,
  input: CancellationRecordInput = { reasonCode: "PREFER_NOT_TO_SAY", cancelledByRole: "REQUESTER" },
  now = reliabilityMockNow
): ConversationFixture {
  const cancelledAt = now;

  if (
    !canRequesterCancelRequest(conversation) &&
    input.cancelledByRole !== "PROVIDER" &&
    input.cancelledByRole !== "EXPERIENCE_CREATOR" &&
    input.cancelledByRole !== "PLATFORM" &&
    input.cancelledByRole !== "ADMIN_SUPPORT"
  ) {
    return conversation;
  }

  const cancelledByRole = input.cancelledByRole ?? "REQUESTER";
  const financials = calculateCancellationFinancials(conversation, cancelledByRole, cancelledAt, input.stageOverride);
  const requesterRefundWalletTransactionId = financials.refundAmount > 0 ? `wallet-credit-cancellation-${conversation.id}` : null;
  const providerCompensationWalletTransactionId =
    cancelledByRole === "REQUESTER" && financials.providerNetCompensation > 0 ? `wallet-credit-provider-compensation-${conversation.id}` : null;

  return setConversationStatus(
    {
      ...conversation,
      cancellationReasonCode: input.reasonCode,
      cancellationReasonText: input.reasonText?.trim() || null,
      cancelledByRole,
      cancellationStage: financials.stage,
      refundRate: financials.refundRate,
      refundAmount: financials.refundAmount,
      refundDestination: financials.refundDestination,
      providerGrossCompensation: financials.providerGrossCompensation,
      providerNetCompensation: financials.providerNetCompensation,
      useravaaFeeRate: financials.useravaaFeeRate,
      useravaaFeeAmount: financials.useravaaFeeAmount,
      providerCompensationWalletTransactionId,
      requesterRefundWalletTransactionId,
      isLateRequesterCancellation: financials.isLateRequesterCancellation,
      walletCreditId: requesterRefundWalletTransactionId,
      requestStatusBeforeCancel: conversation.status,
      paymentStatusBeforeCancel: getPaymentStatus(conversation),
      hasTimeOptions: conversation.proposedTimes.length > 0,
      hasConfirmedSession: isConfirmedSessionConversation(conversation),
      hoursUntilSession: getHoursUntilSession(conversation, cancelledAt),
      cancelledAt,
      cancellationReviewStatus: financials.requiresSupportReview ? "PENDING_SUPPORT_REVIEW" : "NOT_REQUIRED"
    },
    "cancelled"
  );
}

export function rejectConversationByProvider(
  conversation: ConversationFixture,
  input: ProviderRejectionInput = { reasonCode: "PREFER_NOT_TO_SAY" },
  now = reliabilityMockNow
): ConversationFixture {
  if (!canProviderRejectRequest(conversation, input.providerId ?? conversation.providerId) || !validateProviderRejectionReason(input.reasonCode)) {
    return conversation;
  }

  const refundAmount = getProviderSideRefundAmount(conversation);

  return setConversationStatus(
    {
      ...conversation,
      providerRespondedAt: now,
      rejectedAt: now,
      rejectedByRole: "EXPERIENCE_CREATOR",
      rejectionReasonCode: input.reasonCode,
      rejectionReasonText: input.reasonText?.trim() || null,
      providerCancellationStage: "BEFORE_TIME_PROPOSAL",
      refundRate: 1,
      refundAmount,
      refundDestination: "WALLET",
      walletCreditId: refundAmount > 0 ? `wallet-credit-provider-rejection-${conversation.id}` : null,
      requestStatusBeforeCancel: conversation.status,
      paymentStatusBeforeCancel: getPaymentStatus(conversation),
      hasTimeOptions: false,
      hasConfirmedSession: false,
      requiresSupportReview: false,
      cancellationReviewStatus: "NOT_REQUIRED"
    },
    "rejected"
  );
}

export function cancelConversationByProvider(
  conversation: ConversationFixture,
  input: ProviderCancellationInput = { reasonCode: "PREFER_NOT_TO_SAY" },
  now = reliabilityMockNow
): ConversationFixture {
  const providerId = input.providerId ?? conversation.providerId;
  const canCancelBeforeSelection = canProviderCancelRequestBeforeSelection(conversation, providerId);
  const canCancelConfirmed = canProviderCancelConfirmedSession(conversation, providerId);

  if ((!canCancelBeforeSelection && !canCancelConfirmed) || !validateProviderCancellationReason(input.reasonCode)) {
    return conversation;
  }

  const providerCancellationStage = getProviderCancellationStage(conversation, now);
  const requiresSupportReview = providerCancellationStage === "NEAR_SESSION_START";
  const refundAmount = getProviderSideRefundAmount(conversation);
  const currentVersion = conversation.timeOptionsVersion ?? 1;
  const closedProposedTimes = canCancelBeforeSelection
    ? conversation.proposedTimes.map((time) => ({
        ...time,
        isSelected: false,
        status: "SUPERSEDED" as const,
        version: time.version ?? currentVersion
      }))
    : conversation.proposedTimes;

  return setConversationStatus(
    {
      ...conversation,
      proposedTimes: closedProposedTimes,
      timeOptionsStatus: canCancelBeforeSelection ? "SUPERSEDED" : conversation.timeOptionsStatus,
      previousTimeOptions: canCancelBeforeSelection
        ? [...(conversation.previousTimeOptions ?? []), ...closedProposedTimes]
        : conversation.previousTimeOptions,
      cancellationReasonCode: null,
      cancellationReasonText: null,
      cancelledByRole: "EXPERIENCE_CREATOR",
      cancellationStage: "PROVIDER_FAULT",
      providerCancellationReasonCode: input.reasonCode,
      providerCancellationReasonText: input.reasonText?.trim() || null,
      providerCancelledAt: now,
      providerCancellationStage,
      refundRate: 1,
      refundAmount,
      refundDestination: "WALLET",
      walletCreditId: refundAmount > 0 ? `wallet-credit-provider-cancellation-${conversation.id}` : null,
      requestStatusBeforeCancel: conversation.status,
      paymentStatusBeforeCancel: getPaymentStatus(conversation),
      hasTimeOptions: conversation.proposedTimes.length > 0,
      hasConfirmedSession: isConfirmedSessionConversation(conversation),
      hoursUntilSession: getHoursUntilSession(conversation, now),
      cancelledAt: now,
      requiresSupportReview,
      cancellationReviewStatus: requiresSupportReview ? "PENDING_SUPPORT_REVIEW" : "NOT_REQUIRED",
      attendanceVerificationStatus: canCancelConfirmed ? "NOT_REQUIRED" : conversation.attendanceVerificationStatus
    },
    "cancelled"
  );
}

export function rejectConversation(conversation: ConversationFixture, now = reliabilityMockNow): ConversationFixture {
  return rejectConversationByProvider(conversation, { reasonCode: "PREFER_NOT_TO_SAY" }, now);
}

export function applyExpiration(conversation: ConversationFixture, now = reliabilityMockNow): ConversationFixture {
  const nowTime = new Date(now).getTime();

  if (
    (conversation.status === "pending_provider_response" || conversation.status === "new_time_requested") &&
    nowTime >= new Date(conversation.providerResponseDeadlineAt).getTime()
  ) {
    return expireConversation(conversation, now);
  }

  if (
    (conversation.status === "times_proposed" || conversation.status === "pending_payment" || conversation.status === "payment_not_required") &&
    conversation.requesterSelectionDeadlineAt &&
    isRequesterSelectionExpired(conversation, now)
  ) {
    return expireConversation(conversation, now);
  }

  if (isCheckoutPendingConversation(conversation)) {
    const selectedTime = getSelectedProposedTime(conversation);

    if (selectedTime && isProposedTimeExpired(selectedTime, now)) {
      return expireConversation(conversation, now);
    }
  }

  return conversation;
}

export function expireConversation(conversation: ConversationFixture, now = reliabilityMockNow): ConversationFixture {
  if (
    conversation.status === "confirmed" ||
    conversation.status === "completed" ||
    conversation.status === "rejected" ||
    conversation.status === "cancelled" ||
    conversation.status === "expired" ||
    conversation.status === "refunded"
  ) {
    return conversation;
  }

  return setConversationStatus(
    {
      ...conversation,
      expiredAt: now
    },
    "expired"
  );
}

export function expirePendingProviderRequests(items: readonly ConversationFixture[], now = reliabilityMockNow) {
  return items.map((conversation) =>
    (conversation.status === "pending_provider_response" || conversation.status === "new_time_requested") &&
    new Date(now).getTime() >= new Date(conversation.providerResponseDeadlineAt).getTime()
      ? expireConversation(conversation, now)
      : conversation
  );
}

export function expireProposedTimes(items: readonly ConversationFixture[], now = reliabilityMockNow) {
  return items.map((conversation) =>
    conversation.status === "times_proposed" &&
    conversation.requesterSelectionDeadlineAt &&
    isRequesterSelectionExpired(conversation, now)
      ? expireConversation(conversation, now)
      : conversation
  );
}

export function calculateCheckout(conversation: ConversationFixture, walletBalance = conversation.walletBalanceToman ?? walletBalanceToman) {
  const resolvedConversation = applyExpiration(conversation);
  const price = getConversationPrice(resolvedConversation);
  const role = getViewerRole(resolvedConversation);
  const checkoutState = isPreProviderCheckoutConversation(resolvedConversation);
  const noPaymentRequired = resolvedConversation.status === "payment_not_required" || resolvedConversation.freeHelp || price === 0;
  const paymentEnabled = role === "REQUESTER" && checkoutState;
  const walletDeduction = paymentEnabled && !noPaymentRequired ? Math.min(price, walletBalance) : 0;
  const gatewayPayable = paymentEnabled && !noPaymentRequired ? Math.max(price - walletDeduction, 0) : 0;
  const paymentRequirement = getPaymentRequirement(resolvedConversation, walletBalance);
  const paymentStatus = getPaymentStatus(resolvedConversation, walletBalance);
  const requestStatus = getRequestStatus(resolvedConversation);
  const fundStatus = getFundStatus(resolvedConversation);
  const disabledReason =
    paymentEnabled
      ? ""
      : resolvedConversation.status === "expired"
        ? expiredTimeSelectionMessage
        : resolvedConversation.selectedTimeId && !hasValidSelectedTime(resolvedConversation)
            ? disabledReasonCopy.NO_VALID_SELECTED_TIME
            : conversationReliabilityCopy.paymentUnavailable;

  return {
    price,
    walletBalance,
    walletDeduction,
    gatewayPayable,
    requiresGateway: gatewayPayable > 0,
    isFreeHelp: noPaymentRequired,
    requestStatus,
    paymentRequirement,
    paymentStatus,
    fundStatus,
    finalizationRequiresPayment: paymentEnabled && !noPaymentRequired,
    paymentEnabled,
    disabledReason
  };
}

export function payConversation(conversation: ConversationFixture, now = reliabilityMockNow): ConversationFixture {
  const resolvedConversation = applyExpiration(conversation, now);
  const checkout = calculateCheckout(resolvedConversation);

  if (!checkout.paymentEnabled) {
    return resolvedConversation;
  }

  return setConversationStatus(
    {
      ...resolvedConversation,
      paidAt: checkout.finalizationRequiresPayment ? now : resolvedConversation.paidAt ?? null,
      providerResponseDeadlineAt: addHours(now, 24)
    },
    "pending_provider_response"
  );
}

export function submitManualPaymentForReview(
  conversation: ConversationFixture,
  input: SubmitManualPaymentInput,
  now = reliabilityMockNow
): ManualPaymentActionResult {
  const resolvedConversation = applyExpiration(conversation, now);
  const checkout = calculateCheckout(resolvedConversation);
  const validation = validateManualPaymentInput(input);

  if (checkout.isFreeHelp || !checkout.paymentEnabled || getViewerRole(resolvedConversation) !== "REQUESTER") {
    return {
      conversation: resolvedConversation,
      success: false,
      message: checkout.disabledReason || conversationReliabilityCopy.paymentUnavailable
    };
  }

  if (!validation.valid) {
    return {
      conversation: resolvedConversation,
      success: false,
      message: validation.message
    };
  }

  const receipt = input.receipt ?? null;
  const updatedConversation = setConversationStatus(
    {
      ...resolvedConversation,
      paymentMethod: "CARD_TO_CARD",
      manualPaymentStatus: "SUBMITTED",
      manualPaymentReferenceNumber: validation.normalizedReference || null,
      manualPaymentReceiptUrl: receipt?.url ?? null,
      manualPaymentReceiptFileName: receipt?.fileName ?? null,
      manualPaymentReceiptMimeType: receipt?.mimeType ?? null,
      manualPaymentReceiptSize: receipt?.size ?? null,
      manualPaymentSubmittedAt: now,
      manualPaymentReviewedAt: null,
      manualPaymentReviewedByAdminId: null,
      manualPaymentAdminNote: null
    },
    "payment_processing"
  );

  return {
    conversation: updatedConversation,
    success: true,
    message: manualPaymentCopy.submittedTitle
  };
}

export function approveManualPayment(
  conversation: ConversationFixture,
  adminId = "admin-useravaa",
  now = reliabilityMockNow
): ManualPaymentActionResult {
  const resolvedConversation = applyExpiration(conversation, now);

  if (resolvedConversation.paymentMethod !== "CARD_TO_CARD" || resolvedConversation.manualPaymentStatus !== "SUBMITTED") {
    return {
      conversation: resolvedConversation,
      success: false,
      message: manualPaymentCopy.adminPending
    };
  }

  const updatedConversation = setConversationStatus(
    {
      ...resolvedConversation,
      manualPaymentStatus: "APPROVED",
      manualPaymentReviewedAt: now,
      manualPaymentReviewedByAdminId: adminId,
      manualPaymentAdminNote: null,
      paidAt: now,
      providerResponseDeadlineAt: addHours(now, 24)
    },
    "pending_provider_response"
  );

  return {
    conversation: updatedConversation,
    success: true,
    message: manualPaymentCopy.approvedTitle
  };
}

export function rejectManualPayment(
  conversation: ConversationFixture,
  adminNote = "",
  adminId = "admin-useravaa",
  now = reliabilityMockNow
): ManualPaymentActionResult {
  const resolvedConversation = applyExpiration(conversation, now);

  if (resolvedConversation.paymentMethod !== "CARD_TO_CARD" || resolvedConversation.manualPaymentStatus !== "SUBMITTED") {
    return {
      conversation: resolvedConversation,
      success: false,
      message: manualPaymentCopy.adminPending
    };
  }

  const updatedConversation = setConversationStatus(
    {
      ...resolvedConversation,
      manualPaymentStatus: "REJECTED",
      manualPaymentReviewedAt: now,
      manualPaymentReviewedByAdminId: adminId,
      manualPaymentAdminNote: adminNote.trim() || null,
      paidAt: null
    },
    "pending_payment"
  );

  return {
    conversation: updatedConversation,
    success: true,
    message: manualPaymentCopy.rejectedTitle
  };
}

export function getManualPaymentStatusLabel(conversation: ConversationFixture) {
  switch (conversation.manualPaymentStatus) {
    case "SUBMITTED":
    case "NEEDS_REVIEW":
      return manualPaymentCopy.adminPending;
    case "APPROVED":
      return manualPaymentCopy.adminApproved;
    case "REJECTED":
      return manualPaymentCopy.adminRejected;
    case "DRAFT":
    case "NOT_REQUIRED":
    case undefined:
      return "ثبت نشده";
  }
}

export function getManualPaymentReviewItems(items: readonly ConversationFixture[] = conversations) {
  return items.filter(
    (conversation) =>
      conversation.paymentMethod === "CARD_TO_CARD" &&
      (conversation.manualPaymentStatus === "SUBMITTED" ||
        conversation.manualPaymentStatus === "APPROVED" ||
        conversation.manualPaymentStatus === "REJECTED" ||
        conversation.manualPaymentStatus === "NEEDS_REVIEW")
  );
}

export function getSimilarExperiences(conversation: ConversationFixture, count = 5): SimilarExperience[] {
  if (conversation.status !== "expired") {
    return [];
  }

  const sourceJobField = conversation.profile.jobCategoriesFa[0];
  const sourceOrgLevel = conversation.profile.orgLevel;
  const sourceCompanies = new Set(conversation.profile.previousCompaniesFa);

  const rankedProfiles = profiles
    .filter((profile) => profile.id !== conversation.profile.id)
    .map((profile) => {
      const sameField = (profile.jobCategoriesFa as readonly string[]).includes(sourceJobField);
      const sameLevel = profile.orgLevel === sourceOrgLevel;
      const companyOverlap = profile.previousCompaniesFa.some((company) => sourceCompanies.has(company));
      const activity = Math.max(0, 30 - profile.lastActiveDays);
      return {
        profile,
        value: Number(sameField) * 5 + Number(sameLevel) * 3 + Number(companyOverlap) * 2 + activity / 30
      };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, Math.min(5, Math.max(3, count)));

  return rankedProfiles.map(({ profile }) => ({
    profileId: profile.id,
    displayName: profile.name,
    jobTitle: profile.roleFa,
    jobField: profile.jobCategoriesFa[0],
    orgLevel: profile.orgLevel
  }));
}

export function createConversationNotification(
  conversation: ConversationFixture,
  type: ConversationNotificationType,
  receiver: "requester" | "provider"
): ConversationNotification {
  const resolveCancellationTitle = () =>
    receiver === "provider" && hasProviderCancellationCompensation(conversation)
      ? conversationNotificationCopy.cancellationProviderCompensationTitle
      : conversationNotificationCopy.cancellationTitle;
  const resolveCancellationMessage = () => {
    if (receiver === "provider") {
      return isProviderSideClosure(conversation)
        ? providerSideClosureCopy.providerNotificationText
        : hasProviderCancellationCompensation(conversation)
          ? conversationNotificationCopy.cancellationProviderCompensation
          : conversationNotificationCopy.cancellationProvider;
    }

    if (isProviderSideRejection(conversation)) {
      return providerSideClosureCopy.requesterRejectedNotificationText;
    }

    if (isProviderSideCancellation(conversation)) {
      return conversation.providerCancellationStage === "AFTER_CONFIRMED_SESSION" || conversation.providerCancellationStage === "NEAR_SESSION_START"
        ? providerSideClosureCopy.requesterCancelledSessionNotificationText
        : providerSideClosureCopy.requesterCancelledRequestNotificationText;
    }

    if (conversation.isLateRequesterCancellation || conversation.refundAmount === 0) {
      return conversationNotificationCopy.cancellationNoRefund;
    }

    return conversation.cancellationReviewStatus === "PENDING_SUPPORT_REVIEW"
      ? conversationNotificationCopy.cancellationReview
      : conversationNotificationCopy.cancellationCredited;
  };
  const resolveMessage = () => {
    if (type === "confirmed" && isPaidConfirmedSession(conversation)) {
      return receiver === "requester" ? conversationNotificationCopy.confirmedRequester : conversationNotificationCopy.confirmedProvider;
    }

    if (type === "one_hour_reminder" && shouldShowAttendanceVerificationFlow(conversation)) {
      return receiver === "requester" ? conversationNotificationCopy.reminderRequester : conversationNotificationCopy.reminderProvider;
    }

    const messageByType: Record<ConversationNotificationType, string> = {
      new_request: conversationNotificationCopy.newRequest,
      proposed_times: conversationNotificationCopy.proposedTimes,
      near_expiration: conversationNotificationCopy.nearExpiration,
      confirmed: conversationNotificationCopy.confirmed,
      one_hour_reminder: conversationNotificationCopy.reminder,
      expired: conversationNotificationCopy.expired,
      new_time_request:
        receiver === "provider"
          ? conversationNotificationCopy.newTimeProvider
          : conversationNotificationCopy.newTimeRequesterSubmitted,
      new_time_options: conversationNotificationCopy.newTimeOptionsReady,
      provider_time_replacement:
        receiver === "provider"
          ? conversationNotificationCopy.providerTimeReplacementProvider
          : conversationNotificationCopy.providerTimeReplacementRequester,
      cancellation: resolveCancellationMessage()
    };

    return messageByType[type];
  };
  const resolveTitle = () => (type === "cancellation" ? resolveCancellationTitle() : resolveMessage());
  const targetRoute =
    type === "proposed_times" || type === "new_time_options" || (type === "provider_time_replacement" && receiver === "requester")
      ? `/conversations/${conversation.id}/select-time`
      : type === "provider_time_replacement"
        ? `/conversations/${conversation.id}`
      : type === "new_time_request"
        ? `/conversations/${conversation.id}/propose-times`
        : `/conversations/${conversation.id}`;

  return {
    id: `notification-${type}-${conversation.id}-${receiver}`,
    receiverId: receiver === "requester" ? conversation.requesterId : conversation.providerId,
    type,
    title: resolveTitle(),
    message: resolveMessage(),
    targetRoute,
    status: "unread",
    createdAt: reliabilityMockNow
  };
}

export function queueMockEmail(
  conversation: ConversationFixture,
  templateKey: EmailTemplateKey,
  receiver: "requester" | "provider"
): EmailLog {
  const template = emailTemplates[templateKey];
  const receiverId = receiver === "requester" ? conversation.requesterId : conversation.providerId;

  return {
    id: `email-${templateKey}-${conversation.id}-${receiver}`,
    receiverId,
    conversationRequestId: conversation.id,
    templateKey,
    toEmail: `${receiverId}@example.test`,
    subject: template.subject,
    status: "queued",
    sentAt: null,
    failedReason: null
  };
}

export function createProposedTimesNotificationAndEmail(conversation: ConversationFixture) {
  return {
    notification: createConversationNotification(conversation, "proposed_times", "requester"),
    emailLog: queueMockEmail(conversation, "proposed_times", "requester")
  };
}

export function createNearExpirationWarning(conversation: ConversationFixture) {
  return {
    notification: createConversationNotification(conversation, "near_expiration", "provider"),
    emailLog: null
  };
}

export function createOneHourConversationReminder(conversation: ConversationFixture, receiver: "requester" | "provider" = "requester") {
  return {
    notification: createConversationNotification(conversation, "one_hour_reminder", receiver),
    emailLog: queueMockEmail(conversation, "one_hour_reminder", receiver)
  };
}

export function createConfirmedConversationNotificationAndEmail(conversation: ConversationFixture, receiver: "requester" | "provider" = "requester") {
  return {
    notification: createConversationNotification(conversation, "confirmed", receiver),
    emailLog: queueMockEmail(conversation, "confirmed", receiver)
  };
}

export function createCancellationNotifications(conversation: ConversationFixture) {
  return [
    createConversationNotification(conversation, "cancellation", "requester"),
    createConversationNotification(conversation, "cancellation", "provider")
  ];
}

export function createNewTimeRequestNotifications(conversation: ConversationFixture) {
  return [
    createConversationNotification(conversation, "new_time_request", "requester"),
    createConversationNotification(conversation, "new_time_request", "provider")
  ];
}

export function createNewTimeOptionsNotification(conversation: ConversationFixture) {
  return createConversationNotification(conversation, "new_time_options", "requester");
}

export function createProviderTimeReplacementNotifications(conversation: ConversationFixture) {
  return [
    createConversationNotification(conversation, "provider_time_replacement", "requester"),
    createConversationNotification(conversation, "provider_time_replacement", "provider")
  ];
}

export function hasProviderReliabilityBadge(items: readonly ConversationFixture[]) {
  return items.some((conversation) => conversation.direction === "incoming" && conversation.status === "pending_provider_response");
}

export function hasRequesterReliabilityBadge(items: readonly ConversationFixture[]) {
  return items.some(
    (conversation) =>
      conversation.direction === "outgoing" &&
      (conversation.status === "times_proposed" || isPreProviderCheckoutConversation(conversation))
  );
}

export function hasUnreadNotificationBadge(items: readonly ConversationNotification[]) {
  return items.some((notification) => notification.status === "unread");
}

export function getNoIndefinitePendingViolations(items: readonly ConversationFixture[], now = reliabilityMockNow) {
  return items.filter((conversation) => {
    if (conversation.status === "pending_provider_response" || conversation.status === "new_time_requested") {
      return !conversation.providerResponseDeadlineAt || new Date(now).getTime() >= new Date(conversation.providerResponseDeadlineAt).getTime();
    }

    if (conversation.status === "times_proposed") {
      return !conversation.requesterSelectionDeadlineAt || isRequesterSelectionExpired(conversation, now);
    }

    return false;
  });
}

export function getConversationStartAt(conversation: ConversationFixture) {
  return conversation.selectedTime?.startAt;
}

export function createConversationRemindersForOneHourWindow(items: readonly ConversationFixture[], now = reliabilityMockNow) {
  const nowTime = new Date(now).getTime();

  return items
    .filter((conversation) => {
      const startAt = getConversationStartAt(conversation);
      return conversation.status === "confirmed" && startAt && Math.abs(new Date(startAt).getTime() - nowTime - MS_PER_HOUR) <= 15 * 60 * 1000;
    })
    .flatMap((conversation) => [
      createOneHourConversationReminder(conversation, "requester"),
      createOneHourConversationReminder(conversation, "provider")
    ]);
}

export function createExpirationWarnings(items: readonly ConversationFixture[], now = reliabilityMockNow) {
  return items
    .filter((conversation) => conversation.status === "pending_provider_response" && isNearProviderExpiration(conversation, now))
    .map((conversation) => createNearExpirationWarning(conversation));
}

export function postConversationRequests(input: {
  profileId: string;
  durationMinutes: ConversationDuration;
  requestNote?: string;
  requestTopic?: string;
}) {
  const profile = profileOrThrow(input.profileId);
  const request = createConversationRequest({
    profile,
    duration: input.durationMinutes,
    note: input.requestNote ?? "",
    topic: input.requestTopic
  });

  return {
    id: request.id,
    status: request.status,
    providerResponseDeadlineAt: request.providerResponseDeadlineAt
  };
}

export function getConversationRequests(input?: { direction?: ConversationDirection; group?: ConversationBucket }) {
  const direction = input?.direction;
  const group = input?.group;
  return conversations.filter((conversation) => (!direction || isVisibleConversationForDirection(conversation, direction)) && (!group || bucketConversation(conversation) === group));
}

export function getConversationRequestById(id: string) {
  return getConversationOrFallback(id);
}

export function postConversationRequestProposeTimes(id: string, times: readonly ProposedTime[]) {
  const conversation = getConversationOrFallback(id);
  const updated = proposeTimesForConversation(conversation, times);

  return {
    id: updated.id,
    status: updated.status,
    requesterSelectionDeadlineAt: updated.requesterSelectionDeadlineAt
  };
}

export function postConversationRequestReject(id: string) {
  const updated = rejectConversation(getConversationOrFallback(id));
  return { id: updated.id, status: updated.status };
}

export function postConversationRequestSelectTime(id: string, proposedTimeId: string) {
  const updated = selectTimeForConversation(getConversationOrFallback(id), proposedTimeId);
  const ok =
    updated.selectedTimeId === proposedTimeId &&
    updated.status === "confirmed" &&
    hasValidSelectedTime(updated);

  return {
    id: updated.id,
    status: updated.status,
    selectedTimeId: updated.selectedTimeId,
    ok,
    error: ok ? undefined : updated.status === "expired" ? expiredTimeSelectionMessage : disabledReasonCopy.NO_VALID_SELECTED_TIME
  };
}

export function postConversationRequestCancel(id: string) {
  const updated = cancelConversation(getConversationOrFallback(id));
  return { id: updated.id, status: updated.status };
}

export function postConversationRequestExpire(id: string) {
  const updated = expireConversation(getConversationOrFallback(id));
  return { id: updated.id, status: updated.status };
}

export function getConversationRequestSimilarExperiences(id: string) {
  return {
    items: getSimilarExperiences(getConversationOrFallback(id))
  };
}

export function getDefaultRequestProfile(profileId?: string | null) {
  return getProfileById(profileId ?? "") ?? profiles[0];
}
