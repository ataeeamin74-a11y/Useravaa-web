-- CreateEnum
CREATE TYPE "LeadType" AS ENUM (
  'REQUESTER_LEAD',
  'EXPERIENCE_CREATOR_LEAD',
  'PARTNER_LEAD',
  'GENERAL_LEAD'
);

-- CreateEnum
CREATE TYPE "LeadTemperature" AS ENUM (
  'COLD',
  'WARM',
  'HOT',
  'QUALIFIED',
  'CONVERTED',
  'LOST'
);

-- CreateEnum
CREATE TYPE "LeadStage" AS ENUM (
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'FOLLOW_UP',
  'CONVERTED',
  'LOST',
  'ARCHIVED'
);

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM (
  'ORGANIC',
  'REFERRAL',
  'LINKEDIN',
  'TELEGRAM',
  'INSTAGRAM',
  'EVENT',
  'MANUAL_IMPORT',
  'ADMIN_CREATED',
  'WAITLIST',
  'INSIGHT_INTERACTION',
  'PROFILE_VIEW',
  'CHECKOUT_ABANDONED',
  'CONVERSATION_REQUEST_STARTED',
  'OTHER'
);

-- CreateEnum
CREATE TYPE "LeadFollowUpChannel" AS ENUM (
  'PHONE',
  'WHATSAPP',
  'TELEGRAM',
  'EMAIL',
  'LINKEDIN',
  'IN_APP',
  'MANUAL'
);

-- CreateEnum
CREATE TYPE "LeadFollowUpOutcome" AS ENUM (
  'NO_RESPONSE',
  'INTERESTED',
  'NOT_NOW',
  'ASKED_FOR_MORE_INFO',
  'WANTS_SPECIFIC_EXPERIENCE',
  'PRICE_CONCERN',
  'NEEDS_TRUST',
  'BAD_FIT',
  'CONVERTED',
  'LOST'
);

-- CreateEnum
CREATE TYPE "LeadNoteType" AS ENUM (
  'INTERNAL'
);

