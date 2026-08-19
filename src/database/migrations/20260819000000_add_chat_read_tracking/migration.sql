-- AddChatReadTracking
-- Separate read-tracking schema for group chats (one row per user per chat),
-- mirroring the MongoDB ReadTracking pattern. Read state is derived from
-- last_read_at + incrementally maintained unread_count instead of per-message
-- status flags.

-- CreateTable
CREATE TABLE "chat_read_trackings" (
    "id" TEXT NOT NULL,
    "chat_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "last_read_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unread_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "chat_read_trackings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "chat_read_trackings_chat_id_user_id_key" ON "chat_read_trackings"("chat_id", "user_id");

-- CreateIndex
CREATE INDEX "chat_read_trackings_user_id_last_read_at_idx" ON "chat_read_trackings"("user_id", "last_read_at");

-- CreateIndex
CREATE INDEX "chat_read_trackings_chat_id_last_read_at_idx" ON "chat_read_trackings"("chat_id", "last_read_at");

-- AddForeignKey
ALTER TABLE "chat_read_trackings" ADD CONSTRAINT "chat_read_trackings_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_read_trackings" ADD CONSTRAINT "chat_read_trackings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DropColumn (moved into chat_read_trackings)
ALTER TABLE "chat_participants" DROP COLUMN "last_read";

-- DropColumn (read state is now derived from chat_read_trackings)
ALTER TABLE "messages" DROP COLUMN "status";

-- DropTable
DROP TABLE "message_read_receipts";

-- DropType
DROP TYPE "MessageStatus";