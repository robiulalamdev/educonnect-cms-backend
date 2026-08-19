-- AddMessageMentionsAndLastSeen
-- 1. @mention support: one row per mentioned user per message so the UI can
--    highlight tags and users can be notified.
-- 2. users.last_seen_at persists the last time a user was online across
--    socket disconnects / server restarts.

-- AlterTable
ALTER TABLE "users" ADD COLUMN "last_seen_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "message_mentions" (
    "id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "mentioned_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_mentions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "message_mentions_message_id_mentioned_user_id_key" ON "message_mentions"("message_id", "mentioned_user_id");

-- CreateIndex
CREATE INDEX "message_mentions_mentioned_user_id_idx" ON "message_mentions"("mentioned_user_id");

-- AddForeignKey
ALTER TABLE "message_mentions" ADD CONSTRAINT "message_mentions_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_mentions" ADD CONSTRAINT "message_mentions_mentioned_user_id_fkey" FOREIGN KEY ("mentioned_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;