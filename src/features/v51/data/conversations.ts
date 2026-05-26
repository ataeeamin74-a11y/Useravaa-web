import { formatter, getProfileById, profiles, toman, type ExperienceProfileFixture } from "./profiles";

export type ConversationDirection = "outgoing" | "incoming";

export type ConversationRequestStatus =
  | "pending_provider_response"
  | "times_proposed"
  | "pending_payment"
  | "confirmed"
  | "completed"
  | "rejected"
  | "expired"
  | "cancelled";

export type ConversationState = ConversationRequestStatus;
export type ConversationDuration = 30 | 60;
export type ConversationBucket = "needsAction" | "tracking" | "done";
export type ConversationActionKind = "open" | "propose_times" | "reject" | "select_time" | "checkout" | "cancel";
export type NotificationStatus = "unread" | "read";
export type EmailLogStatus = "queued" | "sent" | "failed";

export type ConversationNotificationType =
  | "new_request"
  | "proposed_times"
  | "near_expiration"
  | "confirmed"
  | "one_hour_reminder"
  | "expired";

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
  walletBalanceToman?: number;
  freeHelp?: boolean;
};

export type ConversationAction = {
  kind: ConversationActionKind;
  label: string;
  href?: string;
  tone: "primary" | "secondary" | "danger";
};

export type ConversationNotification = {
  id: string;
  receiverId: string;
  type: ConversationNotificationType;
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

export type SessionContactDetails = {
  phoneNumber?: string;
  email?: string;
};

const MS_PER_HOUR = 60 * 60 * 1000;
export const reliabilityMockNow = "2026-05-23T09:00:00+03:30";
export const walletBalanceToman = 100000;
export const conversationEmailSender = "notifications@useravaa.com";

export const postPaymentContactCopy = {
  unlockedTitle: "اطلاعات تماس برای هماهنگی جلسه",
  unlockedHelper: "این اطلاعات پس از پرداخت فعال شده است تا بتوانید زمان و جزئیات جلسه مشاوره را هماهنگ کنید.",
  lockedTitle: "اطلاعات تماس پس از پرداخت فعال می‌شود",
  lockedHelper: "برای حفظ حریم خصوصی، شماره تماس و ایمیل طرف مقابل فقط بعد از پرداخت و ثبت جلسه نمایش داده می‌شود.",
  checkoutNotice: "پس از پرداخت، شماره تماس و ایمیل شما برای هماهنگی جلسه مشاوره با طرف مقابل به اشتراک گذاشته می‌شود.",
  missingPhone: "شماره تماس ثبت نشده است.",
  missingEmail: "ایمیل ثبت نشده است."
} as const;

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
  proposeTimesCta: "پیشنهاد زمان",
  rejectRequestCta: "رد درخواست",
  nearExpirationWarning: "این درخواست تا چند ساعت دیگر منقضی می‌شود.",
  waitingProviderTitle: "در انتظار پاسخ Provider",
  waitingProviderBody: "پاسخ تا ۲۴ ساعت آینده مشخص می‌شود.",
  timesReadyTitle: "زمان‌های پیشنهادی آماده است",
  timesReadyBody: "یکی از زمان‌ها را تا ۴۸ ساعت آینده انتخاب کنید.",
  pendingPaymentTitle: "زمان جلسه مشاوره انتخاب شده است",
  pendingPaymentBody: "برای ثبت نهایی جلسه مشاوره، پرداخت را تکمیل کنید.",
  expiredBody: "این درخواست در زمان مقرر پاسخ نگرفت. می‌توانید تجربه‌های مشابه را بررسی کنید.",
  similarTitle: "تجربه‌های مشابه برای ادامه مسیر",
  minimumTimesError: "حداقل ۳ زمان پیشنهادی انتخاب کنید.",
  duplicateTimesError: "زمان‌های پیشنهادی نباید تکراری باشند.",
  paymentUnavailable: "پرداخت فقط بعد از انتخاب زمان فعال می‌شود.",
  timeSelectionExpired: "مهلت انتخاب زمان تمام شده است."
} as const;

