-- CreateEnum
CREATE TYPE "SupportTicketStatus" AS ENUM (
  'NEW',
  'OPEN',
  'IN_PROGRESS',
  'WAITING_FOR_USER',
  'WAITING_FOR_PROVIDER',
  'ESCALATED',
  'RESOLVED',
  'ARCHIVED'
);

-- CreateEnum
CREATE TYPE "SupportTicketPriority" AS ENUM (
  'LOW',
  'NORMAL',
  'HIGH',
  'URGENT'
);

-- CreateEnum
CREATE TYPE "SupportTicketCategory" AS ENUM (
  'CONVERSATION',
  'PAYMENT',
  'CANCELLATION_REFUND_WALLET',
  'PROFILE_EXPERIENCE_CREATOR',
  'INSIGHT_CONTENT',
  'ACCOUNT_AUTH',
  'PRICING_CATEGORY',
  'TECHNICAL_ISSUE',
  'TRUST_SAFETY',
  'GENERAL_QUESTION'
);

-- CreateEnum
CREATE TYPE "SupportTicketSource" AS ENUM (
  'ADMIN_CREATED',
  'USER_REPORTED',
  'SYSTEM_FLAGGED',
  'PAYMENT_REVIEW',
  'CONVERSATION_FLOW',
  'PROFILE_REVIEW',
  'INSIGHT_REPORT',
  'MANUAL'
);

-- CreateEnum
CREATE TYPE "SupportTicketNoteType" AS ENUM (
  'INTERNAL',
  'PUBLIC_DRAFT'
);

-- CreateEnum
CREATE TYPE "SupportRelatedEntityType" AS ENUM (
  'USER',
  'CONVERSATION',
  'PAYMENT',
  'PROFILE',
  'INSIGHT',
  'WALLET_TRANSACTION',
  'CONTENT_ENTRY',
  'NONE'
);

-- CreateTable
CREATE TABLE "SupportTicket" (
  "id" TEXT NOT NULL,
  "ticketNumber" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "status" "SupportTicketStatus" NOT NULL DEFAULT 'NEW',
  "priority" "SupportTicketPriority" NOT NULL DEFAULT 'NORMAL',
  "category" "SupportTicketCategory" NOT NULL DEFAULT 'GENERAL_QUESTION',
  "subcategory" TEXT,
  "source" "SupportTicketSource" NOT NULL DEFAULT 'ADMIN_CREATED',
  "requesterUserId" TEXT,
  "assigneeAdminId" TEXT,
  "relatedEntityType" "SupportRelatedEntityType",
  "relatedEntityId" TEXT,
  "resolutionSummary" TEXT,
  "resolutionReason" TEXT,
  "archivedAt" TIMESTAMP(3),
  "resolvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicketNote" (
  "id" TEXT NOT NULL,
  "ticketId" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "noteType" "SupportTicketNoteType" NOT NULL DEFAULT 'INTERNAL',
  "createdByAdminId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SupportTicketNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SupportTicket_ticketNumber_key" ON "SupportTicket"("ticketNumber");

-- CreateIndex
CREATE INDEX "SupportTicket_status_priority_updatedAt_idx" ON "SupportTicket"("status", "priority", "updatedAt");

-- CreateIndex
CREATE INDEX "SupportTicket_category_status_idx" ON "SupportTicket"("category", "status");

-- CreateIndex
CREATE INDEX "SupportTicket_assigneeAdminId_status_idx" ON "SupportTicket"("assigneeAdminId", "status");

-- CreateIndex
CREATE INDEX "SupportTicket_requesterUserId_idx" ON "SupportTicket"("requesterUserId");

-- CreateIndex
CREATE INDEX "SupportTicket_relatedEntityType_relatedEntityId_idx" ON "SupportTicket"("relatedEntityType", "relatedEntityId");

-- CreateIndex
CREATE INDEX "SupportTicket_archivedAt_idx" ON "SupportTicket"("archivedAt");

-- CreateIndex
CREATE INDEX "SupportTicketNote_ticketId_createdAt_idx" ON "SupportTicketNote"("ticketId", "createdAt");

-- CreateIndex
CREATE INDEX "SupportTicketNote_createdByAdminId_idx" ON "SupportTicketNote"("createdByAdminId");

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_requesterUserId_fkey" FOREIGN KEY ("requesterUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_assigneeAdminId_fkey" FOREIGN KEY ("assigneeAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicketNote" ADD CONSTRAINT "SupportTicketNote_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicketNote" ADD CONSTRAINT "SupportTicketNote_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
