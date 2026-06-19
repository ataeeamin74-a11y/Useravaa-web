-- CreateTable
CREATE TABLE "AdminAuditEvent" (
    "id" TEXT NOT NULL,
    "actorAdminUserId" TEXT,
    "actorRole" "UserRole" NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "relatedConversationId" TEXT,
    "relatedPaymentId" TEXT,
    "beforeStatus" TEXT,
    "afterStatus" TEXT,
    "reason" TEXT,
    "note" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminAuditEvent_action_createdAt_idx" ON "AdminAuditEvent"("action", "createdAt");

-- CreateIndex
CREATE INDEX "AdminAuditEvent_entityType_entityId_idx" ON "AdminAuditEvent"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AdminAuditEvent_relatedConversationId_idx" ON "AdminAuditEvent"("relatedConversationId");

-- CreateIndex
CREATE INDEX "AdminAuditEvent_relatedPaymentId_idx" ON "AdminAuditEvent"("relatedPaymentId");

-- AddForeignKey
ALTER TABLE "AdminAuditEvent" ADD CONSTRAINT "AdminAuditEvent_actorAdminUserId_fkey" FOREIGN KEY ("actorAdminUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
