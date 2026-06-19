-- CreateEnum
CREATE TYPE "ContentEntryType" AS ENUM (
  'SYSTEM_COPY',
  'PAGE_BLOCK',
  'FAQ',
  'HELP_TEXT',
  'EMPTY_STATE',
  'ERROR_MESSAGE',
  'CTA',
  'ADMIN_COPY',
  'NOTIFICATION_TEMPLATE'
);

-- CreateEnum
CREATE TYPE "ContentEntryStatus" AS ENUM (
  'DRAFT',
  'PUBLISHED',
  'HIDDEN',
  'ARCHIVED'
);

-- CreateTable
CREATE TABLE "ContentEntry" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "namespace" TEXT NOT NULL,
  "locale" TEXT NOT NULL DEFAULT 'fa',
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "shortText" TEXT,
  "description" TEXT,
  "contentType" "ContentEntryType" NOT NULL,
  "status" "ContentEntryStatus" NOT NULL DEFAULT 'DRAFT',
  "isEditable" BOOLEAN NOT NULL DEFAULT true,
  "isSystem" BOOLEAN NOT NULL DEFAULT false,
  "createdByAdminId" TEXT,
  "updatedByAdminId" TEXT,
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ContentEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ContentEntry_namespace_key_locale_key" ON "ContentEntry"("namespace", "key", "locale");

-- CreateIndex
CREATE INDEX "ContentEntry_namespace_contentType_status_idx" ON "ContentEntry"("namespace", "contentType", "status");

-- CreateIndex
CREATE INDEX "ContentEntry_status_archivedAt_idx" ON "ContentEntry"("status", "archivedAt");

-- CreateIndex
CREATE INDEX "ContentEntry_isSystem_isEditable_idx" ON "ContentEntry"("isSystem", "isEditable");

-- AddForeignKey
ALTER TABLE "ContentEntry" ADD CONSTRAINT "ContentEntry_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentEntry" ADD CONSTRAINT "ContentEntry_updatedByAdminId_fkey" FOREIGN KEY ("updatedByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
