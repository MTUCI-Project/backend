-- Remove AI entities that are not part of the Python mock contract.
DROP TABLE "UserAIContext";
DROP TABLE "ChatMessage";
DROP TABLE "ChatSession";
DROP TYPE "MessageRole";
DROP TYPE "ChatStatus";

DROP TABLE "SponsorSuggestion";
DROP TYPE "SponsorSuggestionStatus";

-- Persist the state exposed by mock_backend.py.
CREATE TABLE "AiServiceState" (
    "userId" TEXT NOT NULL,
    "profile" JSONB NOT NULL DEFAULT '{}',
    "facts" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "AiServiceState_pkey" PRIMARY KEY ("userId")
);

CREATE TABLE "AiServiceEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "date" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'planned',

    CONSTRAINT "AiServiceEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AiServiceTodo" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "due" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "AiServiceTodo_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AiServiceReminder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "text" TEXT,
    "remindAt" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AiServiceReminder_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AiServiceSponsorSuggestion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiServiceSponsorSuggestion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AiServiceChatMessage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "sentiment" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiServiceChatMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AiServiceEvent_userId_idx" ON "AiServiceEvent"("userId");
CREATE INDEX "AiServiceTodo_userId_idx" ON "AiServiceTodo"("userId");
CREATE INDEX "AiServiceReminder_userId_idx" ON "AiServiceReminder"("userId");
CREATE INDEX "AiServiceSponsorSuggestion_userId_createdAt_idx" ON "AiServiceSponsorSuggestion"("userId", "createdAt");
CREATE INDEX "AiServiceChatMessage_userId_timestamp_idx" ON "AiServiceChatMessage"("userId", "timestamp");

ALTER TABLE "AiServiceState" ADD CONSTRAINT "AiServiceState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AiServiceEvent" ADD CONSTRAINT "AiServiceEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AiServiceTodo" ADD CONSTRAINT "AiServiceTodo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AiServiceReminder" ADD CONSTRAINT "AiServiceReminder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AiServiceSponsorSuggestion" ADD CONSTRAINT "AiServiceSponsorSuggestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AiServiceChatMessage" ADD CONSTRAINT "AiServiceChatMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