export const conversationNotificationCopy = {
  newRequest: "یک درخواست جلسه مشاوره جدید دریافت کردید.",
  proposedTimes: "زمان‌های پیشنهادی برای جلسه مشاوره شما آماده است.",
  nearExpiration: "این درخواست تا چند ساعت دیگر منقضی می‌شود.",
  confirmed: "جلسه مشاوره شما ثبت شد.",
  reminder: "جلسه مشاوره شما تا یک ساعت دیگر شروع می‌شود.",
  expired: "درخواست جلسه مشاوره شما منقضی شد."
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
    body: "سلام،\n\nزمان‌های پیشنهادی برای جلسه مشاوره شما آماده شده است.\nلطفاً یکی از زمان‌ها را انتخاب کنید تا وارد مرحله پرداخت و ثبت جلسه شوید.\n\nمشاهده زمان‌های پیشنهادی",
    targetLabel: "مشاهده زمان‌های پیشنهادی"
  },
  confirmed: {
    key: "confirmed",
    subject: "جلسه مشاوره شما در Useravaa ثبت شد",
    body: "سلام،\n\nجلسه مشاوره شما با موفقیت ثبت شد.\nجزئیات زمان جلسه در حساب کاربری شما قابل مشاهده است.\n\nمشاهده جلسه",
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
  { id: "d1", day: "شنبه", date: "۲۶ خرداد ۱۴۰۵", full: "شنبه ۲۶ خرداد ۱۴۰۵", isoDate: "2026-06-16" },
  { id: "d2", day: "یکشنبه", date: "۲۷ خرداد ۱۴۰۵", full: "یکشنبه ۲۷ خرداد ۱۴۰۵", isoDate: "2026-06-17" },
  { id: "d3", day: "دوشنبه", date: "۲۸ خرداد ۱۴۰۵", full: "دوشنبه ۲۸ خرداد ۱۴۰۵", isoDate: "2026-06-18" },
  { id: "d4", day: "سه‌شنبه", date: "۲۹ خرداد ۱۴۰۵", full: "سه‌شنبه ۲۹ خرداد ۱۴۰۵", isoDate: "2026-06-19" },
  { id: "d5", day: "چهارشنبه", date: "۳۰ خرداد ۱۴۰۵", full: "چهارشنبه ۳۰ خرداد ۱۴۰۵", isoDate: "2026-06-20" },
  { id: "d6", day: "پنجشنبه", date: "۳۱ خرداد ۱۴۰۵", full: "پنجشنبه ۳۱ خرداد ۱۴۰۵", isoDate: "2026-06-21" },
  { id: "d7", day: "جمعه", date: "۱ تیر ۱۴۰۵", full: "جمعه ۱ تیر ۱۴۰۵", isoDate: "2026-06-22" },
  { id: "d8", day: "شنبه", date: "۲ تیر ۱۴۰۵", full: "شنبه ۲ تیر ۱۴۰۵", isoDate: "2026-06-23" },
  { id: "d9", day: "یکشنبه", date: "۳ تیر ۱۴۰۵", full: "یکشنبه ۳ تیر ۱۴۰۵", isoDate: "2026-06-24" }
] as const;

export const proposalTimeSlots = [
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
  "۱۹:۰۰"
] as const;

const latinTimeByFa = new Map<string, string>([
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
  ["۱۹:۰۰", "19:00"]
]);

function addHours(value: string | Date, hours: number) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Date(date.getTime() + hours * MS_PER_HOUR).toISOString();
}

