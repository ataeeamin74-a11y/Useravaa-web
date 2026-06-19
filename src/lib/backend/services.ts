import { Prisma } from "@prisma/client";
import { apiError, apiOk } from "./api-response";
import { calculateRequesterCancellationPolicy } from "./cancellation-policy";
import { isPrismaClientConfigurationError } from "./db/prisma";
import { withUseravaaTransaction, type UseravaaTransactionClient } from "./db/transaction";
import { toConversationResponseDto, toConversationResponseDtos, type ConversationResponseDto } from "./dto/conversation";
import type { BackendArea } from "./domain";
import { useravaaRepository } from "./repository";
import {
  ATTENDANCE_CODE_MAX_ATTEMPTS,
  buildAttendanceVerificationMaterial,
  decodeRequesterAttendanceCode,
  hashAttendanceCode
} from "./repositories/attendance";
import type { AdminCategoryRecord, PricingRuleListReadModel, PricingRuleRecord, RepositoryResult } from "./repositories";
import {
  adminCategoryArchiveSchema,
  adminCategoryCreateSchema,
  adminCategoryRestoreSchema,
  adminCategoryUpdateSchema,
  adminCancellationCreditApprovalSchema,
  adminCancellationCreditRejectionSchema,
  adminExperienceProfileApprovalSchema,
  adminExperienceProfileHideSchema,
  adminExperienceProfileRequestChangesSchema,
  adminInsightAnswerHideSchema,
  adminInsightDeleteSchema,
  adminInsightHideSchema,
  adminInsightRestoreSchema,
  adminPaymentApprovalSchema,
  adminPaymentRejectionSchema,
  adminPricingRuleCreateSchema,
  adminPricingRuleDeactivateSchema,
  adminPricingRuleUpdateSchema,
  attendanceSubmitCodeSchema,
  cancellationRequestSchema,
  freePaymentFinalizationSchema,
  manualPaymentSubmissionSchema,
  newTimeRequestSchema,
  proposedTimesSubmissionSchema,
  requestCreationSchema,
  timeSelectionSchema
} from "./validation";

export type { BackendArea };

export type BackendServiceErrorCode =
  | "validation_error"
  | "unauthorized"
  | "target_not_found"
  | "target_not_available"
  | "conversation_not_found"
  | "payment_not_found"
  | "pricing_rule_not_found"
  | "profile_not_found"
  | "insight_not_found"
  | "insight_answer_not_found"
  | "attendance_not_found"
  | "attendance_already_verified"
  | "attendance_code_invalid"
  | "invalid_state"
  | "cancellation_not_allowed"
  | "time_option_not_found"
  | "time_option_not_active"
  | "not_implemented"
  | "provider_not_configured"
  | "database_not_configured";

export type ServiceResult<T> =
  | {
      ok: true;
      data: T;
      status?: number;
    }
  | {
      ok: false;
      code: BackendServiceErrorCode;
      area: BackendArea;
      status: number;
      message: string;
      details?: unknown;
    };

export function notImplementedResult(area: BackendArea, details?: unknown): ServiceResult<never> {
  return {
    ok: false,
    code: "not_implemented",
    area,
    status: 501,
    message: "This backend flow has a typed contract, but production persistence is not implemented in this checkpoint.",
    details
  };
}

export function providerNotConfiguredResult(area: BackendArea): ServiceResult<never> {
  return {
    ok: false,
    code: "provider_not_configured",
    area,
    status: 503,
    message: "The production provider for this backend flow is not configured."
  };
}

export function validationErrorResult(area: BackendArea, details?: unknown): ServiceResult<never> {
  return {
    ok: false,
    code: "validation_error",
    area,
    status: 422,
    message: "Request validation failed.",
    details
  };
}

export function unauthorizedResult(area: BackendArea, details?: unknown): ServiceResult<never> {
  return {
    ok: false,
    code: "unauthorized",
    area,
    status: 403,
    message: "The current viewer is not allowed to perform this action.",
    details
  };
}

export function targetNotFoundResult(area: BackendArea): ServiceResult<never> {
  return {
    ok: false,
    code: "target_not_found",
    area,
    status: 404,
    message: "The requested target was not found."
  };
}

export function conversationNotFoundResult(area: BackendArea): ServiceResult<never> {
  return {
    ok: false,
    code: "conversation_not_found",
    area,
    status: 404,
    message: "No matching conversation was found."
  };
}

export function paymentNotFoundResult(area: BackendArea): ServiceResult<never> {
  return {
    ok: false,
    code: "payment_not_found",
    area,
    status: 404,
    message: "No matching payment was found."
  };
}

export function pricingRuleNotFoundResult(area: BackendArea): ServiceResult<never> {
  return {
    ok: false,
    code: "pricing_rule_not_found",
    area,
    status: 404,
    message: "No matching pricing rule was found."
  };
}

export function profileNotFoundResult(area: BackendArea): ServiceResult<never> {
  return {
    ok: false,
    code: "profile_not_found",
    area,
    status: 404,
    message: "No matching experience profile was found."
  };
}

export function insightNotFoundResult(area: BackendArea): ServiceResult<never> {
  return {
    ok: false,
    code: "insight_not_found",
    area,
    status: 404,
    message: "No matching insight was found."
  };
}

export function insightAnswerNotFoundResult(area: BackendArea): ServiceResult<never> {
  return {
    ok: false,
    code: "insight_answer_not_found",
    area,
    status: 404,
    message: "No matching insight answer was found."
  };
}

export function attendanceNotFoundResult(area: BackendArea): ServiceResult<never> {
  return {
    ok: false,
    code: "attendance_not_found",
    area,
    status: 404,
    message: "No matching attendance verification record was found."
  };
}

export function attendanceAlreadyVerifiedResult(area: BackendArea): ServiceResult<never> {
  return {
    ok: false,
    code: "attendance_already_verified",
    area,
    status: 409,
    message: "Attendance has already been verified."
  };
}

export function attendanceCodeInvalidResult(area: BackendArea, details?: unknown): ServiceResult<never> {
  return {
    ok: false,
    code: "attendance_code_invalid",
    area,
    status: 422,
    message: "The submitted attendance code could not be verified.",
    details
  };
}

export function targetNotAvailableResult(area: BackendArea, details?: unknown): ServiceResult<never> {
  return {
    ok: false,
    code: "target_not_available",
    area,
    status: 409,
    message: "The requested target is not available for this action.",
    details
  };
}

export function invalidStateResult(area: BackendArea, details?: unknown): ServiceResult<never> {
  return {
    ok: false,
    code: "invalid_state",
    area,
    status: 409,
    message: "This action is not available for the current conversation state.",
    details
  };
}

export function cancellationNotAllowedResult(area: BackendArea, details?: unknown): ServiceResult<never> {
  return {
    ok: false,
    code: "cancellation_not_allowed",
    area,
    status: 409,
    message: "This conversation cannot be cancelled in its current state.",
    details
  };
}

export function timeOptionNotFoundResult(area: BackendArea): ServiceResult<never> {
  return {
    ok: false,
    code: "time_option_not_found",
    area,
    status: 404,
    message: "No matching time option was found."
  };
}

export function timeOptionNotActiveResult(area: BackendArea, details?: unknown): ServiceResult<never> {
  return {
    ok: false,
    code: "time_option_not_active",
    area,
    status: 409,
    message: "The selected time option is not active.",
    details
  };
}

export function databaseNotConfiguredResult(area: BackendArea, details?: unknown): ServiceResult<never> {
  return {
    ok: false,
    code: "database_not_configured",
    area,
    status: 503,
    message: "Database access is not configured for this repository-backed route.",
    details
  };
}

function providerNotConfiguredFromRuntime(area: BackendArea, details?: unknown): ServiceResult<never> {
  return {
    ok: false,
    code: "provider_not_configured",
    area,
    status: 503,
    message: "Database runtime provider is not configured for this persistent mutation.",
    details
  };
}

function repositoryResultToService<T>(area: BackendArea, result: RepositoryResult<T>): ServiceResult<T> {
  if (result.ok) {
    return {
      ok: true,
      data: result.data
    };
  }

  if (result.reason === "database_not_configured" || result.reason === "database_unavailable") {
    return databaseNotConfiguredResult(area, result);
  }

  return notImplementedResult(area, result);
}

function notFoundServiceResult(area: BackendArea): ServiceResult<never> {
  return {
    ok: false,
    code: "target_not_found",
    area,
    status: 404,
    message: "No matching resource was found."
  };
}

export function serviceResultToResponse<T>(result: ServiceResult<T>) {
  if (result.ok) {
    return apiOk(result.data, result.status);
  }

  return apiError(result.code, result.message, result.status, {
    area: result.area,
    ...(result.details === undefined ? {} : { details: result.details })
  });
}

const noFixtureMutation = (area: BackendArea) => notImplementedResult(area);
const notImplementedHandler = (area: BackendArea) =>
  (...args: unknown[]) => {
    void args;
    return noFixtureMutation(area);
  };

const providerUnavailableHandler = (area: BackendArea) =>
  (...args: unknown[]) => {
    void args;
    return providerNotConfiguredResult(area);
  };

type TimeFlowServiceOptions = {
  runInTransaction?: typeof withUseravaaTransaction;
  now?: () => Date;
};

type PaymentFlowServiceOptions = {
  runInTransaction?: typeof withUseravaaTransaction;
  now?: () => Date;
};

type AttendanceServiceOptions = {
  runInTransaction?: typeof withUseravaaTransaction;
  now?: () => Date;
  codeGenerator?: () => string;
  saltGenerator?: () => string;
};

type CancellationServiceOptions = {
  runInTransaction?: typeof withUseravaaTransaction;
  now?: () => Date;
};

type ExperienceProfileReviewServiceOptions = {
  runInTransaction?: typeof withUseravaaTransaction;
  now?: () => Date;
};

type InsightModerationServiceOptions = {
  runInTransaction?: typeof withUseravaaTransaction;
  now?: () => Date;
};

type AdminCategoryServiceOptions = {
  runInTransaction?: typeof withUseravaaTransaction;
  now?: () => Date;
};

export type RequesterAttendanceCodeDto = {
  conversationId: string;
  attendanceVerificationId: string;
  status: string;
  code: string;
  codeGeneratedAt: Date | null;
  codeExpiresAt: Date | null;
};

type AdminViewer = {
  id: string;
  role?: string;
};

function isAdminOrSupport(viewer: AdminViewer) {
  return viewer.role === "ADMIN" || viewer.role === "SUPPORT";
}

function isAdmin(viewer: AdminViewer) {
  return viewer.role === "ADMIN";
}

function adminAuditActorRole(viewer: AdminViewer) {
  return viewer.role === "SUPPORT" ? "SUPPORT" : "ADMIN";
}

function paymentReviewAuditStatus(input: {
  paymentStatus: string;
  manualReviewStatus: string;
  conversationStatus: string;
}) {
  return `payment:${input.paymentStatus};review:${input.manualReviewStatus};conversation:${input.conversationStatus}`;
}

function cancellationSupportReviewAuditStatus(input: {
  cancellationStatus: string;
  refundAmountToman: number;
  refundDestination: string;
  conversationStatus: string;
}) {
  return `cancellation:${input.cancellationStatus};credit:${input.refundAmountToman};destination:${input.refundDestination};conversation:${input.conversationStatus}`;
}

function experienceProfileDiscoverVisibility(status: string) {
  return status === "ACTIVE" ? "discover_visible" : "discover_hidden";
}

function experienceProfileReviewAuditStatus(input: { status: string }) {
  return `profile:${input.status};visibility:${experienceProfileDiscoverVisibility(input.status)}`;
}

function insightPublicVisibility(status: string) {
  return status === "PUBLISHED" ? "public_visible" : "public_hidden";
}

function insightModerationAuditStatus(input: { status: string }) {
  return `insight:${input.status};visibility:${insightPublicVisibility(input.status)}`;
}

function insightAnswerPublicVisibility(status: string) {
  return status === "APPROVED" ? "public_visible" : "public_hidden";
}

function insightAnswerModerationAuditStatus(input: { status: string }) {
  return `answer:${input.status};visibility:${insightAnswerPublicVisibility(input.status)}`;
}

function experienceProfileApprovalReadinessIssue(profile: {
  roleTitle: string;
  publicProfessionalSummary: string;
  freeHelp: boolean;
  price30Toman: number | null;
  price60Toman: number | null;
  profile: {
    status: string;
    canOfferExperience: boolean;
  };
}) {
  if (profile.profile.status !== "ACTIVE") {
    return { reason: "base_profile_not_active", status: profile.profile.status };
  }

  if (!profile.profile.canOfferExperience) {
    return { reason: "base_profile_cannot_offer_experience" };
  }

  if (!profile.roleTitle.trim() || !profile.publicProfessionalSummary.trim()) {
    return { reason: "required_public_profile_fields_missing" };
  }

  if (!profile.freeHelp && Math.max(profile.price30Toman ?? 0, profile.price60Toman ?? 0) <= 0) {
    return { reason: "paid_profile_needs_price" };
  }

  return null;
}

