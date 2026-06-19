-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'SUPPORT');

-- CreateEnum
CREATE TYPE "OrgLevel" AS ENUM ('INTERN', 'SPECIALIST', 'SENIOR_SPECIALIST', 'MIDDLE_MANAGER', 'SENIOR_MANAGER', 'VP', 'BUSINESS_MANAGER');

-- CreateEnum
CREATE TYPE "JobField" AS ENUM ('PRODUCT_UX', 'GRAPHIC_BRAND_IDENTITY', 'SOFTWARE_ENGINEERING', 'DATA_AI', 'MARKETING_BRAND', 'BUSINESS_ANALYSIS_DEVELOPMENT', 'OPERATIONS', 'CUSTOMER_EXPERIENCE', 'CUSTOMER_SUPPORT', 'SALES_COMMERCE', 'STRATEGY_BUSINESS_MODEL', 'FINANCE_LEGAL_INVESTMENT', 'HR_ORG_CULTURE', 'MANAGEMENT_LEADERSHIP_ENTREPRENEURSHIP');

-- CreateEnum
CREATE TYPE "ProfileStatus" AS ENUM ('NONE', 'DRAFT', 'PENDING_REVIEW', 'NEEDS_CHANGES', 'ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ExperienceCapabilityStatus" AS ENUM ('NOT_STARTED', 'DRAFT', 'PENDING_REVIEW', 'NEEDS_CHANGES', 'ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "UserMotivationCode" AS ENUM ('CAREER_GROWTH', 'CAREER_CHOICE', 'CAREER_CHANGE', 'RESUME_INTERVIEW', 'SIDE_INCOME', 'UNDERSTAND_REALITY_OF_ROLE', 'HELP_OTHERS', 'EARN_FROM_EXPERIENCE', 'OTHER');

-- CreateEnum
CREATE TYPE "DurationMinutes" AS ENUM ('MIN_30', 'MIN_60');

-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('CREATED', 'AWAITING_PAYMENT', 'PAYMENT_PROCESSING', 'PAYMENT_FAILED', 'PAYMENT_FINALIZED', 'AWAITING_TIME_PROPOSAL', 'TIMES_PROPOSED', 'NEW_TIME_REQUESTED', 'CONFIRMED', 'COMPLETED', 'REJECTED', 'CANCELLED', 'EXPIRED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentRequirement" AS ENUM ('PAYMENT_REQUIRED', 'FREE_NOT_REQUIRED', 'FULL_WALLET_COVERED', 'PARTIAL_GATEWAY_REQUIRED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('ONLINE', 'CARD_TO_CARD', 'WALLET', 'FREE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('NOT_REQUIRED', 'CHECKOUT_CREATED', 'REQUIRES_GATEWAY_PAYMENT', 'UNPAID', 'PENDING_REVIEW', 'PROCESSING', 'PAID', 'FAILED', 'CANCELLED', 'REFUND_PENDING', 'REFUNDED');

-- CreateEnum
CREATE TYPE "ManualPaymentReviewStatus" AS ENUM ('NOT_REQUIRED', 'DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'NEEDS_REVIEW');

-- CreateEnum
CREATE TYPE "TimeProposalSetStatus" AS ENUM ('ACTIVE', 'SUPERSEDED', 'SELECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ProposedTimeStatus" AS ENUM ('ACTIVE', 'SUPERSEDED', 'SELECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "NewTimeRequestStatus" AS ENUM ('REQUESTED', 'FULFILLED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "AttendanceVerificationStatus" AS ENUM ('NOT_REQUIRED', 'PENDING', 'SUBMITTED', 'VERIFIED', 'FAILED', 'EXPIRED', 'NEEDS_REVIEW');

-- CreateEnum
CREATE TYPE "CancellationStatus" AS ENUM ('REQUESTED', 'COMPLETED', 'UNDER_SUPPORT_REVIEW', 'REJECTED');

-- CreateEnum
CREATE TYPE "CancellationStage" AS ENUM ('BEFORE_TIME_PROPOSAL', 'AFTER_TIME_PROPOSAL_BEFORE_SELECTION', 'AFTER_CONFIRMED_SESSION', 'NEAR_SESSION_START', 'PROVIDER_FAULT', 'PLATFORM_FAULT');

-- CreateEnum
CREATE TYPE "CancelledByRole" AS ENUM ('REQUESTER', 'PROVIDER', 'EXPERIENCE_CREATOR', 'ADMIN_SUPPORT', 'PLATFORM');

-- CreateEnum
CREATE TYPE "CancellationRefundDestination" AS ENUM ('WALLET', 'NONE');

-- CreateEnum
CREATE TYPE "WalletTransactionType" AS ENUM ('PAYMENT_DEBIT', 'REFUND_CREDIT', 'CANCELLATION_REFUND_CREDIT', 'CANCELLATION_PROVIDER_COMPENSATION', 'EARNING_CREDIT', 'WITHDRAWAL_REQUEST', 'WITHDRAWAL_PAID', 'ADJUSTMENT', 'TOP_UP');

-- CreateEnum
CREATE TYPE "WalletTransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SettlementStatus" AS ENUM ('NOT_SETTLEABLE', 'SETTLEMENT_PENDING', 'SETTLED', 'FAILED');

-- CreateEnum
CREATE TYPE "WithdrawalStatus" AS ENUM ('REQUESTED', 'PROCESSING', 'PAID', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('UNREAD', 'READ');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('NEW_REQUEST', 'PROPOSED_TIMES', 'NEW_TIME_REQUEST', 'NEW_TIME_OPTIONS', 'CONFIRMED', 'ATTENDANCE', 'CANCELLATION', 'WALLET', 'WITHDRAWAL', 'INSIGHT', 'SUPPORT');

-- CreateEnum
CREATE TYPE "RelatedEntityType" AS ENUM ('CONVERSATION', 'PAYMENT', 'CANCELLATION', 'WALLET_TRANSACTION', 'WITHDRAWAL', 'PROFILE', 'INSIGHT', 'INSIGHT_ANSWER');

-- CreateEnum
CREATE TYPE "InsightStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'HIDDEN', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "InsightAnswerStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'HIDDEN');

-- CreateEnum
CREATE TYPE "ExperienceQuestionStatus" AS ENUM ('ACTIVE', 'REPLACED', 'SKIPPED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "EmailLogStatus" AS ENUM ('QUEUED', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "displayName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "ProfileStatus" NOT NULL DEFAULT 'NONE',
    "displayName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "professionalSummary" TEXT,
    "userMotivations" "UserMotivationCode"[],
    "userMotivationOtherText" TEXT,
    "canOfferExperience" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExperienceProfile" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "status" "ExperienceCapabilityStatus" NOT NULL DEFAULT 'DRAFT',
    "displayName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "roleTitle" TEXT NOT NULL,
    "jobField" "JobField",
    "orgLevel" "OrgLevel" NOT NULL,
    "yearsOfExperience" INTEGER NOT NULL,
    "publicProfessionalSummary" TEXT NOT NULL,
    "freeHelp" BOOLEAN NOT NULL DEFAULT false,
    "price30Toman" INTEGER,
    "price60Toman" INTEGER,
    "reviewNote" TEXT,
    "successfulConversationCount" INTEGER NOT NULL DEFAULT 0,
    "csatAverage" DECIMAL(3,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExperienceProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExperienceTimelineItem" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "jobField" "JobField" NOT NULL,
    "orgLevel" "OrgLevel" NOT NULL,
    "companyName" TEXT NOT NULL,
    "companyCountry" TEXT,
    "companyIndustry" TEXT,
    "startYear" INTEGER NOT NULL,
    "startMonth" INTEGER,
    "endYear" INTEGER,
    "endMonth" INTEGER,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "sortOrder" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExperienceTimelineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobCategory" (
    "id" TEXT NOT NULL,
    "labelFa" TEXT NOT NULL,
    "code" "JobField",

    CONSTRAINT "JobCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileCategory" (
    "profileId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "ProfileCategory_pkey" PRIMARY KEY ("profileId","categoryId")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "nameFa" TEXT NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileCompany" (
    "profileId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "ProfileCompany_pkey" PRIMARY KEY ("profileId","companyId")
);

-- CreateTable
CREATE TABLE "Language" (
    "id" TEXT NOT NULL,
    "labelFa" TEXT NOT NULL,

    CONSTRAINT "Language_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileLanguage" (
    "profileId" TEXT NOT NULL,
    "languageId" TEXT NOT NULL,

    CONSTRAINT "ProfileLanguage_pkey" PRIMARY KEY ("profileId","languageId")
);

-- CreateTable
CREATE TABLE "SavedProfile" (
    "userId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedProfile_pkey" PRIMARY KEY ("userId","profileId")
);

-- CreateTable
CREATE TABLE "ProfileFollow" (
    "followerId" TEXT NOT NULL,
    "followedUserId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfileFollow_pkey" PRIMARY KEY ("followerId","profileId")
);

-- CreateTable
CREATE TABLE "ConversationRequest" (
    "id" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "experienceProfileId" TEXT NOT NULL,
    "duration" "DurationMinutes" NOT NULL,
    "priceToman" INTEGER NOT NULL,
    "status" "ConversationStatus" NOT NULL DEFAULT 'CREATED',
    "paymentRequirement" "PaymentRequirement" NOT NULL DEFAULT 'PAYMENT_REQUIRED',
    "requestTopic" TEXT,
    "requestNote" TEXT,
    "providerVisibleAt" TIMESTAMP(3),
    "providerResponseDeadlineAt" TIMESTAMP(3),
    "providerRespondedAt" TIMESTAMP(3),
    "timesProposedAt" TIMESTAMP(3),
    "requesterSelectionDeadlineAt" TIMESTAMP(3),
    "selectedTimeId" TEXT,
    "selectedAt" TIMESTAMP(3),
    "paymentFinalizedAt" TIMESTAMP(3),
    "freeFinalizedAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "expiredAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConversationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeProposalSet" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "TimeProposalSetStatus" NOT NULL DEFAULT 'ACTIVE',
    "proposedById" TEXT NOT NULL,
    "proposedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "supersededAt" TIMESTAMP(3),
    "selectedAt" TIMESTAMP(3),

    CONSTRAINT "TimeProposalSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProposedTime" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "proposalSetId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "shamsiDateLabel" TEXT NOT NULL,
    "timeLabel" TEXT NOT NULL,
    "status" "ProposedTimeStatus" NOT NULL DEFAULT 'ACTIVE',
    "selectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProposedTime_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewTimeRequest" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "note" TEXT,
    "status" "NewTimeRequestStatus" NOT NULL DEFAULT 'REQUESTED',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fulfilledAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "NewTimeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "payerId" TEXT NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "requirement" "PaymentRequirement" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'CHECKOUT_CREATED',
    "amountToman" INTEGER NOT NULL,
    "walletDeductionToman" INTEGER NOT NULL DEFAULT 0,
    "gatewayPayableToman" INTEGER NOT NULL DEFAULT 0,
    "providerVisibleAfterPaid" BOOLEAN NOT NULL DEFAULT true,
    "finalizedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "providerReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManualPaymentReview" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "status" "ManualPaymentReviewStatus" NOT NULL DEFAULT 'DRAFT',
    "referenceNumber" TEXT,
    "receiptUrl" TEXT,
    "receiptFileName" TEXT,
    "receiptMimeType" TEXT,
    "receiptSizeBytes" INTEGER,
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "reviewedByAdminId" TEXT,
    "adminNote" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManualPaymentReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceVerification" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "status" "AttendanceVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "codeHash" TEXT,
    "codeSalt" TEXT,
    "requesterCodeCiphertext" TEXT,
    "codeGeneratedAt" TIMESTAMP(3),
    "codeExpiresAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "submittedByProviderId" TEXT,
    "submittedCodeHash" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "verifiedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "needsReviewAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cancellation" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "cancelledByUserId" TEXT,
    "cancelledByRole" "CancelledByRole" NOT NULL,
    "status" "CancellationStatus" NOT NULL DEFAULT 'REQUESTED',
    "stage" "CancellationStage" NOT NULL,
    "reasonCode" TEXT NOT NULL,
    "otherReasonText" TEXT,
    "refundRateBps" INTEGER NOT NULL DEFAULT 0,
    "refundAmountToman" INTEGER NOT NULL DEFAULT 0,
    "refundDestination" "CancellationRefundDestination" NOT NULL DEFAULT 'NONE',
    "providerGrossCompensationToman" INTEGER NOT NULL DEFAULT 0,
    "useravaaFeeRateBps" INTEGER NOT NULL DEFAULT 1500,
    "useravaaFeeAmountToman" INTEGER NOT NULL DEFAULT 0,
    "providerNetCompensationToman" INTEGER NOT NULL DEFAULT 0,
    "hoursUntilSession" DECIMAL(6,2),
    "isLateRequesterCancellation" BOOLEAN NOT NULL DEFAULT false,
    "requesterRefundWalletTransactionId" TEXT,
    "providerCompensationWalletTransactionId" TEXT,
    "supportReviewReason" TEXT,
    "reviewedByAdminId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cancellation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balanceToman" INTEGER NOT NULL DEFAULT 0,
    "availablePayoutToman" INTEGER NOT NULL DEFAULT 0,
    "pendingPayoutToman" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletTransaction" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "type" "WalletTransactionType" NOT NULL,
    "status" "WalletTransactionStatus" NOT NULL DEFAULT 'PENDING',
    "settlementStatus" "SettlementStatus" NOT NULL DEFAULT 'NOT_SETTLEABLE',
    "title" TEXT NOT NULL,
    "amountToman" INTEGER NOT NULL,
    "sourceEntityType" "RelatedEntityType",
    "sourceEntityId" TEXT,
    "conversationId" TEXT,
    "paymentId" TEXT,
    "withdrawalRequestId" TEXT,
    "cancelledByRole" "CancelledByRole",
    "providerGrossCompensationToman" INTEGER,
    "useravaaFeeRateBps" INTEGER,
    "useravaaFeeAmountToman" INTEGER,
    "providerNetAmountToman" INTEGER,
    "refundRateBps" INTEGER,
    "refundAmountToman" INTEGER,
    "hoursUntilSession" DECIMAL(6,2),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WithdrawalRequest" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amountToman" INTEGER NOT NULL,
    "destinationAccountOwner" TEXT,
    "destinationIbanMasked" TEXT,
    "destinationMetadata" JSONB,
    "status" "WithdrawalStatus" NOT NULL DEFAULT 'REQUESTED',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "reviewedByAdminId" TEXT,
    "adminNote" TEXT,
    "trackingNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WithdrawalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SettlementInfo" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountOwner" TEXT NOT NULL,
    "iban" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SettlementInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "text" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'UNREAD',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "deepLink" TEXT,
    "relatedEntityType" "RelatedEntityType",
    "relatedEntityId" TEXT,
    "conversationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExperienceQuestion" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "renderedQuestion" TEXT NOT NULL,
    "status" "ExperienceQuestionStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExperienceQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Insight" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "body" TEXT,
    "status" "InsightStatus" NOT NULL DEFAULT 'DRAFT',
    "authorUserId" TEXT,
    "experienceProfileId" TEXT,
    "publishedAt" TIMESTAMP(3),
    "hiddenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Insight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsightAnswer" (
    "id" TEXT NOT NULL,
    "authorUserId" TEXT NOT NULL,
    "experienceProfileId" TEXT,
    "experienceQuestionId" TEXT,
    "insightId" TEXT,
    "renderedQuestion" TEXT NOT NULL,
    "answerText" TEXT NOT NULL,
    "audienceIntents" TEXT[],
    "status" "InsightAnswerStatus" NOT NULL DEFAULT 'DRAFT',
    "responsibilityAccepted" BOOLEAN NOT NULL DEFAULT false,
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "hiddenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InsightAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailLog" (
    "id" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "conversationRequestId" TEXT,
    "templateKey" TEXT NOT NULL,
    "toEmail" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" "EmailLogStatus" NOT NULL DEFAULT 'QUEUED',
    "sentAt" TIMESTAMP(3),
    "failedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ExperienceProfile_ownerId_key" ON "ExperienceProfile"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "ExperienceProfile_profileId_key" ON "ExperienceProfile"("profileId");

-- CreateIndex
CREATE INDEX "ExperienceProfile_status_orgLevel_idx" ON "ExperienceProfile"("status", "orgLevel");

-- CreateIndex
CREATE INDEX "ExperienceTimelineItem_profileId_idx" ON "ExperienceTimelineItem"("profileId");

-- CreateIndex
CREATE INDEX "ExperienceTimelineItem_profileId_isCurrent_idx" ON "ExperienceTimelineItem"("profileId", "isCurrent");

-- CreateIndex
CREATE INDEX "ExperienceTimelineItem_jobField_idx" ON "ExperienceTimelineItem"("jobField");

-- CreateIndex
CREATE INDEX "ExperienceTimelineItem_companyName_idx" ON "ExperienceTimelineItem"("companyName");

-- CreateIndex
CREATE UNIQUE INDEX "JobCategory_labelFa_key" ON "JobCategory"("labelFa");

-- CreateIndex
CREATE UNIQUE INDEX "JobCategory_code_key" ON "JobCategory"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Company_nameFa_key" ON "Company"("nameFa");

-- CreateIndex
CREATE UNIQUE INDEX "Language_labelFa_key" ON "Language"("labelFa");

-- CreateIndex
CREATE UNIQUE INDEX "ConversationRequest_selectedTimeId_key" ON "ConversationRequest"("selectedTimeId");

-- CreateIndex
CREATE INDEX "ConversationRequest_requesterId_status_idx" ON "ConversationRequest"("requesterId", "status");

-- CreateIndex
CREATE INDEX "ConversationRequest_providerId_status_idx" ON "ConversationRequest"("providerId", "status");

-- CreateIndex
CREATE INDEX "ConversationRequest_experienceProfileId_idx" ON "ConversationRequest"("experienceProfileId");

-- CreateIndex
CREATE INDEX "TimeProposalSet_conversationId_status_idx" ON "TimeProposalSet"("conversationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "TimeProposalSet_conversationId_version_key" ON "TimeProposalSet"("conversationId", "version");

-- CreateIndex
CREATE INDEX "ProposedTime_conversationId_version_status_idx" ON "ProposedTime"("conversationId", "version", "status");

-- CreateIndex
CREATE INDEX "ProposedTime_proposalSetId_status_idx" ON "ProposedTime"("proposalSetId", "status");

-- CreateIndex
CREATE INDEX "NewTimeRequest_conversationId_status_idx" ON "NewTimeRequest"("conversationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_conversationId_key" ON "Payment"("conversationId");

-- CreateIndex
CREATE INDEX "Payment_payerId_status_idx" ON "Payment"("payerId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ManualPaymentReview_paymentId_key" ON "ManualPaymentReview"("paymentId");

-- CreateIndex
CREATE INDEX "ManualPaymentReview_status_submittedAt_idx" ON "ManualPaymentReview"("status", "submittedAt");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceVerification_conversationId_key" ON "AttendanceVerification"("conversationId");

-- CreateIndex
CREATE INDEX "AttendanceVerification_status_codeExpiresAt_idx" ON "AttendanceVerification"("status", "codeExpiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Cancellation_requesterRefundWalletTransactionId_key" ON "Cancellation"("requesterRefundWalletTransactionId");

-- CreateIndex
CREATE UNIQUE INDEX "Cancellation_providerCompensationWalletTransactionId_key" ON "Cancellation"("providerCompensationWalletTransactionId");

-- CreateIndex
CREATE INDEX "Cancellation_conversationId_status_idx" ON "Cancellation"("conversationId", "status");

-- CreateIndex
CREATE INDEX "Cancellation_cancelledByRole_stage_idx" ON "Cancellation"("cancelledByRole", "stage");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_userId_key" ON "Wallet"("userId");

-- CreateIndex
CREATE INDEX "WalletTransaction_walletId_createdAt_idx" ON "WalletTransaction"("walletId", "createdAt");

-- CreateIndex
CREATE INDEX "WalletTransaction_sourceEntityType_sourceEntityId_idx" ON "WalletTransaction"("sourceEntityType", "sourceEntityId");

-- CreateIndex
CREATE INDEX "WalletTransaction_status_settlementStatus_idx" ON "WalletTransaction"("status", "settlementStatus");

-- CreateIndex
CREATE INDEX "WithdrawalRequest_userId_status_idx" ON "WithdrawalRequest"("userId", "status");

-- CreateIndex
CREATE INDEX "WithdrawalRequest_walletId_requestedAt_idx" ON "WithdrawalRequest"("walletId", "requestedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SettlementInfo_userId_key" ON "SettlementInfo"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Feedback_conversationId_key" ON "Feedback"("conversationId");

-- CreateIndex
CREATE INDEX "Notification_userId_status_createdAt_idx" ON "Notification"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_relatedEntityType_relatedEntityId_idx" ON "Notification"("relatedEntityType", "relatedEntityId");

-- CreateIndex
CREATE INDEX "ExperienceQuestion_profileId_status_idx" ON "ExperienceQuestion"("profileId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Insight_slug_key" ON "Insight"("slug");

-- CreateIndex
CREATE INDEX "Insight_status_publishedAt_idx" ON "Insight"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "InsightAnswer_authorUserId_status_idx" ON "InsightAnswer"("authorUserId", "status");

-- CreateIndex
CREATE INDEX "InsightAnswer_experienceProfileId_status_idx" ON "InsightAnswer"("experienceProfileId", "status");

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperienceProfile" ADD CONSTRAINT "ExperienceProfile_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperienceProfile" ADD CONSTRAINT "ExperienceProfile_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperienceTimelineItem" ADD CONSTRAINT "ExperienceTimelineItem_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "ExperienceProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileCategory" ADD CONSTRAINT "ProfileCategory_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "ExperienceProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileCategory" ADD CONSTRAINT "ProfileCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "JobCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileCompany" ADD CONSTRAINT "ProfileCompany_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "ExperienceProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileCompany" ADD CONSTRAINT "ProfileCompany_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileLanguage" ADD CONSTRAINT "ProfileLanguage_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "ExperienceProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileLanguage" ADD CONSTRAINT "ProfileLanguage_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "Language"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedProfile" ADD CONSTRAINT "SavedProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedProfile" ADD CONSTRAINT "SavedProfile_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "ExperienceProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileFollow" ADD CONSTRAINT "ProfileFollow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileFollow" ADD CONSTRAINT "ProfileFollow_followedUserId_fkey" FOREIGN KEY ("followedUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileFollow" ADD CONSTRAINT "ProfileFollow_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "ExperienceProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationRequest" ADD CONSTRAINT "ConversationRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationRequest" ADD CONSTRAINT "ConversationRequest_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationRequest" ADD CONSTRAINT "ConversationRequest_experienceProfileId_fkey" FOREIGN KEY ("experienceProfileId") REFERENCES "ExperienceProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationRequest" ADD CONSTRAINT "ConversationRequest_selectedTimeId_fkey" FOREIGN KEY ("selectedTimeId") REFERENCES "ProposedTime"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeProposalSet" ADD CONSTRAINT "TimeProposalSet_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "ConversationRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposedTime" ADD CONSTRAINT "ProposedTime_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "ConversationRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposedTime" ADD CONSTRAINT "ProposedTime_proposalSetId_fkey" FOREIGN KEY ("proposalSetId") REFERENCES "TimeProposalSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewTimeRequest" ADD CONSTRAINT "NewTimeRequest_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "ConversationRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "ConversationRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManualPaymentReview" ADD CONSTRAINT "ManualPaymentReview_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManualPaymentReview" ADD CONSTRAINT "ManualPaymentReview_reviewedByAdminId_fkey" FOREIGN KEY ("reviewedByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceVerification" ADD CONSTRAINT "AttendanceVerification_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "ConversationRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceVerification" ADD CONSTRAINT "AttendanceVerification_submittedByProviderId_fkey" FOREIGN KEY ("submittedByProviderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cancellation" ADD CONSTRAINT "Cancellation_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "ConversationRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cancellation" ADD CONSTRAINT "Cancellation_cancelledByUserId_fkey" FOREIGN KEY ("cancelledByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cancellation" ADD CONSTRAINT "Cancellation_reviewedByAdminId_fkey" FOREIGN KEY ("reviewedByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cancellation" ADD CONSTRAINT "Cancellation_requesterRefundWalletTransactionId_fkey" FOREIGN KEY ("requesterRefundWalletTransactionId") REFERENCES "WalletTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cancellation" ADD CONSTRAINT "Cancellation_providerCompensationWalletTransactionId_fkey" FOREIGN KEY ("providerCompensationWalletTransactionId") REFERENCES "WalletTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "ConversationRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_withdrawalRequestId_fkey" FOREIGN KEY ("withdrawalRequestId") REFERENCES "WithdrawalRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WithdrawalRequest" ADD CONSTRAINT "WithdrawalRequest_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WithdrawalRequest" ADD CONSTRAINT "WithdrawalRequest_reviewedByAdminId_fkey" FOREIGN KEY ("reviewedByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettlementInfo" ADD CONSTRAINT "SettlementInfo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "ConversationRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "ExperienceProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "ConversationRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperienceQuestion" ADD CONSTRAINT "ExperienceQuestion_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "ExperienceProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Insight" ADD CONSTRAINT "Insight_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Insight" ADD CONSTRAINT "Insight_experienceProfileId_fkey" FOREIGN KEY ("experienceProfileId") REFERENCES "ExperienceProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsightAnswer" ADD CONSTRAINT "InsightAnswer_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsightAnswer" ADD CONSTRAINT "InsightAnswer_experienceProfileId_fkey" FOREIGN KEY ("experienceProfileId") REFERENCES "ExperienceProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsightAnswer" ADD CONSTRAINT "InsightAnswer_experienceQuestionId_fkey" FOREIGN KEY ("experienceQuestionId") REFERENCES "ExperienceQuestion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsightAnswer" ADD CONSTRAINT "InsightAnswer_insightId_fkey" FOREIGN KEY ("insightId") REFERENCES "Insight"("id") ON DELETE SET NULL ON UPDATE CASCADE;