function subtractHours(value: string | Date, hours: number) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Date(date.getTime() - hours * MS_PER_HOUR).toISOString();
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

  return {
    id: `${dateOption.id}-${latinTime}`,
    conversationRequestId,
    date: dateOption.isoDate,
    time: latinTime,
    displayDateFa: dateOption.full,
    displayTimeFa: timeLabel,
    isSelected: false,
    dateId: dateOption.id,
    dateLabel: dateOption.full,
    dayLabel: dateOption.day,
    timeLabel
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
    providerRespondedAt: subtractHours(reliabilityMockNow, 2),
    timesProposedAt: subtractHours(reliabilityMockNow, 2),
    requesterSelectionDeadlineAt: addHours(reliabilityMockNow, 46),
    submittedAtLabel: "ثبت‌شده در ۲۴ خرداد ۱۴۰۵",
    proposedAtLabel: "۳ زمان پیشنهادی دریافت شده",
    proposedTimes: withConversationId(defaultProposedTimes, "conv-time-options"),
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
    providerRespondedAt: subtractHours(reliabilityMockNow, 5),
    timesProposedAt: subtractHours(reliabilityMockNow, 5),
    requesterSelectionDeadlineAt: addHours(reliabilityMockNow, 43),
    selectedTimeId: selectedTimeA.id,
    selectedAt: subtractHours(reliabilityMockNow, 1),
    submittedAtLabel: "ثبت‌شده در ۲۳ خرداد ۱۴۰۵",
    proposedAtLabel: "زمان انتخاب شده است",
    selectedTime: { ...selectedTimeA, conversationRequestId: "conv-awaiting-payment" },
    proposedTimes: withConversationId(defaultProposedTimes, "conv-awaiting-payment", selectedTimeA.id),
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
    submittedAtLabel: "ثبت‌شده در ۲۴ خرداد ۱۴۰۵",
    walletBalanceToman
  }),
  buildConversation({
    id: "conv-provider-waiting",
    requesterId: "user-arash",
    providerId: "provider-nazanin",
    direction: "incoming",
    status: "times_proposed",
    profile: profileOrThrow("nazanin"),
    requesterName: "آرش ن.",
    requesterRole: "درخواست‌دهنده جلسه مشاوره",
    duration: 30,
    note: "برای ساخت داشبوردهای تصمیم‌سازی به راهنمایی نیاز دارم.",
    createdAt: subtractHours(reliabilityMockNow, 20),
    providerRespondedAt: subtractHours(reliabilityMockNow, 8),
    timesProposedAt: subtractHours(reliabilityMockNow, 8),
    requesterSelectionDeadlineAt: addHours(reliabilityMockNow, 40),
    submittedAtLabel: "ثبت‌شده در ۲۲ خرداد ۱۴۰۵",
    proposedAtLabel: "زمان‌ها را پیشنهاد داده‌ای",
    proposedTimes: withConversationId(defaultProposedTimes, "conv-provider-waiting"),
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
    walletBalanceToman
  }),
  buildConversation({
    id: "conv-expired",
    requesterId: "user-requester",
    providerId: "provider-hamid",
    direction: "outgoing",
    status: "expired",
    profile: profileOrThrow("hamid"),
    requesterName: "تو",
    requesterRole: "درخواست‌دهنده",
    duration: 30,
    note: "برای شروع مسیر تحلیل داده راهنمایی می‌خواستم.",
    createdAt: subtractHours(reliabilityMockNow, 30),
    expiredAt: subtractHours(reliabilityMockNow, 2),
    submittedAtLabel: "ثبت‌شده در ۱۸ خرداد ۱۴۰۵",
    proposedTimes: [],
    walletBalanceToman
  }),
  buildConversation({
    id: "conv-free-help",
    requesterId: "user-requester",
    providerId: "provider-niloofar",
    direction: "outgoing",
    status: "pending_payment",
    profile: profileOrThrow("niloofar"),
    requesterName: "تو",
    requesterRole: "درخواست‌دهنده",
    duration: 30,
    note: "یک جلسه کمکی کوتاه برای مسیر شغلی.",
    createdAt: subtractHours(reliabilityMockNow, 16),
    providerRespondedAt: subtractHours(reliabilityMockNow, 5),
    timesProposedAt: subtractHours(reliabilityMockNow, 5),
    requesterSelectionDeadlineAt: addHours(reliabilityMockNow, 43),
    selectedTimeId: "d4-14:30",
    selectedAt: subtractHours(reliabilityMockNow, 1),
    submittedAtLabel: "ثبت‌شده در ۲۱ خرداد ۱۴۰۵",
    proposedAtLabel: "زمان انتخاب شده است",
    selectedTime: { ...makeProposedTime("d4", "۱۴:۳۰", "conv-free-help"), isSelected: true },
    proposedTimes: withConversationId([makeProposedTime("d2", "۱۰:۰۰"), makeProposedTime("d4", "۱۴:۳۰"), makeProposedTime("d6", "۱۷:۰۰")], "conv-free-help", "d4-14:30"),
    walletBalanceToman,
    freeHelp: true
  })
] as const satisfies readonly ConversationFixture[];

