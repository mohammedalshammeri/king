-- CreateEnum
CREATE TYPE "IndividualPurchaseStatus" AS ENUM ('ACTIVE', 'EXHAUSTED');

-- AlterTable: add multi-month prices + discountNote to SubscriptionPackage
ALTER TABLE "SubscriptionPackage"
  ADD COLUMN "price3Months"  DECIMAL(10,3),
  ADD COLUMN "price6Months"  DECIMAL(10,3),
  ADD COLUMN "price12Months" DECIMAL(10,3),
  ADD COLUMN "discountNote"  TEXT;

-- AlterTable: add durationChoice to Subscription
ALTER TABLE "Subscription"
  ADD COLUMN "durationChoice" TEXT NOT NULL DEFAULT '1';

-- CreateTable: IndividualListingPackage
CREATE TABLE "IndividualListingPackage" (
  "id"           TEXT NOT NULL,
  "name"         TEXT NOT NULL,
  "description"  TEXT,
  "listingCount" INTEGER NOT NULL,
  "price"        DECIMAL(10,3) NOT NULL,
  "currency"     "Currency" NOT NULL DEFAULT 'BHD',
  "isActive"     BOOLEAN NOT NULL DEFAULT true,
  "sortOrder"    INTEGER NOT NULL DEFAULT 0,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL,

  CONSTRAINT "IndividualListingPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable: IndividualPurchase
CREATE TABLE "IndividualPurchase" (
  "id"           TEXT NOT NULL,
  "userId"       TEXT NOT NULL,
  "packageId"    TEXT NOT NULL,
  "creditsTotal" INTEGER NOT NULL,
  "creditsUsed"  INTEGER NOT NULL DEFAULT 0,
  "paidAmount"   DECIMAL(10,3) NOT NULL,
  "status"       "IndividualPurchaseStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL,

  CONSTRAINT "IndividualPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IndividualListingPackage_isActive_idx" ON "IndividualListingPackage"("isActive");
CREATE INDEX "IndividualListingPackage_sortOrder_idx" ON "IndividualListingPackage"("sortOrder");
CREATE INDEX "IndividualPurchase_userId_idx" ON "IndividualPurchase"("userId");
CREATE INDEX "IndividualPurchase_userId_status_idx" ON "IndividualPurchase"("userId", "status");
CREATE INDEX "IndividualPurchase_status_idx" ON "IndividualPurchase"("status");

-- AddForeignKey
ALTER TABLE "IndividualPurchase"
  ADD CONSTRAINT "IndividualPurchase_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "IndividualPurchase"
  ADD CONSTRAINT "IndividualPurchase_packageId_fkey"
  FOREIGN KEY ("packageId") REFERENCES "IndividualListingPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