function eligibleCancellationSupportCreditAmount(review: {
  conversation: {
    payment: {
      status: string;
      requirement: string;
      amountToman: number;
      finalizedAt: Date | string | null;
    } | null;
  };
}) {
  const payment = review.conversation.payment;

  if (!payment || payment.status !== "PAID" || payment.requirement !== "PAYMENT_REQUIRED" || !payment.finalizedAt) {
    return 0;
  }

  return Math.max(0, payment.amountToman);
}

function safeConversationDtoResult(
  area: BackendArea,
  conversation: ConversationResponseDto | null
): ServiceResult<ConversationResponseDto> {
  if (!conversation) {
    return conversationNotFoundResult(area);
  }

  return {
    ok: true,
    data: conversation
  };
}

function isProviderTimeProposalStatus(status: string) {
  return status === "AWAITING_TIME_PROPOSAL" || status === "NEW_TIME_REQUESTED";
}

function isRequesterNewTimeRequestStatus(status: string) {
  return status === "TIMES_PROPOSED";
}

function isRequesterTimeSelectionStatus(status: string) {
  return status === "TIMES_PROPOSED";
}

function isManualPaymentSubmissionStatus(status: string) {
  return status === "CHECKOUT_CREATED" || status === "UNPAID" || status === "FAILED";
}

function isManualPaymentSubmissionConversationStatus(status: string) {
  return status === "AWAITING_PAYMENT" || status === "PAYMENT_FAILED";
}

function isAdminReviewStatus(status: string) {
  return status === "SUBMITTED" || status === "NEEDS_REVIEW";
}

function isFreeFinalizationConversationStatus(status: string) {
  return status === "CREATED" || status === "AWAITING_PAYMENT" || status === "PAYMENT_FINALIZED" || status === "AWAITING_TIME_PROPOSAL";
}

function normalizeAttendanceCodeInput(code: string) {
  return code
    .trim()
    .replace(/[\u06F0-\u06F9]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0))
    .replace(/[\u0660-\u0669]/g, (digit) => String(digit.charCodeAt(0) - 0x0660));
}

function isAttendancePaymentFinalized(conversation: {
  paymentRequirement: string;
  payment: { status: string; requirement: string; finalizedAt: Date | null } | null;
}) {
  if (!conversation.payment) {
    return false;
  }

  if (conversation.paymentRequirement === "FREE_NOT_REQUIRED") {
    return conversation.payment.requirement === "FREE_NOT_REQUIRED" && conversation.payment.status === "NOT_REQUIRED";
  }

  return conversation.payment.requirement === "PAYMENT_REQUIRED" && conversation.payment.status === "PAID" && Boolean(conversation.payment.finalizedAt);
}

function attendanceEligibilityIssue(
  conversation: {
    status: string;
    providerVisibleAt: Date | null;
    selectedTimeId: string | null;
    selectedTime: { startsAt: Date; status: string } | null;
    confirmedAt: Date | null;
    cancelledAt: Date | null;
    expiredAt: Date | null;
    rejectedAt: Date | null;
    completedAt: Date | null;
    paymentRequirement: string;
    payment: { status: string; requirement: string; finalizedAt: Date | null } | null;
  },
  now: Date,
  options: { requireStarted: boolean }
) {
  if (conversation.status !== "CONFIRMED" || !conversation.confirmedAt) {
    return { reason: "conversation_not_confirmed", status: conversation.status };
  }

  if (!conversation.providerVisibleAt || !isAttendancePaymentFinalized(conversation)) {
    return { reason: "payment_or_free_request_not_finalized" };
  }

  if (!conversation.selectedTimeId || !conversation.selectedTime || conversation.selectedTime.status !== "SELECTED") {
    return { reason: "selected_time_required" };
  }

  if (options.requireStarted && conversation.selectedTime.startsAt > now) {
    return { reason: "session_not_started" };
  }

  if (conversation.cancelledAt || conversation.expiredAt || conversation.rejectedAt || conversation.completedAt) {
    return { reason: "conversation_terminal" };
  }

  return null;
}

export const profileService = {
  async getCurrentProfile(viewer: { id: string }) {
    return repositoryResultToService("profile", await useravaaRepository.profile.getCurrentProfile(viewer.id));
  },
  updateCurrentProfile: notImplementedHandler("profile"),
  submitForReview: notImplementedHandler("profile")
} as const;

export const discoverProfileService = {
  async listPublicProfiles() {
    return repositoryResultToService(
      "discover_profile_read",
      await useravaaRepository.experienceProfile.listPublicProfiles()
    );
  },
  async getPublicProfile(profileId: string) {
    return repositoryResultToService(
      "discover_profile_read",
      await useravaaRepository.experienceProfile.getPublicProfile(profileId)
    );
  }
} as const;

