-- Checkpoint 3A-8: durable admin pricing rules.
-- Additive only: does not mutate historical payments, conversations, wallet transactions, or cancellations.

CREATE TABLE "PricingRule" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "jobField" "JobField",
    "experienceLevel" "OrgLevel",
    "sessionDurationMinutes" "DurationMinutes",
    "minPriceToman" INTEGER NOT NULL,
    "maxPriceToman" INTEGER NOT NULL,
    "suggestedPriceToman" INTEGER NOT NULL,
    "commissionRateBps" INTEGER NOT NULL DEFAULT 1500,
    "freeSessionCommissionRateBps" INTEGER NOT NULL DEFAULT 0,
    "allowFreeSession" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "createdByAdminId" TEXT,
    "updatedByAdminId" TEXT,
    "archivedAt" TIMESTAMP(3),
    "internalNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingRule_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PricingRule_isActive_archivedAt_idx" ON "PricingRule"("isActive", "archivedAt");
CREATE INDEX "PricingRule_jobField_experienceLevel_idx" ON "PricingRule"("jobField", "experienceLevel");
CREATE INDEX "PricingRule_sessionDurationMinutes_idx" ON "PricingRule"("sessionDurationMinutes");
CREATE INDEX "PricingRule_effectiveFrom_effectiveTo_idx" ON "PricingRule"("effectiveFrom", "effectiveTo");

ALTER TABLE "PricingRule"
ADD CONSTRAINT "PricingRule_createdByAdminId_fkey"
FOREIGN KEY ("createdByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PricingRule"
ADD CONSTRAINT "PricingRule_updatedByAdminId_fkey"
FOREIGN KEY ("updatedByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
