-- CreateEnum
CREATE TYPE "CoupleLinkStatus" AS ENUM ('pending', 'active', 'declined', 'revoked');

-- CreateEnum
CREATE TYPE "DomainSource" AS ENUM ('user', 'ai', 'system');

-- CreateEnum
CREATE TYPE "TodoStatus" AS ENUM ('open', 'done', 'dismissed', 'cancelled');

-- CreateEnum
CREATE TYPE "ReminderStatus" AS ENUM ('scheduled', 'sent', 'dismissed', 'done', 'cancelled');

-- CreateEnum
CREATE TYPE "ReminderChannel" AS ENUM ('push', 'in_app', 'email');

-- CreateEnum
CREATE TYPE "SponsorOfferStatus" AS ENUM ('proposed', 'accepted', 'dismissed', 'expired');

-- CreateTable
CREATE TABLE "CoupleLink" (
    "id" TEXT NOT NULL,
    "userAId" TEXT NOT NULL,
    "userBId" TEXT,
    "status" "CoupleLinkStatus" NOT NULL DEFAULT 'pending',
    "inviteCode" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "CoupleLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnboardingAnswer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questionKey" TEXT NOT NULL,
    "answer" JSONB NOT NULL,
    "source" "DomainSource" NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnboardingAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "eventAt" TIMESTAMP(3),
    "timezone" TEXT,
    "source" "DomainSource" NOT NULL DEFAULT 'user',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "UserEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Todo" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT,
    "title" TEXT NOT NULL,
    "status" "TodoStatus" NOT NULL DEFAULT 'open',
    "dueAt" TIMESTAMP(3),
    "source" "DomainSource" NOT NULL DEFAULT 'user',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Todo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SponsorOffer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT,
    "todoId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT,
    "sponsorName" TEXT NOT NULL,
    "placement" TEXT NOT NULL,
    "status" "SponsorOfferStatus" NOT NULL DEFAULT 'proposed',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SponsorOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reminder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT,
    "todoId" TEXT,
    "triggerAt" TIMESTAMP(3) NOT NULL,
    "status" "ReminderStatus" NOT NULL DEFAULT 'scheduled',
    "channel" "ReminderChannel" NOT NULL DEFAULT 'push',
    "payload" JSONB NOT NULL DEFAULT '{}',
    "source" "DomainSource" NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reminder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CoupleLink_inviteCode_key" ON "CoupleLink"("inviteCode");

-- CreateIndex
CREATE INDEX "CoupleLink_userAId_status_idx" ON "CoupleLink"("userAId", "status");

-- CreateIndex
CREATE INDEX "CoupleLink_userBId_status_idx" ON "CoupleLink"("userBId", "status");

-- CreateIndex
CREATE INDEX "CoupleLink_createdById_idx" ON "CoupleLink"("createdById");

-- CreateIndex
CREATE INDEX "OnboardingAnswer_userId_updatedAt_idx" ON "OnboardingAnswer"("userId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingAnswer_userId_questionKey_key" ON "OnboardingAnswer"("userId", "questionKey");

-- CreateIndex
CREATE INDEX "UserEvent_userId_eventAt_idx" ON "UserEvent"("userId", "eventAt");

-- CreateIndex
CREATE INDEX "UserEvent_userId_deletedAt_idx" ON "UserEvent"("userId", "deletedAt");

-- CreateIndex
CREATE INDEX "Todo_userId_status_idx" ON "Todo"("userId", "status");

-- CreateIndex
CREATE INDEX "Todo_userId_dueAt_idx" ON "Todo"("userId", "dueAt");

-- CreateIndex
CREATE INDEX "Todo_eventId_idx" ON "Todo"("eventId");

-- CreateIndex
CREATE INDEX "Todo_userId_deletedAt_idx" ON "Todo"("userId", "deletedAt");

-- CreateIndex
CREATE INDEX "SponsorOffer_userId_status_idx" ON "SponsorOffer"("userId", "status");

-- CreateIndex
CREATE INDEX "SponsorOffer_eventId_idx" ON "SponsorOffer"("eventId");

-- CreateIndex
CREATE INDEX "SponsorOffer_todoId_idx" ON "SponsorOffer"("todoId");

-- CreateIndex
CREATE INDEX "Reminder_userId_triggerAt_idx" ON "Reminder"("userId", "triggerAt");

-- CreateIndex
CREATE INDEX "Reminder_userId_status_idx" ON "Reminder"("userId", "status");

-- CreateIndex
CREATE INDEX "Reminder_eventId_idx" ON "Reminder"("eventId");

-- CreateIndex
CREATE INDEX "Reminder_todoId_idx" ON "Reminder"("todoId");

-- AddForeignKey
ALTER TABLE "CoupleLink" ADD CONSTRAINT "CoupleLink_userAId_fkey" FOREIGN KEY ("userAId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoupleLink" ADD CONSTRAINT "CoupleLink_userBId_fkey" FOREIGN KEY ("userBId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoupleLink" ADD CONSTRAINT "CoupleLink_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingAnswer" ADD CONSTRAINT "OnboardingAnswer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserEvent" ADD CONSTRAINT "UserEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Todo" ADD CONSTRAINT "Todo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Todo" ADD CONSTRAINT "Todo_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "UserEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SponsorOffer" ADD CONSTRAINT "SponsorOffer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SponsorOffer" ADD CONSTRAINT "SponsorOffer_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "UserEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SponsorOffer" ADD CONSTRAINT "SponsorOffer_todoId_fkey" FOREIGN KEY ("todoId") REFERENCES "Todo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "UserEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_todoId_fkey" FOREIGN KEY ("todoId") REFERENCES "Todo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