export const conversationService = {
  async listForViewer(viewer: { id: string }) {
    const result = await useravaaRepository.conversations.listForViewer(viewer.id);

    if (!result.ok) {
      return repositoryResultToService("conversation", result);
    }

    return {
      ok: true,
      data: toConversationResponseDtos(result.data, viewer.id)
    } satisfies ServiceResult<ConversationResponseDto[]>;
  },
  async createConversation(
    viewer: { id: string },
    payload: unknown,
    options: {
      runInTransaction?: typeof withUseravaaTransaction;
      now?: () => Date;
    } = {}
  ): Promise<ServiceResult<ConversationResponseDto>> {
    const parsed = requestCreationSchema.safeParse(payload);

    if (!parsed.success) {
      return validationErrorResult("conversation", parsed.error.flatten());
    }

    const runInTransaction = options.runInTransaction ?? withUseravaaTransaction;
    const now = options.now?.() ?? new Date();

    try {
      return await runInTransaction(async (tx: UseravaaTransactionClient): Promise<ServiceResult<ConversationResponseDto>> => {
        const targetProfile = await useravaaRepository.conversations.findExperienceProfileForRequest(
          parsed.data.experienceProfileId,
          tx
        );

        if (!targetProfile) {
          return targetNotFoundResult("conversation");
        }

        if (targetProfile.status !== "ACTIVE") {
          return targetNotAvailableResult("conversation", {
            reason: "experience_profile_not_active",
            status: targetProfile.status
          });
        }

        if (targetProfile.ownerId === viewer.id) {
          return targetNotAvailableResult("conversation", {
            reason: "requester_cannot_request_own_experience"
          });
        }

        const expectedAmount =
          targetProfile.freeHelp ? 0 : parsed.data.durationMinutes === 60 ? targetProfile.price60Toman : targetProfile.price30Toman;

        if (expectedAmount === null || expectedAmount === undefined) {
          return targetNotAvailableResult("conversation", {
            reason: "duration_not_available",
            durationMinutes: parsed.data.durationMinutes
          });
        }

        if (expectedAmount === 0 && parsed.data.paymentRequirement !== "FREE_NOT_REQUIRED") {
          return validationErrorResult("conversation", {
            reason: "free_request_required",
            expectedAmount
          });
        }

        if (expectedAmount > 0 && parsed.data.paymentRequirement !== "PAYMENT_REQUIRED") {
          return validationErrorResult("conversation", {
            reason: "paid_request_required",
            expectedAmount
          });
        }

        if (parsed.data.quotedPriceToman !== expectedAmount) {
          return validationErrorResult("conversation", {
            reason: "quoted_price_mismatch",
            expectedAmount,
            quotedPriceToman: parsed.data.quotedPriceToman
          });
        }

        const createdConversation = await useravaaRepository.conversations.createConversationWithInitialPayment(
          {
            requesterId: viewer.id,
            providerId: targetProfile.ownerId,
            experienceProfileId: targetProfile.id,
            durationMinutes: parsed.data.durationMinutes,
            requestTopic: parsed.data.requestTopic,
            requestNote: parsed.data.requestNote,
            paymentMethod: parsed.data.paymentMethod,
            amountToman: expectedAmount,
            now
          },
          tx
        );

        const dto = toConversationResponseDto(createdConversation, viewer.id);

        if (!dto) {
          return notFoundServiceResult("conversation");
        }

        return {
          ok: true,
          status: 201,
          data: dto
        };
      });
    } catch (error) {
      if (isPrismaClientConfigurationError(error)) {
        return providerNotConfiguredFromRuntime("conversation", {
          code: error.code,
          details: error.details
        });
      }

      throw error;
    }
  },
  async getConversation(viewer: { id: string }, conversationId: string) {
    const result = await useravaaRepository.conversations.getForViewer(viewer.id, conversationId);

    if (!result.ok) {
      return repositoryResultToService("conversation", result);
    }

    if (!result.data) {
      return notFoundServiceResult("conversation");
    }

    const dto = toConversationResponseDto(result.data, viewer.id);

    if (!dto) {
      return notFoundServiceResult("conversation");
    }

    return {
      ok: true,
      data: dto
    } satisfies ServiceResult<ConversationResponseDto>;
  },
  async submitManualPayment(
    viewer: { id: string },
    conversationId: string,
    payload: unknown,
    options: PaymentFlowServiceOptions = {}
  ): Promise<ServiceResult<ConversationResponseDto>> {
    const parsed = manualPaymentSubmissionSchema.safeParse(payload);

    if (!parsed.success) {
      return validationErrorResult("manual_payment", parsed.error.flatten());
    }

    const now = options.now?.() ?? new Date();
    const runInTransaction = options.runInTransaction ?? withUseravaaTransaction;

    try {
      return await runInTransaction(async (tx: UseravaaTransactionClient): Promise<ServiceResult<ConversationResponseDto>> => {
        const payment = await useravaaRepository.payment.findPaymentForRequesterManualSubmission(
          conversationId,
          viewer.id,
          tx
        );

        if (!payment) {
          return conversationNotFoundResult("manual_payment");
        }

        if (
          payment.method !== "CARD_TO_CARD" ||
          payment.requirement !== "PAYMENT_REQUIRED" ||
          payment.conversation.paymentRequirement !== "PAYMENT_REQUIRED"
        ) {
          return invalidStateResult("manual_payment", {
            reason: "manual_payment_not_available",
            method: payment.method,
            requirement: payment.requirement
          });
        }

        if (!isManualPaymentSubmissionStatus(payment.status)) {
          return invalidStateResult("manual_payment", {
            reason: "payment_not_open_for_submission",
            paymentStatus: payment.status
          });
        }

        if (!isManualPaymentSubmissionConversationStatus(payment.conversation.status)) {
          return invalidStateResult("manual_payment", {
            reason: "conversation_not_awaiting_payment",
            conversationStatus: payment.conversation.status
          });
        }

        if (
          payment.conversation.providerVisibleAt ||
          payment.conversation.selectedTimeId ||
          payment.conversation.confirmedAt ||
          payment.conversation.cancelledAt ||
          payment.conversation.expiredAt ||
          payment.conversation.rejectedAt
        ) {
          return invalidStateResult("manual_payment", {
            reason: "conversation_already_advanced"
          });
        }

        const updated = await useravaaRepository.payment.submitManualPayment(
          {
            conversationId,
            paymentId: payment.id,
            requesterId: viewer.id,
            referenceNumber: parsed.data.referenceNumber,
            receipt: parsed.data.receipt,
            now
          },
          tx
        );

        return safeConversationDtoResult("manual_payment", toConversationResponseDto(updated, viewer.id));
      });
    } catch (error) {
      if (isPrismaClientConfigurationError(error)) {
        return providerNotConfiguredFromRuntime("manual_payment", {
          code: error.code,
          details: error.details
        });
      }

      throw error;
    }
  },
  createOnlinePayment: providerUnavailableHandler("payment"),
  async finalizeFreePayment(
    viewer: { id: string },
    conversationId: string,
    payload: unknown = {},
    options: PaymentFlowServiceOptions = {}
  ): Promise<ServiceResult<ConversationResponseDto>> {
    const parsed = freePaymentFinalizationSchema.safeParse(payload ?? {});

    if (!parsed.success) {
      return validationErrorResult("payment", parsed.error.flatten());
    }

    const now = options.now?.() ?? new Date();
    const runInTransaction = options.runInTransaction ?? withUseravaaTransaction;

    try {
      return await runInTransaction(async (tx: UseravaaTransactionClient): Promise<ServiceResult<ConversationResponseDto>> => {
        const payment = await useravaaRepository.payment.findFreePaymentForRequesterFinalization(
          conversationId,
          viewer.id,
          tx
        );

        if (!payment) {
          return conversationNotFoundResult("payment");
        }

        if (
          payment.method !== "FREE" ||
          payment.requirement !== "FREE_NOT_REQUIRED" ||
          payment.amountToman !== 0 ||
          payment.conversation.paymentRequirement !== "FREE_NOT_REQUIRED"
        ) {
          return invalidStateResult("payment", {
            reason: "free_finalization_not_available",
            method: payment.method,
            requirement: payment.requirement,
            amountToman: payment.amountToman
          });
        }

        if (!isFreeFinalizationConversationStatus(payment.conversation.status)) {
          return invalidStateResult("payment", {
            reason: "conversation_not_free_finalizable",
            conversationStatus: payment.conversation.status
          });
        }

        if (
          payment.conversation.selectedTimeId ||
          payment.conversation.confirmedAt ||
          payment.conversation.cancelledAt ||
          payment.conversation.expiredAt ||
          payment.conversation.rejectedAt
        ) {
          return invalidStateResult("payment", {
            reason: "conversation_already_advanced"
          });
        }

        const updated = await useravaaRepository.payment.finalizeFreePayment(
          {
            conversationId,
            paymentId: payment.id,
            requesterId: viewer.id,
            now: payment.finalizedAt ?? now
          },
          tx
        );

        return safeConversationDtoResult("payment", toConversationResponseDto(updated, viewer.id));
      });
    } catch (error) {
      if (isPrismaClientConfigurationError(error)) {
        return providerNotConfiguredFromRuntime("payment", {
          code: error.code,
          details: error.details
        });
      }

      throw error;
    }
  },
  confirmDevPayment: notImplementedHandler("payment"),
  async proposeTimes(
    viewer: { id: string },
    conversationId: string,
    payload: unknown,
    options: TimeFlowServiceOptions = {}
  ): Promise<ServiceResult<ConversationResponseDto>> {
    const parsed = proposedTimesSubmissionSchema.safeParse(payload);

    if (!parsed.success) {
      return validationErrorResult("time_proposal", parsed.error.flatten());
    }

    const now = options.now?.() ?? new Date();
    const timeOptions = parsed.data.timeOptions.map((option) => ({
      startsAt: new Date(option.startsAt),
      shamsiDateLabel: option.shamsiDateLabel,
      timeLabel: option.timeLabel
    }));

    const pastOption = timeOptions.find((option) => option.startsAt <= now);

    if (pastOption) {
      return validationErrorResult("time_proposal", {
        reason: "proposed_time_must_be_in_future",
        startsAt: pastOption.startsAt.toISOString()
      });
    }

    const runInTransaction = options.runInTransaction ?? withUseravaaTransaction;

    try {
      return await runInTransaction(async (tx: UseravaaTransactionClient): Promise<ServiceResult<ConversationResponseDto>> => {
        const conversation = await useravaaRepository.timeProposal.findConversationForProviderTimeProposal(
          conversationId,
          viewer.id,
          tx
        );

        if (!conversation) {
          return conversationNotFoundResult("time_proposal");
        }

        if (!conversation.providerVisibleAt) {
          return invalidStateResult("time_proposal", {
            reason: "conversation_not_provider_visible"
          });
        }

        if (
          !isProviderTimeProposalStatus(conversation.status) ||
          conversation.selectedTimeId ||
          conversation.confirmedAt ||
          conversation.cancelledAt ||
          conversation.expiredAt ||
          conversation.rejectedAt
        ) {
          return invalidStateResult("time_proposal", {
            status: conversation.status
          });
        }

        const updated = await useravaaRepository.timeProposal.createProposedTimeSet(
          {
            conversationId,
            providerId: viewer.id,
            timeOptions,
            now
          },
          tx
        );

        return safeConversationDtoResult("time_proposal", toConversationResponseDto(updated, viewer.id));
      });
    } catch (error) {
      if (isPrismaClientConfigurationError(error)) {
        return providerNotConfiguredFromRuntime("time_proposal", {
          code: error.code,
          details: error.details
        });
      }

      throw error;
    }
  },
  async requestNewTimes(
    viewer: { id: string },
    conversationId: string,
    payload: unknown,
    options: TimeFlowServiceOptions = {}
  ): Promise<ServiceResult<ConversationResponseDto>> {
    const parsed = newTimeRequestSchema.safeParse(payload);

    if (!parsed.success) {
      return validationErrorResult("new_time_request", parsed.error.flatten());
    }

    const now = options.now?.() ?? new Date();
    const runInTransaction = options.runInTransaction ?? withUseravaaTransaction;

    try {
      return await runInTransaction(async (tx: UseravaaTransactionClient): Promise<ServiceResult<ConversationResponseDto>> => {
        const conversation = await useravaaRepository.timeProposal.findConversationForRequesterNewTimeRequest(
          conversationId,
          viewer.id,
          tx
        );

        if (!conversation) {
          return conversationNotFoundResult("new_time_request");
        }

        if (
          !isRequesterNewTimeRequestStatus(conversation.status) ||
          conversation.selectedTimeId ||
          conversation.confirmedAt ||
          conversation.cancelledAt ||
          conversation.expiredAt ||
          conversation.rejectedAt
        ) {
          return invalidStateResult("new_time_request", {
            status: conversation.status
          });
        }

        const activeOptionCount = await useravaaRepository.timeProposal.countActiveOptionsForConversation(conversationId, tx);

        if (activeOptionCount === 0) {
          return invalidStateResult("new_time_request", {
            reason: "no_active_time_options"
          });
        }

        const pendingNewTimeRequestCount = await useravaaRepository.timeProposal.countRequestedNewTimeRequests(
          conversationId,
          tx
        );

        if (pendingNewTimeRequestCount > 0) {
          return invalidStateResult("new_time_request", {
            reason: "new_time_request_already_pending"
          });
        }

        const updated = await useravaaRepository.timeProposal.createNewTimeRequest(
          {
            conversationId,
            requesterId: viewer.id,
            note: parsed.data.note,
            now
          },
          tx
        );

        return safeConversationDtoResult("new_time_request", toConversationResponseDto(updated, viewer.id));
      });
    } catch (error) {
      if (isPrismaClientConfigurationError(error)) {
        return providerNotConfiguredFromRuntime("new_time_request", {
          code: error.code,
          details: error.details
        });
      }

      throw error;
    }
  },
  async selectTime(
    viewer: { id: string },
    conversationId: string,
    payload: unknown,
    options: TimeFlowServiceOptions = {}
  ): Promise<ServiceResult<ConversationResponseDto>> {
    const parsed = timeSelectionSchema.safeParse(payload);

    if (!parsed.success) {
      return validationErrorResult("time_selection", parsed.error.flatten());
    }

    const now = options.now?.() ?? new Date();
    const runInTransaction = options.runInTransaction ?? withUseravaaTransaction;

    try {
      return await runInTransaction(async (tx: UseravaaTransactionClient): Promise<ServiceResult<ConversationResponseDto>> => {
        const conversation = await useravaaRepository.timeProposal.findConversationForRequesterTimeSelection(
          conversationId,
          viewer.id,
          tx
        );

        if (!conversation) {
          return conversationNotFoundResult("time_selection");
        }

        if (
          !isRequesterTimeSelectionStatus(conversation.status) ||
          conversation.selectedTimeId ||
          conversation.confirmedAt ||
          conversation.cancelledAt ||
          conversation.expiredAt ||
          conversation.rejectedAt
        ) {
          return invalidStateResult("time_selection", {
            status: conversation.status
          });
        }

        const timeOption = await useravaaRepository.timeProposal.findSelectableTimeOption(
          {
            conversationId,
            proposedTimeId: parsed.data.proposedTimeId,
            proposalSetId: parsed.data.proposalSetId
          },
          tx
        );

        if (!timeOption) {
          return timeOptionNotFoundResult("time_selection");
        }

        if (timeOption.status !== "ACTIVE" || timeOption.proposalSet.status !== "ACTIVE" || timeOption.startsAt <= now) {
          return timeOptionNotActiveResult("time_selection", {
            status: timeOption.status,
            proposalSetStatus: timeOption.proposalSet.status,
            startsAt: timeOption.startsAt
          });
        }

        const updated = await useravaaRepository.timeProposal.selectTime(
          {
            conversationId,
            requesterId: viewer.id,
            proposedTimeId: parsed.data.proposedTimeId,
            proposalSetId: parsed.data.proposalSetId,
            now
          },
          tx
        );

        if (!updated) {
          return conversationNotFoundResult("time_selection");
        }

        return safeConversationDtoResult("time_selection", toConversationResponseDto(updated, viewer.id));
      });
    } catch (error) {
      if (isPrismaClientConfigurationError(error)) {
        return providerNotConfiguredFromRuntime("time_selection", {
          code: error.code,
          details: error.details
        });
      }

      throw error;
    }
  },
  async getAttendanceCodeForRequester(
    viewer: { id: string },
    conversationId: string,
    options: AttendanceServiceOptions = {}
  ): Promise<ServiceResult<RequesterAttendanceCodeDto>> {
    const now = options.now?.() ?? new Date();
    const runInTransaction = options.runInTransaction ?? withUseravaaTransaction;

    try {
      return await runInTransaction(async (tx: UseravaaTransactionClient): Promise<ServiceResult<RequesterAttendanceCodeDto>> => {
        const conversation = await useravaaRepository.attendance.findConversationForRequesterAttendanceCode(
          conversationId,
          viewer.id,
          tx
        );

        if (!conversation) {
          return conversationNotFoundResult("attendance");
        }

        const eligibilityIssue = attendanceEligibilityIssue(conversation, now, {
          requireStarted: false
        });

        if (eligibilityIssue) {
          return invalidStateResult("attendance", eligibilityIssue);
        }

        const material = buildAttendanceVerificationMaterial(
          conversationId,
          now,
          options.codeGenerator?.(),
          options.saltGenerator?.()
        );
        const attendance = await useravaaRepository.attendance.ensureAttendanceVerificationForConversation(
          conversationId,
          material,
          tx
        );

        if (attendance.status === "VERIFIED") {
          return attendanceAlreadyVerifiedResult("attendance");
        }

        if (attendance.status === "NEEDS_REVIEW" || attendance.status === "EXPIRED") {
          return invalidStateResult("attendance", {
            attendanceStatus: attendance.status
          });
        }

        if (attendance.codeExpiresAt && attendance.codeExpiresAt <= now) {
          return invalidStateResult("attendance", {
            reason: "attendance_code_expired"
          });
        }

        const code = decodeRequesterAttendanceCode(attendance.requesterCodeCiphertext);

        if (!code || !/^[0-9]{5}$/.test(code)) {
          return attendanceNotFoundResult("attendance");
        }

        return {
          ok: true,
          data: {
            conversationId,
            attendanceVerificationId: attendance.id,
            status: attendance.status,
            code,
            codeGeneratedAt: attendance.codeGeneratedAt,
            codeExpiresAt: attendance.codeExpiresAt
          }
        };
      });
    } catch (error) {
      if (isPrismaClientConfigurationError(error)) {
        return providerNotConfiguredFromRuntime("attendance", {
          code: error.code,
          details: error.details
        });
      }

      throw error;
    }
  },
  async submitAttendanceCode(
    viewer: { id: string },
    conversationId: string,
    payload: unknown,
    options: AttendanceServiceOptions = {}
  ): Promise<ServiceResult<ConversationResponseDto>> {
    const parsed = attendanceSubmitCodeSchema.safeParse(payload);

    if (!parsed.success) {
      return validationErrorResult("attendance", parsed.error.flatten());
    }

    const normalizedCode = normalizeAttendanceCodeInput(parsed.data.code);

    if (!/^[0-9]{5}$/.test(normalizedCode)) {
      return validationErrorResult("attendance", {
        reason: "attendance_code_must_be_five_digits"
      });
    }

    const now = options.now?.() ?? new Date();
    const runInTransaction = options.runInTransaction ?? withUseravaaTransaction;

    try {
      return await runInTransaction(async (tx: UseravaaTransactionClient): Promise<ServiceResult<ConversationResponseDto>> => {
        const conversation = await useravaaRepository.attendance.findConversationForProviderAttendanceSubmission(
          conversationId,
          viewer.id,
          tx
        );

        if (!conversation) {
          return conversationNotFoundResult("attendance");
        }

        const eligibilityIssue = attendanceEligibilityIssue(conversation, now, {
          requireStarted: true
        });

        if (eligibilityIssue) {
          return invalidStateResult("attendance", eligibilityIssue);
        }

        const material = buildAttendanceVerificationMaterial(
          conversationId,
          now,
          options.codeGenerator?.(),
          options.saltGenerator?.()
        );
        const attendance = await useravaaRepository.attendance.ensureAttendanceVerificationForConversation(
          conversationId,
          material,
          tx
        );

        if (attendance.status === "VERIFIED") {
          return attendanceAlreadyVerifiedResult("attendance");
        }

        if (attendance.status === "NEEDS_REVIEW" || attendance.status === "EXPIRED") {
          return invalidStateResult("attendance", {
            attendanceStatus: attendance.status
          });
        }

        if (attendance.codeExpiresAt && attendance.codeExpiresAt <= now) {
          return invalidStateResult("attendance", {
            reason: "attendance_code_expired"
          });
        }

        if (!attendance.codeHash || !attendance.codeSalt) {
          return attendanceNotFoundResult("attendance");
        }

        const submittedCodeHash = hashAttendanceCode(normalizedCode, conversationId, attendance.codeSalt);
        const verified = submittedCodeHash === attendance.codeHash;
        const attempts = verified ? attendance.attempts : attendance.attempts + 1;

        if (!verified) {
          await useravaaRepository.attendance.submitCode(
            {
              conversationId,
              providerId: viewer.id,
              submittedCodeHash,
              attempts,
              now,
              verified: false,
              failedStatus: attempts >= ATTENDANCE_CODE_MAX_ATTEMPTS ? "NEEDS_REVIEW" : "FAILED"
            },
            tx
          );

          return attendanceCodeInvalidResult("attendance", {
            attempts,
            maxAttempts: ATTENDANCE_CODE_MAX_ATTEMPTS
          });
        }

        const updated = await useravaaRepository.attendance.submitCode(
          {
            conversationId,
            providerId: viewer.id,
            submittedCodeHash,
            attempts,
            now,
            verified: true
          },
          tx
        );

        return safeConversationDtoResult("attendance", updated ? toConversationResponseDto(updated, viewer.id) : null);
      });
    } catch (error) {
      if (isPrismaClientConfigurationError(error)) {
        return providerNotConfiguredFromRuntime("attendance", {
          code: error.code,
          details: error.details
        });
      }

      throw error;
    }
  },
  async cancelConversation(
    viewer: { id: string },
    conversationId: string,
    payload: unknown,
    options: CancellationServiceOptions = {}
  ): Promise<ServiceResult<ConversationResponseDto>> {
    const parsed = cancellationRequestSchema.safeParse(payload);

    if (!parsed.success) {
      return validationErrorResult("cancellation", parsed.error.flatten());
    }

    const now = options.now?.() ?? new Date();
    const runInTransaction = options.runInTransaction ?? withUseravaaTransaction;

    try {
      return await runInTransaction(async (tx: UseravaaTransactionClient): Promise<ServiceResult<ConversationResponseDto>> => {
        const conversation = await useravaaRepository.cancellation.findConversationForRequesterCancellation(
          conversationId,
          viewer.id,
          tx
        );

        if (!conversation) {
          return conversationNotFoundResult("cancellation");
        }

        if (conversation.paymentRequirement === "PAYMENT_REQUIRED" && !conversation.payment) {
          return paymentNotFoundResult("cancellation");
        }

        const policy = calculateRequesterCancellationPolicy(conversation, now);

        if (!policy.allowed) {
          return cancellationNotAllowedResult("cancellation", {
            reason: policy.reason
          });
        }

        const updated = await useravaaRepository.cancellation.createRequesterCancellation(
          {
            conversationId,
            requesterId: viewer.id,
            paymentId: conversation.payment?.id,
            reasonCode: parsed.data.reasonCode,
            otherReasonText: parsed.data.otherReasonText,
            policy,
            now
          },
          tx
        );

        return safeConversationDtoResult("cancellation", updated ? toConversationResponseDto(updated, viewer.id) : null);
      });
    } catch (error) {
      if (isPrismaClientConfigurationError(error)) {
        return providerNotConfiguredFromRuntime("cancellation", {
          code: error.code,
          details: error.details
        });
      }

      throw error;
    }
  }
} as const;

