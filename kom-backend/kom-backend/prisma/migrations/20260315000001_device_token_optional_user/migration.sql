-- AlterTable: make userId nullable in DeviceToken (to support guest/anonymous push tokens)
ALTER TABLE "DeviceToken" ALTER COLUMN "userId" DROP NOT NULL;

-- DropForeignKey (old CASCADE constraint)
ALTER TABLE "DeviceToken" DROP CONSTRAINT "DeviceToken_userId_fkey";

-- AddForeignKey (new SET NULL constraint)
ALTER TABLE "DeviceToken" ADD CONSTRAINT "DeviceToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
