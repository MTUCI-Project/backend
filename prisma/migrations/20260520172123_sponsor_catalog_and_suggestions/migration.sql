-- CreateEnum
CREATE TYPE "SponsorSuggestionStatus" AS ENUM ('pending', 'sent', 'dismissed', 'clicked', 'converted', 'expired');

-- AlterTable
ALTER TABLE "SponsorOffer" ADD COLUMN     "productId" TEXT;

-- CreateTable
CREATE TABLE "SponsorProduct" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "referralUrl" TEXT NOT NULL,
    "sponsorName" TEXT NOT NULL,
    "imageUrl" TEXT,
    "priceLabel" TEXT,
    "category" TEXT,
    "tags" JSONB NOT NULL DEFAULT '[]',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "SponsorProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SponsorSuggestion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "eventId" TEXT,
    "todoId" TEXT,
    "reminderId" TEXT,
    "title" TEXT,
    "message" TEXT,
    "placement" TEXT NOT NULL,
    "reason" TEXT,
    "status" "SponsorSuggestionStatus" NOT NULL DEFAULT 'pending',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deliveredAt" TIMESTAMP(3),

    CONSTRAINT "SponsorSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SponsorProduct_isActive_deletedAt_idx" ON "SponsorProduct"("isActive", "deletedAt");

-- CreateIndex
CREATE INDEX "SponsorProduct_sponsorName_idx" ON "SponsorProduct"("sponsorName");

-- CreateIndex
CREATE INDEX "SponsorProduct_category_idx" ON "SponsorProduct"("category");

-- CreateIndex
CREATE INDEX "SponsorSuggestion_userId_status_idx" ON "SponsorSuggestion"("userId", "status");

-- CreateIndex
CREATE INDEX "SponsorSuggestion_productId_idx" ON "SponsorSuggestion"("productId");

-- CreateIndex
CREATE INDEX "SponsorSuggestion_eventId_idx" ON "SponsorSuggestion"("eventId");

-- CreateIndex
CREATE INDEX "SponsorSuggestion_todoId_idx" ON "SponsorSuggestion"("todoId");

-- CreateIndex
CREATE INDEX "SponsorSuggestion_reminderId_idx" ON "SponsorSuggestion"("reminderId");

-- CreateIndex
CREATE INDEX "SponsorOffer_productId_idx" ON "SponsorOffer"("productId");

-- AddForeignKey
ALTER TABLE "SponsorOffer" ADD CONSTRAINT "SponsorOffer_productId_fkey" FOREIGN KEY ("productId") REFERENCES "SponsorProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SponsorSuggestion" ADD CONSTRAINT "SponsorSuggestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SponsorSuggestion" ADD CONSTRAINT "SponsorSuggestion_productId_fkey" FOREIGN KEY ("productId") REFERENCES "SponsorProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SponsorSuggestion" ADD CONSTRAINT "SponsorSuggestion_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "UserEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SponsorSuggestion" ADD CONSTRAINT "SponsorSuggestion_todoId_fkey" FOREIGN KEY ("todoId") REFERENCES "Todo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SponsorSuggestion" ADD CONSTRAINT "SponsorSuggestion_reminderId_fkey" FOREIGN KEY ("reminderId") REFERENCES "Reminder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
