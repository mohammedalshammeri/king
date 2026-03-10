-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'LUCK_WINNER';

-- CreateTable
CREATE TABLE "LuckFeature" (
    "id" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "winnerId" TEXT,
    "winnerCode" TEXT,
    "drawnAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LuckFeature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LuckEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "isWinner" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LuckEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LuckEntry_userId_key" ON "LuckEntry"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LuckEntry_code_key" ON "LuckEntry"("code");

-- CreateIndex
CREATE INDEX "LuckEntry_code_idx" ON "LuckEntry"("code");

-- CreateIndex
CREATE INDEX "LuckEntry_isWinner_idx" ON "LuckEntry"("isWinner");

-- AddForeignKey
ALTER TABLE "LuckEntry" ADD CONSTRAINT "LuckEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