export const walletService = {
  async getWallet(viewer: { id: string }) {
    return repositoryResultToService("wallet", await useravaaRepository.wallet.getForViewer(viewer.id));
  },
  requestWithdrawal: notImplementedHandler("wallet")
} as const;

export const notificationService = {
  async listForViewer(viewer: { id: string }) {
    return repositoryResultToService("notification", await useravaaRepository.notifications.listForViewer(viewer.id));
  },
  markRead: notImplementedHandler("notification")
} as const;

export const insightService = {
  async listPublicInsights() {
    return repositoryResultToService("insight", await useravaaRepository.insights.listPublic());
  },
  async getPublicInsight(slug: string) {
    return repositoryResultToService("insight", await useravaaRepository.insights.getPublicBySlug(slug));
  },
  submitAnswer: notImplementedHandler("insight_answer")
} as const;

export const adminInsightModerationService = {
  async hideInsight(
    viewer: AdminViewer,
    insightId: string,
    payload: unknown,
    options: InsightModerationServiceOptions = {}
  ) {
    if (!isAdminOrSupport(viewer)) {
      return unauthorizedResult("admin_insight");
    }

    const parsed = adminInsightHideSchema.safeParse(payload);

    if (!parsed.success) {
      return validationErrorResult("admin_insight", parsed.error.flatten());
    }

    const now = options.now?.() ?? new Date();
    const runInTransaction = options.runInTransaction ?? withUseravaaTransaction;

    try {
      return await runInTransaction(async (tx: UseravaaTransactionClient) => {
        const insight = await useravaaRepository.insights.findInsightForAdminAction(insightId, tx);

        if (!insight) {
          return insightNotFoundResult("admin_insight");
        }

        if (insight.authorUserId === viewer.id) {
          return unauthorizedResult("admin_insight", {
            reason: "insight_author_cannot_self_moderate"
          });
        }

        if (insight.status !== "PUBLISHED") {
          return invalidStateResult("admin_insight", {
            insightStatus: insight.status
          });
        }

        const updated = await useravaaRepository.insights.hideInsight(
          {
            insightId,
            adminId: viewer.id,
            reasonCode: parsed.data.reasonCode,
            reviewNote: parsed.data.reviewNote,
            now
          },
          tx
        );

        await useravaaRepository.adminAudit.createInsightModerationEvent(
          {
            actorAdminUserId: viewer.id,
            actorRole: adminAuditActorRole(viewer),
            action: "INSIGHT_HIDDEN",
            insightId,
            authorUserId: insight.authorUserId,
            beforeStatus: insightModerationAuditStatus({ status: insight.status }),
            afterStatus: insightModerationAuditStatus({ status: updated.status }),
            reason: parsed.data.reasonCode,
            note: parsed.data.reviewNote,
            metadata: {
              moderationDecision: "hidden",
              beforeVisibility: insightPublicVisibility(insight.status),
              afterVisibility: insightPublicVisibility(updated.status)
            },
            now
          },
          tx
        );

        return {
          ok: true,
          data: updated
        } satisfies ServiceResult<typeof updated>;
      });
    } catch (error) {
      if (isPrismaClientConfigurationError(error)) {
        return providerNotConfiguredFromRuntime("admin_insight", {
          code: error.code,
          details: error.details
        });
      }

      throw error;
    }
  },
  async restoreInsight(
    viewer: AdminViewer,
    insightId: string,
    payload: unknown,
    options: InsightModerationServiceOptions = {}
  ) {
    if (!isAdminOrSupport(viewer)) {
      return unauthorizedResult("admin_insight");
    }

    const parsed = adminInsightRestoreSchema.safeParse(payload);

    if (!parsed.success) {
      return validationErrorResult("admin_insight", parsed.error.flatten());
    }

    const now = options.now?.() ?? new Date();
    const runInTransaction = options.runInTransaction ?? withUseravaaTransaction;

    try {
      return await runInTransaction(async (tx: UseravaaTransactionClient) => {
        const insight = await useravaaRepository.insights.findInsightForAdminAction(insightId, tx);

        if (!insight) {
          return insightNotFoundResult("admin_insight");
        }

        if (insight.authorUserId === viewer.id) {
          return unauthorizedResult("admin_insight", {
            reason: "insight_author_cannot_self_restore"
          });
        }

        if (insight.status !== "HIDDEN") {
          return invalidStateResult("admin_insight", {
            insightStatus: insight.status
          });
        }

        const updated = await useravaaRepository.insights.restoreInsight(
          {
            insightId,
            adminId: viewer.id,
            reviewNote: parsed.data.reviewNote,
            now
          },
          tx
        );

        await useravaaRepository.adminAudit.createInsightModerationEvent(
          {
            actorAdminUserId: viewer.id,
            actorRole: adminAuditActorRole(viewer),
            action: "INSIGHT_RESTORED",
            insightId,
            authorUserId: insight.authorUserId,
            beforeStatus: insightModerationAuditStatus({ status: insight.status }),
            afterStatus: insightModerationAuditStatus({ status: updated.status }),
            note: parsed.data.reviewNote,
            metadata: {
              moderationDecision: "restored",
              beforeVisibility: insightPublicVisibility(insight.status),
              afterVisibility: insightPublicVisibility(updated.status)
            },
            now
          },
          tx
        );

        return {
          ok: true,
          data: updated
        } satisfies ServiceResult<typeof updated>;
      });
    } catch (error) {
      if (isPrismaClientConfigurationError(error)) {
        return providerNotConfiguredFromRuntime("admin_insight", {
          code: error.code,
          details: error.details
        });
      }

      throw error;
    }
  },
  async deleteInsight(
    viewer: AdminViewer,
    insightId: string,
    payload: unknown,
    options: InsightModerationServiceOptions = {}
  ) {
    if (!isAdminOrSupport(viewer)) {
      return unauthorizedResult("admin_insight");
    }

    const parsed = adminInsightDeleteSchema.safeParse(payload);

    if (!parsed.success) {
      return validationErrorResult("admin_insight", parsed.error.flatten());
    }

    const now = options.now?.() ?? new Date();
    const runInTransaction = options.runInTransaction ?? withUseravaaTransaction;

    try {
      return await runInTransaction(async (tx: UseravaaTransactionClient) => {
        const insight = await useravaaRepository.insights.findInsightForAdminAction(insightId, tx);

        if (!insight) {
          return insightNotFoundResult("admin_insight");
        }

        if (insight.authorUserId === viewer.id) {
          return unauthorizedResult("admin_insight", {
            reason: "insight_author_cannot_self_delete"
          });
        }

        if (insight.status === "ARCHIVED") {
          return invalidStateResult("admin_insight", {
            insightStatus: insight.status
          });
        }

        const updated = await useravaaRepository.insights.archiveInsight(
          {
            insightId,
            adminId: viewer.id,
            reasonCode: parsed.data.reasonCode,
            reviewNote: parsed.data.reviewNote,
            now
          },
          tx
        );

        await useravaaRepository.adminAudit.createInsightModerationEvent(
          {
            actorAdminUserId: viewer.id,
            actorRole: adminAuditActorRole(viewer),
            action: "INSIGHT_DELETED",
            insightId,
            authorUserId: insight.authorUserId,
            beforeStatus: insightModerationAuditStatus({ status: insight.status }),
            afterStatus: insightModerationAuditStatus({ status: updated.status }),
            reason: parsed.data.reasonCode,
            note: parsed.data.reviewNote,
            metadata: {
              moderationDecision: "softDeleted",
              beforeVisibility: insightPublicVisibility(insight.status),
              afterVisibility: insightPublicVisibility(updated.status)
            },
            now
          },
          tx
        );

        return {
          ok: true,
          data: updated
        } satisfies ServiceResult<typeof updated>;
      });
    } catch (error) {
      if (isPrismaClientConfigurationError(error)) {
        return providerNotConfiguredFromRuntime("admin_insight", {
          code: error.code,
          details: error.details
        });
      }

      throw error;
    }
  },
  async hideInsightAnswer(
    viewer: AdminViewer,
    answerId: string,
    payload: unknown,
    options: InsightModerationServiceOptions = {}
  ) {
    if (!isAdminOrSupport(viewer)) {
      return unauthorizedResult("admin_insight");
    }

    const parsed = adminInsightAnswerHideSchema.safeParse(payload);

    if (!parsed.success) {
      return validationErrorResult("admin_insight", parsed.error.flatten());
    }

    const now = options.now?.() ?? new Date();
    const runInTransaction = options.runInTransaction ?? withUseravaaTransaction;

    try {
      return await runInTransaction(async (tx: UseravaaTransactionClient) => {
        const answer = await useravaaRepository.insights.findInsightAnswerForAdminAction(answerId, tx);

        if (!answer) {
          return insightAnswerNotFoundResult("admin_insight");
        }

        if (answer.authorUserId === viewer.id) {
          return unauthorizedResult("admin_insight", {
            reason: "insight_answer_author_cannot_self_moderate"
          });
        }

        if (answer.status !== "APPROVED" && answer.status !== "SUBMITTED") {
          return invalidStateResult("admin_insight", {
            answerStatus: answer.status
          });
        }

        const updated = await useravaaRepository.insights.hideInsightAnswer(
          {
            answerId,
            adminId: viewer.id,
            reasonCode: parsed.data.reasonCode,
            reviewNote: parsed.data.reviewNote,
            now
          },
          tx
        );

        await useravaaRepository.adminAudit.createInsightAnswerModerationEvent(
          {
            actorAdminUserId: viewer.id,
            actorRole: adminAuditActorRole(viewer),
            action: "INSIGHT_ANSWER_HIDDEN",
            answerId,
            insightId: answer.insightId,
            authorUserId: answer.authorUserId,
            beforeStatus: insightAnswerModerationAuditStatus({ status: answer.status }),
            afterStatus: insightAnswerModerationAuditStatus({ status: updated.status }),
            reason: parsed.data.reasonCode,
            note: parsed.data.reviewNote,
            metadata: {
              moderationDecision: "answerHidden",
              beforeVisibility: insightAnswerPublicVisibility(answer.status),
              afterVisibility: insightAnswerPublicVisibility(updated.status)
            },
            now
          },
          tx
        );

        return {
          ok: true,
          data: updated
        } satisfies ServiceResult<typeof updated>;
      });
    } catch (error) {
      if (isPrismaClientConfigurationError(error)) {
        return providerNotConfiguredFromRuntime("admin_insight", {
          code: error.code,
          details: error.details
        });
      }

      throw error;
    }
  }
} as const;

