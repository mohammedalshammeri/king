-- AlterTable
ALTER TABLE "IndividualListingPackage" ADD COLUMN     "maxStories" INTEGER NOT NULL DEFAULT 2;

-- AlterTable
ALTER TABLE "SubscriptionPackage" ADD COLUMN     "maxStories" INTEGER NOT NULL DEFAULT 3;
