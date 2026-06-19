-- Extend the existing JobCategory taxonomy for admin management without deleting or rewriting existing rows.
ALTER TABLE "JobCategory" ADD COLUMN "slug" TEXT;
UPDATE "JobCategory"
SET "slug" = lower(replace(coalesce("code"::text, "id"), '_', '-'))
WHERE "slug" IS NULL;
ALTER TABLE "JobCategory" ALTER COLUMN "slug" SET NOT NULL;

ALTER TABLE "JobCategory" ADD COLUMN "titleEn" TEXT;
ALTER TABLE "JobCategory" ADD COLUMN "descriptionFa" TEXT;
ALTER TABLE "JobCategory" ADD COLUMN "parentId" TEXT;
ALTER TABLE "JobCategory" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "JobCategory" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "JobCategory" ADD COLUMN "showInDiscovery" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "JobCategory" ADD COLUMN "showInInsights" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "JobCategory" ADD COLUMN "showInPricing" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "JobCategory" ADD COLUMN "archivedAt" TIMESTAMP(3);
ALTER TABLE "JobCategory" ADD COLUMN "createdByAdminId" TEXT;
ALTER TABLE "JobCategory" ADD COLUMN "updatedByAdminId" TEXT;
ALTER TABLE "JobCategory" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "JobCategory" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX "JobCategory_slug_key" ON "JobCategory"("slug");
CREATE INDEX "JobCategory_parentId_idx" ON "JobCategory"("parentId");
CREATE INDEX "JobCategory_isActive_archivedAt_idx" ON "JobCategory"("isActive", "archivedAt");
CREATE INDEX "JobCategory_showInDiscovery_isActive_archivedAt_idx" ON "JobCategory"("showInDiscovery", "isActive", "archivedAt");
CREATE INDEX "JobCategory_showInInsights_isActive_archivedAt_idx" ON "JobCategory"("showInInsights", "isActive", "archivedAt");
CREATE INDEX "JobCategory_showInPricing_isActive_archivedAt_idx" ON "JobCategory"("showInPricing", "isActive", "archivedAt");
CREATE INDEX "JobCategory_sortOrder_idx" ON "JobCategory"("sortOrder");

ALTER TABLE "JobCategory" ADD CONSTRAINT "JobCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "JobCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "JobCategory" ADD CONSTRAINT "JobCategory_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "JobCategory" ADD CONSTRAINT "JobCategory_updatedByAdminId_fkey" FOREIGN KEY ("updatedByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
