import { createHash, randomBytes, randomInt } from "node:crypto";
import { Prisma } from "@prisma/client";
import type { UseravaaTransactionClient } from "../db/transaction";
import { safeConversationSelect, type SafeConversationRecord } from "./conversation";
import { readOnlyRepositoryOperation } from "./types";

export const ATTENDANCE_CODE_MAX_ATTEMPTS = 5;
const ATTENDANCE_CODE_TTL_HOURS = 72;

const attendanceFlowConversationSelect = Prisma.validator<Prisma.ConversationRequestSelect>()({
  id: true,
  requesterId: true,
  providerId: true,
  status: true,
  paymentRequirement: true,
  providerVisibleAt: true,
  selectedTimeId: true,
  selectedAt: true,
  confirmedAt: true,
  completedAt: true,
  cancelledAt: true,
  expiredAt: true,
  rejectedAt: true,
  selectedTime: {
    select: {
      id: true,
      startsAt: true,
      status: true
    }
  },
  payment: {
    select: {
      id: true,
      status: true,
      requirement: true,
      finalizedAt: true
    }
  },
  attendanceVerification: {
    select: {
      id: true,
      status: true,
      codeHash: true,
      codeSalt: true,
      requesterCodeCiphertext: true,
      codeGeneratedAt: true,
      codeExpiresAt: true,
      submittedAt: true,
      submittedByProviderId: true,
      attempts: true,
      verifiedAt: true,
      failedAt: true,
      needsReviewAt: true
    }
  }
});

export type AttendanceFlowConversationRecord = Prisma.ConversationRequestGetPayload<{
  select: typeof attendanceFlowConversationSelect;
}>;

export type AttendanceVerificationMaterial = {
  code: string;
  codeSalt: string;
  codeHash: string;
  requesterCodeCiphertext: string;
  codeGeneratedAt: Date;
  codeExpiresAt: Date;
};

export type AttendanceSubmissionInput = {
  conversationId: string;
  providerId: string;
  submittedCodeHash: string;
  attempts: number;
  now: Date;
};

export function generateAttendanceCode() {
  return String(randomInt(0, 100000)).padStart(5, "0");
}

export function generateAttendanceCodeSalt() {
  return randomBytes(16).toString("hex");
}

export function attendanceCodeExpiresAt(generatedAt: Date) {
  return new Date(generatedAt.getTime() + ATTENDANCE_CODE_TTL_HOURS * 60 * 60 * 1000);
}

export function hashAttendanceCode(code: string, conversationId: string, salt: string) {
  return createHash("sha256").update(`${salt}:${conversationId}:${code}`).digest("hex");
}

export function encodeRequesterAttendanceCode(code: string) {
  return Buffer.from(code, "utf8").toString("base64");
}

export function decodeRequesterAttendanceCode(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  try {
    return Buffer.from(value, "base64").toString("utf8");
  } catch {
    return null;
  }
}

export function buildAttendanceVerificationMaterial(
  conversationId: string,
  now: Date,
  code = generateAttendanceCode(),
  salt = generateAttendanceCodeSalt()
): AttendanceVerificationMaterial {
  return {
    code,
    codeSalt: salt,
    codeHash: hashAttendanceCode(code, conversationId, salt),
    requesterCodeCiphertext: encodeRequesterAttendanceCode(code),
    codeGeneratedAt: now,
    codeExpiresAt: attendanceCodeExpiresAt(now)
  };
}

function safeConversationById(conversationId: string, tx: UseravaaTransactionClient) {
  return tx.conversationRequest.findUnique({
    where: { id: conversationId },
    select: safeConversationSelect
  }) as Promise<SafeConversationRecord | null>;
}