export const conversationNotifications: ConversationNotification[] = [
  createConversationNotification(conversations[2], "new_request", "provider"),
  createConversationNotification(conversations[0], "proposed_times", "requester"),
  createConversationNotification(conversations[3], "near_expiration", "provider"),
  createConversationNotification(conversations[5], "confirmed", "requester"),
  createConversationNotification(conversations[5], "one_hour_reminder", "requester")
];

export const mockEmailLogs: EmailLog[] = [
  queueMockEmail(conversations[2], "new_request", "provider"),
  queueMockEmail(conversations[0], "proposed_times", "requester"),
  queueMockEmail(conversations[5], "confirmed", "requester"),
  queueMockEmail(conversations[5], "one_hour_reminder", "requester")
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

export function getConversationStatusLabel(conversation: ConversationFixture) {
  if (conversation.status === "pending_provider_response" && conversation.direction === "incoming") {
    return conversationReliabilityCopy.newRequestBadge;
  }

  if (conversation.status === "pending_provider_response") {
    return conversationReliabilityCopy.waitingProviderTitle;
  }

  if (conversation.status === "times_proposed" && conversation.direction === "outgoing") {
    return "انتخاب زمان";
  }

  if (conversation.status === "times_proposed") {
    return "منتظر انتخاب";
  }

  const labels: Record<ConversationRequestStatus, string> = {
    pending_provider_response: conversationReliabilityCopy.newRequestBadge,
    times_proposed: "زمان‌ها ارسال شدند",
    pending_payment: "نهایی‌سازی پرداخت",
    confirmed: "ثبت‌شده",
    completed: "تکمیل‌شده",
    rejected: "رد شده",
    expired: "منقضی شده",
    cancelled: "لغو شده"
  };

  return labels[conversation.status];
}

export function getConversationMessage(conversation: ConversationFixture) {
  const name = getPersonName(conversation);

  if (conversation.status === "pending_provider_response" && conversation.direction === "incoming") {
    return `${name} از تو درخواست جلسه مشاوره کرده.`;
  }

  if (conversation.status === "pending_provider_response") {
    return `${conversationReliabilityCopy.waitingProviderTitle}. ${conversationReliabilityCopy.waitingProviderBody}`;
  }

  if (conversation.status === "times_proposed" && conversation.direction === "outgoing") {
    return `${conversationReliabilityCopy.timesReadyTitle}. ${conversationReliabilityCopy.timesReadyBody}`;
  }

  if (conversation.status === "times_proposed") {
    return `برای ${name} زمان پیشنهاد داده‌ای.`;
  }

  if (conversation.status === "pending_payment") {
    return `${conversationReliabilityCopy.pendingPaymentTitle}. ${conversationReliabilityCopy.pendingPaymentBody}`;
  }

  if (conversation.status === "confirmed") {
    return `جلسه مشاوره با ${name} ثبت شد.`;
  }

  if (conversation.status === "completed") {
    return `جلسه مشاوره با ${name} تکمیل شده است.`;
  }

  if (conversation.status === "rejected") {
    return `درخواست مربوط به ${name} رد شده است.`;
  }

  if (conversation.status === "cancelled") {
    return `درخواست مربوط به ${name} لغو شده است.`;
  }

  if (conversation.status === "expired") {
    return conversationReliabilityCopy.expiredBody;
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
    return `این فرد برای جلسه مشاوره با تو درخواست داده است. حداقل سه زمان پیشنهاد بده یا درخواست را رد کن. ${getDeadlineText(conversation)}`;
  }

  if (conversation.status === "pending_provider_response") {
    return `${conversationReliabilityCopy.waitingProviderTitle}. ${conversationReliabilityCopy.waitingProviderBody}`;
  }

  if (conversation.status === "times_proposed" && conversation.direction === "outgoing") {
    return `${conversationReliabilityCopy.timesReadyTitle}. ${conversationReliabilityCopy.timesReadyBody}`;
  }

  if (conversation.status === "times_proposed") {
    return "زمان‌ها را پیشنهاد داده‌ای. حالا منتظر انتخاب درخواست‌دهنده هستی.";
  }

  if (conversation.status === "pending_payment") {
    return `${conversationReliabilityCopy.pendingPaymentTitle}. ${conversationReliabilityCopy.pendingPaymentBody}`;
  }

  if (conversation.status === "confirmed") {
    return "جلسه مشاوره ثبت شده و در برنامه تو قرار گرفته است.";
  }

  if (conversation.status === "completed") {
    return "جلسه مشاوره تکمیل شده است و اطلاعات تماس برای سابقه جلسه در دسترس می‌ماند.";
  }

  if (conversation.status === "rejected") {
    return "این درخواست رد شده است.";
  }

  if (conversation.status === "cancelled") {
    return "این درخواست لغو شده است.";
  }

  if (conversation.status === "expired") {
    return conversationReliabilityCopy.expiredBody;
  }

  return "وضعیت درخواست را پیگیری کن.";
}

export function bucketConversation(conversation: ConversationFixture): ConversationBucket {
  if (conversation.direction === "outgoing") {
    if (conversation.status === "times_proposed" || conversation.status === "pending_payment") {
      return "needsAction";
    }

    if (conversation.status === "pending_provider_response" || conversation.status === "confirmed") {
      return "tracking";
    }

    return "done";
  }

  if (conversation.status === "pending_provider_response") {
    return "needsAction";
  }

  if (conversation.status === "times_proposed" || conversation.status === "pending_payment" || conversation.status === "confirmed") {
    return "tracking";
  }

  return "done";
}

export function groupConversations(items: readonly ConversationFixture[], direction: ConversationDirection) {
  const visibleItems = items.filter((conversation) => conversation.direction === direction);

  return {
    needsAction: visibleItems.filter((conversation) => bucketConversation(conversation) === "needsAction"),
    tracking: visibleItems.filter((conversation) => bucketConversation(conversation) === "tracking"),
    done: visibleItems.filter((conversation) => bucketConversation(conversation) === "done")
  };
}

export function getPrimaryConversationAction(conversation: ConversationFixture): ConversationAction {
  if (conversation.status === "pending_provider_response" && conversation.direction === "incoming") {
    return {
      kind: "propose_times",
      label: conversationReliabilityCopy.proposeTimesCta,
      href: `/conversations/${conversation.id}/propose-times`,
      tone: "primary"
    };
  }

  if (conversation.status === "times_proposed" && conversation.direction === "outgoing") {
    return {
      kind: "select_time",
      label: "انتخاب زمان",
      href: `/conversations/${conversation.id}/select-time`,
      tone: "primary"
    };
  }

  if (conversation.status === "pending_payment") {
    return {
      kind: "checkout",
      label: "پرداخت",
      href: `/checkout/${conversation.id}`,
      tone: "primary"
    };
  }

  return {
    kind: "open",
    label: "باز کردن",
    href: `/conversations/${conversation.id}`,
    tone: "secondary"
  };
}

export function canCancelConversation(conversation: ConversationFixture) {
  return (
    conversation.direction === "outgoing" &&
    (conversation.status === "pending_provider_response" || conversation.status === "times_proposed" || conversation.status === "pending_payment")
  );
}

export function canRejectConversation(conversation: ConversationFixture) {
  return conversation.direction === "incoming" && conversation.status === "pending_provider_response";
}

export function getConversationActions(conversation: ConversationFixture) {
  const actions = [getPrimaryConversationAction(conversation)];

  if (canRejectConversation(conversation)) {
    actions.push({
      kind: "reject",
      label: conversationReliabilityCopy.rejectRequestCta,
      tone: "danger"
    });
  }

  if (canCancelConversation(conversation)) {
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
  createdAt = reliabilityMockNow
}: {
  profile: ExperienceProfileFixture;
  duration: ConversationDuration;
  note: string;
  createdAt?: string;
}): ConversationFixture {
  return buildConversation({
    id: `mock-request-${profile.id}-${duration}`,
    requesterId: "user-requester",
    providerId: `provider-${profile.id}`,
    direction: "outgoing",
    status: "pending_provider_response",
    profile,
    requesterName: "تو",
    requesterRole: "درخواست‌دهنده",
    duration,
    note,
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

export function toggleProposedTime(selectedTimes: readonly ProposedTime[], nextTime: ProposedTime) {
  if (hasDuplicateProposedTime(selectedTimes, nextTime)) {
    return selectedTimes.filter((time) => time.id !== nextTime.id);
  }

  if (selectedTimes.length >= 6) {
    return [...selectedTimes];
  }

  return [...selectedTimes, nextTime];
}

export function validateProposedTimes(selectedTimes: readonly ProposedTime[], conversationId?: string): ProposedTimesValidation {
  const errors: string[] = [];

  if (selectedTimes.length < 3) {
    errors.push(conversationReliabilityCopy.minimumTimesError);
  }

  if (hasDuplicateProposedTimes(selectedTimes)) {
    errors.push(conversationReliabilityCopy.duplicateTimesError);
  }

  if (selectedTimes.some((time) => !time.date || !time.time)) {
    errors.push("تاریخ و ساعت برای هر زمان پیشنهادی لازم است.");
  }

  if (conversationId && selectedTimes.some((time) => time.conversationRequestId && time.conversationRequestId !== conversationId)) {
    errors.push("زمان پیشنهادی باید متعلق به همین درخواست باشد.");
  }

  return {
    valid: errors.length === 0 && selectedTimes.length <= 6,
    errors
  };
}

export function canSubmitProposedTimes(selectedTimes: readonly ProposedTime[]) {
  return selectedTimes.length >= 3 && selectedTimes.length <= 6 && !hasDuplicateProposedTimes(selectedTimes);
}

export function proposeTimesForConversation(conversation: ConversationFixture, selectedTimes: readonly ProposedTime[], now = reliabilityMockNow): ConversationFixture {
  const validation = validateProposedTimes(selectedTimes, conversation.id);

  if (conversation.status !== "pending_provider_response" || !validation.valid) {
    return conversation;
  }

  const normalizedTimes = withConversationId(selectedTimes, conversation.id);

  return setConversationStatus(
    {
      ...conversation,
      providerRespondedAt: now,
      timesProposedAt: now,
      requesterSelectionDeadlineAt: addHours(now, 48),
      proposedAtLabel: `${formatter.format(normalizedTimes.length)} زمان پیشنهادی ارسال شد`,
      proposedTimes: normalizedTimes
    },
    "times_proposed"
  );
}

export function selectTimeForConversation(conversation: ConversationFixture, proposedTimeId: string, now = reliabilityMockNow): ConversationFixture {
  const current = applyExpiration(conversation, now);

  if (current.status !== "times_proposed") {
    return current;
  }

  const selectedTime = current.proposedTimes.find((time) => time.id === proposedTimeId && time.conversationRequestId === current.id);

  if (!selectedTime) {
    return current;
  }

  return setConversationStatus(
    {
      ...current,
      selectedTimeId: selectedTime.id,
      selectedAt: now,
      selectedTime: { ...selectedTime, isSelected: true },
      proposedTimes: current.proposedTimes.map((time) => ({ ...time, isSelected: time.id === selectedTime.id }))
    },
    "pending_payment"
  );
}

export function cancelConversation(conversation: ConversationFixture, now = reliabilityMockNow): ConversationFixture {
  if (!canCancelConversation(conversation)) {
    return conversation;
  }

  return setConversationStatus(
    {
      ...conversation,
      cancelledAt: now
    },
    "cancelled"
  );
}

export function rejectConversation(conversation: ConversationFixture, now = reliabilityMockNow): ConversationFixture {
  if (!canRejectConversation(conversation)) {
    return conversation;
  }

  return setConversationStatus(
    {
      ...conversation,
      providerRespondedAt: now,
      rejectedAt: now
    },
    "rejected"
  );
}

export function applyExpiration(conversation: ConversationFixture, now = reliabilityMockNow): ConversationFixture {
  const nowTime = new Date(now).getTime();

  if (conversation.status === "pending_provider_response" && nowTime > new Date(conversation.providerResponseDeadlineAt).getTime()) {
    return expireConversation(conversation, now);
  }

  if (
    conversation.status === "times_proposed" &&
    conversation.requesterSelectionDeadlineAt &&
    nowTime > new Date(conversation.requesterSelectionDeadlineAt).getTime()
  ) {
    return expireConversation(conversation, now);
  }

  return conversation;
}

export function expireConversation(conversation: ConversationFixture, now = reliabilityMockNow): ConversationFixture {
  if (
    conversation.status === "confirmed" ||
    conversation.status === "completed" ||
    conversation.status === "rejected" ||
    conversation.status === "cancelled" ||
    conversation.status === "expired"
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
    conversation.status === "pending_provider_response" && new Date(now).getTime() > new Date(conversation.providerResponseDeadlineAt).getTime()
      ? expireConversation(conversation, now)
      : conversation
  );
}

export function expireProposedTimes(items: readonly ConversationFixture[], now = reliabilityMockNow) {
  return items.map((conversation) =>
    conversation.status === "times_proposed" &&
    conversation.requesterSelectionDeadlineAt &&
    new Date(now).getTime() > new Date(conversation.requesterSelectionDeadlineAt).getTime()
      ? expireConversation(conversation, now)
      : conversation
  );
}

export function calculateCheckout(conversation: ConversationFixture, walletBalance = conversation.walletBalanceToman ?? walletBalanceToman) {
  const price = getConversationPrice(conversation);
  const walletDeduction = conversation.status === "pending_payment" && conversation.selectedTimeId ? Math.min(price, walletBalance) : 0;
  const gatewayPayable = conversation.status === "pending_payment" && conversation.selectedTimeId ? Math.max(price - walletDeduction, 0) : price;
  const paymentEnabled = conversation.status === "pending_payment" && Boolean(conversation.selectedTimeId);

  return {
    price,
    walletBalance,
    walletDeduction,
    gatewayPayable,
    requiresGateway: gatewayPayable > 0,
    isFreeHelp: price === 0,
    paymentEnabled,
    disabledReason: paymentEnabled ? "" : conversationReliabilityCopy.paymentUnavailable
  };
}

export function payConversation(conversation: ConversationFixture, now = reliabilityMockNow): ConversationFixture {
  const checkout = calculateCheckout(conversation);

  if (!checkout.paymentEnabled) {
    return conversation;
  }

  return setConversationStatus(
    {
      ...conversation,
      paidAt: now,
      confirmedAt: now
    },
    "confirmed"
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
  const messageByType: Record<ConversationNotificationType, string> = {
    new_request: conversationNotificationCopy.newRequest,
    proposed_times: conversationNotificationCopy.proposedTimes,
    near_expiration: conversationNotificationCopy.nearExpiration,
    confirmed: conversationNotificationCopy.confirmed,
    one_hour_reminder: conversationNotificationCopy.reminder,
    expired: conversationNotificationCopy.expired
  };
  const targetRoute = type === "proposed_times" ? `/conversations/${conversation.id}/select-time` : `/conversations/${conversation.id}`;

  return {
    id: `notification-${type}-${conversation.id}-${receiver}`,
    receiverId: receiver === "requester" ? conversation.requesterId : conversation.providerId,
    type,
    message: messageByType[type],
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

export function hasProviderReliabilityBadge(items: readonly ConversationFixture[]) {
  return items.some((conversation) => conversation.direction === "incoming" && conversation.status === "pending_provider_response");
}

export function hasRequesterReliabilityBadge(items: readonly ConversationFixture[]) {
  return items.some(
    (conversation) => conversation.direction === "outgoing" && (conversation.status === "times_proposed" || conversation.status === "pending_payment")
  );
}

export function hasUnreadNotificationBadge(items: readonly ConversationNotification[]) {
  return items.some((notification) => notification.status === "unread");
}

export function getNoIndefinitePendingViolations(items: readonly ConversationFixture[], now = reliabilityMockNow) {
  return items.filter((conversation) => {
    if (conversation.status === "pending_provider_response") {
      return !conversation.providerResponseDeadlineAt || new Date(now).getTime() > new Date(conversation.providerResponseDeadlineAt).getTime();
    }

    if (conversation.status === "times_proposed") {
      return !conversation.requesterSelectionDeadlineAt || new Date(now).getTime() > new Date(conversation.requesterSelectionDeadlineAt).getTime();
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
}) {
  const profile = profileOrThrow(input.profileId);
  const request = createConversationRequest({
    profile,
    duration: input.durationMinutes,
    note: input.requestNote ?? ""
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
  return conversations.filter((conversation) => (!direction || conversation.direction === direction) && (!group || bucketConversation(conversation) === group));
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
  return {
    id: updated.id,
    status: updated.status,
    selectedTimeId: updated.selectedTimeId
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