export const adminExperienceProfileService = {
  async approve(
    viewer: AdminViewer,
    profileId: string,
    payload: unknown,
    options: ExperienceProfileReviewServiceOptions = {}
  ) {
    if (!isAdminOrSupport(viewer)) {
      return unauthorizedResult("admin_experience_profile");
    }

    const parsed = adminExperienceProfileApprovalSchema.safeParse(payload);

    if (!parsed.success) {
      return validationErrorResult("admin_experience_profile", parsed.error.flatten());
    }

    const now = options.now?.() ?? new Date();
    const runInTransaction = options.runInTransaction ?? withUseravaaTransaction;

    try {
      return await runInTransaction(async (tx: UseravaaTransactionClient) => {
        const profile = await useravaaRepository.experienceProfile.findForAdminReviewAction(profileId, tx);

        if (!profile) {
          return profileNotFoundResult("admin_experience_profile");
        }

        if (profile.ownerId === viewer.id) {
          return unauthorizedResult("admin_experience_profile", {
            reason: "profile_owner_cannot_self_approve"
          });
        }

        if (profile.status !== "PENDING_REVIEW" && profile.status !== "NEEDS_CHANGES") {
          return invalidStateResult("admin_experience_profile", {
            profileStatus: profile.status
          });
        }

        const readinessIssue = experienceProfileApprovalReadinessIssue(profile);

        if (readinessIssue) {
          return invalidStateResult("admin_experience_profile", readinessIssue);
        }

        const updated = await useravaaRepository.experienceProfile.approveAdminReview(
          {
            profileId,
            adminId: viewer.id,
            reviewNote: parsed.data.reviewNote,
            now
          },
          tx
        );

        await useravaaRepository.adminAudit.createExperienceProfileReviewEvent(
          {
            actorAdminUserId: viewer.id,
            actorRole: adminAuditActorRole(viewer),
            action: "EXPERIENCE_PROFILE_APPROVED",
            profileId,
            ownerUserId: profile.ownerId,
            beforeStatus: experienceProfileReviewAuditStatus({ status: profile.status }),
            afterStatus: experienceProfileReviewAuditStatus({ status: updated.status }),
            note: parsed.data.reviewNote,
            metadata: {
              reviewDecision: "approved",
              beforeVisibility: experienceProfileDiscoverVisibility(profile.status),
              afterVisibility: experienceProfileDiscoverVisibility(updated.status)
            },
            now
          },
          tx
        );

        return {
          ok: true,
          data: updated
        } satisfies ServiceResult<typeof updated>;
      });
    } catch (error) {
      if (isPrismaClientConfigurationError(error)) {
        return providerNotConfiguredFromRuntime("admin_experience_profile", {
          code: error.code,
          details: error.details
        });
      }

      throw error;
    }
  },
  async requestChanges(
    viewer: AdminViewer,
    profileId: string,
    payload: unknown,
    options: ExperienceProfileReviewServiceOptions = {}
  ) {
    if (!isAdminOrSupport(viewer)) {
      return unauthorizedResult("admin_experience_profile");
    }

    const parsed = adminExperienceProfileRequestChangesSchema.safeParse(payload);

    if (!parsed.success) {
      return validationErrorResult("admin_experience_profile", parsed.error.flatten());
    }

    const now = options.now?.() ?? new Date();
    const runInTransaction = options.runInTransaction ?? withUseravaaTransaction;

    try {
      return await runInTransaction(async (tx: UseravaaTransactionClient) => {
        const profile = await useravaaRepository.experienceProfile.findForAdminReviewAction(profileId, tx);

        if (!profile) {
          return profileNotFoundResult("admin_experience_profile");
        }

        if (profile.ownerId === viewer.id) {
          return unauthorizedResult("admin_experience_profile", {
            reason: "profile_owner_cannot_self_review"
          });
        }

        if (profile.status !== "PENDING_REVIEW" && profile.status !== "ACTIVE") {
          return invalidStateResult("admin_experience_profile", {
            profileStatus: profile.status
          });
        }

        const updated = await useravaaRepository.experienceProfile.requestAdminChanges(
          {
            profileId,
            adminId: viewer.id,
            reviewReason: parsed.data.reviewReason,
            reviewNote: parsed.data.reviewNote,
            now
          },
          tx
        );

        await useravaaRepository.adminAudit.createExperienceProfileReviewEvent(
          {
            actorAdminUserId: viewer.id,
            actorRole: adminAuditActorRole(viewer),
            action: "EXPERIENCE_PROFILE_CHANGES_REQUESTED",
            profileId,
            ownerUserId: profile.ownerId,
            beforeStatus: experienceProfileReviewAuditStatus({ status: profile.status }),
            afterStatus: experienceProfileReviewAuditStatus({ status: updated.status }),
            reason: parsed.data.reviewReason,
            note: parsed.data.reviewNote,
            metadata: {
              reviewDecision: "changesRequested",
              beforeVisibility: experienceProfileDiscoverVisibility(profile.status),
              afterVisibility: experienceProfileDiscoverVisibility(updated.status)
            },
            now
          },
          tx
        );

        return {
          ok: true,
          data: updated
        } satisfies ServiceResult<typeof updated>;
      });
    } catch (error) {
      if (isPrismaClientConfigurationError(error)) {
        return providerNotConfiguredFromRuntime("admin_experience_profile", {
          code: error.code,
          details: error.details
        });
      }

      throw error;
    }
  },
  async hide(
    viewer: AdminViewer,
    profileId: string,
    payload: unknown,
    options: ExperienceProfileReviewServiceOptions = {}
  ) {
    if (!isAdminOrSupport(viewer)) {
      return unauthorizedResult("admin_experience_profile");
    }

    const parsed = adminExperienceProfileHideSchema.safeParse(payload);

    if (!parsed.success) {
      return validationErrorResult("admin_experience_profile", parsed.error.flatten());
    }

    const now = options.now?.() ?? new Date();
    const runInTransaction = options.runInTransaction ?? withUseravaaTransaction;

    try {
      return await runInTransaction(async (tx: UseravaaTransactionClient) => {
        const profile = await useravaaRepository.experienceProfile.findForAdminReviewAction(profileId, tx);

        if (!profile) {
          return profileNotFoundResult("admin_experience_profile");
        }

        if (profile.ownerId === viewer.id) {
          return unauthorizedResult("admin_experience_profile", {
            reason: "profile_owner_cannot_self_moderate"
          });
        }

        if (profile.status !== "ACTIVE" && profile.status !== "PENDING_REVIEW" && profile.status !== "NEEDS_CHANGES") {
          return invalidStateResult("admin_experience_profile", {
            profileStatus: profile.status
          });
        }

        const updated = await useravaaRepository.experienceProfile.hideFromDiscover(
          {
            profileId,
            adminId: viewer.id,
            reviewReason: parsed.data.reviewReason,
            reviewNote: parsed.data.reviewNote,
            now
          },
          tx
        );

        await useravaaRepository.adminAudit.createExperienceProfileReviewEvent(
          {
            actorAdminUserId: viewer.id,
            actorRole: adminAuditActorRole(viewer),
            action: "EXPERIENCE_PROFILE_HIDDEN",
            profileId,
            ownerUserId: profile.ownerId,
            beforeStatus: experienceProfileReviewAuditStatus({ status: profile.status }),
            afterStatus: experienceProfileReviewAuditStatus({ status: updated.status }),
            reason: parsed.data.reviewReason,
            note: parsed.data.reviewNote,
            metadata: {
              reviewDecision: "hidden",
              beforeVisibility: experienceProfileDiscoverVisibility(profile.status),
              afterVisibility: experienceProfileDiscoverVisibility(updated.status)
            },
            now
          },
          tx
        );

        return {
          ok: true,
          data: updated
        } satisfies ServiceResult<typeof updated>;
      });
    } catch (error) {
      if (isPrismaClientConfigurationError(error)) {
        return providerNotConfiguredFromRuntime("admin_experience_profile", {
          code: error.code,
          details: error.details
        });
      }

      throw error;
    }
  }
} as const;

