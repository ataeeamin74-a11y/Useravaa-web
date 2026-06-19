export const PROFESSIONAL_SUMMARY_MAX_LENGTH = 250;
export const USER_MOTIVATION_OTHER_TEXT_MAX_LENGTH = 120;
export const INSIGHT_ANSWER_MAX_LENGTH = 280;
export const USERAVAA_PLATFORM_FEE_BPS = 1500;

export const USER_MOTIVATION_CODES = [
  "CAREER_GROWTH",
  "CAREER_CHOICE",
  "CAREER_CHANGE",
  "RESUME_INTERVIEW",
  "SIDE_INCOME",
  "UNDERSTAND_REALITY_OF_ROLE",
  "HELP_OTHERS",
  "EARN_FROM_EXPERIENCE",
  "OTHER"
] as const;

export const INSIGHT_AUDIENCE_INTENT_CODES = ["career_path", "current_growth", "career_change"] as const;

export const MANUAL_PAYMENT_RECEIPT_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf"
] as const;

export const MAX_MANUAL_PAYMENT_RECEIPT_BYTES = 5 * 1024 * 1024;

export type UserMotivationCode = (typeof USER_MOTIVATION_CODES)[number];
export type InsightAudienceIntentCode = (typeof INSIGHT_AUDIENCE_INTENT_CODES)[number];