-- CreateTable
CREATE TABLE "Lead" (
  "id" TEXT NOT NULL,
  "leadNumber" TEXT NOT NULL,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "phone" TEXT,
  "normalizedPhone" TEXT,
  "email" TEXT,
  "normalizedEmail" TEXT,
  "lastCompany" TEXT,
  "jobTitle" TEXT,
  "jobCategory" TEXT,
  "jobCategoryId" TEXT,
  "yearsOfExperience" INTEGER,
  "leadType" "LeadType" NOT NULL DEFAULT 'GENERAL_LEAD',
  "temperature" "LeadTemperature" NOT NULL DEFAULT 'WARM',
  "stage" "LeadStage" NOT NULL DEFAULT 'NEW',
  "source" "LeadSource" NOT NULL DEFAULT 'ADMIN_CREATED',
  "notes" TEXT,
  "ownerAdminId" TEXT,
  "relatedUserId" TEXT,
  "relatedConversationId" TEXT,
  "relatedProfileId" TEXT,
  "relatedInsightId" TEXT,
  "intentSummary" TEXT,
  "blocker" TEXT,
  "score" INTEGER,
  "lastContactedAt" TIMESTAMP(3),
  "nextFollowUpAt" TIMESTAMP(3),
  "followUpCount" INTEGER NOT NULL DEFAULT 0,
  "lastFollowUpOutcome" "LeadFollowUpOutcome",
  "convertedAt" TIMESTAMP(3),
  "lostAt" TIMESTAMP(3),
  "lostReason" TEXT,
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadTag" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "normalizedName" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LeadTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadTagAssignment" (
  "id" TEXT NOT NULL,
  "leadId" TEXT NOT NULL,
  "tagId" TEXT NOT NULL,
  "createdByAdminId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LeadTagAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadNote" (
  "id" TEXT NOT NULL,
  "leadId" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "noteType" "LeadNoteType" NOT NULL DEFAULT 'INTERNAL',
  "createdByAdminId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LeadNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadFollowUp" (
  "id" TEXT NOT NULL,
  "leadId" TEXT NOT NULL,
  "channel" "LeadFollowUpChannel" NOT NULL,
  "scheduledAt" TIMESTAMP(3) NOT NULL,
  "completedAt" TIMESTAMP(3),
  "outcome" "LeadFollowUpOutcome",
  "summary" TEXT,
  "createdByAdminId" TEXT,
  "completedByAdminId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LeadFollowUp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Lead_leadNumber_key" ON "Lead"("leadNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_normalizedPhone_key" ON "Lead"("normalizedPhone");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_normalizedEmail_key" ON "Lead"("normalizedEmail");

-- CreateIndex
CREATE INDEX "Lead_stage_temperature_updatedAt_idx" ON "Lead"("stage", "temperature", "updatedAt");

-- CreateIndex
CREATE INDEX "Lead_leadType_stage_idx" ON "Lead"("leadType", "stage");

-- CreateIndex
CREATE INDEX "Lead_source_createdAt_idx" ON "Lead"("source", "createdAt");

-- CreateIndex
CREATE INDEX "Lead_ownerAdminId_stage_idx" ON "Lead"("ownerAdminId", "stage");

-- CreateIndex
CREATE INDEX "Lead_relatedUserId_idx" ON "Lead"("relatedUserId");

-- CreateIndex
CREATE INDEX "Lead_relatedConversationId_idx" ON "Lead"("relatedConversationId");

-- CreateIndex
CREATE INDEX "Lead_relatedProfileId_idx" ON "Lead"("relatedProfileId");

-- CreateIndex
CREATE INDEX "Lead_relatedInsightId_idx" ON "Lead"("relatedInsightId");

-- CreateIndex
CREATE INDEX "Lead_jobCategoryId_idx" ON "Lead"("jobCategoryId");

-- CreateIndex
CREATE INDEX "Lead_archivedAt_idx" ON "Lead"("archivedAt");

-- CreateIndex
CREATE INDEX "Lead_nextFollowUpAt_idx" ON "Lead"("nextFollowUpAt");

-- CreateIndex
CREATE UNIQUE INDEX "LeadTag_normalizedName_key" ON "LeadTag"("normalizedName");

-- CreateIndex
CREATE UNIQUE INDEX "LeadTagAssignment_leadId_tagId_key" ON "LeadTagAssignment"("leadId", "tagId");

-- CreateIndex
CREATE INDEX "LeadTagAssignment_tagId_idx" ON "LeadTagAssignment"("tagId");

-- CreateIndex
CREATE INDEX "LeadTagAssignment_createdByAdminId_idx" ON "LeadTagAssignment"("createdByAdminId");

-- CreateIndex
CREATE INDEX "LeadNote_leadId_createdAt_idx" ON "LeadNote"("leadId", "createdAt");

-- CreateIndex
CREATE INDEX "LeadNote_createdByAdminId_idx" ON "LeadNote"("createdByAdminId");

-- CreateIndex
CREATE INDEX "LeadFollowUp_leadId_scheduledAt_idx" ON "LeadFollowUp"("leadId", "scheduledAt");

-- CreateIndex
CREATE INDEX "LeadFollowUp_scheduledAt_completedAt_idx" ON "LeadFollowUp"("scheduledAt", "completedAt");

-- CreateIndex
CREATE INDEX "LeadFollowUp_createdByAdminId_idx" ON "LeadFollowUp"("createdByAdminId");

-- CreateIndex
CREATE INDEX "LeadFollowUp_completedByAdminId_idx" ON "LeadFollowUp"("completedByAdminId");

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_ownerAdminId_fkey" FOREIGN KEY ("ownerAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_relatedUserId_fkey" FOREIGN KEY ("relatedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_relatedConversationId_fkey" FOREIGN KEY ("relatedConversationId") REFERENCES "ConversationRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_relatedProfileId_fkey" FOREIGN KEY ("relatedProfileId") REFERENCES "ExperienceProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_relatedInsightId_fkey" FOREIGN KEY ("relatedInsightId") REFERENCES "Insight"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_jobCategoryId_fkey" FOREIGN KEY ("jobCategoryId") REFERENCES "JobCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadTagAssignment" ADD CONSTRAINT "LeadTagAssignment_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadTagAssignment" ADD CONSTRAINT "LeadTagAssignment_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "LeadTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadTagAssignment" ADD CONSTRAINT "LeadTagAssignment_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadNote" ADD CONSTRAINT "LeadNote_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadNote" ADD CONSTRAINT "LeadNote_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadFollowUp" ADD CONSTRAINT "LeadFollowUp_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadFollowUp" ADD CONSTRAINT "LeadFollowUp_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadFollowUp" ADD CONSTRAINT "LeadFollowUp_completedByAdminId_fkey" FOREIGN KEY ("completedByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