export const adminCancellationService = {
  async approveCredit(
    viewer: AdminViewer,
    cancellationId: string,
    payload: unknown,
    options: CancellationServiceOptions = {}
  ) {
    if (!isAdminOrSupport(viewer)) {
      return unauthorizedResult("cancellation");
    }

    const parsed = adminCancellationCreditApprovalSchema.safeParse(payload);

    if (!parsed.success) {
      return validationErrorResult("cancellation", parsed.error.flatten());
    }

    const now = options.now?.() ?? new Date();
    const runInTransaction = options.runInTransaction ?? withUseravaaTransaction;

    try {
      return await runInTransaction(async (tx: UseravaaTransactionClient) => {
        const review = await useravaaRepository.cancellation.findSupportReviewForAdminAction(cancellationId, tx);

        if (!review) {
          return targetNotFoundResult("cancellation");
        }

        if (
          review.status !== "UNDER_SUPPORT_REVIEW" ||
          review.requesterRefundWalletTransactionId ||
          review.providerCompensationWalletTransactionId ||
          review.completedAt ||
          review.rejectedAt ||
          review.reviewedAt
        ) {
          return invalidStateResult("cancellation", {
            cancellationStatus: review.status
          });
        }

        if (review.conversation.attendanceVerification?.status === "VERIFIED" || review.conversation.attendanceVerification?.verifiedAt) {
          return invalidStateResult("cancellation", {
            reason: "attendance_already_verified"
          });
        }

        const eligibleCreditAmountToman = eligibleCancellationSupportCreditAmount(review);
        const creditAmountToman = parsed.data.creditAmountToman ?? eligibleCreditAmountToman;

        if (creditAmountToman <= 0) {
          return invalidStateResult("cancellation", {
            reason: "positive_credit_required",
            eligibleCreditAmountToman
          });
        }

        if (creditAmountToman > eligibleCreditAmountToman) {
          return validationErrorResult("cancellation", {
            fieldErrors: {
              creditAmountToman: ["Credit amount cannot exceed the eligible paid amount."]
            },
            formErrors: []
          });
        }

        const updated = await useravaaRepository.cancellation.approveSupportReviewCredit(
          {
            cancellationId,
            adminId: viewer.id,
            requesterId: review.conversation.requesterId,
            conversationId: review.conversationId,
            paymentId: review.conversation.payment?.id ?? null,
            creditAmountToman,
            eligibleCreditAmountToman,
            reviewNote: parsed.data.reviewNote,
            now
          },
          tx
        );

        await useravaaRepository.adminAudit.createCancellationSupportReviewEvent(
          {
            actorAdminUserId: viewer.id,
            actorRole: adminAuditActorRole(viewer),
            action: "CANCELLATION_SUPPORT_CREDIT_APPROVED",
            cancellationId,
            conversationId: review.conversationId,
            paymentId: review.conversation.payment?.id,
            beforeStatus: cancellationSupportReviewAuditStatus({
              cancellationStatus: review.status,
              refundAmountToman: review.refundAmountToman,
              refundDestination: review.refundDestination,
              conversationStatus: review.conversation.status
            }),
            afterStatus: cancellationSupportReviewAuditStatus({
              cancellationStatus: updated.status,
              refundAmountToman: updated.refundAmountToman,
              refundDestination: updated.refundDestination,
              conversationStatus: updated.conversation.status
            }),
            note: parsed.data.reviewNote,
            metadata: {
              supportReviewDecision: "approvedCredit",
              approvedCreditAmountToman: creditAmountToman,
              eligibleCreditAmountToman,
              walletTransactionId: updated.requesterRefundWalletTransactionId,
              cancelledByRole: review.cancelledByRole,
              stage: review.stage
            },
            now
          },
          tx
        );

        return {
          ok: true,
          data: updated
        } satisfies ServiceResult<typeof updated>;
      });
    } catch (error) {
      if (isPrismaClientConfigurationError(error)) {
        return providerNotConfiguredFromRuntime("cancellation", {
          code: error.code,
          details: error.details
        });
      }

      throw error;
    }
  },
  async rejectCredit(
    viewer: AdminViewer,
    cancellationId: string,
    payload: unknown,
    options: CancellationServiceOptions = {}
  ) {
    if (!isAdminOrSupport(viewer)) {
      return unauthorizedResult("cancellation");
    }

    const parsed = adminCancellationCreditRejectionSchema.safeParse(payload);

    if (!parsed.success) {
      return validationErrorResult("cancellation", parsed.error.flatten());
    }

    const now = options.now?.() ?? new Date();
    const runInTransaction = options.runInTransaction ?? withUseravaaTransaction;

    try {
      return await runInTransaction(async (tx: UseravaaTransactionClient) => {
        const review = await useravaaRepository.cancellation.findSupportReviewForAdminAction(cancellationId, tx);

        if (!review) {
          return targetNotFoundResult("cancellation");
        }

        if (
          review.status !== "UNDER_SUPPORT_REVIEW" ||
          review.requesterRefundWalletTransactionId ||
          review.providerCompensationWalletTransactionId ||
          review.completedAt ||
          review.rejectedAt ||
          review.reviewedAt
        ) {
          return invalidStateResult("cancellation", {
            cancellationStatus: review.status
          });
        }

        const updated = await useravaaRepository.cancellation.rejectSupportReviewCredit(
          {
            cancellationId,
            adminId: viewer.id,
            rejectionReason: parsed.data.rejectionReason,
            reviewNote: parsed.data.reviewNote,
            now
          },
          tx
        );

        await useravaaRepository.adminAudit.createCancellationSupportReviewEvent(
          {
            actorAdminUserId: viewer.id,
            actorRole: adminAuditActorRole(viewer),
            action: "CANCELLATION_SUPPORT_CREDIT_REJECTED",
            cancellationId,
            conversationId: review.conversationId,
            paymentId: review.conversation.payment?.id,
            beforeStatus: cancellationSupportReviewAuditStatus({
              cancellationStatus: review.status,
              refundAmountToman: review.refundAmountToman,
              refundDestination: review.refundDestination,
              conversationStatus: review.conversation.status
            }),
            afterStatus: cancellationSupportReviewAuditStatus({
              cancellationStatus: updated.status,
              refundAmountToman: updated.refundAmountToman,
              refundDestination: updated.refundDestination,
              conversationStatus: updated.conversation.status
            }),
            reason: parsed.data.rejectionReason,
            note: parsed.data.reviewNote,
            metadata: {
              supportReviewDecision: "rejectedCredit",
              eligibleCreditAmountToman: eligibleCancellationSupportCreditAmount(review),
              cancelledByRole: review.cancelledByRole,
              stage: review.stage
            },
            now
          },
          tx
        );

        return {
          ok: true,
          data: updated
        } satisfies ServiceResult<typeof updated>;
      });
    } catch (error) {
      if (isPrismaClientConfigurationError(error)) {
        return providerNotConfiguredFromRuntime("cancellation", {
          code: error.code,
          details: error.details
        });
      }

      throw error;
    }
  }
} as const;

export const adminPaymentService = {
  async listPending(viewer: AdminViewer) {
    if (!isAdminOrSupport(viewer)) {
      return unauthorizedResult("admin_payment");
    }

    return repositoryResultToService("admin_payment", await useravaaRepository.adminPayments.listPending());
  },
  async listReviews(viewer: AdminViewer) {
    if (!isAdminOrSupport(viewer)) {
      return unauthorizedResult("admin_payment");
    }

    return repositoryResultToService("admin_payment", await useravaaRepository.adminPayments.listRecent());
  },
  async getReview(viewer: AdminViewer, paymentId: string) {
    if (!isAdminOrSupport(viewer)) {
      return unauthorizedResult("admin_payment");
    }

    const result = await useravaaRepository.adminPayments.getByPaymentId(paymentId);

    if (!result.ok) {
      return repositoryResultToService("admin_payment", result);
    }

    if (!result.data) {
      return paymentNotFoundResult("admin_payment");
    }

    return {
      ok: true,
      data: result.data
    } satisfies ServiceResult<typeof result.data>;
  },
  async approve(
    viewer: AdminViewer,
    paymentId: string,
    payload: unknown,
    options: PaymentFlowServiceOptions = {}
  ) {
    if (!isAdminOrSupport(viewer)) {
      return unauthorizedResult("admin_payment");
    }

    const parsed = adminPaymentApprovalSchema.safeParse(payload);

    if (!parsed.success) {
      return validationErrorResult("admin_payment", parsed.error.flatten());
    }

    const now = options.now?.() ?? new Date();
    const runInTransaction = options.runInTransaction ?? withUseravaaTransaction;

    try {
      return await runInTransaction(async (tx: UseravaaTransactionClient) => {
        const review = await useravaaRepository.adminPayments.findReviewForAdminAction(paymentId, tx);

        if (!review) {
          return paymentNotFoundResult("admin_payment");
        }

        if (
          review.payment.method !== "CARD_TO_CARD" ||
          review.payment.requirement !== "PAYMENT_REQUIRED" ||
          review.payment.status !== "PENDING_REVIEW" ||
          !isAdminReviewStatus(review.status)
        ) {
          return invalidStateResult("admin_payment", {
            paymentStatus: review.payment.status,
            reviewStatus: review.status
          });
        }

        if (
          review.payment.conversation.providerVisibleAt ||
          review.payment.conversation.confirmedAt ||
          review.payment.conversation.selectedTimeId ||
          review.payment.conversation.status !== "PAYMENT_PROCESSING"
        ) {
          return invalidStateResult("admin_payment", {
            reason: "conversation_not_pending_manual_payment_review",
            conversationStatus: review.payment.conversation.status
          });
        }

        const updated = await useravaaRepository.adminPayments.approve(
          {
            paymentId,
            adminId: viewer.id,
            adminNote: parsed.data.adminNote,
            now
          },
          tx
        );

        await useravaaRepository.adminAudit.createPaymentReviewEvent(
          {
            actorAdminUserId: viewer.id,
            actorRole: adminAuditActorRole(viewer),
            action: "PAYMENT_MANUAL_APPROVED",
            paymentId,
            conversationId: review.payment.conversationId,
            beforeStatus: paymentReviewAuditStatus({
              paymentStatus: review.payment.status,
              manualReviewStatus: review.status,
              conversationStatus: review.payment.conversation.status
            }),
            afterStatus: paymentReviewAuditStatus({
              paymentStatus: updated.payment.status,
              manualReviewStatus: updated.status,
              conversationStatus: updated.payment.conversation.status
            }),
            note: parsed.data.adminNote,
            metadata: {
              manualReviewId: review.id,
              beforeProviderVisible: Boolean(review.payment.conversation.providerVisibleAt),
              afterProviderVisible: Boolean(updated.payment.conversation.providerVisibleAt)
            },
            now
          },
          tx
        );

        return {
          ok: true,
          data: updated
        } satisfies ServiceResult<typeof updated>;
      });
    } catch (error) {
      if (isPrismaClientConfigurationError(error)) {
        return providerNotConfiguredFromRuntime("admin_payment", {
          code: error.code,
          details: error.details
        });
      }

      throw error;
    }
  },
  async reject(
    viewer: AdminViewer,
    paymentId: string,
    payload: unknown,
    options: PaymentFlowServiceOptions = {}
  ) {
    if (!isAdminOrSupport(viewer)) {
      return unauthorizedResult("admin_payment");
    }

    const parsed = adminPaymentRejectionSchema.safeParse(payload);

    if (!parsed.success) {
      return validationErrorResult("admin_payment", parsed.error.flatten());
    }

    const now = options.now?.() ?? new Date();
    const runInTransaction = options.runInTransaction ?? withUseravaaTransaction;

    try {
      return await runInTransaction(async (tx: UseravaaTransactionClient) => {
        const review = await useravaaRepository.adminPayments.findReviewForAdminAction(paymentId, tx);

        if (!review) {
          return paymentNotFoundResult("admin_payment");
        }

        if (
          review.payment.method !== "CARD_TO_CARD" ||
          review.payment.requirement !== "PAYMENT_REQUIRED" ||
          review.payment.status !== "PENDING_REVIEW" ||
          !isAdminReviewStatus(review.status)
        ) {
          return invalidStateResult("admin_payment", {
            paymentStatus: review.payment.status,
            reviewStatus: review.status
          });
        }

        if (
          review.payment.conversation.providerVisibleAt ||
          review.payment.conversation.confirmedAt ||
          review.payment.conversation.selectedTimeId ||
          review.payment.conversation.status !== "PAYMENT_PROCESSING"
        ) {
          return invalidStateResult("admin_payment", {
            reason: "conversation_not_pending_manual_payment_review",
            conversationStatus: review.payment.conversation.status
          });
        }

        const updated = await useravaaRepository.adminPayments.reject(
          {
            paymentId,
            adminId: viewer.id,
            rejectionReason: parsed.data.rejectionReason,
            adminNote: parsed.data.adminNote,
            now
          },
          tx
        );

        await useravaaRepository.adminAudit.createPaymentReviewEvent(
          {
            actorAdminUserId: viewer.id,
            actorRole: adminAuditActorRole(viewer),
            action: "PAYMENT_MANUAL_REJECTED",
            paymentId,
            conversationId: review.payment.conversationId,
            beforeStatus: paymentReviewAuditStatus({
              paymentStatus: review.payment.status,
              manualReviewStatus: review.status,
              conversationStatus: review.payment.conversation.status
            }),
            afterStatus: paymentReviewAuditStatus({
              paymentStatus: updated.payment.status,
              manualReviewStatus: updated.status,
              conversationStatus: updated.payment.conversation.status
            }),
            reason: parsed.data.rejectionReason,
            note: parsed.data.adminNote,
            metadata: {
              manualReviewId: review.id,
              beforeProviderVisible: Boolean(review.payment.conversation.providerVisibleAt),
              afterProviderVisible: Boolean(updated.payment.conversation.providerVisibleAt)
            },
            now
          },
          tx
        );

        return {
          ok: true,
          data: updated
        } satisfies ServiceResult<typeof updated>;
      });
    } catch (error) {
      if (isPrismaClientConfigurationError(error)) {
        return providerNotConfiguredFromRuntime("admin_payment", {
          code: error.code,
          details: error.details
        });
      }

      throw error;
    }
  }
} as const;

type PricingRuleServiceOptions = {
  runInTransaction?: typeof withUseravaaTransaction;
  now?: () => Date;
};

type PricingRuleStateInput = {
  minPriceToman: number;
  maxPriceToman: number;
  suggestedPriceToman: number;
  commissionRateBps: number;
  freeSessionCommissionRateBps: number;
  effectiveFrom: Date;
  effectiveTo: Date | null;
};

function pricingDurationToPrisma(value: 30 | 60 | null | undefined) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  return value === 30 ? "MIN_30" : "MIN_60";
}

function pricingRuleStatus(rule: { isActive: boolean; archivedAt: Date | null }) {
  if (rule.archivedAt) {
    return "ARCHIVED";
  }

  return rule.isActive ? "ACTIVE" : "INACTIVE";
}

function pricingRuleAuditSnapshot(rule: {
  title: string;
  jobField: string | null;
  experienceLevel: string | null;
  sessionDurationMinutes: string | null;
  minPriceToman: number;
  maxPriceToman: number;
  suggestedPriceToman: number;
  commissionRateBps: number;
  freeSessionCommissionRateBps: number;
  allowFreeSession: boolean;
  isActive: boolean;
  effectiveFrom: Date;
  effectiveTo: Date | null;
  archivedAt: Date | null;
}) {
  return {
    title: rule.title,
    jobField: rule.jobField,
    experienceLevel: rule.experienceLevel,
    sessionDurationMinutes: rule.sessionDurationMinutes,
    minPriceToman: rule.minPriceToman,
    maxPriceToman: rule.maxPriceToman,
    suggestedPriceToman: rule.suggestedPriceToman,
    commissionRateBps: rule.commissionRateBps,
    freeSessionCommissionRateBps: rule.freeSessionCommissionRateBps,
    allowFreeSession: rule.allowFreeSession,
    state: pricingRuleStatus(rule),
    effectiveFrom: rule.effectiveFrom.toISOString(),
    effectiveTo: rule.effectiveTo?.toISOString() ?? null,
    archivedAt: rule.archivedAt?.toISOString() ?? null
  };
}

