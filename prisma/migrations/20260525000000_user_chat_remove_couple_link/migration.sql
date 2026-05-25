-- Couple links are not part of the mobile application contract.
DROP TABLE IF EXISTS "CoupleLink";
DROP TYPE IF EXISTS "CoupleLinkStatus";

CREATE TYPE "ChatSender" AS ENUM ('user', 'assistant');
CREATE TYPE "ChatDeliveryStatus" AS ENUM ('pending', 'sent', 'failed');

CREATE TABLE "UserChatMessage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sender" "ChatSender" NOT NULL,
    "message" TEXT NOT NULL,
    "deliveryStatus" "ChatDeliveryStatus" NOT NULL DEFAULT 'sent',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserChatMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "UserChatMessage_userId_timestamp_idx" ON "UserChatMessage"("userId", "timestamp");

ALTER TABLE "UserChatMessage" ADD CONSTRAINT "UserChatMessage_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
