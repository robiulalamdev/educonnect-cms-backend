-- AddChatParticipantIsAdmin
-- Group chats (BATCH_GROUP) need an admin marker so the UI can show
-- "who is the admin" (e.g. the batch's teacher) and members can be
-- labelled accordingly. Defaults to false — existing participants are
-- retroactively normal members.

-- AlterTable
ALTER TABLE "chat_participants" ADD COLUMN "is_admin" BOOLEAN NOT NULL DEFAULT false;

-- Backfill: the teacher who owns the batch's service becomes the group admin
UPDATE "chat_participants" cp
SET "is_admin" = true
FROM "chats" c
JOIN "batches" b ON b.id = c.batch_id
JOIN "services" s ON s.id = b.service_id
WHERE c.id = cp.chat_id
  AND cp.user_id = s.teacher_id;