function validatePricingRuleState(value: PricingRuleStateInput): ServiceResult<never> | null {
  if (value.maxPriceToman < value.minPriceToman) {
    return validationErrorResult("admin_pricing", {
      field: "maxPriceToman",
      reason: "max_price_below_min_price"
    });
  }

  if (value.suggestedPriceToman < value.minPriceToman || value.suggestedPriceToman > value.maxPriceToman) {
    return validationErrorResult("admin_pricing", {
      field: "suggestedPriceToman",
      reason: "suggested_price_outside_range"
    });
  }

  if (value.commissionRateBps < 0 || value.commissionRateBps > 10_000) {
    return validationErrorResult("admin_pricing", {
      field: "commissionRateBps",
      reason: "commission_outside_basis_point_range"
    });
  }

  if (value.freeSessionCommissionRateBps !== 0) {
    return validationErrorResult("admin_pricing", {
      field: "freeSessionCommissionRateBps",
      reason: "free_session_commission_must_be_zero"
    });
  }

  if (value.effectiveTo && value.effectiveTo.getTime() <= value.effectiveFrom.getTime()) {
    return validationErrorResult("admin_pricing", {
      field: "effectiveTo",
      reason: "effective_to_must_be_after_effective_from"
    });
  }

  return null;
}

function categoryStatus(category: AdminCategoryRecord) {
  if (category.archivedAt) {
    return "ARCHIVED";
  }

  return category.isActive ? "ACTIVE" : "INACTIVE";
}

function categoryAuditSnapshot(category: AdminCategoryRecord) {
  return {
    id: category.id,
    slug: category.slug,
    titleFa: category.labelFa,
    parentId: category.parentId,
    sortOrder: category.sortOrder,
    isActive: category.isActive,
    showInDiscovery: category.showInDiscovery,
    showInInsights: category.showInInsights,
    showInPricing: category.showInPricing,
    jobFieldCode: category.code,
    archivedAt: category.archivedAt?.toISOString() ?? null,
    profileCount: category._count.profiles,
    insightCount: category.insightCount,
    pricingRuleCount: category.pricingRuleCount
  };
}

function categoryDuplicateResult(details?: unknown) {
  return validationErrorResult("admin_categories", {
    reason: "duplicate_category_slug_or_job_field",
    details
  });
}

function isPrismaUniqueConstraintError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

async function validateCategoryParent(
  parentId: string | null | undefined,
  tx: UseravaaTransactionClient,
  currentCategoryId?: string
): Promise<ServiceResult<never> | null> {
  if (!parentId) {
    return null;
  }

  if (parentId === currentCategoryId) {
    return invalidStateResult("admin_categories", {
      reason: "category_cannot_be_its_own_parent"
    });
  }

  const parentResult = await useravaaRepository.adminCategories.getCategoryDetail(parentId, tx);

  if (!parentResult.ok) {
    return repositoryResultToService("admin_categories", parentResult);
  }

  if (!parentResult.data) {
    return targetNotFoundResult("admin_categories");
  }

  if (parentResult.data.archivedAt) {
    return invalidStateResult("admin_categories", {
      reason: "archived_parent_category_not_allowed"
    });
  }

  return null;
}

export const adminCategoryService = {
  list(viewer: AdminViewer): Promise<ServiceResult<AdminCategoryRecord[]>> {
    if (!isAdminOrSupport(viewer)) {
      return Promise.resolve(unauthorizedResult("admin_categories"));
    }

    return useravaaRepository.adminCategories.listCategories().then((result) => repositoryResultToService("admin_categories", result));
  },
  getDetail(viewer: AdminViewer, categoryId: string): Promise<ServiceResult<AdminCategoryRecord>> {
    if (!isAdminOrSupport(viewer)) {
      return Promise.resolve(unauthorizedResult("admin_categories"));
    }

    return useravaaRepository.adminCategories.getCategoryDetail(categoryId).then((result) => {
      if (!result.ok) {
        return repositoryResultToService("admin_categories", result);
      }

      if (!result.data) {
        return targetNotFoundResult("admin_categories");
      }

      return {
        ok: true,
        data: result.data
      } satisfies ServiceResult<typeof result.data>;
    });
  },
  async create(
    viewer: AdminViewer,
    payload: unknown,
    options: AdminCategoryServiceOptions = {}
  ): Promise<ServiceResult<AdminCategoryRecord>> {
    if (!isAdmin(viewer)) {
      return unauthorizedResult("admin_categories");
    }

    const parsed = adminCategoryCreateSchema.safeParse(payload);

    if (!parsed.success) {
      return validationErrorResult("admin_categories", parsed.error.flatten());
    }

    const now = options.now?.() ?? new Date();
    const runInTransaction = options.runInTransaction ?? withUseravaaTransaction;

    try {
      return await runInTransaction(async (tx: UseravaaTransactionClient) => {
        const parentError = await validateCategoryParent(parsed.data.parentId, tx);

        if (parentError) {
          return parentError;
        }

        const created = await useravaaRepository.adminCategories.createCategory(
          {
            slug: parsed.data.slug,
            labelFa: parsed.data.titleFa,
            titleEn: parsed.data.titleEn,
            descriptionFa: parsed.data.descriptionFa,
            parentId: parsed.data.parentId,
            sortOrder: parsed.data.sortOrder,
            isActive: parsed.data.isActive,
            showInDiscovery: parsed.data.showInDiscovery,
            showInInsights: parsed.data.showInInsights,
            showInPricing: parsed.data.showInPricing,
            code: parsed.data.jobFieldCode,
            adminId: viewer.id
          },
          tx
        );

        await useravaaRepository.adminAudit.createCategoryEvent(
          {
            actorAdminUserId: viewer.id,
            actorRole: "ADMIN",
            action: "CATEGORY_CREATED",
            categoryId: created.id,
            beforeStatus: null,
            afterStatus: categoryStatus(created),
            metadata: {
              after: categoryAuditSnapshot(created)
            },
            now
          },
          tx
        );

        return {
          ok: true,
          data: created,
          status: 201
        } satisfies ServiceResult<typeof created>;
      });
    } catch (error) {
      if (isPrismaUniqueConstraintError(error)) {
        return categoryDuplicateResult(error.meta);
      }

      if (isPrismaClientConfigurationError(error)) {
        return providerNotConfiguredFromRuntime("admin_categories", {
          code: error.code,
          details: error.details
        });
      }

      throw error;
    }
  },
  async update(
    viewer: AdminViewer,
    categoryId: string,
    payload: unknown,
    options: AdminCategoryServiceOptions = {}
  ): Promise<ServiceResult<AdminCategoryRecord>> {
    if (!isAdmin(viewer)) {
      return unauthorizedResult("admin_categories");
    }

    const parsed = adminCategoryUpdateSchema.safeParse(payload);

    if (!parsed.success) {
      return validationErrorResult("admin_categories", parsed.error.flatten());
    }

    const now = options.now?.() ?? new Date();
    const runInTransaction = options.runInTransaction ?? withUseravaaTransaction;

    try {
      return await runInTransaction(async (tx: UseravaaTransactionClient) => {
        const existingResult = await useravaaRepository.adminCategories.getCategoryDetail(categoryId, tx);

        if (!existingResult.ok) {
          return repositoryResultToService("admin_categories", existingResult);
        }

        const existing = existingResult.data;

        if (!existing) {
          return targetNotFoundResult("admin_categories");
        }

        if (existing.archivedAt) {
          return invalidStateResult("admin_categories", {
            reason: "archived_category_cannot_be_updated"
          });
        }

        const parentError = await validateCategoryParent(parsed.data.parentId, tx, categoryId);

        if (parentError) {
          return parentError;
        }

        const updated = await useravaaRepository.adminCategories.updateCategory(
          categoryId,
          {
            ...(parsed.data.slug === undefined ? {} : { slug: parsed.data.slug }),
            ...(parsed.data.titleFa === undefined ? {} : { labelFa: parsed.data.titleFa }),
            ...(parsed.data.titleEn === undefined ? {} : { titleEn: parsed.data.titleEn }),
            ...(parsed.data.descriptionFa === undefined ? {} : { descriptionFa: parsed.data.descriptionFa }),
            ...(parsed.data.parentId === undefined ? {} : { parentId: parsed.data.parentId }),
            ...(parsed.data.sortOrder === undefined ? {} : { sortOrder: parsed.data.sortOrder }),
            ...(parsed.data.isActive === undefined ? {} : { isActive: parsed.data.isActive }),
            ...(parsed.data.showInDiscovery === undefined ? {} : { showInDiscovery: parsed.data.showInDiscovery }),
            ...(parsed.data.showInInsights === undefined ? {} : { showInInsights: parsed.data.showInInsights }),
            ...(parsed.data.showInPricing === undefined ? {} : { showInPricing: parsed.data.showInPricing }),
            ...(parsed.data.jobFieldCode === undefined ? {} : { code: parsed.data.jobFieldCode }),
            adminId: viewer.id
          },
          tx
        );

        await useravaaRepository.adminAudit.createCategoryEvent(
          {
            actorAdminUserId: viewer.id,
            actorRole: "ADMIN",
            action: "CATEGORY_UPDATED",
            categoryId: updated.id,
            beforeStatus: categoryStatus(existing),
            afterStatus: categoryStatus(updated),
            metadata: {
              before: categoryAuditSnapshot(existing),
              after: categoryAuditSnapshot(updated)
            },
            now
          },
          tx
        );

        return {
          ok: true,
          data: updated
        } satisfies ServiceResult<typeof updated>;
      });
    } catch (error) {
      if (isPrismaUniqueConstraintError(error)) {
        return categoryDuplicateResult(error.meta);
      }

      if (isPrismaClientConfigurationError(error)) {
        return providerNotConfiguredFromRuntime("admin_categories", {
          code: error.code,
          details: error.details
        });
      }

      throw error;
    }
  },
  async archive(
    viewer: AdminViewer,
    categoryId: string,
    payload: unknown,
    options: AdminCategoryServiceOptions = {}
  ): Promise<ServiceResult<AdminCategoryRecord>> {
    if (!isAdmin(viewer)) {
      return unauthorizedResult("admin_categories");
    }

    const parsed = adminCategoryArchiveSchema.safeParse(payload);

    if (!parsed.success) {
      return validationErrorResult("admin_categories", parsed.error.flatten());
    }

    const now = options.now?.() ?? new Date();
    const runInTransaction = options.runInTransaction ?? withUseravaaTransaction;

    try {
      return await runInTransaction(async (tx: UseravaaTransactionClient) => {
        const existingResult = await useravaaRepository.adminCategories.getCategoryDetail(categoryId, tx);

        if (!existingResult.ok) {
          return repositoryResultToService("admin_categories", existingResult);
        }

        const existing = existingResult.data;

        if (!existing) {
          return targetNotFoundResult("admin_categories");
        }

        if (existing.archivedAt) {
          return invalidStateResult("admin_categories", {
            reason: "category_already_archived"
          });
        }

        const updated = await useravaaRepository.adminCategories.archiveCategory(
          categoryId,
          {
            adminId: viewer.id,
            archivedAt: now,
            reason: parsed.data.reason,
            internalNote: parsed.data.internalNote
          },
          tx
        );

        await useravaaRepository.adminAudit.createCategoryEvent(
          {
            actorAdminUserId: viewer.id,
            actorRole: "ADMIN",
            action: "CATEGORY_ARCHIVED",
            categoryId: updated.id,
            beforeStatus: categoryStatus(existing),
            afterStatus: categoryStatus(updated),
            reason: parsed.data.reason,
            note: parsed.data.internalNote,
            metadata: {
              before: categoryAuditSnapshot(existing),
              after: categoryAuditSnapshot(updated)
            },
            now
          },
          tx
        );

        return {
          ok: true,
          data: updated
        } satisfies ServiceResult<typeof updated>;
      });
    } catch (error) {
      if (isPrismaClientConfigurationError(error)) {
        return providerNotConfiguredFromRuntime("admin_categories", {
          code: error.code,
          details: error.details
        });
      }

      throw error;
    }
  },
  async restore(
    viewer: AdminViewer,
    categoryId: string,
    payload: unknown,
    options: AdminCategoryServiceOptions = {}
  ): Promise<ServiceResult<AdminCategoryRecord>> {
    if (!isAdmin(viewer)) {
      return unauthorizedResult("admin_categories");
    }

    const parsed = adminCategoryRestoreSchema.safeParse(payload);

    if (!parsed.success) {
      return validationErrorResult("admin_categories", parsed.error.flatten());
    }

    const now = options.now?.() ?? new Date();
    const runInTransaction = options.runInTransaction ?? withUseravaaTransaction;

    try {
      return await runInTransaction(async (tx: UseravaaTransactionClient) => {
        const existingResult = await useravaaRepository.adminCategories.getCategoryDetail(categoryId, tx);

        if (!existingResult.ok) {
          return repositoryResultToService("admin_categories", existingResult);
        }

        const existing = existingResult.data;

        if (!existing) {
          return targetNotFoundResult("admin_categories");
        }

        if (!existing.archivedAt) {
          return invalidStateResult("admin_categories", {
            reason: "category_is_not_archived"
          });
        }

        const updated = await useravaaRepository.adminCategories.restoreCategory(
          categoryId,
          {
            adminId: viewer.id
          },
          tx
        );

        await useravaaRepository.adminAudit.createCategoryEvent(
          {
            actorAdminUserId: viewer.id,
            actorRole: "ADMIN",
            action: "CATEGORY_RESTORED",
            categoryId: updated.id,
            beforeStatus: categoryStatus(existing),
            afterStatus: categoryStatus(updated),
            note: parsed.data.internalNote,
            metadata: {
              before: categoryAuditSnapshot(existing),
              after: categoryAuditSnapshot(updated)
            },
            now
          },
          tx
        );

        return {
          ok: true,
          data: updated
        } satisfies ServiceResult<typeof updated>;
      });
    } catch (error) {
      if (isPrismaClientConfigurationError(error)) {
        return providerNotConfiguredFromRuntime("admin_categories", {
          code: error.code,
          details: error.details
        });
      }

      throw error;
    }
  }
} as const;