export const attendanceVerificationRepository = {
  methods: {
    getSafeForConversation: "read_only_persistent",
    findConversationForRequesterAttendanceCode: "read_only_persistent",
    findConversationForProviderAttendanceSubmission: "read_only_persistent",
    ensureAttendanceVerificationForConversation: "database_persistent",
    markAttendanceVerified: "database_persistent",
    markAttendanceFailed: "database_persistent",
    submitCode: "database_persistent"
  },
  getSafeForConversation(conversationId: string) {
    return readOnlyRepositoryOperation("attendance", "getSafeForConversation", (db) =>
      db.attendanceVerification.findUnique({
        where: { conversationId },
        select: {
          id: true,
          conversationId: true,
          status: true,
          codeGeneratedAt: true,
          codeExpiresAt: true,
          submittedAt: true,
          submittedByProviderId: true,
          attempts: true,
          verifiedAt: true,
          failedAt: true,
          needsReviewAt: true
        }
      })
    );
  },
  async findConversationForRequesterAttendanceCode(
    conversationId: string,
    requesterId: string,
    tx: UseravaaTransactionClient
  ) {
    return tx.conversationRequest.findFirst({
      where: {
        id: conversationId,
        requesterId
      },
      select: attendanceFlowConversationSelect
    }) as Promise<AttendanceFlowConversationRecord | null>;
  },
  async findConversationForProviderAttendanceSubmission(
    conversationId: string,
    providerId: string,
    tx: UseravaaTransactionClient
  ) {
    return tx.conversationRequest.findFirst({
      where: {
        id: conversationId,
        providerId
      },
      select: attendanceFlowConversationSelect
    }) as Promise<AttendanceFlowConversationRecord | null>;
  },
  async ensureAttendanceVerificationForConversation(
    conversationId: string,
    material: AttendanceVerificationMaterial,
    tx: UseravaaTransactionClient
  ) {
    const existing = await tx.attendanceVerification.findUnique({
      where: {
        conversationId
      },
      select: attendanceFlowConversationSelect.attendanceVerification.select
    });

    if (existing) {
      return existing;
    }

    return tx.attendanceVerification.create({
      data: {
        conversationId,
        status: "PENDING",
        codeHash: material.codeHash,
        codeSalt: material.codeSalt,
        requesterCodeCiphertext: material.requesterCodeCiphertext,
        codeGeneratedAt: material.codeGeneratedAt,
        codeExpiresAt: material.codeExpiresAt,
        attempts: 0
      },
      select: attendanceFlowConversationSelect.attendanceVerification.select
    });
  },
  async markAttendanceVerified(input: AttendanceSubmissionInput, tx: UseravaaTransactionClient) {
    await tx.attendanceVerification.update({
      where: {
        conversationId: input.conversationId
      },
      data: {
        status: "VERIFIED",
        submittedAt: input.now,
        submittedByProviderId: input.providerId,
        submittedCodeHash: input.submittedCodeHash,
        attempts: input.attempts,
        verifiedAt: input.now,
        failedAt: null,
        needsReviewAt: null
      }
    });

    return tx.conversationRequest.update({
      where: {
        id: input.conversationId
      },
      data: {
        status: "COMPLETED",
        completedAt: input.now
      },
      select: safeConversationSelect
    }) as Promise<SafeConversationRecord>;
  },
  async markAttendanceFailed(
    input: AttendanceSubmissionInput & {
      status: "FAILED" | "NEEDS_REVIEW";
    },
    tx: UseravaaTransactionClient
  ) {
    await tx.attendanceVerification.update({
      where: {
        conversationId: input.conversationId
      },
      data: {
        status: input.status,
        submittedAt: input.now,
        submittedByProviderId: input.providerId,
        submittedCodeHash: input.submittedCodeHash,
        attempts: input.attempts,
        verifiedAt: null,
        failedAt: input.status === "FAILED" ? input.now : null,
        needsReviewAt: input.status === "NEEDS_REVIEW" ? input.now : null
      }
    });

    return safeConversationById(input.conversationId, tx);
  },
  async submitCode(
    input: AttendanceSubmissionInput & {
      verified: boolean;
      failedStatus?: "FAILED" | "NEEDS_REVIEW";
    },
    tx: UseravaaTransactionClient
  ) {
    if (input.verified) {
      return this.markAttendanceVerified(input, tx);
    }

    return this.markAttendanceFailed(
      {
        ...input,
        status: input.failedStatus ?? "FAILED"
      },
      tx
    );
  }
} as const;
