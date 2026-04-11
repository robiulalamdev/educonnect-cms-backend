/*
  Warnings:

  - You are about to drop the column `avatar_url` on the `admins` table. All the data in the column will be lost.
  - You are about to drop the column `avatar_url` on the `chats` table. All the data in the column will be lost.
  - You are about to drop the column `uploaded_by` on the `media` table. All the data in the column will be lost.
  - You are about to drop the column `media_type` on the `messages` table. All the data in the column will be lost.
  - You are about to drop the column `media_url` on the `messages` table. All the data in the column will be lost.
  - You are about to drop the column `screenshot_url` on the `payment_records` table. All the data in the column will be lost.
  - You are about to drop the column `avatar_url` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `post_media` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[avatar_id]` on the table `admins` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[avatar_id]` on the table `chats` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[screenshot_id]` on the table `payment_records` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[avatar_id]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `filename` to the `media` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "MediaOwnerType" ADD VALUE 'POST';
ALTER TYPE "MediaOwnerType" ADD VALUE 'MESSAGE';
ALTER TYPE "MediaOwnerType" ADD VALUE 'PAYMENT_RECORD';

-- DropForeignKey
ALTER TABLE "post_media" DROP CONSTRAINT "post_media_post_id_fkey";

-- AlterTable
ALTER TABLE "admins" DROP COLUMN "avatar_url",
ADD COLUMN     "avatar_id" TEXT;

-- AlterTable
ALTER TABLE "chats" DROP COLUMN "avatar_url",
ADD COLUMN     "avatar_id" TEXT;

-- AlterTable
ALTER TABLE "media" DROP COLUMN "uploaded_by",
ADD COLUMN     "duration" INTEGER,
ADD COLUMN     "filename" TEXT NOT NULL,
ADD COLUMN     "message_id" TEXT,
ADD COLUMN     "post_id" TEXT,
ADD COLUMN     "sort_order" INTEGER,
ADD COLUMN     "uploaded_by_id" TEXT,
ADD COLUMN     "uploaded_by_type" TEXT,
ALTER COLUMN "owner_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "messages" DROP COLUMN "media_type",
DROP COLUMN "media_url";

-- AlterTable
ALTER TABLE "payment_records" DROP COLUMN "screenshot_url",
ADD COLUMN     "screenshot_id" TEXT;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "avatar_url",
ADD COLUMN     "avatar_id" TEXT;

-- DropTable
DROP TABLE "post_media";

-- CreateIndex
CREATE UNIQUE INDEX "admins_avatar_id_key" ON "admins"("avatar_id");

-- CreateIndex
CREATE UNIQUE INDEX "chats_avatar_id_key" ON "chats"("avatar_id");

-- CreateIndex
CREATE INDEX "media_post_id_idx" ON "media"("post_id");

-- CreateIndex
CREATE INDEX "media_message_id_idx" ON "media"("message_id");

-- CreateIndex
CREATE INDEX "media_key_idx" ON "media"("key");

-- CreateIndex
CREATE INDEX "media_created_at_idx" ON "media"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "payment_records_screenshot_id_key" ON "payment_records"("screenshot_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_avatar_id_key" ON "users"("avatar_id");

-- AddForeignKey
ALTER TABLE "admins" ADD CONSTRAINT "admins_avatar_id_fkey" FOREIGN KEY ("avatar_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chats" ADD CONSTRAINT "chats_avatar_id_fkey" FOREIGN KEY ("avatar_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_records" ADD CONSTRAINT "payment_records_screenshot_id_fkey" FOREIGN KEY ("screenshot_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_avatar_id_fkey" FOREIGN KEY ("avatar_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;