export const adminPricingService = {
  list(viewer: AdminViewer): Promise<ServiceResult<PricingRuleListReadModel>> {
    if (!isAdminOrSupport(viewer)) {
      return Promise.resolve(unauthorizedResult("admin_pricing"));
    }

    return useravaaRepository.pricingRules.listPricingRules().then((result) => repositoryResultToService("admin_pricing", result));
  },
  getDetail(viewer: AdminViewer, ruleId: string): Promise<ServiceResult<PricingRuleRecord>> {
    if (!isAdminOrSupport(viewer)) {
      return Promise.resolve(unauthorizedResult("admin_pricing"));
    }

    return useravaaRepository.pricingRules.getPricingRule(ruleId).then((result) => {
      if (!result.ok) {
        return repositoryResultToService("admin_pricing", result);
      }

      if (!result.data) {
        return pricingRuleNotFoundResult("admin_pricing");
      }

      return {
        ok: true,
        data: result.data
      } satisfies ServiceResult<typeof result.data>;
    });
  },
  async create(
    viewer: AdminViewer,
    payload: unknown,
    options: PricingRuleServiceOptions = {}
  ): Promise<ServiceResult<PricingRuleRecord>> {
    if (!isAdmin(viewer)) {
      return unauthorizedResult("admin_pricing");
    }

    const parsed = adminPricingRuleCreateSchema.safeParse(payload);

    if (!parsed.success) {
      return validationErrorResult("admin_pricing", parsed.error.flatten());
    }

    const now = options.now?.() ?? new Date();
    const effectiveFrom = parsed.data.effectiveFrom ?? now;
    const effectiveTo = parsed.data.effectiveTo ?? null;
    const stateError = validatePricingRuleState({
      minPriceToman: parsed.data.minPriceToman,
      maxPriceToman: parsed.data.maxPriceToman,
      suggestedPriceToman: parsed.data.suggestedPriceToman,
      commissionRateBps: parsed.data.commissionRateBps,
      freeSessionCommissionRateBps: parsed.data.freeSessionCommissionRateBps,
      effectiveFrom,
      effectiveTo
    });

    if (stateError) {
      return stateError;
    }

    const runInTransaction = options.runInTransaction ?? withUseravaaTransaction;

    try {
      return await runInTransaction(async (tx: UseravaaTransactionClient) => {
        const created = await useravaaRepository.pricingRules.createPricingRule(
          {
            title: parsed.data.title,
            jobField: parsed.data.jobFieldCode ?? null,
            experienceLevel: parsed.data.experienceLevel ?? null,
            sessionDurationMinutes: pricingDurationToPrisma(parsed.data.sessionDurationMinutes) ?? null,
            minPriceToman: parsed.data.minPriceToman,
            maxPriceToman: parsed.data.maxPriceToman,
            suggestedPriceToman: parsed.data.suggestedPriceToman,
            commissionRateBps: parsed.data.commissionRateBps,
            freeSessionCommissionRateBps: parsed.data.freeSessionCommissionRateBps,
            allowFreeSession: parsed.data.allowFreeSession,
            effectiveFrom,
            effectiveTo,
            internalNote: parsed.data.internalNote,
            adminId: viewer.id
          },
          tx
        );

        await useravaaRepository.adminAudit.createPricingRuleEvent(
          {
            actorAdminUserId: viewer.id,
            actorRole: "ADMIN",
            action: "PRICING_RULE_CREATED",
            pricingRuleId: created.id,
            beforeStatus: null,
            afterStatus: pricingRuleStatus(created),
            note: parsed.data.internalNote,
            metadata: {
              after: pricingRuleAuditSnapshot(created)
            },
            now
          },
          tx
        );

        return {
          ok: true,
          data: created,
          status: 201
        } satisfies ServiceResult<typeof created>;
      });
    } catch (error) {
      if (isPrismaClientConfigurationError(error)) {
        return providerNotConfiguredFromRuntime("admin_pricing", {
          code: error.code,
          details: error.details
        });
      }

      throw error;
    }
  },
  async update(
    viewer: AdminViewer,
    ruleId: string,
    payload: unknown,
    options: PricingRuleServiceOptions = {}
  ): Promise<ServiceResult<PricingRuleRecord>> {
    if (!isAdmin(viewer)) {
      return unauthorizedResult("admin_pricing");
    }

    const parsed = adminPricingRuleUpdateSchema.safeParse(payload);

    if (!parsed.success) {
      return validationErrorResult("admin_pricing", parsed.error.flatten());
    }

    const now = options.now?.() ?? new Date();
    const runInTransaction = options.runInTransaction ?? withUseravaaTransaction;

    try {
      return await runInTransaction(async (tx: UseravaaTransactionClient) => {
        const existingResult = await useravaaRepository.pricingRules.getPricingRule(ruleId, tx);

        if (!existingResult.ok) {
          return repositoryResultToService("admin_pricing", existingResult);
        }

        const existing = existingResult.data;

        if (!existing) {
          return pricingRuleNotFoundResult("admin_pricing");
        }

        if (existing.archivedAt) {
          return invalidStateResult("admin_pricing", {
            reason: "archived_rule_cannot_be_updated"
          });
        }

        const effectiveFrom = parsed.data.effectiveFrom ?? existing.effectiveFrom;
        const effectiveTo = parsed.data.effectiveTo === undefined ? existing.effectiveTo : parsed.data.effectiveTo;
        const nextState = {
          minPriceToman: parsed.data.minPriceToman ?? existing.minPriceToman,
          maxPriceToman: parsed.data.maxPriceToman ?? existing.maxPriceToman,
          suggestedPriceToman: parsed.data.suggestedPriceToman ?? existing.suggestedPriceToman,
          commissionRateBps: parsed.data.commissionRateBps ?? existing.commissionRateBps,
          freeSessionCommissionRateBps:
            parsed.data.freeSessionCommissionRateBps ?? existing.freeSessionCommissionRateBps,
          effectiveFrom,
          effectiveTo
        };
        const stateError = validatePricingRuleState(nextState);

        if (stateError) {
          return stateError;
        }

        const updated = await useravaaRepository.pricingRules.updatePricingRule(
          ruleId,
          {
            ...(parsed.data.title === undefined ? {} : { title: parsed.data.title }),
            ...(parsed.data.jobFieldCode === undefined ? {} : { jobField: parsed.data.jobFieldCode }),
            ...(parsed.data.experienceLevel === undefined ? {} : { experienceLevel: parsed.data.experienceLevel }),
            ...(parsed.data.sessionDurationMinutes === undefined
              ? {}
              : { sessionDurationMinutes: pricingDurationToPrisma(parsed.data.sessionDurationMinutes) }),
            ...(parsed.data.minPriceToman === undefined ? {} : { minPriceToman: parsed.data.minPriceToman }),
            ...(parsed.data.maxPriceToman === undefined ? {} : { maxPriceToman: parsed.data.maxPriceToman }),
            ...(parsed.data.suggestedPriceToman === undefined
              ? {}
              : { suggestedPriceToman: parsed.data.suggestedPriceToman }),
            ...(parsed.data.commissionRateBps === undefined ? {} : { commissionRateBps: parsed.data.commissionRateBps }),
            ...(parsed.data.freeSessionCommissionRateBps === undefined
              ? {}
              : { freeSessionCommissionRateBps: parsed.data.freeSessionCommissionRateBps }),
            ...(parsed.data.allowFreeSession === undefined ? {} : { allowFreeSession: parsed.data.allowFreeSession }),
            ...(parsed.data.effectiveFrom === undefined ? {} : { effectiveFrom: parsed.data.effectiveFrom }),
            ...(parsed.data.effectiveTo === undefined ? {} : { effectiveTo: parsed.data.effectiveTo }),
            ...(parsed.data.internalNote === undefined ? {} : { internalNote: parsed.data.internalNote }),
            adminId: viewer.id
          },
          tx
        );

        await useravaaRepository.adminAudit.createPricingRuleEvent(
          {
            actorAdminUserId: viewer.id,
            actorRole: "ADMIN",
            action: "PRICING_RULE_UPDATED",
            pricingRuleId: updated.id,
            beforeStatus: pricingRuleStatus(existing),
            afterStatus: pricingRuleStatus(updated),
            note: parsed.data.internalNote,
            metadata: {
              before: pricingRuleAuditSnapshot(existing),
              after: pricingRuleAuditSnapshot(updated)
            },
            now
          },
          tx
        );

        return {
          ok: true,
          data: updated
        } satisfies ServiceResult<typeof updated>;
      });
    } catch (error) {
      if (isPrismaClientConfigurationError(error)) {
        return providerNotConfiguredFromRuntime("admin_pricing", {
          code: error.code,
          details: error.details
        });
      }

      throw error;
    }
  },
  async deactivate(
    viewer: AdminViewer,
    ruleId: string,
    payload: unknown,
    options: PricingRuleServiceOptions = {}
  ): Promise<ServiceResult<PricingRuleRecord>> {
    if (!isAdmin(viewer)) {
      return unauthorizedResult("admin_pricing");
    }

    const parsed = adminPricingRuleDeactivateSchema.safeParse(payload);

    if (!parsed.success) {
      return validationErrorResult("admin_pricing", parsed.error.flatten());
    }

    const now = options.now?.() ?? new Date();
    const runInTransaction = options.runInTransaction ?? withUseravaaTransaction;

    try {
      return await runInTransaction(async (tx: UseravaaTransactionClient) => {
        const existingResult = await useravaaRepository.pricingRules.getPricingRule(ruleId, tx);

        if (!existingResult.ok) {
          return repositoryResultToService("admin_pricing", existingResult);
        }

        const existing = existingResult.data;

        if (!existing) {
          return pricingRuleNotFoundResult("admin_pricing");
        }

        if (existing.archivedAt) {
          return invalidStateResult("admin_pricing", {
            reason: "pricing_rule_already_archived"
          });
        }

        const updated = await useravaaRepository.pricingRules.deactivatePricingRule(
          ruleId,
          {
            adminId: viewer.id,
            archivedAt: now,
            internalNote: parsed.data.internalNote
          },
          tx
        );

        await useravaaRepository.adminAudit.createPricingRuleEvent(
          {
            actorAdminUserId: viewer.id,
            actorRole: "ADMIN",
            action: "PRICING_RULE_DEACTIVATED",
            pricingRuleId: updated.id,
            beforeStatus: pricingRuleStatus(existing),
            afterStatus: pricingRuleStatus(updated),
            reason: parsed.data.reason,
            note: parsed.data.internalNote,
            metadata: {
              before: pricingRuleAuditSnapshot(existing),
              after: pricingRuleAuditSnapshot(updated)
            },
            now
          },
          tx
        );

        return {
          ok: true,
          data: updated
        } satisfies ServiceResult<typeof updated>;
      });
    } catch (error) {
      if (isPrismaClientConfigurationError(error)) {
        return providerNotConfiguredFromRuntime("admin_pricing", {
          code: error.code,
          details: error.details
        });
      }

      throw error;
    }
  }
} as const;
