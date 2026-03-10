-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'LISTING_SOLD_CHECK';

-- AlterTable
ALTER TABLE "Listing" ADD COLUMN "soldCheckCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Listing" ADD COLUMN "lastSoldCheckAt" TIMESTAMP(3);
